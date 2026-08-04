/**
 * Controlador del foro: solo traduce entre HTTP y el servicio.
 */

const { foroService } = require('../services/foro.service');
const { ErrorDeNegocio } = require('../utils/errores');

const responderError = (res, err) => {
  if (err instanceof ErrorDeNegocio) {
    return res.status(err.estado).json({ error: err.message });
  }
  console.error('Error inesperado en foro.controller:', err);
  return res.status(500).json({ error: 'Error interno del servidor' });
};

const visitanteDe = (req) => ({
  usuarioId: req.usuario?.id || null,
  ip: req.ip,
  agente: req.headers['user-agent']
});

const temas = async (req, res) => {
  try {
    res.json(await foroService.listarTemas());
  } catch (err) {
    responderError(res, err);
  }
};

const publicaciones = async (req, res) => {
  try {
    res.json(await foroService.listarPublicaciones({
      tema: req.query.tema,
      buscar: req.query.buscar,
      orden: req.query.orden
    }));
  } catch (err) {
    responderError(res, err);
  }
};

const publicacion = async (req, res) => {
  try {
    res.json(await foroService.obtenerPublicacion(req.params.id, visitanteDe(req)));
  } catch (err) {
    responderError(res, err);
  }
};

const crearPublicacion = async (req, res) => {
  try {
    const creada = await foroService.crearPublicacion(req.usuario.id, req.body);
    res.status(201).json(creada);
  } catch (err) {
    responderError(res, err);
  }
};

const editarPublicacion = async (req, res) => {
  try {
    res.json(await foroService.editarPublicacion(req.usuario.id, req.params.id, req.body));
  } catch (err) {
    responderError(res, err);
  }
};

const borrarPublicacion = async (req, res) => {
  try {
    await foroService.borrarPublicacion(req.usuario.id, req.params.id);
    res.json({ mensaje: 'Publicacion eliminada' });
  } catch (err) {
    responderError(res, err);
  }
};

const comentar = async (req, res) => {
  try {
    const comentario = await foroService.comentar(req.usuario.id, req.params.id, req.body);
    res.status(201).json(comentario);
  } catch (err) {
    responderError(res, err);
  }
};

const editarComentario = async (req, res) => {
  try {
    res.json(await foroService.editarComentario(req.usuario.id, req.params.comentarioId, req.body));
  } catch (err) {
    responderError(res, err);
  }
};

const borrarComentario = async (req, res) => {
  try {
    await foroService.borrarComentario(req.usuario.id, req.params.comentarioId);
    res.json({ mensaje: 'Comentario eliminado' });
  } catch (err) {
    responderError(res, err);
  }
};

const reaccionar = async (req, res) => {
  try {
    res.json(await foroService.reaccionar(req.usuario.id, req.params.id, req.body.valor));
  } catch (err) {
    responderError(res, err);
  }
};

const reportar = async (req, res) => {
  try {
    const reporte = await foroService.reportar(req.usuario.id, req.body);
    res.status(201).json(reporte);
  } catch (err) {
    responderError(res, err);
  }
};

module.exports = {
  temas,
  publicaciones,
  publicacion,
  crearPublicacion,
  editarPublicacion,
  borrarPublicacion,
  comentar,
  editarComentario,
  borrarComentario,
  reaccionar,
  reportar
};
