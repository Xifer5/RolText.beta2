---
tags: [spec, done]
serie: "05"
estado: done
---

# SPEC-0501 Confirmación al vender objetos importantes

## Objetivo

Evitar que el jugador venda accidentalmente objetos raros, épicos o legendarios. Los objetos de misión no se pueden vender en absoluto.

## Contexto

- Archivos relevantes: `js/shop.js`
- Estado actual: `sellItem()` elimina el objeto sin pedir confirmación.
- Riesgo principal: el jugador puede vender su mejor equipo por error con un click.

## Flujo Principal

1. Jugador hace click en "Vender" sobre un objeto.
2. Si es quest-item → mensaje de error, sin vender.
3. Si es rare/epic/legendary → diálogo de confirmación con nombre y precio.
4. Si confirma → venta normal. Si cancela → no pasa nada.
5. Common/uncommon → venta directa sin confirmar.

## Reglas De Gameplay

- Quest items: bloqueados, mensaje "Los objetos de misión no se pueden vender."
- Rare+: `window.confirm()` con texto del item y precio.
- Common/uncommon: venta inmediata (sin cambio de comportamiento).

## Criterios De Aceptacion

- [x] Quest items no se pueden vender.
- [x] Vender un item rare/epic/legendary muestra confirmación.
- [x] Cancelar la confirmación no altera inventario ni oro.
- [x] Common/uncommon se venden sin diálogo.

## Plan De Implementacion

- [x] Agregar helper `IMPORTANT_RARITIES` en shop.js
- [x] En `sellItem()` verificar quest-type y rarity antes de `removeItemFromInventory`
