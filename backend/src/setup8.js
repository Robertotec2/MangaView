require('dotenv').config();
const pool = require('./config/database');

async function setup() {
  await pool.query("UPDATE mangas SET portada_url='/api/cover/Naruto' WHERE titulo='Naruto'");
  await pool.query("UPDATE mangas SET portada_url='/api/cover/One%20Piece' WHERE titulo='One Piece'");
  await pool.query("UPDATE mangas SET portada_url='/api/cover/Attack%20on%20Titan' WHERE titulo='Attack on Titan'");
  console.log('Listo');
  process.exit();
}

setup().catch(e => { console.error(e.message); process.exit(1); });