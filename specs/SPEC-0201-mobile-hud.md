# SPEC-0201 Mobile Persistent HUD

## Objetivo

Mantener informacion critica del jugador visible en pantallas pequenas aunque los paneles laterales se oculten.

## Contexto

- Archivos relevantes: `index.html`, `styles-m3.css`, `js/ui.js`.
- Estado actual: en `@media (max-width: 960px)` se ocultan `#left-panel` y `#right-panel`, por lo que desaparecen HP, MP, XP, oro, nivel y estado rapido.
- Riesgo principal: tapar el contenido central o duplicar demasiada informacion.

## Flujo Principal

1. El jugador abre el juego en movil.
2. El HUD compacto aparece bajo el topbar.
3. El jugador ve ubicacion, estado, nivel, oro, HP, MP y XP.
4. Al moverse, combatir o subir de nivel, el HUD se actualiza junto con la UI principal.

## Reglas De Gameplay

- No cambia combate, movimiento, economia ni progresion.
- Solo refleja datos existentes de `gameState`.

## UX/UI

- Superficies: HUD movil persistente, barras compactas, chips de nivel/oro/estado.
- Estados: exploracion, combate, game over.
- Copy visible: labels cortos para evitar desbordes.
- Accesibilidad: region con `aria-label`; los valores se exponen como texto.

## Material 3

- Tokens: `--md-surface-c`, `--md-surface-c-high`, `--md-outline-variant`, `--md-primary`, `--c-hp`, `--c-mp`, `--c-xp`.
- Componentes: chips compactos y barras de progreso.
- Motion: no se agrega animacion nueva.
- Tema claro/oscuro: usa tokens existentes.

## Responsive

- Mobile 390x844: HUD visible, dos filas, sin scroll horizontal.
- Tablet 768x1024: HUD visible mientras los sidebars esten ocultos.
- Desktop 1440x900: HUD oculto; se usan paneles laterales.

## Datos Y Contratos

- Estado leido: `gameState.player`, `gameState.currentLocationId`, `gameState.isInCombat`, `gameState.isGameOver`.
- Estado escrito: ninguno.
- Eventos usados: ninguno nuevo; se actualiza desde `updateUI`.
- Persistencia: no afecta `localStorage`.

## Criterios De Aceptacion

- [x] El jugador puede ver HP/MP/XP en movil sin abrir menus.
- [x] La UI muestra nivel, oro, ubicacion y estado actual.
- [x] El sistema no cambia reglas de juego.
- [ ] En movil no hay solapamiento con bottom nav.
- [ ] Con teclado, los controles existentes siguen accesibles.

## Gherkin

```gherkin
Feature: HUD movil persistente
  Scenario: Ver estado del personaje en movil
    Given el jugador esta en una pantalla menor a 960px
    When la UI se renderiza
    Then ve HP, MP, XP, nivel, oro y ubicacion
    And no necesita abrir un panel lateral
```

## Plan De Implementacion

- [x] Crear spec.
- [x] Agregar markup del HUD movil.
- [x] Agregar estilos responsive M3.
- [x] Conectar valores desde `updateUI`.
- [ ] Verificar en navegador movil y desktop.

## Verificacion

- [ ] Smoke manual desktop
- [ ] Smoke manual movil
- [ ] Sin errores en consola
- [ ] Sin texto solapado/cortado
- [ ] No se rompio guardado/carga si aplica
