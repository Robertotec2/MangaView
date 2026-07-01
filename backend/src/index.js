const express = require('express');
const cors = require('cors');
require('dotenv').config();

const mangaRoutes = require('./routes/manga.routes');
const capituloRoutes = require('./routes/capitulo.routes');
const usuarioRoutes = require('./routes/usuario.routes');

const app = express();
const path = require('path');
app.use(express.static(path.join(__dirname, '../../frontend')));
app.use('/covers', express.static(path.join(__dirname, '../src/public/covers')));
const PORT = process.env.PORT || 3000;	

app.use(cors());
app.use(express.json());

app.use('/api/mangas', mangaRoutes);
app.use('/api/capitulos', capituloRoutes);
app.use('/api/usuarios', usuarioRoutes);

app.get('/api/cover/:titulo', (req, res) => {
  const titulo = decodeURIComponent(req.params.titulo);
  const colores = {
    'Naruto': ['#FF6B00','#FFD700'],
    'One Piece': ['#1a1a8c','#FF4444'],
    'Attack on Titan': ['#2c2c2c','#8B0000'],
    'Death Note': ['#0a0a0a','#DDDDDD'],
    'Dragon Ball': ['#FF8C00','#FFD700'],
    'Demon Slayer': ['#1a0a2e','#9B59B6'],
    'My Hero Academia': ['#003087','#FF0000'],
    'Fullmetal Alchemist': ['#8B4513','#DAA520'],
  };
  const [bg, acc] = colores[titulo] || ['#1a1a2e','#e94560'];
  const letra = titulo.charAt(0).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="280">
    <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${bg}"/>
      <stop offset="100%" style="stop-color:${acc}33"/>
    </linearGradient></defs>
    <rect width="200" height="280" fill="url(#g)"/>
    <rect x="0" y="0" width="6" height="280" fill="${acc}"/>
    <rect x="0" y="220" width="200" height="60" fill="${acc}22"/>
    <text x="100" y="130" font-family="Arial Black" font-size="72" font-weight="900" fill="${acc}33" text-anchor="middle">${letra}</text>
    <text x="100" y="245" font-family="Arial" font-size="15" font-weight="bold" fill="#ffffff" text-anchor="middle">${titulo}</text>
    <text x="100" y="265" font-family="Arial" font-size="10" fill="${acc}" text-anchor="middle">MANGA</text>
  </svg>`;
  res.setHeader('Content-Type', 'image/svg+xml');
  res.send(svg);
});

app.get('/', (req, res) => {
  res.json({ mensaje: 'API MangaView', version: '1.0.0' });
});

app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});
