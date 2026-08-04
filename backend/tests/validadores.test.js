const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const {
  validarRegistro,
  validarLogin,
  esCorreoValido,
  esPasswordValida
} = require('../src/utils/validadores');

describe('esCorreoValido', () => {
  test('acepta un correo con dominio y extension', () => {
    // Arrange
    const correo = 'roberto@gmail.com';

    // Act
    const resultado = esCorreoValido(correo);

    // Assert
    assert.equal(resultado, true);
  });

  test('rechaza un correo sin extension de dominio', () => {
    // Arrange
    const correo = 'roberto@gmail';

    // Act
    const resultado = esCorreoValido(correo);

    // Assert
    assert.equal(resultado, false);
  });

  test('rechaza un correo con espacios', () => {
    // Arrange
    const correo = 'rober to@gmail.com';

    // Act
    const resultado = esCorreoValido(correo);

    // Assert
    assert.equal(resultado, false);
  });

  test('rechaza un valor ausente', () => {
    // Arrange
    const correo = undefined;

    // Act
    const resultado = esCorreoValido(correo);

    // Assert
    assert.equal(resultado, false);
  });
});

describe('esPasswordValida', () => {
  test('acepta una contrasena de seis caracteres', () => {
    // Arrange
    const password = 'abc123';

    // Act
    const resultado = esPasswordValida(password);

    // Assert
    assert.equal(resultado, true);
  });

  test('rechaza una contrasena de cinco caracteres', () => {
    // Arrange
    const password = 'abc12';

    // Act
    const resultado = esPasswordValida(password);

    // Assert
    assert.equal(resultado, false);
  });
});

describe('validarRegistro', () => {
  test('no devuelve errores cuando los tres datos son validos', () => {
    // Arrange
    const datos = { nombre: 'Roberto', correo: 'roberto@gmail.com', password: 'secreto123' };

    // Act
    const errores = validarRegistro(datos);

    // Assert
    assert.deepEqual(errores, []);
  });

  test('reporta un error por cada campo faltante', () => {
    // Arrange
    const datos = {};

    // Act
    const errores = validarRegistro(datos);

    // Assert
    assert.equal(errores.length, 3);
  });

  test('reporta solo la contrasena cuando es el unico dato invalido', () => {
    // Arrange
    const datos = { nombre: 'Roberto', correo: 'roberto@gmail.com', password: '123' };

    // Act
    const errores = validarRegistro(datos);

    // Assert
    assert.equal(errores.length, 1);
    assert.match(errores[0], /contrasena/i);
  });
});

describe('validarLogin', () => {
  test('no devuelve errores con correo valido y contrasena presente', () => {
    // Arrange
    const datos = { correo: 'roberto@gmail.com', password: 'x' };

    // Act
    const errores = validarLogin(datos);

    // Assert
    assert.deepEqual(errores, []);
  });

  test('no exige longitud minima en el login, solo que la contrasena exista', () => {
    // Arrange
    const datos = { correo: 'roberto@gmail.com', password: '' };

    // Act
    const errores = validarLogin(datos);

    // Assert
    assert.equal(errores.length, 1);
  });
});
