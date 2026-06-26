const pool = require('../config/database');

const getByManga = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM capitulos WHERE manga_id = $1 ORDER BY numero',
      [req.params.mangaId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getById = async (req, res) => {
  try {
    const { rows: cap } = await pool.query('SELECT * FROM capitulos WHERE id = $1', [req.params.id]);
    if (!cap.length) return res.status(404).json({ error: 'Capítulo no encontrado' });

    const { rows: paginas } = await pool.query(
      'SELECT imagen_url FROM paginas WHERE capitulo_id = $1 ORDER BY orden',
      [req.params.id]
    );

    res.json({ ...cap[0], paginas: paginas.map(p => p.imagen_url) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const guardarProgreso = async (req, res) => {
  try {
    const { pagina } = req.body;
    await pool.query(`
      INSERT INTO progreso_lectura (usuario_id, capitulo_id, pagina_actual, ultima_actualizacion)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (usuario_id, capitulo_id)
      DO UPDATE SET pagina_actual = $3, ultima_actualizacion = NOW()`,
      [req.usuario.id, req.params.id, pagina]
    );
    res.json({ mensaje: 'Progreso guardado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getByManga, getById, guardarProgreso };
