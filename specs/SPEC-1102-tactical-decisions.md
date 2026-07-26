# SPEC-1102 Más decisiones tácticas por turno

## Objetivo

Item #2 del roadmap del usuario: pasar de "atacar/curar/magia" a "leer intención → responder". Defender y Romper Guardia ya existen (SPEC-1101). Esta spec agrega las 3 piezas que faltan — Concentrarse, Interrumpir, Golpe Arriesgado — más contraataque universal y cerrar el gap de duración visible de debuffs (incluye uno que yo mismo dejé sin chip en SPEC-1101).

## Decisiones (confirmadas con el usuario)

1. **Concentrarse y Golpe Arriesgado** viven en el panel de habilidades ya existente (`js/ui.js:659 updateSkillPanel()`, el que hoy muestra "Golpe Brutal") como skills universales — se agregan a `SKILLS_BY_CLASS` de las 3 clases. Cero cambios al grid fijo de combate.
2. **Interrumpir** es un botón condicional en el grid de combate (mismo patrón que "Romper Guardia" de SPEC-1101) — solo aparece cuando `enemy.nextAction` es una acción "grande" (`power_attack`/`magic`/`overload`/`devour`/`freeze_magic`).
3. **Contraataque universal** es una fuente NUEVA ligada a Defender (cualquier clase, ~30% si te golpean mientras defendés) — NO reemplaza ni modifica el 25% que ya tiene la especialización Duelista al esquivar (`combat.js`, `spec?.bonuses?.counterattack`). Son dos fuentes independientes.
4. **Duración visible**: "sangrado" no existe hoy como efecto (solo como categoría de tipo de daño sin usar en `damageTypes.js`) — se crea desde cero como debuff nuevo (enemigo→jugador, mismo patrón que veneno/quemadura). De paso se arregla que `arcaneFreeze` (SPEC-1101, Frost Wyrm) no tiene chip de duración — bug real, no solo pulido.

## Mecánicas nuevas

### 1. Concentrarse (skill universal, las 3 clases)
- `SKILLS_BY_CLASS[clase]` gana `{ id:"concentrate", mpCost:5, levelReq:1 }`.
- Efecto: `buff:"focused", buffTurns:2` (mismo truco de "+1 para sobrevivir su propio tickBuffs" que `defend_stance`).
- En `playerMagic()`: si `activeBuffs.focused > 0` → +50% daño mágico, y se **borra inmediatamente tras usarse** (se consume en el próximo hechizo, no dura por turnos — si el jugador no lanza magia mientras el buff sigue activo, simplemente expira solo sin bonus).

### 2. Golpe Arriesgado (skill universal, las 3 clases)
- `{ id:"risky_strike", mpCost:0, levelReq:1 }` — gratis en MP, el riesgo es la propia probabilidad de fallo.
- 55% de acertar. Si acierta: 2.0x daño de arma (`ignoresDef:true`, la resta de defensa ya se hace dentro del `effect()`, mismo patrón que "Golpe Brutal"). Si falla: 0 daño, solo mensaje de fallo.

### 3. Interrumpir (botón condicional en combat-menu)
- Nuevo botón `interruptBtn`/`mob-interruptBtn` (tecla 7), visible solo si `enemy.nextAction` ∈ `{power_attack, magic, overload, devour, freeze_magic}`.
- Costo 8 MP, 60% de éxito.
- Éxito: `enemy.nextAction = "interrupted"` (nuevo case en `enemyTurn()`, mismo patrón que el bloqueo por stun — el enemigo no actúa ese turno) + **resetea el contador correspondiente** (`turnsSinceDevour`/`turnsSinceOverload`/`turnsSinceFreeze` a 0, para que no vuelva a telegrafiar la misma acción cargada de inmediato).
- Fallo: la acción cargada del enemigo se ejecuta normal (se pierden MP y el turno sin efecto).

### 4. Contraataque universal vía Defender
- En `playerDefend()`: si el enemigo golpea ese turno mientras `defend_stance` está activo, 30% de contraatacar (daño = 50% del ataque del jugador), para las 3 clases.
- Fuente independiente del 25% de Duelista al esquivar — ambas pueden coexistir en la misma partida (ej. un Pícaro con Duelista que además usa Defender tiene DOS chances de contraataque por turnos distintos: uno al esquivar, otro al defender).

### 5. Sangrado (nuevo debuff enemigo→jugador)
- Mismo patrón que veneno/quemadura: `ENEMY_STATUS_EFFECTS[enemyId] = { type:"bleed", chance, damage, turns }`.
- Aplicado a 2-3 enemigos de temática cortante ya existentes (ej. `pegasus`, `sand_worm`) — sin arte ni contenido nuevo, solo la entrada de datos.
- No acumula stacks (a diferencia del veneno de SPEC-1101) — mismo comportamiento que quemadura.
- Chip nuevo con `×turnos`, ícono 🩸.

### 6. Fix: chip de `arcaneFreeze`
- `updateBuffBar()` (`ui.js:599-615`) gana una línea para `playerDebuffs.arcaneFreeze` — hoy el jugador no tiene ninguna indicación visual persistente de cuántos turnos le quedan sin magia.

## Estado nuevo (en memoria, no toca el save — mismo patrón que el resto)
- `gameState.activeBuffs.focused` (Concentrarse)
- `gameState.playerDebuffs.bleed = { turns, damage }` (Sangrado)
- `enemy.nextAction === "interrupted"` (transitorio, un ciclo)

## Implementación

| Archivo | Cambio |
|---|---|
| `js/classes.js` | Skills `concentrate` y `risky_strike` agregadas a `SKILLS_BY_CLASS.warrior/mage/rogue` |
| `js/combat.js` | `playerMagic()`: bono de `focused`; `playerDefend()`: contraataque 30%; nuevo `playerInterrupt()` + case `"interrupted"` en `enemyTurn()`; `INTERRUPTIBLE_ACTIONS` (Set); nueva entrada `bleed` en el bloque de status effects + su tick en `processPlayerDebuffs()` |
| `js/enemies.js` / `ENEMY_STATUS_EFFECTS` (`combat.js`) | 2-3 enemigos cortantes con `type:"bleed"` |
| `js/ui.js` | Botón `interruptBtn`/`mob-interruptBtn` (visibilidad condicional, mismo patrón que `breakGuardBtn`); `updateBuffBar()`: chips de `focused` y `arcaneFreeze` (fix) y `bleed` (nuevo) |
| `index.html` / `styles-m3.css` | Botón "Interrumpir" (grid de combate 2x3 → 2x4 para caber junto a "Romper Guardia" si ambos aplican a la vez); sin cambios al panel de habilidades (ya soporta lista dinámica) |
| `js/keyboard.js` | Tecla "7" → `pixel:interrupt` |
| `js/i18n.js` | ~12 claves nuevas EN/ES |

## Criterios de aceptación

1. [ ] Concentrarse y Golpe Arriesgado aparecen en el panel de habilidades para las 3 clases, funcionando en combate real (QA manual)
2. [ ] Interrumpir aparece SOLO cuando el enemigo telegrafía una acción de la lista `INTERRUPTIBLE_ACTIONS`, nunca en `attack`/`defend`/`regen`/`enrage`/`status`
3. [ ] Interrumpir con éxito resetea el contador del boss correspondiente (verificado con Cave Devourer/Ancient Construct/Frost Wyrm)
4. [ ] Contraataque de Defender (30%) y contraataque de Duelista (25% al esquivar) verificados como independientes en la misma partida
5. [ ] Sangrado aplica, tickea daño, muestra chip con turnos restantes, y expira solo
6. [ ] Chip de `arcaneFreeze` visible con turnos restantes mientras esté activo
7. [ ] Grid de combate 2x4 no rompe layout en desktop ni móvil (390px) con hasta 7 botones simultáneos (Atacar/Magia/Ítem/Defender/Huir/RomperGuardia/Interrumpir)
8. [ ] Suite completa en verde (160/160)

## Fuera de alcance
- Tests puros nuevos — mismo patrón que SPEC-1101 (combat.js no tiene tests directos en este proyecto), verificación en vivo con gstack browse
- Rebalanceo de la especialización Duelista existente
- Sangrado como efecto que el JUGADOR pueda infligir a enemigos (esta spec es solo enemigo→jugador, simétrico a veneno/quemadura existentes)
