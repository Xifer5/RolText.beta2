---
tags: [spec, pendiente]
serie: "07"
estado: pendiente
---

# SPEC-0703 Eventos de Viaje Contextuales

## Objetivo

Añadir 8 nuevos eventos de viaje que reaccionan al estado del jugador (clase, especialización, tiempo del día), haciendo que las decisiones de construcción del personaje tengan peso fuera del combate.

## Eventos Añadidos

| ID | Título | Trigger | Ventaja contextual |
|----|--------|---------|-------------------|
| `ancient_scroll_find` | Pergamino enterrado | dungeons/ruins/cave | Da un scroll aleatorio |
| `night_spirit` | Espíritu de la noche | Solo de noche | XP + MP |
| `explorer_cache` | Caché oculto | forest/jungle/mountain | `explorer` obtiene +2.5× recompensa |
| `duel_challenge` | El desafío del duelista | Universal | `duelist` obtiene doble recompensa |
| `wounded_mage` | El mago caído | dungeons/ruins/cave | Mage puede aprender arcane_bolt gratis |
| `assassin_opportunity` | La presa perfecta | Solo de noche | `assassin` tiene 80% éxito vs 45% |
| `blacksmith_test` | Prueba del herrero | town/mountain/dungeon | `mace_master` +25% prob. de éxito |
| `day_market` | Mercado temporal | Solo de día | 2 pociones + 1 maná por 25 oro |

## Mecánica

- Los eventos con `condition` (getter) son filtrados en `getTravelEvent()` según el estado actual.
- Los eventos usan `gameState.player.specialization` y `gameState.player.class` para personalizar el resultado dentro de `apply()`.
- Ningún evento requiere nuevas importaciones en travelEvents.js excepto `isNight`.

## Criterios De Aceptacion

- [x] `night_spirit` y `assassin_opportunity` solo aparecen de noche
- [x] `day_market` solo aparece de día
- [x] `explorer_cache` da más recompensa al explorador
- [x] `wounded_mage` puede enseñar arcane_bolt a magos
- [x] `ancient_scroll_find` da un pergamino aleatorio
- [ ] QA visual en navegador
