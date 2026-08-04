/**
 * Controlador del foro: solo traduce entre HTTP y el servicio.
 *
 * No contiene SQL ni reglas de negocio. Su única decisión propia es de dónde
 * sacar los datos del visitante para contar las vistas, porque eso sí depende
 * de la petición HTTP.
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

const comentar = async (req, res) => {
  try {
    const comentario = await foroService.comentar(req.usuario.id, req.params.id, req.body);
    res.status(201).json(comentario);
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

module.exports = { temas, publicaciones, publicacion, crearPublicacion, comentar, reaccionar };
