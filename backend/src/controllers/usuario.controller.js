/**
 * Controlador de usuarios: solo traduce entre HTTP y el servicio.
 *
 * Ya no contiene SQL, ni hashing, ni emisión de tokens. Tampoco devuelve al
 * cliente el mensaje interno de PostgreSQL: los errores previstos llegan con su
 * propio estado y los imprevistos se registran en el servidor y se responden de
 * forma genérica.
 */

const { usuarioService } = require('../services/usuario.service');
const { ErrorDeNegocio } = require('../utils/errores');

const responderError = (res, err) => {
  if (err instanceof ErrorDeNegocio) {
    return res.status(err.estado).json({ error: err.message });
  }
  console.error('Error inesperado en usuario.controller:', err);
  return res.status(500).json({ error: 'Error interno del servidor' });
};

const registro = async (req, res) => {
  try {
    const usuario = await usuarioService.registrar(req.body);
    res.status(201).json(usuario);
  } catch (err) {
    responderError(res, err);
  }
};

const login = async (req, res) => {
  try {
    const sesion = await usuarioService.autenticar(req.body);
    res.json(sesion);
  } catch (err) {
    responderError(res, err);
  }
};

const perfil = async (req, res) => {
  try {
    res.json(await usuarioService.obtenerPerfil(req.usuario.id));
  } catch (err) {
    responderError(res, err);
  }
};

const favoritos = async (req, res) => {
  try {
    res.json(await usuarioService.listarFavoritos(req.usuario.id));
  } catch (err) {
    responderError(res, err);
  }
};

const agregarFavorito = async (req, res) => {
  try {
    await usuarioService.agregarFavorito(req.usuario.id, req.params.mangaId);
    res.json({ mensaje: 'Agregado a favoritos' });
  } catch (err) {
    responderError(res, err);
  }
};

module.exports = { registro, login, perfil, favoritos, agregarFavorito };
