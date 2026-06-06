(function bootstrap(app) {
  const gameVersion = "v0.12.1";
  const regionPack = app.regions.yilan;

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
      supportPrev: document.querySelector("#farmerPrev"),
      supportNext: document.querySelector("#farmerNext"),
      patrolArea: document.querySelector("#patrolArea"),
      version: document.querySelector("#version"),
      careModeToggle: document.querySelector("#careModeToggle"),
    },
  });

  game.init();
})(window.Fushouluo);
