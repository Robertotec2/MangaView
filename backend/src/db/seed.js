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
const db = require('../patterns/DatabaseSingleton');
const { asegurarBaseDeDatos } = require('./crear-base');
const { MANGAS, rutaPortada, rutaPagina } = require('./datos-demo');

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

async function seed() {
  // Sobre una instalación limpia de PostgreSQL la base todavía no existe, y el
  // pool no podría ni abrir la conexión.
  await asegurarBaseDeDatos();

  const cliente = await db.pool.connect();
  const total = { mangas: 0, capitulos: 0, paginas: 0 };

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

    await cliente.query('COMMIT');
    console.log(
      `Aprovisionamiento completo: ${total.mangas} mangas, ` +
      `${total.capitulos} capitulos y ${total.paginas} paginas.`
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
