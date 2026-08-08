import React from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';

import { fonts, radius, space } from '../theme';
import { useTheme } from './ThemeProvider';
import { scaleTextStyle } from './AppText';
import { AppText as Text } from './AppText';

function tap() {
  if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
}

/** Minimum touch target on both platforms. Anything smaller gets padded up to it. */
const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };

// ─────────────────────────────────────────────────────────────── Button

type ButtonTone = 'primary' | 'accent' | 'neutral' | 'ghost' | 'danger';

export function Button({
  label,
  onPress,
  tone = 'neutral',
  tint,
  disabled,
  style,
  compact,
}: {
  label: string;
  onPress: () => void;
  tone?: ButtonTone;
  /** Overrides the fill for `accent`, used to colour a button by category. */
  tint?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
}) {
  const { c, sz } = useTheme();

  const fills: Record<ButtonTone, { bg: string; fg: string; border: string }> = {
    primary: { bg: c.vermilion, fg: c.onAccent, border: c.vermilion },
    accent: { bg: tint ?? c.pine, fg: c.onAccent, border: tint ?? c.pine },
    neutral: { bg: c.surface, fg: c.text, border: c.borderStrong },
    ghost: { bg: 'transparent', fg: c.textDim, border: 'transparent' },
    danger: { bg: 'transparent', fg: c.danger, border: c.danger },
  };
  const f = fills[tone];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [
        styles.button,
        compact && styles.buttonCompact,
        // The label is capped at one line, so the box has to keep up with the type
        // or a long Chinese label gets truncated at the larger sizes.
        { minHeight: sz(compact ? 36 : 44) },
        {
          backgroundColor: f.bg,
          borderColor: f.border,
          opacity: disabled ? 0.4 : pressed ? 0.78 : 1,
        },
        style,
      ]}
    >
      <Text numberOfLines={1} style={[styles.buttonLabel, { color: f.fg }]}>
        {label}
      </Text>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────── Chip

export function Chip({
  label,
  selected,
  onPress,
  onLongPress,
  tone = 'gold',
  dashed,
  count,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  /** `gold` for additive choices, `danger` for exclusions. */
  tone?: 'gold' | 'danger';
  dashed?: boolean;
  count?: number;
}) {
  const { c, sz } = useTheme();
  const on = tone === 'danger' ? c.vermilion : c.gold;
  const onFg = tone === 'danger' ? c.onAccent : c.onGold;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={() => {
        tap();
        onPress();
      }}
      onLongPress={onLongPress}
      hitSlop={4}
      style={({ pressed }) => [
        styles.chip,
        { minHeight: sz(36) },
        {
          backgroundColor: selected ? on : c.surface,
          borderColor: selected ? on : c.borderStrong,
          borderStyle: dashed ? 'dashed' : 'solid',
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <Text style={[styles.chipLabel, { color: selected ? onFg : c.textDim }]}>{label}</Text>
      {count !== undefined && (
        <Text style={[styles.chipCount, { color: selected ? onFg : c.textFaint }]}>{count}</Text>
      )}
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────── Section

export function Section({
  title,
  hint,
  children,
  right,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  const { c } = useTheme();
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={[styles.sectionTitle, { color: c.gold }]}>{title}</Text>
        <View style={[styles.rule, { backgroundColor: c.border }]} />
        {right}
      </View>
      {children}
      {hint ? <Text style={[styles.hint, { color: c.textFaint }]}>{hint}</Text> : null}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────── Field

export function Field({
  label,
  hint,
  mono,
  style,
  ...props
}: TextInputProps & { label?: string; hint?: string; mono?: boolean }) {
  const { c, scale, sz } = useTheme();
  return (
    <View style={styles.field}>
      {label ? <Text style={[styles.fieldLabel, { color: c.textFaint }]}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={c.textFaint}
        {...props}
        style={[
          styles.input,
          mono && { fontFamily: fonts.mono, fontSize: 13, lineHeight: 21 },
          { backgroundColor: c.surface, borderColor: c.borderStrong, color: c.text },
          props.multiline && styles.inputMultiline,
          style,
          // TextInput is not AppText, so its own metrics are scaled here.
          scaleTextStyle(
            { fontSize: mono ? 13 : 15, lineHeight: mono ? 21 : undefined },
            scale
          ),
          { minHeight: sz(props.multiline ? 120 : 46) },
        ]}
      />
      {hint ? <Text style={[styles.hint, { color: c.textFaint }]}>{hint}</Text> : null}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────── Prompt body

/**
 * Renders a prompt with `{{placeholder}}` spans highlighted, so it is obvious at a
 * glance what still needs filling in. `filled` values are substituted and shown solid.
 */
export function PromptBody({
  text,
  filled,
  numberOfLines,
  size = 13,
}: {
  text: string;
  filled?: Record<string, string>;
  numberOfLines?: number;
  size?: number;
}) {
  const { c } = useTheme();
  const parts = text.split(/(\{\{[^}]+\}\})/g);

  return (
    <Text
      numberOfLines={numberOfLines}
      style={[styles.body, { color: c.text, fontSize: size, lineHeight: size * 1.62 }]}
    >
      {parts.map((part, index) => {
        const match = /^\{\{([^}]+)\}\}$/.exec(part);
        if (!match) return <Text key={index}>{part}</Text>;
        const name = match[1].trim();
        const value = filled?.[name];
        return (
          <Text
            key={index}
            style={{
              backgroundColor: value ? 'transparent' : c.gold,
              color: value ? c.text : c.onGold,
              fontWeight: '700',
            }}
          >
            {value || name}
          </Text>
        );
      })}
    </Text>
  );
}

// ─────────────────────────────────────────────────────────────── Icon button

export function IconButton({
  glyph,
  label,
  onPress,
  onChrome,
}: {
  glyph: string;
  label: string;
  onPress: () => void;
  /** Set when the button sits on the dark header rather than on a page surface. */
  onChrome?: boolean;
}) {
  const { c, sz } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={HIT_SLOP}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [
        styles.iconButton,
        { width: sz(38), height: sz(38) },
        {
          backgroundColor: onChrome ? 'rgba(255,255,255,0.12)' : c.surface,
          borderColor: onChrome ? 'transparent' : c.border,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Text style={[styles.iconGlyph, { color: onChrome ? c.onChrome : c.text }]}>{glyph}</Text>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────── Empty state

export function EmptyState({ title, body }: { title: string; body: string }) {
  const { c } = useTheme();
  return (
    <View style={[styles.empty, { borderColor: c.border }]}>
      <Text style={[styles.emptyTitle, { color: c.text }]}>{title}</Text>
      <Text style={[styles.emptyBody, { color: c.textFaint }]}>{body}</Text>
    </View>
  );
}

/**
 * Labels inside controls must not be selectable: on a touch screen a press that lands
 * slightly off target otherwise turns into a text selection with drag handles instead
 * of activating the control.
 */
const noSelect = { userSelect: 'none' } as const;

export const styles = StyleSheet.create({
  button: {
    ...noSelect,
    minHeight: 44,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonCompact: { minHeight: 36, paddingHorizontal: space.sm + 2 },
  buttonLabel: { ...noSelect, fontFamily: fonts.uiMedium, fontSize: 14, fontWeight: '700' },

  chip: {
    ...noSelect,
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  chipLabel: { ...noSelect, fontFamily: fonts.ui, fontSize: 13, fontWeight: '600' },
  chipCount: { ...noSelect, fontFamily: fonts.mono, fontSize: 10.5 },

  section: { marginTop: space.xl },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: space.md },
  sectionTitle: { ...noSelect, fontFamily: fonts.mono, fontSize: 11, letterSpacing: 1.6, fontWeight: '700' },
  rule: { flex: 1, height: 1 },

  field: { marginTop: space.md },
  fieldLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.3,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  input: {
    minHeight: 46,
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.md - 2,
    fontFamily: fonts.ui,
    fontSize: 15,
  },
  inputMultiline: { minHeight: 120, textAlignVertical: 'top' },

  hint: { fontFamily: fonts.ui, fontSize: 12, lineHeight: 18, marginTop: 6 },

  body: { fontFamily: fonts.mono },

  iconButton: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlyph: { ...noSelect, fontSize: 17, lineHeight: 21 },

  empty: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: radius.lg,
    padding: space.xl,
    alignItems: 'center',
    gap: space.sm,
  },
  emptyTitle: { fontFamily: fonts.uiMedium, fontSize: 17, fontWeight: '700' },
  emptyBody: { fontFamily: fonts.ui, fontSize: 13.5, lineHeight: 21, textAlign: 'center' },
});
