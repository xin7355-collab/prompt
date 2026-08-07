import type { Format, Lang } from '../data/types';
import type { BenchState } from './compose';

export interface HealthNote {
  ok: boolean;
  text: string;
}

/**
 * A pre-flight read of the composed prompt. These are the failure modes that actually
 * waste a generation credit — missing light, missing lens, unfilled placeholders,
 * Chinese text on a model that cannot render Chinese glyphs.
 */
export function healthCheck(
  text: string,
  bench: BenchState,
  lang: Lang,
  format: Format
): HealthNote[] {
  const notes: HealthNote[] = [];
  const warn = (t: string) => notes.push({ ok: false, text: t });
  const good = (t: string) => notes.push({ ok: true, text: t });
  const has = (re: RegExp) => re.test(text);

  if (text.replace(/\s/g, '').length < 45) {
    warn('描述偏短，模型會自由發揮。加幾個修飾器把光線、鏡頭、色調補上');
  }
  if (/\{\{[^}]+\}\}/.test(text)) {
    warn('還有沒填的 {{變數}}，模型會照著括號裡的字畫');
  }
  if (!has(/光|燈|lighting|backlit|glow|sunlight|lit\b/i)) {
    warn('沒有指定光線，這是最影響成敗的一項');
  }
  if (!has(/mm|鏡頭|景深|廣角|微距|長焦|lens|angle|bokeh|depth of field/i)) {
    warn('沒有鏡頭語彙，畫面容易平板');
  }
  if (!has(/色調|配色|飽和|palette|grade|tone|monochrome|色系/i)) {
    warn('沒有指定色調，成品顏色會很隨機');
  }
  if (!bench.ratio) warn('沒選比例，多數平台會給你正方形');
  if (!bench.negs.length) warn('沒有排除項，手指與亂碼文字的風險比較高');
  if (lang === 'zh' && format !== 'plain') {
    warn(
      `輸出格式是 ${format === 'mj' ? 'Midjourney' : 'Stable Diffusion'}，但目前是中文。這兩個平台請切到 EN`
    );
  }
  if (/「[^」]*」|寫出|寫著/.test(text)) {
    warn('畫面裡要有中文字：Midjourney 與 SD 幾乎必壞，建議用 Gemini／Ideogram，或先做無字版自己加');
  }

  if (bench.mode !== 't2i') good('圖生圖模式：記得先在對方網站上傳照片');
  if (bench.char) good('已鎖定角色，這組會維持同一張臉');
  if (bench.seed.trim()) good('已指定種子值，重跑會更接近上一張');
  if (!notes.some((n) => !n.ok)) good('看起來很完整，可以送出了');

  return notes;
}
