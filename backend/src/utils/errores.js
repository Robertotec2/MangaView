/**
 * Error de negocio con estado HTTP asociado.
 *
 * Permite que los servicios expresen qué salió mal sin conocer Express, y que
 * el controlador traduzca eso a una respuesta HTTP. Antes, cualquier fallo
 * terminaba en un 500 que devolvía el mensaje interno de PostgreSQL al cliente.
 */
class ErrorDeNegocio extends Error {
  constructor(mensaje, estado = 400) {
    super(mensaje);
    this.name = 'ErrorDeNegocio';
    this.estado = estado;
  }
}

module.exports = { ErrorDeNegocio };
