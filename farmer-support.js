(function defineFarmerSupport(app) {
  function sanitizeText(value, fallback) {
    const text = String(value || "").trim();
    return text || fallback;
  }

  function shortenText(value, fallback, maxLength = 44) {
    const text = sanitizeText(value, fallback);
    if (text.length <= maxLength) {
      return text;
    }

    return `${text.slice(0, maxLength - 1)}...`;
  }

  function shuffle(array) {
    const result = [...array];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
    }
    return result;
  }

  function createFarmerSupport({ region, nodes, fetcher = window.fetch }) {
    const defaultSubregionId = region.defaultSubregionId || region.subregions[0].id;
    let currentSubregionId = defaultSubregionId;
    let allFarmers = [];
    let farmers = [];
    let currentFarmerIndex = -1;
    let loadState = "idle";

    const helpers = {
      sanitizeText,
      shortenText,
    };

    function updateNavigationState() {
      const total = farmers.length;
      if (!total) {
        nodes.count.textContent =
          loadState === "loading" ? "資料載入中" : "本區目前沒有可輪播資料";
        nodes.prev.disabled = true;
        nodes.next.disabled = true;
        return;
      }

      const currentNumber = currentFarmerIndex >= 0 ? currentFarmerIndex + 1 : 1;
      nodes.count.textContent =
        total === 1 ? "本區目前先顯示這 1 位" : `第 ${currentNumber} / ${total} 位`;
      const disabled = total <= 1;
      nodes.prev.disabled = disabled;
      nodes.next.disabled = disabled;
    }

    function renderFarmerCard(farmer) {
      nodes.name.textContent = farmer.name;
      nodes.products.textContent = `主力作物：${shortenText(farmer.products, "以官方資料為準", 38)}`;
      nodes.location.textContent = farmer.location;
      nodes.tel.textContent = shortenText(farmer.tel, "官方資料未提供", 18);
      nodes.map.href = region.buildMapUrl(farmer);

      const parts = [farmer.status, farmer.verifier];
      if (farmer.effectiveDate) {
        parts.push(`更新 ${farmer.effectiveDate}`);
      }
      nodes.status.textContent = parts.join("｜");
      updateNavigationState();
    }

    function renderFallback() {
      const fallback = region.fallback;
      nodes.name.textContent = fallback.name;
      nodes.products.textContent = fallback.products;
      nodes.location.textContent = fallback.location;
      nodes.tel.textContent = fallback.tel;
      nodes.status.textContent = fallback.status;
      nodes.map.href = fallback.mapUrl;
      nodes.source.href = region.source.url;
      nodes.source.textContent = region.source.label;
      updateNavigationState();
    }

    function getSubregionMapUrl() {
      const subregion = getCurrentSubregion();
      if (region.buildSubregionMapUrl) {
        return region.buildSubregionMapUrl(subregion);
      }

      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        subregion.mapQuery || `${region.county} ${subregion.name}`
      )}`;
    }

    function renderLoading() {
      const subregion = getCurrentSubregion();
      nodes.name.textContent = `載入${subregion.name}農友資料中`;
      nodes.products.textContent = region.loading.products;
      nodes.location.textContent = `${region.county} ${subregion.name}`;
      nodes.tel.textContent = region.loading.tel;
      nodes.status.textContent = region.loading.status;
      nodes.map.href = getSubregionMapUrl();
      nodes.source.href = region.source.url;
      nodes.source.textContent = region.source.label;
      updateNavigationState();
    }

    function renderEmptySubregion() {
      const subregion = getCurrentSubregion();
      nodes.name.textContent = `${subregion.name}目前沒有可顯示的農友資料`;
      nodes.products.textContent = "主力作物：官方公開資料目前沒有本區名單";
      nodes.location.textContent = `${region.county} ${subregion.name}`;
      nodes.tel.textContent = "官方資料未提供";
      nodes.status.textContent = "可切換其他巡田區，或開啟地圖看看本區。";
      nodes.map.href = getSubregionMapUrl();
      nodes.source.href = region.source.url;
      nodes.source.textContent = region.source.label;
      updateNavigationState();
    }

    function getCurrentSubregion() {
      return (
        region.subregions.find((subregion) => subregion.id === currentSubregionId) ||
        region.subregions[0]
      );
    }

    function renderSubregionNote() {
      const subregion = getCurrentSubregion();
      nodes.patrolAreaNote.textContent = subregion.description;
    }

    function populateSubregionOptions() {
      nodes.patrolArea.innerHTML = "";
      region.subregions.forEach((subregion) => {
        const option = document.createElement("option");
        option.value = subregion.id;
        option.textContent = subregion.name;
        nodes.patrolArea.append(option);
      });
      nodes.patrolArea.value = currentSubregionId;
      renderSubregionNote();
    }

    function applySubregionFilter() {
      farmers = [];
      currentFarmerIndex = -1;

      if (loadState === "loading" || loadState === "idle") {
        renderLoading();
        return;
      }

      if (loadState === "error") {
        renderFallback();
        return;
      }

      const selected = allFarmers.filter((farmer) => farmer.subregionId === currentSubregionId);
      farmers = shuffle(selected);

      if (farmers.length) {
        rotate(true);
      } else {
        renderEmptySubregion();
      }
    }

    function setSubregion(subregionId) {
      currentSubregionId = region.subregions.some((subregion) => subregion.id === subregionId)
        ? subregionId
        : defaultSubregionId;
      nodes.patrolArea.value = currentSubregionId;
      renderSubregionNote();
      applySubregionFilter();
    }

    function rotate(forceNext = false) {
      if (!farmers.length) {
        updateNavigationState();
        return;
      }

      if (currentFarmerIndex < 0 || forceNext) {
        currentFarmerIndex = (currentFarmerIndex + 1) % farmers.length;
      }

      renderFarmerCard(farmers[currentFarmerIndex]);
    }

    function shiftCurrent(offset) {
      if (!farmers.length) {
        updateNavigationState();
        return;
      }

      currentFarmerIndex = (currentFarmerIndex + offset + farmers.length) % farmers.length;
      renderFarmerCard(farmers[currentFarmerIndex]);
    }

    function showPrevious() {
      shiftCurrent(-1);
    }

    function showNext() {
      shiftCurrent(1);
    }

    async function load() {
      loadState = "loading";
      applySubregionFilter();

      try {
        const response = await fetcher(region.dataUrl, {
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const payload = await response.json();
        const entries = Array.isArray(payload) ? payload : [];
        allFarmers = entries.map((entry) => region.normalizeFarmer(entry, helpers)).filter(Boolean);

        if (!allFarmers.length) {
          throw new Error(`No ${region.name} farmers in dataset`);
        }

        loadState = "loaded";
        applySubregionFilter();
      } catch {
        loadState = "error";
        allFarmers = [];
        farmers = [];
        currentFarmerIndex = -1;
        renderFallback();
      }
    }

    return {
      rotateEveryHits: region.recommendation.rotateEveryHits,
      hitStatus: region.recommendation.hitStatus,
      getCurrentSubregion,
      hasRecommendations: () => farmers.length > 0,
      load,
      rotate,
      showNext,
      showPrevious,
      setSubregion,
      setupSubregions: populateSubregionOptions,
    };
  }

  app.createFarmerSupport = createFarmerSupport;
})(window.Fushouluo || (window.Fushouluo = {}));
