/**
 * Genera un SVG de portada por cada manga del demo en public/covers.
 *
 *   node scripts/generar-portadas.js
 */

const fs = require('fs');
const path = require('path');
const { MANGAS } = require('../src/db/datos-demo');
const { generarPortadaSVG, slugPortada } = require('../src/services/cover.service');

const DIR = path.join(__dirname, '../public/covers');

fs.mkdirSync(DIR, { recursive: true });

let escritas = 0;
for (const manga of MANGAS) {
  // Mayonaka tiene portada ilustrada a mano: no la sobrescribimos.
  if (manga.titulo === 'Mayonaka Heart Tune') continue;

  const archivo = path.join(DIR, `${slugPortada(manga.titulo)}.svg`);
  fs.writeFileSync(archivo, generarPortadaSVG(manga.titulo), 'utf8');
  escritas++;
}

console.log(`Portadas generadas: ${escritas} en ${DIR}`);
