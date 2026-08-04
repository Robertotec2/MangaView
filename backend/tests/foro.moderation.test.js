const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const { crearForoService, armarArbolComentarios } = require('../src/services/foro.service');
const { ErrorDeNegocio } = require('../src/utils/errores');

describe('armarArbolComentarios', () => {
  test('cuelga las respuestas bajo su padre y aplana un tercer nivel', () => {
    const arbol = armarArbolComentarios([
      { id: 1, padre_id: null, cuerpo: 'raiz' },
      { id: 2, padre_id: 1, cuerpo: 'respuesta' },
      { id: 3, padre_id: 2, cuerpo: 'respuesta a respuesta' }
    ]);
    assert.equal(arbol.length, 1);
    assert.equal(arbol[0].respuestas.length, 2);
    assert.equal(arbol[0].respuestas[0].cuerpo, 'respuesta');
    assert.equal(arbol[0].respuestas[1].cuerpo, 'respuesta a respuesta');
  });
});

function repoForo() {
  const pubs = {
    1: {
      id: 1, titulo: 'Hola mundo largo', cuerpo: 'Cuerpo suficientemente largo',
      usuario_id: 7, borrada: false, comentarios: 0, likes: 0, dislikes: 0, manga_id: null
    }
  };
  const comentarios = {
    10: { id: 10, publicacion_id: 1, usuario_id: 7, padre_id: null, borrado: false, cuerpo: 'Hola' }
  };
  return {
    listarTemas: async () => [],
    buscarTemaPorSlug: async (s) => (s === 'discusiones' ? { id: 1, slug: s } : null),
    listarPublicaciones: async () => [],
    buscarPublicacionPorId: async (id) => pubs[id] || null,
    crearPublicacion: async ({ mangaId }) => {
      pubs[2] = { ...pubs[1], id: 2, manga_id: mangaId };
      return { id: 2 };
    },
    actualizarPublicacion: async ({ id, usuarioId }) =>
      (pubs[id] && pubs[id].usuario_id === usuarioId ? { id } : null),
    borrarPublicacion: async (id, usuarioId) => {
      if (!pubs[id] || pubs[id].usuario_id !== usuarioId) return false;
      pubs[id].borrada = true;
      return true;
    },
    listarComentarios: async () => Object.values(comentarios),
    buscarComentarioPorId: async (id) => comentarios[id] || null,
    crearComentario: async (datos) => {
      comentarios[11] = { id: 11, ...datos, borrado: false };
      return { id: 11 };
    },
    actualizarComentario: async () => ({ id: 10 }),
    borrarComentario: async () => true,
    registrarReaccion: async () => ({ reaccion: 1 }),
    buscarReaccion: async () => null,
    registrarVista: async () => {},
    crearReporte: async (d) => ({ id: 1, ...d }),
    mangaExiste: async (id) => id === 5
  };
}

describe('moderacion del foro', () => {
  test('solo el autor puede borrar su publicacion', async () => {
    const servicio = crearForoService({ repositorio: repoForo() });
    const fallo = await servicio.borrarPublicacion(99, 1).catch((e) => e);
    assert.equal(fallo.estado, 403);
  });

  test('el autor puede borrar su publicacion', async () => {
    const servicio = crearForoService({ repositorio: repoForo() });
    await servicio.borrarPublicacion(7, 1);
  });

  test('cita un manga existente al crear', async () => {
    const repositorio = repoForo();
    const servicio = crearForoService({ repositorio });
    const creada = await servicio.crearPublicacion(7, {
      tema: 'discusiones',
      titulo: 'Hablemos de One Piece ahora',
      cuerpo: 'Este cuerpo tiene mas de diez caracteres.',
      mangaId: 5
    });
    assert.equal(creada.manga_id, 5);
  });

  test('rechaza citar un manga inexistente', async () => {
    const servicio = crearForoService({ repositorio: repoForo() });
    const fallo = await servicio.crearPublicacion(7, {
      tema: 'discusiones',
      titulo: 'Hablemos de algo inventado',
      cuerpo: 'Este cuerpo tiene mas de diez caracteres.',
      mangaId: 999
    }).catch((e) => e);
    assert.ok(fallo instanceof ErrorDeNegocio);
    assert.equal(fallo.estado, 404);
  });

  test('al responder a una respuesta cuelga del comentario raiz', async () => {
    const repositorio = repoForo();
    repositorio.buscarComentarioPorId = async (id) => {
      if (id === 10) return { id: 10, publicacion_id: 1, padre_id: null, borrado: false };
      if (id === 20) return { id: 20, publicacion_id: 1, padre_id: 10, borrado: false };
      return null;
    };
    let guardado = null;
    repositorio.crearComentario = async (datos) => {
      guardado = datos;
      return { id: 30 };
    };
    repositorio.buscarComentarioPorId = async (id) => {
      if (id === 30) return { id: 30, ...guardado };
      if (id === 20) return { id: 20, publicacion_id: 1, padre_id: 10, borrado: false };
      return null;
    };

    const servicio = crearForoService({ repositorio });
    await servicio.comentar(7, 1, { cuerpo: 'Tercer nivel', padreId: 20 });
    assert.equal(guardado.padreId, 10);
  });

  test('un reporte exige motivo y un unico objetivo', async () => {
    const servicio = crearForoService({ repositorio: repoForo() });
    const fallo = await servicio.reportar(7, { publicacionId: 1, comentarioId: 10, motivo: 'spam' })
      .catch((e) => e);
    assert.equal(fallo.estado, 400);
  });
});
