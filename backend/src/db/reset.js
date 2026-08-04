/**
 * Reconstruye la base de datos de MangaView desde cero.
 *
 * Es destructivo a propósito y por eso vive en un comando aparte del seed:
 * borra las seis tablas y vuelve a crearlas y cargarlas. Sirve para dejar el
 * entorno limpio antes de una demo, o para recuperarse de una base de datos
 * que quedó con registros duplicados por los scripts antiguos.
 *
 *   npm run db:reset
 */

require('dotenv').config();
const db = require('../patterns/DatabaseSingleton');
const { seed } = require('./seed');

const TABLAS = [
  'progreso_lectura',
  'favoritos',
  'paginas',
  'capitulos',
  'mangas',
  'usuarios'
];

async function reset() {
  await db.query(`DROP TABLE IF EXISTS ${TABLAS.join(', ')} CASCADE`);
  console.log('Tablas eliminadas.');
  await seed();
}

reset()
  .then(() => db.pool.end())
  .catch(err => {
    console.error('Fallo la reconstruccion:', err.message);
    db.pool.end();
    process.exit(1);
  });
