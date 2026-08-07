import React, { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useVault } from '../src/store/vault';
import { space } from '../src/theme';
import { useTheme } from '../src/ui/ThemeProvider';
import { Button, Field } from '../src/ui/primitives';
import { useToast } from '../src/ui/Toast';

/**
 * A batch pack is a list of variations. Firing it composes the current bench settings
 * once per line, so a 16-action sticker set comes out as 16 finished prompts.
 */
export default function PackScreen() {
  const { c } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const vault = useVault();

  const { id } = useLocalSearchParams<{ id?: string }>();
  const editing = useMemo(() => vault.packs.find((p) => p.id === id) ?? null, [id, vault.packs]);

  const [name, setName] = useState(editing?.n ?? '');
  const [lines, setLines] = useState(
    editing ? editing.items.map(([zh, en]) => (en && en !== zh ? `${zh} | ${en}` : zh)).join('\n') : ''
  );

  const save = () => {
    const items = lines
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [zh, en] = line.split('|');
        return [zh.trim(), (en ?? zh).trim()] as [string, string];
      });

    if (!items.length) {
      toast('至少要寫一行變體', 'error');
      return;
    }

    vault.savePack({ n: name.trim() || '我的組合包', items }, editing);
    toast('組合包已儲存', 'success');
    router.back();
  };

  const remove = () => {
    if (!editing) return;
    Alert.alert('刪除組合包', `確定刪除「${editing.n}」？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '刪除',
        style: 'destructive',
        onPress: () => {
          vault.deletePack(editing.id);
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
          label="組合包名稱"
          value={name}
          onChangeText={setName}
          placeholder="例：我的貼圖 24 動作"
        />

        <Field
          label="變體清單（一行一個）"
          value={lines}
          onChangeText={setLines}
          multiline
          mono
          autoCapitalize="none"
          style={{ minHeight: 240 }}
          placeholder={'揮手打招呼 | waving hello\n鞠躬道謝 | bowing in thanks\n比讚 | thumbs up'}
          hint="每行會接在底稿後面，產出一則完整提示詞。想同時有英文版就用直線分隔：中文變體 | English variation"
        />

        <View style={styles.actions}>
          <Button label="儲存" tone="primary" style={{ flex: 1.2 }} onPress={save} />
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
