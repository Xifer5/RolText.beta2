---
tags: [spec, done]
serie: "05"
estado: done
---

# SPEC-0503 Bestiario M3 mobile

## Objetivo

El bestiario colapsaba en mobile porque usaba un grid fijo de 218px para el retrato. En pantallas ≤640px el contenido quedaba ilegible. Además faltaban las clases CSS base del contenedor, barra de progreso y lista.

## Contexto

- Archivos relevantes: `js/bestiary.js`, `styles-m3.css`
- Problema: `.bestiary-entry { grid-template-columns: 218px 1fr }` — en 390px el cuerpo quedaba con ~140px.
- Clases JS que no tenían CSS: `.bestiary-container`, `.bestiary-progress`, `.bestiary-bar`, `.bestiary-fill`, `.bestiary-list`.

## Criterios De Aceptacion

- [x] En mobile (≤640px): retrato ocupa 100% de ancho, 140px de alto; cuerpo apila debajo.
- [x] Barra de progreso visible y animada con token M3 primary.
- [x] Texto legible: fuente ≥11px en stat-row y meta.
- [x] En desktop: layout original de dos columnas (218px + 1fr) sin cambios.

## Plan De Implementacion

- [x] `styles-m3.css`: añadidas clases `.bestiary-container`, `.bestiary-list`, `.bestiary-progress`, `.bestiary-bar`, `.bestiary-fill`
- [x] `styles-m3.css`: `@media (max-width: 640px)` — entry 1 columna, portrait 100% × 140px, ajuste de fuentes
