/**
 * Folds an `expo export --platform web` directory into one self-contained .html file.
 *
 * The export is already only ~2.7MB, so inlining the bundle and every PNG as a data URI
 * produces a page that runs straight off the filesystem — no server, no network. That
 * makes it openable on a phone (Files -> Safari) and publishable as a single artifact.
 *
 *   node tools/bundle-single-html.mjs <exportDir> <out.html> [--body-only]
 *
 * --body-only omits <html>/<head>/<body> for hosts that supply their own document shell.
 */
import fs from 'node:fs';
import path from 'node:path';

const [exportDir, outFile, ...flags] = process.argv.slice(2);
if (!exportDir || !outFile) {
  console.error('usage: node tools/bundle-single-html.mjs <exportDir> <out.html> [--body-only]');
  process.exit(1);
}
const bodyOnly = flags.includes('--body-only');

const MIME = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

/** Every file in the export, keyed by the absolute URL path the bundle refers to. */
function collect(dir, base = '') {
  const out = new Map();
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const url = `${base}/${entry.name}`;
    if (entry.isDirectory()) for (const [k, v] of collect(full, url)) out.set(k, v);
    else out.set(url, full);
  }
  return out;
}

const files = collect(exportDir);
const html = fs.readFileSync(path.join(exportDir, 'index.html'), 'utf8');

// The one <script src> is the app; everything else it needs is referenced by URL from
// inside that bundle.
const scriptMatch = /<script src="([^"]+)"[^>]*><\/script>/.exec(html);
if (!scriptMatch) throw new Error('no <script src> found in index.html');
const bundlePath = files.get(scriptMatch[1]);
if (!bundlePath) throw new Error(`bundle not found: ${scriptMatch[1]}`);

let bundle = fs.readFileSync(bundlePath, 'utf8');

// Swap each asset URL for its data URI. Longest paths first so no URL is a prefix of
// another that has already been rewritten.
let inlined = 0;
const assetUrls = [...files.keys()]
  .filter((u) => MIME[path.extname(u).toLowerCase()])
  .sort((a, b) => b.length - a.length);

for (const url of assetUrls) {
  if (!bundle.includes(url)) continue;
  const mime = MIME[path.extname(url).toLowerCase()];
  const data = fs.readFileSync(files.get(url)).toString('base64');
  bundle = bundle.split(url).join(`data:${mime};base64,${data}`);
  inlined += 1;
}

// </script> anywhere in the JS would close the tag early.
const safeBundle = bundle.replace(/<\/script>/gi, '<\\/script>');

const title = (/<title>([^<]*)<\/title>/.exec(html) || [, 'Spellbox'])[1];
const resetStyles = (/<style id="expo-reset">([\s\S]*?)<\/style>/.exec(html) || [, ''])[1];

// The export's reset assumes it owns the document. When another shell wraps this page,
// pin the root to the viewport explicitly instead of inheriting an auto-height body.
const sizing = `
      html, body { height: 100%; margin: 0; }
      body { overflow: hidden; }
      #root { display: flex; flex: 1; height: 100dvh; min-height: 100dvh; }
`;

// NOTE: opened straight off disk the origin is `null`, so History writes throw a
// SecurityError that surfaces in the console. Do not "fix" this by wrapping
// pushState/replaceState to swallow it — react-navigation tracks its history index in
// `history.state`, so dropping the write silently breaks tab navigation. The router
// already falls back to in-memory state, and every screen works; the log line is cosmetic.

const parts = [
  `<title>${title}</title>`,
  `<style id="expo-reset">${bodyOnly ? sizing : resetStyles + sizing}</style>`,
  `<div id="root"></div>`,
  `<script>${safeBundle}</script>`,
];

const document = bodyOnly
  ? parts.join('\n')
  : `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-title" content="${title}" />
<meta name="color-scheme" content="light dark" />
${parts[0]}
${parts[1]}
</head>
<body>
<noscript>需要啟用 JavaScript 才能執行這個應用程式。</noscript>
${parts[2]}
${parts[3]}
</body>
</html>`;

fs.mkdirSync(path.dirname(path.resolve(outFile)), { recursive: true });
fs.writeFileSync(outFile, document);

const mb = (n) => (n / 1048576).toFixed(2);
console.log(
  `${outFile}: ${mb(Buffer.byteLength(document))} MB ` +
    `(bundle ${mb(Buffer.byteLength(bundle))} MB, ${inlined} assets inlined, bodyOnly=${bodyOnly})`
);
