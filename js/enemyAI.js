/**
 * enemyAI.js — SPEC-0802 Enemy intent: behaviors activos + telegraph
 *
 * Módulo puro (sin DOM, sin imports): decide la próxima acción del enemigo
 * según su behavior (asignado en ENEMY_COMBAT_DATA desde SPEC-0604) y si un
 * jefe oculta su intención. El RNG es inyectable para tests deterministas.
 *
 * El contrato con combat.js: se llama con un "enemyLike" —
 *   { behavior, isBoss, hp, maxHp, magicAttack, hasStatusEffect, lastAction, enraged }
 * y devuelve una de las acciones de ACTION_META (menos "unknown", que es
 * solo presentación).
 */

export const BOSS_HIDE_CHANCE = 0.35;
export const POWER_ATTACK_MULT = 1.5;
export const DEFEND_DAMAGE_MULT = 0.5;
export const REGEN_PCT = 0.12;
export const ENRAGE_ATK_MULT = 1.3;

export const ACTION_META = {
  attack:       { icon: "⚔️", labelKey: "intentAttack" },
  power_attack: { icon: "💥", labelKey: "intentPowerAttack" },
  magic:        { icon: "✨", labelKey: "intentMagic" },
  defend:       { icon: "🛡️", labelKey: "intentDefend" },
  regen:        { icon: "💚", labelKey: "intentRegen" },
  status:       { icon: "☠️", labelKey: "intentStatus" },
  enrage:       { icon: "😡", labelKey: "intentEnrage" },
  // SPEC-1101: acciones de boss forzadas por contador de turno (no RNG),
  // decididas en combat.js/rollForcedBossAction — no pasan por decideNextAction.
  devour:       { icon: "😱", labelKey: "intentDevour" },
  overload:     { icon: "⚡", labelKey: "intentOverload" },
  freeze_magic: { icon: "❄️", labelKey: "intentFreezeMagic" },
  unknown:      { icon: "❓", labelKey: "intentUnknown" }
};

export function decideNextAction(e, rng = Math.random) {
  if (!e) return "attack";
  const behavior = e.behavior || (e.isBoss ? "boss" : "standard");
  const canMagic = !!e.magicAttack;
  const hpRatio = e.maxHp > 0 ? e.hp / e.maxHp : 1;

  // SPEC-1103: rasgo "Regenerador" — capa aditiva, independiente de `behavior`
  // (un enemigo "mage" con este rasgo conserva su magia y además puede regenerar).
  // Mismas condiciones que el case "regenerate" de abajo, más el gate de
  // "no quemado hace ≤1 turno" (recentlyBurned).
  if (e.hasRegenTrait && !e.recentlyBurned && hpRatio < 0.6 && e.lastAction !== "regen" && rng() < 0.5) {
    return "regen";
  }

  switch (behavior) {
    case "aggressive":
      return rng() < 0.4 ? "power_attack" : "attack";

    case "defensive":
      if (e.lastAction !== "defend" && rng() < 0.4) return "defend";
      return "attack";

    case "berserker":
      if (!e.enraged && hpRatio < 0.5) return "enrage";
      if (e.enraged && rng() < 0.5) return "power_attack";
      return "attack";

    case "regenerate":
      if (hpRatio < 0.6 && e.lastAction !== "regen" && rng() < 0.5) return "regen";
      return "attack";

    case "mage":
      return canMagic && rng() < 0.7 ? "magic" : "attack";

    case "status":
      if (e.hasStatusEffect && rng() < 0.5) return "status";
      return "attack";

    case "boss": {
      const r = rng();
      if (r < 0.40) return "attack";
      if (r < 0.65) return "power_attack";
      if (r < 0.85) return canMagic ? "magic" : "power_attack";
      return e.lastAction !== "defend" ? "defend" : "attack";
    }

    // SPEC-1101/1219 — Dragon King: 4 fases por umbral de HP (ver
    // docs/PLAN-HISTORIA-FASE4.md), cada una más agresiva (mismo patrón de
    // hpRatio que "berserker", sin tocar la narrativa pre/post ya
    // implementada en combat.js). Los umbrales coinciden con
    // updateBossPhase()/bossMechanics.js a propósito — si se cambian ahí,
    // cambiar acá también. Fases 2 y 3 comparten el mismo tramo de relleno
    // porque rollForcedBossAction() ya las domina con devour/overload
    // forzado; no vale la pena tunear 2 tramos de "relleno" por separado.
    // No telegrafía "defend" en fase 4 — un jefe agonizante no se cubre.
    case "boss_phased": {
      const r = rng();
      if (hpRatio > 0.75) { // Fase 1 — guardia del Titán
        if (r < 0.45) return "attack";
        if (r < 0.70) return "power_attack";
        if (r < 0.90) return canMagic ? "magic" : "power_attack";
        return e.lastAction !== "defend" ? "defend" : "attack";
      }
      if (hpRatio > 0.25) { // Fases 2-3 — devorar/sobrecarga (forzadas aparte)
        if (r < 0.30) return "attack";
        if (r < 0.65) return "power_attack";
        return canMagic ? "magic" : "power_attack";
      }
      // Fase 4 — quemadura final
      if (r < 0.20) return "attack";
      if (r < 0.60) return "power_attack";
      return canMagic ? "magic" : "power_attack";
    }

    default: // standard — comportamiento previo a SPEC-0802
      return canMagic && rng() < 0.3 ? "magic" : "attack";
  }
}

/** Los jefes ocultan su intención ~35% de los turnos; el resto nunca. */
export function isIntentHidden(e, rng = Math.random) {
  return !!e?.isBoss && rng() < BOSS_HIDE_CHANCE;
}
