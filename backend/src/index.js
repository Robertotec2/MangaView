const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const mangaRoutes = require('./routes/manga.routes');
const capituloRoutes = require('./routes/capitulo.routes');
const usuarioRoutes = require('./routes/usuario.routes');
const coverRoutes = require('./routes/cover.routes');
const paginaRoutes = require('./routes/pagina.routes');
const foroRoutes = require('./routes/foro.routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, '../../frontend')));
app.use('/covers', express.static(path.join(__dirname, '../public/covers')));

app.use('/api/mangas', mangaRoutes);
app.use('/api/capitulos', capituloRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/cover', coverRoutes);
app.use('/api/page', paginaRoutes);
app.use('/api/foro', foroRoutes);

app.get('/api', (req, res) => {
  res.json({ mensaje: 'API MangaView', version: '1.0.0' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor en http://localhost:${PORT}`);
  });
}

module.exports = app;
