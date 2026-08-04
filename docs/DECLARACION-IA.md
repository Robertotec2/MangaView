# Declaración de uso de inteligencia artificial

| Campo | Valor |
|-------|-------|
| Autor | Roberto |
| Proyecto | MangaView |
| Actividad | Actividad #40 — Proyecto: Documentación final y demo |
| Herramienta | Cursor |
| Fecha | 03/08/2026 |

---

## Declaración

Para esta entrega usé inteligencia artificial (Cursor) como herramienta de apoyo en tres frentes: la
elaboración de los diagramas C4 en sintaxis Mermaid, el análisis del repositorio que sustenta la
evaluación ATAM, y la refactorización del backend junto con las pruebas unitarias y el pipeline de
integración continua. La IA me permitió recorrer el historial completo del proyecto, incluidas las ramas
que nunca se fusionaron, y detectar así que los patrones GOF del ADR-04 y el registro de deuda técnica
del ADR-06 solo existían fuera de la línea principal, que ninguno de los once scripts de aprovisionamiento
insertaba los tres primeros mangas del catálogo, y que la carpeta de portadas que Express publicaba no era
la misma a la que los scripts descargaban las imágenes. Las decisiones arquitectónicas —evaluar con ATAM
antes de refactorizar, aceptar de forma consciente el trade-off de la autenticación sin estado, limitar la
separación en capas al módulo de usuarios y priorizar la reproducibilidad del entorno sobre la fidelidad
visual de las portadas— son mías, están justificadas en los ADR correspondientes y las tomé después de
entender el problema, no antes. Revisé, ejecuté y verifiqué cada diagrama, cada afirmación y cada cambio
de código contra el repositorio antes de subirlos.

---

## Detalle por entregable

| Entregable | En qué ayudó la IA | Qué aporté yo |
|------------|--------------------|---------------|
| Diagramas C4 | Escribir la sintaxis Mermaid, mantener los colores y estereotipos del modelo, verificar que los tres niveles renderizan | Decidir qué es contenedor y qué es componente, y exigir que los diagramas describan el sistema real y no el documentado |
| Evaluación ATAM | Rastrear el código para reunir la evidencia de cada hallazgo | Elegir los atributos de calidad relevantes y clasificar cada hallazgo como riesgo, trade-off o punto de sensibilidad |
| Refactorización | Aplicar los cambios y ejecutar las verificaciones | Decidir qué refactorizar, qué dejar quieto y qué registrar como deuda |
| Pruebas unitarias | Escribir los casos y ejecutarlos | Decidir qué probar: las piezas donde una regresión sería silenciosa, en lugar de perseguir un porcentaje de cobertura |
| Pipeline de CI | Redactar el archivo de GitHub Actions | Decidir que las pruebas no dependan de PostgreSQL para que el pipeline sea rápido y determinista |
| ADR | Reconstruir el orden real de las decisiones a partir del historial | El razonamiento de cada decisión y las alternativas descartadas |

---

## Lo que no hizo la IA

No delegué el criterio arquitectónico. Los puntos donde la evaluación concluyó que **no** había que tocar
nada —mantener el factor de coste de bcrypt en 10, conservar la autenticación sin estado pese a que impide
revocar un token, no refactorizar `manga` y `capitulo` antes de la demo— son decisiones tan deliberadas
como los cambios, y son mías. Tampoco acepté afirmaciones sin comprobarlas: varias observaciones iniciales
sobre el código resultaron inexactas al contrastarlas con el repositorio y se corrigieron antes de quedar
escritas.
