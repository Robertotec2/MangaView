# MangaView

Plataforma web para leer manga en español. Proyecto desarrollado para la materia de Arquitectura de Software.

## Tecnologías

| Capa | Tecnología |
|------|------------|
| Frontend | React + TypeScript |
| Backend | Node.js + Express |
| Base de datos | PostgreSQL |
| Imágenes | Cloudinary CDN |

## Ramas del proyecto

| Rama | ADR | Contenido |
|------|-----|-----------|
| `bbc` | ADR-01 | Estructura base, decisiones iniciales de stack |
| `integracion-de-apis` | ADR-02 + ADR-03 | API REST completa, vistas arquitectónicas y estilo en capas |
| `main` | Todos | Avance completo con frontend y backend integrados |

## Decisiones arquitectónicas

- **ADR-01** — Stack tecnológico: React, Node.js, PostgreSQL, Cloudinary
- **ADR-02** — Vistas arquitectónicas: lógica, física, despliegue y procesos
- **ADR-03** — Estilo arquitectónico: cliente-servidor en capas

## Cómo correr el proyecto

**Backend:**
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm start
```

## Estructura general

```
MangaView/
├── backend/
│   └── src/
│       ├── index.js
│       ├── config/
│       ├── routes/
│       ├── controllers/
│       └── middleware/
├── frontend/
│   └── src/
│       ├── App.tsx
│       ├── pages/
│       └── services/
├── ADR-01-Roberto.md
├── ADR-02-Roberto.md
└── ADR-03-Roberto.md
```
