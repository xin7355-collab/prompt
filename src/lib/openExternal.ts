import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

export type OpenResult = 'opened' | 'blocked';

/**
 * Opens an external URL.
 *
 * On web this MUST be called synchronously from the press handler, before any `await`.
 * Browsers only allow a new tab while the user activation from the tap is still on the
 * stack; a single `await` beforehand — even one that resolves immediately, like writing
 * to the clipboard — ends that window and the popup is silently blocked. That is why
 * the caller copies the prompt *after* calling this, not before.
 *
 * Returns 'blocked' when the browser refused, so the caller can tell the user instead
 * of leaving them tapping a button that appears to do nothing.
 */
export function openExternal(url: string): OpenResult {
  if (Platform.OS !== 'web') {
    // Native has no popup blocker; the in-app browser opens on its own schedule.
    WebBrowser.openBrowserAsync(url).catch(() => {});
    return 'opened';
  }

  let opened: Window | null = null;
  try {
    // Deliberately no 'noopener' in the feature string: per spec that makes window.open
    // return null even when it succeeded, which would make every open look blocked.
    // The opener reference is severed below instead, which has the same effect.
    opened = window.open(url, '_blank');
  } catch {
    opened = null;
  }
  if (opened) {
    try {
      opened.opener = null;
    } catch {
      // Cross-origin already; nothing to sever.
    }
    return 'opened';
  }

  // Some embedded contexts refuse window.open but still honour a real anchor click.
  // Worth trying before giving up, and harmless when it is also refused.
  try {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  } catch {
    // Nothing further to try.
  }
  return 'blocked';
}
