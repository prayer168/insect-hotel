# 昆蟲旅館 RAG 展示動畫 Prototype

這是一個成果展示用的純前端 SVG 動畫。RAG 目前以本地 JSON 模擬，資料描述昆蟲旅館造型、獨居蜂外觀與築巢行為；未來若接真正 RAG API，只要維持相同資料結構，前端動畫控制邏輯不需要大改。

## 檔案

| 檔案 | 說明 |
| --- | --- |
| `index.html` | 展示頁入口，16:9 單一舞台 |
| `styles.css` | 成果展投影用版面與 SVG 視覺樣式 |
| `app.js` | 隨機選材、SVG 生成與動畫控制 |
| `data/insect-hotel-rag.json` | 本地 RAG 模擬資料 |

## 展示內容

動畫隨機循環下列流程：

1. 獨居蜂飛來昆蟲旅館。
2. 探查 2 到 3 個洞口。
3. 選定洞口並帶入花粉、葉片或泥土。
4. 洞內出現巢室、卵、幼蟲與繭的概念化示意。
5. 以泥封、葉片封口或混合材料封口。
6. 顯示時間流逝。
7. 新成蜂咬開封口、爬出並飛離。

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

