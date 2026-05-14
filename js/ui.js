import { gameState, initializeGame } from "./state.js";
import { addMessage } from "./story.js";
import { renderShop } from "./shop.js";
import { renderInventory } from "./inventory.js";
import { calculateTotalStats, increaseStat } from "./stats.js";
import { hasSavedGame } from "./saveSystem.js";
import { CLASS_DEFINITIONS, getAvailableSkills } from "./classes.js";
import { getNpcAt } from "./npcs.js";
import { renderQuestLog, setupQuestLogTabs } from "./questlog.js";
import { playSound, getVolume, setVolume, isMuted, toggleMute,
         getMusicVolume, setMusicVolume, isMusicMuted, toggleMusicMute } from "./sounds.js";
import { QUEST_DATA, getQuestStatus, getQuestDialogue, getQuestActionLabel, activateQuest, checkQuestCondition, completeQuest } from "./quests.js";

// ── IMÁGENES DE UBICACIÓN — EDITABLE ─────────────────────────────────
// El sistema busca en este orden:
//   1. LOCATION_IMAGES[locationId]  → override específico de zona
//   2. img/locations/<biome>.png    → imagen genérica del bioma
// Si ninguna carga, el espacio se oculta automáticamente.
//
// Biomas disponibles: town, forest, dungeon, mountain, cave, swamp,
//   desert, sea, beach, jungle, tundra, volcano, garden, none
//
// Para agregar un override específico descomenta y edita una línea:
const LOCATION_IMAGES = {
  // "tower":      "img/locations/castle_tower.png",
  // "inferno_1":  "img/locations/dragon_throne.png",
   "town":       "img/locations/town.png",
   "shop":       "img/locations/shop1.png",
   "tavern":      "img/locations/The Drunken Dragon.png",
   "cellar":      "img/locations/old cellar.png",
   "castle":     "img/locations/castle.png",
   "castle_shop": "img/locations/castle_shop.png",
   "port":       "img/locations/port.png",
   "beach":      "img/locations/beach.png",
   "forest":     "img/locations/forest.png",
   "cave":       "img/locations/cave.png",
    "swamp":      "img/locations/swamp.png",
    "mountain":   "img/locations/mountain.png",
    "sea":        "img/locations/sea.png",
    "desert":     "img/locations/desert.png",
    "dungeon":    "img/locations/dungeon.png",
    "none":       "img/locations/none.png",
    "jungle":     "img/locations/jungle.png",
    "tundra":     "img/locations/tundra.png",
    "volcano":    "img/locations/volcano.png",
    "garden":     "img/locations/garden.png",
    "default":    "img/locations/default.png",
    "tower":      "img/locations/tower.png",
    "armory":     "img/locations/armory.png",
    "swamp":      "img/locations/swamp.png",
    "ruins":      "img/locations/ruins.png",
    "catacomb":   "img/locations/catacomb.png",
    "treasure_keep": "img/locations/treasure_keep.png",






};
const LOCATION_IMG_PATH = "img/locations/";

// ── AVATARES DE CLASE — EDITABLE ──────────────────────────────────────
// Coloca tus imágenes en img/ y edita las rutas aquí.
// Si el archivo no existe, se muestra el emoji de clase como fallback.
const CLASS_AVATARS = {
  warrior: "img/avatar_warrior.png",
  mage:    "img/avatar_mage.png",
  rogue:   "img/avatar_rogue.png",
};

// ── RETRATOS DE ENEMIGOS — EDITABLE ──────────────────────────────────
// Convención: img/enemies/<enemyId>.png
// Crea PNGs con el nombre exacto del ID del enemigo (slime.png, goblin.png…)
// Si el archivo no existe, el retrato se oculta automáticamente.
const ENEMY_PORTRAIT_PATH = "img/enemies/";

const ui = {};

export function initUICache() {
  const ids = [
    "hp-bar","hp-text","mp-bar","mp-text","xp-bar","xp-text",
    "gold","level","strength","agility","intelligence","stat-points",
    "location-name","location-subtitle","enemy-panel","enemy-name","enemy-hp","enemy-hp-bar",
    "combat-menu","navigation-menu","combat-content","navigation-content",
    "attackBtn","magicBtn","itemBtn","fleeBtn",
    "derived-attack","derived-defense","derived-magic",
    "saveInfo","continueBtn","loadGameBtn","deleteSaveBtn",
    "modal-stat-points","modal-strength","modal-agility","modal-intelligence",
    "screen","buff-bar","skill-panel","stat-points-row","char-portrait-emoji",
    /* mobile bottom nav */
    "mob-combat","mob-nav",
    "mob-attackBtn","mob-magicBtn","mob-itemBtn","mob-fleeBtn",
    "npc-talk-btn"
  ];
  ids.forEach(id => { ui[id] = document.getElementById(id); });
  ui.combatHeader    = null;
  ui.navigationHeader = null;
  _setupRipple();
  _setupMobileNav();
}

/* ── Ripple — efecto táctil M3 ──────────────────────────────── */
function _setupRipple() {
  const selectors = ".combat-btn,.mob-btn,.btn-action,.menu-option,.compass-dir-label,.compass-action-btn,.qa-btn";
  document.querySelectorAll(selectors).forEach(btn => {
    btn.addEventListener("pointerdown", (e) => {
      const rect = btn.getBoundingClientRect();
      const wave = document.createElement("span");
      wave.className = "ripple-wave";
      const size = Math.max(rect.width, rect.height);
      wave.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - rect.left - size/2}px;top:${e.clientY - rect.top - size/2}px`;
      btn.appendChild(wave);
      setTimeout(() => wave.remove(), 500);
    }, { passive: true });
  });
}

function _openMobileSheet(panelId) {
  const sheet = document.getElementById("mobileSheet");
  if (!sheet) return;
  sheet.classList.remove("hidden");
  sheet.setAttribute("aria-hidden", "false");
  document.querySelectorAll(".mobile-sheet-panel").forEach(panel => {
    panel.classList.toggle("hidden", panel.id !== panelId);
  });
}

function _closeMobileSheet() {
  const sheet = document.getElementById("mobileSheet");
  if (!sheet) return;
  sheet.classList.add("hidden");
  sheet.setAttribute("aria-hidden", "true");
}

/* ── Mobile nav — conectar botones ──────────────────────────── */
function _setupMobileNav() {
  const map = [
    ["mob-attackBtn", () => window.dispatchEvent(new Event("pixel:attack"))],
    ["mob-magicBtn",  () => window.dispatchEvent(new Event("pixel:magic"))],
    ["mob-itemBtn",   () => { renderInventory(); document.getElementById("inventoryModal")?.classList.remove("hidden"); }],
    ["mob-fleeBtn",   () => window.dispatchEvent(new Event("pixel:flee"))],
    ["mob-inventoryBtn", () => _openMobileSheet("mobileActionMenu")],
  ];
  map.forEach(([id, fn]) => document.getElementById(id)?.addEventListener("click", fn));
  document.getElementById("mob-moveMenuBtn")?.addEventListener("click", () => _openMobileSheet("mobileMoveMenu"));
  document.getElementById("mob-panelMenuBtn")?.addEventListener("click", () => _openMobileSheet("mobilePanelMenu"));

  document.querySelectorAll("#mob-nav [data-direction], #mobileSheet [data-direction]").forEach(btn => {
    btn.addEventListener("click", () => {
      const dir = btn.getAttribute("data-direction");
      if (dir) {
        window.dispatchEvent(new CustomEvent("pixel:move", { detail: { direction: dir } }));
        _closeMobileSheet();
      }
    });
  });
}

/**
 * @param {string} text - texto a mostrar
 * @param {number} x - posición X
 * @param {number} y - posición Y
 * @param {string} [color] - color CSS (ignorado si se usa type)
 * @param {string} [fontSize] - tamaño CSS
 * @param {"critical"|"heal"|"miss"|""} [type] - tipo semántico M3
 */
export function showFloatingText(text, x, y, color="#fff", fontSize="1.2em", type="") {
  const el = document.createElement("div");
  el.className = "floating-text" + (type ? ` ${type}` : "");
  el.textContent = text;
  el.style.cssText = `left:${x}px;top:${y}px;${type ? "" : `color:${color};font-size:${fontSize};`}`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1100);
}

export function shakeScreen() {
  if (!ui.screen) return;
  ui.screen.classList.remove("shake");
  void ui.screen.offsetWidth;
  ui.screen.classList.add("shake");
}

// ── MAIN UPDATE ────────────────────────────────────────
export function updateUI() {
  if (!ui.gold) initUICache();

  const p = gameState.player;
  const derived = calculateTotalStats(p, gameState.equipment);
  const hpMax = derived.maxHp || p.maxHp || 1;
  const mpMax = derived.maxMp || p.maxMp || 1;
  const hpPct = Math.min(100, Math.max(0, Math.round((p.hp / hpMax) * 100)));
  const mpPct = Math.min(100, Math.max(0, Math.round((p.mp / mpMax) * 100)));
  const xpPct = Math.min(100, Math.round(((p.experience||0) / (p.nextLevelXp||100)) * 100));

  if (ui["hp-bar"]) {
    ui["hp-bar"].style.width = `${hpPct}%`;
    const hpWrap = ui["hp-bar"].closest(".vital-bar-wrap");
    hpWrap?.classList.toggle("hp-low",      hpPct <= 25 && hpPct > 10);
    hpWrap?.classList.toggle("hp-critical", hpPct <= 10);
  }
  if (ui["hp-text"]) ui["hp-text"].textContent = `${p.hp}/${hpMax}`;
  if (ui["mp-bar"]) ui["mp-bar"].style.width = `${mpPct}%`;
  if (ui["mp-text"]) ui["mp-text"].textContent = `${p.mp}/${mpMax}`;
  if (ui["xp-bar"]) ui["xp-bar"].style.width = `${xpPct}%`;
  if (ui["xp-text"]) ui["xp-text"].textContent = `${p.experience||0}/${p.nextLevelXp||100}`;

  // Mobile player header — compact vitals
  const mobileHpBar = document.getElementById("mobile-hp-bar");
  const mobileMpBar = document.getElementById("mobile-mp-bar");
  const mobileXpBar = document.getElementById("mobile-xp-bar");
  const mobileHpText = document.getElementById("mobile-hp-text");
  const mobileMpText = document.getElementById("mobile-mp-text");
  const mobileXpText = document.getElementById("mobile-xp-text");
  const mobilePlayerName = document.getElementById("mobile-player-name");
  const mobileAvatarEmoji = document.getElementById("mobile-avatar-emoji");
  const mobileAvatarImg = document.getElementById("mobile-avatar-img");

  if (mobileHpBar) mobileHpBar.style.setProperty("--fill-width", `${hpPct}%`);
  if (mobileMpBar) mobileMpBar.style.setProperty("--fill-width", `${mpPct}%`);
  if (mobileXpBar) mobileXpBar.style.setProperty("--fill-width", `${xpPct}%`);
  if (mobileHpText) mobileHpText.textContent = `${p.hp}/${hpMax}`;
  if (mobileMpText) mobileMpText.textContent = `${p.mp}/${mpMax}`;
  if (mobileXpText) mobileXpText.textContent = `${p.experience||0}/${p.nextLevelXp||100}`;
  if (mobilePlayerName) mobilePlayerName.textContent = p.name || "Aventurero";
  if (mobileAvatarEmoji && p.class) {
    const cls = CLASS_DEFINITIONS[p.class];
    mobileAvatarEmoji.textContent = cls?.emoji || "⚔️";
  }

  // Update mobile avatar image
  if (mobileAvatarImg && p.class) {
    const src = CLASS_AVATARS[p.class];
    if (src && mobileAvatarImg.src !== src) {
      mobileAvatarImg.src = src;
      mobileAvatarImg.onerror = () => {
        mobileAvatarImg.style.display = "none";
        if (mobileAvatarEmoji) mobileAvatarEmoji.style.display = "inline";
      };
      mobileAvatarImg.onload = () => {
        mobileAvatarImg.style.display = "block";
        if (mobileAvatarEmoji) mobileAvatarEmoji.style.display = "none";
      };
    }
  }

  if (ui.gold)  ui.gold.textContent  = p.gold;
  if (ui.level) ui.level.textContent = p.level;

  const strBonus = (derived.strength||0) - (p.strength||0);
  const agiBonus = (derived.agility||0)  - (p.agility||0);
  const intBonus = (derived.intelligence||0) - (p.intelligence||0);
  if (ui.strength)     ui.strength.textContent     = `${p.strength||0}${strBonus?` +${strBonus}`:""}`;
  if (ui.agility)      ui.agility.textContent      = `${p.agility||0}${agiBonus?` +${agiBonus}`:""}`;
  if (ui.intelligence) ui.intelligence.textContent = `${p.intelligence||0}${intBonus?` +${intBonus}`:""}`;
  if (ui["stat-points"]) ui["stat-points"].textContent = p.statPoints||0;
  const spRow = ui["stat-points-row"] || document.getElementById("stat-points-row");
  if (spRow) spRow.style.display = (p.statPoints > 0) ? "" : "none";

  const loc = window.worldMap?.[gameState.currentLocationId];
  if (ui["location-name"]) ui["location-name"].textContent = loc?.name || gameState.currentLocationId;

  // Enemy panel — boss detection + HP bar + debuffs
  if (gameState.currentEnemy) {
    const ep = ui["enemy-panel"];
    ep?.classList.remove("hidden");
    const isBoss = !!gameState.currentEnemy.isBoss;
    if (isBoss) ep?.classList.add("is-boss"); else ep?.classList.remove("is-boss");
    
    if (ui["enemy-name"]) {
      const badge = isBoss ? `<span class="boss-badge">⚠ Jefe</span>` : "";
      const enemyAtk = gameState.currentEnemy.attack || 0;
      const enemyDef = gameState.currentEnemy.defense || 0;
      ui["enemy-name"].innerHTML =
        badge + gameState.currentEnemy.type +
        `<span class="enemy-stats-row">` +
        `<span class="enemy-stat-badge">⚔ <b>${enemyAtk}</b></span>` +
        `<span class="enemy-stat-badge">🛡 <b>${enemyDef}</b></span>` +
        `</span>`;
    }
    const ePct = Math.max(0, Math.round((gameState.currentEnemy.hp / gameState.currentEnemy.maxHp) * 100));
    if (ui["enemy-hp"]) ui["enemy-hp"].textContent = `${gameState.currentEnemy.hp}/${gameState.currentEnemy.maxHp}`;
    const bar = document.getElementById("enemy-hp-bar");
    if (bar) {
      bar.style.width = `${ePct}%`;
      if (!isBoss) bar.style.background = ePct > 50 ? "var(--md-error)" : ePct > 25 ? "#f97316" : "#dc2626";
    }
    const debuffEl = document.getElementById("enemy-debuffs");
    if (debuffEl) {
      const tags = [];
      if (gameState.activeDebuffs?.poison) tags.push(`<span class="edebuff poison">☠️ ×${gameState.activeDebuffs.poison.turns}</span>`);
      if (gameState.activeDebuffs?.burn)   tags.push(`<span class="edebuff burn">🔥 ×${gameState.activeDebuffs.burn.turns}</span>`);
      if (gameState.activeDebuffs?.frozen) tags.push(`<span class="edebuff frozen">❄️ ×${gameState.activeDebuffs.frozen.turns}</span>`);
      debuffEl.innerHTML = tags.join("");
    }
  } else {
    ui["enemy-panel"]?.classList.add("hidden");
    ui["enemy-panel"]?.classList.remove("is-boss");
  }

  // Retrato del enemigo
  const enemyPortrait = document.getElementById("enemy-portrait");
  if (enemyPortrait) {
    if (gameState.currentEnemy) {
      const src = `${ENEMY_PORTRAIT_PATH}${gameState.currentEnemy.id}.png`;
      if (enemyPortrait.dataset.src !== src) {
        enemyPortrait.dataset.src = src;
        enemyPortrait.src = src;
        enemyPortrait.style.display = "";
      }
    } else {
      enemyPortrait.style.display = "none";
      enemyPortrait.dataset.src = "";
    }
  }
  
  // Location subtitle + exits
  updateLocationSubtitle(loc);

  // Combat vs Navigation — swap limpio con animación
  const inCombat = gameState.isInCombat;
  const combatEl = ui["combat-menu"];
  const navEl    = ui["navigation-menu"];
  if (combatEl && navEl) {
    if (inCombat) {
      if (combatEl.classList.contains("hidden")) {
        combatEl.classList.remove("hidden");
        combatEl.style.animation = "slideDown var(--dur-m2) var(--ease-dec) both";
      }
      navEl.classList.add("hidden");
    } else {
      combatEl.classList.add("hidden");
      if (navEl.classList.contains("hidden")) {
        navEl.classList.remove("hidden");
        navEl.style.animation = "slideDown var(--dur-m2) var(--ease-dec) both";
      }
    }
    // Asegurar contenidos visibles sin colapsar
    if (ui["combat-content"]) { ui["combat-content"].style.display = "block"; ui["combat-content"].classList.remove("collapsed"); }
    if (ui["navigation-content"]) { ui["navigation-content"].style.display = "block"; ui["navigation-content"].classList.remove("collapsed"); }
  }

  // Sincronizar barra de navegación móvil inferior
  const mobCombat = ui["mob-combat"] || document.getElementById("mob-combat");
  const mobNav    = ui["mob-nav"]    || document.getElementById("mob-nav");
  if (mobCombat && mobNav) {
    mobCombat.classList.toggle("hidden", !inCombat);
    mobNav.classList.toggle("hidden",  inCombat);
    // Sincronizar estado disabled de botones móviles
    ["mob-attackBtn","mob-magicBtn","mob-itemBtn","mob-fleeBtn"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.disabled = !inCombat;
    });
  }

  const disabled = !gameState.isInCombat;
  if (ui.attackBtn) ui.attackBtn.disabled = disabled;
  if (ui.magicBtn)  ui.magicBtn.disabled  = disabled;
  if (ui.itemBtn)   ui.itemBtn.disabled   = disabled;
  if (ui.fleeBtn)   ui.fleeBtn.disabled   = disabled;

  const navLocked = gameState.isProcessingMove || gameState.isInCombat;
  document.querySelectorAll("#navigation-menu [data-direction], #mob-nav [data-direction], #navigation-menu .compass-action-btn").forEach(btn => {
    btn.disabled = navLocked;
  });

  if (gameState.isProcessingMove) {
    document.querySelectorAll("#navigation-menu button, #mob-nav button").forEach(btn => {
      btn.classList.add("disabled");
    });
  } else {
    document.querySelectorAll("#navigation-menu button, #mob-nav button").forEach(btn => {
      btn.classList.remove("disabled");
    });
  }

  if (ui["derived-attack"])  ui["derived-attack"].textContent  = derived.attack ?? 0;
  if (ui["derived-defense"]) ui["derived-defense"].textContent = derived.defense ?? 0;
  if (ui["derived-magic"])   ui["derived-magic"].textContent   = derived.magic ?? 0;

  // NPC talk button — visible only when an NPC is present and not in combat
  const npcTalkBtn = ui["npc-talk-btn"] || document.getElementById("npc-talk-btn");
  if (npcTalkBtn) {
    ui["npc-talk-btn"] = npcTalkBtn;
    const npcHere = getNpcAt(gameState.currentLocationId);
    npcTalkBtn.classList.toggle("hidden", !npcHere || inCombat);
  }

  // Buff bar
  updateBuffBar();
  // Skill panel (combat)
  updateSkillPanel();
  // Profile card
  updateProfileCard();
}

function updateLocationSubtitle(loc) {
  // Imagen de ubicación: override específico → fallback por bioma
  const locImg = document.getElementById("location-img");
  if (locImg && loc) {
    const src = LOCATION_IMAGES[loc.id] || `${LOCATION_IMG_PATH}${loc.biome || "none"}.png`;
    if (locImg.dataset.src !== src) {
      locImg.dataset.src = src;
      locImg.src = src;
      locImg.alt = loc.name || "";
      locImg.style.display = "";
    }
  }

  const sub = document.getElementById("location-subtitle");
  if (!sub || !loc) return;
  const biomeEmojis = { forest:"🌲", cave:"⛰️", swamp:"🌿", mountain:"🏔️", town:"🏘️", sea:"🌊", desert:"🏜️", dungeon:"🗝️", none:"🏛️" };
  const biomeEmoji = biomeEmojis[loc.biome] || "📍";
  const exits = Object.keys(loc.exits || {});
  const dirLabels = { north:"N", south:"S", east:"E", west:"O", up:"↑", down:"↓", enter:"⬤", out:"↩" };
  const exitChips = exits.map(d => `<span class="exit-chip">${dirLabels[d]||d}</span>`).join("");
  sub.innerHTML = `<span>${biomeEmoji} ${loc.biome || "zona"}</span>${loc.safeZone ? ' <span class="exit-chip">🕊 Zona segura</span>' : ""}${loc.canRest ? ' <span class="exit-chip">💤 Descanso</span>' : ""}<span style="flex:1"></span>${exitChips}`;
}

function updateProfileCard() {
  const p = gameState.player;
  if (!p.name) return;
  const nameEl  = document.getElementById("profile-name");
  const roleEl  = document.querySelector(".profile-role");
  const portrait = document.getElementById("char-portrait");
  const emojiEl  = ui["char-portrait-emoji"] || document.getElementById("char-portrait-emoji");

  if (nameEl) nameEl.textContent = p.name || "Aventurero";
  if (roleEl && p.class) roleEl.textContent = `Nv.${p.level} ${p.className||""}`;

  if (portrait && p.class) {
    const src = CLASS_AVATARS[p.class];
    let img = portrait.querySelector("img.avatar-img");
    if (src) {
      if (!img) {
        img = document.createElement("img");
        img.className = "avatar-img";
        img.alt = p.className || p.class;
        img.onerror = () => {
          img.style.display = "none";
          if (emojiEl) emojiEl.style.display = "";
        };
        img.onload = () => {
          if (emojiEl) emojiEl.style.display = "none";
        };
        portrait.appendChild(img);
      }
      if (img.dataset.src !== src) {
        img.dataset.src = src;
        img.src = src;
        img.style.display = "";
      }
    }
  } else if (emojiEl && p.classEmoji) {
    emojiEl.textContent = p.classEmoji;
  }
}

function updateBuffBar() {
  const bar = ui["buff-bar"] || document.getElementById("buff-bar");
  if (!bar) return;
  const buffs        = gameState.activeBuffs   || {};
  const playerDebuffs = gameState.playerDebuffs || {};
  const chips = [];
  // Player buffs
  if (buffs.warcry > 0)        chips.push(`<span class="buff-chip buff">📣 Grito ×${buffs.warcry}</span>`);
  if (buffs.defend_stance > 0)  chips.push(`<span class="buff-chip buff">🛡️ Postura ×${buffs.defend_stance}</span>`);
  if (buffs.arcane_shield > 0)  chips.push(`<span class="buff-chip buff">💠 Escudo</span>`);
  // Player debuffs
  if (playerDebuffs.poison) chips.push(`<span class="buff-chip debuff-poison">☠️ Veneno ×${playerDebuffs.poison.turns}</span>`);
  if (playerDebuffs.burn)   chips.push(`<span class="buff-chip debuff-burn">🔥 Quemadura ×${playerDebuffs.burn.turns}</span>`);
  if (playerDebuffs.stun)   chips.push(`<span class="buff-chip debuff-stun">💫 Aturdido ×${playerDebuffs.stun.turns}</span>`);
  bar.innerHTML = chips.join("") || "";
  bar.style.display = chips.length ? "flex" : "none";
}

function updateSkillPanel() {
  const panel = ui["skill-panel"] || document.getElementById("skill-panel");
  if (!panel) return;
  const p = gameState.player;
  if (!p.class || !gameState.isInCombat) { panel.innerHTML = ""; return; }

  const skills = getAvailableSkills(p.class, p.level);
  if (!skills.length) { panel.innerHTML = ""; return; }

  panel.innerHTML = skills.map(s => {
    const canUse = (p.mp||0) >= s.mpCost;
    const elite  = s.levelReq >= 15 ? "skill-elite" : "";
    return `<button class="btn skill-btn ${elite} ${canUse?"":"outlined"}"
      data-skill="${s.id}" ${!canUse?"disabled":""} title="${s.description} (Nv.${s.levelReq})">
      ${s.emoji} ${s.name} <span class="skill-cost">${s.mpCost}MP</span>
    </button>`;
  }).join("");

  panel.querySelectorAll("[data-skill]").forEach(btn => {
    btn.addEventListener("click", () => {
      window.dispatchEvent(new CustomEvent("pixel:useSkill", { detail: { skillId: btn.dataset.skill } }));
    });
  });
}

// ── NPC MODAL ──────────────────────────────────────────
function openNpcModal(npc) {
  const modal = document.getElementById("npcModal");
  if (!modal) return;

  const emojiEl = document.getElementById("npcEmoji");
  const nameEl  = document.getElementById("npcName");
  const roleEl  = document.getElementById("npcRole");
  const loreEl  = document.getElementById("npcLore");
  if (emojiEl) emojiEl.textContent = npc.emoji;
  if (nameEl)  nameEl.textContent  = npc.name;
  if (roleEl)  roleEl.textContent  = npc.role;
  if (loreEl)  loreEl.textContent  = npc.lore;

  const questId = npc.questId;
  const status  = getQuestStatus(questId);
  const lines   = getQuestDialogue(questId);
  const label   = getQuestActionLabel(questId);

  const badge = document.getElementById("npcQuestBadge");
  if (badge) {
    badge.className = `npc-quest-badge ${status}`;
    badge.textContent = status === "inactive" ? "Misión disponible"
                      : status === "active"   ? "En progreso"
                      : "Completada ✓";
  }

  const titleEl = document.getElementById("npcQuestTitle");
  if (titleEl) titleEl.textContent = QUEST_DATA[questId]?.title ?? "";

  const dialogueEl = document.getElementById("npcDialogue");
  if (dialogueEl) dialogueEl.innerHTML = lines.map(l => `<p>${l}</p>`).join("");

  const actionBtn = document.getElementById("npcActionBtn");
  if (actionBtn) {
    if (label) {
      actionBtn.textContent = label;
      actionBtn.classList.remove("hidden");
      actionBtn.onclick = () => {
        const curStatus = getQuestStatus(questId);
        if (curStatus === "inactive") {
          activateQuest(questId);
        } else if (curStatus === "active" && checkQuestCondition(questId)) {
          completeQuest(questId);
          updateUI();
        }
        openNpcModal(npc);
      };
    } else {
      actionBtn.classList.add("hidden");
      actionBtn.onclick = null;
    }
  }

  modal.classList.remove("hidden");
}

// ── MAIN MENU ──────────────────────────────────────────
export function toggleMainMenu(show) {
  const modal = document.getElementById("mainMenuModal");
  if (modal) {
    modal.classList.toggle("hidden", !show);
    if (show) {
      updateSaveInfo();
      _syncAudioControls();
    }
  }
}

export function updateSaveInfo() {
  const saveInfo  = document.getElementById("saveInfo");
  const continueBtn = document.getElementById("continueBtn");
  const loadBtn   = document.getElementById("loadGameBtn");
  const deleteBtn = document.getElementById("deleteSaveBtn");
  if (!saveInfo) return;

  const exists = hasSavedGame();
  if (exists) {
    try {
      const data = JSON.parse(localStorage.getItem("pixelQuestSave"));
      const date = new Date(data.timestamp);
      const lvl  = data.gameState?.player?.level ?? "?";
      const cls  = data.gameState?.player?.className || "Aventurero";
      const gold = data.gameState?.player?.gold ?? 0;
      saveInfo.innerHTML = `<p>💾 ${date.toLocaleString()}</p><p>${cls} · Nivel ${lvl} · ${gold} 🪙</p>`;
      if (continueBtn) continueBtn.disabled = false;
      if (loadBtn)     loadBtn.disabled     = false;
      if (deleteBtn)   deleteBtn.disabled   = false;
    } catch { saveInfo.innerHTML = "<p>Partida corrupta</p>"; }
  } else {
    saveInfo.innerHTML = "<p>Sin partida guardada</p>";
    if (continueBtn) continueBtn.disabled = true;
    if (loadBtn)     loadBtn.disabled     = true;
    if (deleteBtn)   deleteBtn.disabled   = true;
  }
}

// ── STATS MODAL ────────────────────────────────────────
export function renderStatsModal() {
  const p = gameState.player;
  const ptsEl  = document.getElementById("modal-stat-points");
  const strEl  = document.getElementById("modal-strength");
  const agiEl  = document.getElementById("modal-agility");
  const intEl  = document.getElementById("modal-intelligence");
  if (ptsEl) ptsEl.textContent = p.statPoints ?? 0;
  if (strEl) strEl.textContent = p.strength ?? 0;
  if (agiEl) agiEl.textContent = p.agility ?? 0;
  if (intEl) intEl.textContent = p.intelligence ?? 0;

  const hint = document.getElementById("stat-class-hint");
  const cls = CLASS_DEFINITIONS[p.class];
  if (hint && cls) {
    hint.textContent = `💡 ${cls.name}: stat principal → ${cls.primaryStat.toUpperCase()}`;
  }

  const setup = (id, stat) => {
    const el = document.getElementById(id);
    if (!el) return;
    const clone = el.cloneNode(true);
    el.replaceWith(clone);
    clone.disabled = (p.statPoints <= 0);
    clone.addEventListener("click", () => {
      if (increaseStat(stat)) { renderStatsModal(); updateUI(); }
    });
  };
  setup("inc-str", "strength");
  setup("inc-agi", "agility");
  setup("inc-int", "intelligence");
}

// ── AUDIO CONTROLS ─────────────────────────────────────
function _syncAudioControls() {
  const sfxSlider   = document.getElementById("sfx-volume");
  const musicSlider = document.getElementById("music-volume");
  const sfxBtn      = document.getElementById("sfx-mute-btn");
  const musicBtn    = document.getElementById("music-mute-btn");
  if (sfxSlider)   sfxSlider.value   = Math.round(getVolume() * 100);
  if (musicSlider) musicSlider.value = Math.round(getMusicVolume() * 100);
  if (sfxBtn)      sfxBtn.classList.toggle("muted",   isMuted());
  if (musicBtn)    musicBtn.classList.toggle("muted",  isMusicMuted());
}

function _setupAudioControls() {
  const sfxSlider   = document.getElementById("sfx-volume");
  const musicSlider = document.getElementById("music-volume");
  const sfxBtn      = document.getElementById("sfx-mute-btn");
  const musicBtn    = document.getElementById("music-mute-btn");

  sfxSlider?.addEventListener("input", () => {
    setVolume(sfxSlider.value / 100);
  });
  musicSlider?.addEventListener("input", () => {
    setMusicVolume(musicSlider.value / 100);
  });

  sfxBtn?.addEventListener("click", () => {
    const muted = toggleMute();
    sfxBtn.classList.toggle("muted", muted);
    sfxBtn.textContent = muted ? "🔇" : "🔊";
  });
  musicBtn?.addEventListener("click", () => {
    const muted = toggleMusicMute();
    musicBtn.classList.toggle("muted", muted);
    musicBtn.textContent = muted ? "🔇" : "🎵";
  });

  // Sincronizar controles cada vez que se abre el menú
  window.addEventListener("pixel:menuOpen", _syncAudioControls);
}

// ── UI LISTENERS ───────────────────────────────────────
export function setupUIListeners() {
  initUICache();

  window.addEventListener("pixel:stateUpdated", () => updateUI());
  window.addEventListener("pixel:saveChanged",  () => updateSaveInfo());

  // Inventory
  const openInv = () => { renderInventory(); document.getElementById("inventoryModal")?.classList.remove("hidden"); };
  document.getElementById("inventoryBtn")?.addEventListener("click", openInv);
  document.getElementById("inventoryBtn2")?.addEventListener("click", openInv);
  document.getElementById("closeInventoryBtn")?.addEventListener("click", () => {
    document.getElementById("inventoryModal")?.classList.add("hidden");
    const dc = document.getElementById("itemDetailCard");
    const de = document.querySelector("#inventoryDetail .item-detail-empty");
    if (dc) dc.style.display = "none";
    if (de) de.style.display = "";
  });

  // Shop
  document.getElementById("shopBtn")?.addEventListener("click", () => {
    const loc = window.worldMap?.[gameState.currentLocationId];
    if (loc && ["shop","castle_shop","port"].includes(loc.id)) {
      renderShop(); document.getElementById("shopModal")?.classList.remove("hidden");
    } else addMessage("Necesitas estar en una tienda.", "system");
  });
  document.getElementById("closeShopBtn")?.addEventListener("click",  () => document.getElementById("shopModal")?.classList.add("hidden"));

  // Stats
  document.getElementById("statsBtn")?.addEventListener("click", () => { renderStatsModal(); document.getElementById("statsModal")?.classList.remove("hidden"); });
  document.getElementById("closeStatsBtn")?.addEventListener("click", () => document.getElementById("statsModal")?.classList.add("hidden"));

  // Rest
  document.getElementById("restBtn")?.addEventListener("click", () => {
    const loc = window.worldMap?.[gameState.currentLocationId];
    if (loc?.canRest) {
      playSound("rest");
      const hpGain = gameState.player.maxHp - gameState.player.hp;
      const mpGain = gameState.player.maxMp - gameState.player.mp;
      gameState.player.hp = gameState.player.maxHp;
      gameState.player.mp = gameState.player.maxMp;
      addMessage(`Descansas y recuperas ${hpGain} HP y ${mpGain} MP.`, "stat");
      showFloatingText("¡Restaurado!", window.innerWidth/2-60, window.innerHeight/2-40, "#4ade80", "1.5em");
      updateUI();
    } else addMessage("No puedes descansar aquí.", "system");
  });

  // FAB
  document.getElementById("floatingMenuBtn")?.addEventListener("click", () => toggleMainMenu(true));

  // Game Over restart
  document.getElementById("restartBtn")?.addEventListener("click", () => {
    document.getElementById("gameOverModal")?.classList.add("hidden");
    window.dispatchEvent(new Event("pixel:newGame"));
  });

  // No collapsibles in new layout

  // Direction buttons (compass pad - all directional buttons)
  document.querySelectorAll("[data-direction]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const dir = e.currentTarget.getAttribute("data-direction");
      if (dir) window.dispatchEvent(new CustomEvent("pixel:move", { detail: { direction: dir } }));
    });
  });

  // Combat
  document.getElementById("attackBtn")?.addEventListener("click", () => window.dispatchEvent(new Event("pixel:attack")));
  document.getElementById("magicBtn")?.addEventListener("click",  () => window.dispatchEvent(new Event("pixel:magic")));
  document.getElementById("itemBtn")?.addEventListener("click",   () => { renderInventory(); document.getElementById("inventoryModal")?.classList.remove("hidden"); });
  document.getElementById("fleeBtn")?.addEventListener("click",   () => window.dispatchEvent(new Event("pixel:flee")));

  // Story log filters
  document.querySelectorAll(".sf-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".sf-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const story = document.getElementById("story");
      if (story) {
        story.setAttribute("data-filter", btn.dataset.filter);
        story.scrollTop = story.scrollHeight;
      }
    });
  });

  // Quest log
  setupQuestLogTabs();
  document.getElementById("questLogBtn")?.addEventListener("click", () => {
    renderQuestLog("active");
    document.querySelectorAll(".ql-tab").forEach(t => t.classList.toggle("active", t.dataset.tab === "active"));
    document.getElementById("questLogModal")?.classList.remove("hidden");
  });
  document.getElementById("closeQuestLogBtn")?.addEventListener("click", () =>
    document.getElementById("questLogModal")?.classList.add("hidden")
  );

  // Audio controls
  _setupAudioControls();

  // NPC modal
  const handleNpcTalk = () => {
    const npc = getNpcAt(gameState.currentLocationId);
    if (!npc) {
      console.warn("NPC talk clicked but no NPC found at", gameState.currentLocationId);
      return;
    }
    playSound("npc_talk");
    openNpcModal(npc);
  };

  const npcTalkButton = ui["npc-talk-btn"] || document.getElementById("npc-talk-btn");
  if (npcTalkButton) {
    ui["npc-talk-btn"] = npcTalkButton;
    npcTalkButton.addEventListener("click", handleNpcTalk);
  }

  document.getElementById("mobileSheetClose")?.addEventListener("click", _closeMobileSheet);
  const mobileSheet = document.getElementById("mobileSheet");
  mobileSheet?.addEventListener("click", (e) => {
    if (e.target === mobileSheet || e.target.classList.contains("mobile-sheet-backdrop")) {
      _closeMobileSheet();
    }
  });

  document.getElementById("mobActionInventoryBtn")?.addEventListener("click", () => {
    _closeMobileSheet();
    renderInventory();
    document.getElementById("inventoryModal")?.classList.remove("hidden");
  });
  document.getElementById("mobActionStatsBtn")?.addEventListener("click", () => {
    _closeMobileSheet();
    renderStatsModal();
    document.getElementById("statsModal")?.classList.remove("hidden");
  });
  document.getElementById("mobActionRestBtn")?.addEventListener("click", () => {
    _closeMobileSheet();
    const loc = window.worldMap?.[gameState.currentLocationId];
    if (loc?.canRest) {
      playSound("rest");
      const hpGain = gameState.player.maxHp - gameState.player.hp;
      const mpGain = gameState.player.maxMp - gameState.player.mp;
      gameState.player.hp = gameState.player.maxHp;
      gameState.player.mp = gameState.player.maxMp;
      addMessage(`Descansas y recuperas ${hpGain} HP y ${mpGain} MP.`, "stat");
      showFloatingText("¡Restaurado!", window.innerWidth/2-60, window.innerHeight/2-40, "#4ade80", "1.5em");
      updateUI();
    } else addMessage("No puedes descansar aquí.", "system");
  });
  document.getElementById("mobActionShopBtn")?.addEventListener("click", () => {
    _closeMobileSheet();
    const loc = window.worldMap?.[gameState.currentLocationId];
    if (loc && ["shop","castle_shop","port"].includes(loc.id)) {
      renderShop();
      document.getElementById("shopModal")?.classList.remove("hidden");
    } else addMessage("Necesitas estar en una tienda.", "system");
  });
  document.getElementById("mobActionQuestLogBtn")?.addEventListener("click", () => {
    _closeMobileSheet();
    renderQuestLog("active");
    document.querySelectorAll(".ql-tab").forEach(t => t.classList.toggle("active", t.dataset.tab === "active"));
    document.getElementById("questLogModal")?.classList.remove("hidden");
  });

  document.querySelectorAll("#mobileSheet [data-panel]").forEach(btn => {
    btn.addEventListener("click", _closeMobileSheet);
  });

  const closeNpc = () => document.getElementById("npcModal")?.classList.add("hidden");
  document.getElementById("closeNpcBtn")?.addEventListener("click", closeNpc);
  document.getElementById("closeNpcActionBtn")?.addEventListener("click", closeNpc);
}
