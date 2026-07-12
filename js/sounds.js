/**
 * sounds.js — Sistema de audio de Pixel Quest Echoes
 *
 * ── CÓMO PERSONALIZAR ────────────────────────────────────────────────
 * Efectos: coloca archivos en sounds/ y edita SOUND_MAP
 * Música:  coloca archivos en music/  y edita MUSIC_MAP
 *   - null deshabilita ese evento
 *   - Formatos: .ogg (recomendado), .wav
 *
 * ── FUENTES CC0 GRATUITAS ────────────────────────────────────────────
 *   freesound.org          → filtro "Creative Commons 0"
 *   mixkit.co/free-sound-effects
 *   opengameart.org        → sección audio, CC0 / CC-BY
 *   pixabay.com/sound-effects
 */

// ── MAPA DE EFECTOS DE SONIDO — EDITABLE ─────────────────────────────
export const SOUND_MAP = {
  // Combate
  combat_start: "sounds/combat_start.ogg",
  attack:       "sounds/attack.ogg",
  magic:        "sounds/magic.ogg",
  skill:        "sounds/skill.ogg",
  hit:          "sounds/hit.ogg",
  player_hurt:  "sounds/player_hurt.ogg",
  enemy_die:    "sounds/enemy_die.ogg",
  player_die:   "sounds/player_die.ogg",
  flee:         "sounds/flee.ogg",
  // Progresión
  level_up:     "sounds/level_up.ogg",
  loot:         "sounds/loot.ogg",
  quest_done:   "sounds/quest_done.ogg",
  // Exploración / UI
  move:         "sounds/move.ogg",
  rest:         "sounds/rest.ogg",
  npc_talk:     "sounds/quest_done.ogg",
};

// ── MAPA DE MÚSICA — EDITABLE ─────────────────────────────────────────
// Una pista por bioma + pista de combate.
// Alias: puedes apuntar varios biomas al mismo archivo.
// null = sin música en esa zona.
export const MUSIC_MAP = {
  town:     "music/town.ogg",
  forest:   "music/forest.ogg",
  dungeon:  "music/cave.ogg",
  mountain: "music/forest.ogg",
  cave:     "music/cave.ogg",
  swamp:    "music/swamp.ogg",
  desert:   "music/swamp.ogg",
  sea:      "music/forest.ogg",
  beach:    "music/forest.ogg",
  jungle:   "music/cave.ogg",
  tundra:   "music/inferno.ogg",
  volcano:  "music/forest.ogg",
  garden:   "music/inferno.ogg",
  combat:   "music/inferno.ogg",
  inferno:   "music/inferno.ogg",
  castle:   "music/forest.ogg",
  port:     "music/forest.ogg",
  none:     null,
};

// ════════════════════════════════════════════════════════════════════
// EFECTOS — estado y funciones
// ════════════════════════════════════════════════════════════════════
let _sfxVolume = 0.5;
let _sfxMuted  = false;
const _cache   = {};

export function setVolume(v) {
  _sfxVolume = Math.max(0, Math.min(1, v));
  try { localStorage.setItem("pqe_volume", _sfxVolume); } catch(e) {}
}
export function getVolume()    { return _sfxVolume; }

export function toggleMute() {
  _sfxMuted = !_sfxMuted;
  try { localStorage.setItem("pqe_muted", String(_sfxMuted)); } catch(e) {}
  return _sfxMuted;
}
export function isMuted() { return _sfxMuted; }

export function playSound(id) {
  if (_sfxMuted) return;
  const src = SOUND_MAP[id];
  if (!src) return;
  try {
    if (!_cache[id]) { _cache[id] = new Audio(src); _cache[id].preload = "auto"; }
    const a = _cache[id].cloneNode();
    a.volume = _sfxVolume;
    a.play().catch(() => {});
  } catch(e) {}
}

export function preloadSounds() {
  Object.keys(SOUND_MAP).forEach(id => {
    const src = SOUND_MAP[id];
    if (!src || _cache[id]) return;
    try { _cache[id] = new Audio(src); _cache[id].preload = "auto"; } catch(e) {}
  });
}

// ════════════════════════════════════════════════════════════════════
// MÚSICA — estado y funciones
// ════════════════════════════════════════════════════════════════════
let _musicAudio   = null;
let _currentSrc   = null;
let _musicVolume  = 0.4;
let _musicMuted   = false;

export function setMusicVolume(v) {
  _musicVolume = Math.max(0, Math.min(1, v));
  if (_musicAudio && !_musicMuted) _musicAudio.volume = _musicVolume;
  try { localStorage.setItem("pqe_music_volume", _musicVolume); } catch(e) {}
}
export function getMusicVolume() { return _musicVolume; }

export function toggleMusicMute() {
  _musicMuted = !_musicMuted;
  if (_musicAudio) _musicAudio.volume = _musicMuted ? 0 : _musicVolume;
  try { localStorage.setItem("pqe_music_muted", String(_musicMuted)); } catch(e) {}
  return _musicMuted;
}
export function isMusicMuted() { return _musicMuted; }

/**
 * Cambia la música con crossfade.
 * @param {string|null} key — clave en MUSIC_MAP o null para silenciar
 */
export function playMusic(key) {
  const src = key ? (MUSIC_MAP[key] ?? null) : null;
  if (src === _currentSrc) return;
  _currentSrc = src;

  // Fade out pista actual
  if (_musicAudio) {
    const old = _musicAudio;
    _fade(old, old.volume, 0, 600, () => { old.pause(); old.src = ""; });
    _musicAudio = null;
  }

  if (!src) return;

  const audio = new Audio(src);
  audio.loop   = true;
  audio.volume = 0;
  _musicAudio  = audio;
  audio.play().catch(() => {});
  if (!_musicMuted) _fade(audio, 0, _musicVolume, 900);
}

export function stopMusic() { playMusic(null); }

function _fade(audio, from, to, ms, cb) {
  const steps = 20;
  const step  = { n: 0 };
  const delta = (to - from) / steps;
  const t = setInterval(() => {
    step.n++;
    audio.volume = Math.max(0, Math.min(1, from + delta * step.n));
    if (step.n >= steps) { clearInterval(t); cb?.(); }
  }, ms / steps);
}

// ════════════════════════════════════════════════════════════════════
// INIT — carga preferencias guardadas
// ════════════════════════════════════════════════════════════════════
export function initAudio() {
  try {
    const sv = localStorage.getItem("pqe_volume");
    const sm = localStorage.getItem("pqe_muted");
    const mv = localStorage.getItem("pqe_music_volume");
    const mm = localStorage.getItem("pqe_music_muted");
    if (sv !== null) _sfxVolume   = parseFloat(sv);
    if (sm !== null) _sfxMuted    = (sm === "true");
    if (mv !== null) _musicVolume = parseFloat(mv);
    if (mm !== null) _musicMuted  = (mm === "true");
  } catch(e) {}
}
