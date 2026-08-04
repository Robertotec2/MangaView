const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const { ProgresoEventEmitter } = require('../src/patterns/ProgresoObserver');

describe('ProgresoEventEmitter (patron Observer)', () => {
  test('notifica el evento a todos los observers suscritos', () => {
    // Arrange
    const emisor = new ProgresoEventEmitter();
    const recibidosPorA = [];
    const recibidosPorB = [];
    emisor.subscribe(evento => recibidosPorA.push(evento));
    emisor.subscribe(evento => recibidosPorB.push(evento));
    const evento = { usuarioId: 1, capituloId: 3, pagina: 5 };

    // Act
    emisor.emit(evento);

    // Assert
    assert.deepEqual(recibidosPorA, [evento]);
    assert.deepEqual(recibidosPorB, [evento]);
  });

  test('deja de notificar a un observer despues de darlo de baja', () => {
    // Arrange
    const emisor = new ProgresoEventEmitter();
    const recibidos = [];
    const observer = evento => recibidos.push(evento);
    emisor.subscribe(observer);

    // Act
    emisor.emit({ pagina: 1 });
    emisor.unsubscribe(observer);
    emisor.emit({ pagina: 2 });

    // Assert
    assert.equal(recibidos.length, 1);
    assert.equal(recibidos[0].pagina, 1);
  });

  test('un observer que falla no impide que los demas reciban el evento', () => {
    // Arrange
    // Es la garantia que hace segura la decision de emitir el evento dentro del
    // controlador: un listener roto no puede tumbar el guardado de progreso.
    const emisor = new ProgresoEventEmitter();
    let alcanzoAlSegundo = false;
    emisor.subscribe(() => { throw new Error('observer defectuoso'); });
    emisor.subscribe(() => { alcanzoAlSegundo = true; });

    // Act
    emisor.emit({ usuarioId: 1 });

    // Assert
    assert.equal(alcanzoAlSegundo, true);
  });

  test('no falla cuando no hay ningun observer suscrito', () => {
    // Arrange
    const emisor = new ProgresoEventEmitter();

    // Act y Assert
    assert.doesNotThrow(() => emisor.emit({ usuarioId: 1 }));
  });
});
