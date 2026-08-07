import raw from '../../assets/data/corpus.json';
import { EXTRA_CATEGORIES, EXTRA_PACKS, EXTRA_PROMPTS } from './addendum';
import type { Category, Mode, ModifierGroup, Pack, Prompt, RatioSpec, Site } from './types';

/**
 * The bundled corpus, generated from the original single-file prototype by
 * `tools/extract-data.mjs`. Re-run `npm run extract-data <html> <out.json>` to refresh it.
 */
export const CATEGORIES: Category[] = [...(raw.cats as Category[]), ...EXTRA_CATEGORIES];
export const PROMPTS: Prompt[] = [...(raw.prompts as Prompt[]), ...EXTRA_PROMPTS];
export const MODIFIERS = raw.mods as ModifierGroup[];
export const RATIOS = raw.ratios as RatioSpec[];
export const MODES = raw.modes as Mode[];
export const SITES = raw.sites as Site[];
export const PACKS: Pack[] = [...(raw.packs as Pack[]), ...EXTRA_PACKS];
export const NEGATIVES = raw.negs as [string, string][];

/** Placeholder scaffold for a locked character's fixed appearance. */
export const DNA_TEMPLATE = raw.dnaTemplate as { zh: string; en: string };
/** The instruction appended after a character block telling the model not to drift. */
export const DNA_LOCK = raw.dnaLock as { zh: string; en: string };

const categoryById = new Map(CATEGORIES.map((c) => [c.id, c]));

export function categoryOf(id: string): Category {
  return categoryById.get(id) ?? { id, zh: id, en: id };
}

/** Splits the comma-joined tag field into trimmed, non-empty tags. */
export function tagsOf(prompt: { k?: string }): string[] {
  return (prompt.k ?? '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}
