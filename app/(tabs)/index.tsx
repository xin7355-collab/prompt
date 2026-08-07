import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';

import { BRAND } from '../../src/brand';
import { tagsOf } from '../../src/data/corpus';
import type { Lang, ResolvedPrompt } from '../../src/data/types';
import { bodyOf } from '../../src/lib/compose';
import { useCategoryCounts, useVault } from '../../src/store/vault';
import { fonts, radius, space } from '../../src/theme';
import { useTheme } from '../../src/ui/ThemeProvider';
import { PromptCard } from '../../src/ui/PromptCard';
import { Chip, EmptyState, IconButton } from '../../src/ui/primitives';
import { useToast } from '../../src/ui/Toast';

/** Filters that narrow the library beyond category and search. */
type Facet = 'fav' | 'mine' | 'shot';

export default function LibraryScreen() {
  const { c, accentFor } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const vault = useVault();
  const { prompts, lang, fav, shots } = vault;

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [facets, setFacets] = useState<Facet[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagsOpen, setTagsOpen] = useState(false);

  const categories = useCategoryCounts(prompts);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const favSet = new Set(fav);
    return prompts.filter((p) => {
      if (category !== 'all' && p.c !== category) return false;
      if (facets.includes('fav') && !favSet.has(p.i)) return false;
      if (facets.includes('mine') && p.source !== 'mine') return false;
      if (facets.includes('shot') && !shots[p.i]) return false;
      if (tags.length) {
        const own = tagsOf(p);
        if (!tags.every((t) => own.includes(t))) return false;
      }
      if (!q) return true;
      return `${p.t} ${p.k} ${p.zh} ${p.en}`.toLowerCase().includes(q);
    });
  }, [prompts, query, category, facets, tags, fav, shots]);

  /** Tag cloud for whatever category is currently in view, most common first. */
  const tagCloud = useMemo(() => {
    const pool = category === 'all' ? prompts : prompts.filter((p) => p.c === category);
    const counts = new Map<string, number>();
    for (const p of pool) for (const t of tagsOf(p)) counts.set(t, (counts.get(t) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 48);
  }, [prompts, category]);

  const toggleFacet = (f: Facet) =>
    setFacets((prev) => {
      if (prev.includes(f)) return prev.filter((x) => x !== f);
      // Favourites and "mine" answer different questions; showing both at once
      // reliably returns nothing, so selecting one clears the other.
      const next = f === 'fav' ? prev.filter((x) => x !== 'mine') : f === 'mine' ? prev.filter((x) => x !== 'fav') : prev;
      return [...next, f];
    });

  const openBench = useCallback(
    (prompt: ResolvedPrompt) => {
      vault.loadIntoBench(prompt);
      router.push('/bench');
    },
    [vault, router]
  );

  const copy = useCallback(
    async (prompt: ResolvedPrompt, activeLang: Lang) => {
      await Clipboard.setStringAsync(bodyOf(prompt, activeLang));
      toast('已複製提示詞', 'success');
    },
    [toast]
  );

  const surprise = useCallback(() => {
    if (!prompts.length) return;
    const pick = prompts[Math.floor(Math.random() * prompts.length)];
    setCategory(pick.c);
    setQuery('');
    setFacets([]);
    setTags([]);
    openBench(pick);
    toast(`隨機抽到「${pick.t}」`);
  }, [prompts, openBench, toast]);

  // Two columns once there is room for two readable cards side by side.
  const columns = width >= 700 ? (width >= 1050 ? 3 : 2) : 1;

  const renderCard = useCallback(
    ({ item }: { item: ResolvedPrompt }) => (
      <View style={columns > 1 ? { flex: 1 / columns, paddingHorizontal: space.xs } : undefined}>
        <PromptCard
          prompt={item}
          lang={lang}
          favourite={fav.includes(item.i)}
          shotUri={shots[item.i]}
          onToggleFavourite={() => vault.toggleFavourite(item.i)}
          onCopy={() => copy(item, lang)}
          onSendToBench={() => openBench(item)}
          onEdit={() => router.push({ pathname: '/edit', params: { id: item.i } })}
          onOpenShot={() =>
            Alert.alert('移除成品圖', `要把「${item.t}」的成品圖刪掉嗎？`, [
              { text: '取消', style: 'cancel' },
              { text: '刪除', style: 'destructive', onPress: () => vault.clearShot(item.i) },
            ])
          }
        />
      </View>
    ),
    [columns, lang, fav, shots, vault, copy, openBench, router]
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <View style={[styles.header, { backgroundColor: c.chrome, paddingTop: insets.top + space.sm }]}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.wordmark, { color: c.onChrome }]}>{BRAND.zh}</Text>
            <Text style={[styles.wordmarkSub, { color: c.onChromeDim }]}>{BRAND.en}</Text>
          </View>

          <View style={[styles.langSwitch, { backgroundColor: 'rgba(0,0,0,0.35)' }]}>
            {(['zh', 'en'] as const).map((l) => (
              <Pressable
                key={l}
                accessibilityRole="button"
                accessibilityState={{ selected: lang === l }}
                onPress={() => vault.setLang(l)}
                style={[
                  styles.langOption,
                  lang === l && { backgroundColor: c.gold },
                ]}
              >
                <Text
                  style={[
                    styles.langLabel,
                    { color: lang === l ? c.onGold : c.onChromeDim },
                  ]}
                >
                  {l === 'zh' ? '中文' : 'EN'}
                </Text>
              </Pressable>
            ))}
          </View>

          <IconButton glyph="◎" label="從照片反推提示詞" onChrome onPress={() => router.push('/reverse')} />
          <IconButton glyph="＋" label="新增提示詞" onChrome onPress={() => router.push('/edit')} />
        </View>

        <View style={styles.searchRow}>
          <Text style={[styles.searchGlyph, { color: c.textFaint }]}>⌕</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="搜尋標題、標籤或內容…"
            placeholderTextColor={c.textFaint}
            clearButtonMode="while-editing"
            returnKeyType="search"
            accessibilityLabel="搜尋提示詞"
            style={[styles.search, { backgroundColor: c.surface, color: c.text }]}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.strip}
          contentContainerStyle={styles.tabStrip}
        >
          <CategoryTab
            label="全部"
            count={prompts.length}
            selected={category === 'all'}
            onPress={() => {
              setCategory('all');
              setTags([]);
            }}
          />
          {categories.map((cat) => (
            <CategoryTab
              key={cat.id}
              label={cat.zh}
              count={cat.count}
              dot={accentFor(cat.id)}
              selected={category === cat.id}
              onPress={() => {
                setCategory(cat.id);
                setTags([]);
              }}
            />
          ))}
        </ScrollView>
      </View>

      {/* ── Facet bar ──────────────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.strip}
        contentContainerStyle={styles.facetBar}
      >
        <Text style={[styles.count, { color: c.textFaint }]}>{visible.length} 則</Text>
        <Chip label="★ 收藏" selected={facets.includes('fav')} onPress={() => toggleFacet('fav')} />
        <Chip label="我的" selected={facets.includes('mine')} onPress={() => toggleFacet('mine')} />
        <Chip label="有成品圖" selected={facets.includes('shot')} onPress={() => toggleFacet('shot')} />
        <Chip
          label={tags.length ? `# ${tags.join(' + ')}` : '# 標籤'}
          selected={tagsOpen || tags.length > 0}
          onPress={() => setTagsOpen((v) => !v)}
        />
        <Chip label="⚄ 隨機一則" onPress={surprise} />
      </ScrollView>

      {tagsOpen && (
        <View style={[styles.tagCloud, { backgroundColor: c.surfaceSunken }]}>
          {tagCloud.map(([tag, n]) => (
            <Chip
              key={tag}
              label={tag}
              count={n}
              selected={tags.includes(tag)}
              onPress={() =>
                setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
              }
            />
          ))}
          {tags.length > 0 && <Chip label="清除" tone="danger" selected onPress={() => setTags([])} />}
        </View>
      )}

      {/* ── Grid ───────────────────────────────────────────────── */}
      <FlatList
        key={columns}
        data={visible}
        keyExtractor={(item) => item.i}
        renderItem={renderCard}
        numColumns={columns}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + space.xxl },
          columns > 1 && { paddingHorizontal: space.md - space.xs },
        ]}
        columnWrapperStyle={columns > 1 ? { alignItems: 'flex-start' } : undefined}
        keyboardDismissMode="on-drag"
        removeClippedSubviews
        initialNumToRender={6}
        windowSize={7}
        ListEmptyComponent={
          <EmptyState
            title="這裡還沒有東西"
            body={`換個分類或關鍵字，或按右上角的 ＋ 自己寫一則。\n${BRAND.taglineZh}。`}
          />
        }
      />
    </View>
  );
}

function CategoryTab({
  label,
  count,
  dot,
  selected,
  onPress,
}: {
  label: string;
  count: number;
  dot?: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.tab,
        {
          backgroundColor: selected ? c.bg : 'rgba(255,255,255,0.09)',
        },
      ]}
    >
      {dot && <View style={[styles.tabDot, { backgroundColor: dot }]} />}
      <Text
        style={[
          styles.tabLabel,
          { color: selected ? c.text : c.onChromeDim, fontWeight: selected ? '700' : '500' },
        ]}
      >
        {label}
      </Text>
      <Text style={[styles.tabCount, { color: selected ? c.textFaint : c.onChromeDim }]}>
        {count}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { paddingBottom: 0 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.md,
    paddingBottom: space.md,
  },
  wordmark: { fontFamily: fonts.uiMedium, fontSize: 21, fontWeight: '800', letterSpacing: -0.5 },
  wordmarkSub: { fontFamily: fonts.mono, fontSize: 9, letterSpacing: 3, marginTop: 3 },

  langSwitch: { flexDirection: 'row', borderRadius: radius.md, padding: 3 },
  langOption: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: radius.sm },
  langLabel: { fontFamily: fonts.mono, fontSize: 11, fontWeight: '700' },

  searchRow: { paddingHorizontal: space.md, paddingBottom: space.md, justifyContent: 'center' },
  searchGlyph: { position: 'absolute', left: space.md + 12, zIndex: 1, fontSize: 17 },
  search: {
    height: 44,
    borderRadius: radius.md,
    paddingLeft: 36,
    paddingRight: space.md,
    fontFamily: fonts.ui,
    fontSize: 15,
  },

  /** Horizontal strips must not grow, or they steal height from the grid below. */
  strip: { flexGrow: 0, flexShrink: 0 },
  tabStrip: { gap: space.xs, paddingHorizontal: space.md },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: space.md,
    paddingVertical: space.sm + 2,
    borderTopLeftRadius: radius.sm,
    borderTopRightRadius: radius.sm,
  },
  tabDot: { width: 7, height: 7, borderRadius: 2 },
  tabLabel: { fontFamily: fonts.ui, fontSize: 13.5 },
  tabCount: { fontFamily: fonts.mono, fontSize: 10 },

  facetBar: { gap: space.sm, paddingHorizontal: space.md, paddingVertical: space.md, alignItems: 'center' },
  count: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 0.5, marginRight: space.xs },

  tagCloud: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm - 2,
    marginHorizontal: space.md,
    marginBottom: space.md,
    padding: space.md,
    borderRadius: radius.md,
  },

  list: { paddingHorizontal: space.md },
});
