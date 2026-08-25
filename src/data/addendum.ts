import type { Category, Pack, Prompt } from './types';

/**
 * Prompts added after the original corpus was extracted.
 *
 * Kept separate from assets/data/corpus.json so that file stays a faithful, regenerable
 * dump of the HTML prototype — re-running tools/extract-data.mjs must never clobber
 * work added later. corpus.ts merges the two.
 *
 * Ids are prefixed `x` so they cannot collide with the generated set.
 */

export const EXTRA_CATEGORIES: Category[] = [
  { id: 'tryon', zh: '試穿試髮·九宮格', en: 'TRY-ON GRID' },
  { id: 'figure', zh: '公仔·周邊模型', en: 'FIGURE' },
  { id: 'creative', zh: '創意·趣味企劃', en: 'PLAYFUL' },
  { id: 'consist', zh: '角色一致性·多視角', en: 'CHARACTER SHEET' },
  { id: 'apps', zh: 'AI 玩法·應用', en: 'PLAYBOOK' },
];

export const EXTRA_ACCENTS: Record<string, { light: string; dark: string }> = {
  tryon: { light: '#2F7D8C', dark: '#5FC2D2' },
  figure: { light: '#8A6D3B', dark: '#D6B173' },
  creative: { light: '#B5522E', dark: '#F09268' },
  consist: { light: '#3D6E4F', dark: '#7ED0A0' },
  apps: { light: '#6B4FA0', dark: '#B79BEA' },
};

const P = (i: string, c: string, t: string, k: string, zh: string, en: string): Prompt =>
  ({ i, c, t, k, zh, en });

/** The instruction that makes a grid actually comparable instead of nine unrelated images. */
const GRID_ZH =
  '以我上傳的照片為基準，完整保留人物的臉部特徵、五官比例、膚色與臉型，九格必須是同一個人、可辨識為本人。九格的臉部角度、表情、光線方向、背景與構圖完全相同，';
const GRID_EN =
  'Use my uploaded photo as the base and preserve the subject’s facial features, proportions, skin tone and face shape exactly — all nine cells must read as the same, recognisable person. Face angle, expression, lighting direction, background and framing are identical across all nine cells; ';

/**
 * The identity lock for a *character* rather than a photo of a person: same face, hair,
 * build, outfit and art style across every view. This is the backbone of the 多視角
 * turnaround / expression / pose sheets a modeller needs — one character, many angles,
 * nothing drifting between them. Route these to Gemini (Nano Banana), which holds a
 * character across angles better than the free Flux endpoint can.
 */
const CHAR_ZH =
  '以我上傳的角色圖為唯一基準，完整保留人物的臉部特徵、髮型、體型比例、服裝與配色，所有視角都必須是同一個角色、可辨識為同一人；維持一致的畫風、線條與上色方式，';
const CHAR_EN =
  'Use my uploaded character as the single source of truth and preserve the face, hairstyle, body proportions, outfit and colour scheme exactly — every view must read as the same, identifiable character; keep the art style, linework and shading consistent, ';

export const EXTRA_PROMPTS: Prompt[] = [
  // ── 試穿試髮 · 九宮格（圖生圖，先上傳自己的照片）──────────────────
  P('x101', 'tryon', '髮型九宮格·女', '髮型,試戴,九宮格,女',
    GRID_ZH + '唯一的差別是髮型：長直髮、大波浪捲、及肩鮑伯頭、高馬尾、丸子頭、法式編辮、空氣瀏海中長髮、狼尾層次短髮、俐落超短髮。3×3 排列，每格正面半身，淺灰無縫背景，柔和均勻打光，方便直接比較哪一款最適合本人。不要在畫面上加文字。',
    GRID_EN + 'the only difference is the hairstyle: long straight, loose waves, shoulder-length blunt bob, high ponytail, top bun, French braid, mid-length with wispy fringe, layered wolf cut, and a sharp pixie crop. Arrange as a 3x3 grid, each cell a front-facing half-body shot on a light grey seamless background with soft even lighting, so the options can be compared directly. No text in the image.'),

  P('x102', 'tryon', '髮型九宮格·男', '髮型,試戴,九宮格,男',
    GRID_ZH + '唯一的差別是髮型：俐落短髮、油頭後梳、韓系逗號瀏海、寸頭、中分中長髮、微捲紋理燙、飛機頭、兩側推高上留長、自然凌亂髮。3×3 排列，每格正面半身，淺灰無縫背景，柔和均勻打光，方便直接比較哪一款最適合本人。不要在畫面上加文字。',
    GRID_EN + 'the only difference is the hairstyle: a clean short cut, slicked back, Korean comma fringe, buzz cut, mid-length centre part, textured perm, pompadour, undercut with length on top, and natural tousled hair. Arrange as a 3x3 grid, each cell a front-facing half-body shot on a light grey seamless background with soft even lighting, so the options can be compared directly. No text in the image.'),

  P('x103', 'tryon', '髮色九宮格·女', '髮色,染髮,九宮格,女',
    GRID_ZH + '髮型完全相同，唯一的差別是髮色：自然黑、深棕、亞麻棕、蜂蜜金、奶茶色、玫瑰棕、灰霧藍、酒紅、銀白。3×3 排列，淺灰背景，柔和打光，色彩還原準確，方便比較哪個髮色最襯膚色。不要在畫面上加文字。',
    GRID_EN + 'the hairstyle is identical and only the hair colour changes: natural black, dark brown, ash brown, honey blonde, milk tea beige, rose brown, smoky blue-grey, wine red, and silver white. 3x3 grid, light grey background, soft lighting, accurate colour rendition so it is clear which shade suits the skin tone. No text in the image.'),

  P('x104', 'tryon', '髮色九宮格·男', '髮色,染髮,九宮格,男',
    GRID_ZH + '髮型完全相同，唯一的差別是髮色：自然黑、深棕、栗棕、亞麻灰、奶茶棕、墨綠黑、鐵灰、金棕、銀白。3×3 排列，淺灰背景，柔和打光，色彩還原準確。不要在畫面上加文字。',
    GRID_EN + 'the hairstyle is identical and only the hair colour changes: natural black, dark brown, chestnut, ash grey, milk tea brown, blue-black, steel grey, golden brown, and silver white. 3x3 grid, light grey background, soft lighting, accurate colour. No text in the image.'),

  P('x105', 'tryon', '穿搭九宮格·女', '穿搭,試穿,九宮格,女',
    GRID_ZH + '髮型與表情相同，唯一的差別是服裝：正式套裝、商務休閒、洋裝、牛仔休閒、針織毛衣、運動機能服、街頭潮流、晚禮服、亞麻度假風。3×3 排列，每格全身站姿，淺灰無縫背景，柔和均勻打光，服裝版型與材質清楚可辨，方便比較哪一套最適合本人。不要在畫面上加文字。',
    GRID_EN + 'hair and expression stay the same and only the outfit changes: a formal suit, business casual, a dress, denim casual, a knit sweater, technical sportswear, streetwear, an evening gown, and linen resort wear. 3x3 grid, each cell a full-body standing shot on a light grey seamless background with soft even lighting, garment cut and fabric clearly readable. No text in the image.'),

  P('x106', 'tryon', '穿搭九宮格·男', '穿搭,試穿,九宮格,男',
    GRID_ZH + '髮型與表情相同，唯一的差別是服裝：三件式西裝、商務休閒襯衫、素T牛仔、針織衫、機能運動服、街頭潮流、皮衣、亞麻度假風、長版大衣。3×3 排列，每格全身站姿，淺灰無縫背景，柔和均勻打光，服裝版型與材質清楚可辨。不要在畫面上加文字。',
    GRID_EN + 'hair and expression stay the same and only the outfit changes: a three-piece suit, business casual shirt, plain tee and jeans, a knit sweater, technical sportswear, streetwear, a leather jacket, linen resort wear, and a long overcoat. 3x3 grid, each cell a full-body standing shot on a light grey seamless background with soft even lighting, garment cut and fabric clearly readable. No text in the image.'),

  P('x107', 'tryon', '眼鏡九宮格', '眼鏡,配件,九宮格,實用',
    GRID_ZH + '唯一的差別是眼鏡框型：細金屬圓框、粗黑方框、半框、無框、貓眼框、飛行員框、透明膠框、玳瑁色方框、不戴眼鏡。3×3 排列，正面胸像特寫，柔和無反光的打光讓鏡片不擋住眼睛，方便比較哪一款最適合臉型。不要在畫面上加文字。',
    GRID_EN + 'the only difference is the eyewear: thin round metal, thick black square, half-rim, rimless, cat-eye, aviator, clear acetate, tortoiseshell square, and no glasses. 3x3 grid, front-facing bust portrait, soft lighting with no lens glare so the eyes stay visible. No text in the image.'),

  P('x108', 'tryon', '妝容九宮格·女', '妝容,美妝,九宮格,女',
    GRID_ZH + '髮型與服裝相同，唯一的差別是妝容：素顏裸妝、日常自然妝、韓系水光妝、歐美立體妝、復古紅唇、桃花腮紅妝、冷豔煙燻、清透男友妝、舞台濃妝。3×3 排列，正面胸像特寫，柔和棚燈，皮膚保留真實質感不過度磨皮。不要在畫面上加文字。',
    GRID_EN + 'hair and clothing stay the same and only the makeup changes: bare skin, everyday natural, Korean dewy, sculpted Western glam, retro red lip, peach blush, cool smoky eye, soft "boyfriend" makeup, and full stage makeup. 3x3 grid, front-facing bust portrait, soft studio light, skin texture preserved with no plastic smoothing. No text in the image.'),

  P('x109', 'tryon', '鬍型九宮格·男', '鬍型,造型,九宮格,男',
    GRID_ZH + '髮型與服裝相同，唯一的差別是鬍型：乾淨無鬍、短鬚渣、八字鬍、山羊鬍、絡腮短鬍、絡腮長鬍、落腮連鬢、只留下巴鬍、鬍渣加唇上鬍。3×3 排列，正面胸像特寫，側向柔光帶出鬍鬚質感。不要在畫面上加文字。',
    GRID_EN + 'hair and clothing stay the same and only the facial hair changes: clean shaven, light stubble, moustache, goatee, short full beard, long full beard, mutton chops, chin strap, and stubble with moustache. 3x3 grid, front-facing bust portrait, soft side light bringing out the hair texture. No text in the image.'),

  P('x110', 'tryon', '職業形象九宮格', '職業,形象,九宮格,實用',
    GRID_ZH + '唯一的差別是職業造型與制服：律師、醫師、主廚、工程師、教師、攝影師、健身教練、空服員、創業家。每格搭配該職業的服裝與一件代表性道具，背景維持同一片淺灰，3×3 排列，半身構圖。不要在畫面上加文字。',
    GRID_EN + 'the only difference is the profession and its uniform: lawyer, doctor, chef, engineer, teacher, photographer, personal trainer, flight attendant and founder. Each cell pairs the matching outfit with one signature prop, on the same light grey background, 3x3 grid, half-body framing. No text in the image.'),

  P('x111', 'tryon', '四季穿搭九宮格', '穿搭,四季,九宮格,實用',
    GRID_ZH + '唯一的差別是季節穿搭：初春薄外套、暮春針織、盛夏短袖、夏末亞麻、初秋風衣、深秋毛呢、初冬羽絨、隆冬大衣圍巾、換季洋蔥式。3×3 排列，全身站姿，同一片淺灰背景，方便規劃整年衣櫃。不要在畫面上加文字。',
    GRID_EN + 'the only difference is seasonal dressing: early spring light jacket, late spring knit, midsummer short sleeves, late summer linen, early autumn trench, late autumn wool, early winter down, deep winter coat and scarf, and transitional layering. 3x3 grid, full-body standing, same light grey background. No text in the image.'),

  P('x112', 'tryon', '髮長漸變六格', '髮型,長度,漸變,實用',
    GRID_ZH + '唯一的差別是頭髮長度，從短到長依序漸變：超短、耳下、及肩、鎖骨、胸前、及腰。六格橫向排列，臉與角度完全相同，淺灰背景，柔和打光，用來決定要留多長。不要在畫面上加文字。',
    GRID_EN + 'the only difference is hair length, progressing short to long: cropped, ear-length, shoulder, collarbone, chest and waist. Six cells in a row, face and angle identical, light grey background, soft lighting, for deciding how long to grow it. No text in the image.'),

  // ── 家庭 · 插畫 ────────────────────────────────────────────────
  P('x201', 'wedding', '一家四口韓系插畫', '全家福,插畫,韓系,手繪',
    '依照參考照片生成一家四口的插畫：韓系插畫風格，角色特徵鮮明、表情自然有情緒，全身構圖、姿態帶有動勢。服裝細節精緻，手繪塗鴉筆觸混合潑墨與隨性線條，粉彩與墨色交融，帶漫畫草稿的鉛筆質感。背景自然簡約，周圍點綴符號化的小元素（星點、線條、愛心）。氛圍感強、高細節、高品質，臉部五官刻畫細緻。',
    'Illustrate a family of four based on the reference photo: Korean illustration style, distinct character features, natural expressive faces, full-body composition with dynamic posture. Refined clothing detail, hand-drawn doodle strokes mixed with splashed ink and loose linework, pastel tones blended with ink, the texture of a pencilled comic rough. Simple natural background with small symbolic accents scattered around — stars, strokes, hearts. Strong atmosphere, high detail, high quality, with carefully rendered facial features.'),

  P('x202', 'wedding', '三代同堂插畫', '全家福,三代,插畫,溫馨',
    '依照參考照片生成三代同堂的插畫：{{人數}} 位家人依身高錯落排列，長輩坐前排、晚輩站後，每個人的年齡特徵與神情都清楚區分。溫暖的手繪水彩質感，柔和的紙紋與暈染，米棕與淡綠的和諧配色，背景為簡化的家屋輪廓，畫面留白舒服，情感真摯不煽情。',
    'Illustrate three generations from the reference photo: {{count}} family members arranged by height, elders seated in front and younger ones standing behind, each age and expression clearly distinguished. Warm hand-painted watercolour texture, soft paper grain and bleeds, a harmonious palette of beige, brown and pale green, a simplified house silhouette behind, comfortable negative space, sincere without sentimentality.'),

  // ── 港漫 × 重演繹（潮流）────────────────────────────────────────
  P('x301', 'trend', '港漫美學重演繹', '港漫,英雄,重演繹,誇張',
    '以 {{角色}} 為主題，用香港漫畫的美學重新演繹：極端誇張的透視與肌肉線條、粗獷有力的墨線與大量排線陰影、金屬光澤與能量特效交織、爆炸性的動態構圖，人物佔據畫面主導位置。電影級的戲劇打光，冷暖對撞的色彩分區，背景為破碎的城市或雷霆能量流。兼具優雅與壓迫感，雕塑般的瞬間定格。',
    'Reinterpret {{character}} through Hong Kong comic aesthetics: extreme foreshortening and exaggerated musculature, rugged forceful inking with dense hatching, metallic sheen woven with energy effects, explosive dynamic composition with the figure dominating the frame. Cinematic dramatic lighting, warm-cool colour blocking, a backdrop of shattered cityscape or surging lightning. Elegant and imposing at once, frozen like a sculpture mid-motion.'),

  P('x302', 'trend', '港漫·冷冽劍客', '港漫,劍,光影,史詩',
    '{{角色}} 的港漫式演繹：疾風般的劍光劃破未來都市，每一道劍勢都是精準的幾何構圖，冷冽的秩序與炙熱戰意在光影中交錯。長鏡頭般的史詩感、極深的景深壓縮、霓虹反射在濕潤路面，粗墨線與細密排線並用，藍紫冷調中一道熾白劍芒。',
    '{{character}} in the Hong Kong comic idiom: a blade-flash cutting through a future city, each sword line a precise geometric construction, cold order crossing with burning intent through the light. Epic long-lens feel, deeply compressed depth, neon reflected on wet asphalt, heavy ink outlines with fine hatching, a cool blue-violet grade split by one searing white arc.'),

  P('x303', 'trend', '港漫·孤膽英雄', '港漫,硝煙,寫實,滄桑',
    '{{角色}} 的港漫式演繹：硝煙、火光與殘破城市構築舞台，沒有華麗神話，只有歷經戰火淬鍊的意志。衣衫破損、滿身灰塵與汗水，誇張的仰角透視讓人物頂天立地，橘紅火光與深藍夜色對撞，粗獷墨線帶大量刮擦質感，電影級高反差打光。',
    '{{character}} in the Hong Kong comic idiom: smoke, firelight and a broken city as the stage — no glamour, only a will forged in combat. Torn clothing, dust and sweat, an exaggerated low angle making the figure tower, orange firelight clashing with deep blue night, rugged inking with heavy scratch texture, cinematic high-contrast lighting.'),

  P('x304', 'trend', '港漫·黑西裝殺神', '港漫,西裝,霓虹,冷峻',
    '{{角色}} 的港漫式演繹：黑色西裝化作戰甲，沉默即是武器。霓虹、雷電與能量洪流把城市渲染成壯闊舞台，人物步伐冷峻優雅，動作線條俐落無贅。暴烈與美學在同一畫面平衡，深黑與電光藍為主調，一抹血紅點綴，濕潤地面倒映全景。',
    '{{character}} in the Hong Kong comic idiom: a black suit worn as armour, silence as the sharpest weapon. Neon, lightning and surging energy render the city into a vast stage; the figure moves with cold elegance, every action line economical. Violence and beauty balanced in one frame, a palette of deep black and electric blue with one accent of blood red, the wet ground mirroring the whole scene.'),

  P('x305', 'trend', '東方武學×賽博龐克', '武學,賽博,反差,武器',
    '以 {{角色}} 為主題，用東方武學結合賽博龐克重新設計，並為其設計一件反差感十足的專屬武器（例如把傳統樂器、生活器物改造成戰鬥兵器）。剛猛的武學氣勢配上未來科技的光源與機械細節，霓虹與水墨感並存，人物氣場霸道而重情義。全身動態構圖，能量特效環繞，9:16 直式。',
    'Redesign {{character}} by fusing Eastern martial arts with cyberpunk, and give them a signature weapon built on deliberate contrast — a traditional instrument or everyday object reworked into a combat weapon. Fierce martial presence combined with futuristic light sources and mechanical detail, neon coexisting with ink-wash texture, a commanding yet loyal aura. Full-body dynamic composition ringed with energy effects, 9:16 vertical.'),

  P('x306', 'trend', '國潮神話重構', '國潮,神話,東方,華麗',
    '把 {{主題}} 重構成新國潮神話視覺：傳統紋樣以現代幾何手法重組，朱紅與靛藍鑲燙金線條，雲紋、山海與祥獸環繞，人物衣袂翻飛如壁畫飛天。金屬箔般的高光、對稱而莊嚴的構圖、大量留白克制不雜亂，古典符號與當代平面設計語言並置。',
    'Recast {{subject}} as contemporary Chinese-revival mythology: traditional motifs rebuilt with modern geometry, vermilion and indigo inlaid with gold linework, cloud scrolls, mountains-and-seas motifs and auspicious beasts circling, robes billowing like a mural apsara. Metallic-foil highlights, symmetrical solemn composition, disciplined negative space, classical symbols set against contemporary graphic design.'),

  // ── 貼圖 · 似顏繪 ──────────────────────────────────────────────
  P('x401', 'sticker', 'Q版似顏繪 16 張組', '貼圖,似顏繪,Q版,16張',
    '依照提供的人物形象，設計一組 16 張風格一致的專屬似顏繪貼圖。角色設定為「{{身分}}」，採用可愛精緻的 Q 版（chibi）風格，保留人物五官特色與辨識度。需具備：表情豐富情緒明確（開心、思考、驚訝、專注、加油），動作自然生動（揮手、比讚、旅行中、住宿中、靈感發想），並搭配情境元素（國外、國內、看海、海島、古蹟）。色彩乾淨柔和且具設計感，風格統一、角色比例一致，適用於簡報、社群與數位內容。可加簡短中英文字提升實用性。最終為 16 張完整排列，每張獨立可用，高解析度。',
    'From the supplied likeness, design a set of 16 style-consistent chibi caricature stickers. The character is "{{role}}", rendered in a cute, refined chibi style that keeps the person recognisable. The set needs: a full emotional range (happy, thinking, surprised, focused, cheering), lively natural actions (waving, thumbs up, travelling, checking in, having an idea), and travel context elements (abroad, domestic, sea view, islands, historic sites). Clean soft designed colour, one consistent style and body proportion throughout, suitable for slides, social posts and digital content. Short Chinese or English captions may be included. Deliver all 16 laid out together, each usable on its own, at high resolution.'),

  P('x402', 'sticker', '職場似顏繪 8 式', '貼圖,職場,似顏繪,實用',
    '依照提供的人物形象，設計 8 張職場情境的 Q 版似顏繪貼圖：開會發言、簡報中、趕稿加班、喝咖啡充電、收到讚美、被交辦、下班歡呼、遠端視訊。保留五官辨識度，二頭身圓潤造型，粗描邊、飽和平塗、透明背景，風格與線條粗細完全一致，縮到 100 像素仍可辨識。',
    'From the supplied likeness, design 8 chibi caricature stickers for workplace situations: speaking in a meeting, presenting, working late on a deadline, coffee break, receiving praise, being handed a task, cheering at clock-off, and on a video call. Keep the person recognisable, two-head-tall rounded proportions, bold outlines, saturated flat colour, transparent background, identical style and line weight, legible at 100 pixels.'),

  P('x403', 'sticker', '節慶似顏繪 8 式', '貼圖,節慶,似顏繪,應景',
    '依照提供的人物形象，設計 8 張節慶情境的 Q 版似顏繪貼圖：過年拜年、元宵提燈、端午划船、中秋賞月、萬聖裝扮、聖誕送禮、跨年倒數、生日慶祝。保留五官辨識度，每張搭配該節慶的小道具與應景配色，透明背景，風格統一。',
    'From the supplied likeness, design 8 chibi caricature stickers for festivals: Lunar New Year greeting, lantern festival, dragon boat, mid-autumn moon viewing, Halloween costume, Christmas gift, New Year countdown, and a birthday celebration. Keep the person recognisable, pair each with that festival’s props and palette, transparent background, one consistent style.'),

  // ── 公仔 · 周邊模型 ────────────────────────────────────────────
  P('x501', 'figure', 'PVC 公仔模型', '公仔,3D,模型,周邊',
    '用照片中的人像生成一個精緻可愛的 Q 版動漫風格 PVC 公仔模型，站在黑色圓形展示底座上。公仔頭頂上方掛著金屬鑰匙圈，連接兩條鮮豔的紅色織帶吊飾，織帶上印有醒目的白色大寫英文「{{文字}}」以及黃色塗鴉星星圖案。背景為模糊的現代辦公室或室內環境，光線明亮均勻。3D 渲染、模型攝影、高度細節、逼真的塑膠與金屬材質質感、微距拍攝、景深效果。',
    'Turn the person in the photo into a refined, cute chibi anime-style PVC figure standing on a round black display base. A metal keyring hangs above the figure carrying two vivid red lanyard straps printed with the bold white uppercase text "{{text}}" and a yellow doodle star. Background is a blurred modern office or interior, brightly and evenly lit. 3D render, product photography of a collectible figure, high detail, convincing plastic and metal materials, macro capture, shallow depth of field.'),

  P('x502', 'figure', '盒裝公仔開箱', '公仔,包裝,開箱,周邊',
    '用照片中的人像設計成盒裝公仔：透明開窗的彩盒立在木桌上，盒內是 {{角色}} 造型的公仔本體與可替換配件，盒面印有角色名稱與插畫。盒子半開，一隻手正把公仔取出。柔和的室內自然光，淺景深，真實的紙盒與吸塑內襯質感，開箱評測的臨場感。',
    'Design a boxed collectible from the person in the photo: a window-box package standing on a wooden desk, containing a figure of {{character}} plus swappable accessories, the box front printed with the character name and artwork. The lid is half open and a hand is lifting the figure out. Soft indoor daylight, shallow focus, believable cardboard and blister-tray materials, the immediacy of an unboxing review.'),

  P('x503', 'figure', '樹脂雕像級模型', '雕像,樹脂,精緻,收藏',
    '把 {{角色}} 做成高階樹脂收藏雕像：1/6 比例，動態底座帶場景元素，衣料褶皺與武器細節雕刻精細，塗裝有漸層與舊化處理，皮膚有半透光質感。深色背景加三點打光，長焦微距拍攝，展現收藏級的工藝質感。',
    'Render {{character}} as a high-end resin collectible statue: 1/6 scale on a dynamic scenic base, finely sculpted cloth folds and weapon detail, gradient paintwork with weathering, skin with a subtle translucency. Dark background with three-point lighting, telephoto macro capture, showing collector-grade craftsmanship.'),

  P('x504', 'figure', '扭蛋六款一排', '扭蛋,系列,公仔,可愛',
    '設計一整排六款的扭蛋公仔：同一個角色的六種造型（{{主題}}），二頭身、圓潤討喜、塗裝簡潔但辨識度高，並排站在白色檯面上，正面平視，均勻柔光，背景為淡色漸層。每一款姿勢與配件不同但風格完全統一，商品目錄的呈現方式。',
    'Design a row of six gashapon capsule figures: one character in six variants ({{theme}}), two-head-tall, rounded and appealing, simple but distinctive paintwork, lined up on a white surface, straight-on view, even soft light, pale gradient background. Each variant differs in pose and accessory while the style stays identical — a product catalogue presentation.'),

  // ── 創意 · 趣味企劃 ────────────────────────────────────────────
  P('x601', 'creative', '塗鴉影子搗蛋', '創意,影子,塗鴉,趣味',
    '一個調皮的塗鴉角色化身為我的影子，模仿著和我相同的服裝，卻擺出誇張滑稽的姿勢。影子是手繪塗鴉線條的質感，活潑俏皮、個性十足，與人物平靜的神態形成鮮明對比。人物臉上帶著困惑的表情。真實照片與手繪塗鴉混合，光線自然，影子落在牆面或地面上。',
    'A mischievous doodle character stands in as my shadow, wearing the same outfit but striking an exaggerated, comical pose. The shadow is drawn in hand-sketched doodle linework — lively, cheeky, full of personality — in sharp contrast with the subject’s calm demeanour. The person wears a puzzled expression. Real photography blended with hand-drawn doodle, natural lighting, the shadow falling across a wall or the floor.'),

  P('x602', 'creative', '與巨型機器人合照', '合成,機器人,合照,寫實',
    '一位人物（參考圖 1 的臉型與服飾）站在一具高聳、龐大、細節豐富的真人比例機器人前方中央，開心地擺出合照姿勢；機器人（參考圖 2 的機體，樣式不得更改）表面呈現飽經風霜的工業金屬質感，設計與顏色與參考照片完全一致，微微彎腰低頭看向鏡頭。使用佳能 EOS R5 與 16mm 鏡頭，仰視視角，三分法構圖，人物位於畫面左側四分之三處，開放式取景。正午陽光明媚、天空湛藍，電影感光線與強烈陰影。超寫實照片級效果，皮膚、服裝與機器人紋理細節豐富，焦點清晰，色彩自然，8K 解析度，比例 3:4。',
    'A person (face and clothing from reference image 1) stands centre-frame in front of a towering, massively detailed life-scale robot, posing happily for a photo. The robot (the mech from reference image 2, its design unchanged) has a weathered industrial metal surface, its design and colours matching the reference exactly, leaning down slightly to look into the lens. Shot on a Canon EOS R5 with a 16mm lens from a low angle, rule-of-thirds composition with the person at the left third, open framing. Bright midday sun and deep blue sky, cinematic light with strong shadows. Hyperreal photographic result, rich skin, fabric and metal texture, sharp focus, natural colour, 8K, 3:4 aspect.'),

  P('x603', 'creative', '迷你人在日常物件', '創意,微縮,趣味,想像',
    '微縮攝影風格：一群迷你小人在 {{日常物件}} 上工作與生活，比例誇張反差，小人有清楚的動作與表情。真實物件搭配微縮模型人偶，微距鏡頭極淺景深，柔和棚燈，色彩明亮乾淨，構圖留白，充滿童趣與想像力。',
    'Miniature photography: a crew of tiny people working and living on {{everyday object}}, the scale contrast played for effect, each figure with a clear action and expression. Real objects combined with model figurines, macro lens with very shallow depth of field, soft studio light, bright clean colour, generous negative space, playful and imaginative.'),

  P('x604', 'creative', '書頁裡跑出來', '創意,立體,書,奇幻',
    '一本攤開的書上，{{主題}} 的場景正從書頁裡立體地長出來：紙張捲曲成山巒與建築，角色與生物躍出紙面，仍保留紙質的白色與摺痕。柔和的桌燈光線在紙雕上投出細膩陰影，深色木桌背景，微距構圖，精緻的紙藝質感與童話感。',
    'An open book from which a scene of {{subject}} rises in three dimensions: the pages curl into mountains and buildings, characters and creatures leap off the paper while keeping the white stock and fold lines. A soft desk lamp casts fine shadows across the papercraft, dark wooden table behind, macro composition, exquisite paper-art craft and a storybook feel.'),

  P('x605', 'creative', '雙重曝光剪影', '創意,雙重曝光,剪影,藝術',
    '雙重曝光人像：人物的側面剪影中填滿 {{景象}}，輪廓邊緣清晰、內部景象細節豐富且與臉部結構呼應。單色乾淨背景，高對比，冷暖兩色系疊合，藝術海報質感，構圖留白充足。',
    'Double-exposure portrait: the subject’s profile silhouette is filled with {{scene}}, the outline crisp while the interior imagery is detailed and echoes the facial structure. Clean single-colour background, high contrast, two overlaid colour temperatures, art-poster quality, generous negative space.'),

  P('x606', 'creative', '產品擬人化', '創意,擬人,商品,趣味',
    '把 {{商品}} 擬人化成一個有個性的角色：保留商品的外型輪廓、材質與品牌配色作為角色的身體與服裝，加上四肢與表情，站在對應的使用情境中。3D 渲染、圓潤討喜的造型、柔和的棚拍打光、乾淨背景，適合作為品牌吉祥物提案。',
    'Anthropomorphise {{product}} into a character with personality: keep the product’s silhouette, materials and brand colours as the body and clothing, add limbs and a face, and place it in its matching use context. 3D render, rounded appealing design, soft studio lighting, clean background — suitable as a brand mascot proposal.'),

  // ── 藝術人像（風格）────────────────────────────────────────────
  P('x701', 'style', '彩色水墨人像', '水墨,水彩,東方,詩意',
    '以上傳照片為唯一主角，半身像，一手自然托腮，微微側身，眼神溫柔平靜，長髮帶些許自然散落的髮絲，五官精緻，肌膚白皙細膩。融合彩色水墨、透明水彩與細膩筆觸，墨色自然暈染，搭配藍、綠、米白與暖金的柔和色彩，保留留白與宣紙質感。畫面乾淨典雅，充滿詩意與藝術氛圍，自然柔光，美術館典藏風，細節豐富，色彩柔和，溫暖療癒。',
    'Using the uploaded photo as the sole subject: a half-length portrait, one hand resting against the cheek, body angled slightly, a gentle calm gaze, long hair with a few loose strands, refined features and fair, finely rendered skin. Colour ink-wash fused with transparent watercolour and delicate brushwork, ink bleeding naturally, a soft palette of blue, green, cream and warm gold, preserving negative space and rice-paper texture. Clean and elegant, poetic and painterly, soft natural light, gallery-collection quality, rich detail, gentle colour, warm and calming.'),

  P('x702', 'style', '古典油畫肖像', '油畫,古典,厚塗,質感',
    '將照片中的人物繪成古典油畫肖像：厚塗筆觸清晰可見，暗調背景中以單一側光雕塑臉部，林布蘭式的明暗處理，皮膚有溫暖的透光感，服裝改為深色天鵝絨或亞麻。畫布織紋與細微的顏料堆疊質感，赭石、土黃與深褐的沉穩色系，博物館典藏氛圍。',
    'Paint the person from the photo as a classical oil portrait: visible impasto brushwork, a single side light modelling the face out of a dark ground, Rembrandt-style chiaroscuro, skin with warm translucency, clothing changed to dark velvet or linen. Canvas weave and subtle paint build-up, a grounded palette of ochre, umber and deep brown, museum-collection atmosphere.'),

  P('x703', 'style', '低多邊形幾何', '幾何,低多邊,現代,設計',
    '把 {{主體}} 重繪成低多邊形（low poly）幾何風格：由清晰的三角面組成，每一面填單一平色，明暗以面的色階表現，輪廓仍清楚可辨。冷色調漸層背景，扁平無材質，現代設計感強烈，適合作為封面或桌布。',
    'Redraw {{subject}} in a low-poly geometric style: built from clean triangular facets, each filled with a single flat colour, light and shade expressed purely through facet tones, silhouette still clearly readable. Cool gradient background, flat and untextured, strongly contemporary, suitable as a cover or wallpaper.'),

  P('x704', 'style', '鉛筆素描稿', '素描,鉛筆,手繪,質感',
    '把 {{主體}} 畫成鉛筆素描：石墨線條的濃淡層次分明，排線與擦筆交替，保留起稿的輔助線與指印痕跡，紙張有明顯的紋理與邊角摺痕。單色灰階，重點區域加深、邊緣淡出，寫生本的真實感。',
    'Render {{subject}} as a pencil drawing: graded graphite values, hatching alternating with blending, construction lines and smudges left visible, the paper showing clear tooth and a creased corner. Monochrome greyscale, darkest at the focal point and fading at the edges, the honesty of a sketchbook page.'),

  P('x705', 'style', '剪紙分層立體', '剪紙,立體,層次,工藝',
    '把 {{主題}} 做成多層剪紙藝術：五到七層彩色紙張前後錯開形成景深，每層邊緣乾淨俐落，層與層之間有柔和投影。正面平視構圖，柔光讓層次分明，配色和諧遞進，工藝感精緻，適合作為封面插畫。',
    'Build {{subject}} as layered paper-cut art: five to seven sheets of coloured paper stacked with depth between them, every edge cleanly cut, soft shadows falling between layers. Straight-on composition, soft light separating the planes, a harmonious graded palette, refined craft feel, suited to a cover illustration.'),

  P('x706', 'style', '琉璃彩窗', '彩窗,教堂,光,華麗',
    '把 {{主題}} 繪成教堂彩繪玻璃：粗黑鉛條分割出色塊，每塊玻璃有不均勻的透光與氣泡質感，背光讓色彩飽和發亮。對稱莊嚴的構圖，藍、紅、金為主色，周圍以幾何花窗紋樣環繞，神聖而華麗。',
    'Render {{subject}} as a stained-glass window: heavy black leading dividing the colour fields, each pane with uneven translucency and bubbles, backlight making the colours glow. Symmetrical solemn composition, dominated by blue, red and gold, framed by geometric tracery, sacred and ornate.'),

  P('x707', 'style', '刺繡布面質感', '刺繡,織品,質感,手工',
    '把 {{主題}} 做成刺繡作品：可見一針一線的走向與絲線光澤，輪廓用鎖鏈繡、填色用緞面繡，底布為亞麻或帆布並有明顯織紋，邊緣留出繡框壓痕。柔和側光帶出線材的立體感，色彩飽和溫暖，手作的溫度。',
    'Render {{subject}} as embroidery: individual stitches and thread sheen visible, outlines in chain stitch and fills in satin stitch, on a linen or canvas ground with pronounced weave and a hoop impression at the edge. Soft side light bringing out the relief of the thread, warm saturated colour, the warmth of handwork.'),

  P('x708', 'style', '霓虹賽博人像', '賽博,霓虹,未來,人像',
    '把照片中的人物重繪成賽博龐克人像：臉部保留原本特徵，加上發光的電路紋路與全息投影介面，洋紅與青的雙色霓虹從側面打亮輪廓，背景是雨夜中模糊的招牌與飛行載具。輕微的色差與掃描線，濕潤反光的皮膚質感，未來感強烈但不失真實。',
    'Recast the person in the photo as a cyberpunk portrait: keep the original facial features and add glowing circuit tracery and a holographic interface, magenta and cyan neon rimming the profile from the sides, a rain-soaked night of blurred signage and passing aircraft behind. Slight chromatic aberration and scanlines, damp reflective skin, strongly futuristic yet still believable.'),

  P('x709', 'style', '文藝復興壁畫', '壁畫,古典,宗教,史詩',
    '把 {{主題}} 繪成文藝復興壁畫：濕壁畫的粉狀質感與細微龜裂，人物比例理想化、衣袍層次豐富，構圖依黃金比例安排，天光自上方灑落。赭紅、群青與金箔的古典配色，牆面有歲月斑駁，史詩而莊嚴。',
    'Paint {{subject}} as a Renaissance fresco: the chalky surface and fine craquelure of true fresco, idealised proportions and richly draped robes, composition laid out on the golden ratio, light falling from above. A classical palette of red ochre, ultramarine and gold leaf, the plaster weathered with age, epic and solemn.'),

  P('x710', 'style', '八〇年代雜誌', '復古,八零,雜誌,底片',
    '把 {{主體}} 拍成 1980 年代雜誌照片：柔焦濾鏡、高光暈開、飽和的洋紅與青色偏移，明顯的底片顆粒與輕微色偏，棚拍漸層背景布，蓬鬆的髮型與當年的服裝剪裁。構圖端正、打光甜美，帶著那個年代特有的樂觀氣息。',
    'Shoot {{subject}} as a 1980s magazine photograph: soft-focus filter, blooming highlights, saturated magenta and cyan shifts, pronounced film grain and a slight cast, a graduated studio backdrop, voluminous hair and period tailoring. Upright composition, sweet lighting, carrying that decade’s particular optimism.'),

  P('x711', 'style', '極光長曝風景', '風景,極光,長曝,壯闊',
    '{{地點}} 的極光長曝攝影：綠色與紫色的極光帶在天空流動成絲縷，前景的山形與湖面倒影清晰對稱，星軌隱約可見。長曝光讓水面平滑如鏡，超廣角構圖，天空佔三分之二，冷藍色調中一抹暖色人造光點，極高動態範圍。',
    'A long-exposure aurora photograph at {{location}}: green and violet curtains streaming across the sky, the foreground mountains mirrored symmetrically in a lake, faint star trails above. The long exposure smooths the water to glass, ultra-wide composition with sky filling two thirds, a cool blue grade broken by one warm artificial light, very high dynamic range.'),

  P('x712', 'style', '微縮移軸城市', '移軸,微縮,城市,俯瞰',
    '{{城市}} 的移軸微縮效果：從高處俯瞰，上下強烈虛化只留中央一條清晰帶，讓真實街景看起來像模型玩具。飽和度與對比提高，人車小巧鮮豔，正午高光，構圖俯角約 45 度，趣味與秩序感兼具。',
    'A tilt-shift miniature of {{city}}: seen from height with heavy blur above and below leaving one sharp band across the middle, so the real streetscape reads as a toy model. Raised saturation and contrast, tiny vivid people and vehicles, midday light, roughly a 45-degree downward angle, playful and orderly at once.'),

  // ── 生活 · 商業補充 ────────────────────────────────────────────
  P('x801', 'life', '一日生活紀錄六格', '生活,紀錄,系列,日常',
    '同一個人的一天，六格橫向排列：晨光中醒來、出門通勤、工作專注、午餐時刻、傍晚散步、夜晚放鬆。每格的光線色溫隨時間推移自然變化，構圖與色調維持一致的紀實風格，35mm 抓拍感，不擺拍，溫暖真實。',
    'One person’s day in six frames in a row: waking in morning light, commuting out, focused at work, lunch, an evening walk, and winding down at night. The colour temperature shifts naturally with the hour while framing and grade stay a consistent documentary style, 35mm candid feel, unposed, warm and true.'),

  P('x802', 'business', '個人品牌形象四式', '品牌,形象,系列,職場',
    '同一個人的品牌形象四連拍：正式大頭照、工作進行中的側拍、與人交談的互動照、環境全景中的人物。四張的服裝、髮型與色調完全一致，柔和的自然光加補光，背景為 {{場域}}，構圖專業，適合官網、簡報與社群的完整一套素材。',
    'A four-shot personal brand set of the same person: a formal headshot, a candid at work, an interaction shot mid-conversation, and an environmental wide with the person in place. Wardrobe, hair and grade identical across all four, soft daylight with fill, set in {{environment}}, professional framing — a complete kit for a website, deck and social profiles.'),

  P('x803', 'social', 'YouTube 縮圖三版', '縮圖,社群,測試,對照',
    '同一支影片主題 {{主題}} 的三種縮圖版本並列：一為人物大表情特寫加粗體標題留白區，二為畫面對比分割的前後對照，三為物件特寫加箭頭指引。三版都是 16:9、高飽和、主體佔比大、縮到手機尺寸仍清楚，用於 A/B 測試點擊率。',
    'Three thumbnail variants for the same video topic {{topic}}, side by side: one a large expressive face with a clear area for a bold headline, one a split before-and-after comparison, one an object close-up with a directional arrow. All three 16:9, highly saturated, subject filling the frame, still legible at phone size — for A/B testing click-through.'),

  // ── 角色一致性 · 多視角（圖生圖，先上傳角色圖；建議送 Gemini／Nano Banana）──────
  // For the owner's video / 3D-modelling work: one character locked, rotated and
  // re-posed across a sheet. Nano Banana holds identity across angles; Flux does not.
  P('x901', 'consist', '三視圖·建模設定稿', '三視圖,轉身,建模,3D,參考,一致性',
    CHAR_ZH + '產出角色三視圖設定稿：正面、正側面、背面三個視角並排，全身站姿、雙臂微張的 A-pose，相機為正交視角（無透視變形），三個視角的身高、比例與腳底基準線完全對齊，純白或淺灰無縫背景，均勻無陰影打光，方便直接用於 3D 建模與角色設定。不要在畫面上加任何文字或標註。',
    CHAR_EN + 'produce a character turnaround model sheet: front, straight-side and back views placed side by side, full-body A-pose with arms slightly away from the body, an orthographic camera with no perspective distortion, with height, proportion and ground baseline perfectly aligned across all three views, on a clean white or light-grey seamless background with flat even shadowless lighting, ready for 3D modelling and character setup. No text or labels in the image.'),

  P('x902', 'consist', '六視角·三六〇轉身表', '六視角,轉身,rotation,建模,參考,一致性',
    CHAR_ZH + '產出六視角轉身表：正面、左前四十五度、正側面、後側四十五度、背面、微俯視，六格排成 2×3，全身站姿、比例與服裝一致，正交視角，淺灰無縫背景，均勻打光，作為 360 度轉身與環繞建模參考。不要在畫面上加文字。',
    CHAR_EN + 'produce a six-view rotation sheet: front, front-three-quarter (45° left), straight side, back-three-quarter (45°), back and a slight top-down view, laid out as a 2x3 grid, full-body with consistent proportions and outfit, orthographic camera, light-grey seamless background, even lighting — a 360° turnaround reference for modelling. No text in the image.'),

  P('x903', 'consist', '表情表·九宮格', '表情,表情表,expression,一致性,參考',
    CHAR_ZH + '產出表情表：同一角色的頭部特寫九宮格，九種表情——中性、微笑、大笑、生氣、驚訝、難過、害羞、得意、疲憊，臉部角度、打光與髮型完全一致，只有表情改變，3×3 排列，淺灰背景。不要在畫面上加文字。',
    CHAR_EN + 'produce an expression sheet: a 3x3 grid of head close-ups of the same character showing nine expressions — neutral, smile, laugh, angry, surprised, sad, shy, smug and tired — with face angle, lighting and hairstyle identical and only the expression changing, on a light-grey background. No text in the image.'),

  P('x904', 'consist', '動作姿勢表·六式', '姿勢,動作,pose,動畫,參考,一致性',
    CHAR_ZH + '產出動作姿勢表：同一角色的全身六格，姿勢分別為站立 A-pose、行走、奔跑、坐下、揮手、戰鬥預備，畫風、服裝與比例一致，淺灰無縫背景，均勻打光，作為動畫與綁定的姿勢參考。不要在畫面上加文字。',
    CHAR_EN + 'produce a pose sheet: six full-body cells of the same character in a standing A-pose, walking, running, sitting, waving and a combat-ready stance, with art style, outfit and proportions consistent, on a light-grey seamless background with even lighting — a pose reference for animation and rigging. No text in the image.'),

  P('x905', 'consist', '多人合影·一致性技巧', '多人,合照,一致性,cast,命名,技巧',
    '多人一致性技巧：先把每個人的照片放在同一張圖上、並在每個人旁邊標註姓名再上傳，模型才不會混臉或多長出人來。以這張標註圖為唯一基準，完整保留每個人的臉部特徵並對應正確姓名，人數不增不減，讓這些人一起自然出現在同一個場景：{{場景，如：海邊咖啡廳的合影}}，光線與風格統一。',
    'Multi-person consistency trick: first place everyone’s photo onto one image and label each person with their name before uploading — this stops the model from blending faces or inventing extra people. Using that labelled sheet as the single source of truth, preserve each person’s face and keep the correct name-to-face mapping, add or remove nobody, and place them together naturally in one scene: {{scene, e.g. a seaside café group photo}}, with unified lighting and style.'),

  P('x906', 'consist', '角色多型態·命名圖鑑', '角色,變體,多型態,命名,一致性,IP',
    CHAR_ZH + '依這個角色的設計，衍生十種不同型態（可改變顏色、物種、大小或服裝主題），排成一張角色圖鑑，並替每一個型態命名（標題文字用繁體中文），整體畫風維持一致，可直接切成貼圖或周邊。',
    CHAR_EN + 'from this character’s design, derive ten different forms (varying colour, species, size or costume theme), lay them out as one character encyclopedia and give each form a name (captions in Traditional Chinese), keeping the overall art style consistent — ready to slice into stickers or merchandise.'),

  P('x907', 'consist', '換風格·保臉不變', '換風格,一致性,風格轉換,保臉',
    '以我上傳的照片為唯一基準，完整保留人物的臉部特徵、五官比例與姿勢，只把畫面風格改成 {{目標風格，如：二次元動畫／3D 卡通／賽博龐克}}，其餘的臉、姿勢、構圖與背景都不要改變，維持可辨識為同一個人。',
    'Use my uploaded photo as the single source of truth and fully preserve the face, feature proportions and pose; change only the visual style to {{target style, e.g. anime / 3D cartoon / cyberpunk}}, leaving the face, pose, composition and background unchanged, still recognisable as the same person.'),

  P('x908', 'consist', '一鍵專業形象照', '形象照,大頭照,證件照,職場,寫實',
    '以我上傳的正面清晰照片為唯一基準，完整保留本人臉部特徵，生成一張專業形象照：如同專業攝影棚拍攝，乾淨柔和的背景、柔和的棚燈與淺景深，得體的商務服裝，自然自信的表情，膚質保留真實質感、不要過度磨皮。',
    'Use my uploaded clear front-facing photo as the single source of truth and fully preserve my facial features; generate a professional headshot as if taken in a pro studio — clean soft background, soft studio lighting with shallow depth of field, tasteful business attire, a natural confident expression, and real skin texture with no plastic over-smoothing.'),

  // ── AI 玩法 · 應用（多為文字密集，建議送 Gemini／ChatGPT 生成，繁中較穩）──────
  P('x921', 'apps', '極簡品牌標誌', 'logo,標誌,品牌,極簡,設計',
    '設計一個極簡抽象的品牌標誌：概念是 {{品牌或概念}}，幾何形狀組合、造型簡化到極致，只使用這幾個顏色 {{色碼，如 #1E88E5 與純白}}，簡約現代 minimal tech 風格，置中構圖，純白或透明背景，不要多餘裝飾與文字說明。',
    'Design a minimal, abstract brand logo: the concept is {{brand or concept}}, built from combined geometric shapes reduced to the essentials, using only these colours {{hex codes, e.g. #1E88E5 and pure white}}, in a clean modern minimal-tech style, centred, on a pure white or transparent background, with no extra ornament or explanatory text.'),

  P('x922', 'apps', '電商商品詳情圖', '電商,商品,詳情頁,產品,行銷',
    '生成一張 {{產品名稱}} 的電商商品詳情圖：包含產品外觀主圖、三到四個主要賣點、規格參數表與一個使用情境，版面乾淨專業，所有文字使用正確的繁體中文，適合直接放到商品頁。',
    'Generate an e-commerce product detail image for {{product name}}: a hero shot of the product, three to four key selling points, a spec table and one usage scene, with a clean professional layout and all text in correct Traditional Chinese, ready to drop onto a product page.'),

  P('x923', 'apps', '漫畫分鏡·四頁', '漫畫,分鏡,故事,四頁,繁中',
    '畫出四頁連貫的日式漫畫，情節完整、分鏡清楚，每頁三到四格，對白使用正確的繁體中文，故事是：{{故事大綱}}。畫風統一，鏡頭有遠有近，情緒到位。',
    'Draw four connected pages of Japanese-style manga with a complete plot and clear panel layout, three to four panels per page, dialogue in correct Traditional Chinese, telling the story: {{story outline}}. Keep the art style consistent, vary the shot distance, and land the emotion.'),

  P('x924', 'apps', '知識圖鑑一張圖', '圖鑑,知識,資訊圖,教學,繁中',
    '製作一張知識圖鑑：主題是 {{主題，如：世界咖啡圖鑑／二十四節氣穿搭}}，日式雜誌排版，圖文並茂、條理分明，說明文字使用繁體中文，資訊密度高但版面清爽，解析度高。',
    'Create a single-image illustrated encyclopedia: the topic is {{topic, e.g. a world coffee guide / a 24-solar-terms outfit guide}}, in a Japanese-magazine layout, richly illustrated and well organised, with captions in Traditional Chinese, high information density but a clean layout, high resolution.'),

  P('x925', 'apps', '電影分鏡表·八格', '分鏡,storyboard,運鏡,影片,腳本',
    CHAR_ZH + '以這個角色為原型，製作八格電影分鏡表，每格包含鏡頭編號、構圖、運鏡、場景描述、角色動作與台詞（繁體中文），風格統一，主題是：{{主題}}。',
    CHAR_EN + 'using this character as the lead, make an eight-panel film storyboard where each panel carries a shot number, composition, camera move, scene description, character action and dialogue (in Traditional Chinese), in a consistent style, on the theme: {{theme}}.'),

  P('x926', 'apps', '藍圖風技術示意圖', '藍圖,技術圖,blueprint,產品,線稿',
    '根據我上傳的圖片，製作一張高度細節化的藍圖風格技術示意圖：乾淨俐落的藍色墨線線稿，背景為仿舊的米色工程用紙，標註主要尺寸、零件與剖面，排版嚴謹，像正式的工程圖。',
    'From my uploaded image, produce a highly detailed blueprint-style technical drawing: crisp blue ink line-work on an aged beige engineering-paper background, annotating the main dimensions, parts and a cross-section, rigorously laid out like a formal engineering drawing.'),

  P('x927', 'apps', 'IP 側臉世界觀海報', 'IP,海報,側臉,世界觀,收藏',
    '製作 {{IP 或主題}} 的收藏版海報：人物側臉剪影中生長出完整的世界觀與經典場景，整體偏電影海報質感，加上夢幻水彩插畫風，氛圍安靜宏大、神聖而懷舊，標題文字自然融入畫面。',
    'Make a collector’s poster for {{IP or theme}}: inside the silhouette of a character’s profile grows the full world and its iconic scenes, with an overall cinematic-poster quality plus a dreamy watercolour-illustration style, a quiet, grand, sacred and nostalgic mood, and the title text woven naturally into the image.'),

  P('x928', 'apps', '個人色彩分析報告', '色彩分析,個人色彩,穿搭,美妝,自拍',
    '以我上傳的自拍為基準，生成一份完整的個人色彩分析報告圖：判斷四季色彩型、最適合與應避免的顏色色票、以及妝容、髮色與穿搭建議，版面像時尚雜誌，所有文字使用繁體中文。',
    'Using my uploaded selfie as the base, generate a complete personal colour-analysis report image: identify the seasonal colour type, swatches of the most flattering and the colours to avoid, plus makeup, hair-colour and outfit advice, in a fashion-magazine layout with all text in Traditional Chinese.'),
];

export const EXTRA_PACKS: Pack[] = [
  {
    id: 'hair9f',
    n: '髮型試戴·女 9 款',
    hint: '一款一張，比九宮格更清楚',
    items: [
      ['長直髮', 'long straight hair'],
      ['大波浪捲', 'loose wavy curls'],
      ['及肩鮑伯頭', 'a shoulder-length blunt bob'],
      ['高馬尾', 'a high ponytail'],
      ['丸子頭', 'a top bun'],
      ['法式編辮', 'a French braid'],
      ['空氣瀏海中長髮', 'mid-length hair with a wispy fringe'],
      ['狼尾層次短髮', 'a layered wolf cut'],
      ['俐落超短髮', 'a sharp pixie crop'],
    ],
  },
  {
    id: 'hair9m',
    n: '髮型試戴·男 9 款',
    hint: '一款一張，比九宮格更清楚',
    items: [
      ['俐落短髮', 'a clean short cut'],
      ['油頭後梳', 'slicked-back hair'],
      ['韓系逗號瀏海', 'a Korean comma fringe'],
      ['寸頭', 'a buzz cut'],
      ['中分中長髮', 'mid-length with a centre part'],
      ['微捲紋理燙', 'a textured perm'],
      ['飛機頭', 'a pompadour'],
      ['兩側推高上留長', 'an undercut with length on top'],
      ['自然凌亂髮', 'natural tousled hair'],
    ],
  },
  {
    id: 'fit9f',
    n: '穿搭試穿·女 9 套',
    hint: '整櫃衣服一次試完',
    items: [
      ['正式套裝', 'a formal suit'],
      ['商務休閒', 'business casual'],
      ['洋裝', 'a dress'],
      ['牛仔休閒', 'denim casual'],
      ['針織毛衣', 'a knit sweater'],
      ['運動機能服', 'technical sportswear'],
      ['街頭潮流', 'streetwear'],
      ['晚禮服', 'an evening gown'],
      ['亞麻度假風', 'linen resort wear'],
    ],
  },
  {
    id: 'fit9m',
    n: '穿搭試穿·男 9 套',
    hint: '整櫃衣服一次試完',
    items: [
      ['三件式西裝', 'a three-piece suit'],
      ['商務休閒襯衫', 'a business casual shirt'],
      ['素T牛仔', 'a plain tee and jeans'],
      ['針織衫', 'a knit sweater'],
      ['機能運動服', 'technical sportswear'],
      ['街頭潮流', 'streetwear'],
      ['皮衣', 'a leather jacket'],
      ['亞麻度假風', 'linen resort wear'],
      ['長版大衣', 'a long overcoat'],
    ],
  },
  {
    id: 'hkhero6',
    n: '港漫英雄 6 式',
    hint: '同一角色的六種港漫演繹',
    items: [
      ['爆裂衝拳的瞬間', 'the instant of an exploding punch'],
      ['拔刀出鞘的殺氣', 'the killing intent of a blade half-drawn'],
      ['雨中負傷佇立', 'standing wounded in the rain'],
      ['背對火海回眸', 'glancing back against a wall of fire'],
      ['雷霆能量集中', 'gathering lightning energy'],
      ['勝利後的靜默', 'the silence after victory'],
    ],
  },
  {
    id: 'artstyle8',
    n: '藝術風格 8 連換',
    hint: '同一張臉跑八種畫風',
    items: [
      ['彩色水墨', 'colour ink-wash painting'],
      ['古典油畫', 'classical oil painting'],
      ['鉛筆素描', 'pencil drawing'],
      ['水彩', 'transparent watercolour'],
      ['低多邊形幾何', 'low-poly geometric'],
      ['剪紙分層', 'layered paper-cut'],
      ['刺繡布面', 'embroidery on linen'],
      ['彩繪玻璃', 'stained glass'],
    ],
  },
];
