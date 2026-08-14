/**
 * Builds public/poster.html — a standalone card wall that generates images inline.
 *
 *   node tools/export-data.mjs data-export
 *   node tools/build-poster-page.mjs data-export public/poster.html
 *
 * This is a second front end over the same content as the app, in the shape of the
 * reference collection: every prompt is a card, DRAW fills the card with the image
 * it produced. It is one self-contained file with no build step and no network
 * dependencies, so it also works opened straight off disk.
 *
 * The page is generated rather than hand-written because the content is 634 entries
 * long and lives in two places already. Editing this generator keeps them in step;
 * editing the HTML by hand does not.
 */
import fs from 'node:fs';
import path from 'node:path';

const dataDir = path.resolve(process.argv[2] || 'data-export');
const outFile = path.resolve(process.argv[3] || 'public/poster.html');

const prompts = JSON.parse(fs.readFileSync(path.join(dataDir, 'prompts.json'), 'utf8'));
const styles = JSON.parse(fs.readFileSync(path.join(dataDir, 'styles.json'), 'utf8'));

const categoryName = new Map(prompts.categories.map((c) => [c.id, c.zh]));
const familyName = new Map(styles.families.map((f) => [f.k, f.n]));

/**
 * Unfilled `{{placeholders}}` are drawn literally by image models — braces and all.
 * The app has a form for filling them; this page does not, so the braces come off
 * and the placeholder name is left as ordinary words, which reads as a reasonable
 * generic subject rather than as markup.
 */
const unwrap = (text) => String(text || '').replace(/\{\{([^}]+)\}\}/g, '$1');

const entries = [];

// The style wall first: these are the ones written to be fired as-is.
for (const style of styles.styles) {
  entries.push({
    i: style.id,
    t: style.n,
    s: style.e,
    d: style.d || '',
    p: unwrap(style.en),
    g: familyName.get(style.f) || style.f,
    // Clause entries need a subject in front; finished prompts do not. Same
    // distinction the app draws, carried over so the header's 主題 field behaves
    // identically here.
    f: style.full ? 1 : 0,
  });
}

for (const prompt of prompts.prompts) {
  entries.push({
    i: prompt.i,
    t: prompt.t,
    s: '',
    d: (prompt.k || '').split(',').slice(0, 3).join(' · '),
    p: unwrap(prompt.en || prompt.zh),
    g: categoryName.get(prompt.c) || prompt.c,
    f: 1,
  });
}

const groups = [...new Set(entries.map((e) => e.g))];

// `</script>` inside a string would close the tag early; escaping `<` is the
// standard way to make arbitrary JSON safe to inline.
const payload = JSON.stringify({ entries, groups }).replace(/</g, '\\u003c');

const html = `<!doctype html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<meta name="color-scheme" content="dark" />
<title>咒語盒 · 海報牆</title>
<style>
  :root {
    --bg: #0b0b0c;
    --panel: #151517;
    --panel-2: #1d1d20;
    --line: #2a2a2e;
    --line-soft: #202024;
    --ink: #ecedef;
    --ink-dim: #a2a4aa;
    --ink-faint: #6e7076;
    --accent: #d6452f;
    --gold: #c9a227;
    --serif: "Noto Serif TC", "Songti TC", "Source Han Serif TC", Georgia, serif;
    --sans: system-ui, -apple-system, "Noto Sans TC", "PingFang TC", sans-serif;
    --mono: ui-monospace, SFMono-Regular, Menlo, monospace;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    background: var(--bg);
    color: var(--ink);
    font-family: var(--sans);
    -webkit-font-smoothing: antialiased;
  }
  button, input, textarea { font: inherit; color: inherit; }
  button { cursor: pointer; }

  /* ── Header ─────────────────────────────────────────── */
  header {
    position: sticky; top: 0; z-index: 40;
    background: rgba(11,11,12,0.94);
    -webkit-backdrop-filter: blur(16px); backdrop-filter: blur(16px);
    border-bottom: 1px solid var(--line-soft);
  }
  .bar { max-width: 1600px; margin: 0 auto; padding: 14px 20px 0; }
  .brandrow { display: flex; align-items: baseline; gap: 14px; flex-wrap: wrap; }
  .wordmark {
    font-family: var(--serif); font-size: 22px; font-weight: 700;
    letter-spacing: .06em; margin: 0;
  }
  .tagline { font-size: 11.5px; color: var(--ink-faint); letter-spacing: .04em; }
  .spacer { flex: 1; }
  .ghost {
    background: transparent; border: 1px solid var(--line);
    border-radius: 999px; padding: 7px 14px; font-size: 12px; color: var(--ink-dim);
  }
  .ghost:hover { color: var(--ink); border-color: var(--ink-faint); }
  .ghost.on { background: var(--gold); border-color: var(--gold); color: #241c00; font-weight: 700; }

  .controls { display: flex; gap: 10px; margin-top: 12px; flex-wrap: wrap; }
  .field {
    flex: 1 1 260px; min-width: 0;
    background: var(--panel); border: 1px solid var(--line);
    border-radius: 10px; padding: 10px 13px; font-size: 14px; outline: none;
  }
  .field:focus { border-color: var(--ink-faint); }
  .field::placeholder { color: var(--ink-faint); }

  .chips {
    display: flex; gap: 7px; overflow-x: auto; padding: 12px 0 13px;
    scrollbar-width: none;
  }
  .chips::-webkit-scrollbar { display: none; }
  .chip {
    flex: 0 0 auto; background: var(--panel); border: 1px solid var(--line);
    border-radius: 999px; padding: 7px 14px; font-size: 12.5px; color: var(--ink-dim);
    white-space: nowrap;
  }
  .chip:hover { color: var(--ink); }
  .chip.on { background: var(--ink); border-color: var(--ink); color: #0b0b0c; font-weight: 700; }
  .chip .n { font-family: var(--mono); font-size: 10px; opacity: .6; margin-left: 5px; }

  /* ── Grid ───────────────────────────────────────────── */
  main { max-width: 1600px; margin: 0 auto; padding: 22px 20px 80px; }
  .grid {
    display: grid; gap: 20px;
    grid-template-columns: repeat(auto-fill, minmax(272px, 1fr));
  }
  .card {
    background: var(--panel); border: 1px solid var(--line-soft);
    border-radius: 14px; overflow: hidden; display: flex; flex-direction: column;
    transition: border-color .25s, transform .25s;
  }
  .card:hover { border-color: var(--line); transform: translateY(-2px); }

  .shot {
    position: relative; aspect-ratio: 3 / 4; background: var(--panel-2);
    display: flex; align-items: center; justify-content: center;
    border-bottom: 1px solid var(--line-soft); overflow: hidden;
  }
  .shot img { width: 100%; height: 100%; object-fit: cover; display: block; cursor: zoom-in; }
  .placeholder { text-align: center; color: var(--ink-faint); padding: 20px; }
  .placeholder .mark {
    font-family: var(--serif); font-size: 40px; opacity: .28; display: block; margin-bottom: 8px;
  }
  .placeholder .hint {
    font-size: 9.5px; letter-spacing: .22em; text-transform: uppercase;
  }
  .overlay {
    position: absolute; inset: 0; background: rgba(8,8,9,.86);
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px;
  }
  .spin {
    width: 26px; height: 26px; border-radius: 50%;
    border: 2px solid rgba(255,255,255,.16); border-left-color: #fff;
    animation: spin .9s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .overlay .label { font-size: 9.5px; letter-spacing: .22em; text-transform: uppercase; color: var(--ink-dim); }
  .badge {
    position: absolute; left: 10px; top: 10px;
    background: rgba(0,0,0,.6); border-radius: 6px; padding: 3px 8px;
    font-family: var(--mono); font-size: 9px; letter-spacing: .1em; color: #fff;
  }

  .body { padding: 15px 16px 16px; display: flex; flex-direction: column; flex: 1; }
  .group { font-family: var(--mono); font-size: 9px; letter-spacing: .16em; color: var(--ink-faint); text-transform: uppercase; }
  .name { font-family: var(--serif); font-size: 17px; font-weight: 700; margin: 6px 0 0; }
  .sub { font-family: var(--serif); font-style: italic; font-size: 12px; color: var(--ink-dim); margin-top: 3px; }
  .desc { font-size: 11.5px; line-height: 1.75; color: var(--ink-dim); margin-top: 9px; }

  .prompt {
    margin-top: 12px; background: #0e0e10; border: 1px solid var(--line-soft);
    border-radius: 8px; padding: 10px 11px;
    font-family: var(--mono); font-size: 10.5px; line-height: 1.72; color: var(--ink-faint);
    max-height: 74px; overflow: hidden; cursor: pointer; position: relative;
  }
  .prompt.open { max-height: none; }
  .prompt:not(.open)::after {
    content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 26px;
    background: linear-gradient(transparent, #0e0e10);
  }

  .actions { display: flex; gap: 8px; margin-top: 13px; }
  .btn {
    flex: 1; border-radius: 9px; padding: 10px; font-size: 12px; font-weight: 700;
    letter-spacing: .12em; border: 1px solid var(--line); background: transparent; color: var(--ink-dim);
  }
  .btn:hover { color: var(--ink); border-color: var(--ink-faint); }
  .btn.primary { background: var(--accent); border-color: var(--accent); color: #fff; flex: 1.35; }
  .btn.primary:hover { filter: brightness(1.08); }
  .btn:disabled { opacity: .5; cursor: not-allowed; }

  .end { text-align: center; padding: 34px 0; color: var(--ink-faint); font-size: 12px; }

  /* ── Overlays ───────────────────────────────────────── */
  .scrim {
    position: fixed; inset: 0; z-index: 60; background: rgba(0,0,0,.9);
    display: none; align-items: center; justify-content: center; padding: 24px;
  }
  .scrim.show { display: flex; }
  .lightbox { display: flex; flex-direction: column; gap: 12px; max-width: min(94vw, 900px); max-height: 92vh; }
  .lightbox img { max-width: 100%; max-height: 74vh; border-radius: 12px; object-fit: contain; }
  .lightbox .row { display: flex; gap: 9px; }

  .sheet {
    background: var(--panel); border: 1px solid var(--line); border-radius: 16px;
    padding: 22px; width: min(94vw, 480px); max-height: 90vh; overflow: auto;
  }
  .sheet h2 { font-family: var(--serif); font-size: 18px; margin: 0 0 6px; }
  .sheet p { font-size: 12px; line-height: 1.8; color: var(--ink-dim); margin: 0 0 16px; }
  .sheet label { display: block; font-family: var(--mono); font-size: 9.5px; letter-spacing: .16em;
                 color: var(--ink-faint); text-transform: uppercase; margin: 14px 0 6px; }
  .sheet input, .sheet select {
    width: 100%; background: #0e0e10; border: 1px solid var(--line); border-radius: 9px;
    padding: 10px 12px; font-size: 13px; outline: none;
  }
  .sheet .row { display: flex; gap: 9px; margin-top: 18px; }

  #toast {
    position: fixed; left: 50%; bottom: 28px; transform: translate(-50%, 14px);
    z-index: 80; background: var(--ink); color: #0b0b0c;
    padding: 11px 20px; border-radius: 999px; font-size: 13px; font-weight: 600;
    opacity: 0; pointer-events: none; transition: opacity .25s, transform .25s;
    max-width: 88vw; text-align: center;
  }
  #toast.show { opacity: 1; transform: translate(-50%, 0); }
  #toast.bad { background: var(--accent); color: #fff; }

  @media (max-width: 640px) {
    .grid { grid-template-columns: repeat(auto-fill, minmax(158px, 1fr)); gap: 12px; }
    .body { padding: 12px; }
    .name { font-size: 14px; }
    .desc, .prompt { display: none; }
    main { padding: 16px 12px 70px; }
    .bar { padding: 12px 12px 0; }
  }
</style>
</head>
<body>

<header>
  <div class="bar">
    <div class="brandrow">
      <h1 class="wordmark">咒語盒 · 海報牆</h1>
      <span class="tagline" id="count"></span>
      <span class="spacer"></span>
      <button class="ghost" id="onlyShot">只看已生成</button>
      <button class="ghost" id="openSettings">⚙ 設定</button>
    </div>
    <div class="controls">
      <input class="field" id="subject" placeholder="主題（選填）— 例：一隻黑貓坐在窗邊。填了會套用到「風格句」那類卡片" />
      <input class="field" id="search" placeholder="搜尋名稱、分類或提示詞…" />
    </div>
    <div class="chips" id="chips"></div>
  </div>
</header>

<main>
  <div class="grid" id="grid"></div>
  <div class="end" id="end"></div>
</main>

<div class="scrim" id="lightbox">
  <div class="lightbox">
    <img id="lightboxImg" alt="" />
    <div class="row">
      <button class="btn primary" id="downloadBtn">⬇ 下載原圖</button>
      <button class="btn" id="regenBtn">重新生成</button>
      <button class="btn" id="closeLightbox">關閉</button>
    </div>
  </div>
</div>

<div class="scrim" id="settings">
  <div class="sheet">
    <h2>生成設定</h2>
    <p>
      金鑰只存在這台裝置的瀏覽器裡，直接送到 Google，不經過任何中間伺服器。
      在 Google AI Studio 的畫布裡執行時可以留白，環境會自動帶入；
      當成獨立檔案或網頁開啟時必須自己填，否則會被拒絕。
    </p>
    <label>Google API Key</label>
    <input id="keyInput" type="password" placeholder="AIza…（在 aistudio.google.com/apikey 申請）" />
    <label>模型</label>
    <input id="modelInput" placeholder="gemini-3.1-flash-image-preview" />
    <label>畫面比例</label>
    <select id="ratioInput">
      <option value="3:4">3:4 — 海報直式</option>
      <option value="1:1">1:1 — 方形</option>
      <option value="4:3">4:3 — 橫式</option>
      <option value="9:16">9:16 — 手機直式</option>
      <option value="16:9">16:9 — 寬螢幕</option>
    </select>
    <div class="row">
      <button class="btn primary" id="saveSettings">儲存</button>
      <button class="btn" id="clearImages">清空所有生成圖</button>
      <button class="btn" id="closeSettings">關閉</button>
    </div>
  </div>
</div>

<div id="toast"></div>

<script id="payload" type="application/json">${payload}</script>
<script>
${fs.readFileSync(path.join(import.meta.dirname, 'poster-page-app.js'), 'utf8')}
</script>
</body>
</html>
`;

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, html);
console.log(
  `  ${path.relative(process.cwd(), outFile)}  ${(fs.statSync(outFile).size / 1024).toFixed(0)} KB` +
    `  ·  ${entries.length} entries (${styles.styles.length} styles + ${prompts.prompts.length} prompts)` +
    `  ·  ${groups.length} groups`
);
