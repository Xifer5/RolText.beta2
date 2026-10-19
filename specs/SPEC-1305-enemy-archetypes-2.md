---
tags: [spec, aprobada]
serie: "13"
estado: implementada (pendiente QA manual y calibración en playtest)
padre: SPEC-1301
depende: SPEC-1303
---

# SPEC-1305 — Arquetipos de enemigo II: Hostigador, Regenerador y Depredador

## Contexto

SPEC-1303 dejó fuera tres arquetipos de SPEC-1301 ("ya parcialmente cubiertos por `status`/`regenerate`; se revisan después"). La revisión muestra que **todos los candidatos que SPEC-1301 nombra ya tienen otro arquetipo o son mini-jefes**, mientras que 18 enemigos comunes siguen jugándose igual entre sí (mismo 40% de golpe pesado, mismo ataque). Esta spec define los tres arquetipos con mecánicas que no repiten las de SPEC-1303 y los asigna a enemigos que hoy no tienen arquetipo. Solo Aventura, Difícil e Imposible (mismo gate `archetypeScale`); Fácil intacto; jefes y mini-jefes excluidos.

## Estado actual verificado (2026-10-16)

| Candidato SPEC-1301 | Arquetipo hoy | Por qué no sirve |
|---|---|---|
| giant_spider, beholder | Envenenador, Cegador (beholder además es mini-jefe) | Ya tienen identidad de estado |
| drider | ninguno | Libre (comportamiento `status`) |
| hydra, lava_golem | mini-jefes | Excluidos |
| cave_troll | Rompeguardia | Ya tiene arquetipo |
| vampire, medusa | Drenador, Cegador | Ya tienen arquetipo |

Enemigos comunes sin arquetipo (no jefes ni mini-jefes): slime, fungedBeast, cave_bear, squeletor, linchorn, centaurus, chimera, drider, kraken, mermaid, pirate, pirate_captain, gremlin, pegasus, tent, treasure_guardian, dragon (+ los Kestrel, que son rivales y se excluyen).

Pieza existente que se reusa: `ENEMY_ARCHETYPE`/`archetypeScale` (`js/archetypes.js`), capa de IA aditiva en `decideNextAction` (`enemyAI.js`), `enemy.turnsSinceFireHit` (SPEC-1103), ticks de veneno/quemadura/sangrado sobre el enemigo al inicio de `enemyTurn` (`combat.js`), `blindMissed()` como patrón de "ataque fallado que consume turno" (`playerCombatActions.js`).

## Decisiones tomadas (con el usuario)

1. **Asignar a enemigos libres** por identidad; no se apilan arquetipos sobre los ya asignados.
2. **Hostigador = Retirada**: se aleja en vez de atacar; ese turno los ataques físicos del jugador pueden fallar. La magia nunca falla.
3. **Regenerador = cura pasiva con contrajuego**: fuego, veneno, sangrado o quemadura suspenden la curación.
4. **Depredador = cazador de heridos**: hace más daño cuando el jugador está bajo el 50% de HP.

## Propuesta

### Asignación (12 enemigos)

| Arquetipo | Enemigos | Razón de identidad |
|---|---|---|
| Hostigador 🏃 | centaurus, pirate, drider, gremlin | Arquero, pistolero, araña tejedora que se aleja, criatura escurridiza |
| Regenerador 🌱 | slime, fungedBeast, chimera, kraken | Gelatina, hongo, bestia de cabezas múltiples, bestia marina |
| Depredador 🐾 | cave_bear, linchorn, pirate_captain, pegasus | Fieras y cazadores que rematan al herido |

Un enemigo con rasgo aleatorio (`enemyTraits.js`) puede tener arquetipo. **Excepción:** un Regenerador con el rasgo "Regenerador" no suma la cura pasiva (ya cubre esa fantasía y se doblaría la cura).

### Mecánicas (datos de partida; índice = `archetypeScale`: 1 Aventura, 2 Difícil, 3 Imposible)

| Arquetipo | Señal | Mecánica | Valores | Respuestas viables |
|---|---|---|---|---|
| **Hostigador** | Intención "Reposicionándose" (sin daño) | Con 30% de probabilidad (nunca dos veces seguidas) en vez de atacar se aleja. **Mientras esa intención está anunciada**, tus ataques físicos (Atacar, habilidades y técnicas físicas) fallan con probabilidad p; el fallo consume el turno | p = 30 / 40 / 50% | Magia (nunca falla), Defender o curarte ese turno, esperar |
| **Regenerador** | Etiqueta 🌱 con contador cuando está suspendido | Al inicio de su turno (tras los ticks de estado) recupera un % de su HP máx. Si recibió **fuego** o tiene **veneno/quemadura/sangrado** activos, la cura se suspende 2 turnos | 4 / 6 / 8% (mín. 1) | Fuego, cualquier daño continuo (incluidos Tajo Cruzado y Filo Envenenado de SPEC-1304), daño explosivo |
| **Depredador** | Consejo "huele tu sangre" y mensaje en el golpe | Sus golpes hacen más daño si tu HP < 50% de tu HP máx. | +25 / 35 / 50% | Curarte antes de bajar del 50%, Defender o Esquivar estando bajo, matarlo rápido |

### Datos y lógica pura (`js/archetypes.js`)

```js
export const RETREAT_CHANCE = 0.30;
export const RETREAT_MISS = [0, 0.30, 0.40, 0.50];
export const REGEN_PASSIVE_PCT = [0, 0.04, 0.06, 0.08];
export const REGEN_SUSPEND_TURNS = 2;
export const PREDATOR_BONUS = [0, 0.25, 0.35, 0.50];
export const PREDATOR_HP_THRESHOLD = 0.5;

export function retreatMissChance(enemy, scale, isPhysical)   // 0 salvo harasser con nextAction === "retreat" y golpe físico
export function regeneratorTick({ archetype, scale, blocked, hp, maxHp, suppressNow, hasTrait }) // -> { heal, blocked }
export function predatorMult(archetype, scale, hpRatio)       // 1 + bono si hpRatio < 0.5
```

- `enemyAI.js`: capa aditiva para `harasser` → `"retreat"` (como la del Canalizador), `ACTION_META.retreat = { icon: "🏃", labelKey: "intentRetreat" }`, consejo `adviceRetreat`.
- `combat.js` `enemyTurn`: rama `action === "retreat"` (mensaje, sin daño, re-telegrafía); tick del Regenerador tras los ticks de veneno/quemadura/sangrado; multiplicador del Depredador en `atkVal`; `applyDamageToEnemy` pone `enemy.regenBlocked = 2` con daño de fuego.
- `playerCombatActions.js` y `techniqueActions.js`: antes de resolver un golpe físico llaman a `retreatMissed(isPhysical)` (misma forma que `blindMissed`: mensaje, `tickBuffs`, turno enemigo).
- `ui.js`: etiqueta de arquetipo con ⏸ y turnos restantes mientras la regeneración está suspendida.
- i18n en/es: 3 nombres, 3 tooltips, 3 consejos, 1 intención, 1 consejo de intención, mensajes de retirada, fallo, cura, suspensión y olfateo.

## Criterios de aceptación

1. `getArchetype` devuelve `harasser` / `regenerator` / `predator` para los 12 enemigos de la tabla en Aventura, Difícil e Imposible; `null` en Fácil y para jefes/mini-jefes.
2. Ningún enemigo aparece en dos arquetipos (test genérico sobre `ENEMY_ARCHETYPE`).
3. Hostigador: con RNG < 0.30 y `lastAction !== "retreat"`, `decideNextAction` devuelve `"retreat"`; con `lastAction === "retreat"` nunca.
4. `retreatMissChance` = 0.30 / 0.40 / 0.50 con `nextAction === "retreat"` y golpe físico; 0 para magia, para otro arquetipo o con otra intención.
5. Un golpe físico fallado por retirada consume el turno y no gasta MP ni activa enfriamiento de técnica.
6. Regenerador: cura 4 / 6 / 8% del HP máx (mínimo 1) por turno, sin sobrepasar HP máx.
7. Regenerador: recibir fuego, o tener veneno/quemadura/sangrado activos, deja `blocked = 2`; con `blocked > 0` no cura y decrece 1 por turno.
8. Un Regenerador con rasgo "regenerator" no cura de forma pasiva.
9. Depredador: ×1.25 / 1.35 / 1.50 si HP del jugador < 50%, exactamente ×1 si ≥ 50%; el mensaje de olfateo aparece solo cuando el bono aplica.
10. Un enemigo sin arquetipo se comporta igual que hoy (los 406 tests siguen verdes).
11. `decideNextAction` sigue siendo puro y determinista con RNG inyectado.
12. i18n en/es completa (test genérico).
13. Cada arquetipo tiene al menos dos respuestas viables que no exigen clase, arma ni elemento (documentadas en tests por daño esperado).

## Plan de pruebas

| Capa | Qué | Cantidad |
|---|---|---|
| Unit | `retreatMissChance`, `regeneratorTick` (cura, tope, mínimo 1, suspensión, rasgo), `predatorMult` | +10 |
| Unit | `decideNextAction` con Hostigador (probabilidad, no consecutivo, sin arquetipo) | +3 |
| Genérico | los 12 enemigos existen, no son jefes/mini-jefes, sin duplicados; i18n completa | +2 |
| Integración | `enemyTurn` real: retirada sin daño, cura y suspensión por fuego/DoT, bono del Depredador a HP < 50% | +4 |
| Humo | 12 enemigos × 3 dificultades × 40 turnos sin excepciones (se extiende `archetypeCombat.test.mjs`) | +0 (misma suite) |
| Manual | etiqueta y badge ⏸ en ≤960px y ≤400px; leer "Reposicionándose" sin tutorial | — |

## Riesgos y reversión

- **Kraken (550 HP, def 32) con 8% de cura en Imposible**: ~44 HP por turno. Mitigación: la cura se suspende con cualquier daño continuo y los valores son datos; calibrar en playtest. Criterio de revisión: si en playtest ninguna clase lo vence sin fuego, bajar el escalón.
- **Retirada frustrante** (ataques fallados seguidos): el miss solo ocurre con la intención anunciada y nunca dos retiradas consecutivas.
- **Colisión con SPEC-1304**: Estocada Precisa y Tajo Cruzado son físicas y fallan en retirada; está documentado y la magia/Descarga Concentrada no.
- **Reversión:** revertir el commit; no se persiste nada nuevo (todo vive dentro del combate).

## Esfuerzo (CC + tests)

| Componente | Estimado |
|---|---|
| Lógica pura + datos en `archetypes.js` | ~45 min |
| Hooks en `enemyAI`/`combat`/acciones del jugador | ~1 h |
| UI + i18n | ~30 min |
| Tests | ~1 h |

## Fuera de alcance

- Cambiar stats base de enemigos, jefes y mini-jefes, o asignar arquetipos a los Kestrel, mermaid, tent, treasure_guardian, dragon y squeletor (expansión posterior, uno por uno).
- Nuevas habilidades del jugador para estos arquetipos (el contrajuego usa lo existente).
- Árboles de héroe (SPEC-1306).

## Relacionado

SPEC-1301 (padre), SPEC-1303 (arquetipos I), SPEC-1304 (técnicas por arma), SPEC-1103 (rasgos), SPEC-0602 (estados), SPEC-1302 (esquiva).
