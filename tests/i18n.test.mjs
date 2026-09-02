// SPEC-0901 — i18n completo: toda clave usada existe en EN y ES, sin fugas de idioma
import "./helpers/domStub.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const { dictionaries, pickVariant } = await import("../js/i18n.js");
const html = readFileSync(join(root, "index.html"), "utf8");

const en = dictionaries.en, es = dictionaries.es;

test("toda data-i18n de index.html tiene clave en EN y ES", () => {
  const keys = [...html.matchAll(/data-i18n="([^"]+)"/g)].map(m => m[1]);
  assert.ok(keys.length > 50, `se encontraron ${keys.length} usos de data-i18n`);
  const missing = [...new Set(keys)].filter(k => !(k in en) || !(k in es));
  assert.deepEqual(missing, [], `claves sin traducción: ${missing.join(", ")}`);
});

test("paridad EN/ES: los diccionarios tienen exactamente las mismas claves", () => {
  const onlyEn = Object.keys(en).filter(k => !(k in es));
  const onlyEs = Object.keys(es).filter(k => !(k in en));
  assert.deepEqual(onlyEn, [], `solo en EN: ${onlyEn.join(", ")}`);
  assert.deepEqual(onlyEs, [], `solo en ES: ${onlyEs.join(", ")}`);
});

test("coherencia narrativa: el mundo se llama Aetheria (no Aethoria) en el código", () => {
  const files = ["js/achievements.js", "js/npcs.js", "js/quests.js", "js/intro.js", "js/i18n.js", "js/journal.js", "js/bestiary.js"];
  const offenders = files.filter(f => readFileSync(join(root, f), "utf8").includes("Aethoria"));
  assert.deepEqual(offenders, [], `Aethoria (typo) en: ${offenders.join(", ")}`);
});

test("los textos ES no contienen 'Dragon King' (es Rey Dragón)", () => {
  // Cadenas es: "..." con Dragon King en los módulos de contenido
  const files = ["js/bestiary.js", "js/journal.js", "js/items.js", "js/quests.js", "js/npcs.js"];
  const offenders = [];
  for (const f of files) {
    const src = readFileSync(join(root, f), "utf8");
    for (const m of src.matchAll(/es:\s*(?:"([^"]*)"|'([^']*)'|`([^`]*)`)/g)) {
      const text = m[1] ?? m[2] ?? m[3] ?? "";
      if (text.includes("Dragon King")) offenders.push(`${f}: ${text.slice(0, 60)}`);
    }
  }
  // y el diccionario ES completo
  for (const [k, v] of Object.entries(es)) {
    if (typeof v === "string" && v.includes("Dragon King")) offenders.push(`i18n es.${k}`);
  }
  assert.deepEqual(offenders, [], `fugas EN en ES:\n${offenders.join("\n")}`);
});

// SPEC-1222 — pickVariant(): variantes de sabor para el texto de combate
// más repetido del juego (un ataque normal), sorteadas por i18n.js en vez
// de un texto fijo único.
function tokensOf(str) {
  return [...str.matchAll(/\{\{(.*?)\}\}/g)].map(m => m[1]).sort();
}

test("pickVariant: sortea del pool *Variants cuando existe", () => {
  const seen = new Set();
  for (let i = 0; i < 30; i++) seen.add(pickVariant("attackEnemy"));
  assert.ok(seen.size > 1, "debería devolver más de una variante distinta en 30 sorteos");
  for (const s of seen) assert.ok(es.attackEnemyVariants.includes(s));
});

test("pickVariant: sin pool *Variants, cae al texto fijo de la clave base", () => {
  assert.equal(pickVariant("navAttributes"), es.navAttributes);
});

test("todas las *Variants existen en EN y ES, con las mismas claves {{token}} que su clave base", () => {
  const problems = [];
  for (const [locale, dict] of [["en", en], ["es", es]]) {
    for (const key of Object.keys(dict)) {
      if (!key.endsWith("Variants")) continue;
      const baseKey = key.slice(0, -"Variants".length);
      if (!(baseKey in dict)) { problems.push(`${locale}.${key}: no existe ${locale}.${baseKey}`); continue; }
      const baseTokens = tokensOf(dict[baseKey]).join(",");
      for (const variant of dict[key]) {
        const variantTokens = tokensOf(variant).join(",");
        if (variantTokens !== baseTokens) {
          problems.push(`${locale}.${key}: "${variant}" tiene tokens [${variantTokens}], esperaba [${baseTokens}]`);
        }
      }
    }
  }
  assert.deepEqual(problems, [], problems.join("\n"));
});
