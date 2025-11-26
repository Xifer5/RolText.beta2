// /tooltip.js
export function buildTooltip(item) {
  if (!item) return "";
  let t = [];

  t.push(item.name);
  if (item.description) t.push(item.description);

  if (item.attack)        t.push(`⚔️ ATK  +${item.attack}`);
  if (item.defense)       t.push(`🛡️ DEF  +${item.defense}`);
  if (item.magic)         t.push(`✨ MAG  +${item.magic}`);
  if (item.strength)      t.push(`💪 STR  +${item.strength}`);
  if (item.agility)       t.push(`🏃 AGI  +${item.agility}`);
  if (item.intelligence)  t.push(`🧠 INT  +${item.intelligence}`);

  if (item.type === "consumable") {
    if (item.effect === "restore_hp") t.push(`❤️ Restores ${item.potency} HP`);
    if (item.effect === "restore_mp") t.push(`💧 Restores ${item.potency} MP`);
  }

  if (item.price) t.push(`🪙 ${item.price} g`);

  return t.join("\n");
}