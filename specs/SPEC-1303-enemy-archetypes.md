---
tags: [spec, aprobada]
serie: "13"
estado: entregas 1, 2, 3 y expansión implementadas (pendiente QA manual y calibración en playtest)
padre: SPEC-1301
depende: SPEC-1302
---

# SPEC-1303 — Arquetipos de enemigo (físicos, mágicos y de ataque especial)

## Contexto

SPEC-1301 propone que cada enemigo común tenga una identidad táctica: una **señal** legible, una **mecánica propia** y un **contrajuego** claro. SPEC-1302 dio al jugador la respuesta "Esquivar". Esta spec le da a los enemigos algo a lo que responder.

Hoy los 25 enemigos `aggressive` actúan igual (40% golpe pesado, 60% ataque normal); los 14 `mage` igual entre sí, etc. La diferencia entre un lobo y un orco es solo el tipo de daño y las stats. Quién lo nota: el jugador en Aventura/Difícil, que repite siempre la misma pantalla de ataque sin tener que leer al enemigo.

## Estado actual verificado (2026-10-09)

| Pieza | Dónde | Hecho |
|---|---|---|
| IA por `behavior` | `js/enemyAI.js` `decideNextAction()` (módulo puro, RNG inyectable) | aggressive 25 · mage 14 · status 9 · defensive 5 · berserker 4 · regenerate 3 · boss 4 · boss_phased 1 (+2 sin behavior) |
| Datos de combate por enemigo | `js/damageTypes.js` `ENEMY_COMBAT_DATA` | `attackDamageType`, `magicDamageType`, `resistances`, `behavior` |
| Estados que aplican | `js/combat.js` `ENEMY_STATUS_EFFECTS` (exportado, SPEC-0602) | poison, burn, bleed, stun, weakness, blind |
| Chip de intención y consejo | `js/ui.js:416-445` | icono + etiqueta + telegraph + consejo (suprimido en Imposible) |
| Rasgos aleatorios | `js/enemyTraits.js` | capa aditiva independiente de `behavior` |
| Respuestas del jugador | Defender (`defend_stance`, -50%), Esquivar (SPEC-1302), Interrumpir (60%, 8 MP), Romper Guardia, magia/habilidades |
| Jefes | `js/bossMechanics.js` | mecánicas únicas; **no se tocan** |

## Decisiones tomadas (con el usuario)

1. Solo en **Aventura, Difícil e Imposible**; Fácil intacto (mismo gate `isTacticalDifficulty` de `js/dodge.js`).
2. Doce arquetipos en tres familias de cuatro: **físicos**, **mágicos**, **de ataque especial**.
3. La señal se muestra como **etiqueta de arquetipo** en el panel del enemigo (Aventura, Difícil, Imposible). El **consejo** de contrajuego solo en Aventura (Difícil e Imposible lo ocultan; Imposible ya oculta consejos hoy).
4. Los números **escalan por dificultad**: base en Aventura, algo más en Difícil, más aún en Imposible.
5. Cada arquetipo tiene al menos **dos respuestas viables** y ninguno exige clase, rama, elemento u objeto raro.
6. Jefes (`isBoss`) y mini-jefes con mecánica propia quedan **fuera**: no reciben arquetipo.

## Propuesta

### Datos y lógica pura: `js/archetypes.js` (nuevo)

```js
// id de enemigo -> arquetipo. NO se edita enemies.js (mismo patrón que ENEMY_COMBAT_DATA).
export const ENEMY_ARCHETYPE = { orc: "wrecker", wolf: "skirmisher", ... };
export const ARCHETYPES = {
  wrecker: { icon: "🔨", family: "physical", ... },
  // 12 entradas: nameKey, adviceKey, icon, family
};
export function getArchetype(enemyId)                     // null si no tiene o dificultad Fácil
export function archetypeScale(difficulty)                // 0 en easy, 1 adventure, 2 hard, 3 impossible
```

Cada mecánica es una función pura con RNG/estado inyectado (testeable sin DOM). `combat.js`/`enemyAI.js` solo la llaman.

### Familia A — Físicos (entrega 1)

| Arquetipo | Señal en el chip | Mecánica | Contrajuego | Enemigos candidatos |
|---|---|---|---|---|
| **Rompeguardia** 🔨 | Golpe pesado marcado "rompe guardias" | Su `power_attack` reduce el efecto de Defender: 50% → 25% / 15% / 0% (Aventura/Difícil/Imposible) | Esquivar o Interrumpir; Defender sigue sirviendo en Aventura | orc, cave_troll, stone_charger |
| **Asaltante** ⚡ | Etiqueta "veloz" | Su ataque normal es más fácil de esquivar (+15 / +10 / +5 puntos a la esquiva) y puede sangrar | Esquivar y castigar con el bono de "expuesto" | wolf, goblin, thief, jungle_tiger |
| **Guardián** 🛡️ | "Postura de contraataque" cuando defiende | Si recibe daño **físico** mientras `isDefending`, devuelve 30% / 40% / 50% de ese daño al jugador (nunca letal: deja ≥1 HP) | Magia, esperar que baje la guardia, Romper Guardia | guard, dwarf_warrior, stone_golem |
| **Canalizador** 🔮 | Turno "Canalizando…" sin daño | Acción nueva `channel`: un turno cargando; el siguiente lanza magia ×1.5 / ×1.75 / ×2.0 | Interrumpir durante la canalización, o usar el turno libre para atacar; Defender y Esquivar (mitad de probabilidad) | goblin_shaman, elf, sea_serpent |

### Familia B — Mágicos por escuela (entrega 2)

| Arquetipo | Señal | Mecánica | Contrajuego | Candidatos |
|---|---|---|---|---|
| **Pirómano** 🔥 (fuego) | Chip fuego | Quemadura con +0% / +25% / +50% de daño por tick; recibir daño de **hielo o agua** cancela su siguiente quemadura | Hielo/agua, resistencia al fuego, Interrumpir | pyro_elemental, Inferno_elemental, lava_golem |
| **Criomante** ❄️ (hielo) | Chip hielo | Aplica "escarcha": -15 / -20 / -25 puntos a tu esquiva por 2 turnos (**no** aturde) | Fuego la disipa; Defender no se ve afectado por la escarcha | frozen_spirit, ice_giant |
| **Drenador** 🌑 (oscuridad/sangre) | Chip oscuro | Se cura 50% / 60% / 75% del daño que te hace | Defender reduce lo que cura; matarlo rápido; debilidad/maldición | warlock, imp, vampire |
| **Tormentoso** ⚡ (rayo/aire/tierra) | Chip rayo | Sus hechizos **no pueden esquivarse**; en cambio Defender los reduce 60% (en vez de 50%) | Defender o resistencias; Interrumpir | genie, jungle_spirit |

### Familia C — Ataque especial (entrega 3)

| Arquetipo | Señal | Mecánica | Contrajuego | Candidatos |
|---|---|---|---|---|
| **Envenenador** ☠️ | "Preparando veneno" | El estado se aplica con chance ×1.0 / ×1.15 / ×1.3; Esquivar evita el estado junto con el golpe | Esquivar, antídoto, matarlo rápido | giant_spider, vine_serpent |
| **Cegador** 🙈 | "Mirada" | Ceguera ×1.0/×1.15/×1.3; mientras estás cegado, Defender no falla (solo Atacar/Magia) | Defender mientras dura, limpieza | beholder, medusa, sand_worm |
| **Aturdidor** 💫 | "Golpe aturdidor" telegrafiado un turno antes | Stun 1 turno (nunca más); tras un stun, **inmune al stun 2 turnos** (regla de SPEC-1301) | Interrumpir, Esquivar | mountain_giant, gorilla_warrior (+ vampire si se confirma) |
| **Maldito** 💔 | "Maldición" | Debilidad ×1.0/×1.15/×1.3 y duración +1 turno en Imposible | Interrumpir el conjuro, Defender | cultist, dark_knight, diablo |

Reglas transversales de estados (ya acordadas en SPEC-1301): control duro ≤ 1 turno por aplicación y con inmunidad temporal posterior; duración visible; nunca más de un control encadenado.

### Escala por dificultad

`archetypeScale`: easy=0 (sin arquetipo), adventure=1, hard=2, impossible=3. Cada mecánica define su valor para 1/2/3 (tablas arriba). Los consejos de contrajuego solo se muestran con escala 1.

### UI

- Etiqueta de arquetipo (icono + nombre) en `#enemy-name` junto a los badges (`ui.js:~440`), con `data-tooltip` explicando la mecánica; consejo corto (`enemy-intent-advice`) solo en Aventura.
- Acción `channel` en `ACTION_META` (icono 🔮, "Canalizando").
- i18n en/es para 12 nombres, 12 consejos, 4 mensajes de combate nuevos por familia.
- Móvil: la etiqueta cabe en la fila de badges existente (verificar ≤ 960px y ≤ 400px).

## Entregas (cada una cierra con tests + QA manual antes de la siguiente)

1. **Entrega 1 — Físicos:** `archetypes.js`, hooks en `enemyTurn`/`enemyAI`, `channel`, etiqueta UI, enemigos de prueba: **orc, wolf, guard, goblin_shaman**.
2. **Entrega 2 — Mágicos:** Pirómano, Criomante, Drenador, Tormentoso (prueba: pyro_elemental, frozen_spirit, warlock, genie).
3. **Entrega 3 — Especiales:** Envenenador, Cegador, Aturdidor, Maldito (prueba: giant_spider, beholder, mountain_giant, cultist).
4. **Expansión:** sumar el resto de candidatos por lotes pequeños, verificando identidad/narrativa de cada criatura.

## Criterios de aceptación (Entrega 1; las otras repiten el patrón)

1. `getArchetype("orc")` = `"wrecker"` en Aventura y `null` en Fácil; jefes devuelven `null`.
2. Rompeguardia: `power_attack` con `defend_stance` activa multiplica el daño por 0.75 / 0.85 / 1.0 en escala 1/2/3; `attack` normal sigue con 0.5.
3. Asaltante: `computeDodgeChance` recibe el bono por escala (+0.15 / +0.10 / +0.05) solo contra su ataque normal.
4. Guardián: golpe físico a un Guardián con `isDefending` devuelve 30% / 40% / 50% al jugador, nunca baja a 0 HP; el daño mágico no refleja.
5. Canalizador: `channel` no hace daño; el turno siguiente es magia ×1.5 / 1.75 / 2.0; Interrumpir con éxito durante `channel` cancela el lanzamiento.
6. La etiqueta de arquetipo aparece en Aventura/Difícil/Imposible; el consejo solo en Aventura; nunca en Fácil.
7. Un enemigo sin arquetipo se comporta exactamente como antes (tests existentes 361/361 siguen verdes).
8. `decideNextAction` sigue siendo puro y determinista con RNG inyectado.
9. i18n en/es completo (test existente de paridad).
10. Cada arquetipo de la entrega 1 tiene al menos 2 respuestas viables documentadas y probadas en un test (daño esperado con cada respuesta).

## Plan de pruebas (Entrega 1)

| Capa | Qué | Cantidad |
|---|---|---|
| Unit | `getArchetype`, escalas, jefes excluidos, Fácil excluido | +6 |
| Unit | multiplicador Rompeguardia por escala; reflejo Guardián (incl. no letal); canalización | +8 |
| Unit | `decideNextAction` con arquetipo Canalizador (secuencia channel→magia) | +3 |
| Genérico | todo id de `ENEMY_ARCHETYPE` existe en `enemyData` y no es jefe | +1 |
| Genérico | toda `ARCHETYPES[k]` tiene claves i18n en/es | +1 |
| Manual | desktop/teclado/móvil; 4 peleas de prueba por dificultad | — |

## Riesgos y reversión

- **`enemyTurn` ya es largo.** Mitigación: la lógica numérica vive en `archetypes.js` puro; en `enemyTurn` solo se insertan llamadas.
- **Colisión con rasgos aleatorios** (`enemyTraits.js`): un enemigo puede tener arquetipo y rasgo; se prueba un caso combinado (ej. Canalizador + Regenerador).
- **Balance:** los números son de partida; se calibran en playtest. Los jefes no se tocan.
- **Reversión:** revertir el commit; no se persiste nada nuevo (todo vive en el combate).

## Fuera de alcance

- Jefes y sus mecánicas; narrativa nueva; árboles de héroe y técnicas por arma (siguientes specs).
- Cambiar stats base de enemigos o los multiplicadores de dificultad de `difficulty.js`.
- Arquetipos "Hostigador", "Regenerador" y "Depredador" de SPEC-1301 (ya parcialmente cubiertos por `status`/`regenerate`; se revisan después).

## Relacionado

SPEC-1301 (padre), SPEC-1302 (Esquivar), SPEC-0802 (intención), SPEC-0604 (behaviors), SPEC-0602 (estados), SPEC-1103 (rasgos).

## Cierre entrega 1 — 2026-10-09

Implementada: `js/archetypes.js` (puro), acciones `channel`/`channeled_magic` en `enemyAI.js`, hooks en `enemyTurn`/`applyDamageToEnemy` (Rompeguardia, Asaltante, Guardián, Canalizador), etiqueta de arquetipo + consejo (solo Aventura) en el panel del enemigo, i18n en/es. Enemigos de prueba: orc, wolf, guard, goblin_shaman. Tests: `tests/archetypes.test.mjs` (9). Suite 370/370. Simulación de combate real (12 combinaciones dificultad x enemigo, alternando Atacar/Defender/Esquivar/Interrumpir) sin excepciones; en Fácil el arquetipo es `null`. Pendiente: QA manual en navegador y calibración en playtest. Siguiente: entrega 2 (mágicos).

## Estado de implementación (2026-10-15)

- **Entregas 1-3 y expansión implementadas**: los 12 arquetipos y los 33 enemigos candidatos de las tablas están mapeados en `ENEMY_ARCHETYPE` (`js/archetypes.js`). Los jefes y mini-jefes siguen excluidos en runtime (`isBoss`).
- Decisiones de implementación:
  - **Criomante**: la escarcha se aplica con magia o golpe pesado (no con el ataque normal) y dura 2 *tiradas de esquiva*, no 2 turnos.
  - **Pirómano**: apagar por hielo/agua marca `enemy.burnDoused` y cancela la siguiente quemadura que habría aplicado.
  - **Aturdidor**: acción telegrafiada `stunning_blow` (se resuelve como golpe pesado, esquivable e interrumpible); inmunidad al stun vía `gameState.stunImmune` (2 turnos de enemigo), válida para cualquier fuente de stun.
  - **Envenenador/Aturdidor** aportan un estado de respaldo (`archetypeStatus`) porque giant_spider, vine_serpent, mountain_giant y gorilla_warrior no tenían entrada en `ENEMY_STATUS_EFFECTS`.
  - **Cegador**: Defender ya nunca falla con ceguera en el código existente; la mecánica nueva es solo la mayor chance de cegar.
- Pendiente: QA manual (escritorio/teclado/móvil ≤960px y ≤400px) y calibración de números en playtest.
