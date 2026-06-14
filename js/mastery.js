// ══════════════════════════════════════════════════════
//  WEAPON MASTERY — Sistema de maestría de armas
//  SPEC-0605
// ══════════════════════════════════════════════════════
import { gameState } from "./state.js";
import { DAMAGE_TYPES } from "./damageTypes.js";

const MASTERY_TIERS = [
  { xpReq: 0,     title: "Novato",      bonus: 0,    emoji: "⬜" },
  { xpReq: 500,   title: "Adepto",      bonus: 0.05, emoji: "🟩" },
  { xpReq: 2000,  title: "Experto",     bonus: 0.10, emoji: "🟦" },
  { xpReq: 5000,  title: "Maestro",     bonus: 0.15, emoji: "🟪" },
  { xpReq: 10000, title: "Legendario",  bonus: 0.20, emoji: "🟨" },
];

export function getMasteryTier(xp = 0) {
  let tier = MASTERY_TIERS[0];
  for (const t of MASTERY_TIERS) {
    if (xp >= t.xpReq) tier = t;
    else break;
  }
  return tier;
}

function getNextTier(xp = 0) {
  for (const t of MASTERY_TIERS) {
    if (xp < t.xpReq) return t;
  }
  return null;
}

export function getMasteryBonus(weaponType) {
  if (!weaponType) return 0;
  const data = (gameState.weaponMastery || {})[weaponType];
  return data ? getMasteryTier(data.xp).bonus : 0;
}

// Returns { type, tier } if tier changed, else null
export function addMasteryXP(weaponType, amount = 1) {
  if (!weaponType) return null;
  if (!gameState.weaponMastery) gameState.weaponMastery = {};
  const entry = gameState.weaponMastery[weaponType] || { xp: 0 };
  const prevTier = getMasteryTier(entry.xp);
  entry.xp = (entry.xp || 0) + amount;
  gameState.weaponMastery[weaponType] = entry;
  const newTier = getMasteryTier(entry.xp);
  if (newTier.xpReq > prevTier.xpReq) return { type: weaponType, tier: newTier };
  return null;
}

// For UI: sorted list of weapon types with XP > 0
export function getMasteryDisplay() {
  const mastery = gameState.weaponMastery || {};
  return Object.entries(mastery)
    .filter(([, d]) => d.xp > 0)
    .map(([type, d]) => {
      const tier = getMasteryTier(d.xp);
      const next = getNextTier(d.xp);
      return { type, label: DAMAGE_TYPES[type] || type, xp: d.xp, tier, next };
    })
    .sort((a, b) => b.xp - a.xp);
}
