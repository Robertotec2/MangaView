# MangaView — Rama: integracion-de-apis

Rama que implementa la API REST completa y la integración con servicios externos. Corresponde al **ADR-02** (vistas arquitectónicas) y **ADR-03** (estilo cliente-servidor en capas).

## ¿Qué hay aquí?

API REST completa con rutas, controladores, autenticación JWT y conexión a Cloudinary. Aquí se pueden ver aplicadas las 4 vistas arquitectónicas del sistema.

## Decisiones (ADR-02 + ADR-03)

**Estilo arquitectónico:** Cliente-servidor en capas

| Capa | Tecnología | Responsabilidad |
|------|------------|-----------------|
| Presentación | React + TypeScript | Interfaz del usuario |
| Lógica de negocio | Node.js + Express | Procesar peticiones y reglas |
| Datos | PostgreSQL | Guardar y consultar información |
| Externo | Cloudinary CDN | Servir imágenes de manga |

## Vistas arquitectónicas aplicadas

- **Vista lógica** → controladores y rutas organizados por entidad (manga, capítulo, usuario)
- **Vista física** → backend en servidor, BD en otro nodo, imágenes en Cloudinary
- **Vista de despliegue** → Node.js en puerto 3000, PostgreSQL en puerto 5432
- **Vista de procesos** → usuario pide capítulo → API consulta BD → retorna URLs → cliente carga imágenes de Cloudinary

## Endpoints disponibles

```
GET    /api/mangas                  Catálogo completo
GET    /api/mangas/:id              Un manga específico
GET    /api/mangas/genero/:genero   Por género

GET    /api/capitulos/manga/:id     Capítulos de un manga
GET    /api/capitulos/:id           Páginas de un capítulo
POST   /api/capitulos/:id/progreso  Guardar progreso (requiere token)

POST   /api/usuarios/registro       Crear cuenta
POST   /api/usuarios/login          Iniciar sesión
GET    /api/usuarios/perfil         Ver perfil (requiere token)
GET    /api/usuarios/favoritos      Ver favoritos (requiere token)
POST   /api/usuarios/favoritos/:id  Agregar favorito (requiere token)
```

## Cómo correr

```bash
cd backend
npm install
cp .env.example .env
# Llena las variables en .env
npm run dev
```

## Estructura

```
backend/
├── src/
│   ├── index.js
│   ├── config/
│   │   ├── database.js
│   │   ├── cloudinary.js
│   │   └── schema.sql
│   ├── routes/
│   │   ├── manga.routes.js
│   │   ├── capitulo.routes.js
│   │   └── usuario.routes.js
│   ├── controllers/
│   │   ├── manga.controller.js
│   │   ├── capitulo.controller.js
│   │   └── usuario.controller.js
│   └── middleware/
│       └── auth.js
└── package.json
```
