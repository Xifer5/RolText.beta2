---
tags: [spec, pendiente]
serie: "06"
estado: pendiente
---

# SPEC-0601 Motor de tipos de daño y resistencias

## Objetivo

Implementar el sistema fundacional de tipos de daño y resistencias descrito en DESIGN_COMBAT_ADVANCED.md, de forma retrocompatible con el combate existente.

## Contexto

- Archivos modificados: `js/damageTypes.js` (nuevo), `js/combat.js`, `js/stats.js`
- El sistema anterior usaba un solo valor genérico de ataque vs defensa.
- Riesgo: romper calculos existentes — resuelto con defaults (slash/physical).

## Arquitectura

### `js/damageTypes.js`
- `DAMAGE_TYPES`: diccionario de todos los tipos
- `WEAPON_DAMAGE_TYPES`: mapa weapon-id → damageType (evita editar items.js)
- `ENEMY_COMBAT_DATA`: mapa enemy-id → { resistances, attackDamageType, behavior }
- `CLASS_BASE_RESISTANCES`: resistencias base por clase
- `applyResistance(damage, type, resistances)`: fórmula principal
- `getWeaponDamageType(weapon)`: resuelve tipo del arma equipada
- `DAMAGE_TYPE_EMOJI`: emojis para el log

### `js/stats.js`
- `calculateTotalStats()` agrega `stats.resistances` desde clase + equipo

### `js/combat.js`
- `startCombat()`: fusiona `ENEMY_COMBAT_DATA` en `currentEnemy`
- `playerAttack()`: tipo de arma → resistencia del enemigo → daño final
- `playerMagic()`: tipo mágico → resistencia del enemigo
- `enemyTurn()`: tipo del ataque enemigo → resistencias del jugador
- Comportamiento `regenerate`: el enemigo recupera 5% HP/turno

## Criterios De Aceptacion

- [ ] Atacar un Lava Golem con magia de fuego causa 1 de daño (inmune).
- [ ] Atacar un Lava Golem con hielo amplifica el daño.
- [ ] Atacar un Stone Golem con espada (slash) causa menos daño que con martillo.
- [ ] El Cave Troll regenera HP cada turno.
- [ ] El log muestra emoji del tipo y etiqueta [Res./Vuln.] cuando aplica.
- [ ] El guerrero tiene +10% resistencia física por clase.
- [ ] Funciona sin romper el flujo de combate existente.

## Plan De Implementacion

- [x] `js/damageTypes.js`: motor completo (tipos, tablas, funciones)
- [x] `js/stats.js`: importa `CLASS_BASE_RESISTANCES`, agrega `stats.resistances`
- [x] `js/combat.js`: integra resistencias en playerAttack, playerMagic, enemyTurn
- [x] `js/combat.js`: comportamiento `regenerate` en enemyTurn
- [ ] QA visual en navegador
