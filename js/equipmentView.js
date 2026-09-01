import { calculateTotalStats } from "./stats.js";
import { resolveIconSrc } from "./utils.js";
import { t, localizeText } from "./i18n.js";

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

function equipIconInner(item, emptyIcon) {
  const src = item?.icon ? resolveIconSrc(item.icon) : null;
  if (src) return `<img src="${src}" width="44" height="44" alt="" onerror="this.replaceWith(Object.assign(document.createElement('span'),{textContent:'${emptyIcon}'}))">`;
  return `<span style="font-size:31px">${item?.icon || emptyIcon}</span>`;
}

// SPEC-1220 — componente de equipamiento compartido entre el Inventario
// (donde nació, SPEC-1217) y el panel "Equipo" del menú lateral: MISMA
// estructura/clases que ya usa index.html (#invEquipOverview), así ambas
// superficies se ven idénticas sin CSS nueva. El inventario sigue con su
// implementación de ids estáticos (no se tocó — ya probada en vivo, cero
// motivo para arriesgarla); este HTML string es el que consume panels.js.
// `interactive`: agrega role="button"/tabindex a cada slot para que el
// caller pueda engancharle un click (el inventario no lo necesita, no lo
// pide; el panel de Equipo sí, para ver detalle/desequipar).
export function equipmentStageHTML(view, { interactive = false } = {}) {
  const slotsHTML = view.slots.map(({ slot, item, emptyIcon, label }) => {
    const valText = item ? localizeText(item.name) : t('emptySlot');
    const a11y = interactive ? ` role="button" tabindex="0"` : "";
    return `
      <li data-slot="${slot}" class="${item ? 'is-equipped' : ''}" title="${label}: ${valText}"${a11y}>
        <span class="equip-slot-art" aria-hidden="true">${equipIconInner(item, emptyIcon)}</span>
        <span class="equip-slot-copy">
          <span class="equip-slot-label">${label}</span>
          <span class="equip-val">${valText}</span>
        </span>
      </li>`;
  }).join("");

  return `
    <h3 class="equipment-banner-title">${t('invDetailEquipment')}</h3>
    <section class="equipment-stage" aria-label="${view.name}">
      <div class="equipment-character">
        <div class="equipment-avatar-frame">
          ${view.avatar
            ? `<img class="equipment-character-avatar" src="${view.avatar}" alt="${view.name}, ${view.role}">`
            : `<span class="equipment-character-fallback" aria-hidden="true">${view.fallback}</span>`}
        </div>
        <span class="equipment-character-kicker">Build actual</span>
        <strong>${view.name}</strong>
        <span class="equipment-character-role">${view.role}</span>
      </div>
      <ul class="equipment-slots-list" role="list">${slotsHTML}</ul>
      <div class="equipment-vitals" aria-label="Recursos y estadísticas del personaje">
        <div class="equipment-vital hp"><span>HP</span><div class="equipment-vital-track"><i style="width:${view.hpPercent}%"></i></div><strong>${view.hp} / ${view.maxHp}</strong></div>
        <div class="equipment-vital mp"><span>MP</span><div class="equipment-vital-track"><i style="width:${view.mpPercent}%"></i></div><strong>${view.mp} / ${view.maxMp}</strong></div>
        <dl class="equipment-stat-strip">
          <div><dt>ATK</dt><dd>${view.stats.attack}</dd></div>
          <div><dt>DEF</dt><dd>${view.stats.defense}</dd></div>
          <div><dt>MAG</dt><dd>${view.stats.magic}</dd></div>
        </dl>
      </div>
    </section>`;
}

