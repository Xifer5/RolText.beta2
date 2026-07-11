# SPEC-0805 Multi-save — 3 ranuras manuales + autoguardado separado

## Objetivo

Que el jugador pueda mantener varias partidas (rejugar con otra clase/dificultad sin perder la principal) y que el autoguardado deje de pisar el guardado manual: hoy hay UNA clave (`pixelQuestSave`) y el autosave de level-up/victoria sobrescribe lo que el jugador guardó a mano.

## Contexto

- Archivos: `js/saveSystem.js`, `js/saveSlotsModal.js` (nuevo), `js/events.js`, `js/ui.js`, `index.html`, `styles-m3.css`, `js/i18n.js`, `tests/saveSlots.test.mjs` (nuevo)
- Decisiones fijadas con el usuario (2026-07-11): 3 slots manuales + 1 slot de autosave separado; UI modal desde el menú principal; migración automática del save actual a la ranura 1
- Riesgo principal: compatibilidad — el save legacy debe migrar sin pérdida y los autosaves existentes (combat.js, specModal.js) no deben cambiar de firma

## Reglas

**Almacenamiento**: claves `pixelQuestSave.auto|slot1|slot2|slot3`. La clave legacy `pixelQuestSave` migra a `slot1` la primera vez que se toca el sistema (si slot1 está vacía; después se elimina la legacy).

**API** (`saveSystem.js`):
- `SAVE_SLOTS`, `readSlot(id)`, `listSlots()`, `latestSlotId()`, `saveToSlot(id)`, `loadFromSlot(id)`, `deleteSlot(id)`
- Compat sin tocar callers: `saveGame()` → `saveToSlot("auto")` (autosaves de combat/specModal); `loadGame()` → carga la ranura más reciente ("Continuar"); `hasSavedGame()` → alguna ranura ocupada
- `loadFromSlot` conserva el merge defaults-primero y la migración de `permanentHpBonus`

**UI** (`#saveSlotsModal`, dos modos):
- "Guardar" abre el modal en modo save: botón Guardar por ranura (el slot Auto bloqueado — lo escribe el juego); sobrescribir pide `confirm()`
- "Cargar" abre en modo load: ranuras vacías deshabilitadas
- ✕ por ranura ocupada con `confirm()` (sustituye al botón global "Borrar partida", que se elimina del menú)
- Meta por ranura: emoji clase, nombre de clase, nivel, oro y fecha; "— Vacía —" si no hay
- aria-modal + focus trap gratis (focusTrap.js observa cambios de clase); copy bilingüe vía i18n

## Criterios De Aceptacion

- [x] El save legacy migra a slot1 y la clave vieja desaparece; si slot1 ya existe, la legacy se descarta (tests)
- [x] `saveGame()` escribe SOLO en auto; guardar a mano en slotN no toca auto (tests)
- [x] `latestSlotId()` elige la ranura con timestamp más reciente; "Continuar" carga esa (tests)
- [x] Roundtrip por ranura: guardar → reset → cargar restaura el estado completo (tests)
- [x] `deleteSlot` borra solo su ranura (tests)
- [x] `node --test` pasa; 0 errores de consola; QA en vivo del flujo completo

## Plan De Implementacion

- [x] `saveSystem.js` — slots + migración legacy + compat
- [x] `saveSlotsModal.js` + `index.html` + CSS + i18n EN/ES
- [x] `events.js` (botones) y `ui.js` (updateSaveInfo multi-slot)
- [x] `tests/saveSlots.test.mjs` + QA Playwright
