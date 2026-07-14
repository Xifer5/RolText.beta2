# SPEC-1006 Charselect en pasos (móvil) + accesibilidad del modal

## Objetivo
Reducir la fricción de creación de personaje en móvil (hoy: una sola pantalla con scroll largo — nombre + 3 clases + 3 orígenes + 4 dificultades + 3 modificadores + botón) con un flujo por pasos, y cerrar el hueco de accesibilidad del modal: `#charSelectModal` es el único modal del juego sin `role="dialog"`/`aria-modal` (todos los demás lo tienen desde el sprint a11y de SPEC-0703, pero este modal se genera dinámicamente en `charselect.js:17-20` y quedó fuera de ese pase).

## Decisiones (fijadas con el usuario)
- Flujo por pasos **solo en móvil ≤767px**; desktop conserva la pantalla única actual
- Navegación: botones **Atrás/Siguiente** + indicador de progreso ••••• (5 pasos); retroceder conserva selección
- Paso 1 (Clase) bloquea "Siguiente" sin selección — igual que hoy; Origen/Dificultad/Modificadores no bloquean (ya tienen default: exile/easy/ninguno)
- El campo de nombre vive en el paso 1 junto a las clases (no es un paso propio)

## Verificado en código
- `focusTrap.js` (MutationObserver sobre `.modal`) ya cubre `#charSelectModal` gratis para Tab-trap y foco al abrir/cerrar
- 3 grupos son `role="radio"` real (clase, origen, dificultad) → les falta navegación por flechas (ARIA APG radiogroup); `.mod-chip` es `aria-pressed` toggle (checkbox-like, multi-select) → Tab normal es el patrón correcto, NO flechas

## Reglas de implementación

### 1. `role="dialog"` + `aria-modal` + `aria-labelledby`
En `charselect.js`, al crear el modal: `role="dialog"`, `aria-modal="true"`, `aria-labelledby="charSelectTitle"` + `id="charSelectTitle"` en el `<h2>` existente.

### 2. Navegación por flechas en los 3 radiogroups
`js/a11yRadioNav.js` (nuevo, puro): `nextRadioIndex(current, key, length)` — ArrowLeft/Up → anterior (wrap), ArrowRight/Down → siguiente (wrap), otras teclas no-op. `setupRadioGroupArrowNav(container, itemSelector, onSelect)` wiring de DOM que usa la función pura. Se aplica a clase, origen, dificultad. `.mod-chip` no cambia.

### 3. Flujo por pasos (`≤767px` únicamente vía CSS)
- Contenido envuelto en 5 `<div class="cs-step" data-step="N">` (0=Clase+Nombre, 1=Origen, 2=Dificultad, 3=Modificadores, 4=Confirmar) dentro del mismo `.modal-content`
- CSS `@media (max-width:767px)`: solo el paso activo (`.cs-step.active`) es visible; en desktop todos los `.cs-step` son visibles (sin media query, cero cambio)
- `.cs-progress` (5 puntos) + `.cs-nav` (Atrás/Siguiente) con `display:none` fuera de `≤767px` vía CSS
- Paso 4 muestra resumen (clase + origen + dificultad + modificadores) y el botón `#startAdventureBtn` existente
- "Siguiente" del paso 0 hereda el `disabled` de `#startAdventureBtn`

## Criterios de aceptación
1. [x] `#charSelectModal` tiene `role="dialog"`, `aria-modal="true"`, `aria-labelledby` (test + QA)
2. [x] Flechas mueven foco+selección en los 3 radiogroups, con wrap (test unitario + QA teclado)
3. [x] ≤767px: un paso a la vez, progreso, Atrás/Siguiente, retroceder conserva selección (QA 390×844)
4. [x] ≥1024px: pantalla única sin cambios (QA 1440×900)
5. [x] Paso 1 no avanza sin clase elegida; los demás sí (QA)
6. [x] Suite completa en verde

## Testing
| Capa | Qué | Cuántos |
|---|---|---|
| Unit (`tests/a11yRadioNav.test.mjs`) | `nextRadioIndex` pura | ~5 |
| QA Playwright | flujo móvil + control desktop + a11y attrs | 2 pasadas |

## Fuera de alcance
- Flujo por pasos en tablet/desktop
- Rediseño visual de tarjetas/chips
- Auditoría de otros modales (ya cubiertos en SPEC-0703)
