const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const {
  generarPortadaSVG,
  paletaDe,
  slugPortada,
  PALETA_POR_DEFECTO
} = require('../src/services/cover.service');

describe('paletaDe', () => {
  test('devuelve la paleta propia de un titulo conocido', () => {
    const [fondo, medio, acento] = paletaDe('Attack on Titan');
    assert.equal(fondo, '#141414');
    assert.equal(medio, '#5c1010');
    assert.equal(acento, '#c4a35a');
  });

  test('devuelve una paleta derivada (no la por defecto) para un titulo desconocido', () => {
    const paleta = paletaDe('Un manga que no existe');
    assert.equal(paleta.length, 3);
    assert.notDeepEqual(paleta, PALETA_POR_DEFECTO);
    assert.match(paleta[0], /^hsl\(/);
  });
});

describe('slugPortada', () => {
  test('normaliza el titulo a un nombre de archivo seguro', () => {
    assert.equal(slugPortada("JoJo's Bizarre Adventure"), 'jojo-s-bizarre-adventure');
    assert.equal(slugPortada('Spy x Family'), 'spy-x-family');
  });
});

describe('generarPortadaSVG', () => {
  test('genera un documento SVG con las dimensiones de una portada', () => {
    const svg = generarPortadaSVG('Naruto');
    assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
    assert.match(svg, /width="400"/);
    assert.match(svg, /height="560"/);
  });

  test('incluye el titulo y su inicial en mayuscula', () => {
    const svg = generarPortadaSVG('one piece');
    assert.ok(svg.includes('one piece'), 'el titulo debe aparecer en el SVG');
    assert.ok(svg.includes('>O<'), 'la inicial debe ir en mayuscula');
  });

  test('aplica el color de acento del titulo', () => {
    const svg = generarPortadaSVG('Demon Slayer');
    assert.ok(svg.includes('#f0c27b'));
  });

  test('escapa los caracteres especiales de XML para no permitir inyeccion', () => {
    const titulo = '<script>alert(1)</script>';
    const svg = generarPortadaSVG(titulo);
    assert.ok(!svg.includes('<script>'), 'no debe quedar una etiqueta script viva');
    assert.ok(svg.includes('&lt;script&gt;'), 'debe quedar escapada');
  });

  test('genera siempre el mismo resultado para el mismo titulo', () => {
    assert.equal(generarPortadaSVG('Dragon Ball'), generarPortadaSVG('Dragon Ball'));
  });
});
