import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { VaultProvider } from '../src/store/vault';
import { ThemeProvider, useTheme } from '../src/ui/ThemeProvider';
import { ToastProvider } from '../src/ui/Toast';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        {/* Vault first: the theme preference is part of persisted state. */}
        <VaultProvider>
          <ThemeProvider>
            <ToastProvider>
              <Navigation />
            </ToastProvider>
          </ThemeProvider>
        </VaultProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function Navigation() {
  const { c, dark } = useTheme();

  return (
    <>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: c.bg },
          headerTintColor: c.text,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: c.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="edit" options={{ presentation: 'modal', title: '提示詞' }} />
        <Stack.Screen name="character" options={{ presentation: 'modal', title: '角色設定' }} />
        <Stack.Screen name="pack" options={{ presentation: 'modal', title: '組合包' }} />
        <Stack.Screen name="reverse" options={{ presentation: 'modal', title: '從照片反推' }} />
        <Stack.Screen name="guide" options={{ title: '心法筆記' }} />
      </Stack>
    </>
  );
}
