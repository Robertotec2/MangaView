const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const {
  generarPortadaSVG,
  paletaDe,
  PALETA_POR_DEFECTO
} = require('../src/services/cover.service');

describe('paletaDe', () => {
  test('devuelve la paleta propia de un titulo conocido', () => {
    // Arrange
    const titulo = 'Attack on Titan';

    // Act
    const [fondo, acento] = paletaDe(titulo);

    // Assert
    assert.equal(fondo, '#2c2c2c');
    assert.equal(acento, '#8B0000');
  });

  test('devuelve la paleta por defecto para un titulo desconocido', () => {
    // Arrange
    const titulo = 'Un manga que no existe';

    // Act
    const paleta = paletaDe(titulo);

    // Assert
    assert.deepEqual(paleta, PALETA_POR_DEFECTO);
  });
});

describe('generarPortadaSVG', () => {
  test('genera un documento SVG con las dimensiones de una portada', () => {
    // Arrange
    const titulo = 'Naruto';

    // Act
    const svg = generarPortadaSVG(titulo);

    // Assert
    assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
    assert.match(svg, /width="200"/);
    assert.match(svg, /height="280"/);
  });

  test('incluye el titulo y su inicial en mayuscula', () => {
    // Arrange
    const titulo = 'one piece';

    // Act
    const svg = generarPortadaSVG(titulo);

    // Assert
    assert.ok(svg.includes('one piece'), 'el titulo debe aparecer en el SVG');
    assert.ok(svg.includes('>O<'), 'la inicial debe ir en mayuscula');
  });

  test('aplica el color de acento del titulo', () => {
    // Arrange
    const titulo = 'Demon Slayer';

    // Act
    const svg = generarPortadaSVG(titulo);

    // Assert
    assert.ok(svg.includes('#9B59B6'));
  });

  test('escapa los caracteres especiales de XML para no permitir inyeccion', () => {
    // Arrange
    // El titulo llega desde la URL y la respuesta se sirve como image/svg+xml,
    // que el navegador puede ejecutar si se abre de forma directa.
    const titulo = '<script>alert(1)</script>';

    // Act
    const svg = generarPortadaSVG(titulo);

    // Assert
    assert.ok(!svg.includes('<script>'), 'no debe quedar una etiqueta script viva');
    assert.ok(svg.includes('&lt;script&gt;'), 'debe quedar escapada');
  });

  test('genera siempre el mismo resultado para el mismo titulo', () => {
    // Arrange
    const titulo = 'Dragon Ball';

    // Act
    const primera = generarPortadaSVG(titulo);
    const segunda = generarPortadaSVG(titulo);

    // Assert
    assert.equal(primera, segunda);
  });
});
