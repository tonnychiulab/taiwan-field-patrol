(function defineYilanRegion(app) {
  const yilanCounty = "宜蘭縣";
  const subregions = [
    {
      id: "plain",
      name: "蘭陽平原",
      description: "宜蘭、羅東、員山、冬山、三星、五結一帶的稻田與農村。",
      keywords: [
        "宜蘭市",
        "羅東鎮",
        "員山鄉",
        "冬山鄉",
        "三星鄉",
        "五結鄉",
        "礁溪鄉",
      ],
      mapQuery: "宜蘭縣 蘭陽平原",
    },
    {
      id: "mountain",
      name: "山區聚落",
      description: "大同、南澳與山邊聚落，巡田路遠，慢慢來。",
      keywords: ["大同鄉", "南澳鄉"],
      mapQuery: "宜蘭縣 大同鄉 南澳鄉",
    },
    {
      id: "coast",
      name: "海線農村",
      description: "頭城、壯圍、蘇澳一帶，農地、海風與聚落交錯。",
      keywords: ["頭城鎮", "壯圍鄉", "蘇澳鎮"],
      mapQuery: "宜蘭縣 海線農村",
    },
    {
      id: "remote",
      name: "離島與偏遠區",
      description: "資料不足時保留給龜山島、偏遠路段與特殊交通地點。",
      keywords: ["龜山島", "偏遠", "離島"],
      mapQuery: "宜蘭縣 龜山島",
    },
  ];

  function buildMapUrl(farmer) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
      farmer.address
    )}`;
  }

  function buildSubregionMapUrl(subregion) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      subregion.mapQuery
    )}`;
  }

  function findSubregion(address) {
    return (
      subregions.find((subregion) =>
        subregion.keywords.some((keyword) => address.includes(keyword))
      ) || subregions[0]
    );
  }

  function normalizeFarmer(entry, helpers) {
    const name = helpers.sanitizeText(entry.Name, "");
    const products = helpers.sanitizeText(entry.Products || entry.Product, "");
    const address = helpers.sanitizeText(entry.Address || entry.MailingAddress, "");

    if (!name || !address.includes(yilanCounty)) {
      return null;
    }

    const subregion = findSubregion(address);

    return {
      name,
      products: products || "以官方資料為準",
      address,
      location: helpers.shortenText(address.replace(yilanCounty, `${yilanCounty} `), yilanCounty, 26),
      subregionId: subregion.id,
      tel: helpers.sanitizeText(entry.Tel, "官方資料未提供"),
      status: helpers.sanitizeText(entry.Status, "官方資料更新中"),
      verifier: helpers.sanitizeText(entry.CompanyName, "農業部公開資料"),
      effectiveDate: helpers.sanitizeText(entry.EffectiveDate, ""),
    };
  }

  app.regions = app.regions || {};
  app.regions.yilan = {
    id: "yilan",
    name: "宜蘭",
    county: yilanCounty,
    defaultSubregionId: "plain",
    subregions,
    dataUrl:
      "https://data.moa.gov.tw/Service/OpenData/Traceability/TraceabilityOrganic.aspx?IsTransData=1&UnitId=D45&$filter=Address%20like%20宜蘭縣",
    source: {
      label: "農業部有機農業資訊",
      url: "https://data.gov.tw/dataset/49444",
    },
    recommendation: {
      rotateEveryHits: 3,
      hitStatus: "打中了，也順手認識一位宜蘭農友。",
    },
    loading: {
      name: "載入宜蘭農友資料中",
      products: "正在向農業部公開資料取回最新名單。",
      tel: "載入中",
      status: "遊戲進行中會輪流推薦不同農友。",
    },
    fallback: {
      name: "宜蘭在地農友資料暫時連不上",
      products: "稍後重整頁面再試，這裡會直接串農業部公開資料。",
      location: yilanCounty,
      tel: "稍後再試",
      status: "官方資料暫時無法取得，遊戲仍可正常進行。",
      mapUrl: "https://www.google.com/maps/search/?api=1&query=%E5%AE%9C%E8%98%AD%E7%B8%A3",
    },
    buildMapUrl,
    buildSubregionMapUrl,
    normalizeFarmer,
  };
})(window.Fushouluo || (window.Fushouluo = {}));
