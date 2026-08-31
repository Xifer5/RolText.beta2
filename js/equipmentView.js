import { calculateTotalStats } from "./stats.js";

export const CLASS_EQUIPMENT_AVATARS = Object.freeze({
  warrior: "img/avatar_warrior.webp",
  mage: "img/avatar_mage.webp",
  rogue: "img/avatar_rogue.webp"
});

export const EQUIPMENT_SLOT_VIEW = Object.freeze([
  { slot: "head", id: "equip-head", label: "Cabeza", emptyIcon: "🪖" },
  { slot: "rightHand", id: "equip-rightHand", label: "Mano derecha", emptyIcon: "⚔️" },
  { slot: "leftHand", id: "equip-leftHand", label: "Mano izquierda", emptyIcon: "🛡️" },
  { slot: "armor", id: "equip-armor", label: "Armadura", emptyIcon: "🥋" },
  { slot: "arms", id: "equip-arms", label: "Brazos", emptyIcon: "🦾" },
  { slot: "boots", id: "equip-boots", label: "Botas", emptyIcon: "👢" },
  { slot: "ring", id: "equip-ring", label: "Anillo", emptyIcon: "💍" },
  { slot: "accessory", id: "equip-accessory", label: "Accesorio", emptyIcon: "✨" }
]);

export function buildEquipmentView(player = {}, equipment = {}) {
  const stats = calculateTotalStats(player, equipment);
  const maxHp = Math.max(1, stats.maxHp || player.maxHp || 1);
  const maxMp = Math.max(1, stats.maxMp || player.maxMp || 1);
  return {
    name: player.name || "Aventurero",
    role: `Nivel ${player.level || 1} · ${player.className || "Aventurero"}`,
    avatar: CLASS_EQUIPMENT_AVATARS[player.class] || null,
    fallback: player.classEmoji || "⚔️",
    hp: Math.max(0, Math.min(player.hp ?? maxHp, maxHp)),
    maxHp,
    hpPercent: Math.max(0, Math.min(100, ((player.hp ?? maxHp) / maxHp) * 100)),
    mp: Math.max(0, Math.min(player.mp ?? maxMp, maxMp)),
    maxMp,
    mpPercent: Math.max(0, Math.min(100, ((player.mp ?? maxMp) / maxMp) * 100)),
    stats: { attack: stats.attack || 0, defense: stats.defense || 0, magic: stats.magic || 0 },
    slots: EQUIPMENT_SLOT_VIEW.map(slot => ({ ...slot, item: equipment[slot.slot] || null }))
  };
}

