require('dotenv').config();
const pool = require('./config/database');
const https = require('https');
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../public/covers');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

function download(url, file) {
  return new Promise((res, rej) => {
    const f = fs.createWriteStream(file);
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, r => {
      r.pipe(f);
      f.on('finish', () => { f.close(); res(); });
    }).on('error', rej);
  });
}

async function setup() {
  const covers = [
    { titulo: 'Death Note', url: 'https://upload.wikimedia.org/wikipedia/en/3/37/Death_Note_volume_1.jpg', file: 'death_note.jpg' },
    { titulo: 'Dragon Ball', url: 'https://upload.wikimedia.org/wikipedia/en/a/a2/Dragon_Ball_volume_1.jpg', file: 'dragon_ball.jpg' },
    { titulo: 'Demon Slayer', url: 'https://upload.wikimedia.org/wikipedia/en/6/6a/DemonSlayerMangaVolume1.png', file: 'demon_slayer.png' },
    { titulo: 'My Hero Academia', url: 'https://upload.wikimedia.org/wikipedia/en/4/4e/MyHeroAcademia_volume1.png', file: 'mha.png' },
    { titulo: 'Fullmetal Alchemist', url: 'https://upload.wikimedia.org/wikipedia/en/6/65/FullmetalAlchemistMangaVolume1.jpg', file: 'fma.jpg' },
  ];

  for (const c of covers) {
    try {
      await download(c.url, path.join(dir, c.file));
      await pool.query(`UPDATE mangas SET portada_url='/covers/${c.file}' WHERE titulo='${c.titulo}'`);
      console.log('OK:', c.titulo);
    } catch(e) {
      console.error('Error:', c.titulo, e.message);
    }
  }
  process.exit();
}

setup().catch(e => { console.error(e.message); process.exit(1); });