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

    const helpers = {
      sanitizeText,
      shortenText,
    };

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
      const selected = allFarmers.filter((farmer) => farmer.subregionId === currentSubregionId);
      farmers = selected.length ? shuffle(selected) : shuffle(allFarmers);
      currentFarmerIndex = -1;

      if (farmers.length) {
        rotate(true);
      } else {
        renderFallback();
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
        return;
      }

      if (currentFarmerIndex < 0 || forceNext) {
        currentFarmerIndex = (currentFarmerIndex + 1) % farmers.length;
      }

      renderFarmerCard(farmers[currentFarmerIndex]);
    }

    async function load() {
      renderFallback();
      nodes.name.textContent = region.loading.name;
      nodes.products.textContent = region.loading.products;
      nodes.tel.textContent = region.loading.tel;
      nodes.status.textContent = region.loading.status;

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

        applySubregionFilter();
      } catch {
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
      setSubregion,
      setupSubregions: populateSubregionOptions,
    };
  }

  app.createFarmerSupport = createFarmerSupport;
})(window.Fushouluo || (window.Fushouluo = {}));
