const db = require('../patterns/DatabaseSingleton');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const registro = async (req, res) => {
  try {
    const { nombre, correo, password } = req.body;
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await db.query(
      'INSERT INTO usuarios (nombre, correo, password_hash) VALUES ($1, $2, $3) RETURNING id, nombre, correo',
      [nombre, correo, hash]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { correo, password } = req.body;
    const { rows } = await db.query('SELECT * FROM usuarios WHERE correo = $1', [correo]);
    if (!rows.length) return res.status(401).json({ error: 'Credenciales incorrectas' });

    const valido = await bcrypt.compare(password, rows[0].password_hash);
    if (!valido) return res.status(401).json({ error: 'Credenciales incorrectas' });

    const token = jwt.sign({ id: rows[0].id, correo: rows[0].correo }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, usuario: { id: rows[0].id, nombre: rows[0].nombre } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const perfil = async (req, res) => {
  try {
    const { rows } = await db.query('SELECT id, nombre, correo, fecha_registro FROM usuarios WHERE id = $1', [req.usuario.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const favoritos = async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT m.* FROM mangas m
      JOIN favoritos f ON f.manga_id = m.id
      WHERE f.usuario_id = $1`, [req.usuario.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const agregarFavorito = async (req, res) => {
  try {
    await db.query(
      'INSERT INTO favoritos (usuario_id, manga_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.usuario.id, req.params.mangaId]
    );
    res.json({ mensaje: 'Agregado a favoritos' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { registro, login, perfil, favoritos, agregarFavorito };
