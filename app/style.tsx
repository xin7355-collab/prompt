import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';

import { SITES } from '../src/data/corpus';
import { composeStyle, familyOf, styleOf, styleTags } from '../src/data/styles';
import { pickImage, shareText } from '../src/lib/io';
import { openExternal } from '../src/lib/openExternal';
import { storeShot } from '../src/store/shots';
import { useVault } from '../src/store/vault';
import { BRAND } from '../src/brand';
import { fonts, radius, space } from '../src/theme';
import { AppText as Text } from '../src/ui/AppText';
import { Button, EmptyState, Section } from '../src/ui/primitives';
import { RatioPicker } from '../src/ui/RatioPicker';
import { ShotImage } from '../src/ui/ShotImage';
import { StyleSwatch } from '../src/ui/StyleSwatch';
import { useTheme } from '../src/ui/ThemeProvider';
import { useToast } from '../src/ui/Toast';
import { useLayout } from '../src/ui/useLayout';

/**
 * One style, in full.
 *
 * The wall is for choosing; this is for working. It shows what the style actually
 * says, what it produced for you last time, and gets the finished prompt into an AI
 * in one tap — then takes the result back as the tile's new cover.
 */
export default function StyleScreen() {
  const { c } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const layout = useLayout();
  const params = useLocalSearchParams<{ id?: string; ratio?: string }>();

  const vault = useVault();
  const { lang, subject, styleShots, styleFav } = vault;

  const visual = styleOf(String(params.id ?? ''));
  const [ratio, setRatio] = useState(String(params.ratio ?? ''));
  const [saving, setSaving] = useState(false);

  const shots = visual ? (styleShots[visual.id] ?? []) : [];

  const output = useMemo(
    () => (visual ? composeStyle({ style: visual, subject, lang, ratio: ratio || undefined }) : ''),
    [visual, subject, lang, ratio]
  );

  const sendTo = useCallback(
    (index: number) => {
      const target = SITES[index];
      const url = target.q ? target.u + encodeURIComponent(output) : target.u;

      // Open first, copy second — an await here would end the tap's user activation
      // on web and the browser would silently refuse the new tab.
      const result = openExternal(url);
      Clipboard.setStringAsync(output).catch(() => {});

      if (result === 'blocked') {
        toast(`瀏覽器擋掉了新分頁。提示詞已複製，請自己開 ${target.n} 貼上`, 'error');
      } else if (target.q) {
        toast(`已送到 ${target.n} 開始生成`);
      } else {
        toast(`已複製，正在開啟 ${target.n}，貼上就能生成`);
      }
    },
    [output, toast]
  );

  const saveShot = useCallback(async () => {
    if (!visual || saving) return;
    setSaving(true);
    try {
      const source = await pickImage();
      if (!source) return;
      const stored = await storeShot(visual.id, source);
      vault.addStyleShot(visual.id, stored);
      toast('縮圖已存下，之後在風格牆就看得到', 'success');
    } catch {
      toast('讀不到這張圖，換一張試試', 'error');
    } finally {
      setSaving(false);
    }
  }, [visual, saving, vault, toast]);

  if (!visual) {
    return (
      <ScrollView
        style={{ backgroundColor: c.bg }}
        contentContainerStyle={[styles.page, layout.gutter, layout.column]}
      >
        <View style={{ marginTop: space.xl }}>
          <EmptyState title="找不到這個風格" body="它可能已經被移除了。回風格牆再挑一個。" />
        </View>
        <Button
          label="回風格牆"
          tone="primary"
          style={{ marginTop: space.lg }}
          onPress={() => router.replace('/styles')}
        />
      </ScrollView>
    );
  }

  const family = familyOf(visual.f);
  const favourite = styleFav.includes(visual.id);
  const cover = shots[0];

  return (
    <ScrollView
      style={{ backgroundColor: c.bg }}
      contentContainerStyle={[
        styles.page,
        layout.gutter,
        layout.column,
        { paddingBottom: insets.bottom + space.xxl },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      {/* ── Identity ───────────────────────────────────────────── */}
      <View style={[styles.hero, { borderColor: c.border }]}>
        {cover ? (
          <ShotImage
            uri={cover}
            style={styles.heroImage}
            fallback={<StyleSwatch style={visual} glyphSize={52} />}
          />
        ) : (
          <StyleSwatch style={visual} glyphSize={52} />
        )}
      </View>

      <View style={styles.titleRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.family, { color: c.textFaint }]}>
            {family.g} {family.n} · {visual.e}
          </Text>
          <Text style={[styles.title, { color: c.text }]}>{visual.n}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={favourite ? '取消收藏' : '收藏這個風格'}
          accessibilityState={{ selected: favourite }}
          hitSlop={10}
          onPress={() => vault.toggleStyleFavourite(visual.id)}
        >
          <Text style={{ fontSize: 24, color: favourite ? c.gold : c.textFaint }}>
            {favourite ? '★' : '☆'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.tags}>
        {styleTags(visual).map((tag) => (
          <Text key={tag} style={[styles.tag, { color: c.textFaint, borderColor: c.border }]}>
            {tag}
          </Text>
        ))}
      </View>

      {/* ── Subject ────────────────────────────────────────────── */}
      <Section title="主題" hint="留白也可以，模型會自己挑一個最能展現這個風格的畫面。">
        <TextInput
          value={subject}
          onChangeText={vault.setSubject}
          placeholder="你想畫什麼？例：一隻黑貓坐在窗邊"
          placeholderTextColor={c.textFaint}
          accessibilityLabel="要生成的主題"
          style={[
            styles.subject,
            { backgroundColor: c.surface, borderColor: c.borderStrong, color: c.text },
          ]}
        />
      </Section>

      <Section title="畫面比例">
        <RatioPicker value={ratio} onChange={setRatio} />
      </Section>

      {/* ── Output ─────────────────────────────────────────────── */}
      <Section
        title="完整提示詞"
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={lang === 'zh' ? '切換到英文' : '切換到中文'}
            onPress={() => vault.setLang(lang === 'zh' ? 'en' : 'zh')}
            style={[styles.langToggle, { borderColor: c.borderStrong }]}
          >
            <Text style={[styles.langLabel, { color: c.textDim }]}>
              {lang === 'zh' ? '中文 ⇄ EN' : 'EN ⇄ 中文'}
            </Text>
          </Pressable>
        }
      >
        <View style={[styles.output, { backgroundColor: c.surfaceSunken, borderColor: c.border }]}>
          <Text selectable style={[styles.outputText, { color: c.text }]}>
            {output}
          </Text>
        </View>

        <View style={styles.actions}>
          <Button
            label="複製"
            tone="primary"
            style={{ flex: 1 }}
            onPress={async () => {
              await Clipboard.setStringAsync(output);
              toast('已複製，可以貼到 AI 了', 'success');
            }}
          />
          <Button
            label="分享"
            style={{ flex: 1 }}
            onPress={() => shareText(output, `${BRAND.fileStem}-${visual.id}.txt`)}
          />
          <Button
            label="存成提示詞"
            style={{ flex: 1.2 }}
            onPress={() =>
              router.push({
                pathname: '/edit',
                params: {
                  presetTitle: `${visual.n}${subject.trim() ? ` — ${subject.trim()}` : ''}`,
                  presetCategory: 'style',
                  presetTags: visual.k,
                  presetBody: output,
                  presetLang: lang,
                },
              })
            }
          />
        </View>
      </Section>

      {/* ── Hand-off ───────────────────────────────────────────── */}
      <Section
        title="送到 AI 生成"
        hint="會先複製提示詞再開啟網站。前幾個支援網址帶入，開啟後直接開始生成；其餘的貼上即可。"
      >
        <View style={styles.siteGrid}>
          {SITES.map((site, index) => (
            <Pressable
              key={site.n}
              accessibilityRole="link"
              accessibilityLabel={`複製並開啟 ${site.n}`}
              onPress={() => sendTo(index)}
              style={({ pressed }) => [
                styles.site,
                {
                  backgroundColor: site.q ? c.surface : c.bg,
                  borderColor: site.q ? c.gold : c.border,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Text style={[styles.siteName, { color: c.text }]} numberOfLines={1}>
                {site.q ? `⚡ ${site.n}` : site.n}
              </Text>
            </Pressable>
          ))}
        </View>
      </Section>

      {/* ── Saved thumbnails ───────────────────────────────────── */}
      <Section
        title="我的成品"
        hint="存下來的圖會變成風格牆上的封面，最多留 8 張。存的是縮圖，不占空間。點一張可以移除。"
      >
        <Button
          label={saving ? '讀取中…' : shots.length ? '再存一張成品圖' : '存下這個風格的成品圖'}
          tone="accent"
          disabled={saving}
          onPress={saveShot}
        />

        {shots.length > 0 ? (
          <View style={styles.gallery}>
            {shots.map((uri) => (
              <Pressable
                key={uri}
                accessibilityRole="imagebutton"
                accessibilityLabel="移除這張成品圖"
                onPress={() =>
                  Alert.alert('移除成品圖', `要把這張從「${visual.n}」移除嗎？`, [
                    { text: '取消', style: 'cancel' },
                    {
                      text: '移除',
                      style: 'destructive',
                      onPress: () => vault.removeStyleShot(visual.id, uri),
                    },
                  ])
                }
                style={[styles.thumb, { borderColor: c.border }]}
              >
                <ShotImage uri={uri} style={styles.thumbImage} />
              </Pressable>
            ))}
          </View>
        ) : (
          <Text style={[styles.emptyNote, { color: c.textFaint }]}>
            還沒有成品。生成滿意的圖之後存回來，這個風格在牆上就有自己的樣子了。
          </Text>
        )}
      </Section>
    </ScrollView>
  );
}

const noSelect = { userSelect: 'none' } as const;

const styles = StyleSheet.create({
  page: { paddingHorizontal: space.md, paddingTop: space.lg },

  hero: { borderRadius: radius.lg, borderWidth: 1, overflow: 'hidden', aspectRatio: 16 / 10 },
  heroImage: { width: '100%', height: '100%' },

  titleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: space.md, marginTop: space.md },
  family: { fontFamily: fonts.mono, fontSize: 10.5, letterSpacing: 1, marginBottom: 4 },
  title: { fontFamily: fonts.uiMedium, fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },

  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: space.md },
  tag: {
    fontFamily: fonts.mono,
    fontSize: 10,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
    overflow: 'hidden',
  },

  subject: {
    minHeight: 46,
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    fontFamily: fonts.ui,
    fontSize: 15,
  },

  langToggle: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  langLabel: { ...noSelect, fontFamily: fonts.mono, fontSize: 10, fontWeight: '700' },

  output: { borderWidth: 1, borderRadius: radius.md, padding: space.md, minHeight: 120 },
  outputText: { fontFamily: fonts.mono, fontSize: 13, lineHeight: 21 },

  actions: { flexDirection: 'row', gap: space.sm, marginTop: space.md },

  siteGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm - 2 },
  site: {
    ...noSelect,
    flexGrow: 1,
    // Wide enough that 「⚡ Copilot 影像」 fits without the ellipsis.
    flexBasis: 118,
    minHeight: 44,
    borderWidth: 1,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.sm,
  },
  siteName: { ...noSelect, fontFamily: fonts.ui, fontSize: 13, fontWeight: '600' },

  gallery: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.md },
  thumb: { width: 96, height: 96, borderRadius: radius.md, borderWidth: 1, overflow: 'hidden' },
  thumbImage: { width: '100%', height: '100%' },

  emptyNote: { fontFamily: fonts.ui, fontSize: 12.5, lineHeight: 19, marginTop: space.md },
});
