/**
 * Listas de lectura, follows con avisos y marcadores del lector.
 */

const bibliotecaRepository = require('../repositories/biblioteca.repository');
const { ErrorDeNegocio } = require('../utils/errores');
const { validarMarcador, validarEstadoLista } = require('../utils/validadores');

const exigirEnteroPositivo = (valor, mensaje) => {
  const numero = Number(valor);
  if (!Number.isInteger(numero) || numero <= 0) {
    throw new ErrorDeNegocio(mensaje, 400);
  }
  return numero;
};

function crearBibliotecaService({ repositorio = bibliotecaRepository } = {}) {

  const listarListas = async (usuarioId, estado) => {
    if (estado) {
      const errores = validarEstadoLista(estado);
      if (errores.length) throw new ErrorDeNegocio(errores[0], 400);
      return repositorio.listarPorEstado(usuarioId, estado);
    }
    return repositorio.listarTodas(usuarioId);
  };

  const guardarEnLista = async (usuarioId, mangaId, estado) => {
    const id = exigirEnteroPositivo(mangaId, 'Identificador de manga invalido');
    const errores = validarEstadoLista(estado);
    if (errores.length) throw new ErrorDeNegocio(errores[0], 400);
    if (!(await repositorio.mangaExiste(id))) {
      throw new ErrorDeNegocio('El manga no existe', 404);
    }
    return repositorio.guardarEnLista(usuarioId, id, estado);
  };

  const quitarDeLista = async (usuarioId, mangaId) => {
    const id = exigirEnteroPositivo(mangaId, 'Identificador de manga invalido');
    if (!(await repositorio.quitarDeLista(usuarioId, id))) {
      throw new ErrorDeNegocio('Ese manga no esta en tu lista', 404);
    }
  };

  const estadoDeManga = async (usuarioId, mangaId) => {
    const id = exigirEnteroPositivo(mangaId, 'Identificador de manga invalido');
    const fila = await repositorio.buscarEntradaLista(usuarioId, id);
    const siguiendo = await repositorio.estaSiguiendo(usuarioId, id);
    return { estado: fila?.estado || null, siguiendo };
  };

  const seguir = async (usuarioId, mangaId) => {
    const id = exigirEnteroPositivo(mangaId, 'Identificador de manga invalido');
    if (!(await repositorio.mangaExiste(id))) {
      throw new ErrorDeNegocio('El manga no existe', 404);
    }
    await repositorio.seguirManga(usuarioId, id);
  };

  const dejarDeSeguir = async (usuarioId, mangaId) => {
    const id = exigirEnteroPositivo(mangaId, 'Identificador de manga invalido');
    if (!(await repositorio.dejarDeSeguir(usuarioId, id))) {
      throw new ErrorDeNegocio('No seguías ese manga', 404);
    }
  };

  const listarSeguidos = (usuarioId) => repositorio.listarSeguidos(usuarioId);

  const listarAvisos = (usuarioId) => repositorio.listarAvisos(usuarioId);

  const listarMarcadores = (usuarioId) => repositorio.listarMarcadores(usuarioId);

  const marcadoresDeCapitulo = (usuarioId, capituloId) => {
    const id = exigirEnteroPositivo(capituloId, 'Identificador de capitulo invalido');
    return repositorio.listarMarcadoresDeCapitulo(usuarioId, id);
  };

  const crearMarcador = async (usuarioId, datos = {}) => {
    const errores = validarMarcador(datos);
    if (errores.length) throw new ErrorDeNegocio(errores[0], 400);

    const capituloId = exigirEnteroPositivo(datos.capituloId, 'Identificador de capitulo invalido');
    const pagina = Number(datos.pagina);
    const capitulo = await repositorio.capituloExiste(capituloId);
    if (!capitulo) throw new ErrorDeNegocio('El capitulo no existe', 404);
    if (pagina > capitulo.total_paginas) {
      throw new ErrorDeNegocio('Esa pagina no existe en el capitulo', 400);
    }

    return repositorio.crearMarcador({
      usuarioId,
      capituloId,
      pagina,
      nota: datos.nota ? String(datos.nota).trim().slice(0, 200) : null
    });
  };

  const borrarMarcador = async (usuarioId, marcadorId) => {
    const id = exigirEnteroPositivo(marcadorId, 'Identificador de marcador invalido');
    if (!(await repositorio.borrarMarcador(usuarioId, id))) {
      throw new ErrorDeNegocio('El marcador no existe', 404);
    }
  };

  return {
    listarListas,
    guardarEnLista,
    quitarDeLista,
    estadoDeManga,
    seguir,
    dejarDeSeguir,
    listarSeguidos,
    listarAvisos,
    listarMarcadores,
    marcadoresDeCapitulo,
    crearMarcador,
    borrarMarcador
  };
}

module.exports = {
  crearBibliotecaService,
  bibliotecaService: crearBibliotecaService()
};
