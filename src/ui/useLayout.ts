import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { space } from '../theme';

/**
 * The measurements every screen needs to survive rotation.
 *
 * Two things break a portrait-only layout when the phone turns:
 *
 * 1. A notch moves to the side, so the safe area appears on left/right instead of
 *    top. Screens that only pad `top` end up with content under the cutout.
 * 2. A single text column stretched to 900pt is unreadable — the eye loses the line.
 *    Reading screens get a max width and centre themselves in whatever is left.
 */
export function useLayout() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const landscape = width > height;

  /** Card grid columns. Widens with the viewport rather than with orientation alone. */
  const columns = width >= 1050 ? 3 : width >= 700 ? 2 : 1;

  /** Comfortable measure for a body-text column, in points. */
  const readingWidth = 720;

  return {
    width,
    height,
    landscape,
    columns,
    insets,

    /**
     * Horizontal padding that clears a side notch. In portrait the insets are zero
     * and this collapses to the normal gutter.
     */
    gutter: {
      paddingLeft: Math.max(insets.left, 0) + space.md,
      paddingRight: Math.max(insets.right, 0) + space.md,
    },

    /** Centres a reading column and stops it stretching across a wide screen. */
    column: {
      width: '100%' as const,
      maxWidth: readingWidth,
      alignSelf: 'center' as const,
    },
  };
}
