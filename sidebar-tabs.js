(function defineSidebarTabs(app) {
  "use strict";

  function createSidebarTabs({ tabs, panels, mediaQuery }) {
    let activeIndex = 0;

    function isMobile() {
      return Boolean(mediaQuery && mediaQuery.matches);
    }

    function render() {
      const mobile = isMobile();

      tabs.forEach((tab, index) => {
        const selected = index === activeIndex;
        tab.setAttribute("aria-selected", String(selected));
        tab.tabIndex = selected ? 0 : -1;
        panels[index].hidden = mobile ? false : !selected;
        panels[index].setAttribute("role", mobile ? "region" : "tabpanel");
      });
    }

    function select(index, moveFocus = false) {
      activeIndex = (index + tabs.length) % tabs.length;
      render();

      if (moveFocus && !isMobile()) {
        tabs[activeIndex].focus();
      }
    }

    function handleKeydown(event, index) {
      const keyTargets = {
        ArrowLeft: index - 1,
        ArrowRight: index + 1,
        Home: 0,
        End: tabs.length - 1,
      };
      const targetIndex = keyTargets[event.key];

      if (targetIndex === undefined) {
        return;
      }

      event.preventDefault();
      select(targetIndex, true);
    }

    function init() {
      tabs.forEach((tab, index) => {
        tab.addEventListener("click", () => select(index));
        tab.addEventListener("keydown", (event) => handleKeydown(event, index));
      });

      if (mediaQuery) {
        if (mediaQuery.addEventListener) {
          mediaQuery.addEventListener("change", render);
        } else {
          mediaQuery.addListener(render);
        }
      }

      render();
    }

    return { init, select };
  }

  app.createSidebarTabs = createSidebarTabs;
})(window.Fushouluo || (window.Fushouluo = {}));
