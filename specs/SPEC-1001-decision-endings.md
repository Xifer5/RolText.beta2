# SPEC-1001 Finales según decisiones

## Objetivo

Que el final refleje CÓMO jugaste, no solo que ganaste (rejugabilidad real: otra moral → otro final). De paso activa una feature dormida: `#endingModal` existía pero **ningún código lo abría**, no se rellenaban sus stats y `mainQuestCompleted` nunca se ponía a true.

## Reglas

- **js/endings.js**: `MORAL_DECISIONS` (7 flags de SPEC-0803/0902 con peso ±1) → `computeEndingTone` (light ≥ +2, dark ≤ −2, gray en medio) → `getEndingContent` (claves de título/texto + recap de decisiones tomadas).
- **3 finales**: 🌅 Guardián de Aetheria / ⚖️ Un alma gris / 🌑 El precio del poder — título y epílogo propios EN/ES.
- **Recap "El mundo recuerda"**: lista de las decisiones morales de la partida (o "casi sin dejar huella").
- **combat.js**: al caer dragon_king → `mainQuestCompleted = true` + `showEnding()` tras la cascada del epílogo (7.8s).
- Los flags mecánicos (echo_intro_done, merchant_bought…) no puntúan.
- Sin `data-i18n` en título/mensaje del modal (JS los pinta; translatePage los pisaría).

## Criterios De Aceptacion

- [x] Tono correcto por combinación de flags; opuestas se cancelan (tests)
- [x] Recap = exactamente las decisiones tomadas; vacío → "sin huella" (tests)
- [x] Flags mecánicos no afectan (test)
- [x] Claves i18n de los 3 finales + 8 recaps en EN y ES (test)
- [x] QA en vivo 11/11: los 3 finales contra el Rey Dragón real, stats rellenadas, mainQuestCompleted, cierre del modal
- [x] Suite 114/114; 0 errores de consola
