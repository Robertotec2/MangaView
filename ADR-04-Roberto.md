# ADR-04: Patrones de diseño GOF en MangaView

| Campo  | Valor |
|--------|-------|
| Autor  | Roberto |
| Fecha  | 04/06/2026 |
| Estado | `Aceptado` |

---

## Contexto

MangaView ya tiene una API REST funcional con rutas, controladores y conexión a PostgreSQL. En esta etapa se identificaron dos problemas concretos en el código que se resolvieron aplicando patrones GOF de categorías distintas.

El primero es que la conexión a la base de datos se estaba creando de forma descontrolada — cada módulo que la necesitaba podía instanciar su propio pool, lo que desperdicia recursos y puede causar problemas de concurrencia. El segundo es que no había forma de reaccionar de forma desacoplada cuando un usuario guardaba su progreso de lectura, lo que complica agregar funcionalidades futuras como notificaciones o estadísticas.

---

## Decisión

Se implementaron dos patrones GOF de categorías distintas:

**Singleton (Creacional)** para la conexión a la base de datos.
**Observer (Comportamiento)** para el sistema de progreso de lectura.

---

## Patrón 1 — Singleton (Creacional)

### ¿Qué problema resuelve?

El pool de conexiones a PostgreSQL debe existir una sola vez en toda la aplicación. Si cada controlador creara su propia instancia de `Pool`, se abriría una cantidad innecesaria de conexiones al servidor de base de datos, lo que puede agotarlas y causar errores bajo carga.

### ¿Por qué Singleton?

Singleton garantiza que aunque múltiples módulos importen la conexión, todos comparten la misma instancia. En Node.js esto se logra de forma natural con el sistema de módulos (require cachea el resultado), pero Singleton hace explícita esta intención y la documenta como decisión de diseño.

### Alternativas descartadas

| Alternativa | Por qué la descarté |
|-------------|---------------------|
| Crear el pool en cada controlador | Abre múltiples conexiones innecesarias y es difícil de mantener |
| Variable global | Funciona pero no encapsula la lógica de creación ni comunica la intención de una sola instancia |

---

## Patrón 2 — Observer (Comportamiento)

### ¿Qué problema resuelve?

Cuando un usuario guarda su progreso de lectura, pueden necesitar ocurrir varias cosas: actualizar estadísticas, registrar actividad, o en el futuro enviar notificaciones. Si toda esa lógica vive dentro del controlador, se vuelve un bloque monolítico difícil de extender.

### ¿Por qué Observer?

Observer permite que el controlador solo emita un evento ("progreso guardado") y que otros módulos reaccionen a ese evento de forma independiente. Así se puede agregar o quitar comportamiento sin tocar el código del controlador.

### Alternativas descartadas

| Alternativa | Por qué la descarté |
|-------------|---------------------|
| Lógica directa en el controlador | Acopla responsabilidades distintas en un solo lugar |
| Middleware de Express | Sirve para interceptar peticiones, no para reaccionar a eventos de negocio |

---

## Consecuencias

**Lo que gano:**

El Singleton elimina el riesgo de abrir conexiones duplicadas y centraliza la configuración de la BD en un solo lugar. El Observer hace que agregar nuevas reacciones al progreso de lectura sea tan simple como registrar un nuevo listener, sin modificar el controlador.

**Lo que sacrifico:**

El Singleton dificulta hacer pruebas unitarias porque hay una dependencia global implícita. El Observer puede complicar el debugging si hay muchos listeners y no está claro cuál causó un error.

---

## Declaración de uso de IA

Use IA (Claude de Anthropic) para ayudarme a redactar y estructurar este documento. Las decisiones corresponden al proyecto MangaView desarrollado durante el cuatrimestre. Revisé el contenido antes de subirlo.
