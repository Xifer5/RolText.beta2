---
tags: [spec, done]
serie: "05"
estado: done
---

# SPEC-0502 Badges visuales de rareza

## Objetivo

Mostrar el nivel de rareza de un item como un chip de color en el inventario y la tienda, para que el jugador identifique visualmente qué objetos son valiosos antes de vender o comparar.

## Contexto

- Archivos relevantes: `js/inventory.js`, `js/shop.js`, `styles-m3.css`
- Estado actual: los items tienen `rarity` (common/uncommon/rare/epic/legendary) pero no se muestra en ninguna lista.
- Los tokens CSS `.rarity-badge.rarity-*` ya existen en `styles-m3.css`.

## Flujo Principal

1. El jugador abre Inventario o Tienda.
2. Cada item uncommon/rare/epic/legendary muestra un chip de color con su rareza.
3. Common no muestra chip (reduce ruido visual).

## Criterios De Aceptacion

- [x] Items uncommon+ muestran chip de rareza en inventario.
- [x] Items uncommon+ muestran chip de rareza en tienda (compra y venta).
- [x] Los colores coinciden con el sistema de rareza: verde/azul/violeta/dorado.
- [x] Common no muestra chip.

## Plan De Implementacion

- [x] `js/inventory.js`: badge en `nameWrap` de cada fila del inventario
- [x] `js/shop.js`: badge junto al nombre en `makeShopItem()`
- [x] `styles-m3.css`: `.shop-row-name` ahora es flex para alinear texto + badge
