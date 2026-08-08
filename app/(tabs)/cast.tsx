import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useVault } from '../../src/store/vault';
import { fonts, radius, space } from '../../src/theme';
import { useTheme } from '../../src/ui/ThemeProvider';
import { Button, EmptyState } from '../../src/ui/primitives';
import { useToast } from '../../src/ui/Toast';
import { AppText as Text } from '../../src/ui/AppText';
import { useLayout } from '../../src/ui/useLayout';

/**
 * The character roster. Locking a character prepends its fixed-appearance block to
 * every prompt, which is how you get the same face across a whole series.
 */
export default function CastScreen() {
  const { c } = useTheme();
  const layout = useLayout();
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { chars, bench, setBench, lang } = useVault();

  return (
    <ScrollView
      style={{ backgroundColor: c.bg }}
      contentContainerStyle={[
        styles.page,
        layout.gutter,
        layout.column,
        { paddingTop: insets.top + space.lg, paddingBottom: insets.bottom + space.xxl },
      ]}
    >
      <Text style={[styles.title, { color: c.text }]}>角色</Text>
      <Text style={[styles.sub, { color: c.textFaint }]}>
        把外貌寫成固定一段，之後每一張圖都自動帶上它，臉就不會跑掉。衣服、場景、動作交給提示詞去變。
      </Text>

      <Button
        label="🎭 角色工坊 — 一項一項點出一個角色"
        tone="primary"
        style={{ marginTop: space.lg }}
        onPress={() => router.push('/forge')}
      />
      <Button
        label="＋ 自己寫角色設定"
        style={{ marginTop: space.sm }}
        onPress={() => router.push('/character')}
      />

      {chars.length === 0 ? (
        <View style={{ marginTop: space.xl }}>
          <EmptyState
            title="還沒有角色"
            body={'用「角色工坊」點幾下就能生一個，或自己寫。\n存好之後每張圖都會帶上同一張臉，只換服裝場景。'}
          />
        </View>
      ) : (
        <View style={{ marginTop: space.lg, gap: space.md }}>
          {chars.map((character) => {
            const locked = bench.char === character.id;
            const preview = (lang === 'zh' ? character.zh : character.en) || character.zh;
            const unfilled = /\{\{/.test(preview);

            return (
              <View
                key={character.id}
                style={[
                  styles.card,
                  { backgroundColor: c.surface, borderColor: locked ? c.gold : c.border },
                ]}
              >
                <View style={styles.cardHead}>
                  <Text style={[styles.name, { color: c.text }]}>{character.name}</Text>
                  {locked && (
                    <Text style={[styles.lockTag, { backgroundColor: c.gold, color: c.onGold }]}>
                      已鎖定
                    </Text>
                  )}
                </View>

                <Text style={[styles.preview, { color: c.textDim }]} numberOfLines={5}>
                  {preview.trim() || '（尚未填寫外貌設定）'}
                </Text>

                {unfilled && (
                  <Text style={[styles.warn, { color: c.gold }]}>
                    ! 還有沒填的 {'{{大括號}}'}，模型會照著括號裡的字畫
                  </Text>
                )}

                <View style={styles.cardActions}>
                  <Button
                    label={locked ? '解除鎖定' : '鎖定這個角色'}
                    tone={locked ? 'neutral' : 'accent'}
                    style={{ flex: 1 }}
                    onPress={() => {
                      setBench((b) => ({ ...b, char: locked ? '' : character.id }));
                      toast(locked ? '已解除鎖定' : `已鎖定「${character.name}」`);
                    }}
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`編輯 ${character.name}`}
                    onPress={() =>
                      router.push({ pathname: '/character', params: { id: character.id } })
                    }
                    style={({ pressed }) => [
                      styles.editButton,
                      { borderColor: c.borderStrong, opacity: pressed ? 0.7 : 1 },
                    ]}
                  >
                    <Text style={{ fontSize: 15, color: c.textDim }}>✎</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { paddingHorizontal: space.md },
  title: { fontFamily: fonts.uiMedium, fontSize: 26, fontWeight: '800', letterSpacing: -0.6 },
  sub: { fontFamily: fonts.ui, fontSize: 13.5, lineHeight: 21, marginTop: space.sm },

  card: { borderWidth: 1.5, borderRadius: radius.lg, padding: space.md },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  name: { flex: 1, fontFamily: fonts.uiMedium, fontSize: 17, fontWeight: '700' },
  lockTag: {
    fontFamily: fonts.mono,
    fontSize: 10,
    borderRadius: radius.sm,
    paddingHorizontal: 7,
    paddingVertical: 3,
    overflow: 'hidden',
    fontWeight: '700',
  },
  preview: { fontFamily: fonts.mono, fontSize: 12, lineHeight: 19, marginTop: space.sm },
  warn: { fontFamily: fonts.ui, fontSize: 12, lineHeight: 18, marginTop: space.sm },

  cardActions: { flexDirection: 'row', gap: space.sm, marginTop: space.md },
  editButton: {
    width: 46,
    minHeight: 44,
    borderWidth: 1.5,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
