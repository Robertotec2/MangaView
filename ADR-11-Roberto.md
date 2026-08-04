# ADR-11: Listas, follows, cita de manga, moderación, respuestas y marcadores

| Campo  | Valor |
|--------|-------|
| Autor  | Roberto |
| Fecha  | 04/08/2026 |
| Estado | `Aceptado` |
| Relación | Extiende el ADR-10 y cierra la deuda de moderación mínima del foro |

---

## Contexto

Tras el foro del ADR-10 pedí seis funciones de producto que convierten MangaView de
catálogo + foro en una comunidad de lectura usable:

1. Listas de lectura (pendiente / leyendo / terminado)
2. Seguir mangas con avisos de capítulos nuevos
3. Citar un manga del catálogo en una publicación
4. Moderación mínima: editar/borrar lo propio y reportar
5. Respuestas anidadas en comentarios
6. Marcadores de página en el lector

---

## Decisiones

**Listas ≠ favoritos.** Favoritos siguen siendo una marca suelta. Las listas son un
estado exclusivo por manga (`UNIQUE(usuario_id, manga_id)`), porque un título no puede
estar a la vez en “pendiente” y “terminado”.

**Follows ≠ favoritos.** Seguir alimenta `GET /api/biblioteca/avisos`: capítulos de los
mangas seguidos cuya fecha es posterior al follow. Además el seed publica avisos en
Noticias con `manga_id` para que el foro también muestre novedades citadas.

**Cita de manga.** `foro_publicaciones.manga_id` opcional. La SPA muestra portada y
enlace a la ficha. No hace falta subir imágenes: reutiliza las portadas del catálogo.

**Moderación mínima.** Soft-delete (`borrada` / `borrado`) para no romper hilos.
Editar y borrar solo el autor (`403` si no). Reportes en `foro_reportes` sin panel
admin todavía: el flujo queda demostrado y la deuda de un moderador real queda
anotada, no inventada.

**Un solo nivel de respuestas.** Si alguien responde a una respuesta, cuelga del
comentario raíz. Evita cascadas ilegibles sin perder el “responder a…”.

**Marcadores ≠ progreso.** El progreso recuerda por dónde ibas; el marcador es un
punto al que quieres volver (`UNIQUE` por usuario, capítulo y página).

Todo vive en capas (repositorio → servicio → controlador), igual que el foro.

---

## Consecuencias

- La suite pasa a 108 pruebas unitarias.
- Nuevas rutas bajo `/api/biblioteca` y extensión de `/api/foro`.
- Deuda cerrada: moderación mínima del ADR-10.
- Deuda abierta: panel de admin para reportes; paginación del foro; capítulos demo
  solo en tres mangas (los avisos de capítulos dependen de eso).

---

## Declaración de uso de IA

Usé IA (Cursor) para implementar el esquema, las capas, la SPA y las pruebas. Las
decisiones de separar listas/follows/marcadores del progreso y de limitar el
anidado a un nivel son mías.
