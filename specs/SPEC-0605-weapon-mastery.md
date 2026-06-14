---
tags: [spec, pendiente]
serie: "06"
estado: pendiente
---

# SPEC-0605 Maestría de Armas

## Objetivo

Sistema de progresión por tipo de arma: XP acumulada por uso en combate desbloquea niveles que aumentan el daño con ese tipo de arma.

## Módulo

`js/mastery.js` — fuente de verdad del sistema.

## Tiers de maestría

| XP Req | Título | Bonus daño |
|--------|--------|-----------|
| 0 | Novato ⬜ | 0% |
| 500 | Adepto 🟩 | +5% |
| 2000 | Experto 🟦 | +10% |
| 5000 | Maestro 🟪 | +15% |
| 10000 | Legendario 🟨 | +20% |

## Mecánica

- Cada ataque exitoso otorga +1 XP al tipo de daño del arma equipada.
- Crítico otorga +2 XP.
- El bonus se aplica como multiplicador al daño total tras resistencias.
- Cada tipo de daño tiene su propia XP independiente (slash, pierce, magic, fire, etc.).

## Estado

`gameState.weaponMastery: { [damageType]: { xp: number } }`

## UI

Sección "⚔️ Maestría de Armas" en el modal de stats:
- Lista ordenada por XP descendente
- Barra de progreso al siguiente tier
- Etiqueta con XP actual / XP necesaria para siguiente tier
- Solo muestra tipos con XP > 0

## Criterios De Aceptacion

- [x] XP se acumula al atacar (crít = 2 XP, normal = 1 XP)
- [x] Al llegar a 500 XP, daño aumenta 5% con ese tipo de arma
- [x] Mensaje notifica al subir de tier
- [x] Stats modal muestra maestría actual con barra de progreso
- [x] `weaponMastery` se persiste en gameState (se guarda con el resto)
- [ ] QA visual en navegador
