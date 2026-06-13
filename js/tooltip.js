// /tooltip.js
import { t, formatText } from "./i18n.js";

export function buildTooltip(item) {
  if (!item) return "";
  let tooltip = [];

  tooltip.push(item.name);
  if (item.description) tooltip.push(item.description);

  if (item.attack)        tooltip.push(`⚔️ ATK  +${item.attack}`);
  if (item.defense)       tooltip.push(`🛡️ DEF  +${item.defense}`);
  if (item.magic)         tooltip.push(`✨ MAG  +${item.magic}`);
  if (item.strength)      tooltip.push(`💪 STR  +${item.strength}`);
  if (item.agility)       tooltip.push(`🏃 AGI  +${item.agility}`);
  if (item.intelligence)  tooltip.push(`🧠 INT  +${item.intelligence}`);

  if (item.type === "consumable") {
    if (item.effect === "restore_hp") tooltip.push(`❤️ ${formatText('shopRestoresHp', { value: item.potency })}`);
    if (item.effect === "restore_mp") tooltip.push(`💧 ${formatText('shopRestoresMp', { value: item.potency })}`);
  }

  if (item.price) tooltip.push(`🪙 ${item.price} g`);

  return tooltip.join("\n");
}