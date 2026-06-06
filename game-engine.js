(function defineGameEngine(app) {
  "use strict";

  const gameModes = {
    normal: {
      roundSeconds: 30,
      minDelay: 300,
      maxDelay: 760,
      randomRange: 120,
      hitWindow: 160,
    },
    care: {
      roundSeconds: 45,
      minDelay: 620,
      maxDelay: 1120,
      randomRange: 180,
      hitWindow: 260,
    },
  };

  function toNonNegativeInteger(value) {
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? Math.floor(number) : 0;
  }

  function normalizeRecord(record) {
    return {
      normalBest: toNonNegativeInteger(record && record.normalBest),
      careBest: toNonNegativeInteger(record && record.careBest),
      rounds: toNonNegativeInteger(record && record.rounds),
      totalHits: toNonNegativeInteger(record && record.totalHits),
    };
  }

  function normalizeRecords(records) {
    const normalized = {};

    if (!records || typeof records !== "object" || Array.isArray(records)) {
      return normalized;
    }

    Object.keys(records).forEach((areaId) => {
      normalized[areaId] = normalizeRecord(records[areaId]);
    });

    return normalized;
  }

  function createGameEngine(options) {
    const settings = options || {};
    const holeCount = Math.max(1, toNonNegativeInteger(settings.holeCount) || 9);
    const recommendationEveryHits = Math.max(
      1,
      toNonNegativeInteger(settings.recommendationEveryHits) || 3
    );
    const random = typeof settings.random === "function" ? settings.random : Math.random;
    const areaRecords = normalizeRecords(settings.areaRecords);

    let score = 0;
    let bestScore = toNonNegativeInteger(settings.bestScore);
    let timeLeft = gameModes.normal.roundSeconds;
    let activeHole = -1;
    let lastHole = -1;
    let running = false;
    let paused = false;
    let hitsSinceRecommendation = 0;
    let modeKey = gameModes[settings.modeKey] ? settings.modeKey : "normal";
    let areaId = String(settings.areaId || "plain");

    timeLeft = gameModes[modeKey].roundSeconds;

    function ensureAreaRecord() {
      if (!areaRecords[areaId]) {
        areaRecords[areaId] = normalizeRecord();
      }
      return areaRecords[areaId];
    }

    function getModeSettings() {
      return gameModes[modeKey];
    }

    function getState() {
      const record = ensureAreaRecord();
      const areaBest = modeKey === "care" ? record.careBest : record.normalBest;

      return {
        score,
        bestScore,
        timeLeft,
        activeHole,
        lastHole,
        running,
        paused,
        modeKey,
        areaId,
        areaBest,
        patrolCount: record.rounds,
      };
    }

    function setArea(nextAreaId) {
      areaId = String(nextAreaId || "plain");
      ensureAreaRecord();
      return getState();
    }

    function setMode(nextModeKey) {
      if (!gameModes[nextModeKey] || running) {
        return false;
      }

      modeKey = nextModeKey;
      timeLeft = getModeSettings().roundSeconds;
      return true;
    }

    function start() {
      score = 0;
      timeLeft = getModeSettings().roundSeconds;
      activeHole = -1;
      lastHole = -1;
      hitsSinceRecommendation = 0;
      running = true;
      paused = false;
      return getState();
    }

    function pause() {
      if (!running || paused) {
        return false;
      }

      paused = true;
      activeHole = -1;
      return true;
    }

    function resume() {
      if (!running || !paused) {
        return false;
      }

      paused = false;
      return true;
    }

    function chooseNextHole() {
      if (holeCount === 1) {
        return 0;
      }

      if (lastHole < 0) {
        return Math.floor(random() * holeCount);
      }

      const candidate = Math.floor(random() * (holeCount - 1));
      return candidate >= lastHole ? candidate + 1 : candidate;
    }

    function spawn() {
      if (!running || paused) {
        return -1;
      }

      activeHole = chooseNextHole();
      lastHole = activeHole;
      return activeHole;
    }

    function clearActiveHole() {
      activeHole = -1;
    }

    function getNextSpawnDelay() {
      const mode = getModeSettings();
      const progress = (mode.roundSeconds - timeLeft) / mode.roundSeconds;
      const delayRange = mode.maxDelay - mode.minDelay;
      const baseDelay = mode.maxDelay - delayRange * progress * 0.72;
      return Math.max(
        mode.minDelay,
        Math.round(baseDelay + random() * mode.randomRange)
      );
    }

    function hit(index) {
      if (!running || paused || index !== activeHole) {
        return { accepted: false };
      }

      activeHole = -1;
      score += 1;
      hitsSinceRecommendation += 1;

      const shouldRotate = hitsSinceRecommendation >= recommendationEveryHits;
      if (shouldRotate) {
        hitsSinceRecommendation = 0;
      }

      return {
        accepted: true,
        score,
        shouldRotate,
        hitWindow: getModeSettings().hitWindow,
      };
    }

    function finishRound() {
      if (!running) {
        return { ended: false };
      }

      running = false;
      paused = false;
      activeHole = -1;
      bestScore = Math.max(bestScore, score);

      const record = ensureAreaRecord();
      const recordKey = modeKey === "care" ? "careBest" : "normalBest";
      record[recordKey] = Math.max(record[recordKey], score);
      record.rounds += 1;
      record.totalHits += score;

      return {
        ended: true,
        score,
        bestScore,
        areaBest: record[recordKey],
        patrolCount: record.rounds,
      };
    }

    function tick() {
      if (!running || paused) {
        return { ended: false };
      }

      timeLeft = Math.max(0, timeLeft - 1);
      return timeLeft === 0 ? finishRound() : { ended: false };
    }

    function getPersistence() {
      return {
        bestScore,
        areaRecords: normalizeRecords(areaRecords),
      };
    }

    return {
      clearActiveHole,
      finishRound,
      getModeSettings,
      getNextSpawnDelay,
      getPersistence,
      getState,
      hit,
      pause,
      resume,
      setArea,
      setMode,
      spawn,
      start,
      tick,
    };
  }

  app.gameModes = gameModes;
  app.createGameEngine = createGameEngine;
})(window.Fushouluo || (window.Fushouluo = {}));
