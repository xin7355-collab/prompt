import { FORGE_AXES, FORGE_GUARD, RANDOMISABLE, type ForgeAxis } from '../data/forge';

/** axis key -> selected option indices. Single-select axes hold at most one. */
export type ForgeSelection = Record<string, number[]>;

/** The gender option id currently chosen, used to gate gender-specific axes. */
export function selectedGenderId(selection: ForgeSelection): string | undefined {
  const axis = FORGE_AXES.find((a) => a.key === 'gender')!;
  const index = selection.gender?.[0];
  return index === undefined ? undefined : axis.options[index]?.id;
}

/** Axes to render, after gender gating. */
export function visibleAxes(selection: ForgeSelection): ForgeAxis[] {
  const gender = selectedGenderId(selection);
  return FORGE_AXES.filter(
    (axis) => !axis.showForGender || (gender !== undefined && axis.showForGender.includes(gender))
  );
}

/** Selected values for an axis, using the prose wording where one is defined. */
function picked(selection: ForgeSelection, key: string, lang: 'zh' | 'en'): string[] {
  const axis = FORGE_AXES.find((a) => a.key === key);
  if (!axis) return [];
  return (selection[key] ?? [])
    .map((i) => axis.options[i])
    .filter(Boolean)
    .map((o) => (lang === 'zh' ? o.zhOut ?? o.zh : o.enOut ?? o.en));
}

export interface ForgeResult {
  zh: string;
  en: string;
  /** Appearance-only text, for saving as a locked character. */
  dnaZh: string;
  dnaEn: string;
  /** How many axes the user has answered. */
  chosen: number;
}

/**
 * Turns the picks into a prompt.
 *
 * Written as flowing description rather than a bulleted sheet: the corpus is written
 * that way and it survives every model, whereas label-colon-value lines get read as
 * literal text to render by some of them. The two languages are built separately
 * rather than one translated from the other, because the word order differs — Chinese
 * puts the garment colour before the garment, English after.
 */
export function composeForge(selection: ForgeSelection): ForgeResult {
  const buildZh = () => {
    const get = (k: string) => picked(selection, k, 'zh');
    const one = (k: string) => get(k)[0];

    const gender = one('gender') ?? '人物';
    const age = one('age');
    const ethnicity = one('ethnicity');

    // 一位成年女性（18 歲以上），二十出頭，東亞面孔
    const person = [
      `一位成年${gender}（18 歲以上）`,
      age,
      ethnicity ? `${ethnicity}面孔` : '',
    ].filter(Boolean).join('，');

    const bodyBits = [...get('build'), ...get('muscle'), ...get('height'), ...get('bust')];
    const body = bodyBits.length ? `身形${bodyBits.join('、')}` : '';

    const head = [...get('face'), ...get('eyes')].join('、');

    // 一頭黑色的及腰長髮，大波浪捲
    const hairColor = one('hairColor');
    const hairLength = one('hairLength');
    const hairStyle = one('hairStyle');
    let hair = '';
    if (hairLength || hairStyle || hairColor) {
      const core = hairLength || hairStyle || '頭髮';
      hair = `一頭${hairColor ? `${hairColor}的` : ''}${core}`;
      if (hairStyle && hairStyle !== core) hair += `，${hairStyle}`;
    }

    const marks = get('facial').join('、');

    // 身穿正紅色旗袍 — colour goes in front in Chinese
    const outfit = one('outfit');
    const outfitColor = one('outfitColor');
    const wardrobe: string[] = [];
    if (outfit) wardrobe.push(`身穿${outfitColor ?? ''}${outfit}`);
    const shoes = one('footwear');
    if (shoes) wardrobe.push(shoes === '赤腳' ? '赤腳' : `腳著${shoes}`);
    const props = get('props').join('、');
    if (props) wardrobe.push(props);

    // Foot detail rides with the pose, and skin state with the body, so they read as
    // one description instead of a list of unrelated clauses.
    const action = [one('pose'), one('footPose')].filter(Boolean).join('，');
    const framing = [
      action, one('mood'), one('skin'), one('scene'),
      one('shot'), one('camera'), one('light'), one('style'),
    ].filter(Boolean);

    const appearance = [person, body, head, hair, marks].filter(Boolean);
    const dna = appearance.join('，') + '。';

    const full = [appearance.join('，'), wardrobe.join('，'), framing.join('，')]
      .filter(Boolean)
      .join('。') +
      '。整體為角色概念設計，人物比例正確、手部完整、服裝細節清晰。';

    return { full, dna };
  };

  const buildEn = () => {
    const get = (k: string) => picked(selection, k, 'en');
    const one = (k: string) => get(k)[0];

    const gender = one('gender') ?? 'a person';
    const age = one('age');
    const ethnicity = one('ethnicity');

    const person = [
      `${gender}, ${FORGE_GUARD.en}`,
      age,
      ethnicity,
    ].filter(Boolean).join(', ');

    const bodyBits = [...get('build'), ...get('muscle'), ...get('height'), ...get('bust')];
    const body = bodyBits.length ? `with ${bodyBits.join(', ')}` : '';

    const head = [...get('face'), ...get('eyes')].join(', ');
    const hair = [one('hairColor'), one('hairLength'), one('hairStyle')].filter(Boolean).join(', ');
    const marks = get('facial').join(', ');

    // wearing a fitted qipao ... in crimson red — colour trails in English
    const outfit = one('outfit');
    const outfitColor = one('outfitColor');
    const wardrobe: string[] = [];
    if (outfit) wardrobe.push(`wearing ${outfit}${outfitColor ? ` ${outfitColor}` : ''}`);
    const shoes = one('footwear');
    if (shoes) wardrobe.push(shoes);
    const props = get('props').join(', ');
    if (props) wardrobe.push(props);

    const action = [one('pose'), one('footPose')].filter(Boolean).join(', ');
    const framing = [
      action, one('mood'), one('skin'), one('scene'),
      one('shot'), one('camera'), one('light'), one('style'),
    ].filter(Boolean);

    const appearance = [person, body, head, hair, marks].filter(Boolean);
    const dna = appearance.join(', ') + '.';

    const full = [appearance.join(', '), wardrobe.join(', '), framing.join(', ')]
      .filter(Boolean)
      .join('. ') +
      '. Character concept design; correct anatomy, complete hands, clean garment detail.';

    return { full, dna };
  };

  const zh = buildZh();
  const en = buildEn();
  const chosen = Object.values(selection).filter((v) => v.length > 0).length;

  return { zh: zh.full, en: en.full, dnaZh: zh.dna, dnaEn: en.dna, chosen };
}

/**
 * Fills every randomisable axis with a random option, leaving multi-select extras alone
 * so the result stays a coherent character rather than a pile of accessories.
 */
export function randomSelection(random: () => number = Math.random): ForgeSelection {
  const next: ForgeSelection = {};
  for (const axis of FORGE_AXES) {
    if (!RANDOMISABLE.has(axis.key)) continue;
    next[axis.key] = [Math.floor(random() * axis.options.length)];
  }
  // Gender-gated axes only make sense once gender is known; drop any that no longer apply.
  const gender = selectedGenderId(next);
  for (const axis of FORGE_AXES) {
    if (axis.showForGender && (gender === undefined || !axis.showForGender.includes(gender))) {
      delete next[axis.key];
    }
  }
  return next;
}
