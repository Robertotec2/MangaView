# ADR-02: Vistas arquitectónicas del sistema

| Campo  | Valor |
|--------|-------|
| Autor  | Roberto |
| Fecha  | 04/06/2026 |
| Estado | `Aceptado` |

---

## Contexto

MangaView es una app web para leer manga. Tiene un frontend en React, una API en Node.js con Express, una base de datos en PostgreSQL y usa Cloudinary para las imágenes.

Hasta ahorita solo habia documentado qué tecnologías use y por qué. Pero eso no es suficiente para entender cómo funciona el sistema completo. Necesitaba una forma de mostrar cómo está organizado el código, dónde corre, cómo se despliega y cómo se comunican las partes cuando alguien está leyendo un manga. Por eso decidi documentar las vistas arquitectónicas.

---

## Decisión

Voy a usar las cuatro vistas del modelo 4+1: vista lógica, vista física, vista de despliegue y vista de procesos.

### ¿Por qué?

Cada vista responde una pregunta distinta y juntas dan una imagen completa del sistema sin repetir información.

La vista lógica muestra cómo está dividido el código en partes. La física muestra en qué máquinas corre. La de despliegue muestra cómo los servicios se montan sobre esa infraestructura. Y la de procesos muestra qué pasa exactamente cuando un usuario abre un capítulo, paso a paso.

Si solo hiciera un diagrama mezclaría todo y sería confuso. Con las cuatro separadas es más fácil explicar cada parte sin que interfiera con las demás.

### Alternativas consideradas

| Alternativa | Por qué la descarté |
|-------------|---------------------|
| Solo el diagrama C4 que ya tenía | Muestra bien la estructura pero no dice nada de cómo fluyen las peticiones en tiempo real |
| Solo diagrama de clases UML | Describe el código pero ignora completamente la infraestructura y los procesos |
| No hacer vistas y dejar solo el código | Nadie que no conozca el proyecto podría entender cómo funciona sin leerlo completo |

---

## Consecuencias

**Lo que gano:**

Con estas cuatro vistas cualquier persona puede entender el sistema desde distintos angulos sin necesidad de meterse al código. También me ayuda a mi mismo a tener claro cómo está organizado todo antes de seguir desarrollando.

**Lo que sacrifico:**

Son cuatro diagramas que tengo que mantener actualizados cada que el sistema cambie. Si no los actualizo se vuelven inútiles o peor, engañosos. Para un proyecto de este tamaño es bastante documentación, pero es lo que pide la materia y tampoco está de más practicarlo.

---

## Diagramas

### Vista lógica

Cómo está organizado el sistema en capas y qué componentes hay en cada una.

```mermaid
graph TD
  subgraph Frontend
    A[Catálogo de Mangas]
    B[Lector de Páginas]
    C[Autenticación]
    D[Favoritos y Progreso]
  end

  subgraph API REST
    E[Rutas]
    F[Controladores]
    G[Modelos]
  end

  subgraph Persistencia
    H[(PostgreSQL)]
  end

  subgraph Externo
    I[Cloudinary CDN]
  end

  A --> E
  B --> E
  C --> E
  D --> E
  E --> F
  F --> G
  G --> H
  F --> I
```

---

### Vista física

Los nodos de infraestructura donde corre el sistema.

```mermaid
graph LR
  A[Dispositivo del usuario\nNavegador Web] -->|HTTPS| B[Servidor de aplicación\nNode.js + Express]
  B -->|TCP 5432| C[Servidor de base de datos\nPostgreSQL]
  B -->|HTTPS| D[Cloudinary\nServicio externo]
  D -->|URLs de imágenes| A
```

---

### Vista de despliegue

Cómo están desplegados los servicios sobre la infraestructura.

```mermaid
graph TD
  subgraph Dispositivo del usuario
    A[React App]
  end

  subgraph Servidor de aplicación
    B[Proceso Node.js\npuerto 3000]
  end

  subgraph Servidor de datos
    C[(PostgreSQL\npuerto 5432)]
  end

  subgraph Servicio externo
    D[Cloudinary CDN]
  end

  A -->|JSON sobre HTTP| B
  B -->|Consultas SQL| C
  B -->|Upload API| D
  D -->|Imágenes| A
```

---

### Vista de procesos

Lo que pasa cuando un usuario abre y lee un capítulo de manga.

```mermaid
sequenceDiagram
  participant U as Usuario
  participant F as React
  participant A as API Node.js
  participant DB as PostgreSQL
  participant C as Cloudinary

  U->>F: Selecciona un capítulo
  F->>A: GET /api/capitulos/:id
  A->>DB: SELECT páginas WHERE capitulo_id = :id
  DB-->>A: Lista de páginas con rutas de imagen
  A-->>F: JSON con URLs de Cloudinary
  F->>C: Pide las imágenes por URL
  C-->>F: Entrega las imágenes
  F-->>U: Muestra el capítulo

  U->>F: Avanza o cierra
  F->>A: POST /api/progreso
  A->>DB: UPDATE progreso SET pagina_actual = :n
  DB-->>A: OK
  A-->>F: Progreso guardado
```

---

## Declaración de uso de IA

Use IA (Claude de Anthropic) para ayudarme a redactar y estructurar este documento. Las decisiones y el contenido son del proyecto que he estado desarrollando durante el cuatrimestre. Revise todo antes de subirlo.

<!-- Rama: integracion-de-apis — aquí se aplican las 4 vistas arquitectónicas -->
