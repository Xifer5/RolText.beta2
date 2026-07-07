# SPEC-0801 Primeros 5 minutos — onboarding contextual

## Objetivo

Un jugador nuevo entiende movimiento, misiones, combate, inventario y descanso/guardado en su primera sesión sin leer documentación. Hoy (`js/main.js:54-62`) tras el cómic de intro y elegir clase solo recibe `adventureBeginMessage` en el log y queda en Oakhaven sin ninguna dirección: no sabe que Elara tiene la primera misión, ni cómo moverse, ni qué hacer al conseguir botín.

## Contexto

- Archivos relevantes: `js/onboarding.js` (nuevo), `js/main.js`, `js/movement.js`, `js/combat.js`, `js/quests.js`, `js/ui.js`, `js/toast.js`, `js/i18n.js`, `styles-m3.css`, `index.html`
- Estado actual: existen hints de combate (SPEC-0101), chips de riesgo (SPEC-0105), acciones contextuales del hero (SPEC-0202), key-hint badges — pero falta el hilo conductor de la primera sesión
- Riesgo principal: fastidiar al jugador veterano en cada partida nueva → mitigado con persistencia por dispositivo (localStorage, fuera del save) y toggle en el menú
- Decisiones fijadas con el usuario (2026-07-07): D1 = hints contextuales no bloqueantes; D2 = solo 1ª vez por dispositivo, reactivable desde menú; D3 = cobertura completa de los 5 puntos

## Flujo Principal

1. Punto de entrada: al cerrar la selección de clase (callback en `main.js`), con localStorage limpio.
2. Acción del jugador: juega con normalidad; cada "primera vez" (moverse, hablar, aceptar misión, combatir, lotear, volver herido a town) dispara su hint.
3. Feedback inmediato: tarjeta M3 tipo snackbar persistente (💡 + texto + botón "Entendido"), una a la vez con cola; el control relevante se resalta con anillo pulsante.
4. Resultado persistido: cada hint visto se marca en `localStorage["pqe.onboarding.v1"]`; nunca se repite.
5. Recuperación: si localStorage no está disponible (modo privado), los hints se muestran en la sesión pero no persisten — el juego nunca falla por ello.

## Reglas De Gameplay

- Los hints NUNCA bloquean input: se puede mover, combatir y abrir modales con un hint visible.
- Un solo hint visible a la vez; los demás esperan en cola.
- Secuencia (6 hints que cubren los 5 puntos):

| # | Paso | Trigger | Contenido |
|---|------|---------|-----------|
| 1 | `welcome_move` | Al cerrar selección de clase (`main.js`) | Cómo moverse (botones/WASD) + "explora Oakhaven" |
| 2 | `talk_elara` | ~2s después del paso 1, estando en town | Señala el botón **Hablar**: Elara la Vidente tiene una misión (mq_01) |
| 3 | `quest_tracker` | Al aceptar la primera misión (`activateQuest`, `js/quests.js`) | Quest tracker y dónde ver objetivos |
| 4 | `first_combat` | Primer `startCombat` (`js/combat.js:108`) | Atacar/magia/skills, hints de daño, HP enemiga, huir |
| 5 | `first_loot` | Primera victoria con botín (`endCombat`, `js/combat.js:527`) | Abrir inventario y equipar |
| 6 | `rest_save` | Primer regreso a town con HP < max (o tras paso 5) | Descansar recupera HP/MP + cómo guardar |

- Edge cases: recargar a mitad de secuencia no repite hints vistos; el paso 2 solo dispara si el jugador sigue en town; si el jugador entra en combate antes de hablar con Elara, el paso 4 se muestra igual (los pasos son independientes, el orden es el natural pero no forzado).

## UX/UI

- Superficies: tarjeta snackbar anclada abajo, contenedor propio (no comparte el de toasts para no competir con la cola de logros).
- Estados: default (visible con ancla resaltada), dismissed (Entendido), disabled (toggle OFF en menú), empty (sin hints pendientes = nada).
- Copy visible: ~14 claves i18n nuevas EN/ES (`onbWelcomeMove`, `onbTalkElara`, `onbQuestTracker`, `onbFirstCombat`, `onbFirstLoot`, `onbRestSave`, `onbGotIt`, `onbMenuLabel`, …).
- Accesibilidad: `role="status"` + `aria-live="polite"`, sin robo de foco, botón "Entendido" alcanzable con Tab y ≥44px.

## Material 3

- Tokens: `--md-surface-container-high`, `--md-primary`, `--md-on-surface`, elevación 3, radius 12px.
- Componentes: snackbar-card con acción; anillo pulsante `.onb-highlight` sobre el control ancla.
- Motion: entrada/salida con los tokens de motion del proyecto; el pulso respeta `prefers-reduced-motion`.
- Tema claro/oscuro: legible en ambos (tokens, no colores fijos).
- Regla crítica intacta: no toca `#location-img` ni `#enemy-portrait` (siempre `style.display`).

## Responsive

- Mobile 390x844: card sobre la bottom nav, ancho 100% − 16px; en combate no tapa los botones de acción; anclas del HUD móvil funcionan.
- Tablet 768x1024: igual que desktop.
- Desktop 1440x900: card abajo-derecha dentro de `#screen`, sin solapar los toasts.

## Datos Y Contratos

- Estado leído: `gameState.player.class`, ubicación actual, estado de combate, HP.
- Estado escrito: SOLO `localStorage["pqe.onboarding.v1"]` = `{ enabled: bool, seen: { stepId: true } }` — cero cambios en el save (compatible con multi-save, ítem 5 del sprint).
- Eventos usados: llamadas de 1-2 líneas a `maybeShowHint(stepId)` desde `main.js`, `quests.js`, `combat.js`, `movement.js`.
- Persistencia: por dispositivo; el toggle del menú resetea `seen` al reactivar.

## Criterios De Aceptacion

- [x] Jugador nuevo (localStorage limpio) ve el hint 1 al terminar de elegir clase y los 6 hints se disparan en su momento, cada uno exactamente una vez
- [x] Recargar la página a mitad de secuencia no repite hints ya vistos
- [x] Con onboarding completo, empezar partida nueva no muestra ningún hint
- [x] El menú permite reactivar los consejos; al reactivar, la secuencia funciona de nuevo
- [x] Los hints nunca bloquean input ni roban foco
- [x] En combate móvil (390x844) el hint no tapa los botones de acción
- [x] 0 errores de consola; `node --test` pasa con los tests nuevos
- [x] EN y ES completos

## Gherkin

```gherkin
Feature: Onboarding contextual de primera sesión
  Scenario: Camino principal
    Given un dispositivo sin la clave pqe.onboarding.v1
    When el jugador termina de elegir clase
    Then ve el hint de movimiento con botón "Entendido"
    And al pulsar Entendido y seguir en town ve el hint de hablar con Elara
    And al aceptar mq_01 ve el hint del quest tracker
    And en su primer combate ve el hint de combate
    And tras su primera victoria con botín ve el hint de inventario
    And al volver a town herido ve el hint de descanso y guardado
    And ninguno de los seis vuelve a aparecer jamás en ese dispositivo

  Scenario: Veterano
    Given pqe.onboarding.v1 con los 6 pasos vistos
    When empieza una partida nueva
    Then no aparece ningún hint

  Scenario: Reactivación
    Given el toggle "Consejos de novato" en OFF o completado
    When el jugador lo reactiva desde el menú
    Then la secuencia de hints vuelve a dispararse
```

## Plan De Implementacion

- [x] `js/onboarding.js` — lógica pura (registro de pasos, seen-state, once-only, reset) separada del render para testear sin DOM
- [x] Render de la card + highlight + cola en el mismo módulo (parte DOM)
- [x] CSS M3 en `styles-m3.css` (card, highlight, responsive, reduced-motion)
- [x] Triggers: `main.js`, `quests.js`, `combat.js` (×2), `movement.js`
- [x] ~14 claves i18n EN/ES en `js/i18n.js`
- [x] Ítem de menú toggle en `index.html` + `js/events.js`/`js/ui.js`
- [x] `tests/onboarding.test.mjs`

## Verificacion

- [x] Smoke manual desktop
- [x] Smoke manual movil
- [x] Sin errores en consola
- [x] Sin texto solapado/cortado
- [x] No se rompio guardado/carga (no toca el save)
