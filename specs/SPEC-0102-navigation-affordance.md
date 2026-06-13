# SPEC-0102 Navigation Affordance

## Objetivo

Hacer visibles las salidas disponibles y deshabilitar controles de direccion que no aplican en la ubicacion actual.

## Contexto

- Archivos relevantes: `js/ui.js`, `styles-m3.css`, `js/worldMap.js`.
- Estado actual: los botones de direccion existen siempre; si una salida no existe, el jugador recibe un mensaje despues de intentar moverse.
- Riesgo principal: deshabilitar de mas durante combate/procesamiento y bloquear una salida valida.

## Flujo Principal

1. El jugador llega a una ubicacion.
2. La UI lee `loc.exits`.
3. Botones de direccion disponibles quedan activos.
4. Botones sin salida quedan deshabilitados con titulo explicativo.

## Reglas De Gameplay

- No cambia `handleMove`.
- No cambia mapa ni puertas.
- Durante combate o movimiento en proceso se deshabilitan todas las direcciones.

## UX/UI

- Superficies: compass desktop, bottom nav movil, mobile sheet de movimientos.
- Estados: disponible, no disponible, bloqueado por combate/proceso.
- Copy visible: title/aria-label indica si no hay salida.
- Accesibilidad: botones usan `disabled` nativo.

## Material 3

- Estado disabled usa opacidad, borde y cursor consistente.
- Sin animacion nueva.

## Responsive

- Mobile 390x844: botones de bottom nav y sheet reflejan disponibilidad.
- Desktop 1440x900: compass y acciones especiales reflejan disponibilidad.

## Datos Y Contratos

- Estado leido: `gameState.currentLocationId`, `gameState.isInCombat`, `gameState.isProcessingMove`, `loc.exits`.
- Estado escrito: ninguno.
- Eventos usados: ninguno nuevo.
- Persistencia: no aplica.

## Criterios De Aceptacion

- [x] Direcciones inexistentes aparecen deshabilitadas.
- [x] Direcciones existentes siguen activas fuera de combate.
- [x] Durante combate/proceso, movimiento queda deshabilitado.
- [x] JS syntax check pasa.
- [ ] QA visual en navegador.

## Gherkin

```gherkin
Feature: Direcciones disponibles
  Scenario: Ubicacion con salida norte
    Given la ubicacion actual tiene salida norte
    When se renderizan los controles
    Then el boton norte esta activo
    And una direccion sin salida esta deshabilitada
```

## Plan De Implementacion

- [x] Crear spec.
- [x] Agregar helper de disponibilidad en UI.
- [x] Estilizar estado deshabilitado.
- [x] Verificar sintaxis.

## Verificacion

- [ ] Smoke manual desktop
- [ ] Smoke manual movil
- [x] JS syntax check
- [ ] Sin texto solapado/cortado
