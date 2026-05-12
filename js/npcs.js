/**
 * npcs.js — Definiciones de NPCs del mundo de Aethoria
 *
 * Cada NPC habita en una zona fija, tiene un rol narrativo
 * y una misión asociada que el jugador puede aceptar/entregar.
 */

export const NPC_DATA = {

  elara: {
    id: "elara",
    name: "Elara la Vidente",
    emoji: "🔮",
    locationId: "town",
    role: "Guardiana de Oakhaven",
    color: "#818cf8",
    questId: "explore_forest",
    lore: "Una anciana sabia que lleva décadas observando los movimientos del mal en Aethoria. Fue ella quien vio en sus visiones la llegada del Dragon King."
  },

  valdris: {
    id: "valdris",
    name: "Archimago Valdris",
    emoji: "🧙",
    locationId: "tower",
    role: "Archimago del Castillo Griffon",
    color: "#b09ae0",
    questId: "collect_crystal",
    lore: "El mago más poderoso del reino. Lleva años estudiando las Ruinas de Eldrast, convencido de que ocultan la clave para derrotar al Rey Dragón."
  },

  brennan: {
    id: "brennan",
    name: "Capitán Brennan",
    emoji: "⚓",
    locationId: "port",
    role: "Capitán de Saltwind Port",
    color: "#5a8de0",
    questId: "kill_pirates",
    lore: "Veterano marino con treinta años en el mar. Conoce cada ruta submarina de la región y guarda los mapas de las Catacumbas de Areth."
  },

  eryndel: {
    id: "eryndel",
    name: "Guardiana Eryndel",
    emoji: "🧚",
    locationId: "garden_1",
    role: "Guardiana del Jardín Encantado",
    color: "#52c07a",
    questId: "collect_fairy_dust",
    lore: "Un hada ancestral que custodia los secretos del Jardín de Eryndel desde el primer amanecer del mundo. La Bóveda Olvidada responde solo a su magia."
  },

  theron: {
    id: "theron",
    name: "Theron el Explorador",
    emoji: "🏔️",
    locationId: "mountain_1",
    role: "Explorador de las Crestas de Hierro",
    color: "#94a3b8",
    questId: "collect_ice_crystal",
    lore: "El único ser conocido que cruzó la Tundra Eterna sin congelarse. Forja Pases de Montaña con cristales helados y el calor de su voluntad."
  },

  pyrax: {
    id: "pyrax",
    name: "Pyrax, Guardián del Volcán",
    emoji: "🌋",
    locationId: "volcano_4",
    role: "Centinela del Volcán Eterno",
    color: "#f97316",
    questId: "defeat_dark_lord",
    lore: "Un elemental de fuego ancestral que vigila la Puerta del Dragón desde la primera erupción. Solo deja pasar a quienes ya miraron a los ojos al Señor Oscuro."
  }

};

/**
 * Devuelve el NPC que habita en la ubicación dada, o null.
 * @param {string} locationId
 * @returns {object|null}
 */
export function getNpcAt(locationId) {
  return Object.values(NPC_DATA).find(n => n.locationId === locationId) ?? null;
}
