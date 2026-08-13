/**
 * Writes the whole corpus out as plain JSON and CSV, so the content survives
 * independently of the app that displays it.
 *
 *   node tools/export-data.mjs <outDir>
 *
 * The addendum is TypeScript with structure, not a flat data file, so it is compiled
 * through the project's own tsc rather than scraped with a regex — a regex would
 * silently drop entries the day someone reformats it. corpus.json is read straight off
 * disk because it is already plain JSON, which keeps tsc's output free of any runtime
 * import (the three modules compiled here import types only, and those erase).
 *
 * The merge below mirrors src/data/corpus.ts. If that file ever starts doing more than
 * concatenating, this has to follow.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const ROOT = path.resolve(import.meta.dirname, '..');
const outDir = path.resolve(process.argv[2] || path.join(ROOT, 'data-export'));

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'spellbox-export-'));
execFileSync(
  path.join(ROOT, 'node_modules/.bin/tsc'),
  [
    'src/data/addendum.ts', 'src/data/forge.ts', 'src/data/guide.ts',
    'src/data/styles.ts', 'src/data/posters.ts',
    '--outDir', tmp, '--rootDir', '.',
    '--module', 'esnext', '--target', 'es2022', '--skipLibCheck',
    // The project tsconfig targets React Native and emits nothing; this run needs
    // plain ESM on disk, so it deliberately ignores it.
    '--ignoreConfig',
  ],
  { cwd: ROOT, stdio: 'inherit' }
);
fs.writeFileSync(path.join(tmp, 'package.json'), '{"type":"module"}');

// tsc emits `from './posters'` — valid TypeScript, unresolvable to Node's ESM loader,
// which requires the extension. styles.ts is the only module here with a runtime
// import, and without this the whole export dies on it.
const emitted = path.join(tmp, 'src/data');
for (const file of fs.readdirSync(emitted).filter((f) => f.endsWith('.js'))) {
  const full = path.join(emitted, file);
  fs.writeFileSync(
    full,
    fs.readFileSync(full, 'utf8').replace(/(from\s+['"]\.\/[^'"]+)(['"])/g, '$1.js$2')
  );
}

const load = (name) => import(pathToFileURL(path.join(tmp, 'src/data', name)).href);
const [addendum, forge, guide, styles] = await Promise.all([
  load('addendum.js'), load('forge.js'), load('guide.js'), load('styles.js'),
]);
const raw = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/data/corpus.json'), 'utf8'));

const CATEGORIES = [...raw.cats, ...addendum.EXTRA_CATEGORIES];
const PROMPTS = [...raw.prompts, ...addendum.EXTRA_PROMPTS];
const PACKS = [...raw.packs, ...addendum.EXTRA_PACKS];

fs.mkdirSync(outDir, { recursive: true });
const write = (name, data) => {
  const file = path.join(outDir, name);
  fs.writeFileSync(file, data);
  console.log(`  ${name.padEnd(24)} ${(fs.statSync(file).size / 1024).toFixed(0)} KB`);
};

write(
  'prompts.json',
  JSON.stringify(
    {
      exportedFrom: '咒語盒 Spellbox',
      counts: { prompts: PROMPTS.length, categories: CATEGORIES.length, packs: PACKS.length },
      categories: CATEGORIES,
      prompts: PROMPTS,
      packs: PACKS,
      modifiers: raw.mods,
      ratios: raw.ratios,
      modes: raw.modes,
      sites: raw.sites,
      negatives: raw.negs,
      dnaTemplate: raw.dnaTemplate,
      dnaLock: raw.dnaLock,
    },
    null,
    2
  )
);

const catName = new Map(CATEGORIES.map((c) => [c.id, c.zh]));
// The BOM is what makes Excel on Windows read the file as UTF-8 rather than Big5.
const cell = (v) => `"${String(v ?? '').replace(/"/g, '""').replace(/\n/g, ' ')}"`;
const rows = [['分類', '標題', '標籤', '中文提示詞', '英文提示詞']];
for (const p of PROMPTS) rows.push([catName.get(p.c) ?? p.c, p.t, p.k, p.zh, p.en]);
write('prompts.csv', '﻿' + rows.map((r) => r.map(cell).join(',')).join('\r\n'));

const axes = forge.FORGE_AXES ?? forge.AXES ?? [];
write('character-forge.json', JSON.stringify({ guard: forge.FORGE_GUARD, axes }, null, 2));
write('guide.json', JSON.stringify(guide, null, 2));

// The style wall: 150 finished poster prompts plus 83 style clauses. `full` is what
// separates them — see the note in src/data/styles.ts.
write(
  'styles.json',
  JSON.stringify(
    {
      exportedFrom: '咒語盒 Spellbox — 風格牆',
      counts: {
        total: styles.STYLES.length,
        posters: styles.STYLES.filter((s) => s.full).length,
        clauses: styles.STYLES.filter((s) => !s.full).length,
        families: styles.FAMILIES.length,
      },
      families: styles.FAMILIES,
      styles: styles.STYLES,
    },
    null,
    2
  )
);

const famName = new Map(styles.FAMILIES.map((f) => [f.k, f.n]));
const styleRows = [['家族', '中文名', '英文名', '種類', '說明', '中文提示詞', '英文提示詞']];
for (const s of styles.STYLES) {
  styleRows.push([
    famName.get(s.f) ?? s.f,
    s.n,
    s.e,
    s.full ? '完整提示詞' : '風格句',
    s.d ?? '',
    s.zh ?? '',
    s.en,
  ]);
}
write('styles.csv', '﻿' + styleRows.map((r) => r.map(cell).join(',')).join('\r\n'));

fs.rmSync(tmp, { recursive: true, force: true });
console.log(
  `\n  ${PROMPTS.length} prompts · ${CATEGORIES.length} categories · ${PACKS.length} packs` +
    ` · ${axes.length} forge axes · ${styles.STYLES.length} styles`
);
