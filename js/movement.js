import { gameState } from "./state.js";
import { addMessage } from "./story.js";
import { getRandomEncounter } from "./combat.js";
import { updateUI } from "./ui.js";
import { recordLocationVisit } from "./bestiary.js";
import { allItems } from "./items.js";
import { playSound, playMusic } from "./sounds.js";
import { checkAchievements } from "./achievements.js";
import { getTravelEvent, showTravelEvent } from "./travelEvents.js";
import { trySpawnBoss, AMBUSH_CHANCE_MULT } from "./biomeBosses.js";
import { showMiniBossReunion } from "./miniBossReunion.js";
import { t, formatText, localizeText } from "./i18n.js";
import { maybeShowHint } from "./onboarding.js";
import { maybeStartEchoIntro } from "./echoIntro.js";
import { maybeStartRivalEncounter } from "./rivalArc.js";

let _movesSinceLastBoss = 0;
const BOSS_COOLDOWN = 8; // mínimo de movimientos entre apariciones de jefe
// SPEC-1104: liberar el eco en el bosque → protección del bosque (-50%,
// solo bioma forest); se compone con AMBUSH_CHANCE_MULT si ambos aplican.
const FOREST_PROTECTION_MULT = 0.5;

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
  const rawDesc = Array.isArray(newLoc.description)
    ? newLoc.description[Math.floor(Math.random() * newLoc.description.length)]
    : newLoc.description;
  const desc = localizeText(rawDesc);
  if (desc) addMessage(desc, "narrative");

  // Record visit for journal/bestiary
  recordLocationVisit();

  // Contextual hints
  if (newLoc.canRest)   addMessage(t("restHint"), "system");
  // SPEC-0801: zona segura + herido → hint de descanso/guardado;
  // volver a town → fallback del hint de Elara si se perdió la ventana inicial
  if (newLoc.canRest && gameState.player.hp < gameState.player.maxHp) maybeShowHint("rest_save");
  if (newLoc.id === "town") maybeShowHint("talk_elara");
  if (newLoc.id === "shop" || newLoc.id === "castle_shop" || newLoc.id === "port") {
    addMessage(t("shopHint"), "system");
  }

  // ── Escena guionizada del eco (SPEC-0902): primera llegada a forest_1 ──
  if (maybeStartEchoIntro(nextId)) {
    updateUI();
    return; // la escena gestiona isProcessingMove vía el modal de evento
  }

  // ── SPEC-1108: Kestrel, el rival recurrente — 3 encuentros guionizados ──
  if (maybeStartRivalEncounter(nextId)) {
    updateUI();
    return; // mismo patrón: el modal gestiona isProcessingMove
  }

  // ── Intentar aparición de jefe primero ────────────────────────────
  _movesSinceLastBoss++;
  const biome = movedLoc?.biome;
  let combatTarget = null;
  let asBoss = false;

  if (biome && _movesSinceLastBoss >= BOSS_COOLDOWN) {
    // SPEC-1104: robar la bolsa → más emboscadas; liberar el eco en el
    // bosque → protección del bosque (solo bioma forest). Se componen.
    let ambushMult = gameState.worldFlags?.purse_taken ? AMBUSH_CHANCE_MULT : 1;
    if (biome === "forest" && gameState.worldFlags?.echo_freed) ambushMult *= FOREST_PROTECTION_MULT;
    const bossId = trySpawnBoss(biome, ambushMult);
    if (bossId) {
      const spareFlag = "spared_" + bossId;
      if (gameState.worldFlags?.[spareFlag] && !gameState.worldFlags?.[spareFlag + "_resolved"]) {
        // SPEC-1104: mini-boss perdonado antes — reencuentro narrativo en vez
        // de combate; no debe además tirar un encuentro normal este mismo
        // movimiento, así que corta acá (mismo patrón early-return que
        // maybeStartEchoIntro más arriba).
        _movesSinceLastBoss = 0;
        setTimeout(() => showMiniBossReunion(bossId), 700);
        updateUI();
        return;
      }
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
