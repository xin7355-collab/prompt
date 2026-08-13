import React, { memo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

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
  /** True while this tile's image is being generated. */
  busy?: boolean;
  onOpen(): void;
  onDraw(): void;
  onCopy(): void;
  onToggleFavourite(): void;
  /** What 「生成」 will do: draw in place, or hand off to a site by this name. */
  drawHint: string;
}

function StyleTileImpl({
  style: visual,
  shotUri,
  shotCount,
  favourite,
  busy,
  onOpen,
  onDraw,
  onCopy,
  onToggleFavourite,
  drawHint,
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

        {busy && (
          <View style={[styles.busy, { backgroundColor: c.scrim }]}>
            <ActivityIndicator color="#FFFFFF" />
            <Text style={styles.busyLabel}>生成中…</Text>
          </View>
        )}

        {shotCount > 1 && !busy && (
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
        {visual.d ? (
          <Text style={[styles.desc, { color: c.textFaint }]} numberOfLines={2}>
            {visual.d}
          </Text>
        ) : null}
      </Pressable>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`複製 ${visual.n} 的提示詞`}
          onPress={onCopy}
          style={({ pressed }) => [
            styles.copy,
            { borderColor: c.borderStrong, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Text style={[styles.copyLabel, { color: c.textDim }]} numberOfLines={1}>
            複製
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${visual.n}：${drawHint}`}
          accessibilityState={{ disabled: !!busy }}
          disabled={busy}
          onPress={onDraw}
          style={({ pressed }) => [
            styles.draw,
            { backgroundColor: c.vermilion, opacity: busy ? 0.5 : pressed ? 0.8 : 1 },
          ]}
        >
          <Text style={[styles.drawLabel, { color: c.onAccent }]} numberOfLines={1}>
            {busy ? '生成中' : '⚡ 生成'}
          </Text>
        </Pressable>
      </View>
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

  busy: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  busyLabel: {
    ...noSelect,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.2,
    color: '#FFFFFF',
  },

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
  desc: { ...noSelect, fontFamily: fonts.ui, fontSize: 10.5, lineHeight: 15, marginTop: 3 },

  actions: { flexDirection: 'row', gap: space.sm - 3, padding: space.sm },
  copy: {
    ...noSelect,
    flex: 1,
    minHeight: 34,
    borderWidth: 1,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyLabel: { ...noSelect, fontFamily: fonts.uiMedium, fontSize: 12, fontWeight: '700' },
  draw: {
    ...noSelect,
    flex: 1.25,
    minHeight: 34,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawLabel: { ...noSelect, fontFamily: fonts.uiMedium, fontSize: 12, fontWeight: '700' },
});
