(function bootstrap(app) {
  const gameVersion = "v0.13.2";
  const gameMessages = {
    earlyFinish: "今天辛苦了，休息一下吧！",
  };
  const regionPack = app.regions.yilan;

  document.querySelector("#keyboardHint").textContent = app.getGameInputHint();

  app
    .createSidebarTabs({
      tabs: Array.from(document.querySelectorAll('[role="tab"]')),
      panels: [
        document.querySelector("#patrolPanel"),
        document.querySelector("#farmerPanel"),
      ],
      mediaQuery: window.matchMedia("(max-width: 900px)"),
    })
    .init();

  const farmerSupport = app.createFarmerSupport({
    region: regionPack,
    nodes: {
      patrolArea: document.querySelector("#patrolArea"),
      patrolAreaNote: document.querySelector("#patrolAreaNote"),
      name: document.querySelector("#farmerName"),
      products: document.querySelector("#farmerProducts"),
      location: document.querySelector("#farmerLocation"),
      tel: document.querySelector("#farmerTel"),
      status: document.querySelector("#farmerStatus"),
      prev: document.querySelector("#farmerPrev"),
      next: document.querySelector("#farmerNext"),
      count: document.querySelector("#farmerCount"),
      map: document.querySelector("#farmerMap"),
      source: document.querySelector("#farmerSource"),
    },
  });

  const game = app.createGame({
    version: gameVersion,
    messages: gameMessages,
    holes: Array.from(document.querySelectorAll(".hole")),
    support: farmerSupport,
    nodes: {
      score: document.querySelector("#score"),
      bestScore: document.querySelector("#bestScore"),
      areaBest: document.querySelector("#areaBest"),
      patrolCount: document.querySelector("#patrolCount"),
      time: document.querySelector("#time"),
      status: document.querySelector("#status"),
      rewardNote: document.querySelector("#rewardNote"),
      startButton: document.querySelector("#startButton"),
      pauseButton: document.querySelector("#pauseButton"),
      finishButton: document.querySelector("#finishButton"),
      supportPrev: document.querySelector("#farmerPrev"),
      supportNext: document.querySelector("#farmerNext"),
      patrolArea: document.querySelector("#patrolArea"),
      version: document.querySelector("#version"),
      careModeToggle: document.querySelector("#careModeToggle"),
      encouragementDialog: document.querySelector("#encouragementDialog"),
      encouragementText: document.querySelector("#encouragementText"),
      encouragementClose: document.querySelector("#encouragementClose"),
    },
  });

  game.init();
})(window.Fushouluo);
