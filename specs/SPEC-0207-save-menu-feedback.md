# SPEC-0207 Save Menu Feedback

## Objetivo

Evitar feedback duplicado en guardado y no cerrar el menu si cargar/continuar falla.

## Contexto

- Archivos relevantes: `js/events.js`, `js/saveSystem.js`.
- Estado actual: `saveGame()` ya agrega mensaje, pero `saveGameBtn` agrega otro. `loadGame()` devuelve `false` si falla, pero el menu se cierra igual desde eventos.
- Riesgo principal: cambiar semantica de guardado/carga.

## Flujo Principal

1. El jugador abre menu.
2. Guarda: ve un solo mensaje de exito.
3. Carga/continua sin partida: ve error y el menu permanece abierto.
4. Carga/continua con partida valida: el menu se cierra.

## Reglas De Gameplay

- No cambia formato de guardado.
- No cambia `localStorage`.

## UX/UI

- Superficies: menu principal y log.
- Estados: exito/error.
- Copy visible: se conserva el existente de `saveSystem`.

## Material 3

- No cambia visual.

## Responsive

- Igual en mobile/desktop.

## Datos Y Contratos

- Estado leido: retorno booleano de `loadGame()` y `saveGame()`.
- Estado escrito: igual que antes.
- Eventos usados: existentes.
- Persistencia: igual que antes.

## Criterios De Aceptacion

- [x] Guardar no duplica mensajes.
- [x] Cargar fallido no cierra menu.
- [x] Cargar exitoso cierra menu.
- [x] JS syntax check pasa.

## Gherkin

```gherkin
Feature: Feedback de guardado
  Scenario: Cargar sin partida
    Given no existe partida guardada
    When el jugador toca cargar
    Then ve un error
    And el menu sigue abierto
```

## Plan De Implementacion

- [x] Crear spec.
- [x] Usar retorno booleano de `loadGame`.
- [x] Eliminar mensaje duplicado al guardar.
- [x] Verificar sintaxis.

## Verificacion

- [ ] Smoke manual desktop
- [ ] Smoke manual movil
- [x] JS syntax check
