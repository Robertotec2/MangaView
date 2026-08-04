const db = require('../patterns/DatabaseSingleton');
const { recomendacionService } = require('../services/recomendacion.service');

const SELECT_MANGA = `
  SELECT m.*,
         COALESCE(f.cnt, 0)::int AS favoritos_count,
         u.ultima_fecha
  FROM mangas m
  LEFT JOIN (
    SELECT manga_id, COUNT(*)::int AS cnt
    FROM favoritos
    GROUP BY manga_id
  ) f ON f.manga_id = m.id
  LEFT JOIN (
    SELECT manga_id, MAX(fecha_publicacion) AS ultima_fecha
    FROM capitulos
    GROUP BY manga_id
  ) u ON u.manga_id = m.id
`;

const getAll = async (req, res) => {
  try {
    const { q, genero, estado, demografia } = req.query;
    const filtros = [];
    const valores = [];

    if (q && String(q).trim()) {
      valores.push(`%${String(q).trim().toLowerCase()}%`);
      filtros.push(`(LOWER(m.titulo) LIKE $${valores.length} OR LOWER(COALESCE(m.autor, '')) LIKE $${valores.length})`);
    }
    if (genero && genero !== 'todos') {
      valores.push(genero);
      filtros.push(`m.genero = $${valores.length}`);
    }
    if (estado && estado !== 'todos') {
      valores.push(estado);
      filtros.push(`m.estado = $${valores.length}`);
    }
    if (demografia && demografia !== 'todos') {
      valores.push(String(demografia).toLowerCase());
      filtros.push(`LOWER(COALESCE(m.demografia, 'shounen')) = $${valores.length}`);
    }

    const where = filtros.length ? `WHERE ${filtros.join(' AND ')}` : '';
    const { rows } = await db.query(
      `${SELECT_MANGA} ${where} ORDER BY m.titulo`,
      valores
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getRecientes = async (req, res) => {
  try {
    const limite = Math.min(Number(req.query.limit) || 12, 30);
    const { rows } = await db.query(
      `${SELECT_MANGA}
       WHERE u.ultima_fecha IS NOT NULL
       ORDER BY u.ultima_fecha DESC, m.titulo
       LIMIT $1`,
      [limite]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getPopulares = async (req, res) => {
  try {
    const limite = Math.min(Number(req.query.limit) || 12, 30);
    const { rows } = await db.query(
      `${SELECT_MANGA}
       ORDER BY COALESCE(f.cnt, 0) DESC, m.titulo
       LIMIT $1`,
      [limite]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getById = async (req, res) => {
  try {
    const { rows } = await db.query(
      `${SELECT_MANGA} WHERE m.id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Manga no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getByGenero = async (req, res) => {
  try {
    const { rows } = await db.query(
      `${SELECT_MANGA} WHERE m.genero = $1 ORDER BY m.titulo`,
      [req.params.genero]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getRecomendados = async (req, res) => {
  try {
    const resultado = await recomendacionService.recomendar(
      req.usuario?.id,
      req.query.limit
    );
    res.json(resultado);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAll,
  getRecientes,
  getPopulares,
  getById,
  getByGenero,
  getRecomendados
};
