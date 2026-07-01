require('dotenv').config();
const pool = require('./config/database');

async function setup() {
  await pool.query('CREATE TABLE IF NOT EXISTS usuarios (id SERIAL PRIMARY KEY, nombre VARCHAR(100) NOT NULL, correo VARCHAR(150) UNIQUE NOT NULL, password_hash TEXT NOT NULL, fecha_registro TIMESTAMP DEFAULT NOW())');
  await pool.query('CREATE TABLE IF NOT EXISTS capitulos (id SERIAL PRIMARY KEY, manga_id INT REFERENCES mangas(id) ON DELETE CASCADE, numero INT NOT NULL, titulo VARCHAR(200), fecha_publicacion DATE)');
  await pool.query('CREATE TABLE IF NOT EXISTS paginas (id SERIAL PRIMARY KEY, capitulo_id INT REFERENCES capitulos(id) ON DELETE CASCADE, orden INT NOT NULL, imagen_url TEXT NOT NULL)');
  await pool.query('CREATE TABLE IF NOT EXISTS favoritos (id SERIAL PRIMARY KEY, usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE, manga_id INT REFERENCES mangas(id) ON DELETE CASCADE, fecha TIMESTAMP DEFAULT NOW(), UNIQUE(usuario_id, manga_id))');
  await pool.query('CREATE TABLE IF NOT EXISTS progreso_lectura (id SERIAL PRIMARY KEY, usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE, capitulo_id INT REFERENCES capitulos(id) ON DELETE CASCADE, pagina_actual INT DEFAULT 1, ultima_actualizacion TIMESTAMP DEFAULT NOW(), UNIQUE(usuario_id, capitulo_id))');
  console.log('Tablas listas');
  await pool.query("INSERT INTO capitulos (manga_id,numero,titulo,fecha_publicacion) VALUES (1,1,'Uzumaki Naruto!!','1999-09-21'),(1,2,'Konohamaru!!','1999-09-28'),(1,3,'Sasuke Uchiha!!','1999-10-05'),(2,1,'Romance Dawn','1997-07-22'),(2,2,'Ese chico Coby','1997-07-29'),(2,3,'Morgan vs Luffy','1997-08-05'),(3,1,'Hace 2000 anos','2009-09-09'),(3,2,'Ese dia','2009-10-09'),(3,3,'La noche de la graduacion','2009-11-09')");
  console.log('Capitulos listos');
  await pool.query("INSERT INTO paginas (capitulo_id,orden,imagen_url) VALUES (1,1,'https://via.placeholder.com/800x1200/111111/eeeeee?text=Naruto+C1+P1'),(1,2,'https://via.placeholder.com/800x1200/111111/eeeeee?text=Naruto+C1+P2'),(1,3,'https://via.placeholder.com/800x1200/111111/eeeeee?text=Naruto+C1+P3'),(2,1,'https://via.placeholder.com/800x1200/111111/eeeeee?text=Naruto+C2+P1'),(2,2,'https://via.placeholder.com/800x1200/111111/eeeeee?text=Naruto+C2+P2'),(3,1,'https://via.placeholder.com/800x1200/111111/eeeeee?text=Naruto+C3+P1'),(3,2,'https://via.placeholder.com/800x1200/111111/eeeeee?text=Naruto+C3+P2'),(4,1,'https://via.placeholder.com/800x1200/111111/eeeeee?text=OnePiece+C1+P1'),(4,2,'https://via.placeholder.com/800x1200/111111/eeeeee?text=OnePiece+C1+P2'),(5,1,'https://via.placeholder.com/800x1200/111111/eeeeee?text=OnePiece+C2+P1'),(5,2,'https://via.placeholder.com/800x1200/111111/eeeeee?text=OnePiece+C2+P2'),(6,1,'https://via.placeholder.com/800x1200/111111/eeeeee?text=OnePiece+C3+P1'),(7,1,'https://via.placeholder.com/800x1200/111111/eeeeee?text=AoT+C1+P1'),(7,2,'https://via.placeholder.com/800x1200/111111/eeeeee?text=AoT+C1+P2'),(8,1,'https://via.placeholder.com/800x1200/111111/eeeeee?text=AoT+C2+P1'),(9,1,'https://via.placeholder.com/800x1200/111111/eeeeee?text=AoT+C3+P1')");
  console.log('Paginas listas');
  process.exit();
}

setup().catch(e => { console.error(e.message); process.exit(1); });