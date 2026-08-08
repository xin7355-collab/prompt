import React from 'react';
import { StyleSheet, Text as RNText, type TextProps, type TextStyle } from 'react-native';

import { useTheme } from './ThemeProvider';

/**
 * Text that honours the app's type-size setting.
 *
 * Every screen imports this instead of react-native's Text. It multiplies the
 * `fontSize` and `lineHeight` of whatever style it is given, so the two always move
 * together — scaling the size alone is what makes lines collide and blocks overlap.
 *
 * `allowFontScaling` is left at its default so the OS accessibility setting still
 * compounds with this one; a user who has enlarged text system-wide keeps that.
 */
export function AppText({ style, ...props }: TextProps) {
  const { scale } = useTheme();
  return <RNText {...props} style={scaleTextStyle(style, scale)} />;
}

/**
 * Multiplies the type metrics of a style tree.
 *
 * StyleSheet.create returns opaque ids on native, so the style is flattened first;
 * that also collapses arrays and nulls into one object for the caller.
 */
export function scaleTextStyle(
  style: TextProps['style'],
  scale: number
): TextStyle | undefined {
  if (scale === 1) return style as TextStyle | undefined;

  const flat = StyleSheet.flatten(style) as TextStyle | undefined;
  if (!flat) return flat;

  const next: TextStyle = { ...flat };
  if (typeof flat.fontSize === 'number') next.fontSize = flat.fontSize * scale;
  if (typeof flat.lineHeight === 'number') next.lineHeight = flat.lineHeight * scale;
  return next;
}
