---
tags: [spec, pendiente]
serie: "07"
estado: pendiente
---

# SPEC-0702 NPC Entrenadores

## Objetivo

Completar el sistema de aprendizaje (SPEC-0607) añadiendo NPCs entrenadores que enseñan habilidades universales a cambio de oro, dando un uso diegético a las ubicaciones tavern y armory.

## NPCs Añadidos

| ID | Nombre | Ubicación | Habilidades |
|----|--------|-----------|-------------|
| `mentor_aldric` | Maestro Aldric | `tavern` | rally (150💰), power_strike (200💰), arcane_bolt (250💰) |
| `weaponsmith_garrett` | Herrero Garrett | `armory` | power_strike (180💰), rally (130💰) |

## Mecánica

- La sección de entrenamiento aparece en el modal NPC bajo el lore del personaje.
- Muestra cada habilidad disponible con su costo en oro.
- Si el jugador ya conoce la habilidad, aparece como "✓ Aprendida".
- Si el jugador no tiene oro suficiente, el botón muestra "Sin oro" y está desactivado.
- Al aprender, se deduce el oro y el skillId se añade a `gameState.learnedSkills`.

## UI

- `#npcTrainerSection` — div en el modal NPC (hidden si NPC no es entrenador)
- Cada fila: emoji · nombre · descripción · botón "Aprender (X💰)" o "✓ Aprendida"

## Criterios De Aceptacion

- [x] `mentor_aldric` visible en la taverna
- [x] `weaponsmith_garrett` visible en la armería
- [x] Botones de aprendizaje funcionan y descuentan oro
- [x] Las habilidades aprendidas muestran "✓ Aprendida" al reabrir el modal
- [x] Sin oro suficiente, botón desactivado
- [ ] QA visual en navegador
