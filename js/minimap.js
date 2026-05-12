import { gameState } from "./state.js";

const DIR_DELTA = {
  north:[0,-1], south:[0,1], east:[1,0], west:[-1,0],
  up:[0,-1], down:[0,1], enter:[1,0], out:[-1,0]
};

const BIOME_EMOJI = {
  town:"🏘️", forest:"🌲", dungeon:"🗝️", mountain:"🏔️", cave:"⛰️",
  swamp:"🌿", desert:"🏜️", sea:"🌊", beach:"🏖️", jungle:"🌴",
  tundra:"❄️", volcano:"🌋", garden:"🌸", none:"🏛️"
};

function buildCoords() {
  const wm = window.worldMap ?? {};
  const coords = {};
  const queue = [["town", 0, 0]];
  const seen = new Set();
  while (queue.length) {
    const [id, x, y] = queue.shift();
    if (seen.has(id)) continue;
    seen.add(id);
    coords[id] = {x, y};
    for (const [dir, nId] of Object.entries(wm[id]?.exits ?? {})) {
      const d = DIR_DELTA[dir];
      if (d && !seen.has(nId)) queue.push([nId, x+d[0], y+d[1]]);
    }
  }
  return coords;
}

export function renderMinimap() {
  const wm       = window.worldMap ?? {};
  const visited  = gameState.visitedLocations ?? {};
  const current  = gameState.currentLocationId;

  // adjacent = exits from visited zones not yet visited
  const adjacent = new Set();
  for (const id of Object.keys(visited)) {
    for (const nId of Object.values(wm[id]?.exits ?? {})) {
      if (!visited[nId]) adjacent.add(nId);
    }
  }

  const coords  = buildCoords();
  const visible = new Set([...Object.keys(visited), ...adjacent, current]);

  const pts = Object.entries(coords)
    .filter(([id]) => visible.has(id))
    .map(([,c]) => c);

  if (!pts.length) {
    return `<div class="mm-empty">Empieza a explorar para revelar el mapa.</div>`;
  }

  const minX = Math.min(...pts.map(p=>p.x));
  const maxX = Math.max(...pts.map(p=>p.x));
  const minY = Math.min(...pts.map(p=>p.y));
  const maxY = Math.max(...pts.map(p=>p.y));
  const cols = maxX - minX + 1;
  const rows = maxY - minY + 1;

  // cell grid keyed by "col,row"
  const cellMap = {};
  for (const [id, {x,y}] of Object.entries(coords)) {
    if (visible.has(id)) cellMap[`${x-minX},${y-minY}`] = id;
  }

  let html = "";
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const id = cellMap[`${c},${r}`];
      if (!id) { html += `<div class="mm-cell mm-void"></div>`; continue; }
      const loc    = wm[id];
      const biome  = loc?.biome ?? "none";
      const isVis  = !!visited[id];
      const isAdj  = adjacent.has(id);
      const isCur  = id === current;
      const emoji  = BIOME_EMOJI[biome] ?? "📍";
      const name   = isVis ? (loc?.name ?? id) : "???";
      const cls    = `mm-cell ${isCur?"mm-current":isVis?"mm-visited":"mm-adjacent"} mm-b-${biome}`;
      html += `<div class="${cls}" title="${name}">${isCur?"📍":isVis?emoji:"?"}</div>`;
    }
  }

  const visitedCount = Object.keys(visited).length;
  const totalCount   = Object.keys(coords).length;

  return `<div class="mm-wrap">
    <div class="mm-legend">
      <span class="mm-leg mm-leg-current">📍 Posición actual</span>
      <span class="mm-leg mm-leg-visited">Visitada</span>
      <span class="mm-leg mm-leg-adj">Por explorar</span>
    </div>
    <div class="mm-scroll">
      <div class="mm-grid" style="grid-template-columns:repeat(${cols},40px)">
        ${html}
      </div>
    </div>
    <div class="mm-footer">${visitedCount} / ${totalCount} zonas exploradas</div>
  </div>`;
}
