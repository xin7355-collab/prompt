import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BRAND } from '../../src/brand';
import { categoryOf, PROMPTS } from '../../src/data/corpus';
import type { Format } from '../../src/data/types';
import { readJsonFile, shareText } from '../../src/lib/io';
import { getApiKey, setApiKey } from '../../src/lib/translate';
import { useVault } from '../../src/store/vault';
import { fonts, radius, space } from '../../src/theme';
import { useTheme, type ThemePreference } from '../../src/ui/ThemeProvider';
import { Button, Field, Section } from '../../src/ui/primitives';
import { useToast } from '../../src/ui/Toast';

const THEMES: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: '跟隨系統' },
  { value: 'light', label: '淺色' },
  { value: 'dark', label: '深色' },
];

const FORMATS: { value: Format; label: string; hint: string }[] = [
  { value: 'plain', label: '通用', hint: 'Gemini／ChatGPT／Firefly：比例與排除項寫成自然語言' },
  { value: 'mj', label: 'Midjourney', hint: '加上 --ar、--no、--seed 參數' },
  { value: 'sd', label: 'Stable Diffusion', hint: '加上品質權重與獨立的 Negative prompt 欄' },
];

export default function MoreScreen() {
  const { c } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const vault = useVault();

  const [apiKey, setApiKeyState] = useState('');
  useEffect(() => {
    getApiKey().then(setApiKeyState);
  }, []);

  const exportBackup = async () => {
    const stamp = new Date().toISOString().slice(0, 10);
    await shareText(vault.exportPayload(), `${BRAND.fileStem}-backup-${stamp}.json`);
    toast('備份已產生');
  };

  const exportCsv = async () => {
    const cell = (value: string) => `"${String(value ?? '').replace(/"/g, '""').replace(/\n/g, ' ')}"`;
    const rows = [['分類', '標題', '標籤', '中文提示詞', '英文提示詞', '來源']];
    for (const p of vault.prompts) {
      rows.push([
        categoryOf(p.c).zh,
        p.t,
        p.k,
        p.zh,
        p.en,
        p.source === 'mine' ? '自建' : p.edited ? '已改' : '內建',
      ]);
    }
    // The BOM is what makes Excel on Windows read the file as UTF-8 rather than Big5.
    const csv = '﻿' + rows.map((r) => r.map(cell).join(',')).join('\r\n');
    const stamp = new Date().toISOString().slice(0, 10);
    await shareText(csv, `${BRAND.fileStem}-prompts-${stamp}.csv`);
    toast('CSV 已產生，可用 Excel 開啟');
  };

  const importBackup = async () => {
    try {
      const raw = await readJsonFile();
      if (!raw) return;
      const data = JSON.parse(raw);
      vault.replaceAll({
        over: data.over ?? {},
        del: data.del ?? [],
        mine: data.mine ?? [],
        fav: data.fav ?? [],
        chars: data.chars ?? [],
        packs: data.packs ?? [],
        hist: data.hist ?? {},
      });
      toast('備份已匯入', 'success');
    } catch {
      toast('讀不到這個檔案，請選匯出的 JSON', 'error');
    }
  };

  const factoryReset = () =>
    Alert.alert(
      '還原出廠',
      `會清掉所有修改、自建、收藏與成品圖，回到出廠的 ${PROMPTS.length} 則。這個動作無法復原。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '還原',
          style: 'destructive',
          onPress: () => {
            vault.resetToFactory();
            toast('已還原出廠');
          },
        },
      ]
    );

  return (
    <ScrollView
      style={{ backgroundColor: c.bg }}
      contentContainerStyle={[
        styles.page,
        { paddingTop: insets.top + space.lg, paddingBottom: insets.bottom + space.xxl },
      ]}
    >
      <Text style={[styles.title, { color: c.text }]}>更多</Text>
      <Text style={[styles.sub, { color: c.textFaint }]}>
        {BRAND.zh} · {BRAND.en} — {BRAND.taglineZh}
      </Text>

      <Section title="輸出格式" hint={FORMATS.find((f) => f.value === vault.fmt)?.hint}>
        <View style={styles.formatRow}>
          {FORMATS.map((format) => {
            const selected = vault.fmt === format.value;
            return (
              <Pressable
                key={format.value}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => {
                  vault.setFormat(format.value);
                  toast(`輸出格式：${format.label}`);
                }}
                style={[
                  styles.format,
                  {
                    backgroundColor: selected ? c.pine : c.surface,
                    borderColor: selected ? c.pine : c.border,
                  },
                ]}
              >
                <Text style={[styles.formatLabel, { color: selected ? c.onAccent : c.text }]}>
                  {format.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Section>

      <Section
        title="外觀"
        hint="深色模式在挑圖與看提示詞時比較不刺眼。選「跟隨系統」就會跟著手機的日夜切換。"
      >
        <View style={styles.formatRow}>
          {THEMES.map((option) => {
            const selected = vault.theme === option.value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => vault.setTheme(option.value)}
                style={[
                  styles.format,
                  {
                    backgroundColor: selected ? c.pine : c.surface,
                    borderColor: selected ? c.pine : c.border,
                  },
                ]}
              >
                <Text style={[styles.formatLabel, { color: selected ? c.onAccent : c.text }]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Section>

      <Section title="心法筆記">
        <Button label="打開心法筆記" tone="accent" onPress={() => router.push('/guide')} />
      </Section>

      <Section
        title="自動翻譯 · 照片反推"
        hint="選填。填入自己的 Anthropic API 金鑰，「翻成英文」與「從照片反推」就會自動跑；不填也能用——按下去會把指令複製起來，貼給任何一個 AI 都行。金鑰只存在這台裝置上。"
      >
        <Field
          label="Anthropic API Key"
          value={apiKey}
          onChangeText={setApiKeyState}
          placeholder="sk-ant-…"
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
        />
        <View style={styles.dataGrid}>
          <Button
            label="儲存金鑰"
            style={styles.dataButton}
            onPress={async () => {
              await setApiKey(apiKey);
              toast(apiKey.trim() ? '金鑰已儲存' : '金鑰已清除', 'success');
            }}
          />
          <Button
            label="清除金鑰"
            tone="danger"
            style={styles.dataButton}
            onPress={async () => {
              await setApiKey('');
              setApiKeyState('');
              toast('金鑰已清除');
            }}
          />
        </View>
      </Section>

      <Section
        title="資料"
        hint={`內建 ${PROMPTS.length} 則 · 自建 ${vault.mine.length} · 改過 ${
          Object.keys(vault.over).length
        } · 隱藏 ${vault.del.length} · 收藏 ${vault.fav.length} · 成品圖 ${
          Object.keys(vault.shots).length
        }`}
      >
        <View style={styles.dataGrid}>
          <Button label="匯出備份" style={styles.dataButton} onPress={exportBackup} />
          <Button label="匯入備份" style={styles.dataButton} onPress={importBackup} />
          <Button label="匯出 CSV" style={styles.dataButton} onPress={exportCsv} />
          <Button label="還原出廠" tone="danger" style={styles.dataButton} onPress={factoryReset} />
        </View>
      </Section>

      <Section title="關於">
        <Text style={[styles.about, { color: c.textDim }]}>
          所有資料都存在這台裝置上，不會上傳。換手機前記得先「匯出備份」。{'\n\n'}
          提示詞是中英各寫一份、不是機器直譯——Midjourney 與 Stable Diffusion 請切到 EN，
          即夢與豆包用中文最穩。{'\n\n'}
          肖像權與版權：拿別人的照片做圖、或生成真實名人的臉，商用前要有授權。
        </Text>
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { paddingHorizontal: space.md },
  title: { fontFamily: fonts.uiMedium, fontSize: 26, fontWeight: '800', letterSpacing: -0.6 },
  sub: { fontFamily: fonts.ui, fontSize: 13, marginTop: 4 },

  formatRow: { flexDirection: 'row', gap: space.sm },
  format: {
    flex: 1,
    minHeight: 46,
    borderWidth: 1.5,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.sm,
  },
  formatLabel: { fontFamily: fonts.uiMedium, fontSize: 13.5, fontWeight: '700' },

  dataGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  dataButton: { flexGrow: 1, flexBasis: 140 },

  about: { fontFamily: fonts.ui, fontSize: 13, lineHeight: 21 },
});
