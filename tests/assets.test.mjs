// Guarda de deploy: toda referencia literal a assets existe en disco con el case EXACTO.
// Windows es case-insensitive; el CDN de Netlify (Linux) no — un desajuste = 404 en producción.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const files = new Set();
const walk = (dir, rel) => {
  for (const e of readdirSync(join(root, rel), { withFileTypes: true })) {
    const r = `${rel}/${e.name}`;
    if (e.isDirectory()) walk(dir, r); else files.add(r);
  }
};
for (const d of ["img", "music", "sounds"]) if (existsSync(join(root, d))) walk(d, d);

const REF_RX = /((?:img|music|sounds)\/[^"'`\n)]+?\.(?:webp|png|jpe?g|gif|svg|ico|mp3|ogg|wav))/g;
const collectRefs = () => {
  const refs = new Set();
  const scan = f => {
    const src = readFileSync(join(root, f), "utf8");
    for (const m of src.matchAll(REF_RX)) {
      const ref = m[1];
      if (ref.includes("$") || ref.includes("<")) continue; // plantillas/comentarios
      refs.add(ref);
    }
  };
  for (const f of readdirSync(join(root, "js")).filter(f => f.endsWith(".js"))) scan(`js/${f}`);
  scan("index.html");
  return refs;
};

test("todas las referencias literales a assets existen con case exacto", () => {
  const refs = collectRefs();
  assert.ok(refs.size > 100, `se recogieron ${refs.size} referencias`);
  const missing = [...refs].filter(r => !files.has(r));
  assert.deepEqual(missing, [], `assets rotos (404 en Netlify):\n${missing.join("\n")}`);
});

test("las imágenes de bioma existen para todos los biomas con imagen", () => {
  const biomes = ["town", "forest", "dungeon", "mountain", "cave", "swamp",
                  "desert", "sea", "beach", "jungle", "tundra", "volcano", "garden"];
  const missing = biomes.filter(b => !files.has(`img/locations/${b}.webp`));
  assert.deepEqual(missing, [], `biomas sin imagen: ${missing.join(", ")}`);
});
