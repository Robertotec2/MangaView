/**
 * Lógica de negocio del foro. No conoce Express ni SQL.
 */

const crypto = require('crypto');

const foroRepository = require('../repositories/foro.repository');
const {
  validarPublicacion,
  validarComentario,
  validarReporte
} = require('../utils/validadores');
const { ErrorDeNegocio } = require('../utils/errores');

const CODIGO_VIOLACION_UNICIDAD = '23505';
const ORDENES_VALIDOS = ['recientes', 'populares'];
const ME_GUSTA = 1;
const NO_ME_GUSTA = -1;

const calcularHuella = ({ usuarioId, ip, agente }) => {
  if (usuarioId) return `u:${usuarioId}`;

  const sal = process.env.JWT_SECRET || 'mangaview';
  return `a:${crypto
    .createHash('sha256')
    .update(`${ip || ''}|${agente || ''}|${sal}`)
    .digest('hex')
    .slice(0, 32)}`;
};

const exigirEnteroPositivo = (valor, mensaje) => {
  const numero = Number(valor);
  if (!Number.isInteger(numero) || numero <= 0) {
    throw new ErrorDeNegocio(mensaje, 400);
  }
  return numero;
};

/**
 * Arma el árbol de comentarios. Solo se permite un nivel de respuestas: si el
 * padre ya es una respuesta, la nueva cuelga del comentario raíz. Así el hilo
 * no se convierte en una cascada ilegible.
 */
const armarArbolComentarios = (filas) => {
  const porId = new Map();
  const raiz = [];

  for (const fila of filas) {
    porId.set(fila.id, { ...fila, respuestas: [] });
  }

  for (const fila of filas) {
    const nodo = porId.get(fila.id);
    if (fila.padre_id && porId.has(fila.padre_id)) {
      const padre = porId.get(fila.padre_id);
      const ancla = padre.padre_id && porId.has(padre.padre_id)
        ? porId.get(padre.padre_id)
        : padre;
      ancla.respuestas.push(nodo);
    } else {
      raiz.push(nodo);
    }
  }

  return raiz;
};

const resolverMangaId = async (repositorio, mangaId) => {
  if (mangaId === undefined || mangaId === null || mangaId === '') return null;
  const id = exigirEnteroPositivo(mangaId, 'Identificador de manga invalido');
  if (!(await repositorio.mangaExiste(id))) {
    throw new ErrorDeNegocio('El manga citado no existe', 404);
  }
  return id;
};

function crearForoService({ repositorio = foroRepository, huellaDe = calcularHuella } = {}) {

  const listarTemas = () => repositorio.listarTemas();

  const listarPublicaciones = async ({ tema, buscar, orden } = {}) => {
    const ordenamiento = ORDENES_VALIDOS.includes(orden) ? orden : 'recientes';

    if (tema && !(await repositorio.buscarTemaPorSlug(tema))) {
      throw new ErrorDeNegocio('El tema no existe', 404);
    }

    return repositorio.listarPublicaciones({
      temaSlug: tema || null,
      busqueda: buscar ? buscar.trim() : null,
      orden: ordenamiento
    });
  };

  const obtenerPublicacion = async (id, visitante = {}) => {
    const publicacionId = exigirEnteroPositivo(id, 'Identificador de publicacion invalido');

    const existe = await repositorio.buscarPublicacionPorId(publicacionId);
    if (!existe || existe.borrada) throw new ErrorDeNegocio('La publicacion no existe', 404);

    await repositorio.registrarVista(publicacionId, huellaDe(visitante));

    const [publicacion, comentariosPlanos] = await Promise.all([
      repositorio.buscarPublicacionPorId(publicacionId),
      repositorio.listarComentarios(publicacionId)
    ]);

    const miReaccion = visitante.usuarioId
      ? await repositorio.buscarReaccion(publicacionId, visitante.usuarioId)
      : null;

    return {
      ...publicacion,
      total_comentarios: publicacion.comentarios,
      comentarios: armarArbolComentarios(comentariosPlanos),
      mi_reaccion: miReaccion
    };
  };

  const crearPublicacion = async (usuarioId, datos = {}) => {
    const errores = validarPublicacion(datos);
    if (errores.length) throw new ErrorDeNegocio(errores[0], 400);

    const tema = await repositorio.buscarTemaPorSlug(datos.tema);
    if (!tema) throw new ErrorDeNegocio('El tema no existe', 404);

    const mangaId = await resolverMangaId(repositorio, datos.mangaId);

    try {
      const { id } = await repositorio.crearPublicacion({
        temaId: tema.id,
        usuarioId,
        titulo: datos.titulo.trim(),
        cuerpo: datos.cuerpo.trim(),
        mangaId
      });
      return repositorio.buscarPublicacionPorId(id);
    } catch (err) {
      if (err.code === CODIGO_VIOLACION_UNICIDAD) {
        throw new ErrorDeNegocio('Ya existe una publicacion con ese titulo en este tema', 409);
      }
      throw err;
    }
  };

  const editarPublicacion = async (usuarioId, publicacionId, datos = {}) => {
    const id = exigirEnteroPositivo(publicacionId, 'Identificador de publicacion invalido');
    // El tema no se cambia al editar; se pasa uno válido solo para reutilizar
    // las reglas de longitud de título y cuerpo.
    const errores = validarPublicacion({
      tema: 'discusiones',
      titulo: datos.titulo,
      cuerpo: datos.cuerpo
    });
    if (errores.length) throw new ErrorDeNegocio(errores[0], 400);

    const actual = await repositorio.buscarPublicacionPorId(id);
    if (!actual || actual.borrada) throw new ErrorDeNegocio('La publicacion no existe', 404);
    if (actual.usuario_id !== usuarioId) {
      throw new ErrorDeNegocio('Solo puedes editar tus propias publicaciones', 403);
    }

    const mangaId = datos.mangaId === undefined
      ? actual.manga_id
      : await resolverMangaId(repositorio, datos.mangaId);

    const actualizada = await repositorio.actualizarPublicacion({
      id,
      usuarioId,
      titulo: datos.titulo.trim(),
      cuerpo: datos.cuerpo.trim(),
      mangaId
    });
    if (!actualizada) throw new ErrorDeNegocio('No se pudo editar la publicacion', 403);
    return repositorio.buscarPublicacionPorId(id);
  };

  const borrarPublicacion = async (usuarioId, publicacionId) => {
    const id = exigirEnteroPositivo(publicacionId, 'Identificador de publicacion invalido');
    const actual = await repositorio.buscarPublicacionPorId(id);
    if (!actual || actual.borrada) throw new ErrorDeNegocio('La publicacion no existe', 404);
    if (actual.usuario_id !== usuarioId) {
      throw new ErrorDeNegocio('Solo puedes borrar tus propias publicaciones', 403);
    }
    await repositorio.borrarPublicacion(id, usuarioId);
  };

  const comentar = async (usuarioId, publicacionId, datos = {}) => {
    const id = exigirEnteroPositivo(publicacionId, 'Identificador de publicacion invalido');

    const errores = validarComentario(datos);
    if (errores.length) throw new ErrorDeNegocio(errores[0], 400);

    const publicacion = await repositorio.buscarPublicacionPorId(id);
    if (!publicacion || publicacion.borrada) {
      throw new ErrorDeNegocio('La publicacion no existe', 404);
    }

    let padreId = null;
    if (datos.padreId !== undefined && datos.padreId !== null && datos.padreId !== '') {
      padreId = exigirEnteroPositivo(datos.padreId, 'Identificador de comentario invalido');
      const padre = await repositorio.buscarComentarioPorId(padreId);
      if (!padre || padre.publicacion_id !== id) {
        throw new ErrorDeNegocio('El comentario al que respondes no existe', 404);
      }
      // Un solo nivel: si responden a una respuesta, cuelga del raíz.
      if (padre.padre_id) padreId = padre.padre_id;
    }

    const creado = await repositorio.crearComentario({
      publicacionId: id,
      usuarioId,
      cuerpo: datos.cuerpo.trim(),
      padreId
    });
    return repositorio.buscarComentarioPorId(creado.id);
  };

  const editarComentario = async (usuarioId, comentarioId, datos = {}) => {
    const id = exigirEnteroPositivo(comentarioId, 'Identificador de comentario invalido');
    const errores = validarComentario(datos);
    if (errores.length) throw new ErrorDeNegocio(errores[0], 400);

    const actual = await repositorio.buscarComentarioPorId(id);
    if (!actual || actual.borrado) throw new ErrorDeNegocio('El comentario no existe', 404);
    if (actual.usuario_id !== usuarioId) {
      throw new ErrorDeNegocio('Solo puedes editar tus propios comentarios', 403);
    }

    const editado = await repositorio.actualizarComentario({
      id,
      usuarioId,
      cuerpo: datos.cuerpo.trim()
    });
    if (!editado) throw new ErrorDeNegocio('No se pudo editar el comentario', 403);
    return repositorio.buscarComentarioPorId(id);
  };

  const borrarComentario = async (usuarioId, comentarioId) => {
    const id = exigirEnteroPositivo(comentarioId, 'Identificador de comentario invalido');
    const actual = await repositorio.buscarComentarioPorId(id);
    if (!actual || actual.borrado) throw new ErrorDeNegocio('El comentario no existe', 404);
    if (actual.usuario_id !== usuarioId) {
      throw new ErrorDeNegocio('Solo puedes borrar tus propios comentarios', 403);
    }
    await repositorio.borrarComentario(id, usuarioId);
  };

  const reaccionar = async (usuarioId, publicacionId, valor) => {
    const id = exigirEnteroPositivo(publicacionId, 'Identificador de publicacion invalido');

    const voto = Number(valor);
    if (voto !== ME_GUSTA && voto !== NO_ME_GUSTA) {
      throw new ErrorDeNegocio('La reaccion solo puede ser 1 o -1', 400);
    }

    const publicacion = await repositorio.buscarPublicacionPorId(id);
    if (!publicacion || publicacion.borrada) {
      throw new ErrorDeNegocio('La publicacion no existe', 404);
    }

    const { reaccion } = await repositorio.registrarReaccion({
      publicacionId: id,
      usuarioId,
      valor: voto
    });

    const actualizada = await repositorio.buscarPublicacionPorId(id);
    return {
      mi_reaccion: reaccion,
      likes: Number(actualizada.likes),
      dislikes: Number(actualizada.dislikes)
    };
  };

  const reportar = async (usuarioId, datos = {}) => {
    const errores = validarReporte(datos);
    if (errores.length) throw new ErrorDeNegocio(errores[0], 400);

    const tienePublicacion = datos.publicacionId !== undefined && datos.publicacionId !== null && datos.publicacionId !== '';
    const tieneComentario = datos.comentarioId !== undefined && datos.comentarioId !== null && datos.comentarioId !== '';

    if (tienePublicacion === tieneComentario) {
      throw new ErrorDeNegocio('El reporte debe apuntar a una publicacion o a un comentario', 400);
    }

    let publicacionId = null;
    let comentarioId = null;

    if (tienePublicacion) {
      publicacionId = exigirEnteroPositivo(datos.publicacionId, 'Identificador de publicacion invalido');
      const pub = await repositorio.buscarPublicacionPorId(publicacionId);
      if (!pub || pub.borrada) throw new ErrorDeNegocio('La publicacion no existe', 404);
    } else {
      comentarioId = exigirEnteroPositivo(datos.comentarioId, 'Identificador de comentario invalido');
      const com = await repositorio.buscarComentarioPorId(comentarioId);
      if (!com || com.borrado) throw new ErrorDeNegocio('El comentario no existe', 404);
    }

    return repositorio.crearReporte({
      usuarioId,
      publicacionId,
      comentarioId,
      motivo: datos.motivo.trim()
    });
  };

  return {
    listarTemas,
    listarPublicaciones,
    obtenerPublicacion,
    crearPublicacion,
    editarPublicacion,
    borrarPublicacion,
    comentar,
    editarComentario,
    borrarComentario,
    reaccionar,
    reportar,
    armarArbolComentarios
  };
}

module.exports = {
  crearForoService,
  foroService: crearForoService(),
  calcularHuella,
  armarArbolComentarios,
  ME_GUSTA,
  NO_ME_GUSTA,
  ORDENES_VALIDOS
};
