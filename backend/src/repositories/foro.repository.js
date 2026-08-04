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
  p.manga_id,
  m.titulo AS manga_titulo,
  m.portada_url AS manga_portada,
  p.fecha_edicion,
  p.borrada,
  (SELECT COUNT(*)::int FROM foro_comentarios c WHERE c.publicacion_id = p.id AND c.borrado = FALSE) AS comentarios,
  (SELECT COUNT(*)::int FROM foro_vistas v WHERE v.publicacion_id = p.id) AS vistas,
  (SELECT COUNT(*)::int FROM foro_reacciones r WHERE r.publicacion_id = p.id AND r.valor = 1) AS likes,
  (SELECT COUNT(*)::int FROM foro_reacciones r WHERE r.publicacion_id = p.id AND r.valor = -1) AS dislikes`;

const listarTemas = async () => {
  const { rows } = await db.query(
    `SELECT t.id, t.slug, t.nombre, t.descripcion, t.icono,
            (SELECT COUNT(*)::int FROM foro_publicaciones p
              WHERE p.tema_id = t.id AND p.borrada = FALSE) AS publicaciones
     FROM foro_temas t
     ORDER BY t.orden, t.id`
  );
  return rows;
};

const buscarTemaPorSlug = async (slug) => {
  const { rows } = await db.query('SELECT * FROM foro_temas WHERE slug = $1', [slug]);
  return rows[0] || null;
};

const listarPublicaciones = async ({ temaSlug, busqueda, orden = 'recientes' } = {}) => {
  const condiciones = ['p.borrada = FALSE'];
  const valores = [];

  if (temaSlug) {
    valores.push(temaSlug);
    condiciones.push(`t.slug = $${valores.length}`);
  }

  if (busqueda) {
    valores.push(`%${busqueda}%`);
    condiciones.push(`(p.titulo ILIKE $${valores.length} OR p.cuerpo ILIKE $${valores.length})`);
  }

  const donde = `WHERE ${condiciones.join(' AND ')}`;
  const ordenamiento = orden === 'populares'
    ? `(SELECT COUNT(*) FROM foro_reacciones r WHERE r.publicacion_id = p.id AND r.valor = 1) DESC, p.fecha DESC`
    : 'p.fecha DESC';

  const { rows } = await db.query(
    `SELECT p.id, p.titulo, p.cuerpo, p.fecha, p.usuario_id, ${COLUMNAS_CONTEO}
     FROM foro_publicaciones p
     JOIN foro_temas t ON t.id = p.tema_id
     LEFT JOIN usuarios u ON u.id = p.usuario_id
     LEFT JOIN mangas m ON m.id = p.manga_id
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
     LEFT JOIN mangas m ON m.id = p.manga_id
     WHERE p.id = $1`,
    [id]
  );
  return rows[0] || null;
};

const crearPublicacion = async ({ temaId, usuarioId, titulo, cuerpo, mangaId = null }) => {
  const { rows } = await db.query(
    `INSERT INTO foro_publicaciones (tema_id, usuario_id, titulo, cuerpo, manga_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [temaId, usuarioId, titulo, cuerpo, mangaId]
  );
  return rows[0];
};

const actualizarPublicacion = async ({ id, usuarioId, titulo, cuerpo, mangaId }) => {
  const { rows } = await db.query(
    `UPDATE foro_publicaciones
     SET titulo = $3, cuerpo = $4, manga_id = $5, fecha_edicion = NOW()
     WHERE id = $1 AND usuario_id = $2 AND borrada = FALSE
     RETURNING id`,
    [id, usuarioId, titulo, cuerpo, mangaId]
  );
  return rows[0] || null;
};

const borrarPublicacion = async (id, usuarioId) => {
  const { rowCount } = await db.query(
    `UPDATE foro_publicaciones
     SET borrada = TRUE, fecha_edicion = NOW()
     WHERE id = $1 AND usuario_id = $2 AND borrada = FALSE`,
    [id, usuarioId]
  );
  return rowCount > 0;
};

const listarComentarios = async (publicacionId) => {
  const { rows } = await db.query(
    `SELECT c.id, c.cuerpo, c.fecha, c.fecha_edicion, c.padre_id, c.usuario_id, c.borrado,
            COALESCE(u.nombre, 'Cuenta eliminada') AS autor
     FROM foro_comentarios c
     LEFT JOIN usuarios u ON u.id = c.usuario_id
     WHERE c.publicacion_id = $1
     ORDER BY c.fecha`,
    [publicacionId]
  );
  return rows;
};

const buscarComentarioPorId = async (id) => {
  const { rows } = await db.query(
    `SELECT c.*, COALESCE(u.nombre, 'Cuenta eliminada') AS autor
     FROM foro_comentarios c
     LEFT JOIN usuarios u ON u.id = c.usuario_id
     WHERE c.id = $1`,
    [id]
  );
  return rows[0] || null;
};

const crearComentario = async ({ publicacionId, usuarioId, cuerpo, padreId = null }) => {
  const { rows } = await db.query(
    `INSERT INTO foro_comentarios (publicacion_id, usuario_id, cuerpo, padre_id)
     VALUES ($1, $2, $3, $4)
     RETURNING id, cuerpo, fecha, padre_id`,
    [publicacionId, usuarioId, cuerpo, padreId]
  );
  return rows[0];
};

const actualizarComentario = async ({ id, usuarioId, cuerpo }) => {
  const { rows } = await db.query(
    `UPDATE foro_comentarios
     SET cuerpo = $3, fecha_edicion = NOW()
     WHERE id = $1 AND usuario_id = $2 AND borrado = FALSE
     RETURNING id, cuerpo, fecha, fecha_edicion, padre_id`,
    [id, usuarioId, cuerpo]
  );
  return rows[0] || null;
};

const borrarComentario = async (id, usuarioId) => {
  const { rowCount } = await db.query(
    `UPDATE foro_comentarios
     SET borrado = TRUE, fecha_edicion = NOW(),
         cuerpo = 'Este comentario fue eliminado'
     WHERE id = $1 AND usuario_id = $2 AND borrado = FALSE`,
    [id, usuarioId]
  );
  return rowCount > 0;
};

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

const registrarVista = async (publicacionId, huella) => {
  await db.query(
    `INSERT INTO foro_vistas (publicacion_id, huella)
     VALUES ($1, $2)
     ON CONFLICT (publicacion_id, huella) DO NOTHING`,
    [publicacionId, huella]
  );
};

const crearReporte = async ({ usuarioId, publicacionId = null, comentarioId = null, motivo }) => {
  const { rows } = await db.query(
    `INSERT INTO foro_reportes (usuario_id, publicacion_id, comentario_id, motivo)
     VALUES ($1, $2, $3, $4)
     RETURNING id, fecha`,
    [usuarioId, publicacionId, comentarioId, motivo]
  );
  return rows[0];
};

const mangaExiste = async (mangaId) => {
  const { rowCount } = await db.query('SELECT 1 FROM mangas WHERE id = $1', [mangaId]);
  return rowCount > 0;
};

module.exports = {
  listarTemas,
  buscarTemaPorSlug,
  listarPublicaciones,
  buscarPublicacionPorId,
  crearPublicacion,
  actualizarPublicacion,
  borrarPublicacion,
  listarComentarios,
  buscarComentarioPorId,
  crearComentario,
  actualizarComentario,
  borrarComentario,
  registrarReaccion,
  buscarReaccion,
  registrarVista,
  crearReporte,
  mangaExiste,
  CODIGO_VIOLACION_UNICIDAD
};
