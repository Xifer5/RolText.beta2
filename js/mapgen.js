// Minimal map generator helpers used by worldMap.js
// - generateZone({ biome, idPrefix, rooms }) -> returns an object mapping ids to location objects
// - connectZones(world, fromId, toId, direction, reverseDirection?) -> adds exits to both locations when possible

function capitalize(s){ return String(s || "").replace(/(^|[_-])[a-z]/g, c => c.toUpperCase()).replace(/[_-]/g,' '); }

import { enemyData } from "./enemies.js";
import { getBiome } from "./biomes.js";

const biomeCandidateMap = {
	forest: ["slime","wolf","goblin","fungedBeast","thief"],
	cave: ["cave_bat","cave_bear","cave_troll","stone_golem"],
	mountain: ["guard","mountain_giant","stone_golem", "dark_knight", "dwarf_warrior" ],
    garden: ["pegasus", "slime","fungedBeast","orc","imp","thief", "gremlin"],
	swamp: ["zombie","vampire","fungedBeast", "tent" ],
	desert: ["beholder","warlock","linchorn","chimera", "genie", "sand_worm"],
	beach: ["pirate","sea_serpent","mermaid", "pirate_captain", "kraken", "medusa"],
	jungle: ["jungle_tiger","gorilla_warrior","jungle_spirit", "vine_serpent"],
	ruins: [ "vampire", "cultist","squeletor","goblin_shaman"],
	volcano: ["inferno_dragon", "diablo", "lava_golem", "pyro_elemental", "Inferno_elemental","wyvern","beholder"],
	tundra: ["mountain_giant","stone_golem","drider"],
	catacombs: ["squeletor","zombie","vampire","warlock"],
	dungeon: ["orc","goblin","cave_bear","cave_troll","goblin_shaman"],
	treasure_keep: ["ancient_guardian","treasure_guardian"],
    inferno: ["dragon_king"],
    town: [],
	none: []
};

export function generateZone({ biome = "unknown", idPrefix = "z", rooms = 4, level = undefined }) {
	const out = {};
	// If caller didn't pass a level, use the biome's suggested minLevel (if available)
	const b = getBiome(biome);
	const effectiveLevel = typeof level === 'number' ? level : (b?.minLevel ?? 1);
	const biomeRates = { cave: 0.6, dungeon: 0.65, forest: 0.35, swamp: 0.4, desert: 0.25, jungle: 0.45, ruins: 0.45, volcano: 0.5, tundra: 0.3, beach: 0.15 };
	for (let i = 1; i <= rooms; i++) {
		const id = `${idPrefix}_${i}`;
		// prefer biome descriptions (array) for richer narrative when available
		const desc = Array.isArray(b?.description) && b.description.length ? b.description : [`A ${biome} area (#${i})`];
		out[id] = {
			id,
			name: `${capitalize(idPrefix)} ${i}`,
			biome,
			level: level,
			description: desc,
			// set a biome-specific base encounter rate
			encounterRate: biomeRates[biome] ?? 0.25,
			enemies: [],
			exits: {}
		};
	}

	// link rooms linearly east-west as a sensible default
	for (let i = 1; i <= rooms; i++) {
		const id = `${idPrefix}_${i}`;
		if (i < rooms) {
			out[id].exits.east = `${idPrefix}_${i+1}`;
			out[`${idPrefix}_${i+1}`].exits.west = id;
		}
	}

		// Populate enemies for each generated room based on the biome
		const candidates = biomeCandidateMap[biome] || Object.keys(enemyData);
		// Boss-biome override: for single-room 'boss' biomes, always include the defined boss(es)
		const bossOverrides = {
			treasure_keep: ["treasure_guardian"],
			inferno: ["dragon_king"]
		};
		for (const key of Object.keys(out)) {
			const loc = out[key];
			// pick available enemies that are near the zone level
			const avail = candidates.filter(k => enemyData[k] && (enemyData[k].levelRequirement <= (effectiveLevel + 1)));
			// If this biome is a boss biome and it's a single-room zone, force boss spawn
			if ((rooms === 1 || idPrefix === 'treasure_keep' || idPrefix === 'inferno') && Array.isArray(bossOverrides[biome])) {
				// ensure boss exists in enemyData and respects level requirement
				const forced = bossOverrides[biome].filter(id => enemyData[id] && (enemyData[id].levelRequirement <= (effectiveLevel + 1)));
				if (forced.length) {
					loc.enemies = forced.slice(0); // set forced bosses
					loc.encounterRate = 1.0;
					continue;
				}
			}
			if (avail.length === 0) { loc.enemies = []; continue; }
			const pickCount = Math.random() < 0.6 ? 1 : 2;
			const chosen = [];
			for (let n = 0; n < pickCount; n++) {
				const id = avail[Math.floor(Math.random() * avail.length)];
				if (!chosen.includes(id)) chosen.push(id);
			}
			loc.enemies = chosen;
			// slightly increase encounter chance for rooms with enemies
			loc.encounterRate = Math.min(0.9, (loc.encounterRate || 0.25) + 0.15);
		}

		return out;
}

const opposites = {
	north: 'south', south: 'north', east: 'west', west: 'east', up: 'down', down: 'up',
	'north-east': 'south-west', 'north-west': 'south-east', 'south-east': 'north-west', 'south-west': 'north-east',
	portal: 'portal', enter: 'out', out: 'enter'
};

export function connectZones(world, aId, bId, direction, reverseDirection) {
	if (!world[aId] || !world[bId]) return false;
	world[aId].exits = world[aId].exits || {};
	world[bId].exits = world[bId].exits || {};
	world[aId].exits[direction] = bId;
	const rev = reverseDirection || opposites[direction];
	if (rev) world[bId].exits[rev] = aId;
	return true;
}

export default { generateZone, connectZones};
