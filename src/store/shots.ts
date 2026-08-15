import { Directory, File, Paths } from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { Platform } from 'react-native';

/**
 * Result-image storage.
 *
 * The original web prototype base64-encoded every screenshot into localStorage, which
 * capped it at roughly 60 images before the quota blew up. Both platforms now store a
 * downscaled JPEG outside the persisted state blob and keep only a URI in it:
 *
 *   native — a real file in the app's document directory, URI `file://…`
 *   web    — a Blob in IndexedDB, URI `sbshot:<key>`
 *
 * IndexedDB is the important half now that the wall can hold a thumbnail per style:
 * localStorage is a few megabytes of *string*, while IndexedDB stores binary and is
 * measured in hundreds. `sbshot:` URIs are not something <Image> understands, so they
 * are resolved to object URLs by `resolveShot` — see ui/ShotImage.
 */

const DIR_NAME = 'shots';
const MAX_EDGE = 640;
const QUALITY = 0.72;

/** Marks a URI whose bytes live in IndexedDB rather than in the URI itself. */
export const SHOT_SCHEME = 'sbshot:';

/**
 * Every save keeps two copies: the 640px thumbnail the wall renders, and the
 * original at whatever size it arrived. The thumbnail is what makes a wall of 233
 * tiles scroll smoothly; the original is what you actually want when you tap one
 * open or download it. The full copy is stored beside the thumbnail under this
 * suffix, and is best-effort — if it cannot be written the thumbnail still is.
 */
const FULL_SUFFIX = '-full';

const isWeb = Platform.OS === 'web';

// ─────────────────────────────────────────────────────────── web: IndexedDB

const DB_NAME = 'spellbox-shots';
const STORE = 'shots';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'));
  });
  // A rejected promise must not be cached, or one failure disables storage for the session.
  dbPromise.catch(() => {
    dbPromise = null;
  });
  return dbPromise;
}

function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const request = run(db.transaction(STORE, mode).objectStore(STORE));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
      })
  );
}

/** Object URLs, kept for the life of the page so the same thumbnail is decoded once. */
const objectUrls = new Map<string, string>();

/** Loads an <img> from any URI the browser can decode. */
function loadImage(uri: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('image decode failed'));
    image.src = uri;
  });
}

/** Downscales to a JPEG blob with canvas — no native module involved. */
async function downscaleWeb(sourceUri: string): Promise<Blob> {
  const image = await loadImage(sourceUri);
  const longest = Math.max(image.naturalWidth, image.naturalHeight) || MAX_EDGE;
  const scale = Math.min(1, MAX_EDGE / longest);
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('canvas unavailable');
  context.drawImage(image, 0, 0, width, height);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('encode failed'))),
      'image/jpeg',
      QUALITY
    );
  });
}

function blobToDataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('read failed'));
    reader.readAsDataURL(blob);
  });
}

// ─────────────────────────────────────────────────────────── native: files

function shotsDir(): Directory {
  const dir = new Directory(Paths.document, DIR_NAME);
  if (!dir.exists) dir.create({ intermediates: true });
  return dir;
}

// ─────────────────────────────────────────────────────────── public API

/**
 * Downscales `sourceUri` and stores it under `key` (a prompt id or a style id).
 * Returns the URI to persist. Falls back to an inline data URI only when IndexedDB
 * is unavailable — private-mode Safari, mainly — so saving never simply fails.
 */
export async function storeShot(key: string, sourceUri: string): Promise<string> {
  // Distinct per save so <Image> cannot serve the previous thumbnail from cache.
  const stamped = `${key}-${Date.now().toString(36)}`;

  if (isWeb) {
    const blob = await downscaleWeb(sourceUri);
    try {
      await tx('readwrite', (store) => store.put(blob, stamped));
      objectUrls.set(stamped, URL.createObjectURL(blob));
    } catch {
      // No IndexedDB at all (private-mode Safari). Inline the thumbnail so saving
      // still works; there is nowhere to put a full copy in that case.
      return blobToDataUri(blob);
    }

    try {
      // fetch() reads both the data: URIs generation returns and the blob: URIs the
      // file picker hands over, so the original goes in whatever form it arrived.
      const original = await (await fetch(sourceUri)).blob();
      await tx('readwrite', (store) => store.put(original, stamped + FULL_SUFFIX));
    } catch {
      // Quota, or a source we cannot re-read. The thumbnail is already saved and the
      // viewer falls back to it, so this is a downgrade rather than a failure.
    }

    return SHOT_SCHEME + stamped;
  }

  const context = ImageManipulator.ImageManipulator.manipulate(sourceUri).resize({ width: MAX_EDGE });
  const image = await context.renderAsync();
  const result = await image.saveAsync({
    compress: QUALITY,
    format: ImageManipulator.SaveFormat.JPEG,
  });

  const target = new File(shotsDir(), `${stamped}.jpg`);
  await new File(result.uri).move(target);

  try {
    const fullContext = ImageManipulator.ImageManipulator.manipulate(sourceUri);
    const fullImage = await fullContext.renderAsync();
    const full = await fullImage.saveAsync({ compress: 1, format: ImageManipulator.SaveFormat.PNG });
    await new File(full.uri).move(new File(shotsDir(), `${stamped}${FULL_SUFFIX}.png`));
  } catch {
    // Same downgrade as on web: the thumbnail stands in.
  }

  return target.uri;
}

// ───────────────────────────────────────── shared pool (web, cross-surface)
//
// The poster wall (poster.html) and the app run on the same origin, so a single
// IndexedDB store lets them show the same batch of images. It is keyed by the item
// id (a prompt id or a style id) and holds the full-resolution blob. Web only — the
// poster wall has no native counterpart to share with.

const SHARED_DB = 'spellbox-shared';
/** URI for an image whose bytes live in the shared pool, keyed by the item id. */
export const SHARED_SCHEME = 'sbshared:';

let sharedDbPromise: Promise<IDBDatabase> | null = null;

function openSharedDb(): Promise<IDBDatabase> {
  if (sharedDbPromise) return sharedDbPromise;
  sharedDbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const request = indexedDB.open(SHARED_DB, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('shared IndexedDB open failed'));
  });
  sharedDbPromise.catch(() => {
    sharedDbPromise = null;
  });
  return sharedDbPromise;
}

function sharedTx<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return openSharedDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const request = run(db.transaction(STORE, mode).objectStore(STORE));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error('shared IndexedDB request failed'));
      })
  );
}

/**
 * Copies the full image behind `sourceUri` into the shared pool under `id`, so the
 * other surface shows it too. Best-effort and web-only; a failure never blocks a draw.
 */
export async function shareImage(id: string, sourceUri: string): Promise<void> {
  if (!isWeb) return;
  try {
    const blob = await (await fetch(sourceUri)).blob();
    await sharedTx('readwrite', (store) => store.put(blob, id));
  } catch {
    // Quota, or a source we cannot re-read. Sharing is a bonus, not a requirement.
  }
}

/** Ids that currently have a shared image (empty off-web or when the pool is missing). */
export async function sharedKeys(): Promise<string[]> {
  if (!isWeb) return [];
  try {
    const keys = await sharedTx<IDBValidKey[]>('readonly', (store) => store.getAllKeys());
    return keys.filter((k): k is string => typeof k === 'string');
  } catch {
    return [];
  }
}

/**
 * Turns a stored URI into something <Image> can render. `sbshared:` resolves from the
 * shared pool, `sbshot:` from the app's own store; file and data URIs pass straight
 * through.
 */
export async function resolveShot(uri: string): Promise<string> {
  if (uri.startsWith(SHARED_SCHEME)) {
    const id = uri.slice(SHARED_SCHEME.length);
    const cacheKey = SHARED_SCHEME + id;
    const cached = objectUrls.get(cacheKey);
    if (cached) return cached;
    const blob = await sharedTx<Blob | undefined>('readonly', (store) => store.get(id));
    if (!blob) throw new Error('shared image missing');
    const url = URL.createObjectURL(blob);
    objectUrls.set(cacheKey, url);
    return url;
  }

  if (!uri.startsWith(SHOT_SCHEME)) return uri;
  const key = uri.slice(SHOT_SCHEME.length);

  const cached = objectUrls.get(key);
  if (cached) return cached;

  const blob = await tx<Blob | undefined>('readonly', (store) => store.get(key));
  if (!blob) throw new Error('thumbnail missing');

  const url = URL.createObjectURL(blob);
  objectUrls.set(key, url);
  return url;
}

/**
 * Resolves the *original* behind a thumbnail URI, for the viewer and for downloads.
 * Falls back to the thumbnail when there is no full copy — saves made before this
 * existed, and any save where storing the original was refused.
 */
export async function resolveFull(uri: string): Promise<string> {
  // The shared pool already holds the full-resolution image, no separate copy.
  if (uri.startsWith(SHARED_SCHEME)) return resolveShot(uri);

  if (uri.startsWith(SHOT_SCHEME)) {
    const key = uri.slice(SHOT_SCHEME.length) + FULL_SUFFIX;
    const cached = objectUrls.get(key);
    if (cached) return cached;
    try {
      const blob = await tx<Blob | undefined>('readonly', (store) => store.get(key));
      if (blob) {
        const url = URL.createObjectURL(blob);
        objectUrls.set(key, url);
        return url;
      }
    } catch {
      // Fall through to the thumbnail.
    }
    return resolveShot(uri);
  }

  if (!isWeb && uri.startsWith('file:')) {
    const full = uri.replace(/\.jpg$/, `${FULL_SUFFIX}.png`);
    try {
      if (new File(full).exists) return full;
    } catch {
      // Fall through to the thumbnail.
    }
  }

  return uri;
}

/** Deletes the backing bytes, if there are any. Safe for a URI that is already gone. */
export function removeShot(uri: string | undefined) {
  if (!uri || uri.startsWith('data:')) return;

  if (uri.startsWith(SHARED_SCHEME)) {
    const id = uri.slice(SHARED_SCHEME.length);
    const cacheKey = SHARED_SCHEME + id;
    const url = objectUrls.get(cacheKey);
    if (url) {
      URL.revokeObjectURL(url);
      objectUrls.delete(cacheKey);
    }
    sharedTx('readwrite', (store) => store.delete(id)).catch(() => {});
    return;
  }

  if (uri.startsWith(SHOT_SCHEME)) {
    const key = uri.slice(SHOT_SCHEME.length);
    for (const variant of [key, key + FULL_SUFFIX]) {
      const url = objectUrls.get(variant);
      if (url) {
        URL.revokeObjectURL(url);
        objectUrls.delete(variant);
      }
      tx('readwrite', (store) => store.delete(variant)).catch(() => {});
    }
    return;
  }

  if (isWeb) return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
    const full = new File(uri.replace(/\.jpg$/, `${FULL_SUFFIX}.png`));
    if (full.exists) full.delete();
  } catch {
    // A missing file is the desired end state anyway.
  }
}

/**
 * Drops orphaned thumbnails — bytes whose prompt or style was deleted, and leftovers
 * from a replaced image. Runs once at startup so storage cannot grow without bound.
 */
export function pruneShots(live: Iterable<string>) {
  const keep = new Set(live);

  if (isWeb) {
    const keepKeys = new Set<string>();
    for (const uri of keep) {
      if (!uri.startsWith(SHOT_SCHEME)) continue;
      const key = uri.slice(SHOT_SCHEME.length);
      // The full copy is keyed off the thumbnail rather than referenced by state,
      // so it has to be spared explicitly or every original is pruned on startup.
      keepKeys.add(key);
      keepKeys.add(key + FULL_SUFFIX);
    }
    tx<IDBValidKey[]>('readonly', (store) => store.getAllKeys())
      .then((keys) => {
        for (const key of keys) {
          if (typeof key === 'string' && !keepKeys.has(key)) {
            tx('readwrite', (store) => store.delete(key)).catch(() => {});
          }
        }
      })
      .catch(() => {});
    return;
  }

  try {
    const keepFiles = new Set<string>();
    for (const uri of keep) {
      keepFiles.add(uri);
      keepFiles.add(uri.replace(/\.jpg$/, `${FULL_SUFFIX}.png`));
    }
    for (const entry of shotsDir().list()) {
      if (entry instanceof File && !keepFiles.has(entry.uri)) entry.delete();
    }
  } catch {
    // Pruning is housekeeping; never let it break startup.
  }
}
