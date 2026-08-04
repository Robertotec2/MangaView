# Modelo C4 de MangaView

| Campo | Valor |
|-------|-------|
| Autor | Roberto |
| Proyecto | MangaView — Plataforma web para leer manga en español |
| Actividad | Actividad #40 — Proyecto: Documentación final y demo |
| Fecha | 03/08/2026 |
| Estado | `Aceptado` |

---

## Sobre este documento

Los diagramas están escritos **como código** en sintaxis Mermaid dentro de este archivo `.md`, de forma que
viven junto al código fuente, se versionan con Git y se renderizan directamente en GitHub. Si la
arquitectura cambia, el diagrama se modifica en el mismo pull request que el código.

Se usa la notación `flowchart` de Mermaid (en lugar de la sintaxis experimental `C4Context`) porque es la
que GitHub renderiza de forma estable. La semántica del modelo C4 se conserva mediante los estereotipos
`[Persona]`, `[Sistema externo]`, `[Contenedor]` y `[Componente]`, y mediante los colores definidos en
`classDef`.

Cada nivel del modelo baja un escalón de zoom sobre el mismo sistema:

| Nivel | Pregunta que responde | Audiencia principal |
|-------|-----------------------|---------------------|
| 1. Contexto | ¿Qué es el sistema y quién lo usa? | Profesor, evaluador, cualquier persona sin contexto técnico |
| 2. Contenedores | ¿De qué piezas grandes ejecutables se compone? | Desarrollador nuevo en el proyecto, responsable de despliegue |
| 3. Componentes | ¿Qué hay dentro de cada pieza? | Yo mismo y quien vaya a modificar el código |

Los diagramas describen el sistema **tal como está implementado hoy en el repositorio**, no como me
gustaría que estuviera. Las diferencias entre lo documentado en ADRs anteriores y lo que realmente
ejecuta el código se listan al final, en la sección *Notas de fidelidad*, y son la entrada para la
evaluación ATAM y la actualización del ADR.

---

## Nivel 1 — Diagrama de Contexto

**¿Para quién es este diagrama?** Para cualquier persona que llega al proyecto sin conocerlo: el profesor
durante la demo, un evaluador o un compañero. No requiere saber nada de Node.js ni de bases de datos.

**¿Qué pregunta responde?** ¿Qué es MangaView, quién lo usa y con qué sistemas externos habla?

En este nivel MangaView es **una sola caja negra**. No aparecen Express, PostgreSQL ni JavaScript, porque
lo que importa aquí es el propósito del sistema y su frontera con el mundo exterior.

```mermaid
flowchart TB
    visitante["Visitante anónimo<br/>[Persona]<br/>Explora el catálogo y lee capítulos<br/>sin necesidad de crear cuenta"]
    lector["Lector registrado<br/>[Persona]<br/>Inicia sesión, marca favoritos y<br/>retoma su progreso de lectura"]
    admin["Administrador de contenido<br/>[Persona]<br/>Carga mangas, capítulos y páginas<br/>ejecutando los scripts de aprovisionamiento"]

    subgraph frontera[" "]
        mv["MangaView<br/>[Sistema de software]<br/>Plataforma web para leer manga en español.<br/>Ofrece catálogo con búsqueda y filtros, cuentas de<br/>usuario, lector de páginas, favoritos y guardado<br/>automático del progreso de lectura"]
    end

    placeholder["via.placeholder.com<br/>[Sistema externo]<br/>Aloja las imágenes de las páginas de manga<br/>usadas en el conjunto de datos de demostración"]
    cloudinary["Cloudinary<br/>[Sistema externo]<br/>CDN de imágenes decidido en el ADR-01.<br/>Credenciales ya configuradas, integración<br/>todavía no conectada al código"]

    visitante -->|"Explora el catálogo y lee capítulos<br/>desde el navegador vía HTTP"| mv
    lector -->|"Se autentica y sincroniza favoritos<br/>y progreso vía HTTP con token JWT"| mv
    admin -->|"Ejecuta scripts de carga de datos<br/>desde la línea de comandos"| mv

    mv -->|"Devuelve las URL de las páginas<br/>almacenadas en la base de datos"| lector
    lector -->|"El navegador descarga las imágenes<br/>de cada página directamente"| placeholder
    mv -.->|"Integración prevista para almacenar<br/>portadas y páginas propias"| cloudinary

    classDef persona fill:#08427b,stroke:#052e56,color:#ffffff
    classDef sistema fill:#1168bd,stroke:#0b4884,color:#ffffff
    classDef externo fill:#999999,stroke:#6b6b6b,color:#ffffff
    classDef pendiente fill:#999999,stroke:#6b6b6b,color:#ffffff,stroke-dasharray: 5 5
    class visitante,lector,admin persona
    class mv sistema
    class placeholder externo
    class cloudinary pendiente
    style frontera fill:#ffffff,stroke:#cccccc,stroke-dasharray: 5 5
```

### Lectura del diagrama

Hay **tres tipos de usuario y no uno solo**, y esa distinción es una decisión de diseño real que está en el
código: las rutas `GET /api/mangas` y `GET /api/capitulos/:id` son públicas, mientras que `POST
/api/capitulos/:id/progreso`, `GET /api/usuarios/favoritos` y `GET /api/usuarios/perfil` pasan por el
middleware `verificarToken`. Es decir, **leer no requiere cuenta; personalizar sí**. El administrador de
contenido no tiene interfaz gráfica: interactúa con el sistema ejecutando los scripts `setup*.js` con
Node.js.

Cloudinary aparece en gris punteado a propósito. Está declarado en el ADR-01 y configurado en
`backend/src/config/cloudinary.js`, pero ningún controlador lo importa todavía, así que hoy no es una
dependencia en ejecución.

---

## Nivel 2 — Diagrama de Contenedores

**¿Para quién es este diagrama?** Para un desarrollador que acaba de clonar el repositorio y necesita
saber qué procesos tiene que levantar para que la aplicación funcione, y para quien vaya a desplegarla.

**¿Qué pregunta responde?** ¿De qué piezas grandes y ejecutables se compone MangaView, qué tecnología usa
cada una y cómo se comunican entre ellas?

Aquí se abre la caja negra del Nivel 1. Un *contenedor* en C4 es algo que se ejecuta por separado: un
proceso, una aplicación de navegador o una base de datos.

```mermaid
flowchart TB
    lector["Lector<br/>[Persona]"]
    admin["Administrador de contenido<br/>[Persona]"]

    subgraph navegador["Navegador del lector"]
        spa["SPA MangaView<br/>[Contenedor: HTML + CSS + JavaScript vanilla]<br/>Archivo único frontend/index.html.<br/>Navegación por páginas mostrando y ocultando<br/>secciones, catálogo con búsqueda y filtros por tema,<br/>login y registro, detalle de manga, lector de<br/>páginas con teclado, favoritos, perfil y modo oscuro"]
        storage[("localStorage<br/>[Contenedor: almacenamiento del navegador]<br/>Guarda el token JWT y los datos<br/>del usuario para mantener la sesión")]
    end

    subgraph servidor["Servidor de aplicación — Node.js, puerto 3000"]
        api["Servidor Web y API REST<br/>[Contenedor: Node.js + Express 4]<br/>Sirve el frontend estático y expone la API REST<br/>bajo /api. Valida tokens JWT, aplica las reglas de<br/>negocio y consulta la base de datos"]
        scripts["Scripts de aprovisionamiento<br/>[Contenedor: Node.js CLI]<br/>Once archivos setup.js … setup11.js que crean<br/>las tablas y cargan mangas, capítulos,<br/>páginas y portadas de demostración"]
    end

    db[("Base de datos MangaView<br/>[Contenedor: PostgreSQL 5432]<br/>Seis tablas relacionales: usuarios, mangas,<br/>capitulos, paginas, favoritos y progreso_lectura")]

    placeholder["via.placeholder.com<br/>[Sistema externo]"]
    legacy["Frontend React heredado<br/>[Contenedor no desplegado]<br/>App.tsx, Home.tsx, Lector.tsx y api.ts.<br/>Fue reemplazado por la SPA vanilla según el ADR-05<br/>y hoy no forma parte de la aplicación en ejecución"]

    lector -->|"Usa la aplicación"| spa
    spa -->|"Lee y escribe el token de sesión"| storage
    api -->|"Entrega index.html y los recursos<br/>estáticos mediante express.static"| spa
    spa -->|"Consume JSON: /api/mangas, /api/capitulos,<br/>/api/usuarios — con cabecera Bearer<br/>en las rutas protegidas"| api
    spa -->|"Solicita portadas: archivos en /covers<br/>y SVG generados en /api/cover/:titulo"| api
    spa -->|"Descarga las imágenes de cada página"| placeholder
    api -->|"Consulta y actualiza mediante SQL<br/>sobre un pool de conexiones pg"| db
    admin -->|"Ejecuta node src/setupN.js"| scripts
    scripts -->|"Crea tablas e inserta datos<br/>de demostración con SQL"| db
    legacy -.->|"Consumía la misma API mediante axios"| api

    classDef persona fill:#08427b,stroke:#052e56,color:#ffffff
    classDef contenedor fill:#438dd5,stroke:#2e6295,color:#ffffff
    classDef datos fill:#438dd5,stroke:#2e6295,color:#ffffff
    classDef externo fill:#999999,stroke:#6b6b6b,color:#ffffff
    classDef muerto fill:#b0b0b0,stroke:#6b6b6b,color:#ffffff,stroke-dasharray: 5 5
    class lector,admin persona
    class spa,api,scripts contenedor
    class storage,db datos
    class placeholder externo
    class legacy muerto
    style navegador fill:#f7f7f7,stroke:#bbbbbb
    style servidor fill:#f7f7f7,stroke:#bbbbbb
```

### Lectura del diagrama

El hallazgo más importante de este nivel es que **el servidor Express cumple dos papeles a la vez**: es
servidor de archivos estáticos del frontend y es la API REST. Esto ocurre en las primeras líneas de
`backend/src/index.js`, donde `express.static` publica la carpeta `frontend`. Fue una decisión
deliberada del ADR-05 para simplificar el arranque a un solo `npm run dev`, y es la razón por la que solo
hay un proceso que levantar.

La sesión no vive en el servidor sino en `localStorage` del navegador: el token JWT firmado con
`expiresIn: '7d'` se guarda del lado del cliente y se envía en cada petición protegida. El servidor no
mantiene estado de sesión, lo que lo hace horizontalmente escalable pero impide invalidar un token antes
de que expire.

El **frontend React heredado** se dibuja en gris punteado porque existe en el repositorio (`frontend/src/`
y su propio `package.json` con `react-scripts`) pero no se ejecuta ni se sirve. Es deuda técnica visible y
se documenta aquí de forma explícita en lugar de ocultarla.

---

## Nivel 3 — Diagrama de Componentes: Servidor Web y API REST

**¿Para quién es este diagrama?** Para mí y para cualquiera que vaya a modificar el backend. Es el nivel
que se usa para decidir en qué archivo tocar antes de escribir código.

**¿Qué pregunta responde?** ¿Qué hay dentro del contenedor de la API, qué responsabilidad tiene cada
componente y cómo fluye una petición desde que entra hasta que llega a la base de datos?

```mermaid
flowchart TB
    spa["SPA MangaView<br/>[Contenedor]"]

    subgraph apic["Contenedor: Servidor Web y API REST — Node.js + Express"]
        bootstrap["index.js — Arranque y composición<br/>[Componente: aplicación Express]<br/>Habilita CORS y el parseo de JSON, publica los<br/>estáticos del frontend y de /covers, monta los tres<br/>routers y además define en línea el endpoint<br/>GET /api/cover/:titulo que genera portadas SVG"]

        subgraph capaRutas["Capa de enrutamiento"]
            rMangas["manga.routes.js<br/>[Componente: Express Router]<br/>GET /, GET /:id, GET /genero/:genero<br/>Todas públicas"]
            rCaps["capitulo.routes.js<br/>[Componente: Express Router]<br/>GET /manga/:mangaId, GET /:id públicas<br/>POST /:id/progreso protegida"]
            rUsers["usuario.routes.js<br/>[Componente: Express Router]<br/>POST /registro, POST /login públicas<br/>GET /perfil, GET y POST /favoritos protegidas"]
        end

        auth["auth.js — verificarToken<br/>[Componente: middleware Express]<br/>Extrae el Bearer de la cabecera Authorization,<br/>verifica la firma del JWT y coloca el usuario<br/>decodificado en req.usuario"]

        subgraph capaControl["Capa de controladores"]
            cManga["manga.controller.js<br/>[Componente]<br/>getAll, getById, getByGenero.<br/>Escribe el SQL del catálogo"]
            cCap["capitulo.controller.js<br/>[Componente]<br/>getByManga, getById, guardarProgreso.<br/>Compone capítulo y páginas, y hace<br/>el upsert del progreso de lectura"]
            cUser["usuario.controller.js<br/>[Componente]<br/>registro, login, perfil, favoritos,<br/>agregarFavorito. Hashea contraseñas<br/>y emite los tokens"]
        end

        dbcfg["database.js<br/>[Componente: Singleton de pg.Pool]<br/>Crea un único pool de conexiones a partir de<br/>variables de entorno y lo exporta. Todos los<br/>controladores comparten esta instancia"]
        cloudcfg["cloudinary.js<br/>[Componente configurado sin consumidores]<br/>Inicializa el SDK con las credenciales del .env.<br/>Ningún controlador lo importa todavía"]
    end

    db[("Base de datos MangaView<br/>[Contenedor: PostgreSQL]")]
    libBcrypt["bcryptjs<br/>[Librería externa]<br/>Hash de contraseñas, 10 rondas"]
    libJwt["jsonwebtoken<br/>[Librería externa]<br/>Firma y verificación de tokens"]

    spa -->|"HTTP JSON"| bootstrap
    bootstrap -->|"Monta en /api/mangas"| rMangas
    bootstrap -->|"Monta en /api/capitulos"| rCaps
    bootstrap -->|"Monta en /api/usuarios"| rUsers

    rCaps -->|"Protege POST /:id/progreso"| auth
    rUsers -->|"Protege perfil y favoritos"| auth
    auth -->|"Continúa con next() si el token es válido"| cCap
    auth -->|"Continúa con next() si el token es válido"| cUser

    rMangas --> cManga
    rCaps --> cCap
    rUsers --> cUser

    cManga -->|"pool.query con SQL embebido"| dbcfg
    cCap -->|"pool.query con SQL embebido"| dbcfg
    cUser -->|"pool.query con SQL embebido"| dbcfg
    dbcfg -->|"Protocolo pg sobre TCP 5432"| db

    cUser -->|"hash y compare"| libBcrypt
    cUser -->|"sign"| libJwt
    auth -->|"verify"| libJwt

    classDef contenedor fill:#438dd5,stroke:#2e6295,color:#ffffff
    classDef componente fill:#85bbf0,stroke:#5d82a8,color:#000000
    classDef infra fill:#85bbf0,stroke:#5d82a8,color:#000000
    classDef externo fill:#999999,stroke:#6b6b6b,color:#ffffff
    classDef inactivo fill:#cccccc,stroke:#8a8a8a,color:#000000,stroke-dasharray: 5 5
    class spa,db contenedor
    class bootstrap,rMangas,rCaps,rUsers,auth,cManga,cCap,cUser,dbcfg componente
    class cloudcfg inactivo
    class libBcrypt,libJwt externo
    style apic fill:#f7f7f7,stroke:#bbbbbb
    style capaRutas fill:#eef4fa,stroke:#c3d5e6
    style capaControl fill:#eef4fa,stroke:#c3d5e6
```

### Lectura del diagrama

El flujo de una petición es siempre el mismo y sigue el estilo en capas declarado en el ADR-03:
`index.js` → router → (middleware de autenticación si la ruta es protegida) → controlador →
`database.js` → PostgreSQL. Ese camino uniforme es lo que hace predecible el backend.

El diagrama también deja ver **dónde se rompe la separación en capas**: no existe una capa de repositorio
ni de modelos. El SQL está escrito directamente dentro de cada controlador, por lo que los controladores
dependen a la vez de las reglas de negocio, del esquema de la base de datos y de la API de `pg`. Es un
acoplamiento fuerte que el diagrama hace evidente al mostrar las tres flechas `pool.query con SQL
embebido` apuntando al mismo componente de infraestructura.

`index.js` no es solo un archivo de arranque: además de componer la aplicación, contiene la lógica de
generación de portadas SVG con un diccionario de colores por título escrito a mano. Es responsabilidad de
negocio dentro del punto de entrada.

---

## Nivel 3 — Diagrama de Componentes: SPA MangaView

**¿Para quién es este diagrama?** Para quien vaya a modificar la interfaz. Como todo el frontend vive en un
único archivo `index.html`, sin este diagrama no hay forma de orientarse dentro de él.

**¿Qué pregunta responde?** ¿Qué hay dentro del contenedor del frontend y cómo se organizan las funciones
que lo componen?

Aquí un *componente* no es un archivo, porque no hay módulos: son los grupos de funciones y el estado
global que conviven en el bloque `<script>` de `frontend/index.html`.

```mermaid
flowchart LR
    subgraph spac["Contenedor: SPA MangaView — frontend/index.html"]
        direction TB
        router["Navegación<br/>[Componente]<br/>showPage, goHome y toggleTheme.<br/>Muestra u oculta las secciones .page<br/>en lugar de cambiar de documento"]

        subgraph vistas["Vistas"]
            direction TB
            vAuth["Vista de autenticación<br/>[Componente]<br/>toggleAuthMode, submitAuth, logout,<br/>updateNav y getToken. Valida el formato del<br/>correo y la longitud de la contraseña<br/>antes de llamar a la API"]
            vCatalogo["Vista de catálogo<br/>[Componente]<br/>loadCatalog, renderStats, renderFilters,<br/>filterByGenre, filterMangas y renderGrid.<br/>Filtra y busca en memoria sobre el<br/>arreglo ya descargado"]
            vDetalle["Vista de detalle<br/>[Componente]<br/>openManga y toggleFav. Combina los datos<br/>de la API con el diccionario MANGA_EXTRA<br/>de metadatos escritos en el propio archivo"]
            vLector["Vista de lector<br/>[Componente]<br/>openChapter, renderReader, prevPage,<br/>nextPage, updateReaderPage y saveProgress.<br/>Navegación por clic en zonas y por teclado"]
            vPerfil["Vistas de perfil y favoritos<br/>[Componente]<br/>showProfile y showFavs"]
        end

        subgraph compartido["Estado y utilidades compartidas"]
            direction TB
            estado["Estado global<br/>[Componente: variables de módulo]<br/>mangas, currentGenre, authMode,<br/>currentChapter, currentPage, isDark<br/>y la constante API con la URL del backend"]
            toast["Notificaciones<br/>[Componente]<br/>toast, mensajes temporales al usuario"]
        end
    end

    api["Servidor Web y API REST<br/>[Contenedor]"]
    storage[("localStorage<br/>[Contenedor]")]
    placeholder["via.placeholder.com<br/>[Sistema externo]"]

    router --> vistas

    vAuth -->|"fetch POST /usuarios/login<br/>y /usuarios/registro"| api
    vCatalogo -->|"fetch GET /mangas"| api
    vDetalle -->|"fetch GET /mangas/:id<br/>y /capitulos/manga/:id<br/>fetch POST /usuarios/favoritos/:id"| api
    vLector -->|"fetch GET /capitulos/:id<br/>fetch POST /capitulos/:id/progreso"| api
    vPerfil -->|"fetch GET /usuarios/perfil<br/>y /usuarios/favoritos"| api

    vAuth -->|"Guarda y borra el token"| storage
    vLector -->|"Lee el token para autorizar"| storage
    vPerfil -->|"Lee el token para autorizar"| storage
    vLector -->|"Carga la imagen de cada página"| placeholder

    vCatalogo --> compartido
    vDetalle --> compartido
    vLector --> compartido
    vAuth --> compartido

    classDef contenedor fill:#438dd5,stroke:#2e6295,color:#ffffff
    classDef componente fill:#85bbf0,stroke:#5d82a8,color:#000000
    classDef externo fill:#999999,stroke:#6b6b6b,color:#ffffff
    class api,storage contenedor
    class estado,router,vAuth,vCatalogo,vDetalle,vLector,vPerfil,toast componente
    class placeholder externo
    style spac fill:#f7f7f7,stroke:#bbbbbb
    style vistas fill:#eef4fa,stroke:#c3d5e6
    style compartido fill:#eef4fa,stroke:#c3d5e6
```

### Lectura del diagrama

La SPA sigue un patrón claro por vista: cada vista descarga sus datos con `fetch`, los escribe en el
estado global y genera HTML con plantillas de cadena. El filtrado y la búsqueda del catálogo ocurren en
el cliente sobre el arreglo `mangas` ya descargado, sin volver al servidor, lo que da una respuesta
instantánea a costa de traer todo el catálogo de una sola vez.

Dos elementos del diagrama son puntos de atención: la constante `API` está fijada a
`http://localhost:3000/api` dentro del archivo, y el diccionario `MANGA_EXTRA` contiene metadatos de los
ocho mangas escritos a mano en el frontend en lugar de vivir en la base de datos.

---

## Trazabilidad entre niveles

| Elemento del Nivel 1 | Se descompone en el Nivel 2 | Se detalla en el Nivel 3 |
|----------------------|-----------------------------|--------------------------|
| MangaView (sistema) | SPA, Servidor Web y API REST, Base de datos PostgreSQL, Scripts de aprovisionamiento | Componentes de la API y componentes de la SPA |
| Lector registrado | Interactúa con la SPA; su sesión vive en localStorage | Vista de autenticación y middleware `verificarToken` |
| Administrador de contenido | Ejecuta los Scripts de aprovisionamiento | Los once archivos `setup*.js` |
| Cloudinary | Sin contenedor asociado, integración pendiente | `config/cloudinary.js`, configurado sin consumidores |

---

## Notas de fidelidad: diferencias entre lo documentado y lo implementado

Estas observaciones surgieron al construir los diagramas a partir del código real. Se registran aquí
porque son la entrada directa para la evaluación ATAM y para la actualización del ADR.

1. **El `README.md` y los ADR-01 a ADR-03 describen un frontend en React + TypeScript**, pero el frontend
   que realmente se sirve es la SPA en JavaScript vanilla decidida en el ADR-05. Los archivos de React
   siguen en el repositorio sin ejecutarse.
2. **Cloudinary está documentado como parte de la arquitectura y configurado en el código**, pero ningún
   controlador lo importa. Las imágenes de páginas apuntan a `via.placeholder.com` y las portadas se
   sirven desde `/covers` o se generan como SVG en el propio servidor.
3. **Existen once scripts `setup.js` a `setup11.js`** que cumplen la función de migraciones, con DDL y DML
   duplicados entre ellos y respecto a `config/schema.sql`. No hay un orden de ejecución declarado.
4. **No hay capa de repositorio ni de modelos.** El SQL vive dentro de los controladores, aunque el ADR-03
   declara un estilo en capas.
5. **No existen pruebas unitarias ni pipeline de integración continua** en el repositorio: no hay carpeta
   `.github/workflows`, ni framework de pruebas, ni script `test` en ninguno de los dos `package.json`.
6. **El manejo de errores devuelve `err.message` al cliente** con estado 500 en todos los controladores,
   lo que expone detalles internos de la base de datos.
7. **La URL del backend está escrita en el código del frontend** como `http://localhost:3000/api`, sin
   configuración por entorno.

---

## Declaración de uso de IA

Usé IA (Cursor) como apoyo para analizar la estructura del repositorio y traducir la arquitectura
existente a la notación C4 en Mermaid. Las decisiones arquitectónicas representadas en los diagramas
corresponden al proyecto MangaView que desarrollé durante el cuatrimestre. Verifiqué que cada elemento,
relación y endpoint dibujado coincide con el código fuente antes de subir este documento.
