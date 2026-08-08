/**
 * Renders every candidate in tools/icon-variants/ at the sizes an icon is actually
 * seen at, plus the two crops launchers apply (iOS squircle, Android circle).
 *
 * The point is small-size legibility: a mark that only works at 512px is not an icon.
 *
 *   node tools/icon-contact-sheet.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const ROOT = path.resolve(import.meta.dirname, '..');
const DIR = path.join(ROOT, 'tools/icon-variants');
const OUT = process.env.ICON_SHEET_OUT || path.join(ROOT, 'tools/icon-variants/_sheet');

const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.svg')).sort();
const variants = files.map((f) => ({
  id: f.replace(/\.svg$/, ''),
  svg: fs.readFileSync(path.join(DIR, f), 'utf8'),
}));

const LABELS = {
  '1-box-spark': 'A 盒＋火花（現行）',
  '2-open-box': 'B 開盒放光',
  '3-zhou': 'C 咒字',
  '4-spark': 'D 純火花',
  '5-chest': 'E 寶箱',
  '6-slot': 'F 提示詞入槽',
  '7-zhou-spark': 'G 咒字＋火花',
};

/** The sizes that decide it: home screen, tab bar, notification, favicon. */
const SIZES = [180, 120, 76, 48, 32];

const cell = (svg, size, shape) => {
  const radii = { square: 0, ios: Math.round(size * 0.225), circle: size / 2 };
  return `<div style="width:${size}px;height:${size}px;border-radius:${radii[shape]}px;
    overflow:hidden;flex:0 0 auto">${svg}</div>`;
};

const row = (v) => `
  <div class="row">
    <div class="name">${LABELS[v.id] || v.id}</div>
    <div class="strip">
      ${SIZES.map((s) => `<div class="col">${cell(v.svg, s, 'ios')}<div class="px">${s}</div></div>`).join('')}
      <div class="sep"></div>
      <div class="col">${cell(v.svg, 120, 'circle')}<div class="px">圓形裁切</div></div>
      <div class="col">${cell(v.svg, 120, 'square')}<div class="px">未裁切</div></div>
    </div>
  </div>`;

const page = (bg, fg, title) => `<!doctype html><html><body style="margin:0;background:${bg}">
<style>
  body{font:14px/1.4 -apple-system,'Noto Sans',sans-serif;color:${fg};padding:26px 30px}
  h1{font-size:15px;font-weight:600;margin:0 0 20px;opacity:.75;letter-spacing:.04em}
  .row{display:flex;align-items:center;gap:22px;padding:14px 0;border-top:1px solid ${fg}22}
  .name{width:150px;flex:0 0 auto;font-size:14px;font-weight:600}
  .strip{display:flex;align-items:flex-end;gap:18px}
  .col{display:flex;flex-direction:column;align-items:center;gap:7px}
  .px{font-size:10px;opacity:.5;letter-spacing:.03em}
  .sep{width:1px;align-self:stretch;background:${fg}22;margin:0 6px}
</style>
<h1>${title}</h1>
${variants.map(row).join('')}
</body></html>`;

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
fs.mkdirSync(OUT, { recursive: true });

const SHEETS = [
  ['sheet-dark.png', '#0B0E0D', '#F2EFE8', '深色桌布 · 由左至右 180 / 120 / 76 / 48 / 32 px（iOS 圓角）'],
  ['sheet-light.png', '#F4F1EA', '#141817', '淺色桌布 · 同樣尺寸'],
];

for (const [file, bg, fg, title] of SHEETS) {
  const p = await browser.newPage({ viewport: { width: 1180, height: 900 }, deviceScaleFactor: 2 });
  await p.setContent(page(bg, fg, title), { waitUntil: 'load' });
  await p.screenshot({ path: path.join(OUT, file), fullPage: true });
  await p.close();
  console.log(`${file}`);
}

// One full-size render each, so the detail is judgeable too.
for (const v of variants) {
  const p = await browser.newPage({ viewport: { width: 512, height: 512 }, deviceScaleFactor: 1 });
  await p.setContent(`<!doctype html><html><body style="margin:0">${v.svg}</body></html>`, {
    waitUntil: 'load',
  });
  await p.screenshot({ path: path.join(OUT, `${v.id}.png`) });
  await p.close();
}
console.log(`${variants.length} full-size renders -> ${path.relative(ROOT, OUT)}`);

await browser.close();
