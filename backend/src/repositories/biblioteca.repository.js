/**
 * Acceso a datos de listas de lectura, follows, avisos y marcadores.
 */

const db = require('../patterns/DatabaseSingleton');

const ESTADOS_LISTA = ['pendiente', 'leyendo', 'terminado'];

const listarPorEstado = async (usuarioId, estado) => {
  const { rows } = await db.query(
    `SELECT m.*, l.estado, l.fecha AS fecha_lista
     FROM listas_lectura l
     JOIN mangas m ON m.id = l.manga_id
     WHERE l.usuario_id = $1 AND l.estado = $2
     ORDER BY l.fecha DESC`,
    [usuarioId, estado]
  );
  return rows;
};

const listarTodas = async (usuarioId) => {
  const { rows } = await db.query(
    `SELECT m.*, l.estado, l.fecha AS fecha_lista
     FROM listas_lectura l
     JOIN mangas m ON m.id = l.manga_id
     WHERE l.usuario_id = $1
     ORDER BY l.estado, l.fecha DESC`,
    [usuarioId]
  );
  return rows;
};

const buscarEntradaLista = async (usuarioId, mangaId) => {
  const { rows } = await db.query(
    'SELECT * FROM listas_lectura WHERE usuario_id = $1 AND manga_id = $2',
    [usuarioId, mangaId]
  );
  return rows[0] || null;
};

const guardarEnLista = async (usuarioId, mangaId, estado) => {
  const { rows } = await db.query(
    `INSERT INTO listas_lectura (usuario_id, manga_id, estado)
     VALUES ($1, $2, $3)
     ON CONFLICT (usuario_id, manga_id) DO UPDATE
       SET estado = EXCLUDED.estado, fecha = NOW()
     RETURNING *`,
    [usuarioId, mangaId, estado]
  );
  return rows[0];
};

const quitarDeLista = async (usuarioId, mangaId) => {
  const { rowCount } = await db.query(
    'DELETE FROM listas_lectura WHERE usuario_id = $1 AND manga_id = $2',
    [usuarioId, mangaId]
  );
  return rowCount > 0;
};

const mangaExiste = async (mangaId) => {
  const { rowCount } = await db.query('SELECT 1 FROM mangas WHERE id = $1', [mangaId]);
  return rowCount > 0;
};

const seguirManga = async (usuarioId, mangaId) => {
  await db.query(
    `INSERT INTO mangas_seguidos (usuario_id, manga_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [usuarioId, mangaId]
  );
};

const dejarDeSeguir = async (usuarioId, mangaId) => {
  const { rowCount } = await db.query(
    'DELETE FROM mangas_seguidos WHERE usuario_id = $1 AND manga_id = $2',
    [usuarioId, mangaId]
  );
  return rowCount > 0;
};

const listarSeguidos = async (usuarioId) => {
  const { rows } = await db.query(
    `SELECT m.*, s.fecha AS seguido_desde
     FROM mangas_seguidos s
     JOIN mangas m ON m.id = s.manga_id
     WHERE s.usuario_id = $1
     ORDER BY s.fecha DESC`,
    [usuarioId]
  );
  return rows;
};

const estaSiguiendo = async (usuarioId, mangaId) => {
  const { rowCount } = await db.query(
    'SELECT 1 FROM mangas_seguidos WHERE usuario_id = $1 AND manga_id = $2',
    [usuarioId, mangaId]
  );
  return rowCount > 0;
};

/**
 * Capítulos de mangas seguidos publicados desde que la persona empezó a
 * seguirlos. Es el aviso "hay capítulo nuevo" sin necesidad de un sistema de
 * notificaciones push: se calcula al pedir la lista.
 */
const listarAvisos = async (usuarioId) => {
  const { rows } = await db.query(
    `SELECT c.id AS capitulo_id, c.numero, c.titulo AS capitulo_titulo,
            c.fecha_publicacion, m.id AS manga_id, m.titulo AS manga_titulo,
            m.portada_url, s.fecha AS seguido_desde
     FROM mangas_seguidos s
     JOIN mangas m ON m.id = s.manga_id
     JOIN capitulos c ON c.manga_id = m.id
     WHERE s.usuario_id = $1
       AND (c.fecha_publicacion IS NULL OR c.fecha_publicacion >= s.fecha::date)
     ORDER BY c.fecha_publicacion DESC NULLS LAST, c.numero DESC
     LIMIT 40`,
    [usuarioId]
  );
  return rows;
};

const listarMarcadores = async (usuarioId) => {
  const { rows } = await db.query(
    `SELECT mk.id, mk.pagina, mk.nota, mk.fecha,
            c.id AS capitulo_id, c.numero AS capitulo_numero, c.titulo AS capitulo_titulo,
            m.id AS manga_id, m.titulo AS manga_titulo, m.portada_url
     FROM marcadores mk
     JOIN capitulos c ON c.id = mk.capitulo_id
     JOIN mangas m ON m.id = c.manga_id
     WHERE mk.usuario_id = $1
     ORDER BY mk.fecha DESC`,
    [usuarioId]
  );
  return rows;
};

const buscarMarcador = async (usuarioId, id) => {
  const { rows } = await db.query(
    'SELECT * FROM marcadores WHERE id = $1 AND usuario_id = $2',
    [id, usuarioId]
  );
  return rows[0] || null;
};

const capituloExiste = async (capituloId) => {
  const { rows } = await db.query(
    `SELECT c.id, c.numero, (SELECT COUNT(*)::int FROM paginas p WHERE p.capitulo_id = c.id) AS total_paginas
     FROM capitulos c WHERE c.id = $1`,
    [capituloId]
  );
  return rows[0] || null;
};

const crearMarcador = async ({ usuarioId, capituloId, pagina, nota }) => {
  const { rows } = await db.query(
    `INSERT INTO marcadores (usuario_id, capitulo_id, pagina, nota)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (usuario_id, capitulo_id, pagina) DO UPDATE
       SET nota = EXCLUDED.nota, fecha = NOW()
     RETURNING *`,
    [usuarioId, capituloId, pagina, nota]
  );
  return rows[0];
};

const borrarMarcador = async (usuarioId, id) => {
  const { rowCount } = await db.query(
    'DELETE FROM marcadores WHERE id = $1 AND usuario_id = $2',
    [id, usuarioId]
  );
  return rowCount > 0;
};

const listarMarcadoresDeCapitulo = async (usuarioId, capituloId) => {
  const { rows } = await db.query(
    `SELECT id, pagina, nota, fecha FROM marcadores
     WHERE usuario_id = $1 AND capitulo_id = $2
     ORDER BY pagina`,
    [usuarioId, capituloId]
  );
  return rows;
};

module.exports = {
  ESTADOS_LISTA,
  listarPorEstado,
  listarTodas,
  buscarEntradaLista,
  guardarEnLista,
  quitarDeLista,
  mangaExiste,
  seguirManga,
  dejarDeSeguir,
  listarSeguidos,
  estaSiguiendo,
  listarAvisos,
  listarMarcadores,
  buscarMarcador,
  capituloExiste,
  crearMarcador,
  borrarMarcador,
  listarMarcadoresDeCapitulo
};
