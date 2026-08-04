/**
 * Lógica de negocio de usuarios: validación, hash de contraseñas y emisión de
 * tokens. No conoce Express ni SQL.
 *
 * El servicio se construye mediante una fábrica que recibe sus dependencias, de
 * modo que las pruebas unitarias pueden inyectar un repositorio falso y no
 * necesitan una base de datos real. Es la aplicación concreta del Service Layer
 * y del Repository propuestos en el ADR-06.
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const usuarioRepository = require('../repositories/usuario.repository');
const { validarRegistro, validarLogin } = require('../utils/validadores');
const { ErrorDeNegocio } = require('../utils/errores');

// Punto de sensibilidad S-01 de la evaluación ATAM: cada unidad que se le suma
// duplica el trabajo de cómputo, y bcryptjs lo ejecuta en el hilo principal.
const RONDAS_BCRYPT = Number(process.env.BCRYPT_ROUNDS || 10);
const EXPIRACION_TOKEN = process.env.JWT_EXPIRES_IN || '7d';

const CODIGO_VIOLACION_UNICIDAD = '23505';

function crearUsuarioService({
  repositorio = usuarioRepository,
  hashear = (texto) => bcrypt.hash(texto, RONDAS_BCRYPT),
  comparar = (texto, hashGuardado) => bcrypt.compare(texto, hashGuardado),
  firmarToken = (payload) => jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: EXPIRACION_TOKEN })
} = {}) {

  const registrar = async (datos) => {
    const errores = validarRegistro(datos);
    if (errores.length) throw new ErrorDeNegocio(errores[0], 400);

    const passwordHash = await hashear(datos.password);

    try {
      return await repositorio.crear({
        nombre: datos.nombre.trim(),
        correo: datos.correo.trim().toLowerCase(),
        passwordHash
      });
    } catch (err) {
      if (err.code === CODIGO_VIOLACION_UNICIDAD) {
        throw new ErrorDeNegocio('El correo ya esta registrado', 409);
      }
      throw err;
    }
  };

  const autenticar = async (datos) => {
    const errores = validarLogin(datos);
    if (errores.length) throw new ErrorDeNegocio(errores[0], 400);

    const usuario = await repositorio.buscarPorCorreo(datos.correo.trim().toLowerCase());

    // Se responde lo mismo cuando el correo no existe y cuando la contraseña no
    // coincide, para no revelar qué correos están registrados.
    const credencialesInvalidas = new ErrorDeNegocio('Credenciales incorrectas', 401);
    if (!usuario) throw credencialesInvalidas;

    const valida = await comparar(datos.password, usuario.password_hash);
    if (!valida) throw credencialesInvalidas;

    const token = firmarToken({ id: usuario.id, correo: usuario.correo });
    return { token, usuario: { id: usuario.id, nombre: usuario.nombre } };
  };

  const obtenerPerfil = async (usuarioId) => {
    const perfil = await repositorio.buscarPerfilPorId(usuarioId);
    if (!perfil) throw new ErrorDeNegocio('Usuario no encontrado', 404);
    return perfil;
  };

  const listarFavoritos = (usuarioId) => repositorio.listarFavoritos(usuarioId);

  const agregarFavorito = async (usuarioId, mangaId) => {
    if (!Number.isInteger(Number(mangaId))) {
      throw new ErrorDeNegocio('Identificador de manga invalido', 400);
    }
    await repositorio.agregarFavorito(usuarioId, mangaId);
  };

  return { registrar, autenticar, obtenerPerfil, listarFavoritos, agregarFavorito };
}

module.exports = {
  crearUsuarioService,
  usuarioService: crearUsuarioService(),
  RONDAS_BCRYPT
};
