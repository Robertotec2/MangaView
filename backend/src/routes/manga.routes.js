const router = require('express').Router();
const mangaController = require('../controllers/manga.controller');

router.get('/', mangaController.getAll);
router.get('/:id', mangaController.getById);
router.get('/genero/:genero', mangaController.getByGenero);

module.exports = router;
