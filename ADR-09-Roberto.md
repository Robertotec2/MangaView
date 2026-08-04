# ADR-09: El lector muestra páginas y el aprovisionamiento crea su propia base de datos

| Campo  | Valor |
|--------|-------|
| Autor  | Roberto |
| Fecha  | 04/08/2026 |
| Estado | `Aceptado` |
| Relación | Paga dos deudas que el ADR-07 había dejado registradas como abiertas |

---

## Contexto

Los dos hallazgos de este ADR salieron de levantar el proyecto y usarlo, no de leer el código. Es una
distinción que vale la pena anotar: el ADR-07 revisó la arquitectura y encontró problemas reales, pero
estos dos solo aparecen cuando se ejecuta la aplicación de principio a fin.

**El lector no mostraba páginas.** Es la pantalla que da sentido al producto y mostraba un recuadro gris
con el texto "Página 1 de 3". Al abrirlo encontré que el defecto era doble:

1. `renderReader` en `frontend/index.html` nunca creaba un elemento `<img>`. Pintaba a propósito un `div`
   con el número de página dentro, así que el lector jamás intentó cargar la imagen.
2. Aunque lo hubiera intentado, no habría servido: `paginas.imagen_url` apuntaba a `via.placeholder.com`,
   un servicio externo que dejó de responder. Es exactamente el mismo fallo que el ADR-07 corrigió en las
   portadas, sobrevivido en la tabla de páginas.

Había además un tercer detalle latente: `updateReaderPage` asignaba `img.src = p[currentPage]` buscando un
`<img>` que no existía, de modo que la navegación entre páginas tampoco tenía efecto visible.

**El aprovisionamiento no creaba su base de datos.** El ADR-07 afirmaba que un clon nuevo se levanta con
dos comandos, y no era del todo cierto: `seed.js` se conecta a la base `mangaview` y, sobre una instalación
limpia de PostgreSQL, esa base no existe. El comando fallaba antes de ejecutar una sola sentencia. En mi
máquina no se notaba porque la base ya estaba creada de los scripts antiguos, que es el mismo tipo de
punto ciego que el riesgo R-01 describía.

---

## Decisión 1 — Las páginas también las genera el servidor

Se añade `services/pagina.service.js` con su ruta en `/api/page/:titulo/:capitulo/:orden`, y
`rutaPagina` en los datos de demostración apunta ahí. El lector renderiza un `<img>` real con esa URL.

### ¿Por qué?

Es aplicar al lector la decisión que el ADR-07 ya había tomado para las portadas, y por las mismas
razones: funciona en un clon nuevo sin red, no versiona archivos binarios y no exige ningún paso manual.
Que el catálogo y el lector usen dos estrategias distintas para lo mismo habría sido una inconsistencia
sin justificación.

El servicio genera una página con viñetas, elegidas de forma determinista según el número de página, para
que dos páginas seguidas no se vean idénticas y la navegación se note. Reutiliza `paletaDe` y `escaparXML`
del servicio de portadas en lugar de duplicarlos, así que cada manga conserva su color y el escapado de
XML —que es una medida de seguridad, no cosmética— vive en un solo sitio.

### Alternativas descartadas

| Alternativa | Por qué la descarté |
|-------------|---------------------|
| Otro servicio de imágenes de relleno como `placehold.co` | Es el error que causó el problema: cambiar un tercero muerto por otro que puede morir mañana deja la demo dependiendo de una red y de un servicio ajeno |
| Versionar imágenes reales de páginas en el repositorio | Son archivos binarios pesados y de origen ajeno, con el problema de derechos que eso implica en un trabajo académico |
| Dejar el recuadro con el número de página | Es lo que había, y es justamente lo que hacía que la pantalla central del producto pareciera no funcionar |

---

## Decisión 2 — El aprovisionamiento crea la base de datos si falta

`db/crear-base.js` comprueba `pg_database` y ejecuta `CREATE DATABASE` cuando hace falta. Lo invocan tanto
`seed.js` como `reset.js`, este último antes del `DROP`, que es lo primero que toca la base.

### ¿Por qué?

Porque sin esto la afirmación de reproducibilidad del ADR-07 era falsa, y una afirmación falsa en la
documentación es peor que una omisión: quien clone el repositorio confía en ella y se topa con un error que
no sabe interpretar. El objetivo declarado era que la instalación no tuviera pasos manuales, y crear una
base de datos a mano desde pgAdmin es un paso manual.

`CREATE DATABASE` no admite parámetros ni se puede ejecutar dentro de una transacción, así que el nombre
—que viene de `DB_NAME`— se interpola como identificador citado, duplicando las comillas dobles. Hay una
prueba unitaria dedicada a eso, porque interpolar en SQL es precisamente lo que el resto del proyecto evita.

### Alternativas descartadas

| Alternativa | Por qué la descarté |
|-------------|---------------------|
| Documentar en el README que hay que crear la base a mano | Traslada al lector un trabajo que el programa puede hacer, y es la clase de paso que se olvida justo antes de una demo |
| Un script `db:create` aparte | Un comando más que memorizar para algo que `db:setup` puede resolver solo, sin ambigüedad sobre el orden |
| Usar `template1` o una base preexistente | Ensucia una base que no es del proyecto y complica el borrado |

---

## Consecuencias

**Lo que gano.** El lector cumple su función y la demo se puede recorrer completa: catálogo, ficha,
capítulo y páginas. La promesa de reproducibilidad del ADR-07 pasa a ser cierta y está comprobada: la
verifiqué creando una base con otro nombre desde cero. La suite creció de 37 a 53 pruebas, con el servicio
de páginas y el citado de identificadores cubiertos.

**Lo que sacrifico.** Las páginas son representaciones generadas, no páginas de manga reales, así que la
demo muestra la mecánica del lector y no contenido auténtico. Es el mismo intercambio que el ADR-07 aceptó
en las portadas y por el mismo motivo: en una demo evaluada, que nada aparezca roto vale más que la
fidelidad visual. Además el servidor gasta un poco de CPU generando cada página, mitigado con la misma
cabecera `Cache-Control` de un día que ya usaban las portadas.

**Una nota sobre las cifras del ADR-08.** Aquel documento habla de 37 pruebas, que era el número correcto
en su fecha. Se deja como está, porque un ADR registra el momento en que se tomó la decisión; el total
vigente es el que informa la suite al ejecutarse.

---

## Deuda técnica que sigue abierta

De la lista del ADR-07 se pagan las dos filas correspondientes al lector y a la reproducibilidad. Siguen
abiertas, sin cambios: el SQL embebido en `manga.controller.js` y `capitulo.controller.js`, el proyecto
React sin uso, Cloudinary sin consumidores, `MANGA_EXTRA` indexado por el id numérico del manga, las
credenciales con valor por defecto en `DatabaseSingleton` y la URL de la API escrita en `index.html`.

Se añade una fila nueva: **el lector no precarga la página siguiente**, así que al avanzar hay un instante
en blanco mientras llega la imagen. No es un problema de arquitectura y no afecta a la demo, pero conviene
que quede anotado ahora que el lector muestra imágenes de verdad.

---

## Declaración de uso de IA

Usé IA (Cursor) para levantar el proyecto, recorrerlo en el navegador y localizar la causa de que el lector
no mostrara nada, que resultó ser doble y no la que yo suponía: no era solo la URL muerta, era que el
lector nunca creaba el elemento de imagen. También escribió el servicio de páginas, el paso de creación de
la base y sus pruebas. La decisión de generar las páginas en el servidor en lugar de buscar otro servicio
externo, y la de que la creación de la base viva dentro de `db:setup` en lugar de en un comando aparte, son
mías y están justificadas arriba. Verifiqué los dos arreglos ejecutándolos: el lector en el navegador y la
creación de la base contra un nombre nuevo.
