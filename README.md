# MangaView

[![CI](https://github.com/Robertotec2/MangaView/actions/workflows/ci.yml/badge.svg)](https://github.com/Robertotec2/MangaView/actions/workflows/ci.yml)

Plataforma web para leer manga en español. Proyecto desarrollado para la materia de Arquitectura de
Software.

Un lector entra sin registrarse, explora el catálogo, lee capítulos y consulta el foro. Si se registra, la
aplicación recuerda sus favoritos y por qué página iba en cada capítulo, y puede participar en el foro:
publicar, comentar y votar.

## El foro

El foro está dividido en cinco temas —Discusiones, Recomendaciones, Noticias, Spoilers y Ayuda y soporte— y
permite crear publicaciones, comentarlas, darles me gusta o no me gusta, y buscar por título o contenido.
Cada publicación muestra **cuántas personas la vieron**, no cuántas veces se abrió: se cuenta un visitante
una sola vez, usando su cuenta si tiene sesión y un código irreversible si no la tiene, sin almacenar la
dirección IP. El [ADR-10](ADR-10-Roberto.md) explica ese diseño y por qué se eligieron esos cinco temas.

Leer el foro es público. Publicar, comentar y votar requieren una cuenta.

### Cuentas de demostración

El seed carga ocho cuentas con conversaciones ya escritas para que el foro no aparezca vacío en la demo.
Todas comparten la contraseña `demo1234`:

```
akira@demo.mangaview      yuki@demo.mangaview       camila@demo.mangaview
diego@demo.mangaview      sofia@demo.mangaview      mateo@demo.mangaview
renata@demo.mangaview     bruno@demo.mangaview
```

Son cuentas de demostración con un dominio que no existe, no cuentas de uso real.

## Biblioteca personal

Con sesión iniciada puedes:

- **Listas** — pendiente, leyendo o terminado (aparte de favoritos)
- **Seguir mangas** — avisos de capítulos nuevos en el menú Avisos
- **Marcadores** — guardar una página concreta desde el lector
- En el foro: **citar un manga**, **responder** a comentarios, **editar/borrar** lo tuyo y **reportar**

El detalle está en el [ADR-11](ADR-11-Roberto.md).

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
| `npm run db:setup` | Crea la base de datos si falta, aplica el esquema y carga los datos de demostración, catálogo y foro incluidos. Es idempotente: puedes ejecutarlo las veces que quieras |
| `npm run db:reset` | Borra las tablas y vuelve a crearlas desde cero. Destructivo |
| `npm test` | Ejecuta las pruebas unitarias |

## Documentación

| Documento | Qué contiene |
|-----------|--------------|
| [Modelo C4](docs/C4-MangaView.md) | La arquitectura en tres niveles: contexto, contenedores y componentes |
| [Evaluación ATAM](docs/ATAM-MangaView.md) | Riesgo, trade-off y punto de sensibilidad de las decisiones tomadas |
| [Registro de ADR](docs/ADR-registro.md) | Índice de todas las decisiones, code smells resueltos y estado de la deuda técnica |
| [Declaración de uso de IA](docs/DECLARACION-IA.md) | En qué se usó IA durante la entrega y qué decisiones son propias |

Los ADR individuales están en la raíz del repositorio, del `ADR-01` al `ADR-11`.

Además del foro, con sesión puedes usar **listas de lectura** (pendiente / leyendo / terminado),
**seguir mangas** (avisos de capítulos), **citar un manga** al publicar, **editar/borrar/reportar**
en el foro, **responder comentarios** y **marcar páginas** en el lector.

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
| `foro-comunidad` | ADR-10 | Foro: temas, publicaciones, comentarios, reacciones, vistas y buscador |
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
