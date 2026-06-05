# 小小法布爾的昆蟲旅館：技術建置文件

## 目的

本專案是一個成果展示用的純前端 SVG 動畫網站，用來呈現「昆蟲旅館」探究單元的視覺化成果。網站以本地 JSON 模擬 RAG 資料來源，透過 JavaScript 控制 SVG 動畫，展示不同昆蟲旅館造型、來訪蜂類、築巢、封口、羽化離巢，以及 1 到 12 月的入住變化。

線上網址：

```text
https://prayer168.github.io/insect-hotel/
```

## 技術架構

| 檔案 | 功能 |
| --- | --- |
| `index.html` | 網頁結構、SEO metadata、SVG 舞台與控制列 |
| `styles.css` | 全螢幕無捲軸版面、投影友善字級、控制列樣式 |
| `app.js` | SVG 物件生成、動畫流程、隨機事件、月份狀態、暫停與速度控制 |
| `data/insect-hotel-rag.json` | 本地 RAG mock data，包含旅館造型、來訪蜂類、巢材與事件 |
| `.nojekyll` | 讓 GitHub Pages 以純靜態網站方式發布 |

目前不使用前端框架，部署與維護成本低；所有互動都在瀏覽器端執行。

## 資料設計

`data/insect-hotel-rag.json` 主要分成四組：

| 欄位 | 說明 |
| --- | --- |
| `hotelStyles` | 昆蟲旅館造型，例如竹管木框、鑽孔木塊、混合材料 |
| `solitaryBees` | 來訪蜂類，例如切葉蜂類、木蜂類、蘆蜂、泥壺蜂 |
| `nestMaterials` | 築巢或封口材料，例如花粉團、葉片、泥土、木屑、莖髓 |
| `sceneEvents` | 動畫事件權重，例如完整生命週期、探查後離開 |

`app.js` 內有 `fallbackRagData`，即使 JSON 載入失敗，展示仍可運作。

## SVG 舞台設計

SVG 使用固定 `viewBox="0 0 1280 720"`，並以 `preserveAspectRatio="xMidYMid slice"` 填滿畫面。為避免全螢幕裁切重要資訊，月份時間軸與主要標籤需放在安全區，不靠近 SVG 邊緣。

圖層順序：

1. 背景天空、太陽、山丘
2. `plantsLayer`：花草與環境
3. `hotelLayer`：兩座昆蟲旅館
4. `nestLayer`：洞口內部狀態、封口、破口
5. `beeLayer`：主角蜂與背景忙碌飛行蜂
6. `annotationLayer`：觀察提示框
7. `timeLayer`：1 到 12 月入住時間軸與時間流逝提示

## 動畫流程

核心流程在 `playCycle()`：

1. 月份從 5 月開始，依序循環到 12 月再回到 1 月。
2. `getSeasonActivity(month)` 決定當月活動程度。
3. 同時繪製兩座旅館：竹管木框旅館與鑽孔木塊旅館。
4. `seedNestStates(activity)` 預先放入已封口、正在築巢、破口中的洞口狀態。
5. `drawBusyBees(activity)` 顯示夏季多隻蜂忙碌飛行。
6. 隨機選一隻來訪蜂探查洞口並築巢。
7. 若當月活動高，穿插既有封口巢室破口羽化。
8. 主角完成搬運、巢室示意、封口、數週後羽化離巢。

這種設計同時呈現「單一個體行為」與「整座旅館一段時間後的狀態」。

## 版面原則

- 頁面以 `100dvh` 和 CSS grid 填滿整個瀏覽器。
- `html`、`body` 設定 `overflow: hidden`，避免成果展示時出現捲軸。
- 左側是文字敘事與狀態卡，右側是主 SVG 舞台。
- 控制列保留重新播放、暫停、速度，方便教師展示時操作。
- 不在畫面顯示資料來源或 mockup 字樣，避免成果展觀眾分心。

## 驗證流程

修改後至少執行：

```powershell
node --check app.js
rg -n "資料來源|Local JSON RAG Mockup|樹脂蜂|resin_bee|mason_bee|泥蜂或壁蜂類" app.js index.html styles.css data\insect-hotel-rag.json README.md
```

本機預覽：

```powershell
python -m http.server 8087
```

使用 Chrome headless 截圖檢查版面：

```powershell
& 'C:\Program Files\Google\Chrome\Application\chrome.exe' --headless=new --disable-gpu --window-size=1920,1080 --virtual-time-budget=7000 --screenshot='preview.png' 'http://localhost:8087'
```

截圖只作為驗證暫存，不應加入 commit。

## 部署流程

專案部署到 GitHub Pages：

```powershell
git add README.md index.html styles.css app.js data/insect-hotel-rag.json docs/technical-build-guide.md
git commit -m "Describe change"
git push
```

推送後使用 cache-busting URL 驗證線上內容：

```powershell
$stamp=[DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
Invoke-WebRequest -UseBasicParsing "https://prayer168.github.io/insect-hotel/app.js?check=$stamp"
```

若 GitHub Pages 尚未更新，等待數秒後重試。通常 10 到 60 秒內會更新。

## 後續可擴充方向

- 將月份活動資料移到 JSON，讓教師可調整不同地區的蜂類季節。
- 加入「觀察模式」與「自動展示模式」切換。
- 在 SVG 中加入更明確的巢室剖面圖。
- 製作學生觀察單匯出按鈕。
- 將 RAG mock JSON 改接真正搜尋或資料庫 API。
