/**
 * combat.js — Orquestador de combate
 *
 * Modularizado post SPEC-1110 (ver errores/registro_de_errores.md /
 * project_polish_sprint en memoria): este archivo quedó como el núcleo
 * (arranque de combate, resolución del turno enemigo, daño/buffs base) y
 * delega subsistemas a:
 *   - combatFeedback.js       → notas de resistencia, floating-text, maestría, Último Aliento
 *   - combatRewards.js        → fin de combate: XP/oro/loot/level up
 *   - bossMechanics.js        → telegraph de bosses (devorar/sobrecarga/congelar) + guardia de raíces
 *   - enemyTraits.js          → rasgos aleatorios de enemigo (furioso/ladrón/antiguo/regenerador/cobarde)
 *   - playerCombatActions.js  → Atacar/Magia/Defender/Interrumpir/Perdonar/Huir/skills
 *
 * Varias de estas dependencias son circulares a propósito (combat.js
 * exporta applyDamageToEnemy/tickBuffs/enemyTurn, que los otros módulos
 * importan; combat.js a su vez importa sus funciones para setupCombat()).
 * Es seguro: todas las llamadas cruzadas ocurren dentro de cuerpos de
 * función invocados en tiempo de juego, nunca en la evaluación top-level
 * de un módulo.
 */
import { gameState } from "./state.js";
import { enemyData } from "./enemies.js";
import { calculateTotalStats } from "./stats.js";
import { addMessage } from "./story.js";
import { updateUI, showFloatingText, shakeScreen } from "./ui.js";
import { t, formatText, pickVariant } from "./i18n.js";
import { playSound, playMusic } from "./sounds.js";
import { getDifficultyConfig } from "./difficulty.js";
import { getActiveSpec } from "./specializations.js";
import { maybeShowHint } from "./onboarding.js";
import { decideNextAction, isIntentHidden, POWER_ATTACK_MULT, DEFEND_DAMAGE_MULT, REGEN_PCT, ENRAGE_ATK_MULT } from "./enemyAI.js";
import { cruelAtkMult, isIntentAlwaysHidden } from "./modifiers.js";
import { recordRun } from "./runLog.js";
import { isMiniBossId } from "./biomeBosses.js";
import { applyResistance, ENEMY_COMBAT_DATA, PHYSICAL_TYPES } from "./damageTypes.js";
import { getBiome } from "./biomes.js";
import { isEnemyAvailable, applyTimeModifiers } from "./timeOfDay.js";

import { delay, tryLastBreath, resistanceAdviceFor } from "./combatFeedback.js";
import { endCombat } from "./combatRewards.js";
import { showGameOver } from "./endings.js";
import { checkCowardFlee, assignRandomTrait } from "./enemyTraits.js";
import { rollForcedBossAction, updateBossPhase, resolveDevour, resolveOverload, resolveFreezeMagic, playerBreakGuard } from "./bossMechanics.js";
import { playerAttack, playerMagic, playerDefend, playerDodge, playerInterrupt, playerSpare, useSkill, tryFlee } from "./playerCombatActions.js";
import { computeDodgeChance, isTacticalDifficulty, DODGEABLE_ACTIONS } from "./dodge.js";
import { useTechnique } from "./techniqueActions.js";
import { currentPassives } from "./weaponTechniques.js";
import {
  getArchetype, archetypeScale, wreckerDefendMult, skirmisherDodgeBonus, guardianReflect, channelerMult,
  pyromancerBurnDamage, dousesPyromancer, frostDodgePenalty, cryomancerAppliesFrost, fireDispelsFrost, FROST_TURNS,
  drainerHeal, stormUndodgeable, stormDefendMult, archetypeStatus, statusChanceMult, statusExtraTurns, STUN_IMMUNITY_TURNS
} from "./archetypes.js";

// Re-exportado: tests/combatAdvice.test.mjs y cualquier otro consumidor
// externo lo importan desde "./combat.js" (API pública histórica).
export { resistanceAdviceFor };

// SPEC-1101: veneno acumulativo — tope de stacks (Swamp Abomination y cualquier
// otro enemigo con status "poison" ya se benefician del mismo sistema).
const POISON_MAX_STACKS = 5;
// SPEC-1101: Forest Titan — guardia de raíces (reduce daño físico entrante 60%)
const GUARD_DAMAGE_MULT = 0.4;
// SPEC-1102: icono/label/color por tipo de debuff de jugador (tick de daño)
const DEBUFF_TICK_META = {
  poison: { icon: "☠️", label: "Veneno",     color: "#4ade80" },
  burn:   { icon: "🔥", label: "Quemadura",  color: "#fb923c" },
  bleed:  { icon: "🩸", label: "Sangrado",   color: "#f87171" },
};
// SPEC-0602: debuffs sin tick de daño — se decrementan en processPlayerDebuffs()
// y actúan en otro punto (debilidad: enemyTurn; ceguera: playerAttack/playerMagic).
const WEAKNESS_DAMAGE_MULT = 1.25;
export const NON_DOT_DEBUFFS = ["weakness", "blind"];
// SPEC-1102: contraataque universal vía Defender (independiente del bono de Duelista)
const DEFEND_COUNTER_CHANCE = 0.3;
const DEFEND_COUNTER_DMG_MULT = 0.5;

// ── Status effects que cada enemigo puede aplicar al jugador ────────
export const ENEMY_STATUS_EFFECTS = {
  slime:             { type: "poison", chance: 0.30, damage: 3,  turns: 2 },
  fungedBeast:       { type: "poison", chance: 0.20, damage: 3,  turns: 2 },
  // SPEC-0602: cave_bat pasa de veneno a sangrado (30% × 2 turnos, perforante)
  cave_bat:          { type: "bleed",  chance: 0.30, damage: 4,  turns: 2 },
  goblin:            { type: "bleed",  chance: 0.25, damage: 3,  turns: 2 },
  wolf:              { type: "bleed",  chance: 0.30, damage: 4,  turns: 2 },
  // SPEC-0602: oscuridad y maldición → debilidad (+25% daño recibido)
  cultist:           { type: "weakness", chance: 0.30, turns: 2 },
  dark_knight:       { type: "weakness", chance: 0.30, turns: 2 },
  diablo:            { type: "weakness", chance: 0.35, turns: 3 },
  // SPEC-0602: ataques oculares psíquicos → ceguera (30% de fallo)
  beholder:          { type: "blind",  chance: 0.35, turns: 2 },
  // SPEC-0602 (ronda 2): más cobertura temática por estado
  cave_bear:         { type: "bleed",  chance: 0.30, damage: 5, turns: 2 },
  chimera:           { type: "bleed",  chance: 0.30, damage: 6, turns: 3 },
  imp:               { type: "weakness", chance: 0.30, turns: 2 },
  sand_worm:         { type: "blind",  chance: 0.30, turns: 2 },
  goblin_shaman:     { type: "burn",   chance: 0.35, damage: 5,  turns: 2 },
  warlock:           { type: "burn",   chance: 0.40, damage: 8,  turns: 3 },
  vampire:           { type: "stun",   chance: 0.25, turns: 1 },
  medusa:            { type: "blind",  chance: 0.35, turns: 2 }, // SPEC-0602: su mirada ciega (antes aturdía)
  lava_golem:        { type: "burn",   chance: 0.35, damage: 8,  turns: 2 },
  Inferno_elemental: { type: "burn",   chance: 0.40, damage: 10, turns: 2 },
  pyro_elemental:    { type: "burn",   chance: 0.45, damage: 10, turns: 2 },
  inferno_dragon:    { type: "burn",   chance: 0.50, damage: 12, turns: 3 },
  dragon_king:       { type: "burn",   chance: 0.45, damage: 15, turns: 3 },
  // SPEC-1101: Swamp Abomination — veneno acumulativo (sistema compartido de
  // stacks); behavior "status" ya le da ~50% de elegir "status" como acción
  // (aplicación garantizada), + este chance en cualquier otra acción.
  swamp_abomination: { type: "poison", chance: 0.30, damage: 6, turns: 3 },
  // SPEC-1102: sangrado — enemigos de garras/hoja cortante (attackDamageType
  // "slash" en damageTypes.js), no acumula stacks (mismo patrón que quemadura).
  jungle_tiger:      { type: "bleed",  chance: 0.35, damage: 5,  turns: 3 },
  pirate_captain:    { type: "bleed",  chance: 0.30, damage: 6,  turns: 3 },
  // SPEC-1219 — Valdris: arcano puro, mismo status que otros hechiceros
  // (vampire) en vez de inventar un efecto nuevo para esta pelea.
  valdris_corrupted: { type: "stun",   chance: 0.25, turns: 1 },
};

// SPEC-1303: estado propio del enemigo, o el que le aporta su arquetipo
// (Envenenador/Aturdidor) si no tiene uno en ENEMY_STATUS_EFFECTS.
function enemyStatus(enemy) {
  return ENEMY_STATUS_EFFECTS[enemy.id] || archetypeStatus(enemy.archetype);
}

export function setupCombat() {
  window.addEventListener("pixel:attack", () => handleAction(playerAttack));
  window.addEventListener("pixel:magic",  () => handleAction(playerMagic));
  window.addEventListener("pixel:defend", () => handleAction(playerDefend));
  window.addEventListener("pixel:dodge",  () => handleAction(playerDodge));
  window.addEventListener("pixel:breakGuard", () => handleAction(playerBreakGuard));
  window.addEventListener("pixel:interrupt", () => handleAction(playerInterrupt));
  window.addEventListener("pixel:spare", () => handleAction(playerSpare));
  window.addEventListener("pixel:flee",   () => handleAction(tryFlee));
  window.addEventListener("pixel:startCombat", (e) => startCombat(e.detail?.enemyId, e.detail?.isBoss, e.detail?.extraMult));
  window.addEventListener("pixel:useSkill", (e) => handleAction(() => useSkill(e.detail?.skillId)));
  window.addEventListener("pixel:useTechnique", (e) => handleAction(() => useTechnique(e.detail?.techId))); // SPEC-1304
}

let busy = false;
async function handleAction(fn) {
  if (busy || !gameState.isInCombat) return;
  busy = true;
  // Stun: player loses this turn
  if (gameState.playerDebuffs?.stun?.turns > 0) {
    gameState.playerDebuffs.stun.turns--;
    if (gameState.playerDebuffs.stun.turns <= 0) {
      delete gameState.playerDebuffs.stun;
      gameState.stunImmune = STUN_IMMUNITY_TURNS + 1; // SPEC-1303: 2 turnos de enemigo sin re-stun
    }
    addMessage(t('combatStunned'), "combat");
    updateUI();
    await delay(600);
    await enemyTurn();
    busy = false;
    return;
  }
  // SPEC-1302: "expuesto" solo dura hasta el siguiente Atacar/Magia
  if (fn !== playerAttack && fn !== playerMagic && gameState.currentEnemy) gameState.currentEnemy.exposed = false;
  await fn();
  busy = false;
}

export function getRandomEncounter(locationId) {
  const loc = window.worldMap?.[locationId];
  if (!loc) return null;
  // Encuentros dinámicos por bioma: además de los enemigos que mapgen.js
  // asignó a esta sala en particular, cualquier enemigo de la lista
  // completa del bioma (biomes.js) también puede aparecer acá. Sin esto,
  // un enemigo objetivo de una misión (ej. "pirate" en kill_pirates) quedaba
  // confinado a la única sala donde el sorteo de mapgen lo hubiera incluido.
  const biomeEnemies = getBiome(loc.biome)?.enemies || [];
  // SPEC-0701: filtra enemigos exclusivos de día/noche según la hora actual
  const list = [...new Set([...(loc.enemies || []), ...biomeEnemies])].filter(isEnemyAvailable);
  const rate = typeof loc.encounterRate === "number" ? loc.encounterRate : 0.25;
  if (!list.length) return null;
  if (Math.random() < rate) return list[Math.floor(Math.random() * list.length)];
  return null;
}

// SPEC-0802: pre-decide la próxima acción del enemigo (y si un jefe la oculta)
// para que el chip de intent siempre anuncie futuro, nunca pasado.
function rollEnemyIntent() {
  const enemy = gameState.currentEnemy;
  if (!enemy || enemy.hp <= 0) return;
  updateBossPhase(enemy);
  const forced = rollForcedBossAction(enemy);
  if (forced) {
    enemy.nextAction = forced;
    enemy.intentHidden = isIntentAlwaysHidden(gameState) || isIntentHidden(enemy);
    return;
  }
  // SPEC-1103: rasgo "Regenerador" — cuenta turnos desde el último daño de fuego
  enemy.turnsSinceFireHit = (enemy.turnsSinceFireHit ?? 99) + 1;
  enemy.nextAction = decideNextAction({
    behavior: ENEMY_COMBAT_DATA[enemy.id]?.behavior,
    isBoss: enemy.isBoss,
    hp: enemy.hp,
    maxHp: enemy.maxHp,
    magicAttack: enemy.magicAttack,
    hasStatusEffect: !!enemyStatus(enemy),
    lastAction: enemy.lastAction,
    enraged: enemy.enraged,
    hasRegenTrait: enemy.trait === "regenerator",
    archetype: enemy.archetype,
    recentlyBurned: (enemy.turnsSinceFireHit ?? 99) < 2
  });
  enemy.intentHidden = isIntentAlwaysHidden(gameState) || isIntentHidden(enemy);
}

// SPEC-1207 — extraMult: hook de escalada opcional para contenido fuera de la
// curva normal (hoy solo lo usa echoTrials.js). Se aplica ANTES de rollear el
// intent/fase inicial del jefe para que todo lea el HP/ATK ya final — parchear
// gameState.currentEnemy después de startCombat() dejaría rollEnemyIntent()/
// updateBossPhase() decidiendo con números viejos.
export function startCombat(enemyType, isBoss = false, extraMult = null) {
  const base = enemyData?.[enemyType];
  if (!base) { addMessage(formatText(t('enemyUnknownError'), { type: enemyType }), "system"); return; }

  const lvl = gameState.player.level - 1;
  const lvlMult = isBoss
    ? 1.6 + lvl * 0.08   // jefes escalan más fuerte
    : 1   + lvl * 0.05;
  const diff = getDifficultyConfig(gameState.difficulty);
  const xHp  = extraMult?.hp  ?? 1;
  const xAtk = extraMult?.atk ?? 1;
  const scaledHp  = Math.floor((base.maxHp  ?? base.hp  ?? 10)  * lvlMult * diff.hp * xHp);
  const scaledAtk = Math.floor((base.attack ?? 5) * (isBoss ? 1.4 + lvl * 0.04 : 1) * diff.atk * cruelAtkMult(gameState) * xAtk);
  const scaledDef = Math.floor((base.defense ?? 0) * diff.def);
  // SPEC-0701: bonos/penalidades de día o noche sobre el ataque/defensa base
  const { attack: timedAtk, defense: timedDef } = applyTimeModifiers(enemyType, scaledAtk, scaledDef);

  gameState.stunImmune = 0; // SPEC-1303: la inmunidad al stun no se arrastra entre combates
  gameState.techCooldowns = {}; // SPEC-1304: los enfriamientos de técnicas no persisten entre combates
  gameState.currentEnemy = {
    id: enemyType,
    ...base,
    hp:      scaledHp,
    maxHp:   scaledHp,
    attack:  timedAtk,
    defense: timedDef,
    isBoss,
    // SPEC-1303: arquetipo táctico (null en Fácil, jefes y enemigos sin arquetipo)
    archetype: getArchetype(enemyType, gameState.difficulty, isBoss),
    // SPEC-1104: distingue un mini-boss real (perdonable) del boss principal
    // de zona (nunca perdonable) — ver isMiniBossId() en biomeBosses.js
    isMiniBoss: isBoss && isMiniBossId(enemyType),
    // SPEC-1101: estado propio por-boss, en memoria (no toca el save, mismo
    // patrón que nextAction/enraged/isDefending)
    // SPEC-1219 (Fase 4): dragon_king empieza su fase 1 con la misma
    // guardia que forest_titan — updateBossPhase() la apaga al escalar.
    // SPEC-1237: kestrel_rival_2 (segundo duelo de Kestrel) reusa la misma
    // guardia -- decisión de diseño para no inventar IA de boss nueva.
    hasGuard: enemyType === "forest_titan" || enemyType === "dragon_king" || enemyType === "kestrel_rival_2",
    guardBroken: 0,
    turnsSinceDevour: 0,
    turnsSinceOverload: 0,
    turnsSinceFireHit: 99
  };

  // SPEC-1103: rasgos aleatorios de enemigo (solo no-boss, rejugabilidad)
  assignRandomTrait(gameState.currentEnemy, isBoss);

  gameState.isInCombat = true;
  gameState.activeDebuffs  = {};
  gameState.playerDebuffs  = {};

  if (isBoss) {
    addMessage(formatText(t('bossAppears'), { enemy: gameState.currentEnemy.type }), "combat");
    showFloatingText(t('bossAlert'), window.innerWidth / 2 - 40, window.innerHeight / 2 - 100, "#ff4444", "1.8em");
    // SPEC-1110: flash dramático no-bloqueante, no interrumpe el flujo del combate
    const flash = document.getElementById("boss-flash-overlay");
    if (flash) {
      flash.classList.remove("hidden");
      flash.classList.add("active");
      setTimeout(() => { flash.classList.remove("active"); flash.classList.add("hidden"); }, 1450);
    }
    if (enemyType === "dragon_king") {
      // SPEC-1215 — callback directo a la intro reescrita (2026-08-28): la
      // voz misteriosa de la Fiesta de las Primeras Nieves ("Devuélveme...
      // mi nombre") se paga acá, explícitamente, antes de la pregunta que
      // ya existía. Sin esto el jugador nunca conecta ambos momentos.
      setTimeout(() => addMessage(t("dragonKingNameEcho"), "system"), 300);
      setTimeout(() => addMessage(t("dragonKingQuestion"), "system"), 1400);
      // SPEC-1219 (Fase 4 del plan): fase 1 del clímax (guardia, callback a
      // forest_titan) anunciada acá, DESPUÉS del diálogo dramático — si
      // updateBossPhase() la disparara en su primer roll (síncrono, dentro
      // de rollEnemyIntent() al final de startCombat()) aparecería ANTES de
      // "¿el mundo aún recuerda mi nombre?", rompiendo el orden narrativo.
      setTimeout(() => addMessage(formatText(t("dragonKingPhase1"), { enemy: gameState.currentEnemy.type }), "combat"), 2600);
    } else {
      if (base.introLine) {
        // SPEC-1218 — historia mejorada, Acto I: linea de combate opcional por
        // enemigo (forest_titan/cave_devourer/mountain_colossus por ahora).
        // Generico a proposito: cualquier boss futuro puede sumar introLine
        // sin tocar este archivo de nuevo.
        setTimeout(() => addMessage(base.introLine, "system"), 600);
      }
      // SPEC-1223: narrador oculto — línea propia, tipo "milestone" (se
      // distingue visualmente sin nombrar al narrador), solo en el PRIMER
      // encuentro contra cada jefe de zona (no se repite en reintentos tras
      // huir/perder). inferno_dragon no tiene introLine, por eso este bloque
      // vive fuera del `if (base.introLine)` — dispara igual, más temprano.
      if (base.narratorLine && !gameState.worldFlags?.["narrator_seen_" + enemyType]) {
        if (!gameState.worldFlags) gameState.worldFlags = {};
        gameState.worldFlags["narrator_seen_" + enemyType] = true;
        setTimeout(() => addMessage(base.narratorLine, "milestone"), base.introLine ? 1700 : 700);
      }
    }
  } else {
    addMessage(formatText(t('enemyAppears'), { enemy: gameState.currentEnemy.type }), "combat");
    // SPEC-1223: humor seco puntual — 3-4 enemigos comunes elegidos a mano
    // (nunca genérico/por frecuencia), mismo gating de "primer encuentro"
    // que las narratorLine de jefe de zona. Nunca puede coincidir con un
    // momento emocional importante: estos son enemigos base sin ningún
    // peso narrativo propio.
    if (base.narratorLine && !gameState.worldFlags?.["narrator_seen_" + enemyType]) {
      if (!gameState.worldFlags) gameState.worldFlags = {};
      gameState.worldFlags["narrator_seen_" + enemyType] = true;
      setTimeout(() => addMessage(base.narratorLine, "milestone"), 700);
    }
  }
  playSound("combat_start");
  playMusic("combat");
  rollEnemyIntent(); // SPEC-0802: primer telegraph antes de pintar el panel
  updateUI();
  maybeShowHint("first_combat"); // SPEC-0801: primer combate
}

// ── Enemy Turn ─────────────────────────────────────────
export async function enemyTurn() {
  if (!gameState.currentEnemy || gameState.isGameOver) return;
  const enemy = gameState.currentEnemy;
  const p = gameState.player;
  const stats = calculateTotalStats(p, gameState.equipment);
  // SPEC-1106: Capa de Niebla — cuenta el turno de enemigo actual (empieza en
  // 0, esta es la ronda enemy.combatRound tras el incremento)
  enemy.combatRound = (enemy.combatRound || 0) + 1;

  // SPEC-0802: la guardia expira al empezar su turno — así los ticks de
  // veneno/quemadura de abajo hacen daño completo
  enemy.isDefending = false;

  // SPEC-1302: la postura de esquiva vale para ESTE turno enemigo aunque la
  // acción no sea esquivable (devorar, regenerar, aturdido...) — se lee y se
  // limpia antes de cualquier return temprano.
  const wasDodging = gameState.activeBuffs?.dodge_stance > 0;
  if (wasDodging) delete gameState.activeBuffs.dodge_stance;

  // SPEC-1101: la guardia de raíces (Forest Titan) se restaura sola pasados
  // los turnos de "Romper Guardia"
  if (enemy.guardBroken > 0) {
    enemy.guardBroken--;
    if (enemy.guardBroken <= 0) addMessage(formatText(t('enemyGuardRestored'), { enemy: enemy.type }), "system");
  }

  // SPEC-1103: rasgo "Cobarde" — huye solo (sin recompensa) bajo cierto % de HP
  if (checkCowardFlee(enemy)) return;

  // Tick player debuffs (poison/burn damage)
  if (processPlayerDebuffs()) return;
  if (gameState.stunImmune > 0) gameState.stunImmune--; // SPEC-1303

  // Apply poison damage to enemy
  if (gameState.activeDebuffs?.poison) {
    const poisonInfo = gameState.activeDebuffs.poison;
    const poisonDmg = poisonInfo.damage || 3;
    applyDamageToEnemy(poisonDmg);
    addMessage(formatText(t('enemyPoisonDamage'), { enemy: enemy.type, damage: poisonDmg }), "combat");
    poisonInfo.turns--;
    if (poisonInfo.turns <= 0) { delete gameState.activeDebuffs.poison; addMessage(t('poisonWearsOff'), "system"); }
    if (enemy.hp <= 0) { await delay(300); return endCombat(true); }
  }

  // Apply burn damage to enemy
  if (gameState.activeDebuffs?.burn) {
    const burnInfo = gameState.activeDebuffs.burn;
    const burnDmg = burnInfo.damage || 3;
    applyDamageToEnemy(burnDmg);
    addMessage(formatText(t('enemyBurnDamage'), { enemy: enemy.type, damage: burnDmg }), "combat");
    burnInfo.turns--;
    if (burnInfo.turns <= 0) { delete gameState.activeDebuffs.burn; addMessage(t('burnWearsOff'), "system"); }
    if (enemy.hp <= 0) { await delay(300); return endCombat(true); }
  }

  // SPEC-1105: Trampero — daño de sangrado sobre el enemigo
  if (gameState.activeDebuffs?.bleed) {
    const bleedInfo = gameState.activeDebuffs.bleed;
    const bleedDmg = bleedInfo.damage || 3;
    applyDamageToEnemy(bleedDmg);
    addMessage(formatText(t('enemyBleedDamage'), { enemy: enemy.type, damage: bleedDmg }), "combat");
    bleedInfo.turns--;
    if (bleedInfo.turns <= 0) { delete gameState.activeDebuffs.bleed; addMessage(t('enemyBleedWearsOff'), "system"); }
    if (enemy.hp <= 0) { await delay(300); return endCombat(true); }
  }

  // SPEC-1105: Nigromante — la maldición del crítico mágico decae con el tiempo
  if (enemy.cursedDebuff?.turns > 0) {
    enemy.cursedDebuff.turns--;
    if (enemy.cursedDebuff.turns <= 0) delete enemy.cursedDebuff;
  }

  // Frozen: enemy attacks less
  const frozenDebuff = gameState.activeDebuffs?.frozen;
  const frozenMult = frozenDebuff ? 0.75 : 1.0;
  if (frozenDebuff) {
    frozenDebuff.turns--;
    if (frozenDebuff.turns <= 0) { delete gameState.activeDebuffs.frozen; addMessage(t('frozenWearsOff'), "system"); }
  }

  // SPEC-1101: aturdido — pierde el turno por completo (no telegrafía nada nuevo hasta que expire)
  if (gameState.activeDebuffs?.stunned) {
    const stunInfo = gameState.activeDebuffs.stunned;
    addMessage(formatText(t("enemyStunned"), { enemy: enemy.type }), "combat");
    stunInfo.turns--;
    if (stunInfo.turns <= 0) delete gameState.activeDebuffs.stunned;
    rollEnemyIntent();
    updateUI();
    return;
  }

  // SPEC-0802: ejecuta la acción telegrafiada (el chip mostró esto al jugador)
  // SPEC-1303: "channeled_magic" es el hechizo potenciado tras canalizar —
  // se resuelve como "magic" normal (esquivable a mitad, interrumpible) con
  // multiplicador propio. lastAction conserva el nombre real para la IA.
  const rawAction = enemy.nextAction || "attack";
  enemy.lastAction = rawAction;
  const channeledCast = rawAction === "channeled_magic";
  // SPEC-1303: "stunning_blow" (Aturdidor) se resuelve como golpe pesado normal
  // (esquivable, interrumpible) con aturdimiento garantizado si conecta.
  const stunBlow = rawAction === "stunning_blow";
  const action = channeledCast ? "magic" : stunBlow ? "power_attack" : rawAction;
  const archScale = archetypeScale(gameState.difficulty);

  if (action === "defend") {
    enemy.isDefending = true;
    addMessage(formatText(t("enemyDefends"), { enemy: enemy.type }), "combat");
    rollEnemyIntent();
    updateUI();
    return;
  }
  if (action === "regen") {
    const heal = Math.max(1, Math.floor(enemy.maxHp * REGEN_PCT));
    enemy.hp = Math.min(enemy.maxHp, enemy.hp + heal);
    addMessage(formatText(t("enemyRegens"), { enemy: enemy.type, heal }), "combat");
    showFloatingText(`+${heal}`, window.innerWidth / 2 + 50, window.innerHeight / 2 - 80, "#4ade80", "1.6em");
    rollEnemyIntent();
    updateUI();
    return;
  }
  if (action === "enrage") {
    enemy.enraged = true;
    enemy.attack = Math.max(1, Math.floor(enemy.attack * ENRAGE_ATK_MULT));
    addMessage(formatText(t("enemyEnrages"), { enemy: enemy.type }), "combat");
    shakeScreen();
    rollEnemyIntent();
    updateUI();
    return;
  }

  // SPEC-1101 — Frost Wyrm: congela la magia del jugador cada 3er turno
  // (contador propio, no daño). Bloquea el botón Magia en UI y en lógica
  // (playerMagic ya chequea playerDebuffs.arcaneFreeze).
  if (action === "freeze_magic") {
    resolveFreezeMagic(enemy);
    rollEnemyIntent();
    updateUI();
    return;
  }

  // SPEC-1102: acción cancelada por "Interrumpir" — el enemigo no actúa este turno
  if (action === "interrupted") {
    addMessage(formatText(t("enemyInterrupted"), { enemy: enemy.type }), "combat");
    rollEnemyIntent();
    updateUI();
    return;
  }

  // SPEC-1303: Canalizador — turno de carga, sin daño; la IA devuelve
  // "channeled_magic" en el siguiente roll (lastAction === "channel").
  if (action === "channel") {
    addMessage(formatText(t("archChannelMsg"), { enemy: enemy.type }), "combat");
    rollEnemyIntent();
    updateUI();
    return;
  }

  // SPEC-1101 — Cave Devourer: "devorar" cada 3er turno (contador propio, no
  // RNG), telegrafiado con antelación por rollEnemyIntent como cualquier otra
  // acción.
  if (action === "devour") {
    if (resolveDevour(enemy, p)) return;
    rollEnemyIntent();
    updateUI();
    return;
  }

  // SPEC-1101 — Ancient Construct: "sobrecarga" cada 4to turno, daño mágico fijo.
  if (action === "overload") {
    if (resolveOverload(enemy, p)) return;
    rollEnemyIntent();
    updateUI();
    return;
  }

  const useMagic = action === "magic" && enemy.magicAttack;
  const powerMult = action === "power_attack" ? POWER_ATTACK_MULT : 1.0;
  const atkBase = useMagic ? (enemy.magicAttack || 5) : (enemy.attack || 5);
  // SPEC-1105: Nigromante — la maldición reduce el ataque del enemigo mientras dure
  const curseMult = enemy.cursedDebuff?.turns > 0 ? 0.85 : 1;
  const atkVal = Math.floor(atkBase * powerMult * frozenMult * curseMult * (channeledCast ? channelerMult(archScale) : 1));

  // Player defense (warrior stance halves damage)
  // SPEC-1102: se guarda ANTES de decrementar — el contraataque universal de
  // Defender depende de que la guardia haya estado activa este turno.
  const wasDefending = gameState.activeBuffs?.defend_stance > 0;
  // SPEC-1304: Parada y Respuesta — el contraataque de Defender sale seguro este turno
  const riposteActive = wasDefending && gameState.activeBuffs?.riposte > 0;
  if (gameState.activeBuffs) delete gameState.activeBuffs.riposte;
  let defenseMult = wasDefending ? 0.5 : 1.0;
  // SPEC-1303: Rompeguardia — su golpe pesado atraviesa parte de Defender
  const wreckMult = wasDefending ? wreckerDefendMult(enemy.archetype, archScale, action) : null;
  if (wreckMult != null) {
    defenseMult = wreckMult;
    addMessage(formatText(t("archWreckerBreaks"), { enemy: enemy.type }), "combat");
  }
  // SPEC-1303: Tormentoso — Defender amortigua más (-60%) su magia
  const stormMult = wasDefending ? stormDefendMult(enemy.archetype, archScale, useMagic) : null;
  if (stormMult != null) defenseMult = stormMult;
  if (gameState.activeBuffs?.defend_stance > 0) {
    gameState.activeBuffs.defend_stance--;
    if (gameState.activeBuffs.defend_stance <= 0) delete gameState.activeBuffs.defend_stance;
  }

  // Arcane shield absorbs 40%
  const shieldMult = gameState.activeBuffs?.arcane_shield > 0 ? 0.6 : 1.0;
  if (gameState.activeBuffs?.arcane_shield > 0) {
    delete gameState.activeBuffs.arcane_shield;
    addMessage(t('arcaneShieldAbsorbs'), "system");
  }

  // Rogue evasion (+ especialización Duelista)
  const spec = getActiveSpec();
  // SPEC-1106: Capa de Niebla — evasión extra SOLO en la primera ronda de combate
  const mistBonus = (gameState.equipment?.armor?.special === "mistEvasion" && enemy.combatRound === 1)
    ? gameState.equipment.armor.mistEvasionBonus : 0;
  const evasionChance = (stats.agility || 0) * 0.01
    + (p.class === "rogue" ? 0.1 : 0)
    + (p.level >= 5 && p.class === "rogue" ? 0.25 : 0)
    + (spec?.bonuses?.evasionBonus || 0)
    + mistBonus
    + (isTacticalDifficulty(gameState.difficulty) ? skirmisherDodgeBonus(enemy.archetype, archScale, action) : 0) // SPEC-1303
    - frostDodgePenalty(archScale, !!gameState.playerDebuffs?.frost); // SPEC-1303: escarcha del Criomante
  // SPEC-1302: pasiva + botón en una sola tirada (Fácil: fórmula original)
  const finalDodgeChance = computeDodgeChance({
    passive: evasionChance,
    buttonActive: wasDodging,
    isMagic: useMagic,
    tactical: isTacticalDifficulty(gameState.difficulty)
  });
  // SPEC-1303: la escarcha cuenta tiradas de esquiva, no turnos
  const frostDebuff = gameState.playerDebuffs?.frost;
  if (frostDebuff) {
    frostDebuff.turns--;
    if (frostDebuff.turns <= 0) { delete gameState.playerDebuffs.frost; addMessage(t("archFrostWearsOff"), "system"); }
  }
  // SPEC-1303: Tormentoso — sus hechizos no se esquivan
  const undodgeable = stormUndodgeable(enemy.archetype, archScale, useMagic);
  if (undodgeable) addMessage(formatText(t("archStormUndodgeable"), { enemy: enemy.type }), "combat");
  if (!undodgeable && Math.random() < Math.max(0, finalDodgeChance)) {
    addMessage(formatText(t('enemyAttackDodged'), { enemy: enemy.type }), "combat");
    if (wasDodging) {
      enemy.exposed = true;
      addMessage(formatText(t('dodgeSuccess'), { enemy: enemy.type }), "combat");
    }
    // Duelista: 25% de contraatacar al esquivar (+ bono de daño propio)
    if (spec?.bonuses?.counterattack && Math.random() < 0.25) {
      const counterDmg = Math.max(1, Math.floor((stats.attack || 1) * 0.5 * (1 + (spec.bonuses.counterDmgBonus || 0))));
      applyDamageToEnemy(counterDmg, "physical");
      playSound("attack");
      addMessage(formatText(t('counterattackMsg'), { damage: counterDmg }), "combat");
      showFloatingText(`-${counterDmg}`, window.innerWidth/2+50, window.innerHeight/2-50, "#fbbf24", "1.6em");
      if (enemy.hp <= 0) { await delay(300); return endCombat(true); }
    }
    rollEnemyIntent(); // SPEC-0802: la acción esquivada se consumió
    updateUI(); return;
  }

  if (wasDodging) addMessage(t('dodgeFail'), "combat");

  // Tipo de daño del enemigo vs resistencias del jugador (clase + equipo)
  const enemyCombat = ENEMY_COMBAT_DATA[enemy.id];
  const atkType = useMagic
    ? (enemyCombat?.magicDamageType || "magic")
    : (enemyCombat?.attackDamageType || "physical");

  const defVal = Math.floor(stats.defense || 0);
  const variance = 0.85 + Math.random() * 0.3;
  const rawDmg = Math.max(0, atkVal - defVal);
  let finalDmg = Math.max(1, Math.floor(rawDmg * variance * defenseMult * shieldMult));
  // Tanque: -30% daño físico recibido
  if (spec?.bonuses?.physicalDefenseBonus && PHYSICAL_TYPES.has(atkType)) {
    finalDmg = Math.max(1, Math.floor(finalDmg * (1 - spec.bonuses.physicalDefenseBonus)));
  }
  // SPEC-1105: Berserker — a cambio de más daño propio, recibe más daño físico
  if (spec?.bonuses?.physicalDefensePenalty && PHYSICAL_TYPES.has(atkType)) {
    finalDmg = Math.max(1, Math.floor(finalDmg * (1 + spec.bonuses.physicalDefensePenalty)));
  }
  finalDmg = applyResistance(finalDmg, atkType, stats.resistances);
  // SPEC-0602: debilidad — +25% daño recibido mientras dure
  if (gameState.playerDebuffs?.weakness) finalDmg = Math.max(1, Math.floor(finalDmg * WEAKNESS_DAMAGE_MULT));

  p.hp = Math.max(0, (p.hp || 0) - finalDmg);
  playSound("player_hurt");
  // SPEC-1105: Tanque — probabilidad de contraatacar cualquier golpe recibido
  if (spec?.bonuses?.counterattackOnHit && enemy.hp > 0 && Math.random() < spec.bonuses.counterattackOnHit) {
    const tankCounterDmg = Math.max(1, Math.floor((stats.attack || 1) * 0.5));
    applyDamageToEnemy(tankCounterDmg, "physical");
    addMessage(formatText(t('tankCounterMsg'), { damage: tankCounterDmg }), "combat");
    showFloatingText(`-${tankCounterDmg}`, window.innerWidth/2+50, window.innerHeight/2-50, "#fbbf24", "1.6em");
    if (enemy.hp <= 0) { await delay(300); return endCombat(true); }
  }

  const attackLabel = useMagic ? t('magicAttackLabel')
    : action === "power_attack" ? t('powerAttackLabel')
    : t('physicalAttackLabel');
  addMessage(formatText(pickVariant('enemyUsedAttack'), { enemy: enemy.type, attack: attackLabel, damage: finalDmg }), "combat");
  showFloatingText(`-${finalDmg}`, window.innerWidth/2-80, window.innerHeight/2, "#fca5a5", "1.8em");
  shakeScreen();
  // SPEC-1303: Drenador — se cura con parte del daño que causó
  const drained = drainerHeal(enemy.archetype, archScale, finalDmg);
  if (drained > 0 && enemy.hp > 0) {
    enemy.hp = Math.min(enemy.maxHp, enemy.hp + drained);
    addMessage(formatText(t("archDrainerHeal"), { enemy: enemy.type, heal: drained }), "combat");
  }

  updateUI();

  if (p.hp <= 0 && !tryLastBreath()) {
    p.hp = 0;
    gameState.isGameOver = true;
    gameState.isInCombat = false;
    playSound("player_die");
    addMessage(t('combatGameOverDefeated'), "combat");
    recordRun("defeat");
    updateUI();
    setTimeout(() => showGameOver(), 800);
    return;
  }

  // SPEC-1102: contraataque universal vía Defender — 30%, cualquier clase,
  // independiente del 25% de Duelista al esquivar (ese ya se resolvió arriba
  // en la rama de evasión y no llega hasta acá).
  if (wasDefending && (riposteActive || Math.random() < DEFEND_COUNTER_CHANCE)) {
    const counterDmg = Math.max(1, Math.floor((stats.attack || 1) * DEFEND_COUNTER_DMG_MULT));
    applyDamageToEnemy(counterDmg, "physical");
    playSound("attack");
    addMessage(formatText(t('defendCounterMsg'), { enemy: enemy.type, damage: counterDmg }), "combat");
    showFloatingText(`-${counterDmg}`, window.innerWidth/2+50, window.innerHeight/2-50, "#93C5FD", "1.6em");
    if (enemy.hp <= 0) { await delay(300); return endCombat(true); }
  }

  // Apply a new status effect if enemy has one and player doesn't already have it
  // SPEC-0802: la acción "status" telegrafiada garantiza el intento de efecto
  // SPEC-1105: Caballero Sagrado — reduce la probabilidad de sufrir el efecto
  // SPEC-1303: el golpe aturdidor aplica stun garantizado; los arquetipos de
  // estado multiplican la chance según la dificultad.
  const se = stunBlow ? archetypeStatus("stunner") : enemyStatus(enemy);
  const debuffResistMult = 1 - (spec?.bonuses?.debuffResistPct || 0);
  const statusChance = (action === "status" || stunBlow)
    ? debuffResistMult
    : (se?.chance || 0) * debuffResistMult * statusChanceMult(enemy.archetype, archScale);
  if (se && Math.random() < statusChance) {
    if (!gameState.playerDebuffs) gameState.playerDebuffs = {};
    // SPEC-1101: el veneno acumula stacks (tope 5) en vez de solo refrescar/
    // ignorarse — cada stack nueva multiplica el daño por turno.
    if (se.type === "burn" && enemy.burnDoused) {
      // SPEC-1303: el hielo/agua apagó al Pirómano — pierde esta quemadura
      enemy.burnDoused = false;
      addMessage(formatText(t("archPyromancerDoused"), { enemy: enemy.type }), "combat");
    } else if (se.type === "poison") {
      const existing = gameState.playerDebuffs.poison;
      const stacks = Math.min(POISON_MAX_STACKS, (existing?.stacks || 0) + 1);
      gameState.playerDebuffs.poison = { turns: se.turns, damage: se.damage, stacks };
      addMessage(formatText(t(stacks > 1 ? 'enemyPoisonStackEffect' : 'enemyPoisonEffect'), {
        enemy: enemy.type, damage: se.damage * stacks, turns: se.turns, stacks
      }), "combat");
      updateUI();
    } else if (!gameState.playerDebuffs[se.type]) {
      if (se.type === "stun") {
        // SPEC-1303: tras un stun hay 2 turnos de inmunidad (nunca stun encadenado)
        if (gameState.stunImmune > 0) {
          addMessage(formatText(t("archStunResisted"), { enemy: enemy.type }), "combat");
        } else {
          gameState.playerDebuffs.stun = { turns: se.turns };
          addMessage(formatText(t('enemyStunEffect'), { enemy: enemy.type }), "combat");
        }
      } else if (se.type === "burn") {
        const burnDmg = pyromancerBurnDamage(enemy.archetype, archScale, se.damage);
        gameState.playerDebuffs.burn = { turns: se.turns, damage: burnDmg };
        addMessage(formatText(t('enemyBurnEffect'), { enemy: enemy.type, damage: burnDmg, turns: se.turns }), "combat");
      } else if (se.type === "bleed") {
        // SPEC-1102: sangrado — mismo patrón que quemadura, no acumula stacks
        gameState.playerDebuffs.bleed = { turns: se.turns, damage: se.damage };
        addMessage(formatText(t('enemyBleedEffect'), { enemy: enemy.type, damage: se.damage, turns: se.turns }), "combat");
      } else if (se.type === "weakness") {
        const weakTurns = se.turns + statusExtraTurns(enemy.archetype, archScale, "weakness");
        gameState.playerDebuffs.weakness = { turns: weakTurns };
        addMessage(formatText(t('enemyWeaknessEffect'), { enemy: enemy.type, turns: weakTurns }), "combat");
      } else if (se.type === "blind") {
        gameState.playerDebuffs.blind = { turns: se.turns };
        addMessage(formatText(t('enemyBlindEffect'), { enemy: enemy.type, turns: se.turns }), "combat");
      }
      updateUI();
    }
  }

  // SPEC-1303: Criomante — su magia o golpe pesado deja escarcha (menos esquiva)
  if (cryomancerAppliesFrost(enemy.archetype, archScale, action) && enemy.hp > 0) {
    if (!gameState.playerDebuffs) gameState.playerDebuffs = {};
    gameState.playerDebuffs.frost = { turns: FROST_TURNS };
    addMessage(formatText(t("archFrostApplied"), { enemy: enemy.type }), "combat");
  }

  // SPEC-0802: telegraph de la próxima acción
  rollEnemyIntent();
  updateUI();
}

// ── Helpers ─────────────────────────────────────────────
// Returns true if player died from debuff damage
function processPlayerDebuffs() {
  const debuffs = gameState.playerDebuffs;
  if (!debuffs || !Object.keys(debuffs).length) return false;
  const p = gameState.player;

  // SPEC-1101: arcaneFreeze no hace daño, solo bloquea Magia mientras dure —
  // necesita decrementarse aunque no tenga `damage` (el loop de abajo lo salta).
  if (debuffs.arcaneFreeze) {
    debuffs.arcaneFreeze.turns--;
    if (debuffs.arcaneFreeze.turns <= 0) {
      delete debuffs.arcaneFreeze;
      addMessage(t('arcaneFreezeWearsOff'), "system");
    }
  }

  // SPEC-0602: debilidad/ceguera no hacen daño, solo cuentan turnos
  for (const key of NON_DOT_DEBUFFS) {
    if (!debuffs[key]) continue;
    debuffs[key].turns--;
    if (debuffs[key].turns <= 0) {
      delete debuffs[key];
      addMessage(t(key === "weakness" ? 'weaknessWearsOff' : 'blindWearsOff'), "system");
    }
  }

  for (const key of Object.keys({ ...debuffs })) {
    if (key === "stun" || key === "arcaneFreeze" || NON_DOT_DEBUFFS.includes(key)) continue;
    const data = debuffs[key];
    if (!data?.damage) continue;

    // SPEC-1101: el veneno escala con stacks acumuladas (1 si no aplica al resto)
    const tickDamage = key === "poison" ? data.damage * (data.stacks || 1) : data.damage;
    p.hp = Math.max(0, p.hp - tickDamage);
    // SPEC-1102: sangrado se suma a veneno/quemadura en este lookup (antes era un ternario de 2 opciones)
    const meta  = DEBUFF_TICK_META[key] || DEBUFF_TICK_META.burn;
    const icon  = meta.icon;
    const label = meta.label;
    addMessage(formatText(t('playerDebuffDamage'), { icon, label, damage: tickDamage }), "combat");
    showFloatingText(`-${tickDamage}`,
      window.innerWidth/2 - 80, window.innerHeight/2 - 20,
      meta.color, "1.6em");

    data.turns--;
    if (data.turns <= 0) {
      delete debuffs[key];
      addMessage(formatText(t('statusEffectEnds'), { label: label.toLowerCase() }), "system");
    }
    if (p.hp <= 0) break;
  }

  updateUI();
  if (p.hp <= 0 && !tryLastBreath()) {
    p.hp = 0;
    gameState.isGameOver  = true;
    gameState.isInCombat  = false;
    gameState.playerDebuffs = {};
    playSound("player_die");
    addMessage(t('combatStatusEffectsDefeat'), "combat");
    recordRun("defeat");
    updateUI();
    setTimeout(() => showGameOver(), 800);
    return true;
  }
  return false;
}

// damageType es opcional: solo lo pasan los ataques reales del jugador (no
// los ticks de veneno/quemadura sobre el enemigo) — así la guardia de Forest
// Titan bloquea ataques, nunca daño continuo.
export function applyDamageToEnemy(dmg, damageType) {
  const enemy = gameState.currentEnemy;
  if (!enemy) return;
  // SPEC-1103: rasgo "Regenerador" — recibir fuego bloquea su regen próxima
  if (damageType === "fire") enemy.turnsSinceFireHit = 0;
  // SPEC-1303: hielo/agua apagan al Pirómano; el fuego disipa la escarcha del Criomante
  if (dousesPyromancer(enemy.archetype, damageType)) enemy.burnDoused = true;
  if (fireDispelsFrost(enemy.archetype, damageType) && gameState.playerDebuffs?.frost) {
    delete gameState.playerDebuffs.frost;
    addMessage(t("archFrostDispelled"), "combat");
  }
  // SPEC-1303: Guardián — golpear con física mientras defiende devuelve parte del daño
  const reflect = guardianReflect({
    archetype: enemy.archetype, scale: archetypeScale(gameState.difficulty),
    isDefending: enemy.isDefending, isPhysical: !!damageType && PHYSICAL_TYPES.has(damageType),
    dmg, playerHp: gameState.player.hp
  });
  if (reflect > 0) {
    gameState.player.hp -= reflect;
    addMessage(formatText(t("archGuardianReflect"), { enemy: enemy.type, damage: reflect }), "combat");
  }
  let final = dmg;
  // SPEC-0802: en guardia recibe la mitad del daño del jugador (mín. 1)
  if (enemy.isDefending && dmg > 1) {
    final = Math.max(1, Math.ceil(dmg * DEFEND_DAMAGE_MULT));
    addMessage(formatText(t("enemyBlocksDamage"), { enemy: enemy.type, blocked: dmg - final }), "combat");
  }
  // SPEC-1101: guardia de raíces (Forest Titan) — reduce daño físico 60%
  // mientras esté activa; "Romper Guardia" la desactiva unos turnos.
  if (enemy.hasGuard && !(enemy.guardBroken > 0) && damageType && PHYSICAL_TYPES.has(damageType) && final > 1) {
    const reduced = Math.max(1, Math.ceil(final * GUARD_DAMAGE_MULT));
    addMessage(formatText(t("enemyGuardBlocks"), { enemy: enemy.type, blocked: final - reduced }), "combat");
    final = reduced;
  }
  enemy.hp = Math.max(0, (enemy.hp || 0) - final);
  // SPEC-1205 — instrumentación de balance, no rebalance a ciegas: la
  // auditoría de jugabilidad marcó las especializaciones como "desbalanceadas
  // en el papel" pero pidió confirmar con números reales del playtest
  // pendiente antes de tocar cualquier multiplicador. Este contador (único
  // punto por el que pasa TODO el daño del jugador al enemigo) es lo que
  // convierte ese playtest en datos comparables en vez de una impresión.
  gameState.stats.damageDealt = (gameState.stats.damageDealt || 0) + final;
  updateUI();
}

export function tickBuffs() {
  tickTechniqueState();
  if (!gameState.activeBuffs) return;
  for (const k in gameState.activeBuffs) {
    gameState.activeBuffs[k]--;
    if (gameState.activeBuffs[k] <= 0) delete gameState.activeBuffs[k];
  }
}

// SPEC-1304: una vez por acción del jugador — enfriamientos, desgaste temporal
// de defensa (Golpe Aplastante / Impacto Sísmico) y Maná Fluido.
function tickTechniqueState() {
  const cds = gameState.techCooldowns;
  if (cds) for (const id of Object.keys(cds)) { if (cds[id] > 0) cds[id]--; }
  const enemy = gameState.currentEnemy;
  if (enemy?._techShred && --enemy._techShred.turns <= 0) {
    enemy.defense += enemy._techShred.amount;
    enemy._techShred = null;
  }
  if (gameState.isInCombat) {
    const mpGain = currentPassives().mpPerTurn;
    if (mpGain > 0) {
      const p = gameState.player;
      const cap = calculateTotalStats(p, gameState.equipment).maxMp || p.maxMp;
      p.mp = Math.min(cap, (p.mp || 0) + mpGain);
    }
  }
}
