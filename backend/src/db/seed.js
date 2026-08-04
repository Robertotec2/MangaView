/**
 * Aprovisionamiento de la base de datos de MangaView.
 *
 * Sustituye a los once scripts setup.js … setup11.js, que se sobrescribían
 * entre sí y cuyo resultado dependía del orden en que se hubieran ejecutado.
 * Este script es idempotente: ejecutarlo una vez o diez veces deja siempre la
 * base de datos en el mismo estado, y todo el trabajo ocurre dentro de una
 * transacción, de modo que un fallo no deja datos a medio cargar.
 *
 *   npm run db:setup
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('../patterns/DatabaseSingleton');
const { asegurarBaseDeDatos } = require('./crear-base');
const { MANGAS, rutaPortada, rutaPagina } = require('./datos-demo');
const {
  TEMAS,
  USUARIOS_DEMO,
  PUBLICACIONES,
  PASSWORD_DEMO,
  LISTAS_DEMO,
  SEGUIDOS_DEMO,
  MARCADORES_DEMO
} = require('./datos-foro');
// Se reutiliza la constante del servicio en lugar de volver a leer la variable
// de entorno, para que el coste de bcrypt no pueda divergir entre el registro
// real y las cuentas de demostración.
const { RONDAS_BCRYPT } = require('../services/usuario.service');

const RUTA_ESQUEMA = path.join(__dirname, 'schema.sql');

async function aplicarEsquema(cliente) {
  const ddl = fs.readFileSync(RUTA_ESQUEMA, 'utf8');
  try {
    await cliente.query(ddl);
  } catch (err) {
    if (err.code === '23505') {
      throw new Error(
        'No se pudieron crear las claves únicas porque la base de datos ya ' +
        'contiene registros duplicados, probablemente por haber ejecutado los ' +
        'scripts antiguos más de una vez. Ejecuta "npm run db:reset" para ' +
        'reconstruirla desde cero.'
      );
    }
    throw err;
  }
}

async function insertarManga(cliente, manga) {
  const { rows } = await cliente.query(
    `INSERT INTO mangas (titulo, autor, genero, sinopsis, portada_url, estado)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (titulo) DO UPDATE
       SET autor = EXCLUDED.autor,
           genero = EXCLUDED.genero,
           sinopsis = EXCLUDED.sinopsis,
           portada_url = EXCLUDED.portada_url,
           estado = EXCLUDED.estado
     RETURNING id`,
    [manga.titulo, manga.autor, manga.genero, manga.sinopsis, rutaPortada(manga.titulo), manga.estado]
  );
  return rows[0].id;
}

async function insertarCapitulo(cliente, mangaId, capitulo) {
  const { rows } = await cliente.query(
    `INSERT INTO capitulos (manga_id, numero, titulo, fecha_publicacion)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (manga_id, numero) DO UPDATE
       SET titulo = EXCLUDED.titulo,
           fecha_publicacion = EXCLUDED.fecha_publicacion
     RETURNING id`,
    [mangaId, capitulo.numero, capitulo.titulo, capitulo.fecha]
  );
  return rows[0].id;
}

async function insertarPagina(cliente, capituloId, orden, imagenUrl) {
  await cliente.query(
    `INSERT INTO paginas (capitulo_id, orden, imagen_url)
     VALUES ($1, $2, $3)
     ON CONFLICT (capitulo_id, orden) DO UPDATE
       SET imagen_url = EXCLUDED.imagen_url`,
    [capituloId, orden, imagenUrl]
  );
}

async function insertarTema(cliente, tema) {
  const { rows } = await cliente.query(
    `INSERT INTO foro_temas (slug, nombre, descripcion, icono, orden)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (slug) DO UPDATE
       SET nombre = EXCLUDED.nombre,
           descripcion = EXCLUDED.descripcion,
           icono = EXCLUDED.icono,
           orden = EXCLUDED.orden
     RETURNING id`,
    [tema.slug, tema.nombre, tema.descripcion, tema.icono, tema.orden]
  );
  return rows[0].id;
}

async function insertarUsuarioDemo(cliente, usuario, passwordHash) {
  const { rows } = await cliente.query(
    `INSERT INTO usuarios (nombre, correo, password_hash)
     VALUES ($1, $2, $3)
     ON CONFLICT (correo) DO UPDATE SET nombre = EXCLUDED.nombre
     RETURNING id`,
    [usuario.nombre, usuario.correo, passwordHash]
  );
  return rows[0].id;
}

async function insertarPublicacion(cliente, temaId, autorId, publicacion, mangaId = null) {
  const { rows } = await cliente.query(
    `INSERT INTO foro_publicaciones (tema_id, usuario_id, titulo, cuerpo, manga_id)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (tema_id, titulo) DO UPDATE
       SET cuerpo = EXCLUDED.cuerpo,
           usuario_id = EXCLUDED.usuario_id,
           manga_id = EXCLUDED.manga_id
     RETURNING id`,
    [temaId, autorId, publicacion.titulo, publicacion.cuerpo, mangaId]
  );
  return rows[0].id;
}

/**
 * Los comentarios no tienen clave natural: dos personas pueden escribir lo
 * mismo y ambas son válidas. En lugar de inventarle una restricción artificial
 * a la tabla, el seed solo carga la conversación de ejemplo cuando la
 * publicación todavía no tiene ningún comentario. Así sigue siendo idempotente
 * y además no pisa lo que se haya escrito de verdad durante una demo.
 *
 * `respuestaA` es el índice del comentario padre dentro del mismo arreglo.
 */
async function insertarComentarios(cliente, publicacionId, comentarios, idsUsuarios) {
  const { rows } = await cliente.query(
    'SELECT COUNT(*)::int AS total FROM foro_comentarios WHERE publicacion_id = $1',
    [publicacionId]
  );
  if (rows[0].total > 0) return 0;

  const idsInsertados = [];
  for (const comentario of comentarios) {
    let padreId = null;
    if (Number.isInteger(comentario.respuestaA)) {
      padreId = idsInsertados[comentario.respuestaA] || null;
    }
    const { rows: creados } = await cliente.query(
      `INSERT INTO foro_comentarios (publicacion_id, usuario_id, cuerpo, padre_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [publicacionId, idsUsuarios[comentario.autor], comentario.cuerpo, padreId]
    );
    idsInsertados.push(creados[0].id);
  }
  return comentarios.length;
}

async function insertarReacciones(cliente, publicacionId, reacciones, idsUsuarios) {
  const votos = [
    ...(reacciones.like || []).map((indice) => [indice, 1]),
    ...(reacciones.dislike || []).map((indice) => [indice, -1])
  ];

  for (const [indice, valor] of votos) {
    await cliente.query(
      `INSERT INTO foro_reacciones (publicacion_id, usuario_id, valor)
       VALUES ($1, $2, $3)
       ON CONFLICT (publicacion_id, usuario_id) DO UPDATE SET valor = EXCLUDED.valor`,
      [publicacionId, idsUsuarios[indice], valor]
    );
  }
  return votos.length;
}

/**
 * Visitantes simulados, para que el contador de personas que vieron la
 * publicación tenga algo que mostrar en la demo. Las huellas son sintéticas y
 * reconocibles, así que no se confunden con las de visitantes reales.
 */
async function insertarVistas(cliente, publicacionId, cuantas) {
  for (let i = 1; i <= cuantas; i++) {
    await cliente.query(
      `INSERT INTO foro_vistas (publicacion_id, huella)
       VALUES ($1, $2)
       ON CONFLICT (publicacion_id, huella) DO NOTHING`,
      [publicacionId, `demo:${publicacionId}:${i}`]
    );
  }
  return cuantas;
}

async function mapaMangasPorTitulo(cliente) {
  const { rows } = await cliente.query('SELECT id, titulo FROM mangas');
  return Object.fromEntries(rows.map((r) => [r.titulo, r.id]));
}

async function sembrarBiblioteca(cliente, idsUsuarios, idsMangas, total) {
  for (const fila of LISTAS_DEMO) {
    const mangaId = idsMangas[fila.manga];
    if (!mangaId) continue;
    await cliente.query(
      `INSERT INTO listas_lectura (usuario_id, manga_id, estado)
       VALUES ($1, $2, $3)
       ON CONFLICT (usuario_id, manga_id) DO UPDATE SET estado = EXCLUDED.estado`,
      [idsUsuarios[fila.usuario], mangaId, fila.estado]
    );
    total.listas++;
  }

  for (const fila of SEGUIDOS_DEMO) {
    const mangaId = idsMangas[fila.manga];
    if (!mangaId) continue;
    // Fecha anterior a los capítulos del catálogo (años 90–2000), para que en
    // la demo cuenten como avisos "publicados desde que empezaste a seguir".
    await cliente.query(
      `INSERT INTO mangas_seguidos (usuario_id, manga_id, fecha)
       VALUES ($1, $2, '1990-01-01')
       ON CONFLICT (usuario_id, manga_id) DO UPDATE SET fecha = EXCLUDED.fecha`,
      [idsUsuarios[fila.usuario], mangaId]
    );
    total.seguidos++;
  }

  for (const fila of MARCADORES_DEMO) {
    const mangaId = idsMangas[fila.manga];
    if (!mangaId) continue;
    const { rows } = await cliente.query(
      'SELECT id FROM capitulos WHERE manga_id = $1 AND numero = $2',
      [mangaId, fila.capitulo]
    );
    if (!rows[0]) continue;
    await cliente.query(
      `INSERT INTO marcadores (usuario_id, capitulo_id, pagina, nota)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (usuario_id, capitulo_id, pagina) DO UPDATE SET nota = EXCLUDED.nota`,
      [idsUsuarios[fila.usuario], rows[0].id, fila.pagina, fila.nota]
    );
    total.marcadores++;
  }
}

async function sembrarForo(cliente, total, idsMangas) {
  const idsTemas = {};
  for (const tema of TEMAS) {
    idsTemas[tema.slug] = await insertarTema(cliente, tema);
    total.temas++;
  }

  // Todas las cuentas de demostración comparten contraseña, así que basta
  // calcular el hash una vez. bcrypt es deliberadamente lento y hacerlo por
  // usuario multiplicaría el tiempo del seed sin ninguna ganancia.
  const passwordHash = await bcrypt.hash(PASSWORD_DEMO, RONDAS_BCRYPT);

  const idsUsuarios = [];
  for (const usuario of USUARIOS_DEMO) {
    idsUsuarios.push(await insertarUsuarioDemo(cliente, usuario, passwordHash));
  }

  for (const publicacion of PUBLICACIONES) {
    const mangaId = publicacion.manga ? idsMangas[publicacion.manga] || null : null;
    const publicacionId = await insertarPublicacion(
      cliente,
      idsTemas[publicacion.tema],
      idsUsuarios[publicacion.autor],
      publicacion,
      mangaId
    );
    total.publicaciones++;
    total.comentarios += await insertarComentarios(
      cliente, publicacionId, publicacion.comentarios || [], idsUsuarios
    );
    await insertarReacciones(cliente, publicacionId, publicacion.reacciones || {}, idsUsuarios);
    await insertarVistas(cliente, publicacionId, publicacion.vistas || 0);
  }

  await sembrarBiblioteca(cliente, idsUsuarios, idsMangas, total);
}

async function seed() {
  // Sobre una instalación limpia de PostgreSQL la base todavía no existe, y el
  // pool no podría ni abrir la conexión.
  await asegurarBaseDeDatos();

  const cliente = await db.pool.connect();
  const total = {
    mangas: 0, capitulos: 0, paginas: 0, temas: 0, publicaciones: 0,
    comentarios: 0, listas: 0, seguidos: 0, marcadores: 0
  };

  try {
    await cliente.query('BEGIN');
    await aplicarEsquema(cliente);

    for (const manga of MANGAS) {
      const mangaId = await insertarManga(cliente, manga);
      total.mangas++;

      for (const capitulo of manga.capitulos) {
        const capituloId = await insertarCapitulo(cliente, mangaId, capitulo);
        total.capitulos++;

        for (let orden = 1; orden <= capitulo.paginas; orden++) {
          await insertarPagina(
            cliente,
            capituloId,
            orden,
            rutaPagina(manga.titulo, capitulo.numero, orden, capitulo.paginas)
          );
          total.paginas++;
        }
      }
    }

    const idsMangas = await mapaMangasPorTitulo(cliente);
    await sembrarForo(cliente, total, idsMangas);

    await cliente.query('COMMIT');
    console.log(
      `Aprovisionamiento completo: ${total.mangas} mangas, ` +
      `${total.capitulos} capitulos y ${total.paginas} paginas.`
    );
    console.log(
      `Foro: ${total.temas} temas, ${total.publicaciones} publicaciones ` +
      `y ${total.comentarios} comentarios nuevos.`
    );
    console.log(
      `Biblioteca: ${total.listas} en listas, ${total.seguidos} follows ` +
      `y ${total.marcadores} marcadores.`
    );
  } catch (err) {
    await cliente.query('ROLLBACK');
    throw err;
  } finally {
    cliente.release();
  }
}

// Solo se ejecuta al invocarlo directamente, para que reset.js pueda reutilizarlo.
if (require.main === module) {
  seed()
    .then(() => db.pool.end())
    .catch(err => {
      console.error('Fallo el aprovisionamiento:', err.message);
      db.pool.end();
      process.exit(1);
    });
}

module.exports = { seed };
