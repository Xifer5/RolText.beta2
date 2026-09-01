// SPEC-1219 (Fase 2 del plan docs/PLAN-HISTORIA-FASE4.md) — Eryndel pierde
// memoria con cada jefe de zona vencido. Reusa gameState.stats.enemiesDefeated
// (bestiary.js ya lo lleva vía recordEnemyKill()) en vez de un contador
// propio: cero estado nuevo que guardar/cargar, cero riesgo de compatibilidad.
// Cuenta solo los 7 jefes de ZONA (no mini-bosses/Kestrel/Valdris/dragon_king,
// que bestiary.js también marca como "boss" pero no son a lo que se refiere
// "con cada boss que despierta" del documento).
const ZONE_BOSS_IDS = [
  "forest_titan", "cave_devourer", "mountain_colossus",
  "ancient_construct", "swamp_abomination", "frost_wyrm", "inferno_dragon"
];

export function zoneBossesDefeatedCount(gameState) {
  const defeated = gameState?.stats?.enemiesDefeated ?? {};
  return ZONE_BOSS_IDS.filter(id => defeated[id] > 0).length;
}

/** Clave i18n para la línea de memoria de Eryndel según cuántos jefes de
 *  zona ya cayeron, o null si todavía no venció ninguno (nada que decir). */
export function eryndelMemoryKey(gameState) {
  const n = zoneBossesDefeatedCount(gameState);
  if (n <= 0) return null;
  if (n <= 2) return "eryndelMemory1";
  if (n <= 4) return "eryndelMemory2";
  if (n <= 6) return "eryndelMemory3";
  return "eryndelMemory4";
}
