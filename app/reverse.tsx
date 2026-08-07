import React, { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImageManipulator from 'expo-image-manipulator';

import { CATEGORIES, categoryOf } from '../src/data/corpus';
import { pickImage } from '../src/lib/io';
import { analyzeImage } from '../src/lib/translate';
import { useVault } from '../src/store/vault';
import { fonts, radius, space } from '../src/theme';
import { useTheme } from '../src/ui/ThemeProvider';
import { Button, Chip, Field } from '../src/ui/primitives';
import { useToast } from '../src/ui/Toast';

/**
 * Reverse-engineers a reference photo into a reusable prompt. Whether the analysis
 * runs automatically or the user pastes a result back in by hand, the same form
 * below collects the outcome — so the screen works with or without an API key.
 */
export default function ReverseScreen() {
  const { c } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const vault = useVault();

  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0].id);
  const [tags, setTags] = useState('');
  const [zh, setZh] = useState('');
  const [en, setEn] = useState('');

  const choose = async () => {
    const uri = await pickImage();
    if (!uri) return;
    setPreview(uri);
  };

  const analyze = async () => {
    if (!preview) {
      toast('先選一張圖片', 'error');
      return;
    }
    setBusy(true);
    try {
      // Downscale before encoding: full-resolution photos blow past the request limit.
      const context = ImageManipulator.ImageManipulator.manipulate(preview).resize({ width: 1152 });
      const rendered = await context.renderAsync();
      const saved = await rendered.saveAsync({
        compress: 0.85,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: true,
      });

      const result = await analyzeImage(saved.base64 ?? '');
      if (result.ok) {
        setTitle(result.text.title || '反推的提示詞');
        setTags(result.text.tags || '');
        setZh(result.text.zh || '');
        setEn(result.text.en || '');
        toast('解析完成，確認後即可儲存', 'success');
      } else {
        toast(result.message, 'error');
      }
    } catch {
      toast('讀不到這張圖，換一張試試', 'error');
    } finally {
      setBusy(false);
      setShowForm(true);
    }
  };

  const draft = () => ({
    t: title.trim() || '反推的提示詞',
    c: category,
    k: tags.trim(),
    zh: zh.trim(),
    en: en.trim(),
  });

  const saveAsPrompt = () => {
    if (!zh.trim() && !en.trim()) {
      toast('至少要有一種語言的提示詞', 'error');
      return;
    }
    vault.savePrompt(draft(), null);
    toast('已存成新的一則', 'success');
    router.back();
  };

  const sendToBench = () => {
    if (!zh.trim() && !en.trim()) {
      toast('至少要有一種語言的提示詞', 'error');
      return;
    }
    const d = draft();
    vault.loadIntoBench({ i: `tmp-${Date.now()}`, ...d });
    router.dismissTo('/bench');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView
        contentContainerStyle={[styles.page, { paddingBottom: insets.bottom + space.xxl }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.intro, { color: c.textDim }]}>
          丟一張你喜歡的圖，拆解出它的光線、鏡頭、色調與構圖，變成可重複使用的提示詞。
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="選擇參考圖"
          onPress={choose}
          style={[
            styles.drop,
            { borderColor: c.borderStrong, backgroundColor: c.surface },
            preview && styles.dropFilled,
          ]}
        >
          {preview ? (
            <Image source={{ uri: preview }} style={styles.preview} resizeMode="contain" />
          ) : (
            <Text style={[styles.dropLabel, { color: c.textFaint }]}>點這裡選一張圖片</Text>
          )}
        </Pressable>

        <View style={styles.actions}>
          <Button
            label={busy ? '解析中…' : '開始反推'}
            tone="primary"
            disabled={busy}
            style={{ flex: 1.2 }}
            onPress={analyze}
          />
          <Button label="手動填寫" style={{ flex: 1 }} onPress={() => setShowForm(true)} />
        </View>

        <Text style={[styles.hint, { color: c.textFaint }]}>
          沒設定 API 金鑰也能用：按「開始反推」會把解析指令複製起來，連同照片貼到 Gemini 或
          ChatGPT，再把回傳的 JSON 內容填進下面欄位。
        </Text>

        {showForm && (
          <View style={{ marginTop: space.lg }}>
            <Field label="標題" value={title} onChangeText={setTitle} />

            <View style={styles.field}>
              <Text style={[styles.label, { color: c.textFaint }]}>分類</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.strip}>
                <View style={styles.categoryRow}>
                  {CATEGORIES.map((cat) => (
                    <Chip
                      key={cat.id}
                      label={cat.zh}
                      selected={cat.id === category}
                      onPress={() => setCategory(cat.id)}
                    />
                  ))}
                </View>
              </ScrollView>
              <Text style={[styles.hint, { color: c.textFaint }]}>
                目前：{categoryOf(category).zh}
              </Text>
            </View>

            <Field label="標籤" value={tags} onChangeText={setTags} autoCapitalize="none" />
            <Field label="中文提示詞" value={zh} onChangeText={setZh} multiline mono />
            <Field label="英文提示詞" value={en} onChangeText={setEn} multiline mono />

            <View style={styles.actions}>
              <Button label="存成新的一則" tone="primary" style={{ flex: 1.3 }} onPress={saveAsPrompt} />
              <Button label="直接送工作台" style={{ flex: 1 }} onPress={sendToBench} />
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { paddingHorizontal: space.md, paddingTop: space.md },
  intro: { fontFamily: fonts.ui, fontSize: 13.5, lineHeight: 21 },

  drop: {
    marginTop: space.lg,
    minHeight: 160,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.md,
  },
  dropFilled: { borderStyle: 'solid' },
  dropLabel: { fontFamily: fonts.ui, fontSize: 14 },
  preview: { width: '100%', height: 240, borderRadius: radius.md },

  actions: { flexDirection: 'row', gap: space.sm, marginTop: space.lg },
  hint: { fontFamily: fonts.ui, fontSize: 12, lineHeight: 18, marginTop: space.md },

  field: { marginTop: space.md },
  label: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.3,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  strip: { flexGrow: 0, flexShrink: 0 },
  categoryRow: { flexDirection: 'row', gap: space.sm - 2 },
});
