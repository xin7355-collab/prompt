import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { CATEGORIES, PACKS, PROMPTS } from '../data/corpus';
import type {
  Character,
  Format,
  HistoryEntry,
  Lang,
  Pack,
  Prompt,
  ResolvedPrompt,
} from '../data/types';
import { emptyBench, type BenchState } from '../lib/compose';
import type { TextSize, ThemePreference } from '../ui/ThemeProvider';
import { pruneShots, removeShot } from './shots';

const STORAGE_KEY = 'spellbox.v1';
/** The web prototype's key, read once so an imported backup or a WebView user carries over. */
const LEGACY_KEY = 'promptvault.v2';

/** Everything that survives a restart. The bench is deliberately session-only. */
interface PersistedState {
  /** Seed prompt id -> user's edited version. */
  over: Record<string, Partial<Prompt>>;
  /** Seed prompt ids the user hid. */
  del: string[];
  mine: Prompt[];
  fav: string[];
  chars: Character[];
  packs: Pack[];
  /** Prompt id -> recent versions, newest first, capped per prompt. */
  hist: Record<string, HistoryEntry[]>;
  /** Prompt id -> result thumbnail URI. */
  shots: Record<string, string>;
  /**
   * Style id -> saved thumbnails, newest first. A style keeps several because the
   * wall is a visual index: seeing three results from one style tells you far more
   * about it than one does.
   */
  styleShots: Record<string, string[]>;
  /** Style ids the user starred. */
  styleFav: string[];
  /** The last thing typed into the style wall's subject field. */
  subject: string;
  /**
   * Which site 「生成」 hands off to, by name rather than index so reordering the
   * list cannot silently repoint it at something else.
   */
  sendTo: string;
  fmt: Format;
  lang: Lang;
  /** Appearance: follow the system, or pin light/dark. */
  theme: ThemePreference;
  /** Type size, applied on top of any OS-level accessibility scaling. */
  textSize: TextSize;
}

const initialPersisted: PersistedState = {
  over: {},
  del: [],
  mine: [],
  fav: [],
  chars: [],
  packs: [],
  hist: {},
  shots: {},
  styleShots: {},
  styleFav: [],
  subject: '',
  // Gemini by default: it is the one people already have open and already pay for
  // (or don't), and unlike the others it needs no key to produce an image.
  sendTo: 'Gemini',
  fmt: 'plain',
  lang: 'zh',
  theme: 'system',
  textSize: 'md',
};

const MAX_HISTORY_PER_PROMPT = 6;
const MAX_HISTORY_PROMPTS = 80;
/** Beyond this a style's gallery stops being a glance and starts being a scroll. */
const MAX_SHOTS_PER_STYLE = 8;

export interface PromptDraft {
  t: string;
  c: string;
  k: string;
  zh: string;
  en: string;
}

interface VaultValue extends PersistedState {
  ready: boolean;
  /** Seed + user prompts, overrides applied, hidden ones removed. */
  prompts: ResolvedPrompt[];
  /** Built-in packs plus the user's own. */
  allPacks: Pack[];

  bench: BenchState;
  setBench: React.Dispatch<React.SetStateAction<BenchState>>;
  loadIntoBench(prompt: Prompt): void;

  setLang(lang: Lang): void;
  setFormat(format: Format): void;
  setTheme(theme: ThemePreference): void;
  setTextSize(size: TextSize): void;
  toggleFavourite(id: string): void;

  savePrompt(draft: PromptDraft, editing: ResolvedPrompt | null): void;
  deletePrompt(prompt: ResolvedPrompt): void;
  revertPrompt(id: string): void;

  saveCharacter(draft: Omit<Character, 'id'>, editing: Character | null): string;
  deleteCharacter(id: string): void;

  savePack(draft: Omit<Pack, 'id'>, editing: Pack | null): void;
  deletePack(id: string): void;

  setShot(promptId: string, uri: string): void;
  clearShot(promptId: string): void;

  addStyleShot(styleId: string, uri: string): void;
  removeStyleShot(styleId: string, uri: string): void;
  toggleStyleFavourite(styleId: string): void;
  setSubject(subject: string): void;
  setSendTo(name: string): void;

  replaceAll(next: Partial<PersistedState>): void;
  resetToFactory(): void;
  exportPayload(): string;
}

const VaultContext = createContext<VaultValue | null>(null);

function newId(prefix: string) {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/**
 * Returns a copy of `source` without `key`.
 *
 * Written out rather than as `const { [key]: _drop, ...rest } = source`, which is
 * the obvious spelling and does not survive this project's production bundle: a tile
 * removed from state that way stayed in it, so a finished draw kept its spinner
 * forever. The explicit form is immune to however the transform decides to compile
 * a computed key, and reads no worse.
 */
function omit<T>(source: Record<string, T>, key: string): Record<string, T> {
  if (!(key in source)) return source;
  const next = { ...source };
  delete next[key];
  return next;
}

export function VaultProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PersistedState>(initialPersisted);
  const [ready, setReady] = useState(false);
  const [bench, setBench] = useState<BenchState>(emptyBench);

  // Load once. Writes are debounced below, so nothing is persisted before this resolves.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rawCurrent = await AsyncStorage.getItem(STORAGE_KEY);
        const raw = rawCurrent ?? (await AsyncStorage.getItem(LEGACY_KEY));
        if (raw && !cancelled) {
          const parsed = JSON.parse(raw) as Partial<PersistedState>;
          const merged = { ...initialPersisted, ...parsed };
          setState(merged);
          pruneShots([
            ...Object.values(merged.shots ?? {}),
            ...Object.values(merged.styleShots ?? {}).flat(),
          ]);
        }
      } catch {
        // A corrupt blob should not brick the app; fall back to factory state.
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const writeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!ready) return;
    if (writeTimer.current) clearTimeout(writeTimer.current);
    writeTimer.current = setTimeout(() => {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
    }, 300);
    return () => {
      if (writeTimer.current) clearTimeout(writeTimer.current);
    };
  }, [state, ready]);

  const prompts = useMemo<ResolvedPrompt[]>(() => {
    const hidden = new Set(state.del);
    const seed = PROMPTS.filter((p) => !hidden.has(p.i)).map((p) => ({
      ...p,
      ...(state.over[p.i] ?? {}),
      source: 'seed' as const,
      edited: Boolean(state.over[p.i]),
    }));
    const mine = state.mine.map((p) => ({ ...p, source: 'mine' as const, edited: false }));
    return [...mine, ...seed];
  }, [state.del, state.over, state.mine]);

  const allPacks = useMemo<Pack[]>(
    () => [...PACKS, ...state.packs.map((p) => ({ ...p, mine: true }))],
    [state.packs]
  );

  const patch = useCallback((fn: (prev: PersistedState) => PersistedState) => setState(fn), []);

  const loadIntoBench = useCallback((prompt: Prompt) => {
    setBench((prev) => ({ ...prev, base: prompt, vars: {} }));
  }, []);

  const setLang = useCallback((lang: Lang) => patch((p) => ({ ...p, lang })), [patch]);
  const setFormat = useCallback((fmt: Format) => patch((p) => ({ ...p, fmt })), [patch]);
  const setTheme = useCallback((theme: ThemePreference) => patch((p) => ({ ...p, theme })), [patch]);
  const setTextSize = useCallback((textSize: TextSize) => patch((p) => ({ ...p, textSize })), [patch]);

  const toggleFavourite = useCallback(
    (id: string) =>
      patch((p) => ({
        ...p,
        fav: p.fav.includes(id) ? p.fav.filter((x) => x !== id) : [...p.fav, id],
      })),
    [patch]
  );

  const savePrompt = useCallback(
    (draft: PromptDraft, editing: ResolvedPrompt | null) =>
      patch((p) => {
        const next = { ...p };

        if (editing) {
          const changed =
            editing.t !== draft.t || editing.zh !== draft.zh || editing.en !== draft.en;
          if (changed) {
            const entry: HistoryEntry = {
              t: editing.t,
              zh: editing.zh,
              en: editing.en,
              k: editing.k,
              at: Date.now(),
            };
            const hist = { ...next.hist };
            hist[editing.i] = [entry, ...(hist[editing.i] ?? [])].slice(0, MAX_HISTORY_PER_PROMPT);
            const keys = Object.keys(hist);
            // Bound total history so the persisted blob cannot creep upward forever.
            if (keys.length > MAX_HISTORY_PROMPTS) delete hist[keys[0]];
            next.hist = hist;
          }

          if (editing.source === 'seed') {
            next.over = { ...next.over, [editing.i]: draft };
          } else {
            next.mine = next.mine.map((x) => (x.i === editing.i ? { ...x, ...draft } : x));
          }
        } else {
          next.mine = [{ i: newId('u'), ...draft }, ...next.mine];
        }

        return next;
      }),
    [patch]
  );

  const deletePrompt = useCallback(
    (prompt: ResolvedPrompt) =>
      patch((p) => {
        const next = { ...p };
        if (prompt.source === 'mine') {
          next.mine = next.mine.filter((x) => x.i !== prompt.i);
        } else {
          next.del = [...next.del, prompt.i];
          next.over = omit(next.over, prompt.i);
        }
        removeShot(next.shots[prompt.i]);
        next.shots = omit(next.shots, prompt.i);
        next.fav = next.fav.filter((x) => x !== prompt.i);
        return next;
      }),
    [patch]
  );

  const revertPrompt = useCallback(
    (id: string) => patch((p) => ({ ...p, over: omit(p.over, id) })),
    [patch]
  );

  const saveCharacter = useCallback(
    (draft: Omit<Character, 'id'>, editing: Character | null) => {
      const id = editing?.id ?? newId('c');
      patch((p) => ({
        ...p,
        chars: editing
          ? p.chars.map((c) => (c.id === editing.id ? { ...c, ...draft } : c))
          : [...p.chars, { id, ...draft }],
      }));
      return id;
    },
    [patch]
  );

  const deleteCharacter = useCallback(
    (id: string) => {
      patch((p) => ({ ...p, chars: p.chars.filter((c) => c.id !== id) }));
      setBench((b) => (b.char === id ? { ...b, char: '' } : b));
    },
    [patch]
  );

  const savePack = useCallback(
    (draft: Omit<Pack, 'id'>, editing: Pack | null) =>
      patch((p) => ({
        ...p,
        packs: editing
          ? p.packs.map((k) => (k.id === editing.id ? { ...k, ...draft } : k))
          : [...p.packs, { id: newId('p'), ...draft }],
      })),
    [patch]
  );

  const deletePack = useCallback(
    (id: string) => patch((p) => ({ ...p, packs: p.packs.filter((k) => k.id !== id) })),
    [patch]
  );

  const setShot = useCallback(
    (promptId: string, uri: string) =>
      patch((p) => {
        removeShot(p.shots[promptId]);
        return { ...p, shots: { ...p.shots, [promptId]: uri } };
      }),
    [patch]
  );

  const clearShot = useCallback(
    (promptId: string) =>
      patch((p) => {
        removeShot(p.shots[promptId]);
        return { ...p, shots: omit(p.shots, promptId) };
      }),
    [patch]
  );

  const addStyleShot = useCallback(
    (styleId: string, uri: string) =>
      patch((p) => {
        const current = p.styleShots[styleId] ?? [];
        const next = [uri, ...current];
        // Oldest fall off the end; their bytes go with them.
        next.slice(MAX_SHOTS_PER_STYLE).forEach(removeShot);
        return {
          ...p,
          styleShots: { ...p.styleShots, [styleId]: next.slice(0, MAX_SHOTS_PER_STYLE) },
        };
      }),
    [patch]
  );

  const removeStyleShot = useCallback(
    (styleId: string, uri: string) =>
      patch((p) => {
        removeShot(uri);
        const next = (p.styleShots[styleId] ?? []).filter((x) => x !== uri);
        const styleShots = { ...p.styleShots };
        if (next.length) styleShots[styleId] = next;
        else delete styleShots[styleId];
        return { ...p, styleShots };
      }),
    [patch]
  );

  const toggleStyleFavourite = useCallback(
    (styleId: string) =>
      patch((p) => ({
        ...p,
        styleFav: p.styleFav.includes(styleId)
          ? p.styleFav.filter((x) => x !== styleId)
          : [...p.styleFav, styleId],
      })),
    [patch]
  );

  const setSubject = useCallback((subject: string) => patch((p) => ({ ...p, subject })), [patch]);

  const setSendTo = useCallback((sendTo: string) => patch((p) => ({ ...p, sendTo })), [patch]);

  const replaceAll = useCallback(
    (next: Partial<PersistedState>) =>
      patch((p) => ({
        ...initialPersisted,
        // Keep the device's own thumbnails and display preferences; a backup from
        // another device carries file URIs that do not resolve here.
        shots: p.shots,
        styleShots: p.styleShots,
        fmt: p.fmt,
        lang: p.lang,
        theme: p.theme,
        textSize: p.textSize,
        ...next,
      })),
    [patch]
  );

  const resetToFactory = useCallback(() => {
    patch((p) => {
      Object.values(p.shots).forEach(removeShot);
      Object.values(p.styleShots).flat().forEach(removeShot);
      return { ...initialPersisted, fmt: p.fmt, lang: p.lang, theme: p.theme, textSize: p.textSize };
    });
    setBench(emptyBench);
  }, [patch]);

  const exportPayload = useCallback(
    () =>
      JSON.stringify(
        {
          app: 'spellbox',
          v: 1,
          at: new Date().toISOString(),
          over: state.over,
          del: state.del,
          mine: state.mine,
          fav: state.fav,
          chars: state.chars,
          packs: state.packs,
          hist: state.hist,
          // Starred styles travel; the thumbnails behind them do not — their URIs
          // point at bytes that only exist on the device that saved them.
          styleFav: state.styleFav,
          subject: state.subject,
        },
        null,
        2
      ),
    [state]
  );

  const value: VaultValue = {
    ...state,
    ready,
    prompts,
    allPacks,
    bench,
    setBench,
    loadIntoBench,
    setLang,
    setFormat,
    setTheme,
    setTextSize,
    toggleFavourite,
    savePrompt,
    deletePrompt,
    revertPrompt,
    saveCharacter,
    deleteCharacter,
    savePack,
    deletePack,
    setShot,
    clearShot,
    addStyleShot,
    removeStyleShot,
    toggleStyleFavourite,
    setSubject,
    setSendTo,
    replaceAll,
    resetToFactory,
    exportPayload,
  };

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>;
}

export function useVault() {
  const ctx = useContext(VaultContext);
  if (!ctx) throw new Error('useVault must be used inside <VaultProvider>');
  return ctx;
}

/** Category list restricted to those that actually have prompts, with counts. */
export function useCategoryCounts(prompts: ResolvedPrompt[]) {
  return useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of prompts) counts.set(p.c, (counts.get(p.c) ?? 0) + 1);
    return CATEGORIES.filter((c) => counts.has(c.id)).map((c) => ({
      ...c,
      count: counts.get(c.id)!,
    }));
  }, [prompts]);
}
