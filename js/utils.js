export function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
export function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
export function deepClone(obj) { return structuredClone ? structuredClone(obj) : JSON.parse(JSON.stringify(obj)); }