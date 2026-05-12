// ✅ CORREGIDO: importar el default y desestructurar
import mapgen from './mapgen.js';
const { generateZone, connectZones } = mapgen;

// ======================================================
// 1) PUNTOS DE INTERÉS MANUALES (ciudades, zonas seguras)
// ======================================================
export const worldMap = {
  // ----------- CAPITAL INICIAL -----------
  town: {
    id: "town",
    name: "Oakhaven",
    biome: "town",
    safeZone: true,
    canRest: true,
    level: 1,
    description: "Un bullicioso centro comercial rodeado de suaves colinas.",
    exits: { north: "forest_cross", south: "swamp_dock", east: "shop", west: "tavern" }
  },
  shop: {
    id: "shop",
    name: "Adventurer's Supply",
    biome: "none",
    level: 1,
    description: "Equipo, pociones y rumores de aventureros.",
    exits: { west: "town" }
  },
  tavern: {
    id: "tavern",
    name: "The Drunken Dragon",
    biome: "none",
    canRest: true,
    level: 1,
    description: "Fuego cálido, cerveza fría y bardos ruidosos.",
    exits: { east: "town", south: "cellar" }
  },
  cellar: {
    id: "cellar",
    name: "Old Cellar",
    biome: "none",
    level: 1,
    description: "Barriles, ratas... ¿y un pasadizo oculto?",
    exits: { north: "tavern", down: "cave_1" }
  },

  // ----------- CASTILLO DEL NORTE -----------
  castle: {
    id: "castle",
    name: "Griffon Keep",
    biome: "town",
    safeZone: true,
    canRest: true,
    level: 3,
    description: "Piedra fría, estandartes al viento y armaduras que resuenan.",
    exits: { west: "mountain_3", east: "castle_shop", down: "armory" }
  },
  castle_shop: {
    id: "castle_shop",
    name: "Keep Quartermaster",
    biome: "none",
    level: 3,
    description: "Military-grade gear.",
    exits: { west: "castle" }
  },
  tower: {
    id: "tower",
    name: "Castle Tower",
    biome: "none",
    level: 3,
    description: "The Tower of the Castle, You can talk to the Master Mage of the castle here.",
    exits: { north: "armory", down: "ruin_6" }
  },
  armory: {
    id: "armory",
    name: "Armory",
    biome: "none",
    level: 3,
    description: "Weapons and armor for brave adventurers.",
    exits: { north: "castle", south: "tower" }
  },

  // ----------- PUEBLO COSTERO -----------
  port: {
    id: "port",
    name: "Saltwind Port",
    biome: "town",
    safeZone: true,
    canRest: true,
    level: 2,
    description: "Smell of salt, gulls overhead, ships creak in the bay.",
    exits: { down: "cave_6", east: "beach_6" }
  }
};

// ======================================================
// 2) BIOMAS GENERADOS (no-lineales)
// ======================================================
const zones = [
  { id: "forest", rooms: 6 },
  { id: "cave", rooms: 6 },
  { id: "mountain", rooms: 6 },
  { id: "swamp", rooms: 5 },
  { id: "desert", rooms: 5 },
  { id: "beach", rooms: 6 },
  { id: "jungle", rooms: 5 },
  { id: "ruin", rooms: 6 },
  { id: "volcano", rooms: 7 },
  { id: "tundra", rooms: 6 },
  { id: "catacomb", rooms: 6 },
  { id: "dungeon", rooms: 7 },
  { id: "garden", rooms: 4 },
  { id: "treasure_keep", rooms: 1 },
  { id: "inferno", rooms: 1 },
];

// generamos cada zona
zones.forEach(z => {
  Object.assign(worldMap, generateZone({
    biome: z.id,
    idPrefix: z.id,
    rooms: z.rooms
  }));
});

// ======================================================
// 3) CONEXIONES NO-LINEALES
// ======================================================

// ----------- BOSQUE (múltiples entradas) -----------
connectZones(worldMap, "town", "forest_1", "north");
connectZones(worldMap, "town", "shop", "east");
connectZones(worldMap, "town", "tavern", "west");
connectZones(worldMap, "tavern", "cellar", "south");
connectZones(worldMap, "forest_1", "garden_1", "west");
connectZones(worldMap, "forest_1", "forest_2", "north");
connectZones(worldMap, "forest_2", "forest_3", "east");
connectZones(worldMap, "forest_3", "forest_4", "east");
connectZones(worldMap, "forest_4", "forest_5", "north");
connectZones(worldMap, "forest_5", "forest_6", "north");
connectZones(worldMap, "forest_6", "dungeon_1", "down");
connectZones(worldMap, "dungeon_1", "dungeon_2", "east");
connectZones(worldMap, "dungeon_2", "dungeon_3", "south");
connectZones(worldMap, "dungeon_3", "dungeon_4", "south");
connectZones(worldMap, "dungeon_4", "dungeon_5", "south");
connectZones(worldMap, "dungeon_5", "dungeon_6", "east");
connectZones(worldMap, "dungeon_6", "dungeon_7", "east");
connectZones(worldMap, "dungeon_7", "mountain_1", "up");
connectZones(worldMap, "dungeon_7", "ruin_4", "south");
connectZones(worldMap, "ruin_4", "ruin_3", "south");
connectZones(worldMap, "ruin_4", "ruin_5", "east");
connectZones(worldMap, "ruin_5", "ruin_6", "east");
connectZones(worldMap, "ruin_6", "tower", "up");
connectZones(worldMap, "ruin_3", "ruin_2", "south");
connectZones(worldMap, "ruin_2", "ruin_1", "west");

connectZones(worldMap, "dungeon_5", "catacomb_1", "enter");
connectZones(worldMap, "catacomb_1", "catacomb_2", "south");
connectZones(worldMap, "catacomb_2", "catacomb_3", "east");
connectZones(worldMap, "catacomb_3", "catacomb_4", "north");
connectZones(worldMap, "catacomb_4", "catacomb_5", "north");
connectZones(worldMap, "catacomb_5", "catacomb_6", "east");
connectZones(worldMap, "catacomb_6", "mountain_4", "exit");


connectZones(worldMap, "garden_1", "garden_2", "west");
connectZones(worldMap, "garden_2", "garden_3", "west");
connectZones(worldMap, "garden_3", "garden_4", "north");
// connect to the generated treasure_keep room (id: treasure_keep_1)
connectZones(worldMap, "garden_4", "treasure_keep_1", "enter");


// ----------- PANTANO -----------
connectZones(worldMap, "town", "swamp_1", "south");
connectZones(worldMap, "swamp_1", "swamp_2", "south");
connectZones(worldMap, "swamp_2", "swamp_3", "east");
connectZones(worldMap, "swamp_3", "swamp_4", "east");
connectZones(worldMap, "swamp_4", "swamp_5", "east");
connectZones(worldMap, "swamp_5", "jungle_1", "east");
connectZones(worldMap, "jungle_1", "ruin_1", "down");

connectZones(worldMap, "jungle_1", "jungle_2", "south");
connectZones(worldMap, "jungle_2", "jungle_3", "west");
connectZones(worldMap, "jungle_3", "jungle_4", "west");
connectZones(worldMap, "jungle_4", "jungle_5", "west");
connectZones(worldMap, "jungle_5", "desert_1", "south");
connectZones(worldMap, "desert_1", "desert_2", "south");
connectZones(worldMap, "desert_2", "desert_3", "east");
connectZones(worldMap, "desert_3", "desert_4", "east");
connectZones(worldMap, "desert_4", "desert_5", "south");
connectZones(worldMap, "desert_5", "beach_1", "west");
connectZones(worldMap, "beach_1", "beach_2", "west");
connectZones(worldMap, "beach_2", "beach_3", "west");
connectZones(worldMap, "beach_3", "beach_4", "south");
connectZones(worldMap, "beach_4", "beach_5", "west");
connectZones(worldMap, "beach_5", "beach_6", "west");
connectZones(worldMap, "beach_6", "port", "west");

connectZones(worldMap, "port", "cave_6", "down");
connectZones(worldMap, "cave_6", "cave_5", "north");
connectZones(worldMap, "cave_5", "cave_4", "north");
connectZones(worldMap, "cave_4", "cave_3", "north");
connectZones(worldMap, "cave_3", "cave_2", "north");
connectZones(worldMap, "cave_2", "cave_1", "east");
connectZones(worldMap, "cave_1", "cellar", "up");


connectZones(worldMap, "mountain_1", "mountain_2", "north");
connectZones(worldMap, "mountain_2", "mountain_3", "east");
connectZones(worldMap, "mountain_3", "mountain_4", "north");
connectZones(worldMap, "mountain_4", "mountain_5", "north");
connectZones(worldMap, "mountain_5", "mountain_6", "north");
connectZones(worldMap, "mountain_3", "castle", "east");
connectZones(worldMap, "castle", "castle_shop", "east");
connectZones(worldMap, "castle", "armory", "south");
connectZones(worldMap, "armory", "tower", "south");
connectZones(worldMap, "tower", "ruin_6", "down");
connectZones(worldMap, "ruin_1", "jungle_1", "up");



connectZones(worldMap, "mountain_6", "tundra_1", "north");
connectZones(worldMap, "tundra_1", "tundra_2", "north");
connectZones(worldMap, "tundra_2", "tundra_3", "west");
connectZones(worldMap, "tundra_3", "tundra_4", "west");
connectZones(worldMap, "tundra_4", "tundra_5", "west");
connectZones(worldMap, "tundra_5", "tundra_6", "north");


connectZones(worldMap, "tundra_6", "volcano_1", "north");
connectZones(worldMap, "volcano_1", "volcano_2", "north");
connectZones(worldMap, "volcano_2", "volcano_3", "north");
connectZones(worldMap, "volcano_3", "volcano_4", "north");
connectZones(worldMap, "volcano_4", "volcano_5", "north");
connectZones(worldMap, "volcano_5", "volcano_6", "north");
connectZones(worldMap, "volcano_6", "volcano_7", "west");
// ----------- DUNGEON FINAL -----------
// connect to the generated inferno entry room (id: inferno_1)
connectZones(worldMap, "volcano_7", "inferno_1", "enter");




// ======================================================
// 4) NOMBRES NARRATIVOS
//    Solo sobreescribe `.name`; IDs, bioma, enemigos y
//    conexiones permanecen intactos.
// ======================================================
const locationNames = {

  // ── BOSQUE DE VALDRIS ──────────────────────────────────
  // Camino desde Oakhaven hacia las mazmorras del norte
  forest_1: "Senda de los Robles",
  forest_2: "Claro Susurrante",
  forest_3: "Bosque de Valdris",
  forest_4: "Arboleda de las Sombras",
  forest_5: "El Corazón del Bosque",
  forest_6: "Límite de la Oscuridad",

  // ── MAZMORRAS DE IRONCROFT ─────────────────────────────
  // Primer dungeon mayor; conduce a las montañas y las ruinas
  dungeon_1: "Entrada de Ironcroft",
  dungeon_2: "Calabozo del Este",
  dungeon_3: "Sala de Tortura",
  dungeon_4: "Celdas Oscuras",
  dungeon_5: "Foso del Guardián",
  dungeon_6: "Corredor de la Muerte",
  dungeon_7: "Cámara del Señor Oscuro",

  // ── CRESTAS DE HIERRO ─────────────────────────────────
  // Cadena montañosa; mountain_3 lleva al Castillo
  mountain_1: "Paso del Desfiladero",
  mountain_2: "Ladera del Granito",
  mountain_3: "Meseta del Viento",
  mountain_4: "Pico de las Águilas",
  mountain_5: "Cima Helada",
  mountain_6: "Cumbre Eterna",

  // ── CATACUMBAS DE ARETH ────────────────────────────────
  // Atajo subterráneo entre el dungeon y las montañas
  catacomb_1: "Entrada de las Catacumbas",
  catacomb_2: "Pasillo de los Caídos",
  catacomb_3: "Sala de los Sarcófagos",
  catacomb_4: "Cámara Sellada",
  catacomb_5: "El Osario",
  catacomb_6: "Salida de las Catacumbas",

  // ── PANTANO DE THORNMOOR ──────────────────────────────
  // Sur de Oakhaven; puerta al arco del sur
  swamp_1: "Orillas del Fango",
  swamp_2: "Pantano Murmurante",
  swamp_3: "Ciénaga de Thornmoor",
  swamp_4: "Lodazal de los Perdidos",
  swamp_5: "Estanque Corrupto",

  // ── JUNGLA DE UMBAR ───────────────────────────────────
  // Selva densa conectada al pantano y las ruinas antiguas
  jungle_1: "Umbral de la Jungla",
  jungle_2: "Sendero de las Lianas",
  jungle_3: "Claro del Jaguar",
  jungle_4: "Río de las Sanguijuelas",
  jungle_5: "Jungla de Umbar",

  // ── DESIERTO DE KHAL ──────────────────────────────────
  // Páramo abrasador entre la jungla y la costa
  desert_1: "Dunas del Sur",
  desert_2: "Mar de Arena",
  desert_3: "Oasis de los Huesos",
  desert_4: "Corazón del Desierto de Khal",
  desert_5: "Cañón del Sol Ardiente",

  // ── COSTA DE LAS SIRENAS ──────────────────────────────
  // Litoral entre el desierto y Saltwind Port
  beach_1: "Playa del Dragón Marino",
  beach_2: "Bahía de los Naufragios",
  beach_3: "Arrecife de Coral",
  beach_4: "Cala Tormentosa",
  beach_5: "Puerto Viejo",
  beach_6: "Costa de las Sirenas",

  // ── CAVERNAS DEL ECO ──────────────────────────────────
  // Red subterránea bajo la taberna hasta el puerto
  cave_1: "Bóveda de la Taberna",
  cave_2: "Pasaje del Eco",
  cave_3: "Caverna de las Estalactitas",
  cave_4: "Sala Inundada",
  cave_5: "Túnel de la Marea",
  cave_6: "Cueva Marina",

  // ── RUINAS DE ELDRAST ─────────────────────────────────
  // Vestigios de una civilización olvidada
  ruin_1: "Vestigios del Templo",
  ruin_2: "Cámara Profanada",
  ruin_3: "Salón del Trono Roto",
  ruin_4: "Plaza de los Muertos",
  ruin_5: "Cripta de Eldrast",
  ruin_6: "Torre en Ruinas",

  // ── TUNDRA ETERNA ─────────────────────────────────────
  // Norte helado; puerta al volcán y el trono del caos
  tundra_1: "Llanura Congelada",
  tundra_2: "Ventisca Perpetua",
  tundra_3: "Glaciar Grieta",
  tundra_4: "Tundra de los Antiguos",
  tundra_5: "Bosque de Hielo",
  tundra_6: "Precipicio del Norte",

  // ── VOLCÁN ETERNO ─────────────────────────────────────
  // Cadena volcánica que lleva a la Puerta del Infierno
  volcano_1: "Faldas del Volcán",
  volcano_2: "Río de Lava",
  volcano_3: "Caldera Activa",
  volcano_4: "Cima del Magma",
  volcano_5: "El Corazón Ardiente",
  volcano_6: "Umbral del Infierno",
  volcano_7: "Puerta del Dragón",

  // ── JARDÍN DE ERYNDEL ─────────────────────────────────
  // Jardín misterioso que oculta una bóveda olvidada
  garden_1: "Jardín Encantado",
  garden_2: "Laberinto de Setos",
  garden_3: "Fuente de la Vida",
  garden_4: "Jardín de Eryndel",

  // ── ZONAS ESPECIALES ──────────────────────────────────
  treasure_keep_1: "La Bóveda Olvidada",
  inferno_1:       "Trono del Rey Dragón",
};

Object.entries(locationNames).forEach(([id, name]) => {
  if (worldMap[id]) worldMap[id].name = name;
});

// ======================================================
// 5) EXPORT
// ======================================================
// Also expose globally for compatibility with modules that use `window.worldMap`.
window.worldMap = worldMap;

// === Validation / consistency check for direction keys ===
// Enforce a small set of allowed directions and try to autocorrect common typos.
;(function validateDirections(map) {
  const allowed = new Set(['north','south','east','west','up','down','enter','out']);
  const commonFixes = { weast: 'west', eest: 'east' };
  const problems = [];

  for (const locId of Object.keys(map)) {
    const loc = map[locId];
    if (!loc || typeof loc !== 'object') continue;
    const exits = loc.exits || {};
    for (const k of Object.keys(exits)) {
      if (!allowed.has(k)) {
        // try to auto-fix simple typos
        if (commonFixes[k]) {
          const fixed = commonFixes[k];
          // if we don't already have that fixed key, move it
          if (!exits[fixed]) {
            exits[fixed] = exits[k];
          }
          delete exits[k];
          console.info(`worldMap: auto-corrected exit '${k}' → '${fixed}' on '${locId}'`);
        } else {
          problems.push({ loc: locId, key: k, value: exits[k] });
        }
      }
    }
  }

  if (problems.length) {
    console.warn('worldMap: Found unexpected exit directions. Valid directions are:', Array.from(allowed).join(', '));
    console.warn('worldMap: Problems (location, badKey, target):', problems);
  }
})(worldMap);

export default worldMap;