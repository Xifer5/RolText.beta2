# SPEC-1110 Más feedback emocional en UI

## Objetivo

Item #10 (último) del roadmap del usuario: reforzar el feedback emocional de momentos clave del combate y la exploración — críticos, resistencias, decisiones importantes, subir de nivel, entrar a un jefe y vencerlo — sin agregar mecánicas nuevas, solo hacer más legibles/celebradas las que ya existen.

## Contexto

Investigación previa (agente Explore) contra los 6 puntos del roadmap del usuario encontró que el "indicador de peligro de zona" (sistema de risk-chip) ya estaba completo desde antes de esta sesión. Los otros 6 puntos iban de completamente ausentes (toast de decisión, badge de modificadores, flash de jefe, recap de victoria de jefe de zona) a parcialmente cubiertos (texto flotante de crítico/curación ya existía, pero no resistido/vulnerable ni resaltado en el log; level-up usaba el mismo estilo genérico que cualquier otro texto flotante).

## Decisiones (confirmadas con el usuario, todas "(Recomendado)")

1. **Un solo spec para las 6 brechas restantes**, siguiendo el mismo ritmo de "resolver todo de una pasada" que el resto de la sesión (ej. SPEC-1101 hizo los 7 jefes de una vez).
2. **El flash de "preparación de jefe" es no-bloqueante (~1.4s)**, no un modal de click-para-continuar — un jefe de zona puede repetirse varias veces por partida y un modal ahí sería friction, no drama.
3. **"Decisión importante" = exactamente los flags ya curados en `MORAL_DECISIONS`** (`endings.js`) — se reusa la misma lista que ya alimenta el tono del final, en vez de inventar una segunda taxonomía de "qué es importante".

## Diseño

### 1. Texto flotante diferenciado por resultado (`js/combat.js`, `styles-m3.css`)

Nuevo helper `damageFloatType(isCrit, damageType, resistances)` justo después de `resistancesFor()`: devuelve `"critical"` > `"vulnerable"` (resistencia ≤ -20) > `"resisted"` (resistencia ≥ 20) > `""` (normal) — mismo umbral ±20 que ya usa `resistanceAdviceFor()` para el consejo táctico, así el efecto visual solo dispara cuando el consejo ya lo señala. Se pasa como 6º argumento (`type`) a `showFloatingText()` en `playerAttack()`, `playerMagic()` y `useSkill()`. Cuando `type` es truthy, `showFloatingText()` ya omite el color/tamaño inline (comportamiento preexistente) para que la clase CSS `.floating-text.<type>` mande.

CSS nuevo: `.floating-text.resisted` (gris apagado) y `.floating-text.vulnerable` (naranja con glow) — `.critical` y `.heal` ya existían.

### 2. Log de combate resalta críticos (`js/combat.js`, `styles-m3.css`)

`addMessage()` ya acepta cualquier string como `type` sin validación (usado directo como clase `msg-${type}`). `playerAttack()`/`playerMagic()` ahora pasan `isCrit ? "combat-crit" : "combat"` en vez de siempre `"combat"`. Nueva regla `.msg-combat-crit` (borde izquierdo + fondo rojo tenue) — cero cambios en `addMessage()` mismo.

### 3. Animación dedicada de level-up (`js/combat.js`, `styles-m3.css`)

`levelUp()` pasa `"levelup"` como tipo. Nueva `@keyframes floatLevelUp`, **exactamente 1.1s**: `showFloatingText()` borra el elemento a los 1100ms sin importar la duración de la animación CSS (constante hardcodeada preexistente, no tocada) — cualquier animación más larga se corta a mitad de camino. Confirmado antes de probarlo en vivo, no descubierto por accidente.

### 4. Toast de decisión importante (`js/travelEvents.js`, `js/endings.js` ya tenía la lista, `styles-m3.css`)

`showTravelEvent()` es el único renderer genérico de modal reusado también por `echoIntro.js` y `rivalArc.js` — el hook se puso ahí una sola vez y cubre los tres orígenes gratis. Antes de ejecutar `choice.apply()`, se toma una foto de qué flags de `MORAL_DECISIONS` ya estaban marcados; después de ejecutar, cualquier flag que pasó de `false`/`undefined` a `true` dispara `showToast(t(d.recapKey), "decision")`. Los flags propios de `rivalArc.js` (`rival_score`, `rival_resolved_*`) no están en `MORAL_DECISIONS`, así que no disparan toast — correcto, esa relación es deliberadamente independiente del tono narrativo general.

Nuevo tipo de toast `"decision"` (borde violeta) sumado a los ya existentes `success`/`error`/`warn`.

### 5. Badge de modificadores de partida activos (`index.html`, `js/ui.js`, `styles-m3.css`)

Antes los modificadores (`fog`/`cruel`/`scarce`, `js/modifiers.js`) solo se veían en la pantalla de creación de personaje y en la crónica final — durante la run misma no había recordatorio visual. Nuevo `#modifier-badge` dentro de `#location-hero`, poblado por `updateModifierBadge()` (llamada desde el mismo bloque de `updateUI()` que ya pinta el risk-chip de la subtítulo de zona) con el emoji de cada `activeModifiers(gameState)`; oculto vía `.hidden` si no hay ninguno activo.

**Bug de especificidad CSS encontrado y corregido en vivo**: `[data-tooltip] { position: relative }` (regla global preexistente para el sistema de tooltips) tiene la misma especificidad que `.modifier-badge { position: absolute }` y está declarada más abajo en el archivo — sin desambiguar, ganaba por orden de aparición y el badge quedaba posicionado en flujo normal cerca del topbar en vez de anclado a `#location-hero`. Corregido subiendo la declaración de `position`/`bottom`/`right` a un selector `#modifier-badge` (especificidad de id, gana sin depender del orden).

### 6. Flash de preparación de jefe (`index.html`, `js/combat.js`, `styles-m3.css`)

Nuevo `#boss-flash-overlay` (hijo directo de `<body>`, `position:fixed; inset:0; pointer-events:none`), activado en `startCombat()` cuando `isBoss` justo después del mensaje/floating-text de alerta ya existentes. `@keyframes bossFlash` (1.4s): destello rojo desde el borde de la pantalla hacia adentro (`box-shadow: inset`) que sube y decae — no bloquea clics ni interrumpe el flujo de combate, que arranca normalmente en paralelo.

### 7. Recap ceremonial de victoria sobre jefe de zona (`js/combat.js`, `js/i18n.js`, `styles-m3.css`)

En el bloque `if (enemy.isBoss)` de `endCombat()` (ya dispara `recordBossKill()` + guardado + toast `victorySaved`), nueva condición `!enemy.isMiniBoss && enemy.id !== "dragon_king"` — excluye mini-bosses (perdonables, flujo propio de SPEC-1104) y al Rey Dragón (que ya tiene su propio epílogo extenso con `setTimeout`s encadenados). Dispara `showToast(t('zoneBossVictoryToast', {enemy: enemy.type}), "boss")` 1.6s después del golpe final, dando tiempo a que el mensaje de muerte del jefe y el toast de guardado se procesen primero. Nuevo tipo de toast `"boss"` (borde/fondo dorado, negrita).

## Criterios de aceptación

1. [x] Ataque normal/crítico/resistido/vulnerable producen 4 clases CSS distintas en el texto flotante — verificado en vivo forzando cada resultado
2. [x] Log de combate resalta visualmente (`msg-combat-crit`) solo las líneas de daño crítico — verificado en vivo (2+ críticos consecutivos con estilo distinto al resto)
3. [x] Level-up usa animación propia, nunca se corta a mitad (duración CSS ≤ 1100ms) — verificado en vivo
4. [x] Elegir una opción que marca por primera vez un flag de `MORAL_DECISIONS` dispara un toast de decisión — verificado en vivo con el evento "Un enemigo herido" → "Dejarlo ir"
5. [x] Badge de modificadores visible y correctamente anclado a `#location-hero` durante toda la run cuando hay ≥1 modificador activo, oculto si no hay ninguno — verificado en vivo tras corregir el bug de especificidad CSS
6. [x] Al entrar a combate con `isBoss=true`, el overlay de flash se activa (`.active`) y se desactiva solo tras ~1.4s, sin bloquear los botones de combate — verificado en vivo
7. [x] Vencer un jefe de zona (no mini-boss, no Rey Dragón) dispara el toast dorado de recap; vencer un mini-boss o al Rey Dragón NO lo dispara — verificado en vivo (mutation observer capturando la clase `simple-toast-boss`)
8. [x] Suite completa en verde (199/199, sin tests nuevos — todo lo de esta spec es DOM-entangled en `combat.js`/`travelEvents.js`/`ui.js`, mismo precedente ya aceptado desde SPEC-1101 de no testear unitariamente ese código)

## Fuera de alcance
- Sonido dedicado para cada nuevo tipo de feedback (crítico/resistido/vulnerable/decisión/jefe) — se reusa el set de sonidos existente (`playSound("loot")` etc.), sin encargar/integrar audio nuevo.
- Historial o contador de "decisiones importantes tomadas" visible en algún panel — el toast es efímero, la persistencia real sigue siendo únicamente los flags de `worldFlags` que ya alimentan el final.
- Feedback emocional equivalente para el Rey Dragón (climax final) — ya tiene su propio epílogo narrativo extenso preexistente, deliberadamente no tocado ni "mejorado" con las mismas piezas genéricas de esta spec.
