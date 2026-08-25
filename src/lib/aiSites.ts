/**
 * Where a prompt can be pasted to be drawn for free.
 *
 * The app can draw in place (Pollinations, or a key), but the sharpest faces still
 * come from the big consumer apps — and those have no API a web page may call, so the
 * honest path is the one the user already knows: copy the prompt, open the site, paste.
 * This is the list behind the ↗ buttons on every prompt. Keep it to genuinely free,
 * genuinely useful image generators; each still costs the user one paste, so more than
 * a handful is noise.
 */
export type AiSite = 'gemini' | 'gpt' | 'meta' | 'veo';

export interface AiSiteDef {
  k: AiSite;
  /** Button label. */
  label: string;
  /** Landing page to open. */
  url: string;
  /** One-line reason to pick this one, for a tooltip / accessibility label. */
  note: string;
}

export const AI_SITES: AiSiteDef[] = [
  {
    k: 'gemini',
    label: '↗ Gemini',
    url: 'https://gemini.google.com/app',
    note: 'Nano Banana：多角度、同一角色最穩，免費',
  },
  {
    k: 'gpt',
    label: '↗ ChatGPT',
    url: 'https://chatgpt.com/',
    note: 'Image 2.0：密集文字、寫實臉最強，免費可用',
  },
  {
    k: 'meta',
    label: '↗ Meta AI',
    url: 'https://www.meta.ai/',
    note: '免費生圖，需 FB／IG 登入',
  },
  {
    k: 'veo',
    label: '↗ VEO Free',
    url: 'https://veoaifree.com/',
    note: '免登入免費，圖片與影片都能生',
  },
];

/** The landing page for a site key, falling back to the first entry. */
export function aiSiteUrl(site: AiSite): string {
  return (AI_SITES.find((s) => s.k === site) ?? AI_SITES[0]).url;
}
