"use strict";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const systems = globalThis.GardenSystems || {};
const ui = {
  resources: document.getElementById("resourceCount"),
  wave: document.getElementById("waveCount"),
  plantFood: document.getElementById("plantFoodCount"),
  modifier: document.getElementById("modifierLabel"),
  waveTrack: document.getElementById("waveTrack"),
  gate: document.getElementById("gateHealth"),
  tray: document.getElementById("defenderTray"),
  start: document.getElementById("startButton"),
  pause: document.getElementById("pauseButton"),
  speed: document.getElementById("speedButton"),
  restart: document.getElementById("restartButton"),
  remove: document.getElementById("removeButton"),
  plantFoodButton: document.getElementById("plantFoodButton"),
  settingsButton: document.getElementById("settingsButton"),
  settingsPanel: document.getElementById("settingsPanel"),
  settingSfx: document.getElementById("settingSfx"),
  settingMusic: document.getElementById("settingMusic"),
  settingReducedMotion: document.getElementById("settingReducedMotion"),
  settingScreenShake: document.getElementById("settingScreenShake"),
  settingHighContrast: document.getElementById("settingHighContrast"),
  settingColorblind: document.getElementById("settingColorblind"),
  resetProgressButton: document.getElementById("resetProgressButton"),
  panel: document.getElementById("messagePanel"),
  title: document.getElementById("messageTitle"),
  text: document.getElementById("messageText"),
  messageButton: document.getElementById("messageButton"),
  levelMenu: document.getElementById("levelMenu"),
  toast: document.getElementById("toast"),
  debugForm: document.getElementById("debugForm"),
  debugInput: document.getElementById("debugInput"),
  debugStatus: document.getElementById("debugStatus")
};

const BOARD = { x: 58, y: 105, w: 964, h: 475, rows: 5, cols: 9 };
const CELL = { w: BOARD.w / BOARD.cols, h: BOARD.h / BOARD.rows };
const MAX_WAVES = 10;
const ENDLESS_UNLOCK_LEVEL = 5;
const LEVELS = [
  { name: "Sprout Path", waves: 4, unlocks: ["sprig", "well", "vine"], detail: "Glow Sprig, Dew Well, Vine Lash" },
  { name: "Bramble Rise", waves: 6, unlocks: ["sprig", "well", "vine", "bark", "coil", "lantern"], detail: "Barriers, thorns, and your first fusion" },
  { name: "Windfire Reach", waves: 8, unlocks: ["sprig", "well", "vine", "bark", "coil", "lantern", "breeze", "ember", "pebble"], detail: "Gusts, mortars, and splash damage" },
  { name: "Moonlit Grove", waves: 9, unlocks: ["sprig", "well", "vine", "bark", "coil", "lantern", "breeze", "ember", "pebble", "tempo", "mend", "mist"], detail: "Support plants and slowing mists" },
  { name: "Orchard Break", waves: 10, unlocks: ["sprig", "well", "vine", "bark", "coil", "lantern", "breeze", "ember", "pebble", "tempo", "mend", "mist", "sunburst", "hush", "bloom"], detail: "Instant plants and the final boss" }
];
const SURGE_WAVES = [3, 6, 9, 10];
const effectColors = { blast: "#ff9366", slow: "#d993f6", push: "#b8efff", direct: "#7de6a2" };

const defenders = {
  sprig: { name: "Glow Sprig", icon: "✦", cost: 90, hp: 115, cooldown: 1.5, recharge: 4.5, color: "#7de6a2", detail: "Ricocheting sparks" },
  well: { name: "Dew Well", icon: "◉", cost: 50, hp: 120, cooldown: 8, recharge: 3.5, color: "#66d6e8", detail: "Grows collectible dew" },
  coil: { name: "Thorn Coil", icon: "❈", cost: 140, hp: 150, cooldown: 3.4, recharge: 8, color: "#d993f6", detail: "Lane-wide thorn pulse" },
  bark: { name: "Bark Bastion", icon: "⬢", cost: 75, hp: 760, cooldown: 0, recharge: 7, color: "#e5ad6f", detail: "Heavy living barrier" },
  ember: { name: "Ember Pod", icon: "✹", cost: 160, hp: 120, cooldown: 3.2, recharge: 9, color: "#ff9366", detail: "Arcing cluster mortar" },
  breeze: { name: "Breeze Bell", icon: "♢", cost: 110, hp: 120, cooldown: 4.2, recharge: 7, color: "#b8efff", detail: "Lane-wide push gust" },
  sunburst: { name: "Sunburst Corm", icon: "☀", cost: 175, recharge: 18, color: "#ffb45e", detail: "Instant local blast", instant: "burst" },
  hush: { name: "Hush Cap", icon: "❄", cost: 125, recharge: 22, color: "#a9ddff", detail: "Instant garden chill", instant: "freeze" },
  mend: { name: "Mend Moss", icon: "✚", cost: 75, hp: 180, cooldown: 4.5, recharge: 6, color: "#a7f08c", detail: "Heals adjacent allies", support: true },
  tempo: { name: "Tempo Reed", icon: "♫", cost: 100, hp: 140, cooldown: 0, recharge: 8, color: "#f5d77a", detail: "Hastens adjacent allies", support: true },
  vine: { name: "Vine Lash", icon: "〰", cost: 85, hp: 130, cooldown: 2.6, recharge: 5, color: "#87d66f", detail: "Snaring lane strikes" },
  lantern: { name: "Lantern Leaf", icon: "✺", cost: 120, hp: 155, cooldown: 5, recharge: 7, color: "#ffe18a", detail: "Illuminates nearby allies", support: true },
  pebble: { name: "Pebble Pod", icon: "●", cost: 105, hp: 160, cooldown: 2.8, recharge: 6, color: "#b8c9a3", detail: "Bouncing seed shots" },
  mist: { name: "Mist Fern", icon: "≈", cost: 115, hp: 125, cooldown: 3.8, recharge: 7, color: "#a7e8e1", detail: "Lane-wide calming fog" },
  bloom: { name: "Star Bloom", icon: "✿", cost: 145, hp: 180, cooldown: 1.8, recharge: 8, color: "#ff9fc7", detail: "Rapid radiant petals" },
  pulsebloom: { name: "Pulse Bloom", icon: "✧", hp: 205, cooldown: 1.15, color: "#f7f0a4", detail: "Accelerated chaining sparks", fused: true },
  livingfort: { name: "Living Fortress", icon: "⬢", hp: 1220, cooldown: 4.8, color: "#99e19c", detail: "Fortified healing bastion", fused: true },
  winterveil: { name: "Winterveil", icon: "❄", hp: 240, cooldown: 3.4, color: "#bfe8ff", detail: "Frost haze and lane control", fused: true },
  storm: { name: "Storm Bloom", icon: "✺", hp: 240, cooldown: 1.05, color: "#f1b4ff", detail: "Rapid slowing bolts", fused: true },
  tidewood: { name: "Tidewood", icon: "⬟", hp: 1050, cooldown: 6, color: "#73e4cf", detail: "Armored dew grower", fused: true },
  firewind: { name: "Firewind Orchid", icon: "✧", hp: 220, cooldown: 1.9, color: "#ffd07c", detail: "Heavy blast volleys", fused: true }
};
const baseDefenderIds = Object.keys(defenders).filter(id => !defenders[id].fused);
const fusionRecipes = systems.allFusionRecipes ? systems.allFusionRecipes() : {
  "coil+sprig": "storm",
  "bark+well": "tidewood",
  "breeze+ember": "firewind",
  "bark+mend": "livingfort",
  "sprig+tempo": "pulsebloom",
  "hush+mist": "winterveil"
};
const fusionRecipeKeys = systems.listFusionRecipeKeys ? systems.listFusionRecipeKeys() : Object.keys(fusionRecipes);

const enemies = {
  grub: { name: "Moss Grub", hp: 105, speed: 17, damage: 22, reward: 15, color: "#d07878", size: 29 },
  skitter: { name: "Dusk Skitter", hp: 70, speed: 29, damage: 15, reward: 20, color: "#db9c5e", size: 23 },
  rammer: { name: "Bramble Rammer", hp: 255, speed: 11, damage: 34, reward: 35, color: "#9877c3", size: 36 },
  warden: { name: "Gloam Warden", hp: 680, speed: 8, damage: 48, reward: 80, color: "#556a9e", size: 42 },
  cinder: { name: "Cinder Shell", hp: 210, speed: 13, damage: 28, reward: 35, color: "#ff9366", size: 34, resist: "blast", weakness: "slow" },
  veil: { name: "Veil Stalker", hp: 155, speed: 19, damage: 26, reward: 35, color: "#d993f6", size: 31, resist: "slow", weakness: "blast" },
  ironroot: { name: "Ironroot", hp: 330, speed: 10, damage: 40, reward: 45, color: "#b8efff", size: 38, resist: "push", weakness: "direct" },
  vaulter: { name: "Hedge Vaulter", hp: 190, speed: 18, damage: 30, reward: 42, color: "#85b96e", size: 32, vault: true },
  scribe: { name: "Rage Scribe", hp: 150, shield: 190, speed: 13, damage: 24, reward: 48, color: "#d8cfad", size: 33, enrages: true },
  herald: { name: "Gloom Herald", hp: 220, speed: 11, damage: 22, reward: 55, color: "#e4c35e", size: 35, aura: true },
  burrower: { name: "Briar Burrower", hp: 180, speed: 15, damage: 30, reward: 48, color: "#b9967a", size: 31, burrow: true },
  splitling: { name: "Splitling", hp: 135, speed: 15, damage: 18, reward: 42, color: "#ce9ad2", size: 30, splits: true },
  sproutlet: { name: "Splitling Sprout", hp: 68, speed: 22, damage: 12, reward: 8, color: "#b574c5", size: 18, mini: true },
  gardener: { name: "Night Gardener", hp: 195, speed: 10, damage: 16, reward: 52, color: "#7fd79f", size: 33, healer: true },
  boss: { name: "Orchard Breaker", hp: 3600, speed: 5, damage: 78, reward: 350, color: "#48515d", size: 58, resist: "push", boss: true }
};

let state;
let lastTime = performance.now();
let animationId;
let toastTimer;
let progression = systems.loadProgression ? systems.loadProgression(localStorage) : {
  unlockedLevel: Math.max(1, Math.min(5, Number(localStorage.getItem("gardenGuardUnlockedLevel")) || 1)),
  endlessUnlocked: false,
  points: 0,
  upgrades: { startingDew: 0, guardianHealth: 0, recharge: 0, mowerStrength: 0, foodPower: 0 },
  endlessBestScore: 0
};
let settings = systems.loadSettings ? systems.loadSettings(localStorage) : {
  sfx: true, music: true, reducedMotion: false, screenShake: true, highContrast: false, colorblindIndicators: true
};
let tutorialState = systems.loadTutorialState ? systems.loadTutorialState(localStorage) : { completed: false, skipped: false, step: 0 };
let unlockedLevel = progression.unlockedLevel;
const weather = systems.WEATHER || {};

function freshState() {
  return {
    phase: "ready",
    mode: "campaign",
    level: 0,
    paused: false,
    resources: systems.startingDew ? systems.startingDew(progression) : 150,
    gate: 4,
    selected: "sprig",
    plantFood: 0,
    plantFoodArmed: false,
    chosenFusionSlots: fusionRecipeKeys.slice(0, 2),
    allowedFusionRecipes: {},
    recharges: Object.fromEntries(baseDefenderIds.map(id => [id, 0])),
    removeMode: false,
    cursor: { row: 2, col: 2 },
    guardians: [],
    mowers: Array.from({ length: BOARD.rows }, (_, row) => ({
      row,
      x: BOARD.x - 22,
      y: cellCenter(row, 0).y,
      active: true
    })),
    invaders: [],
    shots: [],
    drops: [],
    particles: [],
    effects: [],
    wave: 0,
    pendingSpawns: [],
    waveClock: 0,
    nextWaveIn: 5,
    ambientDew: 7,
    surgeFlash: 0,
    elapsed: 0,
    shake: 0,
    speed: 1,
    score: 0,
    floaterTexts: [],
    modifier: "heavyDew",
    energizedThisWave: 0,
    maxEnergizedThisWave: 0,
    debugMode: false
  };
}

function init() {
  state = freshState();
  applySettings();
  renderSettings();
  renderLevelMenu();
  renderTray();
  syncUI();
  if (!tutorialState.completed && !tutorialState.skipped) {
    startTutorial();
  } else {
    showMainMenu();
  }
  draw();
}

function renderLevelMenu() {
  const campaignButtons = LEVELS.map((level, index) =>
    `<button type="button" data-level="${index}" ${index + 1 > unlockedLevel ? "disabled" : ""}><strong>Level ${index + 1}</strong><small>${level.name}</small></button>`
  ).join("");
  const endlessEnabled = progression.endlessUnlocked || unlockedLevel >= ENDLESS_UNLOCK_LEVEL;
  ui.levelMenu.innerHTML = `${campaignButtons}<button type="button" data-endless="1" ${endlessEnabled ? "" : "disabled"}><strong>Endless</strong><small>Moonmeadow Survival${progression.endlessBestScore ? ` · Best ${progression.endlessBestScore}` : ""}</small></button>`;
  ui.levelMenu.querySelectorAll("button").forEach(button => {
    button.addEventListener("click", () => {
      if (button.dataset.endless) {
        chooseEndless();
      } else {
        chooseLevel(Number(button.dataset.level));
      }
    });
  });
}

function renderTray() {
  const available = state.level ? LEVELS[state.level - 1].unlocks : LEVELS[0].unlocks;
  ui.tray.innerHTML = "";
  available.forEach((id, index) => {
    const unit = defenders[id];
    const button = document.createElement("button");
    button.type = "button";
    button.className = "defender-card";
    button.dataset.id = id;
    button.setAttribute("aria-label", `${unit.name}, costs ${unit.cost} dew. ${unit.detail}`);
    const key = index === 9 ? 0 : index + 1;
    button.innerHTML = `<span class="key">${key}</span><span class="defender-icon plant-icon plant-${id}" style="color:${unit.color}" aria-hidden="true"></span><span class="defender-name">${unit.name}</span><span class="defender-meta">${unit.detail}</span><span class="defender-cost">💧 ${unit.cost}</span><span class="recharge" aria-hidden="true"></span>`;
    button.addEventListener("click", () => selectDefender(id));
    ui.tray.appendChild(button);
  });
}

function showMainMenu() {
  showPanel("Choose your level", "Grow your roster through five increasingly difficult gardens, then test Endless Moonmeadow.", "Choose a level", () => {});
  ui.messageButton.style.display = "none";
  ui.levelMenu.style.display = "grid";
}

function chooseLevel(levelIndex) {
  state = freshState();
  state.mode = "campaign";
  state.level = levelIndex + 1;
  state.modifier = systems.weatherForWave ? systems.weatherForWave("campaign", state.level, 1) : "heavyDew";
  showLoadoutPanel(`Level ${state.level}: ${LEVELS[levelIndex].name}`, LEVELS[levelIndex].detail + ". Choose 2 fusion slots before starting.");
}

function chooseEndless() {
  state = freshState();
  state.mode = "endless";
  state.level = 5;
  state.modifier = systems.weatherForWave ? systems.weatherForWave("endless", state.level, 1) : "heavyDew";
  showLoadoutPanel("Endless Moonmeadow", "Choose 2 fusion slots, then survive as long as possible. Weather rotates every wave.");
}

function showLoadoutPanel(title, text) {
  renderTray();
  syncUI();
  const selected = new Set(state.chosenFusionSlots);
  ui.levelMenu.innerHTML = fusionRecipeKeys.map(key => {
    const [a, b] = key.split("+");
    const unitA = defenders[a];
    const unitB = defenders[b];
    const result = defenders[fusionRecipes[key]];
    return `<button type="button" data-fusion="${key}" class="${selected.has(key) ? "selected" : ""}"><strong>${unitA.name} + ${unitB.name}</strong><small>${result.name}</small></button>`;
  }).join("");
  ui.levelMenu.querySelectorAll("button").forEach(button => {
    button.addEventListener("click", () => {
      const key = button.dataset.fusion;
      if (selected.has(key)) {
        if (selected.size <= 2) return announce("Bring exactly two fusion slots.");
        selected.delete(key);
      } else {
        if (selected.size >= 2) return announce("Only two fusion slots can be equipped.");
        selected.add(key);
      }
      state.chosenFusionSlots = [...selected];
      showLoadoutPanel(title, text);
    });
  });
  state.allowedFusionRecipes = Object.fromEntries(state.chosenFusionSlots.map(key => [key, fusionRecipes[key]]));
  showPanel(title, text, "Begin level", startGame);
  ui.messageButton.style.display = "";
  ui.messageButton.disabled = state.chosenFusionSlots.length !== 2;
  ui.levelMenu.style.display = "grid";
}

function selectDefender(id) {
  if (!id || !defenders[id]) return announce("That guardian unlocks in a later level.");
  state.selected = id;
  state.removeMode = false;
  state.plantFoodArmed = false;
  syncUI();
  canvas.focus();
}

function syncUI() {
  ui.resources.textContent = Math.floor(state.resources);
  const maxWaves = state.mode === "endless" ? "∞" : (state.level ? LEVELS[state.level - 1].waves : 0);
  ui.wave.textContent = `${state.wave} / ${maxWaves}`;
  ui.gate.textContent = state.gate;
  ui.plantFood.textContent = state.plantFood;
  const weatherName = weather[state.modifier]?.name || "None";
  ui.modifier.textContent = state.mode === "endless" ? `${weatherName} · ${state.score}` : weatherName;
  ui.pause.textContent = state.paused ? "Resume" : "Pause";
  ui.speed.textContent = `${state.speed}× Speed`;
  ui.speed.setAttribute("aria-pressed", String(state.speed === 2));
  ui.plantFoodButton.setAttribute("aria-pressed", String(state.plantFoodArmed));
  ui.plantFoodButton.disabled = state.plantFood < 1 || state.phase === "won" || state.phase === "lost";
  ui.pause.disabled = state.phase !== "playing";
  ui.start.disabled = state.phase !== "ready";
  ui.start.textContent = state.phase === "ready" ? "Start level" : "Level active";
  ui.remove.setAttribute("aria-pressed", String(state.removeMode));
  ui.remove.disabled = state.plantFoodArmed;
  ui.tray.querySelectorAll(".defender-card").forEach(button => {
    const unit = defenders[button.dataset.id];
    const recharge = state.recharges[button.dataset.id];
    button.classList.toggle("selected", button.dataset.id === state.selected && !state.removeMode);
    button.classList.toggle("recharging", recharge > 0);
    button.querySelector(".recharge").textContent = recharge > 0 ? `${recharge.toFixed(1)}s` : "";
    button.disabled = state.resources < unit.cost || recharge > 0 || state.phase === "won" || state.phase === "lost";
  });
  ui.waveTrack.innerHTML = state.mode === "endless" ? "" : Array.from({ length: maxWaves }, (_, index) => {
    const wave = index + 1;
    const classes = ["wave-mark"];
    if (wave < state.wave) classes.push("done");
    if (wave === state.wave) classes.push("active");
    if (SURGE_WAVES.includes(wave) || (state.level === 5 && wave === maxWaves)) classes.push("surge");
    return `<span class="${classes.join(" ")}" title="${SURGE_WAVES.includes(wave) ? `Moon Surge ${wave}` : `Wave ${wave}`}"></span>`;
  }).join("");
}

function showPanel(title, text, buttonText, action) {
  ui.title.textContent = title;
  ui.text.textContent = text;
  ui.messageButton.textContent = buttonText;
  ui.messageButton.onclick = action;
  ui.panel.classList.remove("hidden");
}

function hidePanel() {
  ui.panel.classList.add("hidden");
}

function saveProgression() {
  progression.unlockedLevel = unlockedLevel;
  if (systems.saveProgression) systems.saveProgression(localStorage, progression);
  else localStorage.setItem("gardenGuardUnlockedLevel", String(unlockedLevel));
}

function applySettings() {
  document.body.classList.toggle("high-contrast", settings.highContrast);
}

function renderSettings() {
  ui.settingSfx.checked = settings.sfx;
  ui.settingMusic.checked = settings.music;
  ui.settingReducedMotion.checked = settings.reducedMotion;
  ui.settingScreenShake.checked = settings.screenShake;
  ui.settingHighContrast.checked = settings.highContrast;
  ui.settingColorblind.checked = settings.colorblindIndicators;
}

function updateSetting(key, value) {
  settings[key] = value;
  if (systems.saveSettings) systems.saveSettings(localStorage, settings);
  applySettings();
}

function startTutorial() {
  const steps = [
    "Place guardians on plots, collect dew drops, and begin each watch with your lane mowers intact.",
    "Plant food now stores as charges. Press F (or Plant food) then place it on one guardian for a role-based boost.",
    "Choose exactly two fusion slots before each run. Only those fusions can be discovered that run."
  ];
  const step = Math.min(steps.length - 1, tutorialState.step || 0);
  showPanel("Quick tutorial", steps[step], step === steps.length - 1 ? "Finish tutorial" : "Next", () => {
    tutorialState.step = step + 1;
    if (tutorialState.step >= steps.length) {
      tutorialState.completed = true;
      if (systems.saveTutorialState) systems.saveTutorialState(localStorage, tutorialState);
      showMainMenu();
    } else {
      if (systems.saveTutorialState) systems.saveTutorialState(localStorage, tutorialState);
      startTutorial();
    }
  });
  ui.levelMenu.style.display = "grid";
  ui.levelMenu.innerHTML = `<button type="button" data-skip="1"><strong>Skip tutorial</strong><small>You can replay via refresh after reset</small></button>`;
  ui.levelMenu.querySelector("button")?.addEventListener("click", () => {
    tutorialState.skipped = true;
    tutorialState.completed = true;
    if (systems.saveTutorialState) systems.saveTutorialState(localStorage, tutorialState);
    showMainMenu();
  });
  ui.messageButton.style.display = "";
}

function beginAudioInteraction() {
  if (!audio.ctx) {
    audio.ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audio.ctx.state === "suspended") audio.ctx.resume();
}

const audio = { ctx: null, beat: 0, timer: 0 };
function tone(freq, duration = 0.08, gain = 0.035, type = "triangle") {
  if (!settings.sfx || !audio.ctx) return;
  const t = audio.ctx.currentTime;
  const osc = audio.ctx.createOscillator();
  const amp = audio.ctx.createGain();
  osc.frequency.value = freq;
  osc.type = type;
  amp.gain.setValueAtTime(0.0001, t);
  amp.gain.exponentialRampToValueAtTime(gain, t + 0.01);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(amp).connect(audio.ctx.destination);
  osc.start(t);
  osc.stop(t + duration + 0.02);
}

function playSound(name) {
  if (!audio.ctx || !settings.sfx) return;
  if (name === "place") tone(360, 0.08, 0.025);
  else if (name === "collect") tone(620, 0.06, 0.03);
  else if (name === "fusion") { tone(420, 0.12, 0.03); tone(740, 0.15, 0.03, "sine"); }
  else if (name === "wave") { tone(260, 0.12, 0.035, "sawtooth"); }
  else if (name === "mower") { tone(150, 0.2, 0.045, "square"); }
  else if (name === "boss") { tone(110, 0.3, 0.04, "sawtooth"); }
  else if (name === "win") { tone(390, 0.12, 0.03); tone(520, 0.16, 0.03); }
  else if (name === "lose") tone(140, 0.28, 0.04, "triangle");
}

function startGame() {
  if (state.phase !== "ready") return;
  state.phase = "playing";
  hidePanel();
  beginAudioInteraction();
  playSound("wave");
  syncUI();
  announce("The watch begins. First signs approach.");
  canvas.focus();
}

function togglePause() {
  if (state.phase !== "playing") return;
  state.paused = !state.paused;
  syncUI();
  if (state.paused) {
    showPanel("Watch paused", "The moonmeadow is holding its breath.", "Resume watch", togglePause);
  } else {
    hidePanel();
    lastTime = performance.now();
    canvas.focus();
  }
}

function restart() {
  state = freshState();
  renderTray();
  syncUI();
  showMainMenu();
}

function announce(message) {
  ui.toast.textContent = message;
  ui.toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ui.toast.classList.remove("show"), 2200);
}

function runDebugCommand(rawCommand) {
  const command = rawCommand.trim().toUpperCase();
  if (!command) return;
  if (["GARDEN-DEBUG", "GARDEN DEBUG", "DEBUG", "TEST-GARDEN"].includes(command)) {
    state.debugMode = true;
    ui.debugStatus.textContent = "Debug unlocked";
    announce("Debug mode unlocked. Try TEST_ALL or HELP.");
    return;
  }
  if (!state.debugMode) {
    ui.debugStatus.textContent = "Enter DEBUG first";
    announce("Debug mode is locked.");
    return;
  }
  if (command === "HELP") {
    announce("Commands: TEST_ALL, FOOD, FOOD +, ENERGIZED, WAVE 5, WIN, LOSE, RESET.");
  } else if (command === "TEST_ALL") {
    state.resources = 9999;
    state.guardians = [];
    baseDefenderIds.forEach((id, index) => {
      const row = Math.floor(index / BOARD.cols);
      const col = index % BOARD.cols;
      const pos = cellCenter(row, col);
      const spec = defenders[id];
      state.guardians.push({ type: id, row, col, x: pos.x, y: pos.y, hp: spec.hp, maxHp: spec.hp, timer: 0, pulse: 0 });
    });
    state.phase = "playing";
    hidePanel();
    announce("All guardians placed with full resources.");
  } else if (command === "FOOD") {
    const pos = cellCenter(state.cursor.row, state.cursor.col);
    state.drops.push({ x: pos.x, y: pos.y, value: 1, life: 30, collected: false, bob: 0, kind: "food" });
    announce("Plant food test drop created.");
  } else if (command === "FOOD +" || command === "FOOD+") {
    state.plantFood += 1;
    announce("Added one stored plant food charge.");
  } else if (command === "ENERGIZED") {
    state.phase = "playing";
    spawnEnemy("grub", state.cursor.row, BOARD.x + BOARD.w - 40, false, true);
    hidePanel();
    announce("Energized enemy test spawned.");
  } else if (command.startsWith("WAVE ")) {
    const requestedWave = Number(command.slice(5));
    if (Number.isInteger(requestedWave) && requestedWave >= 1 && requestedWave <= (state.level ? LEVELS[state.level - 1].waves : MAX_WAVES)) {
      state.phase = "playing";
      state.pendingSpawns = [];
      state.invaders = [];
      state.nextWaveIn = 6;
      queueWave(requestedWave);
      hidePanel();
    } else {
      announce(`Wave must be between 1 and ${state.level ? LEVELS[state.level - 1].waves : MAX_WAVES}.`);
    }
  } else if (command === "WIN") {
    state.phase = "playing";
    finish(true);
  } else if (command === "LOSE") {
    state.phase = "playing";
    finish(false);
  } else if (command === "RESET") {
    restart();
    state.debugMode = true;
    ui.debugStatus.textContent = "Debug unlocked";
  } else {
    announce("Unknown debug command. Try HELP.");
  }
  syncUI();
}

function cellCenter(row, col) {
  return { x: BOARD.x + col * CELL.w + CELL.w / 2, y: BOARD.y + row * CELL.h + CELL.h / 2 };
}

function placeAt(row, col) {
  if (state.phase === "won" || state.phase === "lost") return;
  const existing = state.guardians.find(unit => unit.row === row && unit.col === col);
  if (state.plantFoodArmed) {
    if (!existing) return announce("Choose a guardian plot to use plant food.");
    if (state.plantFood < 1) {
      state.plantFoodArmed = false;
      return announce("No stored plant food charges.");
    }
    usePlantFoodOnGuardian(existing);
    state.plantFood = Math.max(0, state.plantFood - 1);
    state.plantFoodArmed = false;
    syncUI();
    return;
  }
  if (state.removeMode) {
    if (!existing) return announce("That plot is already clear.");
    state.guardians = state.guardians.filter(unit => unit !== existing);
    spawnBurst(existing.x, existing.y, "#deb77c", 10);
    announce(`${defenders[existing.type].name} uprooted.`);
    return;
  }
  const spec = defenders[state.selected];
  if (state.recharges[state.selected] > 0) return announce(`${spec.name} is still recharging.`);
  if (state.resources < spec.cost) return announce(`Need ${spec.cost - state.resources} more dew.`);
  if (spec.instant) {
    const pos = cellCenter(row, col);
    state.resources -= spec.cost;
    state.recharges[state.selected] = spec.recharge * (systems.rechargeMultiplier ? systems.rechargeMultiplier(progression) : 1);
    if (spec.instant === "burst") {
      state.invaders
        .filter(enemy => enemy.x <= BOARD.x + BOARD.w && Math.hypot(enemy.x - pos.x, enemy.y - pos.y) <= 155)
        .forEach(enemy => damageEnemy(enemy, 700, "blast"));
      state.effects.push({ type: "blast", x: pos.x, y: pos.y, radius: 0, maxRadius: 165, life: 1.05, maxLife: 1.05 });
      spawnBurst(pos.x, pos.y, spec.color, 45);
      announce("Sunburst Corm erupts across nearby plots!");
    } else {
      state.invaders.filter(enemy => enemy.x <= BOARD.x + BOARD.w).forEach(enemy => {
        damageEnemy(enemy, 35, "slow");
        if (enemies[enemy.type].resist !== "slow") enemy.frozen = 6;
      });
      state.effects.push({ type: "freeze", x: BOARD.x + BOARD.w / 2, y: BOARD.y + BOARD.h / 2, radius: 0, maxRadius: 570, life: 1.4, maxLife: 1.4 });
      for (let lane = 0; lane < BOARD.rows; lane++) spawnBurst(BOARD.x + BOARD.w / 2, cellCenter(lane, 0).y, spec.color, 16);
      announce("Hush Cap chills every invader in the garden!");
    }
    syncUI();
    return;
  }
  if (existing) {
    const recipe = [existing.type, state.selected].sort().join("+");
    const fusionType = systems.resolveFusion ? systems.resolveFusion(existing.type, state.selected, state.chosenFusionSlots) : (state.allowedFusionRecipes[recipe] || null);
    if (!fusionType) return announce("Those guardians cannot fuse.");
    const fusion = defenders[fusionType];
    state.resources -= spec.cost;
    state.recharges[state.selected] = spec.recharge * (systems.rechargeMultiplier ? systems.rechargeMultiplier(progression) : 1);
    existing.type = fusionType;
    existing.hp = fusion.hp;
    existing.maxHp = fusion.hp;
    existing.timer = fusion.cooldown * .45;
    existing.pulse = 1;
    spawnBurst(existing.x, existing.y, fusion.color, 26);
    playSound("fusion");
    announce(`Fusion discovered: ${fusion.name}!`);
    syncUI();
    return;
  }
  const pos = cellCenter(row, col);
  state.resources -= spec.cost;
  state.recharges[state.selected] = spec.recharge * (systems.rechargeMultiplier ? systems.rechargeMultiplier(progression) : 1);
  const hpScale = systems.healthMultiplier ? systems.healthMultiplier(progression) : 1;
  state.guardians.push({
    type: state.selected, row, col, x: pos.x, y: pos.y,
    hp: spec.hp * hpScale, maxHp: spec.hp * hpScale, timer: spec.cooldown * 0.55, pulse: 0, foodBoost: 0
  });
  playSound("place");
  spawnBurst(pos.x, pos.y, spec.color, 14);
  syncUI();
}

function usePlantFoodOnGuardian(unit) {
  const spec = defenders[unit.type];
  const power = systems.plantFoodPowerScale ? systems.plantFoodPowerScale(progression) : 1;
  const duration = systems.plantFoodBuffDuration ? systems.plantFoodBuffDuration(progression) : 7;
  const nearby = state.invaders.filter(enemy => Math.abs(enemy.row - unit.row) <= 1 && enemy.x <= BOARD.x + BOARD.w && enemy.x >= unit.x - 220 && !enemy.buried);
  unit.foodBoost = Math.max(unit.foodBoost || 0, duration);
  switch (unit.type) {
    case "sprig":
    case "pulsebloom":
      nearby.slice(0, 4).forEach(enemy => damageEnemy(enemy, 95 * power, "direct"));
      break;
    case "well":
    case "tidewood":
      state.resources += Math.round(35 * power);
      state.drops.push({ x: unit.x + 24, y: unit.y - 16, value: Math.round(30 * power), life: 16, collected: false, bob: Math.random() * 6, kind: "dew" });
      state.guardians.forEach(ally => { ally.hp = Math.min(ally.maxHp, ally.hp + 36 * power); });
      break;
    case "coil":
    case "mist":
    case "winterveil":
      nearby.forEach(enemy => { damageEnemy(enemy, 46 * power, "slow"); enemy.slow = Math.max(enemy.slow, 4.2); });
      break;
    case "breeze":
      state.invaders.filter(enemy => enemy.row === unit.row && !enemy.buried).forEach(enemy => {
        enemy.x = Math.min(BOARD.x + BOARD.w, enemy.x + 72 * power);
        damageEnemy(enemy, 26 * power, "push");
      });
      break;
    case "bark":
    case "livingfort":
      unit.hp = Math.min(unit.maxHp, unit.hp + 280 * power);
      state.guardians.filter(ally => Math.abs(ally.row - unit.row) + Math.abs(ally.col - unit.col) <= 1)
        .forEach(ally => { ally.hp = Math.min(ally.maxHp, ally.hp + 95 * power); });
      break;
    case "mend":
      state.guardians.forEach(ally => { ally.hp = Math.min(ally.maxHp, ally.hp + 100 * power); });
      break;
    case "tempo":
      state.guardians.filter(ally => Math.abs(ally.row - unit.row) + Math.abs(ally.col - unit.col) <= 2).forEach(ally => { ally.timer = 0; });
      break;
    case "ember":
    case "firewind":
      state.invaders.filter(enemy => Math.abs(enemy.x - unit.x) < 250 && !enemy.buried).forEach(enemy => damageEnemy(enemy, 62 * power, "blast"));
      break;
    default:
      nearby.slice(0, 3).forEach(enemy => damageEnemy(enemy, 38 * power, "direct"));
      break;
  }
  state.effects.push({ type: "food", x: unit.x, y: unit.y, radius: 0, maxRadius: 170, life: 0.9, maxLife: 0.9 });
  spawnBurst(unit.x, unit.y, spec.color, 18);
  unit.pulse = 1.25;
  announce(`${spec.name} is empowered by plant food!`);
  playSound("fusion");
}

function collectDrop(drop) {
  if (drop.collected) return;
  drop.collected = true;
  if (drop.kind === "food") {
    state.plantFood += 1;
    announce(`Plant food stored (${state.plantFood}). Press F to use on a guardian.`);
    playSound("collect");
    spawnBurst(drop.x, drop.y, "#9fe97a", 18);
    syncUI();
    return;
  }
  state.resources += drop.value;
  playSound("collect");
  spawnBurst(drop.x, drop.y, "#8feaff", 12);
  syncUI();
}

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  const scale = Math.min(rect.width / canvas.width, rect.height / canvas.height);
  const offsetX = (rect.width - canvas.width * scale) / 2;
  const offsetY = (rect.height - canvas.height * scale) / 2;
  return {
    x: (event.clientX - rect.left - offsetX) / scale,
    y: (event.clientY - rect.top - offsetY) / scale
  };
}

canvas.addEventListener("pointerdown", event => {
  beginAudioInteraction();
  const p = canvasPoint(event);
  const drop = state.drops.find(item => !item.collected && Math.hypot(item.x - p.x, item.y - p.y) < 34);
  if (drop) return collectDrop(drop);
  if (p.x < BOARD.x || p.x > BOARD.x + BOARD.w || p.y < BOARD.y || p.y > BOARD.y + BOARD.h) return;
  const col = Math.floor((p.x - BOARD.x) / CELL.w);
  const row = Math.floor((p.y - BOARD.y) / CELL.h);
  state.cursor = { row, col };
  placeAt(row, col);
});

canvas.addEventListener("pointermove", event => {
  const p = canvasPoint(event);
  state.drops
    .filter(drop => !drop.collected && Math.hypot(drop.x - p.x, drop.y - p.y) < 42)
    .forEach(collectDrop);
  if (p.x >= BOARD.x && p.x <= BOARD.x + BOARD.w && p.y >= BOARD.y && p.y <= BOARD.y + BOARD.h) {
    state.cursor = {
      col: Math.min(8, Math.floor((p.x - BOARD.x) / CELL.w)),
      row: Math.min(4, Math.floor((p.y - BOARD.y) / CELL.h))
    };
  }
});

canvas.addEventListener("keydown", event => {
  beginAudioInteraction();
  const key = event.key.toLowerCase();
  const available = state.level ? LEVELS[state.level - 1].unlocks : LEVELS[0].unlocks;
  if (["arrowup", "arrowdown", "arrowleft", "arrowright", " ", "enter", "f"].includes(key)) event.preventDefault();
  if (key >= "1" && key <= "9") selectDefender(available[Number(key) - 1]);
  if (key === "0") selectDefender(available[9]);
  if (key === "r") {
    state.removeMode = !state.removeMode;
    if (state.removeMode) state.plantFoodArmed = false;
    syncUI();
  }
  if (key === "f") {
    if (state.plantFood < 1) announce("No stored plant food.");
    else {
      state.plantFoodArmed = !state.plantFoodArmed;
      if (state.plantFoodArmed) state.removeMode = false;
      syncUI();
    }
  }
  if (key === "p") togglePause();
  if (key === "enter") placeAt(state.cursor.row, state.cursor.col);
  if (key === " ") {
    const pos = cellCenter(state.cursor.row, state.cursor.col);
    state.drops.filter(drop => Math.hypot(drop.x - pos.x, drop.y - pos.y) < 130).forEach(collectDrop);
  }
  if (key === "arrowup") state.cursor.row = Math.max(0, state.cursor.row - 1);
  if (key === "arrowdown") state.cursor.row = Math.min(4, state.cursor.row + 1);
  if (key === "arrowleft") state.cursor.col = Math.max(0, state.cursor.col - 1);
  if (key === "arrowright") state.cursor.col = Math.min(8, state.cursor.col + 1);
});

ui.start.addEventListener("click", startGame);
ui.pause.addEventListener("click", togglePause);
ui.speed.addEventListener("click", () => {
  state.speed = state.speed === 1 ? 2 : 1;
  syncUI();
  canvas.focus();
});
ui.restart.addEventListener("click", restart);
ui.remove.addEventListener("click", () => {
  state.removeMode = !state.removeMode;
  if (state.removeMode) state.plantFoodArmed = false;
  syncUI();
  canvas.focus();
});
ui.plantFoodButton.addEventListener("click", () => {
  if (state.plantFood < 1) return announce("No stored plant food.");
  state.plantFoodArmed = !state.plantFoodArmed;
  if (state.plantFoodArmed) state.removeMode = false;
  syncUI();
  canvas.focus();
});
ui.settingsButton.addEventListener("click", () => {
  const nextOpen = ui.settingsPanel.classList.toggle("hidden");
  ui.settingsButton.setAttribute("aria-expanded", String(!nextOpen));
});
ui.settingSfx.addEventListener("change", () => updateSetting("sfx", ui.settingSfx.checked));
ui.settingMusic.addEventListener("change", () => updateSetting("music", ui.settingMusic.checked));
ui.settingReducedMotion.addEventListener("change", () => updateSetting("reducedMotion", ui.settingReducedMotion.checked));
ui.settingScreenShake.addEventListener("change", () => updateSetting("screenShake", ui.settingScreenShake.checked));
ui.settingHighContrast.addEventListener("change", () => updateSetting("highContrast", ui.settingHighContrast.checked));
ui.settingColorblind.addEventListener("change", () => updateSetting("colorblindIndicators", ui.settingColorblind.checked));
ui.resetProgressButton.addEventListener("click", () => {
  progression = systems.resetProgression ? systems.resetProgression(localStorage) : progression;
  unlockedLevel = progression.unlockedLevel;
  renderLevelMenu();
  announce("Progression reset.");
});
ui.debugForm.addEventListener("submit", event => {
  event.preventDefault();
  runDebugCommand(ui.debugInput.value);
  ui.debugInput.select();
});

function queueWave(number) {
  state.wave = number;
  const levelWaves = state.mode === "endless" ? Number.MAX_SAFE_INTEGER : (LEVELS[state.level - 1]?.waves || MAX_WAVES);
  state.modifier = systems.weatherForWave ? systems.weatherForWave(state.mode, state.level, number) : state.modifier;
  state.energizedThisWave = 0;
  const energizedFactor = weather[state.modifier]?.energizedFactor || 1;
  state.maxEnergizedThisWave = number >= 2 ? Math.max(0, Math.round((Math.min(3, 1 + Math.floor(number / 4))) * energizedFactor)) : 0;
  const isSurge = SURGE_WAVES.includes(number);
  const endless = systems.createEndlessWave ? systems.createEndlessWave(number) : { count: 8 + number * 2, interval: Math.max(.45, 1.5 - number * .03), eliteEvery: 7, energizedRate: 0.12 };
  const waveSizes = [4, 6, 9, 11, 14, 18, 20, 23, 27, 24];
  const count = state.mode === "endless" ? endless.count : waveSizes[number - 1];
  for (let i = 0; i < count; i++) {
    let type = "grub";
    const energyRoll = number >= 2 && state.energizedThisWave < state.maxEnergizedThisWave && Math.random() < (state.mode === "endless" ? endless.energizedRate : 0.12 + number * 0.01) && i % 5 === 2;
    if (number >= 2 && i % 3 === 1) type = "skitter";
    if (number >= 3 && (i + number) % 5 === 0) type = "rammer";
    if (number >= 4 && i % 6 === 2) type = "cinder";
    if (number >= 5 && i % 7 === 3) type = "veil";
    if (number >= 6 && i % 8 === 4) type = "ironroot";
    if (number >= 4 && i % 9 === 5) type = "vaulter";
    if (number >= 5 && i % 10 === 6) type = "scribe";
    if (number >= 7 && i % 11 === 7) type = "herald";
    if (number >= 5 && i % 12 === 4) type = "burrower";
    if (number >= 6 && i % 13 === 5) type = "splitling";
    if (number >= 7 && i % 14 === 9) type = "gardener";
    if (isSurge && number < MAX_WAVES && i === count - 1 && state.mode !== "endless") type = "warden";
    if (state.mode === "campaign" && state.level === 5 && number === levelWaves && i === count - 1) type = "boss";
    if (state.mode === "endless" && i > 0 && i % endless.eliteEvery === 0) {
      type = ["warden", "rammer", "herald", "gardener"][Math.floor(Math.random() * 4)];
    }
    if (energyRoll) {
      state.energizedThisWave += 1;
    }
    const interval = state.mode === "endless" ? endless.interval : (number === 1 ? 2.6 : number === 2 ? 2.2 : number === 3 ? 1.8 : Math.max(0.7, 1.48 - number * 0.065));
    state.pendingSpawns.push({ at: i * interval, type, row: Math.floor(Math.random() * 5), energized: energyRoll && type !== "boss" && type !== "warden" });
  }
  state.waveClock = 0;
  state.surgeFlash = isSurge ? 3 : 0;
  const weatherNotice = weather[state.modifier]?.name ? ` ${weather[state.modifier].name} active.` : "";
  if (state.mode === "endless") {
    announce(`Endless wave ${number} rises.${weatherNotice}`);
  } else {
    announce(state.level === 5 && number === levelWaves ? "FINAL MOON SURGE! The Orchard Breaker approaches!" : isSurge ? `Moon Surge ${number}! A Gloam Warden approaches.` : `Wave ${number} rustles into view.`);
  }
  if (state.mode === "campaign" && state.level === 5 && number === levelWaves) playSound("boss");
  playSound("wave");
  syncUI();
}

function spawnEnemy(type, row, x = BOARD.x + BOARD.w + 42, thrown = false, energized = false) {
  const spec = enemies[type];
  const waveScale = Math.max(0, state.wave - 1);
  const speedWeather = weather[state.modifier]?.enemySpeedFactor || 1;
  state.invaders.push({
    type, row, x, y: cellCenter(row, 0).y,
    hp: spec.hp * (1 + waveScale * .17),
    maxHp: spec.hp * (1 + waveScale * .17),
    shield: (spec.shield || 0) * (1 + waveScale * .12),
    maxShield: (spec.shield || 0) * (1 + waveScale * .12),
    speedScale: (1 + waveScale * .028) * speedWeather,
    damageScale: 1 + waveScale * .075,
    attackTimer: 0, throwTimer: spec.boss ? 5.5 : 0,
    slow: 0, frozen: 0, enraged: false, vaulted: false,
    burrowTimer: spec.burrow ? 2.6 + Math.random() * 1.8 : 0,
    burrowedFor: 0,
    buried: false,
    healTimer: spec.healer ? 3.4 : 0,
    step: Math.random() * Math.PI * 2, thrown,
    energized
  });
}

function damageEnemy(enemy, amount, effect) {
  if (enemy.buried) return 0;
  const spec = enemies[enemy.type];
  let multiplier = 1;
  if (spec.resist === effect) multiplier = effect === "blast" ? .18 : .35;
  if (spec.weakness === effect) multiplier = 1.65;
  let damage = amount * multiplier;
  if (enemy.shield > 0) {
    const absorbed = Math.min(enemy.shield, damage);
    enemy.shield -= absorbed;
    damage -= absorbed;
    if (enemy.shield <= 0 && spec.enrages) {
      enemy.enraged = true;
      enemy.speedScale *= 1.75;
      enemy.damageScale *= 1.55;
      spawnBurst(enemy.x, enemy.y, "#ff665b", 18);
    }
  }
  enemy.hp -= damage;
  if (damage > 0) {
    state.floaterTexts.push({
      x: enemy.x, y: enemy.y - enemies[enemy.type].size - 12,
      text: `${Math.round(damage)}${multiplier < 1 ? " RESIST" : multiplier > 1 ? " WEAK" : ""}`,
      color: multiplier > 1 ? "#ffd66b" : multiplier < 1 ? "#9ad7ff" : "#ffecc8",
      life: 0.8
    });
  }
  return multiplier;
}

function update(dt) {
  if (state.phase !== "playing" || state.paused) return;
  state.elapsed += dt;
  if (audio.ctx && settings.music) {
    audio.timer -= dt;
    if (audio.timer <= 0) {
      audio.timer = 2.6;
      audio.beat = (audio.beat + 1) % 4;
      tone(180 + audio.beat * 40, 0.18, 0.012, "sine");
    }
  }
  state.waveClock += dt;
  state.ambientDew -= dt;
  state.surgeFlash = Math.max(0, state.surgeFlash - dt);
  for (const id of baseDefenderIds) state.recharges[id] = Math.max(0, state.recharges[id] - dt);
  state.shake = Math.max(0, state.shake - dt * 15);
  state.floaterTexts.forEach(text => {
    text.y -= (settings.reducedMotion ? 8 : 26) * dt;
    text.life -= dt;
  });
  state.floaterTexts = state.floaterTexts.filter(text => text.life > 0);

  if (state.ambientDew <= 0) {
    const ambientFactor = weather[state.modifier]?.ambientFactor || 1;
    state.ambientDew = (8 + Math.random() * 4) * ambientFactor;
    state.drops.push({ x: BOARD.x + 80 + Math.random() * (BOARD.w - 170), y: BOARD.y + 35 + Math.random() * (BOARD.h - 70), value: 25 + (state.modifier === "heavyDew" ? 10 : 0), life: 11, collected: false, bob: Math.random() * 6 });
  }

  if (state.wave === 0 && state.nextWaveIn > 0) {
    state.nextWaveIn -= dt;
    if (state.nextWaveIn <= 0) queueWave(1);
  }

  while (state.pendingSpawns.length && state.pendingSpawns[0].at <= state.waveClock) {
    const item = state.pendingSpawns.shift();
    spawnEnemy(item.type, item.row, BOARD.x + BOARD.w + 42, false, Boolean(item.energized));
  }

  if (state.wave > 0 && !state.pendingSpawns.length && !state.invaders.length) {
    const levelWaves = LEVELS[state.level - 1]?.waves || MAX_WAVES;
    if (state.mode !== "endless" && state.wave >= levelWaves) return finish(true);
    state.nextWaveIn -= dt;
    if (state.nextWaveIn <= 0) {
      state.nextWaveIn = Math.max(6, 9 - state.wave * 0.2);
      queueWave(state.wave + 1);
    }
  } else if (state.wave > 0 && !state.pendingSpawns.length) {
    state.nextWaveIn = Math.max(6, 9 - state.wave * 0.2);
  }

  updateGuardians(dt);
  updateShots(dt);
  updateInvaders(dt);
  updateDrops(dt);
  updateParticles(dt);
  updateEffects(dt);
  if (state.mode === "endless") {
    state.score += Math.floor(dt * (9 + state.wave));
  }
  syncUI();
}

function updateGuardians(dt) {
  for (const unit of state.guardians) {
    unit.timer -= dt;
    unit.foodBoost = Math.max(0, (unit.foodBoost || 0) - dt);
    unit.pulse = Math.max(0, unit.pulse - dt);
    const spec = defenders[unit.type];
    const hasted = state.guardians.some(other =>
      (other.type === "tempo" || other.type === "lantern") &&
      Math.abs(other.row - unit.row) + Math.abs(other.col - unit.col) === 1
    );
    const weatherCooldown = weather[state.modifier]?.guardianCooldownFactor || 1;
    const foodBoost = unit.foodBoost > 0 ? 0.68 : 1;
    const abilityCooldown = spec.cooldown * (hasted ? .68 : 1) * weatherCooldown * foodBoost;
    const targets = state.invaders.filter(enemy =>
      enemy.row === unit.row &&
      enemy.x > unit.x - 12 &&
      enemy.x <= BOARD.x + BOARD.w &&
      !enemy.buried
    );
    if ((unit.type === "well" || unit.type === "tidewood") && unit.timer <= 0) {
      unit.timer = abilityCooldown;
      unit.pulse = 0.8;
      state.drops.push({ x: unit.x + (Math.random() - .5) * 24, y: unit.y - 16, value: unit.type === "tidewood" ? 45 : 30, life: 14, collected: false, bob: Math.random() * 6 });
    } else if (unit.type === "mend" && unit.timer <= 0) {
      unit.timer = abilityCooldown;
      state.guardians.filter(other =>
        other !== unit && Math.abs(other.row - unit.row) + Math.abs(other.col - unit.col) === 1
      ).forEach(other => {
        other.hp = Math.min(other.maxHp, other.hp + 75);
        spawnBurst(other.x, other.y, spec.color, 7);
      });
    } else if (unit.type === "breeze" && targets.length && unit.timer <= 0) {
      unit.timer = abilityCooldown;
      unit.pulse = .4;
      const target = targets[0];
      state.shots.push({
        type: "breeze", row: unit.row, x: unit.x + 26, y: unit.y - 8,
        startX: unit.x + 26, startY: unit.y - 8,
        targetX: target.x, targetY: target.y,
        travel: 0, age: 0, speed: 330, effect: "push", damage: 8,
        splash: 0, color: spec.color, radius: 9
      });
    } else if (["coil", "vine", "mist", "winterveil"].includes(unit.type) && targets.length && unit.timer <= 0) {
      unit.timer = abilityCooldown;
      unit.pulse = .45;
      targets.forEach(enemy => {
        damageEnemy(enemy, unit.type === "winterveil" ? 18 : 13, "slow");
        if (enemies[enemy.type].resist !== "slow") enemy.slow = enemies[enemy.type].weakness === "slow" ? 4.5 : 2.8;
        spawnBurst(enemy.x, enemy.y, spec.color, 3);
      });
    } else if (["sprig", "ember", "storm", "firewind", "pebble", "bloom", "pulsebloom"].includes(unit.type) && targets.length && unit.timer <= 0) {
      unit.timer = abilityCooldown;
      unit.pulse = .2;
      const isBlast = unit.type === "ember" || unit.type === "firewind";
      const target = targets.reduce((closest, enemy) => enemy.x < closest.x ? enemy : closest);
      state.shots.push({
        type: unit.type, row: unit.row, x: unit.x + 26, y: unit.y - 5,
        startX: unit.x + 26, startY: unit.y - 5,
        targetX: target.x, targetY: target.y,
        travel: isBlast ? .72 : 0,
        age: 0,
        speed: 265,
        effect: isBlast ? "blast" : ["storm", "vine", "mist"].includes(unit.type) ? "slow" : "direct",
        damage: unit.type === "storm" ? 25 : unit.type === "firewind" ? 42 : unit.type === "ember" ? 32 : unit.type === "pebble" ? 28 : unit.type === "bloom" ? 30 : unit.type === "pulsebloom" ? 35 : 22,
        splash: isBlast ? (unit.type === "firewind" ? 85 : 55) : unit.type === "pebble" ? 28 : 0,
        color: spec.color, radius: isBlast ? 11 : unit.type === "coil" ? 9 : 7
      });
    } else if (unit.type === "livingfort" && unit.timer <= 0) {
      unit.timer = abilityCooldown;
      state.guardians.filter(other => Math.abs(other.row - unit.row) + Math.abs(other.col - unit.col) <= 2)
        .forEach(other => { other.hp = Math.min(other.maxHp, other.hp + 48); });
      state.invaders.filter(enemy => enemy.row === unit.row && Math.abs(enemy.x - unit.x) < 160 && !enemy.buried)
        .forEach(enemy => damageEnemy(enemy, 20, "blast"));
    }
  }
}

function updateShots(dt) {
  for (const shot of state.shots) {
    if (shot.travel) {
      shot.age += dt;
      const progress = Math.min(1, shot.age / shot.travel);
      shot.x = shot.startX + (shot.targetX - shot.startX) * progress;
      shot.y = shot.startY + (shot.targetY - shot.startY) * progress - Math.sin(progress * Math.PI) * 75;
    } else {
      shot.x += shot.speed * dt;
    }
    const hit = state.invaders
      .filter(enemy =>
        enemy.row === shot.row &&
        enemy.x <= BOARD.x + BOARD.w &&
        !enemy.buried &&
        (shot.travel ? shot.age >= shot.travel : Math.abs(enemy.x - shot.x) < enemies[enemy.type].size)
      )
      .sort((a, b) => a.x - b.x)[0];
    if (hit) {
      const victims = shot.splash
        ? state.invaders.filter(enemy => Math.hypot(enemy.x - hit.x, enemy.y - hit.y) <= shot.splash)
        : [hit];
      victims.forEach(enemy => {
        damageEnemy(enemy, shot.damage, shot.effect);
        if (["coil", "storm", "vine", "mist", "winterveil"].includes(shot.type) && enemies[enemy.type].resist !== "slow") {
          enemy.slow = enemies[enemy.type].weakness === "slow" ? 4 : 2.6;
        }
      });
      if (shot.type === "sprig") {
        const ricochet = state.invaders
          .filter(enemy => enemy !== hit && enemy.x <= BOARD.x + BOARD.w && Math.hypot(enemy.x - hit.x, enemy.y - hit.y) < 145)
          .sort((a, b) => Math.hypot(a.x - hit.x, a.y - hit.y) - Math.hypot(b.x - hit.x, b.y - hit.y))[0];
        if (ricochet) {
          damageEnemy(ricochet, shot.damage * .55, "direct");
          spawnBurst(ricochet.x, ricochet.y, shot.color, 5);
        }
      }
      if (shot.type === "breeze" && enemies[hit.type].resist !== "push") {
        const pushFactor = weather[state.modifier]?.pushFactor || 1;
        hit.x = Math.min(BOARD.x + BOARD.w, hit.x + (enemies[hit.type].weakness === "push" ? 52 : 34) * pushFactor);
      }
      shot.dead = true;
      spawnBurst(shot.x, shot.y, shot.color, 7);
    }
    if (shot.x > BOARD.x + BOARD.w + 4) shot.dead = true;
  }
  state.shots = state.shots.filter(shot => !shot.dead);
}

function updateInvaders(dt) {
  const thrownEnemies = [];
  const splitSpawns = [];
  for (const enemy of state.invaders) {
    if (enemy.dead) continue;
    const spec = enemies[enemy.type];
    enemy.step += dt * 6;
    enemy.slow = Math.max(0, enemy.slow - dt);
    enemy.frozen = Math.max(0, enemy.frozen - dt);
    if (spec.burrow) {
      const burrowState = systems.stepBurrowState
        ? systems.stepBurrowState({ isBurrower: true, buried: enemy.buried, burrowTimer: enemy.burrowTimer, burrowedFor: enemy.burrowedFor }, dt)
        : null;
      if (burrowState) {
        const resurfaced = enemy.buried && burrowState.resurfaced;
        enemy.buried = burrowState.buried;
        enemy.burrowTimer = burrowState.burrowTimer + (burrowState.resurfaced ? Math.random() * 1.6 : 0);
        enemy.burrowedFor = burrowState.burrowedFor;
        if (resurfaced) {
          spawnBurst(enemy.x, enemy.y, "#d9b07f", 10);
        }
      }
    }
    if (spec.healer) {
      enemy.healTimer -= dt;
      if (enemy.healTimer <= 0) {
        enemy.healTimer = 3.2;
        state.invaders
          .filter(other => other !== enemy && Math.hypot(other.x - enemy.x, other.y - enemy.y) < 130 && !other.buried)
          .forEach(other => { other.hp = Math.min(other.maxHp, other.hp + 34); });
        spawnBurst(enemy.x, enemy.y, "#9df5be", 8);
      }
    }
    if (enemy.frozen > 0) {
      if (enemy.hp <= 0) {
        enemy.dead = true;
        state.resources += spec.reward;
        state.score += spec.reward * 3;
        if (enemy.energized) {
          state.drops.push({ x: enemy.x, y: enemy.y, value: 1, life: 18, collected: false, bob: Math.random() * 6, kind: "food" });
          spawnBurst(enemy.x, enemy.y, "#b7ff89", 20);
          announce("Energized enemy dropped plant food!");
        }
        const children = systems.splitOutcome ? systems.splitOutcome(enemy.type) : [];
        if (children.length) {
          children.forEach((child, index) => splitSpawns.push({ type: child, row: enemy.row, x: enemy.x + (index === 0 ? -12 : 12) }));
        }
        spawnBurst(enemy.x, enemy.y, spec.color, 15);
      }
      continue;
    }
    if (spec.boss) {
      enemy.throwTimer -= dt;
      if (enemy.throwTimer <= 0) {
        enemy.throwTimer = 7;
        thrownEnemies.push({
          type: Math.random() < .55 ? "skitter" : "grub",
          row: Math.floor(Math.random() * BOARD.rows),
          x: BOARD.x + BOARD.w - CELL.w * (1.5 + Math.random() * 2)
        });
      }
    }
    const blocker = enemy.buried ? null : state.guardians
      .filter(unit => unit.row === enemy.row && unit.x < enemy.x && enemy.x - unit.x < 58)
      .sort((a, b) => b.x - a.x)[0];
    if (blocker && spec.vault && !enemy.vaulted) {
      enemy.vaulted = true;
      enemy.x = blocker.x - 68;
      spawnBurst(blocker.x, blocker.y - 20, spec.color, 15);
      continue;
    }
    const heraldBoost = state.invaders.some(other =>
      enemies[other.type].aura &&
      other !== enemy &&
      Math.hypot(other.x - enemy.x, other.y - enemy.y) < 150
    );
    if (blocker) {
      enemy.attackTimer -= dt;
      if (enemy.attackTimer <= 0) {
        enemy.attackTimer = .8;
        blocker.hp -= spec.damage * enemy.damageScale * (heraldBoost ? 1.35 : 1);
        blocker.pulse = .2;
        spawnBurst(blocker.x + 18, blocker.y, "#f0a47e", 5);
      }
    } else {
      const burrowSpeed = enemy.buried ? 1.55 : 1;
      enemy.x -= spec.speed * enemy.speedScale * (enemy.slow > 0 ? .47 : 1) * (heraldBoost ? 1.28 : 1) * burrowSpeed * dt;
    }
    if (enemy.hp <= 0) {
      enemy.dead = true;
      state.resources += spec.reward;
      state.score += spec.reward * 3;
      if (enemy.energized) {
        state.drops.push({ x: enemy.x, y: enemy.y, value: 1, life: 18, collected: false, bob: Math.random() * 6, kind: "food" });
        spawnBurst(enemy.x, enemy.y, "#b7ff89", 20);
        announce("Energized enemy dropped plant food!");
      }
      const children = systems.splitOutcome ? systems.splitOutcome(enemy.type) : [];
      if (children.length) {
        children.forEach((child, index) => splitSpawns.push({ type: child, row: enemy.row, x: enemy.x + (index === 0 ? -12 : 12) }));
      }
      spawnBurst(enemy.x, enemy.y, spec.color, 15);
    } else {
      const mower = state.mowers[enemy.row];
      if (mower && mower.active && enemy.x <= mower.x) {
        mower.active = false;
        const mowerDamage = systems.mowerDamage ? systems.mowerDamage(progression) : 950;
        state.invaders
          .filter(other => other.row === enemy.row)
          .forEach(other => {
            damageEnemy(other, mowerDamage, "blast");
            if (other.hp <= 0) other.dead = true;
            spawnBurst(other.x, other.y, "#ffd66b", 14 + (other.hp <= 0 ? 0 : 4));
          });
        spawnBurst(mower.x, mower.y, "#ffd66b", 28);
        playSound("mower");
        announce(`Row ${enemy.row + 1} mower cleared the breach!`);
        continue;
      }
    }
    if (enemy.x < BOARD.x - 58) {
      enemy.dead = true;
      state.gate--;
      if (settings.screenShake) state.shake = 1;
      announce(`The gate was struck! ${state.gate} ward${state.gate === 1 ? "" : "s"} remain.`);
      if (state.gate <= 0) finish(false);
    }
  }
  splitSpawns.forEach(item => spawnEnemy(item.type, item.row, item.x, false, false));
  thrownEnemies.forEach(item => {
    spawnEnemy(item.type, item.row, item.x, true);
    spawnBurst(item.x, cellCenter(item.row, 0).y, "#ffcf7b", 18);
    announce("The Orchard Breaker hurled an invader into the backline!");
  });
  for (const unit of state.guardians) {
    if (unit.hp <= 0) {
      unit.dead = true;
      spawnBurst(unit.x, unit.y, "#9a674e", 13);
    }
  }
  state.invaders = state.invaders.filter(enemy => !enemy.dead);
  state.guardians = state.guardians.filter(unit => !unit.dead);
}

function updateDrops(dt) {
  for (const drop of state.drops) {
    drop.life -= dt;
    drop.bob += dt * 2;
  }
  state.drops = state.drops.filter(drop => !drop.collected && drop.life > 0);
}

function spawnBurst(x, y, color, count) {
  const adjustedCount = settings.reducedMotion ? Math.max(3, Math.floor(count * 0.4)) : count;
  for (let i = 0; i < adjustedCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 25 + Math.random() * 90;
    state.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: .35 + Math.random() * .5, color, size: 2 + Math.random() * 4 });
  }
}

function updateParticles(dt) {
  for (const p of state.particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 35 * dt;
    p.life -= dt;
  }
  state.particles = state.particles.filter(p => p.life > 0);
}

function updateEffects(dt) {
  for (const effect of state.effects) {
    effect.life -= dt;
    effect.radius = effect.maxRadius * (1 - effect.life / effect.maxLife);
  }
  state.effects = state.effects.filter(effect => effect.life > 0);
}

function finish(won) {
  if (state.phase !== "playing") return;
  state.phase = won ? "won" : "lost";
  state.paused = false;
  syncUI();
  if (won) playSound("win");
  else playSound("lose");
  if (won) {
    if (state.mode === "endless") {
      progression.endlessBestScore = Math.max(progression.endlessBestScore || 0, Math.floor(state.score));
      if (progression.endlessBestScore === Math.floor(state.score)) announce("New endless best score!");
      saveProgression();
      renderLevelMenu();
      showPanel("Endless pause", `You reached wave ${state.wave} with score ${Math.floor(state.score)}.${progression.endlessBestScore ? ` Best: ${progression.endlessBestScore}.` : ""}`, "Return to menu", restart);
      return;
    }
    const levelWaves = LEVELS[state.level - 1]?.waves || MAX_WAVES;
    unlockedLevel = Math.max(unlockedLevel, Math.min(5, state.level + 1));
    progression.unlockedLevel = unlockedLevel;
    if (state.level >= ENDLESS_UNLOCK_LEVEL) progression.endlessUnlocked = true;
    progression.points = (progression.points || 0) + 1;
    saveProgression();
    renderLevelMenu();
    const choices = systems.pickUpgradeChoices ? systems.pickUpgradeChoices(progression) : ["startingDew", "guardianHealth", "foodPower"];
    showPanel("The moonmeadow is safe!", `You held all ${levelWaves} waves with ${state.gate} gate ward${state.gate === 1 ? "" : "s"} remaining. Choose one upgrade reward.`, "Choose another level", restart);
    ui.levelMenu.style.display = "grid";
    ui.levelMenu.innerHTML = choices.map(choice => `<button type="button" data-upgrade="${choice}"><strong>${systems.UPGRADE_DEFS?.[choice]?.label || choice}</strong><small>Lv ${progression.upgrades[choice]}/${systems.UPGRADE_DEFS?.[choice]?.max || "?"}</small></button>`).join("");
    ui.levelMenu.querySelectorAll("button").forEach(button => {
      button.addEventListener("click", () => {
        progression = systems.applyUpgrade ? systems.applyUpgrade(progression, button.dataset.upgrade) : progression;
        saveProgression();
        renderLevelMenu();
        announce(`${systems.UPGRADE_DEFS?.[button.dataset.upgrade]?.label || button.dataset.upgrade} upgraded.`);
        showMainMenu();
      });
    });
    ui.messageButton.style.display = "none";
  } else {
    if (state.mode === "endless") {
      progression.endlessBestScore = Math.max(progression.endlessBestScore || 0, Math.floor(state.score));
      saveProgression();
      renderLevelMenu();
      showPanel("The moon gate has fallen", `Endless wave ${state.wave}, score ${Math.floor(state.score)}. Best ${progression.endlessBestScore}.`, "Try again", restart);
      return;
    }
    showPanel("The moon gate has fallen", `The garden held through wave ${state.wave}. Try a new mix of wells, sparks, thorns, and bark.`, "Try again", restart);
  }
}

function roundedRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function draw() {
  ctx.save();
  const shakeX = settings.screenShake && state.shake ? (Math.random() - .5) * state.shake * 9 : 0;
  ctx.translate(shakeX, 0);
  drawBackdrop();
  drawBoard();
  state.guardians.forEach(drawGuardian);
  state.shots.forEach(drawShot);
  state.invaders.forEach(drawEnemy);
  state.drops.forEach(drawDrop);
  state.particles.forEach(drawParticle);
  state.effects.forEach(drawEffect);
  drawWarnings();
  drawFloaters();
  drawCursor();
  if (state.surgeFlash > 0) drawSurgeBanner();
  ctx.restore();
}

function drawBackdrop() {
  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, "#172b3b");
  sky.addColorStop(.55, "#274c42");
  sky.addColorStop(1, "#173229");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(239,246,210,.9)";
  ctx.beginPath();
  ctx.arc(85, 57, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#172b3b";
  ctx.beginPath();
  ctx.arc(96, 48, 25, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < 38; i++) {
    const x = (i * 137) % canvas.width;
    const y = 15 + (i * 47) % 80;
    ctx.fillStyle = `rgba(225,245,213,${.25 + (i % 4) * .12})`;
    ctx.fillRect(x, y, i % 3 ? 1.5 : 2.5, i % 3 ? 1.5 : 2.5);
  }
  ctx.fillStyle = "#10251f";
  ctx.fillRect(0, 580, canvas.width, 40);
}

function drawBoard() {
  ctx.save();
  roundedRect(BOARD.x - 7, BOARD.y - 7, BOARD.w + 14, BOARD.h + 14, 16);
  ctx.fillStyle = "rgba(5,20,16,.45)";
  ctx.fill();
  ctx.strokeStyle = "rgba(201,238,190,.28)";
  ctx.lineWidth = 2;
  ctx.stroke();

  for (let row = 0; row < BOARD.rows; row++) {
    for (let col = 0; col < BOARD.cols; col++) {
      const x = BOARD.x + col * CELL.w;
      const y = BOARD.y + row * CELL.h;
      ctx.fillStyle = (row + col) % 2 ? "#3c7552" : "#427e59";
      ctx.fillRect(x, y, CELL.w, CELL.h);
      ctx.fillStyle = "rgba(255,255,220,.045)";
      for (let j = 0; j < 4; j++) {
        const sx = x + 14 + ((j * 29 + row * 13) % 76);
        const sy = y + 18 + ((j * 23 + col * 11) % 60);
        ctx.beginPath();
        ctx.ellipse(sx, sy, 3, 7, .4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = "rgba(11,45,32,.27)";
      ctx.strokeRect(x, y, CELL.w, CELL.h);
    }
  }

  ctx.fillStyle = "#6d5062";
  ctx.fillRect(8, BOARD.y - 10, 42, BOARD.h + 20);
  ctx.fillStyle = "#cbb576";
  for (let row = 0; row < 5; row++) {
    roundedRect(15, BOARD.y + row * CELL.h + 24, 27, 48, 8);
    ctx.fill();
    ctx.fillStyle = "#82713f";
    ctx.fillRect(19, BOARD.y + row * CELL.h + 46, 19, 4);
    ctx.fillStyle = "#cbb576";
  }
  ctx.fillStyle = "rgba(238,246,216,.7)";
  ctx.font = "700 12px Segoe UI";
  ctx.fillText("MOON GATE", 8, 94);
  drawMowers();
  ctx.restore();
}

function drawMowers() {
  state.mowers.forEach(mower => {
    ctx.save();
    ctx.translate(mower.x, mower.y + 24);
    ctx.globalAlpha = mower.active ? 1 : .26;
    ctx.fillStyle = "#bf5d4d";
    roundedRect(-25, -13, 50, 16, 7);
    ctx.fill();
    ctx.fillStyle = "#f5c668";
    ctx.fillRect(-17, -9, 34, 4);
    ctx.fillStyle = "#283e35";
    ctx.beginPath(); ctx.arc(-15, 7, 6, 0, Math.PI * 2); ctx.arc(15, 7, 6, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#e8a857";
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-15, -14); ctx.lineTo(-22, -27); ctx.lineTo(-5, -27); ctx.stroke();
    ctx.restore();
  });
}

function drawSurgeBanner() {
  const alpha = Math.min(1, state.surgeFlash, (3 - state.surgeFlash) * 3);
  ctx.save();
  ctx.globalAlpha = alpha;
  const gradient = ctx.createLinearGradient(315, 0, 765, 0);
  gradient.addColorStop(0, "rgba(68,37,88,0)");
  gradient.addColorStop(.25, "rgba(68,37,88,.92)");
  gradient.addColorStop(.75, "rgba(68,37,88,.92)");
  gradient.addColorStop(1, "rgba(68,37,88,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(270, 43, 540, 50);
  ctx.fillStyle = "#f2c8ff";
  ctx.textAlign = "center";
  ctx.font = "900 22px Segoe UI";
  const finalWave = LEVELS[state.level - 1]?.waves || MAX_WAVES;
  ctx.fillText(state.mode === "campaign" && state.level === 5 && state.wave === finalWave ? "FINAL MOON SURGE" : `MOON SURGE ${state.wave}`, 540, 75);
  ctx.textAlign = "start";
  ctx.restore();
}

function drawLeaf(x, y, width, height, color, rotation = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(width, -height * .5, width * 1.3, 0);
  ctx.quadraticCurveTo(width, height * .55, 0, 0);
  ctx.fill();
  ctx.restore();
}

function drawGuardian(unit) {
  const spec = defenders[unit.type];
  const sway = Math.sin(state.elapsed * 2 + unit.col) * 3;
  ctx.save();
  ctx.translate(unit.x, unit.y + sway);
  if (unit.pulse) ctx.scale(1 + unit.pulse * .12, 1 + unit.pulse * .12);

  ctx.fillStyle = "rgba(4,20,14,.28)";
  ctx.beginPath();
  ctx.ellipse(0, 30, 30, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#3f6a4f";
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, 26);
  ctx.quadraticCurveTo(3, 8, 0, -20);
  ctx.stroke();

  const ground = unit.type === "bark" || unit.type === "tidewood" || unit.type === "livingfort" ? "#7c5a3e" : unit.type === "well" ? "#2e6c67" : "#4d7d55";
  ctx.fillStyle = ground;
  ctx.beginPath();
  ctx.ellipse(0, 26, 18, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  if (["sprig", "storm", "firewind", "ember"].includes(unit.type)) {
    drawLeaf(-16, 0, 16, 22, "rgba(72, 174, 102, 0.75)", -0.8);
    drawLeaf(16, 2, 18, 24, "rgba(86, 192, 109, 0.8)", 0.8);
    drawLeaf(-8, -18, 16, 20, spec.color, -1.1);
    drawLeaf(8, -18, 16, 20, spec.color, 1.1);
    ctx.fillStyle = spec.color;
    ctx.beginPath();
    ctx.arc(0, -22, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f9f0c1";
    ctx.beginPath(); ctx.arc(-3, -24, 3.5, 0, Math.PI * 2); ctx.arc(4, -24, 3.5, 0, Math.PI * 2); ctx.fill();
  } else if (unit.type === "well") {
    ctx.fillStyle = "#2c5a5a";
    ctx.beginPath();
    ctx.ellipse(0, 8, 24, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#9ce8ff";
    ctx.beginPath(); ctx.ellipse(0, 4, 18, 10, 0, 0, Math.PI * 2); ctx.fill();
    drawLeaf(-18, 0, 22, 28, "rgba(118, 214, 156, 0.8)", -0.8);
    drawLeaf(18, 2, 22, 28, "rgba(130, 224, 169, 0.8)", 0.8);
    drawLeaf(0, -18, 18, 24, "rgba(117, 226, 200, 0.75)", 0.2);
  } else if (unit.type === "coil" || unit.type === "storm") {
    ctx.strokeStyle = "#407a52";
    ctx.lineWidth = 5;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const x = i % 2 === 0 ? i * 5 - 10 : i * 5 - 6;
      ctx.moveTo(0, 15 + i * 3);
      ctx.quadraticCurveTo(x, -8 + i * 2, x * 0.7, -22 + i * 2);
    }
    ctx.stroke();
    drawLeaf(-18, -8, 16, 18, "rgba(118, 194, 104, 0.8)", -1.0);
    drawLeaf(18, -4, 18, 20, "rgba(129, 215, 120, 0.75)", 1.0);
    ctx.fillStyle = spec.color;
    ctx.beginPath();
    ctx.arc(0, -20, 10, 0, Math.PI * 2);
    ctx.fill();
  } else if (unit.type === "breeze") {
    ctx.strokeStyle = "#476d77";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(0, 24);
    ctx.quadraticCurveTo(0, -10, 0, -26);
    ctx.stroke();
    ctx.strokeStyle = spec.color;
    ctx.beginPath();
    ctx.moveTo(-14, -8); ctx.quadraticCurveTo(-6, -22, 0, -10); ctx.moveTo(0, -10); ctx.quadraticCurveTo(8, -22, 15, -8);
    ctx.stroke();
    drawLeaf(-18, -8, 20, 20, "rgba(122, 229, 255, 0.7)", -1.2);
    drawLeaf(18, -8, 20, 20, "rgba(122, 229, 255, 0.7)", 1.2);
  } else if (unit.type === "mend") {
    drawLeaf(-18, 4, 18, 22, "rgba(136, 214, 98, 0.8)", -1.2);
    drawLeaf(18, 4, 18, 22, "rgba(136, 214, 98, 0.8)", 1.2);
    drawLeaf(0, -16, 18, 22, spec.color, 0.2);
    ctx.fillStyle = "#5ea26d";
    ctx.beginPath(); ctx.ellipse(0, 8, 20, 14, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = spec.color;
    ctx.beginPath(); ctx.arc(0, -18, 11, 0, Math.PI * 2); ctx.fill();
  } else if (unit.type === "tempo") {
    ctx.strokeStyle = "#748f4f";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(0, 24); ctx.quadraticCurveTo(0, -8, 0, -26); ctx.stroke();
    ctx.fillStyle = spec.color;
    ctx.beginPath(); ctx.arc(10, -23, 10, 0, Math.PI * 2); ctx.fill();
    drawLeaf(-18, -5, 18, 22, "rgba(255, 212, 105, 0.8)", -1.1);
    drawLeaf(18, -5, 18, 22, "rgba(255, 212, 105, 0.8)", 1.1);
  } else if (unit.type === "bark" || unit.type === "tidewood" || unit.type === "livingfort") {
    ctx.fillStyle = unit.type === "tidewood" ? "#4b7c68" : unit.type === "livingfort" ? "#598d63" : "#8d6345";
    ctx.beginPath();
    ctx.moveTo(-17, 20); ctx.quadraticCurveTo(-24, -10, -2, -24); ctx.quadraticCurveTo(22, -8, 18, 18); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = spec.color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-10, 1); ctx.quadraticCurveTo(-4, -18, 0, -25);
    ctx.moveTo(10, 2); ctx.quadraticCurveTo(4, -19, 0, -26);
    ctx.stroke();
    if (unit.type === "tidewood" || unit.type === "livingfort") {
      ctx.fillStyle = "rgba(140, 240, 255, 0.8)";
      ctx.beginPath(); ctx.arc(0, -10, 11, 0, Math.PI * 2); ctx.fill();
    }
  } else {
    drawLeaf(-14, 6, 18, 22, "rgba(76, 188, 120, 0.8)", -0.9);
    drawLeaf(14, 7, 18, 22, "rgba(76, 188, 120, 0.8)", 0.9);
    drawLeaf(-6, -14, 16, 18, spec.color, -0.6);
    drawLeaf(6, -14, 16, 18, spec.color, 0.6);
    ctx.fillStyle = spec.color;
    ctx.beginPath(); ctx.arc(0, -18, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#ffffdf";
    ctx.beginPath(); ctx.arc(-3, -20, 2.5, 0, Math.PI * 2); ctx.arc(4, -20, 2.5, 0, Math.PI * 2); ctx.fill();
  }

  const ratio = Math.max(0, unit.hp / unit.maxHp);
  if (unit.timer <= 0 && !["tempo", "lantern", "bark", "livingfort"].includes(unit.type)) {
    ctx.strokeStyle = "#ffe98d";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -22, 16, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(9,20,16,.72)";
  roundedRect(-30, 34, 60, 5, 3); ctx.fill();
  ctx.fillStyle = ratio > .35 ? "#8ff0a6" : "#ff826e";
  roundedRect(-30, 34, 60 * ratio, 5, 3); ctx.fill();
  ctx.restore();
}

function drawEnemy(enemy) {
  const spec = enemies[enemy.type];
  ctx.save();
  ctx.translate(enemy.x, enemy.y + Math.sin(enemy.step) * 3);
  if (enemy.frozen > 0) {
    ctx.fillStyle = "rgba(164,226,255,.32)";
    ctx.beginPath(); ctx.arc(0, 0, spec.size + 13, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#d8f4ff"; ctx.lineWidth = 4; ctx.stroke();
  }
  if (enemy.shield > 0) {
    ctx.strokeStyle = "#e9dfb5";
    ctx.lineWidth = 7;
    ctx.beginPath(); ctx.arc(0, 0, spec.size + 10, -1.35, 1.35); ctx.stroke();
  }
  if (enemy.enraged) {
    ctx.shadowColor = "#ff493e";
    ctx.shadowBlur = 18;
  }
  if (spec.aura) {
    ctx.strokeStyle = "rgba(241,204,77,.7)";
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, 52 + Math.sin(state.elapsed * 4) * 4, 0, Math.PI * 2); ctx.stroke();
  }
  if (spec.resist) {
    ctx.strokeStyle = effectColors[spec.resist];
    ctx.lineWidth = spec.boss ? 7 : 5;
    ctx.beginPath(); ctx.arc(0, 0, spec.size + 8, 0, Math.PI * 2); ctx.stroke();
  }
  if (spec.weakness) {
    ctx.fillStyle = effectColors[spec.weakness];
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 10 - 4, -spec.size - 13);
      ctx.lineTo(i * 10 + 4, -spec.size - 13);
      ctx.lineTo(i * 10, -spec.size - 7);
      ctx.fill();
    }
  }
  if (enemy.slow > 0) {
    ctx.strokeStyle = "rgba(209,164,255,.65)";
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, spec.size + 7, 0, Math.PI * 2); ctx.stroke();
  }
  if (enemy.energized) {
    ctx.strokeStyle = "rgba(182,255,137,.9)";
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(0, 0, spec.size + 15 + Math.sin(state.elapsed * 6) * 2, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = "rgba(182,255,137,.4)";
    ctx.beginPath(); ctx.arc(0, 0, spec.size + 5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = "rgba(4,15,13,.3)";
  ctx.beginPath(); ctx.ellipse(0, spec.size, spec.size, 8, 0, 0, 7); ctx.fill();
  if (enemy.buried) {
    ctx.globalAlpha = .38;
    ctx.fillStyle = "#7a614f";
    ctx.beginPath(); ctx.ellipse(0, spec.size - 3, spec.size * .95, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = spec.color;
  if (enemy.type === "skitter") {
    ctx.beginPath(); ctx.ellipse(0, 0, 24, 17, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = "#533e31"; ctx.lineWidth = 5;
    for (let i = -1; i <= 1; i += 2) {
      ctx.beginPath(); ctx.moveTo(i * 12, 6); ctx.lineTo(i * 30, 23); ctx.moveTo(i * 9, -6); ctx.lineTo(i * 28, -17); ctx.stroke();
    }
  } else {
    roundedRect(-spec.size * .72, -spec.size, spec.size * 1.45, spec.size * 1.8, spec.size * .48);
    ctx.fill();
    if (enemy.type === "rammer") {
      ctx.fillStyle = "#c5b56d";
      ctx.beginPath(); ctx.moveTo(-24,-18); ctx.lineTo(-40,-37); ctx.lineTo(-15,-30); ctx.fill();
      ctx.beginPath(); ctx.moveTo(24,-18); ctx.lineTo(40,-37); ctx.lineTo(15,-30); ctx.fill();
    }
    if (enemy.type === "vaulter") {
      ctx.strokeStyle = "#d2b783"; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(-32, -30); ctx.lineTo(-32, 30); ctx.moveTo(-18, -30); ctx.lineTo(-18, 30);
      for (let y = -24; y <= 24; y += 12) { ctx.moveTo(-34, y); ctx.lineTo(-16, y); }
      ctx.stroke();
    }
    if (enemy.type === "scribe") {
      ctx.fillStyle = enemy.enraged ? "#ff6d5f" : "#eee3bd";
      ctx.fillRect(-25, -25, 22, 38);
      ctx.strokeStyle = "#604a3c"; ctx.lineWidth = 2; ctx.strokeRect(-25, -25, 22, 38);
    }
    if (enemy.type === "burrower") {
      ctx.fillStyle = "#704f3f";
      ctx.beginPath(); ctx.moveTo(-15, -4); ctx.lineTo(0, -26); ctx.lineTo(15, -4); ctx.closePath(); ctx.fill();
    }
    if (enemy.type === "splitling" || enemy.type === "sproutlet") {
      ctx.strokeStyle = "#f2d1ff"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-8, -12); ctx.lineTo(8, 12); ctx.moveTo(8, -12); ctx.lineTo(-8, 12); ctx.stroke();
    }
    if (enemy.type === "herald") {
      ctx.strokeStyle = "#d6b447"; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(26, -38); ctx.lineTo(26, 31); ctx.stroke();
      ctx.fillStyle = "#ead167";
      ctx.beginPath(); ctx.moveTo(27, -38); ctx.lineTo(55, -27); ctx.lineTo(27, -13); ctx.fill();
    }
    if (enemy.type === "gardener") {
      ctx.strokeStyle = "#ccffd7"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, -20, 10, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(0, -10); ctx.moveTo(-10, -20); ctx.lineTo(10, -20); ctx.stroke();
    }
    if (spec.boss) {
      ctx.fillStyle = "#ffcf7b";
      ctx.beginPath();
      ctx.moveTo(-30, -spec.size + 5);
      ctx.lineTo(-20, -spec.size - 20);
      ctx.lineTo(-5, -spec.size + 2);
      ctx.lineTo(10, -spec.size - 24);
      ctx.lineTo(28, -spec.size + 5);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#222a30";
      ctx.fillRect(-24, 10, 48, 13);
    }
  }
  ctx.fillStyle = "#f7ecbb";
  ctx.beginPath(); ctx.arc(-8, -8, 5, 0, 7); ctx.arc(8, -8, 5, 0, 7); ctx.fill();
  ctx.fillStyle = "#31232b";
  ctx.beginPath(); ctx.arc(-7, -7, 2, 0, 7); ctx.arc(9, -7, 2, 0, 7); ctx.fill();
  ctx.strokeStyle = "#4b2930"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-8, 9); ctx.lineTo(0, 5); ctx.lineTo(8, 9); ctx.stroke();
  if (settings.colorblindIndicators) {
    ctx.fillStyle = "#f5f5f5";
    ctx.font = "700 12px Segoe UI";
    if (spec.resist) ctx.fillText(`R:${spec.resist[0].toUpperCase()}`, -18, -spec.size - 20);
    if (spec.weakness) ctx.fillText(`W:${spec.weakness[0].toUpperCase()}`, -18, -spec.size - 6);
  }
  const ratio = Math.max(0, enemy.hp / enemy.maxHp);
  ctx.fillStyle = "rgba(12,14,18,.72)"; ctx.fillRect(-28, spec.size + 9, 56, 5);
  ctx.fillStyle = "#ff8b78"; ctx.fillRect(-28, spec.size + 9, 56 * ratio, 5);
  ctx.restore();
}

function drawShot(shot) {
  ctx.save();
  ctx.shadowColor = shot.color;
  ctx.shadowBlur = 14;
  ctx.strokeStyle = shot.color;
  ctx.fillStyle = shot.color;
  if (shot.type === "breeze") {
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(shot.x - 8, shot.y, 10, -1.1, 1.1);
    ctx.arc(shot.x + 2, shot.y, 10, -1.1, 1.1);
    ctx.stroke();
  } else {
    ctx.beginPath(); ctx.arc(shot.x, shot.y, shot.radius, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawDrop(drop) {
  const bob = Math.sin(drop.bob) * 5;
  ctx.save();
  ctx.translate(drop.x, drop.y + bob);
  if (drop.kind === "food") {
    ctx.shadowColor = "#aef77a";
    ctx.shadowBlur = 18;
    ctx.fillStyle = "#9be37a";
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.quadraticCurveTo(14, -6, 10, 10);
    ctx.quadraticCurveTo(0, 18, -10, 10);
    ctx.quadraticCurveTo(-14, -6, 0, -16);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.8)";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(0, 12); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-8, -4); ctx.lineTo(8, -4); ctx.stroke();
    ctx.restore();
    return;
  }
  ctx.shadowColor = "#76ecff";
  ctx.shadowBlur = 18;
  ctx.fillStyle = "rgba(119,230,255,.88)";
  ctx.beginPath();
  ctx.moveTo(0, -17); ctx.bezierCurveTo(17, 2, 14, 18, 0, 21); ctx.bezierCurveTo(-14, 18, -17, 2, 0, -17); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,.7)";
  ctx.beginPath(); ctx.ellipse(-5, 3, 3, 7, .4, 0, 7); ctx.fill();
  ctx.restore();
}

function drawParticle(p) {
  ctx.globalAlpha = Math.min(1, p.life * 2);
  ctx.fillStyle = p.color;
  ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
}

function drawEffect(effect) {
  const alpha = Math.max(0, effect.life / effect.maxLife);
  ctx.save();
  if (effect.type === "blast") {
    const gradient = ctx.createRadialGradient(effect.x, effect.y, 0, effect.x, effect.y, Math.max(1, effect.radius));
    gradient.addColorStop(0, `rgba(255,255,210,${alpha})`);
    gradient.addColorStop(.35, `rgba(255,177,72,${alpha * .85})`);
    gradient.addColorStop(1, "rgba(255,75,30,0)");
    ctx.fillStyle = gradient;
    ctx.beginPath(); ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = `rgba(255,222,105,${alpha})`; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.arc(effect.x, effect.y, effect.radius * .78, 0, Math.PI * 2); ctx.stroke();
  } else if (effect.type === "food") {
    const gradient = ctx.createRadialGradient(effect.x, effect.y, 0, effect.x, effect.y, Math.max(1, effect.radius));
    gradient.addColorStop(0, `rgba(179,255,150,${alpha})`);
    gradient.addColorStop(.35, `rgba(125,219,101,${alpha * .82})`);
    gradient.addColorStop(1, "rgba(92,181,72,0)");
    ctx.fillStyle = gradient;
    ctx.beginPath(); ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = `rgba(209,255,164,${alpha})`;
    ctx.lineWidth = 7;
    ctx.beginPath(); ctx.arc(effect.x, effect.y, effect.radius * .82, 0, Math.PI * 2); ctx.stroke();
  } else {
    ctx.fillStyle = `rgba(167,224,255,${alpha * .32})`;
    ctx.fillRect(BOARD.x, BOARD.y, BOARD.w, BOARD.h);
    ctx.strokeStyle = `rgba(220,248,255,${alpha})`; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < 20; i++) {
      const x = BOARD.x + (i * 83) % BOARD.w;
      const y = BOARD.y + (i * 137) % BOARD.h;
      ctx.fillStyle = `rgba(240,252,255,${alpha})`;
      ctx.fillText("✦", x, y);
    }
  }
  ctx.restore();
}

function drawWarnings() {
  ctx.save();
  ctx.font = "700 14px Segoe UI";
  state.guardians.filter(unit => unit.hp / unit.maxHp < 0.28).forEach(unit => {
    ctx.fillStyle = "#ff7f74";
    ctx.fillText("⚠", unit.x - 6, unit.y - 40);
  });
  const laneThreats = new Set(state.invaders.filter(enemy => enemy.x < BOARD.x + 120).map(enemy => enemy.row));
  laneThreats.forEach(row => {
    const y = cellCenter(row, 0).y;
    ctx.fillStyle = "#ffd67b";
    ctx.fillText("LANE!", BOARD.x + 8, y - 28);
  });
  ctx.restore();
}

function drawFloaters() {
  ctx.save();
  ctx.font = "700 12px Segoe UI";
  ctx.textAlign = "center";
  state.floaterTexts.forEach(text => {
    ctx.globalAlpha = Math.min(1, text.life * 1.4);
    ctx.fillStyle = text.color;
    ctx.fillText(text.text, text.x, text.y);
  });
  ctx.textAlign = "start";
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawCursor() {
  const pos = cellCenter(state.cursor.row, state.cursor.col);
  ctx.save();
  ctx.strokeStyle = state.plantFoodArmed ? "#9be37a" : state.removeMode ? "#ff8c78" : defenders[state.selected].color;
  ctx.lineWidth = 3;
  ctx.setLineDash([9, 7]);
  roundedRect(pos.x - CELL.w / 2 + 5, pos.y - CELL.h / 2 + 5, CELL.w - 10, CELL.h - 10, 10);
  ctx.stroke();
  ctx.restore();
}

function frame(time) {
  const dt = Math.min(.05, (time - lastTime) / 1000);
  lastTime = time;
  update(dt * state.speed);
  draw();
  animationId = requestAnimationFrame(frame);
}

init();
animationId = requestAnimationFrame(frame);
