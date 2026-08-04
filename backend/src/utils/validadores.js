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

module.exports = {
  validarRegistro,
  validarLogin,
  esCorreoValido,
  esPasswordValida,
  LONGITUD_MINIMA_PASSWORD
};
