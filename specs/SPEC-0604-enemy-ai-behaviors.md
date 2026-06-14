---
tags: [spec, pendiente]
serie: "06"
estado: pendiente
---

# SPEC-0604 Inteligencia de enemigos — Behavior patterns

## Objetivo

Dar personalidad táctica a cada enemigo mediante patrones de comportamiento que modifican su turno de ataque.

## Contexto

- Archivos modificados: `js/damageTypes.js` (ENEMY_COMBAT_DATA), `js/combat.js` (enemyTurn)
- Estado anterior: solo `regenerate` y `mage` estaban parcialmente implementados.
- Decisión de diseño: el campo `behavior` va en `ENEMY_COMBAT_DATA` junto a `attackDamageType` y `resistances`, para que todo el perfil de combate del enemigo esté centralizado en un solo lugar.

## Patrones de comportamiento

| Behavior | Efecto mecánico |
|----------|----------------|
| `standard` | Ataque básico sin modificador |
| `aggressive` | +20% daño de ataque |
| `defensive` | -20% daño cuando HP < 35%; muestra mensaje |
| `mage` | 70% probabilidad de usar ataque mágico |
| `regenerate` | Recupera 5% MaxHP por turno |
| `status` | +30% probabilidad de aplicar estados alterados |
| `berserker` | Daño escala con HP perdido: `1 + (1-hpRatio) * 0.5` |
| `boss` | HP > 60%: +15% dmg; 30-60%: escala; < 30%: +50% + regen 3% |

## Asignación de behaviors

- aggressive: goblin, wolf, orc, cave_bat, cave_bear, wyvern, centaurus, chimera, kraken, pirate, pirate_captain, jungle_tiger, mountain_giant, linchorn, squeletor, imp, gremlin, pegasus, sand_worm, thief, mountain_colossus
- mage: goblin_shaman, warlock, elf, ancient_guardian, sea_serpent, medusa (status también), mermaid, Inferno_elemental, pyro_elemental, vine_serpent, jungle_spirit, genie, dragon, ancient_construct
- regenerate: cave_troll, hydra, lava_golem
- defensive: stone_golem, treasure_guardian, guard, dwarf_warrior, tent
- status: vampire, giant_spider, cultist, beholder, drider, swamp_abominatinon, fungedBeast
- berserker: gorilla_warrior, dark_knight, diablo, cave_devourer
- boss: inferno_dragon, forest_titan, mountain_colossus, frost_wyrm, dragon_king

## Criterios De Aceptacion

- [x] Berserker hace más daño cuando tiene HP bajo.
- [x] Boss regen al 3% de MaxHP cuando HP < 30%.
- [x] Aggressive hace 20% más daño consistentemente.
- [x] Status enemies aplican efectos con mayor frecuencia.
- [x] Defensive enemy reduce ataque al llegar a HP bajo.
- [ ] QA visual en navegador
