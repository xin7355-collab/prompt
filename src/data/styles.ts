import { POSTERS } from './posters';
import type { Lang } from './types';

/**
 * The visual style library that backs 風格牆.
 *
 * The prompt corpus answers "what should I draw"; this answers "what should it look
 * like". Each entry is a *style clause* only — it carries no subject, so the same
 * sentence the user types once at the top of the wall can be fired through any of
 * them. That is the whole point of the screen: choose by looking at a thumbnail,
 * not by reading 400 lines of text.
 *
 * `sw` is a three-colour palette used to draw a stand-in tile before the user has
 * saved a real result image for that style. Once they save one, the photo replaces
 * the swatch and the wall becomes their own visual index.
 */

export interface StyleFamily {
  k: string;
  n: string;
  /** Single typographic mark, matching the emoji-free glyphs used by the tab bar. */
  g: string;
}

export interface VisualStyle {
  id: string;
  /** Traditional Chinese name. */
  n: string;
  /** Latin name, shown as the tile's eyebrow. */
  e: string;
  /** Family key, see FAMILIES. */
  f: string;
  /** Comma-joined search tags. */
  k: string;
  /**
   * The style clause, Traditional Chinese. Absent on the poster collection, whose
   * prompts are English-only by design — see posters.ts.
   */
  zh?: string;
  /** The style clause, English. */
  en: string;
  /** One-line Chinese explanation of the look, shown on the card. */
  d?: string;
  /**
   * Set when the entry is a finished prompt that already names its own subject,
   * rather than a clause waiting for one. Changes how composeStyle treats `subject`.
   */
  full?: boolean;
  /** Swatch palette: [ground, primary, accent]. */
  sw: [string, string, string];
}

export const FAMILIES: StyleFamily[] = [
  // The poster collection leads: those entries are ready to fire as-is, which is the
  // shortest path from opening the wall to having an image.
  { k: 'cnfashion', n: '華流國風', g: '龍' },
  { k: 'fashion', n: '時尚海報', g: '衣' },
  { k: 'photo', n: '攝影寫實', g: '◉' },
  { k: 'film', n: '電影感', g: '▭' },
  { k: 'anime', n: '動漫', g: '✧' },
  { k: 'illust', n: '插畫手繪', g: '✎' },
  { k: 'art', n: '藝術流派', g: '❋' },
  { k: 'threed', n: '3D · 立體', g: '◈' },
  { k: 'retro', n: '復古懷舊', g: '▨' },
  { k: 'graphic', n: '平面設計', g: '▤' },
  { k: 'craft', n: '材質工藝', g: '❖' },
  { k: 'east', n: '東方 · 在地', g: '卍' },
  { k: 'dark', n: '暗黑奇幻', g: '◐' },
  { k: 'dream', n: '夢幻清新', g: '❀' },
];

/** The style clauses. Combined with POSTERS into STYLES at the bottom of this file. */
const CLAUSES: VisualStyle[] = [
  // ── 攝影寫實 ────────────────────────────────────────────────────
  {
    id: 's-cine-portrait',
    n: '電影感人像',
    e: 'Cinematic Portrait',
    f: 'photo',
    k: '人像,淺景深,質感,專業',
    zh: '以電影感人像攝影呈現：85mm 定焦鏡、光圈 f/1.4 的極淺景深，主體眼神清晰銳利、背景化成柔順的散景光斑。單一側面主光加一片反光板補暗部，膚質保留真實毛孔與細微油光，不修成塑膠感。色彩走低飽和的膠片調，暗部帶一點青、亮部帶一點暖黃。',
    en: 'Cinematic portrait photography: 85mm prime at f/1.4, razor-sharp eyes with the background melting into smooth bokeh. Single soft key light from one side with a fill card lifting the shadows. Skin keeps real pores and a faint natural sheen — never plastic. Muted filmic grade with slightly teal shadows and warm golden highlights.',
    sw: ['#1F2A2E', '#C98A5B', '#E8D6BE'],
  },
  {
    id: 's-softbox',
    n: '柔光棚拍',
    e: 'Softbox Studio',
    f: 'photo',
    k: '棚拍,乾淨,商業,證件',
    zh: '專業棚拍打光：大型柔光罩從正面偏上 45 度打下，兩側各一盞補光燈消除硬陰影，背景是均勻無縫的中性灰紙。光線乾淨通透，主體邊緣清楚俐落，整體曝光準確、無死黑無死白，可直接用於商業用途。',
    en: 'Professional studio lighting: large softbox at 45 degrees above the subject, two fill lights killing hard shadows, seamless neutral grey backdrop. Clean, even light, crisp subject edges, accurate exposure with no crushed blacks or blown highlights. Commercial-ready.',
    sw: ['#E4E6E3', '#9AA3A6', '#3A4245'],
  },
  {
    id: 's-golden-hour',
    n: '黃金時刻',
    e: 'Golden Hour',
    f: 'photo',
    k: '逆光,溫暖,日落,氛圍',
    zh: '日落前半小時的黃金時刻自然光：低角度的太陽從主體斜後方穿過來，在髮絲與肩線上鑲一圈金邊，鏡頭吃到一點光暈與耀光。空氣中有薄薄的塵埃在光束裡浮動，整體色溫偏暖橘，陰影柔軟而拉得很長。',
    en: 'Golden hour daylight half an hour before sunset: low sun raking from behind the subject, rimming hair and shoulders in gold, a touch of haze and lens flare in frame. Fine dust floats in the light beam. Warm orange grade, soft shadows stretched long.',
    sw: ['#2A1E14', '#E0913C', '#FFDFA8'],
  },
  {
    id: 's-bw-film',
    n: '黑白底片',
    e: 'Black & White Film',
    f: 'photo',
    k: '黑白,底片,顆粒,經典',
    zh: '經典黑白底片攝影：ISO 400 的明顯銀鹽顆粒，濃厚的中間調層次，黑色扎實但仍保留暗部細節、白色乾淨但不過曝。強調形狀、線條與明暗對比而非色彩，帶有紀實攝影的沉靜氣質。',
    en: 'Classic black and white film photography: visible ISO 400 silver grain, rich midtone separation, deep blacks that still hold shadow detail, clean whites that never clip. Composition carried by shape, line and contrast instead of colour. Quiet documentary feel.',
    sw: ['#141414', '#7E7E7E', '#EDEDED'],
  },
  {
    id: 's-fuji-film',
    n: '日系底片',
    e: 'Japanese Film Stock',
    f: 'photo',
    k: '日系,清淡,底片,通透',
    zh: '日系底片色調：整體提亮、對比壓低，白色偏冷、綠色偏青，膚色乾淨帶一點粉。畫面通透留白多，光線是陰天或窗邊的漫射光，沒有強烈陰影。細緻的底片顆粒與極輕微的邊角失光。',
    en: 'Japanese film stock grade: lifted exposure, low contrast, cool whites, cyan-leaning greens, clean slightly pink skin tones. Airy composition with generous negative space, diffused overcast or window light, no harsh shadows. Fine grain and a whisper of vignetting.',
    sw: ['#DFE5E0', '#A8C0B4', '#F2E3E0'],
  },
  {
    id: 's-macro',
    n: '微距特寫',
    e: 'Macro Close-up',
    f: 'photo',
    k: '微距,細節,質感,放大',
    zh: '微距攝影：1:1 放大倍率的極近距離拍攝，景深只有幾公釐，焦平面上的紋理、纖維、水珠與絨毛纖毫畢現，其餘迅速化開。環形光或柔和側光讓表面質感立體，背景是純粹的散景色塊。',
    en: 'Macro photography at 1:1 magnification: depth of field only millimetres deep, texture, fibres, droplets and fine hairs rendered in forensic detail on the focal plane, everything else dissolving. Ring or soft side light to model the surface, background reduced to pure bokeh colour.',
    sw: ['#16241C', '#4E8F5C', '#CFE8B8'],
  },
  {
    id: 's-aerial',
    n: '空拍俯瞰',
    e: 'Aerial Top-down',
    f: 'photo',
    k: '空拍,俯視,幾何,遼闊',
    zh: '無人機正上方垂直俯拍：完全 90 度的頂視角，地面的道路、田塊、屋頂與人群壓縮成平面的幾何圖案。陽光在午後斜射，物體拖出短而清楚的影子形成節奏感。廣角但不變形，畫面遼闊而秩序井然。',
    en: 'Drone shot straight down: a true 90-degree top-down view flattening roads, fields, rooftops and crowds into graphic geometry. Afternoon sun casts short crisp shadows that give the frame rhythm. Wide but undistorted, vast and orderly.',
    sw: ['#20353A', '#4B8C8F', '#D9C79A'],
  },
  {
    id: 's-long-exposure',
    n: '長曝流光',
    e: 'Long Exposure',
    f: 'photo',
    k: '長曝,光軌,夜景,流動',
    zh: '長時間曝光攝影：快門三十秒，會動的東西全部化成流動的軌跡——車燈拉成紅白光帶、水面抹成絲綢、雲層拖出方向感，固定的建築與地面則保持絕對銳利。三腳架穩定，暗部乾淨無噪點。',
    en: 'Long exposure photography at thirty seconds: everything that moves becomes a trail — headlights stretched into red and white ribbons, water smoothed to silk, clouds smeared into direction — while buildings and ground stay absolutely sharp. Tripod-steady, clean noise-free shadows.',
    sw: ['#0D1A2B', '#2E6FA8', '#F2C14E'],
  },
  {
    id: 's-neon-night',
    n: '霓虹夜街',
    e: 'Neon Night Street',
    f: 'photo',
    k: '夜景,霓虹,街拍,反光',
    zh: '雨後的夜間街頭攝影：霓虹招牌的桃紅、電藍與青綠倒映在濕漉漉的柏油路上，水窪把光拉成長條。主體被彩色的環境光從兩側夾住，臉上一半紅一半藍。空氣有薄霧，遠處的燈化成柔和的光球。',
    en: 'Night street photography after rain: neon signage in hot pink, electric blue and cyan reflecting off wet asphalt, puddles stretching the light into streaks. The subject is sandwiched between coloured ambient light, half the face red and half blue. Light haze turns distant lamps into soft orbs.',
    sw: ['#0B0E1A', '#E0348B', '#31D0E8'],
  },
  {
    id: 's-silhouette',
    n: '逆光剪影',
    e: 'Backlit Silhouette',
    f: 'photo',
    k: '逆光,剪影,對比,極簡',
    zh: '強烈逆光剪影：光源正對鏡頭，主體壓成幾乎全黑的輪廓，只靠外形辨識，細節完全捨棄。背景是大片明亮的天空或窗戶，漸層乾淨。構圖極簡，靠輪廓的姿態說故事。',
    en: 'Strong backlit silhouette: the light source faces the camera, the subject reduced to a near-black shape read purely by outline, all interior detail sacrificed. Background is a broad luminous sky or window with a clean gradient. Minimal composition carried by the pose alone.',
    sw: ['#101418', '#E8934A', '#F7DFA8'],
  },
  {
    id: 's-product-studio',
    n: '商品棚拍',
    e: 'Product Shot',
    f: 'photo',
    k: '商品,電商,乾淨,反光',
    zh: '高階商品攝影：純白或漸層背景，商品懸浮或立於淺灰反光台面上，下方有一道乾淨的鏡射倒影。柔光罩加窄長條燈勾勒邊緣高光，標籤文字清楚可讀，材質的金屬感、玻璃透光與霧面顆粒都準確呈現。',
    en: 'High-end product photography: pure white or gradient backdrop, the product floating or standing on a soft reflective surface with a clean mirrored reflection beneath. Softbox plus a narrow strip light carving edge highlights. Label text legible; metal, glass and matte finishes rendered accurately.',
    sw: ['#F4F4F2', '#C4C9CC', '#5A6166'],
  },
  {
    id: 's-food-flatlay',
    n: '美食俯拍',
    e: 'Food Flat Lay',
    f: 'photo',
    k: '美食,俯拍,餐飲,擺盤',
    zh: '美食俯拍平面構圖：正上方視角，餐具、食材與布巾在畫面中呈幾何排列，留白得宜。窗邊自然側光讓醬汁反光、蒸氣可見、麵包剖面的孔洞清楚。色彩飽和但不過火，質感重於裝飾。',
    en: 'Overhead food flat lay: straight-down view with plates, ingredients and linen arranged geometrically across the frame with considered negative space. Natural side light from a window makes sauces glisten, steam visible, crumb structure legible. Saturated but honest colour, texture over decoration.',
    sw: ['#2C211A', '#C4663A', '#EFD9B8'],
  },

  // ── 電影感 ──────────────────────────────────────────────────────
  {
    id: 's-teal-orange',
    n: '青橙大片',
    e: 'Teal & Orange',
    f: 'film',
    k: '好萊塢,調色,商業,對比',
    zh: '好萊塢商業大片調色：膚色與亮部推向溫暖的橘金，陰影與背景整體壓成青藍，兩者形成強烈的互補對比。寬銀幕構圖，畫面上下留黑邊，對比高、黑位濃，帶輕微的鏡頭耀光與底片顆粒。',
    en: 'Hollywood blockbuster grade: skin tones and highlights pushed warm orange, shadows and background pulled deep teal for a hard complementary contrast. Widescreen framing with letterbox bars, high contrast, dense blacks, subtle anamorphic flare and film grain.',
    sw: ['#0E2A33', '#1D6A78', '#E28A3D'],
  },
  {
    id: 's-hk-neon',
    n: '港片霓虹',
    e: 'Hong Kong Neon',
    f: 'film',
    k: '港片,綠調,懷舊,都市',
    zh: '九〇年代港片質感：整體偏綠的螢光燈調性，混著窗外招牌的紅光。狹窄的室內空間、百葉窗與電風扇切割光線，畫面帶著濕熱與煙味。手持鏡頭的輕微晃動，色彩濃烈而略髒，底片顆粒明顯。',
    en: 'Nineties Hong Kong cinema look: overall green fluorescent cast mixed with red signage bleeding through the window. Cramped interiors, light sliced by blinds and a ceiling fan, humid and smoky. Slight handheld drift, heavy dirty colour, pronounced film grain.',
    sw: ['#12241C', '#3E8A5F', '#D93B2F'],
  },
  {
    id: 's-nordic-cold',
    n: '北歐冷調',
    e: 'Nordic Cold',
    f: 'film',
    k: '冷調,低彩,壓抑,劇情',
    zh: '北歐劇情片的冷調：極低飽和度，幾乎只剩灰、藍與淡褐，白色偏冷。陰天的漫射光沒有方向性，陰影很淺。構圖留白大、人物置於畫面邊緣，情緒克制而疏離。',
    en: 'Nordic drama grade: extremely low saturation reduced to greys, blues and pale browns with cool whites. Directionless overcast light, shallow shadows. Wide empty compositions with the figure pushed to the edge of frame. Restrained, distant mood.',
    sw: ['#2A3238', '#6E828C', '#C6CDD0'],
  },
  {
    id: 's-western',
    n: '西部膠捲',
    e: 'Spaghetti Western',
    f: 'film',
    k: '西部,沙塵,暖褐,復古',
    zh: '義大利西部片的膠捲質感：整體染成沙塵黃褐，天空過曝發白，地平線壓得很低。強烈的正午頂光，臉上陰影深刻。畫面有明顯的底片刮痕、塵點與邊角失光，質地粗糙而灼熱。',
    en: 'Spaghetti western film stock: everything dyed dusty yellow-brown, sky blown out to white, horizon pressed low. Harsh midday toplight carving deep facial shadows. Visible film scratches, dust specks and heavy vignetting — coarse and sun-scorched.',
    sw: ['#3A2A18', '#B98A47', '#E8D8A8'],
  },
  {
    id: 's-cyberpunk',
    n: '賽博龐克',
    e: 'Cyberpunk',
    f: 'film',
    k: '科幻,霓虹,未來,雨夜',
    zh: '賽博龐克電影場景：永遠在下雨的高密度未來城市，巨大的全息廣告投在樓面上，桃紅與青色的霓虹是唯一光源。空氣中有蒸氣與粉塵，地面積水映出上方的招牌。高反差、暗部濃重、亮部溢光。',
    en: 'Cyberpunk film scene: a perpetually raining high-density future city, giant holographic ads projected across tower facades, magenta and cyan neon the only light sources. Steam and particulate in the air, standing water mirroring the signage above. High contrast, dense shadows, blooming highlights.',
    sw: ['#0A0B1F', '#7B2FD1', '#2FE0D5'],
  },
  {
    id: 's-horror',
    n: '恐怖片氛圍',
    e: 'Horror Mood',
    f: 'film',
    k: '恐怖,陰森,低光,懸疑',
    zh: '恐怖片的低照度氛圍：畫面絕大部分沉在黑暗裡，只有一道來源不明的冷白光切過主體。極端的明暗對比，陰影裡藏著看不清的輪廓。色彩幾乎抽乾，只剩病態的青綠。輕微的手持晃動與噪點。',
    en: 'Low-key horror atmosphere: most of the frame sunk in darkness, a single cold white shaft of light from an unseen source cutting across the subject. Extreme contrast with unreadable shapes lurking in shadow. Colour nearly drained to a sickly green-cyan. Faint handheld drift and noise.',
    sw: ['#0A0E0C', '#2E4A3E', '#9FB8A6'],
  },
  {
    id: 's-wes-symmetry',
    n: '對稱糖果色',
    e: 'Symmetric Pastel',
    f: 'film',
    k: '對稱,粉彩,構圖,俏皮',
    zh: '嚴格對稱的正面構圖：主體置中，左右完全鏡射，鏡頭與地面平行。色彩是刻意搭配過的粉彩系——芥末黃、粉紅、薄荷綠與淺藍，飽和度中等而統一。平面化的打光，沒有戲劇性陰影，像一幅精心佈置的娃娃屋。',
    en: 'Rigidly symmetrical head-on composition: subject dead centre, left and right mirrored, camera perfectly level. A deliberately curated pastel palette — mustard, pink, mint and pale blue — evenly saturated. Flat frontal lighting with no dramatic shadow, like an immaculately dressed dollhouse.',
    sw: ['#F2D9B8', '#E38C9E', '#8FC4B5'],
  },

  // ── 動漫 ────────────────────────────────────────────────────────
  {
    id: 's-cel-anime',
    n: '日系賽璐璐',
    e: 'Cel-shaded Anime',
    f: 'anime',
    k: '動漫,賽璐璐,日系,乾淨',
    zh: '現代日本動畫的賽璐璐上色：乾淨俐落的黑色描邊，色塊平塗，陰影只分成一到兩階且邊界清楚，不做漸層。眼睛畫得大而透亮，有多層高光。背景是細緻的手繪水彩風景，與角色的平塗形成對比。',
    en: 'Modern Japanese anime cel shading: clean confident black linework, flat colour fills, shadows in one or two hard-edged steps with no gradients. Large luminous eyes with layered highlights. Painterly watercolour background contrasting against the flat character art.',
    sw: ['#1B2438', '#4F86D6', '#F7D9C4'],
  },
  {
    id: 's-retro-anime',
    n: '九〇年代動畫',
    e: '90s Anime',
    f: 'anime',
    k: '復古,動畫,懷舊,顆粒',
    zh: '九〇年代賽璐璐動畫的質感：手繪的不均勻線條、略微暗沉的色票、膠片轉印帶來的輕微色偏與雜訊。人物臉部較窄、眼睛較細長，光影用噴槍打出柔邊。畫面比例 4:3，邊緣有輕微的掃描抖動。',
    en: 'Nineties hand-painted cel animation: slightly uneven inked lines, muted period colour palette, mild colour shift and grain from film transfer. Narrower faces and longer eyes, airbrushed soft-edged shading. 4:3 frame with a hint of scan-gate wobble at the edges.',
    sw: ['#2A2438', '#8C6BA8', '#E8B87A'],
  },
  {
    id: 's-shoujo',
    n: '少女漫畫',
    e: 'Shoujo Manga',
    f: 'anime',
    k: '少女,浪漫,花卉,細膩',
    zh: '少女漫畫畫風：纖細修長的人物比例，眼睛佔臉部極大面積、瞳孔裡有繁複的星芒與反光。線條細而輕，背景飄滿花瓣、氣泡與網點效果。色彩粉嫩通透，情緒渲染大於寫實。',
    en: 'Shoujo manga style: slender elongated figures, eyes taking up a huge share of the face with elaborate starbursts and reflections in the iris. Fine delicate linework, backgrounds strewn with petals, bubbles and screentone effects. Sweet translucent colour, emotion over realism.',
    sw: ['#FBE4EE', '#E38BB4', '#A88BD6'],
  },
  {
    id: 's-shonen',
    n: '熱血少年漫',
    e: 'Shonen Action',
    f: 'anime',
    k: '少年,動作,速度線,戲劇',
    zh: '少年漫畫的動作場面：誇張的透視與仰角，人物肌肉線條分明、姿態充滿張力。放射狀速度線從畫面中心炸開，衝擊處有碎裂與能量光效。粗黑的輪廓線搭配高對比上色，情緒推到最滿。',
    en: 'Shonen action spread: exaggerated perspective and low camera angles, defined musculature, poses full of torque. Radial speed lines exploding from the centre, debris and energy effects at the point of impact. Heavy black outlines over high-contrast colour, emotion at maximum.',
    sw: ['#1A1A22', '#E04A2F', '#F2C230'],
  },
  {
    id: 's-pastoral-anime',
    n: '田園手繪動畫',
    e: 'Pastoral Hand-drawn',
    f: 'anime',
    k: '手繪,自然,溫暖,療癒',
    zh: '手繪劇場版動畫的質感：厚塗水彩與不透明水粉的背景，草葉、雲層與水面都有筆觸痕跡。自然光溫暖柔和，綠意飽滿。人物線條圓潤樸實、設計簡潔，與細密的背景形成層次。氣氛安靜而療癒。',
    en: 'Hand-painted feature-animation look: backgrounds in layered watercolour and gouache with visible brushwork in grass, clouds and water. Warm gentle daylight, lush greens. Rounded unfussy character linework and simple designs set against the dense painted background. Quiet, healing mood.',
    sw: ['#2E4A2E', '#7FB069', '#F0E2C0'],
  },
  {
    id: 's-manga-bw',
    n: '黑白網點漫畫',
    e: 'Screentone Manga',
    f: 'anime',
    k: '黑白,網點,漫畫,線稿',
    zh: '黑白漫畫原稿：純黑白無彩色，中間調全部用網點紙表現，可見規律的圓點陣列。粗細變化明顯的沾水筆線條，重點處大面積填黑，白色留出高光。分鏡感強，背景用效果線與集中線帶出情緒。',
    en: 'Black and white manga page: no colour at all, every midtone rendered as screentone with a visible regular dot grid. Dip-pen linework with strong thick-to-thin variation, heavy spot blacks, whites reserved for highlights. Strong panel sensibility, mood carried by effect lines and focus lines.',
    sw: ['#141414', '#8A8A8A', '#FAFAFA'],
  },
  {
    id: 's-chibi',
    n: 'Q版大頭',
    e: 'Chibi',
    f: 'anime',
    k: 'Q版,可愛,貼圖,二頭身',
    zh: 'Q版二頭身比例：頭部大約佔全身一半，四肢短圓、手腳簡化成小團塊。五官集中在臉部下半，眼睛又大又亮，臉頰有腮紅。線條圓潤無銳角，色彩明亮飽和，背景乾淨或純色，適合做貼圖。',
    en: 'Chibi two-head-tall proportions: the head about half the total height, short rounded limbs, hands and feet simplified into soft nubs. Features clustered low on the face, huge bright eyes, blushed cheeks. Rounded linework with no sharp corners, bright saturated colour, clean or flat-colour background. Sticker-ready.',
    sw: ['#FFF2E0', '#FF9EB5', '#6EC6E8'],
  },

  // ── 插畫手繪 ────────────────────────────────────────────────────
  {
    id: 's-picture-book',
    n: '童書水彩',
    e: 'Picture Book Watercolour',
    f: 'illust',
    k: '童書,水彩,溫暖,故事',
    zh: '童書插畫的水彩質感：顏料在紙上自然暈開、邊緣留下深色的水痕，紙張的粗紋清楚可見。色彩溫暖柔和，留白處直接是紙的顏色。造型簡化而有童趣，線條是鉛筆或細墨線，不追求精準。',
    en: 'Children’s picture-book watercolour: pigment blooming naturally on paper with darker settling at the edges, the cold-press paper tooth clearly visible. Warm gentle palette, negative space left as bare paper. Simplified charming shapes over loose pencil or fine ink linework, precision deliberately avoided.',
    sw: ['#FBF3E2', '#E8A24A', '#7BA8C4'],
  },
  {
    id: 's-crayon',
    n: '蠟筆塗鴉',
    e: 'Crayon Doodle',
    f: 'illust',
    k: '蠟筆,童趣,手感,粗獷',
    zh: '兒童蠟筆畫：油性蠟筆在粗糙紙面上留下斷續、不均勻的色塊，用力處厚實、輕擦處露出紙的白。線條歪斜不精準，形狀簡化到最基本。色彩直接使用飽和的原色，不做混色，天真而有生命力。',
    en: 'Children’s crayon drawing: waxy sticks laid over rough paper leaving broken uneven patches, dense where pressed hard, showing bare white where skimmed. Wobbly imprecise lines, shapes reduced to their simplest form. Saturated primaries used straight from the box with no blending — naive and alive.',
    sw: ['#FFFBF0', '#F25C3B', '#3D8BD1'],
  },
  {
    id: 's-flat-vector',
    n: '平塗向量',
    e: 'Flat Vector',
    f: 'illust',
    k: '向量,扁平,乾淨,現代',
    zh: '扁平化向量插畫：純色塊構成，沒有漸層也沒有寫實陰影，深淺只靠不同明度的同色系表現。形狀幾何化、邊緣絕對乾淨銳利，沒有描邊或只有等寬細線。配色控制在四到五色以內，現代而清爽。',
    en: 'Flat vector illustration: built from solid colour shapes with no gradients and no realistic shadow, depth conveyed only by tints of the same hue. Geometric forms with perfectly crisp edges, either no outline or a uniform hairline. Palette held to four or five colours. Modern and clean.',
    sw: ['#F0EDE6', '#3D6FE0', '#F2A93B'],
  },
  {
    id: 's-line-sketch',
    n: '線稿速寫',
    e: 'Line Sketch',
    f: 'illust',
    k: '線稿,速寫,單色,俐落',
    zh: '單色線條速寫：只有線，沒有色塊也沒有陰影填色。筆觸連貫快速，一筆到底不修改，線條粗細隨速度自然變化。留白極多，靠幾條關鍵線交代整個形體與動態，乾淨而有自信。',
    en: 'Single-colour line sketch: line only, no fills and no shading. Fast continuous strokes laid down in one pass without correction, weight varying naturally with speed. Very generous white space, the whole form and gesture implied by a handful of decisive lines. Clean and confident.',
    sw: ['#FFFFFF', '#2A2A2A', '#C8C4BC'],
  },
  {
    id: 's-woodcut',
    n: '木刻版畫',
    e: 'Woodcut Print',
    f: 'illust',
    k: '版畫,木刻,粗獷,復古',
    zh: '木刻版畫：刻刀在木板上留下的粗獷刀痕，線條有明顯的起伏與斷點。只有兩到三個顏色，套印時略有位移形成邊緣重疊。大量的平行排線與交叉線構成明暗，油墨在紙上壓出不均勻的濃淡。',
    en: 'Woodcut relief print: coarse gouge marks with lines that swell, break and taper. Two or three inks only, with slight registration offset creating overlap at the edges. Tone built from dense parallel and cross-hatched cuts, ink pressed unevenly into the paper.',
    sw: ['#F0E8D8', '#1F1A16', '#B03A2E'],
  },
  {
    id: 's-ink-wash',
    n: '水墨渲染',
    e: 'Ink Wash',
    f: 'illust',
    k: '水墨,東方,留白,寫意',
    zh: '寫意水墨：濃淡墨色在生宣上自然滲開，一筆之內有焦、濃、重、淡、清的層次。大量留白代表雲霧與水面，不畫滿。運筆有提按頓挫，形體寫意不寫實，只在關鍵處點一筆硃砂。',
    en: 'Freehand ink wash: gradations of ink bleeding into absorbent paper, a single stroke carrying the full range from scorched black to pale grey. Large areas left blank to stand for mist and water. Expressive brush pressure, forms suggested rather than described, with one accent of cinnabar red.',
    sw: ['#F4F1E8', '#3A3A38', '#B0402F'],
  },
  {
    id: 's-pencil',
    n: '鉛筆素描',
    e: 'Pencil Drawing',
    f: 'illust',
    k: '素描,鉛筆,寫實,學院',
    zh: '學院派鉛筆素描：以 2H 到 6B 的不同硬度堆出完整的明暗五調子，排線方向跟著形體轉折走。高光用軟橡皮擦出，暗部層層疊加而不塗死。紙面的顆粒在淺調處清楚可見，形體結構準確。',
    en: 'Academic graphite drawing: the full five-value range built with pencils from 2H to 6B, hatching following the turn of the form. Highlights lifted with a kneaded eraser, shadows layered rather than smothered. Paper tooth visible in the light passages, structure anatomically accurate.',
    sw: ['#EDEAE3', '#8F8C86', '#2E2C2A'],
  },
  {
    id: 's-pastel-soft',
    n: '粉彩柔霧',
    e: 'Soft Pastel',
    f: 'illust',
    k: '粉彩,柔和,朦朧,溫柔',
    zh: '乾粉彩畫：色粉在紙上以手指抹開，邊界柔化成霧狀，沒有銳利的輪廓。顏色互相疊壓混合，帶著微微的粉塵感。整體明度偏高、飽和度偏低，光線像隔著一層薄紗，溫柔而朦朧。',
    en: 'Soft pastel on paper: pigment blended with the fingertip, edges feathered into haze with no sharp contour. Colours layered and smudged into each other with a faint chalk dust. High-key and low-saturation overall, light diffused as if through gauze. Tender and soft-focus.',
    sw: ['#F5E6E8', '#C9A8D4', '#A8C4D9'],
  },

  // ── 藝術流派 ────────────────────────────────────────────────────
  {
    id: 's-impressionist',
    n: '印象派油畫',
    e: 'Impressionist Oil',
    f: 'art',
    k: '油畫,印象派,筆觸,光影',
    zh: '印象派油畫：短促而厚重的筆觸並置，顏色不在調色盤上混合而在眼睛裡混合。捕捉的是某一瞬間的光線而非物體本身，陰影裡有藍紫而非黑色。輪廓鬆散、細節放棄，整體在遠看時才成形。',
    en: 'Impressionist oil painting: short loaded brushstrokes laid side by side, colours mixing in the eye rather than on the palette. The subject is the light of one particular moment rather than the object itself; shadows are violet-blue, never black. Loose contours, detail abandoned, the image resolving only at a distance.',
    sw: ['#E8DCC0', '#5B84B1', '#E0A03C'],
  },
  {
    id: 's-renaissance',
    n: '文藝復興油畫',
    e: 'Renaissance Oil',
    f: 'art',
    k: '古典,油畫,肖像,莊重',
    zh: '文藝復興盛期的油畫：多層透明罩染堆疊出溫潤的膚色，光線從單一側窗斜入，明暗過渡極其細膩。姿態端正莊重，衣料的褶皺與質感考究。背景是深沉的暗褐色，畫面表面有細微的龜裂與陳年凡尼斯的黃調。',
    en: 'High Renaissance oil painting: luminous flesh tones built in transparent glazes, light entering from a single high window with exquisitely graded transitions. Composed dignified pose, drapery folds studied and material-accurate. Deep umber background, the surface carrying fine craquelure and the yellow cast of aged varnish.',
    sw: ['#2A1D12', '#8F6034', '#E8CFA8'],
  },
  {
    id: 's-baroque',
    n: '巴洛克光影',
    e: 'Baroque Chiaroscuro',
    f: 'art',
    k: '巴洛克,戲劇,強光,古典',
    zh: '巴洛克的明暗對照法：畫面大半沉入近乎全黑的背景，一道強烈的斜射光從左上方打在主體上，交界處對比極端。姿態充滿動勢與戲劇張力，衣料翻飛。色彩以暖褐、赭紅與象牙白為主。',
    en: 'Baroque chiaroscuro: most of the canvas sunk into near-total black, a single hard shaft of light entering from the upper left and striking the subject, the boundary rendered at extreme contrast. Poses full of movement and theatrical tension, drapery in flight. Palette of warm browns, ochre reds and ivory.',
    sw: ['#120C08', '#7A4A28', '#F0DEC0'],
  },
  {
    id: 's-ukiyoe',
    n: '浮世繪',
    e: 'Ukiyo-e',
    f: 'art',
    k: '浮世繪,日本,版畫,平面',
    zh: '浮世繪木版畫：黑色輪廓線包住平塗的色塊，沒有透視深度也沒有寫實陰影。藍色使用普魯士藍的漸層，天空與水面用平行的暈染帶。構圖大膽，主體常被畫框切斷，留白處有雲紋或落款。',
    en: 'Ukiyo-e woodblock print: black keyblock outlines enclosing flat colour fields, no perspective depth and no realistic shading. Prussian blue laid in banded gradients for sky and water. Bold composition with the subject often cropped by the frame edge, cloud patterns and a signature cartouche in the open space.',
    sw: ['#E8DFC8', '#2A5A8C', '#C4483A'],
  },
  {
    id: 's-art-nouveau',
    n: '新藝術裝飾',
    e: 'Art Nouveau',
    f: 'art',
    k: '新藝術,裝飾,曲線,華麗',
    zh: '新藝術運動的裝飾風格：流動的有機曲線纏繞整個畫面，藤蔓、髮絲與衣褶連成一氣。主體被圓形或拱形的裝飾框包圍，框上有繁複的花草紋樣。色彩溫潤偏土，大量使用金線勾邊，構圖對稱而平面化。',
    en: 'Art Nouveau decorative style: flowing organic whiplash curves running through the whole composition, vines, hair and drapery merging into one continuous line. The subject enclosed in a circular or arched decorative frame carrying dense floral ornament. Muted earthy palette with generous gold outlining, symmetrical and flattened.',
    sw: ['#EFE4CE', '#7A8F5C', '#C49A3E'],
  },
  {
    id: 's-cubism',
    n: '立體派',
    e: 'Cubism',
    f: 'art',
    k: '立體派,幾何,解構,前衛',
    zh: '立體派：把對象拆解成幾何面，同時呈現正面、側面與背面等多個視角並拼貼在同一平面上。空間被壓平，前後景交錯咬合。色彩限制在赭黃、灰綠與棕黑之間，筆觸方正，邊界以直線切割。',
    en: 'Cubism: the subject fractured into geometric planes, front, side and back views presented simultaneously and collaged onto one surface. Space flattened so foreground and background interlock. Palette restricted to ochre, grey-green and umber, brushwork blocky, boundaries cut with straight edges.',
    sw: ['#C4B896', '#6E7A5E', '#3A322A'],
  },
  {
    id: 's-surreal',
    n: '超現實主義',
    e: 'Surrealism',
    f: 'art',
    k: '超現實,夢境,詭異,想像',
    zh: '超現實主義：用極度寫實的筆法畫出不可能的場景——物體漂浮、比例錯亂、日常事物出現在不該出現的地方。空間深遠空曠，地平線清楚，光源方向與陰影不合邏輯。畫面安靜卻令人不安。',
    en: 'Surrealism: impossible scenes rendered with meticulous realist technique — objects floating, scale dislocated, ordinary things appearing where they cannot belong. Deep empty space with a clear horizon, light direction and cast shadows that refuse to agree. Silent and quietly unsettling.',
    sw: ['#B8D0DE', '#D9A05B', '#3E4A5E'],
  },
  {
    id: 's-pointillism',
    n: '點描派',
    e: 'Pointillism',
    f: 'art',
    k: '點描,色點,細膩,光感',
    zh: '點描派：整幅畫由無數獨立的純色小圓點構成，不做任何混色，色彩在視網膜上自行合成。互補色的點並置在一起產生振動感。近看是點的海洋，退開幾步形體與光線才浮現。',
    en: 'Pointillism: the entire image built from countless discrete dots of unmixed pigment, the colour combining only on the retina. Complementary dots placed side by side to make the surface vibrate. Up close an ocean of dots; step back and form and light assemble themselves.',
    sw: ['#EDE4CE', '#4A7FBF', '#E0A83C'],
  },
  {
    id: 's-abstract-expr',
    n: '抽象表現',
    e: 'Abstract Expressionism',
    f: 'art',
    k: '抽象,潑灑,情緒,大膽',
    zh: '抽象表現主義：完全放棄具象，用潑灑、滴流與大筆刷的動作直接記錄情緒。顏料厚薄不一，有堆疊的肌理也有稀釋後的流淌。構圖沒有中心，滿版鋪陳，色彩衝突而強烈。',
    en: 'Abstract expressionism: representation abandoned entirely, emotion recorded directly through pouring, dripping and full-arm brushwork. Paint varying from thick impasto ridges to thin running washes. All-over composition with no focal centre, colours clashing at full strength.',
    sw: ['#F0EDE4', '#1F3A8A', '#D93A2B'],
  },

  // ── 3D · 立體 ───────────────────────────────────────────────────
  {
    id: 's-claymation',
    n: '黏土定格',
    e: 'Claymation',
    f: 'threed',
    k: '黏土,定格,手作,可愛',
    zh: '黏土定格動畫：所有東西都是手捏黏土做的，表面留著指紋、工具刮痕與細微的不平整。造型圓潤敦厚、比例誇張。棚內打光柔和，景深很淺，背景是實體搭建的小佈景，看得出材質是紙板與布料。',
    en: 'Stop-motion claymation: everything sculpted by hand in plasticine, surfaces holding fingerprints, tool marks and small irregularities. Rounded chunky forms with exaggerated proportions. Soft studio lighting, shallow depth of field, physically built miniature set where the cardboard and fabric are visible as such.',
    sw: ['#F2E0C8', '#E07A5F', '#81B29A'],
  },
  {
    id: 's-3d-cartoon',
    n: '圓潤3D動畫',
    e: 'Rounded 3D Animation',
    f: 'threed',
    k: '3D,動畫,可愛,渲染',
    zh: '劇場級 3D 動畫渲染：造型圓潤可愛、沒有銳角，眼睛大而濕潤有多層反光。次表面散射讓皮膚與耳朵透光，毛髮一根根分開有物理感。全域光照打底，補一盞暖色邊緣光。畫面乾淨明亮，質感細膩。',
    en: 'Feature-quality 3D animation render: rounded appealing forms with no sharp corners, large moist eyes carrying layered reflections. Subsurface scattering letting light through skin and ears, hair simulated strand by strand. Global illumination base with a warm rim light. Clean, bright, finely detailed.',
    sw: ['#DCE8F0', '#F2A65A', '#5B8FD9'],
  },
  {
    id: 's-isometric',
    n: '等距小場景',
    e: 'Isometric Diorama',
    f: 'threed',
    k: '等距,微縮,場景,精緻',
    zh: '等距視角的微縮場景：45 度俯視的等角投影，沒有透視收斂，遠近的線條保持平行。整個場景收在一個圓角方塊或漂浮的小島上，邊緣乾淨切齊。物件小巧精緻、色彩明亮，柔和的環境光加一點環境遮蔽。',
    en: 'Isometric miniature diorama: 45-degree axonometric projection with no perspective convergence, parallel lines staying parallel at any depth. The whole scene contained on a rounded cube or floating island with cleanly cut edges. Tiny precise props, bright colour, soft ambient light with gentle occlusion.',
    sw: ['#E8EDF2', '#6EA8D9', '#F2C063'],
  },
  {
    id: 's-figure',
    n: '公仔盲盒',
    e: 'Designer Toy',
    f: 'threed',
    k: '公仔,盲盒,PVC,收藏',
    zh: '設計師公仔的產品照：PVC 材質的霧面塗裝，表面有極細的顆粒感與均勻的分模線。二頭身比例、造型高度簡化。放在乾淨的展示台上，柔光箱打光，底部有淺淺的接觸陰影，像是官方的商品宣傳圖。',
    en: 'Designer vinyl toy product shot: matte PVC paint with a fine even micro-texture and a clean parting line. Two-head-tall proportions, forms heavily simplified. Staged on a clean display plinth under a light tent with a soft contact shadow beneath — an official product listing image.',
    sw: ['#F0F0EE', '#F28BA8', '#7ACBD9'],
  },
  {
    id: 's-glass',
    n: '玻璃質感',
    e: 'Glass Render',
    f: 'threed',
    k: '玻璃,透明,折射,質感',
    zh: '玻璃材質渲染：主體是半透明的實心玻璃，光線穿過時產生折射、色散與焦散光斑，內部可以看見扭曲的背景。邊緣厚處顏色濃、薄處近乎透明。表面有乾淨的高光反射，背景簡潔以突顯透光。',
    en: 'Glass material render: the subject cast in solid translucent glass, light refracting through it with dispersion and caustic patterns, the background visible and warped inside the form. Colour dense where the glass is thick, near-clear where it thins. Crisp specular highlights, minimal background so the transmission reads.',
    sw: ['#E4F0F2', '#7ED0D9', '#C9A8E8'],
  },
  {
    id: 's-lowpoly',
    n: '低多邊形',
    e: 'Low Poly',
    f: 'threed',
    k: '低模,幾何,簡約,遊戲',
    zh: '低多邊形 3D：形體由數量很少的三角面構成，每個面都是平塗的單色，面與面的交界清楚可見，完全不做平滑處理。色彩明快、階調分明，像折紙一樣有稜有角。背景同樣用大塊的多邊形處理。',
    en: 'Low poly 3D: forms built from a small number of triangular facets, each face flat-shaded in a single colour with the edges between them clearly visible and no smoothing at all. Bright colour in distinct steps, faceted like folded paper. Background handled in the same large polygonal blocks.',
    sw: ['#2E4057', '#4FA3A5', '#F2B84B'],
  },
  {
    id: 's-felt',
    n: '羊毛氈',
    e: 'Needle Felt',
    f: 'threed',
    k: '羊毛,毛氈,手作,溫暖',
    zh: '羊毛氈手作質感：表面覆滿蓬鬆的短纖維，邊緣毛茸茸不銳利，可以看見戳針留下的細微凹點。顏色是染過的毛線色，柔和不刺眼。造型圓胖樸拙，接縫處纖維自然融合，整體溫暖而有手作的不完美。',
    en: 'Needle-felted wool: the surface covered in soft fuzzy fibres, edges downy rather than crisp, tiny dimples left by the felting needle visible throughout. Dyed-yarn colours, gentle and never harsh. Plump naive forms with fibres blending naturally at the joins — warm, with the imperfection of handwork.',
    sw: ['#F2E8DC', '#D9846E', '#8FAF8F'],
  },
  {
    id: 's-papercraft',
    n: '紙藝摺紙',
    e: 'Papercraft',
    f: 'threed',
    k: '紙藝,摺紙,層次,手工',
    zh: '紙藝立體場景：所有物件都由裁切的卡紙折疊黏貼而成，可見清楚的摺線、切邊與紙張厚度。多層紙片疊出深度，每層之間有柔和的投影。紙面是霧面無反光的，色彩取自色紙的標準色。',
    en: 'Layered papercraft scene: every element cut, scored and folded from cardstock with visible crease lines, cut edges and paper thickness. Depth built from stacked layers casting soft shadows onto each other. Matte non-reflective paper surface, colours taken straight from a standard craft-paper range.',
    sw: ['#F7F2E8', '#E8A0A0', '#8FC4D9'],
  },

  // ── 復古懷舊 ────────────────────────────────────────────────────
  {
    id: 's-vaporwave',
    n: '蒸汽波',
    e: 'Vaporwave',
    f: 'retro',
    k: '80年代,粉紫,網格,懷舊',
    zh: '蒸汽波美學：桃紅與電紫的漸層天空，地平線上有一輪帶橫紋的巨大落日，地面是無限延伸的青色網格。點綴古典石膏像、棕櫚樹與早期電腦的視窗介面。色彩過飽和，帶有 VHS 的掃描線與色偏。',
    en: 'Vaporwave aesthetic: a magenta-to-violet gradient sky, a huge banded sun sitting on the horizon, an infinite cyan wireframe grid for ground. Classical plaster busts, palm trees and early GUI windows scattered through. Oversaturated colour with VHS scanlines and chroma bleed.',
    sw: ['#2A1B4A', '#F252A8', '#3FE0D0'],
  },
  {
    id: 's-90s-mag',
    n: '九〇年代雜誌',
    e: '90s Magazine',
    f: 'retro',
    k: '九零年代,雜誌,閃光燈,復古',
    zh: '九〇年代雜誌內頁的質感：直打閃光燈造成正面死白的曝光與身後一圈生硬的黑影。色彩偏暖偏黃，印刷網點在放大時清晰可見，紙張略微泛黃。構圖直接不做作，帶有那個年代特有的粗糙與自信。',
    en: 'Nineties magazine spread: direct on-camera flash blowing the subject flat and dropping a hard black shadow right behind them. Warm yellow-leaning colour, halftone rosettes visible on close inspection, paper slightly yellowed. Blunt unfussy framing with the coarse confidence of the era.',
    sw: ['#F0E4CC', '#D94F4F', '#3A6BA5'],
  },
  {
    id: 's-old-photo',
    n: '泛黃老照片',
    e: 'Faded Photograph',
    f: 'retro',
    k: '老照片,懷舊,泛黃,家族',
    zh: '收在抽屜幾十年的老照片：整體褪成偏黃的褐調，對比降低、暗部發灰，邊角有輕微的水漬與摺痕。表面有細小的刮痕與白色斑點，四周留著相紙的白框。人物姿態拘謹，像是特意去照相館拍的。',
    en: 'A photograph left in a drawer for decades: faded to a yellow-brown cast, contrast lowered, shadows gone grey, water staining and creases at the corners. Fine scratches and white speckling across the surface, a white print border all round. Stiff formal poses, as if taken at a portrait studio.',
    sw: ['#E0D2B8', '#A88C64', '#4A3E30'],
  },
  {
    id: 's-retro-poster',
    n: '復古印刷海報',
    e: 'Vintage Print Poster',
    f: 'retro',
    k: '海報,印刷,套色,旅遊',
    zh: '中世紀旅遊海報的印刷質感：三到四色平版套印，色塊之間有輕微的套印位移。色彩是低飽和的芥末黃、磚紅、鴨綠與米白。形體高度簡化成幾何色塊，天空用平行漸層帶處理，紙面有均勻的粗顆粒。',
    en: 'Mid-century travel poster printing: three or four flat lithographic inks with slight registration offset between plates. Muted mustard, brick red, teal and cream palette. Forms reduced to simplified geometric blocks, skies handled as banded gradients, an even coarse grain across the paper.',
    sw: ['#E8DCC0', '#C4623A', '#3E7A70'],
  },
  {
    id: 's-pixel',
    n: '像素藝術',
    e: 'Pixel Art',
    f: 'retro',
    k: '像素,遊戲,復古,點陣',
    zh: '點陣像素畫：解析度刻意壓得很低，每一個像素都清楚可見且對齊網格，絕不做抗鋸齒。色盤限制在十六色以內，用抖色網點表現漸層。輪廓用深色描邊，高光只點一兩格，造型在極少的格子裡交代清楚。',
    en: 'Pixel art: resolution deliberately kept low, every pixel visible and grid-aligned with no anti-aliasing whatsoever. Palette limited to sixteen colours, gradients faked with dithering. Dark outline pixels, highlights of only one or two cells, the whole form communicated within a tiny grid.',
    sw: ['#1A1C2C', '#41A6F6', '#F2C24B'],
  },
  {
    id: 's-vhs',
    n: 'VHS 錄影帶',
    e: 'VHS Tape',
    f: 'retro',
    k: 'VHS,錄影帶,雜訊,懷舊',
    zh: 'VHS 錄影帶轉錄的畫質：水平掃描線清楚可見，色彩溢出邊界形成紅藍鬼影，畫面偶爾跳動或出現橫向雜訊帶。解析度低、細節糊成一團，暗部有明顯的彩色噪點。角落壓著日期時間的疊字。',
    en: 'VHS tape transfer quality: horizontal scanlines clearly visible, chroma bleeding past edges into red and blue ghosting, occasional tracking jumps and noise bars. Low resolution with detail smeared, coloured noise crawling in the shadows. A timestamp overlay burned into the corner.',
    sw: ['#1A1A24', '#3A6BD9', '#E04A6E'],
  },

  // ── 平面設計 ────────────────────────────────────────────────────
  {
    id: 's-minimal',
    n: '極簡留白',
    e: 'Minimalist',
    f: 'graphic',
    k: '極簡,留白,乾淨,高級',
    zh: '極簡主義構圖：畫面九成以上是空的，主體極小地放在某個精準的位置上，靠大量留白產生張力。只用兩個顏色，其中一個是背景。沒有任何裝飾與紋理，邊界乾淨，一切多餘的都被拿掉。',
    en: 'Minimalist composition: over ninety percent of the frame left empty, the subject placed small and precisely so the negative space does the work. Two colours only, one of them the background. No ornament, no texture, clean edges, everything unnecessary removed.',
    sw: ['#F4F3F0', '#1A1A1A', '#D93A2B'],
  },
  {
    id: 's-brutalist',
    n: '粗野排版',
    e: 'Brutalist Type',
    f: 'graphic',
    k: '粗野,排版,強烈,前衛',
    zh: '粗野主義平面設計：超大尺寸的無襯線黑體字塞滿版面、甚至被邊界切斷。元素刻意錯位、重疊、對齊粗暴。只用黑白加一個高彩度的螢光色。沒有圓角沒有陰影，資訊層級靠尺寸的極端落差建立。',
    en: 'Brutalist graphic design: oversized grotesque sans-serif type filling the layout and running off the edge. Elements deliberately misaligned, overlapped and crudely snapped. Black and white plus a single fluorescent accent. No rounded corners, no shadows, hierarchy built purely from extreme size contrast.',
    sw: ['#0F0F0F', '#F2F2F2', '#D6F24B'],
  },
  {
    id: 's-memphis',
    n: '孟菲斯',
    e: 'Memphis Design',
    f: 'graphic',
    k: '孟菲斯,幾何,活潑,80年代',
    zh: '孟菲斯設計風格：不對稱的幾何色塊隨意散落，搭配鋸齒、圓點、波浪與斜線等圖案。色彩是高飽和的原色加粉色與黑白格紋，彼此衝突卻活潑。沒有透視也沒有陰影，一切都是平面的裝飾。',
    en: 'Memphis design: asymmetric geometric shapes scattered without a grid, mixed with squiggles, dots, waves and diagonal stripes. High-saturation primaries alongside pink and black-and-white checkerboard, clashing but playful. No perspective and no shadow — pure flat ornament.',
    sw: ['#F7F2E8', '#F24B7C', '#3ACBD9'],
  },
  {
    id: 's-bauhaus',
    n: '包浩斯幾何',
    e: 'Bauhaus',
    f: 'graphic',
    k: '包浩斯,幾何,原色,理性',
    zh: '包浩斯構成：只用圓形、三角形與正方形三種基本幾何，以及紅黃藍三原色加黑白。元素依照嚴謹的網格排列，比例經過計算。線條是等寬的粗黑線，畫面理性、平衡、功能導向，沒有任何裝飾。',
    en: 'Bauhaus composition: circle, triangle and square only, in red, yellow and blue plus black and white. Elements placed on a strict grid with calculated proportion. Uniform heavy black rules. Rational, balanced and function-led, with no ornament at all.',
    sw: ['#F0EDE4', '#D93A2B', '#2A5BD9'],
  },
  {
    id: 's-collage',
    n: '雜誌拼貼',
    e: 'Magazine Collage',
    f: 'graphic',
    k: '拼貼,剪貼,混搭,個性',
    zh: '手工雜誌拼貼：從不同印刷品剪下的碎片疊在一起，每一片都有手撕的毛邊或剪刀的直邊，以及底下紙片的投影。素材的網點、色調與年代都不一致，刻意不協調。上面用麥克筆手寫塗鴉與圈選。',
    en: 'Hand-cut magazine collage: fragments torn from different printed sources layered on top of each other, each with a ragged torn edge or a hard scissor cut and a shadow onto the piece below. The sources disagree in halftone, tone and era — deliberately mismatched. Marker scrawls and circling over the top.',
    sw: ['#E8E2D4', '#D94F3D', '#2E6E8C'],
  },
  {
    id: 's-infographic',
    n: '資訊圖表',
    e: 'Infographic',
    f: 'graphic',
    k: '圖表,說明,教學,清楚',
    zh: '資訊圖表插畫：以剖面圖或分解圖的方式呈現，各部位有引線與標籤說明。線條精準等寬，色彩克制、以功能區分而非美觀。背景乾淨，構圖依照閱讀順序安排，重點用單一強調色標出。',
    en: 'Infographic illustration: presented as a cutaway or exploded diagram with leader lines and labelled callouts. Precise uniform line weights, restrained colour assigned by function rather than taste. Clean background, layout ordered by reading sequence, key elements marked with a single accent colour.',
    sw: ['#F2F4F5', '#2E6E9E', '#E8913A'],
  },

  // ── 材質工藝 ────────────────────────────────────────────────────
  {
    id: 's-papercut',
    n: '剪紙層疊',
    e: 'Layered Papercut',
    f: 'craft',
    k: '剪紙,層次,光影,精緻',
    zh: '多層剪紙藝術：五到七層裁切好的紙片前後排開，每層之間留有間隙，光從側後方打進來在層與層之間投下柔和的漸層陰影。輪廓是精細的鏤空剪影，越靠後的層次顏色越深、細節越簡。',
    en: 'Multi-layer papercut: five to seven cut paper planes arranged front to back with air between them, light entering from behind and to one side casting soft graded shadows layer onto layer. Outlines are finely fretted silhouettes; the further back a layer sits the darker and simpler it becomes.',
    sw: ['#F7F0E4', '#E0A868', '#5B7A8C'],
  },
  {
    id: 's-embroidery',
    n: '刺繡布藝',
    e: 'Embroidery',
    f: 'craft',
    k: '刺繡,布料,手作,紋理',
    zh: '手工刺繡：圖案由一針一針的絲線構成，可以看清每條線的走向、光澤與微微的凸起。底布是織紋清楚的亞麻或帆布。緞面繡填滿色塊、輪廓用回針繡描邊，邊緣有細微的毛絮，整體厚實而溫暖。',
    en: 'Hand embroidery: the image built stitch by stitch in floss, individual threads readable by direction, sheen and slight relief above the surface. Ground fabric a coarse-weave linen or canvas. Satin stitch filling the shapes, backstitch outlining them, tiny fibres fraying at the edges — thick and warm.',
    sw: ['#E8E0CE', '#C4525E', '#4F7A6E'],
  },
  {
    id: 's-neon-tube',
    n: '霓虹燈管',
    e: 'Neon Tube',
    f: 'craft',
    k: '霓虹,燈管,發光,夜',
    zh: '實體霓虹燈管：圖案由一根連續彎折的玻璃燈管構成，線條等寬、轉角圓潤，看得見固定用的支架與電線。燈管本身核心是白熱的，向外暈成飽和的顏色並在牆面上打出一圈光暈。背景是深色的磚牆或暗室。',
    en: 'Real neon tubing: the image formed from one continuously bent glass tube of even width with rounded corners, mounting brackets and wiring visible. The tube core burns white and blooms outward into saturated colour, throwing a halo onto the wall behind. Dark brick or unlit room as background.',
    sw: ['#12131A', '#F23A8C', '#3AE0F2'],
  },
  {
    id: 's-liquid-metal',
    n: '液態金屬',
    e: 'Liquid Metal',
    f: 'craft',
    k: '金屬,反射,流動,未來',
    zh: '液態金屬材質：表面是完美的鏡面，把整個環境扭曲地映在上面，沒有自己的固有色。形體像水銀一樣流動、拉出圓潤的張力表面與細小的分離液滴。高光極亮且銳利，暗部映著環境的冷色。',
    en: 'Liquid metal material: a perfect mirror surface carrying a warped reflection of the whole environment and no local colour of its own. The form flows like mercury, pulled into rounded surface-tension curves with small separating droplets. Specular highlights blindingly sharp, shadows filled with cool reflected environment.',
    sw: ['#1A1E24', '#8C97A3', '#E4EAF0'],
  },
  {
    id: 's-ice-crystal',
    n: '冰雕水晶',
    e: 'Ice & Crystal',
    f: 'craft',
    k: '冰,水晶,透明,冷冽',
    zh: '冰雕與水晶質感：半透明的冰體內部有細密的氣泡與裂痕，光線穿透時折射出稜線與淡藍色的內部散射。表面覆著一層薄霜，摸過的地方是清透的。邊緣銳利如刀，逆光時整體發亮。',
    en: 'Ice and crystal material: translucent mass shot through with fine bubbles and internal fractures, light refracting along the edges and scattering pale blue inside. A thin layer of frost across the surface with clear patches where it has been touched. Blade-sharp edges, the whole form glowing when backlit.',
    sw: ['#E4F2F7', '#7EC4E0', '#2E5A7A'],
  },
  {
    id: 's-miniature',
    n: '微縮模型',
    e: 'Tilt-shift Miniature',
    f: 'craft',
    k: '微縮,移軸,玩具,俯視',
    zh: '移軸鏡的微縮效果：從高處俯視真實場景，但只有畫面中間一條窄帶是清楚的，上下兩端迅速模糊。飽和度與對比刻意調高，讓真實的建築與人群看起來像塑膠玩具模型。光線像棚燈一樣乾淨。',
    en: 'Tilt-shift miniature effect: a real scene viewed from high up with only a narrow horizontal band in focus, blurring away sharply above and below. Saturation and contrast pushed so genuine buildings and crowds read as plastic model toys. Light as clean as a studio set.',
    sw: ['#D9E4C8', '#E0A03C', '#4F7AA8'],
  },

  // ── 東方 · 在地 ─────────────────────────────────────────────────
  {
    id: 's-temple',
    n: '廟宇彩繪',
    e: 'Temple Painting',
    f: 'east',
    k: '台灣,廟宇,民俗,濃彩',
    zh: '台灣傳統廟宇彩繪：硃紅、金箔、靛藍與青綠的濃烈配色，線條用瀝粉堆起立體的金線。紋樣繁複對稱，充滿祥雲、龍鳳與花草。木構表面有歲月的斑駁與香火燻出的暗色，質地厚重而莊嚴。',
    en: 'Taiwanese temple decorative painting: an intense palette of cinnabar red, gold leaf, indigo and jade green, contours raised in relief with gilded piping. Dense symmetrical ornament packed with auspicious clouds, dragons, phoenixes and floral scrollwork. Aged flaking on the timber, darkened by decades of incense — heavy and solemn.',
    sw: ['#3A1410', '#C42A22', '#D9A62E'],
  },
  {
    id: 's-shanshui',
    n: '水墨山水',
    e: 'Shan Shui Landscape',
    f: 'east',
    k: '山水,水墨,留白,意境',
    zh: '傳統水墨山水：以皴法表現山石的紋理與體積，遠山用淡墨一抹帶過，雲霧全靠留白。畫面採三遠構圖，視點在畫中移動而非固定。松樹、亭台與小舟點景，尺度極小以顯山之大。',
    en: 'Traditional shan shui landscape: rock texture and mass built with cun brush strokes, distant peaks suggested with a single pale wash, mist rendered purely as untouched paper. Composed in shifting perspective so the eye travels through rather than stands still. Pines, a pavilion and a lone boat placed tiny to make the mountains vast.',
    sw: ['#F0EDE2', '#6E7A72', '#2A2E2C'],
  },
  {
    id: 's-gongbi',
    n: '工筆重彩',
    e: 'Gongbi Fine Brush',
    f: 'east',
    k: '工筆,細膩,重彩,古典',
    zh: '工筆重彩：極細的墨線勾勒輪廓，一絲不苟，之後以礦物顏料層層分染，色彩厚重而不透明。石青、石綠、硃砂與泥金為主色，衣紋與花瓣的層次一層層渲染出來。背景是絹本的暖米色。',
    en: 'Gongbi fine-brush painting: contours drawn in exacting hairline ink, then built up in repeated washes of mineral pigment, dense and opaque. Azurite, malachite, cinnabar and gold dominate; drapery folds and petals graded layer by layer. Warm cream silk ground behind.',
    sw: ['#EDE0C4', '#2E6E7A', '#C4402E'],
  },
  {
    id: 's-tw-signage',
    n: '台式復古招牌',
    e: 'Taiwan Retro Signage',
    f: 'east',
    k: '台灣,招牌,懷舊,街景',
    zh: '台灣老街的復古招牌美學：手寫的隸書或黑體壓克力字，紅底白字或黃底黑字，邊緣有日曬褪色與鏽蝕。鐵皮浪板、磨石子地與馬賽克磁磚是常見材質。日光燈管的冷白光，電線在畫面上方橫過。',
    en: 'Old Taiwanese street signage: hand-lettered clerical or gothic acrylic characters, white on red or black on yellow, edges sun-bleached and rust-bitten. Corrugated metal, terrazzo flooring and mosaic tile as the material vocabulary. Cold fluorescent tube light, power cables crossing overhead.',
    sw: ['#E8DFC8', '#C42A22', '#E0A81E'],
  },
  {
    id: 's-wafu',
    n: '和風紋樣',
    e: 'Japanese Wafu',
    f: 'east',
    k: '日式,紋樣,和風,雅致',
    zh: '日式和風設計：畫面以青海波、麻葉、七寶等傳統紋樣鋪底，構圖留白講究、重心偏一側。色彩取自傳統色名——藍鼠、朱華、萌黃、墨。金箔以不規則的碎片散落，紙面有和紙的纖維紋理。',
    en: 'Japanese wafu design: traditional seigaiha, asanoha and shippo patterns laid as ground, composition weighted to one side with considered empty space. Colours drawn from traditional names — ainezu, hanezu, moegi, sumi. Gold leaf scattered in irregular fragments, washi fibre texture across the surface.',
    sw: ['#F0EAD8', '#2E4A6E', '#C4523A'],
  },
  {
    id: 's-night-market',
    n: '夜市寫實',
    e: 'Night Market',
    f: 'east',
    k: '台灣,夜市,人情,熱鬧',
    zh: '台灣夜市的現場感：頭頂一排暖黃色的鎢絲燈泡與白色日光燈混雜，蒸氣與油煙在光束裡翻騰。攤位招牌、塑膠椅、不鏽鋼檯面與紅色塑膠碗擠滿畫面。人群動態模糊，色彩雜亂飽滿而有生活氣味。',
    en: 'Taiwanese night market on location: a canopy of warm tungsten bulbs mixed with cold fluorescent tubes overhead, steam and cooking smoke churning through the beams. Stall signage, plastic stools, stainless steel counters and red plastic bowls crowding the frame. Motion-blurred crowd, colour chaotic and saturated, thick with everyday life.',
    sw: ['#1A1410', '#E8A32E', '#D9402E'],
  },

  // ── 暗黑奇幻 ────────────────────────────────────────────────────
  {
    id: 's-dark-fantasy',
    n: '暗黑奇幻',
    e: 'Dark Fantasy',
    f: 'dark',
    k: '奇幻,史詩,黑暗,壯闊',
    zh: '暗黑奇幻概念藝術：陰沉的天空壓在低處，一道從雲隙漏下的冷光是唯一光源。盔甲、廢墟與枯枝的細節厚重，材質被雨水與泥濘浸透。色彩幾乎抽乾只剩灰藍與鏽褐，尺度刻意誇張以顯渺小。',
    en: 'Dark fantasy concept art: a heavy overcast sky pressed low, a single cold shaft breaking through the cloud as the only light. Armour, ruins and dead branches rendered with dense material detail, everything soaked in rain and mud. Colour nearly drained to grey-blue and rust, scale exaggerated to dwarf the figure.',
    sw: ['#141A1E', '#3E5259', '#A8703A'],
  },
  {
    id: 's-gothic',
    n: '哥德陰影',
    e: 'Gothic',
    f: 'dark',
    k: '哥德,陰森,華麗,黑色',
    zh: '哥德式風格：尖拱、彩繪玻璃與繁複的石雕構成場景，垂直線條把視線往上拉。燭光與月光是僅有的光源，陰影濃重而邊界柔和。色彩以黑、深紫與暗紅為主，質地華麗卻沉鬱。',
    en: 'Gothic style: pointed arches, stained glass and dense stone tracery framing the scene, vertical lines dragging the eye upward. Candlelight and moonlight the only sources, shadows deep with soft boundaries. Palette of black, deep violet and oxblood — ornate but sombre.',
    sw: ['#12101A', '#4A2E5B', '#8C2A3A'],
  },
  {
    id: 's-steampunk',
    n: '蒸汽龐克',
    e: 'Steampunk',
    f: 'dark',
    k: '蒸汽,黃銅,機械,維多利亞',
    zh: '蒸汽龐克：黃銅、紫檀木與皮革構成的維多利亞式機械，齒輪、壓力錶、鉚釘與銅管外露且真的能動。蒸汽從閥門噴出。色調偏暖褐與金屬光澤，光源是煤氣燈的橘黃色，畫面充滿工業質感。',
    en: 'Steampunk: Victorian machinery in brass, rosewood and leather, gears, pressure gauges, rivets and copper piping exposed and plausibly functional. Steam venting from valves. Warm brown and burnished-metal palette lit by the orange of gaslight, the frame dense with industrial texture.',
    sw: ['#241A12', '#A87A3A', '#D9B86E'],
  },
  {
    id: 's-space-opera',
    n: '太空歌劇',
    e: 'Space Opera',
    f: 'dark',
    k: '科幻,太空,壯闊,星雲',
    zh: '太空歌劇場景：巨大的星艦或行星佔據畫面一角以建立尺度感，背景是色彩瑰麗的星雲與密佈的星點。光源來自遠處的恆星，硬邊的高光與絕對死黑的陰影並存，因為真空中沒有散射。畫面遼闊而寂靜。',
    en: 'Space opera scene: a vast ship or planet occupying one corner to establish scale, a richly coloured nebula and dense starfield behind. Light from a distant sun giving hard-edged highlights against absolutely black shadows, because vacuum scatters nothing. Immense and silent.',
    sw: ['#080B1A', '#3A4FA8', '#D96E3A'],
  },

  // ── 夢幻清新 ────────────────────────────────────────────────────
  {
    id: 's-dreamy-pastel',
    n: '夢幻粉彩',
    e: 'Dreamy Pastel',
    f: 'dream',
    k: '夢幻,粉彩,柔和,少女',
    zh: '夢幻粉彩調：整體色彩調得極淡，粉紫、嫩粉、天藍與奶油白互相渲染，沒有純黑也沒有純白。光線柔軟得沒有方向，邊緣暈開帶著光暈。畫面漂浮著細小的光點與泡泡，像一場醒不來的午睡。',
    en: 'Dreamy pastel grade: the whole palette diluted to lilac, blush, sky blue and cream bleeding into each other, with no pure black and no pure white. Light so soft it has no direction, edges blooming into halation. Small motes and bubbles drifting through the frame, like a nap you never quite wake from.',
    sw: ['#F7E8F2', '#C4A8E0', '#A8D4E8'],
  },
  {
    id: 's-forest-light',
    n: '森林系自然光',
    e: 'Forest Daylight',
    f: 'dream',
    k: '自然,森林,綠意,清新',
    zh: '森林裡的自然光：陽光穿過層層樹葉在地面與主體上打出斑駁的光點，光束因為空氣中的花粉而可見。綠色有從黃綠到墨綠的完整層次，陰影是通透的綠而非灰。空氣濕潤，遠景有輕微的霧。',
    en: 'Forest daylight: sun filtering through layers of leaves and dappling the ground and the subject, the beams made visible by pollen in the air. Greens carrying a full range from yellow-green to deep pine, shadows luminous green rather than grey. Humid air with light mist in the distance.',
    sw: ['#1E3A24', '#6EA84F', '#E0E8B8'],
  },
  {
    id: 's-aurora',
    n: '極光夢境',
    e: 'Aurora Dream',
    f: 'dream',
    k: '極光,夜空,夢幻,冷色',
    zh: '極光夜空：青綠與紫紅的光帶在夜空中垂落、扭轉，亮度足以照亮地面的雪與水面的倒影。星星在光帶之間透出來。地景壓成深藍色的剪影，色溫極冷，只有極光本身是暖色的補色。',
    en: 'Aurora night sky: curtains of green and violet light falling and twisting overhead, bright enough to illuminate snow on the ground and its reflection in still water. Stars showing through the gaps. The landscape reduced to a deep blue silhouette, colour temperature ice-cold, the aurora the only warm complement.',
    sw: ['#0A142A', '#3AD9A0', '#A85BD9'],
  },
  {
    id: 's-dried-flower',
    n: '乾燥花柔霧',
    e: 'Dried Flower Haze',
    f: 'dream',
    k: '乾燥花,柔霧,文青,溫柔',
    zh: '乾燥花般的柔霧色調：飽和度壓低、黑位提亮成灰霧，整體染上一層米褐與灰粉。窗簾濾過的光線柔軟均勻，對比極低。畫面帶著紙質的顆粒感與輕微的漏光，安靜、乾燥、有點懷舊。',
    en: 'Dried-flower haze grade: saturation pulled down, blacks lifted into grey mist, the whole image tinted beige and dusty pink. Light filtered through a curtain, soft and even, contrast very low. Paper-like grain across the frame with a slight light leak — quiet, dry, faintly nostalgic.',
    sw: ['#EDE2D4', '#C4A594', '#8F9E8C'],
  },
];

export const STYLES: VisualStyle[] = [...POSTERS, ...CLAUSES];

/** Family key -> its glyph, for the tiles that have no saved image yet. */
const familyGlyph = new Map(FAMILIES.map((f) => [f.k, f.g]));

export function glyphOf(style: VisualStyle): string {
  return familyGlyph.get(style.f) ?? '◈';
}

export function familyOf(key: string): StyleFamily {
  return FAMILIES.find((f) => f.k === key) ?? { k: key, n: key, g: '◈' };
}

const styleById = new Map(STYLES.map((s) => [s.id, s]));

export function styleOf(id: string): VisualStyle | undefined {
  return styleById.get(id);
}

/** Split the comma-joined tag field, same contract as `tagsOf` for prompts. */
export function styleTags(style: VisualStyle): string[] {
  return style.k
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

export interface StyleComposeArgs {
  style: VisualStyle;
  /** What the user wants to draw. Blank is allowed — the style alone is still usable. */
  subject: string;
  lang: Lang;
  ratio?: string;
}

/**
 * Subject first, style second — for clause entries.
 *
 * The models weight the opening of a prompt most heavily, so the thing being drawn
 * has to lead; the style clause then modifies it. Firing a clause on its own (no
 * subject) is deliberately allowed — it reads as "make something in this style",
 * which is a legitimate way to explore what a style even looks like.
 *
 * Poster entries (`full`) invert this. They already name their subject, so the
 * prompt goes out untouched and a typed subject is appended as an override rather
 * than pushed in front — putting it first would fight the prompt's own opening line
 * and usually produces a worse image than either would alone.
 */
export function composeStyle({ style, subject, lang, ratio }: StyleComposeArgs): string {
  const zh = lang === 'zh';
  // Poster entries carry no Chinese body; fall back rather than emit an empty prompt.
  const body = (zh ? style.zh : style.en) || style.en || style.zh || '';
  const topic = subject.trim();

  let text: string;
  if (style.full) {
    text = topic ? `${body} Subject: ${topic}.` : body;
  } else if (!topic) {
    text = zh
      ? `請自由發揮一個最能展現這個風格的畫面。${body}`
      : `Create any subject that best demonstrates this style. ${body}`;
  } else {
    text = zh ? `${topic}。${body}` : `${topic}. ${body}`;
  }

  if (ratio) {
    // A full prompt is already English; keep the appended switch in the same language.
    text += zh && !style.full ? ` 畫面比例 ${ratio}。` : ` Aspect ratio ${ratio}.`;
  }
  return text;
}
