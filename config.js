/* ===========================================================
   Resort Life Sim — CONFIG
   Lean configuration + tuning knobs for the whole game.
   Exposes: window.CONFIG, window.RULES, window.LOCATIONS,
            window.FEATURES, window.PREF_TAGS, window.FLAGS
   =========================================================== */

/* -----------------------------
   Basic game/session settings
   ----------------------------- */
window.CONFIG = {
  title: "Resort Life Sim",
  version: "0.1.0",

  // Session length options and defaults
  dayOptions: [20, 40, 60, 80, 100],
  defaultDays: 40,

  // Phases of a day (turn-based)
  phases: ["Morning", "Afternoon", "Evening", "Night"],

  // Starting values for the player (can be overridden by save/load)
  start: {
    day: 1,
    phaseIndex: 0,
    energy: 100,
    seed: "island-0001" // can be replaced by UI later
  },

  // UI behavior
  ui: {
    showPictures: true,        // character/scene pictures if available
    showNumbers: true,         // reveal numeric meters in UI
    explicitTextAllowed: false // the engine supports flags; keep false for safe copy
  }
};

/* -----------------------------
   Global rules & formulas
   Keep lean; tune here, not in code.
   ----------------------------- */
window.RULES = {
  // Economy
  energyPerDay: 100,
  actionCosts: {
    move: 5,          // change location
    mingle: 10,       // talk/flirt
    train: 15,        // gym/arena prep
    fight: 25,        // organized or spontaneous
    rest: -15         // recovers energy (caps at energyPerDay)
  },

  // Relationship meters (0–100 unless noted)
  attraction: {
    baseTickDirect: 4,   // base for direct meaningful interactions
    baseTickGlance: 1,   // base for sightings/ambient moments
    diminishExp: 0.7,    // diminishing returns exponent
    max: 100
  },

  rapport: { baseTick: 3, diminishExp: 0.7, max: 100 },
  tension: { min: -100, max: 100, spikeOnInsult: [8, 16], spikeOnTriangle: [10, 20] },
  trust:   { baseTick: 2, diminishExp: 0.7, max: 100 },
  respect: { baseTick: 2, diminishExp: 0.7, max: 100 },

  // Arousal & Libido (short-term vs long-term desire)
  arousal: {
    // rises from teasing/flirt; decays each phase; gates some scenes
    teaseGain: [6, 12],
    privateMomentGain: [8, 16],
    decayPerPhase: [6, 10],
    minForIntimacy: 40,     // both parties must be at/above
    softCapForPublic: 55    // public context requires even higher arousal unless soft limit allows
  },

  libido: {
    // libido is “how often I want”; arousal is “how turned-on right now”
    startRange: [35, 75],     // used if not specified in roster
    regenPerDay: [10, 15],    // recovered each end-of-day
    dropAfterSex: [30, 50],   // % drop of current libido after intimacy (scaled by intensity)
    minToInitiate: 35         // below this, character unlikely to initiate intimacy
  },

  // Consent/Boundaries gates
  consent: {
    requireMutual: true,
    trustMinForFirstExplicit: 35,
    respectMinForRougherPlay: 55, // example check for “harder” options
    honorHardLimits: true,        // if violated, the option never appears
    softLimitPenalty: 0.6         // multiplier if a soft limit is nudged (unless context fits)
  },

  // Jealousy & spontaneous confrontations
  jealousy: {
    baseTrigger: 0.08,       // base probability per relevant scene (modified by stats)
    publicMultiplier: 1.4,   // more likely to flare in public spaces like the Club
    privateMultiplier: 0.7,  // less likely in villas/private
    coolDownDays: 1          // minimum days before the same pair flares again
  },

  // Combat (kept very lean; detailed logic lives in combat system)
  combat: {
    staminaDrainPerExchange: [6, 12],
    injuryChancesByDamage: { light: 0.25, moderate: 0.12, severe: 0.04 },
    injuryDurations: { light: [1, 2], moderate: [2, 4], severe: [4, 7] },
    initiativeWeight: { agility: 0.6, reflexes: 0.4 },
    damageWeight: { strength: 0.5, technique: 0.5 }
  },

  // Context multipliers (scene-dependent)
  context: {
    sawDominanceDisplay: 1.3,
    elegantSetting: 1.1,
    victoryGlow: 1.2,
    publicPressure: 0.85, // can reduce intimacy growth unless exhibition-friendly
    afterCare: 1.25       // post-conflict tenderness boosts rapport/trust
  }
};

/* -----------------------------
   Resort locations
   Minimal list for a text-first game
   ----------------------------- */
window.LOCATIONS = [
  { id: "beach",   name: "Beach",   tags: ["sun","relax","flirt"],   eventWeight: 1.0 },
  { id: "pool",    name: "Pool",    tags: ["casual","party"],        eventWeight: 1.0 },
  { id: "club",    name: "Club",    tags: ["public","jealousy"],     eventWeight: 1.2 },
  { id: "arena",   name: "Arena",   tags: ["fight","training"],      eventWeight: 1.1 },
  { id: "spa",     name: "Spa",     tags: ["rest","intimate"],       eventWeight: 0.9 },
  { id: "villas",  name: "Villas",  tags: ["private","intimate"],    eventWeight: 1.0 },
  { id: "gym",     name: "Gym",     tags: ["training","sweat"],      eventWeight: 0.9 }
];

/* -----------------------------
   Feature keys (used by preference math)
   Keep this compact; values are normalized 0–1 by the engine.
   ----------------------------- */
window.FEATURES = [
  "height_cm",
  "strength", "agility", "endurance", "technique", "reflexes",
  "attractiveness", "seduction", "flirtiness",
  "dominance", "stability", "craziness", "loyalty",
  "confidence",            // optional: engine can derive from recent wins & mood
  "fame"                   // optional: can remain 0 if not used
];

/* -----------------------------
   Preference tags → weight mapping
   Add/remove tags here without touching code.
   Positive = likes; negative = dislikes.
   ----------------------------- */
window.PREF_TAGS = {
  // Appearance / build
  tall:            { height_cm: +0.30 },
  short:           { height_cm: -0.20 },
  athletic:        { strength: +0.15, agility: +0.15, endurance: +0.10 },

  // Combat prowess
  strong:          { strength: +0.25 },
  nimble:          { agility: +0.25, reflexes: +0.10 },
  technical:       { technique: +0.25 },
  relentless:      { endurance: +0.20 },

  // Personality flavors
  dominant:        { dominance: +0.20, confidence: +0.10 },
  gentle:          { dominance: -0.10, stability: +0.20 },
  stable:          { stability: +0.20 },
  crazy:           { craziness: +0.25 },        // if someone likes the wild side
  hates_crazy:     { craziness: -0.30 },

  loyal:           { loyalty: +0.25 },
  unfaithful:      { loyalty: -0.25 },

  confident:       { confidence: +0.25 },

  // Social/sexual vibe
  seductive:       { seduction: +0.25 },
  flirty:          { flirtiness: +0.20 },

  // Fame/admiration
  famous:          { fame: +0.25 },

  // Example dislikes (negatives)
  lazy:            { endurance: -0.20, agility: -0.10 },
  dishonest:       { loyalty: -0.30 },
  timid:           { confidence: -0.25 }
};

/* -----------------------------
   Global flags and small helpers
   ----------------------------- */
window.FLAGS = {
  // For this safe build we keep explicit text off.
  // The engine still checks boundaries/consent.
  explicitTextEnabled: false
};

// Simple clamping helper available globally for scripts that don't import modules
window._clamp = function (n, min, max) { return Math.max(min, Math.min(max, n)); };

// Random helper seeding note (actual RNG utility will live in engine.js)
// Here we just store an initial seed string; engine may hash it.
