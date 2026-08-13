import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import type { VisualStyle } from '../data/styles';
import { AppText as Text } from './AppText';

/**
 * The stand-in a style shows before the user has saved a real image for it.
 *
 * A grid of identical grey rectangles is unusable — you cannot choose by looking if
 * everything looks the same. Each style therefore carries a three-colour palette,
 * drawn here as a disc and a band, with the first character of its name set large
 * over the ground. The character rather than the family glyph, because a family
 * glyph is identical across every tile in that family and so distinguishes nothing;
 * 電, 柔, 黃 are unique per style and readable at thumbnail size.
 *
 * It does not claim to preview the output. It is a stable, distinct mark that makes
 * the wall scannable on the first visit, and a real thumbnail replaces it the moment
 * there is one.
 */

/** Perceived lightness of a #rrggbb colour, 0–1, via the sRGB luma coefficients. */
function luminance(hex: string): number {
  const value = hex.replace('#', '');
  const full =
    value.length === 3
      ? value
          .split('')
          .map((ch) => ch + ch)
          .join('')
      : value;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Ink that stays legible on `background`, whichever end of the range it sits at. */
function inkOn(background: string): string {
  return luminance(background) > 0.55 ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.72)';
}

export function StyleSwatch({
  style: visual,
  glyphSize = 30,
  containerStyle,
}: {
  style: VisualStyle;
  glyphSize?: number;
  containerStyle?: StyleProp<ViewStyle>;
}) {
  const [ground, primary, accent] = visual.sw;

  return (
    <View style={[styles.swatch, { backgroundColor: ground }, containerStyle]}>
      <View style={[styles.disc, { backgroundColor: primary }]} />
      <View style={[styles.band, { backgroundColor: accent }]} />
      <Text
        style={[
          styles.mark,
          { color: inkOn(ground), fontSize: glyphSize, lineHeight: glyphSize * 1.2 },
        ]}
      >
        {visual.n.slice(0, 1)}
      </Text>
    </View>
  );
}

const noSelect = { userSelect: 'none' } as const;

const styles = StyleSheet.create({
  swatch: { width: '100%', height: '100%', overflow: 'hidden' },
  /** Sits off the top-right corner so no two tiles read as the same shape. */
  disc: { position: 'absolute', borderRadius: 999, width: '76%', aspectRatio: 1, top: '-22%', right: '-14%' },
  /** A band along the bottom turns the tile into a palette card rather than a blob. */
  band: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '17%' },
  /**
   * Bottom-left, clear of the disc: contrast is computed against the ground, so the
   * mark must not stray onto the disc where that calculation no longer holds.
   */
  mark: {
    ...noSelect,
    position: 'absolute',
    left: '7%',
    bottom: '22%',
    fontWeight: '800',
    letterSpacing: -1,
  },
});
