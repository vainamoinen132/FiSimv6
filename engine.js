/* ===========================================================
   Resort Life Sim — ENGINE (lean core)
   - Consumes: CONFIG, RULES, LOCATIONS, CHARACTERS, CHARACTER_PICS
   - Exposes:  window.Engine (singleton API)
   =========================================================== */

(function () {
  // ---------- Utilities ----------
  const rand = (() => {
    // Simple xorshift32 seeded RNG (deterministic)
    let seed = 123456789;
    function setSeed(str) {
      // hash string to 32-bit int
      let h = 2166136261 >>> 0;
      for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
      }
      seed = h >>> 0;
    }
    function next() {
      seed ^= seed << 13; seed >>>= 0;
      seed ^= seed >>> 17; seed >>>= 0;
      seed ^= seed << 5;  seed >>>= 0;
      return (seed >>> 0) / 4294967296;
    }
    function int(min, max) { return Math.floor(next() * (max - min + 1)) + min; }
    function pick(arr) { return arr[Math.floor(next() * arr.length)]; }
    function range(min, max) {
      // if array [a,b] passed, treat as inclusive int range
      if (Array.isArray(min)) return int(min[0], min[1]);
      return int(min, max);
    }
    return { setSeed, next, int, pick, range };
  })();

  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
  function idPair(a, b) { return a < b ? `${a}|${b}` : `${b}|${a}`; }
  function toLowerKey(name) { return (name || "").toLowerCase(); }

  // Shallow copy helper
  const copy = (obj) => JSON.parse(JSON.stringify(obj));

  // ---------- Engine State ----------
  const S = {
    day: CONFIG?.start?.day ?? 1,
    phaseIndex: CONFIG?.start?.phaseIndex ?? 0,
    energy: CONFIG?.start?.energy ?? 100,
    locationId: "beach",
    seed: CONFIG?.start?.seed ?? ("seed-" + Math.random().toString(36).slice(2)),

    characters: [],       // enriched characters (base + runtime status)
    relationships: {},    // key: "A|B" -> { rapport, attraction, tension, trust, respect, flags, cool }
    highlights: [],       // end-of-day notable events
    log: [],              // rolling UI log
    settings: {
      explicitTextAllowed: CONFIG?.ui?.explicitTextAllowed ?? false,
      showPictures: CONFIG?.ui?.showPictures ?? true,
      totalDays: CONFIG?.defaultDays ?? 40
    }
  };

  // Subscribers
  const listeners = new Set();
  function emit() { listeners.forEach(fn => fn()); }
  function log(tag, text) {
    S.log.push({ t: new Date().toISOString(), tag, text });
    if (S.log.length > 200) S.log.shift();
  }

  // ---------- Character Runtime Layer ----------
  function initCharacters() {
    S.characters = (window.CHARACTERS || []).map(base => {
      const c = copy(base);
      // Runtime status (not present in original file)
      c.status = {
        energy: RULES.energyPerDay,
        mood: 70,
        arousal: rand.int(10, 30),
        libido: rand.range(RULES.libido.startRange),
        injury: c.injuryLevel || null,
        injury_duration: c.injuryDuration || 0,
        championships: c.championships || 0
      };
      // Backwards compatibility: keep injuryLevel/Duration sync
      c.injuryLevel = c.status.injury;
      c.injuryDuration = c.status.injury_duration;
      // Pic
      const key = toLowerKey(c.name);
      c.image = (window.CHARACTER_PICS && window.CHARACTER_PICS[key]) || null;
      return c;
    });
  }

  // ---------- Relationships ----------
  function ensureRelationship(aName, bName) {
    const key = idPair(aName, bName);
    if (!S.relationships[key]) {
      S.relationships[key] = {
        a: aName, b: bName,
        rapport: rand.int(20, 40),
        attraction: rand.int(10, 35),
        tension: rand.int(-10, 20), // -100..100
        trust: rand.int(15, 35),
        respect: rand.int(30, 50),
        flags: [],          // "rivals","lovers","exes","fwb"
        cool: 0             // jealousy cooldown days
      };
    }
    return S.relationships[key];
  }
  function relGet(aName, bName) { return S.relationships[idPair(aName, bName)]; }

  function forEachPair(cb) {
    const n = S.characters.length;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        cb(S.characters[i], S.characters[j]);
      }
    }
  }

  // ---------- Features (normalized) for preference math ----------
  function featureValue(char, key) {
    const f = char.fighting_attributes || {};
    const p = char.physical_attributes || {};
    const m = char.mental_attributes || {};
    switch (key) {
      case "height_cm": return (char.height || 165); // raw cm before normalization
      case "strength": return f.strength || 50;
      case "agility": return f.agility || 50;
      case "endurance": return f.endurance ?? f.stamina ?? 50;
      case "technique": return f.technique || 50;
      case "reflexes": return f.reflexes || 50;
      case "attractiveness": return p.attractiveness || 50;
      case "seduction": return p.seduction || 50;
      case "flirtiness": return p.flirtiness || 50;
      case "dominance": return m.dominance || 50;
      case "stability": return m.stability || 50;
      case "craziness": return m.craziness || 50;
      case "loyalty": return m.loyalty || 50;
      case "confidence":
        // derive: average of dominance + stability + recent mood
        return Math.round(( (m.dominance||50) + (m.stability||50) + (currentMood(char)) ) / 3);
      case "fame":
        // simple proxy: championships and wins could feed this later
        return (char.status?.championships || 0) * 5;
      default: return 50;
    }
  }

  // Normalize 0..1 per feature across the current cast (except height which is percentile-ish)
  function computeNormalization() {
    const feats = CONFIG.FEATURES || window.FEATURES || [];
    const sums = {}, mins = {}, maxs = {};
    S.characters.forEach(c => {
      feats.forEach(k => {
        const v = featureValue(c, k);
        sums[k] = (sums[k] || 0) + v;
        mins[k] = mins[k] === undefined ? v : Math.min(mins[k], v);
        maxs[k] = maxs[k] === undefined ? v : Math.max(maxs[k], v);
      });
    });
    return { mins, maxs };
  }

  function normalizedFeature(char, key, norm) {
    const v = featureValue(char, key);
    if (key === "height_cm") {
      // Map to 0..1 using min/max across cast (acts like percentile)
      const min = norm.mins[key] ?? 150, max = norm.maxs[key] ?? 180;
      return (v - min) / Math.max(1, (max - min));
    }
    const min = norm.mins[key] ?? 0, max = norm.maxs[key] ?? 100;
    return (v - min) / Math.max(1, (max - min));
  }

  function weightsFromTags(prefObj) {
    const tagMap = window.PREF_TAGS || {};
    const w = {};
    if (prefObj?.likes) {
      prefObj.likes.forEach(tag => {
        const m = tagMap[tag];
        if (m) for (const k in m) w[k] = (w[k] || 0) + m[k];
      });
    }
    if (prefObj?.dislikes) {
      prefObj.dislikes.forEach(tag => {
        const m = tagMap[tag];
        if (m) for (const k in m) w[k] = (w[k] || 0) + m[k];
      });
    }
    return w;
  }

  function currentMood(c) { return c.status?.mood ?? 60; }
  function currentArousal(c) { return c.status?.arousal ?? 0; }
  function currentLibido(c) { return c.status?.libido ?? 50; }

  // Directional compatibility: self -> target (−1..+1 approx)
  function compatibility(self, target, norm) {
    // Orientation check (very light gate; you can tune later)
    if (self.sexual_orientation === "lesbian" && target.sexual_orientation === "straight") return -0.2;
    if (self.sexual_orientation === "straight" && target.sexual_orientation === "lesbian") return -0.2;

    const feats = window.FEATURES || [];
    const weights = weightsFromTags(self.preferences || {});
    let sum = 0, sumAbs = 0;

    feats.forEach(k => {
      const w = weights[k] || 0;
      if (w !== 0) {
        const fv = normalizedFeature(target, k, norm);
        sum += w * fv;
        sumAbs += Math.abs(w);
      }
    });

    // scale to approx −1..1 by dividing by total abs weight (avoid division by zero)
    const score = sumAbs > 0 ? (sum / sumAbs) : 0;
    // mood & recent arousal affect responsiveness
    const moodFactor = (currentMood(self) - 50) / 100 * 0.2;  // −0.1..+0.1
    const arousalFactor = (currentArousal(self) / 100) * 0.2; // 0..+0.2
    return clamp(score + moodFactor + arousalFactor, -1, 1);
  }

  // Update attraction (0..100) with diminishing returns and context multiplier
  function bumpAttraction(aName, bName, base, contextMult = 1) {
    const rel = ensureRelationship(aName, bName);
    const a = getChar(aName);
    const b = getChar(bName);
    const norm = computeNormalization();
    const comp = compatibility(a, b, norm); // directional A->B

    let delta = base * comp * contextMult;
    // libido responsiveness (low libido dampens)
    const lf = clamp(currentLibido(a) / 60, 0.5, 1.3);
    delta *= lf;

    const diminish = Math.pow(1 - (rel.attraction / RULES.attraction.max), RULES.attraction.diminishExp);
    delta *= diminish;

    // Apply floors/rounding
    if (delta > 0) delta = Math.max(0.2, delta);
    if (delta < 0) delta = Math.min(-0.2, delta);

    rel.attraction = clamp(rel.attraction + delta, 0, RULES.attraction.max);
    return { rel, delta: +delta.toFixed(2) };
  }

  function bumpRapport(aName, bName, amt) {
    const rel = ensureRelationship(aName, bName);
    const diminish = Math.pow(1 - (rel.rapport / 100), RULES.rapport.diminishExp);
    const delta = amt * diminish;
    rel.rapport = clamp(rel.rapport + delta, 0, 100);
    return +delta.toFixed(2);
  }

  function spikeTension(aName, bName, range) {
    const rel = ensureRelationship(aName, bName);
    const d = rand.range(range);
    rel.tension = clamp(rel.tension + d, RULES.tension.min, RULES.tension.max);
    return d;
  }

  // ---------- Actions ----------
  function setLocation(locId) {
    if (!window.LOCATIONS.find(l => l.id === locId)) return false;
    if (S.energy < RULES.actionCosts.move) {
      log("energy", "You’re too tired to move.");
      return false;
    }
    S.locationId = locId;
    S.energy -= RULES.actionCosts.move;
    log("move", `You move to the ${locName(locId)}.`);
    emit();
    return true;
  }

  function actMingle(targetName) {
    const target = getChar(targetName);
    if (!target) return false;
    if (S.energy < RULES.actionCosts.mingle) { log("energy", "Not enough energy to mingle."); return false; }
    S.energy -= RULES.actionCosts.mingle;

    // Attraction + Rapport bumps
    const { delta } = bumpAttraction(player().name, target.name, RULES.attraction.baseTickDirect, contextMultiplier("social"));
    const r = bumpRapport(player().name, target.name, RULES.rapport.baseTick);

    // Arousal gains
    target.status.arousal = clamp(target.status.arousal + rand.range(RULES.arousal.teaseGain), 0, 100);
    player().status.arousal = clamp(player().status.arousal + rand.range(RULES.arousal.teaseGain), 0, 100);

    log("mingle", `You mingle with ${target.name}: attraction ${delta >= 0 ? "+" : ""}${delta}, rapport +${r.toFixed(1)}.`);
    maybeJealousy(target.name, "public");
    emit();
    return true;
  }

  function actTrain() {
    if (S.energy < RULES.actionCosts.train) { log("energy", "Too tired to train."); return false; }
    S.energy -= RULES.actionCosts.train;

    // Small stat buffs (temporary mood/confidence)
    const p = player();
    const f = p.fighting_attributes;
    const gain = rand.int(1, 2);
    f.stamina = clamp(f.stamina + gain, 0, 100);
    p.status.mood = clamp(p.status.mood + rand.int(1, 3), 0, 100);
    log("train", `You trained. Stamina +${gain}, mood improves.`);
    emit();
    return true;
  }

  function actRest() {
    // Rest gives back energy (caps at day max) and lowers arousal a bit
    S.energy = clamp(S.energy - RULES.actionCosts.rest, 0, RULES.energyPerDay);
    player().status.arousal = clamp(player().status.arousal - rand.range(RULES.arousal.decayPerPhase), 0, 100);
    log("rest", `You rest and recover energy.`);
    emit();
    return true;
  }

  function actFight(opponentName) {
    const opp = getChar(opponentName);
    if (!opp) return false;
    if (S.energy < RULES.actionCosts.fight) { log("energy", "Not enough energy to fight."); return false; }
    S.energy -= RULES.actionCosts.fight;

    // Very lean fight resolution
    const A = player(), B = opp;
    const initA = (A.fighting_attributes.agility * RULES.combat.initiativeWeight.agility) +
                  (A.fighting_attributes.reflexes * RULES.combat.initiativeWeight.reflexes);
    const initB = (B.fighting_attributes.agility * RULES.combat.initiativeWeight.agility) +
                  (B.fighting_attributes.reflexes * RULES.combat.initiativeWeight.reflexes);
    const first = initA + rand.int(0, 10) >= initB + rand.int(0, 10) ? A : B;
    const second = first === A ? B : A;

    // damage = strength/technique with a little randomness
    function dmg(char) {
      const w = RULES.combat.damageWeight;
      const base = char.fighting_attributes.strength * w.strength + char.fighting_attributes.technique * w.technique;
      return Math.round(base / 20 + rand.int(0, 6));
    }
    const d1 = dmg(first), d2 = dmg(second);

    const winner = d1 >= d2 ? first : second;
    const loser  = winner === first ? second : first;

    // Injury chance to loser
    const roll = rand.next();
    const ic = RULES.combat.injuryChancesByDamage;
    let inj = null;
    if (roll < ic.severe) inj = "severe";
    else if (roll < ic.severe + ic.moderate) inj = "moderate";
    else if (roll < ic.severe + ic.moderate + ic.light) inj = "light";
    if (inj) {
      loser.status.injury = inj;
      loser.injuryLevel = inj;
      loser.status.injury_duration = rand.range(RULES.combat.injuryDurations[inj]);
      loser.injuryDuration = loser.status.injury_duration;
    }

    // Respect and attraction bumps
    const key = idPair(A.name, B.name);
    ensureRelationship(A.name, B.name);
    const resBump = rand.int(3, 6);
    S.relationships[key].respect = clamp(S.relationships[key].respect + resBump, 0, 100);

    // Winner glow boosts attraction toward winner for onlookers (simplified: opponent only for now)
    const attr = bumpAttraction(loser.name, winner.name, RULES.attraction.baseTickDirect, RULES.context.victoryGlow);

    log("fight", `${A.name} vs ${B.name}: ${winner.name} wins${inj ? `; ${loser.name} is ${inj}ly injured` : ""}. Respect +${resBump}, attraction ${attr.delta >= 0 ? "+" : ""}${attr.delta}.`);
    emit();
    return true;
  }

  // ---------- Jealousy ----------
  function maybeJealousy(targetName, context = "public") {
    // Simple: check one random observer who likes either you or target
    const others = S.characters.filter(c => c.name !== player().name && c.name !== targetName);
    if (others.length === 0) return;

    const observer = rand.pick(others);
    const relToYou = ensureRelationship(observer.name, player().name);
    const relToTarget = ensureRelationship(observer.name, targetName);

    const base = RULES.jealousy.baseTrigger;
    const publicMult = context === "public" ? RULES.jealousy.publicMultiplier : RULES.jealousy.privateMultiplier;

    // jealousy sensitivity proxy = observer.mental_attributes.jealousy (0..100)
    const sens = (observer.mental_attributes?.jealousy ?? 40) / 100;
    const likeYou = relToYou.attraction / 100;
    const likeTar = relToTarget.attraction / 100;

    // If already cooled recently, skip
    if (relToYou.cool > 0 || relToTarget.cool > 0) return;

    const p = base * publicMult * (sens + likeYou + likeTar) / 3;
    if (rand.next() < p) {
      // Spike tension with the one they care about more (pick you by default)
      const who = likeYou >= likeTar ? player().name : targetName;
      const sp = spikeTension(observer.name, who, RULES.tension.spikeOnTriangle);
      relToYou.cool = RULES.jealousy.coolDownDays;
      relToTarget.cool = RULES.jealousy.coolDownDays;
      log("jealousy", `${observer.name} looks heated about ${who}… Tension +${sp}.`);
    }
  }

  // ---------- Phases & Day Loop ----------
  function nextPhase() {
    // Passive arousal decay
    S.characters.forEach(c => {
      c.status.arousal = clamp(c.status.arousal - rand.range(RULES.arousal.decayPerPhase), 0, 100);
    });

    S.phaseIndex++;
    if (S.phaseIndex >= CONFIG.phases.length) {
      endDay();
      return;
    }
    log("phase", `Phase → ${phaseLabel()}.`);
    emit();
  }

  function endDay() {
    // NPC background: regenerate libido, cool jealousies, minor random interactions
    S.characters.forEach(c => {
      // libido regen
      c.status.libido = clamp(c.status.libido + rand.range(RULES.libido.regenPerDay), 0, 100);
      // jealousy cool-downs
      forEachPair((x, y) => {
        const r = relGet(x.name, y.name);
        if (r && r.cool > 0) r.cool -= 1;
      });
      // injury countdown
      if (c.status.injury && c.status.injury_duration > 0) {
        c.status.injury_duration -= 1;
        c.injuryDuration = c.status.injury_duration;
        if (c.status.injury_duration <= 0) {
          c.status.injury = null; c.injuryLevel = null;
        }
      }
    });

    // Highlight: pick 1–2 notable NPC interactions (simple flavor for now)
    const npcList = S.characters.filter(c => c.name !== player().name);
    if (npcList.length >= 2) {
      const a = rand.pick(npcList), b = rand.pick(npcList.filter(x => x !== a));
      const { delta } = bumpAttraction(a.name, b.name, RULES.attraction.baseTickGlance, 1.1);
      S.highlights.push(`Rumor: ${a.name} and ${b.name} shared a moment (+${delta} attraction).`);
      if (S.highlights.length > 10) S.highlights.shift();
    }

    // Reset for new day
    S.day += 1;
    S.phaseIndex = 0;
    S.energy = RULES.energyPerDay;
    log("day", `A new day dawns. Day ${S.day}.`);
    emit();
  }

  // ---------- Public API Helpers ----------
  function phaseLabel() { return CONFIG.phases[S.phaseIndex] || "Unknown"; }
  function locName(id) { return (window.LOCATIONS.find(l => l.id === id) || { name: id }).name; }
  function player() { return S.characters[0]; } // single-avatar design; index 0 is the player
  function getChar(name) { return S.characters.find(c => c.name === name); }
  function getRoster() {
    return S.characters.map(c => ({
      name: c.name,
      sub: `${c.age} • ${c.height}cm`,
      image: c.image || window.__PLACEHOLDER_PIC__,
      mood: c.status.mood,
      arousal: c.status.arousal,
      injury: c.status.injury
    }));
  }
  function getRelationships() { return S.relationships; }

  function setPlayer(name) {
    const idx = S.characters.findIndex(c => c.name === name);
    if (idx <= 0) return false; // already first or not found
    const [ch] = S.characters.splice(idx, 1);
    S.characters.unshift(ch);
    log("player", `You are now playing as ${ch.name}.`);
    emit();
    return true;
  }

  function availableActions() {
    return [
      { id: "mingle", label: "Mingle / Flirt", needsTarget: true },
      { id: "train",  label: "Train", needsTarget: false },
      { id: "rest",   label: "Rest", needsTarget: false },
      { id: "fight",  label: "Fight (Spar)", needsTarget: true }
    ];
  }

  function doAction(actionId, targetName) {
    switch (actionId) {
      case "mingle": return actMingle(targetName);
      case "train":  return actTrain();
      case "rest":   return actRest();
      case "fight":  return actFight(targetName);
      default: return false;
    }
  }

  function getLocations() {
    return (window.LOCATIONS || []).map(l => ({
      id: l.id, name: l.name, selected: S.locationId === l.id
    }));
  }

  function getLog() { return S.log.slice(-50); }
  function getHighlights() { return S.highlights.slice(); }

  function init() {
    rand.setSeed(S.seed);
    initCharacters();
    // Pre-seed relationships
    forEachPair((a, b) => ensureRelationship(a.name, b.name));
    log("init", `Welcome. You are ${player().name}. Day ${S.day}, ${phaseLabel()}. Location: ${locName(S.locationId)}.`);
    emit();
  }

  // ---------- Export ----------
  window.Engine = {
    // lifecycle
    init,
    onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },

    // state getters
    getState() { return S; },
    getDay() { return S.day; },
    getPhaseLabel: phaseLabel,
    getEnergy() { return S.energy; },
    getLocationId() { return S.locationId; },
    getLocations,
    getRoster,
    getRelationships,
    getLog,
    getHighlights,

    // identity
    getPlayer() { return player().name; },
    setPlayer,

    // world actions
    setLocation,
    availableActions,
    doAction,
    nextPhase,
    endDay,

    // images
    getPic(name) {
      const key = toLowerKey(name);
      return (window.CHARACTER_PICS && window.CHARACTER_PICS[key]) || window.__PLACEHOLDER_PIC__;
    }
  };
})();
