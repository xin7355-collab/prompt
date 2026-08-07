import React, { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DNA_TEMPLATE } from '../src/data/corpus';
import { translateToEnglish } from '../src/lib/translate';
import { useVault } from '../src/store/vault';
import { space } from '../src/theme';
import { useTheme } from '../src/ui/ThemeProvider';
import { Button, Field } from '../src/ui/primitives';
import { useToast } from '../src/ui/Toast';

export default function CharacterScreen() {
  const { c } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const vault = useVault();

  const { id } = useLocalSearchParams<{ id?: string }>();
  const editing = useMemo(() => vault.chars.find((ch) => ch.id === id) ?? null, [id, vault.chars]);

  const [name, setName] = useState(editing?.name ?? '');
  const [zh, setZh] = useState(editing?.zh ?? DNA_TEMPLATE.zh);
  const [en, setEn] = useState(editing?.en ?? DNA_TEMPLATE.en);
  const [translating, setTranslating] = useState(false);

  const save = () => {
    if (!zh.trim() && !en.trim()) {
      toast('至少要寫一種語言的外貌設定', 'error');
      return;
    }
    const commit = () => {
      const savedId = vault.saveCharacter(
        { name: name.trim() || '未命名角色', zh: zh.trim(), en: en.trim() },
        editing
      );
      // A brand-new character is almost always meant to be used right away.
      if (!editing) vault.setBench((b) => ({ ...b, char: savedId }));
      toast('角色已儲存', 'success');
      router.back();
    };

    if (/\{\{/.test(zh)) {
      Alert.alert(
        '還有沒填的大括號',
        '外貌設定裡還有 {{大括號}}，這樣模型會照著括號裡的字畫。確定要存嗎？',
        [
          { text: '再改改', style: 'cancel' },
          { text: '還是存起來', onPress: commit },
        ]
      );
      return;
    }
    commit();
  };

  const translate = async () => {
    if (!zh.trim()) {
      toast('先寫中文設定', 'error');
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
    Alert.alert('刪除角色', `確定刪除「${editing.name}」？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '刪除',
        style: 'destructive',
        onPress: () => {
          vault.deleteCharacter(editing.id);
          toast('已刪除');
          router.back();
        },
      },
    ]);
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
        <Field
          label="角色名稱"
          value={name}
          onChangeText={setName}
          placeholder="例：小美"
          hint="外貌越具體越穩。不要寫「漂亮的眼睛」，要寫「內雙、眼尾略微上揚、瞳色深褐」——抽象形容詞模型每次都會重新解釋一遍。"
        />

        <Field
          label="外貌設定 · 中文"
          value={zh}
          onChangeText={setZh}
          multiline
          mono
          style={{ minHeight: 170 }}
        />

        <Field
          label="外貌設定 · 英文"
          value={en}
          onChangeText={setEn}
          multiline
          mono
          style={{ minHeight: 170 }}
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

        <View style={styles.actions}>
          <Button
            label="套用範本"
            style={{ flex: 1 }}
            onPress={() => {
              setZh(DNA_TEMPLATE.zh);
              setEn(DNA_TEMPLATE.en);
              toast('範本已套用，把大括號換成你的設定');
            }}
          />
          {editing && <Button label="刪除" tone="danger" style={{ flex: 1 }} onPress={remove} />}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { paddingHorizontal: space.md, paddingTop: space.sm },
  actions: { flexDirection: 'row', gap: space.sm, marginTop: space.lg },
});
