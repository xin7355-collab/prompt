/**
 * Finishes the PWA after `expo export --platform web`.
 *
 * The bundle filename is content-hashed and only known once the export exists, so the
 * service worker ships with placeholders that this step fills in:
 *
 *   - PRECACHE   the shell plus every emitted asset, as scope-relative paths
 *   - VERSION    a hash of that list, so a new deploy evicts the previous cache
 *
 * Also writes 404.html, which is how a static host (GitHub Pages in particular) serves
 * a single-page app: an unknown path returns the shell and the router takes over.
 *
 *   node tools/pwa-postbuild.mjs <exportDir>
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const dir = process.argv[2];
if (!dir) {
  console.error('usage: node tools/pwa-postbuild.mjs <exportDir>');
  process.exit(1);
}

const root = path.resolve(dir);
if (!fs.existsSync(path.join(root, 'index.html'))) {
  console.error(`no index.html in ${root} — did the export run?`);
  process.exit(1);
}

/** Every emitted file, as a path relative to the export root. */
function walk(current, base = '') {
  const out = [];
  for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
    const full = path.join(current, entry.name);
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) out.push(...walk(full, rel));
    else out.push(rel);
  }
  return out;
}

const files = walk(root);

// The worker caches itself implicitly and 404.html is only ever served by the host,
// so neither belongs in the precache list.
const precache = files
  .filter((f) => f !== 'sw.js' && f !== '404.html')
  .map((f) => (f === 'index.html' ? './' : `./${f}`))
  .sort();

const version = crypto.createHash('sha256').update(precache.join('|')).digest('hex').slice(0, 12);

const swPath = path.join(root, 'sw.js');
let sw = fs.readFileSync(swPath, 'utf8');
sw = sw
  .replace("'__BUILD_VERSION__'", JSON.stringify(version))
  .replace('const PRECACHE = [];', `const PRECACHE = ${JSON.stringify(precache, null, 2)};`);
fs.writeFileSync(swPath, sw);

// SPA fallback for hosts without rewrite rules.
fs.copyFileSync(path.join(root, 'index.html'), path.join(root, '404.html'));

const bytes = precache.reduce((sum, f) => {
  const rel = f === './' ? 'index.html' : f.slice(2);
  return sum + fs.statSync(path.join(root, rel)).size;
}, 0);

console.log(
  `PWA ready: ${precache.length} files precached (${(bytes / 1048576).toFixed(2)} MB), version ${version}`
);

const manifest = path.join(root, 'manifest.webmanifest');
if (!fs.existsSync(manifest)) {
  console.warn('WARNING: manifest.webmanifest missing from the export — is public/ present?');
  process.exit(1);
}
