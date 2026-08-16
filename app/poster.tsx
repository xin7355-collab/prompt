import React, { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { useRouter } from 'expo-router';

import { openExternal } from '../src/lib/openExternal';
import { useVault } from '../src/store/vault';
import { useTheme } from '../src/ui/ThemeProvider';

/**
 * The poster wall, embedded as a same-origin iframe.
 *
 * A navigated-to page gets its own storage box inside an installed iOS PWA, so the
 * poster wall and the app couldn't share images that way. An iframe instead lives in
 * the parent's storage context — same origin, same IndexedDB — so images generated in
 * the poster wall land in the very pool the app reads. On the way out (the poster
 * wall's "← 咒語盒" posts a message, or this screen simply unmounts) we re-merge so
 * the new images show up on the app's walls immediately.
 */
export default function PosterScreen() {
  const router = useRouter();
  const vault = useVault();
  const { c } = useTheme();

  // Native has no iframe; open the page externally and pop back.
  useEffect(() => {
    if (Platform.OS !== 'web') {
      openExternal('poster.html');
      router.back();
    }
  }, [router]);

  // The embedded poster wall asks to close by postMessage; also re-merge on unmount.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onMessage = (event: MessageEvent) => {
      if (event.data === 'spellbox-poster-back') {
        vault.refreshShared();
        router.back();
      }
    };
    window.addEventListener('message', onMessage);
    return () => {
      window.removeEventListener('message', onMessage);
      vault.refreshShared();
    };
  }, [router, vault]);

  if (Platform.OS !== 'web') return <View style={{ flex: 1, backgroundColor: c.bg }} />;

  // Resolve against the document base so it works under the /<repo>/ project path.
  const src =
    typeof document !== 'undefined'
      ? new URL('poster.html', document.baseURI).href
      : 'poster.html';

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      {React.createElement('iframe', {
        src,
        title: '海報牆',
        allow: 'clipboard-read; clipboard-write',
        style: { border: 'none', width: '100%', height: '100%', display: 'block' },
      })}
    </View>
  );
}
