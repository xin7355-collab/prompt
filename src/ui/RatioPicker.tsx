import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { RATIOS } from '../data/corpus';
import { fonts, radius, space } from '../theme';
import { useTheme } from './ThemeProvider';

/**
 * Aspect ratios drawn at their actual shape. Reading "9:16" tells you nothing at a
 * glance; a tall rectangle does. The caption below names what each ratio is used for,
 * which is the part people actually need.
 */
export function RatioPicker({
  value,
  onChange,
}: {
  value: string;
  onChange(next: string): void;
}) {
  const { c } = useTheme();
  const active = RATIOS.find((r) => r.r === value);

  return (
    <View>
      <View style={styles.row}>
        {RATIOS.map((spec) => {
          const selected = spec.r === value;
          // Fit each box inside a fixed 52pt envelope so the row keeps a common baseline.
          const scale = 52 / Math.max(spec.w, spec.h);
          return (
            <Pressable
              key={spec.r}
              accessibilityRole="button"
              accessibilityLabel={`${spec.r}，${spec.use}`}
              accessibilityState={{ selected }}
              onPress={() => onChange(selected ? '' : spec.r)}
              style={styles.item}
            >
              <View style={styles.box}>
                <View
                  style={[
                    styles.shape,
                    {
                      width: spec.w * scale,
                      height: spec.h * scale,
                      borderColor: selected ? c.gold : c.borderStrong,
                      backgroundColor: selected ? c.gold + '2E' : 'transparent',
                    },
                  ]}
                />
              </View>
              <Text
                style={[styles.label, { color: selected ? c.gold : c.textFaint }]}
              >
                {spec.r}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.caption, { color: c.textDim }]}>
        {active ? `${active.r} — ${active.use}` : '點一下選比例，方框就是實際的畫面形狀。'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  item: { width: 66, alignItems: 'center', gap: 5 },
  box: { height: 54, justifyContent: 'center', alignItems: 'center' },
  shape: { borderWidth: 1.5, borderRadius: radius.sm - 4 },
  label: { fontFamily: fonts.mono, fontSize: 10.5, fontWeight: '700' },
  caption: { fontFamily: fonts.ui, fontSize: 12.5, lineHeight: 19, marginTop: space.md },
});
