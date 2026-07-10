# SPEC-0803 Consecuencias persistentes — worldFlags + eventos encadenados

## Objetivo

Que las decisiones del jugador dejen huella. Hoy las elecciones de los ~20 eventos de viaje aplican oro/XP/HP instantáneos y se olvidan (`travelEvents.js`); no existe memoria de decisiones en el save. Con esta spec, 4 eventos universales ganan memoria y segundo acto: el mundo recuerda lo que hiciste.

## Contexto

- Archivos relevantes: `js/travelEvents.js`, `js/state.js`, `tests/travelEvents.test.mjs` (nuevo)
- Estado actual: `getTravelEvent(biome)` filtra solo por bioma (EVENT_CHANCE 0.22) y elige al azar; las choices aplican efectos y desaparecen
- Riesgo principal: compatibilidad con saves existentes sin `worldFlags` → guardas `?? {}` en cada acceso
- Decisiones fijadas con el usuario (2026-07-07): D1 = flags + eventos encadenados (sin karma); D2 = 4 cadenas (los 4 eventos universales)

## Flujo Principal

1. El jugador elige en un evento original → la choice marca su flag en `gameState.worldFlags`.
2. El flag persiste en el save (gratis: saveGame serializa gameState completo).
3. En un viaje posterior, `getTravelEvent` prioriza follow-ups elegibles (flag puesto, sin flag de resolución).
4. El follow-up paga la consecuencia (recompensa, confrontación o bendición) y marca su flag de resolución.
5. Resuelto una vez, ese follow-up no vuelve jamás en la partida.

## Reglas De Gameplay

**Motor**: `condition()` opcional en eventos (retrocompatible) + `followUp: true`; los follow-ups elegibles tienen prioridad absoluta sobre eventos normales.

| Evento original | Flags que marca | Follow-up |
|---|---|---|
| 🧑‍🦯 Viajero herido | `traveler_helped` / `traveler_ignored` | Ayudaste → "Una cara conocida": +40 oro +1 poción (o +25 XP si rehúsas). Ignoraste → "Al borde del camino": túmulo, +15 XP |
| 👝 Bolsa perdida | `purse_taken` / `purse_left` | "El granjero que busca": tomada → devolver 25 oro (+50 XP) o mentir; dejada → +30 oro por tu honradez |
| 🧙 Mercader sospechoso | `merchant_bought` (solo si compró) | "El mercader regresa": greater_elixir a 15 oro; sin oro suficiente NO se resuelve (volverá) |
| 🏛️ Santuario olvidado | `shrine_prayed` | "La gratitud del santuario": +5 maxHp permanente (o +20 XP si rehúsas) |

- Flags de resolución: `traveler_resolved`, `purse_resolved`, `merchant_resolved`, `shrine_resolved`.
- Edge cases: save viejo sin `worldFlags` → los apply lo crean (`||= {}`); ambas ramas del viajero comparten resolución (solo un segundo acto); mercader sin transacción original no genera follow-up; +5 maxHp sigue el patrón de levelUp (mutación directa de `player.maxHp`).

## UX/UI

- Reutiliza el modal de eventos existente (#travelEventModal) sin cambios de UI.
- Copy bilingüe inline `{en, es}` como el resto de TRAVEL_EVENTS (~30 textos nuevos).

## Datos Y Contratos

- Estado leído: `gameState.worldFlags`, `gameState.player.gold/maxHp`, `gameState.inventory`.
- Estado escrito: `gameState.worldFlags` (booleanos planos) + efectos de choices; `worldFlags: {}` añadido a initialGameState.
- Persistencia: automática vía saveGame/loadGame.

## Criterios De Aceptacion

- [x] Cada elección de los 4 eventos originales marca su flag (tests)
- [x] Un follow-up solo es elegible con su flag y sin resolución; resuelto no vuelve (tests)
- [x] Follow-ups elegibles tienen prioridad sobre eventos normales (test)
- [x] La bendición sube maxHp +5 y sobrevive a guardar/cargar (test de roundtrip)
- [x] Saves sin worldFlags cargan y las cadenas funcionan desde cero (test)
- [x] `node --test` pasa; 0 errores de consola; EN/ES completos

## Gherkin

```gherkin
Feature: Consecuencias persistentes
  Scenario: El viajero agradecido
    Given el jugador ayudó al viajero herido
    When ocurre el siguiente evento de viaje
    Then es "Una cara conocida" con prioridad
    And al saludarle recibe 40 oro y 1 poción
    And ese evento no vuelve a ocurrir en la partida

  Scenario: Save antiguo
    Given un save creado antes de SPEC-0803
    When el jugador carga y elige en un evento
    Then worldFlags se crea sin error y la cadena funciona
```

## Plan De Implementacion

- [x] `state.js` — `worldFlags: {}` en initialGameState
- [x] `travelEvents.js` — helper `flag()`, condition + followUp en el filtro (`eligibleEvents` exportada para tests)
- [x] Marcar flags en las choices de los 4 eventos originales
- [x] 4 eventos follow-up bilingües
- [x] `tests/travelEvents.test.mjs`

## Verificacion

- [x] Smoke manual (evento en vivo sin errores)
- [x] Sin errores en consola
- [x] Save/load no se rompe
