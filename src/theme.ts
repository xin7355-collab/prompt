import { Platform } from 'react-native';

/**
 * The design language keeps the original prototype's heritage palette — pine green,
 * vermilion and gold on paper — but rebuilds it as a two-mode token set so the app
 * follows the system appearance instead of forcing one look.
 */

const shared = {
  /** Brand constants that must not flip between modes. */
  vermilion: '#D6452F',
  gold: '#D9A227',
  pine: '#1E5245',
};

/** The token contract both modes must satisfy. */
export interface Palette {
  vermilion: string;
  gold: string;
  pine: string;
  bg: string;
  surface: string;
  surfaceSunken: string;
  chrome: string;
  onChrome: string;
  onChromeDim: string;
  text: string;
  textDim: string;
  textFaint: string;
  border: string;
  borderStrong: string;
  onAccent: string;
  onGold: string;
  danger: string;
  success: string;
  scrim: string;
}

export const lightPalette: Palette = {
  ...shared,
  /** Screen background. */
  bg: '#EFF1EA',
  /** Raised surfaces: cards, sheets, inputs. */
  surface: '#FCFCFA',
  /** A surface sitting on top of another surface (prompt body, code blocks). */
  surfaceSunken: '#E7E9E0',
  /** Header / tab bar chrome. */
  chrome: '#12171A',
  onChrome: '#EEF2EC',
  onChromeDim: 'rgba(238,242,236,0.55)',

  text: '#12171A',
  textDim: '#4A5652',
  textFaint: '#77827D',

  border: '#D3D7CD',
  borderStrong: '#B2B9AC',

  /** Foreground that sits on top of `vermilion` / `pine` / `gold` fills. */
  onAccent: '#FFFFFF',
  onGold: '#2A1F00',

  danger: '#C0392B',
  success: '#2F7A56',
  scrim: 'rgba(18,23,26,0.55)',
};

export const darkPalette: Palette = {
  ...shared,
  vermilion: '#F05C42',
  gold: '#E5B23F',
  pine: '#3E8A73',

  bg: '#0E1211',
  surface: '#181D1B',
  surfaceSunken: '#0A0D0C',
  chrome: '#050807',
  onChrome: '#E9EEEA',
  onChromeDim: 'rgba(233,238,234,0.55)',

  text: '#E9EEEA',
  textDim: '#A5B0AA',
  textFaint: '#77837D',

  border: '#2A322F',
  borderStrong: '#3C4642',

  onAccent: '#FFFFFF',
  onGold: '#20180A',

  danger: '#F0705C',
  success: '#5FB78C',
  scrim: 'rgba(0,0,0,0.65)',
};

/**
 * Category accents. The prototype's values are tuned for a paper background and go
 * muddy on black, so dark mode gets a lifted variant of each hue rather than a filter.
 */
export const categoryAccent: Record<string, { light: string; dark: string }> = {
  headshot: { light: '#1F4B3F', dark: '#4FA98F' },
  business: { light: '#2E5F8A', dark: '#69A8DE' },
  life: { light: '#C9743B', dark: '#E9A06A' },
  style: { light: '#7A4A8C', dark: '#B98BC9' },
  char: { light: '#B03A6E', dark: '#E280AC' },
  finance: { light: '#1D6B63', dark: '#4FB3A7' },
  festival: { light: '#C0392B', dark: '#F0705C' },
  morning: { light: '#D9962B', dark: '#EFBB5C' },
  birthday: { light: '#D4557F', dark: '#F28BAC' },
  product: { light: '#4A5A6B', dark: '#93A6B8' },
  food: { light: '#B5601F', dark: '#E4915A' },
  agri: { light: '#4C7A2E', dark: '#8FC468' },
  social: { light: '#8B4FB0', dark: '#BC8CD9' },
  logo: { light: '#2F3E46', dark: '#8FA2AC' },
  scene: { light: '#2A7A8C', dark: '#63BDD1' },
  render: { light: '#5566C4', dark: '#909DEC' },
  pet: { light: '#A8722C', dark: '#DCAA61' },
  sticker: { light: '#D06B2C', dark: '#F0A165' },
  wedding: { light: '#B08BA5', dark: '#D9B4CB' },
  fashion: { light: '#8A2E4D', dark: '#D46B8E' },
  interior: { light: '#7A6A52', dark: '#C4B08C' },
  poster: { light: '#334A5E', dark: '#7FA0BC' },
  edu: { light: '#3E7C59', dark: '#77C098' },
  health: { light: '#2D8B8B', dark: '#63C6C6' },
  auto: { light: '#4A4F58', dark: '#9AA2AE' },
  wall: { light: '#6B5B95', dark: '#A697D6' },
  milestone: { light: '#8C3B2E', dark: '#D4776A' },
  charvar: { light: '#9B4B8A', dark: '#D089C0' },
  shop: { light: '#0F6E7A', dark: '#4FB2BE' },
  trend: { light: '#C24E1E', dark: '#EE8A57' },
  retouch: { light: '#3B6E8F', dark: '#7BB2D2' },
  game: { light: '#6A3FA0', dark: '#A585DC' },
  music: { light: '#9C3B5E', dark: '#DE7E9C' },
  concept: { light: '#2B6E9E', dark: '#6FAFDC' },
  localbiz: { light: '#7A5B2E', dark: '#CBA96C' },
  taiwan: { light: '#B03B2E', dark: '#EA7B6C' },
};

/** 4pt base scale — every margin and gap in the app is one of these. */
export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
} as const;

/**
 * Prompt bodies are set in a monospace face so variable placeholders and line breaks
 * stay visually stable; everything else uses the platform UI face, which already picks
 * a proper Traditional Chinese font on both platforms.
 */
export const fonts = {
  mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' })!,
  ui: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' })!,
  uiMedium: Platform.select({ ios: 'System', android: 'sans-serif-medium', default: 'System' })!,
};
