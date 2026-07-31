# SPEC-1107 Eventos de viaje más interactivos

## Objetivo

Item #7 del roadmap del usuario: eventos de viaje con riesgo real, dependientes de clase/origen/estadísticas — no solo texto+recompensa fija. 4 eventos nombrados: "luz entre los árboles", "puente roto", "altar antiguo", "enemigo herido".

## Contexto

Investigación previa confirmó: de los 24 eventos existentes en `travelEvents.js`, solo 1 (`falling_rocks`, "Desprendimiento") tenía una tirada de riesgo ligada a una estadística (agilidad); 0 miraban la clase del jugador; los 3 eventos de origen (`origin_*`) usan el origen solo como filtro de ELEGIBILIDAD (si el evento aparece), no como modificador del resultado. El resto (20 de 24) da la misma recompensa a cualquier build.

## Decisiones (confirmadas con el usuario)

1. **Patrón de riesgo**: mismo patrón que `falling_rocks` ya probado — la clase/estadística correcta abre una vía SEGURA (sin importar el roll); cualquier otro build puede intentarlo igual, arriesgando el mismo rango de daño real (8-17 HP) que ya usan los eventos de riesgo existentes.
2. **"Enemigo herido"**: dejarlo ir agrega un flag nuevo (`wounded_enemy_spared`, peso +1) a `MORAL_DECISIONS` de `endings.js` — se beneficia automáticamente del Amuleto del Eco (SPEC-1106) sin tocar `combat.js`. Rematarlo agrega el par oscuro (`wounded_enemy_killed`, peso -1), siguiendo el patrón ya establecido de pares luz/oscuridad (echo_freed/absorbed, traveler_helped/ignored, purse_left/taken).

## Diseño de los 4 eventos nuevos

Todos siguen el shape exacto de `TRAVEL_EVENTS` ya existente — sin plomería nueva, `apply()` ya tenía acceso completo a `gameState.player` desde antes.

| Evento | Biomas | Vía segura | Riesgo (si no calza) |
|---|---|---|---|
| **Luz entre los árboles** (`light_among_trees`) | forest/garden/jungle | Mago o INT≥12 | 60% éxito (+15 MP/+20 XP) / 40% daño 10-17 HP |
| **Puente roto** (`broken_bridge`) | mountain/jungle/tundra | Pícaro o AGI≥12 | 60% éxito (+20 XP) / 40% daño 10-17 HP (cruzas igual) |
| **Altar antiguo** (`ancient_altar`) | ruins/dungeon/catacomb | Origen aprendiz o INT≥12 | 55% éxito (+12 MP/+25 XP) / 45% daño 10-17 HP |
| **Enemigo herido** (`wounded_enemy`) | universal | Guerrero o STR≥12 (solo en "dejarlo ir") | 55% éxito (+15 XP) / 45% daño 8-14 HP — el flag de compasión se marca SIEMPRE, incluso si el roll sale mal |

Cada evento mantiene una segunda opción sin riesgo (ignorar/buscar otro camino/rematar), igual que el resto del archivo.

## Piezas técnicas

- Ningún import nuevo, ninguna función auxiliar nueva en `travelEvents.js` — el patrón `const safe = <condición>; if (safe || Math.random() < X) {...} else {...daño...}` es una copia directa de `falling_rocks` (ya en producción).
- `endings.js`: 2 entradas nuevas en `MORAL_DECISIONS` (par luz/oscuridad).
- `js/i18n.js`: 4 claves nuevas de recap (`recapWoundedEnemySpared`/`recapWoundedEnemyKilled`, EN/ES) — el resto del texto de los eventos vive inline en objetos `{en,es}`, mismo patrón que los 24 eventos existentes (no pasa por `t()`).

## Criterios de aceptación

1. [x] Los 4 eventos filtran correctamente por bioma — verificado en vivo (`eligibleEvents('forest')` incluye "luz entre los árboles" y excluye "puente roto"; `eligibleEvents('desert')` excluye "puente roto")
2. [x] Luz entre los árboles: test puro confirma que Mago con INT baja SIEMPRE gana MP con RNG forzada a fallar; un Guerrero con INT baja y la misma RNG SÍ pierde HP
3. [x] Puente roto: test puro confirma la misma dualidad para Pícaro/AGI vs. el resto
4. [x] Altar antiguo: test puro confirma la misma dualidad para origen aprendiz/INT vs. el resto
5. [x] Enemigo herido: test puro confirma que "Rematarlo" marca `wounded_enemy_killed`; "Dejarlo ir" marca `wounded_enemy_spared` SIEMPRE (incluso con roll fallido) pero solo aplica daño si el roll falla — verificado también en vivo con Guerrero+STR alta (rama segura, mensaje correcto)
6. [x] El flag `wounded_enemy_spared` aparece en el recap del final (`getEndingContent`) y suma al tono — verificado en vivo (`score:1, recapKeys:["recapWoundedEnemySpared"]`)
7. [x] El Amuleto del Eco (SPEC-1106) hereda el nuevo flag automáticamente sin cambios de código — cubierto por el test ya existente de SPEC-1106, ajustado para no fijar la lista completa de flags "luz" (evita que rompa con cada spec futura que sume uno)
8. [x] Suite completa en verde (183/183 — 179 previos + 4 nuevos en `travelEvents.test.mjs`)

## Fuera de alcance
- Más de 4 eventos nuevos — exactamente los nombrados por el usuario, mismo criterio de alcance que SPEC-1103/1104/1106.
- Tocar los 24 eventos existentes para agregarles riesgo dependiente de clase/stat — quedan como están.
- Un sistema genérico de "eventos con riesgo" reutilizable declarativamente — cada evento sigue siendo una función `apply()` escrita a mano, mismo patrón que todo el archivo.
