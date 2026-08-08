/**
 * Rasterises tools/icon.svg into every size the app and the PWA manifest need.
 *
 * Uses the headless browser already present for testing rather than adding an image
 * dependency. `maskable` variants re-render the artwork scaled into the 80% safe zone,
 * because Android crops maskable icons to whatever shape the launcher uses.
 *
 *   node tools/render-icons.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const ROOT = path.resolve(import.meta.dirname, '..');
const svg = fs.readFileSync(path.join(ROOT, 'tools/icon.svg'), 'utf8');

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

  // Maskable icons must survive a circular crop, so the artwork is inset to 80%
  // and the background colour is painted edge to edge behind it.
  const inner = opts.safe ? Math.round(size * 0.8) : size;
  const pad = Math.round((size - inner) / 2);
  const bg = opts.transparent ? 'transparent' : '#0E1211';

  await page.setContent(
    `<!doctype html><html><body style="margin:0;width:${size}px;height:${size}px;background:${bg};
       display:flex;align-items:center;justify-content:center;overflow:hidden">
       <div style="width:${inner}px;height:${inner}px;margin:${pad}px">${svg}</div>
     </body></html>`,
    { waitUntil: 'load' }
  );

  const out = path.join(ROOT, file);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await page.screenshot({ path: out, omitBackground: !!opts.transparent });
  await page.close();

  console.log(`${file.padEnd(36)} ${size}x${size}${opts.safe ? ' (maskable safe zone)' : ''}`);
}

await browser.close();
