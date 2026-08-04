const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'secreto-solo-para-pruebas';

const { verificarToken, identificarUsuario } = require('../src/middleware/auth');

/** Doble de prueba de la respuesta de Express: guarda lo que se le pide. */
const crearRes = () => ({
  estado: null,
  cuerpo: null,
  status(codigo) {
    this.estado = codigo;
    return this;
  },
  json(objeto) {
    this.cuerpo = objeto;
    return this;
  }
});

describe('verificarToken', () => {
  test('rechaza la peticion cuando no hay cabecera de autorizacion', () => {
    // Arrange
    const req = { headers: {} };
    const res = crearRes();
    let siguienteInvocado = false;
    const next = () => { siguienteInvocado = true; };

    // Act
    verificarToken(req, res, next);

    // Assert
    assert.equal(res.estado, 401);
    assert.equal(res.cuerpo.error, 'Token requerido');
    assert.equal(siguienteInvocado, false);
  });

  test('rechaza la peticion cuando el token esta firmado con otro secreto', () => {
    // Arrange
    const tokenAjeno = jwt.sign({ id: 1 }, 'otro-secreto');
    const req = { headers: { authorization: `Bearer ${tokenAjeno}` } };
    const res = crearRes();
    let siguienteInvocado = false;
    const next = () => { siguienteInvocado = true; };

    // Act
    verificarToken(req, res, next);

    // Assert
    assert.equal(res.estado, 401);
    assert.equal(res.cuerpo.error, 'Token inválido');
    assert.equal(siguienteInvocado, false);
  });

  test('rechaza la peticion cuando el token ya expiro', () => {
    // Arrange
    const tokenExpirado = jwt.sign({ id: 1 }, process.env.JWT_SECRET, { expiresIn: '-1s' });
    const req = { headers: { authorization: `Bearer ${tokenExpirado}` } };
    const res = crearRes();
    let siguienteInvocado = false;
    const next = () => { siguienteInvocado = true; };

    // Act
    verificarToken(req, res, next);

    // Assert
    assert.equal(res.estado, 401);
    assert.equal(siguienteInvocado, false);
  });

  test('deja pasar un token valido y expone el usuario en la peticion', () => {
    // Arrange
    const token = jwt.sign({ id: 7, correo: 'roberto@gmail.com' }, process.env.JWT_SECRET);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = crearRes();
    let siguienteInvocado = false;
    const next = () => { siguienteInvocado = true; };

    // Act
    verificarToken(req, res, next);

    // Assert
    assert.equal(siguienteInvocado, true);
    assert.equal(res.estado, null, 'no debe responder nada si el token es valido');
    assert.equal(req.usuario.id, 7);
    assert.equal(req.usuario.correo, 'roberto@gmail.com');
  });
});

/**
 * Este middleware protege rutas públicas del foro, así que la propiedad
 * importante es la contraria a la de `verificarToken`: nunca debe cortar la
 * petición, pero tampoco debe dar por buena una sesión que no lo es.
 */
describe('identificarUsuario', () => {
  test('deja pasar sin usuario cuando no hay cabecera de autorizacion', () => {
    // Arrange
    const req = { headers: {} };
    const res = crearRes();
    let siguienteInvocado = false;
    const next = () => { siguienteInvocado = true; };

    // Act
    identificarUsuario(req, res, next);

    // Assert
    assert.equal(siguienteInvocado, true);
    assert.equal(res.estado, null);
    assert.equal(req.usuario, undefined);
  });

  test('expone el usuario cuando el token es valido', () => {
    // Arrange
    const token = jwt.sign({ id: 21, correo: 'yuki@demo.mangaview' }, process.env.JWT_SECRET);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = crearRes();
    let siguienteInvocado = false;
    const next = () => { siguienteInvocado = true; };

    // Act
    identificarUsuario(req, res, next);

    // Assert
    assert.equal(siguienteInvocado, true);
    assert.equal(req.usuario.id, 21);
  });

  test('trata un token firmado con otro secreto como si no hubiera sesion', () => {
    // Arrange
    const tokenAjeno = jwt.sign({ id: 99 }, 'otro-secreto');
    const req = { headers: { authorization: `Bearer ${tokenAjeno}` } };
    const res = crearRes();
    let siguienteInvocado = false;
    const next = () => { siguienteInvocado = true; };

    // Act
    identificarUsuario(req, res, next);

    // Assert
    assert.equal(siguienteInvocado, true, 'la ruta es publica: no debe cortarse');
    assert.equal(req.usuario, undefined, 'un token invalido no puede otorgar identidad');
  });

  test('trata un token expirado como si no hubiera sesion', () => {
    // Arrange
    const tokenExpirado = jwt.sign({ id: 5 }, process.env.JWT_SECRET, { expiresIn: '-1s' });
    const req = { headers: { authorization: `Bearer ${tokenExpirado}` } };
    const res = crearRes();
    let siguienteInvocado = false;
    const next = () => { siguienteInvocado = true; };

    // Act
    identificarUsuario(req, res, next);

    // Assert
    assert.equal(siguienteInvocado, true);
    assert.equal(req.usuario, undefined);
  });
});
