/**
 * Swaps the shipping mark to one of the candidates in tools/icon-variants/ and
 * re-renders every size in one step.
 *
 *   npm run icons:pick -- 7        # or: 7-zhou-spark, G, g
 *   npm run icons:pick             # lists what is available
 *
 * The candidates stay in the repo on purpose: changing your mind about the icon
 * should cost one command, not a redraw.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(import.meta.dirname, '..');
const DIR = path.join(ROOT, 'tools/icon-variants');

const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.svg')).sort();
const letter = (f) => String.fromCharCode(64 + Number(f[0])); // 1 -> A

const arg = process.argv[2]?.trim();
if (!arg) {
  console.log('候選：');
  for (const f of files) console.log(`  ${letter(f)}  ${f.replace(/\.svg$/, '')}`);
  console.log('\n用法：npm run icons:pick -- G');
  process.exit(0);
}

const key = arg.toLowerCase();
const match =
  files.find((f) => letter(f).toLowerCase() === key) ??
  files.find((f) => f.replace(/\.svg$/, '').toLowerCase() === key) ??
  files.find((f) => f.startsWith(`${key}-`));

if (!match) {
  console.error(`找不到「${arg}」。可用：${files.map((f) => letter(f)).join(' ')}`);
  process.exit(1);
}

fs.copyFileSync(path.join(DIR, match), path.join(ROOT, 'tools/icon.svg'));
console.log(`tools/icon.svg <- ${match}\n`);
execFileSync('node', [path.join(ROOT, 'tools/render-icons.mjs')], { stdio: 'inherit' });
