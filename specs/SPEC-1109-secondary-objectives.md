# SPEC-1109 Objetivos secundarios por partida

## Objetivo

Item #9 del roadmap del usuario: 2-3 "rumores" generados al empezar una run, para variar metas entre partidas — distintos de la misión principal fija.

## Contexto

Investigación previa confirmó que ya existían 6 misiones secundarias (`explore_forest`, `collect_crystal`, `kill_pirates`, `collect_fairy_dust`, `collect_ice_crystal`, `defeat_dark_lord`) usando el MISMO sistema que las principales (`quests.js`: `getQuestStatus`/`activateQuest`/`checkQuestCondition`/`completeQuest`, tipos `visit`/`collect`/`kill`), pero todas requieren hablarle a un NPC para activarse. Un "rumor" se siente distinto — ya lo sabés desde el inicio.

## Decisión (confirmada con el usuario)

**Reusar por completo el sistema existente**: los "rumores" son 3 de las 6 misiones secundarias ya existentes, auto-activadas al crear el personaje en vez de esperar la conversación con el NPC. Cero sistema paralelo — mismas condiciones, mismo tracker, mismas recompensas.

## Diseño

- `js/quests.js`: `RUMOR_POOL` (los 6 ids secundarios), `RUMOR_COUNT = 3`, `rollRumors(rng)` — elige 3 ids distintos sin reemplazo y llama `activateQuest()` sobre cada uno (rng inyectable para tests).
- `js/charselect.js`: al confirmar personaje (`startAdventureBtn`, después de otorgar ítems iniciales), se llama `rollRumors()` y se anuncia con un mensaje nuevo (`rumorsRolledMsg`) listando los títulos elegidos.
- `js/ui.js`: el quest tracker (`updateQuestTracker()`) mostraba como máximo 2 misiones activas — se sube a 4 para que quepan la misión principal activa + hasta 3 rumores sin competir por espacio.

## Bugs reales encontrados y corregidos (no solo agregados)

Verificando en vivo con `gstack browse`, activar rumores con una misión "collect" expuso 2 fallas preexistentes que mi feature simplemente hizo mucho más probable de disparar (antes requería que el jugador manualmente aceptara esa misión de un NPC específico; ahora es ~1/3 de probabilidad por rumor):

1. **`js/ui.js` nunca importaba `allItems`** — `updateQuestTracker()` lo usa en la línea de progreso de misiones tipo "collect" (`localizeText(allItems[q.item]?.name)`), lanzando `ReferenceError: allItems is not defined` y rompiendo TODO `updateUI()` en cuanto había una misión "collect" activa. Corregido agregando el import faltante.
2. **`collect_fairy_dust` apuntaba a un ítem que nunca existió**: `js/lootTables.js` y `js/quests.js` ya referenciaban `"fairy_dust"` desde antes de esta spec, pero jamás se definió en `js/items.js` — la misión no podía completarse de verdad aunque el jugador consiguiera el drop (30% en `garden`). Corregido agregando la entrada faltante en `allItems`.

Se agregó un test de regresión (`toda misión 'collect' apunta a un ítem que existe en allItems`) para que esta clase de bug no vuelva a pasar desapercibida.

## Criterios de aceptación

1. [x] `rollRumors()` activa exactamente 3 misiones secundarias distintas, deja las otras 3 en `inactive` — test puro
2. [x] Las misiones principales (`mq_*`) nunca se activan por esta vía — test puro
3. [x] Verificado en vivo: el tracker de misiones muestra las 3 misiones activadas simultáneamente, sin cortar a 2, sin errores en consola
4. [x] Bug de `allItems` corregido y verificado en vivo (antes: `ReferenceError` rompía `updateUI()` completo con una misión "collect" activa; después: renderiza normal)
5. [x] Bug de `fairy_dust` corregido y verificado en vivo (antes: mostraba el id crudo por el `|| q.item` de fallback; después: muestra "Polvo de Hadas"/"Fairy Dust")
6. [x] Suite completa en verde (199/199 — 193 previos + 6 nuevos en `tests/quests.test.mjs`, incluida la guarda de regresión)

## Fuera de alcance
- Rumores con tipos de objetivo nuevos (ej. "alcanzar X de oro") — se usan exclusivamente los 3 tipos ya existentes (`visit`/`collect`/`kill`) de las 6 misiones secundarias reales.
- Corregir el nombre crudo del enemigo en el progreso de misiones "kill" (ej. "Derrotar: pirate 0/3" en vez de un nombre localizado) — bug cosmético preexistente, independiente de esta spec, no agravado por los rumores.
- Persistencia de qué rumores se activaron a través de `runLog.js`/la crónica — quedan como misiones activas normales en `gameState.quests`, sin registro adicional en el historial de runs.
