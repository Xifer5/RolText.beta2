---
tags: [spec, pendiente]
serie: "01"
estado: pendiente
---

# SPEC-0101 Combat Decision Hints

## Objetivo

Hacer que el combate comunique consecuencias antes de actuar: dano estimado, coste de MP, disponibilidad de items y probabilidad de huida.

## Contexto

- Archivos relevantes: `js/ui.js`, `styles-m3.css`, `js/combat.js`, `js/stats.js`, `js/classes.js`.
- Estado actual: el jugador ve botones de accion, pero debe inferir coste/riesgo desde el log o memoria.
- Riesgo principal: mostrar una prediccion demasiado exacta que contradiga la variacion real de combate.

## Flujo Principal

1. El jugador entra en combate.
2. Los botones muestran un hint compacto.
3. El jugador compara ataque, magia, item y huida.
4. Al cambiar HP/MP/enemigo, los hints se actualizan con `updateUI`.

## Reglas De Gameplay

- No cambia formulas de dano ni balance.
- Las cifras son estimaciones conservadoras.
- Magia respeta el coste actual: mago nivel 10+ cuesta menos.
- Huida usa la misma probabilidad base aproximada que `tryFlee`.

## UX/UI

- Superficies: botones de combate desktop.
- Estados: sin combate, combate, falta de MP.
- Copy visible: labels cortos como `~12 dmg`, `10 MP`, `65%`.
- Accesibilidad: `title`/`aria-label` incluyen el hint.

## Material 3

- Hints como label secundario dentro del boton.
- Usa tokens existentes de texto secundario y surface.
- No agrega motion nueva.

## Responsive

- Mobile 390x844: no debe romper la barra de combate movil.
- Tablet 768x1024: los hints desktop quedan ocultos si el panel derecho se oculta.
- Desktop 1440x900: hints visibles en el panel de combate.

## Datos Y Contratos

- Estado leido: `gameState.player`, `gameState.equipment`, `gameState.currentEnemy`, `gameState.inventory`.
- Estado escrito: ninguno.
- Eventos usados: ninguno nuevo.
- Persistencia: no afecta guardado.

## Criterios De Aceptacion

- [x] El jugador ve dano estimado de ataque.
- [x] El jugador ve dano/coste estimado de magia.
- [x] El jugador ve si tiene consumibles de curacion/mana.
- [x] El jugador ve probabilidad aproximada de huida.
- [ ] En navegador, los hints no desbordan los botones.

## Gherkin

```gherkin
Feature: Decision de combate informada
  Scenario: Evaluar acciones de combate
    Given el jugador esta en combate
    When mira el panel de combate
    Then ve informacion compacta de dano, coste, items y huida
```

## Plan De Implementacion

- [x] Crear spec.
- [x] Agregar helper de hints a `ui.js`.
- [x] Estilizar `.combat-hint`.
- [x] Actualizar desde `updateUI`.
- [ ] Verificar visualmente en navegador.

## Verificacion

- [ ] Smoke manual desktop
- [ ] Smoke manual movil
- [x] JS syntax check
- [ ] Sin texto solapado/cortado
- [ ] No se rompio guardado/carga si aplica
