import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

/**
 * Opens the photo library and returns the chosen image URI, or null if the user
 * cancelled or declined permission.
 */
export async function pickImage(): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 1,
    allowsMultipleSelection: false,
  });
  if (result.canceled || !result.assets.length) return null;
  return result.assets[0].uri;
}

/**
 * Writes `text` to a temporary file and hands it to the system share sheet — the
 * cross-platform equivalent of the web build's download link. On web, falls back to
 * an anchor download since there is no share sheet.
 */
export async function shareText(text: string, filename: string) {
  if (Platform.OS === 'web') {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return;
  }

  const file = new File(Paths.cache, filename);
  if (file.exists) file.delete();
  file.create();
  file.write(text);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: filename.endsWith('.json') ? 'application/json' : 'text/plain',
      dialogTitle: filename,
      UTI: filename.endsWith('.json') ? 'public.json' : 'public.plain-text',
    });
  }
}

/** Opens a file picker for a JSON backup and returns its contents, or null if cancelled. */
export async function readJsonFile(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
  });
  if (result.canceled || !result.assets.length) return null;
  return new File(result.assets[0].uri).text();
}
