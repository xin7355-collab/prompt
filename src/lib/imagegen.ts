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
const MODEL_STORAGE = 'spellbox.geminimodel';

/**
 * Default model. A free-tier Gemini image model, so a brand-new key draws something
 * rather than hitting Imagen's billing wall on the first press. Imagen stays available
 * by typing its name — the request shape is chosen from the name, see below.
 *
 * Default is gemini-2.5-flash-image: the current GA native image model, best quality
 * and broadly available on new free keys. The older gemini-2.0-flash-preview-image-
 * generation is retired on some newer accounts (404); users there can switch in
 * settings, and the poster wall's "偵測可用模型" lists what a key can actually reach.
 */
export const IMAGE_MODEL = 'gemini-2.5-flash-image';

const BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

export async function getImageModel(): Promise<string> {
  try {
    return (await AsyncStorage.getItem(MODEL_STORAGE)) || IMAGE_MODEL;
  } catch {
    return IMAGE_MODEL;
  }
}

export async function setImageModel(model: string) {
  const trimmed = model.trim();
  if (trimmed && trimmed !== IMAGE_MODEL) await AsyncStorage.setItem(MODEL_STORAGE, trimmed);
  else await AsyncStorage.removeItem(MODEL_STORAGE);
}

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

interface ApiResponse {
  /** imagen-* models, via :predict */
  predictions?: { bytesBase64Encoded?: string; raiFilteredReason?: string }[];
  /** gemini-* image models, via :generateContent */
  candidates?: {
    content?: { parts?: { inlineData?: { mimeType?: string; data?: string } }[] };
    finishReason?: string;
  }[];
  promptFeedback?: { blockReason?: string };
  error?: {
    message?: string;
    status?: string;
    /** RetryInfo carries retryDelay; QuotaFailure carries violations[].quotaId. */
    details?: {
      retryDelay?: string;
      violations?: { quotaId?: string; quotaMetric?: string }[];
    }[];
  };
}

/** "51s" / "1m3s" -> a 中文 span like "51 秒" or "1 分 3 秒" (empty if unparseable). */
function humanDelay(raw: string): string {
  let s = 0;
  const min = /(\d+)m/.exec(raw);
  if (min) s += parseInt(min[1], 10) * 60;
  const sec = /([\d.]+)s/.exec(raw);
  if (sec) s += Math.round(parseFloat(sec[1]));
  if (!s) return '';
  if (s < 60) return `${s} 秒`;
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return secs ? `${mins} 分 ${secs} 秒` : `${mins} 分鐘`;
}

/**
 * A 429 means the quota is spent. Say which limit and when it lifts, taking the
 * numbers from Google's own error details rather than guessing: a daily free quota
 * resets at Pacific midnight (~15–16:00 台灣時間); a per-minute limit lifts in seconds.
 */
function quotaMessage(data: ApiResponse): string {
  let delay = '';
  let quotaId = '';
  for (const d of data.error?.details ?? []) {
    if (d.retryDelay) delay = humanDelay(d.retryDelay);
    const v = d.violations?.[0];
    if (v?.quotaId || v?.quotaMetric) quotaId = v.quotaId || v.quotaMetric || '';
  }
  if (/per\s*day|PerDay/i.test(quotaId)) {
    return '今天的免費額度用完了。免費層每天重置一次（重置點是太平洋時間午夜，約台灣下午 3～4 點）。想立刻解除可在 Google Cloud 綁信用卡改用付費層，否則等重置後再生成';
  }
  if (/per\s*minute|PerMinute/i.test(quotaId)) {
    return `每分鐘的免費次數到了${delay ? `，約 ${delay}後恢復` : ''}，稍等再試一次`;
  }
  return `已達 Google 免費用量上限${delay ? `，Google 建議約 ${delay}後再試` : '，等一下再試'}`;
}

/** Pulls the image out of whichever response shape came back. */
function imageFrom(data: ApiResponse): { dataUri: string } | { reason?: string } {
  const prediction = data.predictions?.[0];
  if (prediction?.bytesBase64Encoded) {
    return { dataUri: `data:image/png;base64,${prediction.bytesBase64Encoded}` };
  }

  for (const part of data.candidates?.[0]?.content?.parts ?? []) {
    if (part.inlineData?.data) {
      return {
        dataUri: `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`,
      };
    }
  }

  return {
    reason:
      prediction?.raiFilteredReason ??
      data.promptFeedback?.blockReason ??
      data.candidates?.[0]?.finishReason,
  };
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

  const model = await getImageModel();

  /**
   * The two families speak different protocols. Imagen answers `:predict` with
   * `instances`/`parameters`; the Gemini image models answer `:generateContent` and
   * return the bytes as an inline part. The model name decides which, so switching
   * model in settings is enough — no second setting for "which kind".
   */
  const isImagen = model.startsWith('imagen');
  const method = isImagen ? 'predict' : 'generateContent';

  let body: unknown;
  if (isImagen) {
    const parameters: Record<string, unknown> = {
      sampleCount: 1,
      // Almost every prompt in the poster collection has a model in it. Without this
      // the endpoint returns an empty prediction list rather than an error, which
      // looks like a bug and is really a policy default.
      personGeneration: 'allow_adult',
    };
    if (ratio && SUPPORTED_RATIOS.has(ratio)) parameters.aspectRatio = ratio;
    body = { instances: [{ prompt }], parameters };
  } else {
    // These take no aspect-ratio parameter; composeStyle has already written the
    // ratio into the prompt in words, which is the only lever available here.
    body = {
      contents: [{ parts: [{ text: prompt }] }],
      // Both modalities: gemini-2.0-flash-preview-image-generation rejects an
      // IMAGE-only request; 2.5 accepts both. Only the image part is kept from the reply.
      generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
    };
  }

  let response: Response;
  try {
    // The key goes in the query string rather than a header on purpose: that is the
    // form Google's own browser samples use, and it avoids a CORS preflight that the
    // endpoint does not always answer.
    response = await fetch(
      `${BASE}/${encodeURIComponent(model)}:${method}?key=${encodeURIComponent(key)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );
  } catch {
    return { ok: false, message: '連不到 Google 的伺服器，檢查網路後再試一次' };
  }

  let data: ApiResponse;
  try {
    data = (await response.json()) as ApiResponse;
  } catch {
    return { ok: false, message: `伺服器回應無法解析（HTTP ${response.status}）` };
  }

  if (!response.ok) {
    const detail = data.error?.message ?? `HTTP ${response.status}`;

    if (response.status === 400 && /API key/i.test(detail)) {
      return { ok: false, needsKey: true, message: '金鑰無效，請到「更多」重新貼一次' };
    }
    // The one people actually hit: Imagen is not on Google's free tier, so a brand
    // new key gets refused until billing is switched on. Say that, rather than
    // echoing an English sentence about billed users.
    if (/billed|billing|paid tier|quota project/i.test(detail)) {
      return {
        ok: false,
        message: `不用開信用卡！${model} 是 imagen 付費模型才要綁卡。到「更多 → 生成圖片」把模型改成免費的 ${IMAGE_MODEL} 就好`,
      };
    }
    if (response.status === 404) {
      return {
        ok: false,
        message: `你的金鑰用不了模型 ${model}（此帳號或地區未開放）。到「更多 → 生成圖片」改用 ${IMAGE_MODEL} 試試`,
      };
    }
    if (response.status === 403) {
      return { ok: false, message: `沒有權限用 ${model}：${detail}` };
    }
    if (response.status === 429) {
      return { ok: false, message: quotaMessage(data) };
    }
    return { ok: false, message: detail };
  }

  const found = imageFrom(data);
  if ('dataUri' in found) return { ok: true, dataUri: found.dataUri };

  // A filtered prompt comes back 200 with no image, sometimes with a reason.
  return {
    ok: false,
    message: found.reason
      ? `沒有生成出圖片，Google 給的原因是 ${found.reason}。換一則或改寫試試`
      : '沒有生成出圖片，可能是提示詞被安全過濾擋掉了。換一則或改寫試試',
  };
}
