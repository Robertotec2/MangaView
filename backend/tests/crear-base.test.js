const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const { citarIdentificador } = require('../src/db/crear-base');

describe('citarIdentificador', () => {
  test('cita el nombre de la base de datos', () => {
    // Arrange
    const nombre = 'mangaview';

    // Act
    const citado = citarIdentificador(nombre);

    // Assert
    assert.equal(citado, '"mangaview"');
  });

  test('duplica las comillas dobles para que no se pueda cerrar el identificador', () => {
    // Arrange
    // CREATE DATABASE no admite parametros, asi que el nombre se interpola. Si
    // llegara con una comilla doble podria cerrar el identificador y añadir
    // sentencias, de modo que la comilla tiene que quedar escapada.
    const nombre = 'mangaview"; DROP DATABASE postgres; --';

    // Act
    const citado = citarIdentificador(nombre);

    // Assert
    assert.ok(citado.startsWith('"'), 'debe abrir con comilla doble');
    assert.ok(citado.endsWith('"'), 'debe cerrar con comilla doble');
    assert.ok(
      citado.includes('mangaview""'),
      'la comilla interna debe quedar duplicada'
    );
  });

  test('acepta un nombre con guiones y mayusculas sin alterarlo', () => {
    // Arrange
    const nombre = 'MangaView-Demo';

    // Act
    const citado = citarIdentificador(nombre);

    // Assert
    assert.equal(citado, '"MangaView-Demo"');
  });
});
