---
tags: [spec, pendiente]
serie: "06"
estado: pendiente
---

# SPEC-0603 Resistencias en armaduras

## Objetivo

Hacer que las armaduras, escudos y cascos otorguen resistencias específicas por tipo de daño, conectando SPEC-0601 con el equipamiento del jugador.

## Contexto

- Archivos modificados: `js/damageTypes.js`, `js/stats.js`, `js/inventory.js`
- Estado anterior: las resistencias del jugador solo venían de su clase base.
- Decisión de diseño: las resistencias se definen en `ITEM_RESISTANCES` en `damageTypes.js` en vez de editar `items.js`, igual que `WEAPON_DAMAGE_TYPES` y `ENEMY_COMBAT_DATA`. Esto mantiene `items.js` limpio.

## Ítems con resistencias

| Ítem | Resistencias |
|------|-------------|
| chainmail | pierce +15% |
| dark_armor | dark +30%, light -20% |
| jungle_armor | poison_dmg +20%, earth +10% |
| sea_armor | water +25%, lightning -15% |
| captain_coat | water +15%, fire -10% |
| royal_armor | slash +10%, pierce +10% |
| plate_armor | slash +20%, pierce +15% |
| stone_armor | slash +25%, pierce +20%, lightning -30% |
| dragon_king_armor | fire +40%, slash +20%, pierce +15% |
| arcane_robe | magic +20% |
| aqua_robe | water +25%, fire -15% |
| coral_robe | water +20%, lightning -10% |
| fire_robe | fire +30%, ice -20% |
| nature_robe | earth +20%, poison_dmg +15%, fire -15% |
| ethereal_robe | magic +15%, cursed +20% |
| shield_of_elves | dark -15%, light +15% |
| iron_shield | slash +10%, pierce +10% |
| strong_shield | slash +15%, pierce +15% |
| tower_shield | slash +20%, pierce +20%, blunt +10% |
| plate_helmet | slash +5%, pierce +5% |
| spartan_helmet | slash +10%, blunt +5% |
| divine_helmet | holy +15%, slash +15% |

## Cambios Técnicos

- `ITEM_RESISTANCES` exportado desde `damageTypes.js`
- `calculateTotalStats()` usa `it.resistances || ITEM_RESISTANCES[it.id] || {}`
- `showItemDetails()` muestra la sección "Resistencias:" si el ítem tiene alguna

## Criterios De Aceptacion

- [x] Equipar `dragon_king_armor` reduce 40% del daño de fuego recibido.
- [x] Equipar `dark_armor` reduce 30% del daño oscuro pero amplifica 20% la luz.
- [x] Las resistencias se acumulan con las de la clase base.
- [x] El detalle del ítem en inventario muestra las resistencias.
- [ ] QA visual en navegador
