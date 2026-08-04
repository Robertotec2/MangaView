/**
 * Recomendaciones content-based por género y demografía.
 */

const recomendacionRepository = require('../repositories/recomendacion.repository');

const PESO_FAVORITO = 3;
const PESO_LISTA_ACTIVA = 2;
const PESO_LISTA_PENDIENTE = 1;
const PESO_SEGUIDO = 1;

/**
 * Peso de una señal sobre un manga semilla.
 */
function pesoSenal(senal, estadoLista) {
  if (senal === 'favorito') return PESO_FAVORITO;
  if (senal === 'seguido') return PESO_SEGUIDO;
  if (senal === 'lista') {
    if (estadoLista === 'leyendo' || estadoLista === 'terminado') return PESO_LISTA_ACTIVA;
    return PESO_LISTA_PENDIENTE;
  }
  return 0;
}

/**
 * Consolida semillas: máximo peso por manga_id; acumula pesos de género y demografía.
 */
function construirPerfil(semillas) {
  const pesoPorManga = new Map();
  const metaPorManga = new Map();

  for (const fila of semillas) {
    const id = Number(fila.manga_id);
    const peso = pesoSenal(fila.senal, fila.estado_lista);
    if (!peso) continue;
    const actual = pesoPorManga.get(id) || 0;
    if (peso > actual) pesoPorManga.set(id, peso);
    if (!metaPorManga.has(id)) {
      metaPorManga.set(id, {
        genero: fila.genero || '',
        demografia: String(fila.demografia || 'shounen').toLowerCase()
      });
    }
  }

  const pesosGenero = Object.create(null);
  const pesosDemo = Object.create(null);

  for (const [id, peso] of pesoPorManga) {
    const meta = metaPorManga.get(id);
    if (!meta) continue;
    if (meta.genero) {
      pesosGenero[meta.genero] = (pesosGenero[meta.genero] || 0) + peso;
    }
    if (meta.demografia) {
      pesosDemo[meta.demografia] = (pesosDemo[meta.demografia] || 0) + peso;
    }
  }

  return {
    idsSemilla: new Set(pesoPorManga.keys()),
    pesosGenero,
    pesosDemo
  };
}

/**
 * Score de un candidato frente al perfil.
 * 3 * pesoGenero + 2 * pesoDemo + 0.5 * log(1 + favoritos_count)
 */
function puntuarCandidato(manga, perfil) {
  const genero = manga.genero || '';
  const demo = String(manga.demografia || 'shounen').toLowerCase();
  const favs = Number(manga.favoritos_count) || 0;
  return (
    3 * (perfil.pesosGenero[genero] || 0) +
    2 * (perfil.pesosDemo[demo] || 0) +
    0.5 * Math.log(1 + favs)
  );
}

function ordenarPorPopularidad(candidatos, limite) {
  return [...candidatos]
    .sort((a, b) => {
      const fa = Number(a.favoritos_count) || 0;
      const fb = Number(b.favoritos_count) || 0;
      if (fb !== fa) return fb - fa;
      return String(a.titulo || '').localeCompare(String(b.titulo || ''));
    })
    .slice(0, limite);
}

/**
 * Rankea candidatos excluyendo semillas; desempate por favoritos_count y título.
 */
function rankear(candidatos, perfil, limite) {
  return candidatos
    .filter((m) => !perfil.idsSemilla.has(Number(m.id)))
    .map((m) => ({ manga: m, score: puntuarCandidato(m, perfil) }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const fa = Number(a.manga.favoritos_count) || 0;
      const fb = Number(b.manga.favoritos_count) || 0;
      if (fb !== fa) return fb - fa;
      return String(a.manga.titulo || '').localeCompare(String(b.manga.titulo || ''));
    })
    .slice(0, limite)
    .map(({ manga, score }) => ({ ...manga, score_recomendacion: score }));
}

function crearRecomendacionService({ repositorio = recomendacionRepository } = {}) {
  const recomendar = async (usuarioId, limit = 10) => {
    const limite = Math.min(Math.max(Number(limit) || 10, 1), 30);
    const candidatos = await repositorio.candidatosConFavoritos();

    if (!usuarioId) {
      return {
        personalizado: false,
        mangas: ordenarPorPopularidad(candidatos, limite)
      };
    }

    const semillas = await repositorio.semillasDeUsuario(usuarioId);
    const perfil = construirPerfil(semillas);

    if (!perfil.idsSemilla.size) {
      return {
        personalizado: false,
        mangas: ordenarPorPopularidad(candidatos, limite)
      };
    }

    return {
      personalizado: true,
      mangas: rankear(candidatos, perfil, limite)
    };
  };

  return { recomendar };
}

module.exports = {
  crearRecomendacionService,
  recomendacionService: crearRecomendacionService(),
  pesoSenal,
  construirPerfil,
  puntuarCandidato,
  rankear,
  ordenarPorPopularidad
};
