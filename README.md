# 小小法布爾的昆蟲旅館

這是一個成果展示用的純前端 SVG 動畫。RAG 目前以本地 JSON 模擬，資料描述昆蟲旅館造型、來訪蜂類外觀、月份入住與築巢行為；未來若接真正 RAG API，只要維持相同資料結構，前端動畫控制邏輯不需要大改。

## 檔案

| 檔案 | 說明 |
| --- | --- |
| `index.html` | 展示頁入口，16:9 單一舞台 |
| `styles.css` | 成果展投影用版面與 SVG 視覺樣式 |
| `app.js` | 隨機選材、SVG 生成與動畫控制 |
| `data/insect-hotel-rag.json` | 本地 RAG 模擬資料 |
| `docs/technical-build-guide.md` | 技術建置、驗證與部署交接文件 |

## 展示內容

動畫隨機循環下列流程：

1. 同時呈現竹管木框旅館與鑽孔木塊旅館。
2. 顯示 1 到 12 月入住情況，5 到 8 月為忙碌高峰。
3. 來訪蜂類探查洞口，選定後多次帶入花粉、葉片或巢材。
4. 洞內出現多個巢室、卵、幼蟲與繭的概念化示意。
5. 部分洞口先顯示已封口狀態，部分洞口正在築巢。
6. 經過一段時間後，新成蜂慢慢咬開封口、爬出並飛離。

## 使用方式

建議用本機伺服器開啟，讓 `fetch()` 可讀取本地 JSON：

```powershell
cd C:\Users\NNKIEH\Documents\科學探究\insect-hotel-animation
python -m http.server 8080
```

瀏覽器開啟：

```text
http://localhost:8080
```

若直接雙擊 `index.html`，部分瀏覽器會阻擋本地 JSON 讀取；程式內有 fallback 資料，動畫仍可播放，但不利於測試未來 RAG 串接。

## 未來接 RAG 的介面

`app.js` 中的 `loadRagData()` 目前讀取：

```js
fetch("./data/insect-hotel-rag.json")
```

之後可改為：

```js
fetch("/api/rag/insect-hotel-scene")
```

API 回傳需包含 `hotelStyles`、`solitaryBees`、`nestMaterials`、`sceneEvents` 四個陣列。
