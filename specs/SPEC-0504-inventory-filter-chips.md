---
tags: [spec, done]
serie: "05"
estado: done
---

# SPEC-0504 Filtros de inventario

## Objetivo

Permite al jugador filtrar el inventario por categoría (Todos / Consumibles / Equipo / Misión) con chips M3, cumpliendo el criterio pendiente de SPEC-0103: "Filtrar por consumibles, equipo, materiales y vendibles."

## Contexto

- Archivos relevantes: `index.html`, `js/inventory.js`, `styles-m3.css`
- Estado anterior: `#inventoryList` mostraba todos los items sin filtro.
- Riesgo: acumulación de listeners si se vuelve a llamar `renderInventory()` — resuelto con `data-wired` guard.

## Flujo Principal

1. Jugador abre inventario — chips en estado "Todos" activo.
2. Click en "Consumibles" → lista filtra a `type === 'consumable'`, empty state contextual.
3. Click en "Equipo" → filtra a items con `slot`.
4. Click en "Misión" → filtra a `type === 'quest'`.
5. El filtro persiste mientras el modal está abierto; se resetea al recargar página.

## Criterios De Aceptacion

- [x] Los 4 chips se muestran siempre en la barra superior del inventario.
- [x] El chip activo tiene fondo secondary-container (M3 filter chip selected).
- [x] La lista refleja el filtro inmediatamente al hacer click.
- [x] El empty state explica la categoría vacía, no genérico.
- [x] No se acumulan event listeners en aperturas sucesivas del modal.
- [x] Funciona con teclado (focus-visible outline).

## Plan De Implementacion

- [x] `index.html`: `#inventoryFilters` con 4 `.inv-filter-chip` antes de `#inventoryList`
- [x] `js/inventory.js`: `activeFilter` + `matchesFilter()` + `wireFilterChips()` con guard `data-wired`
- [x] `styles-m3.css`: `.inv-filter-bar` y `.inv-filter-chip` con variante `.active`
