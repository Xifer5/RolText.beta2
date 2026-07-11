# SPEC-0904 Lectura táctica del combate — recomendación contextual

## Objetivo

Que el intent (SPEC-0802) y las resistencias (SPEC-0601+) produzcan decisiones, no solo información: el juego sugiere la respuesta táctica sin añadir botones nuevos (decisión fijada con el usuario: sin botón "Defender" en este sprint).

## Cambios

- **Consejo por intent** (`ui.js` + CSS `.enemy-intent-advice`): línea bajo el chip según la acción telegrafiada — golpe fuerte ("cúrate ahora o remátalo antes"), magia, curación, furia, guardia. Ataque normal y status no aconsejan (sin ruido); intent oculto (jefe ❓) jamás.
- **Consejo por resistencia** (`combat.js`): `resistanceAdviceFor(enemyId, tipo)` pura — si el golpe fue resistido ≥20%, recomienda la vulnerabilidad concreta del enemigo ("Resiste Cortante — pero es vulnerable a Fuego") o, sin vulnerabilidad, cambiar de tipo. Una sola vez por combate (`_resAdviceShown` en currentEnemy). Enganchada en ataque, magia y skills.
- `damageTypes.js`: `getWeakestResistance()` pura; i18n: 7 claves EN/ES.

## Criterios De Aceptacion

- [x] getWeakestResistance: mínimo gana, vulnerabilidades primero, vacío → null (test)
- [x] resistanceAdviceFor sobre datos reales: vuln → tipo concreto; sin vuln → genérico; <20% → null (tests)
- [x] INTENT_ADVICE_KEYS: acciones válidas de ACTION_META + claves i18n EN/ES; attack/unknown sin consejo (test)
- [x] QA en vivo 8/8: consejos por intent, sin ruido en ataque normal ni jefes ocultos, aviso de resistencia una sola vez con la vulnerabilidad correcta (slime: Cortante→Fuego)
- [x] Suite 108/108; 0 errores de consola
