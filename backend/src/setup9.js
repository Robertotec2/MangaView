require('dotenv').config();
const pool = require('./config/database');

async function setup() {
  await pool.query("UPDATE mangas SET portada_url='https://upload.wikimedia.org/wikipedia/en/9/94/NarutoCoverTankobon1.jpg' WHERE titulo='Naruto'");
  await pool.query("UPDATE mangas SET portada_url='https://upload.wikimedia.org/wikipedia/en/9/90/One_Piece%2C_Volume_61_Cover_%28Japanese%29.jpg' WHERE titulo='One Piece'");
  await pool.query("UPDATE mangas SET portada_url='https://upload.wikimedia.org/wikipedia/en/d/d6/Shingeki_no_Kyojin_manga_volume_1.jpg' WHERE titulo='Attack on Titan'");
  console.log('Listo');
  process.exit();
}

setup().catch(e => { console.error(e.message); process.exit(1); });