# 咒語盒 · SPELLBOX

> 把一句話，鑄成一張圖。

401 則中英雙語的 AI 繪圖提示詞、一張把它們組裝成完整咒語的工作台，以及 26 軸的角色工坊。
iOS、Android 與網頁共用同一份程式碼（Expo / React Native）。

原型是一份 1,784 行的單檔 HTML；這個版本把它重寫成可以真的上架的 App。

---

## 為什麼叫「咒語盒」

中文 AI 繪圖圈本來就把提示詞叫「咒語」，一講就懂，不用解釋。
「盒」對應收納 401 則的倉庫，`Spellbox` 英文短、好唸、好記，做 logo 也單純
（掀開的盒子放出光）。App Store 全名建議寫成：

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

## PWA（iPhone 也能像 App 一樣裝起來）

網頁版是 PWA：加到主畫面後全螢幕執行、有自己的圖示、離線可用。

**iPhone**：Safari 開網址 → 分享鈕 → 加入主畫面
**Android**：Chrome 開網址 → 選單 → 安裝應用程式

PWA 的三個條件都做好了：

| | |
|---|---|
| `public/manifest.webmanifest` | 名稱、`display: standalone`、192／512 圖示各含 maskable 版、工作台與角色工坊的捷徑 |
| `public/sw.js` | Service Worker，預先快取整個 app（29 個檔案、2.7 MB），離線可完整使用 |
| `public/index.html` | `apple-touch-icon`、`apple-mobile-web-app-*`、`theme-color`、`viewport-fit=cover` |

所有路徑都是相對的，所以在網域根目錄或 `/PROMPT-VAULT/` 子路徑都能正常運作。

> **必須用 HTTPS 網址開才裝得起來** —— Service Worker 不支援 `file://`。
> 下面那個單一 HTML 檔可以離線看內容，但不能安裝成 PWA。

## 圖示

現行的標誌是 **B 開盒放光**：蓋子掀起、光從盒裡湧出，上面一顆火花。

畫的時候只有一條規則 —— **圖示真正被看到的尺寸是 48px 的通知列和 32px 的分頁列，
不是 512px 的展示圖**。所以整顆只有三塊形狀（火花／斜蓋／盒身），中間留深色的縫；
小尺寸下眼睛認得出來的是那些縫，不是形狀本身。初稿有五層細節加一道會淡掉的光束，
48px 以下全糊成一坨金色。

（另一個教訓：C 稿把紅點放右上角，那正好是未讀徽章的位置，每次看主畫面都會以為有通知。）

`tools/icon-variants/` 裡放了七顆候選，換一顆只要一行：

```bash
npm run icons:sheet          # 把七顆都渲染成 180/120/76/48/32 px 並排比較
npm run icons:pick -- B      # 換一顆（A 盒＋火花／B 開盒放光／C 咒字／D 純火花／E 寶箱／F 提示詞入槽／G 咒字＋火花）
npm run icons                # 改了 tools/icon.svg 之後重新輸出全部尺寸
```

`npm run icons` 會輸出 App、PWA 與啟動畫面需要的全部尺寸。背景與圖案是**分兩層**畫的：

- **maskable**（Android 會把圖示裁成圓形或方形）：背景滿版出血，圖案縮到中間 80% 的安全區。
  兩層一起縮的話，裁切後會露出一圈深色邊框。
- **啟動畫面**：只有圖案、背景透明，才能疊在 `app.json` 設定的底色上。

## 單一 HTML 檔（不需伺服器）

要一個丟到「檔案」App 就能開、完全不需要網路的版本：

```bash
npm run build:web-single      # 產出單一檔案 spellbox-web.html（約 2.5 MB）
```

整個 App（含 401 則提示詞）會內嵌成一個 HTML 檔，**不需要伺服器、不連任何外部網址**，
存到手機「檔案」App 後用 Safari 開就能用。資料存在瀏覽器的 localStorage，關掉再開還在。

### 公開網址（GitHub Pages）

repo 裡有 `Deploy web to GitHub Pages` workflow，會把網頁版發佈到

```
https://8rknrz2dbw-ai.github.io/PROMPT-VAULT/
```

**第一次要先手動開啟 Pages 一次**（Actions 的 token 沒有建立 Pages 站台的權限）：

1. repo → **Settings → Pages**
2. **Build and deployment → Source** 選 **GitHub Actions**
3. 回到 **Actions → Deploy web to GitHub Pages → Run workflow**

之後每次推送都會自動更新，不用再手動處理。

網址是公開的，任何人點都能開，也能加到 iPhone 主畫面當成 App 用。

### 自己部署到別的地方

`npm run build:web` 輸出在 `dist-web/`。部署在**子路徑**時要設 `EXPO_BASE_URL`
（例：`EXPO_BASE_URL=/my-app npm run build:web`），否則所有資源與路由都會對到網域根目錄而 404。
另外要把 `index.html` 複製一份成 `404.html` 當 SPA fallback，重新整理深層網址才不會壞。

網頁版與 App 的差異：觸覺回饋沒有作用，成品圖存成 data URI 而不是檔案，
其餘（組裝、連發、角色鎖定、匯出入）行為相同。

## 拿 APK（Android 測試安裝）

不用自己裝任何東西 —— repo 裡的 GitHub Actions 會直接建置：

1. 開 repo 的 **Actions → Build Android APK → Run workflow**
2. 跑完（約 12 分鐘）後到 **Releases** 頁，會有一個 `apk-xxxxxxx` 預發布版，
   手機直接點連結就能下載
3. 安裝時允許「安裝未知來源的應用程式」即可

推任何程式碼異動也會自動建置，但**只有手動按 Run workflow 才會發佈到 Releases**；
自動建置的產物放在該次執行頁面最下方的 **Artifacts**（要登入 GitHub 才能下載）。

> 這個 APK 用 React Native 範本內建的 debug keystore 簽章 —— 所以不需要任何
> repository secret 就能裝。**測試可以，上架不行**：正式版要換成自己的 keystore，
> 否則之後無法用同一支金鑰更新。

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
顯示名稱、啟動畫面與相簿權限說明。

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
  data/corpus.ts          合併後的語料（generated + addendum）
  data/addendum.ts        後來新增的 48 則與 6 個組合包
  data/forge.ts           角色工坊的 26 軸 / 365 選項
  data/guide.ts           心法筆記
  lib/compose.ts          ★ 提示詞組裝引擎
  lib/forge.ts            角色工坊的組字引擎
  lib/openExternal.ts     開啟外部網站（含被擋掉的偵測）
  lib/health.ts           送出前的體檢
  lib/translate.ts        翻譯 / 照片反推（含無金鑰的降級路徑）
  lib/io.ts               選圖、分享、讀檔
  store/vault.tsx         全域狀態 + AsyncStorage 持久化
  store/shots.ts          成品縮圖（存檔案系統，不是 key-value）
  ui/AppText.tsx          會跟著字級設定縮放的 Text（各畫面都用它）
  ui/useLayout.ts         橫式：安全區、欄數、閱讀欄寬
  ui/                     設計系統元件

public/                   PWA：manifest、service worker、圖示、HTML 範本
tools/extract-data.mjs    從原始 HTML 抽出語料
tools/bundle-single-html.mjs  把 web 輸出摺成單一檔案
tools/pwa-postbuild.mjs   填入 SW 預快取清單、產生 404.html
tools/render-icons.mjs    由 icon.svg 產出所有尺寸（背景與圖案分層）
tools/icon-variants/      七顆候選標誌
tools/pick-icon.mjs       換一顆候選並重新輸出
tools/icon-contact-sheet.mjs  把候選渲染成實際尺寸並排比較
assets/data/corpus.json   抽出來的結果（勿手改）
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
| 安裝 | 只能開網頁 | PWA，加到主畫面全螢幕執行、離線可用 |
| 橫式 | 無 | 橫放自動兩欄、內容置中限寬、避開側邊瀏海 |
| 字級 | 固定 | 小／中／大／特大，按鈕與欄位一起長高 |
| 角色 | 手寫外貌設定 | 角色工坊 26 軸 365 選項，點一點就生成 |
| 圖示 | 瀏覽器預設 | 自製標誌，含 maskable 與啟動畫面，七顆候選可一行切換 |

資料相容：舊的 `promptvault.v2` 備份可以直接匯入。

---

## 隱私

所有資料都存在裝置本機（`AsyncStorage` + 檔案系統），不會上傳。
API 金鑰若有填也只存在本機。唯一的對外連線是使用者自己按下「翻譯」「反推」，
或從工作台開啟 AI 繪圖網站的時候。
