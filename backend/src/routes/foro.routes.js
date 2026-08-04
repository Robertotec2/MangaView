const router = require('express').Router();
const foroController = require('../controllers/foro.controller');
const { verificarToken, identificarUsuario } = require('../middleware/auth');

router.get('/temas', foroController.temas);
router.get('/publicaciones', foroController.publicaciones);
router.get('/publicaciones/:id', identificarUsuario, foroController.publicacion);

router.post('/publicaciones', verificarToken, foroController.crearPublicacion);
router.put('/publicaciones/:id', verificarToken, foroController.editarPublicacion);
router.delete('/publicaciones/:id', verificarToken, foroController.borrarPublicacion);

router.post('/publicaciones/:id/comentarios', verificarToken, foroController.comentar);
router.put('/comentarios/:comentarioId', verificarToken, foroController.editarComentario);
router.delete('/comentarios/:comentarioId', verificarToken, foroController.borrarComentario);

router.post('/publicaciones/:id/reaccion', verificarToken, foroController.reaccionar);
router.post('/reportes', verificarToken, foroController.reportar);

module.exports = router;
