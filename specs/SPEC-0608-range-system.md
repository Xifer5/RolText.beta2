---
tags: [spec, pendiente]
serie: "06"
estado: pendiente
---

# SPEC-0608 Sistema de Alcance

## Objetivo

Dar importancia táctica al tipo de arma equipada: enemigos con mayor alcance que el jugador obtienen un ataque gratuito al inicio del combate.

## Tabla de alcances

| Arma / Tipo | Alcance |
|-------------|---------|
| Daga | 1 |
| Espada, hacha, martillo (default) | 2 |
| Tridente, látigo de vid | 3 |
| Staves / wands (magia) | 3 |
| Beholder (rayos oculares) | 4 |
| Genie | 4 |
| Warlock, goblin_shaman, medusa | 3 |
| Wyvern, vine_serpent | 3 |

Default si no está en tabla: 2.

## Mecánica

En `startCombat()`:
- Si `ENEMY_RANGE[enemyId] > WEAPON_RANGE[playerWeaponId]` → `gameState.currentEnemy.hasInitiative = true`
- Mensaje: "📏 [enemigo] tiene mayor alcance — ¡atacará primero!"

En `handleAction()`, antes del check de stun:
- Si `hasInitiative` → `enemyTurn()` gratuito, luego limpia el flag
- Si el jugador muere, el combate termina sin que actúe

## Criterios De Aceptacion

- [x] Beholder/Genie actúan antes del jugador con espada equipada
- [x] Con tridente equipado, el jugador NO cede iniciativa a enemigos de alcance 2-3
- [x] El ataque de iniciativa puede matar al jugador
- [x] El flag `hasInitiative` se limpia tras el primer ataque (no se repite)
- [ ] QA visual en navegador
