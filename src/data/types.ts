export type Lang = 'zh' | 'en';

/** Output dialect. Each target platform wants negatives and aspect ratio expressed differently. */
export type Format = 'plain' | 'mj' | 'sd';

export interface Category {
  id: string;
  zh: string;
  en: string;
}

/**
 * Field names are one letter because they came from the prototype's compact seed
 * format and there are 353 of them; renaming would bloat the bundled JSON for no gain.
 * i = id, c = category, t = title, k = keywords/tags, zh/en = the prompt bodies.
 */
export interface Prompt {
  i: string;
  c: string;
  t: string;
  k: string;
  zh: string;
  en: string;
}

/** A prompt as the UI sees it, after user overrides and provenance are folded in. */
export interface ResolvedPrompt extends Prompt {
  source: 'seed' | 'mine';
  edited: boolean;
}

export interface ModifierGroup {
  /** Group label, Traditional Chinese (光線 / 鏡頭 / 色調 …). */
  g: string;
  /** Stable key used in saved bench state. */
  k: string;
  /** [zh, en] pairs. */
  items: [string, string][];
}

export interface RatioSpec {
  r: string;
  w: number;
  h: number;
  /** What this ratio is actually for, in plain language. */
  use: string;
}

export interface Mode {
  k: string;
  n: string;
  d: string;
  /** Preamble injected ahead of the prompt so the model preserves the uploaded image. */
  zh: string;
  en: string;
}

export interface Site {
  n: string;
  u: string;
  /** Truthy when the site accepts the prompt as a URL query parameter. */
  q: number | null;
}

export interface Pack {
  id: string;
  n: string;
  hint?: string;
  items: [string, string][];
  /** Set on user-authored packs so the UI offers edit/delete. */
  mine?: boolean;
}

export interface Character {
  id: string;
  name: string;
  zh: string;
  en: string;
}

export interface HistoryEntry {
  t: string;
  zh: string;
  en: string;
  k: string;
  at: number;
}
