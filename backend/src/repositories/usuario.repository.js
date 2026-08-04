/**
 * Acceso a datos de usuarios y favoritos.
 *
 * Es el único lugar del módulo de usuarios donde hay SQL. Antes las consultas
 * estaban escritas dentro del controlador, junto al manejo de HTTP y a la
 * lógica de negocio, lo que hacía imposible probar cualquiera de las tres cosas
 * por separado.
 */

const db = require('../patterns/DatabaseSingleton');

const CODIGO_VIOLACION_UNICIDAD = '23505';

const crear = async ({ nombre, correo, passwordHash }) => {
  const { rows } = await db.query(
    `INSERT INTO usuarios (nombre, correo, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, nombre, correo`,
    [nombre, correo, passwordHash]
  );
  return rows[0];
};

// La comparación es insensible a mayúsculas para que las cuentas creadas antes
// de normalizar el correo en el registro sigan pudiendo iniciar sesión.
const buscarPorCorreo = async (correo) => {
  const { rows } = await db.query('SELECT * FROM usuarios WHERE LOWER(correo) = LOWER($1)', [correo]);
  return rows[0] || null;
};

const buscarPerfilPorId = async (id) => {
  const { rows } = await db.query(
    'SELECT id, nombre, correo, fecha_registro FROM usuarios WHERE id = $1',
    [id]
  );
  return rows[0] || null;
};

const listarFavoritos = async (usuarioId) => {
  const { rows } = await db.query(
    `SELECT m.* FROM mangas m
     JOIN favoritos f ON f.manga_id = m.id
     WHERE f.usuario_id = $1`,
    [usuarioId]
  );
  return rows;
};

const agregarFavorito = async (usuarioId, mangaId) => {
  await db.query(
    `INSERT INTO favoritos (usuario_id, manga_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [usuarioId, mangaId]
  );
};

module.exports = {
  crear,
  buscarPorCorreo,
  buscarPerfilPorId,
  listarFavoritos,
  agregarFavorito,
  CODIGO_VIOLACION_UNICIDAD
};
