import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, TextInput, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';

import { RATIOS, SITES } from '../../src/data/corpus';
import { composeStyle, FAMILIES, STYLES, type VisualStyle } from '../../src/data/styles';
import { openExternal } from '../../src/lib/openExternal';
import { useVault } from '../../src/store/vault';
import { fonts, radius, space } from '../../src/theme';
import { useTheme } from '../../src/ui/ThemeProvider';
import { AppText as Text } from '../../src/ui/AppText';
import { Chip, EmptyState } from '../../src/ui/primitives';
import { StyleTile } from '../../src/ui/StyleTile';
import { useToast } from '../../src/ui/Toast';
import { useLayout } from '../../src/ui/useLayout';

/** Ratios worth a one-tap chip on the wall. The full set lives on the bench. */
const QUICK_RATIOS = ['1:1', '4:5', '9:16', '16:9', '3:2'];

/** Sites that take the prompt as a query parameter start generating on arrival. */
const DEFAULT_SITE = Math.max(
  0,
  SITES.findIndex((s) => s.n === 'Copilot 影像')
);

type Facet = 'fav' | 'shot';

/**
 * 風格牆 — pick a look by looking at it.
 *
 * The library answers "what should I draw" in 400 lines of text. This screen answers
 * "what should it look like" in one screenful of pictures: type the subject once at
 * the top, then every tile below is that subject rendered in a different style, one
 * tap from being generated. Save the result back onto the tile and the wall stops
 * being a catalogue of someone else's styles and becomes an index of your own work.
 */
export default function StylesScreen() {
  const { c } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const layout = useLayout();
  const { width } = useWindowDimensions();

  const vault = useVault();
  const { lang, subject, styleShots, styleFav } = vault;

  const [family, setFamily] = useState('all');
  const [facets, setFacets] = useState<Facet[]>([]);
  const [query, setQuery] = useState('');
  const [ratio, setRatio] = useState('');
  const [site, setSite] = useState(DEFAULT_SITE);

  const familyCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of STYLES) counts.set(s.f, (counts.get(s.f) ?? 0) + 1);
    return FAMILIES.filter((f) => counts.has(f.k)).map((f) => ({ ...f, count: counts.get(f.k)! }));
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const favSet = new Set(styleFav);
    return STYLES.filter((s) => {
      if (family !== 'all' && s.f !== family) return false;
      if (facets.includes('fav') && !favSet.has(s.id)) return false;
      if (facets.includes('shot') && !styleShots[s.id]?.length) return false;
      if (!q) return true;
      return `${s.n} ${s.e} ${s.k}`.toLowerCase().includes(q);
    });
  }, [family, facets, query, styleFav, styleShots]);

  /** Wide screens get more, smaller tiles — the wall is meant to be scanned. */
  const columns = width >= 1100 ? 5 : width >= 860 ? 4 : width >= 620 ? 3 : 2;

  const openStyle = useCallback(
    (visual: VisualStyle) => router.push({ pathname: '/style', params: { id: visual.id, ratio } }),
    [router, ratio]
  );

  const cast = useCallback(
    (visual: VisualStyle) => {
      const text = composeStyle({ style: visual, subject, lang, ratio: ratio || undefined });
      const target = SITES[site];
      const url = target.q ? target.u + encodeURIComponent(text) : target.u;

      // Open first, copy second: on web an await here would end the tap's user
      // activation and the browser would silently refuse the new tab.
      const result = openExternal(url);
      Clipboard.setStringAsync(text).catch(() => {});

      if (result === 'blocked') {
        toast(`瀏覽器擋掉了新分頁。提示詞已複製，請自己開 ${target.n} 貼上`, 'error');
      } else if (target.q) {
        toast(`${visual.n} → ${target.n} 生成中`);
      } else {
        toast(`已複製，正在開啟 ${target.n}，貼上就能生成`);
      }
    },
    [subject, lang, ratio, site, toast]
  );

  const toggleFacet = (f: Facet) =>
    setFacets((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));

  const surprise = useCallback(() => {
    const pool = visible.length ? visible : STYLES;
    openStyle(pool[Math.floor(Math.random() * pool.length)]);
  }, [visible, openStyle]);

  const renderTile = useCallback(
    ({ item }: { item: VisualStyle }) => {
      const shots = styleShots[item.id] ?? [];
      return (
        <View style={{ flex: 1 / columns, paddingHorizontal: space.xs }}>
          <View style={{ marginBottom: space.md }}>
            <StyleTile
              style={item}
              shotUri={shots[0]}
              shotCount={shots.length}
              favourite={styleFav.includes(item.id)}
              castLabel={SITES[site].n}
              onOpen={() => openStyle(item)}
              onCast={() => cast(item)}
              onToggleFavourite={() => vault.toggleStyleFavourite(item.id)}
            />
          </View>
        </View>
      );
    },
    [columns, styleShots, styleFav, site, openStyle, cast, vault]
  );

  const savedCount = useMemo(
    () => Object.values(styleShots).reduce((n, list) => n + list.length, 0),
    [styleShots]
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <View style={[styles.header, { backgroundColor: c.chrome, paddingTop: insets.top + space.sm }]}>
        <View style={layout.gutter}>
          <Text style={[styles.wordmark, { color: c.onChrome }]}>風格牆</Text>
          <Text style={[styles.wordmarkSub, { color: c.onChromeDim }]}>
            寫一次主題，挑一張縮圖，直接生成
          </Text>

          <TextInput
            value={subject}
            onChangeText={vault.setSubject}
            placeholder="你想畫什麼？例：一隻黑貓坐在窗邊"
            placeholderTextColor="rgba(255,255,255,0.4)"
            returnKeyType="done"
            accessibilityLabel="要生成的主題"
            style={[styles.subject, { backgroundColor: 'rgba(255,255,255,0.1)', color: c.onChrome }]}
          />

          <Text style={[styles.sendTo, { color: c.onChromeDim }]}>
            送到 · {SITES[site].q ? '開啟後直接開始生成' : '會先複製，到了貼上即可'}
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.strip}
          contentContainerStyle={[styles.siteStrip, layout.gutter]}
        >
          {SITES.map((s, index) => (
            <Pressable
              key={s.n}
              accessibilityRole="button"
              accessibilityState={{ selected: site === index }}
              onPress={() => setSite(index)}
              style={[
                styles.site,
                {
                  backgroundColor: site === index ? c.gold : 'rgba(255,255,255,0.1)',
                },
              ]}
            >
              <Text
                style={[
                  styles.siteLabel,
                  { color: site === index ? c.onGold : c.onChromeDim },
                ]}
              >
                {s.n}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.strip}
          contentContainerStyle={[styles.tabStrip, layout.gutter]}
        >
          <FamilyTab
            label="全部"
            count={STYLES.length}
            selected={family === 'all'}
            onPress={() => setFamily('all')}
          />
          {familyCounts.map((f) => (
            <FamilyTab
              key={f.k}
              label={`${f.g} ${f.n}`}
              count={f.count}
              selected={family === f.k}
              onPress={() => setFamily(f.k)}
            />
          ))}
        </ScrollView>
      </View>

      {/* ── Filters ────────────────────────────────────────────── */}
      {/* One strip, not two: on a phone the header already owns a third of the
          screen, and a second fixed row would leave barely one row of tiles. */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.strip}
        contentContainerStyle={[styles.facetBar, layout.gutter]}
      >
        <Text style={[styles.count, { color: c.textFaint }]}>{visible.length} 種</Text>
        <Chip label="★ 收藏" selected={facets.includes('fav')} onPress={() => toggleFacet('fav')} />
        <Chip
          label={savedCount ? `有縮圖 ${savedCount}` : '有縮圖'}
          selected={facets.includes('shot')}
          onPress={() => toggleFacet('shot')}
        />
        <Chip label="⚄ 隨機" onPress={surprise} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="搜尋風格…"
          placeholderTextColor={c.textFaint}
          clearButtonMode="while-editing"
          accessibilityLabel="搜尋風格"
          style={[styles.search, { backgroundColor: c.surface, color: c.text, borderColor: c.border }]}
        />

        <View style={[styles.divider, { backgroundColor: c.border }]} />

        <Text style={[styles.count, { color: c.textFaint }]}>比例</Text>
        <Chip label="不指定" selected={!ratio} onPress={() => setRatio('')} />
        {QUICK_RATIOS.map((r) => (
          <Chip
            key={r}
            label={r}
            selected={ratio === r}
            onPress={() => setRatio(ratio === r ? '' : r)}
          />
        ))}
        <Text style={[styles.ratioUse, { color: c.textFaint }]}>
          {RATIOS.find((r) => r.r === ratio)?.use ?? ''}
        </Text>
      </ScrollView>

      {/* ── Wall ───────────────────────────────────────────────── */}
      <FlatList
        key={columns}
        data={visible}
        keyExtractor={(item) => item.id}
        renderItem={renderTile}
        numColumns={columns}
        contentContainerStyle={[
          layout.gutter,
          {
            paddingBottom: insets.bottom + space.xxl,
            paddingLeft: layout.gutter.paddingLeft - space.xs,
            paddingRight: layout.gutter.paddingRight - space.xs,
          },
        ]}
        columnWrapperStyle={{ alignItems: 'flex-start' }}
        keyboardDismissMode="on-drag"
        removeClippedSubviews
        initialNumToRender={12}
        windowSize={7}
        ListEmptyComponent={
          <EmptyState
            title="沒有符合的風格"
            body={'換個分類或關鍵字。\n收藏過的風格會排在「★ 收藏」裡，存過成品圖的在「有縮圖」。'}
          />
        }
      />
    </View>
  );
}

function FamilyTab({
  label,
  count,
  selected,
  onPress,
}: {
  label: string;
  count: number;
  selected: boolean;
  onPress: () => void;
}) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.tab, { backgroundColor: selected ? c.bg : 'rgba(255,255,255,0.09)' }]}
    >
      <Text
        style={[
          styles.tabLabel,
          { color: selected ? c.text : c.onChromeDim, fontWeight: selected ? '700' : '500' },
        ]}
      >
        {label}
      </Text>
      <Text style={[styles.tabCount, { color: selected ? c.textFaint : c.onChromeDim }]}>{count}</Text>
    </Pressable>
  );
}

const noSelect = { userSelect: 'none' } as const;

const styles = StyleSheet.create({
  header: { paddingBottom: 0 },
  wordmark: { fontFamily: fonts.uiMedium, fontSize: 21, fontWeight: '800', letterSpacing: -0.5 },
  wordmarkSub: { fontFamily: fonts.ui, fontSize: 12, marginTop: 3 },

  subject: {
    height: 46,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    marginTop: space.md,
    fontFamily: fonts.ui,
    fontSize: 15,
  },
  sendTo: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 0.6,
    marginTop: space.md,
    marginBottom: 6,
  },

  /** Horizontal strips must not grow, or they steal height from the wall below. */
  strip: { flexGrow: 0, flexShrink: 0 },

  siteStrip: { gap: space.xs, paddingBottom: space.md },
  site: { ...noSelect, paddingHorizontal: space.md, paddingVertical: 7, borderRadius: radius.pill },
  siteLabel: { ...noSelect, fontFamily: fonts.ui, fontSize: 12.5, fontWeight: '600' },

  tabStrip: { gap: space.xs },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: space.md,
    paddingVertical: space.sm + 2,
    borderTopLeftRadius: radius.sm,
    borderTopRightRadius: radius.sm,
  },
  tabLabel: { ...noSelect, fontFamily: fonts.ui, fontSize: 13.5 },
  tabCount: { ...noSelect, fontFamily: fonts.mono, fontSize: 10 },

  facetBar: { gap: space.sm, paddingVertical: space.md, alignItems: 'center' },
  count: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 0.5, marginRight: space.xs },
  ratioUse: { fontFamily: fonts.ui, fontSize: 11.5, marginLeft: space.xs },
  divider: { width: 1, height: 22, marginHorizontal: space.xs },

  search: {
    minWidth: 150,
    height: 36,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    fontFamily: fonts.ui,
    fontSize: 13,
  },
});
