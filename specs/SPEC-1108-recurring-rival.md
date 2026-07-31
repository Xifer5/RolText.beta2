# SPEC-1108 Rival recurrente

## Objetivo

Item #8 del roadmap del usuario: un personaje (Kestrel) que reaparece varias veces a lo largo de la historia principal y cuyo desenlace (aliado, competidor o traidor) depende de cómo lo trataste — distinto del sistema de mini-boss perdonable de SPEC-1104 (que es un enemigo genérico, reaparece una sola vez).

## Contexto

Investigación previa confirmó: ningún NPC existente está posicionado como rival (todos son mentores/guías hacia el mismo objetivo); no existe ningún sistema de "reaparición" salvo el gancho guionizado único del eco (`maybeStartEchoIntro`, un solo disparo); `computeEndingTone()` de `endings.js` solo se calcula al final de la partida, nunca durante el juego; no hay precedente de un enemigo humano nombrado distinto del pool genérico de monstruos. Todo esto es 100% nuevo — no hay nada que reutilizar salvo el PATRÓN arquitectónico de `echoIntro.js` (evento guionizado por llegada a una zona, con early-return en `movement.js`).

## Decisiones (confirmadas con el usuario)

1. **Cálculo de disposición**: flags propias del rival (`worldFlags.rival_score`, numérico) sumadas/restadas en cada encuentro — un mini-tono INDEPENDIENTE de `MORAL_DECISIONS`. No se reutiliza `computeEndingTone()`: la reacción de Kestrel depende específicamente de cómo lo trataste a ÉL, no de decisiones morales genéricas de toda la partida.
2. **3 puntos de aparición**: tras completar `mq_01_la_cancion` (en la próxima llegada a `town`), tras completar `mq_03_ecos` (en `garden_1`), y tras completar `mq_04_la_verdad` (en `inferno_1`, justo antes del Rey Dragón) — repartidos a lo largo de toda la partida en vez de apretados al final.

## Diseño

### Los 3 encuentros

1. **Un rival inesperado** (`rival_encounter_1`, en `town`): Kestrel se presenta como cazador de las mismas reliquias, por dinero, no por el destino del mundo. Compartir información (+1 rival_score, +10 XP) o guardártela (-1, +15 oro).
2. **Kestrel en apuros** (`rival_encounter_2`, en `garden_1`): atrapado en una salvaguarda de hadas. Ayudarlo (+1, +20 XP) o dejarlo resolverlo solo (-1, +15 oro).
3. **Resolución** (en `inferno_1`, sin elección previa — el resultado ya está decidido por el `rival_score` acumulado de los 2 encuentros anteriores):
   - **`rival_score ≥ 1` → Aliado**: Kestrel ayuda antes del combate — cura al jugador a HP completo y aplica el buff `activeBuffs.warcry = 5` (+30% ataque, mismo buff ya existente de Guerrero, reusado sin plomería nueva).
   - **`rival_score ≤ -1` → Traidor**: Kestrel roba 20% del oro actual del jugador y desaparece — sin combate.
   - **`rival_score === 0` → Competidor**: duelo directo — dispara combate real contra el nuevo enemigo `kestrel_rival` vía `pixel:startCombat` (mismo patrón que el lobo guionizado de `echoIntro.js`).

### Piezas técnicas

- **`js/rivalArc.js`** (nuevo módulo, arquitectura calcada de `echoIntro.js`): `RIVAL_ENCOUNTER_1`/`RIVAL_ENCOUNTER_2` (eventos con shape de `TRAVEL_EVENTS`, renderizados vía `showTravelEvent()` ya existente), `rivalResolutionEvent()` (arma el evento de resolución según `rival_score`), `maybeStartRivalEncounter(locationId)` (gancho único que decide cuál de los 3 dispara, si alguno).
- **`movement.js`**: un solo hook nuevo, mismo patrón early-return que `maybeStartEchoIntro` — `if (maybeStartRivalEncounter(nextId)) { updateUI(); return; }`, insertado justo después del gancho del eco.
- **`kestrel_rival`** (nuevo, `enemies.js` + `damageTypes.js`): hp400/atk45/def18, nivel 10, comportamiento `aggressive`/`pierce` (tier similar a un enemigo humano de zona tardía, más débil que el Rey Dragón). No pertenece a ningún `biomeBosses`/`biomeCandidateMap` — solo se alcanza vía el duelo guionizado, nunca por RNG de encuentro normal.
- **Timing de "tras completar la misión"**: `completeQuest()` solo se dispara al hablar con el NPC correspondiente (no automáticamente al llegar a la zona objetivo) — el encuentro de Kestrel dispara en la PRÓXIMA llegada a la ubicación tras esa conversación, no de forma instantánea. Documentado explícitamente para no prometer "inmediatamente después".
- **Interacción observada (no un bug)**: como `kestrel_rival` se dispara con `isBoss:false`, es elegible para el sistema de rasgos aleatorios de SPEC-1103 (25% de rasgo) — en la verificación en vivo salió "Kestrel Antiguo". Se decidió mantenerlo así (en vez de forzar `isBoss:true`) porque el escalado de boss habría sobre-potenciado las stats ya calibradas del duelo a niveles altos del jugador.

## Criterios de aceptación

1. [x] Los 3 encuentros disparan solo tras completar la misión correspondiente Y llegar a la ubicación correcta — verificado con test puro (sin la misión completada, `maybeStartRivalEncounter` devuelve `false`) y en vivo (encuentro 1 renderizó el modal real con el título y las 2 opciones correctas)
2. [x] Cada encuentro dispara una sola vez (`rival_encounter_N_seen`) — test puro confirma que una segunda llamada devuelve `false`
3. [x] El `rival_score` se acumula correctamente entre encuentros — test puro + verificado en vivo (compartir en el encuentro 1 sumó exactamente +1)
4. [x] Resolución aliado (score≥1): cura completa + `activeBuffs.warcry=5` — verificado en vivo (HP 1→100, warcry=5) y con test puro
5. [x] Resolución traidor (score≤-1): roba exactamente 20% del oro — verificado con test puro (100→80 oro)
6. [x] Resolución competidor (score===0): dispara combate REAL contra `kestrel_rival` — verificado en vivo (`isInCombat:true`, enemigo "Kestrel")
7. [x] `kestrel_rival` existe en `enemyData` y `ENEMY_COMBAT_DATA`, no es boss de zona ni mini-boss, no aparece en ningún pool de encuentro aleatorio — test puro + inspección de `biomeBosses`/`biomeCandidateMap`
8. [x] Suite completa en verde (193/193 — 183 previos + 10 nuevos en `tests/rivalArc.test.mjs`)

## Fuera de alcance
- Diálogo dinámico de Kestrel fuera de los 3 encuentros guionizados (no es un NPC de `NPC_DATA`, no tiene entrada fija en un lugar del mapa).
- Integración con `MORAL_DECISIONS`/tono del final — el `rival_score` es un sistema independiente, a propósito.
- Múltiples finales narrativos distintos para cada desenlace (aliado/traidor/competidor) más allá del efecto mecánico descrito — no se tocó `endings.js` ni el epílogo del Rey Dragón.
- Evitar que `kestrel_rival` reciba un rasgo aleatorio de SPEC-1103 — aceptado como interacción emergente, no una interacción a prevenir.
