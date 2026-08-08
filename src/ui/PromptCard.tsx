import React, { memo } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { categoryOf, tagsOf } from '../data/corpus';
import type { Lang, ResolvedPrompt } from '../data/types';
import { bodyOf } from '../lib/compose';
import { fonts, radius, space } from '../theme';
import { useTheme } from './ThemeProvider';
import { PromptBody } from './primitives';
import { AppText as Text } from './AppText';

export interface PromptCardProps {
  prompt: ResolvedPrompt;
  lang: Lang;
  favourite: boolean;
  shotUri?: string;
  onToggleFavourite(): void;
  onCopy(): void;
  onSendToBench(): void;
  onEdit(): void;
  onOpenShot(): void;
}

/**
 * One prompt. The category accent runs along the top edge rather than the side so the
 * card reads correctly in a two-column grid on tablets, and the body is clipped to four
 * lines — long prompts are for the detail view, the card is for triage.
 */
function PromptCardImpl({
  prompt,
  lang,
  favourite,
  shotUri,
  onToggleFavourite,
  onCopy,
  onSendToBench,
  onEdit,
  onOpenShot,
}: PromptCardProps) {
  const { c, accentFor } = useTheme();
  const accent = accentFor(prompt.c);
  const category = categoryOf(prompt.c);
  const body = bodyOf(prompt, lang);
  const tags = tagsOf(prompt);

  const badge =
    prompt.source === 'mine' ? '自建' : prompt.edited ? '已改' : null;

  return (
    <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
      <View style={[styles.accent, { backgroundColor: accent }]} />

      <View style={styles.head}>
        <View style={styles.headText}>
          <View style={styles.eyebrow}>
            <Text style={[styles.eyebrowText, { color: accent }]} numberOfLines={1}>
              {category.en}
            </Text>
            {badge && (
              <Text style={[styles.badge, { backgroundColor: c.text, color: c.surface }]}>
                {badge}
              </Text>
            )}
          </View>
          <Text style={[styles.title, { color: c.text }]} numberOfLines={2}>
            {prompt.t}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={favourite ? '取消收藏' : '收藏'}
          accessibilityState={{ selected: favourite }}
          hitSlop={10}
          onPress={onToggleFavourite}
          style={styles.star}
        >
          <Text style={{ fontSize: 20, color: favourite ? c.gold : c.textFaint }}>
            {favourite ? '★' : '☆'}
          </Text>
        </Pressable>
      </View>

      {shotUri ? (
        <Pressable
          accessibilityRole="imagebutton"
          accessibilityLabel="這則的成品圖"
          onPress={onOpenShot}
          style={[styles.shot, { borderColor: c.border }]}
        >
          <Image source={{ uri: shotUri }} style={styles.shotImage} resizeMode="cover" />
        </Pressable>
      ) : null}

      <View style={[styles.bodyBox, { backgroundColor: c.surfaceSunken, borderLeftColor: accent }]}>
        <PromptBody text={body} numberOfLines={4} size={12.5} />
      </View>

      {tags.length > 0 && (
        <View style={styles.tags}>
          {tags.map((tag) => (
            <Text key={tag} style={[styles.tag, { color: c.textFaint, borderColor: c.border }]}>
              {tag}
            </Text>
          ))}
        </View>
      )}

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="複製提示詞"
          onPress={onCopy}
          style={({ pressed }) => [
            styles.action,
            { backgroundColor: c.vermilion, opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Text style={[styles.actionLabel, { color: c.onAccent }]}>複製</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="送到工作台"
          onPress={onSendToBench}
          style={({ pressed }) => [
            styles.action,
            { backgroundColor: accent, opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Text style={[styles.actionLabel, { color: c.onAccent }]}>送工作台</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="編輯這則"
          onPress={onEdit}
          style={({ pressed }) => [
            styles.actionIcon,
            { borderColor: c.borderStrong, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Text style={{ fontSize: 15, color: c.textDim }}>✎</Text>
        </Pressable>
      </View>
    </View>
  );
}

export const PromptCard = memo(PromptCardImpl);

const noSelect = { userSelect: 'none' } as const;

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: space.md,
  },
  accent: { height: 4 },

  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.sm,
    paddingHorizontal: space.md,
    paddingTop: space.md,
  },
  headText: { flex: 1, minWidth: 0 },
  eyebrow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  eyebrowText: { ...noSelect, fontFamily: fonts.mono, fontSize: 9.5, letterSpacing: 1.4, fontWeight: '700' },
  badge: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 0.6,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
    overflow: 'hidden',
  },
  title: { ...noSelect, fontFamily: fonts.uiMedium, fontSize: 16, fontWeight: '700', lineHeight: 22 },
  star: { paddingLeft: space.xs },

  shot: {
    marginHorizontal: space.md,
    marginTop: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  shotImage: { width: '100%', height: 150 },

  bodyBox: {
    marginHorizontal: space.md,
    marginTop: space.md,
    padding: space.md - 2,
    borderRadius: radius.sm,
    borderLeftWidth: 3,
  },

  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    paddingHorizontal: space.md,
    paddingTop: space.md - 2,
  },
  tag: {
    fontFamily: fonts.mono,
    fontSize: 10,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
    overflow: 'hidden',
  },

  actions: {
    flexDirection: 'row',
    gap: space.sm - 2,
    padding: space.md,
    paddingTop: space.md,
  },
  action: {
    ...noSelect,
    flex: 1,
    minHeight: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { ...noSelect, fontFamily: fonts.uiMedium, fontSize: 14, fontWeight: '700' },
  actionIcon: {
    width: 46,
    minHeight: 42,
    borderRadius: radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
