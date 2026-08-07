import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';

import { categoryOf, MODES, MODIFIERS, NEGATIVES, SITES } from '../../src/data/corpus';
import { bodyOf, compose, placeholdersIn } from '../../src/lib/compose';
import { healthCheck } from '../../src/lib/health';
import { useVault } from '../../src/store/vault';
import { storeShot } from '../../src/store/shots';
import { fonts, radius, space } from '../../src/theme';
import { useTheme } from '../../src/ui/ThemeProvider';
import { Button, Chip, EmptyState, Field, Section } from '../../src/ui/primitives';
import { RatioPicker } from '../../src/ui/RatioPicker';
import { useToast } from '../../src/ui/Toast';
import { pickImage, shareText } from '../../src/lib/io';
import { openExternal } from '../../src/lib/openExternal';
import { BRAND } from '../../src/brand';

export default function BenchScreen() {
  const { c, accentFor } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();

  const vault = useVault();
  const { bench, setBench, lang, fmt, chars, allPacks, shots } = vault;

  /** Non-null output of a fired batch pack, shown inline under the pack chips. */
  const [batch, setBatch] = useState<{ name: string; text: string; count: number } | null>(null);

  const output = useMemo(
    () => compose({ bench, lang, format: fmt, characters: chars }),
    [bench, lang, fmt, chars]
  );

  const notes = useMemo(
    () => healthCheck(output, bench, lang, fmt),
    [output, bench, lang, fmt]
  );

  const variables = useMemo(
    () => (bench.base ? placeholdersIn(bodyOf(bench.base, lang)) : []),
    [bench.base, lang]
  );

  const copyOutput = useCallback(async () => {
    await Clipboard.setStringAsync(output);
    toast('已複製，可以貼到 AI 了', 'success');
  }, [output, toast]);

  const sendTo = useCallback(
    (index: number) => {
      const site = SITES[index];
      const url = site.q ? site.u + encodeURIComponent(output) : site.u;

      // Open first, copy second: on web an await here would end the tap's user
      // activation and the browser would silently refuse the new tab.
      const result = openExternal(url);
      Clipboard.setStringAsync(output).catch(() => {});

      if (result === 'opened') {
        toast(`已複製，正在開啟 ${site.n}`);
      } else {
        toast(`瀏覽器擋掉了新分頁。提示詞已複製，請自己開 ${site.n} 貼上`, 'error');
      }
    },
    [output, toast]
  );

  const fireBatch = useCallback(
    (packId: string) => {
      const pack = allPacks.find((p) => p.id === packId);
      if (!pack) return;
      const zh = lang === 'zh';
      const lines = pack.items.map((item, index) => {
        const variation = zh ? item[0] : item[1];
        const body = compose({ bench, lang, format: fmt, characters: chars, variation });
        return `【${index + 1}／${pack.items.length}】${variation}\n${body}`;
      });
      setBatch({ name: pack.n, text: lines.join('\n\n'), count: pack.items.length });
      toast(`${pack.n}：${pack.items.length} 則已產出`, 'success');
    },
    [allPacks, bench, lang, fmt, chars, toast]
  );

  const attachShot = useCallback(async () => {
    if (!bench.base) return;
    const uri = await pickImage();
    if (!uri) return;
    try {
      const stored = await storeShot(bench.base.i, uri);
      vault.setShot(bench.base.i, stored);
      toast('成品圖已存下', 'success');
    } catch {
      toast('讀不到這張圖，換一張試試', 'error');
    }
  }, [bench.base, vault, toast]);

  if (!bench.base) {
    return (
      <ScrollView
        contentContainerStyle={[
          styles.page,
          { paddingTop: insets.top + space.xl, paddingBottom: insets.bottom + space.xxl },
        ]}
        style={{ backgroundColor: c.bg }}
      >
        <Text style={[styles.pageTitle, { color: c.text }]}>工作台</Text>
        <Text style={[styles.pageSub, { color: c.textFaint }]}>{BRAND.taglineZh}</Text>
        <View style={{ marginTop: space.xl }}>
          <EmptyState
            title="還沒有底稿"
            body={'到「倉庫」任選一張卡片按「送工作台」。\n這裡可以疊加模式、角色、風格、比例與排除項，組出完整提示詞。'}
          />
        </View>
        <Button
          label="回倉庫挑一則"
          tone="primary"
          style={{ marginTop: space.lg }}
          onPress={() => router.push('/')}
        />
      </ScrollView>
    );
  }

  const base = bench.base;
  const accent = accentFor(base.c);
  const mode = MODES.find((m) => m.k === bench.mode);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.page,
          { paddingTop: insets.top + space.lg, paddingBottom: insets.bottom + space.xxl },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {/* ── Base ─────────────────────────────────────────────── */}
        <Text style={[styles.pageTitle, { color: c.text }]}>工作台</Text>
        <View style={[styles.baseCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          <View style={[styles.baseAccent, { backgroundColor: accent }]} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.baseCategory, { color: accent }]}>
              {categoryOf(base.c).zh}
            </Text>
            <Text style={[styles.baseTitle, { color: c.text }]} numberOfLines={2}>
              {base.t}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="清空工作台"
            hitSlop={10}
            onPress={() => {
              setBench((b) => ({ ...b, base: null, vars: {} }));
              setBatch(null);
            }}
          >
            <Text style={{ fontSize: 18, color: c.textFaint }}>✕</Text>
          </Pressable>
        </View>

        {/* ── Mode ─────────────────────────────────────────────── */}
        <Section
          title="模式"
          hint={
            bench.mode === 't2i'
              ? '從零生成。描述越具體，結果越接近你要的。'
              : '記得先在對方網站上傳你的照片，再貼上這段提示詞。開頭已自動加上「保留原圖」的指令。'
          }
        >
          <View style={styles.modeGrid}>
            {MODES.map((m) => {
              const selected = bench.mode === m.k;
              return (
                <Pressable
                  key={m.k}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => setBench((b) => ({ ...b, mode: m.k }))}
                  style={[
                    styles.mode,
                    {
                      backgroundColor: selected ? c.vermilion : c.surface,
                      borderColor: selected ? c.vermilion : c.border,
                    },
                  ]}
                >
                  <Text style={[styles.modeName, { color: selected ? c.onAccent : c.text }]}>
                    {m.n}
                  </Text>
                  <Text
                    style={[
                      styles.modeDesc,
                      { color: selected ? 'rgba(255,255,255,0.85)' : c.textFaint },
                    ]}
                  >
                    {m.d}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Section>

        {/* ── Character lock ───────────────────────────────────── */}
        <Section
          title="角色鎖定"
          hint={
            bench.char
              ? '每次生成都會自動帶上這個角色的外貌設定，換底稿就能同一張臉、不同穿著場景。'
              : '建立角色後，臉就固定下來了。搭配「角色變體」分類使用。'
          }
        >
          <View style={styles.chipWrap}>
            <Chip
              label="不鎖定"
              selected={!bench.char}
              onPress={() => setBench((b) => ({ ...b, char: '' }))}
            />
            {chars.map((ch) => (
              <Chip
                key={ch.id}
                label={ch.name}
                selected={bench.char === ch.id}
                onPress={() => setBench((b) => ({ ...b, char: ch.id }))}
                onLongPress={() => router.push({ pathname: '/character', params: { id: ch.id } })}
              />
            ))}
            <Chip label="🎭 角色工坊" dashed onPress={() => router.push('/forge')} />
            <Chip label="＋ 新角色" dashed onPress={() => router.push('/character')} />
          </View>
        </Section>

        {/* ── Placeholders ─────────────────────────────────────── */}
        {variables.length > 0 && (
          <Section title="填空" hint="留白的話，模型會照著括號裡的字畫。">
            {variables.map((name) => (
              <Field
                key={name}
                label={name}
                value={bench.vars[name] ?? ''}
                placeholder="輸入內容"
                onChangeText={(text) =>
                  setBench((b) => ({ ...b, vars: { ...b.vars, [name]: text } }))
                }
              />
            ))}
          </Section>
        )}

        {/* ── Modifiers ────────────────────────────────────────── */}
        {MODIFIERS.map((group) => (
          <Section key={group.k} title={group.g}>
            <View style={styles.chipWrap}>
              {group.items.map((item, index) => (
                <Chip
                  key={item[0]}
                  label={lang === 'zh' ? item[0] : item[1]}
                  selected={(bench.mods[group.k] ?? []).includes(index)}
                  onPress={() =>
                    setBench((b) => {
                      const current = b.mods[group.k] ?? [];
                      const next = current.includes(index)
                        ? current.filter((i) => i !== index)
                        : [...current, index];
                      return { ...b, mods: { ...b.mods, [group.k]: next } };
                    })
                  }
                />
              ))}
            </View>
          </Section>
        ))}

        {/* ── Ratio ────────────────────────────────────────────── */}
        <Section title="畫面比例">
          <RatioPicker value={bench.ratio} onChange={(r) => setBench((b) => ({ ...b, ratio: r }))} />
        </Section>

        {/* ── Negatives ────────────────────────────────────────── */}
        <Section title="排除項 NEGATIVE">
          <View style={styles.chipWrap}>
            {NEGATIVES.map((neg, index) => (
              <Chip
                key={neg[0]}
                label={lang === 'zh' ? neg[0] : neg[1]}
                tone="danger"
                selected={bench.negs.includes(index)}
                onPress={() =>
                  setBench((b) => ({
                    ...b,
                    negs: b.negs.includes(index)
                      ? b.negs.filter((i) => i !== index)
                      : [...b.negs, index],
                  }))
                }
              />
            ))}
          </View>
        </Section>

        {/* ── Seed ─────────────────────────────────────────────── */}
        <Section
          title="種子值 SEED"
          hint="想讓系列圖的臉更穩，固定同一個數字重跑。留白代表每次都隨機。"
        >
          <TextInput
            value={bench.seed}
            onChangeText={(text) => setBench((b) => ({ ...b, seed: text.replace(/[^0-9]/g, '') }))}
            placeholder="例：820314"
            placeholderTextColor={c.textFaint}
            keyboardType="number-pad"
            accessibilityLabel="種子值"
            style={[
              styles.seedInput,
              { backgroundColor: c.surface, borderColor: c.borderStrong, color: c.text },
            ]}
          />
        </Section>

        {/* ── Output ───────────────────────────────────────────── */}
        <Section title="成品">
          <View style={[styles.output, { backgroundColor: c.surfaceSunken, borderColor: c.border }]}>
            <Text selectable style={[styles.outputText, { color: c.text }]}>
              {output}
            </Text>
          </View>

          <View style={styles.notes}>
            {notes.map((note, index) => (
              <View key={index} style={styles.note}>
                <Text style={{ color: note.ok ? c.success : c.gold, fontSize: 13 }}>
                  {note.ok ? '✓' : '!'}
                </Text>
                <Text style={[styles.noteText, { color: note.ok ? c.success : c.textDim }]}>
                  {note.text}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.actions}>
            <Button label="複製" tone="primary" onPress={copyOutput} style={{ flex: 1 }} />
            <Button
              label="分享"
              onPress={() => shareText(output, `${BRAND.fileStem}-prompt.txt`)}
              style={{ flex: 1 }}
            />
            <Button
              label="存成新的一則"
              onPress={() =>
                router.push({
                  pathname: '/edit',
                  params: {
                    presetTitle: `${base.t}（組裝版）`,
                    presetCategory: base.c,
                    presetTags: base.k,
                    presetBody: output,
                    presetLang: lang,
                  },
                })
              }
              style={{ flex: 1.3 }}
            />
          </View>
        </Section>

        {/* ── Batch packs ──────────────────────────────────────── */}
        <Section
          title="連發 · 一次產出一整組"
          hint="會沿用目前的角色、風格與比例設定。長按自訂包可以回去編輯。"
        >
          <View style={styles.chipWrap}>
            {allPacks.map((pack) => (
              <Chip
                key={pack.id}
                label={pack.mine ? `${pack.n} ✎` : pack.n}
                count={pack.items.length}
                onPress={() => fireBatch(pack.id)}
                onLongPress={
                  pack.mine
                    ? () => router.push({ pathname: '/pack', params: { id: pack.id } })
                    : undefined
                }
              />
            ))}
            <Chip label="＋ 自訂包" dashed onPress={() => router.push('/pack')} />
          </View>

          {batch && (
            <View style={{ marginTop: space.md }}>
              <Text style={[styles.batchLabel, { color: c.textDim }]}>
                {batch.name} — {batch.count} 則
              </Text>
              <View
                style={[styles.output, { backgroundColor: c.surfaceSunken, borderColor: c.border }]}
              >
                <Text selectable style={[styles.outputText, { color: c.text }]} numberOfLines={14}>
                  {batch.text}
                </Text>
              </View>
              <View style={styles.actions}>
                <Button
                  label="複製全部"
                  tone="primary"
                  style={{ flex: 1 }}
                  onPress={async () => {
                    await Clipboard.setStringAsync(batch.text);
                    toast('整組已複製', 'success');
                  }}
                />
                <Button
                  label="匯出 .txt"
                  style={{ flex: 1 }}
                  onPress={() => shareText(batch.text, `${BRAND.fileStem}-${batch.count}.txt`)}
                />
              </View>
            </View>
          )}
        </Section>

        {/* ── Result image ─────────────────────────────────────── */}
        <Section
          title="成品紀錄"
          hint="生成滿意的圖存回來，之後用「有成品圖」快篩就知道哪一組真的有效。存的是縮圖，不占空間。"
        >
          <View style={styles.actions}>
            <Button
              label={shots[base.i] ? '換一張成品圖' : '存下這則的成品圖'}
              style={{ flex: 1 }}
              onPress={attachShot}
            />
            {shots[base.i] && (
              <Button
                label="移除"
                tone="danger"
                onPress={() =>
                  Alert.alert('移除成品圖', `要把「${base.t}」的成品圖刪掉嗎？`, [
                    { text: '取消', style: 'cancel' },
                    {
                      text: '刪除',
                      style: 'destructive',
                      onPress: () => vault.clearShot(base.i),
                    },
                  ])
                }
              />
            )}
          </View>
        </Section>

        {/* ── Hand-off ─────────────────────────────────────────── */}
        <Section
          title="送到 AI 繪圖"
          hint={
            mode && mode.k !== 't2i'
              ? '會先複製提示詞再開啟網站。這個模式要先在對方網站上傳照片。'
              : '會先複製提示詞再開啟網站，到了直接貼上。'
          }
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
                  { backgroundColor: c.surface, borderColor: c.border, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Text style={[styles.siteName, { color: c.text }]} numberOfLines={1}>
                  {site.n}
                </Text>
              </Pressable>
            ))}
          </View>
        </Section>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** Control labels must not be selectable — see the note in ui/primitives. */
const noSelect = { userSelect: 'none' } as const;

const styles = StyleSheet.create({
  page: { paddingHorizontal: space.md },
  pageTitle: { fontFamily: fonts.uiMedium, fontSize: 26, fontWeight: '800', letterSpacing: -0.6 },
  pageSub: { fontFamily: fonts.ui, fontSize: 13, marginTop: 4 },

  baseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    marginTop: space.lg,
    padding: space.md,
    borderWidth: 1,
    borderRadius: radius.lg,
  },
  baseAccent: { width: 4, alignSelf: 'stretch', borderRadius: 2 },
  baseCategory: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1, marginBottom: 3 },
  baseTitle: { fontFamily: fonts.uiMedium, fontSize: 17, fontWeight: '700' },

  modeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm - 2 },
  mode: {
    ...noSelect,
    flexGrow: 1,
    flexBasis: 150,
    padding: space.md - 2,
    borderWidth: 1,
    borderRadius: radius.md,
  },
  modeName: { ...noSelect, fontFamily: fonts.uiMedium, fontSize: 14, fontWeight: '700' },
  modeDesc: { ...noSelect, fontFamily: fonts.ui, fontSize: 11.5, lineHeight: 16, marginTop: 3 },

  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm - 2 },

  seedInput: {
    height: 46,
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    fontFamily: fonts.mono,
    fontSize: 15,
  },

  output: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: space.md,
    minHeight: 120,
  },
  outputText: { fontFamily: fonts.mono, fontSize: 13, lineHeight: 21 },

  notes: { marginTop: space.md, gap: 5 },
  note: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' },
  noteText: { flex: 1, fontFamily: fonts.ui, fontSize: 12.5, lineHeight: 18 },

  actions: { flexDirection: 'row', gap: space.sm, marginTop: space.md },

  batchLabel: { fontFamily: fonts.uiMedium, fontSize: 13, fontWeight: '700', marginBottom: 6 },

  siteGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm - 2 },
  site: {
    ...noSelect,
    flexGrow: 1,
    flexBasis: 96,
    minHeight: 44,
    borderWidth: 1,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.sm,
  },
  siteName: { ...noSelect, fontFamily: fonts.ui, fontSize: 13, fontWeight: '600' },
});
