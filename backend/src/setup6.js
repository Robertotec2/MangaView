require('dotenv').config();
const pool = require('./config/database');

async function setup() {
  await pool.query("UPDATE mangas SET portada_url='/api/cover/Death%20Note' WHERE titulo='Death Note'");
  await pool.query("UPDATE mangas SET portada_url='/api/cover/Demon%20Slayer' WHERE titulo='Demon Slayer'");
  await pool.query("UPDATE mangas SET portada_url='/api/cover/Dragon%20Ball' WHERE titulo='Dragon Ball'");
  await pool.query("UPDATE mangas SET portada_url='/api/cover/My%20Hero%20Academia' WHERE titulo='My Hero Academia'");
  await pool.query("UPDATE mangas SET portada_url='/api/cover/Fullmetal%20Alchemist' WHERE titulo='Fullmetal Alchemist'");
  console.log('Listo');
  process.exit();
}

setup().catch(e => { console.error(e.message); process.exit(1); });