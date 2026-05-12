/**
 * quests.js — Sistema de misiones de Pixel Quest Echoes
 *
 * Tipos de condición:
 *   "visit"   — el jugador ha estado en cierta locationId
 *   "collect" — el jugador tiene ≥ qty de un ítem en inventario
 *   "kill"    — el jugador ha matado ≥ count de cierto enemigo
 */
import { gameState } from "./state.js";
import { addMessage } from "./story.js";
import { allItems } from "./items.js";
import { playSound } from "./sounds.js";
import { checkAchievements } from "./achievements.js";

// ── DEFINICIONES ───────────────────────────────────────────────────
export const QUEST_DATA = {

  explore_forest: {
    id: "explore_forest",
    title: "El Bosque de Valdris",
    type: "visit",
    target: "forest_3",
    reward: { item: "world_map", xp: 50, gold: 30 },
    dialogues: {
      inactive: [
        "Viajero, el Bosque de Valdris oculta algo que no debería existir.",
        "¿Tendrías el valor de adentrarte hasta su corazón y regresar con lo que descubras?"
      ],
      active: [
        "El corazón del bosque aún te espera.",
        "Sigue hacia el norte desde aquí. El Bosque de Valdris es la tercera zona."
      ],
      completed: [
        "Lo has visto con tus propios ojos. La oscuridad crece.",
        "Toma este Mapa del Mundo — te mostrará caminos que aún no conoces."
      ]
    }
  },

  collect_crystal: {
    id: "collect_crystal",
    title: "El Fragmento Arcano",
    type: "collect",
    item: "crystal_shard",
    qty: 1,
    consumeItem: false,
    reward: { item: "arcane_key", xp: 120, gold: 80 },
    dialogues: {
      inactive: [
        "Las Ruinas de Eldrast están selladas con magia antigua. Solo una Llave Arcana puede abrirlas.",
        "Yo puedo forjarla, pero necesito un Crystal Shard de las cavernas profundas. ¿Lo conseguirás?"
      ],
      active: [
        "Todavía no tienes el Crystal Shard.",
        "Búscalo en las Cavernas del Eco y las Mazmorras de Ironcroft."
      ],
      completed: [
        "Excelente. Con esto forjo la Llave Arcana.",
        "Las Ruinas de Eldrast te esperan — pero ten cuidado. Lo que duerme allí lleva siglos sin ser perturbado."
      ]
    }
  },

  kill_pirates: {
    id: "kill_pirates",
    title: "La Costa de los Piratas",
    type: "kill",
    enemy: "pirate",
    count: 3,
    reward: { item: "navigation_chart", xp: 100, gold: 120 },
    dialogues: {
      inactive: [
        "Malditos piratas. Han bloqueado todos los accesos subterráneos a las Catacumbas de Areth.",
        "Derrota a tres de ellos en la Costa de las Sirenas y te daré la Carta de Navegación."
      ],
      active_template: "Sigue luchando. Necesitas derrotar a {remaining} pirata(s) más en la Costa de las Sirenas.",
      completed: [
        "¡Los piratas están en retirada!",
        "Toma la Carta de Navegación — te abrirá paso a las Catacumbas de Areth."
      ]
    }
  },

  collect_fairy_dust: {
    id: "collect_fairy_dust",
    title: "El Polvo de las Hadas",
    type: "collect",
    item: "fairy_dust",
    qty: 1,
    consumeItem: false,
    reward: { item: "garden_key", xp: 80, gold: 50 },
    dialogues: {
      inactive: [
        "La Bóveda Olvidada solo puede abrirse con la esencia de este jardín.",
        "Un poco de Fairy Dust sería suficiente. Florece aquí mismo, si te atreves a buscarlo entre las criaturas que lo custodian."
      ],
      active: [
        "El Fairy Dust florece en este jardín.",
        "Derrota a las criaturas que lo guardan y regresa conmigo."
      ],
      completed: [
        "Precioso. La esencia del jardín vibra con magia primordial.",
        "Toma esta Llave del Jardín — abrirá La Bóveda Olvidada."
      ]
    }
  },

  collect_ice_crystal: {
    id: "collect_ice_crystal",
    title: "El Cristal Helado",
    type: "collect",
    item: "ice_crystal",
    qty: 1,
    consumeItem: false,
    reward: { item: "mountain_pass", xp: 150, gold: 100 },
    dialogues: {
      inactive: [
        "Más allá de la Cumbre Eterna está la Tundra Eterna — pero el frío mata a los imprudentes.",
        "Dame un Ice Crystal y forjaré un Pase de Montaña. Los gigantes y golems de estas cimas lo portan."
      ],
      active: [
        "Sin el Ice Crystal no puedo forjar el pase.",
        "Sigue explorando las Crestas de Hierro. El cristal lo portan los gigantes y golems del lugar."
      ],
      completed: [
        "Perfecto. Toma el Pase de Montaña.",
        "La Tundra Eterna es brutal, aventurero — pero confío en que estás listo para lo que viene."
      ]
    }
  },

  defeat_dark_lord: {
    id: "defeat_dark_lord",
    title: "El Señor Oscuro",
    type: "visit",
    target: "dungeon_7",
    reward: { item: "dragon_key", xp: 300, gold: 200 },
    dialogues: {
      inactive: [
        "El Rey Dragón solo puede ser vencido por alguien que ya haya mirado a los ojos al Señor Oscuro.",
        "¿Has llegado a la Cámara del Señor Oscuro en las Mazmorras de Ironcroft?"
      ],
      active: [
        "Debes llegar a la Cámara del Señor Oscuro, en las profundidades de Ironcroft.",
        "Solo entonces te daré la Llave del Dragón y podrás abrir la Puerta del Dragón."
      ],
      completed: [
        "Impresionante. Pocas almas sobreviven a las Mazmorras de Ironcroft.",
        "Toma la Llave del Dragón. El Trono del Rey Dragón te espera.",
        "El destino de Aethoria está en tus manos."
      ]
    }
  }

};

// ── FUNCIONES DE ESTADO ────────────────────────────────────────────

/** @returns {"inactive"|"active"|"completed"} */
export function getQuestStatus(questId) {
  return gameState.quests?.[questId] ?? "inactive";
}

/** Activa una misión (inactive → active) */
export function activateQuest(questId) {
  if (!gameState.quests) gameState.quests = {};
  if (!gameState.quests[questId] || gameState.quests[questId] === "inactive") {
    gameState.quests[questId] = "active";
  }
}

/** ¿Se cumple la condición de entrega? */
export function checkQuestCondition(questId) {
  const q = QUEST_DATA[questId];
  if (!q) return false;
  if (getQuestStatus(questId) !== "active") return false;

  switch (q.type) {
    case "visit":
      return !!(gameState.visitedLocations?.[q.target]);
    case "collect":
      return (gameState.inventory?.[q.item] ?? 0) >= q.qty;
    case "kill": {
      const killed = gameState.stats?.enemiesDefeated?.[q.enemy] ?? 0;
      return killed >= q.count;
    }
    default:
      return false;
  }
}

/**
 * Entrega la misión, da recompensas y la marca como completada.
 * @returns {boolean} true si se completó correctamente
 */
export function completeQuest(questId) {
  const q = QUEST_DATA[questId];
  if (!q || !checkQuestCondition(questId)) return false;

  gameState.quests[questId] = "completed";
  playSound("quest_done");
  checkAchievements();

  // Consumir ítem de la misión si así se configuró
  if (q.consumeItem && q.item) {
    const current = gameState.inventory[q.item] ?? 0;
    const remaining = Math.max(0, current - q.qty);
    if (remaining === 0) delete gameState.inventory[q.item];
    else gameState.inventory[q.item] = remaining;
  }

  // Dar recompensas
  const { item, xp, gold } = q.reward;
  if (item) {
    gameState.inventory[item] = (gameState.inventory[item] ?? 0) + 1;
    addMessage(`📦 Recibiste: ${allItems[item]?.name ?? item}`, "loot");
  }
  if (xp) {
    gameState.player.experience = (gameState.player.experience ?? 0) + xp;
    addMessage(`✨ +${xp} XP por completar "${q.title}".`, "stat");
  }
  if (gold) {
    gameState.player.gold = (gameState.player.gold ?? 0) + gold;
    addMessage(`🪙 +${gold} de oro como recompensa.`, "loot");
  }

  return true;
}

// ── HELPERS PARA UI ────────────────────────────────────────────────

/** Líneas de diálogo según estado actual de la misión */
export function getQuestDialogue(questId) {
  const q = QUEST_DATA[questId];
  if (!q) return ["No tengo nada más que decirte por ahora."];
  const status = getQuestStatus(questId);

  if (status === "completed") return q.dialogues.completed;

  if (status === "active") {
    if (q.type === "kill" && q.dialogues.active_template) {
      const killed = gameState.stats?.enemiesDefeated?.[q.enemy] ?? 0;
      const remaining = Math.max(0, q.count - killed);
      return [q.dialogues.active_template.replace("{remaining}", remaining)];
    }
    return q.dialogues.active;
  }

  return q.dialogues.inactive;
}

/**
 * Etiqueta del botón de acción en el modal del NPC.
 * null = no mostrar botón.
 */
export function getQuestActionLabel(questId) {
  const status = getQuestStatus(questId);
  if (status === "completed") return null;
  if (status === "active" && checkQuestCondition(questId)) return "✅ Entregar misión";
  if (status === "inactive") return "📋 Aceptar misión";
  return null; // activa pero condición no cumplida
}
