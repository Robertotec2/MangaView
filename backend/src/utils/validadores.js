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

module.exports = {
  validarRegistro,
  validarLogin,
  validarPublicacion,
  validarComentario,
  esCorreoValido,
  esPasswordValida,
  LONGITUD_MINIMA_PASSWORD,
  LONGITUD_MINIMA_TITULO,
  LONGITUD_MAXIMA_TITULO,
  LONGITUD_MINIMA_CUERPO,
  LONGITUD_MAXIMA_CUERPO,
  LONGITUD_MAXIMA_COMENTARIO
};
