const { Pool } = require('pg');
require('dotenv').config();

/**
 * Patrón Singleton — Conexión a PostgreSQL
 * Garantiza que exista una sola instancia del pool de conexiones
 * en toda la aplicación.
 */
class DatabaseSingleton {
  constructor() {
    if (DatabaseSingleton._instance) {
      return DatabaseSingleton._instance;
    }

    if (process.env.DATABASE_URL) {
      // Neon / Render / Railway entregan la conexión completa y suelen exigir SSL.
      const usarSsl = process.env.DB_SSL !== 'false';
      this._pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: usarSsl ? { rejectUnauthorized: false } : false
      });
    } else {
      this._pool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'mangaview',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || ''
      });
    }

    this._pool.on('connect', () => {
      console.log('Conectado a PostgreSQL');
    });

    this._pool.on('error', (err) => {
      console.error('Error en el pool de PostgreSQL:', err.message);
    });

    DatabaseSingleton._instance = this;
  }

  static getInstance() {
    if (!DatabaseSingleton._instance) {
      new DatabaseSingleton();
    }
    return DatabaseSingleton._instance;
  }

  get pool() {
    return this._pool;
  }

  query(text, params) {
    return this._pool.query(text, params);
  }
}

DatabaseSingleton._instance = null;

module.exports = DatabaseSingleton.getInstance();
