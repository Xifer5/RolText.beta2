/**
 * branchNodes.js — SPEC-1306: nodos de rama (3 por especialización).
 *
 * Nivel 10 = técnica activa distintiva (fija). Nivel 15 = el jugador elige 1 de
 * 2 pasivas. Nivel 20 = técnica activa de remate (fija). Las activas usan solo
 * enfriamiento (comparten `gameState.techCooldowns` con las técnicas de arma) y
 * solo existen fuera de Fácil. Los `bonuses` de SPECIALIZATIONS no se tocan.
 *
 * Lo numérico es puro (RNG inyectable); techniqueActions.js / combat.js /
 * playerCombatActions.js solo lo llaman.
 */
import { gameState } from "./state.js";
import { isTacticalDifficulty } from "./dodge.js";
import { SPECIALIZATIONS } from "./specializations.js";

export const NODE_LEVELS = [10, 15, 20];
export const RESPEC_PICKS_PER_LEVEL = 50;
export const RESPEC_BRANCH_PER_LEVEL = 100;

const act = (cooldown, emoji, extra = {}) => ({ cooldown, emoji, ...extra });
const pas = (emoji, effect) => ({ emoji, effect });

// Valores de partida (no balance final). Texto: claves `brn_<rama>_<slot>` / `brd_<rama>_<slot>` en i18n.js.
export const BRANCH_NODES = {
  // ── Guerrero ──
  tank: {
    10: act(4, "🛡️"),
    15: { a: pas("🧱", { physTaken: 0.10 }), b: pas("↩️", { counterOnHit: 0.10 }) },
    20: act(6, "🏰"),
  },
  berserker: {
    10: act(3, "🪓"),
    15: { a: pas("🩸", { lowHpDmg: 0.15 }), b: pas("⏱️", { cooldownReduce: 1 }) },
    20: act(5, "💢"),
  },
  holy_knight: {
    10: act(3, "✝️"),
    15: { a: pas("🕊️", { darkTaken: 0.25 }), b: pas("🙏", { statusBlock: 1 }) },
    20: act(6, "🌟", { usesPerCombat: 1 }),
  },
  // ── Mago ──
  elementalist: {
    10: act(3, "🔥"),
    15: { a: pas("🌀", { magicTaken: 0.20 }), b: pas("🎯", { vsWeakDmg: 0.10 }) },
    20: act(6, "🌪️"),
  },
  necromancer: {
    10: act(3, "🩸"),
    15: { a: pas("🌑", { magicTaken: 0.20 }), b: pas("💀", { killHealPct: 0.10 }) },
    20: act(5, "⚰️"),
  },
  chronomancer: {
    10: act(4, "⏳"),
    15: { a: pas("🔮", { announcedTaken: 0.10 }), b: pas("♾️", { cooldownReduce: 1 }) },
    20: act(7, "⏪", { usesPerCombat: 1 }),
  },
  // ── Pícaro ──
  assassin: {
    10: act(4, "🎯"),
    15: { a: pas("🧊", { critBonus: 0.10 }), b: pas("☠️", { poisonDmg: 0.50 }) },
    20: act(6, "🗡️"),
  },
  trapper: {
    10: act(4, "🪤"),
    15: { a: pas("💨", { evasionBonus: 0.08 }), b: pas("⚙️", { trapBoost: 0.5 }) },
    20: act(7, "🕸️"),
  },
  duelist: {
    10: act(2, "⚔️"),
    15: { a: pas("🦶", { evasionBonus: 0.08 }), b: pas("💥", { counterDmg: 0.30 }) },
    20: act(6, "💃"),
  },
};

export const BRANCH_ACTIVE_PREFIX = "br_";
export const branchActiveId = (spec, level) => `${BRANCH_ACTIVE_PREFIX}${spec}_${level}`;
export const nodeNameKey = (spec, slot) => `brn_${spec}_${slot}`;
export const nodeDescKey = (spec, slot) => `brd_${spec}_${slot}`;

const ACTIVE_INDEX = {};
for (const [spec, nodes] of Object.entries(BRANCH_NODES)) {
  for (const level of [10, 20]) ACTIVE_INDEX[branchActiveId(spec, level)] = { spec, level, ...nodes[level] };
}

/** Definición de una activa de rama por id, o null. */
export function getBranchActive(id) {
  return ACTIVE_INDEX[id] || null;
}
export const BRANCH_ACTIVE_IDS = Object.keys(ACTIVE_INDEX);

const ZERO_PASSIVES = {
  physTaken: 0, magicTaken: 0, darkTaken: 0, announcedTaken: 0, counterOnHit: 0, lowHpDmg: 0,
  cooldownReduce: 0, statusBlock: 0, killHealPct: 0, critBonus: 0, poisonDmg: 0, evasionBonus: 0,
  trapBoost: 0, counterDmg: 0, vsWeakDmg: 0,
};
export const NO_BRANCH_PASSIVES = Object.freeze({ ...ZERO_PASSIVES });

/** Estado de los 3 nodos del héroe. null si no tiene rama. */
export function nodeState(player) {
  const spec = player?.specialization;
  if (!spec || !BRANCH_NODES[spec]) return null;
  const level = player.level || 0;
  const pick = player.branchPicks?.[15] || null;
  return {
    spec,
    10: { unlocked: level >= 10 },
    15: { unlocked: level >= 15, pick, pending: level >= 15 && !pick },
    20: { unlocked: level >= 20 },
  };
}

/** Ids de activas de rama disponibles. [] en Fácil o sin rama. */
export function unlockedBranchActives(player, difficulty) {
  if (!isTacticalDifficulty(difficulty)) return [];
  const st = nodeState(player);
  if (!st) return [];
  return [10, 20].filter(l => st[l].unlocked).map(l => branchActiveId(st.spec, l));
}

/** Bonos agregados de la pasiva de nivel 15 elegida. Todo 0 en Fácil / sin elección. */
export function branchPassives(player, difficulty) {
  if (!isTacticalDifficulty(difficulty)) return NO_BRANCH_PASSIVES;
  const st = nodeState(player);
  if (!st || !st[15].unlocked || !st[15].pick) return NO_BRANCH_PASSIVES;
  const node = BRANCH_NODES[st.spec][15][st[15].pick];
  return node ? { ...ZERO_PASSIVES, ...node.effect } : NO_BRANCH_PASSIVES;
}

/** Pasivas de rama del jugador actual (lee gameState). */
export function currentBranchPassives() {
  return branchPassives(gameState.player, gameState.difficulty);
}

/** Elige la pasiva de nivel 15. false si no procede. */
export function pickNode(player, level, choice) {
  if (level !== 15 || (choice !== "a" && choice !== "b")) return false;
  const st = nodeState(player);
  if (!st || !st[15].unlocked || st[15].pick) return false;
  player.branchPicks = { ...(player.branchPicks || {}), 15: choice };
  return true;
}

export function respecCost(player, kind) {
  const per = kind === "branch" ? RESPEC_BRANCH_PER_LEVEL : RESPEC_PICKS_PER_LEVEL;
  return per * (player?.level || 1);
}

/** Reinicia la elección de nivel 15. { ok, cost, reason } — reason: combat | gold | nothing. */
export function respecPicks(player, inCombat) {
  const cost = respecCost(player, "picks");
  if (inCombat) return { ok: false, cost, reason: "combat" };
  if (!player.branchPicks?.[15]) return { ok: false, cost, reason: "nothing" };
  if ((player.gold || 0) < cost) return { ok: false, cost, reason: "gold" };
  player.gold -= cost;
  player.branchPicks = {};
  return { ok: true, cost };
}

/** Cambia de rama (misma clase). Borra las elecciones. { ok, cost, reason } — reason: combat | gold | invalid. */
export function changeBranch(player, newSpecId, inCombat) {
  const cost = respecCost(player, "branch");
  const target = SPECIALIZATIONS[newSpecId];
  if (inCombat) return { ok: false, cost, reason: "combat" };
  if (!target || target.class !== player.class || newSpecId === player.specialization) return { ok: false, cost, reason: "invalid" };
  if ((player.gold || 0) < cost) return { ok: false, cost, reason: "gold" };
  player.gold -= cost;
  player.specialization = newSpecId;
  player.branchPicks = {};
  return { ok: true, cost };
}

/** Multiplicador de daño de las pasivas de rama. */
export function branchDamageMult(passives, { hpRatio = 1, isMagic = false, weakness = false } = {}) {
  let bonus = 0;
  if (hpRatio < 0.5) bonus += passives.lowHpDmg || 0;
  if (isMagic && weakness) bonus += passives.vsWeakDmg || 0;
  return 1 + bonus;
}

/** Marca Letal: el siguiente golpe físico hace +50% y consume la marca. 1 si no aplica. */
export function consumeMark(enemy, isPhysical) {
  if (!isPhysical || !enemy?.marked) return 1;
  enemy.marked = null;
  return 1.5;
}

/** Multiplicador de daño recibido (1 = sin cambio). */
export function branchDamageTakenMult(passives, { isPhysical, isDark = false, announced = true }) {
  let mult = 1;
  if (isPhysical) mult *= 1 - (passives.physTaken || 0);
  else mult *= 1 - (passives.magicTaken || 0);
  if (isDark) mult *= 1 - (passives.darkTaken || 0);
  if (announced) mult *= 1 - (passives.announcedTaken || 0);
  return mult;
}

/** Enfriamiento efectivo de una activa de rama (mínimo 1). */
export function branchCooldown(def, passives) {
  return Math.max(1, (def?.cooldown || 1) - (passives?.cooldownReduce || 0));
}

const ELEMENTS = ["fire", "ice", "lightning"];
/** Elemento (fuego/hielo/rayo) con peor resistencia del enemigo; fuego en empate. */
export function weakestElement(resistances = {}) {
  let best = "fire";
  let bestVal = resistances.fire ?? 0;
  for (const el of ELEMENTS.slice(1)) {
    const v = resistances[el] ?? 0;
    if (v < bestVal) { best = el; bestVal = v; }
  }
  return best;
}

const INTERRUPTIBLE = new Set(["power_attack", "magic", "overload", "devour", "freeze_magic", "channel", "channeled_magic", "stunning_blow"]);

/**
 * Descriptor puro de una activa de rama.
 * ctx: { attack, magicAttack, maxHp, hp, enemy, resistances, passives, dodgedLastTurn }
 * Reusa los campos de resolveTechnique y suma: damageType, hits, selfDamagePct,
 * interrupt, cleansePlayer, cleanseAll, lifesteal, mark, trap, enemyDebuff, curse.
 */
export function resolveBranchActive(id, ctx, rng = Math.random) {
  const def = getBranchActive(id);
  if (!def) return null;
  const variance = 0.9 + 0.2 * rng();
  const phys = (m) => Math.max(1, Math.floor((ctx.attack || 1) * m * variance));
  const magic = (m) => Math.max(1, Math.floor((ctx.magicAttack || 1) * m * variance));
  const hpRatio = ctx.maxHp > 0 ? (ctx.hp ?? ctx.maxHp) / ctx.maxHp : 1;
  const enemy = ctx.enemy || {};
  const out = { id, rawDamage: 0, defPen: 0, kind: "physical", damageType: null };

  switch (`${def.spec}_${def.level}`) {
    // Guerrero
    case "tank_10":
      out.rawDamage = phys(0.8); out.damageType = "blunt";
      out.interrupt = { actions: ["power_attack", "stunning_blow"], bossChance: 0 };
      break;
    case "tank_20":
      out.buffs = { defend_stance: 4 }; out.cleansePlayer = 1;
      break;
    case "berserker_10":
      out.rawDamage = phys(1.5); out.damageType = "blunt";
      out.breakGuard = true; out.defShred = { pct: 0.2, turns: 2 };
      out.selfDamagePct = 0.05;
      break;
    case "berserker_20":
      // +30% como máximo, proporcional al HP perdido (tope fijo: no conviene estar herido a propósito)
      out.rawDamage = phys(2.0 * (1 + 0.3 * (1 - Math.min(1, Math.max(0, hpRatio)))));
      out.damageType = "slash";
      break;
    case "holy_knight_10": {
      const res = ctx.resistances || {};
      const weak = (res.holy ?? 0) < 0 || (res.light ?? 0) < 0;
      out.rawDamage = phys(1.3 * (weak ? 1.5 : 1)); out.damageType = "holy";
      break;
    }
    case "holy_knight_20":
      out.heal = Math.max(1, Math.floor((ctx.maxHp || 1) * 0.15)); out.cleanseAll = true;
      break;
    // Mago
    case "elementalist_10":
    case "elementalist_20": {
      const el = weakestElement(ctx.resistances);
      out.kind = "magic"; out.damageType = el;
      out.rawDamage = magic(def.level === 10 ? 1.4 : 2.2);
      if (el === "fire") out.enemyDebuff = { type: "burn", turns: 3, damage: 4 };
      else if (el === "ice") out.enemyDebuff = { type: "frozen", turns: 1, damage: 0 };
      break;
    }
    case "necromancer_10":
      out.kind = "magic"; out.damageType = "dark"; out.rawDamage = magic(1.1); out.lifesteal = 0.5;
      break;
    case "necromancer_20":
      out.kind = "magic"; out.damageType = "dark"; out.rawDamage = magic(1.8); out.curse = { turns: 3 };
      break;
    case "chronomancer_10":
      out.kind = "magic"; out.damageType = "magic"; out.rawDamage = magic(1.1);
      out.interrupt = { actions: [...INTERRUPTIBLE], bossChance: 0.5 };
      break;
    case "chronomancer_20":
      out.buffs = { rewind: 3 };
      break;
    // Pícaro
    case "assassin_10":
      out.rawDamage = phys(0.6); out.damageType = "pierce"; out.mark = { turns: 3 };
      break;
    case "assassin_20":
      out.rawDamage = phys(2.0 * ((enemy.maxHp > 0 && enemy.hp / enemy.maxHp < 0.3) ? 2 : 1)); out.damageType = "pierce";
      break;
    case "trapper_10":
    case "trapper_20": {
      const boost = 1 + (ctx.passives?.trapBoost || 0);
      const strong = def.level === 10;
      out.trap = {
        charges: strong ? 1 : 3,
        damage: phys((strong ? 1.3 : 0.8) * boost),
        bleed: { turns: 3 + (ctx.passives?.trapBoost ? 1 : 0), damage: 3 },
      };
      break;
    }
    case "duelist_10":
      out.rawDamage = phys(ctx.dodgedLastTurn ? 1.6 : 1.0); out.damageType = "pierce";
      break;
    case "duelist_20":
      out.rawDamage = phys(0.8); out.damageType = "pierce"; out.hits = 3;
      out.buffs = { dodge_stance: 2 };
      break;
    default:
      return null;
  }
  return out;
}
