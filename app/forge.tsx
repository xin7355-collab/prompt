import React, { useMemo, useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';

import { FORGE_AXES } from '../src/data/forge';
import {
  composeForge,
  randomSelection,
  selectedGenderId,
  visibleAxes,
  type ForgeSelection,
} from '../src/lib/forge';
import { useVault } from '../src/store/vault';
import { fonts, radius, space } from '../src/theme';
import { useTheme } from '../src/ui/ThemeProvider';
import { Button, Chip, Field, Section } from '../src/ui/primitives';
import { useToast } from '../src/ui/Toast';
import { AppText as Text } from '../src/ui/AppText';
import { useLayout } from '../src/ui/useLayout';

/**
 * 角色工坊 — build a character from option axes instead of writing a sheet by hand.
 *
 * The output can go three ways: straight to the clipboard, into the bench as a base
 * prompt, or saved as a locked character so the same face carries across a whole series.
 */
export default function ForgeScreen() {
  const { c } = useTheme();
  const layout = useLayout();
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const vault = useVault();

  const [selection, setSelection] = useState<ForgeSelection>({ gender: [0] });
  const [name, setName] = useState('');

  const axes = useMemo(() => visibleAxes(selection), [selection]);
  const result = useMemo(() => composeForge(selection), [selection]);
  const zh = vault.lang === 'zh';
  const body = zh ? result.zh : result.en;

  const toggle = (axis: { key: string; multi?: boolean; required?: boolean }, index: number) =>
    setSelection((prev) => {
      const current = prev[axis.key] ?? [];
      if (axis.multi) {
        const next = current.includes(index)
          ? current.filter((i) => i !== index)
          : [...current, index];
        return { ...prev, [axis.key]: next };
      }
      // Tapping the selected option again clears the axis — except where another axis
      // branches on it, which would leave the form in a half-defined state.
      const clearing = current[0] === index && !axis.required;
      return { ...prev, [axis.key]: clearing ? [] : [index] };
    });

  const saveAsCharacter = () => {
    if (!result.chosen) {
      toast('先選幾個項目', 'error');
      return;
    }
    const id = vault.saveCharacter(
      { name: name.trim() || '工坊角色', zh: result.dnaZh, en: result.dnaEn },
      null
    );
    vault.setBench((b) => ({ ...b, char: id }));
    toast('已存成角色並鎖定', 'success');
    router.back();
  };

  const sendToBench = () => {
    vault.loadIntoBench({
      i: `forge-${Date.now()}`,
      c: 'charmake',
      t: name.trim() || '工坊角色',
      k: '角色,工坊,設定',
      zh: result.zh,
      en: result.en,
    });
    router.dismissTo('/bench');
  };

  return (
    <ScrollView
      style={{ backgroundColor: c.bg }}
      contentContainerStyle={[styles.page, layout.gutter, layout.column, { paddingBottom: insets.bottom + space.xxl }]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.intro, { color: c.textDim }]}>
        一項一項點，下面就會組出完整的角色提示詞。再點一次同一個選項可以取消。
        中英文各產一份，按頂端的語言切換查看。
      </Text>

      <View style={styles.topActions}>
        <Button
          label="🎲 隨機生成"
          tone="accent"
          style={{ flex: 1 }}
          onPress={() => {
            setSelection(randomSelection());
            toast('已隨機抽一組，再微調即可');
          }}
        />
        <Button
          label="清空"
          style={{ flex: 1 }}
          onPress={() => setSelection({ gender: [0] })}
        />
      </View>

      {axes.map((axis) => {
        const current = selection[axis.key] ?? [];
        return (
          <Section key={axis.key} title={axis.label} hint={axis.hint}>
            <View style={styles.chips}>
              {axis.options.map((option, index) => (
                <Chip
                  key={option.zh}
                  label={zh ? option.zh : option.en}
                  selected={current.includes(index)}
                  onPress={() => toggle(axis, index)}
                />
              ))}
            </View>
          </Section>
        );
      })}

      <Section
        title="成品"
        hint={`已選 ${result.chosen} / ${FORGE_AXES.length} 項。選越多，模型的發揮空間越小、結果越接近你要的。`}
      >
        <View style={[styles.output, { backgroundColor: c.surfaceSunken, borderColor: c.border }]}>
          <Text selectable style={[styles.outputText, { color: c.text }]}>
            {body}
          </Text>
        </View>

        <Field
          label="角色名稱（存成角色時用）"
          value={name}
          onChangeText={setName}
          placeholder="例：赤鳶"
        />

        <View style={styles.actions}>
          <Button
            label="複製"
            tone="primary"
            style={{ flex: 1 }}
            onPress={async () => {
              await Clipboard.setStringAsync(body);
              toast('已複製', 'success');
            }}
          />
          <Button label="送工作台" style={{ flex: 1 }} onPress={sendToBench} />
        </View>
        <View style={styles.actions}>
          <Button
            label="存成鎖定角色"
            tone="accent"
            style={{ flex: 1 }}
            onPress={saveAsCharacter}
          />
          <Button
            label="存成提示詞"
            style={{ flex: 1 }}
            onPress={() =>
              router.push({
                pathname: '/edit',
                params: {
                  presetTitle: name.trim() || '工坊角色',
                  presetCategory: 'charmake',
                  presetTags: '角色,工坊,設定',
                  presetBody: body,
                  presetLang: vault.lang,
                },
              })
            }
          />
        </View>
      </Section>

      <Section title="怎麼用最穩">
        <Text style={[styles.tip, { color: c.textDim }]}>
          1. 先按「存成鎖定角色」——只有外貌那幾軸會被存下來，之後每一則提示詞都會自動帶上，
          換服裝、換場景、換動作臉都不會跑掉。{'\n\n'}
          2. 到工作台填一個固定的種子值，系列圖會更一致。{'\n\n'}
          3. 取景選「三視圖」先做一張角色設定圖，之後用「保留長相」模式拿它當參考往下做。
          {'\n\n'}
          4. Midjourney 與 Stable Diffusion 請切到 EN；即夢、豆包用中文最穩。
        </Text>
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { paddingTop: space.md },
  intro: { fontFamily: fonts.ui, fontSize: 13.5, lineHeight: 21 },
  topActions: { flexDirection: 'row', gap: space.sm, marginTop: space.lg },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm - 2 },
  output: { borderWidth: 1, borderRadius: radius.md, padding: space.md, minHeight: 120 },
  outputText: { fontFamily: fonts.mono, fontSize: 13, lineHeight: 21 },
  actions: { flexDirection: 'row', gap: space.sm, marginTop: space.md },
  tip: { fontFamily: fonts.ui, fontSize: 13, lineHeight: 21 },
});
