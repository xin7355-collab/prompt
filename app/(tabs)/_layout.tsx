import React from 'react';
import { Tabs } from 'expo-router';
import { Text, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fonts } from '../../src/theme';
import { useTheme } from '../../src/ui/ThemeProvider';
import { useVault } from '../../src/store/vault';

/**
 * Emoji-free glyph tabs: the icon is a single typographic mark so the bar renders
 * identically on both platforms without shipping an icon font.
 */
function TabGlyph({ glyph, color }: { glyph: string; color: ColorValue }) {
  return <Text style={{ fontSize: 19, lineHeight: 23, color }}>{glyph}</Text>;
}

export default function TabsLayout() {
  const { c } = useTheme();
  const { bench } = useVault();
  const insets = useSafeAreaInsets();

  // 56pt of content plus the gesture inset — the default bar clips the label at
  // these glyph sizes, and edge-to-edge Android supplies no padding of its own.
  const barHeight = 56 + insets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.vermilion,
        tabBarInactiveTintColor: c.textFaint,
        tabBarStyle: {
          backgroundColor: c.surface,
          borderTopColor: c.border,
          height: barHeight,
          paddingTop: 6,
          paddingBottom: insets.bottom,
        },
        tabBarIconStyle: { height: 24 },
        tabBarLabelStyle: {
          fontFamily: fonts.ui,
          fontSize: 11,
          fontWeight: '600',
          marginBottom: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '倉庫',
          tabBarIcon: ({ color }) => <TabGlyph glyph="▤" color={color} />,
        }}
      />
      <Tabs.Screen
        name="bench"
        options={{
          title: '工作台',
          tabBarIcon: ({ color }) => <TabGlyph glyph="◈" color={color} />,
          // A loaded base is the one piece of cross-tab state worth surfacing.
          tabBarBadge: bench.base ? '1' : undefined,
          tabBarBadgeStyle: { backgroundColor: c.vermilion, fontSize: 10 },
        }}
      />
      <Tabs.Screen
        name="cast"
        options={{
          title: '角色',
          tabBarIcon: ({ color }) => <TabGlyph glyph="☺" color={color} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: '更多',
          tabBarIcon: ({ color }) => <TabGlyph glyph="☰" color={color} />,
        }}
      />
    </Tabs>
  );
}
