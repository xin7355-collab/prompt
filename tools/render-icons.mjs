/**
 * Rasterises tools/icon.svg into every size the app and the PWA manifest need.
 *
 * Uses the headless browser already present for testing rather than adding an image
 * dependency.
 *
 *   node tools/render-icons.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const ROOT = path.resolve(import.meta.dirname, '..');
const svg = fs.readFileSync(path.join(ROOT, 'tools/icon.svg'), 'utf8');

/**
 * Background and artwork have to be rendered as separate layers.
 *
 * A maskable icon is cropped to whatever shape the launcher uses, so the artwork must
 * stay inside the middle 80% while the background still reaches all four edges —
 * scaling the whole SVG shrinks its background rect too and leaves a dark ring inside
 * the crop. The splash icon has the mirror problem: it needs the artwork alone on a
 * transparent ground, and an opaque rect inside the SVG defeats `omitBackground`.
 *
 * Every variant is laid out the same way (defs, then one full-bleed rect, then the
 * mark), so the split is a string slice. If that ever stops holding, both layers fall
 * back to the whole file and the icons merely lose the safe-zone treatment.
 */
const BG_RECT = svg.match(/<rect\b[^>]*\bwidth="512"[^>]*\bheight="512"[^>]*\/>/);
const at = BG_RECT ? svg.indexOf(BG_RECT[0]) : -1;
const background = at < 0 ? svg : svg.slice(0, at + BG_RECT[0].length) + '</svg>';
// The <defs> stay with the foreground too — variants use gradients on the mark itself.
const foreground = at < 0 ? svg : svg.slice(0, at) + svg.slice(at + BG_RECT[0].length);

/** [file, size, options] */
const TARGETS = [
  ['assets/icon.png', 1024, {}],
  ['assets/adaptive-icon.png', 1024, { safe: true }],
  ['assets/splash-icon.png', 512, { safe: true, transparent: true }],
  ['assets/favicon.png', 48, {}],
  ['public/icons/icon-192.png', 192, {}],
  ['public/icons/icon-512.png', 512, {}],
  ['public/icons/maskable-192.png', 192, { safe: true }],
  ['public/icons/maskable-512.png', 512, { safe: true }],
  ['public/icons/apple-touch-icon.png', 180, {}],
  ['public/favicon.png', 48, {}],
];

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

for (const [file, size, opts] of TARGETS) {
  const page = await browser.newPage({
    viewport: { width: size, height: size },
    deviceScaleFactor: 1,
  });

  const inner = opts.safe ? Math.round(size * 0.8) : size;
  const pad = Math.round((size - inner) / 2);
  const layer = (content, px, offset) =>
    `<div style="position:absolute;left:${offset}px;top:${offset}px;width:${px}px;height:${px}px">${content}</div>`;

  await page.setContent(
    `<!doctype html><html><body style="margin:0;width:${size}px;height:${size}px;position:relative;overflow:hidden">
       ${opts.transparent ? '' : layer(background, size, 0)}
       ${layer(foreground, inner, pad)}
     </body></html>`,
    { waitUntil: 'load' }
  );

  const out = path.join(ROOT, file);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await page.screenshot({ path: out, omitBackground: !!opts.transparent });
  await page.close();

  console.log(
    `${file.padEnd(36)} ${size}x${size}` +
      (opts.transparent ? ' (mark only, transparent)' : opts.safe ? ' (maskable safe zone)' : '')
  );
}

await browser.close();
