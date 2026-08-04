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
const { asegurarBaseDeDatos } = require('./crear-base');
const { seed } = require('./seed');

// El orden no importa porque el DROP es en cascada, pero la lista tiene que
// estar completa: una tabla que falte aquí sobrevive con sus datos al reset y
// deja la base en un estado que no es ni el anterior ni el nuevo.
const TABLAS = [
  'foro_reportes',
  'foro_vistas',
  'foro_reacciones',
  'foro_comentarios',
  'foro_publicaciones',
  'foro_temas',
  'marcadores',
  'mangas_seguidos',
  'listas_lectura',
  'progreso_lectura',
  'favoritos',
  'paginas',
  'capitulos',
  'mangas',
  'usuarios'
];

async function reset() {
  // El DROP es lo primero que toca la base, así que hay que asegurarla antes
  // que nada: sobre una instalación limpia fallaría al conectarse.
  await asegurarBaseDeDatos();

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
