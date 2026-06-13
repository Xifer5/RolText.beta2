# SPEC-0208 Inventory Row Selection

## Objetivo

Permitir abrir el detalle de un item tocando/clicando toda la fila del inventario, manteniendo botones de usar/equipar independientes.

## Contexto

- Archivos relevantes: `js/inventory.js`, `styles-m3.css`.
- Estado actual: el jugador debe pulsar `Info`; la fila no actua como seleccion maestro-detalle.
- Riesgo principal: que tocar `Usar` o `Equipar` tambien abra detalle por bubbling.

## Flujo Principal

1. El jugador abre inventario.
2. Toca una fila.
3. El panel de detalle muestra el item.
4. Si toca `Usar`, `Equipar` o `Info`, solo se ejecuta esa accion.

## Reglas De Gameplay

- No cambia uso/equipamiento.

## UX/UI

- Superficies: lista de inventario.
- Estados: hover, focus, selected-like detail open.
- Accesibilidad: fila recibe `tabIndex=0` y responde a Enter/Espacio.

## Material 3

- Lista interactiva con affordance clara.

## Responsive

- Mobile/desktop: misma conducta.

## Datos Y Contratos

- Estado leido: item seleccionado.
- Estado escrito: solo DOM de detalle.
- Eventos usados: click/key.
- Persistencia: no aplica.

## Criterios De Aceptacion

- [x] Clic en fila abre detalle.
- [x] Enter/Espacio en fila abre detalle.
- [x] Botones de fila no disparan doble accion.
- [x] JS syntax check pasa.

## Gherkin

```gherkin
Feature: Seleccion de inventario
  Scenario: Abrir detalle desde fila
    Given el inventario tiene items
    When el jugador toca una fila
    Then ve el detalle del item
```

## Plan De Implementacion

- [x] Crear spec.
- [x] Hacer filas focusables.
- [x] Agregar click/key handlers.
- [x] Detener propagacion en botones.

## Verificacion

- [ ] Smoke manual desktop
- [ ] Smoke manual movil
- [x] JS syntax check
