const router = require('express').Router();
const { generarPaginaSVG } = require('../services/pagina.service');

/**
 * Página de un capítulo, generada en el servidor.
 *
 * El total es opcional y llega por query porque solo sirve para pintar el pie
 * de página: la imagen se genera igual sin él.
 */
router.get('/:titulo/:capitulo/:orden', (req, res) => {
  const titulo = decodeURIComponent(req.params.titulo);
  const { capitulo, orden } = req.params;

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.send(generarPaginaSVG(titulo, capitulo, orden, req.query.total));
});

module.exports = router;
