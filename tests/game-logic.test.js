"use strict";

const assert = require("node:assert/strict");
const path = require("node:path");

global.window = { Fushouluo: {} };

require(path.join(__dirname, "..", "game-engine.js"));
require(path.join(__dirname, "..", "game-storage.js"));
require(path.join(__dirname, "..", "game-input.js"));
require(path.join(__dirname, "..", "game-core.js"));

const app = global.window.Fushouluo;

function testEngineRound() {
  const randomValues = [0, 0, 0.5, 0.25];
  const engine = app.createGameEngine({
    holeCount: 9,
    bestScore: 2,
    areaId: "test-area",
    recommendationEveryHits: 2,
    random: () => randomValues.shift() || 0,
  });

  assert.equal(engine.getState().timeLeft, 30);
  engine.start();

  const firstHole = engine.spawn();
  assert.equal(firstHole, 0);
  assert.deepEqual(engine.hit(8), { accepted: false });
  assert.equal(engine.hit(firstHole).accepted, true);

  const secondHole = engine.spawn();
  assert.notEqual(secondHole, firstHole);
  assert.equal(engine.hit(secondHole).shouldRotate, true);

  for (let second = 0; second < 30; second += 1) {
    engine.tick();
  }

  const state = engine.getState();
  const persistence = engine.getPersistence();
  assert.equal(state.running, false);
  assert.equal(state.bestScore, 2);
  assert.equal(state.areaBest, 2);
  assert.equal(state.patrolCount, 1);
  assert.equal(persistence.areaRecords["test-area"].totalHits, 2);
}

function testEnginePauseAndMode() {
  const engine = app.createGameEngine({ modeKey: "care" });
  assert.equal(engine.getState().timeLeft, 45);

  engine.start();
  engine.spawn();
  assert.equal(engine.pause(), true);
  assert.equal(engine.getState().activeHole, -1);
  assert.equal(engine.tick().ended, false);
  assert.equal(engine.getState().timeLeft, 45);
  assert.equal(engine.resume(), true);
}

function testStorageFallbackAndSave() {
  const values = new Map([
    [app.gameStorageKeys.bestScore, "7"],
    [app.gameStorageKeys.areaRecords, '{"plain":{"normalBest":5}}'],
  ]);
  const storage = {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, value),
  };
  const gameStorage = app.createGameStorage(storage);

  assert.equal(gameStorage.load().bestScore, 7);
  assert.equal(gameStorage.load().areaRecords.plain.normalBest, 5);
  assert.equal(gameStorage.save({ bestScore: 9, areaRecords: {} }), true);
  assert.equal(values.get(app.gameStorageKeys.bestScore), "9");
}

function testKeyboardInput() {
  const hits = [];
  let toggles = 0;
  let prevented = 0;
  const input = app.createGameInput({
    target: { addEventListener() {}, removeEventListener() {} },
    onSpace: () => {
      toggles += 1;
    },
    onHole: (index) => hits.push(index),
  });

  input.handleKeydown({
    code: "KeyQ",
    target: { tagName: "DIV" },
    preventDefault: () => {
      prevented += 1;
    },
  });
  input.handleKeydown({
    code: "Numpad3",
    target: { tagName: "DIV" },
    preventDefault: () => {
      prevented += 1;
    },
  });
  input.handleKeydown({
    code: "Space",
    target: { tagName: "DIV" },
    preventDefault: () => {
      prevented += 1;
    },
  });
  input.handleKeydown({
    code: "KeyW",
    target: { tagName: "INPUT" },
    preventDefault: () => {
      prevented += 1;
    },
  });

  assert.deepEqual(hits, [0, 8]);
  assert.equal(toggles, 1);
  assert.equal(prevented, 3);
}

function createClassList() {
  const values = new Set();
  return {
    add: (...names) => names.forEach((name) => values.add(name)),
    contains: (name) => values.has(name),
    remove: (...names) => names.forEach((name) => values.delete(name)),
  };
}

function createNode() {
  const listeners = {};
  return {
    checked: false,
    classList: createClassList(),
    disabled: false,
    textContent: "",
    value: "plain",
    addEventListener(type, listener) {
      listeners[type] = listener;
    },
    dispatch(type, event) {
      listeners[type](event || { target: this });
    },
  };
}

function testGameControllerIntegration() {
  const documentListeners = {};
  const timers = new Map();
  let nextTimerId = 1;
  const storageValues = new Map();

  global.document = {
    activeElement: null,
    hidden: false,
    body: { classList: createClassList() },
    addEventListener(type, listener) {
      documentListeners[type] = listener;
    },
  };
  global.window.localStorage = {
    getItem: (key) => storageValues.get(key) || null,
    setItem: (key, value) => storageValues.set(key, value),
  };
  global.window.setTimeout = (callback) => {
    const id = nextTimerId;
    nextTimerId += 1;
    timers.set(id, callback);
    return id;
  };
  global.window.setInterval = global.window.setTimeout;
  global.window.clearTimeout = (id) => timers.delete(id);
  global.window.clearInterval = global.window.clearTimeout;

  const holes = Array.from({ length: 9 }, createNode);
  const nodes = {
    score: createNode(),
    bestScore: createNode(),
    areaBest: createNode(),
    patrolCount: createNode(),
    time: createNode(),
    status: createNode(),
    rewardNote: createNode(),
    startButton: createNode(),
    pauseButton: createNode(),
    supportPrev: createNode(),
    supportNext: createNode(),
    patrolArea: createNode(),
    version: createNode(),
    careModeToggle: createNode(),
  };
  const support = {
    hitStatus: "換一位農友",
    rotateEveryHits: 3,
    getCurrentSubregion: () => ({ id: nodes.patrolArea.value, name: "測試田區" }),
    hasRecommendations: () => true,
    load() {},
    rotate() {},
    setSubregion(value) {
      nodes.patrolArea.value = value;
    },
    setupSubregions() {},
    showNext() {},
    showPrevious() {},
  };

  const game = app.createGame({ version: "v-test", holes, nodes, support });
  game.init();
  nodes.startButton.dispatch("click");

  assert.equal(nodes.version.textContent, "版本 v-test");
  assert.equal(global.document.body.classList.contains("is-playing"), true);
  assert.equal(holes.filter((hole) => hole.classList.contains("is-snail")).length, 1);

  const activeIndex = holes.findIndex((hole) => hole.classList.contains("is-snail"));
  holes[activeIndex].dispatch("click");
  assert.equal(nodes.score.textContent, "1");
  assert.equal(holes[activeIndex].classList.contains("is-hit"), true);

  nodes.pauseButton.dispatch("click");
  assert.equal(nodes.pauseButton.textContent, "繼續");
  assert.equal(holes.some((hole) => hole.classList.contains("is-snail")), false);

  nodes.startButton.dispatch("click");
  assert.equal(nodes.pauseButton.textContent, "暫停");
  assert.equal(holes.filter((hole) => hole.classList.contains("is-snail")).length, 1);

  const keyboardIndex = holes.findIndex((hole) => hole.classList.contains("is-snail"));
  const code = Object.keys(app.holeKeyMap).find(
    (key) => key.startsWith("Key") && app.holeKeyMap[key] === keyboardIndex
  );
  documentListeners.keydown({
    code,
    target: { tagName: "DIV" },
    preventDefault() {},
  });
  assert.equal(nodes.score.textContent, "2");
}

testEngineRound();
testEnginePauseAndMode();
testStorageFallbackAndSave();
testKeyboardInput();
testGameControllerIntegration();

console.log("game logic tests passed");
