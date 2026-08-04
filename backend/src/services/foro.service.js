/**
 * Lógica de negocio del foro. No conoce Express ni SQL.
 *
 * Se construye con una fábrica que recibe sus dependencias, igual que
 * `usuario.service.js`, para que las pruebas puedan inyectar un repositorio
 * falso y correr sin PostgreSQL.
 */

const crypto = require('crypto');

const foroRepository = require('../repositories/foro.repository');
const { validarPublicacion, validarComentario } = require('../utils/validadores');
const { ErrorDeNegocio } = require('../utils/errores');

const CODIGO_VIOLACION_UNICIDAD = '23505';

const ORDENES_VALIDOS = ['recientes', 'populares'];
const ME_GUSTA = 1;
const NO_ME_GUSTA = -1;

/**
 * Identifica a un visitante para contar personas y no visitas.
 *
 * Con la sesión iniciada se usa el identificador de la cuenta, así que la
 * misma persona cuenta una sola vez aunque entre desde varios dispositivos.
 * Sin sesión se calcula un hash de la dirección y del navegador: sirve para no
 * contar diez veces a quien recarga, y es irreversible, así que no queda
 * guardado ningún dato personal. La sal es el secreto del servidor, de modo que
 * la huella tampoco se puede reproducir desde fuera.
 */
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

function crearForoService({ repositorio = foroRepository, huellaDe = calcularHuella } = {}) {

  const listarTemas = () => repositorio.listarTemas();

  const listarPublicaciones = async ({ tema, buscar, orden } = {}) => {
    // Un orden desconocido no es motivo para rechazar la petición: se cae al
    // valor por defecto, que es lo que la persona espera ver.
    const ordenamiento = ORDENES_VALIDOS.includes(orden) ? orden : 'recientes';

    // Un tema inexistente devolvería una lista vacía sin explicación, y desde
    // el buscador es indistinguible de "no hay resultados".
    if (tema && !(await repositorio.buscarTemaPorSlug(tema))) {
      throw new ErrorDeNegocio('El tema no existe', 404);
    }

    return repositorio.listarPublicaciones({
      temaSlug: tema || null,
      busqueda: buscar ? buscar.trim() : null,
      orden: ordenamiento
    });
  };

  /**
   * Devuelve la publicación con sus comentarios y, de paso, deja constancia de
   * la visita. El registro va antes de leer para que el número que se muestra
   * incluya a quien lo está viendo en ese momento.
   */
  const obtenerPublicacion = async (id, visitante = {}) => {
    const publicacionId = exigirEnteroPositivo(id, 'Identificador de publicacion invalido');

    const existe = await repositorio.buscarPublicacionPorId(publicacionId);
    if (!existe) throw new ErrorDeNegocio('La publicacion no existe', 404);

    await repositorio.registrarVista(publicacionId, huellaDe(visitante));

    const [publicacion, comentarios] = await Promise.all([
      repositorio.buscarPublicacionPorId(publicacionId),
      repositorio.listarComentarios(publicacionId)
    ]);

    const miReaccion = visitante.usuarioId
      ? await repositorio.buscarReaccion(publicacionId, visitante.usuarioId)
      : null;

    // El listado usa `comentarios` como número y aquí hace falta la lista. Se
    // devuelven con nombres distintos para que ningún cliente tenga que
    // adivinar qué recibe según el endpoint.
    return {
      ...publicacion,
      total_comentarios: publicacion.comentarios,
      comentarios,
      mi_reaccion: miReaccion
    };
  };

  const crearPublicacion = async (usuarioId, datos = {}) => {
    const errores = validarPublicacion(datos);
    if (errores.length) throw new ErrorDeNegocio(errores[0], 400);

    const tema = await repositorio.buscarTemaPorSlug(datos.tema);
    if (!tema) throw new ErrorDeNegocio('El tema no existe', 404);

    try {
      const { id } = await repositorio.crearPublicacion({
        temaId: tema.id,
        usuarioId,
        titulo: datos.titulo.trim(),
        cuerpo: datos.cuerpo.trim()
      });
      return repositorio.buscarPublicacionPorId(id);
    } catch (err) {
      if (err.code === CODIGO_VIOLACION_UNICIDAD) {
        throw new ErrorDeNegocio('Ya existe una publicacion con ese titulo en este tema', 409);
      }
      throw err;
    }
  };

  const comentar = async (usuarioId, publicacionId, datos = {}) => {
    const id = exigirEnteroPositivo(publicacionId, 'Identificador de publicacion invalido');

    const errores = validarComentario(datos);
    if (errores.length) throw new ErrorDeNegocio(errores[0], 400);

    if (!(await repositorio.buscarPublicacionPorId(id))) {
      throw new ErrorDeNegocio('La publicacion no existe', 404);
    }

    return repositorio.crearComentario({
      publicacionId: id,
      usuarioId,
      cuerpo: datos.cuerpo.trim()
    });
  };

  const reaccionar = async (usuarioId, publicacionId, valor) => {
    const id = exigirEnteroPositivo(publicacionId, 'Identificador de publicacion invalido');

    const voto = Number(valor);
    if (voto !== ME_GUSTA && voto !== NO_ME_GUSTA) {
      throw new ErrorDeNegocio('La reaccion solo puede ser 1 o -1', 400);
    }

    if (!(await repositorio.buscarPublicacionPorId(id))) {
      throw new ErrorDeNegocio('La publicacion no existe', 404);
    }

    const { reaccion } = await repositorio.registrarReaccion({
      publicacionId: id,
      usuarioId,
      valor: voto
    });

    const publicacion = await repositorio.buscarPublicacionPorId(id);
    return {
      mi_reaccion: reaccion,
      likes: Number(publicacion.likes),
      dislikes: Number(publicacion.dislikes)
    };
  };

  return {
    listarTemas,
    listarPublicaciones,
    obtenerPublicacion,
    crearPublicacion,
    comentar,
    reaccionar
  };
}

module.exports = {
  crearForoService,
  foroService: crearForoService(),
  calcularHuella,
  ME_GUSTA,
  NO_ME_GUSTA,
  ORDENES_VALIDOS
};
