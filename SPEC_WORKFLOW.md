# RolText.beta2 Spec Workflow

Este archivo sirve como memoria de trabajo para convertir ideas de gameplay, UX/UI, Material 3 y responsive en specs Markdown pequenas, implementables y faciles de retomar.

## Estado Actual

Proyecto revisado: `index.html`, `styles-m3.css`, `js/main.js`, `js/ui.js`, `js/state.js`, `js/movement.js`, `js/combat.js`, `js/charselect.js` y `README.md`.

La app ya tiene una base solida:

- Juego web estatico modular con estado central en `js/state.js`.
- Flujo principal: seleccion de personaje, exploracion, encuentros, combate, loot, progreso, misiones, tienda, forja, bestiario y logros.
- UI estilo M3 en `styles-m3.css`, con tokens de color, tema claro/oscuro, modales, barra inferior movil y motion.
- Assets locales para ubicaciones, enemigos, items, musica y efectos.

Deuda visible:

- La salida de algunas herramientas de terminal puede mostrar mojibake, pero los archivos principales fueron verificados por codepoints como UTF-8 correcto. No convertir codificacion sin comprobar bytes primero.
- Hay estilos inline en HTML y JS que dificultan mantener tokens M3 y responsive.
- En movil se ocultan paneles laterales completos, lo que reduce visibilidad de HP/MP/XP, oro, nivel, stats, mapa local y acciones contextuales.
- Varias acciones bloqueadas solo escriben al log; falta feedback contextual cerca del control afectado.
- El combate tiene turnos y habilidades, pero poca decision tactica visible en cada turno.

## Backlog Priorizado

## Specs En Curso / Implementadas

- `specs/SPEC-0001-utf8-text-cleanup.md`: verificacion de codificacion; no-op inicial porque los archivos estan en UTF-8 correcto.
- `specs/SPEC-0101-combat-decision-hints.md`: hints compactos de combate agregados; falta QA visual en navegador.
- `specs/SPEC-0102-navigation-affordance.md`: controles de direccion deshabilitan salidas inexistentes; falta QA visual.
- `specs/SPEC-0103-inventory-equipment-comparison.md`: comparacion de equipo agregada al detalle del inventario; falta QA visual.
- `specs/SPEC-0104-shop-affordance-comparison.md`: tienda con compra deshabilitada sin oro y deltas de equipo; falta QA visual.
- `specs/SPEC-0105-location-risk-indicator.md`: indicador de riesgo/nivel de zona agregado al hero y HUD movil; falta QA visual.
- `specs/SPEC-0201-mobile-hud.md`: HUD movil persistente agregado; falta QA visual en navegador.
- `specs/SPEC-0202-location-context-actions.md`: acciones contextuales de ubicacion agregadas para descanso/tienda; falta QA visual en navegador.
- `specs/SPEC-0204-mobile-sheets.md`: sheets moviles de movimientos, acciones y paneles reconectados; falta QA visual en navegador.
- `specs/SPEC-0205-empty-states.md`: estados vacios agregados para inventario y venta; falta QA visual.
- `specs/SPEC-0206-modal-escape-close.md`: cierre global con Escape para sheet y modales; falta QA visual.
- `specs/SPEC-0207-save-menu-feedback.md`: guardado sin mensaje duplicado y carga fallida mantiene menu abierto; falta QA visual.
- `specs/SPEC-0208-inventory-row-selection.md`: filas de inventario abren detalle con click/teclado; falta QA visual.
- `specs/SPEC-0301-m3-inline-style-cleanup.md`: iniciada limpieza de inline styles en navegacion movil; falta QA visual.

### P0 - Base para no romper UX

#### SPEC-0001 Codificacion UTF-8 y texto legible

Estado: verificado como no-op inicial. `index.html` contiene codepoints Unicode correctos para textos clave; el mojibake observado venia del canal de salida de terminal.

Objetivo: mantener una regla de seguridad para no convertir archivos sanos por error.

Archivos probables:

- `index.html`
- `js/*.js`
- `styles-m3.css` si hay comentarios o content textual corrupto

Criterios:

- Antes de tocar codificacion, verificar codepoints o bytes.
- No convertir archivos completos solo por mojibake visto en output de consola.
- Si el navegador muestra texto corrupto, documentar screenshot y archivo exacto antes de reparar.

#### SPEC-0002 Smoke test manual y checklist visual

Problema: no hay un flujo documentado para verificar que el juego sigue usable tras cambios.

Objetivo: definir un smoke test reproducible para desktop y movil.

Criterios:

- Abrir juego, crear personaje, moverse, entrar en combate, atacar, usar magia, abrir inventario, descansar donde aplique, abrir menu, guardar/cargar.
- Verificar en desktop aprox. 1440x900 y movil aprox. 390x844.
- Confirmar que no hay solapamientos, texto cortado ni controles inaccesibles.

### P1 - Jugabilidad

#### SPEC-0101 Turnos de combate con decisiones claras

Problema: el combate permite atacar, magia, item, huir y skills, pero el jugador no ve suficiente informacion para decidir.

Mejora:

- Mostrar prediccion compacta: dano estimado, coste de MP, probabilidad de critico/evasion cuando aplique.
- Mostrar cooldowns o disponibilidad si se agregan.
- Diferenciar roles de clase: guerrero aguanta/rompe defensa, mago controla estados, picaro evade/remata.

Criterios:

- Cada boton de combate comunica coste y consecuencia principal.
- Skills inutilizables explican por que: falta MP, nivel, estado, cooldown.
- El log no es la unica fuente de feedback.

#### SPEC-0102 Ritmo de exploracion y encuentros

Problema: movimiento, jefes, eventos y encuentros aleatorios existen, pero el jugador puede no entender riesgo, progreso o direccion recomendada.

Mejora:

- Mostrar riesgo de zona por bioma/ubicacion.
- Mostrar pistas de progreso de mision cerca del hero de ubicacion.
- Hacer visible cuando una zona esta bloqueada y que item/NPC la desbloquea.

Criterios:

- Antes de moverse, el jugador entiende si la salida es segura, peligrosa, bloqueada o recomendada.
- Las zonas bloqueadas aparecen como affordance visual, no solo mensaje posterior.
- Los eventos de viaje se sienten como elecciones con consecuencias visibles.

#### SPEC-0103 Economia, tienda y loot con comparacion

Problema: inventario, shop y equipamiento existen, pero la decision de comprar/equipar puede requerir memoria del jugador.

Mejora:

- Comparar item seleccionado contra equipo actual.
- Indicar si un objeto es mejora, lateral o peor.
- Filtrar por consumibles, equipo, materiales y vendibles.

Criterios:

- El jugador puede comprar/equipar sin abrir varias pantallas para comparar.
- Comprar sin oro suficiente muestra feedback inline.
- Vender objetos importantes pide confirmacion o previene venta accidental.

### P1 - UX/UI

#### SPEC-0201 HUD movil persistente

Problema: en `@media (max-width: 960px)` se ocultan `#left-panel` y `#right-panel`, perdiendo estado critico.

Mejora:

- Crear HUD movil compacto con HP, MP, XP, nivel, oro y estado de combate.
- Mantener bottom nav para acciones primarias.
- Llevar stats/mapa/inventario a sheets con tabs.

Criterios:

- En movil siempre se ve HP y estado de combate.
- Los botones primarios tienen areas tactiles estables de minimo 44px.
- El contenido principal no queda tapado por la barra inferior.

#### SPEC-0202 Acciones contextuales por ubicacion

Problema: acciones como tienda, descanso o NPC aparecen en lugares separados y a veces solo fallan con mensaje de sistema.

Mejora:

- En el hero de ubicacion, mostrar acciones disponibles: hablar, descansar, tienda, forja, entrar/salir.
- Deshabilitar acciones no disponibles con razon accesible.

Criterios:

- El jugador ve que puede hacer en la ubicacion actual sin buscar en sidebar.
- Los botones deshabilitados tienen `aria-disabled`/`disabled` y razon visible o tooltip.
- No se duplican acciones sin necesidad entre hero, sidebar y sheet.

#### SPEC-0203 Inventario y paneles como superficies de trabajo

Problema: modales grandes mezclan listas, detalle y equipamiento; en pantallas pequenas puede ser pesado.

Mejora:

- Usar layout maestro-detalle en desktop.
- Usar tabs/sheet de detalle en movil.
- Acciones de item cerca del detalle, no solo al final.

Criterios:

- Lista, detalle y equipo no se solapan.
- Seleccionar item actualiza detalle sin saltos de layout.
- Hay estados vacio, sin resultados y accion no disponible.

### P1 - Material Design 3

#### SPEC-0301 Consolidar tokens y quitar inline styles

Problema: hay muchos estilos inline en `index.html` y `js/charselect.js`, lo que rompe consistencia M3.

Mejora:

- Mover estilos inline a clases.
- Usar tokens existentes: `--md-primary`, `--md-surface-*`, `--md-outline-*`, spacing y motion.
- Revisar radius: usar 4-8px en superficies densas, radios grandes solo cuando aporten jerarquia.

Criterios:

- Componentes no dependen de estilos inline para layout principal.
- Estados hover/focus/disabled son consistentes.
- El tema claro/oscuro sigue legible.

#### SPEC-0302 Componentes M3 para controles repetidos

Problema: botones, chips, tabs, sheets, modales y listas tienen patrones parecidos pero no siempre comparten contrato.

Mejora:

- Definir clases base: `.m3-button`, `.m3-icon-button`, `.m3-chip`, `.m3-list-item`, `.m3-sheet`, `.m3-tabs`.
- Mantener variantes: filled, tonal, outlined, text, danger.

Criterios:

- Nuevas pantallas usan clases base.
- No se anidan cards dentro de cards.
- Focus visible y reduced motion estan cubiertos.

### P2 - Responsive

#### SPEC-0401 Breakpoints por flujo, no solo por ancho

Problema: el breakpoint principal `960px` cambia demasiado de golpe.

Mejora:

- Desktop: 3 columnas.
- Tablet: centro + panel contextual colapsable.
- Mobile: pantalla principal + HUD + bottom nav + sheets.

Criterios:

- 390px, 768px, 1024px y 1440px tienen layout coherente.
- No hay scroll horizontal.
- Texto de botones largos se ajusta sin desbordar.

#### SPEC-0402 Modales adaptativos

Problema: inventario, tienda, quest log y seleccion de clase pueden necesitar patrones distintos en movil.

Mejora:

- Desktop: dialog centrado con max width.
- Mobile: bottom sheet o full-screen dialog segun complejidad.

Criterios:

- El modal no supera viewport.
- Header y cierre permanecen accesibles.
- Listas internas scrollean sin mover toda la pagina accidentalmente.

## Como Trabajar Con Specs Markdown

Crear un archivo por mejora cuando se vaya a implementar:

```text
specs/SPEC-0101-combat-decisions.md
specs/SPEC-0201-mobile-hud.md
specs/SPEC-0301-m3-token-cleanup.md
```

Cada spec debe ser pequeno. Si toca mas de 3 archivos principales o cambia gameplay y UI al mismo tiempo, partirlo.

## Plantilla De Spec

Copiar esto en cada `specs/SPEC-xxxx-nombre.md`.

````markdown
# SPEC-XXXX Titulo

## Objetivo

Que problema resuelve y para quien.

## Contexto

- Archivos relevantes:
- Estado actual:
- Riesgo principal:

## Flujo Principal

1. Punto de entrada.
2. Accion del jugador.
3. Feedback inmediato.
4. Resultado persistido o cambio de estado.
5. Recuperacion si algo falla.

## Reglas De Gameplay

- Regla 1:
- Regla 2:
- Edge cases:

## UX/UI

- Superficies:
- Estados: default, hover, focus, disabled, empty, error, success.
- Copy visible:
- Accesibilidad:

## Material 3

- Tokens:
- Componentes:
- Motion:
- Tema claro/oscuro:

## Responsive

- Mobile 390x844:
- Tablet 768x1024:
- Desktop 1440x900:

## Datos Y Contratos

- Estado leido:
- Estado escrito:
- Eventos usados:
- Persistencia:

## Criterios De Aceptacion

- [ ] El jugador puede...
- [ ] La UI muestra...
- [ ] El sistema previene...
- [ ] En movil...
- [ ] Con teclado...

## Gherkin

```gherkin
Feature: Nombre de la mejora
  Scenario: Camino principal
    Given ...
    When ...
    Then ...
```

## Plan De Implementacion

- [ ] Paso 1
- [ ] Paso 2
- [ ] Paso 3

## Verificacion

- [ ] Smoke manual desktop
- [ ] Smoke manual movil
- [ ] Sin errores en consola
- [ ] Sin texto solapado/cortado
- [ ] No se rompio guardado/carga si aplica
````

## Reglas Para Implementar

- Leer la spec antes de tocar codigo.
- Mantener cambios pequenos y ligados a una spec.
- Si aparece un bug no relacionado, anotarlo en este archivo o crear otra spec; no mezclar refactors.
- Preferir funciones/modulos existentes antes de crear abstracciones nuevas.
- Para gameplay, cambiar primero reglas puras si existen; despues conectar UI.
- Para UI, usar tokens de `styles-m3.css` y mover inline styles a clases.
- Para responsive, verificar como minimo mobile y desktop.
- Para texto, asumir UTF-8 correcto salvo evidencia en navegador o codepoints.

## Smoke Test Manual Base

1. Abrir `index.html` desde servidor local.
2. Crear personaje con cada clase al menos una vez cuando la spec toque combate o stats.
3. Moverse en las cuatro direcciones disponibles desde town y verificar mensajes.
4. Entrar en combate: atacar, usar magia, abrir item, intentar huir.
5. Abrir inventario, stats, tienda donde aplique, quest log, paneles superiores y menu principal.
6. Probar tema claro/oscuro.
7. Repetir en viewport movil.

## Memoria Rapida De Archivos

- `index.html`: estructura principal, modales, nav desktop/movil.
- `styles-m3.css`: tokens M3, layouts, responsive, modales, componentes.
- `js/main.js`: bootstrap.
- `js/state.js`: estado inicial y reset.
- `js/ui.js`: render principal, HUD, modales, acciones, imagenes.
- `js/movement.js`: movimiento, gates, encuentros, eventos de viaje.
- `js/combat.js`: turnos, dano, estados, loot, level up.
- `js/charselect.js`: seleccion de personaje.
- `js/inventory.js`, `js/shop.js`, `js/crafting.js`: economia y objetos.
- `js/panels.js`: panel modal superior.
- `js/i18n.js`: localizacion.
