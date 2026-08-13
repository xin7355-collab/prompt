import fs from 'node:fs';

const posters = JSON.parse(
  fs.readFileSync('/tmp/claude-0/-home-user-prompt/8a53d792-e047-521b-be16-5ad18f4a3af3/scratchpad/posters.json', 'utf8')
);

/**
 * Swatch palettes for the stand-in tiles. Dark editorial grounds to match the source
 * collection's look, each with a saturated primary and a lighter accent band.
 */
const PALETTES = [
  ['#101418', '#1F5C4A', '#D9C9A8'],
  ['#14100E', '#B5482F', '#E8CBA0'],
  ['#0E1220', '#2E4FA8', '#C8D6F0'],
  ['#181014', '#8C2F5B', '#E8C0D2'],
  ['#101810', '#4A7A38', '#D8E4B8'],
  ['#1A1410', '#C08A2E', '#F0E0BC'],
  ['#0C1418', '#2A7A8C', '#C4E4EC'],
  ['#160E1A', '#6B3FA0', '#D8C4EC'],
  ['#1A1212', '#A83A3A', '#EED0C4'],
  ['#0E1614', '#2F8C74', '#C8E8DC'],
  ['#181818', '#7A7A7A', '#E8E8E8'],
  ['#141018', '#4A3F8C', '#CFC8EC'],
  ['#1A1608', '#8C7A20', '#EDE4B8'],
  ['#100E14', '#B03A6E', '#F0C8DC'],
  ['#0A1220', '#3A6EB5', '#CCDCF4'],
  ['#181008', '#C4622A', '#F4D8B4'],
  ['#0E1410', '#5C8C4A', '#DCE8C8'],
  ['#141416', '#5B6E8C', '#D4DCE8'],
  ['#1A0E10', '#8C2A2A', '#E8C0BC'],
  ['#0C1616', '#3A8C8C', '#C8E8E8'],
  ['#161014', '#A0509C', '#EAD0E8'],
  ['#12160C', '#7A9A2E', '#E4EEC0'],
  ['#101010', '#C9A227', '#F2E6C0'],
  ['#0E1018', '#5A5FC4', '#D2D4F0'],
];

/** Latin name -> a stable ascii id, so a renamed title does not orphan saved images. */
function slug(text, index) {
  const base = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `p-${String(index).padStart(3, '0')}-${base}`.slice(0, 48);
}

/** Escapes a string for a single-quoted TS literal. */
function lit(text) {
  return text.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

/** Two or three search tags per entry, taken from the Chinese description. */
function tagsFor(entry) {
  const family = entry.index <= 50 ? '國風' : '時尚';
  const extra = entry.e.split(/\s+/).slice(0, 2).join(' ');
  return [family, entry.n, extra].filter(Boolean).join(',');
}

const lines = posters.map((entry) => {
  const palette = PALETTES[(entry.index * 7) % PALETTES.length];
  return `  {
    id: '${slug(entry.e || entry.n, entry.index)}',
    n: '${lit(entry.n)}',
    e: '${lit(entry.e)}',
    f: '${entry.index <= 50 ? 'cnfashion' : 'fashion'}',
    k: '${lit(tagsFor(entry))}',
    d: '${lit(entry.d)}',
    en: '${lit(entry.p)}',
    sw: ['${palette[0]}', '${palette[1]}', '${palette[2]}'],
  },`;
});

const file = `import type { VisualStyle } from './styles';

/**
 * The AI Fashion Poster collection — 150 ready-made poster prompts, 50 華流國風 plus
 * 100 時尚, transcribed from the reference page this feature was modelled on.
 *
 * These differ in kind from the entries in \`styles.ts\`. Those are *style clauses*
 * with no subject, meant to be combined with whatever the user types. These are
 * finished prompts that already name their own subject, which is why they carry
 * \`full: true\` — \`composeStyle\` sends them as-is and treats the wall's subject
 * field as an override rather than the lead.
 *
 * They carry no \`zh\` body on purpose. The image models these are aimed at are
 * trained overwhelmingly on English captions, and the source wrote every prompt in
 * English for that reason; \`d\` holds the Chinese explanation the card shows instead.
 * \`composeStyle\` falls back to \`en\` when a Chinese body is absent.
 *
 * Generated from the source collection; edit the generator, not this file, if the
 * whole set needs regenerating. Individual fixes here are fine.
 */
const ENTRIES: VisualStyle[] = [
${lines.join('\n')}
];

/** The flag is uniform across the collection, so it is applied here rather than repeated 150 times. */
export const POSTERS: VisualStyle[] = ENTRIES.map((entry) => ({ ...entry, full: true }));
`;

fs.writeFileSync('/home/user/prompt/src/data/posters.ts', file);
console.log('wrote src/data/posters.ts —', posters.length, 'entries,', file.length, 'bytes');

const ids = posters.map((e) => slug(e.e || e.n, e.index));
console.log('unique ids:', new Set(ids).size);
