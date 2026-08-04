/**
 * Patrón Observer — Sistema de eventos de progreso de lectura
 *
 * Subject: ProgresoEventEmitter — emite eventos cuando se guarda progreso
 * Observers: listeners registrados que reaccionan al evento
 *
 * Permite agregar comportamiento nuevo (estadísticas, notificaciones, logs)
 * sin modificar el controlador de progreso.
 */
class ProgresoEventEmitter {
  constructor() {
    this._listeners = [];
  }

  // Registrar un observer
  subscribe(listener) {
    this._listeners.push(listener);
  }

  // Eliminar un observer
  unsubscribe(listener) {
    this._listeners = this._listeners.filter(l => l !== listener);
  }

  // Notificar a todos los observers
  emit(evento) {
    this._listeners.forEach(listener => {
      try {
        listener(evento);
      } catch (err) {
        console.error('Error en observer:', err.message);
      }
    });
  }
}

// Instancia compartida del emisor
const progresoEmitter = new ProgresoEventEmitter();

// Observer 1 — Log de actividad
progresoEmitter.subscribe((evento) => {
  console.log(`[LOG] Usuario ${evento.usuarioId} leyó hasta página ${evento.pagina} del capítulo ${evento.capituloId}`);
});

// Observer 2 — Estadísticas (simulado, base para futuras funcionalidades)
progresoEmitter.subscribe((evento) => {
  // Aquí se podría actualizar una tabla de estadísticas de lectura
  // por ahora solo registra la actividad
  console.log(`[STATS] Actividad registrada para usuario ${evento.usuarioId}`);
});

module.exports = progresoEmitter;
// Se expone la clase para poder instanciar emisores aislados en las pruebas,
// sin los observers de consola ya registrados sobre la instancia compartida.
module.exports.ProgresoEventEmitter = ProgresoEventEmitter;
