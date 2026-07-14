# SPEC-1004 Modificadores de partida — retos autoimpuestos que cambian las reglas

## Objetivo

Cierre del sprint de rejugabilidad (4/4): 3 modificadores apilables (0-3) en la creación de personaje que endurecen una dimensión del juego (visión / supervivencia / economía) a cambio de +10% XP cada uno, y que la Crónica recuerda.

Decisiones fijadas con el usuario (2026-07-14): multi-select 0-3 a la vez; +10% XP por modificador + registro en Crónica; mecánicas como la tabla siguiente.

## Reglas (js/modifiers.js — nuevo, funciones puras)

| Modificador | Efecto | Ganchos |
|---|---|---|
| 🌫️ **Niebla densa** (`fog`) | Mapa local y panel minimapa muestran niebla (sin celdas); intent enemigo SIEMPRE oculto (❓ 100%, no solo jefes 35%) | `localMinimap.js renderLocalMinimap`, `panels.js` (panel minimap), `combat.js rollEnemyIntent` |
| 💀 **Mundo cruel** (`cruel`) | Descansar cura solo el 50% de lo que falta (HP y MP) y cuesta 10 oro (si tienes menos, paga lo que tengas); enemigos +15% ATK (multiplica el de dificultad) | `ui.js restAtCurrentLocation` (ya centralizado en 47bc06f), `combat.js startCombat` (scaledAtk) |
| 🪙 **Botín escaso** (`scarce`) | Oro de combate ×0.5; cada ítem de loot tiene 50% de perderse (RNG inyectable); precios de compra ×1.25 (redondeo arriba) | `combat.js endCombat` (oro y loot), `shop.js` helper `buyPriceOf(item)` en todos los usos de compra |

- **Recompensa**: `modifierXpMult(state)` = 1 + 0.1×n activos, aplicado en el cálculo de XP de `endCombat` (se apila con `diff.xpMult`).
- **Estado**: `modifiers: []` en `initialGameState` (`state.js`); guard `??=`/fallback en lecturas; saves viejos lo reciben gratis por el merge defaults-primero de loadGame.
- **UI charselect**: tercera fila de chips `.mod-chip` (comparte CSS con `.diff-chip`), multi-select con `aria-pressed` (patrón `.inv-filter-chip`, NO radiogroup), 0 seleccionados por defecto; línea de efectos bajo los chips derivada de datos (patrón `getDifficultyEffects`); mensaje al empezar partida si hay activos.
- **Crónica**: `buildRunRecord` añade `modifiers: [...]`; `runRow` pinta los emojis en los bits. Entradas viejas sin el campo no rompen.
- **i18n**: nombres/descripciones bilingües inline en MODIFIERS (patrón origins.js) + ~10 claves (modLabel, modChosenMsg, modXpBonusLine, fogMapMsg, cruelRestMsg, etc.), paridad EN/ES (guardada por tests/i18n.test.mjs).

## API (para tests sin DOM)

```js
isActive(state, id)                    // lee state.modifiers con guard
modifierXpMult(state)                  // 1.0 / 1.1 / 1.2 / 1.3
cruelAtkMult(state)                    // 1.15 o 1
applyRest(state)                       // → {hpGain, mpGain, goldCost} y muta; cruel: 50% + oro
scarceGoldMult(state)                  // 0.5 o 1
filterLoot(loot, state, rng)           // scarce: 50% por ítem
buyPriceOf(item, state)                // ceil(price × 1.25) o price
isIntentAlwaysHidden(state)            // fog
```

## Criterios de aceptación

1. [x] Los 3 modificadores bilingües con id/emoji/efectos (test)
2. [x] XP mult apila: 0→1.0, 3→1.3, y se combina con xpMult de dificultad (test)
3. [x] `applyRest` con cruel: cura 50% de lo faltante, cobra `min(10, oro)`; sin cruel: cura todo gratis (tests)
4. [x] `filterLoot` con RNG inyectable: rng<0.5 conserva, ≥0.5 pierde; sin scarce no filtra (test)
5. [x] `buyPriceOf`: 100→125, 10→13 (ceil); shop muestra Y cobra el mismo precio (test + QA)
6. [x] Con fog: `enemy.intentHidden === true` en todos los turnos; mapa local y minimapa muestran niebla (test + QA)
7. [x] Save viejo sin `modifiers` carga y juega sin errores (test)
8. [x] Crónica registra los modificadores de la run; entradas viejas sin campo no rompen (test)
9. [x] QA Playwright: crear personaje con los 3 activos → chips, niebla, descanso, precio tienda, XP bonus en victoria, entrada de Crónica; run de control sin modificadores
10. [x] Suite completa en verde; 0 errores de consola

## Plan de testing

| Capa | Qué | Cuántos |
|---|---|---|
| Unit (`tests/modifiers.test.mjs`) | API pura de arriba | ~8 |
| QA Playwright msedge | flujo con 3 modificadores + control sin modificadores | 2 pasadas |

## Fuera de alcance

- Modificadores desbloqueables (todos disponibles desde el inicio)
- Mostrar modificadores en el modal de final (solo Crónica)
- Modificadores nuevos más allá de estos 3

## Detalles decididos (vetables)

1. El descanso con cruel nunca se bloquea del todo, solo empeora (50% + coste).
2. El loot escaso es probabilístico (50% por ítem), no determinista.
3. Sin modificadores por defecto — el jugador nuevo no se castiga solo.
