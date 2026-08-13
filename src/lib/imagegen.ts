import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Image generation through Google's Imagen endpoint.
 *
 * Everywhere else the app hands a prompt off to a website and lets the user paste it.
 * That is still the fallback and still the default, because it needs no account and
 * no key. But handing off breaks the one thing 風格牆 is for: you cannot browse looks
 * by eye if seeing each one costs a round trip through another tab. With a key set,
 * 「生成」 draws in place and the result becomes the tile's cover.
 *
 * The key is the user's own, stored on this device only, and travels straight from
 * their browser to Google. There is no server in between — this app is a static site,
 * so there is nowhere for a key to be held even if we wanted to.
 */

const KEY_STORAGE = 'spellbox.geminikey';

/** The model the reference collection used, and the one these prompts are tuned for. */
export const IMAGE_MODEL = 'imagen-4.0-generate-001';

const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${IMAGE_MODEL}:predict`;

/**
 * Imagen accepts only these five. The app's ratio picker offers more (4:5, 2:3, 21:9
 * and so on), so anything it does not know is dropped rather than rejected — the
 * prompt still carries the ratio in words, which the model does partially respect.
 */
const SUPPORTED_RATIOS = new Set(['1:1', '3:4', '4:3', '9:16', '16:9']);

export async function getImageKey(): Promise<string> {
  try {
    return (await AsyncStorage.getItem(KEY_STORAGE)) ?? '';
  } catch {
    return '';
  }
}

export async function setImageKey(key: string) {
  const trimmed = key.trim();
  if (trimmed) await AsyncStorage.setItem(KEY_STORAGE, trimmed);
  else await AsyncStorage.removeItem(KEY_STORAGE);
}

export type GenerateResult =
  | { ok: true; dataUri: string }
  | { ok: false; message: string; needsKey?: boolean };

interface PredictResponse {
  predictions?: { bytesBase64Encoded?: string; raiFilteredReason?: string }[];
  error?: { message?: string; status?: string };
}

/**
 * Generates one image. Returns a data URI ready to hand to `storeShot`.
 *
 * Never throws: every failure comes back as a message the UI can show, because a
 * failed draw is a normal outcome here — quota, safety filters and unsupported
 * regions are all routine and each needs a different response from the user.
 */
export async function generateImage(prompt: string, ratio?: string): Promise<GenerateResult> {
  const key = await getImageKey();
  if (!key) {
    return {
      ok: false,
      needsKey: true,
      message: '還沒設定 Google API 金鑰。到「更多 → 生成圖片」貼上金鑰就能直接畫',
    };
  }
  if (!prompt.trim()) return { ok: false, message: '沒有可以生成的提示詞' };

  const parameters: Record<string, unknown> = {
    sampleCount: 1,
    // Almost every prompt in the poster collection has a model in it. Without this
    // the endpoint returns an empty prediction list rather than an error, which
    // looks like a bug and is really a policy default.
    personGeneration: 'allow_adult',
  };
  if (ratio && SUPPORTED_RATIOS.has(ratio)) parameters.aspectRatio = ratio;

  let response: Response;
  try {
    // The key goes in the query string rather than a header on purpose: that is the
    // form Google's own browser samples use, and it avoids a CORS preflight that the
    // endpoint does not always answer.
    response = await fetch(`${ENDPOINT}?key=${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instances: [{ prompt }], parameters }),
    });
  } catch {
    return { ok: false, message: '連不到 Google 的伺服器，檢查網路後再試一次' };
  }

  let data: PredictResponse;
  try {
    data = (await response.json()) as PredictResponse;
  } catch {
    return { ok: false, message: `伺服器回應無法解析（HTTP ${response.status}）` };
  }

  if (!response.ok) {
    const detail = data.error?.message ?? `HTTP ${response.status}`;
    if (response.status === 400 && /API key/i.test(detail)) {
      return { ok: false, needsKey: true, message: '金鑰無效，請到「更多」重新貼一次' };
    }
    if (response.status === 403) {
      return { ok: false, message: `沒有權限用這個模型：${detail}` };
    }
    if (response.status === 429) {
      return { ok: false, message: '已達 Google 的用量上限，等一下再試' };
    }
    return { ok: false, message: detail };
  }

  const prediction = data.predictions?.[0];
  if (!prediction?.bytesBase64Encoded) {
    // A filtered prompt comes back 200 with no image, sometimes with a reason.
    const reason = prediction?.raiFilteredReason;
    return {
      ok: false,
      message: reason
        ? `這則被 Google 的安全過濾擋掉了：${reason}`
        : '沒有生成出圖片，可能是提示詞被安全過濾擋掉了。換一則或改寫試試',
    };
  }

  return { ok: true, dataUri: `data:image/png;base64,${prediction.bytesBase64Encoded}` };
}
