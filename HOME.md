---
tags: [index, dashboard]
---

# 🗺️ Pixel Quest Echoes v6.1 — Dashboard

> RPG de texto con Material Design 3, JS puro, sin bundler.
> Ruta: `C:\Users\Diego Ovando\Source\games\rol,attack\pruebas\6.1`

---

## 📂 Documentos raíz

- [[README]] — descripción general del proyecto
- [[SPEC_WORKFLOW]] — flujo de trabajo y backlog priorizado
- [[DESIGN_COMBAT_ADVANCED]] — hoja de ruta del sistema de combate avanzado

---

## ✅ Specs implementadas

### Serie 01 — Combate y HUD base
| # | Spec | Tema |
|---|------|------|
| 1 | [[specs/SPEC-0101-combat-decision-hints]] | Hints de combate |
| 2 | [[specs/SPEC-0102-navigation-affordance]] | Direcciones disponibles |
| 3 | [[specs/SPEC-0103-inventory-equipment-comparison]] | Comparación de equipo |
| 4 | [[specs/SPEC-0104-shop-affordance-comparison]] | Tienda con deltas |
| 5 | [[specs/SPEC-0105-location-risk-indicator]] | Indicador de riesgo |

### Serie 02 — Mobile y UX
| # | Spec | Tema |
|---|------|------|
| 6 | [[specs/SPEC-0201-mobile-hud]] | HUD móvil persistente |
| 7 | [[specs/SPEC-0202-location-context-actions]] | Acciones contextuales |
| 8 | [[specs/SPEC-0204-mobile-sheets]] | Sheets móviles |
| 9 | [[specs/SPEC-0205-empty-states]] | Estados vacíos |
| 10 | [[specs/SPEC-0206-modal-escape-close]] | Cierre con Escape |
| 11 | [[specs/SPEC-0207-save-menu-feedback]] | Feedback de guardado |
| 12 | [[specs/SPEC-0208-inventory-row-selection]] | Selección por click |

### Serie 03 — Limpieza M3
| # | Spec | Tema |
|---|------|------|
| 13 | [[specs/SPEC-0301-m3-inline-style-cleanup]] | Inline styles → tokens |

### Serie 05 — Inventario / Tienda M3
| # | Spec | Tema |
|---|------|------|
| 14 | [[specs/SPEC-0501-sell-confirmation]] | Confirmación de venta |
| 15 | [[specs/SPEC-0502-rarity-badges]] | Badges de rareza |
| 16 | [[specs/SPEC-0503-bestiary-mobile-m3]] | Bestiario responsive |
| 17 | [[specs/SPEC-0504-inventory-filter-chips]] | Chips de filtro |
| 18 | [[specs/SPEC-0505-toast-position-tooltips]] | Toast + Tooltips |

### Serie 06 — Sistema de combate avanzado
| # | Spec | Tema |
|---|------|------|
| 19 | [[specs/SPEC-0601-damage-types-resistances]] | Tipos de daño |
| 20 | [[specs/SPEC-0602-extended-status-effects]] | Efectos de estado |
| 21 | [[specs/SPEC-0603-armor-resistances]] | Resistencias de armadura |
| 22 | [[specs/SPEC-0604-enemy-ai-behaviors]] | IA de enemigos |
| 23 | [[specs/SPEC-0605-weapon-mastery]] | Maestría de armas |
| 24 | [[specs/SPEC-0606-class-specializations]] | Especializaciones |
| 25 | [[specs/SPEC-0607-learning-system]] | Sistema de aprendizaje |
| 26 | [[specs/SPEC-0608-range-system]] | Sistema de alcance |

### Serie 07 — Mundo y NPCs
| # | Spec | Tema |
|---|------|------|
| 27 | [[specs/SPEC-0701-day-night-cycle]] | Ciclo día/noche |
| 28 | [[specs/SPEC-0702-npc-trainers]] | NPCs entrenadores |
| 29 | [[specs/SPEC-0703-contextual-travel-events]] | Eventos de viaje |

---

## 🔧 Archivos clave del proyecto

```
index.html          — HTML principal
styles-m3.css       — tokens M3 + todos los estilos
js/main.js          — punto de entrada (ES modules)
js/state.js         — gameState + initialGameState
js/ui.js            — renderizado de la UI
js/combat.js        — motor de combate
js/inventory.js     — inventario + filtros
js/shop.js          — tienda compra/venta
js/npcs.js          — definición de NPCs
js/classes.js       — clases, habilidades, LEARNABLE_SKILLS
js/specializations.js — especializaciones por clase
js/toast.js         — sistema de toasts
js/tooltipManager.js — tooltips position:fixed
```

---

## 📌 Reglas críticas

> ⚠️ `#location-img` y `#enemy-portrait` SIEMPRE con `style.display`, **nunca** `classList.hidden`
