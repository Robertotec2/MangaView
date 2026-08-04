const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const { crearBibliotecaService } = require('../src/services/biblioteca.service');
const { ErrorDeNegocio } = require('../src/utils/errores');

function repoFalso() {
  const estado = {
    listas: new Map(),
    seguidos: new Set(),
    marcadores: []
  };
  return {
    estado,
    listarPorEstado: async (u, e) =>
      [...estado.listas.values()].filter((x) => x.usuarioId === u && x.estado === e),
    listarTodas: async (u) => [...estado.listas.values()].filter((x) => x.usuarioId === u),
    buscarEntradaLista: async (u, m) => estado.listas.get(`${u}:${m}`) || null,
    guardarEnLista: async (u, m, e) => {
      const fila = { usuarioId: u, mangaId: m, estado: e };
      estado.listas.set(`${u}:${m}`, fila);
      return fila;
    },
    quitarDeLista: async (u, m) => estado.listas.delete(`${u}:${m}`),
    mangaExiste: async (id) => id === 1 || id === 2,
    seguirManga: async (u, m) => { estado.seguidos.add(`${u}:${m}`); },
    dejarDeSeguir: async (u, m) => estado.seguidos.delete(`${u}:${m}`),
    listarSeguidos: async () => [],
    estaSiguiendo: async (u, m) => estado.seguidos.has(`${u}:${m}`),
    listarAvisos: async () => [{ manga_titulo: 'One Piece' }],
    listarMarcadores: async () => estado.marcadores,
    buscarMarcador: async () => null,
    capituloExiste: async (id) => (id === 10 ? { id: 10, numero: 1, total_paginas: 3 } : null),
    crearMarcador: async (datos) => {
      const fila = { id: 5, ...datos };
      estado.marcadores.push(fila);
      return fila;
    },
    borrarMarcador: async (u, id) => {
      const antes = estado.marcadores.length;
      estado.marcadores = estado.marcadores.filter((m) => !(m.id === id && m.usuarioId === u));
      return estado.marcadores.length < antes;
    },
    listarMarcadoresDeCapitulo: async () => []
  };
}

describe('bibliotecaService listas', () => {
  test('guarda un manga en pendiente, leyendo o terminado', async () => {
    const repositorio = repoFalso();
    const servicio = crearBibliotecaService({ repositorio });
    await servicio.guardarEnLista(1, 1, 'leyendo');
    assert.equal(repositorio.estado.listas.get('1:1').estado, 'leyendo');
  });

  test('rechaza un estado que no existe', async () => {
    const servicio = crearBibliotecaService({ repositorio: repoFalso() });
    const fallo = await servicio.guardarEnLista(1, 1, 'abandonado').catch((e) => e);
    assert.ok(fallo instanceof ErrorDeNegocio);
    assert.equal(fallo.estado, 400);
  });

  test('no guarda un manga inexistente', async () => {
    const servicio = crearBibliotecaService({ repositorio: repoFalso() });
    const fallo = await servicio.guardarEnLista(1, 99, 'pendiente').catch((e) => e);
    assert.equal(fallo.estado, 404);
  });
});

describe('bibliotecaService marcadores', () => {
  test('crea un marcador dentro del rango de paginas', async () => {
    const servicio = crearBibliotecaService({ repositorio: repoFalso() });
    const creado = await servicio.crearMarcador(1, { capituloId: 10, pagina: 2, nota: 'escena' });
    assert.equal(creado.pagina, 2);
  });

  test('rechaza una pagina fuera del capitulo', async () => {
    const servicio = crearBibliotecaService({ repositorio: repoFalso() });
    const fallo = await servicio.crearMarcador(1, { capituloId: 10, pagina: 9 }).catch((e) => e);
    assert.equal(fallo.estado, 400);
  });
});

describe('bibliotecaService follows', () => {
  test('sigue un manga y lo refleja en el estado', async () => {
    const repositorio = repoFalso();
    const servicio = crearBibliotecaService({ repositorio });
    await servicio.seguir(3, 1);
    const estado = await servicio.estadoDeManga(3, 1);
    assert.equal(estado.siguiendo, true);
  });
});
