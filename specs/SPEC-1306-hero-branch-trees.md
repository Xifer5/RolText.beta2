---
tags: [spec, aprobada]
serie: "13"
estado: implementada (pendiente QA manual y calibración en playtest)
padre: SPEC-1301
depende: SPEC-1302, SPEC-1304
---

# SPEC-1306 — Árboles de héroe: nodos por rama

## Contexto

La especialización de nivel 10 (`js/specializations.js`, SPEC-1105) da hoy **solo bonos pasivos** y es **permanente**: no hay forma de cambiarla ni de crecer dentro de ella. Entre el nivel 10 y el 20 un héroe de una rama no gana nada nuevo por ser de esa rama. SPEC-1301 pidió evolucionar las 9 especializaciones hacia "ramas de técnicas" sin duplicar la elección de nivel 10, mezclando técnicas automáticas con técnicas elegidas por el jugador (rejugabilidad). Esta spec añade **3 nodos por rama** (niveles 10, 15 y 20) y un **reinicio con oro**. Solo Aventura, Difícil e Imposible; Fácil intacto.

## Estado actual verificado (2026-10-19)

| Pieza | Dónde | Hecho |
|---|---|---|
| Especializaciones | `SPECIALIZATIONS` (`specializations.js`): 9 ramas, 3 por clase, `bonuses` pasivos | Elegible a nivel ≥10 una vez; `chooseSpecialization` no admite cambio |
| Modal de elección | `specModal.js` (79 líneas); disparado desde `combatRewards.js:277` y `ui.js:1072` | Sin vista de nodos ni reinicio |
| Habilidades de clase | `SKILLS_BY_CLASS` (`classes.js`): 8 por clase, a nivel 1/3/6/10/15/20, **con MP** | Ya hay una en 10, 15 y 20 por clase (Torbellino, Furia Berserker, Avatar de Guerra...) |
| Técnicas de arma | `weaponTechniques.js` + `techniqueActions.js` (SPEC-1304) | Panel, enfriamientos `gameState.techCooldowns`, evento `pixel:useTechnique` |
| Respec | no existe | `grep respec` sin resultados |
| Panel de habilidades | `#skill-panel` | Hasta 8 de clase + 2 de arma = 10 botones antes de esta spec |

Qué quedó sin tocar a propósito: los `bonuses` actuales de cada rama **no se modifican**; los nodos se suman.

## Decisiones tomadas (con el usuario)

1. **3 nodos por rama: fijo, a elegir, fijo.** Nivel 10 = técnica activa distintiva (fija). Nivel 15 = elige 1 de 2 pasivas de sinergia. Nivel 20 = técnica activa de remate (fija). 36 definiciones (18 activas, 18 pasivas), 2 builds por rama.
2. **Reinicio con oro, fuera de combate**: reiniciar la elección de nivel 15 cuesta 50 × nivel del personaje; cambiar de rama completa cuesta 100 × nivel y deja los nodos de la rama nueva con sus elecciones pendientes.
3. **Las activas usan solo enfriamiento** (sin MP), igual que SPEC-1304, y comparten `techCooldowns`.
4. **Héroes existentes (≥15 o ≥20):** conservan rama y bonos; los nodos fijos se les otorgan solos; los de elegir quedan **pendientes** con un aviso. Nunca se elige por el jugador.

## Propuesta

### Datos y lógica pura: `js/branchNodes.js` (nuevo)

```js
export const BRANCH_NODES = { tank: { 10: {...}, 15: { a: {...}, b: {...} }, 20: {...} }, ... };  // 9 ramas
export const NODE_LEVELS = [10, 15, 20];
export function nodeState(player, specId)              // { 10: {unlocked}, 15: {unlocked, pick|null, pending}, 20: {...} } — [] en Fácil
export function unlockedBranchActives(player, difficulty) // ids de activas disponibles
export function branchPassives(player, difficulty)     // bonos agregados de las pasivas elegidas
export function pickNode(player, level, choice)        // valida nivel/rama; devuelve false si no procede
export function respecCost(player, kind)               // 'picks' = 50*lvl, 'branch' = 100*lvl
export function resolveBranchActive(id, ctx, rng)      // descriptor puro, igual que resolveTechnique
```

`player.branchPicks = { 15: "a" | "b" }` (campo nuevo, ausente en saves viejos = sin elección). La activa de nivel 10 y 20 no necesita estado: se deduce de `player.specialization` + `player.level`.

### Los 36 nodos (valores de partida; cooldown en turnos)

**Guerrero**

| Rama | Nv 10 (activa) | Nv 15 (elige 1) | Nv 20 (activa) |
|---|---|---|---|
| Tanque | **Golpe de Escudo** (cd 4): 80% daño contundente; si la intención del enemigo es golpe pesado/aturdidor, la cancela | A) **Bastión**: −10% daño físico recibido · B) **Represalia**: +10 pts a la probabilidad de contraatacar al ser golpeado | **Muro Inquebrantable** (cd 6): Defender reforzado (reduce a la mitad los **2** siguientes golpes) y limpia 1 estado negativo |
| Berserker | **Hender** (cd 3): 150% daño, rompe guardia y baja 20% la defensa 2 turnos; **retroceso: pierdes 5% de HP máx (nunca letal, deja ≥1)** | A) **Sangre Caliente**: +15% daño con HP < 50% · B) **Furia Contenida**: −1 turno de enfriamiento a las técnicas de rama | **Furia Desatada** (cd 5): 200% daño, hasta +30% según el HP perdido (tope fijo para que no convenga estar herido a propósito) |
| Caballero Sagrado | **Golpe Consagrado** (cd 3): 130% daño sagrado; ×1.5 si el enemigo es vulnerable a sagrado/luz | A) **Guardia Sagrada**: −25% daño oscuro/maldito recibido · B) **Fe Inquebrantable**: bloquea la primera aplicación de estado de cada combate | **Purificación** (cd 6, 1 vez por combate): cura 15% HP máx y limpia todos los estados negativos |

**Mago**

| Rama | Nv 10 (activa) | Nv 15 (elige 1) | Nv 20 (activa) |
|---|---|---|---|
| Elementalista | **Cambio de Elemento** (cd 3): 140% daño mágico del elemento (fuego/hielo/rayo) con peor resistencia del enemigo; fuego quema, hielo congela 1 turno | A) **Barrera Elemental**: −20% daño mágico recibido · B) **Explotar Debilidad**: +10% daño mágico a enemigos con debilidad | **Tormenta Elemental** (cd 6): 220% del elemento más débil del enemigo + su estado |
| Nigromante | **Drenar Vida** (cd 3): 110% daño oscuro; cura 50% del daño causado | A) **Velo Oscuro**: −20% daño mágico recibido · B) **Cosecha**: cura 10% HP máx al matar | **Pacto Macabro** (cd 5): 180% daño oscuro + maldición (−15% ataque, 3 turnos) |
| Cronomante | **Pulso Temporal** (cd 4): 110% daño y cancela la acción grande anunciada (jefes: 50%) | A) **Anticipación**: −10% daño recibido de acciones anunciadas · B) **Flujo Temporal**: −1 turno a todos los enfriamientos de rama | **Rebobinar** (cd 7, 1 vez por combate): el siguiente golpe del enemigo hace solo 25% |

**Pícaro**

| Rama | Nv 10 (activa) | Nv 15 (elige 1) | Nv 20 (activa) |
|---|---|---|---|
| Asesino | **Marca Letal** (cd 4): 60% daño y marca al enemigo 3 turnos; tu siguiente golpe físico lo consume y hace +50% | A) **Sangre Fría**: +10% probabilidad de crítico · B) **Veneno Potente**: +50% daño de tus venenos | **Ejecución** (cd 6): 200% daño; ×2 si el enemigo tiene < 30% HP (es daño, nunca muerte instantánea) |
| Trampero | **Trampa de Cepos** (cd 4): el siguiente ataque del enemigo activa la trampa: 130% daño y sangrado 3 turnos (una trampa activa a la vez) | A) **Humo Denso**: +8% evasión · B) **Cepos Afilados**: la trampa hace +50% y sangra 1 turno más | **Campo de Cepos** (cd 7): la trampa dura 3 ataques del enemigo (80% daño cada una) |
| Duelista | **Réplica Veloz** (cd 2): 100% daño; ×1.6 si esquivaste el último ataque del enemigo | A) **Pies Ligeros**: +8% evasión · B) **Contragolpe**: +30% al daño de tus contraataques | **Danza de Espadas** (cd 6): 3 golpes de 80% y quedas en postura de esquiva |

Todos los números de daño parten del **daño de Atacar** (físico) o del **ataque mágico** (mago), igual que en SPEC-1304. Ningún nodo exige un arma, un elemento o un objeto concreto. Los bonos de evasión se suman a la esquiva pasiva y **siguen limitados por el tope único de `computeDodgeChance` (10–85%)**.

### Integración

- **Panel:** las activas de rama se muestran en el mismo `#skill-panel` que las técnicas de arma, con etiqueta de rama (`🛡️ Tanque`). El botón usa `pixel:useTechnique`; `useTechnique` acepta ids de ambas tablas y comparte `techCooldowns`.
- **Hooks de pasivas** (todos con valor 0 sin el nodo): daño recibido por tipo (`enemyTurn`), crítico (`playerAttack`/`playerMagic`), evasión pasiva (`enemyTurn`), curación al matar (`combatRewards`), contraataque (`enemyTurn`), bono de daño de veneno (`playerCombatActions`), −1 de enfriamiento (`techniqueActions`).
- **Estados nuevos del combate (efímeros):** `enemy.marked` (Asesino), `enemy.trap` (Trampero), buff `rewind` (Cronomante), `gameState.dodgedLastTurn` (Duelista), usos por combate de Purificación y Rebobinar. Ninguno se persiste.
- **UI de ramas:** nueva sección "Ramas" en el panel de personaje con los 3 nodos, el de nivel 15 con dos botones de elegir, aviso "elección pendiente" y los dos botones de reinicio con su costo en oro (deshabilitados en combate o sin oro).
- **i18n en/es:** 36 nombres, 36 descripciones y ~20 mensajes.
- **Saves:** `player.branchPicks` ausente = ninguna elección; no hay migración. Cambiar de rama borra `branchPicks`.

## Criterios de aceptación

1. Las 9 ramas tienen exactamente 1 activa en nivel 10, 2 opciones en nivel 15 y 1 activa en nivel 20 (test genérico).
2. En Fácil no hay activas ni pasivas de rama (`unlockedBranchActives(...) === []`, `branchPassives(...)` todo 0).
3. Un héroe nivel 12 solo tiene la activa de nivel 10; nivel 15 sin elección tiene `pending` y **ninguna** pasiva del nodo 15; nivel 20 suma la activa de remate.
4. `pickNode` solo acepta `a`/`b`, solo si el nivel ≥ 15 y la rama coincide; elegir dos veces no cambia la elección sin reiniciar.
5. Reiniciar elecciones cuesta 50 × nivel; cambiar de rama cuesta 100 × nivel; ambos fallan sin oro suficiente y no descuentan nada; ambos están bloqueados en combate.
6. Cambiar de rama vuelve a poner `specialization = nueva`, borra `branchPicks` y no pierde habilidades de clase ni técnicas de arma.
7. Cada activa devuelve el efecto numérico de la tabla con RNG inyectado (18 casos), incluyendo: Hender nunca deja HP < 1; Furia Desatada con tope +30%; Ejecución ×2 solo con enemigo < 30%; Pulso Temporal 50% en jefes; Impacto sobre `isBoss` nunca aturde.
8. Purificación y Rebobinar solo se usan una vez por combate; el contador se reinicia en `startCombat`.
9. Las 18 pasivas suman únicamente cuando están elegidas/desbloqueadas; ninguna cambia un valor cuando no aplica.
10. El tope de evasión se respeta: con pasiva, `computeDodgeChance` nunca supera 0.85.
11. Un héroe con rama y nivel ≥ 15 cargado de un save anterior abre la partida sin errores, conserva todos sus bonos y ve la elección pendiente.
12. Un héroe sin técnicas de rama (Fácil, o sin nivel) combate exactamente como hoy (los 420 tests siguen verdes).
13. i18n en/es completa para toda clave nueva.
14. Cada rama tiene al menos dos respuestas viables a un arquetipo enemigo que no dependen de la rama (SPEC-1303/1305).

## Plan de pruebas

| Capa | Qué | Cantidad |
|---|---|---|
| Unit | estado de nodos por nivel, `pickNode`, `respecCost`, cambio de rama, Fácil excluido | +10 |
| Unit | efecto numérico de las 18 activas con RNG inyectado | +18 |
| Unit | agregación de las 18 pasivas (cada una suma solo al elegirla) | +9 |
| Genérico | 9 ramas × 3 nodos, i18n, ids únicos, sin solapar con `SKILLS_BY_CLASS` ni `TECHNIQUES` | +3 |
| Integración | `useTechnique` real con una activa de cada clase; trampa, marca y rebobinar a través de `enemyTurn` | +6 |
| Compatibilidad | cargar un héroe nivel 20 con rama y sin `branchPicks`; reinicio con oro | +3 |
| Humo | 9 ramas × 3 dificultades × turnos reales sin excepciones | +1 |
| Manual | sección "Ramas" y panel de habilidades en escritorio/teclado/móvil (≤960px y ≤400px) | — |

## Riesgos y reversión

- **Panel de habilidades saturado:** hasta 8 habilidades de clase + 2 de arma + 2 de rama = 12 botones. Mitigación: agrupar por filas con etiqueta (clase / arma / rama) y verificar ≤400px; si desborda, las técnicas pasan a una segunda fila con scroll horizontal.
- **Poder acumulado:** pasivas de nivel 15 + técnicas de arma + técnicas de rama + especialización pueden sumarse. Mitigación: ningún bono de rama supera +15% porcentual individual; la evasión mantiene su tope; las curaciones y Rebobinar tienen uso por combate.
- **Solape con habilidades de clase** de nivel 10/15/20 (Torbellino, Meteoro...): son MP y nombres distintos, pero a nivel de uso podrían parecer duplicadas. Mitigación: criterio 14 y el test genérico de ids únicos; se revisa en playtest.
- **Balance:** todo es dato de partida; calibrar en playtest.
- **Reversión:** revertir el commit; `branchPicks` queda como campo ignorado en saves y no rompe nada.

## Esfuerzo (CC + tests)

| Componente | Estimado |
|---|---|
| `branchNodes.js`: 36 nodos puros + estado + reinicio | ~3 h |
| Hooks de pasivas y estados nuevos del combate | ~2 h |
| UI sección "Ramas" + reinicio | ~1.5 h |
| i18n en/es (~92 textos) | ~1.5 h |
| Tests | ~3 h |

## Fuera de alcance

- Cambiar los `bonuses` actuales de las especializaciones o la elección de nivel 10.
- Nuevas especializaciones o clases.
- Árboles de técnicas de arma más profundos (SPEC-1304 queda como está).
- Dificultad Fácil.
- Equilibrar contra jefes uno por uno: solo las excepciones de la tabla (stun/Pulso).

## Relacionado

SPEC-1301 (padre), SPEC-1105 (especializaciones), SPEC-1304 (técnicas por arma), SPEC-1303/1305 (arquetipos), SPEC-1302 (esquiva y tope de evasión), SPEC-0702 (entrenadores).
