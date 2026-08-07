# 咒語盒 · SPELLBOX

> 把一句話，鑄成一張圖。

353 則中英雙語的 AI 繪圖提示詞，加上一張把它們組裝成完整咒語的工作台。
iOS、Android 與網頁共用同一份程式碼（Expo / React Native）。

原型是一份 1,784 行的單檔 HTML；這個版本把它重寫成可以真的上架的 App。

---

## 為什麼叫「咒語盒」

中文 AI 繪圖圈本來就把提示詞叫「咒語」，一講就懂，不用解釋。
「盒」對應收納 353 則的倉庫，`Spellbox` 英文短、好唸、好記，做 logo 也單純
（一個盒子加一顆火花）。App Store 全名建議寫成：

```
咒語盒 Spellbox — AI 繪圖提示詞
```

想換名字的話只要改兩個地方：`src/brand.ts` 和 `app.json` 的 `name` / `slug`。
其他備選：**語鑄 WordForge**、**一句成圖 SayItSee**、**提詞倉 PromptBarn**、**詞光 Lumen**。

---

## 跑起來

```bash
npm install
npm start            # 掃 QR code，用 Expo Go 開
npm run ios          # iOS 模擬器（需要 macOS）
npm run android      # Android 模擬器
npm run web          # 瀏覽器
npm run typecheck    # TypeScript 檢查
```

## 打包上架

`expo-image-picker` 需要原生模組，Expo Go 只能用來開發，正式版要自己建置：

```bash
npm install -g eas-cli
eas login
eas build --platform ios          # 產出 .ipa，可送 App Store Connect
eas build --platform android      # 產出 .aab，可送 Google Play
eas build --platform android --profile preview   # 直接可安裝的 .apk，給自己人測
eas submit --platform ios
```

不想用 EAS 就本地建置：`npx expo prebuild` 產出 `ios/` 與 `android/`，再用
Xcode / Android Studio 開。`app.json` 已經設好 bundle id（`com.spellbox.app`）、
顯示名稱與相簿權限說明。

> `assets/` 裡的圖示目前是預設佔位圖，上架前要換成自己的。

---

## 架構

```
app/                      畫面（expo-router，檔案即路由）
  (tabs)/index.tsx        倉庫：搜尋、分類、標籤、篩選
  (tabs)/bench.tsx        工作台：模式、角色、填空、修飾器、比例、排除項、連發
  (tabs)/cast.tsx         角色：外貌鎖定
  (tabs)/more.tsx         設定、備份、外觀、API 金鑰
  edit / character / pack / reverse / guide

src/
  brand.ts                產品名稱（改名只改這裡）
  theme.ts                設計 token：明暗兩套色盤、間距、圓角、字體
  data/corpus.ts          353 則提示詞 + 分類 + 修飾器 + 組合包（由工具產生）
  data/guide.ts           心法筆記
  lib/compose.ts          ★ 提示詞組裝引擎
  lib/health.ts           送出前的體檢
  lib/translate.ts        翻譯 / 照片反推（含無金鑰的降級路徑）
  lib/io.ts               選圖、分享、讀檔
  store/vault.tsx         全域狀態 + AsyncStorage 持久化
  store/shots.ts          成品縮圖（存檔案系統，不是 key-value）
  ui/                     設計系統元件

tools/extract-data.mjs    從原始 HTML 抽出語料
assets/data/corpus.json   抽出來的結果
```

### 組裝引擎的順序

`src/lib/compose.ts` 的疊加順序是刻意的，對應模型讀提示詞的方式：

```
[圖生圖模式指令] → [角色外貌鎖定] → [底稿＋填空＋連發變體] → [風格加成] → [比例/排除項/種子值]
```

模式指令必須最前面，模型才知道不要重畫那張臉；機器參數（`--ar`、`--no`、
Negative prompt）依「更多」裡選的輸出格式改寫語法。

---

## 和原型比，改了什麼

| | 原型 | 現在 |
|---|---|---|
| 平台 | 單檔網頁 | iOS / Android / Web 同一份程式碼 |
| 深色模式 | 無 | 明暗兩套完整色盤，可跟隨系統或手動指定 |
| 版面 | 底部滑出面板塞下所有功能 | 四個分頁，工作台是完整一頁 |
| 成品圖 | base64 塞 localStorage，60 張上限 | 縮圖寫入檔案系統，無上限，開機自動清孤兒檔 |
| 分類色 | 一組色，深底下會糊掉 | 每個分類明暗各一組 |
| 比例選擇 | 文字清單 | 照實際形狀畫的方框 + 用途說明 |
| 翻譯 / 反推 | 直接打 API 且沒有金鑰，實際上必失敗 | 自己填金鑰則自動跑；不填會複製指令給任何 AI 用 |
| 匯出 | 瀏覽器下載 | 系統分享單（AirDrop、LINE、雲端硬碟都行） |
| 種子值 | 無 | 可指定，系列圖的臉更穩 |
| 觸控 | 網頁按鈕尺寸 | 全部 44pt 以上，含觸覺回饋與無障礙標籤 |

資料相容：舊的 `promptvault.v2` 備份可以直接匯入。

---

## 隱私

所有資料都存在裝置本機（`AsyncStorage` + 檔案系統），不會上傳。
API 金鑰若有填也只存在本機。唯一的對外連線是使用者自己按下「翻譯」「反推」，
或從工作台開啟 AI 繪圖網站的時候。
