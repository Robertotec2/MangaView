/**
 * Acceso a datos del foro.
 *
 * Único lugar del módulo con SQL, igual que en el módulo de usuarios. Los
 * controladores de manga y capítulo todavía escriben sus consultas a mano; el
 * foro nace ya con la separación que el ADR-07 dejó como objetivo.
 */

const db = require('../patterns/DatabaseSingleton');

const CODIGO_VIOLACION_UNICIDAD = '23505';

/**
 * Columnas calculadas que acompañan a toda publicación. Se escriben una sola
 * vez para que el listado y el detalle no puedan divergir en la forma en que
 * cuentan lo mismo.
 *
 * Se usan subconsultas en lugar de JOIN con GROUP BY porque tres agregados
 * sobre tablas distintas en el mismo JOIN multiplican las filas entre sí y
 * devuelven totales inflados.
 */
const COLUMNAS_CONTEO = `
  COALESCE(u.nombre, 'Cuenta eliminada') AS autor,
  t.slug AS tema_slug,
  t.nombre AS tema_nombre,
  t.icono AS tema_icono,
  (SELECT COUNT(*)::int FROM foro_comentarios c WHERE c.publicacion_id = p.id) AS comentarios,
  (SELECT COUNT(*)::int FROM foro_vistas v WHERE v.publicacion_id = p.id) AS vistas,
  (SELECT COUNT(*)::int FROM foro_reacciones r WHERE r.publicacion_id = p.id AND r.valor = 1) AS likes,
  (SELECT COUNT(*)::int FROM foro_reacciones r WHERE r.publicacion_id = p.id AND r.valor = -1) AS dislikes`;

const listarTemas = async () => {
  const { rows } = await db.query(
    `SELECT t.id, t.slug, t.nombre, t.descripcion, t.icono,
            (SELECT COUNT(*)::int FROM foro_publicaciones p WHERE p.tema_id = t.id) AS publicaciones
     FROM foro_temas t
     ORDER BY t.orden, t.id`
  );
  return rows;
};

const buscarTemaPorSlug = async (slug) => {
  const { rows } = await db.query('SELECT * FROM foro_temas WHERE slug = $1', [slug]);
  return rows[0] || null;
};

/**
 * Listado con filtro por tema, búsqueda de texto y orden.
 *
 * Los filtros se arman como condiciones opcionales pero los valores siempre
 * viajan como parámetros: el texto que escribe la persona en el buscador nunca
 * se concatena dentro del SQL.
 */
const listarPublicaciones = async ({ temaSlug, busqueda, orden = 'recientes' } = {}) => {
  const condiciones = [];
  const valores = [];

  if (temaSlug) {
    valores.push(temaSlug);
    condiciones.push(`t.slug = $${valores.length}`);
  }

  if (busqueda) {
    valores.push(`%${busqueda}%`);
    condiciones.push(`(p.titulo ILIKE $${valores.length} OR p.cuerpo ILIKE $${valores.length})`);
  }

  const donde = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  const ordenamiento = orden === 'populares'
    ? `(SELECT COUNT(*) FROM foro_reacciones r WHERE r.publicacion_id = p.id AND r.valor = 1) DESC, p.fecha DESC`
    : 'p.fecha DESC';

  const { rows } = await db.query(
    `SELECT p.id, p.titulo, p.cuerpo, p.fecha, ${COLUMNAS_CONTEO}
     FROM foro_publicaciones p
     JOIN foro_temas t ON t.id = p.tema_id
     LEFT JOIN usuarios u ON u.id = p.usuario_id
     ${donde}
     ORDER BY ${ordenamiento}`,
    valores
  );
  return rows;
};

const buscarPublicacionPorId = async (id) => {
  const { rows } = await db.query(
    `SELECT p.id, p.titulo, p.cuerpo, p.fecha, p.usuario_id, ${COLUMNAS_CONTEO}
     FROM foro_publicaciones p
     JOIN foro_temas t ON t.id = p.tema_id
     LEFT JOIN usuarios u ON u.id = p.usuario_id
     WHERE p.id = $1`,
    [id]
  );
  return rows[0] || null;
};

const crearPublicacion = async ({ temaId, usuarioId, titulo, cuerpo }) => {
  const { rows } = await db.query(
    `INSERT INTO foro_publicaciones (tema_id, usuario_id, titulo, cuerpo)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [temaId, usuarioId, titulo, cuerpo]
  );
  return rows[0];
};

const listarComentarios = async (publicacionId) => {
  const { rows } = await db.query(
    `SELECT c.id, c.cuerpo, c.fecha,
            COALESCE(u.nombre, 'Cuenta eliminada') AS autor
     FROM foro_comentarios c
     LEFT JOIN usuarios u ON u.id = c.usuario_id
     WHERE c.publicacion_id = $1
     ORDER BY c.fecha`,
    [publicacionId]
  );
  return rows;
};

const crearComentario = async ({ publicacionId, usuarioId, cuerpo }) => {
  const { rows } = await db.query(
    `INSERT INTO foro_comentarios (publicacion_id, usuario_id, cuerpo)
     VALUES ($1, $2, $3)
     RETURNING id, cuerpo, fecha`,
    [publicacionId, usuarioId, cuerpo]
  );
  return rows[0];
};

/**
 * Registra o cambia la reacción de una persona.
 *
 * Volver a pulsar el mismo botón retira la reacción, que es lo que la gente
 * espera de un "me gusta". Pulsar el contrario la cambia en lugar de sumar una
 * segunda, gracias a la clave única por publicación y usuario.
 */
const registrarReaccion = async ({ publicacionId, usuarioId, valor }) => {
  const { rowCount } = await db.query(
    `DELETE FROM foro_reacciones
     WHERE publicacion_id = $1 AND usuario_id = $2 AND valor = $3`,
    [publicacionId, usuarioId, valor]
  );

  if (rowCount > 0) {
    return { reaccion: null };
  }

  await db.query(
    `INSERT INTO foro_reacciones (publicacion_id, usuario_id, valor)
     VALUES ($1, $2, $3)
     ON CONFLICT (publicacion_id, usuario_id)
     DO UPDATE SET valor = EXCLUDED.valor, fecha = NOW()`,
    [publicacionId, usuarioId, valor]
  );
  return { reaccion: valor };
};

const buscarReaccion = async (publicacionId, usuarioId) => {
  const { rows } = await db.query(
    'SELECT valor FROM foro_reacciones WHERE publicacion_id = $1 AND usuario_id = $2',
    [publicacionId, usuarioId]
  );
  return rows[0] ? rows[0].valor : null;
};

/**
 * Deja constancia de que una persona vio la publicación. Si ya la había visto,
 * la clave única hace que no pase nada, y por eso el número que se muestra son
 * personas distintas y no visitas.
 */
const registrarVista = async (publicacionId, huella) => {
  await db.query(
    `INSERT INTO foro_vistas (publicacion_id, huella)
     VALUES ($1, $2)
     ON CONFLICT (publicacion_id, huella) DO NOTHING`,
    [publicacionId, huella]
  );
};

module.exports = {
  listarTemas,
  buscarTemaPorSlug,
  listarPublicaciones,
  buscarPublicacionPorId,
  crearPublicacion,
  listarComentarios,
  crearComentario,
  registrarReaccion,
  buscarReaccion,
  registrarVista,
  CODIGO_VIOLACION_UNICIDAD
};
