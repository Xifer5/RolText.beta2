# SPEC-0104 Shop Affordance And Comparison

## Objetivo

Mejorar decisiones de compra mostrando si el jugador puede pagar y que impacto tendra el equipo comprado.

## Contexto

- Archivos relevantes: `js/shop.js`, `styles-m3.css`.
- Estado actual: la tienda lista atributos y precio, pero no deshabilita visualmente compras sin oro ni compara equipo.
- Riesgo principal: sobrecargar cada fila de tienda.

## Flujo Principal

1. El jugador abre tienda.
2. Cada item muestra precio y accion.
3. Si no alcanza el oro, comprar aparece deshabilitado.
4. Si es equipable, se muestran deltas compactos de ATK/DEF/MAG.

## Reglas De Gameplay

- No cambia precios, venta ni compra.
- Comprar sigue validando oro en `buyItem`.
- Comparacion usa simulacion de equipo, no equipa automaticamente.

## UX/UI

- Superficies: lista de compra de tienda.
- Estados: affordable, unaffordable, sell.
- Copy visible: `Falta oro` en boton deshabilitado.
- Accesibilidad: boton nativo `disabled` cuando no se puede comprar.

## Material 3

- Usa clases y chips en vez de inline styles.
- Deltas positivos/negativos tienen texto y color.

## Responsive

- Mobile 390x844: deltas hacen wrap dentro de fila.
- Desktop 1440x900: mantiene fila escaneable.

## Datos Y Contratos

- Estado leido: `gameState.player.gold`, `gameState.equipment`.
- Estado escrito: ninguno nuevo.
- Eventos usados: click existente en comprar/vender.
- Persistencia: no aplica.

## Criterios De Aceptacion

- [x] Compra sin oro aparece deshabilitada.
- [x] Items equipables muestran delta ATK/DEF/MAG.
- [x] Venta mantiene comportamiento.
- [x] JS syntax check pasa.
- [ ] QA visual en navegador.

## Gherkin

```gherkin
Feature: Compra informada
  Scenario: Item demasiado caro
    Given el jugador no tiene oro suficiente
    When abre la tienda
    Then el boton comprar del item aparece deshabilitado
```

## Plan De Implementacion

- [x] Crear spec.
- [x] Agregar comparacion compacta.
- [x] Deshabilitar compra sin oro.
- [x] Mover estilos de fila a clases.

## Verificacion

- [ ] Smoke manual desktop
- [ ] Smoke manual movil
- [x] JS syntax check
- [ ] Sin texto solapado/cortado
