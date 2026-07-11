# SPEC-0804 Cooldown de eventos de viaje — pacing con pity timer

## Objetivo

Eliminar los dos extremos del 22% plano actual: rachas (2-3 eventos casi seguidos) y sequías (15+ movimientos sin nada). El ritmo objetivo es un evento cada 6–9 movimientos pacíficos, con varianza pero sin repetición inmediata.

## Contexto

- Archivos relevantes: `js/travelEvents.js`, `js/state.js`, `tests/travelEvents.test.mjs`
- Estado actual: `getTravelEvent(biome)` tira `Math.random() > 0.22` en cada movimiento pacífico (movement.js:151), sin memoria alguna
- Decisiones fijadas con el usuario (2026-07-11): híbrido cooldown duro + probabilidad creciente; global (no por evento); anti-repetición de últimos 3 IDs; los follow-ups de SPEC-0803 respetan el cooldown pero conservan su prioridad
- Riesgo principal: saves sin `travelPacing` → guarda `??=` en cada acceso, contador arranca de cero

## Reglas De Gameplay

**Curva de probabilidad** (`eventChance(steps)`, pasos = movimientos pacíficos desde el último evento):

| Pasos | 1–3 | 4 | 5 | 6 | 7 | 8 | ≥9 |
|---|---|---|---|---|---|---|---|
| Prob. | 0% (cooldown) | 10% | 15% | 20% | 25% | 30% | 35% (tope) |

- Al disparar un evento: contador a 0 y su ID entra en la memoria de recientes (últimos 3).
- **Anti-repetición**: los eventos normales cuyo ID esté en recientes salen del sorteo; si el filtro vacía el pool (biomas con pocos eventos), se usa el pool completo.
- **Follow-ups**: exentos de anti-repetición (el mercader sin resolver DEBE poder volver) y con prioridad absoluta intacta; respetan cooldown y curva.
- Los movimientos que desembocan en combate no incrementan el contador (mismo criterio que `BOSS_COOLDOWN` en movement.js).
- Partida nueva: contador 0 → gracia de ~4 movimientos sin eventos (bueno para el onboarding).

## Datos Y Contratos

- `gameState.travelPacing = { steps: 0, recent: [] }` en initialGameState; persiste gratis con el save.
- `getTravelEvent(biome, rng = Math.random)` — RNG inyectable para tests (patrón enemyAI.js). Incrementa `steps` en cada llamada.
- Constantes exportadas: `COOLDOWN_STEPS=3`, `BASE_CHANCE=0.10`, `RAMP_PER_STEP=0.05`, `MAX_CHANCE=0.35`, `RECENT_MEMORY=3`.

## Criterios De Aceptacion

- [x] Durante el cooldown (pasos 1–3) jamás sale un evento, ni con rng=0 (test)
- [x] La curva vale 10% en el paso 4 y se clava en 35% desde el 9 (test)
- [x] Tras disparar, el contador resetea y el ID entra en recientes (test)
- [x] Un evento reciente no se repite si hay alternativas; pool vacío → fallback al completo (test)
- [x] Follow-ups: prioridad intacta, exentos de anti-repetición, sujetos a cooldown (test)
- [x] Save antiguo sin `travelPacing` funciona desde cero; roundtrip JSON conserva el estado (test)
- [x] `node --test` pasa; 0 errores de consola; en vivo no hay 2 eventos en ≤3 pasos

## Plan De Implementacion

- [x] `state.js` — `travelPacing` en initialGameState
- [x] `travelEvents.js` — `eventChance()` + pacing en `getTravelEvent` (rng inyectable) + anti-repetición
- [x] Tests en `tests/travelEvents.test.mjs`
- [x] QA en vivo (invariantes de cooldown y anti-repetición con RNG real)
