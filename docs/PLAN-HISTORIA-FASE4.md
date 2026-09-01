# Plan de Trabajo: Historia Mejorada — Fase 4 (sistemas nuevos)

## Objetivo

Implementar el resto del documento externo "historia mejorada" que todavía no
está en el juego: Valdris como antagonista real con su propio combate, las
questlines completas de Eryndel y Pyrax, el clímax jugable de 4 fases, y el
reemplazo del sistema de 3 finales por tono por los 3 finales estructuralmente
distintos del documento. Es la continuación directa de las fases 1-3 (prólogo,
Acto I, Acto II, y el "sabor" aditivo del Acto III), que ya están implementadas
y pusheadas.

## Fuente clave

`C:\Users\Diego Ovando\Documents\Codex\2026-08-28\qui\outputs\pixel-quest-echoes_historia-mejorada.md`
(no versionado en el repo). Antes de implementar cualquier fase de este plan,
releer el documento completo — este plan resume, no reemplaza, esa fuente.

## Qué ya existe y se reutiliza (no reinventar)

- **`js/rivalArc.js`** — el precedente arquitectónico más cercano a lo que
  necesita Valdris: un personaje recurrente con múltiples apariciones
  guionizadas + una resolución final que puede derivar en combate real. Mismo
  patrón: eventos con forma de `TRAVEL_EVENTS` renderizados por
  `showTravelEvent()` ya existente, un hook único en `movement.js` con
  early-return, y el enemigo final del arco NO pertenece a ningún pool de
  encuentro aleatorio (solo se alcanza por el guion).
- **`js/bossMechanics.js`** — `updateBossPhase()` ya implementa un sistema
  genérico de "boss por fases" (`behavior: "boss_phased"`, 3 fases según %HP)
  que `dragon_king` ya usa (`dragonKingPhase2`/`Phase3` en i18n). El clímax de
  4 fases debe EXTENDER esto, no reemplazarlo.
- **`js/travelEvents.js`** — sistema genérico de modal de elección narrativa
  (`showTravelEvent`, `choices[].apply()`) ya usado por `echoIntro.js` y
  `rivalArc.js`. Sirve tal cual para la prueba de las 3 llaves de Pyrax
  (capítulo 9) sin escribir UI nueva.
- **`js/enemies.js`** — el patrón `introLine`/`epilogueLines` (agregado en las
  fases 1-3 de este mismo trabajo) ya está listo para cualquier boss nuevo.
- **Restricción de arquitectura confirmada**: `getNpcAt(locationId)` en
  `npcs.js` solo devuelve un NPC por zona — cualquier personaje nuevo necesita
  su propia `locationId` libre o vivir dentro del diálogo de un NPC existente
  (como se hizo con Mara en Elara).

## Riesgo transversal más grande: compatibilidad con partidas existentes

`js/runLog.js` (la Crónica) graba `tone`/`titleKey` de `getEndingContent()`
DIRECTAMENTE en cada registro histórico al momento de la victoria — las
crónicas de corridas viejas quedan con esos campos para siempre. Cualquier
cambio al sistema de finales debe leer eso como una restricción real, no
teórica: el código que renderiza la Crónica tiene que seguir funcionando con
registros que nunca tendrán los campos nuevos.

---

## Fase 1: Valdris — antagonista real y combate propio ✅ HECHA (2026-09-01)

### Alcance
- Reordenar el tramo final: Valdris se enfrenta al jugador ANTES de
  `dragon_king` (no lo reemplaza, se inserta como paso obligatorio nuevo en
  `mq_05_el_ultimo_sueno` o como `mq_06` nueva).
- Combate real contra un enemigo nuevo (ej. `valdris_corrupted`), con
  `introLine`/`epilogueLines` propios, balanceado entre el último boss de zona
  y `dragon_king`.
- Secuencia de victoria/derrota propia (paralela a la de `dragon_king` en
  `combatRewards.js`), que conecta con el reveal narrativo ya escrito en la
  fase 3 (`dragonKingValdrisReveal`) — ese texto debe seguir siendo coherente
  con lo que pase acá, puede necesitar reescritura.

### Decisión (RESUELTA 2026-09-01)
**Arte**: el usuario creó el arte real — dos versiones, `img/enemies/valdris.webp`
(sano, sin usar todavía en UI) y `img/enemies/valdris_corrupted.webp` (la
que usa el combate). Mismas dimensiones que el resto de los retratos
(800×550 RGBA), sin cambios de código necesarios más allá de la línea `img:`.

### Implementación real (difiere un poco del alcance original, por lo mejor)
- **No hizo falta tocar `mq_05_el_ultimo_sueno` ni crear `mq_06`.** El
  enfrentamiento se dispara como un evento guionizado por llegada a zona
  (`js/valdrisArc.js`, nuevo — mismo patrón que `echoIntro.js`/`rivalArc.js`:
  `showTravelEvent()` + `pixel:travelEventClosed` para encadenar el combate,
  así `gameState.isProcessingMove` queda gestionado por `travelEvents.js` en
  vez de un `setTimeout` suelto). Dispara en la primera llegada a
  `inferno_1` (ya protegida por `dragon_key`), interceptando ANTES del
  encuentro forzado con `dragon_king` que `mapgen.js` ya asignaba ahí al
  100% de probabilidad — el Rey Dragón ahora se dispara a mano, encadenado,
  desde `combatRewards.js`, inmediatamente tras la victoria sobre Valdris.
- **Gateo por `_defeated`, no por `_seen`**: si el jugador huye o pierde
  contra Valdris, el encuentro vuelve a dispararse en su próxima llegada a
  `inferno_1` — evita un softlock real que un gateo por "ya se mostró"
  hubiera causado.
- **`js/npcs.js` no se tocó**: Valdris sigue siendo el mismo NPC amigable-
  en-apariencia en la Torre durante toda la partida; `valdris_corrupted` es
  una entidad de combate totalmente separada, solo alcanzable por el guion.
- **Sin auto-heal entre Valdris y el Rey Dragón** (decisión de diseño, no
  bloqueante): el jugador enfrenta al dragón con el HP/MP que le quede tras
  Valdris, coherente con la tensión de "clímax continuo" del documento — a
  reconsiderar si en playtesting resulta injusto.
- `dragonKingValdrisReveal` (el texto narrativo de la fase 3 anterior, que
  asumía "Valdris nunca llegó a la puerta") se reescribió para ser coherente
  con la pelea real que ahora sucede justo antes.
- Loot propio nuevo: `corrupted_grimoire` (material) y `valdris_seal`
  (accesorio +8 Magia/+4 INT) en `items.js`/`lootTables.js`.
- Entrada de lore en `bestiary.js` (opcional pero barata, ya tenía fallback).
- 5 tests nuevos en `tests/valdrisArc.test.mjs` (existencia del enemigo,
  gateo por ubicación/derrota, no-softlock, consumo del flag pendiente).

### Archivos afectados (reales)
`js/enemies.js`, `js/valdrisArc.js` (nuevo), `js/movement.js` (1 hook),
`js/main.js` (1 setup call), `js/combat.js` (status effect + generic
introLine ya existente lo cubre solo), `js/damageTypes.js`
(`ENEMY_COMBAT_DATA`), `js/combatRewards.js` (secuencia de victoria propia +
encadenado a `dragon_king`), `js/items.js`, `js/lootTables.js`,
`js/bestiary.js`, `js/i18n.js`, `tests/valdrisArc.test.mjs`. NO se tocó
`js/npcs.js` ni `js/quests.js`.

### Riesgo real (terminó siendo mucho más bajo que lo estimado)
El plan original preveía "alto — bloqueado por arte, reordena la secuencia
de misiones principales". En la práctica: el arte se resolvió rápido (el
usuario lo generó), y NO hizo falta reordenar `mq_05` ni tocar `quests.js`
en absoluto — el patrón de evento guionizado por zona (`echoIntro.js`/
`rivalArc.js`) resultó suficiente para insertar el combate sin tocar la
estructura de misiones existente. Cualquier save que ya tenga `dragon_key`
sigue funcionando: la primera vez que ese save entre a `inferno_1` después
de este cambio, verá la confrontación de Valdris antes que al dragón — no
hay migración de datos necesaria. Suite 237/237, verificado en vivo el
flujo completo (confrontación → combate → derrota → cadena automática al
Rey Dragón → secuencia de victoria → modal de final).

---

## Fase 2: Questline de Eryndel

### Alcance
Convertir su "pierde memoria con cada boss" de una frase de lore a un sistema
activo: un contador que avanza con cada boss de zona derrotado (reusa
`recordBossKill()` de `bestiary.js`, ya existe), reflejado en diálogo nuevo
cada vez que el jugador vuelve a hablar con ella — sin quest nueva obligatoria,
expandiendo lo que ya existe en `mq_03_ecos`.

### Archivos afectados
`js/npcs.js` (más `lore`/estados de diálogo), `js/quests.js` (`mq_03_ecos`
gana pasos opcionales o diálogo post-completado), posible módulo nuevo pequeño
`js/eryndelArc.js` si el contador de memoria necesita lógica propia (mismo
criterio de extracción que `echoIntro.js`/`rivalArc.js`), `js/i18n.js`.

### Riesgo
Bajo-medio — reusa `bestiary.js` y el sistema de diálogo por estado que ya
existe, sin combate nuevo ni cambios estructurales.

---

## Fase 3: Questline de Pyrax — la prueba de las 3 llaves

### Alcance
Antes de abrir la Puerta del Dragón, un modal de elección de 3 pasos (llave
arcana = conocimiento, llave del jardín = compasión, llave dracónica = valor
ante la pérdida) usando el sistema de `travelEvents.js` ya existente — sin UI
nueva, sin combate nuevo.

### Archivos afectados
`js/quests.js` (extensión de `mq_05_el_ultimo_sueno`), `js/travelEvents.js`
(un nuevo evento con 3 choices), `js/i18n.js`.

### Riesgo
Bajo — es 100% reuso de infraestructura ya probada (`echoIntro.js`,
`rivalArc.js` ya demostraron este patrón funcionando).

---

## Fase 4: Clímax de 4 fases

### Alcance
Extender `updateBossPhase()`/`behavior: "boss_phased"` de 3 a 4 fases para
`dragon_king`, donde cada fase adicional evoca (mecánicamente, no solo en
texto) el status effect de uno de los jefes de zona ya vencidos por el
jugador — callback jugable real, reusando `bossMechanics.js` en vez de
inventar 8 mecánicas nuevas desde cero.

### Decisión (RESUELTA 2026-09-01)
**Secuencia fija**, siempre las mismas 4 mecánicas en el mismo orden — no
depende de qué jefes de zona venció el jugador. Ejemplo de secuencia (a
confirmar en el detalle de implementación): Fase 1 guardia (Titán del
Bosque) → Fase 2 devorar (Devorador) → Fase 3 sobrecarga (Constructo) → Fase
4 quemadura final. Prioriza balance y testeo simple sobre fidelidad total al
"recorrido propio" del documento.

### Archivos afectados
`js/bossMechanics.js`, `js/combat.js`, `js/enemies.js` (entrada de
`dragon_king`), `js/i18n.js` (texto por fase), `tests/` (cobertura de la
lógica de selección de fase, sin DOM).

### Riesgo
Alto — es la pieza de mecánica de combate más grande de todo el plan. Puede
alterar el balance ya calibrado del combate final si no se prueba a fondo.

---

## Fase 5: Reemplazo de los 3 finales por tono por los 3 finales estructurales

### Alcance
Reemplazar `light`/`gray`/`dark` por Constelación/Nuevo Guardián/Edad de los
Mortales — pero el documento los describe como una ELECCIÓN real del jugador
en el clímax (devolver los recuerdos / tomar la corona / destruir el corazón),
no como un cómputo derivado de decisiones pasadas como hoy.

### Decisión (RESUELTA 2026-09-01)
**Elección real nueva**, la opción más fiel al documento. Modal de elección
(reusa `travelEvents.js`) tras vencer al Rey Dragón: "¿Qué hacés con el
Corazón?" → 3 opciones (devolver los recuerdos / tomar la corona / destruir
el corazón) → se graba `gameState.finalChoiceId` → `showEnding()` lee ESE
campo en vez de (o adicional a) `computeEndingTone()`.

Queda pendiente de definir en el detalle de implementación, no en este plan:
- Fallback en `runLog.js` para crónicas viejas sin `finalChoiceId`.
- Qué pasa con `MORAL_DECISIONS`/`CLASS_BEAT_KEYS` existentes (¿se descartan
  o se combinan con la elección estructural?).
- Comportamiento en Pruebas del Eco / NG+ (nunca llegan a `dragon_king` en
  el primer caso; en NG+ debería poder volver a elegir).

### Archivos afectados
`js/endings.js` (la reescritura central), `js/runLog.js` (compatibilidad con
registros viejos), `js/combatRewards.js` (disparo de la elección), `index.html`
(estructura del modal si cambia de forma), `js/i18n.js` (reemplazo casi total
de las claves `ending*`), `tests/` (si existen tests de `endings.js`, hay que
revisar/actualizar).

### Riesgo
El más alto de todo el plan — es la única fase que toca compatibilidad de
datos persistidos (saves + crónica), no solo contenido nuevo.

---

## Orden recomendado

1. Fase 3 (Pyrax) — más barata, 100% reuso, sirve para validar el patrón antes
   de encarar las fases caras.
2. Fase 2 (Eryndel) — igual de barata, en paralelo si se quiere.
3. Fase 1 (Valdris) — bloqueada por la decisión de arte; resolver esa decisión
   primero es lo único urgente antes de empezar.
4. Fase 4 (clímax) — depende de que Valdris (Fase 1) ya esté resuelto
   narrativamente, porque el clímax sucede inmediatamente después.
5. Fase 5 (finales) — última a propósito: es la que más beneficio saca de que
   todo lo anterior ya esté decidido (qué eligió el jugador en el clímax
   determina el final).

## Fuera de alcance de este plan

- Arte nuevo en sí mismo (retratos, fondos) — este plan asume que se resuelve
  aparte, no lo genera.
- Migración automática de saves/crónicas viejas a un formato "enriquecido" —
  el enfoque es que el código viejo siga funcionando con datos viejos, no
  reescribir datos viejos.
- Cualquier contenido del documento no cubierto arriba (queda tal como está:
  ya implementado en las fases 1-3 previas).
