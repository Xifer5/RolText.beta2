---
tags: [spec, pendiente]
serie: "06"
estado: pendiente
---

# SPEC-0607 Sistema de Aprendizaje

## Objetivo

Habilidades universales que cualquier clase puede aprender usando pergaminos/libros encontrados en loot o tiendas.

## Módulo

`js/classes.js` — `LEARNABLE_SKILLS` (habilidades aprendibles).  
`js/inventory.js` — manejo del tipo `scroll` en `useItem()`.

## Habilidades Universales

| ID | Nombre | Costo MP | Efecto |
|----|--------|----------|--------|
| `rally` | Reagruparse | 15 | +20% HP, elimina 1 debuff activo |
| `power_strike` | Golpe Potente | 12 | Golpe que ignora DEF, 50% crit |
| `arcane_bolt` | Descarga Arcana | 18 | 2× magia pura, ignora DEF |

## Items — Pergaminos

| ID | Nombre | Precio | Disponible en |
|----|--------|--------|---------------|
| `scroll_of_rally` | Pergamino: Reagruparse | 150 | castle_shop |
| `scroll_of_power` | Pergamino: Golpe Potente | 200 | castle_shop |
| `scroll_of_arcane` | Pergamino: Descarga Arcana | 250 | castle_shop |

## Mecánica

- Los pergaminos tienen `type: "scroll"` y `teachesSkill: skillId`.
- Al usarlos, el `skillId` se añade a `gameState.learnedSkills[]`.
- Si el jugador ya conoce la habilidad, el pergamino se devuelve al inventario.
- Las habilidades aprendidas aparecen en el panel de combate y en el grimorio junto a las de clase.

## Estado

`gameState.learnedSkills: string[]` — lista de skillIds aprendidos.

## UI

- Los pergaminos se muestran en el inventario como consumibles con tipo "scroll".
- Las habilidades aprendidas aparecen en el panel de habilidades del combate.
- En el grimorio (panels.js) se listan junto a las habilidades de clase.

## Criterios De Aceptacion

- [x] Usar un pergamino añade el skillId a `gameState.learnedSkills`
- [x] No se puede aprender la misma habilidad dos veces (pergamino se devuelve)
- [x] Las habilidades aprendidas aparecen en el panel de combate
- [x] Las habilidades aprendidas aparecen en el grimorio
- [x] Los pergaminos están disponibles en castle_shop
- [ ] QA visual en navegador
