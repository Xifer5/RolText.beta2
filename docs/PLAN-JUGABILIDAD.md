# Plan de Trabajo: Mejorar Jugabilidad y Saldar Deudas

## Objetivo
Crear una ruta clara para mejorar la experiencia de juego de RolText, abordando tanto mejoras de gameplay como las deudas técnicas y de UX/UI identificadas en el proyecto.

## Fuentes clave
- `spec/SPC006.md` — roadmap de gameplay, rejugabilidad, UX y arquitectura.
- `spec/SPEC-004-UX-UI-Responsive.md` — deudas técnicas de UI, accesibilidad e i18n.
- `M3-AUDIT.md` / `DESIGN-GUIDELINES.md` — lineamientos de Material Design 3.

## Prioridades inmediatas
1. Deuda técnica visible.
2. Mejora de feedback de combate.
3. Claridad de información y navegación.
4. Experiencia móvil y accesibilidad.

---

## Fase 1: Resolver deudas técnicas urgentes

### 1.1 Internacionalización y textos
- Localizar textos hardcodeados en `journal.js`, `bestiary.js`, `crafting.js`.
- Traducir `ENEMY_LORE` y lore de enemigos en `bestiary.js`.
- Validar que `i18n.js` cubra todos los elementos actuales de la UI.

### 1.2 UX/Responsive
- Revisar y aplicar reglas de `reglas/reglas_y_contexto.md` sobre touch targets (`>=48px`).
- Corregir botones pequeños y secciones con interacción difícil en móvil.
- Asegurar layout adaptativo en `<480px` y en horizontal.

### 1.3 Accesibilidad
- Añadir ARIA labels faltantes en controles, botones y modales.
- Asegurar indicadores de foco visibles para navegación por teclado.
- Revisar contraste de texto y botones según `styles-m3.css`.

### 1.4 Código y arquitectura
- Identificar duplicados en `script.js` y módulos de evento.
- Limpiar funciones de UI duplicadas y centralizar estado en `state.js`.
- Registrar deuda técnica y migración futura a módulos más claros.

---

## Fase 2: Mejoras de jugabilidad de alto impacto

### 2.1 Combate
- Implementar un timeline simple de turnos (`1.1.1`) para ver orden de acciones.
- Añadir previsualización de daño en `Atacar` y `Magia` (`1.1.2`).
- Agregar acción de guardia/defensa activa (`1.1.10`).
- Introducir resistencias/weakness entre elementos (`1.1.7`).
- Añadir morale/emergencia de enemigo bajo vida (`1.1.5`).

### 2.2 Progresión y build
- Mostrar stats derivados en tiempo real (`1.2.4`).
- Añadir respec de stats con ítem/costo (`1.2.3`).
- Crear build presets simples para guardar distribuciones.

### 2.3 Inventario y equipamiento
- Mejorar categorización en inventario: Armas, Armaduras, Consumibles, Materiales, Quest (`1.3.1`).
- Añadir comparación de equipo al equipar (`1.3.3`).
- Implementar orden automático / loot vacuum para agilizar gestión (`1.3.8`, `1.3.9`).

---

## Fase 3: Feedback, claridad y engagement

### 3.1 Feedback visual
- Activar números de daño flotantes y animaciones de hit (`5.2.1`, `5.2.3`).
- Añadir animaciones suaves de XP y efectos al subir de nivel (`3.1.3`, `5.2.7`).
- Mostrar telegráficos de ataque enemigo antes del turno (`5.2.5`).

### 3.2 Información útil
- Implementar tooltips en stats, items y enemigos (`5.3.1`).
- Añadir trackeo de misión actual visible (`5.3.4`).
- Agregar inspección de enemigo con stats/lore antes de combatir (`5.3.3`).

### 3.3 Onboarding
- Crear tutorial interactivo de inicio (`5.1.1`).
- Añadir tips contextuales en acciones nuevas (`5.1.2`).
- Generar un glossary/help rápido dentro del juego (`5.1.3`).

---

## Fase 4: Salvar deuda de contenido y experiencia

### 4.1 Mundo y contenido
- Revisar la generación procedural del mundo y confirmar la conexión de zonas.
- Ajustar biomas y encuentros para evitar curvas de dificultad abruptas.
- Establecer un flujo más claro en misiones principales y secundarias.

### 4.2 Narrativa y quests
- Revisar quests para evitar bloqueos de progreso.
- Asegurar que los NPCs tengan información útil sobre el siguiente objetivo.
- Añadir señales de dirección y objetivos de quest en el mapa/overlay.

### 4.3 Sistemas extra (deuda de largo plazo)
- Priorizar `Enchanting` como mecánica de equipo si el objetivo es retención.
- Dejar propuestas de `Fast travel`, `Quest tracker`, y `Loot vacuum` para siguientes sprints.

---

## Fase 5: M3 / UI polish y accesibilidad final

### 5.1 UI consistente
- Aplicar el sistema de Material Design 3 a botones, tarjetas y modales.
- Alinear `styles-m3.css` con los tokens y valores definidos en `DESIGN-GUIDELINES.md`.
- Mejorar las superficies de `sidebar-block`, topbar y controles de combate.

### 5.2 Mobile first
- Ajustar la navegación inferior y el modo móvil según `SPEC-004`.
- Garantizar que controles del combate y acciones rápidas sean cómodos con el pulgar.
- Verificar `mobile-sheet`, `mob-btn` y `mob-nav` en pantallas pequeñas.

### 5.3 Accesibilidad
- Implementar `screen reader optimization`, `focus indicators` y `colorblind mode` en fases posteriores.
- Agregar una opción de `font size scaling` si se desea.

---

## Modo de trabajo sugerido
1. Sprint corto (1-2 semanas): deuda técnica + mejora de combate visible.
2. Sprint medio (2-4 semanas): experiencia de inventario, onboarding y feedback.
3. Sprint largo (1-2 meses): mejoras de contenido, biomas/quests y refactor ligero.

## Métricas de éxito
- Reducción de textos hardcodeados i18n.
- Menor fricción de gestión de inventario.
- Más claridad en el combate y en objetivos de misión.
- Mejor experiencia móvil y menos errores de interacción.

---

## Recomendación inmediata
Empieza por:
1. Resolver i18n hardcode en `journal.js`, `bestiary.js` y `crafting.js`.
2. Añadir `quest tracker` y `damage numbers` para mejorar retroalimentación.
3. Mejorar botones móviles y touch targets en `styles-m3.css`.
4. Actualizar la documentación de deuda en `M3-AUDIT.md` y `UI-TASKS.md`.
