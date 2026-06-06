(function defineGameInput(app) {
  "use strict";

  const holeKeyMap = {
    KeyQ: 0,
    KeyW: 1,
    KeyE: 2,
    KeyA: 3,
    KeyS: 4,
    KeyD: 5,
    KeyZ: 6,
    KeyX: 7,
    KeyC: 8,
    Digit7: 0,
    Digit8: 1,
    Digit9: 2,
    Digit4: 3,
    Digit5: 4,
    Digit6: 5,
    Digit1: 6,
    Digit2: 7,
    Digit3: 8,
    Numpad7: 0,
    Numpad8: 1,
    Numpad9: 2,
    Numpad4: 3,
    Numpad5: 4,
    Numpad6: 5,
    Numpad1: 6,
    Numpad2: 7,
    Numpad3: 8,
  };

  function isInteractiveTarget(target) {
    if (!target) {
      return false;
    }

    const tagName = String(target.tagName || "").toUpperCase();
    return (
      target.isContentEditable ||
      tagName === "BUTTON" ||
      tagName === "INPUT" ||
      tagName === "SELECT" ||
      tagName === "TEXTAREA"
    );
  }

  function createGameInput(options) {
    const target = options.target;

    function handleKeydown(event) {
      if (isInteractiveTarget(event.target)) {
        return;
      }

      if (event.code === "Space") {
        event.preventDefault();
        options.onSpace();
        return;
      }

      const holeIndex = holeKeyMap[event.code];
      if (holeIndex === undefined) {
        return;
      }

      event.preventDefault();
      options.onHole(holeIndex);
    }

    function bind() {
      target.addEventListener("keydown", handleKeydown);
    }

    function destroy() {
      target.removeEventListener("keydown", handleKeydown);
    }

    return { bind, destroy, handleKeydown };
  }

  app.holeKeyMap = holeKeyMap;
  app.createGameInput = createGameInput;
})(window.Fushouluo || (window.Fushouluo = {}));
