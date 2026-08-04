const router = require('express').Router();
const mangaController = require('../controllers/manga.controller');
const { identificarUsuario } = require('../middleware/auth');

router.get('/', mangaController.getAll);
router.get('/recientes', mangaController.getRecientes);
router.get('/populares', mangaController.getPopulares);
router.get('/recomendados', identificarUsuario, mangaController.getRecomendados);
router.get('/genero/:genero', mangaController.getByGenero);
router.get('/:id', mangaController.getById);

module.exports = router;
