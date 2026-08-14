/**
 * Fills the AI FASHION POSTER template with the whole corpus.
 *
 *   node tools/export-data.mjs data-export
 *   node tools/build-fashion-poster.mjs <template.html> data-export <out.html>
 *
 * The template is the user's own file and is treated as fixed: layout, styling,
 * Tailwind, fonts, the horizontal card strip, the card markup and the generateImage
 * call all pass through untouched. Only three things change.
 *
 *  1. `promptData` is replaced with all 634 entries.
 *
 *  2. The two inline handlers stop interpolating the prompt text and pass an index
 *     instead. This is not a style preference — the template writes the prompt into
 *     an `onclick="copyPrompt('…')"` attribute, so a prompt containing an apostrophe
 *     ends the JS string early and one containing a double quote ends the HTML
 *     attribute early. 34 of the 634 entries contain one or the other, which is 34
 *     cards whose buttons would simply not work. With five hand-picked prompts the
 *     template got away with it; with the real corpus it cannot.
 *
 *  3. The header's "150 款" becomes the real count, because it is now a lie.
 *
 * Nothing else is edited.
 */
import fs from 'node:fs';
import path from 'node:path';

const templateFile = path.resolve(process.argv[2]);
const dataDir = path.resolve(process.argv[3] || 'data-export');
const outFile = path.resolve(process.argv[4] || 'ai-fashion-poster-full.html');

const template = fs.readFileSync(templateFile, 'utf8');
const prompts = JSON.parse(fs.readFileSync(path.join(dataDir, 'prompts.json'), 'utf8'));
const styles = JSON.parse(fs.readFileSync(path.join(dataDir, 'styles.json'), 'utf8'));

const categoryName = new Map(prompts.categories.map((c) => [c.id, c.zh]));
const familyName = new Map(styles.families.map((f) => [f.k, f.n]));

/** Unfilled `{{placeholders}}` would be drawn literally, braces included. */
const unwrap = (text) => String(text || '').replace(/\{\{([^}]+)\}\}/g, '$1');

const entries = [];

for (const style of styles.styles) {
  entries.push({
    title: style.n,
    subtitle: style.e ? '(' + style.e + ')' : '(' + (familyName.get(style.f) || style.f) + ')',
    description: style.d || familyName.get(style.f) || '',
    prompt: unwrap(style.en),
  });
}

for (const prompt of prompts.prompts) {
  entries.push({
    title: prompt.t,
    // The template always renders a subtitle line; the corpus prompts have no
    // English name, so the category stands in rather than leaving a blank row.
    subtitle: '(' + (categoryName.get(prompt.c) || prompt.c) + ')',
    description: (prompt.k || '').split(',').map((t) => t.trim()).filter(Boolean).join(' · '),
    prompt: unwrap(prompt.en || prompt.zh),
  });
}

const literal = (value) => JSON.stringify(String(value));

const dataBlock =
  '        const promptData = [\n' +
  entries
    .map(function (entry, index) {
      return (
        '            {\n' +
        '                id: ' + literal(String(index + 1).padStart(3, '0')) + ',\n' +
        '                title: ' + literal(entry.title) + ',\n' +
        '                subtitle: ' + literal(entry.subtitle) + ',\n' +
        '                description: ' + literal(entry.description) + ',\n' +
        '                prompt: ' + literal(entry.prompt) + ',\n' +
        '                image: null\n' +
        '            }'
      );
    })
    .join(',\n') +
  '\n        ];';

// ── Surgical replacements ────────────────────────────────────────────
let output = template;
const replace = (label, find, insert) => {
  if (!output.includes(find)) throw new Error('範本裡找不到要替換的片段：' + label);
  output = output.replace(find, insert);
};

// 1. The data array, from `const promptData = [` to its closing `];`.
const start = output.indexOf('        const promptData = [');
const end = output.indexOf('\n        ];', start);
if (start === -1 || end === -1) throw new Error('找不到 promptData 陣列');
output = output.slice(0, start) + dataBlock + output.slice(end + '\n        ];'.length);

// 2. Hand the index to the handlers instead of interpolating the prompt text.
replace(
  'copy onclick',
  `onclick="copyPrompt('${'$'}{data.prompt}')"`,
  `onclick="copyPrompt(${'$'}{index})"`
);
replace(
  'draw onclick',
  `onclick="generateImage('${'$'}{data.id}', '${'$'}{data.prompt}')"`,
  `onclick="generateImage(${'$'}{index})"`
);
replace(
  'copyPrompt signature',
  'function copyPrompt(text) {',
  'function copyPrompt(index) {\n            const text = promptData[index].prompt;'
);
replace(
  'generateImage signature',
  'async function generateImage(id, prompt) {',
  'async function generateImage(index) {\n            const { id, prompt } = promptData[index];'
);

// 3. The header count.
replace('header count', '150 款嚴選時尚與插畫風格。', entries.length + ' 款嚴選時尚與插畫風格。');

fs.writeFileSync(outFile, output);

// The template renders `${data.prompt}` into HTML text as well; confirm nothing in
// the corpus can break out of that context.
const risky = entries.filter((e) => /[<>&]/.test(e.prompt)).length;

console.log(
  '  ' + path.relative(process.cwd(), outFile) +
  '  ' + (fs.statSync(outFile).size / 1024).toFixed(0) + ' KB' +
  '  ·  ' + entries.length + ' 則（' + styles.styles.length + ' 風格 + ' + prompts.prompts.length + ' 提示詞）'
);
console.log('  HTML 危險字元（<>&）：' + risky + ' 則');
console.log('  範本改動：promptData、兩個 onclick 傳 index、兩個函式簽章、標題數字');
