import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BRAND } from '../brand';
import { saveImage } from '../lib/io';
import { resolveFull } from '../store/shots';
import { fonts, radius, space } from '../theme';
import { AppText as Text } from './AppText';
import { useTheme } from './ThemeProvider';
import { useToast } from './Toast';

/**
 * Full-screen look at one saved image.
 *
 * The wall and the gallery both render the 640px thumbnail, which is the right call
 * for a grid and the wrong one the moment you want to actually see what you made.
 * This resolves the original instead — and hands the same original to the download,
 * so what lands in the Downloads folder is the real picture, not the tile.
 */
export function ShotViewer({
  uri,
  title,
  onClose,
  onDelete,
}: {
  /** Thumbnail URI of the image to show. Null closes the viewer. */
  uri: string | null;
  /** Used to name the downloaded file. */
  title: string;
  onClose(): void;
  onDelete?(): void;
}) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const [full, setFull] = useState<string | null>(null);

  useEffect(() => {
    if (!uri) {
      setFull(null);
      return;
    }
    let cancelled = false;
    setFull(null);
    resolveFull(uri)
      .then((resolved) => {
        if (!cancelled) setFull(resolved);
      })
      .catch(() => {
        if (!cancelled) setFull(uri);
      });
    return () => {
      cancelled = true;
    };
  }, [uri]);

  const download = async () => {
    if (!full) return;
    try {
      // ASCII only: some Android file pickers and Windows choke on the Chinese name.
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
      await saveImage(full, `${BRAND.fileStem}-${stamp}.png`);
      toast('已下載完整圖片', 'success');
    } catch {
      toast('下載失敗，再試一次', 'error');
    }
  };

  return (
    <Modal visible={!!uri} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        {/* Tapping the surround closes, the way every photo viewer behaves.
            The explicit z-order matters: an absolutely positioned element paints
            above its non-positioned siblings whatever the source order, so without
            this the backdrop sits on top of the toolbar and eats every press. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="關閉"
          style={[StyleSheet.absoluteFill, styles.behind]}
          onPress={onClose}
        />

        <View style={[styles.bar, { paddingTop: insets.top + space.sm }]} pointerEvents="box-none">
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="關閉"
            hitSlop={12}
            onPress={onClose}
            style={styles.close}
          >
            <Text style={styles.closeGlyph}>✕</Text>
          </Pressable>
        </View>

        <View style={styles.stage} pointerEvents="none">
          {full ? (
            <Image source={{ uri: full }} style={styles.image} resizeMode="contain" />
          ) : (
            <ActivityIndicator color="#FFFFFF" />
          )}
        </View>

        <View
          style={[styles.actions, { paddingBottom: insets.bottom + space.lg }]}
          pointerEvents="box-none"
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="下載完整圖片"
            accessibilityState={{ disabled: !full }}
            disabled={!full}
            onPress={download}
            style={({ pressed }) => [
              styles.action,
              { backgroundColor: c.vermilion, opacity: full ? (pressed ? 0.8 : 1) : 0.5 },
            ]}
          >
            <Text style={[styles.actionLabel, { color: c.onAccent }]}>⬇ 下載完整圖片</Text>
          </Pressable>

          {onDelete && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="刪除這張"
              onPress={onDelete}
              style={({ pressed }) => [
                styles.action,
                styles.delete,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Text style={[styles.actionLabel, { color: '#FFFFFF' }]}>刪除</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

const noSelect = { userSelect: 'none' } as const;

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)' },
  behind: { zIndex: 0 },

  bar: {
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingBottom: space.sm,
  },
  title: {
    ...noSelect,
    flex: 1,
    fontFamily: fonts.uiMedium,
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  close: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeGlyph: { ...noSelect, fontSize: 16, color: '#FFFFFF' },

  stage: { zIndex: 1, flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.md },
  image: { width: '100%', height: '100%' },

  actions: {
    zIndex: 1,
    flexDirection: 'row',
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
  },
  action: {
    ...noSelect,
    flex: 1,
    minHeight: 46,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  delete: { flex: 0.5, backgroundColor: 'rgba(255,255,255,0.16)' },
  actionLabel: { ...noSelect, fontFamily: fonts.uiMedium, fontSize: 14, fontWeight: '700' },
});
