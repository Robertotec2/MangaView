require('dotenv').config();
const pool = require('./config/database');

async function setup() {
  await pool.query("UPDATE mangas SET portada_url='https://m.media-amazon.com/images/I/81FIRGeoFLL.jpg' WHERE titulo='Dragon Ball'");
  await pool.query("UPDATE mangas SET portada_url='https://m.media-amazon.com/images/I/91bFy9GsNaL.jpg' WHERE titulo='Demon Slayer'");
  await pool.query("UPDATE mangas SET portada_url='https://m.media-amazon.com/images/I/81Nfm2BUJVL.jpg' WHERE titulo='My Hero Academia'");
  await pool.query("UPDATE mangas SET portada_url='https://m.media-amazon.com/images/I/81m9XbH5rEL.jpg' WHERE titulo='Death Note'");
  await pool.query("UPDATE mangas SET portada_url='https://m.media-amazon.com/images/I/81E6FIwHBkL.jpg' WHERE titulo='Fullmetal Alchemist'");
  console.log('Portadas actualizadas');
  process.exit();
}

setup().catch(e => { console.error(e.message); process.exit(1); });