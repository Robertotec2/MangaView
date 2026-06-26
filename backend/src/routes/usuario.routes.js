const router = require('express').Router();
const usuarioController = require('../controllers/usuario.controller');
const { verificarToken } = require('../middleware/auth');

router.post('/registro', usuarioController.registro);
router.post('/login', usuarioController.login);
router.get('/perfil', verificarToken, usuarioController.perfil);
router.get('/favoritos', verificarToken, usuarioController.favoritos);
router.post('/favoritos/:mangaId', verificarToken, usuarioController.agregarFavorito);

module.exports = router;
