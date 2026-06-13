# SPEC-0103 Inventory Equipment Comparison

## Objetivo

Ayudar al jugador a decidir si equipar un objeto mostrando comparacion directa contra el equipo actual.

## Contexto

- Archivos relevantes: `js/inventory.js`, `styles-m3.css`.
- Estado actual: el detalle muestra atributos del item, pero no indica el impacto total al reemplazar el slot actual.
- Riesgo principal: confundir atributos base del item con stats derivados del personaje.

## Flujo Principal

1. El jugador abre inventario.
2. Selecciona un item equipable.
3. El detalle muestra cambios estimados en ATK, DEF, MAG, HP max y MP max.
4. El jugador decide equipar o cerrar.

## Reglas De Gameplay

- No cambia formulas ni slots.
- La comparacion usa `calculateTotalStats` con equipo actual vs equipo simulado.
- Solo aparece para items con `slot`.

## UX/UI

- Superficies: panel de detalle de inventario.
- Estados: mejora, empeora, igual.
- Copy visible: deltas compactos `+3`, `-1`, `0`.
- Accesibilidad: deltas son texto real, no solo color.

## Material 3

- Usa chips compactos en superficie tonal.
- Colores semanticamente restringidos: heal para mejora, error para perdida.

## Responsive

- Mobile 390x844: chips hacen wrap.
- Desktop 1440x900: aparece dentro del detalle sin desplazar acciones fuera de vista.

## Datos Y Contratos

- Estado leido: `gameState.player`, `gameState.equipment`, item seleccionado.
- Estado escrito: ninguno.
- Eventos usados: ninguno nuevo.
- Persistencia: no afecta guardado.

## Criterios De Aceptacion

- [x] Item equipable muestra comparacion con equipo actual.
- [x] Item consumible/material no muestra comparacion.
- [x] Deltas positivos/negativos/neutros son visibles.
- [x] No cambia equipamiento hasta tocar `Equipar`.
- [ ] QA visual en navegador.

## Gherkin

```gherkin
Feature: Comparacion de equipo
  Scenario: Ver impacto de una espada
    Given el jugador tiene una espada en inventario
    When selecciona la espada
    Then ve como cambiarian ATK, DEF, MAG, HP max y MP max
```

## Plan De Implementacion

- [x] Crear spec.
- [x] Agregar helper de comparacion.
- [x] Renderizar chips en detalle de item.
- [x] Estilizar chips.
- [ ] QA visual.

## Verificacion

- [ ] Smoke manual desktop
- [ ] Smoke manual movil
- [x] JS syntax check
- [ ] Sin texto solapado/cortado
