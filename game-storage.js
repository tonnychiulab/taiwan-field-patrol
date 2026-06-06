(function defineGameStorage(app) {
  "use strict";

  const storageKeys = {
    bestScore: "fushouluo-henduo-best-score",
    areaRecords: "fushouluo-henduo-area-records-v1",
  };

  function createGameStorage(storage) {
    let target = storage;

    if (!target) {
      try {
        target = window.localStorage;
      } catch (_error) {
        target = null;
      }
    }

    function loadBestScore() {
      if (!target) {
        return 0;
      }

      try {
        const value = Number.parseInt(target.getItem(storageKeys.bestScore) || "0", 10);
        return Number.isFinite(value) && value >= 0 ? value : 0;
      } catch (_error) {
        return 0;
      }
    }

    function loadAreaRecords() {
      if (!target) {
        return {};
      }

      try {
        const parsed = JSON.parse(target.getItem(storageKeys.areaRecords) || "{}");
        return parsed && typeof parsed === "object" && !Array.isArray(parsed)
          ? parsed
          : {};
      } catch (_error) {
        return {};
      }
    }

    function load() {
      return {
        bestScore: loadBestScore(),
        areaRecords: loadAreaRecords(),
      };
    }

    function save(snapshot) {
      if (!target) {
        return false;
      }

      try {
        target.setItem(storageKeys.bestScore, String(snapshot.bestScore || 0));
        target.setItem(storageKeys.areaRecords, JSON.stringify(snapshot.areaRecords || {}));
        return true;
      } catch (_error) {
        return false;
      }
    }

    return { load, save };
  }

  app.gameStorageKeys = storageKeys;
  app.createGameStorage = createGameStorage;
})(window.Fushouluo || (window.Fushouluo = {}));
