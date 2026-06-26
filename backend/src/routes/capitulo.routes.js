const router = require('express').Router();
const capituloController = require('../controllers/capitulo.controller');
const { verificarToken } = require('../middleware/auth');

router.get('/manga/:mangaId', capituloController.getByManga);
router.get('/:id', capituloController.getById);
router.post('/:id/progreso', verificarToken, capituloController.guardarProgreso);

module.exports = router;
