// One-off: lift the prompt corpus out of the original single-file HTML prototype
// into typed JSON the React Native app can import.
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';

const SRC = process.argv[2];
const OUT = process.argv[3];
const html = fs.readFileSync(SRC, 'utf8');

// The first <script> block is pure data declarations.
const blocks = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const dataBlock = blocks[0];

const ctx = { console };
vm.createContext(ctx);
// `const` at script top level does not land on the context global, so collect explicitly.
const NAMES = ['CATS','CATCOLOR','SEED','MODS','NEGS','SITES','MODES','RATIOMAP','PACKS','DNA_TPL','DNA_LOCK'];
vm.runInContext(
  dataBlock + `\n;globalThis.__out = {${NAMES.map(n => `${n}:typeof ${n}!=='undefined'?${n}:null`).join(',')}};`,
  ctx
);

const pick = k => ctx.__out[k];
const out = {
  cats: pick('CATS'),
  catColor: pick('CATCOLOR'),
  prompts: pick('SEED'),
  mods: pick('MODS'),
  negs: pick('NEGS'),
  sites: pick('SITES'),
  modes: pick('MODES'),
  ratios: pick('RATIOMAP'),
  packs: pick('PACKS'),
  dnaTemplate: pick('DNA_TPL'),
  dnaLock: pick('DNA_LOCK'),
};

for (const [k, v] of Object.entries(out)) {
  if (!v) throw new Error(`missing ${k}`);
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
console.log(
  `cats=${out.cats.length} prompts=${out.prompts.length} modGroups=${out.mods.length} ` +
  `packs=${out.packs.length} modes=${out.modes.length} ratios=${out.ratios.length} sites=${out.sites.length}`
);
const missing = out.prompts.filter(p => !out.cats.some(c => c.id === p.c));
console.log('prompts with unknown category:', missing.length);
const dupes = out.prompts.map(p => p.i).filter((v, i, a) => a.indexOf(v) !== i);
console.log('duplicate ids:', dupes.length ? dupes : 'none');
