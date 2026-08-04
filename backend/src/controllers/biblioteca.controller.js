const { bibliotecaService } = require('../services/biblioteca.service');
const { ErrorDeNegocio } = require('../utils/errores');

const responderError = (res, err) => {
  if (err instanceof ErrorDeNegocio) {
    return res.status(err.estado).json({ error: err.message });
  }
  console.error('Error inesperado en biblioteca.controller:', err);
  return res.status(500).json({ error: 'Error interno del servidor' });
};

const listas = async (req, res) => {
  try {
    res.json(await bibliotecaService.listarListas(req.usuario.id, req.query.estado));
  } catch (err) {
    responderError(res, err);
  }
};

const guardarLista = async (req, res) => {
  try {
    const fila = await bibliotecaService.guardarEnLista(
      req.usuario.id, req.params.mangaId, req.body.estado
    );
    res.json(fila);
  } catch (err) {
    responderError(res, err);
  }
};

const quitarLista = async (req, res) => {
  try {
    await bibliotecaService.quitarDeLista(req.usuario.id, req.params.mangaId);
    res.json({ mensaje: 'Quitado de la lista' });
  } catch (err) {
    responderError(res, err);
  }
};

const estadoManga = async (req, res) => {
  try {
    res.json(await bibliotecaService.estadoDeManga(req.usuario.id, req.params.mangaId));
  } catch (err) {
    responderError(res, err);
  }
};

const seguir = async (req, res) => {
  try {
    await bibliotecaService.seguir(req.usuario.id, req.params.mangaId);
    res.json({ mensaje: 'Ahora sigues este manga' });
  } catch (err) {
    responderError(res, err);
  }
};

const dejarDeSeguir = async (req, res) => {
  try {
    await bibliotecaService.dejarDeSeguir(req.usuario.id, req.params.mangaId);
    res.json({ mensaje: 'Dejaste de seguir este manga' });
  } catch (err) {
    responderError(res, err);
  }
};

const seguidos = async (req, res) => {
  try {
    res.json(await bibliotecaService.listarSeguidos(req.usuario.id));
  } catch (err) {
    responderError(res, err);
  }
};

const avisos = async (req, res) => {
  try {
    res.json(await bibliotecaService.listarAvisos(req.usuario.id));
  } catch (err) {
    responderError(res, err);
  }
};

const marcadores = async (req, res) => {
  try {
    if (req.query.capituloId) {
      return res.json(
        await bibliotecaService.marcadoresDeCapitulo(req.usuario.id, req.query.capituloId)
      );
    }
    res.json(await bibliotecaService.listarMarcadores(req.usuario.id));
  } catch (err) {
    responderError(res, err);
  }
};

const crearMarcador = async (req, res) => {
  try {
    const creado = await bibliotecaService.crearMarcador(req.usuario.id, req.body);
    res.status(201).json(creado);
  } catch (err) {
    responderError(res, err);
  }
};

const borrarMarcador = async (req, res) => {
  try {
    await bibliotecaService.borrarMarcador(req.usuario.id, req.params.id);
    res.json({ mensaje: 'Marcador eliminado' });
  } catch (err) {
    responderError(res, err);
  }
};

module.exports = {
  listas,
  guardarLista,
  quitarLista,
  estadoManga,
  seguir,
  dejarDeSeguir,
  seguidos,
  avisos,
  marcadores,
  crearMarcador,
  borrarMarcador
};
