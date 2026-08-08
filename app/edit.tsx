import React, { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CATEGORIES, categoryOf } from '../src/data/corpus';
import type { Lang } from '../src/data/types';
import { translateToEnglish } from '../src/lib/translate';
import { useVault } from '../src/store/vault';
import { fonts, radius, space } from '../src/theme';
import { useTheme } from '../src/ui/ThemeProvider';
import { Button, Field, Section } from '../src/ui/primitives';
import { useToast } from '../src/ui/Toast';
import { AppText as Text } from '../src/ui/AppText';
import { useLayout } from '../src/ui/useLayout';

/**
 * Create / edit a prompt. Reached three ways: the ＋ button (blank), a card's pencil
 * (loads that prompt), and the bench's "save as new" (arrives pre-filled via params).
 */
export default function EditScreen() {
  const { c } = useTheme();
  const layout = useLayout();
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const vault = useVault();

  const params = useLocalSearchParams<{
    id?: string;
    presetTitle?: string;
    presetCategory?: string;
    presetTags?: string;
    presetBody?: string;
    presetLang?: string;
  }>();

  const editing = useMemo(
    () => (params.id ? vault.prompts.find((p) => p.i === params.id) ?? null : null),
    [params.id, vault.prompts]
  );

  const presetLang = (params.presetLang as Lang | undefined) ?? 'zh';
  const [title, setTitle] = useState(editing?.t ?? params.presetTitle ?? '');
  const [category, setCategory] = useState(
    editing?.c ?? params.presetCategory ?? CATEGORIES[0].id
  );
  const [tags, setTags] = useState(editing?.k ?? params.presetTags ?? '');
  const [zh, setZh] = useState(
    editing?.zh ?? (presetLang === 'zh' ? params.presetBody ?? '' : '')
  );
  const [en, setEn] = useState(
    editing?.en ?? (presetLang === 'en' ? params.presetBody ?? '' : '')
  );
  const [translating, setTranslating] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);

  const history = editing ? vault.hist[editing.i] ?? [] : [];

  const save = () => {
    if (!zh.trim() && !en.trim()) {
      toast('至少要寫一種語言', 'error');
      return;
    }
    vault.savePrompt(
      { t: title.trim() || '未命名', c: category, k: tags.trim(), zh: zh.trim(), en: en.trim() },
      editing
    );
    toast('已儲存', 'success');
    router.back();
  };

  const translate = async () => {
    if (!zh.trim()) {
      toast('先寫中文提示詞', 'error');
      return;
    }
    setTranslating(true);
    const result = await translateToEnglish(zh);
    setTranslating(false);
    if (result.ok) {
      setEn(result.text);
      toast('翻譯完成', 'success');
    } else {
      toast(result.message, 'error');
    }
  };

  const remove = () => {
    if (!editing) return;
    Alert.alert(
      '刪除提示詞',
      `確定刪除「${editing.t}」？${editing.source === 'seed' ? '內建的之後可用「還原出廠」找回。' : ''}`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '刪除',
          style: 'destructive',
          onPress: () => {
            vault.deletePrompt(editing);
            toast('已刪除');
            router.back();
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView
        contentContainerStyle={[styles.page, layout.gutter, layout.column, { paddingBottom: insets.bottom + space.xxl }]}
        keyboardShouldPersistTaps="handled"
      >
        <Field label="標題" value={title} onChangeText={setTitle} placeholder="例：溫柔逆光生活寫真" />

        <View style={styles.field}>
          <Text style={[styles.label, { color: c.textFaint }]}>分類</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`分類：${categoryOf(category).zh}`}
            onPress={() => setCategoryOpen((v) => !v)}
            style={[styles.select, { backgroundColor: c.surface, borderColor: c.borderStrong }]}
          >
            <Text style={[styles.selectValue, { color: c.text }]}>{categoryOf(category).zh}</Text>
            <Text style={{ color: c.textFaint }}>{categoryOpen ? '▲' : '▼'}</Text>
          </Pressable>

          {categoryOpen && (
            <View style={[styles.options, { backgroundColor: c.surfaceSunken }]}>
              {CATEGORIES.map((cat) => (
                <Pressable
                  key={cat.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: cat.id === category }}
                  onPress={() => {
                    setCategory(cat.id);
                    setCategoryOpen(false);
                  }}
                  style={[
                    styles.option,
                    cat.id === category && { backgroundColor: c.pine },
                  ]}
                >
                  <Text
                    style={[
                      styles.optionLabel,
                      { color: cat.id === category ? c.onAccent : c.text },
                    ]}
                  >
                    {cat.zh}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        <Field
          label="標籤（逗號分隔）"
          value={tags}
          onChangeText={setTags}
          placeholder="人像, 逆光, 底片"
          autoCapitalize="none"
        />

        <Field
          label="中文提示詞"
          value={zh}
          onChangeText={setZh}
          multiline
          mono
          placeholder="用 {{變數}} 標記可替換處"
          hint="雙大括號會變成填空欄，例：一位 {{年齡}} 歲的 {{職業}}。"
        />

        <Field
          label="英文提示詞"
          value={en}
          onChangeText={setEn}
          multiline
          mono
          placeholder="English prompt…"
          hint="Midjourney 與 Stable Diffusion 請務必寫英文版。"
        />

        <View style={styles.actions}>
          <Button label="儲存" tone="primary" style={{ flex: 1.2 }} onPress={save} />
          <Button
            label={translating ? '翻譯中…' : '翻成英文'}
            disabled={translating}
            style={{ flex: 1 }}
            onPress={translate}
          />
        </View>

        {editing && (
          <View style={styles.actions}>
            {editing.source === 'seed' && editing.edited && (
              <Button
                label="還原原始"
                style={{ flex: 1 }}
                onPress={() => {
                  vault.revertPrompt(editing.i);
                  toast('已還原成原始版本');
                  router.back();
                }}
              />
            )}
            <Button label="刪除" tone="danger" style={{ flex: 1 }} onPress={remove} />
          </View>
        )}

        {history.length > 0 && (
          <Section title="版本歷史" hint="點一下載入舊版，再按儲存才會生效。">
            {history.map((entry, index) => (
              <Pressable
                key={index}
                accessibilityRole="button"
                onPress={() => {
                  setTitle(entry.t);
                  setTags(entry.k);
                  setZh(entry.zh);
                  setEn(entry.en);
                  toast('已載入該版本，確認後按儲存');
                }}
                style={[styles.historyRow, { backgroundColor: c.surface, borderColor: c.border }]}
              >
                <View style={styles.historyHead}>
                  <Text style={[styles.historyTitle, { color: c.text }]} numberOfLines={1}>
                    {entry.t || '未命名'}
                  </Text>
                  <Text style={[styles.historyTime, { color: c.textFaint }]}>
                    {new Date(entry.at).toLocaleString('zh-TW', {
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
                <Text style={[styles.historyBody, { color: c.textFaint }]} numberOfLines={1}>
                  {(entry.zh || entry.en || '').slice(0, 60)}
                </Text>
              </Pressable>
            ))}
          </Section>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { paddingTop: space.sm },

  field: { marginTop: space.md },
  label: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.3,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  select: {
    minHeight: 46,
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectValue: { fontFamily: fonts.ui, fontSize: 15 },
  options: { marginTop: space.sm, borderRadius: radius.md, padding: space.xs, maxHeight: 280 },
  option: { paddingHorizontal: space.md, paddingVertical: space.md - 2, borderRadius: radius.sm },
  optionLabel: { fontFamily: fonts.ui, fontSize: 14.5 },

  actions: { flexDirection: 'row', gap: space.sm, marginTop: space.lg },

  historyRow: { borderWidth: 1, borderRadius: radius.md, padding: space.md, marginBottom: space.sm },
  historyHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  historyTitle: { flex: 1, fontFamily: fonts.uiMedium, fontSize: 14, fontWeight: '700' },
  historyTime: { fontFamily: fonts.mono, fontSize: 10.5 },
  historyBody: { fontFamily: fonts.mono, fontSize: 11.5, marginTop: 4 },
});
