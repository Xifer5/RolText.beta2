---
tags: [spec, done]
serie: "05"
estado: done
---

# SPEC-0505 Toast position + tooltips

## Objetivo

Reubicar los logros-toast al borde derecho de `#screen` (columna central) y agregar tooltips contextuales a todos los elementos interactivos clave, siguiendo las guías M3.

## Contexto

- Archivos relevantes: `styles-m3.css`, `index.html`, `js/toast.js`
- Problema anterior: `.ach-toast` tenía `position: fixed; top: 80px; right: 20px` — aparecía en la zona de la barra de navegación donde se pierde visualmente.
- M3 recomienda: notificaciones en la **parte inferior** del área de contenido, no sobre el chrome superior.
- El sistema `[data-tooltip]` ya existía en `styles-m3.css`.

## Flujo Principal

1. Se desbloquea un logro → el toast aparece en la esquina inferior del área `#screen` (entre la columna central y el panel derecho).
2. Varios toasts se apilan verticalmente (`.toast-container` es `flex-direction: column-reverse`).
3. El jugador pasa el mouse sobre cualquier botón o chip → tooltip contextual aparece.

## Criterios De Aceptacion

- [x] Toast container posicionado en `bottom: 24px` alineado con el borde derecho de `#screen`.
- [x] En desktop: `right: calc(280px + 16px)` — justo al lado izquierdo del panel derecho.
- [x] En tablet (768–1023px): `right: calc(260px + 16px)`.
- [x] En mobile (<768px): `right: 16px; bottom: 80px` (sobre la barra de nav móvil).
- [x] Animación slide-in desde la derecha sigue funcionando.
- [x] `.hiding` (clase JS) dispara la animación de salida (antes era `.fadeOut`, bug corregido).
- [x] `.simple-toast` tiene CSS con variantes info/success/error/warn.
- [x] `data-tooltip` en: tabs de nav, botones topbar, barras HP/MP/XP, chips STR/AGI/INT, celdas ATK/DEF/MAG, oro/nivel, botones rápidos, botones de combate, botones de brújula, botones de ubicación, NPC.
- [x] Tooltips cerca del borde superior usan `data-tooltip-pos="bottom"`.

## Plan De Implementacion

- [x] `styles-m3.css`: añadida clase `.toast-container` con posicionado y breakpoints responsivos.
- [x] `styles-m3.css`: `.ach-toast` cambiado a `position: relative` (sin `fixed`); corrección `.hiding`.
- [x] `styles-m3.css`: añadida clase `.simple-toast` con variantes de color.
- [x] `index.html`: `data-tooltip` y `data-tooltip-pos` en ~30 elementos interactivos.
