---
tags: [spec, pendiente]
serie: "06"
estado: pendiente
---

# SPEC-0602 Estados alterados expandidos

## Objetivo

Ampliar el sistema de debuffs del jugador con: sangrado (bleed), debilidad (weakness) y ceguera (blind). Actualizar la lista de enemigos que los aplican.

## Contexto

- Archivos modificados: `js/combat.js`
- Estado anterior: solo poison, burn, stun, frozen.

## Nuevos estados

| Estado | Tipo | Efecto mecánico |
|--------|------|-----------------|
| `bleed` | DoT cortante | X daño/turno, no curable con antídoto |
| `weakness` | Stat debuff | +25% daño recibido mientras dure |
| `blind` | Precisión | 30% de fallo en ataques físicos/mágicos |

## Enemigos que aplican los nuevos estados

- **Bleed**: cave_bat, goblin, wolf — perforantes y cortantes
- **Weakness**: cultist, dark_knight, diablo — oscuridad y maldición
- **Blind**: beholder — ataques psíquicos oculares

## Criterios De Aceptacion

- [ ] Cave Bat puede causar sangrado (30% damage × 2 turnos).
- [ ] Beholder puede causar ceguera (2 turnos, 30% fallo ataque).
- [ ] Con debilidad activa, el daño recibido aumenta 25%.
- [ ] El log identifica cada estado con su emoji correcto.
- [ ] Los estados se disipan correctamente al llegar a 0 turnos.
- [ ] `processPlayerDebuffs()` maneja bleed como DoT y weakness/blind como no-DoT.

## Plan De Implementacion

- [x] `ENEMY_STATUS_EFFECTS`: añadidos bleed (cave_bat, goblin, wolf), weakness (cultist, dark_knight, diablo), blind (beholder)
- [x] `processPlayerDebuffs()`: loop refactorizado con `DOT_META`, maneja efectos sin damage
- [x] `enemyTurn()`: aplica `weaknessMult` al daño final cuando player tiene weakness
- [x] `playerAttack()`: check blind con 30% de fallo antes de calcular daño
- [x] `enemyTurn()` switch: cases para bleed, weakness, blind con mensajes
- [ ] QA visual en navegador
