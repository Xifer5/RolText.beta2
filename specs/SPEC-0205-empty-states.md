---
tags: [spec, pendiente]
serie: "02"
estado: pendiente
---

# SPEC-0205 Empty States

## Objetivo

Mostrar estados vacios claros en inventario y tienda para que el jugador entienda si no tiene objetos o nada vendible.

## Contexto

- Archivos relevantes: `js/inventory.js`, `js/shop.js`, `styles-m3.css`.
- Estado actual: tienda muestra un mensaje inline cuando no hay objetos para vender; inventario puede quedar vacio sin explicacion clara.
- Riesgo principal: que el estado vacio parezca un item interactivo.

## Flujo Principal

1. El jugador abre inventario o tienda.
2. Si no hay contenido, ve una fila vacia no interactiva.
3. El texto explica la situacion.

## Reglas De Gameplay

- No cambia drops, compra, venta ni inventario.

## UX/UI

- Superficies: lista de inventario, lista de venta.
- Estados: empty.
- Copy visible: breve y directo.
- Accesibilidad: `aria-disabled` en fila no interactiva.

## Material 3

- Usa superficie tonal y texto secundario.
- Sin inline styles.

## Responsive

- Mobile 390x844: estado vacio centra texto y no desborda.
- Desktop 1440x900: mantiene altura compacta.

## Datos Y Contratos

- Estado leido: `gameState.inventory`.
- Estado escrito: ninguno.
- Eventos usados: ninguno.
- Persistencia: no aplica.

## Criterios De Aceptacion

- [x] Inventario vacio muestra mensaje.
- [x] Lista de venta vacia usa clase CSS, no inline style.
- [x] Estado vacio no tiene acciones.
- [x] JS syntax check pasa.

## Gherkin

```gherkin
Feature: Estados vacios
  Scenario: Inventario sin objetos
    Given el jugador no tiene objetos
    When abre el inventario
    Then ve un mensaje de inventario vacio
```

## Plan De Implementacion

- [x] Crear spec.
- [x] Agregar empty state en inventario.
- [x] Reemplazar empty state inline de tienda.
- [x] Estilizar fila vacia.

## Verificacion

- [ ] Smoke manual desktop
- [ ] Smoke manual movil
- [x] JS syntax check
- [ ] Sin texto solapado/cortado
