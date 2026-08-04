# MangaView

[![CI](https://github.com/Robertotec2/MangaView/actions/workflows/ci.yml/badge.svg)](https://github.com/Robertotec2/MangaView/actions/workflows/ci.yml)

Plataforma web para leer manga en español. Proyecto desarrollado para la materia de Arquitectura de
Software.

Un lector entra sin registrarse, explora el catálogo y lee capítulos. Si se registra, la aplicación
recuerda sus favoritos y por qué página iba en cada capítulo.

## Tecnologías

| Capa | Tecnología |
|------|------------|
| Frontend | SPA en HTML y JavaScript vanilla, servida como archivo estático por Express |
| Backend | Node.js + Express |
| Base de datos | PostgreSQL |
| Autenticación | JWT firmado con `jsonwebtoken`, contraseñas con `bcryptjs` |
| Portadas y páginas | Generadas como SVG por el propio servidor, sin depender de servicios externos |

El proyecto de React que vive en `frontend/src/` corresponde al stack original del ADR-01 y ya no se
ejecuta: el ADR-05 explica por qué se sustituyó. Cloudinary sigue configurado en el backend pero
ningún módulo lo consume todavía. Ambas cosas están registradas como deuda técnica abierta.

## Cómo correr el proyecto

Necesitas Node.js 18 o superior y una instancia de PostgreSQL en marcha.

```bash
cd backend
npm install
cp .env.example .env      # ajusta las credenciales de tu PostgreSQL
npm run db:setup          # crea el esquema y carga los datos de demostración
npm run dev
```

La aplicación queda en `http://localhost:3000`: Express sirve ahí tanto la API como la SPA, así que no
hay que levantar un segundo servidor para el frontend.

### Comandos disponibles

| Comando | Qué hace |
|---------|----------|
| `npm run dev` | Levanta la API con recarga automática |
| `npm start` | Levanta la API sin recarga |
| `npm run db:setup` | Crea la base de datos si falta, aplica el esquema y carga los datos de demostración. Es idempotente: puedes ejecutarlo las veces que quieras |
| `npm run db:reset` | Borra las tablas y vuelve a crearlas desde cero. Destructivo |
| `npm test` | Ejecuta las pruebas unitarias |

## Documentación

| Documento | Qué contiene |
|-----------|--------------|
| [Modelo C4](docs/C4-MangaView.md) | La arquitectura en tres niveles: contexto, contenedores y componentes |
| [Evaluación ATAM](docs/ATAM-MangaView.md) | Riesgo, trade-off y punto de sensibilidad de las decisiones tomadas |
| [Registro de ADR](docs/ADR-registro.md) | Índice de todas las decisiones, code smells resueltos y estado de la deuda técnica |
| [Declaración de uso de IA](docs/DECLARACION-IA.md) | En qué se usó IA durante la entrega y qué decisiones son propias |

Los ADR individuales están en la raíz del repositorio, del `ADR-01` al `ADR-09`.

## Integración continua

Cada push y cada pull request disparan el pipeline de [`.github/workflows/ci.yml`](.github/workflows/ci.yml),
que comprueba la sintaxis de todos los módulos del backend y ejecuta las pruebas unitarias sobre Node
20, 22 y 24. Las pruebas no tocan la base de datos, así que el pipeline no necesita levantar
PostgreSQL; el ADR-08 explica esa decisión.

## Ramas del proyecto

| Rama | ADR | Contenido |
|------|-----|-----------|
| `bbc` | ADR-01 | Estructura base, decisiones iniciales de stack |
| `integracion-de-apis` | ADR-02 + ADR-03 | API REST completa, vistas arquitectónicas y estilo en capas |
| `patrones-gof` | ADR-04 | Primera implementación de Singleton y Observer |
| `deuda-tecnica` | ADR-06 | Registro de deuda técnica |
| `documentacion-final` | ADR-07 + ADR-08 | C4, ATAM, refactorización, pruebas e integración continua |
| `main` | Todos | Rama integradora |

## Estructura general

```
MangaView/
├── .github/workflows/ci.yml     Pipeline de integración continua
├── backend/
│   ├── public/covers/           Portadas propias que sustituyen a las generadas
│   ├── src/
│   │   ├── index.js             Composición de la aplicación Express
│   │   ├── config/              Configuración de Cloudinary
│   │   ├── db/                  Esquema, datos de demostración, seed y reset
│   │   ├── routes/              Definición de los endpoints
│   │   ├── controllers/         Traducción entre HTTP y el dominio
│   │   ├── services/            Reglas de negocio
│   │   ├── repositories/        Acceso a datos
│   │   ├── patterns/            Singleton de conexión y Observer de progreso
│   │   ├── middleware/          Verificación del token
│   │   └── utils/               Validadores y errores de negocio
│   └── tests/                   Pruebas unitarias
├── frontend/
│   └── index.html               La SPA que se sirve en producción
├── docs/                        C4, ATAM y registro de ADR
└── ADR-0X-Roberto.md            Decisiones arquitectónicas individuales
```

## Declaración de uso de IA

Este proyecto usó IA (Cursor) como apoyo en la elaboración de los diagramas C4, la evaluación ATAM y la
refactorización del backend. El detalle está en la [declaración completa](docs/DECLARACION-IA.md) y, de
forma resumida, al final de cada documento afectado.
