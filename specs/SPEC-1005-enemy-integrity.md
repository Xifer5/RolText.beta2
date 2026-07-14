# SPEC-1005 Integridad de biomas — enemigos, mini-bosses y encuentros aleatorios

## Objetivo

Cerrar 3 bugs de la misma familia (claves de bioma que no coinciden con los IDs reales) detectados por un reviewer externo + verificación propia: un typo de boss, 12 mini-bosses fantasma, y una tabla de encuentros aleatorios que cae a "cualquier enemigo del juego" en 2 zonas — incluido el jefe final fuera de la historia principal.

## Bugs confirmados

| # | Archivo:línea | Bug | Impacto real |
|---|---|---|---|
| 1 | `enemies.js:753` | `swamp_abominatinon` (typo) vs `swamp_abomination` esperado en `biomeBosses.js:31` y en su propio `img` | El boss del pantano nunca puede invocarse — `startCombat` falla con `enemyUnknownError` |
| 2 | `biomeBosses.js:8,14,20,26,32,44` | 12 mini-bosses referenciados no existen en `enemyData` | 70% de las veces que un bioma con boss dispara encuentro (`Math.random()<0.3` en `trySpawnBoss`), sale "El jefe se acerca..." seguido de un error — rompe la inmersión en 5 de 7 biomas |
| 3 | `biomeBosses.js:24` | clave `ruins:` vs bioma real `ruin` (`worldMap.js:106`) | `ancient_construct` y sus mini-bosses nunca aparecen — silencioso, sin error |
| 4 | `mapgen.js:19,22` | claves `ruins:`/`catacombs:` vs biomas reales `ruin`/`catacomb` (`worldMap.js:106,109`) | **Hallazgo propio**: `biomeCandidateMap[biome]` no encuentra la clave → `mapgen.js:63` cae a `Object.keys(enemyData)` (TODOS los enemigos, incluidos los 6 bosses) filtrados solo por nivel. Desde nivel 7, los bosses de zona pueden aparecer como encuentro ordinario sin narrativa ni escalado de boss. Desde nivel 9-10, `dragon_king` (jefe final, `levelRequirement:10`) es un encuentro aleatorio posible en ruinas/catacumbas, al margen de `mq_05` |

## Reglas de la corrección

### 1. Typo (trivial)
`enemies.js:753` — renombrar `swamp_abominatinon` → `swamp_abomination`.

### 2. Mini-bosses: híbrido reuso + creación

| Mini-boss fantasma | Bioma | Reemplazo |
|---|---|---|
| `alpha_wolf` | forest | → `wolf` (existente) |
| `shaman_goblin` | forest | → `goblin_shaman` (existente) |
| `crystal_golem` | cave | → `stone_golem` (existente) |
| `shadow_bat` | cave | → `cave_bat` (existente) |
| `wyvern_elder` | mountain | → `wyvern` (existente) |
| `stone_charger` | mountain | **nuevo** — 350 HP |
| `arcane_beholder` | ruin | → `beholder` (existente) |
| `golem_guardian` | ruin | → `ancient_guardian` (existente) |
| `toxic_hydra` | swamp | → `hydra` (existente) |
| `zombie_lord` | swamp | → `zombie` (existente) |
| `ice_giant` | tundra | **nuevo** — 400 HP, reusa img `mountain_giant.webp` |
| `frozen_spirit` | tundra | **nuevo** — 280 HP, tipo mago/status, reusa img `drider.webp` |

Los 3 nuevos entran en `enemies.js` sin `isBoss`, `levelRequirement:6`, con entrada en `damageTypes.js` (resistencia + `attackDamageType` + `behavior`) siguiendo el patrón de sus vecinos de bioma.

### 3. Clave `ruins` → `ruin` en `biomeBosses.js:24`

### 4. Claves `ruins`/`catacombs` → `ruin`/`catacomb` en `mapgen.js:19,22`

### 5. Test de integridad (`tests/enemyIntegrity.test.mjs`, nuevo)
- Todo ID en `biomeBosses.js` (boss + miniBosses) existe en `enemyData`
- Todo ID en `mapgen.js biomeCandidateMap` existe en `enemyData`
- Toda clave de `biomeBosses.js` y `biomeCandidateMap` corresponde a un `id` real generado en `worldMap.js` zones

## Criterios de aceptación

1. [x] `swamp_abomination` invocable sin error (test + QA)
2. [x] Los 12 IDs de mini-bosses (9 reuso + 3 nuevos) existen en `enemyData` (test)
3. [x] `biomeBosses.js` y `mapgen.js` usan `ruin`/`catacomb`; ni `dragon_king` ni los 6 bosses de zona aparecen en `biomeCandidateMap.ruin`/`.catacomb` (test)
4. [x] Test de integridad falla deliberadamente si se rompe (verificado con un ID falso temporal)
5. [x] QA Playwright: forzar `trySpawnBoss` en los 7 biomas 50 veces cada uno → 0 errores de consola, 0 "enemigo desconocido"
6. [x] Suite completa en verde

## Fuera de alcance
- Rediseñar `trySpawnBoss`/`getBossForBiome` más allá de arreglar sus datos
- Arte nuevo para los 3 enemigos nuevos (reusan webp existentes)

Nota: se verificó `Inferno_elemental`/`fungedBeast` (capitalización mixta, invisibles a un grep case-sensitive lowercase) — SÍ existen en `enemyData` (enemies.js:449,17). No son entradas muertas; no requieren corrección.
