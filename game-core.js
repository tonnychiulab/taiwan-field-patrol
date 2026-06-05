(function defineGameCore(app) {
  const bestScoreKey = "fushouluo-henduo-best-score";
  const areaRecordsKey = "fushouluo-henduo-area-records-v1";
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

  function createGame({ version, holes, nodes, support }) {
    let score = 0;
    let bestScore = loadBestScore();
    let timeLeft = gameModes.normal.roundSeconds;
    let activeHole = -1;
    let lastHole = -1;
    let gameRunning = false;
    let gamePaused = false;
    let pausedByVisibility = false;
    let tickTimer = 0;
    let spawnTimer = 0;
    let hitTimer = 0;
    let hitsSinceFarmerSwap = 0;
    let currentModeKey = "normal";
    let areaRecords = loadAreaRecords();

    function loadBestScore() {
      try {
        const saved = window.localStorage.getItem(bestScoreKey);
        const parsed = Number(saved);
        return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
      } catch {
        return 0;
      }
    }

    function saveBestScore(nextBestScore) {
      try {
        window.localStorage.setItem(bestScoreKey, String(nextBestScore));
      } catch {
        // Ignore storage failures so the round can still finish normally.
      }
    }

    function createEmptyAreaRecord() {
      return {
        normalBest: 0,
        careBest: 0,
        rounds: 0,
        totalHits: 0,
      };
    }

    function loadAreaRecords() {
      try {
        const saved = window.localStorage.getItem(areaRecordsKey);
        const parsed = JSON.parse(saved || "{}");
        return parsed && typeof parsed === "object" ? parsed : {};
      } catch {
        return {};
      }
    }

    function saveAreaRecords() {
      try {
        window.localStorage.setItem(areaRecordsKey, JSON.stringify(areaRecords));
      } catch {
        // Records are a nice-to-have reward layer; gameplay should not depend on storage.
      }
    }

    function getAreaRecord() {
      const subregion = support.getCurrentSubregion();
      if (!areaRecords[subregion.id]) {
        areaRecords[subregion.id] = createEmptyAreaRecord();
      }
      return areaRecords[subregion.id];
    }

    function getCurrentAreaBest() {
      const record = getAreaRecord();
      return currentModeKey === "care" ? record.careBest : record.normalBest;
    }

    function render() {
      nodes.score.textContent = String(score);
      nodes.bestScore.textContent = String(bestScore);
      nodes.areaBest.textContent = String(getCurrentAreaBest());
      nodes.patrolCount.textContent = String(getAreaRecord().rounds);
      nodes.time.textContent = String(timeLeft);
    }

    function clearActiveHole() {
      if (activeHole < 0) {
        return;
      }

      holes[activeHole].classList.remove("is-snail", "is-hit");
      activeHole = -1;
    }

    function stopTimers() {
      window.clearInterval(tickTimer);
      window.clearTimeout(spawnTimer);
      window.clearTimeout(hitTimer);
      tickTimer = 0;
      spawnTimer = 0;
      hitTimer = 0;
    }

    function updateControlState() {
      if (!gameRunning) {
        nodes.pauseButton.disabled = true;
        nodes.pauseButton.textContent = "暫停";
        nodes.patrolArea.disabled = false;
        return;
      }

      nodes.pauseButton.disabled = false;
      nodes.pauseButton.textContent = gamePaused ? "繼續" : "暫停";
      nodes.patrolArea.disabled = true;
    }

    function getSpawnDelay() {
      const settings = gameModes[currentModeKey];
      const progress = (settings.roundSeconds - timeLeft) / settings.roundSeconds;
      return Math.max(
        settings.minDelay,
        Math.floor(settings.maxDelay - progress * (settings.maxDelay - settings.minDelay) * 0.72)
      );
    }

    function pickHole() {
      clearActiveHole();

      let nextHole = Math.floor(Math.random() * holes.length);
      if (holes.length > 1) {
        while (nextHole === lastHole) {
          nextHole = Math.floor(Math.random() * holes.length);
        }
      }

      activeHole = nextHole;
      lastHole = nextHole;
      holes[activeHole].classList.add("is-snail");

      const nextDelay =
        getSpawnDelay() + Math.floor(Math.random() * gameModes[currentModeKey].randomRange);
      spawnTimer = window.setTimeout(pickHole, nextDelay);
    }

    function syncModeState() {
      currentModeKey = nodes.careModeToggle.checked ? "care" : "normal";
      const settings = gameModes[currentModeKey];
      if (!gameRunning) {
        timeLeft = settings.roundSeconds;
        render();
      }
    }

    function endGame() {
      gameRunning = false;
      gamePaused = false;
      document.body.classList.remove("is-playing");
      stopTimers();
      clearActiveHole();
      if (score > bestScore) {
        bestScore = score;
        saveBestScore(bestScore);
      }
      const record = getAreaRecord();
      const bestKey = currentModeKey === "care" ? "careBest" : "normalBest";
      record.rounds += 1;
      record.totalHits += score;
      if (score > record[bestKey]) {
        record[bestKey] = score;
      }
      saveAreaRecords();
      render();
      const subregion = support.getCurrentSubregion();
      nodes.status.textContent = `收工，你今天打回去了 ${score} 隻福壽螺。`;
      nodes.rewardNote.textContent = `完成 ${subregion.name} 巡田：今天守回 ${score} 隻，這一區已陪你巡了 ${record.rounds} 次。`;
      nodes.startButton.disabled = false;
      nodes.startButton.textContent = "再巡一輪";
      updateControlState();
    }

    function startGame(resetRound = true) {
      if (resetRound) {
        syncModeState();
      }
      const settings = gameModes[currentModeKey];

      if (resetRound) {
        score = 0;
        timeLeft = settings.roundSeconds;
        hitsSinceFarmerSwap = 0;
        lastHole = -1;
        support.rotate(true);
        nodes.rewardNote.textContent = `今天巡 ${support.getCurrentSubregion().name}，慢慢打也算一場正式守田。`;
      }

      gameRunning = true;
      gamePaused = false;
      document.body.classList.add("is-playing");
      render();
      nodes.status.textContent = resetRound
        ? currentModeKey === "care"
          ? "長輩模式已開，慢慢巡田，把福壽螺一隻隻請回去。"
          : "開打，田埂裡的福壽螺又冒出來了。"
        : "繼續巡田，慢慢來也沒關係。";
      nodes.startButton.disabled = true;
      stopTimers();

      if (activeHole < 0) {
        pickHole();
      } else {
        const nextDelay =
          getSpawnDelay() + Math.floor(Math.random() * gameModes[currentModeKey].randomRange);
        spawnTimer = window.setTimeout(pickHole, nextDelay);
      }

      tickTimer = window.setInterval(() => {
        timeLeft -= 1;
        render();

        if (timeLeft <= 0) {
          endGame();
        }
      }, 1000);

      updateControlState();
    }

    function togglePause() {
      if (!gameRunning) {
        return;
      }

      if (gamePaused) {
        pausedByVisibility = false;
        startGame(false);
        return;
      }

      gamePaused = true;
      pausedByVisibility = false;
      stopTimers();
      nodes.status.textContent = "先歇一下，等你準備好再繼續巡田。";
      nodes.startButton.disabled = false;
      nodes.startButton.textContent = "繼續遊戲";
      updateControlState();
    }

    function pauseForVisibility() {
      if (!gameRunning || gamePaused) {
        return;
      }

      gamePaused = true;
      pausedByVisibility = true;
      stopTimers();
      nodes.status.textContent = "畫面先切走了，已幫你暫停，回來再繼續巡田。";
      nodes.startButton.disabled = false;
      nodes.startButton.textContent = "繼續遊戲";
      updateControlState();
    }

    function handleStartButtonClick() {
      startGame(!gamePaused);
    }

    function handleKeydown(event) {
      if (event.code !== "Space") {
        return;
      }

      const activeElement = document.activeElement;
      const isInteractiveTarget =
        activeElement &&
        (activeElement.tagName === "BUTTON" ||
          activeElement.tagName === "SELECT" ||
          activeElement.tagName === "INPUT");

      if (isInteractiveTarget) {
        return;
      }

      event.preventDefault();
      if (gameRunning) {
        togglePause();
        return;
      }

      startGame(true);
    }

    function handleHit(hole, index) {
      if (
        !gameRunning ||
        gamePaused ||
        activeHole !== index ||
        hole.classList.contains("is-hit")
      ) {
        return;
      }

      score += 1;
      hitsSinceFarmerSwap += 1;
      render();
      hole.classList.remove("is-snail");
      hole.classList.add("is-hit");

      if (support.hasRecommendations() && hitsSinceFarmerSwap >= support.rotateEveryHits) {
        hitsSinceFarmerSwap = 0;
        support.rotate(true);
        nodes.status.textContent = support.hitStatus;
      } else {
        nodes.status.textContent = "打中了，繼續巡田。";
      }

      hitTimer = window.setTimeout(() => {
        if (activeHole === index) {
          clearActiveHole();
        }
      }, gameModes[currentModeKey].hitWindow);
    }

    function init() {
      holes.forEach((hole, index) => {
        hole.addEventListener("click", () => handleHit(hole, index));
      });
      nodes.startButton.addEventListener("click", handleStartButtonClick);
      nodes.pauseButton.addEventListener("click", togglePause);
      nodes.careModeToggle.addEventListener("change", syncModeState);
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
          pauseForVisibility();
          return;
        }

        if (pausedByVisibility && gamePaused) {
          nodes.status.textContent = "你回來了，按繼續就能接著巡田。";
        }
      });
      nodes.patrolArea.addEventListener("change", () => {
        support.setSubregion(nodes.patrolArea.value);
        nodes.rewardNote.textContent = `今天巡 ${support.getCurrentSubregion().name}，完成後會留下本區紀錄。`;
        render();
      });
      document.addEventListener("keydown", handleKeydown);
      nodes.version.textContent = `版本 ${version}`;
      support.setupSubregions();
      syncModeState();
      updateControlState();
      render();
      support.load();
    }

    return {
      init,
    };
  }

  app.createGame = createGame;
})(window.Fushouluo || (window.Fushouluo = {}));
