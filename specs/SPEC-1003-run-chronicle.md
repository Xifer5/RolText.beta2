# SPEC-1003 Crónica de aventureros — registro de runs

## Objetivo

Que cada partida deje constancia: quién fuiste, cómo jugaste y cómo acabó. Vive FUERA del save (`pqe.runlog.v1`), así sobrevive a "Nuevo juego" y a los slots — es la memoria meta del jugador, no del personaje.

## Reglas (js/runLog.js)

- **Registro**: victoria final (dragon_king, tras contar la kill) y cada muerte → `recordRun(outcome)`. Entrada: nombre, clase, origen, dificultad, nivel, oro, kills, jefes, tono/título del final (solo victoria), nº de decisiones morales, fecha. Más reciente primero, tope 20.
- **UI**: botón "📜 Crónica" en el menú principal → modal con filas (reutiliza el estilo de las ranuras de guardado): 🏆/💀 + nombre + título del final o "Caído en combate"; meta con dificultad, origen, nivel, kills, fecha y decisiones.
- Corrupto/ausente → lista vacía sin romper; si localStorage falla al escribir, la partida sigue.

## Criterios De Aceptacion

- [x] buildRunRecord captura victoria (con tono/título) y derrota (sin ellos) (tests)
- [x] Más reciente primero; resetState no borra la crónica; tope 20 (tests)
- [x] readRunLog tolera corrupción (test)
- [x] QA en vivo 8/8: muerte real → entrada defeat; nueva partida conserva la crónica; victoria real → entrada con tono y decisiones; modal desde el menú con filas correctas
- [x] Suite 126/126; 0 errores de consola
