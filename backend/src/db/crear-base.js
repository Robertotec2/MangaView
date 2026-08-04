/**
 * Creación de la base de datos de MangaView si todavía no existe.
 *
 * El seed y el reset se conectan a la base `mangaview`, así que sobre una
 * instalación limpia de PostgreSQL fallaban antes de ejecutar una sola
 * sentencia. Este paso cierra ese hueco: es lo que permite que un clon nuevo
 * quede levantado con `npm install`, `npm run db:setup` y `npm run dev`, sin
 * pedirle a nadie que cree la base a mano desde pgAdmin o psql.
 *
 * `CREATE DATABASE` no admite parámetros ni puede ejecutarse dentro de una
 * transacción, así que la comprobación va aparte y el nombre se interpola como
 * identificador citado.
 */

const { Client } = require('pg');

/**
 * PostgreSQL no permite crear una base de datos estando conectado a la que se
 * quiere crear, así que la conexión se hace contra la base de mantenimiento.
 */
const BASE_DE_MANTENIMIENTO = 'postgres';

/**
 * Cita un identificador de PostgreSQL. El nombre llega desde una variable de
 * entorno y no puede pasarse como parámetro en un `CREATE DATABASE`, así que se
 * duplican las comillas dobles para que no se pueda cerrar el identificador y
 * añadir sentencias.
 */
const citarIdentificador = (nombre) => `"${String(nombre).replace(/"/g, '""')}"`;

function credenciales(base) {
  return {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: base
  };
}

async function asegurarBaseDeDatos() {
  const nombre = process.env.DB_NAME || 'mangaview';
  const cliente = new Client(credenciales(BASE_DE_MANTENIMIENTO));

  await cliente.connect();
  try {
    const { rowCount } = await cliente.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [nombre]
    );

    if (rowCount > 0) {
      return false;
    }

    await cliente.query(`CREATE DATABASE ${citarIdentificador(nombre)}`);
    console.log(`Base de datos "${nombre}" creada.`);
    return true;
  } finally {
    await cliente.end();
  }
}

module.exports = { asegurarBaseDeDatos, citarIdentificador };
