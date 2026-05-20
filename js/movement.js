import { gameState } from "./state.js";
import { addMessage } from "./story.js";
import { getRandomEncounter } from "./combat.js";
import { updateUI } from "./ui.js";
import { recordLocationVisit } from "./bestiary.js";
import { allItems } from "./items.js";
import { playSound, playMusic } from "./sounds.js";
import { checkAchievements } from "./achievements.js";
import { getTravelEvent, showTravelEvent } from "./travelEvents.js";
import { trySpawnBoss } from "./biomeBosses.js";
import { t, formatText, localizeText } from "./i18n.js";

let _movesSinceLastBoss = 0;
const BOSS_COOLDOWN = 8; // mínimo de movimientos entre apariciones de jefe

// ── ZONAS BLOQUEADAS ──────────────────────────────────────────────
// La primera vez que el jugador intenta entrar, consume el ítem-llave.
// Si ya visitó la zona antes (visitedLocations), puede entrar libremente.
const ZONE_GATES = {
  ruin_4: {
    item: "arcane_key",
    msg: "🔒 La entrada está sellada con magia antigua. Habla con el Archimago Valdris en la Torre del Castillo Griffon."
  },
  catacomb_1: {
    item: "navigation_chart",
    msg: "🔒 Los piratas bloquean el acceso subterráneo. Habla con el Capitán Brennan en Saltwind Port."
  },
  treasure_keep_1: {
    item: "garden_key",
    msg: "🔒 La Bóveda está sellada con magia hada. Habla con la Guardiana Eryndel en el Jardín Encantado."
  },
  tundra_1: {
    item: "mountain_pass",
    msg: "🔒 El frío extremo es mortal sin preparación. Habla con Theron el Explorador en el Paso del Desfiladero."
  },
  inferno_1: {
    item: "dragon_key",
    msg: "🔒 La Puerta del Dragón permanece sellada. Habla con Pyrax, el Guardián del Volcán, en la Cima del Magma."
  }
};

export function setupMovement() {
  window.addEventListener("pixel:move", (e) => {
    const dir = e.detail?.direction;
    if (dir) handleMove(normalizeDirection(dir));
  });
}

export function handleMove(direction) {
  if (!direction) return;
  if (gameState.isGameOver) return;
  if (gameState.isInCombat) { addMessage(t("cannotMoveCombat"), "system"); return; }
  if (gameState.isProcessingMove) { addMessage(t("processingMove"), "system"); return; }

  gameState.isProcessingMove = true;
  updateUI();

  const cur = window.worldMap?.[gameState.currentLocationId];
  const nextId = cur?.exits?.[direction];
  if (!nextId || !window.worldMap[nextId]) {
    addMessage(t("cannotGoDirection"), "system");
    gameState.isProcessingMove = false;
    updateUI();
    return;
  }

  // ── Verificar zona bloqueada ────────────────────────────────────
  const gate = ZONE_GATES[nextId];
  const alreadyVisited = !!(gameState.visitedLocations?.[nextId]);

  if (gate && !alreadyVisited) {
    const hasKey = (gameState.inventory?.[gate.item] ?? 0) > 0;
    if (!hasKey) {
      addMessage(gate.msg, "system");
      gameState.isProcessingMove = false;
      updateUI();
      return;
    }
    // Consumir la llave al cruzar por primera vez
    gameState.inventory[gate.item]--;
    if (gameState.inventory[gate.item] <= 0) delete gameState.inventory[gate.item];
    const keyName = localizeText(allItems[gate.item]?.name ?? gate.item);
    addMessage(formatText("usingKey", { item: keyName }), "loot");
  }

  // ── Mover al jugador ────────────────────────────────────────────
  playSound("move");
  gameState.currentLocationId = nextId;
  window.dispatchEvent(new CustomEvent("pixel:locationChanged"));
  const movedLoc = window.worldMap[nextId];
  playMusic(movedLoc?.biome || "none");
  checkAchievements();

  // Registrar visita (para misiones tipo "visit" y compatibilidad futura)
  if (!gameState.visitedLocations) gameState.visitedLocations = {};
  gameState.visitedLocations[nextId] = true;

  const newLoc = window.worldMap[nextId];

  addMessage(formatText("travelTo", {
    direction: dirLabel(direction),
    location: localizeText(newLoc.name)
  }), "narrative");
  const desc = Array.isArray(newLoc.description)
    ? newLoc.description[Math.floor(Math.random() * newLoc.description.length)]
    : newLoc.description;
  if (desc) addMessage(desc, "narrative");

  // Record visit for journal/bestiary
  recordLocationVisit();

  // Contextual hints
  if (newLoc.canRest)   addMessage(t("restHint"), "system");
  if (newLoc.id === "shop" || newLoc.id === "castle_shop" || newLoc.id === "port") {
    addMessage(t("shopHint"), "system");
  }

  // ── Intentar aparición de jefe primero ────────────────────────────
  _movesSinceLastBoss++;
  const biome = movedLoc?.biome;
  let combatTarget = null;
  let asBoss = false;

  if (biome && _movesSinceLastBoss >= BOSS_COOLDOWN) {
    const bossId = trySpawnBoss(biome);
    if (bossId) {
      combatTarget = bossId;
      asBoss = true;
      _movesSinceLastBoss = 0;
      addMessage(t("bossApproaches"), "narrative");
    }
  }

  if (!combatTarget) combatTarget = getRandomEncounter(nextId);

  if (combatTarget) {
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("pixel:startCombat", {
        detail: { enemyId: combatTarget, isBoss: asBoss }
      }));
      gameState.isProcessingMove = false;
      updateUI();
    }, 400);
  } else {
    const tevt = getTravelEvent(biome);
    if (tevt) {
      setTimeout(() => {
        showTravelEvent(tevt);
        updateUI();
      }, 700);
    } else {
      setTimeout(() => {
        gameState.isProcessingMove = false;
        updateUI();
      }, 250);
    }
  }

  updateUI();
}

function normalizeDirection(direction) {
  if (!direction) return direction;
  const dir = String(direction).toLowerCase().trim();
  const map = {
    norte: "north",
    sur: "south",
    este: "east",
    oeste: "west",
    subir: "up",
    bajar: "down",
    arriba: "up",
    abajo: "down",
    entrar: "enter",
    salir: "out",
    out: "out"
  };
  return map[dir] || dir;
}

function dirLabel(dir) {
  const key = `dir${String(dir || "").charAt(0).toUpperCase()}${String(dir || "").slice(1)}`;
  return t(key) || dir || "";
}
