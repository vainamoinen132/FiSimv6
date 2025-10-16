/* ===========================================================
   Resort Life Sim — MAIN
   - Boots Engine and UI
   - Supports URL params: ?days=40&seed=custom123
   - Adds a short tutorial entry to the log on first run
   =========================================================== */

(function () {
  function parseParams() {
    const p = new URLSearchParams(location.search);
    const out = {};
    if (p.has("days")) {
      const n = parseInt(p.get("days"), 10);
      if (!Number.isNaN(n)) out.days = n;
    }
    if (p.has("seed")) out.seed = p.get("seed");
    return out;
  }

  function applyParamsToConfig(params) {
    if (params.days) {
      const allowed = (window.CONFIG?.dayOptions || []);
      const valid = allowed.includes(params.days) ? params.days : (window.CONFIG?.defaultDays || 40);
      if (window.Engine?.getState) {
        // If engine already running, update its setting directly later
      } else {
        // If before engine init, adjust CONFIG defaults
        window.CONFIG.defaultDays = valid;
      }
    }
    if (params.seed) {
      if (window.Engine?.getState) {
        // Will not be used for already-initialized session
      } else {
        window.CONFIG.start = window.CONFIG.start || {};
        window.CONFIG.start.seed = params.seed;
      }
    }
  }

  function initialTutorialLog() {
    const E = window.Engine;
    const loc = E.getState().locationId;
    const locName = (window.LOCATIONS.find(l => l.id === loc) || {}).name || loc;
    const msg = [
      "Welcome to the resort.",
      "Each day has 4 phases. Spend energy to move, mingle, train, rest, or spar.",
      "Pick a location on the left; interact from the center choices or via the roster.",
      "At the end of the day, you’ll see highlights from NPC actions."
    ].join(" ");
    // Push the tutorial lines to the log for clarity
    E.getState().log.push({ t: new Date().toISOString(), tag: "tips", text: msg });
    E.getState().log.push({ t: new Date().toISOString(), tag: "tips", text: `You start at the ${locName}.` });
  }

  function init() {
    // Read URL params and adjust CONFIG if provided
    const params = parseParams();
    applyParamsToConfig(params);

    // Boot the engine first
    window.Engine.init();

    // If session length was passed after init, sync it now
    if (params.days && window.Engine.getState) {
      window.Engine.getState().settings.totalDays = params.days;
    }

    // Tutorial note (first run only for this tab)
    if (!sessionStorage.getItem("resort.tutorialShown")) {
      initialTutorialLog();
      sessionStorage.setItem("resort.tutorialShown", "1");
    }

    // Then mount the UI
    window.UI.initUI();

    // Optional: expose quick restart for debugging
    window.Resort = {
      restartWith(seed = ("seed-" + Math.random().toString(36).slice(2)), days = window.CONFIG.defaultDays) {
        // Simple soft-restart: reload with query
        const url = new URL(location.href);
        url.searchParams.set("seed", seed);
        url.searchParams.set("days", String(days));
        location.href = url.toString();
      }
    };

    // Status line
    const st = document.getElementById("statusMini");
    if (st) st.textContent = "Ready. Use the left panel to choose a location or action.";
  }

  document.addEventListener("DOMContentLoaded", init);
})();
