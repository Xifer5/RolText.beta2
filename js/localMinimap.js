// ══════════════════════════════════════════════════════════
//  LOCAL MINIMAP — Mapa de proximidad para grafos sin coords
//  Renderiza una rueda 3×3: zona actual al centro,
//  vecinos por dirección (N/S/E/O), y "Subir/Bajar/Entrar/Salir"
//  como chips inferiores. Adaptado a worldMap basado en exits.
// ══════════════════════════════════════════════════════════
import { gameState } from "./state.js";

const DIR_POS = {
  north: { row: 1, col: 2 },
  south: { row: 3, col: 2 },
  east:  { row: 2, col: 3 },
  west:  { row: 2, col: 1 },
};
const VERTICAL_DIRS = ["up", "down", "enter", "out"];

const BIOME_ICON = {
  town: "🏘️", forest: "🌲", cave: "⛰️", mountain: "🏔️",
  swamp: "🦎", desert: "🏜️", beach: "🏖️", jungle: "🌴",
  ruin: "🏛️", volcano: "🌋", tundra: "❄️", catacomb: "💀",
  dungeon: "🏰", garden: "🌸", treasure_keep: "💎", inferno: "🔥",
  none: "•"
};
const DIR_ARROW = { north: "↑", south: "↓", east: "→", west: "←" };
const DIR_LABEL = { north: "N", south: "S", east: "E", west: "O", up: "↑↑", down: "↓↓", enter: "⏎", out: "⟲" };

export function renderLocalMinimap() {
  const grid = document.getElementById("local-minimap-grid");
  const coords = document.getElementById("minimap-coords");
  if (!grid) return;

  const map = window.worldMap || {};
  const currentId = gameState.currentLocationId;
  const current = map[currentId];
  if (!current) { grid.innerHTML = ""; return; }

  if (coords) coords.textContent = current.name || currentId;

  const exits = current.exits || {};
  const visited = gameState.visitedLocations;
  const isVisited = (id) => {
    if (!visited) return false;
    if (visited instanceof Set) return visited.has(id);
    if (Array.isArray(visited)) return visited.includes(id);
    if (typeof visited === "object") return !!visited[id];
    return false;
  };

  // Construir grilla 3×3
  grid.style.gridTemplateColumns = "repeat(3, 1fr)";
  grid.style.gridTemplateRows = "repeat(3, 1fr)";

  const cells = Array(9).fill(null).map(() => ({ cls: "lmm-cell lmm-empty", html: "" }));

  // Centro = zona actual
  cells[4] = {
    cls: "lmm-cell lmm-current",
    html: `<span class="lmm-icon">${BIOME_ICON[current.biome] || "📍"}</span>`,
    title: current.name || currentId
  };

  // Vecinos cardinales
  for (const dir of ["north", "south", "east", "west"]) {
    const targetId = exits[dir];
    if (!targetId) continue;
    const target = map[targetId];
    if (!target) continue;
    const pos = DIR_POS[dir];
    const idx = (pos.row - 1) * 3 + (pos.col - 1);
    const visitedClass = isVisited(targetId) ? "lmm-visited" : "lmm-adjacent";
    const safeClass = target.safeZone ? " lmm-safe" : "";
    cells[idx] = {
      cls: `lmm-cell ${visitedClass}${safeClass}`,
      html: `
        <span class="lmm-arrow">${DIR_ARROW[dir]}</span>
        <span class="lmm-icon">${BIOME_ICON[target.biome] || "•"}</span>
      `,
      title: `${dir.toUpperCase()}: ${target.name}${target.safeZone ? " (Seguro)" : ""}`
    };
  }

  // Esquinas con direcciones especiales (verticales/portal)
  const verticalExits = VERTICAL_DIRS.filter(d => exits[d]);
  // top-left, top-right, bottom-left, bottom-right
  const cornerSlots = [0, 2, 6, 8];
  verticalExits.slice(0, 4).forEach((dir, i) => {
    const targetId = exits[dir];
    const target = map[targetId];
    if (!target) return;
    const idx = cornerSlots[i];
    const visitedClass = isVisited(targetId) ? "lmm-visited" : "lmm-adjacent";
    cells[idx] = {
      cls: `lmm-cell lmm-special ${visitedClass}`,
      html: `
        <span class="lmm-special-tag">${DIR_LABEL[dir]}</span>
        <span class="lmm-icon">${BIOME_ICON[target.biome] || "•"}</span>
      `,
      title: `${dir.toUpperCase()}: ${target.name}`
    };
  });

  grid.innerHTML = cells
    .map(c => `<div class="${c.cls}" ${c.title ? `title="${c.title.replace(/"/g, '&quot;')}"` : ""}>${c.html}</div>`)
    .join("");
}

// Auto-render al cambiar de localización
if (typeof window !== "undefined") {
  window.addEventListener("pixel:locationChanged", renderLocalMinimap);
  // También en load por si tu app no dispara el evento la primera vez
  window.addEventListener("DOMContentLoaded", () => {
    setTimeout(renderLocalMinimap, 100);
  });
}
