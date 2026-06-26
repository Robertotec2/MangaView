CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  correo VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  fecha_registro TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mangas (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(200) NOT NULL,
  autor VARCHAR(100),
  genero VARCHAR(50),
  sinopsis TEXT,
  portada_url TEXT,
  estado VARCHAR(20) DEFAULT 'en_curso'
);

CREATE TABLE IF NOT EXISTS capitulos (
  id SERIAL PRIMARY KEY,
  manga_id INT REFERENCES mangas(id) ON DELETE CASCADE,
  numero INT NOT NULL,
  titulo VARCHAR(200),
  fecha_publicacion DATE
);

CREATE TABLE IF NOT EXISTS paginas (
  id SERIAL PRIMARY KEY,
  capitulo_id INT REFERENCES capitulos(id) ON DELETE CASCADE,
  orden INT NOT NULL,
  imagen_url TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS favoritos (
  id SERIAL PRIMARY KEY,
  usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
  manga_id INT REFERENCES mangas(id) ON DELETE CASCADE,
  fecha TIMESTAMP DEFAULT NOW(),
  UNIQUE(usuario_id, manga_id)
);

CREATE TABLE IF NOT EXISTS progreso_lectura (
  id SERIAL PRIMARY KEY,
  usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
  capitulo_id INT REFERENCES capitulos(id) ON DELETE CASCADE,
  pagina_actual INT DEFAULT 1,
  ultima_actualizacion TIMESTAMP DEFAULT NOW(),
  UNIQUE(usuario_id, capitulo_id)
);
