import { useCallback, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import * as Clipboard from 'expo-clipboard';

import { SITES } from '../data/corpus';
import { generateImage, getImageKey, getImageModel } from '../lib/imagegen';
import { openExternal } from '../lib/openExternal';
import { shareImage, storeShot } from '../store/shots';
import { useVault } from '../store/vault';
import { useToast } from './Toast';

/** One thing to draw: an id to file it under, the prompt, and where the image lands. */
interface Job {
  /** Distinguishes draws; also the key the image is stored under. */
  id: string;
  text: string;
  /** Shown in the success toast. */
  label: string;
  onImage(storedUri: string): void;
}

/** Where a given id is in the pipeline, for the tile that owns it. */
type Status = 'queued' | 'active';

/**
 * One 「生成」 button, two ways of honouring it.
 *
 * Without a key the prompt is copied and the chosen site opened — the free path,
 * which runs on the account the user already has. It costs one paste, and that paste
 * is unavoidable: no page can drive gemini.google.com on someone's behalf, because
 * the consumer app has no API and the browser forbids reaching across origins.
 *
 * With a key (or the free Pollinations model) the image is generated in place and
 * handed back through `onImage` for the caller to file where it belongs — a style's
 * cover on the wall, a prompt's result shot in the library.
 *
 * Draws run one at a time, not all at once. Tap a second tile while the first is
 * still drawing and it waits its turn — the same queue the poster wall uses. Free
 * image endpoints rate-limit hard; firing ten requests in parallel earns ten 429s,
 * where feeding them in one at a time earns ten pictures. The tile shows 排隊中 while
 * it waits and 生成中 once it is its turn.
 *
 * Shared so both screens cannot drift apart: the library and the wall are the same
 * gesture on different nouns.
 */
export function useImageDraw() {
  const vault = useVault();
  const toast = useToast();

  /** Per-id pipeline state, for the tiles to render 排隊中 / 生成中. */
  const [status, setStatus] = useState<Record<string, Status>>({});
  /** Whether a key is set, so a button can say what it will do before it is pressed. */
  const [canDraw, setCanDraw] = useState(false);

  // The queue lives in refs, not state: it must survive re-renders and be read and
  // mutated synchronously by the drain loop without waiting for React to catch up.
  const queueRef = useRef<Job[]>([]);
  const drainingRef = useRef(false);

  // Re-read on focus; the key/model are set on another screen and the labels must
  // catch up. The free Pollinations model needs no key, so it draws in place too.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      Promise.all([getImageKey(), getImageModel()]).then(([key, model]) => {
        if (!cancelled) setCanDraw(Boolean(key) || model === 'pollinations');
      });
      return () => {
        cancelled = true;
      };
    }, [])
  );

  const site = SITES.find((s) => s.n === vault.sendTo) ?? SITES[0];

  const dropStatus = useCallback((id: string) => {
    setStatus((prev) => {
      if (!(id in prev)) return prev;
      // Not `const { [id]: _drop, ...rest }` — see the note on `omit` in vault.tsx.
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

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

  // Drains the queue one job at a time. A single loop owns the running flag, so no
  // matter how many taps land, only one generation is ever in flight.
  const drain = useCallback(async () => {
    if (drainingRef.current) return;
    drainingRef.current = true;
    try {
      while (queueRef.current.length) {
        const job = queueRef.current[0];
        setStatus((prev) => ({ ...prev, [job.id]: 'active' }));
        try {
          const result = await generateImage(job.text);
          if (!result.ok) {
            if (result.needsKey) {
              // The key stopped working. Abandon the rest of the queue rather than
              // fail each one in turn, and fall back to the free copy-and-open path.
              setCanDraw(false);
              const abandoned = queueRef.current.slice(1);
              queueRef.current = [];
              handOff(job.text);
              for (const j of abandoned) dropStatus(j.id);
              dropStatus(job.id);
              break;
            }
            toast(result.message, 'error');
          } else {
            job.onImage(await storeShot(job.id, result.dataUri));
            // Also drop the full image into the shared pool so the poster wall shows it.
            shareImage(job.id, result.dataUri);
            toast(`「${job.label}」畫好了`, 'success');
          }
        } catch {
          toast('存不下這張圖，再試一次', 'error');
        } finally {
          // Only the head job was processed; remove it and clear its badge.
          if (queueRef.current[0] === job) queueRef.current.shift();
          dropStatus(job.id);
        }
      }
    } finally {
      drainingRef.current = false;
    }
  }, [dropStatus, handOff, toast]);

  const draw = useCallback(
    (job: Job) => {
      if (!canDraw) {
        handOff(job.text);
        return;
      }
      // Ignore a repeat tap on something already queued or drawing: the head job
      // stays in the queue while it runs, so this one check covers both states.
      if (queueRef.current.some((j) => j.id === job.id)) return;

      queueRef.current.push(job);
      setStatus((prev) => ({ ...prev, [job.id]: 'queued' }));
      void drain();
    },
    [canDraw, handOff, drain]
  );

  // Boolean views of the pipeline state for the tiles. `busy` is truthy while a tile
  // is either waiting or drawing (disables its button, shows the overlay); `queued`
  // is truthy only while it waits, so the label can read 排隊中 instead of 生成中.
  const busy = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const id in status) map[id] = true;
    return map;
  }, [status]);
  const queued = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const id in status) if (status[id] === 'queued') map[id] = true;
    return map;
  }, [status]);

  return {
    busy,
    queued,
    canDraw,
    site,
    draw,
    handOff,
    /** What pressing 生成 will do, for labels and hints. */
    hint: canDraw ? '直接生成圖片' : `複製並開啟 ${site.n}`,
  };
}
