# SPEC-1106 Loot que cambia cómo juegas, no solo números

## Objetivo

Item #6 del roadmap del usuario: 5 ítems con efectos de comportamiento en combate, no solo +stats — Anillo de Último Aliento, Capa de Niebla, Espada Voraz, Amuleto del Eco, Libro Quemado.

## Contexto

Investigación previa confirmó que HOY todo objeto se reduce a números planos en `calculateTotalStats()` — ningún ítem tiene `effect`/`onEquip`/`onKill`/`special`. Los 8 slots de equipo existentes (`head/rightHand/leftHand/armor/arms/boots/ring/accessory`) no incluyen `cloak`; la Capa de Niebla usa el slot `armor`. Las tablas de loot (`biomeLoot`/`bossLoot`) son listas planas de `{item, chance, rarity}` — cualquier id de ítem nuevo se integra sin mecanismo adicional.

## Decisiones (confirmadas con el usuario)

1. **Anillo de Último Aliento**: sobrevive a 1 HP una vez por combate, sin perder el turno — NO es un turno extra literal (eso ya existe como mecánica de Cronomante, SPEC-1105); "turno extra" = seguís jugando en vez de perder.
2. **Amuleto del Eco**: reutiliza exactamente los flags "luz" (peso positivo) de `MORAL_DECISIONS` de `endings.js` — sin curar una segunda lista de "qué es compasivo".
3. **Obtención**: drops de combate repartidos por bioma, probabilidad moderada (mismo patrón que el resto del loot) — no garantizados, no atados a un jefe fijo.

## Diseño de los 5 ítems

Se agregó un campo `special` (string) a estos 5 ítems — mismo patrón que `bonuses` de especializaciones (SPEC-1105) y `trait` de rasgos de enemigo (SPEC-1103): un pequeño conjunto de strings conocidos que `combat.js` consulta en los puntos relevantes.

| Ítem | Slot | Flat stats | `special` | Mecánica |
|---|---|---|---|---|
| Anillo de Último Aliento | ring | +1 STR | `lastBreath` | 1 vez por combate, si el daño dejaría al jugador en 0 HP, queda en 1 HP en su lugar |
| Capa de Niebla | armor | +3 DEF | `mistEvasion` (+`mistEvasionBonus:0.50`) | Evasión extra SOLO en la primera ronda de combate |
| Espada Voraz | rightHand | +14 ATK, **-3 DEF** | `healOnKill` (+`healOnKillPct:0.20`) | Cura 20% del HP faltante en cada muerte — fuente independiente del `healOnKill` de Caballero Sagrado (SPEC-1105), se suman si ambas aplican |
| Amuleto del Eco | accessory | +3 INT | `compassionReward` (+`compassionRewardBonus:0.20`) | +20% oro/XP si el jugador tiene ≥1 flag "luz" de `MORAL_DECISIONS` |
| Libro Quemado | rightHand | +8 INT, +12 Magia | `burntBook` (+`fireDmgBonus:0.25`, +`mpCostMult:1.30`) | +25% daño SOLO si el hechizo resuelve a tipo "fuego" (vía especialización); +30% costo de MP en TODO hechizo, sin importar el tipo |

## Piezas técnicas nuevas

- **`tryLastBreath()`** (combat.js): función compartida, se llama en los 4 puntos donde el jugador puede llegar a 0 HP (ataque normal, `devour`, `overload`, tics de veneno/quemadura/sangrado) — cada uno cambia `if (p.hp <= 0)` por `if (p.hp <= 0 && !tryLastBreath())`. El flag de "ya usado" vive en `gameState.currentEnemy.lastBreathUsed` (mismo patrón que `hasGuard`/`guardBroken`: estado efímero por-combate).
- **`enemy.combatRound`**: contador nuevo, incrementado al inicio de `enemyTurn()` — usado por la Capa de Niebla para detectar "primera ronda" (`=== 1`).
- **`healOnKillMsg`** (i18n): renombrado desde `holyKnightHealOnKillMsg` (SPEC-1105) a un mensaje genérico, ya que ahora la cura al matar puede venir de la especialización Caballero Sagrado O de la Espada Voraz (o ambas a la vez).
- **Amuleto del Eco**: importa `MORAL_DECISIONS` desde `endings.js` en `combat.js` — primer caso de reutilización directa de esa tabla fuera de `endings.js`.
- **Libro Quemado**: el bono de daño de fuego solo aplica si `magicType==="fire"`, que hoy se resuelve por la especialización activa (`spec?.bonuses?.dmgType`), NO por el arma equipada — el libro no puede forzar el tipo de daño por sí solo (limitación arquitectónica ya documentada en SPEC-1105 para Elementalista). El aumento de costo de MP, en cambio, aplica siempre, sin condición de tipo.

## Implementación

| Archivo | Cambio |
|---|---|
| `js/items.js` | 5 ítems nuevos: `ring_last_breath`, `cloak_of_mist`, `ravenous_sword`, `echo_amulet`, `burnt_book` |
| `js/lootTables.js` | Entradas nuevas en `biomeLoot`: `forest` (Amuleto del Eco), `cave` (Espada Voraz), `ruins` (Anillo de Último Aliento, legendary), `swamp` (Capa de Niebla), `volcano` (Libro Quemado) |
| `js/combat.js` | `tryLastBreath()` nueva + 4 call-sites; `enemy.combatRound` en `enemyTurn()`; `mistBonus` en el cálculo de evasión; `healOnKill` combinado (spec + equipo) en `endCombat()`; `compassionReward` en `endCombat()` (import de `MORAL_DECISIONS`); `mpCostMult`/`fireDmgBonus` en `playerMagic()` |
| `js/i18n.js` | `lastBreathMsg` nuevo; `healOnKillMsg` (renombrado desde `holyKnightHealOnKillMsg`, ahora genérico) |
| `tests/lootSpecials.test.mjs` (nuevo) | Los 5 ítems tienen su `special` + datos complementarios correctos; los 5 aparecen en alguna tabla de loot; `MORAL_DECISIONS` sigue teniendo exactamente los 4 flags "luz" esperados |

## Criterios de aceptación

1. [x] Anillo de Último Aliento: verificado en vivo — con HP=1, un golpe letal deja al jugador en HP=1 (no Game Over) con el mensaje correcto; un segundo golpe letal en el MISMO combate sí termina el juego (una sola vez confirmado)
2. [x] Capa de Niebla: verificado en vivo con agilidad=0 (evasión base 0%) — ronda 1 esquiva con RNG forzado en 0.4 (umbral 50% con el bono), ronda 2 con el MISMO RNG ya no esquiva (bono expirado, `enemy.combatRound` pasó de 1 a 2)
3. [x] Espada Voraz: verificado en vivo — ATK 10→24 (+14), DEF 4→1 (-3, penalización real confirmada en `calculateTotalStats`); cura al matar confirmada (+10 HP exactos = 20% de 50 HP faltante)
4. [x] Amuleto del Eco: verificado en vivo comparando la MISMA muerte con y sin flag compasivo — sin flag: +10 oro/+30 XP; con `traveler_helped`: +12 oro/+36 XP (×1.2 exacto)
5. [x] Libro Quemado: verificado en vivo — costo de MP 7→9 tras equiparlo (×1.30 exacto, redondeado); el bono de daño de fuego usa el mismo mecanismo de composición ya probado para specs de SPEC-1105 (no aislado en una comparación limpia por la variabilidad de crítico/variance, pero revisado en código)
6. [x] Los 5 ítems aparecen en tablas de loot reales (`biomeLoot`), no solo definidos en `items.js` — test puro + inspección
7. [x] Suite completa en verde (179/179 — 176 previos + 3 nuevos en `tests/lootSpecials.test.mjs`)

## Fuera de alcance
- Un slot `cloak` dedicado — la Capa de Niebla usa `armor`, ya existente.
- Sistema de crafteo o compra en tienda para estos 5 ítems — solo drops de combate en esta iteración.
- Hacer que el daño mágico tome su tipo del arma equipada en vez de la especialización — limitación arquitectónica preexistente (documentada en SPEC-1105), no se toca acá.
- Tests puros para las piezas DOM-entangled de `combat.js` (`tryLastBreath()`, el bono de niebla, etc.) — mismo patrón no-testeado de SPEC-1101 a 1105.
