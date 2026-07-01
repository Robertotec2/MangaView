require('dotenv').config();
const pool = require('./config/database');

async function setup() {
  await pool.query("UPDATE mangas SET portada_url='/covers/demon_slayer.jpg' WHERE titulo='Demon Slayer'");
  await pool.query("UPDATE mangas SET portada_url='/covers/mha.jpg' WHERE titulo='My Hero Academia'");
  await pool.query("UPDATE mangas SET portada_url='/covers/fma.jpg' WHERE titulo='Fullmetal Alchemist'");
  console.log('Listo');
  process.exit();
}

setup().catch(e => { console.error(e.message); process.exit(1); });