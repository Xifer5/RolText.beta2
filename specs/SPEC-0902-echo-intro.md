# SPEC-0902 "El eco del bosque" — primeros 5 minutos como mini-aventura

## Objetivo

El "momento wow" temprano que pedía el segundo review: en la primera visita a forest_1 (objetivo de mq_01), el jugador vive una escena guionizada de 3 actos donde **entiende** (intent enemigo), **decide** (dilema moral persistente) y **recuerda** (recompensa que abre su build).

## Contexto

- Decisión fijada con el usuario (2026-07-11): antesala de mq_01, sin tocar la cadena canon de misiones
- La escena ata el título del juego (Echoes) al canon (el mundo es el sueño del dragón): el eco es un fragmento vivo del sueño
- Reutiliza infraestructura existente: modal de eventos (SPEC-0803), worldFlags, intent (SPEC-0802), onboarding (SPEC-0801)

## Los 3 actos (js/echoIntro.js)

1. **"Un eco que se apaga"** — primera llegada a forest_1 (suprime encuentro/evento aleatorio): un eco herido entre zarzas. **Liberarlo** (nada ahora; el bosque "toma nota") o **absorberlo** (+30 XP ya; "el bosque se enfría"). Flags: `echo_freed`/`echo_absorbed` + `echo_intro_done`.
2. **Combate guionizado** — al cerrar el modal (`pixel:travelEventClosed`, nuevo), el lobo que cazaba al eco ataca (behavior aggressive → telegrafia golpes fuertes). Mensaje narrativo + consejo del intent + hint de onboarding `enemy_intent` (nuevo, ancla #enemy-panel).
3. **"El sueño toma forma"** — al vencer (hook `consumeEchoReward()` en endCombat; si huyes, la recompensa te alcanza en la siguiente victoria): la esquirla del sueño se convierte en **filo** (iron_sword/Fuerza), **foco** (staff/Magia) o **anillo** (ring_agility/Agilidad).

## Consecuencias persistentes (TRAVEL_EVENTS)

- `echo_freed` → **"El bosque recuerda"**: el eco sano regresa; +1 poción +30 XP o +40 XP
- `echo_absorbed` → **"Un silencio en el bosque"**: el claro apagado; +25 XP reflexión o nada
- Ambos resuelven con `echo_resolved` (una sola vez, prioridad de follow-up)

## Criterios De Aceptacion

- [x] La escena dispara solo en forest_1 y solo una vez (test + QA)
- [x] Ambas decisiones marcan flags y arman el combate; absorber da +30 XP (tests)
- [x] Victoria → recompensa una sola vez; cada forma da su ítem (tests)
- [x] Follow-ups por rama con prioridad y resolución única (tests)
- [x] Flags sobreviven save/load (test)
- [x] QA en vivo 15/15: escena completa, hint de intent mostrado, sin repetición
- [x] Suite 99/99; 0 errores de consola
