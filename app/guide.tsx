import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GUIDE, type GuideBlock } from '../src/data/guide';
import { fonts, radius, space } from '../src/theme';
import { useTheme } from '../src/ui/ThemeProvider';

export default function GuideScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={{ backgroundColor: c.bg }}
      contentContainerStyle={[styles.page, { paddingBottom: insets.bottom + space.xxl }]}
    >
      {GUIDE.map((chapter) => (
        <View key={chapter.title} style={styles.chapter}>
          <View style={styles.headingRow}>
            <View style={[styles.headingBar, { backgroundColor: c.vermilion }]} />
            <Text style={[styles.heading, { color: c.text }]}>{chapter.title}</Text>
          </View>
          {chapter.blocks.map((block, index) => (
            <Block key={index} block={block} />
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

function Block({ block }: { block: GuideBlock }) {
  const { c } = useTheme();

  if (block.kind === 'p') {
    return <Text style={[styles.paragraph, { color: c.textDim }]}>{block.text}</Text>;
  }

  return (
    <View style={[styles.table, { borderColor: c.border }]}>
      <View style={[styles.row, { backgroundColor: c.surfaceSunken }]}>
        {block.head.map((cell, index) => (
          <Text
            key={index}
            style={[
              styles.cell,
              styles.headCell,
              { color: c.text, borderColor: c.border },
              index === 0 && styles.firstColumn,
            ]}
          >
            {cell}
          </Text>
        ))}
      </View>
      {block.rows.map((row, rowIndex) => (
        <View key={rowIndex} style={[styles.row, { backgroundColor: c.surface }]}>
          {row.map((cell, index) => (
            <Text
              key={index}
              style={[
                styles.cell,
                { color: c.textDim, borderColor: c.border },
                index === 0 && styles.firstColumn,
              ]}
            >
              {cell}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { paddingHorizontal: space.md, paddingTop: space.lg },
  chapter: { marginBottom: space.xl },

  headingRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: space.md },
  headingBar: { width: 4, height: 20, borderRadius: 2 },
  heading: { flex: 1, fontFamily: fonts.uiMedium, fontSize: 18, fontWeight: '800' },

  paragraph: { fontFamily: fonts.ui, fontSize: 14.5, lineHeight: 25, marginBottom: space.md },

  table: {
    borderWidth: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
    marginBottom: space.md,
  },
  row: { flexDirection: 'row' },
  cell: {
    flex: 1,
    fontFamily: fonts.ui,
    fontSize: 12.5,
    lineHeight: 19,
    padding: space.sm + 2,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  firstColumn: { flex: 1.2 },
  headCell: { fontWeight: '700', fontSize: 12, borderTopWidth: 0 },
});
