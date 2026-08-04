/**
 * Datos de perfil y catálogo para el algoritmo de recomendaciones.
 */

const db = require('../patterns/DatabaseSingleton');

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

/**
 * Semillas del usuario: favoritos, listas y seguidos con género/demografía.
 * Cada fila trae una señal (`favorito` | `lista` | `seguido`) y, en listas, el estado.
 */
const semillasDeUsuario = async (usuarioId) => {
  const { rows } = await db.query(
    `SELECT m.id AS manga_id,
            m.genero,
            COALESCE(m.demografia, 'shounen') AS demografia,
            'favorito' AS senal,
            NULL::text AS estado_lista
     FROM favoritos f
     JOIN mangas m ON m.id = f.manga_id
     WHERE f.usuario_id = $1

     UNION ALL

     SELECT m.id,
            m.genero,
            COALESCE(m.demografia, 'shounen'),
            'lista',
            l.estado
     FROM listas_lectura l
     JOIN mangas m ON m.id = l.manga_id
     WHERE l.usuario_id = $1

     UNION ALL

     SELECT m.id,
            m.genero,
            COALESCE(m.demografia, 'shounen'),
            'seguido',
            NULL
     FROM mangas_seguidos s
     JOIN mangas m ON m.id = s.manga_id
     WHERE s.usuario_id = $1`,
    [usuarioId]
  );
  return rows;
};

/** Catálogo completo con conteo de favoritos (candidatos + fallback populares). */
const candidatosConFavoritos = async () => {
  const { rows } = await db.query(`${SELECT_MANGA} ORDER BY m.titulo`);
  return rows;
};

module.exports = {
  SELECT_MANGA,
  semillasDeUsuario,
  candidatosConFavoritos
};
