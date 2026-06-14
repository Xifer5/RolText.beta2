---
tags: [spec, pendiente]
serie: "06"
estado: pendiente
---

# SPEC-0606 Especializaciones de Clase

## Objetivo

Al alcanzar nivel 10, el jugador elige una especialización permanente para su clase que otorga bonuses pasivos únicos.

## Módulo

`js/specializations.js` — fuente de verdad de especialización.

## Especializaciones por clase

### Guerrero
| ID | Nombre | Bonus |
|----|--------|-------|
| `sword_master` | Maestro de Espadas | +15% daño cortante |
| `mace_master` | Maestro de Mazos | +20% daño contundente |
| `shield_master` | Maestro de Escudos | -25% daño físico recibido |

### Mago
| ID | Nombre | Bonus |
|----|--------|-------|
| `fire_school` | Escuela de Fuego | +20% daño fuego, -15% MP fuego |
| `ice_school` | Escuela de Hielo | +15% daño hielo, +1 turno congelamiento |
| `lightning_school` | Escuela de Rayo | +20% daño rayo, +10% crit |

### Pícaro
| ID | Nombre | Bonus |
|----|--------|-------|
| `assassin` | Asesino | +25% daño perforante, veneno en ataques normales |
| `duelist` | Duelista | +15% evasión, 25% contraataque al esquivar |
| `explorer` | Explorador | +10% oro, +15% probabilidad de huir |

## Mecánica

- Al subir a nivel 10, aparece en el modal de stats el selector de especialización.
- Una vez elegida es permanente (no se puede cambiar).
- Los bonuses se aplican pasivamente en cada combate.

## Estado

`gameState.player.specialization: string | null`

## UI

En el modal de estadísticas (stats modal):
- Si no tiene especialización y es nivel 10+: muestra 3 botones con opciones.
- Si ya tiene especialización: muestra nombre, emoji y descripción del bonus.
- Si es nivel < 10: muestra mensaje "Alcanza nivel 10 para desbloquear".

## Criterios De Aceptacion

- [x] Al nivel 10 aparece el selector en el stats modal
- [x] La especialización elegida se guarda en `player.specialization`
- [x] Bonus de daño se aplica en `playerAttack()` (multiplicador sobre el total)
- [x] Bonus mágico (fire/ice/lightning) se aplica en `playerMagic()` y `useSkill()`
- [x] Shield master reduce el daño físico recibido en `enemyTurn()`
- [x] Duelist aumenta la evasión y permite contraataque
- [x] Explorer multiplica el oro ganado y mejora la huida
- [x] Assassin aplica veneno en ataques normales
- [ ] QA visual en navegador
