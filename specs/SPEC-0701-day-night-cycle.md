---
tags: [spec, pendiente]
serie: "07"
estado: pendiente
---

# SPEC-0701 Ciclo día/noche

## Objetivo

Vincular el tema visual claro/oscuro con un estado de gameplay (día/noche) que afecta encuentros, stats de enemigos, multiplicadores de daño y disponibilidad de acciones.

## Contexto

- Archivos modificados: `js/timeOfDay.js` (nuevo), `js/combat.js`, `js/ui.js`, `js/stats.js`, `index.html`, `styles-m3.css`
- Estado anterior: `gameState.timeOfDay` existía en state.js pero era ignorado por el motor de combate.
- Riesgo principal: el botón de tema ya tenía un listener inline; hay que sincronizar sin duplicar.

## Flujo Principal

1. El jugador descansa en una ubicación que lo permite.
2. `restAtCurrentLocation()` llama `advanceTime()`.
3. `advanceTime()` alterna `gameState.timeOfDay`, llama `syncThemeToTime()` y dispara `pixel:timeChanged`.
4. `syncThemeToTime()` actualiza `data-theme`, localStorage y el emoji del botón.
5. `updateUI()` refresca el chip de tiempo en el HUD móvil.
6. Alternativamente, el jugador usa el botón de tema; el listener de `setupThemeToggle()` sincroniza `gameState.timeOfDay` y dispara el mismo evento.

## Reglas De Gameplay

- `nightOnly`: vampire, zombie, squeletor, imp, diablo — solo aparecen de noche.
- `dayOnly`: flag disponible pero sin enemigos asignados aún.
- `nightBonus` / `dayBonus`: multiplicadores de ataque y defensa según hora.
- `dayPenalty`: reducción de ataque de día para warlock, dark_knight, cultist.
- Tasa de encuentros: +30% de noche en `getRandomEncounter()`.
- Multiplicadores de daño por tipo: oscuridad/veneno amplificados de noche; sagrado/luz/fuego amplificados de día.

## Módulo timeOfDay.js

```
isNight()                          → boolean
getTimeLabel()                     → "🌙 Noche" | "☀️ Día"
advanceTime()                      → nuevo timeOfDay; sincroniza tema + evento
syncThemeToTime()                  → data-theme + localStorage + botón emoji
setupThemeToggle()                 → conecta botón tema con gameState (una vez)
isEnemyAvailable(enemyId)          → boolean
applyTimeModifiers(id, atk, def)   → { attack, defense }
getTimeDamageMultiplier(type)      → number
getTimeTransitionMessage(time)     → string narrativo
```

## UX/UI

- Chip `#mobile-time-chip` en HUD móvil: muestra ☀️ Día o 🌙 Noche.
- `.time-chip.time-day`: fondo ámbar suave, texto #fbbf24.
- `.time-chip.time-night`: fondo índigo suave, texto #818cf8.
- El botón de tema (#themeToggleBtn) sigue funcionando como toggle manual.

## Datos Y Contratos

- Estado leído: `gameState.timeOfDay`
- Estado escrito: `gameState.timeOfDay`, `localStorage["pqe-theme"]`, `document.documentElement.dataset.theme`
- Eventos: `pixel:timeChanged` (dispara `updateUI()`)

## Criterios De Aceptacion

- [x] Descansar alterna día/noche y actualiza el tema visual.
- [x] El botón de tema sincroniza `gameState.timeOfDay`.
- [x] Enemigos nightOnly no aparecen de día.
- [x] Encuentros son ~30% más frecuentes de noche.
- [x] Stats de enemigos se modifican según hora.
- [x] Multiplicadores de daño por tipo respetan la tabla TIME_DAMAGE_MULTS.
- [x] Chip de tiempo visible en HUD móvil con colores diferenciados.
- [ ] QA visual en navegador

## Plan De Implementacion

- [x] `js/timeOfDay.js`: módulo completo con ENEMY_TIME_DATA y TIME_DAMAGE_MULTS
- [x] `js/combat.js`: integración en startCombat, getRandomEncounter, playerAttack, enemyTurn
- [x] `js/ui.js`: import, cache de chip, updateUI, restAtCurrentLocation, setupUIListeners
- [x] `index.html`: `#mobile-time-chip` en `.mobile-hud-chips`
- [x] `styles-m3.css`: `.time-chip`, `.time-chip.time-day`, `.time-chip.time-night`
- [ ] QA visual en navegador
