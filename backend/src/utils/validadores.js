/**
 * Validaciones de entrada del registro y del login.
 *
 * Estas reglas ya existían en el frontend (`frontend/index.html`), pero el
 * backend aceptaba cualquier cosa: bastaba llamar a la API directamente para
 * crear un usuario con un correo inválido o una contraseña de un carácter.
 * Al vivir aquí como funciones puras, valen para cualquier cliente y se pueden
 * probar de forma unitaria.
 */

const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const LONGITUD_MINIMA_PASSWORD = 6;

const esTextoNoVacio = (valor) => typeof valor === 'string' && valor.trim().length > 0;

const esCorreoValido = (correo) => esTextoNoVacio(correo) && REGEX_CORREO.test(correo.trim());

const esPasswordValida = (password) =>
  typeof password === 'string' && password.length >= LONGITUD_MINIMA_PASSWORD;

/**
 * Devuelve la lista de errores encontrados. Un arreglo vacío significa que los
 * datos son válidos.
 */
const validarRegistro = ({ nombre, correo, password } = {}) => {
  const errores = [];
  if (!esTextoNoVacio(nombre)) errores.push('El nombre es obligatorio');
  if (!esCorreoValido(correo)) errores.push('Escribe un correo valido');
  if (!esPasswordValida(password)) {
    errores.push(`La contrasena debe tener al menos ${LONGITUD_MINIMA_PASSWORD} caracteres`);
  }
  return errores;
};

const validarLogin = ({ correo, password } = {}) => {
  const errores = [];
  if (!esCorreoValido(correo)) errores.push('Escribe un correo valido');
  if (!esTextoNoVacio(password)) errores.push('La contrasena es obligatoria');
  return errores;
};

// Límites de las publicaciones del foro. El título se acota al mismo tamaño que
// la columna para que el error llegue como un mensaje entendible en lugar de
// como un fallo de PostgreSQL al truncar.
const LONGITUD_MINIMA_TITULO = 5;
const LONGITUD_MAXIMA_TITULO = 200;
const LONGITUD_MINIMA_CUERPO = 10;
const LONGITUD_MAXIMA_CUERPO = 5000;
const LONGITUD_MAXIMA_COMENTARIO = 2000;

const validarPublicacion = ({ titulo, cuerpo, tema } = {}) => {
  const errores = [];

  if (!esTextoNoVacio(tema)) {
    errores.push('Elige un tema para la publicacion');
  }

  if (!esTextoNoVacio(titulo)) {
    errores.push('El titulo es obligatorio');
  } else if (titulo.trim().length < LONGITUD_MINIMA_TITULO) {
    errores.push(`El titulo debe tener al menos ${LONGITUD_MINIMA_TITULO} caracteres`);
  } else if (titulo.trim().length > LONGITUD_MAXIMA_TITULO) {
    errores.push(`El titulo no puede pasar de ${LONGITUD_MAXIMA_TITULO} caracteres`);
  }

  if (!esTextoNoVacio(cuerpo)) {
    errores.push('El contenido es obligatorio');
  } else if (cuerpo.trim().length < LONGITUD_MINIMA_CUERPO) {
    errores.push(`El contenido debe tener al menos ${LONGITUD_MINIMA_CUERPO} caracteres`);
  } else if (cuerpo.trim().length > LONGITUD_MAXIMA_CUERPO) {
    errores.push(`El contenido no puede pasar de ${LONGITUD_MAXIMA_CUERPO} caracteres`);
  }

  return errores;
};

const validarComentario = ({ cuerpo } = {}) => {
  const errores = [];
  if (!esTextoNoVacio(cuerpo)) {
    errores.push('El comentario no puede estar vacio');
  } else if (cuerpo.trim().length > LONGITUD_MAXIMA_COMENTARIO) {
    errores.push(`El comentario no puede pasar de ${LONGITUD_MAXIMA_COMENTARIO} caracteres`);
  }
  return errores;
};

const ESTADOS_LISTA = ['pendiente', 'leyendo', 'terminado'];
const LONGITUD_MAXIMA_MOTIVO = 300;
const LONGITUD_MAXIMA_NOTA = 200;

const validarEstadoLista = (estado) => {
  if (!ESTADOS_LISTA.includes(estado)) {
    return ['El estado debe ser pendiente, leyendo o terminado'];
  }
  return [];
};

const validarMarcador = ({ capituloId, pagina } = {}) => {
  const errores = [];
  if (!Number.isInteger(Number(capituloId)) || Number(capituloId) <= 0) {
    errores.push('Identificador de capitulo invalido');
  }
  if (!Number.isInteger(Number(pagina)) || Number(pagina) <= 0) {
    errores.push('La pagina del marcador debe ser un numero positivo');
  }
  return errores;
};

const validarReporte = ({ motivo } = {}) => {
  const errores = [];
  if (!esTextoNoVacio(motivo)) {
    errores.push('Escribe el motivo del reporte');
  } else if (motivo.trim().length > LONGITUD_MAXIMA_MOTIVO) {
    errores.push(`El motivo no puede pasar de ${LONGITUD_MAXIMA_MOTIVO} caracteres`);
  }
  return errores;
};

module.exports = {
  validarRegistro,
  validarLogin,
  validarPublicacion,
  validarComentario,
  validarEstadoLista,
  validarMarcador,
  validarReporte,
  esCorreoValido,
  esPasswordValida,
  ESTADOS_LISTA,
  LONGITUD_MINIMA_PASSWORD,
  LONGITUD_MINIMA_TITULO,
  LONGITUD_MAXIMA_TITULO,
  LONGITUD_MINIMA_CUERPO,
  LONGITUD_MAXIMA_CUERPO,
  LONGITUD_MAXIMA_COMENTARIO,
  LONGITUD_MAXIMA_MOTIVO,
  LONGITUD_MAXIMA_NOTA
};
