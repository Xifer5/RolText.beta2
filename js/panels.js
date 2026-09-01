// ══════════════════════════════════════════════════════
//  PANELS — Lógica de los 5 paneles del menú lateral
//  📜 Attributes · 🛡️ Equipment · 📖 Spellbook
//  📝 Journal · 🐉 Bestiary
// ══════════════════════════════════════════════════════
import { gameState } from "./state.js";
import { calculateTotalStats, applyDerivedMaxes } from "./stats.js";
import { CLASS_DEFINITIONS, SKILLS_BY_CLASS, LEARNABLE_SKILLS, getAvailableSkills } from "./classes.js";
import { renderJournal } from "./journal.js";
import { renderBestiary } from "./bestiary.js";
import { t, formatText, localizeText } from "./i18n.js";

const CLASS_AVATARS = {
  warrior: "img/avatar_warrior.webp",
  mage:    "img/avatar_mage.webp",
  rogue:   "img/avatar_rogue.webp",
};
import { resolveIconSrc } from "./utils.js";
import { buildEquipmentView, equipmentStageHTML } from "./equipmentView.js";
import { addMessage } from "./story.js";
import { updateUI } from "./ui.js";
import { renderMinimap } from "./minimap.js";
import { renderAchievements, checkAchievements } from "./achievements.js";
import { renderCrafting, wireCraftingPanel } from "./crafting.js";
import { renderEchoTrials, wireEchoTrialsPanel } from "./echoTrials.js";

// ── MODAL GENÉRICO ──────────────────────────────────────
function openPanel(title, html) {
  const modal = document.getElementById("panelModal");
  const titleEl = document.getElementById("panelModalTitle");
  const bodyEl = document.getElementById("panelModalBody");
  if (!modal || !titleEl || !bodyEl) return;
  titleEl.textContent = title;
  bodyEl.innerHTML = html;
  modal.classList.remove("hidden");
  // Post-render hooks
  wireSpellbookButtons(bodyEl);
}

function closePanel() {
  document.getElementById("panelModal")?.classList.add("hidden");
}

// ── 📜 ATTRIBUTES ───────────────────────────────────────
function renderAttributes() {
  const p = gameState.player;
  const derived = calculateTotalStats(p, gameState.equipment);
  const cls = CLASS_DEFINITIONS[p.class] || null;
  const classColor = cls?.color || "#d0bcff";

  const statBar = (label, val, max, color) => `
    <div class="attr-row">
      <span class="attr-label">${label}</span>
      <div class="attr-bar-wrap">
        <div class="attr-bar" style="width:${Math.min(100, Math.round(val/max*100))}%;background:${color}"></div>
      </div>
      <span class="attr-val">${val}<small>/${max}</small></span>
    </div>
  `;

  const statChip = (emoji, label, val, bonus) => `
    <div class="attr-chip-card">
      <span class="attr-chip-emoji">${emoji}</span>
      <div class="attr-chip-info">
        <span class="attr-chip-label">${label}</span>
        <span class="attr-chip-val">${val}${bonus > 0 ? ` <em style="color:var(--c-heal)">+${bonus}</em>` : ""}</span>
      </div>
    </div>
  `;

  const strBonus = (derived.strength || 0) - (p.strength || 0);
  const agiBonus = (derived.agility || 0) - (p.agility || 0);
  const intBonus = (derived.intelligence || 0) - (p.intelligence || 0);

  // Level bonuses unlocked
  const unlockedBonuses = cls ? Object.entries(cls.levelBonuses || {})
    .filter(([lvl]) => p.level >= parseInt(lvl))
    .map(([lvl, bonus]) => `<div class="level-bonus unlocked">✅ ${t('levelAbbr')}${lvl} — <strong>${bonus.name}</strong>: ${bonus.desc}</div>`)
    .join("") : "";

  const lockedBonuses = cls ? Object.entries(cls.levelBonuses || {})
    .filter(([lvl]) => p.level < parseInt(lvl))
    .map(([lvl, bonus]) => `<div class="level-bonus locked">🔒 ${t('levelAbbr')}${lvl} — <strong>${bonus.name}</strong>: ${bonus.desc}</div>`)
    .join("") : "";

  openPanel(t('attributesPanelTitle'), `
    <div class="attr-panel">
      <div class="player-avatar-section">
        <div class="player-avatar" style="background: radial-gradient(circle at 30% 30%, ${classColor}40, ${classColor}20); border-color: ${classColor};">
          ${cls && CLASS_AVATARS[p.class] ? `<img src="${CLASS_AVATARS[p.class]}" alt="${cls.name}" class="player-avatar-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline'">` : ''}
          <span class="avatar-emoji" ${cls && CLASS_AVATARS[p.class] ? 'style="display:none"' : ''}>${cls ? cls.emoji : '⚔️'}</span>
        </div>
        <div class="player-info">
          <div class="player-name">${p.name || t('defaultPlayerName')}</div>
          <div class="player-level">${t('levelAbbr')} ${p.level} ${cls ? cls.name : t('noClassSelected')}</div>
        </div>
      </div>
      ${cls ? `
        <div class="class-badge" style="border-color:${classColor};background:${classColor}18">
          <span style="font-size:2rem">${cls.emoji}</span>
          <div>
            <div class="class-badge-name" style="color:${classColor}">${cls.name}</div>
            <div class="class-badge-desc">${cls.description_long}</div>
          </div>
        </div>
      ` : `<div class="class-badge">⚔️ ${t('noClassSelected')}</div>`}

      <h3 class="attr-section">${t('statPanelVitality')}</h3>
      ${statBar("❤️ HP", p.hp, derived.maxHp || p.maxHp, "#ef4444")}
      ${statBar("💧 MP", p.mp, derived.maxMp || p.maxMp, "#818cf8")}
      ${statBar("⭐ XP", p.experience, p.nextLevelXp, "#fbbf24")}

      <h3 class="attr-section">${t('statPanelBaseAttributes')}</h3>
      <div class="attr-chips">
        ${statChip("💪", "Fuerza", p.strength, strBonus)}
        ${statChip("🏃", "Agilidad", p.agility, agiBonus)}
        ${statChip("🔮", "Inteligencia", p.intelligence, intBonus)}
      </div>

      <h3 class="attr-section">${t('statPanelDerivedStats')}</h3>
      <div class="attr-chips">
        ${statChip("⚔️", "Ataque", derived.attack, 0)}
        ${statChip("🛡️", "Defensa", derived.defense, 0)}
        ${statChip("✨", "Magia", derived.magic, 0)}
      </div>

      ${p.statPoints > 0 ? `
        <div class="attr-points-banner">
          ${formatText('statPanelUnspentPoints', { points: p.statPoints })}
          <button class="btn small" onclick="document.getElementById('statsBtn')?.click();document.getElementById('panelModal')?.classList.add('hidden')">
            ${t('statPanelUpgradeButton')}
          </button>
        </div>
      ` : ""}

      ${(unlockedBonuses || lockedBonuses) ? `
        <h3 class="attr-section">${t('statPanelClassBonuses')}</h3>
        <div class="level-bonuses">
          ${unlockedBonuses}
          ${lockedBonuses}
        </div>
      ` : ""}
    </div>
  `);
}

// ── 🛡️ EQUIPMENT ────────────────────────────────────────
// SPEC-1220 (revisión 2026-09-01): el panel de Equipo del menú ahora reusa
// el MISMO componente visual que el Inventario (equipmentStageHTML en
// equipmentView.js, SPEC-1217/1219) en vez de su propio "paper doll" con
// CSS duplicada — mismo diseño, un solo lugar que lo define. La única
// diferencia entre las 2 superficies: acá los slots son clickeables (abren
// un detalle con botón de desequipar debajo); el inventario los deja
// pasivos porque el equipar/desequipar ya vive en el flujo de la Mochila.
let selectedEquipSlot = null;

function renderEquipDetail() {
  const box = document.getElementById("equipDollDetail");
  if (!box) return;
  if (!selectedEquipSlot) {
    box.innerHTML = `<p class="muted" style="text-align:center">${t('equipmentEmptyHint')}</p>`;
    return;
  }
  const view = buildEquipmentView(gameState.player, gameState.equipment);
  const slotDef = view.slots.find(s => s.slot === selectedEquipSlot);
  const item = slotDef?.item;
  if (!item) {
    box.innerHTML = `<p class="muted" style="text-align:center">${slotDef?.emptyIcon || ''} ${slotDef?.label || selectedEquipSlot} — ${t('emptySlot')}</p>`;
    return;
  }
  const attrs = [];
  if (item.attack) attrs.push(`ATK +${item.attack}`);
  if (item.defense) attrs.push(`DEF +${item.defense}`);
  if (item.magic) attrs.push(`MAG +${item.magic}`);
  if (item.strength) attrs.push(`STR +${item.strength}`);
  if (item.agility) attrs.push(`AGI +${item.agility}`);
  if (item.intelligence) attrs.push(`INT +${item.intelligence}`);
  if (item.hpBonus) attrs.push(`MaxHP +${item.hpBonus}`);

  box.innerHTML = `
    <div class="equip-detail-row">
      <div class="equip-detail-icon">${resolveIconSrc(item.icon) ? `<img src="${resolveIconSrc(item.icon)}" width="40" height="40" alt="">` : `<span style="font-size:28px">${item.icon || slotDef.emptyIcon}</span>`}</div>
      <div class="equip-detail-info">
        <span class="equip-item-name">${localizeText(item.name)}</span>
        ${attrs.length ? `<span class="equip-attrs">${attrs.join(" · ")}</span>` : ""}
      </div>
      <button class="btn small outlined" data-unequip="${selectedEquipSlot}">✕</button>
    </div>
  `;
  box.querySelector("[data-unequip]")?.addEventListener("click", () => {
    const curItem = gameState.equipment[selectedEquipSlot];
    if (!curItem) return;
    if (!gameState.inventory[curItem.id]) gameState.inventory[curItem.id] = 0;
    gameState.inventory[curItem.id]++;
    gameState.equipment[selectedEquipSlot] = null;
    applyDerivedMaxes();
    addMessage(formatText('equipmentUnequipMessage', { item: localizeText(curItem.name) }), "system");
    updateUI();
    renderEquipment(); // re-render completo (stage + detalle)
  });
}

function renderEquipment() {
  const view = buildEquipmentView(gameState.player, gameState.equipment);

  openPanel(t('equipmentPanelTitle'), `
    <div class="equip-panel">
      ${equipmentStageHTML(view, { interactive: true })}
      <div class="doll-detail" id="equipDollDetail"></div>
    </div>
  `);

  document.querySelectorAll("#panelModalBody .equipment-slots-list li[data-slot]").forEach(li => {
    li.classList.toggle("slot-selected", li.dataset.slot === selectedEquipSlot);
    li.addEventListener("click", () => {
      selectedEquipSlot = li.dataset.slot;
      document.querySelectorAll("#panelModalBody .equipment-slots-list li").forEach(x => x.classList.toggle("slot-selected", x === li));
      renderEquipDetail();
    });
    li.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); li.click(); }
    });
  });
  renderEquipDetail();
}

// ── 📖 SPELLBOOK ─────────────────────────────────────────
function renderSpellbook() {
  const p = gameState.player;
  const cls = p.class;
  // SPEC-0607: sin el 3er argumento, getAvailableSkills nunca incluía las
  // habilidades universales aprendidas — ni acá ni en el panel de combate
  // (ver ui.js updateSkillPanel). Además, allSkills solo traía las de clase:
  // aunque availIds las reconociera, nunca les tocaba una fila propia.
  const classSkills = SKILLS_BY_CLASS[cls] || [];
  const learnedUniversal = (gameState.learnedSkills || []).map(id => LEARNABLE_SKILLS[id]).filter(Boolean);
  const allSkills = [...classSkills, ...learnedUniversal];
  const available = getAvailableSkills(cls, p.level, gameState.learnedSkills);
  const availIds = new Set(available.map(s => s.id));
  const clsDef = CLASS_DEFINITIONS[cls];
  const classColor = clsDef?.color || "#d0bcff";

  if (!cls) {
    openPanel(t('spellbookTitle'), `<div class="spell-empty"><p>${t('spellbookNoClass')}</p></div>`);
    return;
  }

  const rows = allSkills.map(skill => {
    const unlocked = availIds.has(skill.id);
    const canCast = unlocked && (p.mp >= skill.mpCost);
    return `
      <div class="spell-card ${unlocked ? "unlocked" : "locked"}">
        <div class="spell-header">
          <span class="spell-emoji">${skill.emoji}</span>
          <div class="spell-title">
            <strong>${skill.name}</strong>
            <span class="spell-cost">💧 ${skill.mpCost} MP</span>
          </div>
          <span class="spell-level-req ${unlocked ? "met" : ""}">${t('levelAbbr')}${skill.levelReq}</span>
        </div>
        <p class="spell-desc">${skill.description}</p>
        ${unlocked ? `
          <button class="btn small ${canCast ? "" : "outlined"} spell-cast-btn"
            data-skill="${skill.id}"
            ${!canCast ? "disabled" : ""}
            ${!gameState.isInCombat ? `title='${t('spellbookOnlyInCombat')}'` : ""}>
            ${gameState.isInCombat ? (canCast ? t('spellbookCastCombat') : t('noMana')) : t('spellbookOnlyInCombat')}
          </button>
        ` : `<p class="spell-locked-msg">${formatText('spellbookLockedSkill', { level: skill.levelReq })}</p>`}
      </div>
    `;
  }).join("");

  openPanel(t('spellbookTitle'), `
    <div class="spellbook-panel">
      <div class="spell-class-header" style="border-color:${classColor}">
        <span style="font-size:1.8rem">${clsDef.emoji}</span>
        <div>
          <strong style="color:${classColor}">${clsDef.name}</strong>
          <p style="font-size:.8rem;color:var(--md-on-surface-var);margin-top:4px">${t('statPanelPrimary') || 'Estadística principal'}: ${{ strength: t('statStrength'), agility: t('statAgility'), intelligence: t('statIntelligence') }[clsDef.primaryStat] || clsDef.primaryStat.toUpperCase()} · MP: ${p.mp}/${calculateTotalStats(p, gameState.equipment).maxMp}</p>
        </div>
      </div>
      <div class="spell-grid">${rows}</div>
    </div>
  `);
}

// Wire spellbook cast buttons after render
function wireSpellbookButtons(container) {
  container.querySelectorAll(".spell-cast-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const skillId = btn.dataset.skill;
      if (!gameState.isInCombat) {
        addMessage(t('onlyInCombat'), "system");
        return;
      }
      window.dispatchEvent(new CustomEvent("pixel:useSkill", { detail: { skillId } }));
      closePanel();
    });
  });
}

// ── SETUP: conectar botones del menú lateral ─────────────
export function setupPanelListeners() {
  // Crear modal del panel si no existe
  if (!document.getElementById("panelModal")) {
    const modal = document.createElement("div");
    modal.id = "panelModal";
    modal.className = "modal hidden";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-labelledby", "panelModalTitle");
    modal.innerHTML = `
      <div class="modal-content" style="max-width:640px">
        <h2 id="panelModalTitle"></h2>
        <div id="panelModalBody"></div>
        <button class="btn outlined" id="closePanelBtn" data-i18n="closeButton" style="margin-top:var(--sp-5)">✕ Cerrar</button>
      </div>
    `;
    document.body.appendChild(modal);
  }

  const closeBtn = document.getElementById("closePanelBtn");
  const panelModal = document.getElementById("panelModal");
  if (closeBtn) closeBtn.addEventListener("click", closePanel);
  if (panelModal) panelModal.addEventListener("click", (e) => { if (e.target === panelModal) closePanel(); });

  // Wire ALL elements with data-panel (topbar tabs + any other buttons)
  document.querySelectorAll("[data-panel]").forEach(el => {
    el.addEventListener("click", () => {
      const p = el.dataset.panel;
      // Update active tab in topbar
      document.querySelectorAll(".nav-tab").forEach(t => t.classList.toggle("active", t.dataset.panel === p));
      if (p === "attributes") renderAttributes();
      else if (p === "equipment") renderEquipment();
      else if (p === "spellbook") renderSpellbook();
      else if (p === "journal") openPanel(t('journalPanelTitle'), renderJournal());
      else if (p === "bestiary") openPanel(t('bestiaryPanelTitle'), renderBestiary());
      else if (p === "minimap") openPanel(t('mapPanelTitle'), renderMinimap());
      else if (p === "achievements") openPanel(t('achievementsPanelTitle'), renderAchievements());
      else if (p === "crafting") {
        openPanel(t('craftingPanelTitle'), renderCrafting());
        wireCraftingPanel(document.getElementById("panelModalBody"));
      }
      else if (p === "echotrials") {
        openPanel(t('echoTrialsPanelTitle'), renderEchoTrials());
        wireEchoTrialsPanel();
      }
    });
  });

  // inventoryBtn2 is handled in ui.js
}
