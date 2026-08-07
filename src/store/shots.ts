import { Directory, File, Paths } from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { Platform } from 'react-native';

/**
 * Result-image storage.
 *
 * The web prototype base64-encoded every screenshot into localStorage, which capped it
 * at roughly 60 images before the quota blew up. On device we downscale to a 640px
 * thumbnail and write a real JPEG into the app's document directory, keeping only the
 * file URI in the persisted state. That removes the cap and keeps the state blob small.
 */

const DIR_NAME = 'shots';
const MAX_EDGE = 640;
const QUALITY = 0.72;

function shotsDir(): Directory {
  const dir = new Directory(Paths.document, DIR_NAME);
  if (!dir.exists) dir.create({ intermediates: true });
  return dir;
}

/**
 * Downscales `sourceUri` and stores it as this prompt's result image.
 * Returns the URI to render, or a data URI on web where the filesystem is unavailable.
 */
export async function storeShot(promptId: string, sourceUri: string): Promise<string> {
  const context = ImageManipulator.ImageManipulator.manipulate(sourceUri).resize({ width: MAX_EDGE });
  const image = await context.renderAsync();
  const result = await image.saveAsync({
    compress: QUALITY,
    format: ImageManipulator.SaveFormat.JPEG,
    base64: Platform.OS === 'web',
  });

  if (Platform.OS === 'web') {
    return `data:image/jpeg;base64,${result.base64}`;
  }

  // Cache-bust the filename so <Image> does not show the previous thumbnail from memory.
  const target = new File(shotsDir(), `${promptId}-${Date.now()}.jpg`);
  await new File(result.uri).move(target);
  return target.uri;
}

/** Deletes the backing file, if there is one. Safe to call for a URI that is already gone. */
export function removeShot(uri: string | undefined) {
  if (!uri || Platform.OS === 'web' || uri.startsWith('data:')) return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // A missing file is the desired end state anyway.
  }
}

/**
 * Drops orphaned thumbnails — files whose prompt was deleted, or leftovers from a
 * replaced image. Runs once at startup so the directory cannot grow without bound.
 */
export function pruneShots(keep: Record<string, string>) {
  if (Platform.OS === 'web') return;
  try {
    const live = new Set(Object.values(keep));
    for (const entry of shotsDir().list()) {
      if (entry instanceof File && !live.has(entry.uri)) entry.delete();
    }
  } catch {
    // Pruning is housekeeping; never let it break startup.
  }
}
