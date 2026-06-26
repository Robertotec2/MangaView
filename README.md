# MangaView

Plataforma web para leer manga en español.

## Tecnologías

- **Frontend:** React + TypeScript
- **Backend:** Node.js + Express
- **Base de datos:** PostgreSQL
- **Imágenes:** Cloudinary CDN

## Ramas

| Rama | Descripción |
|------|-------------|
| `bbc` | Estructura base según ADR-01 |
| `hexagonal` | Implementación en C# .NET con arquitectura hexagonal |
| `integracion-de-apis` | API REST + integración con Cloudinary |
| `main` | Avance completo del proyecto |

## Cómo correr el backend (Node.js)

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

## Cómo correr el proyecto .NET (rama hexagonal)

Abrir `MangaView.sln` en Visual Studio y presionar F5.
