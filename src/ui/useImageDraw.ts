import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import * as Clipboard from 'expo-clipboard';

import { SITES } from '../data/corpus';
import { generateImage, getImageKey } from '../lib/imagegen';
import { openExternal } from '../lib/openExternal';
import { storeShot } from '../store/shots';
import { useVault } from '../store/vault';
import { useToast } from './Toast';

/**
 * One 「生成」 button, two ways of honouring it.
 *
 * Without a key the prompt is copied and the chosen site opened — the free path,
 * which runs on the account the user already has. It costs one paste, and that paste
 * is unavoidable: no page can drive gemini.google.com on someone's behalf, because
 * the consumer app has no API and the browser forbids reaching across origins.
 *
 * With a key the image is generated in place and handed back through `onImage` for
 * the caller to file where it belongs — a style's cover on the wall, a prompt's
 * result shot in the library.
 *
 * Shared so both screens cannot drift apart: the library and the wall are the same
 * gesture on different nouns.
 */
export function useImageDraw() {
  const vault = useVault();
  const toast = useToast();

  /** Ids currently generating. Several can run at once. */
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  /** Whether a key is set, so a button can say what it will do before it is pressed. */
  const [canDraw, setCanDraw] = useState(false);

  // Re-read on focus; the key is set on another screen and the labels must catch up.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      getImageKey().then((key) => {
        if (!cancelled) setCanDraw(Boolean(key));
      });
      return () => {
        cancelled = true;
      };
    }, [])
  );

  const site = SITES.find((s) => s.n === vault.sendTo) ?? SITES[0];

  /** Copies the prompt and opens the chosen site. Must run inside the press handler. */
  const handOff = useCallback(
    (text: string) => {
      const url = site.q ? site.u + encodeURIComponent(text) : site.u;

      // Open first, copy second: on web an await here would end the tap's user
      // activation and the browser would silently refuse the new tab.
      const result = openExternal(url);
      Clipboard.setStringAsync(text).catch(() => {});

      if (result === 'blocked') {
        toast(`瀏覽器擋掉了新分頁。提示詞已複製，請自己開 ${site.n} 貼上`, 'error');
      } else {
        toast(`已複製，在 ${site.n} 貼上即可生成`);
      }
    },
    [site, toast]
  );

  const draw = useCallback(
    async ({
      id,
      text,
      label,
      onImage,
    }: {
      /** Distinguishes concurrent draws; also the key the image is stored under. */
      id: string;
      text: string;
      /** Shown in the success toast. */
      label: string;
      onImage(storedUri: string): void;
    }) => {
      if (!canDraw) {
        handOff(text);
        return;
      }

      setBusy((prev) => ({ ...prev, [id]: true }));
      try {
        const result = await generateImage(text);
        if (!result.ok) {
          if (result.needsKey) {
            setCanDraw(false);
            handOff(text);
          }
          toast(result.message, 'error');
          return;
        }
        onImage(await storeShot(id, result.dataUri));
        toast(`「${label}」畫好了`, 'success');
      } catch {
        toast('存不下這張圖，再試一次', 'error');
      } finally {
        setBusy((prev) => {
          // Not `const { [id]: _drop, ...rest }` — see the note on `omit` in vault.tsx.
          if (!prev[id]) return prev;
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }
    },
    [canDraw, handOff, toast]
  );

  return {
    busy,
    canDraw,
    site,
    draw,
    handOff,
    /** What pressing 生成 will do, for labels and hints. */
    hint: canDraw ? '直接生成圖片' : `複製並開啟 ${site.n}`,
  };
}
