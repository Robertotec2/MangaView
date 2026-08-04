const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const {
  generarPaginaSVG,
  maquetaDe,
  MAQUETAS,
  ANCHO,
  ALTO
} = require('../src/services/pagina.service');

describe('maquetaDe', () => {
  test('la primera pagina usa la primera maqueta', () => {
    // Arrange
    const orden = 1;

    // Act
    const maqueta = maquetaDe(orden);

    // Assert
    assert.deepEqual(maqueta, MAQUETAS[0]);
  });

  test('paginas consecutivas usan maquetas distintas', () => {
    // Arrange
    const primera = 1;
    const segunda = 2;

    // Act
    const maquetaPrimera = maquetaDe(primera);
    const maquetaSegunda = maquetaDe(segunda);

    // Assert
    assert.notDeepEqual(maquetaPrimera, maquetaSegunda);
  });

  test('las maquetas se repiten en ciclo al agotarse', () => {
    // Arrange
    const orden = MAQUETAS.length + 1;

    // Act
    const maqueta = maquetaDe(orden);

    // Assert
    assert.deepEqual(maqueta, MAQUETAS[0]);
  });

  test('ningun orden invalido rompe la seleccion de maqueta', () => {
    // Arrange
    const ordenesInvalidos = [0, -3];

    // Act
    const resultados = ordenesInvalidos.map(maquetaDe);

    // Assert
    for (const maqueta of resultados) {
      assert.ok(Array.isArray(maqueta), 'siempre debe devolver una maqueta');
    }
  });

  test('todas las vinetas caben dentro del lienzo', () => {
    // Arrange
    const todasLasVinetas = MAQUETAS.flat();

    // Act
    const desbordadas = todasLasVinetas.filter(
      ([x, y, ancho, alto]) => x + ancho > ANCHO || y + alto > ALTO
    );

    // Assert
    assert.deepEqual(desbordadas, [], 'ninguna vineta debe salirse de la pagina');
  });
});

describe('generarPaginaSVG', () => {
  test('genera un documento SVG con las dimensiones de una pagina', () => {
    // Arrange
    const titulo = 'Naruto';

    // Act
    const svg = generarPaginaSVG(titulo, 1, 1, 3);

    // Assert
    assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
    assert.match(svg, new RegExp(`width="${ANCHO}"`));
    assert.match(svg, new RegExp(`height="${ALTO}"`));
  });

  test('incluye el titulo y el numero de capitulo en la cabecera', () => {
    // Arrange
    const titulo = 'One Piece';

    // Act
    const svg = generarPaginaSVG(titulo, 7, 2, 5);

    // Assert
    assert.ok(svg.includes('One Piece'), 'el titulo debe aparecer en la pagina');
    assert.ok(svg.includes('Capitulo 7'), 'el capitulo debe aparecer en la pagina');
  });

  test('muestra el total en el pie cuando se conoce', () => {
    // Arrange
    const total = 3;

    // Act
    const svg = generarPaginaSVG('Naruto', 1, 2, total);

    // Assert
    assert.ok(svg.includes('>2 / 3<'), 'el pie debe indicar la pagina y el total');
  });

  test('omite el total en el pie cuando no se conoce', () => {
    // Arrange
    const sinTotal = undefined;

    // Act
    const svg = generarPaginaSVG('Naruto', 1, 2, sinTotal);

    // Assert
    assert.ok(!svg.includes(' / '), 'no debe inventar un total');
    assert.ok(svg.includes('>2<'), 'debe mostrar solo el numero de pagina');
  });

  test('aplica el color del manga a las vinetas', () => {
    // Arrange
    const titulo = 'Demon Slayer';

    // Act
    const svg = generarPaginaSVG(titulo, 1, 1, 1);

    // Assert
    assert.ok(svg.includes('#1a0a2e'), 'debe usar el color de fondo del manga');
  });

  test('escapa los caracteres especiales de XML para no permitir inyeccion', () => {
    // Arrange
    // El titulo y el capitulo llegan desde la URL y la respuesta se sirve como
    // image/svg+xml, que el navegador puede ejecutar si se abre de forma directa.
    const titulo = '<script>alert(1)</script>';

    // Act
    const svg = generarPaginaSVG(titulo, '"><script>', 1, 1);

    // Assert
    assert.ok(!svg.includes('<script>'), 'no debe quedar una etiqueta script viva');
    assert.ok(svg.includes('&lt;script&gt;'), 'debe quedar escapada');
  });

  test('genera siempre el mismo resultado para las mismas entradas', () => {
    // Arrange
    const entradas = ['Dragon Ball', 2, 3, 4];

    // Act
    const primera = generarPaginaSVG(...entradas);
    const segunda = generarPaginaSVG(...entradas);

    // Assert
    assert.equal(primera, segunda);
  });

  test('dos paginas del mismo capitulo generan imagenes distintas', () => {
    // Arrange
    const titulo = 'Attack on Titan';

    // Act
    const primera = generarPaginaSVG(titulo, 1, 1, 2);
    const segunda = generarPaginaSVG(titulo, 1, 2, 2);

    // Assert
    assert.notEqual(primera, segunda, 'el lector no debe mostrar la misma imagen');
  });
});
