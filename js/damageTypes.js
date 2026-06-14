// ══════════════════════════════════════════════════════
//  DAMAGE TYPES — Motor de tipos de daño y resistencias
//  SPEC-0601 / SPEC-0602
// ══════════════════════════════════════════════════════

export const DAMAGE_TYPES = {
  // Físico
  slash:      "Cortante",
  pierce:     "Perforante",
  blunt:      "Contundente",
  // Elemental
  fire:       "Fuego",
  ice:        "Hielo",
  lightning:  "Electricidad",
  poison_dmg: "Veneno",
  dark:       "Oscuridad",
  light:      "Luz",
  earth:      "Tierra",
  air:        "Aire",
  water:      "Agua",
  // Especial
  holy:       "Sagrado",
  cursed:     "Maldito",
  psychic:    "Psíquico",
  bleed:      "Sangrado",
  // Genérico (retrocompatibilidad)
  physical:   "Físico",
  magic:      "Mágico"
};

// Tipos físicos — activan sangrado y resistencia física
export const PHYSICAL_TYPES = new Set(["slash", "pierce", "blunt", "physical", "bleed"]);

// ── Tipo de daño por ID de arma ─────────────────────────
// Permite añadir damageType sin editar items.js
export const WEAPON_DAMAGE_TYPES = {
  goblin_dagger:     "pierce",
  dagger:            "pierce",
  sword:             "slash",
  iron_sword:        "slash",
  axe:               "slash",
  vine_whip:         "slash",
  cutlass:           "slash",
  tiger_blade:       "slash",
  captain_sword:     "slash",
  crystal_blade:     "slash",
  royal_sword:       "slash",
  katana:            "slash",
  divine_sword:      "holy",
  excalibur:         "holy",
  dragon_king_sword: "fire",
  demon_blade:       "dark",
  dark_sword:        "dark",
  lava_sword:        "fire",
  inferno_blade:     "fire",
  serpent_sword:     "pierce",
  trident:           "pierce",
  hammer:            "blunt",
  war_hammer:        "blunt",
  giant_club:        "blunt",
  staff:             "magic",
  wand:              "magic",
  elemental_wand:    "lightning",
  bless_staff:       "holy",
  healing_staff:     "light",
  water_staff:       "water",
  ocean_staff:       "water",
  flame_staff:       "fire",
  pyro_staff:        "fire",
  spirit_staff:      "light",
  saint_grail:       "holy",
  nature_staff:      "earth",
};

// ── Datos de combate por enemigo ────────────────────────
// Resistencias (%), tipo de daño de ataque y behavior de IA
// Positivo = resistencia, negativo = vulnerabilidad
export const ENEMY_COMBAT_DATA = {
  slime:    { resistances: { slash: 30, pierce: -20, fire: -30, blunt: -10 }, attackDamageType: "blunt" },
  fungedBeast:    { attackDamageType: "blunt",   behavior: "status" },
  thief:          { attackDamageType: "pierce",  behavior: "aggressive" },
  guard:          { attackDamageType: "slash",   behavior: "defensive" },
  cave_bat: { resistances: { pierce: 20, slash: -10 }, attackDamageType: "pierce", behavior: "aggressive" },
  goblin:   { resistances: { fire: -10 }, attackDamageType: "slash", behavior: "aggressive" },
  goblin_shaman: { resistances: { fire: -30, magic: 20 }, attackDamageType: "fire", behavior: "mage" },
  elf:      { attackDamageType: "magic",  magicDamageType: "light",  behavior: "mage" },
  wolf:     { resistances: { fire: -20 }, attackDamageType: "slash", behavior: "aggressive" },
  orc:      { resistances: { blunt: 20, slash: 10, fire: -10 }, attackDamageType: "blunt", behavior: "aggressive" },
  cave_bear:      { attackDamageType: "blunt",   behavior: "aggressive" },
  ancient_guardian: { attackDamageType: "blunt", magicDamageType: "magic", behavior: "mage" },
  zombie:   { resistances: { pierce: 30, blunt: -20, dark: 50, fire: -30, holy: -50, light: -30 }, attackDamageType: "blunt" },
  squeletor: { resistances: { slash: 20, dark: 50, pierce: -30, blunt: -50, light: -30, holy: -40 }, attackDamageType: "slash", behavior: "aggressive" },
  vampire:  { resistances: { pierce: 70, slash: 30, dark: 50, fire: -50, light: -30, holy: -50 }, attackDamageType: "dark", behavior: "status" },
  warlock:  { resistances: { dark: 20, fire: 10, light: -20, holy: -20 }, attackDamageType: "dark", behavior: "mage" },
  imp:      { attackDamageType: "dark",   behavior: "aggressive" },
  linchorn: { attackDamageType: "slash",  behavior: "aggressive" },
  cave_troll: { resistances: { blunt: 40, fire: -30, physical: 20 }, attackDamageType: "blunt", behavior: "regenerate" },
  stone_golem: { resistances: { slash: 50, pierce: 30, blunt: -50, fire: 20, earth: 80, lightning: -50 }, attackDamageType: "blunt", behavior: "defensive" },
  mountain_giant: { resistances: { blunt: 30, slash: 20, fire: -10 }, attackDamageType: "blunt", behavior: "aggressive" },
  wyvern:         { attackDamageType: "slash",  behavior: "aggressive" },
  treasure_guardian: { attackDamageType: "blunt", behavior: "defensive" },
  centaurus:      { attackDamageType: "slash",  behavior: "aggressive" },
  chimera:        { attackDamageType: "slash",  behavior: "aggressive" },
  hydra:    { resistances: { water: 60, fire: -20 }, attackDamageType: "blunt", behavior: "regenerate" },
  giant_spider: { resistances: { physical: 20, fire: -30, lightning: -20 }, attackDamageType: "pierce", behavior: "status" },
  beholder: { resistances: { physical: 20, psychic: -30 }, attackDamageType: "psychic", behavior: "status" },
  cultist:  { resistances: { dark: 30, holy: -40 }, attackDamageType: "cursed", behavior: "status" },
  drider:         { attackDamageType: "pierce", behavior: "status" },
  kraken:   { resistances: { water: 100, lightning: -50, physical: 20 }, attackDamageType: "water", behavior: "aggressive" },
  sea_serpent: { resistances: { water: 80, lightning: -40 }, attackDamageType: "water", behavior: "mage" },
  medusa:   { resistances: { physical: 20, psychic: -30 }, attackDamageType: "psychic", behavior: "status" },
  mermaid:  { resistances: { water: 60, lightning: -30 }, attackDamageType: "water", magicDamageType: "water", behavior: "mage" },
  pirate:         { attackDamageType: "slash",  behavior: "aggressive" },
  pirate_captain: { attackDamageType: "slash",  behavior: "aggressive" },
  lava_golem: { resistances: { fire: 100, earth: 50, physical: 30, ice: -80, water: -60 }, attackDamageType: "fire", behavior: "regenerate" },
  Inferno_elemental: { resistances: { fire: 100, ice: -60, water: -40 }, attackDamageType: "fire", behavior: "mage" },
  gorilla_warrior:    { attackDamageType: "blunt",  behavior: "berserker" },
  jungle_tiger:       { attackDamageType: "slash",  behavior: "aggressive" },
  vine_serpent: { attackDamageType: "pierce", magicDamageType: "poison_dmg", behavior: "status" },
  jungle_spirit:      { attackDamageType: "earth",  magicDamageType: "earth", behavior: "mage" },
  genie:              { attackDamageType: "magic",  magicDamageType: "fire", behavior: "mage" },
  pyro_elemental: { resistances: { fire: 100, ice: -60, water: -50 }, attackDamageType: "fire", behavior: "mage" },
  diablo:   { resistances: { dark: 100, fire: 50, holy: -60, light: -40, physical: 20 }, attackDamageType: "dark", behavior: "berserker" },
  dragon:   { resistances: { fire: 80, dark: 20, physical: 20, ice: -20, light: -10 }, attackDamageType: "fire", behavior: "mage" },
  gremlin:        { attackDamageType: "slash",  behavior: "aggressive" },
  dwarf_warrior:  { attackDamageType: "blunt",  behavior: "defensive" },
  pegasus:        { attackDamageType: "slash",  behavior: "aggressive" },
  tent:           { attackDamageType: "blunt",  behavior: "defensive" },
  dark_knight: { resistances: { slash: 30, dark: 30, holy: -30, light: -20 }, attackDamageType: "dark", behavior: "berserker" },
  sand_worm:      { attackDamageType: "blunt",  behavior: "aggressive" },
  inferno_dragon: { resistances: { fire: 100, dark: 30, physical: 20, ice: -50, water: -30 }, attackDamageType: "fire", behavior: "boss" },
  forest_titan:   { attackDamageType: "earth",  behavior: "boss" },
  cave_devourer:  { attackDamageType: "blunt",  behavior: "berserker" },
  mountain_colossus: { resistances: { blunt: 40, slash: 20 }, attackDamageType: "blunt", behavior: "boss" },
  ancient_construct: { attackDamageType: "magic", magicDamageType: "lightning", behavior: "mage" },
  swamp_abominatinon: { resistances: { water: 40, poison_dmg: 80, holy: -30 }, attackDamageType: "dark", behavior: "status" },
  frost_wyrm: { resistances: { ice: 100, fire: -60, water: 50 }, attackDamageType: "ice", behavior: "boss" },
  dragon_king: { resistances: { fire: 80, dark: 50, physical: 30, ice: -20, light: -30, holy: -20 }, attackDamageType: "fire", behavior: "boss" },
};

// ── Resistencias base por clase ─────────────────────────
export const CLASS_BASE_RESISTANCES = {
  warrior:  { physical: 10, blunt: 5 },
  mage:     { magic: 10, fire: 5 },
  rogue:    { pierce: 10, poison_dmg: 15 }
};

// ── Resistencias de equipo (SPEC-0603) ──────────────────
// Permite añadir resistencias a ítems sin editar items.js
export const ITEM_RESISTANCES = {
  // Armaduras físicas
  chainmail:         { pierce: 15 },
  dark_armor:        { dark: 30, light: -20 },
  jungle_armor:      { poison_dmg: 20, earth: 10 },
  sea_armor:         { water: 25, lightning: -15 },
  captain_coat:      { water: 15, fire: -10 },
  royal_armor:       { slash: 10, pierce: 10 },
  plate_armor:       { slash: 20, pierce: 15 },
  stone_armor:       { slash: 25, pierce: 20, lightning: -30 },
  dragon_king_armor: { fire: 40, slash: 20, pierce: 15 },
  // Armaduras mágicas
  arcane_robe:   { magic: 20 },
  aqua_robe:     { water: 25, fire: -15 },
  coral_robe:    { water: 20, lightning: -10 },
  fire_robe:     { fire: 30, ice: -20 },
  nature_robe:   { earth: 20, poison_dmg: 15, fire: -15 },
  ethereal_robe: { magic: 15, cursed: 20 },
  // Escudos
  shield_of_elves: { dark: -15, light: 15 },
  iron_shield:     { slash: 10, pierce: 10 },
  strong_shield:   { slash: 15, pierce: 15 },
  tower_shield:    { slash: 20, pierce: 20, blunt: 10 },
  // Cascos
  plate_helmet:  { slash: 5,  pierce: 5 },
  spartan_helmet:{ slash: 10, blunt: 5 },
  divine_helmet: { holy: 15,  slash: 15 },
};

// ── Función principal ───────────────────────────────────
// Aplica resistencia del objetivo al daño del tipo dado.
// resistance > 0 = absorbe (ej. 50 → recibe 50% menos)
// resistance < 0 = vulnerabilidad (ej. -30 → recibe 30% más)
export function applyResistance(damage, damageType, resistances) {
  if (!damageType || !resistances) return damage;
  const res = resistances[damageType] ?? 0;
  return Math.max(1, Math.floor(damage * (1 - res / 100)));
}

// Devuelve etiqueta legible de la resistencia
export function getResistanceLabel(value) {
  if (value >= 100) return "Inmune";
  if (value > 0)    return `Res. ${value}%`;
  if (value < 0)    return `Vuln. ${Math.abs(value)}%`;
  return null;
}

// Obtiene el tipo de daño de un arma (item object)
export function getWeaponDamageType(weapon) {
  if (!weapon) return "slash";
  return weapon.damageType || WEAPON_DAMAGE_TYPES[weapon.id] || "slash";
}

// ── Alcance de armas (SPEC-0608) ───────────────────────
// Default = 2 si no está en la tabla
export const WEAPON_RANGE = {
  goblin_dagger: 1, dagger: 1,                      // corto
  vine_whip: 3, trident: 3,                          // largo cuerpo a cuerpo
  staff: 3, wand: 3, elemental_wand: 3,              // magia
  bless_staff: 3, water_staff: 3, ocean_staff: 3,
  flame_staff: 3, spirit_staff: 3, healing_staff: 3,
};

// Alcance base de enemigos — default = 2
export const ENEMY_RANGE = {
  beholder:        4,   // rayos oculares
  genie:           4,   // magia a distancia
  warlock:         3,   // magia oscura
  goblin_shaman:   3,
  medusa:          3,   // mirada petrificante
  jungle_spirit:   3,
  ancient_construct: 3,
  wyvern:          3,   // embiste desde el aire
  vine_serpent:    3,
};

// Devuelve el emoji del tipo de daño para el log
export const DAMAGE_TYPE_EMOJI = {
  slash:      "🗡️",
  pierce:     "🏹",
  blunt:      "🔨",
  fire:       "🔥",
  ice:        "❄️",
  lightning:  "⚡",
  poison_dmg: "☠️",
  dark:       "🌑",
  light:      "✨",
  earth:      "🌍",
  air:        "💨",
  water:      "💧",
  holy:       "🌟",
  cursed:     "💀",
  psychic:    "🔮",
  bleed:      "🩸",
  physical:   "⚔️",
  magic:      "🔮"
};
