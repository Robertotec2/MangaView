const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const {
  crearRecomendacionService,
  pesoSenal,
  construirPerfil,
  puntuarCandidato,
  rankear
} = require('../src/services/recomendacion.service');

function repositorioFalso({ semillas = [], candidatos = [] } = {}) {
  return {
    semillasDeUsuario: async () => semillas,
    candidatosConFavoritos: async () => candidatos
  };
}

const catalogo = [
  { id: 1, titulo: 'Alpha Accion', genero: 'Accion', demografia: 'shounen', favoritos_count: 2 },
  { id: 2, titulo: 'Beta Romance', genero: 'Romance', demografia: 'shoujo', favoritos_count: 10 },
  { id: 3, titulo: 'Gamma Accion', genero: 'Accion', demografia: 'shounen', favoritos_count: 5 },
  { id: 4, titulo: 'Delta Accion', genero: 'Accion', demografia: 'seinen', favoritos_count: 1 },
  { id: 5, titulo: 'Epsilon Comedia', genero: 'Comedia', demografia: 'shounen', favoritos_count: 8 }
];

describe('pesoSenal', () => {
  test('favorito vale 3, lista activa 2, pendiente y seguido 1', () => {
    assert.equal(pesoSenal('favorito'), 3);
    assert.equal(pesoSenal('lista', 'leyendo'), 2);
    assert.equal(pesoSenal('lista', 'terminado'), 2);
    assert.equal(pesoSenal('lista', 'pendiente'), 1);
    assert.equal(pesoSenal('seguido'), 1);
  });
});

describe('construirPerfil', () => {
  test('usa el máximo peso por manga y acumula género/demografía', () => {
    const perfil = construirPerfil([
      { manga_id: 1, genero: 'Accion', demografia: 'shounen', senal: 'seguido', estado_lista: null },
      { manga_id: 1, genero: 'Accion', demografia: 'shounen', senal: 'favorito', estado_lista: null },
      { manga_id: 2, genero: 'Romance', demografia: 'shoujo', senal: 'lista', estado_lista: 'pendiente' }
    ]);
    assert.equal(perfil.idsSemilla.size, 2);
    assert.equal(perfil.pesosGenero.Accion, 3);
    assert.equal(perfil.pesosGenero.Romance, 1);
    assert.equal(perfil.pesosDemo.shounen, 3);
    assert.equal(perfil.pesosDemo.shoujo, 1);
  });
});

describe('puntuarCandidato y rankear', () => {
  test('mismo género y demografía puntúan más; semillas se excluyen', () => {
    const perfil = construirPerfil([
      { manga_id: 1, genero: 'Accion', demografia: 'shounen', senal: 'favorito', estado_lista: null }
    ]);
    const scoreAccion = puntuarCandidato(catalogo[2], perfil);
    const scoreRomance = puntuarCandidato(catalogo[1], perfil);
    assert.ok(scoreAccion > scoreRomance);

    const top = rankear(catalogo, perfil, 10);
    assert.ok(!top.some((m) => m.id === 1));
    assert.equal(top[0].id, 3);
  });

  test('empate de score se resuelve por favoritos_count', () => {
    const perfil = {
      idsSemilla: new Set(),
      pesosGenero: { Accion: 1 },
      pesosDemo: {}
    };
    const a = { id: 10, titulo: 'Zeta', genero: 'Accion', demografia: 'josei', favoritos_count: 1 };
    const b = { id: 11, titulo: 'Omega', genero: 'Accion', demografia: 'josei', favoritos_count: 9 };
    const top = rankear([a, b], perfil, 2);
    assert.equal(top[0].id, 11);
    assert.equal(top[1].id, 10);
  });
});

describe('recomendacionService.recomendar', () => {
  test('sin usuario o sin semillas hace fallback a populares', async () => {
    const servicio = crearRecomendacionService({
      repositorio: repositorioFalso({ semillas: [], candidatos: catalogo })
    });

    const anon = await servicio.recomendar(null, 3);
    assert.equal(anon.personalizado, false);
    assert.equal(anon.mangas[0].id, 2);
    assert.equal(anon.mangas.length, 3);

    const vacio = await servicio.recomendar(7, 2);
    assert.equal(vacio.personalizado, false);
    assert.equal(vacio.mangas[0].id, 2);
  });

  test('con favoritos de Acción/Shounen prioriza esos candidatos', async () => {
    const servicio = crearRecomendacionService({
      repositorio: repositorioFalso({
        semillas: [
          { manga_id: 1, genero: 'Accion', demografia: 'shounen', senal: 'favorito', estado_lista: null }
        ],
        candidatos: catalogo
      })
    });

    const res = await servicio.recomendar(1, 4);
    assert.equal(res.personalizado, true);
    assert.ok(!res.mangas.some((m) => m.id === 1));
    assert.equal(res.mangas[0].genero, 'Accion');
    assert.equal(res.mangas[0].demografia, 'shounen');
  });
});
