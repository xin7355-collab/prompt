import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, Platform } from 'react-native';

import { categoryAccent, darkPalette, lightPalette, type Palette } from '../theme';
import { useVault } from '../store/vault';

export type ThemePreference = 'system' | 'light' | 'dark';

export type TextSize = 'sm' | 'md' | 'lg' | 'xl';

/**
 * Type-size multipliers. The top of the range stops at 1.3 deliberately: past that,
 * Chinese labels on fixed-width controls start wrapping mid-word however much the
 * containers grow, so a larger step would trade legibility for a broken layout.
 */
export const TEXT_SCALES: Record<TextSize, number> = {
  sm: 0.88,
  md: 1,
  lg: 1.15,
  xl: 1.3,
};

/**
 * Resolves the system appearance.
 *
 * `useColorScheme()` from react-native never updates under react-native-web's static
 * export, so on web we read `prefers-color-scheme` directly and subscribe to it. On
 * native, `Appearance` is the same source the hook uses.
 */
function useSystemScheme(): 'light' | 'dark' {
  // Appearance can also report 'unspecified'; anything but 'dark' means light.
  const normalise = (value: unknown): 'light' | 'dark' => (value === 'dark' ? 'dark' : 'light');
  const [scheme, setScheme] = useState<'light' | 'dark'>(() =>
    normalise(Appearance.getColorScheme())
  );

  useEffect(() => {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined' || !window.matchMedia) return;
      const query = window.matchMedia('(prefers-color-scheme: dark)');
      const sync = () => setScheme(query.matches ? 'dark' : 'light');
      sync();
      query.addEventListener('change', sync);
      return () => query.removeEventListener('change', sync);
    }

    const subscription = Appearance.addChangeListener(({ colorScheme }) =>
      setScheme(normalise(colorScheme))
    );
    return () => subscription.remove();
  }, []);

  return scheme;
}

interface ThemeValue {
  dark: boolean;
  c: Palette;
  /** Type-size multiplier; AppText applies it, layouts use it to grow containers. */
  scale: number;
  /** Rounds a scaled dimension, for min-heights that must keep up with the text. */
  sz(value: number): number;
  /** Resolves a category id to an accent legible against the current background. */
  accentFor(catId: string): string;
}

const ThemeContext = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, textSize } = useVault();
  const system = useSystemScheme();
  const dark = theme === 'system' ? system === 'dark' : theme === 'dark';
  const scale = TEXT_SCALES[textSize] ?? 1;

  const value = useMemo<ThemeValue>(
    () => ({
      dark,
      scale,
      // Controls only need to grow, never shrink — a 0.88 scale must not make a
      // 44pt tap target too small to hit.
      sz: (value: number) => Math.round(value * Math.max(1, scale)),
      c: dark ? darkPalette : lightPalette,
      accentFor(catId: string) {
        const entry = categoryAccent[catId];
        if (!entry) return dark ? darkPalette.pine : lightPalette.pine;
        return dark ? entry.dark : entry.light;
      },
    }),
    [dark, scale]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
