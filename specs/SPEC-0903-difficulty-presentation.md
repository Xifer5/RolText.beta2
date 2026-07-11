# SPEC-0903 Presentación de dificultad — efectos concretos en charselect

## Objetivo

Que elegir dificultad sea una decisión informada: junto a la descripción de sabor, mostrar los efectos reales ("+40% vida, +30% daño · +20% XP, +10% oro") derivados de los multiplicadores — nunca copy manual que pueda desincronizarse del balance.

## Cambios

- `difficulty.js`: `name`/`description` bilingües `{en,es}`; nueva `getDifficultyEffects(cfg)` pura que deriva porcentajes de los multiplicadores (única fuente de verdad) con flag `standard` para easy
- `charselect.js`: línea `#diffEffects` bajo la descripción, actualizada al cambiar de chip; nombre y descripción localizados
- i18n: `diffStandardLine`, `diffEffectsLine` EN/ES; CSS `.diff-effects`

## Criterios De Aceptacion

- [x] Los porcentajes salen de los multiplicadores reales (test: adventure = +40/+30/+20/+20/+10)
- [x] easy anuncia "estándar" sin números (test + QA)
- [x] Nombre/descripción bilingües en las 4 dificultades (test)
- [x] QA en vivo 6/6 (las 4 dificultades + EN); suite 102/102
