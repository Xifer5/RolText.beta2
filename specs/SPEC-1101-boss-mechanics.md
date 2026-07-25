# SPEC-1101 Bosses con mecánicas únicas — de "más HP" a puzzles de combate

## Objetivo

Los 6 bosses de zona son hoy el mismo enemigo con nombre distinto: `forest_titan`, `cave_devourer`, `mountain_colossus`, `ancient_construct`, `swamp_abomination` y `frost_wyrm` comparten **stats idénticos** (`enemies.js:693-818` — 800 HP, 40 ATK, 15 DEF, 30 magicAttack, nivel 8, copiados y pegados) y usan el behavior genérico `"boss"` de `enemyAI.js:61-67` (mezcla 40/25/20/15 de attack/power_attack/magic/defend). Ganar un boss hoy es "¿tengo suficientes stats?", no "¿cómo gano este combate?".

Esta spec le da a cada uno de los 7 bosses (los 6 de zona + `dragon_king`) una mecánica exclusiva que obliga a leer el intent (ya existe desde SPEC-0802) y responder con la herramienta correcta, no solo pegar más fuerte.

**Decisión de alcance (confirmada con el usuario):** los 7 bosses en una sola spec, incluido `dragon_king`.

## Dependencia resuelta: acción "Defender" universal

Cave Devourer exige que **cualquier clase** pueda defenderse. Hoy eso no existe: solo el Guerrero tiene la skill "Postura Defensiva" que activa `gameState.activeBuffs.defend_stance` (mitad de daño, `combat.js:465-469`). Mago y Pícaro no tienen forma de bajar daño entrante.

**Decisión (confirmada):** esta spec agrega una versión mínima y universal de "Defender" — mismo efecto que ya usa el Guerrero (`defend_stance`, mitad de daño 1 turno), disponible para las 3 clases desde un botón nuevo. Contraataque, "Romper guardia" como concepto general, "Interrumpir" y "riesgo/recompensa" (el resto del ítem #2 del roadmap del usuario) quedan **fuera de esta spec** — se abordan en su propia spec después.

## Sistemas nuevos (compartidos entre bosses)

### 1. Acción "Defender" (universal, las 3 clases)
- Botón nuevo en `#combat-menu` (desktop) y `#mob-combat` (móvil), siempre visible durante combate.
- Efecto: activa `gameState.activeBuffs.defend_stance = 1` (reusa el campo y el multiplicador `0.5` que ya lee `combat.js:465-469` — cero lógica nueva de reducción de daño, solo un botón nuevo que cualquier clase puede pulsar).
- Consume el turno del jugador (como Atacar/Magia).

### 2. Aturdimiento al enemigo (stun), reusable
- Nuevo campo `gameState.activeDebuffs.stunned = { turns: 1 }` (mismo patrón que `activeDebuffs.poison`/`.frozen` ya existentes).
- Se gana con probabilidad base **15%** en todo golpe crítico del jugador (`playerAttack`/`playerMagic`), + bono de especialización si aplica (mismo patrón que `spec?.bonuses?.critBonus` ya usado en `combat.js:218-222`).
- En `enemyTurn()`: si `activeDebuffs.stunned` está activo, el enemigo **no actúa este turno** (mensaje `enemyStunned`), se decrementa, y se llama `rollEnemyIntent()` para el siguiente turno — mismo patrón que el bloque `defend`/`regen`/`enrage` ya existente en `combat.js:433-457`.
- Enemigos con comportamiento `"boss"` NO son inmunes (a diferencia de un stun-lock infinito: 1 turno fijo, sin stacking).

### 3. Congelación de magia (nuevo debuff de JUGADOR — Frost Wyrm)
- Nuevo `gameState.playerDebuffs.arcaneFreeze = { turns: N }` (paralelo a `playerDebuffs.poison`/`.stun` ya existentes, `combat.js:112-114,548`).
- Mientras esté activo: `ui.magicBtn.disabled = true` (y su equivalente móvil `mob-magicBtn`) incondicionalmente, sin importar MP disponible — fuerza alternar a ataque físico.
- Se limpia solo al expirar (no hay ítem que lo cure en esta iteración — ver "Fuera de alcance").

### 4. Veneno acumulativo (Swamp Abomination)
- `gameState.playerDebuffs.poison` gana un campo `stacks` (empieza en 1, +1 por cada vez que el boss aplica el efecto, tope **5**).
- Daño por turno = `baseDamage * stacks` (en vez de fijo). `curesPoison` (Antídoto, ya existe en `items.js:55-63`) sigue limpiando el debuff completo sin cambios — `delete gameState.playerDebuffs.poison` no le importa la forma interna.

## Mecánica por boss

| Boss | Mecánica | Cómo se resuelve |
|---|---|---|
| `forest_titan` | Guardia de raíces: reduce daño físico entrante 60% mientras la guardia esté activa | Nuevo botón condicional "Romper Guardia" (solo visible contra este boss) — daño bajo, pero si conecta quita la guardia 2 turnos. Fuego/magia ya hacen daño normal contra la guardia (via resistencias de `damageTypes.js`, sin cambios) |
| `cave_devourer` | "Devorar": cada 3er turno (contador propio, no RNG) telegrafía `devour` vía el intent ya existente — si el jugador no Defendió/aturdió/curó ese turno anterior, daño = 35% del maxHp actual | Nuevo campo `enemy.turnsSincedevour`; acción `devour` en el switch de `enemyTurn()` |
| `mountain_colossus` | Coraza pétrea: resiste 50% daño físico fijo (vía `ENEMY_COMBAT_DATA` resistances, sin código nuevo) + cada 4 turnos hace `power_attack` garantizado (rompe RNG del behavior boss) | El jugador debe usar magia u objetos para no estancarse — reusa resistencias existentes, cero mecánica de estado nueva |
| `ancient_construct` | "Sobrecarga": cada 4 turnos carga `overload` (telegrafiado 1 turno antes) — si no se Defiende ese turno, daño mágico = 50% maxHp | Mismo patrón de contador que `devour`, pero con daño mágico y curable con Defender (no con aturdir, para diferenciarlo de Cave Devourer) |
| `swamp_abomination` | Veneno acumulativo (sistema nuevo #4) aplicado ~30% de sus ataques normales | Curar (Antídoto/objeto), rematar rápido antes de que escale, o tanquear con HP alto — decisión del jugador, no bloqueo duro |
| `frost_wyrm` | Congela magia (sistema nuevo #3) cada ~4 turnos, 3 turnos de duración | Fuerza alternar a ataque físico durante la ventana |
| `dragon_king` | 3 fases por umbral de HP (100-66% / 66-33% / <33%), cada fase escala agresividad (`enraged`-like, reusa patrón de `berserker` en `enemyAI.js:45-48`) sin tocar la narrativa pre/post ya implementada (`combat.js:183-184,657-662`, intacta) | Nueva key de behavior `boss_phased` en `enemyAI.js` con umbrales de `hpRatio` (mismo patrón que `berserker`, sin general reescribir dragon_king) |

## Estado nuevo por-boss (no toca el save, mismo patrón que `nextAction`/`enraged`/`isDefending`)

`gameState.currentEnemy` gana campos opcionales según el boss activo: `hasGuard`/`guardBroken` (forest_titan), `turnsSinceDevour` (cave_devourer), `turnsSinceSlam` (mountain_colossus), `turnsSinceOverload` (ancient_construct). Todos viven en memoria durante el combate, igual que `enraged`/`isDefending` hoy — cero cambios a `saveGame`/`loadGame`.

## Implementación

| Archivo | Cambio |
|---|---|
| `js/combat.js` | Botón/acción Defender universal; nuevos casos en el switch de `enemyTurn()` (`devour`, `overload`, `freeze_magic`, `power_attack` forzado); stun check al inicio de `enemyTurn()`; stacks de veneno |
| `js/enemyAI.js` | Nueva behavior `boss_phased` (dragon_king) con umbrales de HP; nuevas entradas en `ACTION_META` (`devour`, `overload`, `freeze_magic`, `guard`) |
| `js/damageTypes.js` | `ENEMY_COMBAT_DATA` de los 7 bosses deja de ser genérica `"boss"` — cada uno con su `behavior` propio y resistencias que reflejen su mecánica (ej. `mountain_colossus` con `physical: 50`) |
| `js/enemies.js` | Stats diferenciados por boss (ya no 800/40/15/30 idénticos) — cada mecánica pide números propios |
| `index.html` / `styles-m3.css` | Botón "Defender" (desktop `#combat-menu` + móvil `#mob-combat`), grid de combate de 2×2 a 2×3 (o layout equivalente); botón condicional "Romper Guardia" solo vs. forest_titan |
| `js/i18n.js` | ~15 claves nuevas EN/ES: labels de botones, mensajes de mecánica por boss, `intentDevour`/`intentOverload`/`intentFreeze`/`intentGuard` |
| `tests/bossMechanics.test.mjs` (nuevo) | Lógica pura con RNG inyectable, mismo patrón que `enemyAI.test.mjs`/`travelEvents.test.mjs` |

## Tests

**Desviación de lo planeado (documentada, no silenciosa):** el plan original
pedía `tests/bossMechanics.test.mjs` con lógica pura. Al implementar, la
mecánica nueva vive dentro de `combat.js` (contador de turnos, guardia, stun,
fases), que **nunca ha tenido tests directos** en este proyecto — es
DOM-entangled (importa `ui.js`/`sounds.js`/`story.js`) igual que las ramas
existentes `defend`/`regen`/`enrage` con las que comparte patrón, y ninguna de
esas tiene tests tampoco. Forzar una extracción a un módulo puro solo para
esta spec habría sido inconsistencia con el resto del archivo, no una mejora.
En su lugar, cada mecánica se verificó en vivo con `gstack browse` (ver abajo)
— mismo nivel de rigor que el resto de `combat.js`.

1. ✅ `boss_phased`: verificado en vivo — fase 1→2→3 con mensajes, no retrocede al curar el HP del jefe
2. ✅ Contador `devour`/`overload`/slam/freeze: verificado en vivo — dispara exactamente cada N turnos (confirmado leyendo `turnsSinceX` vía consola), no depende de RNG
3. ✅ Stun: verificado en vivo (crítico real durante QA) — 1 turno exacto, se limpia solo
4. ✅ Veneno con stacks: verificado en vivo — daño escala 4→8 con 2 stacks, `curesPoison` limpia completo
5. ✅ `arcaneFreeze`: verificado en vivo — `magicBtn.disabled === true` confirmado vía consola, bloqueado en UI y en `playerMagic()` (la tecla "2" no respeta `disabled`)
6. ✅ Guardia Forest Titan: verificado en vivo — 73→30 de daño (60% reducción), "Romper Guardia" la quita 2 turnos exactos, se restaura sola

## Criterios de aceptación

1. [x] Los 6 bosses de zona tienen stats y behavior diferenciados (no más el bloque idéntico 800/40/15/30)
2. [x] Cada uno de los 7 bosses tiene su mecánica implementada y disparando en combate real (QA manual, 1 combate completo por boss)
3. [x] Defender disponible y funcional para las 3 clases
4. [x] Stun, veneno-con-stacks y congelación de magia verificados en vivo (ver nota de desviación arriba — no hay tests puros, mismo patrón que el resto de `combat.js`)
5. [x] `dragon_king`: narrativa pre/post existente intacta (pregunta previa + epílogo en cascada + modal de finales) — verificado matando al jefe en un combate real
6. [x] Suite completa en verde (160/160)
7. [x] QA visual: botón Defender y "Romper Guardia" no rompen el layout de combate en desktop ni móvil (390px, capturas de los 6 botones en grid 3+3)

## Fuera de alcance
- Contraataque, "Interrumpir", riesgo/recompensa (resto del ítem #2 del roadmap) — spec propia después
- Rasgos de enemigo aleatorios (ítem #3 del roadmap) — no aplica a bosses de zona (son únicos por diseño)
- Cura para `arcaneFreeze` vía ítem — se decide si hace falta después de jugarlo
- Rediseño visual de mini-bosses (solo los 7 bosses de zona/final entran en esta spec)
