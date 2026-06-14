---
tags: [spec, pendiente]
serie: "02"
estado: pendiente
---

# SPEC-0204 Mobile Sheets

## Objetivo

Hacer que los botones moviles `Mov.`, `Acc.` y `Menu` abran sheets funcionales para movimientos especiales, acciones y paneles.

## Contexto

- Archivos relevantes: `index.html`, `js/ui.js`, `styles-m3.css`.
- Estado actual: el markup del sheet existe, pero la navegacion movil necesita listeners completos para no depender de sidebars ocultos.
- Riesgo principal: duplicar listeners o dejar el sheet abierto despues de ejecutar una accion.

## Flujo Principal

1. El jugador toca `Mov.`, `Acc.` o `Menu` en la barra inferior movil.
2. Se abre el sheet con el panel correspondiente.
3. El jugador elige una accion.
4. El sheet se cierra y se ejecuta la accion.

## Reglas De Gameplay

- No cambia reglas de movimiento, descanso, tienda o paneles.
- Las acciones reutilizan los mismos handlers existentes.

## UX/UI

- Superficies: bottom nav y mobile sheet.
- Estados: abierto, cerrado, backdrop, accion ejecutada.
- Copy visible: mantiene labels existentes.
- Accesibilidad: `aria-hidden` refleja estado del sheet.

## Material 3

- Usa bottom sheet existente.
- Mantiene botones tactiles de 44px+.

## Responsive

- Mobile 390x844: sheet abre desde barra inferior.
- Tablet 768x1024: misma conducta.
- Desktop 1440x900: sheet no aparece porque bottom nav esta oculto.

## Datos Y Contratos

- Estado leido: `gameState.currentLocationId`.
- Estado escrito: segun accion existente.
- Eventos usados: `pixel:move`, `click` en botones `data-panel`.
- Persistencia: no afecta guardado directo.

## Criterios De Aceptacion

- [x] `Mov.` abre movimientos especiales.
- [x] `Acc.` abre inventario, stats, descanso, tienda y misiones.
- [x] `Menu` abre paneles superiores.
- [x] El sheet se cierra tras ejecutar una accion.
- [ ] QA visual en navegador movil.

## Gherkin

```gherkin
Feature: Sheets moviles
  Scenario: Abrir acciones moviles
    Given el jugador esta en movil
    When toca "Acc."
    Then ve acciones principales en un sheet
```

## Plan De Implementacion

- [x] Crear spec.
- [x] Reintroducir helpers de abrir/cerrar sheet.
- [x] Conectar botones de bottom nav.
- [x] Conectar acciones internas.
- [x] Verificar sintaxis JS.

## Verificacion

- [ ] Smoke manual desktop
- [ ] Smoke manual movil
- [x] JS syntax check
- [ ] Sin texto solapado/cortado
- [ ] No se rompio guardado/carga si aplica
