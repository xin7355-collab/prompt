import React, { useEffect, useState } from 'react';
import { Image, View, type ImageResizeMode, type StyleProp, type ImageStyle } from 'react-native';

import { resolveShot, SHOT_SCHEME } from '../store/shots';

/**
 * Renders a saved thumbnail.
 *
 * Web thumbnails live in IndexedDB behind a `sbshot:` URI, which <Image> cannot load,
 * so the bytes have to be resolved to an object URL first — an async step. Everything
 * else (file:// on native, data: from the legacy prototype) renders directly, and for
 * those the first paint is synchronous with no placeholder flash.
 */
export function ShotImage({
  uri,
  style,
  resizeMode = 'cover',
  fallback = null,
}: {
  uri: string;
  style?: StyleProp<ImageStyle>;
  resizeMode?: ImageResizeMode;
  /** Shown while resolving, and if the bytes have gone missing. */
  fallback?: React.ReactNode;
}) {
  const needsResolve = uri.startsWith(SHOT_SCHEME);
  const [src, setSrc] = useState<string | null>(needsResolve ? null : uri);

  useEffect(() => {
    if (!uri.startsWith(SHOT_SCHEME)) {
      setSrc(uri);
      return;
    }

    let cancelled = false;
    setSrc(null);
    resolveShot(uri)
      .then((resolved) => {
        if (!cancelled) setSrc(resolved);
      })
      .catch(() => {
        // Bytes are gone — the caller's fallback stands in rather than a broken image.
      });
    return () => {
      cancelled = true;
    };
  }, [uri]);

  if (!src) return <View style={style}>{fallback}</View>;
  return <Image source={{ uri: src }} style={style} resizeMode={resizeMode} />;
}
