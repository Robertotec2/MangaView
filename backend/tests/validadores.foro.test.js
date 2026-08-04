const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const {
  validarPublicacion,
  validarComentario,
  LONGITUD_MAXIMA_TITULO,
  LONGITUD_MAXIMA_CUERPO,
  LONGITUD_MAXIMA_COMENTARIO
} = require('../src/utils/validadores');

const publicacionValida = {
  tema: 'discusiones',
  titulo: 'Un titulo con sentido',
  cuerpo: 'Un cuerpo con suficiente contenido para pasar la validacion.'
};

describe('validarPublicacion', () => {
  test('no encuentra errores en una publicacion correcta', () => {
    // Arrange
    const datos = { ...publicacionValida };

    // Act
    const errores = validarPublicacion(datos);

    // Assert
    assert.deepEqual(errores, []);
  });

  test('exige que se elija un tema', () => {
    // Arrange
    const datos = { ...publicacionValida, tema: '' };

    // Act
    const errores = validarPublicacion(datos);

    // Assert
    assert.match(errores.join(' '), /tema/i);
  });

  test('rechaza un titulo demasiado corto', () => {
    // Arrange
    const datos = { ...publicacionValida, titulo: 'ab' };

    // Act
    const errores = validarPublicacion(datos);

    // Assert
    assert.match(errores.join(' '), /titulo/i);
  });

  test('rechaza un titulo que no cabe en la columna', () => {
    // Arrange
    const datos = { ...publicacionValida, titulo: 'a'.repeat(LONGITUD_MAXIMA_TITULO + 1) };

    // Act
    const errores = validarPublicacion(datos);

    // Assert
    assert.equal(errores.length, 1);
    assert.match(errores[0], new RegExp(String(LONGITUD_MAXIMA_TITULO)));
  });

  test('acepta un titulo que ocupa exactamente el maximo', () => {
    // Arrange
    const datos = { ...publicacionValida, titulo: 'a'.repeat(LONGITUD_MAXIMA_TITULO) };

    // Act
    const errores = validarPublicacion(datos);

    // Assert
    assert.deepEqual(errores, []);
  });

  test('un titulo de solo espacios cuenta como vacio', () => {
    // Arrange
    const datos = { ...publicacionValida, titulo: '          ' };

    // Act
    const errores = validarPublicacion(datos);

    // Assert
    assert.match(errores.join(' '), /obligatorio/i);
  });

  test('rechaza un cuerpo demasiado corto', () => {
    // Arrange
    const datos = { ...publicacionValida, cuerpo: 'corto' };

    // Act
    const errores = validarPublicacion(datos);

    // Assert
    assert.match(errores.join(' '), /contenido/i);
  });

  test('rechaza un cuerpo que pasa del maximo', () => {
    // Arrange
    const datos = { ...publicacionValida, cuerpo: 'a'.repeat(LONGITUD_MAXIMA_CUERPO + 1) };

    // Act
    const errores = validarPublicacion(datos);

    // Assert
    assert.equal(errores.length, 1);
  });

  test('acumula todos los errores de una publicacion vacia', () => {
    // Arrange
    const datos = {};

    // Act
    const errores = validarPublicacion(datos);

    // Assert
    assert.equal(errores.length, 3);
  });

  test('no falla cuando no recibe ningun argumento', () => {
    // Arrange y Act
    const errores = validarPublicacion();

    // Assert
    assert.equal(errores.length, 3);
  });
});

describe('validarComentario', () => {
  test('acepta un comentario con contenido', () => {
    // Arrange
    const datos = { cuerpo: 'Estoy de acuerdo con lo que dices.' };

    // Act
    const errores = validarComentario(datos);

    // Assert
    assert.deepEqual(errores, []);
  });

  test('rechaza un comentario vacio', () => {
    // Arrange
    const datos = { cuerpo: '' };

    // Act
    const errores = validarComentario(datos);

    // Assert
    assert.equal(errores.length, 1);
  });

  test('rechaza un comentario de solo espacios y saltos de linea', () => {
    // Arrange
    const datos = { cuerpo: '   \n\n   ' };

    // Act
    const errores = validarComentario(datos);

    // Assert
    assert.equal(errores.length, 1);
  });

  test('rechaza un comentario que pasa del maximo', () => {
    // Arrange
    const datos = { cuerpo: 'a'.repeat(LONGITUD_MAXIMA_COMENTARIO + 1) };

    // Act
    const errores = validarComentario(datos);

    // Assert
    assert.match(errores[0], new RegExp(String(LONGITUD_MAXIMA_COMENTARIO)));
  });

  test('no falla cuando no recibe ningun argumento', () => {
    // Arrange y Act
    const errores = validarComentario();

    // Assert
    assert.equal(errores.length, 1);
  });
});
