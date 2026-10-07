"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const systems = require("../systems.js");

test("fusion slots restrict recipes", () => {
  const slot = ["coil+sprig", "bark+well"];
  assert.equal(systems.resolveFusion("coil", "sprig", slot), "storm");
  assert.equal(systems.resolveFusion("mend", "bark", slot), null);
  assert.equal(systems.resolveFusion("mist", "hush", ["hush+mist", "coil+sprig"]), "winterveil");
});

test("progression upgrades and endless unlock normalize", () => {
  const p = systems.loadProgression({
    getItem: () => JSON.stringify({ unlockedLevel: 5, endlessUnlocked: false, points: 2, upgrades: { startingDew: 1 } })
  });
  assert.equal(p.endlessUnlocked, true);
  const upgraded = systems.applyUpgrade(p, "startingDew");
  assert.equal(upgraded.upgrades.startingDew, 2);
  assert.equal(upgraded.points, 1);
});

test("endless wave scaling increases pressure", () => {
  const early = systems.createEndlessWave(2);
  const late = systems.createEndlessWave(20);
  assert.ok(late.count > early.count);
  assert.ok(late.interval < early.interval);
});

test("plant-food and mower scaling depend on progression", () => {
  const base = systems.plantFoodPowerScale({ upgrades: { foodPower: 0 } });
  const buffed = systems.plantFoodPowerScale({ upgrades: { foodPower: 3 } });
  assert.ok(buffed > base);
  assert.ok(systems.mowerDamage({ upgrades: { mowerStrength: 4 } }) > systems.mowerDamage({ upgrades: { mowerStrength: 0 } }));
});

test("settings normalization is stable", () => {
  const normalized = systems.normalizeSettings({ sfx: 1, music: 0, reducedMotion: "", screenShake: null, highContrast: true, colorblindIndicators: false });
  assert.deepEqual(normalized, {
    sfx: true,
    music: false,
    reducedMotion: false,
    screenShake: false,
    highContrast: true,
    colorblindIndicators: false
  });
});

test("weather rotation and campaign mapping produce known keys", () => {
  assert.equal(systems.weatherForWave("campaign", 1, 1), "heavyDew");
  assert.equal(systems.weatherForWave("campaign", 5, 2), "eclipse");
  const key = systems.weatherForWave("endless", 5, 3);
  assert.ok(Object.keys(systems.WEATHER).includes(key));
});

test("enemy special helper behavior works", () => {
  assert.deepEqual(systems.splitOutcome("splitling"), ["sproutlet", "sproutlet"]);
  assert.deepEqual(systems.splitOutcome("grub"), []);
  const buried = systems.stepBurrowState({ isBurrower: true, buried: false, burrowTimer: 0, burrowedFor: 0 }, 0.1);
  assert.equal(buried.buried, true);
  const resurfaced = systems.stepBurrowState({ isBurrower: true, buried: true, burrowTimer: 2, burrowedFor: 0.01 }, 0.1);
  assert.equal(resurfaced.buried, false);
  assert.equal(resurfaced.resurfaced, true);
});
