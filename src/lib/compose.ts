import { DNA_LOCK, MODES, MODIFIERS, NEGATIVES } from '../data/corpus';
import type { Character, Format, Lang, Prompt } from '../data/types';

/** Everything the bench needs to turn a base prompt into a final, pasteable string. */
export interface BenchState {
  base: Prompt | null;
  mode: string;
  /** modifier group key -> selected item indices */
  mods: Record<string, number[]>;
  ratio: string;
  negs: number[];
  /** placeholder name -> user-supplied value */
  vars: Record<string, string>;
  /** id of the locked character, '' when unlocked */
  char: string;
  /** Optional fixed seed, passed through for platforms that accept one. */
  seed: string;
}

export const emptyBench: BenchState = {
  base: null,
  mode: 't2i',
  mods: {},
  ratio: '',
  negs: [],
  vars: {},
  char: '',
  seed: '',
};

const PLACEHOLDER = /\{\{([^}]+)\}\}/g;

/** Unique placeholder names in a prompt body, in the order they appear. */
export function placeholdersIn(text: string): string[] {
  const found = text.matchAll(PLACEHOLDER);
  return [...new Set([...found].map((m) => m[1].trim()))];
}

/** The prompt body for the active language, falling back to Chinese when English is blank. */
export function bodyOf(prompt: Pick<Prompt, 'zh' | 'en'>, lang: Lang): string {
  return (lang === 'zh' ? prompt.zh : prompt.en) || prompt.zh || prompt.en || '';
}

export interface ComposeArgs {
  bench: BenchState;
  lang: Lang;
  format: Format;
  characters: Character[];
  /** One pack variation appended to the base, used when firing a whole batch. */
  variation?: string;
}

/**
 * Assembles the final prompt.
 *
 * Order matters and mirrors how the models read it: image-mode instruction first so
 * the model knows not to redraw the subject, then the locked character, then the
 * scene, and finally the machine-readable switches.
 */
export function compose({ bench, lang, format, characters, variation }: ComposeArgs): string {
  if (!bench.base) return '';
  const zh = lang === 'zh';

  let text = bodyOf(bench.base, lang);
  text = text.replace(PLACEHOLDER, (whole, name: string) => bench.vars[name.trim()] || whole);

  if (variation) {
    text += (zh ? '。這一張是：' : ' This variation: ') + variation + (zh ? '。' : '.');
  }

  const styleBits: string[] = [];
  for (const group of MODIFIERS) {
    for (const index of bench.mods[group.k] ?? []) {
      const item = group.items[index];
      if (item) styleBits.push(zh ? item[0] : item[1]);
    }
  }
  if (styleBits.length) {
    text += (zh ? '。風格加成：' : ' Style: ') + styleBits.join(zh ? '、' : ', ') + (zh ? '。' : '.');
  }

  const negatives = bench.negs.map((i) => (zh ? NEGATIVES[i]?.[0] : NEGATIVES[i]?.[1])).filter(Boolean);

  if (format === 'mj') {
    if (negatives.length) text += ' --no ' + negatives.join(', ');
    if (bench.ratio) text += ' --ar ' + bench.ratio;
    if (bench.seed.trim()) text += ' --seed ' + bench.seed.trim();
  } else if (format === 'sd') {
    text = '(masterpiece:1.2), (best quality:1.2), ' + text;
    if (bench.ratio) text += ' , aspect ratio ' + bench.ratio;
    if (negatives.length) text += '\n\nNegative prompt: ' + negatives.join(', ');
    if (bench.seed.trim()) text += '\nSeed: ' + bench.seed.trim();
  } else {
    if (bench.ratio) text += zh ? ` 畫面比例 ${bench.ratio}。` : ` Aspect ratio ${bench.ratio}.`;
    if (negatives.length) {
      text += (zh ? ' 請避免：' : ' Avoid: ') + negatives.join(zh ? '、' : ', ') + (zh ? '。' : '.');
    }
    if (bench.seed.trim()) {
      text += zh ? ` 使用種子值 ${bench.seed.trim()}。` : ` Use seed ${bench.seed.trim()}.`;
    }
  }

  const character = characters.find((c) => c.id === bench.char);
  if (character) {
    const dna = (zh ? character.zh : character.en) || character.zh || '';
    if (dna.trim()) text = dna.trim() + (zh ? DNA_LOCK.zh : DNA_LOCK.en) + text;
  }

  const mode = MODES.find((m) => m.k === bench.mode);
  if (mode && mode.k !== 't2i') text = (zh ? mode.zh : mode.en) + text;

  return text;
}
