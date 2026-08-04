# ADR-10: Foro de la comunidad

| Campo  | Valor |
|--------|-------|
| Autor  | Roberto |
| Fecha  | 04/08/2026 |
| Estado | `Aceptado` |
| Relación | Primer módulo que nace con las capas del ADR-07 ya puestas, en lugar de llegar a ellas refactorizando |

---

## Contexto

MangaView era hasta ahora una aplicación de lectura en un solo sentido: el catálogo se consulta y los
capítulos se leen, pero no había ningún sitio donde las personas que leen se hablaran entre ellas. El foro
añade eso, con publicaciones, comentarios, me gusta y no me gusta, un contador de cuánta gente vio cada
publicación, un buscador y cinco temas.

Es la primera funcionalidad grande que se construye **después** de la refactorización del ADR-07, y eso
cambia cómo se aborda. En los módulos anteriores las capas llegaron corrigiendo un controlador que ya mezclaba
HTTP, validación y SQL. Aquí no había nada que corregir, así que la pregunta era la contraria: si el estilo
en capas del ADR-03 vale de verdad, un módulo nuevo debería salir así desde el principio y sin que cueste
más. Este ADR registra ese contraste, y también las tres decisiones donde el foro sí obligó a inventar algo
que no existía en el proyecto.

---

## Decisión 1 — Las vistas se cuentan por persona, no con un contador

El requisito era mostrar «la cantidad de personas que vieron la publicación». La lectura literal importa:
son **personas**, no aperturas. Un contador `vistas INT` que se incrementa en cada `GET` habría sido la
solución más corta, y habría respondido a otra pregunta —cuántas veces se abrió— que además sube sola cada
vez que alguien recarga.

Se añade por eso una tabla `foro_vistas` con una fila por visitante y publicación, y una restricción
`UNIQUE (publicacion_id, huella)`. El número que se muestra es un `COUNT` de esa tabla, así que es
exactamente el enunciado: personas distintas.

La huella identifica al visitante y se calcula en `foro.service.js`:

- **Con sesión iniciada** es `u:<id de la cuenta>`. La misma persona cuenta una sola vez aunque entre desde
  el móvil y desde el ordenador, que es lo que significa «una persona».
- **Sin sesión** es `a:` seguido de un SHA-256 de la dirección de conexión, el navegador y el secreto del
  servidor como sal. Sirve para no contar diez veces a quien recarga.

### ¿Por qué así y no de otras formas?

| Alternativa | Por qué la descarté |
|-------------|---------------------|
| Un contador `vistas INT` que se incrementa en cada GET | Cuenta visitas, no personas. Responde a una pregunta distinta de la que se pidió y se infla al recargar |
| Guardar la IP en claro para distinguir visitantes | Es un dato personal, y la política de privacidad de la aplicación afirma que no se recopila. Guardarla habría convertido esa afirmación en una mentira |
| Contar solo a los usuarios registrados | El foro se puede leer sin cuenta, así que el contador diría casi siempre menos de lo que es y en las publicaciones más vistas por gente de paso diría cero |
| Una cookie de visitante | La política de privacidad declara que no se usan cookies de rastreo, y una cookie para contar visitas es exactamente eso |

El hash es irreversible y lleva sal, así que ni se puede recuperar la IP desde la base de datos ni se puede
reproducir la huella desde fuera del servidor. Hay una prueba unitaria que comprueba que la huella anónima
no contiene la dirección ni el navegador en claro: existe precisamente para que la afirmación de la política
de privacidad no deje de ser cierta sin que nadie se dé cuenta. Y la política se actualizó con una sección
nueva que explica el mecanismo, porque una funcionalidad que mide visitantes cambia qué datos trata la
aplicación y callarlo no era una opción.

**Lo que cuesta.** Una tabla que crece con cada visitante en lugar de un entero que se incrementa, y un
`COUNT` por publicación en cada listado en lugar de leer una columna. A la escala del proyecto es
irrelevante, y hay un índice por `publicacion_id` para ese conteo; si algún día dejara de serlo, la salida
es un contador desnormalizado que se recalcula, no volver a contar visitas en vez de personas.

---

## Decisión 2 — Una sola fila de reacción por persona, y volver a pulsar la retira

`foro_reacciones` guarda `valor SMALLINT CHECK (valor IN (-1, 1))` con `UNIQUE (publicacion_id,
usuario_id)`. De ahí salen las tres conductas que la gente espera de un botón de me gusta, sin necesidad de
ninguna lógica que las vigile:

- No se puede votar dos veces: lo impide la clave única, no una comprobación en el código.
- Pulsar el botón contrario **cambia** el voto en lugar de sumar uno nuevo, con `ON CONFLICT DO UPDATE`.
- Pulsar el mismo botón otra vez **retira** el voto, porque el repositorio primero intenta borrar esa
  reacción exacta y solo inserta si no borró nada.

Los totales de me gusta y no me gusta se derivan contando esa tabla, así que no pueden desincronizarse de
los votos reales. Es la misma idea que en las vistas: el estado se guarda una vez y los números se calculan.

### Alternativas descartadas

| Alternativa | Por qué la descarté |
|-------------|---------------------|
| Dos columnas `likes` y `dislikes` en la publicación | No se sabría quién votó, así que no se podría impedir el voto doble ni marcar en la interfaz el voto propio. Y dos contadores se desincronizan del historial en cuanto algo falla a medias |
| Una fila por cada pulsación, sin clave única | Convierte el botón en un contador de clics y hace trivial inflar una publicación |
| No permitir retirar el voto | Es una decisión de producto que molesta sin ganar nada; con la clave única ya puesta, permitirlo cuesta una sentencia |

El `CHECK` de la columna es la última línea de defensa: el servicio ya rechaza con un 400 cualquier valor
que no sea 1 o −1, y la restricción garantiza que no entre nada más aunque un día se añada otra ruta que
escriba en esa tabla sin pasar por el servicio.

---

## Decisión 3 — El módulo nace con las capas puestas

El foro se organiza igual que el módulo de usuarios tras el ADR-07: ruta → controlador → servicio →
repositorio → `DatabaseSingleton`. No es un logro nuevo, es la comprobación de que el estilo del ADR-03
funciona cuando se aplica desde el principio, y el contraste con `manga.controller.js` y
`capitulo.controller.js` —que siguen con su SQL embebido— es intencionado.

Vale la pena anotar qué se ganó concretamente al hacerlo así:

- **Las reglas de negocio se prueban sin base de datos.** `foro.service.js` se construye con una fábrica que
  recibe su repositorio, así que las pruebas le inyectan uno falso en memoria. Se verifican el orden por
  defecto, el 404 del tema inexistente, el 409 del título repetido, el rechazo de reacciones distintas de
  1 y −1 y que un error inesperado de base de datos no se disfraza de error de negocio. Nada de eso
  necesita PostgreSQL, y por eso todo corre en el pipeline.
- **El SQL vive en un solo archivo.** El texto del buscador llega siempre como parámetro y nunca concatenado,
  y los conteos de comentarios, vistas y reacciones se escriben una única vez para que el listado y el
  detalle no puedan divergir en la forma de contar lo mismo.
- **Los errores llegan con su significado.** Un título repetido en el mismo tema devuelve 409 con una frase
  entendible en lugar del mensaje interno de PostgreSQL con un 500.

Hubo un detalle que el diseño en capas no cubría y sí hubo que resolver. El foro se puede leer sin cuenta,
pero el detalle de una publicación **cambia según quién mire**: cuenta como visita a esa persona y le
devuelve su propia reacción para poder marcar el botón. `verificarToken` no servía, porque corta con 401 a
quien no tiene sesión, y no mirar el token dejaría al lector registrado sin sus datos. Se añadió
`identificarUsuario`, que lee el token si viene y deja pasar igual cuando no hay ninguno o cuando está
vencido. Lo que nunca hace es conceder identidad con un token inválido, y hay cuatro pruebas unitarias que
fijan exactamente esa distinción, porque un middleware permisivo es el sitio donde un error de este tipo
pasa desapercibido.

---

## Decisión 4 — Los cinco temas, y por qué esos

Tres los pedía el alcance: **Discusiones**, **Recomendaciones** y **Noticias**. Los otros dos se eligieron
por lo que necesita una comunidad de lectura de manga en concreto, no por rellenar:

- **Spoilers.** En un sitio donde cada persona va por un capítulo distinto, que alguien destroce una trama es
  el motivo más común de abandono de un foro. Un tema propio permite hablar de lo último sin arruinárselo a
  quien va atrasado, y convierte una norma social difusa en una que la estructura ya sugiere.
- **Ayuda y soporte.** Las dudas sobre la plataforma —si se guarda el progreso, por qué no aparecen los
  favoritos— no son conversaciones sobre manga, y sin un sitio propio acaban mezcladas en Discusiones,
  donde además nadie las busca.

Descarté un tema de **fan art**, que era el candidato obvio: la plataforma no tiene subida de imágenes
—Cloudinary sigue configurado y sin consumidores desde el ADR-01— así que habría sido un tablón de texto
sobre dibujos que no se pueden ver. Preferí no crear una sección que la aplicación no puede sostener. Si
algún día se integra Cloudinary, ese tema es lo primero que tiene sentido añadir.

Los temas viven en la tabla `foro_temas`, no en un `enum` ni en una lista en el código, así que añadir o
renombrar uno es una fila del seed y no un despliegue. El selector del formulario y las tarjetas de la
interfaz se construyen desde la API, de modo que no hay ninguna lista de temas duplicada en el frontend.

---

## Consecuencias

**Lo que gano.** La aplicación pasa de ser un catálogo a tener una comunidad, con las seis capacidades
pedidas funcionando: publicar, comentar, votar en los dos sentidos, ver cuánta gente vio cada publicación,
buscar y navegar por temas. El módulo queda como la referencia interna de a dónde deberían llegar los otros
dos controladores. La suite crece de 53 a 95 pruebas unitarias, todas sin base de datos.

**Lo que sacrifico.** El foro es la primera parte del proyecto donde el contenido lo escribe cualquier
persona registrada, y eso trae dos costes que antes no existían. El primero es el escapado de HTML en la
SPA, que hay que recordar aplicar en cada plantilla nueva: mientras todo el contenido venía del catálogo se
podía interpolar sin más, y ahora no. El segundo es que **no hay moderación**: no se puede editar ni borrar
una publicación, ni reportarla, ni hay ningún papel de moderador. Es una ausencia deliberada para no
inventar un sistema de permisos que el alcance no pedía, pero es la primera cosa que un foro real necesita y
queda anotada como tal.

**Una nota sobre el borrado de cuentas.** `foro_publicaciones` y `foro_comentarios` referencian a `usuarios`
con `ON DELETE SET NULL`, y la interfaz muestra «Cuenta eliminada» como autor. La alternativa era borrar en
cascada, que dejaría hilos con huecos y respuestas colgando de publicaciones que ya no existen. La política
de privacidad se actualizó para decirlo, porque afecta a lo que ocurre con los datos de alguien que se va.

---

## Deuda técnica que sigue abierta

Del ADR-09 no se paga ninguna fila: sigue el SQL embebido en `manga.controller.js` y
`capitulo.controller.js`, el proyecto React sin uso, Cloudinary sin consumidores, `MANGA_EXTRA` indexado por
el id numérico del manga, las credenciales con valor por defecto en `DatabaseSingleton`, la URL de la API
escrita en `index.html` y el lector sin precarga de la página siguiente.

Se añaden cuatro filas nuevas, todas del foro:

| Deuda | Por qué se acepta ahora |
|-------|-------------------------|
| **No hay moderación**: no se puede editar, borrar ni reportar | El alcance pedía crear, comentar y votar. Añadir permisos y papeles habría duplicado el módulo |
| **El listado no está paginado**: devuelve todas las publicaciones del tema | Con diez publicaciones no se nota. Es lo primero que hay que hacer si el foro crece, y el índice `(tema_id, fecha DESC)` ya está puesto para ello |
| **La búsqueda usa `ILIKE '%texto%'`**: no aprovecha índices ni entiende variantes de una palabra | Cumple con este volumen. La salida natural es la búsqueda de texto completo de PostgreSQL, que es un cambio contenido dentro del repositorio |
| **El catálogo sigue interpolando sin escapar** | Su contenido no lo escribe ningún usuario, así que no hay vector. Conviene unificarlo por consistencia, no por riesgo actual |

También queda anotado que el título es clave natural dentro de un tema —`UNIQUE (tema_id, titulo)`— para que
el seed pueda ser idempotente. El efecto secundario es que dos personas no pueden abrir dos hilos con el
mismo título en el mismo tema; se traduce a un 409 con un mensaje claro, y en un foro es más una ayuda que
un estorbo, pero es una restricción impuesta por el aprovisionamiento y no por el dominio, y por eso se deja
por escrito.

---

## Declaración de uso de IA

Usé IA (Cursor) para escribir el esquema, el repositorio, el servicio, el controlador, las rutas, la
interfaz del foro dentro de la SPA y las 42 pruebas unitarias nuevas, además de actualizar los diagramas C4.
Al documentar el Nivel 2 la IA detectó que el diagrama seguía dibujando `via.placeholder.com` como sistema
externo aunque el ADR-09 ya lo había eliminado del código, y se corrigió.

Las decisiones de diseño son mías y están justificadas arriba: contar personas con una tabla de visitas en
lugar de un contador de aperturas —y con una huella hasheada en lugar de la IP, para no contradecir la
política de privacidad—, derivar los totales de reacciones en lugar de mantener contadores, y elegir
Spoilers y Ayuda como los dos temas que faltaban descartando fan art porque la plataforma no puede mostrar
imágenes. Verifiqué el módulo completo ejecutándolo: la API con sus casos de error, y en el navegador el
listado, el buscador, el filtro por temas, el detalle con el contador de personas, el ciclo de votar,
cambiar y retirar el voto, y el envío de comentarios.
