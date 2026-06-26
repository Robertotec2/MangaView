# MangaView — Rama: bbc

Rama base del proyecto. Documenta las decisiones iniciales de arquitectura según el **ADR-01**.

## ¿Qué hay aquí?

Estructura inicial del proyecto con la configuración base del backend en Node.js y el esquema de base de datos en PostgreSQL.

## Decisiones (ADR-01)

| Tecnología | Rol |
|------------|-----|
| React + TypeScript | Frontend — interfaz de usuario |
| Node.js + Express | Backend — API REST |
| PostgreSQL | Base de datos relacional |
| Cloudinary | CDN para imágenes de manga |

## Por qué este stack

React permite construir el visor de páginas con componentes reutilizables. Node.js maneja bien muchas peticiones concurrentes. PostgreSQL encaja con el modelo relacional del sistema. Cloudinary evita saturar el servidor con imágenes pesadas.

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
│   ├── index.js          # Entrada del servidor
│   └── config/
│       ├── database.js   # Conexión a PostgreSQL
│       └── schema.sql    # Tablas del sistema
└── package.json
```
