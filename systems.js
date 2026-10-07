"use strict";

(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.GardenSystems = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  const STORAGE_KEYS = {
    progression: "gardenGuardProgressionV2",
    settings: "gardenGuardSettingsV2",
    tutorial: "gardenGuardTutorialV1"
  };

  const FUSION_RECIPES = {
    "coil+sprig": "storm",
    "bark+well": "tidewood",
    "breeze+ember": "firewind",
    "bark+mend": "livingfort",
    "sprig+tempo": "pulsebloom",
    "hush+mist": "winterveil"
  };

  const UPGRADE_DEFS = {
    startingDew: { label: "Starting Dew", amount: 25, max: 5 },
    guardianHealth: { label: "Guardian Health", amount: 0.08, max: 5 },
    recharge: { label: "Recharge Trim", amount: 0.06, max: 4 },
    mowerStrength: { label: "Mower Strength", amount: 220, max: 5 },
    foodPower: { label: "Plant Food Boost", amount: 0.22, max: 4 }
  };

  const WEATHER = {
    heavyDew: { name: "Heavy Dew", detail: "Ambient dew appears more often.", ambientFactor: 0.72 },
    moonFog: { name: "Moon Fog", detail: "Invaders advance through thick fog.", enemySpeedFactor: 0.9 },
    coldNight: { name: "Cold Night", detail: "Guardian cooldowns are slower.", guardianCooldownFactor: 1.12 },
    strongWind: { name: "Strong Wind", detail: "Push effects are amplified.", pushFactor: 1.35 },
    eclipse: { name: "Eclipse", detail: "Energized foes are rarer.", energizedFactor: 0.72 }
  };

  const DEFAULT_SETTINGS = {
    sfx: true,
    music: true,
    reducedMotion: false,
    screenShake: true,
    highContrast: false,
    colorblindIndicators: true
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function sanitizeInt(value, fallback) {
    const n = Number(value);
    return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : fallback;
  }

  function loadJSON(storage, key, fallback) {
    if (!storage) return clone(fallback);
    try {
      const raw = storage.getItem(key);
      if (!raw) return clone(fallback);
      return { ...clone(fallback), ...JSON.parse(raw) };
    } catch {
      return clone(fallback);
    }
  }

  function saveJSON(storage, key, value) {
    if (!storage) return;
    storage.setItem(key, JSON.stringify(value));
  }

  function defaultProgression() {
    return {
      unlockedLevel: 1,
      endlessUnlocked: false,
      points: 0,
      endlessBestScore: 0,
      upgrades: {
        startingDew: 0,
        guardianHealth: 0,
        recharge: 0,
        mowerStrength: 0,
        foodPower: 0
      }
    };
  }

  function normalizeProgression(raw) {
    const base = defaultProgression();
    const normalized = {
      ...base,
      ...raw,
      upgrades: { ...base.upgrades, ...(raw?.upgrades || {}) }
    };
    normalized.unlockedLevel = Math.min(5, Math.max(1, sanitizeInt(normalized.unlockedLevel, 1)));
    normalized.points = sanitizeInt(normalized.points, 0);
    normalized.endlessBestScore = sanitizeInt(normalized.endlessBestScore, 0);
    normalized.endlessUnlocked = Boolean(normalized.endlessUnlocked || normalized.unlockedLevel >= 5);
    Object.keys(base.upgrades).forEach(key => {
      normalized.upgrades[key] = Math.min(UPGRADE_DEFS[key].max, sanitizeInt(normalized.upgrades[key], 0));
    });
    return normalized;
  }

  function loadProgression(storage) {
    return normalizeProgression(loadJSON(storage, STORAGE_KEYS.progression, defaultProgression()));
  }

  function saveProgression(storage, progression) {
    saveJSON(storage, STORAGE_KEYS.progression, normalizeProgression(progression));
  }

  function resetProgression(storage) {
    const p = defaultProgression();
    saveProgression(storage, p);
    return p;
  }

  function loadSettings(storage) {
    return normalizeSettings(loadJSON(storage, STORAGE_KEYS.settings, DEFAULT_SETTINGS));
  }

  function normalizeSettings(input) {
    return {
      sfx: Boolean(input?.sfx ?? DEFAULT_SETTINGS.sfx),
      music: Boolean(input?.music ?? DEFAULT_SETTINGS.music),
      reducedMotion: Boolean(input?.reducedMotion ?? DEFAULT_SETTINGS.reducedMotion),
      screenShake: Boolean(input?.screenShake ?? DEFAULT_SETTINGS.screenShake),
      highContrast: Boolean(input?.highContrast ?? DEFAULT_SETTINGS.highContrast),
      colorblindIndicators: Boolean(input?.colorblindIndicators ?? DEFAULT_SETTINGS.colorblindIndicators)
    };
  }

  function saveSettings(storage, settings) {
    saveJSON(storage, STORAGE_KEYS.settings, normalizeSettings(settings));
  }

  function loadTutorialState(storage) {
    return loadJSON(storage, STORAGE_KEYS.tutorial, { completed: false, skipped: false, step: 0 });
  }

  function saveTutorialState(storage, tutorial) {
    saveJSON(storage, STORAGE_KEYS.tutorial, tutorial);
  }

  function allFusionRecipes() {
    return { ...FUSION_RECIPES };
  }

  function listFusionRecipeKeys() {
    return Object.keys(FUSION_RECIPES);
  }

  function resolveFusion(a, b, slots) {
    const key = [a, b].sort().join("+");
    if (Array.isArray(slots) && slots.length && !slots.includes(key)) return null;
    return FUSION_RECIPES[key] || null;
  }

  function pickUpgradeChoices(progression) {
    const available = Object.keys(UPGRADE_DEFS).filter(key => progression.upgrades[key] < UPGRADE_DEFS[key].max);
    if (available.length <= 3) return available;
    const shuffled = [...available].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }

  function applyUpgrade(progression, key) {
    const next = normalizeProgression(progression);
    if (!UPGRADE_DEFS[key]) return next;
    if (next.upgrades[key] >= UPGRADE_DEFS[key].max) return next;
    if (next.points <= 0) return next;
    next.points -= 1;
    next.upgrades[key] += 1;
    return next;
  }

  function createEndlessWave(number) {
    const wave = Math.max(1, number);
    return {
      count: 8 + Math.floor(wave * 2.4),
      interval: Math.max(0.45, 1.5 - wave * 0.03),
      energizedRate: Math.min(0.3, 0.09 + wave * 0.006),
      eliteEvery: Math.max(5, 11 - Math.floor(wave / 4))
    };
  }

  function weatherForWave(mode, level, waveNumber) {
    const keys = Object.keys(WEATHER);
    if (mode === "endless") return keys[(waveNumber - 1) % keys.length];
    const byLevel = ["heavyDew", "moonFog", "coldNight", "strongWind", "eclipse"];
    return byLevel[Math.max(0, Math.min(byLevel.length - 1, (level || 1) - 1))];
  }

  function plantFoodBuffDuration(progression) {
    const foodPower = progression?.upgrades?.foodPower || 0;
    return 6 + foodPower * 1.4;
  }

  function plantFoodPowerScale(progression) {
    const foodPower = progression?.upgrades?.foodPower || 0;
    return 1 + foodPower * UPGRADE_DEFS.foodPower.amount;
  }

  function mowerDamage(progression) {
    const level = progression?.upgrades?.mowerStrength || 0;
    return 900 + level * UPGRADE_DEFS.mowerStrength.amount;
  }

  function startingDew(progression) {
    const level = progression?.upgrades?.startingDew || 0;
    return 150 + level * UPGRADE_DEFS.startingDew.amount;
  }

  function healthMultiplier(progression) {
    return 1 + (progression?.upgrades?.guardianHealth || 0) * UPGRADE_DEFS.guardianHealth.amount;
  }

  function rechargeMultiplier(progression) {
    return Math.max(0.7, 1 - (progression?.upgrades?.recharge || 0) * UPGRADE_DEFS.recharge.amount);
  }

  function colorForModifier(modifierKey) {
    switch (modifierKey) {
      case "heavyDew": return "#8defff";
      case "moonFog": return "#d9c3ff";
      case "coldNight": return "#b6d7ff";
      case "strongWind": return "#bff7ff";
      case "eclipse": return "#ffe38c";
      default: return "#e6f3d6";
    }
  }

  function splitOutcome(enemyType) {
    return enemyType === "splitling" ? ["sproutlet", "sproutlet"] : [];
  }

  function stepBurrowState(state, dt) {
    const next = { ...state };
    if (!next.isBurrower) return next;
    next.burrowTimer -= dt;
    if (next.buried) {
      next.burrowedFor -= dt;
      if (next.burrowedFor <= 0) {
        next.buried = false;
        next.burrowTimer = 2.8;
        next.resurfaced = true;
      }
    } else if (next.burrowTimer <= 0) {
      next.buried = true;
      next.burrowedFor = 1.3;
      next.resurfaced = false;
    }
    return next;
  }

  return {
    STORAGE_KEYS,
    UPGRADE_DEFS,
    WEATHER,
    DEFAULT_SETTINGS,
    allFusionRecipes,
    listFusionRecipeKeys,
    loadProgression,
    saveProgression,
    resetProgression,
    loadSettings,
    saveSettings,
    normalizeSettings,
    loadTutorialState,
    saveTutorialState,
    resolveFusion,
    pickUpgradeChoices,
    applyUpgrade,
    createEndlessWave,
    weatherForWave,
    plantFoodBuffDuration,
    plantFoodPowerScale,
    mowerDamage,
    startingDew,
    healthMultiplier,
    rechargeMultiplier,
    colorForModifier,
    splitOutcome,
    stepBurrowState
  };
});
