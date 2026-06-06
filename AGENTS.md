# 福壽螺很多：專案維護守則

本專案是可直接開啟的原生 HTML/CSS/JavaScript 小遊戲。維護目標是穩定、容易理解、長輩友善，不把它擴張成平台或大型遊戲。

## 修改前

1. 先執行 `git status --short --branch`，不要覆蓋或還原既有未提交變更。
2. 先讀 `README.md`、本檔與本次工作涉及的模組，不要憑檔名猜架構。
3. 先確認問題能重現；若沒有明顯問題，優先整理、測試或做單一微小改善。
4. 修改玩法前先讀 `tests/game-logic.test.js`，並先想清楚應補哪個失敗案例。

## 不可隨意改動

- 不新增框架、打包器、後端、資料庫或套件，除非現有原生架構確實無法處理需求。
- 不更換既有 `localStorage` key，否則會讓玩家的最高分與巡田紀錄消失。
- 不把宜蘭或其他地區資料寫進玩法核心；地區資料只能放在 `regions/` 與推薦模組。
- 不把 DOM、瀏覽器儲存或計時器重新塞回 `game-engine.js`。
- 不因桌機畫面正常就假設手機正常；手機版由最後載入的 `mobile.css` 負責。
- 不移除鍵盤、數字鍵盤、觸控、暫停、背景自動暫停與長輩模式。
- 不使用速度羞辱、倒數壓迫或複雜連擊系統破壞低壓陪伴感。
- 不重寫與本次工作無關的檔案，不順手格式化整個專案。

## 模組責任

- `game.js`：查找 DOM、選擇 region pack、組裝並啟動遊戲。
- `game-engine.js`：純玩法狀態與規則；不得依賴 DOM、`window` 計時器或 `localStorage`。
- `game-core.js`：DOM 呈現、計時器、事件與各模組協調。
- `game-input.js`：鍵盤配置的單一來源，負責九宮格映射與畫面提示。
- `game-storage.js`：本機紀錄讀寫與失敗容錯。
- `farmer-support.js`：小農資料載入、篩選、輪播與地圖連結。
- `regions/*.js`：地區公開資料來源、欄位轉換與子區域設定。
- `style.css`：全域與桌機基礎。
- `sidebar.css`：控制區、統計與小農卡。
- `field.css`：田區、洞口與福壽螺。
- `mobile.css`：手機版覆寫；必須最後載入。

## 變更尺度

- 一次只處理一個主要問題；先修 bug，再考慮小功能。
- 優先修改既有檔案；只有在責任確實獨立且可測試時才新增檔案。
- 重構必須由行為測試帶領，不接受只有搬檔案、沒有降低耦合的拆分。
- 保持現有文案語氣、操作節奏與視覺方向，除非需求明確要求改變。

## 版本規則

- 只改文件、註解或維護規範時，不升遊戲版本。
- 任何會影響程式、玩法、互動或畫面的變更，都要更新版本。
- 版本必須同步更新 `game.js` 的 `gameVersion` 與 `index.html` 的本機資源查詢參數。
- 發布前確認畫面可見版本、程式版本與快取參數一致。

## 最低驗收

程式變更至少要完成：

```powershell
node tests/game-logic.test.js
node --check game-engine.js
node --check game-storage.js
node --check game-input.js
node --check game-core.js
node --check farmer-support.js
node --check regions/yilan.js
node --check game.js
git diff --check
```

玩法或控制流程變更還要驗證：

- 開始、打擊、計分、回合結束。
- 暫停、繼續、切到背景自動暫停。
- `game-input.js` 定義的所有字母鍵、數字列與數字鍵盤配置。
- 一般模式與長輩模式。
- 切換巡田區域後的本區最高與巡田次數。
- 舊版 `localStorage` 紀錄仍能載入。

HTML/CSS 或畫面變更還要驗證：

- 桌機寬版。
- 360px 左右直式手機。
- 手機橫式。
- 無水平溢位，控制區、田區、小農卡順序正確。
- 鍵盤焦點、按鈕文字與 `aria-live` 狀態仍可理解。

## Git 與發布

- 未經使用者明確要求，不建立 commit、不 push、不改寫歷史。
- commit 只包含本次相關檔案，不使用 `git add .`。
- 本專案偏好三方署名：使用者為 author，並依使用者要求加入 Claude 與 Codex 的 co-author trailer。
- push 後要確認 GitHub Pages 對應同一個 commit 建置成功，並檢查線上頁面的版本與必要資源。
- 不使用 `--no-verify`、force push、hard reset 或其他破壞性指令，除非使用者明確指定並了解影響。

## 完成標準

只有在需求完成、測試通過、版本同步且沒有未說明的風險時，才能回報完成。若瀏覽器驗收因環境限制無法執行，必須明確說明，不可用單元測試冒充真實畫面驗收。
