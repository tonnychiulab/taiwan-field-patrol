(function defineGameCore(app) {
  "use strict";

  function createGame({ version, holes, nodes, support }) {
    const storage = app.createGameStorage();
    const savedState = storage.load();
    const engine = app.createGameEngine({
      holeCount: holes.length,
      bestScore: savedState.bestScore,
      areaRecords: savedState.areaRecords,
      areaId: support.getCurrentSubregion().id,
      recommendationEveryHits: support.rotateEveryHits,
    });

    let pausedByVisibility = false;
    let tickTimer = 0;
    let spawnTimer = 0;
    let hitTimer = 0;

    function render() {
      const state = engine.getState();
      nodes.score.textContent = String(state.score);
      nodes.bestScore.textContent = String(state.bestScore);
      nodes.areaBest.textContent = String(state.areaBest);
      nodes.patrolCount.textContent = String(state.patrolCount);
      nodes.time.textContent = String(state.timeLeft);
    }

    function clearBoard() {
      holes.forEach((hole) => {
        hole.classList.remove("is-snail", "is-hit");
      });
      engine.clearActiveHole();
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
      const state = engine.getState();

      if (!state.running) {
        nodes.pauseButton.disabled = true;
        nodes.pauseButton.textContent = "暫停";
        nodes.patrolArea.disabled = false;
        return;
      }

      nodes.pauseButton.disabled = false;
      nodes.pauseButton.textContent = state.paused ? "繼續" : "暫停";
      nodes.patrolArea.disabled = true;
    }

    function scheduleNextSnail() {
      clearBoard();
      const nextHole = engine.spawn();
      if (nextHole < 0) {
        return;
      }

      holes[nextHole].classList.add("is-snail");
      spawnTimer = window.setTimeout(
        scheduleNextSnail,
        engine.getNextSpawnDelay()
      );
    }

    function syncModeState() {
      engine.setMode(nodes.careModeToggle.checked ? "care" : "normal");
      render();
    }

    function finishRound(result) {
      document.body.classList.remove("is-playing");
      stopTimers();
      clearBoard();
      storage.save(engine.getPersistence());
      render();

      const subregion = support.getCurrentSubregion();
      nodes.status.textContent = `收工，你今天打回去了 ${result.score} 隻福壽螺。`;
      nodes.rewardNote.textContent = `完成 ${subregion.name} 巡田：今天守回 ${result.score} 隻，這一區已陪你巡了 ${result.patrolCount} 次。`;
      nodes.startButton.disabled = false;
      nodes.startButton.textContent = "再巡一輪";
      updateControlState();
    }

    function startTimers() {
      scheduleNextSnail();
      tickTimer = window.setInterval(() => {
        const result = engine.tick();
        render();

        if (result.ended) {
          finishRound(result);
        }
      }, 1000);
    }

    function startGame() {
      syncModeState();
      engine.setArea(support.getCurrentSubregion().id);
      engine.start();
      pausedByVisibility = false;
      support.rotate(true);
      nodes.rewardNote.textContent = `今天巡 ${support.getCurrentSubregion().name}，慢慢打也算一場正式守田。`;
      document.body.classList.add("is-playing");
      render();

      nodes.status.textContent =
        engine.getState().modeKey === "care"
          ? "長輩模式已開，慢慢巡田，把福壽螺一隻隻請回去。"
          : "開打，田埂裡的福壽螺又冒出來了。";
      nodes.startButton.disabled = true;
      stopTimers();
      clearBoard();
      startTimers();
      updateControlState();
    }

    function resumeGame() {
      if (!engine.resume()) {
        return;
      }

      pausedByVisibility = false;
      document.body.classList.add("is-playing");
      nodes.status.textContent = "繼續巡田，慢慢來也沒關係。";
      nodes.startButton.disabled = true;
      stopTimers();
      clearBoard();
      startTimers();
      render();
      updateControlState();
    }

    function pauseGame(visibilityPause) {
      if (!engine.pause()) {
        return;
      }

      pausedByVisibility = visibilityPause;
      stopTimers();
      clearBoard();
      nodes.status.textContent = visibilityPause
        ? "畫面先切走了，已幫你暫停，回來再繼續巡田。"
        : "先歇一下，等你準備好再繼續巡田。";
      nodes.startButton.disabled = false;
      nodes.startButton.textContent = "繼續遊戲";
      render();
      updateControlState();
    }

    function togglePause() {
      const state = engine.getState();
      if (!state.running) {
        return;
      }

      if (state.paused) {
        resumeGame();
        return;
      }

      pauseGame(false);
    }

    function handleStartButtonClick() {
      if (engine.getState().paused) {
        resumeGame();
        return;
      }

      startGame();
    }

    function handleHit(hole, index) {
      if (hole.classList.contains("is-hit")) {
        return;
      }

      const result = engine.hit(index);
      if (!result.accepted) {
        return;
      }

      render();
      hole.classList.remove("is-snail");
      hole.classList.add("is-hit");

      if (support.hasRecommendations() && result.shouldRotate) {
        support.rotate(true);
        nodes.status.textContent = support.hitStatus;
      } else {
        nodes.status.textContent = "打中了，繼續巡田。";
      }

      window.clearTimeout(hitTimer);
      hitTimer = window.setTimeout(() => {
        hole.classList.remove("is-hit");
      }, result.hitWindow);
    }

    function handleAreaChange() {
      support.setSubregion(nodes.patrolArea.value);
      engine.setArea(support.getCurrentSubregion().id);
      nodes.rewardNote.textContent = `今天巡 ${support.getCurrentSubregion().name}，完成後會留下本區紀錄。`;
      render();
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        pauseGame(true);
        return;
      }

      if (pausedByVisibility && engine.getState().paused) {
        nodes.status.textContent = "你回來了，按繼續就能接著巡田。";
      }
    }

    function init() {
      holes.forEach((hole, index) => {
        hole.addEventListener("click", () => handleHit(hole, index));
      });
      nodes.startButton.addEventListener("click", handleStartButtonClick);
      nodes.pauseButton.addEventListener("click", togglePause);
      nodes.careModeToggle.addEventListener("change", syncModeState);
      nodes.supportPrev?.addEventListener("click", support.showPrevious);
      nodes.supportNext?.addEventListener("click", support.showNext);
      nodes.patrolArea.addEventListener("change", handleAreaChange);
      document.addEventListener("visibilitychange", handleVisibilityChange);

      app
        .createGameInput({
          target: document,
          onSpace: () => {
            const state = engine.getState();
            if (state.running) {
              togglePause();
            } else {
              startGame();
            }
          },
          onHole: (index) => handleHit(holes[index], index),
        })
        .bind();

      nodes.version.textContent = `版本 ${version}`;
      support.setupSubregions();
      engine.setArea(support.getCurrentSubregion().id);
      syncModeState();
      updateControlState();
      render();
      support.load();
    }

    return { init };
  }

  app.createGame = createGame;
})(window.Fushouluo || (window.Fushouluo = {}));
