const express = require('express');
const cors = require('cors');
require('dotenv').config();

const mangaRoutes = require('./routes/manga.routes');
const capituloRoutes = require('./routes/capitulo.routes');
const usuarioRoutes = require('./routes/usuario.routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/mangas', mangaRoutes);
app.use('/api/capitulos', capituloRoutes);
app.use('/api/usuarios', usuarioRoutes);

app.get('/', (req, res) => {
  res.json({ mensaje: 'API MangaView', version: '1.0.0' });
});

app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});
