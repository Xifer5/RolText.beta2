# SPEC-0202 Location Context Actions

## Objetivo

Mostrar acciones disponibles de la ubicacion actual cerca del nombre de zona para que el jugador no dependa de paneles laterales, especialmente en movil.

## Contexto

- Archivos relevantes: `index.html`, `styles-m3.css`, `js/ui.js`.
- Estado actual: `Hablar` aparece en el hero, pero `Descansar` y `Tienda` viven en el panel derecho, que se oculta en movil.
- Riesgo principal: duplicar acciones sin sincronizar disponibilidad.

## Flujo Principal

1. El jugador llega a una ubicacion.
2. El hero muestra acciones aplicables: hablar, descansar, tienda.
3. El jugador toca una accion contextual.
4. El sistema ejecuta la misma logica que los botones del panel derecho.

## Reglas De Gameplay

- Descansar solo funciona si `loc.canRest`.
- Tienda solo abre en `shop`, `castle_shop` o `port`.
- Las acciones se ocultan durante combate.

## UX/UI

- Superficies: hero de ubicacion.
- Estados: visible, hidden, hover, focus.
- Copy visible: `Hablar`, `Descansar`, `Tienda`.
- Accesibilidad: botones nativos con `aria-label`.

## Material 3

- Usa botones compactos tipo tonal/outlined sobre el hero.
- Usa tokens existentes de surface, primary y outline.

## Responsive

- Mobile 390x844: acciones visibles bajo/encima del hero sin tapar barras.
- Tablet 768x1024: acciones visibles cuando sidebars estan ocultos.
- Desktop 1440x900: acciones complementan, sin reemplazar panel derecho.

## Datos Y Contratos

- Estado leido: `gameState.currentLocationId`, `gameState.isInCombat`.
- Estado escrito: descanso modifica HP/MP; tienda solo abre modal.
- Eventos usados: ninguno nuevo.
- Persistencia: no afecta guardado directo.

## Criterios De Aceptacion

- [x] El jugador puede descansar desde el hero cuando la zona lo permite.
- [x] El jugador puede abrir tienda desde el hero en ubicaciones comerciales.
- [x] El sistema oculta acciones contextuales durante combate.
- [ ] En movil los botones no se solapan con el HUD.
- [ ] Con teclado los botones reciben foco visible.

## Gherkin

```gherkin
Feature: Acciones contextuales por ubicacion
  Scenario: Descansar desde una zona segura
    Given el jugador esta en una ubicacion con descanso
    When toca "Descansar" en el hero
    Then recupera HP y MP
```

## Plan De Implementacion

- [x] Crear spec.
- [x] Agregar botones contextuales al hero.
- [x] Agregar estilos M3 compactos.
- [x] Reusar logica de descanso y tienda.
- [ ] Verificar en navegador movil y desktop.

## Verificacion

- [ ] Smoke manual desktop
- [ ] Smoke manual movil
- [ ] Sin errores en consola
- [ ] Sin texto solapado/cortado
- [ ] No se rompio guardado/carga si aplica
