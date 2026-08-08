import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { fonts, radius, space } from '../theme';
import { useTheme } from './ThemeProvider';
import { AppText as Text } from './AppText';

type ToastKind = 'info' | 'success' | 'error';

const ToastContext = createContext<(message: string, kind?: ToastKind) => void>(() => {});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState('');
  const [kind, setKind] = useState<ToastKind>('info');
  const opacity = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(12)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (text: string, nextKind: ToastKind = 'info') => {
      setMessage(text);
      setKind(nextKind);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(
          nextKind === 'error'
            ? Haptics.NotificationFeedbackType.Warning
            : Haptics.NotificationFeedbackType.Success
        ).catch(() => {});
      }
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: true }),
        Animated.spring(lift, { toValue: 0, useNativeDriver: true, damping: 18 }),
      ]).start();

      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
          Animated.timing(lift, { toValue: 12, duration: 200, useNativeDriver: true }),
        ]).start();
      }, 2400);
    },
    [opacity, lift]
  );

  useEffect(() => () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
  }, []);

  const border = kind === 'error' ? c.danger : kind === 'success' ? c.success : c.gold;

  return (
    <ToastContext.Provider value={show}>
      {children}
      <Animated.View
        pointerEvents="none"
        accessibilityLiveRegion="polite"
        style={[
          styles.toast,
          {
            bottom: insets.bottom + 92,
            backgroundColor: c.chrome,
            borderColor: border,
            opacity,
            transform: [{ translateY: lift }],
          },
        ]}
      >
        <Text style={[styles.text, { color: c.onChrome }]}>{message}</Text>
      </Animated.View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    maxWidth: '88%',
    paddingHorizontal: space.lg,
    paddingVertical: space.md - 2,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  text: {
    fontFamily: fonts.ui,
    fontSize: 13.5,
    fontWeight: '600',
    textAlign: 'center',
  },
});
