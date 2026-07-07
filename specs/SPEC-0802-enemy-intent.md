# SPEC-0802 Enemy intent — behaviors activos + telegraph

## Objetivo

El jugador ve la próxima acción del enemigo en un chip M3 y decide tácticamente (atacar, defenderse, curarse, huir). De paso se activa el sistema de behaviors que SPEC-0604 dejó asignado pero muerto: `enemyTurn()` ignoraba `behavior` y solo tiraba `Math.random() < 0.3` para magia (combat.js:377).

## Contexto

- Archivos relevantes: `js/enemyAI.js` (nuevo), `js/combat.js`, `js/ui.js`, `js/damageTypes.js` (solo lectura), `js/i18n.js`, `styles-m3.css`
- Estado actual: `behavior` asignado a 58 enemigos (20 aggressive, 12 mage, 9 status, 5 defensive, 5 boss, 4 berserker, 3 regenerate) sin consumidor; IA real = físico/magia 70/30
- Riesgo principal: balance — acciones nuevas (golpe fuerte, defensa, regeneración, furia) cambian la dificultad efectiva; mitigado con multiplicadores conservadores y probabilidades acotadas
- Decisiones fijadas con el usuario (2026-07-07): D1 = behaviors + intent en una spec; D2 = exacto salvo jefes (❓ en ~35% de turnos); D3 = chip en panel enemigo

## Flujo Principal

1. `startCombat` pre-decide `enemy.nextAction` (y si el jefe la oculta) antes del primer `updateUI`.
2. El chip `#enemy-intent` muestra icono + etiqueta de la acción que viene (o ❓).
3. El jugador actúa con esa información.
4. `enemyTurn` EJECUTA `enemy.nextAction`, y al terminar pre-decide la siguiente → el chip siempre anuncia futuro, nunca pasado.
5. Si el enemigo muere o el combate termina, el chip desaparece con el panel.

## Reglas De Gameplay

Selección por behavior (`decideNextAction(enemy, rng)` en `js/enemyAI.js`, RNG inyectable):

| Behavior | Acciones |
|----------|----------|
| aggressive | 60% ⚔️ ataque, 40% 💥 golpe fuerte (1.5× ATK) |
| defensive | 60% ⚔️, 40% 🛡️ defender (recibe 50% del daño del jugador hasta su próximo turno; nunca 2 seguidas) |
| berserker | ⚔️; al caer <50% HP → 😡 enfurece una vez (+30% ATK permanente); enfurecido: 50% 💥 |
| regenerate | ⚔️; con <60% HP → 50% 💚 regenera 12% maxHp (nunca 2 seguidas) |
| mage | 70% ✨ magia, 30% ⚔️ (sin magicAttack → siempre ⚔️) |
| status | 50% ☠️ ataque con efecto de estado garantizado (si lo tiene), 50% ⚔️ |
| boss | 40% ⚔️, 25% 💥, 20% ✨ (💥 si no tiene magia), 15% 🛡️ |
| standard (sin behavior) | comportamiento previo: 70% ⚔️, 30% ✨ si tiene |

- Defender: multiplicador ×0.5 (mín. 1) aplicado en `applyDamageToEnemy` con mensaje de bloqueo; los ticks de veneno/quemadura NO se reducen (ocurren tras limpiar la guardia al inicio de su turno).
- Enfurecer: una sola vez por combate; mensaje + shake.
- Edge cases: enemigo sin entrada en ENEMY_COMBAT_DATA → standard; jefe sin magicAttack → banda de magia se convierte en 💥; huida/victoria a mitad → sin efectos residuales (todo vive en currentEnemy).

## UX/UI

- Superficie: chip `.enemy-intent-chip` en la fila de stats del panel enemigo (junto a ⚔/🛡 badges).
- Estados: visible en combate con acción; ❓ cuando el jefe oculta; desaparece fuera de combate.
- Copy visible: etiquetas cortas i18n (Ataque, Golpe fuerte, Magia, Defensa, Curarse, Estado, Furia, ???).
- Accesibilidad: `aria-label` "Próximo movimiento: X"; el panel ya es `aria-live="assertive"`.

## Material 3

- Tokens: `--md-primary` (borde/acento), `--md-surface-c-highest` (fondo), radius 8px, font-ui 11px.
- Tema claro/oscuro vía tokens.
- Regla crítica intacta: no toca `#enemy-portrait` (style.display).

## Responsive

- Mobile 390x844: el chip cabe en la fila de stats sin romper el layout (wrap permitido).
- Desktop 1440x900: chip alineado con los badges de ATK/DEF.

## Datos Y Contratos

- Estado leído: `ENEMY_COMBAT_DATA[id].behavior`, `enemy.hp/maxHp/magicAttack/isBoss`, `ENEMY_STATUS_EFFECTS[id]`.
- Estado escrito: `enemy.nextAction`, `enemy.intentHidden`, `enemy.lastAction`, `enemy.enraged`, `enemy.isDefending` — todo en `gameState.currentEnemy`, NO persiste en save (el combate no se guarda a mitad).
- ~14 claves i18n nuevas EN/ES.

## Criterios De Aceptacion

- [x] Cada behavior produce sus acciones con las probabilidades de la tabla (tests deterministas con RNG inyectado)
- [x] El chip muestra la acción que efectivamente se ejecuta en el siguiente turno enemigo (verificado en vivo)
- [x] Jefes: ❓ en ~35% de turnos; enemigos normales nunca ❓
- [x] Defender reduce el daño del jugador 50% exactamente una ronda; enfurecer solo una vez por combate
- [x] Móvil 390x844: el chip no rompe la fila del nombre
- [x] `node --test` pasa (suite + enemyAI); 0 errores de consola; EN/ES completos

## Gherkin

```gherkin
Feature: Enemy intent
  Scenario: Telegraph exacto
    Given un combate contra un enemigo con behavior "defensive"
    When el chip muestra "🛡️ Defensa"
    Then en el siguiente turno enemigo el enemigo se pone en guardia
    And el daño del jugador se reduce a la mitad hasta el próximo turno enemigo

  Scenario: Jefe oculta intención
    Given un combate contra un jefe
    When el jefe decide ocultar su próxima acción
    Then el chip muestra "❓ ???"
    And la acción ejecutada sigue siendo la pre-decidida

  Scenario: Berserker
    Given un berserker por debajo del 50% de HP que no se ha enfurecido
    Then su próxima acción es 😡 Furia (+30% ATK, una sola vez)
```

## Plan De Implementacion

- [x] `js/enemyAI.js` — `decideNextAction`, `isIntentHidden`, `ACTION_META` (puro, RNG inyectable)
- [x] `combat.js` — `rollEnemyIntent()` en startCombat y fin de enemyTurn; ejecución de acciones (defend/regen/enrage/power/status); bloqueo en `applyDamageToEnemy`
- [x] `ui.js` — chip en la fila de stats del panel enemigo
- [x] CSS `.enemy-intent-chip` en styles-m3.css
- [x] ~14 claves i18n EN/ES
- [x] `tests/enemyAI.test.mjs`

## Verificacion

- [x] Smoke manual desktop
- [x] Smoke manual movil
- [x] Sin errores en consola
- [x] Sin texto solapado/cortado
- [x] No se rompio guardado/carga (no toca el save)
