const router = require('express').Router();
const bibliotecaController = require('../controllers/biblioteca.controller');
const { verificarToken } = require('../middleware/auth');

router.use(verificarToken);

router.get('/listas', bibliotecaController.listas);
router.put('/listas/:mangaId', bibliotecaController.guardarLista);
router.delete('/listas/:mangaId', bibliotecaController.quitarLista);
router.get('/estado/:mangaId', bibliotecaController.estadoManga);

router.get('/siguiendo', bibliotecaController.seguidos);
router.post('/siguiendo/:mangaId', bibliotecaController.seguir);
router.delete('/siguiendo/:mangaId', bibliotecaController.dejarDeSeguir);
router.get('/avisos', bibliotecaController.avisos);

router.get('/marcadores', bibliotecaController.marcadores);
router.post('/marcadores', bibliotecaController.crearMarcador);
router.delete('/marcadores/:id', bibliotecaController.borrarMarcador);

module.exports = router;
