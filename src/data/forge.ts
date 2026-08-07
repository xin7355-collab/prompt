/**
 * 角色工坊 — the option axes a virtual character is built from.
 *
 * Each axis is one decision (gender, build, wardrobe, footwear, pose…). The forge
 * composes the picks into one bilingual prompt, so the user never writes a character
 * sheet by hand. Options are stored as [zh, en] the same way MODIFIERS are, because the
 * English wording is what actually drives the model — it is written with the vocabulary
 * these models were trained on, not machine-translated from the Chinese.
 */

export interface ForgeOption {
  /** Stable id, only needed where other axes branch on the choice. */
  id?: string;
  /** Chip label. */
  zh: string;
  en: string;
  /**
   * Wording used when composing the prompt, where the chip label would read badly in a
   * sentence — "青年（18–25）" is a good label but poor prose. Falls back to zh/en.
   */
  zhOut?: string;
  enOut?: string;
}

export interface ForgeAxis {
  key: string;
  /** Section heading in the UI. */
  label: string;
  hint?: string;
  /** Cannot be cleared — other axes branch on it. */
  required?: boolean;
  /** Several picks combine instead of replacing each other. */
  multi?: boolean;
  /** Restricts the axis to certain gender ids; omitted means always shown. */
  showForGender?: string[];
  options: ForgeOption[];
}

/**
 * Every generated prompt carries this. Body-proportion vocabulary only belongs on an
 * adult subject, so the age clause is not optional and not user-removable.
 */
export const FORGE_GUARD = {
  zh: '成年人物（18 歲以上）',
  en: 'an adult character (18+)',
};

export const FORGE_AXES: ForgeAxis[] = [
  {
    key: 'gender',
    label: '性別',
    required: true,
    options: [
      { id: 'female', zh: '女性', en: 'a woman' },
      { id: 'male', zh: '男性', en: 'a man' },
      { id: 'androgynous', zh: '中性', en: 'an androgynous person' },
    ],
  },
  {
    key: 'age',
    label: '年齡層',
    hint: '角色工坊只產出成年角色。',
    options: [
      { zh: '青年（18–25）', zhOut: '二十出頭', en: 'in their early twenties' },
      { zh: '成年（26–35）', zhOut: '三十上下', en: 'in their late twenties to mid thirties' },
      { zh: '輕熟（36–45）', zhOut: '四十上下', en: 'in their late thirties to mid forties' },
      { zh: '中年（46–60）', zhOut: '五十多歲', en: 'in their fifties' },
      { zh: '長者（60+）', zhOut: '六十歲以上', en: 'in their sixties or older' },
    ],
  },
  {
    key: 'ethnicity',
    label: '族裔外貌',
    options: [
      { zh: '東亞', en: 'East Asian features' },
      { zh: '東南亞', en: 'Southeast Asian features' },
      { zh: '南亞', en: 'South Asian features' },
      { zh: '中東', en: 'Middle Eastern features' },
      { zh: '非裔', en: 'Black features' },
      { zh: '拉丁裔', en: 'Latin American features' },
      { zh: '北歐', en: 'Northern European features' },
      { zh: '混血', en: 'mixed-heritage features' },
    ],
  },

  // ── 身形 ────────────────────────────────────────────────────────────
  {
    key: 'build',
    label: '體型',
    options: [
      { zh: '纖細', en: 'a slender build' },
      { zh: '苗條勻稱', en: 'a slim, balanced build' },
      { zh: '標準勻稱', en: 'an average, healthy build' },
      { zh: '運動員型', en: 'an athletic build' },
      { zh: '健美結實', en: 'a muscular, well-defined build' },
      { zh: '豐腴曲線', en: 'a full-figured, curvy build' },
      { zh: '高大魁梧', en: 'a tall, powerfully built frame' },
      { zh: '嬌小', en: 'a petite frame' },
      { zh: '瘦高', en: 'a tall, lean frame' },
      { zh: '壯碩厚實', en: 'a heavyset, sturdy frame' },
    ],
  },
  {
    key: 'muscle',
    label: '肌肉量',
    options: [
      { zh: '柔和無明顯肌肉', zhOut: '肌肉線條柔和不明顯', en: 'soft musculature, no visible definition' },
      { zh: '精瘦', zhOut: '肌肉精瘦', en: 'lean musculature' },
      { zh: '線條分明', zhOut: '肌肉線條分明', en: 'clearly defined muscle tone' },
      { zh: '結實有力', zhOut: '肌肉結實有力', en: 'firm, powerful musculature' },
      { zh: '高度發達', zhOut: '肌肉高度發達', en: 'highly developed musculature, bodybuilder physique' },
      { zh: '力量型厚肌', zhOut: '力量型厚實肌肉', en: 'thick strongman musculature' },
    ],
  },
  {
    key: 'height',
    label: '身高',
    options: [
      { zh: '嬌小（150–158）', en: 'short stature, around 155cm' },
      { zh: '中等（159–168）', en: 'average height, around 165cm' },
      { zh: '高（169–178）', en: 'tall, around 175cm' },
      { zh: '很高（179+）', en: 'very tall, over 180cm' },
    ],
  },
  {
    key: 'bust',
    label: '胸圍',
    hint: '身材比例描述，僅用於成年角色設定。',
    showForGender: ['female'],
    options: [
      { zh: '平坦', en: 'a flat chest' },
      { zh: '小', en: 'a small bust' },
      { zh: '中等', en: 'an average bust' },
      { zh: '豐滿', en: 'a full bust' },
      { zh: '非常豐滿', en: 'a very full bust' },
    ],
  },

  // ── 頭部 ────────────────────────────────────────────────────────────
  {
    key: 'face',
    label: '臉型',
    options: [
      { zh: '鵝蛋臉', en: 'an oval face' },
      { zh: '圓臉', en: 'a round face' },
      { zh: '方臉稜角分明', en: 'a square, angular face' },
      { zh: '瓜子臉', en: 'a heart-shaped face with a pointed chin' },
      { zh: '長臉', en: 'a long face' },
      { zh: '高顴骨', en: 'high, prominent cheekbones' },
    ],
  },
  {
    key: 'eyes',
    label: '眼睛',
    options: [
      { zh: '杏眼深褐', en: 'almond-shaped dark brown eyes' },
      { zh: '丹鳳眼', en: 'upturned phoenix eyes' },
      { zh: '圓大眼', en: 'large round eyes' },
      { zh: '細長眼', en: 'narrow, elongated eyes' },
      { zh: '淺色瞳（灰藍）', en: 'pale grey-blue eyes' },
      { zh: '琥珀色瞳', en: 'amber eyes' },
      { zh: '異色瞳', en: 'heterochromatic eyes' },
      { zh: '銳利鷹眼', en: 'sharp, hawk-like eyes' },
    ],
  },
  {
    key: 'hairLength',
    label: '髮長',
    options: [
      { zh: '及腰長髮', en: 'waist-length hair' },
      { zh: '及肩中長髮', en: 'shoulder-length hair' },
      { zh: '短髮', en: 'short hair' },
      { zh: '超短俐落', en: 'a close-cropped cut' },
      { zh: '光頭', en: 'a shaved head' },
    ],
  },
  {
    key: 'hairStyle',
    label: '髮型',
    options: [
      { zh: '柔順直髮', en: 'straight, sleek hair' },
      { zh: '大波浪捲', en: 'loose wavy curls' },
      { zh: '緊密捲髮', en: 'tight coiled curls' },
      { zh: '高馬尾', en: 'a high ponytail' },
      { zh: '丸子頭', en: 'a top bun' },
      { zh: '編織辮子', en: 'braided hair' },
      { zh: '雙麻花辮', en: 'twin braids' },
      { zh: '鮑伯頭', en: 'a blunt bob' },
      { zh: '狼尾頭', en: 'a wolf cut' },
      { zh: '龐克莫西干', en: 'a punk mohawk' },
      { zh: '油頭後梳', en: 'slicked-back hair' },
      { zh: '凌亂自然', en: 'tousled, undone hair' },
      { zh: '古典盤髮', en: 'an elaborate classical updo' },
      { zh: '髒辮', en: 'dreadlocks' },
    ],
  },
  {
    key: 'hairColor',
    label: '髮色',
    options: [
      { zh: '黑', zhOut: '黑色', en: 'black hair' },
      { zh: '深棕', zhOut: '深棕色', en: 'dark brown hair' },
      { zh: '亞麻棕', zhOut: '亞麻棕色', en: 'ash brown hair' },
      { zh: '金', zhOut: '金色', en: 'blonde hair' },
      { zh: '紅棕', zhOut: '紅棕色', en: 'auburn hair' },
      { zh: '銀白', zhOut: '銀白色', en: 'silver-white hair' },
      { zh: '挑染雙色', zhOut: '雙色挑染', en: 'two-tone dyed hair' },
      { zh: '霓虹染（粉／藍／紫）', zhOut: '霓虹粉藍紫', en: 'vivid dyed hair in pink, blue or purple' },
    ],
  },
  {
    key: 'facial',
    label: '臉部特徵',
    multi: true,
    options: [
      { zh: '雀斑', en: 'freckles' },
      { zh: '酒窩', en: 'dimples' },
      { zh: '淚痣', en: 'a beauty mark under the eye' },
      { zh: '疤痕', en: 'a facial scar' },
      { zh: '絡腮鬍', en: 'a full beard' },
      { zh: '短鬚渣', en: 'stubble' },
      { zh: '八字鬍', en: 'a moustache' },
      { zh: '眼鏡', en: 'glasses' },
      { zh: '耳環', en: 'earrings' },
      { zh: '鼻環', en: 'a nose ring' },
      { zh: '刺青', en: 'visible tattoos' },
      { zh: '濃妝', en: 'bold makeup' },
      { zh: '素顏', en: 'no makeup' },
    ],
  },

  // ── 服裝 ────────────────────────────────────────────────────────────
  {
    key: 'outfit',
    label: '服裝',
    options: [
      // 現代
      { zh: '現代休閒', en: 'modern casual clothing — jeans and a simple top' },
      { zh: '正式西裝', en: 'a sharply tailored formal suit' },
      { zh: '套裝襯衫（職場）', en: 'a business blazer and shirt' },
      { zh: '晚禮服', en: 'a floor-length evening gown' },
      { zh: '街頭潮流', en: 'oversized streetwear' },
      { zh: '機車皮衣', en: 'a leather biker jacket and boots' },
      { zh: '運動機能服', en: 'technical athletic wear' },
      { zh: '瑜伽服', en: 'fitted yoga wear' },
      { zh: '針織毛衣', en: 'a chunky knit sweater' },
      { zh: '風衣大衣', en: 'a long trench coat' },
      // 泳裝
      { zh: '比基尼泳裝', en: 'a bikini' },
      { zh: '連身泳裝', en: 'a one-piece swimsuit' },
      { zh: '衝浪防寒衣', en: 'a surfing wetsuit' },
      // 東方傳統
      { zh: '旗袍', en: 'a fitted qipao with mandarin collar and frog buttons' },
      { zh: '漢服', en: 'flowing Hanfu robes with wide sleeves' },
      { zh: '和服', en: 'a kimono with obi sash' },
      { zh: '韓服', en: 'a hanbok with a high-waisted skirt' },
      { zh: '唐裝', en: 'a Tang-style jacket' },
      { zh: '秀禾服（中式喜服）', en: 'an embroidered red Chinese wedding xiuhe robe' },
      { zh: '道袍', en: 'a Taoist priest robe' },
      // 戰甲
      { zh: '中世紀板甲', en: 'full medieval plate armour' },
      { zh: '皮革輕甲', en: 'studded leather light armour' },
      { zh: '鎖子甲', en: 'chainmail armour' },
      { zh: '武士鎧甲', en: 'a samurai o-yoroi armour set' },
      { zh: '中式將軍鎧', en: 'a Chinese general’s lamellar armour with shoulder guards' },
      { zh: '科幻動力裝甲', en: 'sci-fi powered exo-armour' },
      { zh: '未來戰術裝', en: 'futuristic tactical combat gear' },
      // 奇幻／職業
      { zh: '巫師長袍', en: 'a wizard robe with deep hood' },
      { zh: '刺客斗篷', en: 'a hooded assassin cloak' },
      { zh: '忍者裝束', en: 'a shinobi outfit with wrapped forearms' },
      { zh: '海盜服', en: 'a pirate coat and tricorn hat' },
      { zh: '蒸汽龐克', en: 'steampunk attire with brass goggles' },
      { zh: '賽博龐克', en: 'cyberpunk outfit with glowing circuitry' },
      { zh: '軍裝制服', en: 'a military dress uniform' },
      { zh: '白袍醫者', en: 'a medical white coat' },
      { zh: '廚師服', en: 'a chef’s jacket' },
      { zh: '學院制服', en: 'an academy school uniform' },
      { zh: '女僕裝', en: 'a maid outfit' },
      { zh: '舞者服裝', en: 'a dancer’s costume' },
    ],
  },
  {
    key: 'outfitColor',
    label: '服裝配色',
    options: [
      { zh: '素黑', zhOut: '黑色', en: 'in solid black' },
      { zh: '純白', zhOut: '白色', en: 'in white' },
      { zh: '正紅', zhOut: '正紅色', en: 'in crimson red' },
      { zh: '靛藍', zhOut: '靛藍色', en: 'in indigo blue' },
      { zh: '墨綠', zhOut: '墨綠色', en: 'in deep green' },
      { zh: '金銀鑲邊', zhOut: '金銀鑲邊的', en: 'trimmed with gold and silver' },
      { zh: '大地色系', zhOut: '大地色系的', en: 'in earth tones' },
      { zh: '粉彩色系', zhOut: '粉彩色系的', en: 'in pastel tones' },
      { zh: '螢光撞色', zhOut: '螢光撞色的', en: 'in clashing fluorescent colours' },
    ],
  },
  {
    key: 'footwear',
    label: '鞋履',
    options: [
      { zh: '赤腳', en: 'barefoot' },
      { zh: '高跟鞋', en: 'high heels' },
      { zh: '長筒靴', en: 'knee-high boots' },
      { zh: '軍靴', en: 'heavy combat boots' },
      { zh: '戰甲鐵靴', en: 'armoured sabatons' },
      { zh: '運動鞋', en: 'sneakers' },
      { zh: '皮鞋', en: 'polished leather dress shoes' },
      { zh: '涼鞋', en: 'sandals' },
      { zh: '繡花鞋', en: 'embroidered Chinese slippers' },
      { zh: '木屐', en: 'wooden geta' },
      { zh: '馬靴', en: 'riding boots' },
      { zh: '芭蕾舞鞋', en: 'ballet pointe shoes' },
    ],
  },
  {
    key: 'props',
    label: '配件道具',
    multi: true,
    options: [
      { zh: '長劍', en: 'holding a longsword' },
      { zh: '武士刀', en: 'holding a katana' },
      { zh: '長槍', en: 'holding a spear' },
      { zh: '弓箭', en: 'carrying a bow and quiver' },
      { zh: '法杖', en: 'holding a magic staff' },
      { zh: '盾牌', en: 'carrying a shield' },
      { zh: '摺扇', en: 'holding a folding fan' },
      { zh: '油紙傘', en: 'holding an oil-paper umbrella' },
      { zh: '書本', en: 'holding a book' },
      { zh: '樂器', en: 'holding a musical instrument' },
      { zh: '寵物同行', en: 'accompanied by an animal companion' },
      { zh: '披風', en: 'wearing a flowing cape' },
      { zh: '面具', en: 'wearing a mask' },
      { zh: '頭冠', en: 'wearing a crown or headdress' },
    ],
  },

  // ── 姿勢與氣質 ──────────────────────────────────────────────────────
  {
    key: 'pose',
    label: '姿勢',
    options: [
      { zh: '勇猛戰鬥架式', en: 'in a fierce combat stance, weapon raised' },
      { zh: '英雄挺立', en: 'standing tall in a heroic hero pose' },
      { zh: '嫵媚倚靠', en: 'leaning back gracefully with a sultry, poised expression' },
      { zh: '回眸一望', en: 'glancing back over one shoulder' },
      { zh: '瑜伽體式', en: 'holding a yoga asana with balanced form' },
      { zh: '冥想盤坐', en: 'seated cross-legged in meditation' },
      { zh: '奔跑衝刺', en: 'sprinting at full speed' },
      { zh: '躍起騰空', en: 'caught mid-leap in the air' },
      { zh: '抱胸站立', en: 'standing with arms crossed' },
      { zh: '單膝跪地', en: 'kneeling on one knee' },
      { zh: '倚牆而立', en: 'leaning casually against a wall' },
      { zh: '舞蹈旋轉', en: 'mid-turn in a dance movement' },
      { zh: '伸展舒展', en: 'stretching, body extended' },
      { zh: '坐姿放鬆', en: 'seated in a relaxed posture' },
      { zh: '走秀台步', en: 'striding down a runway' },
      { zh: '拔劍出鞘', en: 'drawing a blade from its sheath' },
      { zh: '施法起手式', en: 'channelling magic, hands raised' },
      { zh: '正面站姿（設定圖）', en: 'standing straight, front view, arms at sides, reference sheet pose' },
    ],
  },
  {
    key: 'mood',
    label: '神情氣質',
    options: [
      { zh: '冷冽威嚴', en: 'a cold, commanding expression' },
      { zh: '溫柔親和', en: 'a warm, gentle expression' },
      { zh: '嫵媚自信', en: 'an alluring, self-assured expression' },
      { zh: '堅毅果決', en: 'a determined, resolute expression' },
      { zh: '神秘難測', en: 'an enigmatic, unreadable expression' },
      { zh: '開朗大笑', en: 'laughing brightly' },
      { zh: '憂鬱沉思', en: 'a pensive, melancholy expression' },
      { zh: '桀驁不馴', en: 'a defiant, rebellious expression' },
      { zh: '天真純淨', en: 'an innocent, open expression' },
      { zh: '疲憊滄桑', en: 'a weary, weathered expression' },
    ],
  },

  // ── 呈現 ────────────────────────────────────────────────────────────
  {
    key: 'scene',
    label: '場景背景',
    options: [
      { zh: '純色去背（設定用）', en: 'against a plain solid-colour backdrop' },
      { zh: '棚拍灰底', en: 'in a studio against a grey seamless backdrop' },
      { zh: '古代宮殿', en: 'in an ancient palace hall' },
      { zh: '竹林', en: 'in a bamboo forest' },
      { zh: '雪山之巔', en: 'on a snow-covered mountain peak' },
      { zh: '戰場廢墟', en: 'on a ruined battlefield' },
      { zh: '霓虹雨夜街頭', en: 'on a neon-lit rain-slicked street' },
      { zh: '海灘', en: 'on a sunlit beach' },
      { zh: '森林深處', en: 'deep in an old forest' },
      { zh: '太空站內部', en: 'inside a space station' },
      { zh: '中式庭園', en: 'in a classical Chinese garden' },
      { zh: '圖書館', en: 'in a vast old library' },
      { zh: '瑜伽教室', en: 'in a bright yoga studio' },
      { zh: '都市天台', en: 'on a city rooftop at dusk' },
    ],
  },
  {
    key: 'shot',
    label: '取景',
    options: [
      { zh: '全身', en: 'full-body shot, head to feet in frame' },
      { zh: '七分身', en: 'three-quarter body shot' },
      { zh: '半身', en: 'waist-up shot' },
      { zh: '胸像特寫', en: 'bust portrait' },
      { zh: '大頭特寫', en: 'close-up head shot' },
      { zh: '三視圖（正／側／背）', en: 'character reference sheet: front, side and back views in a row, identical pose and lighting' },
      { zh: '表情九宮格', en: 'a 3x3 grid of the same character’s expressions, identical framing and lighting' },
    ],
  },
  {
    key: 'style',
    label: '畫風',
    options: [
      { zh: '照片級寫實', en: 'photorealistic, 85mm lens, shallow depth of field' },
      { zh: '日系動漫', en: 'Japanese anime illustration, clean linework and cel shading' },
      { zh: '韓漫 Webtoon', en: 'Korean webtoon style, soft gradient colouring' },
      { zh: '美式漫畫', en: 'American comic book style, bold inks and halftone' },
      { zh: '3D 遊戲角色', en: 'stylised 3D game character render, PBR materials' },
      { zh: '3D 動畫電影', en: '3D animated feature style, subsurface skin and soft rim light' },
      { zh: '概念設計稿', en: 'concept art, painterly rendering with visible brushwork' },
      { zh: '水彩插畫', en: 'watercolour illustration with soft bleeds' },
      { zh: '厚塗油畫', en: 'thick impasto oil painting' },
      { zh: '像素風', en: 'pixel art sprite' },
      { zh: '國風水墨', en: 'Chinese ink-wash painting style' },
      { zh: '扁平向量', en: 'flat vector illustration' },
    ],
  },
  {
    key: 'light',
    label: '光線',
    options: [
      { zh: '柔和棚燈', en: 'soft even studio lighting' },
      { zh: '黃金時刻', en: 'warm golden-hour light' },
      { zh: '逆光輪廓光', en: 'strong backlit rim lighting' },
      { zh: '林布蘭光', en: 'Rembrandt lighting' },
      { zh: '霓虹雙色光', en: 'magenta and cyan neon lighting' },
      { zh: '硬光高反差', en: 'hard directional light, high contrast' },
      { zh: '燭光', en: 'warm candlelight' },
      { zh: '冷月光', en: 'cool moonlight' },
    ],
  },
];

/** Axes that read best when a random draw fills them in. */
export const RANDOMISABLE = new Set([
  'gender', 'age', 'ethnicity', 'build', 'muscle', 'height', 'face', 'eyes',
  'hairLength', 'hairStyle', 'hairColor', 'outfit', 'outfitColor', 'footwear',
  'pose', 'mood', 'scene', 'shot', 'style', 'light',
]);
