# SPEC-1002 Rasgos de origen — quién eras antes de la aventura

## Objetivo

Rejugabilidad desde el minuto cero: 3 orígenes en la creación de personaje que dan un bono mecánico pequeño, marcan un `worldFlag` y se *sienten* durante el viaje con un evento propio.

## Reglas (js/origins.js)

| Origen | Bono | Extra | Evento único en ruta |
|---|---|---|---|
| 🏜️ Exiliado | +2 AGI | +1 poción de salud | "Huellas conocidas" (campamento de exiliados) |
| 📜 Aprendiz | +2 INT | +1 poción de maná | "Notas al margen" (runa de tu maestro) |
| 🪙 Mercenario | +2 STR | +30 oro | "Un viejo contrato" (deuda del gremio) |

- `applyOrigin(state, id)` se aplica en charselect ANTES de recalcular máximos (los stats de origen cuentan para maxHp/maxMp derivados).
- Chips `role=radiogroup` reutilizando el estilo de los de dificultad (`.origin-chip` comparte selectores con `.diff-chip`); exiliado por defecto; descripción bajo los chips.
- Eventos de origen: `condition` por flag + flag `_seen` (una vez por partida), SIN `followUp` (conviven con el pool normal, sin prioridad).
- `player.origin` y los flags persisten gratis en el save; saves viejos sin origen funcionan igual.

## Criterios De Aceptacion

- [x] 3 orígenes bilingües con bono/flag/presentación (test)
- [x] applyOrigin aplica stats, ítems, oro y flag; id desconocido no toca nada (tests)
- [x] Evento de origen elegible solo con su flag y una sola vez; sin prioridad de follow-up (tests)
- [x] El bono entra en los máximos derivados (test +2 STR → +4 maxHp)
- [x] QA en vivo 10/10: chips, descripción, creación mercenario (oro 80, HUD 142/142), evento en pool, persistencia
- [x] Suite 121/121; 0 errores de consola
