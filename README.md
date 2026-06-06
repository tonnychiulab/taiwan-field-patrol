# 福壽螺很多

一個用原生 HTML/CSS/JS 做的小型打擊福壽螺遊戲。專案目標是維持低技術門檻，讓想推廣台灣在地小農的人可以一起擴充地區資料與畫面風格。

## 線上頁面

已發布在 GitHub Pages：

https://tonnychiulab.github.io/taiwan-field-patrol/

GitHub Pages 使用 repository root 發布，因為專案入口就是 `index.html`。

設定方式：

1. 到 GitHub repository 的 Settings。
2. 打開 Pages。
3. Source 選 `Deploy from a branch`。
4. Branch 選 `master`，資料夾選 `/root`。
5. 儲存後等待 GitHub 產生頁面網址。

## 技術範圍

- 不使用框架、打包器或新的相依套件。
- 頁面可直接開啟 `index.html` 執行。
- JavaScript 以多檔案原生 script 切分，透過 `window.Fushouluo` 共用模組。

## 模組切分

- `game.js`：入口檔，只負責選擇目前地區包、查 DOM、啟動遊戲。
- `game-engine.js`：不依賴畫面的純玩法核心，管理回合、分數、出螺、打擊判定與區域紀錄。
- `game-core.js`：畫面與計時控制器，負責把玩法核心接到 DOM、動畫與小農推薦。
- `game-input.js`：鍵盤與數字鍵盤的九宮格輸入。
- `game-storage.js`：最高分與區域紀錄的本機儲存。
- `farmer-support.js`：小農推薦卡流程，包含抓資料、輪播、Google 地圖連結、失敗 fallback。
- `regions/yilan.js`：第一個 region pack，定義宜蘭資料來源、欄位轉換、顯示文字與地圖連結。
- `style.css`、`sidebar.css`、`field.css`、`mobile.css`：共用、側欄、田區與手機版樣式。
- `tests/game-logic.test.js`：不需額外套件即可執行的玩法、儲存與鍵盤測試。

執行測試：

```powershell
node tests/game-logic.test.js
```

## Region Pack 規格

新增地區時，先在 `regions/` 裡新增一個檔案，例如 `regions/hualien.js`，並註冊到 `window.Fushouluo.regions`。

```js
(function defineRegion(app) {
  app.regions = app.regions || {};
  app.regions.example = {
    id: "example",
    name: "範例地區",
    county: "範例縣市",
    dataUrl: "https://example.com/open-data.json",
    source: {
      label: "公開資料名稱",
      url: "https://example.com/open-data.json",
    },
    recommendation: {
      rotateEveryHits: 3,
      hitStatus: "打中了，也順手認識一位在地農友。",
    },
    defaultSubregionId: "plain",
    subregions: [
      {
        id: "plain",
        name: "平原農村",
        description: "給玩家選區時看到的簡短說明。",
        keywords: ["範例鄉", "範例鎮"],
        mapQuery: "範例縣市 平原農村",
      },
    ],
    loading: {
      name: "載入在地農友資料中",
      products: "正在讀取公開資料。",
      tel: "載入中",
      status: "遊戲進行中會輪流推薦不同農友。",
    },
    fallback: {
      name: "在地農友資料暫時連不上",
      products: "稍後重整頁面再試。",
      location: "範例縣市",
      tel: "稍後再試",
      status: "官方資料暫時無法取得，遊戲仍可正常進行。",
      mapUrl: "https://www.google.com/maps/search/?api=1&query=範例縣市",
    },
    buildMapUrl(farmer) {
      return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(farmer.address)}`;
    },
    normalizeFarmer(entry, helpers) {
      return {
        name: helpers.sanitizeText(entry.Name, ""),
        products: helpers.sanitizeText(entry.Product, "以官方資料為準"),
        address: helpers.sanitizeText(entry.Address, ""),
        location: helpers.shortenText(entry.Address, "範例縣市", 26),
        subregionId: "plain",
        tel: helpers.sanitizeText(entry.Tel, "官方資料未提供"),
        status: helpers.sanitizeText(entry.Status, "官方資料更新中"),
        verifier: helpers.sanitizeText(entry.CompanyName, "公開資料"),
        effectiveDate: helpers.sanitizeText(entry.EffectiveDate, ""),
      };
    },
  };
})(window.Fushouluo || (window.Fushouluo = {}));
```

## 新增地區的步驟

1. 在 `regions/` 新增地區檔案。
2. 依照 region pack 規格補上 `dataUrl`、`source`、`fallback`、`subregions`、`normalizeFarmer()`。
3. 在 `index.html` 先載入新的地區檔案。
4. 在 `game.js` 把 `const regionPack = app.regions.yilan;` 改成新的地區。
5. 用瀏覽器確認推薦卡、Google 地圖連結、遊戲開始與暫停都正常。

## 子區域、獎勵與排行

每個 region pack 可以用 `subregions` 描述縣市內的巡田區。這不是行政區完整清單，而是適合遊戲與小農推薦的粗分類，例如平原、山區、海線、離島或偏遠區。

- `id`：穩定識別字，會用在本機紀錄，改名時不要隨意更動。
- `name`：玩家在「今天巡哪一區」看到的名稱。
- `description`：選區後顯示的短說明，語氣要友善、低壓力。
- `keywords`：從公開資料地址判斷子區域的關鍵字。
- `mapQuery`：未來可做區域地圖搜尋或 fallback 路線。

排行先維持本機 `localStorage`，不做線上全站榜。每個子區域分開記錄一般模式最高分、長輩模式最高分、巡田次數與累積守田數。獎勵文案要偏陪伴與完成感，不用速度羞辱玩家。

## 貢獻方向

- 新增台灣其他縣市 region pack。
- 改善公開資料欄位正規化，讓農友名稱、作物、地址更穩定。
- 補強子區域關鍵字，讓山區、海線、離島與偏遠聚落不會被縣市層級抹平。
- 以 CSS 變數擴充地方風格，但避免引入新的樣式系統。
- 保持遊戲核心簡單，除非有明確需求，不要把地區資料邏輯寫進 `game-core.js`。

## Repo Hygiene

- `LICENSE`：MIT License。
- `.gitignore`：排除 OS、editor、暫存檔、log、環境變數與可能的 build output。
- `.nojekyll`：讓 GitHub Pages 以純靜態網站方式發布，不套 Jekyll 處理。
- `favicon.svg`：瀏覽器分頁圖示，保留田地與福壽螺意象。

## 授權

本專案使用 MIT License。詳見 `LICENSE`。
