import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, Platform } from 'react-native';

import { categoryAccent, darkPalette, lightPalette, type Palette } from '../theme';
import { useVault } from '../store/vault';

export type ThemePreference = 'system' | 'light' | 'dark';

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
  /** Resolves a category id to an accent legible against the current background. */
  accentFor(catId: string): string;
}

const ThemeContext = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useVault();
  const system = useSystemScheme();
  const dark = theme === 'system' ? system === 'dark' : theme === 'dark';

  const value = useMemo<ThemeValue>(
    () => ({
      dark,
      c: dark ? darkPalette : lightPalette,
      accentFor(catId: string) {
        const entry = categoryAccent[catId];
        if (!entry) return dark ? darkPalette.pine : lightPalette.pine;
        return dark ? entry.dark : entry.light;
      },
    }),
    [dark]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
