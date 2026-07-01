require('dotenv').config();
const pool = require('./config/database');

async function setup() {
  await pool.query("UPDATE mangas SET portada_url='https://upload.wikimedia.org/wikipedia/en/3/37/Death_Note_volume_1.jpg' WHERE titulo='Death Note'");
  await pool.query("UPDATE mangas SET portada_url='https://upload.wikimedia.org/wikipedia/en/6/6a/DemonSlayerMangaVolume1.png' WHERE titulo='Demon Slayer'");
  await pool.query("UPDATE mangas SET portada_url='https://upload.wikimedia.org/wikipedia/en/a/a2/Dragon_Ball_volume_1.jpg' WHERE titulo='Dragon Ball'");
  await pool.query("UPDATE mangas SET portada_url='https://upload.wikimedia.org/wikipedia/en/4/4e/MyHeroAcademia_volume1.png' WHERE titulo='My Hero Academia'");
  await pool.query("UPDATE mangas SET portada_url='https://upload.wikimedia.org/wikipedia/en/6/65/FullmetalAlchemistMangaVolume1.jpg' WHERE titulo='Fullmetal Alchemist'");
  console.log('Portadas actualizadas');
  process.exit();
}

setup().catch(e => { console.error(e.message); process.exit(1); });