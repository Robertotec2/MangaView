const router = require('express').Router();
const foroController = require('../controllers/foro.controller');
const { verificarToken, identificarUsuario } = require('../middleware/auth');

// Leer el foro es público: cualquiera puede entrar a ver de qué se habla. El
// detalle usa identificarUsuario porque cambia según quién mire, pero no exige
// sesión.
router.get('/temas', foroController.temas);
router.get('/publicaciones', foroController.publicaciones);
router.get('/publicaciones/:id', identificarUsuario, foroController.publicacion);

// Participar sí exige cuenta: toda publicación, comentario y reacción queda
// asociada a una persona.
router.post('/publicaciones', verificarToken, foroController.crearPublicacion);
router.post('/publicaciones/:id/comentarios', verificarToken, foroController.comentar);
router.post('/publicaciones/:id/reaccion', verificarToken, foroController.reaccionar);

module.exports = router;
