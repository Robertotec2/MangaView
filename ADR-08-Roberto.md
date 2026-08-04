# ADR-08: Estrategia de pruebas e integración continua

| Campo  | Valor |
|--------|-------|
| Autor  | Roberto |
| Fecha  | 03/08/2026 |
| Estado | `Aceptado` |
| Depende de | ADR-07, que hizo el código testeable |

---

## Contexto

Hasta esta unidad el proyecto no tenía ninguna prueba automatizada ni script `test` en el
`package.json`. La única forma de saber si algo seguía funcionando era abrir el navegador y probarlo a
mano, lo que significa que cualquier cambio podía romper algo sin que nadie se enterara hasta la demo.

El obstáculo no era la falta de ganas sino la forma del código: mientras el controlador mezclaba HTTP,
lógica de negocio y SQL, cualquier prueba de la lógica de registro habría necesitado una base de datos
PostgreSQL levantada. La refactorización del ADR-07 es lo que hizo posible este ADR.

---

## Decisión

Se adopta una **suite de pruebas unitarias que no toca la base de datos**, ejecutada automáticamente en
cada push mediante GitHub Actions.

### Qué se prueba y por qué eso

La regla que seguí fue probar donde una regresión sería silenciosa y costosa, no perseguir un porcentaje
de cobertura:

| Módulo | Qué se verifica | Por qué importa |
|--------|-----------------|-----------------|
| `utils/validadores.js` | Correos, longitud de contraseña, conteo de errores | Es la puerta de entrada de datos del sistema y hasta ahora la API no validaba nada |
| `services/cover.service.js` | Paletas, determinismo y escapado de XML | De aquí salen las ocho portadas del catálogo, la primera pantalla de la demo |
| `middleware/auth.js` | Token ausente, ajeno, expirado y válido | Es lo único que separa las rutas públicas de las protegidas |
| `services/usuario.service.js` | Que la contraseña no se guarde ni se devuelva en claro, que la validación corte antes del repositorio, que la unicidad se traduzca a 409 y que el login no revele qué correos existen | Concentra las decisiones de seguridad del sistema |
| `patterns/ProgresoObserver.js` | Suscripción, baja y aislamiento de fallos | Un observer defectuoso no debe tumbar el guardado de progreso |

Todas las pruebas siguen la estructura **Arrange, Act, Assert**, con las tres secciones marcadas
explícitamente para que se lea qué se prepara, qué se ejecuta y qué se comprueba.

### Ninguna prueba necesita PostgreSQL

Es la propiedad más importante de la suite y no es casualidad. Las funciones puras se prueban
directamente, y el servicio de usuarios recibe un **repositorio falso en memoria** gracias a la fábrica
con inyección de dependencias del ADR-07. La consecuencia práctica es que el pipeline no necesita
levantar un servicio de base de datos, así que es rápido, determinista y no falla por motivos ajenos al
código.

---

## Alternativas descartadas

| Alternativa | Por qué la descarté |
|-------------|---------------------|
| **Jest** | Es el estándar de hecho en Node y tiene mejor salida en consola, pero instala cientos de paquetes y un archivo de configuración para lo que el runtime ya trae. El ejecutor `node:test` viene incluido desde Node 18 y cubre todo lo que necesito |
| **Mocha con Chai** | Mismo argumento, y además exige elegir por separado el ejecutor y la librería de aserciones |
| **Pruebas de integración con una base de datos real en CI** | Aportarían confianza sobre el SQL, pero obligan a levantar un servicio PostgreSQL en cada ejecución y a mantener datos de prueba. Es el siguiente paso natural, no el primero |
| **Pruebas de extremo a extremo con Playwright** | Verificarían la demo completa, pero son lentas, frágiles y desproporcionadas para el alcance del proyecto |
| **Incluir el frontend en el pipeline** | El frontend que se sirve es un archivo HTML estático sin proceso de build, así que no hay nada que compilar ni empaquetar. El proyecto React del repositorio es código muerto según el ADR-05 |

---

## El pipeline

`.github/workflows/ci.yml` se ejecuta en cada push a cualquier rama y en cada pull request:

```mermaid
flowchart LR
    push["Push o Pull Request"] --> checkout["Descargar el repositorio"]
    checkout --> node["Preparar Node<br/>20, 22 y 24 en paralelo"]
    node --> ci["npm ci<br/>instala el arbol exacto<br/>del package-lock.json"]
    ci --> check["node --check<br/>sobre todos los modulos"]
    check --> test["npm test<br/>toda la suite unitaria"]
    test --> verde["Pipeline en verde"]

    classDef paso fill:#85bbf0,stroke:#5d82a8,color:#000000
    classDef inicio fill:#08427b,stroke:#052e56,color:#ffffff
    classDef fin fill:#4caf7d,stroke:#2e6b4d,color:#ffffff
    class checkout,node,ci,check,test paso
    class push inicio
    class verde fin
```

Tres detalles deliberados:

**`npm ci` en lugar de `npm install`.** Instala exactamente las versiones del `package-lock.json`, así que
el pipeline prueba el mismo árbol de dependencias en cada ejecución. Con `npm install` una dependencia
transitiva podría cambiar de versión sin que nadie lo pidiera y hacer fallar —o pasar— una prueba por
motivos que no están en el repositorio.

**Matriz de tres versiones de Node.** Node 20, 22 y 24 corren en paralelo con `fail-fast: false`, para ver
el resultado de todas aunque una falle. Sirve para detectar que el proyecto no depende de una versión
concreta del runtime.

**Un paso de verificación sintáctica.** Antes de las pruebas se ejecuta `node --check` sobre todos los
módulos del backend. Cubre los archivos que las pruebas no alcanzan, como `seed.js` y `reset.js`, y evita
que un error de escritura llegue a la rama.

---

## Consecuencias

**Lo que gano.** Cada push queda verificado sin intervención. Las decisiones de seguridad que tomé en el
ADR-07 —no devolver la contraseña, no revelar qué correos existen, escapar el XML de las portadas— dejan
de ser buenas intenciones y pasan a ser afirmaciones comprobadas: si alguien las rompe, el pipeline se
pone en rojo. La suite documenta además el comportamiento esperado mejor que cualquier comentario.

**Lo que sacrifico.** Las pruebas cubren la lógica pura y el módulo de usuarios, pero **no verifican que el
SQL sea correcto ni que la aplicación funcione de extremo a extremo**. `manga.controller.js` y
`capitulo.controller.js`, que siguen con SQL embebido, no tienen pruebas: un error en una de esas
consultas pasaría el pipeline sin problema. Es una limitación conocida y es coherente con la deuda técnica
que el ADR-07 dejó registrada: cuando esos módulos pasen a repositorios, podrán probarse igual que
usuarios.

---

## Declaración de uso de IA

Usé IA (Cursor) para escribir la suite de pruebas y el archivo del pipeline, y para ejecutarlas y
verificar que las 37 pasan y que el comando devuelve el código de salida correcto ante un fallo, que es lo
que hace que la integración continua sirva de algo. La decisión de qué probar —priorizar las piezas donde
una regresión sería silenciosa, en lugar de perseguir cobertura— y la de no incluir pruebas de integración
con base de datos en esta etapa son mías y están justificadas arriba. Revisé cada prueba antes de subirla.
