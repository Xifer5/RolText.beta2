---
tags: [spec, implementada]
serie: "13"
estado: implementada (pendiente QA manual)
padre: SPEC-1301
---

# SPEC-1302 — Acción "Esquivar" (botón) + esquiva combinada

## Contexto

SPEC-1301 propone un combate más táctico para Aventura y Difícil. La primera pieza es una respuesta activa al ataque enemigo: **Esquivar**. Hoy la esquiva solo existe como pasiva; no hay botón, no hay tope y el jugador no puede "apostar" por ella.

Quién lo nota: el jugador en Aventura/Difícil, que hoy solo elige entre Atacar y Defender frente a un ataque telegrafiado. Por qué ahora: es la base sobre la que se apoyan las técnicas por arma y las ramas (SPEC-1301), y es la menos arriesgada de implementar.

## Estado actual verificado (2026-10-09)

| Pieza | Dónde | Hecho |
|---|---|---|
| Esquiva pasiva | `js/combat.js` `enemyTurn()` ~línea 478 | `evasionChance = AGI*0.01 + 0.10 (pícaro) + 0.25 (pícaro nv≥5) + evasionBonus (espec.) + mistBonus (Capa de Niebla)`. **Sin tope.** Se tira DESPUÉS de las acciones que no atacan (defend/regen/enrage/jefes), así que mecánicas de jefe ya no son esquivables. |
| Contraataque Duelista al esquivar | `combat.js` ~línea 485 | 25% de contraatacar al esquivar. Se conserva. |
| Defender | `playerCombatActions.js:61` | Buff `defend_stance` = 2 (tickBuffs lo reduce a 1 antes de `enemyTurn`); -50% daño y 30% de contraataque. Patrón a imitar. |
| Botones contextuales | `index.html:268-269`, `ui.js:555-561` | `breakGuardBtn`/`interruptBtn` usan clase `hidden` + `disabled`. Móvil: `mob-*Btn` (`ui.js:524-535`, `index.html:336-339`). |
| Teclas de combate | `js/keyboard.js:19-27` | 1,2,4,5,6,7,8 en uso; 3 = Ítem; **9 libre**. |
| Dificultad | `state.js:57` `gameState.difficulty` ∈ easy/adventure/hard/impossible | — |
| Intención enemiga | `enemyAI.js`; `ui.js:423-435` chip + consejo | Acciones: `attack`, `power_attack`, `magic`, `status`, `defend`, `regen`, `enrage` + jefes. |

## Decisiones tomadas (con el usuario, 2026-10-09)

1. **Convive** la pasiva actual con el botón; se **suman** y el resultado depende de la suerte (una sola tirada).
2. Con botón: `chance = clamp(pasiva + 0.35, 0.10, 0.85)`. Sin botón (Aventura/Difícil): `min(pasiva, 0.85)`.
3. **Fallo:** recibes el golpe completo (sin la reducción de Defender) y perdiste tu turno de ataque. Sin castigo extra.
4. **Éxito con botón:** no recibes daño y el enemigo queda **expuesto**: tu siguiente Atacar o Magia hace +25% de daño. (La esquiva pasiva exitosa NO expone: solo se premia la decisión deliberada.)
5. **Magia enemiga:** la probabilidad se multiplica ×0.5. Mecánicas de jefe (devorar, congelar magia, sobrecarga) y acciones que no atacan **no** son esquivables (ya lo resuelve el flujo actual de `enemyTurn`; no se toca).
6. El chip de intención muestra 🌀 + texto "Esquivable" cuando `nextAction` ∈ {attack, power_attack, magic}; nunca si la intención está oculta (jefe ❓) ni en Imposible (donde no hay consejo táctico).
7. **Solo Aventura, Difícil e Imposible.** En Fácil: botón oculto, pasiva exactamente como hoy (sin tope, sin ×0.5 en magia).
8. Botón oculto por defecto; tecla **9**; en móvil sigue el patrón `mob-*Btn`.

## Propuesta

### Módulo puro nuevo: `js/dodge.js`

```js
export const DODGE_BUTTON_BONUS = 0.35;
export const DODGE_MIN = 0.10;
export const DODGE_MAX = 0.85;
export const MAGIC_DODGE_MULT = 0.5;
export const EXPOSED_DAMAGE_MULT = 1.25;
export const DODGEABLE_ACTIONS = new Set(["attack", "power_attack", "magic"]);

// tactical = dificultad adventure|hard|impossible
export function isTacticalDifficulty(difficulty) { return difficulty !== "easy"; }

// Devuelve la probabilidad final [0..1]. No consume RNG.
export function computeDodgeChance({ passive, buttonActive, isMagic, tactical }) { ... }
//  !tactical            -> passive                      (comportamiento actual, intacto)
//  tactical, sin botón  -> min(passive, DODGE_MAX)
//  tactical, con botón  -> clamp(passive + DODGE_BUTTON_BONUS, DODGE_MIN, DODGE_MAX)
//  isMagic (tactical)   -> resultado * MAGIC_DODGE_MULT   (se aplica DESPUÉS del clamp)
```

Nota: el ×0.5 de magia se aplica después del clamp, por lo que el mínimo efectivo en magia con botón es 5%. Es intencional.

### Acción del jugador (`js/playerCombatActions.js`)

`playerDodge()`: gate `isTacticalDifficulty(gameState.difficulty)`; ignora si no hay combate. Pone `activeBuffs.dodge_stance = 2` (mismo patrón que `defend_stance`), mensaje con `pickVariant`-style fijo, `tickBuffs()`, `updateUI()`, `delay(500)`, `enemyTurn()`. No ataca.

### Resolución (`js/combat.js`, `enemyTurn`)

En el bloque de evasión actual (~línea 478): leer `wasDodging = activeBuffs.dodge_stance > 0` ANTES de decrementarlo (mismo patrón que `wasDefending`, líneas 444-449), calcular `passive` con la fórmula actual, `chance = computeDodgeChance(...)`, tirar una vez. Si `wasDodging` y éxito: mensaje `dodgeSuccess`, `enemy.exposed = true`. Si `wasDodging` y fallo: mensaje `dodgeFail`. La rama de éxito reutiliza lo existente (contraataque Duelista, `rollEnemyIntent`, `updateUI`).

Defender y Esquivar son excluyentes en el mismo turno: al elegir uno se limpia el stance del otro.

### Expuesto (`playerAttack` / `playerMagic`)

Si `enemy.exposed`: multiplicar el daño por `EXPOSED_DAMAGE_MULT`, añadir marca al log, `enemy.exposed = false`. Si el jugador hace cualquier otra acción (Defender, Esquivar, objeto, habilidad), `exposed` se limpia al terminar el turno del enemigo. `useSkill` no consume ni aprovecha `exposed` en esta spec.

### UI

- `index.html`: `#dodgeBtn` (`combat-btn dodge hidden`, 🌀, `aria-keyshortcuts="9"`, `<kbd class="key-hint">9</kbd>`, `data-tooltip`) y `#mob-dodgeBtn`. Tooltip: "Apuesta a evitar el próximo golpe (probabilidad según AGI y clase). Si lo logras, tu siguiente ataque hace +25%."
- `ui.js`: añadir `"dodgeBtn"` a la lista de la línea ~120; `toggleDodgeButton` análogo a `breakGuardBtn` (visible solo si `isInCombat` y `isTacticalDifficulty`); evento `pixel:dodge` para `mob-dodgeBtn` (líneas ~204).
- `ui.js` chip de intención: añadir 🌀 + `t('intentDodgeable')` cuando aplique (regla decisión 6).
- `keyboard.js`: `"9": "pixel:dodge"`.
- `combat.js` `setupCombat`: `window.addEventListener("pixel:dodge", () => handleAction(playerDodge))`.
- `styles-m3.css`: `.combat-btn.dodge` y `.mob-dodge` con tokens `--c-*` existentes; estado de chip "expuesto" en el panel enemigo.
- i18n en/es: `combatDodge`, `combatDodgeAria`, `dodgeStanceMsg`, `dodgeSuccess`, `dodgeFail`, `exposedBonusTag`, `intentDodgeable`, tooltip.

## Criterios de aceptación

1. `computeDodgeChance({passive:0.20, buttonActive:true, isMagic:false, tactical:true})` = 0.55.
2. Con `passive:0.70` y botón → 0.85 (tope). Con `passive:0` y botón → 0.35. El mínimo 0.10 se respeta con `passive:-0.5`.
3. Sin botón, tactical, `passive:0.95` → 0.85. En `tactical:false` devuelve `passive` sin cambios (0.95 → 0.95).
4. `isMagic:true` y tactical → resultado × 0.5 (botón, passive 0.20 → 0.275).
5. En Fácil `#dodgeBtn` y `#mob-dodgeBtn` tienen clase `hidden` y `disabled`, y la tecla 9 no hace nada.
6. En Aventura/Difícil/Imposible con combate activo el botón es visible; la tecla 9 dispara `pixel:dodge`.
7. Esquivar exitoso: 0 daño al jugador, `enemy.exposed === true`; el siguiente `playerAttack` o `playerMagic` hace ×1.25 y limpia `exposed`.
8. Esquivar fallido: el jugador recibe el golpe completo (sin `defenseMult`); `exposed` no se activa.
9. Esquiva pasiva exitosa sin botón: no activa `exposed`.
10. `nextAction` ∈ {defend, regen, enrage, devour, freeze_magic, overload, interrupted}: el botón se puede pulsar pero no hay tirada ni efecto de exposición; el turno se consume.
11. Con `intentHidden` o dificultad Imposible no se muestra el 🌀.
12. Teclado, ratón y móvil (≤ 960px): el botón es alcanzable sin solapar la bottom nav; tiene `aria-label` y `aria-keyshortcuts="9"`.
13. Claves i18n en/es completas (el test i18n existente pasa).
14. `npm test` verde; sin regresión en `tests/` existentes (350/350 al inicio).

## Plan de pruebas

| Capa | Qué | Cantidad |
|---|---|---|
| Unit | `computeDodgeChance`: criterios 1-4, límites, magia | +8 |
| Unit | `isTacticalDifficulty` por dificultad; `DODGEABLE_ACTIONS` | +2 |
| Integración | `setupKeyboard`/`COMBAT_KEYS` contiene "9" | +1 |
| Integración | `playerDodge` en easy no cambia estado; en adventure pone `dodge_stance` | +2 |
| Integración | multiplicador `exposed` consumido una vez | +1 |
| Test genérico | todo `DODGE*` i18n en en/es (ya cubierto por `i18n.test.mjs`) | 0 |
| Manual | desktop, teclado, móvil (checklist SPEC_WORKFLOW) | — |

## Riesgos y reversión

- **Riesgo:** `enemyTurn` ya es largo y frágil (circularidad, ver SPEC-1301). Mitigación: la lógica nueva vive en `dodge.js` (pura) y en `enemyTurn` solo se cambian ~15 líneas del bloque de evasión.
- **Riesgo de balance:** Rogue nv20 con AGI alto ya puede estar en ~85% pasivo; el tope 0.85 lo limita en Aventura/Difícil (nerf deliberado, solo en esos modos).
- **Reversión:** `git revert` del commit; Fácil no se toca, así que los guardados no cambian (no se persiste nada nuevo: `dodge_stance` y `exposed` viven en el combate).

## Estimación

| Pieza | Tiempo |
|---|---|
| `dodge.js` + tests puros | ~1h |
| `playerDodge` + cambios en `enemyTurn`/`playerAttack`/`playerMagic` | ~1.5h |
| UI (HTML, ui.js, CSS, teclado, móvil, chip 🌀) | ~2h |
| i18n + tests de integración | ~1h |
| QA manual desktop/móvil | ~1h |

## Fuera de alcance

- Técnicas por arma, ramas de héroe, arquetipos enemigos (SPEC-1301, specs siguientes).
- Cambiar la esquiva pasiva en Fácil.
- Reequilibrar vida/daño de enemigos por dificultad.
- Esquiva de acción en tiempo real; animaciones nuevas.
- Que `useSkill` aproveche `exposed`.

## Relacionado

- SPEC-1301 (padre), SPEC-1102 (Concentrarse/contraataque de Defender), SPEC-0802 (intención enemiga), SPEC-1105 (especialización Duelista).

## Cierre 2026-10-09

Implementada: `js/dodge.js` (puro), `playerDodge`, tirada unica en `enemyTurn`, estado `exposed`, boton/tecla 9/movil, chip esquivable, i18n en/es. Tests: `tests/dodge.test.mjs` (10). Suite 360/360. Pendiente: QA manual en navegador (desktop, teclado, movil) y calibracion en playtest (+35 puntos, +25
## Cierre 2026-10-09

Implementada: `js/dodge.js` (puro), `playerDodge`, tirada única en `enemyTurn`, estado `exposed`, botón/tecla 9/móvil, chip esquivable, i18n en/es. Tests: `tests/dodge.test.mjs` (10). Suite 360/360. Pendiente: QA manual en navegador (desktop, teclado, móvil) y calibración en playtest (+35 puntos, +25%).
