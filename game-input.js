(function defineGameInput(app) {
  "use strict";

  const inputSchemes = [
    {
      label: "字母鍵",
      rows: [
        ["Q", "W", "E"],
        ["A", "S", "D"],
        ["Z", "X", "C"],
      ],
      codePrefixes: ["Key"],
    },
    {
      label: "數字鍵",
      rows: [
        ["7", "8", "9"],
        ["4", "5", "6"],
        ["1", "2", "3"],
      ],
      codePrefixes: ["Digit", "Numpad"],
      useRangesInHint: true,
    },
  ];

  function createHoleKeyMap() {
    const keyMap = {};

    inputSchemes.forEach((scheme) => {
      scheme.rows.flat().forEach((key, holeIndex) => {
        scheme.codePrefixes.forEach((prefix) => {
          keyMap[`${prefix}${key}`] = holeIndex;
        });
      });
    });

    return keyMap;
  }

  function formatRows(scheme) {
    return scheme.rows
      .map((row) =>
        scheme.useRangesInHint ? `${row[0]}-${row[row.length - 1]}` : row.join("")
      )
      .join(" / ");
  }

  function getGameInputHint() {
    const [letters, numbers] = inputSchemes;
    return `快速鍵：${formatRows(letters)} 對應九宮格，也可用${
      numbers.label
    } ${formatRows(numbers)}。`;
  }

  const holeKeyMap = createHoleKeyMap();

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
  app.inputSchemes = inputSchemes;
  app.getGameInputHint = getGameInputHint;
  app.createGameInput = createGameInput;
})(window.Fushouluo || (window.Fushouluo = {}));
