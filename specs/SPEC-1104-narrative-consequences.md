# SPEC-1104 Decisiones narrativas con consecuencias jugables

## Objetivo

Item #4 del roadmap del usuario: decisiones que ya existen (`gameState.worldFlags`, SPEC-0803) dejan de ser solo flavor + peso de final (`endings.js`) y empiezan a cambiar REGLAS del mundo mientras la partida sigue: descuento de mercader, más emboscadas, protección del bosque / percepción de NPCs, y un mini-boss perdonado que puede volver como aliado o traidor.

## Decisiones (confirmadas con el usuario)

1. **Alcance**: las 4 piezas se implementan en esta iteración (el usuario prefirió esto por sobre diferir el mini-boss al item #8 "rival recurrente", pese a la superposición señalada).
2. **Descuento de mercader**: 10% (`MERCHANT_DISCOUNT_MULT = 0.90`), permanente para el resto de la partida, aplicado en `buyPriceOf()` (modifiers.js).
3. **Emboscadas**: +50% (`AMBUSH_CHANCE_MULT = 1.5`) sobre `spawnChance` del bioma en `trySpawnBoss()`, permanente para el resto de la partida.
4. **Rama del eco**: Liberar → protección del bosque (reduce `spawnChance` SOLO en bioma `forest`). Absorber → percepción distinta de NPCs (1 línea de diálogo extra de Elara, la NPC narrativamente ligada al eco).
5. **Aliado/traidor del mini-boss perdonado**: decisión directa del jugador en el momento del reencuentro — NO se reutiliza el peso de `MORAL_DECISIONS` de endings.js (SPEC-0803 decidió explícitamente "sin karma"; sumar ese peso aquí lo reintroduciría por la puerta trasera).
6. **Perdonar en combate**: botón condicional "Perdonar" (mismo patrón que "Romper Guardia"/"Interrumpir"), visible solo cuando `enemy.isMiniBoss && hp/maxHp < 0.25`. Perdonar termina el combate sin oro/XP/loot de ese encuentro (la recompensa es que puede volver como aliado después).
7. **Reaparición**: reemplaza su propio slot en el roll de `trySpawnBoss()` del mismo bioma — la próxima vez que le tocaría aparecer a ESE mini-boss específico, dispara el reencuentro narrativo en vez de combate normal.

## Mecánicas nuevas

### 1. Descuento de mercader (`traveler_helped` → reglas de precio)
- `modifiers.js: buyPriceOf(item, state)` gana un segundo multiplicador: `state?.worldFlags?.traveler_helped ? MERCHANT_DISCOUNT_MULT : 1`, compuesto con el de `scarce` si ambos están activos (ej. escaso 1.25 × descuento 0.90 = 1.125 final).
- Nueva constante `MERCHANT_DISCOUNT_MULT = 0.90` en `modifiers.js`.
- Sin cambios en `shop.js` — ya usa `buyPriceOf()` en ambos call-sites (línea 34 y 141).

### 2. Más emboscadas (`purse_taken` → reglas de encuentro)
- `biomeBosses.js: trySpawnBoss(biomeId, ambushMult = 1)` gana un segundo parámetro opcional: `if (Math.random() > biome.spawnChance * ambushMult) return null;` (clamp implícito: `Math.min(1, ...)` no hace falta porque `Math.random()` ya compara contra el valor crudo, un valor >1 solo hace que la condición sea más difícil de fallar).
- `movement.js:138` pasa `gameState.worldFlags?.purse_taken ? AMBUSH_CHANCE_MULT : 1` como segundo argumento.
- Nueva constante `AMBUSH_CHANCE_MULT = 1.5` en `biomeBosses.js`.
- Afecta el roll de boss/mini-boss (que es exactamente lo que el usuario llamó "emboscada"), no la lógica interna de `getRandomEncounter()` (fuera de alcance, ver abajo).

### 3. Rama del eco: protección del bosque (`echo_freed`)
- Mismo mecanismo que #2 pero acotado a un bioma: `movement.js:138` compone el multiplicador — `let ambushMult = gameState.worldFlags?.purse_taken ? AMBUSH_CHANCE_MULT : 1; if (biome === "forest" && gameState.worldFlags?.echo_freed) ambushMult *= FOREST_PROTECTION_MULT;`.
- Nueva constante `FOREST_PROTECTION_MULT = 0.5` (-50% de probabilidad de boss/mini-boss, solo en `forest`) en `movement.js` (o `modifiers.js`, ver tabla de implementación).
- Si el jugador robó la bolsa Y liberó el eco, ambos multiplicadores se componen (1.5 × 0.5 = 0.75) — sin caso especial, es aritmética directa.

### 4. Rama del eco: percepción de NPCs (`echo_absorbed`)
- El modal de NPC (donde sea que renderice `NPC_DATA[id].lore`, ver tabla) agrega una línea condicional después del lore de **Elara únicamente** cuando `gameState.worldFlags?.echo_absorbed` es true — nueva clave i18n `elaraEchoPerception` (EN/ES), ej.: *"Elara te mira más tiempo de lo normal. 'Cargas algo que no es tuyo,' dice, sin explicar más."*
- No aplica a ningún otro NPC — alcance mínimo pero real (el usuario pidió "percepción distinta de NPCs", no un sistema de reputación general).

### 5. Perdonar mini-boss
- `biomeBosses.js` exporta `isMiniBossId(enemyId)`: `Object.values(biomeBosses).some(b => b.miniBosses.includes(enemyId))` — identifica positivamente un mini-boss (nunca confunde con el boss principal del bioma, que vive en `.boss`, ni con `dragon_king`, que no aparece en ningún `miniBosses[]`).
- `combat.js: startCombat()` setea `gameState.currentEnemy.isMiniBoss = isBoss && isMiniBossId(enemyType)`.
- Nuevo botón `mercyBtn`/`mob-mercyBtn` (tecla "8"), visible solo si `gameState.currentEnemy?.isMiniBoss && hp/maxHp < SPARE_HP_THRESHOLD` (`SPARE_HP_THRESHOLD = 0.25`, nueva constante en `combat.js`).
- Nueva función `playerSpare()`: sin costo de MP, termina combate inmediatamente — `gameState.worldFlags.["spared_" + enemy.id] = true`; mensaje nuevo (`mercySuccess`); NO otorga oro/XP/loot ni cuenta kill (mismo patrón de recompensa-cero que "Cobarde" de SPEC-1103, pero es elección del jugador, no un enemigo huyendo).
- `movement.js:138`: antes de dispatchar `pixel:startCombat` para un `bossId` obtenido de `trySpawnBoss()`, chequea `gameState.worldFlags?.["spared_" + bossId] && !gameState.worldFlags?.["spared_" + bossId + "_resolved"]`. Si es true, en vez de combate dispara un nuevo evento narrativo de reencuentro (`showMiniBossReunion(bossId)`, ver #6) y NO consume el slot de combate de ese movimiento (el jugador sigue caminando normal después de cerrar el modal, igual que un evento de viaje).

### 6. Reencuentro: aliado o traidor
- Nuevo módulo pequeño `js/miniBossReunion.js` (mismo patrón que `echoIntro.js`): `showMiniBossReunion(enemyId)` arma un evento tipo `travelEvents` con 2 choices:
  - **"Confiar" (trust)** → aliado: mensaje narrativo + recompensa única (50 oro + 30 XP, sin combate) vía `t('reunionAllyMsg')`.
  - **"Desconfiar" (distrust)** → traidor: mensaje narrativo (`t('reunionTraitorMsg')`) + combate normal contra ese mismo mini-boss (`window.dispatchEvent(new CustomEvent("pixel:startCombat", { detail: { enemyId, isBoss: true } }))`) — sin boost de stats, es el mismo mini-boss de siempre; el costo de desconfiar es tener que pelearlo de nuevo, no que sea más fuerte.
  - Ambas ramas marcan `spared_<enemyId>_resolved = true` (nunca vuelve a reaparecer tras esto, mismo principio one-shot de SPEC-0803).
- Textos por `enemyId` genéricos (no hace falta lore único por mini-boss para esta primera versión — "el mini-boss que perdonaste antes" alcanza).

## Estado nuevo (worldFlags, ya es el patrón existente — no toca el save de forma distinta a lo ya establecido)
- `worldFlags.["spared_" + enemyId]` — boolean, mini-boss específico perdonado
- `worldFlags.["spared_" + enemyId + "_resolved"]` — boolean, reencuentro ya resuelto
- (Reutiliza `traveler_helped`, `purse_taken`, `echo_freed`, `echo_absorbed` ya existentes — SIN flags nuevos para estas 3 piezas, solo nuevos LECTORES de flags ya existentes)
- `gameState.currentEnemy.isMiniBoss` — en memoria, no persiste (mismo patrón que `hasGuard`/`bossPhase` de SPEC-1101)

## Implementación

| Archivo | Cambio |
|---|---|
| `js/modifiers.js` | `MERCHANT_DISCOUNT_MULT = 0.90`; `buyPriceOf()` compone el descuento con el mult de `scarce` |
| `js/biomeBosses.js` | `AMBUSH_CHANCE_MULT = 1.5`; `trySpawnBoss(biomeId, ambushMult=1)` acepta el multiplicador; nuevo `isMiniBossId(enemyId)` exportado |
| `js/movement.js` | `FOREST_PROTECTION_MULT = 0.5`; compone `ambushMult` (purse_taken × forest_freed) antes de llamar `trySpawnBoss()`; intercepta `bossId` ya perdonado-no-resuelto → `showMiniBossReunion()` en vez de combate |
| `js/miniBossReunion.js` (nuevo) | `showMiniBossReunion(enemyId)`, análogo a `echoIntro.js` — 2 choices (confiar/desconfiar) |
| `js/npcs.js` o donde renderice el modal de NPC (confirmar call-site exacto en implementación) | Línea condicional de Elara si `echo_absorbed` |
| `js/combat.js` | `isMiniBoss` en `startCombat()`; `SPARE_HP_THRESHOLD=0.25`; `playerSpare()` + evento `pixel:spare`; botón condicional (patrón `breakGuardBtn`/`interruptBtn`) |
| `js/keyboard.js` | Tecla "8" → `pixel:spare` |
| `index.html` / `styles-m3.css` | Botón "Perdonar" (`mercyBtn`/`mob-mercyBtn`); el grid de combate 2x4 (8 slots) ya tenía exactamente 1 slot libre (7 botones existentes) — "Perdonar" lo completa sin tocar `grid-template-rows`; móvil usa `flex-wrap`, reflow automático |
| `js/i18n.js` | Claves nuevas EN/ES: `mercySuccess`, `elaraEchoPerception`, `reunionAllyMsg`, `reunionTraitorMsg`, `reunionPromptTitle`, `reunionTrustLabel`, `reunionDistrustLabel`, label/aria de "Perdonar" |

## Criterios de aceptación

1. [x] `traveler_helped` activo: comprar cuesta 10% menos — verificado en vivo: `buyPriceOf({price:100}, {worldFlags:{traveler_helped:true}})` → 90 vs. 100 sin el flag
2. [x] `purse_taken` activo: `trySpawnBoss()` recibe `ambushMult=1.5` y sube la probabilidad efectiva — 3 tests puros deterministas en `tests/biomeBosses.test.mjs` (un roll que fallaba a 0.10 pasa a 0.15 de umbral)
3. [x] `echo_freed` activo y bioma `forest`: `ambushMult` se reduce (0.5x) — test puro que confirma que un roll que antes pasaba (umbral 0.10) ahora falla con 0.5x (umbral 0.05)
4. [x] `echo_absorbed` activo: verificado en vivo — el modal de Elara (`#npcLore`) muestra la línea `elaraEchoPerception` con el flag activo, y NO la muestra sin él (mismo NPC, ambos casos comparados)
5. [x] Botón "Perdonar" aparece SOLO cuando `currentEnemy.isMiniBoss===true` y HP<25% — verificado en vivo: `wolf` como mini-boss (`isMiniBoss:true`) lo muestra bajo 25% HP y lo oculta a full HP; `forest_titan` (boss de zona, `isMiniBoss:false`) lo mantiene oculto incluso al 10% HP
6. [x] Perdonar termina el combate sin oro/XP/loot ni kill registrada, y setea `spared_<id>=true` — verificado en vivo: oro 50→50, XP 0→0, `isInCombat:false`, `spared_wolf:true`, mensaje `mercySuccess` correcto
7. [x] La próxima vez que `trySpawnBoss()` rolearía ese mismo mini-boss en ese bioma, se dispara el reencuentro en vez de combate — verificado en vivo con navegación real (7 movimientos de relleno + 1 movimiento con RNG forzado exactamente al slot de `wolf` en forest): el modal de reencuentro apareció, `isInCombat` quedó en `false`, sin combate normal disparado de más
8. [x] Reencuentro → Confiar: +50 oro/+30 XP sin combate, `spared_<id>_resolved=true` — verificado en vivo (oro 50→100, XP 0→30 exactos)
9. [x] Reencuentro → Desconfiar: combate normal contra ese mismo mini-boss, `spared_<id>_resolved=true` ya al elegir — verificado en vivo (combate contra "Wolf" con `isMiniBoss:true` se disparó tras 900ms, flag resuelto de inmediato)
10. [x] Un mini-boss NUNCA perdonado sigue apareciendo por RNG normal, sin cambio de comportamiento — confirmado por los tests puros de `trySpawnBoss` (sin `ambushMult`, comportamiento idéntico al pre-existente) y por el combate normal contra `wolf` que sí lanzó pelea real cuando no había flag de perdonado
11. [x] El grid de combate desktop NO necesitó crecer — recuento real: 8 botones (atacar/magia/ítem/defender/huir/romper guardia/interrumpir/perdonar) calzan exactos en el grid 2×4 (8 slots) ya existente, sin tocar `grid-template-rows`. Móvil usa `flex-wrap`, reflow automático sin cambios — verificado que `mercyBtn`/`mob-mercyBtn` alternan visibilidad correctamente
12. [x] Suite completa en verde (173/173 — 164 previos + 9 tests nuevos: 3 de `buyPriceOf`+descuento en `modifiers.test.mjs`, 6 de `trySpawnBoss(ambushMult)`/`isMiniBossId` en `tests/biomeBosses.test.mjs` nuevo)

## Fuera de alcance
- Bosses de zona (el boss principal de cada bioma, ej. `forest_titan`) NUNCA es perdonable — solo los mini-bosses del array `miniBosses[]`
- `dragon_king` no participa de este sistema (no está en ningún `miniBosses[]`, se dispara por su propia lógica de historia principal)
- Sistema de karma/reputación general — la elección aliado/traidor es puntual en el reencuentro, no acumulativa
- Cambiar `getRandomEncounter()` (encuentros regulares no-boss) — el modificador de emboscadas de esta spec solo toca el roll de boss/mini-boss de `trySpawnBoss()`
- Múltiples mini-bosses perdonados simultáneamente en distintos biomas — el sistema lo soporta técnicamente (flags independientes por `enemyId`) pero no se prueba exhaustivamente esa combinación en esta iteración
- Lore/diálogo único por cada mini-boss en el reencuentro — mensaje genérico para todos en esta primera versión
- Tests puros nuevos para las piezas DOM-entangled (`playerSpare()`, `showMiniBossReunion()`, el botón condicional) — mismo patrón no-testeado de `combat.js`/`movement.js` que specs anteriores; SÍ hay tests puros para `buyPriceOf`, `trySpawnBoss(ambushMult)` e `isMiniBossId` porque esos módulos ya son testeables hoy
