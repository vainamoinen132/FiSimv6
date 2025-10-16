/* ===========================================================
   Resort Life Sim — UI (lean DOM renderer) — UPDATED
   - Adds working Save/Load (localStorage "resort.save")
   - Keeps minimal text-first UI
   =========================================================== */

(function () {
  // ---- Element refs ----
  const el = {
    dayCounter: document.getElementById("dayCounter"),
    phaseLabel: document.getElementById("phaseLabel"),
    energyLabel: document.getElementById("energyLabel"),
    statusMini: document.getElementById("statusMini"),

    locationList: document.getElementById("locationList"),
    quickActions: document.getElementById("quickActions"),

    sceneTitle: document.getElementById("sceneTitle"),
    sceneImgEl: document.getElementById("sceneImgEl"),
    sceneText: document.getElementById("sceneText"),
    choiceList: document.getElementById("choiceList"),
    logPanel: document.getElementById("logPanel"),

    rosterList: document.getElementById("rosterList"),

    btnPrevPhase: document.getElementById("btnPrevPhase"),
    btnNextPhase: document.getElementById("btnNextPhase"),
    btnEndDay: document.getElementById("btnEndDay"),

    btnSettings: document.getElementById("btnSettings"),
    btnSave: document.getElementById("btnSave"),
    btnLoad: document.getElementById("btnLoad")
  };

  // ---- Local UI state ----
  const UIState = {
    pendingAction: null,     // { id, label, needsTarget } or null
    pendingTarget: null,     // target name if chosen
    lastScene: { title: "Welcome", text: "Pick a location or an action to begin.", imgName: null }
  };

  // ---- Helpers ----
  function setStatus(text) {
    el.statusMini.textContent = text;
  }
  function btn(label, className = "", onClick = null) {
    const b = document.createElement("button");
    b.className = className ? `choice-btn ${className}` : "choice-btn";
    b.textContent = label;
    if (onClick) b.addEventListener("click", onClick);
    return b;
  }
  function rosterBtn(label, onClick) {
    const b = document.createElement("button");
    b.textContent = label;
    b.addEventListener("click", onClick);
    return b;
  }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
  function picFor(name) { return window.Engine.getPic(name); }
  function playerName() { return window.Engine.getPlayer(); }

  // ---- Renderers ----
  function renderTopbar() {
    el.dayCounter.textContent = `Day ${Engine.getDay()}`;
    el.phaseLabel.textContent = Engine.getPhaseLabel();
    el.energyLabel.textContent = `Energy: ${Engine.getEnergy()}`;
  }

  function renderLocations() {
    clear(el.locationList);
    Engine.getLocations().forEach(loc => {
      const b = document.createElement("button");
      b.textContent = `${loc.name}${loc.selected ? " ✓" : ""}`;
      b.className = "choice-btn";
      b.addEventListener("click", () => {
        const ok = Engine.setLocation(loc.id);
        if (ok) {
          UIState.lastScene = {
            title: loc.name,
            text: `You arrive at the ${loc.name}.`,
            imgName: null
          };
          renderScene();
          renderTopbar();
          renderLog();
        }
      });
      el.locationList.appendChild(b);
    });
  }

  function renderActions() {
    clear(el.quickActions);
    Engine.availableActions().forEach(a => {
      const b = document.createElement("button");
      b.textContent = a.label;
      b.className = "choice-btn";
      b.addEventListener("click", () => startActionFlow(a));
      el.quickActions.appendChild(b);
    });
  }

  function startActionFlow(action) {
    UIState.pendingAction = action;
    UIState.pendingTarget = null;
    clear(el.choiceList);

    if (!action.needsTarget) {
      // Execute immediately
      const ok = Engine.doAction(action.id);
      if (ok) {
        UIState.lastScene = {
          title: action.label,
          text: sceneTextFromAction(action.id),
          imgName: playerName()
        };
        postActionRefresh();
      }
      return;
    }

    // Needs target: let user pick from roster (excluding player)
    el.choiceList.appendChild(
      btn(`Choose target for "${action.label}"`, "accent")
    );
    // Build target buttons
    const roster = Engine.getState().characters.map(c => c.name)
      .filter(n => n !== playerName());

    roster.forEach(name => {
      el.choiceList.appendChild(
        btn(name, "", () => {
          UIState.pendingTarget = name;
          const ok = Engine.doAction(action.id, name);
          if (ok) {
            UIState.lastScene = {
              title: `${action.label} → ${name}`,
              text: sceneTextFromAction(action.id, name),
              imgName: name
            };
            postActionRefresh();
          }
        })
      );
    });
  }

  function sceneTextFromAction(actionId, targetName) {
    const loc = Engine.getState().locationId;
    const locLabel = (window.LOCATIONS.find(l => l.id === loc) || {}).name || loc;
    switch (actionId) {
      case "mingle": return `At the ${locLabel}, you strike up a conversation with ${targetName}. The air between you feels charged.`;
      case "train":  return `You focus on drills and conditioning at the ${locLabel}. Sweat, breath, discipline.`;
      case "rest":   return `You take a moment to breathe, unwind, and recover your strength.`;
      case "fight":  return `A quick spar with ${targetName} draws a few curious glances.`;
      default:       return `You proceed with your plan.`;
    }
  }

  function renderScene() {
    // Title
    el.sceneTitle.textContent = UIState.lastScene.title || "Scene";
    // Text
    el.sceneText.textContent = UIState.lastScene.text || "";
    // Image
    const name = UIState.lastScene.imgName;
    if (name) {
      el.sceneImgEl.src = picFor(name);
    } else {
      el.sceneImgEl.src = window.__PLACEHOLDER_PIC__;
    }
  }

  function renderRoster() {
    clear(el.rosterList);
    const chars = Engine.getState().characters;
    const you = playerName();

    chars.forEach(ch => {
      const card = document.createElement("div");
      card.className = "card";

      const imgWrap = document.createElement("div");
      imgWrap.className = "card-img";
      const img = document.createElement("img");
      img.alt = ch.name;
      img.src = picFor(ch.name);
      imgWrap.appendChild(img);

      const body = document.createElement("div");
      body.className = "card-body";
      const nameEl = document.createElement("div");
      nameEl.className = "card-name";
      nameEl.textContent = ch.name + (ch.name === you ? " (You)" : "");
      const sub = document.createElement("div");
      sub.className = "card-sub";
      const inj = ch.status.injury ? ` • ${ch.status.injury} injury` : "";
      sub.textContent = `${ch.age} • ${ch.height}cm • Mood ${ch.status.mood} • Arousal ${ch.status.arousal}${inj}`;
      body.appendChild(nameEl);
      body.appendChild(sub);

      const actions = document.createElement("div");
      actions.className = "card-actions";
      if (ch.name !== you) {
        actions.appendChild(rosterBtn("Mingle", () => {
          startActionFlow({ id: "mingle", label: "Mingle / Flirt", needsTarget: true });
          // auto-select target
          const ok = Engine.doAction("mingle", ch.name);
          if (ok) {
            UIState.lastScene = {
              title: `Mingle → ${ch.name}`,
              text: sceneTextFromAction("mingle", ch.name),
              imgName: ch.name
            };
            postActionRefresh();
          }
        }));
        actions.appendChild(rosterBtn("Fight", () => {
          startActionFlow({ id: "fight", label: "Fight (Spar)", needsTarget: true });
          const ok = Engine.doAction("fight", ch.name);
          if (ok) {
            UIState.lastScene = {
              title: `Fight → ${ch.name}`,
              text: sceneTextFromAction("fight", ch.name),
              imgName: ch.name
            };
            postActionRefresh();
          }
        }));
      } else {
        // Switch player option (useful if you later allow selecting any avatar)
        actions.appendChild(rosterBtn("Set as Player", () => {
          Engine.setPlayer(ch.name);
          setStatus(`You are now ${ch.name}.`);
        }));
      }

      card.appendChild(imgWrap);
      card.appendChild(body);
      card.appendChild(actions);
      el.rosterList.appendChild(card);
    });
  }

  function renderLog() {
    clear(el.logPanel);
    Engine.getLog().forEach(entry => {
      const div = document.createElement("div");
      div.className = "log-entry";
      const tag = document.createElement("span");
      tag.className = "tag";
      tag.textContent = `[${entry.tag}]`;
      const text = document.createElement("span");
      text.textContent = " " + entry.text;
      div.appendChild(tag);
      div.appendChild(text);
      el.logPanel.appendChild(div);
    });
    el.logPanel.scrollTop = el.logPanel.scrollHeight;
  }

  function postActionRefresh() {
    renderTopbar();
    renderScene();
    renderRoster();
    renderLog();
    setStatus("Action resolved.");
  }

  // ---- Save / Load ----
  function doSave() {
    // Persist only the Engine state; shallow copy to avoid circular refs
    const S = Engine.getState();
    // Minimal snapshot (safe fields only)
    const save = {
      day: S.day,
      phaseIndex: S.phaseIndex,
      energy: S.energy,
      locationId: S.locationId,
      seed: S.seed,
      settings: S.settings,
      characters: S.characters,
      relationships: S.relationships,
      highlights: S.highlights,
      log: S.log
    };
    localStorage.setItem("resort.save", JSON.stringify(save));
    setStatus("Game saved.");
  }

  function doLoad() {
    const raw = localStorage.getItem("resort.save");
    if (!raw) return alert("No save found.");
    try {
      const data = JSON.parse(raw);
      const S = Engine.getState();
      // Overwrite known fields (in-place so listeners still see same object)
      S.day = data.day ?? S.day;
      S.phaseIndex = data.phaseIndex ?? S.phaseIndex;
      S.energy = data.energy ?? S.energy;
      S.locationId = data.locationId ?? S.locationId;
      S.seed = data.seed ?? S.seed;
      S.settings = Object.assign({}, S.settings, data.settings || {});
      S.characters = data.characters || S.characters;
      S.relationships = data.relationships || S.relationships;
      S.highlights = data.highlights || [];
      S.log = data.log || [];

      // Refresh UI
      UIState.lastScene = { title: `Loaded`, text: `Save loaded. Day ${S.day}, ${Engine.getPhaseLabel()}.`, imgName: null };
      Engine.onChange(() => {}); // no-op; ensures UI keeps subscribed
      renderAll();
      setStatus("Save loaded.");
    } catch (e) {
      console.error(e);
      alert("Failed to load save.");
    }
  }

  // ---- Controls ----
  function wireControls() {
    el.btnNextPhase.addEventListener("click", () => {
      Engine.nextPhase();
      UIState.lastScene = { title: Engine.getPhaseLabel(), text: `A new phase begins.`, imgName: null };
      renderTopbar();
      renderScene();
      renderLog();
      setStatus("Advanced to next phase.");
    });

    el.btnEndDay.addEventListener("click", () => {
      Engine.endDay();
      UIState.lastScene = { title: `Day ${Engine.getDay()}`, text: `A new day dawns on the resort.`, imgName: null };
      renderTopbar();
      renderScene();
      renderLog();
      setStatus("Day ended.");
    });

    el.btnPrevPhase.disabled = true; // not used in this lean build

    el.btnSettings.addEventListener("click", () => {
      alert("Settings coming later (session length, explicit toggle, seed).");
    });
    el.btnSave.addEventListener("click", doSave);
    el.btnLoad.addEventListener("click", doLoad);
  }

  // ---- Initial render + subscriptions ----
  function renderAll() {
    renderTopbar();
    renderLocations();
    renderActions();
    renderScene();
    renderRoster();
    renderLog();
  }

  function initUI() {
    wireControls();
    Engine.onChange(renderAll);
    renderAll();
  }

  // Expose for main.js
  window.UI = { initUI };
})();
