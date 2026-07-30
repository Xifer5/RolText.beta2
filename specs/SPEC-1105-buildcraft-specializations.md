# SPEC-1105 Buildcraft con fantasía fuerte por sub-build

## Objetivo

Item #5 del roadmap del usuario: reemplazar el sistema de especialización (SPEC-0606) por 9 sub-builds con identidad mecánica fuerte — Guerrero (Tanque/Berserker/Caballero Sagrado), Mago (Elementalista/Nigromante/Cronomante), Pícaro (Asesino/Trampero/Duelista).

## Contexto

Investigación previa confirmó que el sistema existente ya tenía 9 especializaciones (una por clase, nivel 10, permanente), pero solo 2 de los 9 nombres pedidos existían (`assassin`→"Asesino", `duelist`→"Duelista"); el resto no existía ni temáticamente (Guerrero era Maestro de Espadas/Mazos/Escudos; Mago eran 3 escuelas elementales sueltas sin "Nigromante" ni "Cronomante"). Cada una tenía solo 1-3 bonuses planos sin sinergia — SPEC-0606 se scopeó explícitamente como "bonuses pasivos únicos", nunca prometió "fantasía fuerte". El nivel 10 (desbloqueo) está lejos del techo real de progresión (skills hasta nivel 20, XP curve sin tope).

## Decisiones (confirmadas con el usuario)

1. **Reemplazar** las 9 especializaciones actuales por las 9 nombradas, con más profundidad (no sumarlas como alternativas).
2. Las **9 completas en una sola spec** (mismo enfoque que SPEC-1101, los 7 bosses en un solo pase).
3. Saves viejos con un `player.specialization` que ya no existe se **resetean a `null`** — el jugador puede volver a elegir.
4. Se **agrega tirada de crítico a la magia** (antes `playerMagic()` nunca critea) para que el Nigromante pueda "maldecir en crítico mágico".

## Diseño de las 9 especializaciones

Cada una mantiene el desbloqueo actual (nivel 10, una por clase, permanente) pero gana 3 mecánicas que interactúan.

### Guerrero
- **Tanque**: `physicalDefenseBonus:0.30, maxHpBonus:0.20, counterattackOnHit:0.15` — resiste y castiga.
- **Berserker**: `dmgBonusAll:0.25, enrageThreshold:0.3, enrageDmgMult:1.25, physicalDefensePenalty:0.15` — primer build con downside real (glass cannon).
- **Caballero Sagrado**: `dmgType:"holy", dmgBonus:0.20, healOnKill:0.10, debuffResistPct:0.30` — cura y protege.

### Mago
- **Elementalista**: `dmgType:"fire", dmgBonus:0.20, extraFrozenTurn:true, critBonus:0.10` — domina el fuego, retiene técnicas de hielo y rayo (fusiona las 3 escuelas viejas en un solo build; `magicType` sigue resolviendo por `dmgType`, así que "todos los elementos a la vez" no es viable sin tocar esa resolución — la fantasía se transmite por la mezcla de mecánicas, no por flexibilidad de tipo).
- **Nigromante**: `dmgType:"dark", dmgBonus:0.20, lifeStealOnMagic:0.15, curseOnMagicCrit:true` — drena vida, maldice en crítico.
- **Cronomante**: `mpDiscount:0.25, extraTurnChance:0.10, enemyStunOnHitChance:0.20` — manipula el tiempo.

### Pícaro
- **Asesino**: `dmgType:"pierce", dmgBonus:0.25, poisonOnAttack:true, executeBonus:0.50` — ejecuta a los débiles.
- **Trampero**: `bleedOnAttack:0.35, enemyDefenseShred:0.15, evasionBonus:0.10` — inmoviliza y desgasta (100% nuevo).
- **Duelista**: `evasionBonus:0.15, counterattack:true, counterDmgBonus:0.30` — el contraataque es un arte.

## Piezas técnicas nuevas

- **Crítico mágico** (`playerMagic()`): mismo cálculo base que el físico (10% + AGI×0.5%), sin el +10% de clase pícaro (específico del físico de rogue). Compuesto multiplicativamente con `mult`/`magicBonus`/`focusMult` — un crítico mágico es proporcionalmente más swingy que uno físico (sin resta de defensa plana), aceptado como parte de la fantasía de mago en niveles altos.
- **`maxHpBonus`**: aplicado en `stats.js:calculateTotalStats()` — requirió importar `getActiveSpec` desde `specializations.js` (import circular con `state.js` a través de `specializations.js`, seguro porque ningún uso ocurre en top-level de módulo).
- **`enemy.cursedDebuff`** (Nigromante): nombrado así deliberadamente, NO `enemy.cursed` — `"cursed"` ya es un tipo de daño completo en `damageTypes.js` (ataque de `cultist`); mismo nombre para un campo de objeto distinto se prestaba a confusión.
- **`gameState.activeDebuffs.bleed`** (Trampero, jugador→enemigo): requirió su propio bloque de tick en `enemyTurn()` — a diferencia de `playerDebuffs` (que tiene un loop genérico), `activeDebuffs` no lo tiene; cada debuff de enemigo es un bloque hardcodeado propio (mismo patrón que poison/burn).
- **`enemy._defenseShredStacks`** (Trampero): tope de 3 aplicaciones por combate, evita que la defensa del enemigo colapse a 0 indefinidamente.
- **Cronomante `extraTurnChance`**: al saltar `enemyTurn()`, también se saltan TODOS sus tics (reset de guardia, `checkCowardFlee`, debuffs del jugador, tick de poison/burn del enemigo, contadores de acción forzada de jefes). Confirmado en vivo que es estrictamente una ventaja para el jugador (documentado, no un descuido).
- Código muerto eliminado: la especialización "Explorador" (`goldBonus`/`fleeBonus`) no estaba entre los 9 nombres pedidos — se removieron sus dos únicos puntos de consumo en `combat.js` (`tryFlee()` y el bloque de victoria de `endCombat()`) en vez de dejarlos como ramas siempre-falsas.

## Migración de saves

`js/specializations.js` exporta `migrateUnknownSpecialization(player)`: si `player.specialization` no es null y no existe en el nuevo `SPECIALIZATIONS`, lo resetea a `null`. Se llama desde `saveSystem.js:loadFromSlot()` junto al `migratePermanentBonuses` ya existente, mismo patrón.

## Implementación

| Archivo | Cambio |
|---|---|
| `js/specializations.js` | Las 9 entradas nuevas de `SPECIALIZATIONS`; nueva `migrateUnknownSpecialization()` |
| `js/stats.js` | Import de `getActiveSpec`; `maxHpBonus` aplicado a `stats.maxHp` |
| `js/combat.js` | `playerAttack()`: `dmgBonusAll`/enrage (Berserker), `executeBonus` (Asesino), `bleedOnAttack`/`enemyDefenseShred` (Trampero); `playerMagic()`: crítico mágico nuevo, `lifeStealOnMagic`/`curseOnMagicCrit` (Nigromante), `extraTurnChance`/`enemyStunOnHitChance` (Cronomante); contraataque de Duelista: `counterDmgBonus`; daño físico al jugador: `physicalDefensePenalty` (Berserker), `counterattackOnHit` (Tanque), lectura de `cursedDebuff`; aplicación de status effect: `debuffResistPct` (Caballero Sagrado); `enemyTurn()`: tick de `activeDebuffs.bleed`, decremento de `cursedDebuff`; `endCombat()`: `healOnKill` (Caballero Sagrado); eliminado código muerto de `goldBonus`/`fleeBonus` |
| `js/saveSystem.js` | `loadFromSlot()`: llamada a `migrateUnknownSpecialization()` |
| `js/i18n.js` | ~14 claves nuevas EN/ES para los mensajes de combate de las 9 mecánicas nuevas |
| `tests/specializations.test.mjs` | Actualizado a los 9 ids/nombres nuevos; tests nuevos para `migrateUnknownSpecialization` |

## Criterios de aceptación

1. [x] Las 9 especializaciones son exactamente las nombradas por el usuario, una por clase — test puro + verificado en vivo (los 9 nombres/emojis aparecen correctamente)
2. [x] Tanque: +20% HP máximo confirmado (100→120 con fuerza 10), contraataque al ser golpeado confirmado en vivo (mensaje + daño), -30% daño físico confirmado (2-3 de daño recibido vs. un ataque que sin el bono sería mayor)
3. [x] Berserker: daño con bonus sin importar arma confirmado (9 de daño a HP completo), enrage confirmado (13 de daño bajo 20% HP propio, mismo objetivo)
4. [x] Caballero Sagrado: `healOnKill` confirmado en vivo (+5 HP tras matar, exactamente 10% del HP faltante)
5. [x] Elementalista: tipo de daño fuego confirmado (nota de vulnerabilidad "🔥 Vuln. 20%" contra Wolf)
6. [x] Nigromante: crítico mágico confirmado (mensaje "💥 ¡CRÍTICO!"), robo de vida confirmado (+17 HP tras un hechizo), maldición confirmada (`cursedDebuff:{turns}` aplicado y decayendo turno a turno)
7. [x] Cronomante: turno extra confirmado (HP del jugador sin cambios tras el turno del "enemigo", pudo actuar de nuevo de inmediato), stun al enemigo confirmado (`nextAction:"interrupted"`, mensaje de turno perdido del enemigo)
8. [x] Asesino: `executeBonus` confirmado con comparación exacta (13 daño a HP completo → 19 daño a 20% HP, misma semilla de RNG, coincide con ×1.5)
9. [x] Trampero: sangrado infligido confirmado (aplicación + tick de daño), desgaste de defensa confirmado con tope de 3 aplicaciones (defensa 2→1→0→0, stacks tope en 3 tras 4 ataques)
10. [x] Duelista: contraataque con bono de daño confirmado con comparación exacta (6 = 10×0.5×1.3)
11. [x] Migración de saves: un save con `specialization:"sword_master"` (id legacy) se resetea a `null` al cargar, sin romper el resto del estado (`class` intacto) — verificado en vivo con guardar/cargar real
12. [x] Suite completa en verde (176/176 — 173 previos + 3 nuevos)

## Fuera de alcance
- Respec de una especialización ya elegida (sigue permanente, salvo la migración de id desconocido).
- Cambios al modal de elección de especialización más allá de mostrar los 9 nombres/descripciones nuevos.
- Sinergia entre especializaciones y el sistema de rasgos de enemigo (SPEC-1103) u orígenes (SPEC-1002).
- Tests puros para las piezas DOM-entangled de `combat.js` (mismo patrón no-testeado de SPEC-1101 a 1104) — sí hay tests puros nuevos para `migrateUnknownSpecialization()` y la lista de especializaciones, que sí son testeables hoy.
