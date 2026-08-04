-- Esquema de MangaView — fuente única del DDL.
-- Todo aquí es idempotente: ejecutarlo N veces deja siempre el mismo resultado.

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
  demografia VARCHAR(20) DEFAULT 'shounen',
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

-- Una fila por manga y persona. El estado es una de las tres listas de
-- lectura; no se mezcla con favoritos, que siguen siendo un "me gusta" suelto.
CREATE TABLE IF NOT EXISTS listas_lectura (
  id SERIAL PRIMARY KEY,
  usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  manga_id INT NOT NULL REFERENCES mangas(id) ON DELETE CASCADE,
  estado VARCHAR(20) NOT NULL CHECK (estado IN ('pendiente', 'leyendo', 'terminado')),
  fecha TIMESTAMP DEFAULT NOW(),
  UNIQUE (usuario_id, manga_id)
);

-- Seguir un manga no es lo mismo que marcarlo como favorito: el follow alimenta
-- los avisos de capítulos nuevos. Favoritos se queda como marca personal.
CREATE TABLE IF NOT EXISTS mangas_seguidos (
  id SERIAL PRIMARY KEY,
  usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  manga_id INT NOT NULL REFERENCES mangas(id) ON DELETE CASCADE,
  fecha TIMESTAMP DEFAULT NOW(),
  UNIQUE (usuario_id, manga_id)
);

-- Página concreta dentro de un capítulo. Distinto del progreso: el progreso
-- recuerda por dónde ibas; el marcador es un punto al que quieres volver.
CREATE TABLE IF NOT EXISTS marcadores (
  id SERIAL PRIMARY KEY,
  usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  capitulo_id INT NOT NULL REFERENCES capitulos(id) ON DELETE CASCADE,
  pagina INT NOT NULL CHECK (pagina >= 1),
  nota VARCHAR(200),
  fecha TIMESTAMP DEFAULT NOW(),
  UNIQUE (usuario_id, capitulo_id, pagina)
);

-- ---------------------------------------------------------------------------
-- Foro de la comunidad
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS foro_temas (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(40) UNIQUE NOT NULL,
  nombre VARCHAR(80) NOT NULL,
  descripcion TEXT,
  icono VARCHAR(8),
  orden INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS foro_publicaciones (
  id SERIAL PRIMARY KEY,
  tema_id INT NOT NULL REFERENCES foro_temas(id) ON DELETE CASCADE,
  -- Si se borra la cuenta, la conversación sobrevive sin autor en lugar de
  -- desaparecer y dejar huecos en los hilos de otras personas.
  usuario_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
  manga_id INT REFERENCES mangas(id) ON DELETE SET NULL,
  titulo VARCHAR(200) NOT NULL,
  cuerpo TEXT NOT NULL,
  fecha TIMESTAMP DEFAULT NOW(),
  fecha_edicion TIMESTAMP,
  borrada BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS foro_comentarios (
  id SERIAL PRIMARY KEY,
  publicacion_id INT NOT NULL REFERENCES foro_publicaciones(id) ON DELETE CASCADE,
  -- NULL = comentario de primer nivel. Un solo nivel de anidación basta: las
  -- respuestas a una respuesta se cuelgan del padre raíz, no de la respuesta.
  padre_id INT REFERENCES foro_comentarios(id) ON DELETE CASCADE,
  usuario_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
  cuerpo TEXT NOT NULL,
  fecha TIMESTAMP DEFAULT NOW(),
  fecha_edicion TIMESTAMP,
  borrado BOOLEAN NOT NULL DEFAULT FALSE
);

-- Reportes de la comunidad. No hay panel de moderación: se registran para
-- demostrar el flujo y quedan listos para un administrador futuro.
CREATE TABLE IF NOT EXISTS foro_reportes (
  id SERIAL PRIMARY KEY,
  usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  publicacion_id INT REFERENCES foro_publicaciones(id) ON DELETE CASCADE,
  comentario_id INT REFERENCES foro_comentarios(id) ON DELETE CASCADE,
  motivo VARCHAR(300) NOT NULL,
  fecha TIMESTAMP DEFAULT NOW(),
  CHECK (
    (publicacion_id IS NOT NULL AND comentario_id IS NULL)
    OR (publicacion_id IS NULL AND comentario_id IS NOT NULL)
  )
);

-- Una fila por persona y publicación: el valor 1 es "me gusta" y el -1 es "no
-- me gusta". La restricción de unicidad es lo que impide votar dos veces, y el
-- CHECK impide que llegue cualquier otro número por la API.
CREATE TABLE IF NOT EXISTS foro_reacciones (
  id SERIAL PRIMARY KEY,
  publicacion_id INT NOT NULL REFERENCES foro_publicaciones(id) ON DELETE CASCADE,
  usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  valor SMALLINT NOT NULL CHECK (valor IN (-1, 1)),
  fecha TIMESTAMP DEFAULT NOW(),
  UNIQUE (publicacion_id, usuario_id)
);

-- El requisito es mostrar cuántas *personas* vieron la publicación, no cuántas
-- veces se abrió, así que se guarda una fila por visitante en lugar de un
-- contador. La huella identifica al visitante sin guardar datos personales:
-- para una sesión iniciada es su identificador, y para quien navega sin cuenta
-- es un hash irreversible. Nunca se almacena la IP.
CREATE TABLE IF NOT EXISTS foro_vistas (
  id SERIAL PRIMARY KEY,
  publicacion_id INT NOT NULL REFERENCES foro_publicaciones(id) ON DELETE CASCADE,
  huella VARCHAR(72) NOT NULL,
  fecha TIMESTAMP DEFAULT NOW(),
  UNIQUE (publicacion_id, huella)
);

-- Migraciones ligeras para bases que ya tenían el foro del ADR-10 sin estas
-- columnas. En un clon nuevo el CREATE TABLE de arriba ya las incluye y estos
-- ALTER no hacen nada.
ALTER TABLE foro_publicaciones ADD COLUMN IF NOT EXISTS manga_id INT REFERENCES mangas(id) ON DELETE SET NULL;
ALTER TABLE foro_publicaciones ADD COLUMN IF NOT EXISTS fecha_edicion TIMESTAMP;
ALTER TABLE foro_publicaciones ADD COLUMN IF NOT EXISTS borrada BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE foro_comentarios ADD COLUMN IF NOT EXISTS padre_id INT REFERENCES foro_comentarios(id) ON DELETE CASCADE;
ALTER TABLE foro_comentarios ADD COLUMN IF NOT EXISTS fecha_edicion TIMESTAMP;
ALTER TABLE foro_comentarios ADD COLUMN IF NOT EXISTS borrado BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE mangas ADD COLUMN IF NOT EXISTS demografia VARCHAR(20) DEFAULT 'shounen';

-- Claves naturales necesarias para que el seed sea idempotente.
-- Sin ellas no se puede usar ON CONFLICT y volver a cargar los datos
-- duplicaría el catálogo, los capítulos y las páginas.
CREATE UNIQUE INDEX IF NOT EXISTS mangas_titulo_idx ON mangas (titulo);
CREATE UNIQUE INDEX IF NOT EXISTS capitulos_manga_numero_idx ON capitulos (manga_id, numero);
CREATE UNIQUE INDEX IF NOT EXISTS paginas_capitulo_orden_idx ON paginas (capitulo_id, orden);
CREATE UNIQUE INDEX IF NOT EXISTS foro_publicaciones_tema_titulo_idx
  ON foro_publicaciones (tema_id, titulo);

-- Índices de lectura: el foro se consulta por tema y ordenado por fecha, y las
-- reacciones, comentarios y vistas se cuentan por publicación en cada listado.
CREATE INDEX IF NOT EXISTS foro_publicaciones_tema_fecha_idx
  ON foro_publicaciones (tema_id, fecha DESC);
CREATE INDEX IF NOT EXISTS foro_comentarios_publicacion_idx
  ON foro_comentarios (publicacion_id);
CREATE INDEX IF NOT EXISTS foro_comentarios_padre_idx
  ON foro_comentarios (padre_id);
CREATE INDEX IF NOT EXISTS foro_reacciones_publicacion_idx
  ON foro_reacciones (publicacion_id);
CREATE INDEX IF NOT EXISTS foro_vistas_publicacion_idx
  ON foro_vistas (publicacion_id);
CREATE INDEX IF NOT EXISTS listas_lectura_usuario_idx ON listas_lectura (usuario_id, estado);
CREATE INDEX IF NOT EXISTS mangas_seguidos_usuario_idx ON mangas_seguidos (usuario_id);
CREATE INDEX IF NOT EXISTS marcadores_usuario_idx ON marcadores (usuario_id, fecha DESC);
