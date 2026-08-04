const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token requerido' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

/**
 * Identifica al usuario si trae un token válido, pero deja pasar a quien no
 * tenga sesión.
 *
 * Lo necesitan las rutas del foro que son públicas y aun así cambian según
 * quién mire: el detalle de una publicación cuenta como visita a la persona y
 * le devuelve su propia reacción, mientras que quien no ha iniciado sesión ve
 * lo mismo sin esos datos. Rechazar la petición sería incorrecto y no mirar el
 * token dejaría al lector registrado sin su información.
 */
const identificarUsuario = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return next();

  try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    // Un token vencido o manipulado se trata como si no hubiera sesión: estas
    // rutas son públicas y no hay nada que proteger.
  }
  return next();
};

module.exports = { verificarToken, identificarUsuario };
