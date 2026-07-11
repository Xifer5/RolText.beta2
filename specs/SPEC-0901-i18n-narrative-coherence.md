# SPEC-0901 Localización y coherencia narrativa

## Objetivo

Cerrar las fugas de idioma y unificar los nombres del mundo detectados en el segundo review externo (2026-07-11), y dejar un test que impida que vuelvan.

## Contexto

- Review externo verificado: 3 claims ciertos (Aetheria/Aethoria, "Dragon King" en ES, localMapLabel sin clave), 2 desactualizados (styles.css/script.js ya borrados en Sprint 1; story log móvil sí certificado por QA)
- El canon es **Aetheria** (HISTORIA.md, INTRO.md, js/intro.js); "Aethoria" era typo
- `t()` devuelve la clave cruda cuando falta → `localMapLabel` se veía literal en la UI al traducir

## Cambios

- `js/achievements.js`, `js/npcs.js`, `js/quests.js`: Aethoria → Aetheria (6 usos)
- `js/bestiary.js` (×2), `js/journal.js` (×2), `js/i18n.js` endingMessage ES: "Dragon King" → "Rey Dragón" (los ítems y claves dragonKing* ya estaban bien)
- `js/i18n.js`: clave `localMapLabel` EN/ES + `dictionaries` exportado para tests

## Tests (tests/i18n.test.mjs)

- [x] Toda `data-i18n` de index.html tiene clave en EN y ES
- [x] Paridad exacta de claves entre diccionarios EN y ES
- [x] "Aethoria" no existe en los módulos de contenido
- [x] Ninguna cadena ES contiene "Dragon King"
- [x] Suite completa 90/90
