const db = require('../patterns/DatabaseSingleton');

const getAll = async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM mangas ORDER BY titulo');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getById = async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM mangas WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Manga no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getByGenero = async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM mangas WHERE genero = $1', [req.params.genero]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getAll, getById, getByGenero };
