/**
 * Fills the 咒語盒・海報牆 template with the whole corpus.
 *
 *   node tools/export-data.mjs data-export
 *   node tools/build-poster-wall-v2.mjs <template.html> data-export <out.html>
 *
 * The template is the user's file and is left alone. This replaces exactly one
 * thing — the `promptData` array — and nothing else. That is possible here in a way
 * it was not with the earlier template, because this one already hands the card
 * index to its handlers instead of interpolating prompt text into onclick
 * attributes, so quotes in the data cannot break anything.
 *
 * Category assignment, which is the other half of the request:
 *   · the 233 styles take their family name (華流國風, 攝影寫實, 動漫 …)
 *   · the 401 prompts take their corpus category (大頭照·證件照, 節慶·台灣民俗 …)
 * 52 categories in total; the template derives its chips and counts from whatever
 * it finds, so nothing else needs touching.
 */
import fs from 'node:fs';
import path from 'node:path';

const templateFile = path.resolve(process.argv[2]);
const dataDir = path.resolve(process.argv[3] || 'data-export');
const outFile = path.resolve(process.argv[4] || 'poster-wall.html');

const template = fs.readFileSync(templateFile, 'utf8');
const prompts = JSON.parse(fs.readFileSync(path.join(dataDir, 'prompts.json'), 'utf8'));
const styles = JSON.parse(fs.readFileSync(path.join(dataDir, 'styles.json'), 'utf8'));

const categoryName = new Map(prompts.categories.map((c) => [c.id, c.zh]));
const familyName = new Map(styles.families.map((f) => [f.k, f.n]));

/** Unfilled `{{placeholders}}` would otherwise be drawn literally, braces and all. */
const unwrap = (text) => String(text || '').replace(/\{\{([^}]+)\}\}/g, '$1');

const entries = [];

for (const style of styles.styles) {
  const family = familyName.get(style.f) || style.f;
  entries.push({
    category: family,
    title: style.n,
    subtitle: '(' + (style.e || family) + ')',
    description: style.d || family,
    prompt: unwrap(style.en),
  });
}

for (const prompt of prompts.prompts) {
  const category = categoryName.get(prompt.c) || prompt.c;
  entries.push({
    category,
    title: prompt.t,
    // The corpus prompts have no English name; the template always renders a
    // subtitle line, so the category stands in rather than leaving it blank.
    subtitle: '(' + category + ')',
    description: (prompt.k || '').split(',').map((t) => t.trim()).filter(Boolean).join(' · '),
    prompt: unwrap(prompt.en || prompt.zh),
  });
}

const lit = (value) => JSON.stringify(String(value));

const dataBlock =
  '        const promptData = [\n' +
  entries
    .map(
      (entry, index) =>
        '            { id: ' + lit(String(index + 1).padStart(3, '0')) +
        ', category: ' + lit(entry.category) +
        ', title: ' + lit(entry.title) +
        ', subtitle: ' + lit(entry.subtitle) +
        ', description: ' + lit(entry.description) +
        ', prompt: ' + lit(entry.prompt) +
        ', image: null }'
    )
    .join(',\n') +
  '\n        ];';

// Replace from `const promptData = [` through its closing `];`, and drop the
// placeholder note above it since it is instructions for this very step.
const noteStart = template.indexOf('        // 【重要提醒】');
const arrayStart = template.indexOf('        const promptData = [');
const arrayEnd = template.indexOf('\n        ];', arrayStart);
if (arrayStart === -1 || arrayEnd === -1) throw new Error('找不到 promptData 陣列');

const cutFrom = noteStart !== -1 && noteStart < arrayStart ? noteStart : arrayStart;
const output =
  template.slice(0, cutFrom) + dataBlock + template.slice(arrayEnd + '\n        ];'.length);

fs.writeFileSync(outFile, output);

const categories = [...new Set(entries.map((e) => e.category))];
console.log(
  '  ' + path.relative(process.cwd(), outFile) +
  '  ' + (fs.statSync(outFile).size / 1024).toFixed(0) + ' KB' +
  '  ·  ' + entries.length + ' 則  ·  ' + categories.length + ' 個分類'
);
console.log('  分類:', categories.join('、'));
