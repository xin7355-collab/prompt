import React, { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BRAND } from '../../src/brand';
import { categoryOf, PROMPTS } from '../../src/data/corpus';
import { STYLES } from '../../src/data/styles';
import type { Format } from '../../src/data/types';
import { readJsonFile, shareText } from '../../src/lib/io';
import { openExternal } from '../../src/lib/openExternal';
import {
  getImageKey,
  getImageModel,
  IMAGE_MODEL,
  IMAGE_MODELS,
  setImageKey,
  setImageModel,
} from '../../src/lib/imagegen';
import { getApiKey, setApiKey } from '../../src/lib/translate';
import { useVault } from '../../src/store/vault';
import { fonts, radius, space } from '../../src/theme';
import { useTheme, type TextSize, type ThemePreference } from '../../src/ui/ThemeProvider';
import { Button, Field, Section } from '../../src/ui/primitives';
import { useToast } from '../../src/ui/Toast';
import { AppText as Text } from '../../src/ui/AppText';
import { useLayout } from '../../src/ui/useLayout';

const THEMES: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: '跟隨系統' },
  { value: 'light', label: '淺色' },
  { value: 'dark', label: '深色' },
];

const TEXT_SIZES: { value: TextSize; label: string; sample: number }[] = [
  { value: 'sm', label: '小', sample: 13 },
  { value: 'md', label: '中', sample: 15 },
  { value: 'lg', label: '大', sample: 17 },
  { value: 'xl', label: '特大', sample: 19 },
];

const FORMATS: { value: Format; label: string; hint: string }[] = [
  { value: 'plain', label: '通用', hint: 'Gemini／ChatGPT／Firefly：比例與排除項寫成自然語言' },
  { value: 'mj', label: 'Midjourney', hint: '加上 --ar、--no、--seed 參數' },
  { value: 'sd', label: 'Stable Diffusion', hint: '加上品質權重與獨立的 Negative prompt 欄' },
];

/** App build stamp, shown in 更多. Bump on each deploy so a stale PWA cache is visible. */
const APP_VERSION = 'v1.2.3';

export default function MoreScreen() {
  const { c } = useTheme();
  const layout = useLayout();
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const vault = useVault();

  const [apiKey, setApiKeyState] = useState('');
  const [imageKey, setImageKeyState] = useState('');
  const [imageModel, setImageModelState] = useState('');
  useEffect(() => {
    getApiKey().then(setApiKeyState);
    getImageKey().then(setImageKeyState);
    getImageModel().then(setImageModelState);
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
        // Absent from backups written before 風格牆 existed; keep what is on this
        // device rather than blanking it when an older file is restored.
        styleFav: data.styleFav ?? vault.styleFav,
        subject: data.subject ?? vault.subject,
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
        layout.gutter,
        layout.column,
        { paddingTop: insets.top + space.lg, paddingBottom: insets.bottom + space.xxl },
      ]}
    >
      <Text style={[styles.title, { color: c.text }]}>更多</Text>
      <Text style={[styles.sub, { color: c.textFaint }]}>
        {BRAND.zh} · {BRAND.en} — {BRAND.taglineZh}
      </Text>
      {/* Visible build stamp: mobile PWAs cache hard, so "did the update land?" is a
          glance here. Bump on each app deploy. */}
      <Text style={[styles.version, { color: c.gold, borderColor: c.border }]}>{APP_VERSION}</Text>

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

      <Section
        title="文字大小"
        hint="整個 App 的字都會跟著變，按鈕與欄位也會一起長高，不會被切到。這個設定會疊加在手機系統的字級之上。"
      >
        <View style={styles.formatRow}>
          {TEXT_SIZES.map((option) => {
            const selected = vault.textSize === option.value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                accessibilityLabel={`文字大小：${option.label}`}
                accessibilityState={{ selected }}
                onPress={() => vault.setTextSize(option.value)}
                style={[
                  styles.format,
                  {
                    backgroundColor: selected ? c.pine : c.surface,
                    borderColor: selected ? c.pine : c.border,
                  },
                ]}
              >
                {/* Each chip previews its own size, so the choice is visible before
                    committing to it rather than only after the whole app reflows. */}
                <Text
                  style={[
                    styles.formatLabel,
                    { fontSize: option.sample, color: selected ? c.onAccent : c.text },
                  ]}
                >
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
        title="海報牆"
        hint="另一種介面：634 則全部攤成卡片牆，按「⚡ 生成」直接在卡片裡免費出圖。從這裡打開會跟 App 共用同一批圖（海報牆生的，App 也看得到）。海報牆裡有「← 咒語盒」可以回來。"
      >
        <Button
          label="打開海報牆（共用圖庫）"
          onPress={() => {
            // Navigate in the SAME window on web, not a new tab. On an installed iOS
            // PWA a new tab is a separate storage box, so it could never share images
            // with the app; same-window keeps the poster wall in this same box.
            // Relative on purpose: resolves against the document, so a file:// copy
            // still finds its sibling.
            if (Platform.OS === 'web' && typeof window !== 'undefined') {
              window.location.assign('poster.html');
              return;
            }
            if (openExternal('poster.html') === 'blocked') {
              toast('瀏覽器擋掉了新分頁，請允許彈出視窗', 'error');
            }
          }}
        />
      </Section>

      <Section
        title="生成圖片"
        hint={'預設用「免費 Pollinations」——不用金鑰、直接在風格牆按「⚡ 生成」就出圖。\n\n想要更高畫質可改用 gemini／imagen，但那些要付費層金鑰（Google API 免費層無法生圖）：貼上自己的 Google AI Studio 金鑰（aistudio.google.com/apikey）並在上面選對應模型。\n\n金鑰只存在這台裝置，直接送到 Google，不經過任何中間伺服器。'}
      >
        <Field
          label="Google API Key"
          value={imageKey}
          onChangeText={setImageKeyState}
          placeholder="AIza…"
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
        />
        <Text style={styles.pickerLabel}>圖片模型</Text>
        <View style={styles.modelRow}>
          {IMAGE_MODELS.map((m) => {
            const selected = (imageModel || IMAGE_MODEL) === m.value;
            return (
              <Pressable
                key={m.value}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={async () => {
                  setImageModelState(m.value);
                  await setImageModel(m.value);
                  toast(`圖片模型：${m.label}`);
                }}
                style={[
                  styles.format,
                  styles.modelChip,
                  {
                    backgroundColor: selected ? c.pine : c.surface,
                    borderColor: selected ? c.pine : c.border,
                  },
                ]}
              >
                <Text style={[styles.formatLabel, { color: selected ? c.onAccent : c.text }]}>
                  {m.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.pickerHint}>
          「免費 Pollinations」不用金鑰、直接出圖。gemini／imagen 畫質較好但要付費層金鑰（Google API 免費層無法生圖）。
        </Text>
        <View style={styles.dataGrid}>
          <Button
            label="儲存"
            style={styles.dataButton}
            onPress={async () => {
              await setImageKey(imageKey);
              await setImageModel(imageModel);
              toast(imageKey.trim() ? '已儲存，去風格牆按「⚡ 生成」' : '金鑰已清除', 'success');
            }}
          />
          <Button
            label="清除金鑰"
            tone="danger"
            style={styles.dataButton}
            onPress={async () => {
              await setImageKey('');
              setImageKeyState('');
              toast('金鑰已清除');
            }}
          />
        </View>
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
        } · 風格 ${STYLES.length} 種，收藏 ${vault.styleFav.length}、縮圖 ${Object.values(
          vault.styleShots
        ).reduce((n, list) => n + list.length, 0)}`}
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

  modelRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  modelChip: { flex: 0, flexGrow: 1, flexBasis: '46%', paddingHorizontal: space.sm },
  pickerLabel: {
    fontFamily: fonts.uiMedium, fontSize: 13.5, fontWeight: '700', marginBottom: space.sm,
  },
  pickerHint: { fontFamily: fonts.ui, fontSize: 12, lineHeight: 18, opacity: 0.7, marginTop: space.sm },

  dataGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  dataButton: { flexGrow: 1, flexBasis: 140 },

  about: { fontFamily: fonts.ui, fontSize: 13, lineHeight: 21 },
  version: {
    alignSelf: 'flex-start',
    marginTop: space.sm,
    fontFamily: fonts.mono,
    fontSize: 11,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: 7,
    paddingVertical: 2,
    overflow: 'hidden',
  },
});
