# SPEC-1103 Sistema de rasgos de enemigo aleatorios

## Objetivo

Item #3 del roadmap del usuario (rejugabilidad): que un enemigo regular (no-boss) no se sienta siempre igual. Al iniciar un combate no-boss, 25% de las veces el enemigo recibe uno de 5 rasgos posibles, cada uno con una mecánica propia y visible en el nombre del enemigo.

## Decisiones (confirmadas con el usuario)

1. **Pool exacto**: los 5 rasgos nombrados por el usuario, ninguno más en esta iteración — Furioso, Ladrón, Antiguo, Regenerador, Cobarde.
2. **Sin stacking**: un enemigo regular tiene como máximo 1 rasgo (o ninguno). Roll único de 25% al iniciar combate; si sale, se elige 1 de los 5 con probabilidad uniforme (5% cada uno).
3. **Genéricos, sin restricción temática**: cualquiera de los 5 rasgos puede tocarle a cualquier enemigo no-boss (un Slime puede salir "Antiguo"). Un solo pool, un solo roll — sin tabla de qué rasgo aplica a qué familia de enemigo.
4. **Cobarde no da recompensa**: cuando huye, cero oro/XP/loot — simétrico con `tryFlee()` del jugador (huir tampoco da nada). No cuenta como kill para el bestiario.
5. **Display**: el rasgo se comunica añadiendo un adjetivo al nombre del enemigo (`enemy.type`) al iniciar combate — ej. "Lobo Furioso", "Goblin Ladrón". Sin badge ni tooltip nuevo: los rasgos con efecto en stats (Furioso, Antiguo) ya son visibles vía los badges ⚔/🛡 existentes junto al nombre (`ui.js:399-402`); los rasgos con efecto en comportamiento (Ladrón, Regenerador, Cobarde) se revelan al jugador cuando disparan, vía mensaje de combate — no necesitan telegraph previo.

## Mecánicas nuevas

Todo el estado de rasgo vive en `gameState.currentEnemy` (memoria, no toca el save — mismo patrón que `hasGuard`/`bossPhase`/etc. de SPEC-1101/1102). Roll y aplicación ocurren en `startCombat()`, solo si `!isBoss`.

```js
const ENEMY_TRAIT_CHANCE = 0.25;
const ENEMY_TRAITS = ["furious", "thief", "ancient", "regenerator", "coward"];
```

### 1. Furioso (`furious`)
- Al spawnear: `enemy.attack = Math.max(1, Math.floor(enemy.attack * 1.35))`, `enemy.defense = Math.max(0, Math.floor(enemy.defense * 0.75))`.
- Aplicado DESPUÉS del escalado por nivel/dificultad ya existente en `startCombat()`, para no interferir con esas cuentas.
- Nombre: `"{type} Furioso"`.

### 2. Ladrón (`thief`)
- Hook en `tryFlee()` (`combat.js:576-589`), rama de éxito (antes de `endCombat(false, true)`): si `gameState.currentEnemy?.trait === "thief"`, roba `Math.floor(gameState.player.gold * 0.15)` (mínimo 1 si el jugador tiene ≥1 oro, 0 si tiene 0) y lo resta de `gameState.player.gold`.
- Si el robo es >0: mensaje nuevo (`enemyStealsGold`, con `{enemy, gold}`) ANTES del mensaje `fleeSuccess` ya existente. Si es 0 (jugador sin oro), no se agrega mensaje extra — solo el `fleeSuccess` normal.
- Nombre: `"{type} Ladrón"`.

### 3. Antiguo (`ancient`)
- Bono de resistencia en memoria: `{ physical: +30, light: -30 }`, sumado (no reemplazado) a las resistencias que ya tenga el enemigo en `ENEMY_COMBAT_DATA[enemy.id]`.
- **No se muta el objeto estático `ENEMY_COMBAT_DATA`** (es compartido por todos los enemigos de ese tipo, mutarlo filtraría el bono a combates futuros). En su lugar, nueva función pura en `damageTypes.js`:
  ```js
  export function getEffectiveResistances(enemy) {
    const base = ENEMY_COMBAT_DATA[enemy.id]?.resistances;
    if (!enemy.traitResistances) return base;
    return { ...base, ...Object.fromEntries(
      Object.entries(enemy.traitResistances).map(([k, v]) => [k, (base?.[k] ?? 0) + v])
    ) };
  }
  ```
- `gameState.currentEnemy.traitResistances = { physical: 30, light: -30 }` al spawnear.
- Los ~6 call-sites que hoy leen `ENEMY_COMBAT_DATA[enemy.id]?.resistances`/`ENEMY_COMBAT_DATA[enemyId]?.resistances` directamente (`resistanceNote`, `resistanceAdviceFor`, `playerAttack`, `playerBreakGuard`, `playerMagic`, `useSkill`) pasan a usar `getEffectiveResistances(enemy)` en su lugar. Sin rasgo, `getEffectiveResistances` devuelve exactamente lo mismo que antes (no-op).
- Nombre: `"{type} Antiguo"`.

### 4. Regenerador (`regenerator`)
- Reusa el sistema de regeneración ya existente (`REGEN_PCT=0.12`, acción `"regen"` en `enemyTurn()`), pero como capa ADITIVA independiente del `behavior` base del enemigo (un enemigo `"mage"` con este rasgo conserva su magia Y gana la chance de regenerar — no se le reemplaza el comportamiento).
- `gameState.currentEnemy.turnsSinceFireHit = 99` al spawnear (nunca quemado).
- `applyDamageToEnemy(dmg, damageType)`: si `damageType === "fire"`, `enemy.turnsSinceFireHit = 0`.
- `rollEnemyIntent()`: incrementa `enemy.turnsSinceFireHit` en 1 al inicio (antes de decidir la acción), y pasa a `decideNextAction()` dos campos nuevos: `hasRegenTrait: enemy.trait === "regenerator"`, `recentlyBurned: (enemy.turnsSinceFireHit ?? 99) < 2`.
- `decideNextAction()` (`enemyAI.js`), justo antes del `switch(behavior)`:
  ```js
  if (e.hasRegenTrait && !e.recentlyBurned && hpRatio < 0.6 && e.lastAction !== "regen" && rng() < 0.5) return "regen";
  ```
  Mismas condiciones que el case `"regenerate"` existente (hpRatio<0.6, no dos regens seguidos, 50%), más el gate de "no quemado hace ≤1 turno".
- Nombre: `"{type} Regenerador"`.

### 5. Cobarde (`coward`)
- Cada turno del enemigo, si `enemy.trait === "coward"` y `enemy.hp / enemy.maxHp < 0.2`, 60% de chance de huir ese turno (si no, se re-evalúa el turno siguiente mientras siga bajo el umbral).
- Chequeo nuevo `checkCowardFlee(enemy)` al inicio de `enemyTurn()` (junto al bloque de guardia/reset ya existente, antes de `processPlayerDebuffs()`). Si huye: mensaje nuevo (`enemyFleesCoward`, con `{enemy}`) + `endCombat(false, false, true)` (ver abajo) + `return` (mismo patrón early-return que `processPlayerDebuffs()`).
- `endCombat(victory, fled=false, enemyFled=false)`: nuevo tercer parámetro. Rama de mensaje: `else if (enemyFled) addMessage(t('enemyFleesCoward')...)` — **el mensaje ya se emitió en `checkCowardFlee`, así que `endCombat` NO debe volver a emitirlo**; el único rol del parámetro es documentar la intención y saltar el bloque de recompensas (que ya está gateado por `if (victory && enemy)`, por lo que técnicamente no requiere cambios en ese bloque — `enemyFled` solo evita que cualquier lógica futura confunda esta rama con una huida del jugador).
- Nombre: `"{type} Cobarde"`.

## Estado nuevo (en memoria, no toca el save)
- `gameState.currentEnemy.trait` — `"furious" | "thief" | "ancient" | "regenerator" | "coward" | undefined`
- `gameState.currentEnemy.traitResistances` — solo si `trait === "ancient"`
- `gameState.currentEnemy.turnsSinceFireHit` — solo si `trait === "regenerator"` (pero inofensivo si existe siempre, se puede inicializar para todos los enemigos por simplicidad)

## Implementación

| Archivo | Cambio |
|---|---|
| `js/combat.js` | `ENEMY_TRAIT_CHANCE`, `ENEMY_TRAITS`; `startCombat()`: roll + aplicación de los 5 rasgos + adjetivo en `enemy.type`; `tryFlee()`: robo de oro si `trait==="thief"`; `applyDamageToEnemy()`: reset de `turnsSinceFireHit` en daño de fuego; `rollEnemyIntent()`: incremento de contador + nuevos campos a `decideNextAction()`; `enemyTurn()`: `checkCowardFlee()` nuevo, llamado al inicio; `endCombat()`: tercer parámetro `enemyFled` |
| `js/enemyAI.js` | `decideNextAction()`: nueva condición aditiva de regen por rasgo (antes del switch) |
| `js/damageTypes.js` | `getEffectiveResistances(enemy)` nueva; ~6 call-sites en `combat.js` migrados de `ENEMY_COMBAT_DATA[...]?.resistances` a `getEffectiveResistances(enemy)` |
| `js/i18n.js` | Claves nuevas EN/ES: `traitFurious`, `traitThief`, `traitAncient`, `traitRegenerator`, `traitCoward` (adjetivos), `enemyStealsGold`, `enemyFleesCoward` |

Sin cambios en `index.html`, `styles-m3.css`, `js/ui.js`, `js/keyboard.js` — no hay UI nueva, el nombre modificado se renderiza solo porque `ui.js:399` ya imprime `gameState.currentEnemy.type` tal cual.

## Criterios de aceptación

1. [x] En ~25% de combates no-boss el enemigo recibe exactamente 1 de los 5 rasgos; el resto no tiene ninguno (verificado forzando cada uno de los 5 índices en vivo con `gstack browse`, más el caso sin rasgo con roll natural)
2. [x] Furioso: verificado en vivo — Wolf base (8 ATK/2 DEF) → "Wolf Furioso" con 10 ATK/1 DEF (+35%/-25% exactos)
3. [x] Ladrón: verificado en vivo — huida exitosa de "Wolf Ladrón" bajó el oro del jugador de 50 a 43 (exactamente 15%) con el mensaje `enemyStealsGold`; el caso sin rasgo (huida normal) no toca el oro
4. [x] Antiguo: verificado en vivo — `getEffectiveResistances()` devolvió `{fire:-20, physical:30, light:-30}` para un "Wolf Antiguo" (base wolf solo tiene `fire:-20`), y `ENEMY_COMBAT_DATA.wolf.resistances` quedó intacto (`{fire:-20}`) tras aplicar el rasgo — confirma que el objeto compartido no se mutó
5. [x] Regenerador: la condición pura (hpRatio<0.6, no dos regens seguidos, gate de `recentlyBurned`) está cubierta por 5 aserciones deterministas en `tests/enemyAI.test.mjs`. En vivo se verificó el enganche real: `turnsSinceFireHit` inicializa en 99 y `rollEnemyIntent()` ya lo incrementó a 100 tras el primer telegraph de "Wolf Regenerador" — confirma que el contador corre en combate real
6. [x] Cobarde: verificado en vivo — "Wolf Cobarde" con HP forzado a 3/50 (6%), tras un turno de Defender huyó con el mensaje `"🏃 ¡Wolf Cobarde pierde los nervios y huye!"` (no `fleeSuccess`); combate terminó (`isInCombat:false`, `currentEnemy:null`) con oro y XP del jugador sin cambios (50/0 → 50/0)
7. [x] Un enemigo sin rasgo (75% de los casos) se comporta exactamente igual que antes de esta spec — verificado en vivo (Wolf normal, 8 ATK/2 DEF, combate completo sin efectos nuevos) y por regresión de la suite completa
8. [x] Suite completa en verde (164/164 — 160 previos + 4 tests nuevos: 3 de `getEffectiveResistances` en `damageTypes.test.mjs`, 1 de regen-por-rasgo en `enemyAI.test.mjs`)

## Fuera de alcance
- Bosses (siguen siendo únicos por diseño, sin rasgos — ya establecido en SPEC-1101)
- Más de 1 rasgo por enemigo (stacking)
- Restricción temática de qué rasgo puede tocarle a qué enemigo
- Recompensa parcial al dejar escapar a un Cobarde
- Tests puros nuevos para las piezas que tocan `combat.js` (mismo patrón no-testeado que SPEC-1101/1102, DOM-entangled) — SÍ se puede (y debe) agregar un test puro para `getEffectiveResistances()` en `damageTypes.js` y para la nueva condición de regen en `enemyAI.js`/`decideNextAction()`, ya que esos dos módulos sí tienen tests hoy (`tests/*.test.mjs`)
