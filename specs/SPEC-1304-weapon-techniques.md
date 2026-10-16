---
tags: [spec, aprobada]
serie: "13"
estado: implementada (pendiente QA manual y calibración de umbrales en playtest)
padre: SPEC-1301
depende: SPEC-1302, SPEC-1303
---

# SPEC-1304 — Técnicas por arma

## Contexto

SPEC-1301 decidió que **el arma define el tipo de daño y también un set de técnicas**. Hoy el arma solo cambia un número: `getWeaponDamageType()` (`js/damageTypes.js:242`) devuelve el tipo de daño y `getMasteryBonus()` (`js/mastery.js:33`) da hasta +20% de daño. Dos espadas distintas juegan igual y un martillo se juega como una daga con otro número. SPEC-1302 (Esquivar) y SPEC-1303 (arquetipos) ya le dieron al combate lectura y respuestas; esta spec le da al jugador **herramientas ligadas a lo que lleva en la mano**, que además son las respuestas a los arquetipos (Rompeguardia, Guardián, Canalizador...).

Quién lo nota: el jugador en Aventura/Difícil/Imposible. Fácil queda intacto (mismo gate `isTacticalDifficulty` de `js/dodge.js`).

## Estado actual verificado (2026-10-16)

| Pieza | Dónde | Hecho |
|---|---|---|
| Tipo de daño del arma | `getWeaponDamageType` (`damageTypes.js:242`) | 10 tipos entre 38 armas equipables; una espada de lava devuelve `fire`, no "hoja" |
| Maestría | `mastery.js`; XP en `gameState.weaponMastery[tipoDeDaño]` (`state.js:55`) | 5 tiers: 0 / 500 / 2000 / 5000 / 10000 XP; +5% de daño por tier |
| Ganancia de XP | `grantMasteryXP(type, 5)` (`combatFeedback.js:76`) | **5 XP por golpe** (Atacar/Magia/habilidad) |
| Habilidades de clase | `SKILLS_BY_CLASS`, `useSkill()` (`playerCombatActions.js:338`) | cuestan MP; panel `#skill-panel` (`ui.js:771`) |
| Debuffs sobre el enemigo | `gameState.activeDebuffs` (poison/burn/bleed/stunned/frozen) | ya se aplican y ticken en `enemyTurn` |
| Buffs del jugador | `gameState.activeBuffs` (`defend_stance`, `arcane_shield`, `warcry`) | ya se consumen en `enemyTurn` |
| Otras respuestas | Defender, Esquivar, Interrumpir, Romper Guardia | no se tocan |

Paisaje de las 38 armas por **forma** (no por elemento):

| Familia | Armas | Cantidad |
|---|---|---|
| Hoja | sword, iron_sword, axe, vine_whip, cutlass, tiger_blade, captain_sword, crystal_blade, royal_sword, katana, ravenous_sword, demon_blade, dark_sword, lava_sword, inferno_blade, dragon_king_sword, divine_sword, excalibur | 18 |
| Perforante | goblin_dagger, dagger, trident, serpent_sword, elven_bow | 5 |
| Contundente | hammer, war_hammer, giant_club | 3 |
| Bastón ofensivo | staff, wand, elemental_wand, water_staff, ocean_staff, flame_staff, pyro_staff, burnt_book, pharaohs_scepter | 9 |
| Báculo de apoyo | bless_staff, healing_staff, spirit_staff (+ cualquier otro bastón de luz/sagrado) | 3 |

(Total 38. `elven_bow`, `burnt_book` y `pharaohs_scepter` hoy devuelven `slash` por datos antiguos; el mapa explícito las asigna por su forma real. El test genérico exige que **todo** arma equipable de `rightHand` tenga familia.)

## Decisiones tomadas (con el usuario)

1. **Familias por forma**, no por elemento: mapa explícito `WEAPON_FAMILY` (arma → familia). El elemento sigue siendo el tipo de daño; la familia define las técnicas.
2. **Desbloqueo por maestría de la familia + enfriamiento en turnos**, sin MP.
3. **Todas las familias** en la primera entrega: 2 técnicas activas + 1 pasiva por familia (15 técnicas).
4. **Aparecen en el panel de habilidades**, separadas de las de clase, con etiqueta de arma. No reemplazan Atacar ni cambian el teclado 1-7.
5. Solo Aventura, Difícil e Imposible (heredado de SPEC-1301).

## Decisiones de diseño tomadas en esta spec (revisables en la aprobación)

- **La maestría de familia es un contador propio**, no la de tipo de daño. Razón: una `lava_sword` hoy sube XP de `fire`, no de hoja; si las técnicas dependieran del tipo de daño, usar espadas elementales las dejaría sin técnicas. `grantMasteryXP` suma además a la familia del arma equipada (clave `fam_<familia>` en el mismo `weaponMastery`).
- **Umbrales de técnica propios: 100 / 400 / 1000 XP** (20 / 80 / 200 golpes a 5 XP). Con los tiers actuales (500 / 2000 / 5000) la primera técnica exigiría 100 golpes (~una run entera, sin medir). Los umbrales son datos (`FAMILY_UNLOCK_XP`) y se calibran en playtest.
- **Compatibilidad con saves:** sin migración. Al leer la XP de una familia se toma `max(XP de familia, XP legada del tipo de daño principal)` (hoja→`slash`, perforante→`pierce`, contundente→`blunt`, bastones→`magic`), así quien ya tiene Maestro en una espada no empieza de cero.

## Propuesta

### Datos y lógica pura: `js/weaponTechniques.js` (nuevo)

```js
export const WEAPON_FAMILY = { sword: "blade", dagger: "piercing", hammer: "blunt", staff: "staff", healing_staff: "support", /* 38 */ };
export const FAMILY_UNLOCK_XP = [100, 400, 1000];            // técnica 1, técnica 2, pasiva
export const TECHNIQUES = { /* ver tabla */ };               // id -> { family, slot: 1|2|"passive", cooldown, nameKey, descKey, emoji }
export function getWeaponFamily(weapon)                      // familia o null
export function familyXp(family, weaponMastery)              // max(contador propio, legado)
export function unlockedTechniques(weapon, weaponMastery, difficulty) // [] en Fácil
export function techniqueReady(id, cooldowns)                // true si cooldown == 0
export function resolveTechnique(id, ctx, rng)               // puro: devuelve { damage, ignoresDef, debuff, buff, heal, ... }
```

Cada técnica es una función pura de `(stats, enemy, rng)` → resultado, igual que `skill.effect`. `useTechnique()` en `playerCombatActions.js` solo la llama y reutiliza el pipeline de `useSkill` (daño, resistencias, `applyDamageToEnemy`, debuffs, `tickBuffs`, turno enemigo).

### Técnicas (valores de partida, no balance final)

| Familia | Nivel | Técnica | Efecto | Enfriamiento | Respuesta que habilita |
|---|---|---|---|---|---|
| Hoja | 1 | **Tajo Cruzado** | 140% del daño de Atacar + sangrado 3 por tick, 2 turnos | 3 | Enemigos regenerativos, objetivos que ya están expuestos |
| Hoja | 2 | **Parada y Respuesta** | Postura de 1 turno: -50% al siguiente golpe y el contraataque de Defender pasa de 30% a 100% | 4 | Rompeguardia/golpes pesados telegrafiados |
| Hoja | pasiva | **Filo Afinado** | +10% de probabilidad de crítico con armas de hoja | — | — |
| Perforante | 1 | **Estocada Precisa** | 120% del daño, ignora 40% de la defensa del enemigo | 3 | Alta defensa (Guardián, golems) |
| Perforante | 2 | **Filo Envenenado** | 100% del daño + veneno 3 por tick, 3 turnos | 4 | Peleas largas, enemigos que se curan |
| Perforante | pasiva | **Oportunista** | +15% de daño contra enemigos "expuestos" (SPEC-1302) | — | Premia Esquivar con éxito |
| Contundente | 1 | **Golpe Aplastante** | 150% del daño; rompe la guardia del enemigo (`isDefending = false`) y le quita 25% de defensa 3 turnos | 3 | **Guardián** (devuelve daño en guardia), armaduras |
| Contundente | 2 | **Impacto Sísmico** | 130% del daño + 40% de aturdir 1 turno (jefes: nunca aturde; en su lugar 25% de defensa extra por 2 turnos) | 5 | Canalizador (cancela canalización si aturde) |
| Contundente | pasiva | **Peso Muerto** | Atacar ignora 10% de la defensa | — | — |
| Bastón ofensivo | 1 | **Descarga Concentrada** | Daño mágico 150% (tipo del bastón: fuego/agua/rayo/magia) sin MP | 3 | Explotar vulnerabilidades elementales |
| Bastón ofensivo | 2 | **Sobrecarga Arcana** | El siguiente hechizo hace ×1.5 (buff de 2 turnos, se consume al lanzar) | 4 | Ventana tras esquivar/defender |
| Bastón ofensivo | pasiva | **Maná Fluido** | +2 MP al inicio de cada turno de combate | — | — |
| Báculo de apoyo | 1 | **Luz Sanadora** | Cura 12% del HP máximo (+25% si tiene la pasiva) | 4 | Sustituye una poción, sin dejar de dañar |
| Báculo de apoyo | 2 | **Escudo de Luz** | Activa `arcane_shield` (absorbe 40% del siguiente golpe) | 5 | Hechizos del Canalizador, golpes pesados |
| Báculo de apoyo | pasiva | **Devoción** | +25% a toda curación de técnicas y pociones de HP | — | — |

Todas las técnicas activas **no usan MP**, **no se acumulan con Defender/Esquivar en el mismo turno** (son la acción del turno) y **no se puede usar una técnica con enfriamiento > 0**. Ninguna es obligatoria: cada respuesta tiene al menos dos alternativas ya existentes (Defender, Esquivar, Interrumpir, Magia).

### Enfriamiento

`gameState.techCooldowns = { [techId]: turnosRestantes }`. Se vacía en `startCombat`, se decrementa 1 por turno del jugador en el mismo punto donde `tickBuffs()` ya corre, y la técnica usada arranca en su enfriamiento. No persiste entre combates.

### UI

- `#skill-panel` agrega botones de técnica **después** de las habilidades de clase, con borde/etiqueta del arma (`🗡️ Hoja`), icono de enfriamiento (`⏳ 2`) y deshabilitado mientras no esté listo o la técnica no esté desbloqueada. Técnicas bloqueadas por maestría **no se muestran** (sin ruido); el panel de maestría existente (`ui.js:1023`) muestra la barra de progreso de familia.
- Evento nuevo `pixel:useTechnique` (`detail.techId`) enrutado por `handleAction` en `combat.js` (mismo bloqueo `busy` que el resto).
- Texto en inglés/español para 15 nombres, 15 descripciones, 5 nombres de familia y los mensajes de resultado.
- Móvil: los botones usan la clase existente `.skill-btn`; verificar que el panel no desborde en ≤400px con hasta 4 habilidades de clase + 2 técnicas.

## Criterios de aceptación

1. `getWeaponFamily` devuelve familia para **las 38 armas** de `rightHand` y `null` sin arma; test genérico lo exige para cualquier arma futura.
2. En Fácil no hay técnicas disponibles (`unlockedTechniques(...) === []`) y `useTechnique` no hace nada.
3. Con XP de familia 99 no hay técnicas; 100 desbloquea la 1ª; 400 la 2ª; 1000 la pasiva (y no antes).
4. `familyXp` toma el mayor entre el contador propio y el legado del tipo principal.
5. `grantMasteryXP` suma XP de familia del arma equipada además de la de tipo de daño; la ganada con una `lava_sword` cuenta para Hoja.
6. Tajo Cruzado: daño = 1.4 × Atacar, aplica `bleed {damage:3,turns:2}` al enemigo; no se puede reusar 3 turnos.
7. Estocada Precisa ignora el 40% de la defensa (vs defensa 20 resta 12, no 20).
8. Golpe Aplastante contra un Guardián en guardia: `isDefending` pasa a `false` **antes** de resolver el daño, por lo que no hay reflejo del Guardián ese golpe.
9. Impacto Sísmico nunca aturde a un jefe (`isBoss`/mini-jefe); sí a un enemigo común (con RNG inyectado ≤ 0.40).
10. Sobrecarga Arcana multiplica ×1.5 solo el **siguiente** hechizo y se consume aunque falle por ceguera.
11. Luz Sanadora cura 12% (15% con Devoción) y nunca supera HP máx.
12. Pasivas: Filo Afinado +10% crítico solo con familia Hoja; Oportunista +15% solo contra `enemy.exposed`; Peso Muerto +10% de pen. solo en Atacar; Maná Fluido +2 MP por turno, sin superar MP máx.
13. El enfriamiento se reinicia al empezar cada combate y nunca queda negativo.
14. Un jugador sin técnicas (arma sin maestría) tiene **exactamente** el comportamiento actual de combate (los 386 tests siguen verdes).
15. i18n en/es completo para toda clave nueva (test genérico existente de paridad + test propio).
16. `resolveTechnique` es puro y determinista con RNG inyectado.

## Plan de pruebas

| Capa | Qué | Cantidad |
|---|---|---|
| Unit | familias, XP de familia (legado/max), desbloqueo por umbral, Fácil excluido | +8 |
| Unit | efecto numérico de cada técnica (15) con RNG inyectado | +15 |
| Unit | enfriamiento: arranque, decremento, reinicio por combate | +3 |
| Genérico | toda arma equipable tiene familia; toda técnica tiene i18n y familia válida | +2 |
| Integración | `useTechnique` real vía `enemyTurn`: Guardián + Golpe Aplastante, Canalizador + Impacto Sísmico (humo por 5 familias × 3 dificultades) | +4 |
| Manual | panel de habilidades en escritorio/teclado/móvil (≤960px y ≤400px) con técnicas + habilidades de clase | — |

## Riesgos y reversión

- **Ritmo de desbloqueo:** 100/400/1000 XP son estimaciones, no medidas. Mitigación: son datos, se ajustan sin tocar lógica; medir en playtest cuántos golpes lleva la primera técnica.
- **Poder:** Golpe Aplastante contra Guardián y Estocada Precisa contra defensa alta podrían volverse "la respuesta obligatoria". Mitigación: cada contrajuego del arquetipo conserva al menos dos respuestas que no dependen de arma (criterio de SPEC-1303).
- **Panel saturado en móvil:** 4 habilidades de clase + 2 técnicas. Mitigación: verificar en ≤400px; si desborda, técnicas en una segunda fila con scroll horizontal.
- **Datos de armas inconsistentes** (`elven_bow`/`burnt_book`/`pharaohs_scepter` como `slash`): el mapa explícito evita depender de ellos; no se tocan sus stats.
- **Reversión:** revertir el commit; no se migra ningún save (solo se agregan claves `fam_*` a `weaponMastery` que el código anterior ignora, salvo `getMasteryDisplay`, que filtra el prefijo).

## Esfuerzo (CC + tests)

| Componente | Estimado |
|---|---|
| `weaponTechniques.js` + mapa de 38 armas + 15 técnicas puras | ~1.5 h |
| `useTechnique` + enfriamiento + hooks (maestría, pasivas, crítico/pen.) | ~1.5 h |
| UI panel + evento + i18n en/es | ~1 h |
| Tests (unit + genérico + humo) | ~1.5 h |

## Fuera de alcance

- Árboles de héroe y nodos elegibles por clase (SPEC-1306).
- Arquetipos Hostigador/Regenerador/Depredador (SPEC-1305).
- Cambiar stats de armas, añadir armas nuevas o rebalancear la maestría actual (+5% por tier se queda).
- Técnicas para armas secundarias, escudos o armaduras.
- Respecialización o venta de técnicas (se ganan por uso).
- Dificultad Fácil.

## Relacionado

SPEC-1301 (padre), SPEC-1302 (Esquivar/expuesto), SPEC-1303 (arquetipos: Guardián, Rompeguardia, Canalizador), SPEC-0605 (maestría), SPEC-0606/1105 (especializaciones), SPEC-1102 (Interrumpir/Defender).
