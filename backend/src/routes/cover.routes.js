const router = require('express').Router();
const { generarPortadaSVG } = require('../services/cover.service');

router.get('/:titulo', (req, res) => {
  const titulo = decodeURIComponent(req.params.titulo);
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.send(generarPortadaSVG(titulo));
});

module.exports = router;
