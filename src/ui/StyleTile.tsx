import React, { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { familyOf, type VisualStyle } from '../data/styles';
import { fonts, radius, space } from '../theme';
import { useTheme } from './ThemeProvider';
import { AppText as Text } from './AppText';
import { ShotImage } from './ShotImage';
import { StyleSwatch } from './StyleSwatch';

export interface StyleTileProps {
  style: VisualStyle;
  /** Newest saved thumbnail for this style, if there is one. */
  shotUri?: string;
  shotCount: number;
  favourite: boolean;
  onOpen(): void;
  onCast(): void;
  onToggleFavourite(): void;
  /** Label of the site 「生成」 will open, shown so the button is not a mystery. */
  castLabel: string;
}

function StyleTileImpl({
  style: visual,
  shotUri,
  shotCount,
  favourite,
  onOpen,
  onCast,
  onToggleFavourite,
  castLabel,
}: StyleTileProps) {
  const { c } = useTheme();
  const family = familyOf(visual.f);

  return (
    <View style={[styles.tile, { backgroundColor: c.surface, borderColor: c.border }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${visual.n}，查看這個風格`}
        onPress={onOpen}
        style={({ pressed }) => [styles.cover, { opacity: pressed ? 0.85 : 1 }]}
      >
        {shotUri ? (
          <ShotImage uri={shotUri} style={styles.coverImage} fallback={<StyleSwatch style={visual} />} />
        ) : (
          <StyleSwatch style={visual} />
        )}

        {shotCount > 1 && (
          <Text style={[styles.countBadge, { backgroundColor: c.scrim, color: '#FFFFFF' }]}>
            {shotCount} 張
          </Text>
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={favourite ? '取消收藏' : '收藏這個風格'}
          accessibilityState={{ selected: favourite }}
          hitSlop={8}
          onPress={onToggleFavourite}
          style={[styles.star, { backgroundColor: c.scrim }]}
        >
          <Text style={{ fontSize: 15, color: favourite ? c.gold : '#FFFFFF' }}>
            {favourite ? '★' : '☆'}
          </Text>
        </Pressable>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`查看 ${visual.n}`}
        onPress={onOpen}
        style={styles.caption}
      >
        <Text style={[styles.family, { color: c.textFaint }]} numberOfLines={1}>
          {family.n}
        </Text>
        <Text style={[styles.name, { color: c.text }]} numberOfLines={1}>
          {visual.n}
        </Text>
      </Pressable>

      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`用 ${visual.n} 生成，開啟 ${castLabel}`}
        onPress={onCast}
        style={({ pressed }) => [
          styles.cast,
          { backgroundColor: c.vermilion, opacity: pressed ? 0.8 : 1 },
        ]}
      >
        <Text style={[styles.castLabel, { color: c.onAccent }]} numberOfLines={1}>
          ⚡ 生成
        </Text>
      </Pressable>
    </View>
  );
}

export const StyleTile = memo(StyleTileImpl);

const noSelect = { userSelect: 'none' } as const;

const styles = StyleSheet.create({
  tile: {
    borderWidth: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },

  cover: { width: '100%', aspectRatio: 1 },
  coverImage: { width: '100%', height: '100%' },

  countBadge: {
    ...noSelect,
    position: 'absolute',
    left: space.sm - 2,
    bottom: space.sm - 2,
    fontFamily: fonts.mono,
    fontSize: 9.5,
    letterSpacing: 0.4,
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  star: {
    position: 'absolute',
    top: space.sm - 4,
    right: space.sm - 4,
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },

  caption: { paddingHorizontal: space.sm + 2, paddingTop: space.sm },
  family: { ...noSelect, fontFamily: fonts.mono, fontSize: 9, letterSpacing: 1, marginBottom: 2 },
  name: { ...noSelect, fontFamily: fonts.uiMedium, fontSize: 13.5, fontWeight: '700' },

  cast: {
    ...noSelect,
    margin: space.sm,
    minHeight: 34,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  castLabel: { ...noSelect, fontFamily: fonts.uiMedium, fontSize: 12.5, fontWeight: '700' },
});
