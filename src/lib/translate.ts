import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';

/**
 * Translation and image analysis.
 *
 * The web prototype POSTed to api.anthropic.com with no credentials, which only
 * resolved inside the sandbox it was authored in — a shipped app would get a 401.
 * Here the key is supplied by the user and kept on-device, and every path has a
 * working manual fallback: we copy a ready-made instruction so the user can paste it
 * into whichever assistant they already pay for.
 */

const KEY_STORAGE = 'spellbox.apikey';
const MODEL = 'claude-sonnet-4-6';
const ENDPOINT = 'https://api.anthropic.com/v1/messages';

export const TRANSLATE_INSTRUCTION =
  '把以下 AI 繪圖提示詞翻成英文，使用攝影與美術的專業術語寫法。保留 {{變數}} 原樣不翻，保留 --ar --no 等參數。只輸出英文提示詞本身，不要任何說明或引號。\n\n';

export const ANALYZE_INSTRUCTION = `請分析這張圖片，拆解成一則可重複使用的 AI 繪圖提示詞。只輸出 JSON，不要任何說明或 markdown 標記，格式如下：
{"title":"12字內的中文標題","tags":"三到四個中文標籤,逗號分隔","zh":"中文提示詞","en":"English prompt"}
提示詞必須涵蓋：主體與姿態、場景與背景、光線方向與性質、鏡頭焦段與景深、色調與後製風格、構圖方式、整體氛圍與質感。
把畫面中可替換的具體對象改寫成 {{變數}} 形式，例如 {{主體}}、{{場景}}。中英兩版內容要對應，英文請使用攝影與美術的專業術語寫法。不要描述任何可辨識的真實人物身份。`;

export type AiResult<T> = { ok: true; text: T } | { ok: false; message: string };

export async function getApiKey(): Promise<string> {
  try {
    return (await AsyncStorage.getItem(KEY_STORAGE)) ?? '';
  } catch {
    return '';
  }
}

export async function setApiKey(key: string) {
  const trimmed = key.trim();
  if (trimmed) await AsyncStorage.setItem(KEY_STORAGE, trimmed);
  else await AsyncStorage.removeItem(KEY_STORAGE);
}

async function callClaude(key: string, content: unknown, maxTokens: number): Promise<string> {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      // Required for browser-origin requests; harmless on native.
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content }],
    }),
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  const text = (data.content ?? [])
    .filter((part: { type: string }) => part.type === 'text')
    .map((part: { text: string }) => part.text)
    .join('')
    .trim();
  if (!text) throw new Error('empty response');
  return text;
}

/** Translates a Chinese prompt to English, or explains how to do it by hand. */
export async function translateToEnglish(source: string): Promise<AiResult<string>> {
  if (!source.trim()) return { ok: false, message: '沒有可翻譯的內容' };

  const key = await getApiKey();
  if (!key) {
    await Clipboard.setStringAsync(TRANSLATE_INSTRUCTION + source);
    return {
      ok: false,
      message: '尚未設定 API 金鑰。翻譯指令已複製，貼給任一個 AI 即可',
    };
  }

  try {
    const text = await callClaude(key, TRANSLATE_INSTRUCTION + source, 1200);
    return { ok: true, text };
  } catch {
    await Clipboard.setStringAsync(TRANSLATE_INSTRUCTION + source);
    return { ok: false, message: '連不到翻譯服務。指令已複製，貼給任一個 AI 即可' };
  }
}

export interface AnalyzedPrompt {
  title: string;
  tags: string;
  zh: string;
  en: string;
}

/** Turns a reference photo into a reusable prompt. `base64` must be JPEG data, no prefix. */
export async function analyzeImage(base64: string): Promise<AiResult<AnalyzedPrompt>> {
  const key = await getApiKey();
  if (!key) {
    await Clipboard.setStringAsync(ANALYZE_INSTRUCTION);
    return {
      ok: false,
      message: '尚未設定 API 金鑰。解析指令已複製，連同照片貼給 AI，再把結果填進下面',
    };
  }

  try {
    const text = await callClaude(
      key,
      [
        { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64 } },
        { type: 'text', text: ANALYZE_INSTRUCTION },
      ],
      1400
    );
    const cleaned = text.replace(/```json|```/g, '').trim();
    const json = cleaned.slice(cleaned.indexOf('{'), cleaned.lastIndexOf('}') + 1);
    const parsed = JSON.parse(json) as AnalyzedPrompt;
    return { ok: true, text: parsed };
  } catch {
    await Clipboard.setStringAsync(ANALYZE_INSTRUCTION);
    return { ok: false, message: '連不到服務。解析指令已複製，貼給 AI 後把結果填進下面' };
  }
}
