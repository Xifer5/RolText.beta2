// SPEC-1005 — integridad de biomas: toda referencia de bioma/enemigo debe
// resolver contra datos reales. Detecta el patrón "clave con 's' de más que
// no matchea el bioma generado" y los mini-bosses fantasma.
import "./helpers/domStub.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { enemyData } from "../js/enemies.js";
import { biomeBosses } from "../js/biomeBosses.js";
import { biomeCandidateMap } from "../js/mapgen.js";
import { worldMap } from "../js/worldMap.js";
import { ENEMY_COMBAT_DATA } from "../js/damageTypes.js";

const realBiomeIds = new Set(Object.values(worldMap).map(loc => loc.biome).filter(Boolean));

test("realBiomeIds: se generaron biomas reales (sanity check del fixture)", () => {
  assert.ok(realBiomeIds.has("forest"));
  assert.ok(realBiomeIds.has("ruin"));
  assert.ok(realBiomeIds.has("catacomb"));
  assert.ok(!realBiomeIds.has("ruins"), "el bioma generado es singular, no 'ruins'");
});

test("biomeBosses: toda clave de bioma existe como bioma real generado", () => {
  for (const biomeKey of Object.keys(biomeBosses)) {
    assert.ok(realBiomeIds.has(biomeKey), `biomeBosses['${biomeKey}'] no matchea ningún bioma real`);
  }
});

test("biomeBosses: el boss de cada bioma existe en enemyData", () => {
  for (const [biomeKey, data] of Object.entries(biomeBosses)) {
    assert.ok(enemyData[data.boss], `boss '${data.boss}' de biomeBosses.${biomeKey} no existe en enemyData`);
  }
});

test("biomeBosses: todo mini-boss de cada bioma existe en enemyData", () => {
  for (const [biomeKey, data] of Object.entries(biomeBosses)) {
    for (const miniId of data.miniBosses ?? []) {
      assert.ok(enemyData[miniId], `mini-boss '${miniId}' de biomeBosses.${biomeKey} no existe en enemyData`);
    }
  }
});

test("mapgen: toda clave de biomeCandidateMap existe como bioma real generado", () => {
  for (const biomeKey of Object.keys(biomeCandidateMap)) {
    assert.ok(realBiomeIds.has(biomeKey), `biomeCandidateMap['${biomeKey}'] no matchea ningún bioma real`);
  }
});

test("mapgen: todo candidato de biomeCandidateMap existe en enemyData", () => {
  for (const [biomeKey, candidates] of Object.entries(biomeCandidateMap)) {
    for (const id of candidates) {
      assert.ok(enemyData[id], `candidato '${id}' de biomeCandidateMap.${biomeKey} no existe en enemyData`);
    }
  }
});

test("mapgen: ruin/catacomb NUNCA caen al fallback 'todo enemyData' (ni bosses de zona ni dragon_king)", () => {
  for (const biomeKey of ["ruin", "catacomb"]) {
    const candidates = biomeCandidateMap[biomeKey];
    assert.ok(Array.isArray(candidates), `biomeCandidateMap.${biomeKey} debe ser una lista curada, no undefined`);
    assert.ok(!candidates.includes("dragon_king"), `${biomeKey} no debe poder rolar al jefe final como encuentro ordinario`);
    for (const bossId of ["forest_titan", "cave_devourer", "mountain_colossus", "ancient_construct", "swamp_abomination", "frost_wyrm"]) {
      assert.ok(!candidates.includes(bossId), `${biomeKey} no debe poder rolar el boss de zona '${bossId}' como encuentro ordinario`);
    }
  }
});

test("enemies.js: swamp_abomination existe con el nombre correcto (sin typo)", () => {
  assert.ok(enemyData.swamp_abomination, "swamp_abomination debe existir (no swamp_abominatinon)");
  assert.ok(!("swamp_abominatinon" in enemyData), "el typo swamp_abominatinon no debe seguir existiendo");
});

test("los 12 mini-bosses del sprint (9 reuso + 3 nuevos) existen todos", () => {
  const expected = [
    "wolf", "goblin_shaman", "stone_golem", "cave_bat", "wyvern", "stone_charger",
    "beholder", "ancient_guardian", "hydra", "zombie", "ice_giant", "frozen_spirit"
  ];
  for (const id of expected) {
    assert.ok(enemyData[id], `mini-boss esperado '${id}' no existe en enemyData`);
  }
});

test("ENEMY_COMBAT_DATA: toda clave existe en enemyData", () => {
  for (const id of Object.keys(ENEMY_COMBAT_DATA)) {
    assert.ok(enemyData[id], `ENEMY_COMBAT_DATA['${id}'] no existe en enemyData (typo o enemigo eliminado)`);
  }
});

test("todo boss/mini-boss de biomeBosses tiene datos de combate en ENEMY_COMBAT_DATA", () => {
  for (const [biomeKey, data] of Object.entries(biomeBosses)) {
    assert.ok(ENEMY_COMBAT_DATA[data.boss], `boss '${data.boss}' de biomeBosses.${biomeKey} no tiene entrada en ENEMY_COMBAT_DATA`);
    for (const miniId of data.miniBosses ?? []) {
      assert.ok(ENEMY_COMBAT_DATA[miniId], `mini-boss '${miniId}' de biomeBosses.${biomeKey} no tiene entrada en ENEMY_COMBAT_DATA`);
    }
  }
});

test("todo enemigo con isBoss:true en enemyData tiene datos de combate en ENEMY_COMBAT_DATA", () => {
  for (const [id, data] of Object.entries(enemyData)) {
    if (data.isBoss) {
      assert.ok(ENEMY_COMBAT_DATA[id], `boss '${id}' (isBoss:true) no tiene entrada en ENEMY_COMBAT_DATA`);
    }
  }
});
