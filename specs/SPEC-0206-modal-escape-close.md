# SPEC-0206 Modal Escape Close

## Objetivo

Permitir cerrar modales con Escape y reducir friccion al navegar paneles, inventario, tienda, stats, misiones, NPC, eventos y menu.

## Contexto

- Archivos relevantes: `js/ui.js`.
- Estado actual: algunos modales tienen boton cerrar, pero no hay manejo global de Escape.
- Riesgo principal: cerrar modales criticos de decision por accidente.

## Flujo Principal

1. El jugador abre un modal.
2. Presiona Escape.
3. El modal superior visible se cierra.
4. Si no hay modal abierto, no ocurre nada.

## Reglas De Gameplay

- No cambia estado de juego.
- No confirma acciones ni cancela compras ya hechas.

## UX/UI

- Superficies: modales y mobile sheet.
- Estados: visible/hidden.
- Accesibilidad: Escape como patron estandar.

## Material 3

- Sigue patron de dialogos dismissibles.

## Responsive

- Mobile/desktop: misma conducta.

## Datos Y Contratos

- Estado leido: clases `.modal:not(.hidden)` y `#mobileSheet`.
- Estado escrito: clase `hidden`, `aria-hidden`.
- Eventos usados: `keydown`.
- Persistencia: no aplica.

## Criterios De Aceptacion

- [x] Escape cierra el ultimo modal visible.
- [x] Escape cierra mobile sheet si esta abierto.
- [x] Si no hay modal, Escape no genera error.
- [x] JS syntax check pasa.

## Gherkin

```gherkin
Feature: Cierre con Escape
  Scenario: Cerrar inventario
    Given el inventario esta abierto
    When el jugador presiona Escape
    Then el inventario se cierra
```

## Plan De Implementacion

- [x] Crear spec.
- [x] Agregar handler global.
- [x] Mantener `aria-hidden` del mobile sheet.
- [x] Verificar sintaxis.

## Verificacion

- [ ] Smoke manual desktop
- [ ] Smoke manual movil
- [x] JS syntax check
