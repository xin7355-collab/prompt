/**
 * Every user-visible name lives here. Renaming the product is a one-file change:
 * app.json's `name`/`slug` and this file are the only two places the brand appears.
 */
export const BRAND = {
  /** Primary product name, Traditional Chinese. */
  zh: '咒語盒',
  /** Latin lockup — used in the wordmark, the App Store subtitle and the export filenames. */
  en: 'SPELLBOX',
  /** One line, shown under the wordmark and on the empty states. */
  taglineZh: '把一句話，鑄成一張圖',
  taglineEn: 'Forge a sentence into an image',
  /** Filename stem for backups and batch exports. ASCII only — some Android file pickers choke otherwise. */
  fileStem: 'spellbox',
} as const;
