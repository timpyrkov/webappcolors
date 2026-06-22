/**
 * palettes.js — Compact palette seed data.
 *
 * Each palette has:
 *   - Five themed display names (gems, pigment, natural, flower, beverage)
 *   - A `main` hex colour whose hue/chroma tint backgrounds & neutrals
 *   - An `accents` array of 2–7+ hex colours driving accent and category generation
 */

export const PALETTES = {

  // ── 1. Ruby ───────────────────────────────────────────────────────
  // Noble reds on muted indigo-slate. Classic luxury pairing.
  ruby: {
    gems: "Ruby", pigment: "Carmine", natural: "Sunset", flower: "Rose", beverage: "Sangria",
    main:    "#363f6b",
    accents: ["#a2075c", "#e0494c"],
  },

  // ── 2. Gold ──────────────────────────────────────────────────────
  // Orange-to-gold on warm umber. Regal and warm.
  gold: {
    gems: "Gold", pigment: "Umber", natural: "Autumn", flower: "Marigold", beverage: "Brandy",
    main:    "#987b60",
    accents: ["#ff6e0b", "#f0c038"],
  },

  // ── 3. Anthracite ─────────────────────────────────────────────────
  // Orange-gold accents on dark olive-sage. Earthy and organic.
  anthracite: {
    gems: "Anthracite", pigment: "Charcoal", natural: "Spring", flower: "Sunflower", beverage: "Gin",
    main:    "#1d2019",
    accents: ["#ff6e0b", "#f0c038"],
  },

  // ── 4. Amber ──────────────────────────────────────────────────
  // Cyan → green → orange on neutral teal-grey. Jungle-botanical feel.
  amber: {
    gems: "Amber", pigment: "Sienna", natural: "Cyclone", flower: "Daisy", beverage: "Whisky",
    main:    "#3a4160",
    accents: ["#ff6e0b", "#f0c038"],
  },

  // ── 5. Diamond ───────────────────────────────────────────────────────
  // Orange-gold accents on steel muted navy. The default classic palette.
  diamond: {
    gems: "Diamond", pigment: "Slate", natural: "Typhoon", flower: "Magnolia", beverage: "Bourbon",
    main:    "#3a4160",
    accents: ["#d88b07", "#f0c038"],
  },

  // ── 6. Onyx ───────────────────────────────────────────────────────
  // Olive-green accents on coffee-brown. Earthy and grounded.
  onyx: {
    gems: "Onyx", pigment: "Khaki", natural: "Summer", flower: "Olive", beverage: "Cappuccino",
    main:    "#987b60",
    accents: ["#347a0d", "#a9ab00"],
  },

  // ── 7. Topaz ──────────────────────────────────────────────────────
  // Tron Legacy–inspired: bright cyan glow on dark steel-blue.
  topaz: {
    gems: "Topaz", pigment: "Turquoise", natural: "Lagoon", flower: "Agave", beverage: "Mojito",
    main:    "#26434c",
    accents: ["#26a8f1", "#00aaca", "#29bfb4","#24bcd0"],
  },

  // ── 8. Emerald ────────────────────────────────────────────────────
  // Violet-blue-to-teal on clinical blue-grey. Clinic/medical style.
  emerald: {
    gems: "Emerald", pigment: "Azure", natural: "Monsoon", flower: "Eucalyptus", beverage: "Absinthe",
    main:    "#344766",
    accents: ["#2870a8", "#38c0a8", "#0073c1", "#4e62b2"],
  },

  // ── 9. Sapphire ───────────────────────────────────────────────────
  // Blue-to-cyan on noble muted purple. Deep-sea elegance.
  sapphire: {
    gems: "Sapphire", pigment: "Indigo", natural: "Midnight", flower: "Lavender", beverage: "Curaçao",
    main:    "#362e4a",
    accents: ["#2858b0", "#48badc", "#a43391", "#7b53a3"],
  },

  // ── 10. Amethyst ──────────────────────────────────────────────────
  // Dark-pink-to-gold on deep purple. Rich and dramatic.
  amethyst: {
    gems: "Amethyst", pigment: "Tyrian", natural: "Twilight", flower: "Orchid", beverage: "Cognac",
    main:    "#3f2c52",
    accents: ["#a03068", "#d8a840", "#9e3f8d", "#2c0056"],
  },

  // ── 11. Opal ──────────────────────────────────────────────────────
  // Dark-pink-to-peach on muted slate-blue. Warm dusk glow.
  opal: {
    gems: "Opal", pigment: "Coral", natural: "Morning", flower: "Sakura", beverage: "Sake",
    main:    "#2c3a56",
    accents: ["#b03858", "#f0b090"],
  },

  // ── 12. Tourmaline ──────────────────────────────────────────────────
  // Pastel rainbow on pink-violet grey. Soft, luminous, feminine.
  tourmaline: {
    gems: "Tourmaline", pigment: "Lilac", natural: "Mist", flower: "Iris", beverage: "Baijiu",
    main:    "#584858",
    accents: ["#e27e0e", "#e6d62c", "#2891e5"],
  },

  // ── 13. Marble ────────────────────────────────────────────────────
  // Rose-to-teal on blue-grey. Hospital/healthcare style.
  marble: {
    gems: "Marble", pigment: "Cobalt", natural: "Dusk", flower: "Maple", beverage: "Cider",
    main:    "#6289ac",
    accents: ["#972351", "#b06255", "#44c0a4", "#008790"],
  },

  // ── 14. Agate ────────────────────────────────────────────────────
  // Monokai / Gruvbox–inspired: 7 explicit accent colours on warm olive-dark.
  agate: {
    gems: "Agate", pigment: "Sepia", natural: "Mountain", flower: "Oak", beverage: "Liquor",
    main:    "#72635b",
    accents: ["#fe8522", "#d8a429", "#babd2d", "#82b072", "#7b9b8f", "#b27182", "#fb5e4b"],
  },

  // ── 15. Quartz ───────────────────────────────────────────────────
  // Monochrome: all neutrals with minimal chroma. Subtle cool-steel tint.
  quartz: {
    gems: "Quartz", pigment: "Graphite", natural: "Arctic", flower: "Edelweiss", beverage: "Schnapps",
    main:    "#686868",
    accents: ["#404040", "#b8b8b8"],
  },
};

/**
 * Localized palette display names — all five categories.
 * Structure: { gems: { en, es, ... }, pigment: { ... }, natural: { ... }, flower: { ... }, beverage: { ... } }
 */
export const PALETTE_I18N = {
  ruby: {
    gems:     { en: "Ruby",       es: "Rubí",        it: "Rubino",      fr: "Rubis",       de: "Rubin",       ru: "Рубин",      ko: "루비",     ja: "ルビー",     zh: "红宝石" },
    pigment:  { en: "Carmine",    es: "Carmín",      it: "Carminio",    fr: "Carmin",      de: "Karmin",      ru: "Кармин",     ko: "카민",     ja: "カーマイン",  zh: "胭脂红" },
    natural:  { en: "Sunset",     es: "Atardecer",   it: "Tramonto",    fr: "Coucher",     de: "Sonnenuntergang", ru: "Закат",   ko: "석양",     ja: "夕焼け",    zh: "日落" },
    flower:   { en: "Rose",       es: "Rosa",        it: "Rosa",        fr: "Rose",        de: "Rose",        ru: "Роза",       ko: "장미",     ja: "バラ",      zh: "玫瑰" },
    beverage: { en: "Sangria",    es: "Sangría",     it: "Sangria",     fr: "Sangria",     de: "Sangria",     ru: "Сангрия",    ko: "상그리아",   ja: "サングリア",  zh: "桑格利亚" },
  },
  gold: {
    gems:     { en: "Gold",       es: "Oro",         it: "Oro",         fr: "Or",          de: "Gold",        ru: "Золото",     ko: "골드",     ja: "ゴールド",   zh: "黄金" },
    pigment:  { en: "Umber",      es: "Umbra",       it: "Ombra",       fr: "Ombre",       de: "Umbra",       ru: "Умбра",      ko: "엄버",     ja: "アンバー",   zh: "棕土" },
    natural:  { en: "Autumn",     es: "Otoño",       it: "Autunno",     fr: "Automne",     de: "Herbst",      ru: "Осень",      ko: "가을",     ja: "秋",        zh: "秋天" },
    flower:   { en: "Marigold",   es: "Caléndula",   it: "Calendula",   fr: "Souci",       de: "Ringelblume", ru: "Календула",  ko: "금잔화",    ja: "マリーゴールド", zh: "万寿菊" },
    beverage: { en: "Brandy",     es: "Brandy",      it: "Brandy",      fr: "Brandy",      de: "Weinbrand",   ru: "Бренди",     ko: "브랜디",    ja: "ブランデー",  zh: "白兰地" },
  },
  anthracite: {
    gems:     { en: "Anthracite", es: "Antracita",   it: "Antracite",   fr: "Anthracite",  de: "Anthrazit",   ru: "Антрацит",   ko: "무연탄",    ja: "無煙炭",    zh: "无烟煤" },
    pigment:  { en: "Charcoal",   es: "Carbón",      it: "Carbone",     fr: "Charbon",     de: "Kohle",       ru: "Уголь",      ko: "차콜",     ja: "チャコール",  zh: "炭黑" },
    natural:  { en: "Spring",     es: "Primavera",   it: "Primavera",   fr: "Printemps",   de: "Frühling",    ru: "Весна",      ko: "봄",       ja: "春",        zh: "春天" },
    flower:   { en: "Sunflower",  es: "Girasol",     it: "Girasole",    fr: "Tournesol",   de: "Sonnenblume", ru: "Подсолнух", ko: "해바라기",  ja: "向日葵",    zh: "向日葵" },
    beverage: { en: "Gin",        es: "Ginebra",     it: "Gin",         fr: "Gin",         de: "Gin",         ru: "Джин",       ko: "진",       ja: "ジン",      zh: "杜松子酒" },
  },
  amber: {
    gems:     { en: "Amber",      es: "Ámbar",       it: "Ambra",       fr: "Ambre",       de: "Bernstein",   ru: "Янтарь",     ko: "호박",     ja: "琥珀",      zh: "琥珀" },
    pigment:  { en: "Sienna",     es: "Siena",       it: "Siena",       fr: "Sienne",      de: "Siena",       ru: "Сиена",      ko: "시에나",    ja: "シエナ",     zh: "赭色" },
    natural:  { en: "Cyclone",    es: "Ciclón",      it: "Ciclone",     fr: "Cyclone",     de: "Zyklon",      ru: "Циклон",     ko: "회오리",     ja: "竜巻",      zh: "龙卷风" },
    flower:   { en: "Daisy",      es: "Margarita",   it: "Margherita",  fr: "Marguerite",  de: "Gänseblümchen", ru: "Ромашка",  ko: "데이지",    ja: "デイジー",   zh: "雏菊" },
    beverage: { en: "Whisky",     es: "Whisky",      it: "Whisky",      fr: "Whisky",      de: "Whisky",      ru: "Виски",      ko: "위스키",    ja: "ウイスキー",  zh: "威士忌" },
  },
  diamond: {
    gems:     { en: "Diamond",    es: "Diamante",    it: "Diamante",    fr: "Diamant",     de: "Diamant",     ru: "Алмаз",      ko: "다이아몬드",  ja: "ダイヤモンド", zh: "钻石" },
    pigment:  { en: "Slate",      es: "Pizarra",     it: "Ardesia",     fr: "Ardoise",     de: "Schiefer",    ru: "Сланец",     ko: "슬레이트",   ja: "スレート",   zh: "石板灰" },
    natural:  { en: "Typhoon",    es: "Tifón",       it: "Tifone",      fr: "Typhon",      de: "Taifun",      ru: "Тайфун",     ko: "태풍",     ja: "台風",      zh: "台风" },
    flower:   { en: "Magnolia",   es: "Magnolia",    it: "Magnolia",    fr: "Magnolia",    de: "Magnolie",    ru: "Магнолия",   ko: "백합",     ja: "Magnolia",  zh: "木兰" },
    beverage: { en: "Bourbon",    es: "Bourbon",     it: "Bourbon",     fr: "Bourbon",     de: "Bourbon",     ru: "Бурбон",     ko: "버번",     ja: "バーボン",   zh: "波旁" },
  },
  onyx: {
    gems:     { en: "Onyx",       es: "Ónix",        it: "Onice",       fr: "Onyx",        de: "Onyx",        ru: "Оникс",      ko: "오닉스",    ja: "オニキス",   zh: "玛瑙" },
    pigment:  { en: "Khaki",      es: "Caqui",       it: "Cachi",       fr: "Kaki",        de: "Khaki",       ru: "Хаки",       ko: "카키",     ja: "カーキ",     zh: "卡其" },
    natural:  { en: "Summer",     es: "Verano",      it: "Estate",      fr: "Été",         de: "Sommer",      ru: "Лето",       ko: "여름",     ja: "夏",        zh: "夏天" },
    flower:   { en: "Olive",      es: "Olivo",       it: "Olivo",       fr: "Olivier",     de: "Olive",       ru: "Олива",      ko: "올리브",    ja: "オリーブ",   zh: "橄榄" },
    beverage: { en: "Cappuccino", es: "Capuchino",   it: "Cappuccino",  fr: "Cappuccino",  de: "Cappuccino",  ru: "Капучино",   ko: "카푸치노",   ja: "カプチーノ",  zh: "卡布奇诺" },
  },
  topaz: {
    gems:     { en: "Topaz",      es: "Topacio",     it: "Topazio",     fr: "Topaze",      de: "Topas",       ru: "Топаз",      ko: "토파즈",    ja: "トパーズ",   zh: "黄玉" },
    pigment:  { en: "Turquoise",  es: "Turquesa",    it: "Turchese",    fr: "Turquoise",   de: "Türkis",      ru: "Бирюза",     ko: "터콰이즈",   ja: "ターコイズ",  zh: "绿松石" },
    natural:  { en: "Lagoon",     es: "Laguna",      it: "Laguna",      fr: "Lagon",       de: "Lagune",      ru: "Лагуна",     ko: "석호",     ja: "ラグーン",   zh: "泻湖" },
    flower:   { en: "Agave",      es: "Agave",       it: "Agave",       fr: "Agave",       de: "Agave",       ru: "Агава",      ko: "아가베",   ja: "アガベ",    zh: "龙舌兰" },
    beverage: { en: "Mojito",     es: "Mojito",      it: "Mojito",      fr: "Mojito",      de: "Mojito",      ru: "Мохито",     ko: "모히토",    ja: "モヒート",   zh: "莫吉托" },
  },
  emerald: {
    gems:     { en: "Emerald",    es: "Esmeralda",   it: "Smeraldo",    fr: "Émeraude",    de: "Smaragd",     ru: "Изумруд",    ko: "에메랄드",   ja: "エメラルド",  zh: "祖母绿" },
    pigment:  { en: "Azure",      es: "Azur",        it: "Azzurro",     fr: "Azur",        de: "Azur",        ru: "Лазурь",     ko: "애저",     ja: "アジュール",  zh: "蔚蓝" },
    natural:  { en: "Monsoon",    es: "Monzón",      it: "Monsone",     fr: "Mousson",     de: "Monsun",      ru: "Муссон",     ko: "몬순",     ja: "モンスーン",   zh: "季风" },
    flower:   { en: "Eucalyptus", es: "Eucalipto",   it: "Eucalipto",   fr: "Eucalyptus",  de: "Eukalyptus",  ru: "Эвкалипт",   ko: "유칼립투스",  ja: "ユーカリ",   zh: "桉树" },
    beverage: { en: "Absinthe",   es: "Absenta",     it: "Assenzio",    fr: "Absinthe",    de: "Absinth",     ru: "Абсент",     ko: "압생트",    ja: "アブサン",    zh: "苦艾酒" },
  },
  sapphire: {
    gems:     { en: "Sapphire",   es: "Zafiro",      it: "Zaffiro",     fr: "Saphir",      de: "Saphir",      ru: "Сапфир",     ko: "사파이어",   ja: "サファイア",  zh: "蓝宝石" },
    pigment:  { en: "Indigo",     es: "Índigo",      it: "Indaco",      fr: "Indigo",      de: "Indigo",      ru: "Индиго",     ko: "인디고",    ja: "インディゴ",  zh: "靛蓝" },
    natural:  { en: "Midnight",   es: "Medianoche",  it: "Mezzanotte",  fr: "Minuit",      de: "Mitternacht", ru: "Полночь",    ko: "자정",     ja: "真夜中",      zh: "午夜" },
    flower:   { en: "Lavender",   es: "Lavanda",     it: "Lavanda",     fr: "Lavande",     de: "Lavendel",    ru: "Лаванда",    ko: "라벤더",    ja: "ラベンダー",  zh: "薰衣草" },
    beverage: { en: "Curaçao",    es: "Curaçao",     it: "Curaçao",     fr: "Curaçao",     de: "Curaçao",     ru: "Кюрасао",    ko: "큐라소",    ja: "キュラソー",  zh: "库拉索" },
  },
  amethyst: {
    gems:     { en: "Amethyst",   es: "Amatista",    it: "Ametista",    fr: "Améthyste",   de: "Amethyst",    ru: "Аметист",    ko: "자수정",    ja: "アメジスト",  zh: "紫水晶" },
    pigment:  { en: "Tyrian",     es: "Púrpura",     it: "Porpora",     fr: "Pourpre",     de: "Purpur",      ru: "Пурпур",     ko: "퍼플",     ja: "パープル",    zh: "泰尔紫" },
    natural:  { en: "Twilight",   es: "Crepúsculo",  it: "Crepuscolo",  fr: "Crépuscule",  de: "Dämmerung",   ru: "Сумерки",    ko: "황혼",     ja: "黄昏",       zh: "黄昏" },
    flower:   { en: "Orchid",     es: "Orquídea",    it: "Orchidea",    fr: "Orchidée",    de: "Orchidee",    ru: "Орхидея",    ko: "난초",     ja: "ラン",       zh: "兰花" },
    beverage: { en: "Cognac",     es: "Coñac",       it: "Cognac",      fr: "Cognac",      de: "Cognac",      ru: "Коньяк",     ko: "코냑",     ja: "コニャック",  zh: "干邑" },
  },
  opal: {
    gems:     { en: "Opal",       es: "Ópalo",       it: "Opale",       fr: "Opale",       de: "Opal",        ru: "Опал",       ko: "오팔",     ja: "オパール",   zh: "蛋白石" },
    pigment:  { en: "Coral",      es: "Coral",       it: "Corallo",     fr: "Corail",      de: "Koralle",     ru: "Коралл",     ko: "코랄",     ja: "コーラル",   zh: "珊瑚" },
    natural:  { en: "Morning",    es: "Mañana",      it: "Mattina",     fr: "Matin",       de: "Morgen",      ru: "Утро",       ko: "아침",     ja: "朝",        zh: "清晨" },
    flower:   { en: "Sakura",     es: "Sakura",      it: "Sakura",      fr: "Sakura",      de: "Sakura",      ru: "Сакура",     ko: "벚꽃",     ja: "桜",        zh: "樱花" },
    beverage: { en: "Sake",       es: "Sake",        it: "Sake",        fr: "Saké",        de: "Sake",        ru: "Сакэ",       ko: "사케",     ja: "日本酒",     zh: "清酒" },
  },
  tourmaline: {
    gems:     { en: "Tourmaline", es: "Turmalina",   it: "Tormalina",   fr: "Tourmaline",  de: "Turmalin",   ru: "Турмалин",  ko: "토르말린",  ja: "トルマリン", zh: "碧玺" },
    pigment:  { en: "Lilac",      es: "Lila",        it: "Lilla",       fr: "Lilas",       de: "Flieder",     ru: "Сирень",     ko: "라일락",    ja: "ライラック",  zh: "丁香紫" },
    natural:  { en: "Mist",       es: "Niebla",      it: "Nebbia",      fr: "Brume",       de: "Nebel",       ru: "Туман",      ko: "안개",     ja: "霧",        zh: "薄雾" },
    flower:   { en: "Iris",       es: "Iris",        it: "Iris",        fr: "Iris",        de: "Iris",        ru: "Ирис",       ko: "아이리스",   ja: "アイリス",   zh: "鸢尾" },
    beverage: { en: "Baijiu",     es: "Baijiu",      it: "Baijiu",      fr: "Baijiu",      de: "Baijiu",      ru: "Байцзю",     ko: "바이주",     ja: "白酒",       zh: "白酒" },
  },
  marble: {
    gems:     { en: "Marble",     es: "Mármol",      it: "Marmo",       fr: "Marbre",      de: "Marmor",      ru: "Мрамор",     ko: "대리석",    ja: "マーブル",   zh: "大理石" },
    pigment:  { en: "Cobalt",     es: "Cobalto",     it: "Cobalto",     fr: "Cobalt",      de: "Kobalt",      ru: "Кобальт",    ko: "코발트",    ja: "コバルト",   zh: "钴蓝" },
    natural:  { en: "Dusk",       es: "Ocaso",       it: "Imbrunire",   fr: "Pénombre",    de: "Abendrot",    ru: "Сумрак",    ko: "노을",     ja: "夕暮れ",    zh: "暮色" },
    flower:   { en: "Maple",      es: "Arce",        it: "Acero",       fr: "Érable",      de: "Ahorn",       ru: "Клён",       ko: "단풍",     ja: "カエデ",    zh: "枫树" },
    beverage: { en: "Cider",      es: "Sidra",       it: "Sidro",       fr: "Cidre",       de: "Apfelwein",   ru: "Сидр",       ko: "사이다",    ja: "サイダー",   zh: "苹果酒" },
  },
  agate: {
    gems:     { en: "Agate",      es: "Ágata",       it: "Agata",       fr: "Agate",       de: "Agat",        ru: "Агат",       ko: "아가트",    ja: "アガート",   zh: "玛瑙" },
    pigment:  { en: "Sepia",      es: "Sepia",       it: "Seppia",      fr: "Sépia",       de: "Sepia",       ru: "Сепия",      ko: "세피아",    ja: "セピア",     zh: "深褐" },
    natural:  { en: "Mountain",   es: "Montaña",     it: "Montagna",    fr: "Montagne",    de: "Berg",        ru: "Горы",       ko: "산",       ja: "山",        zh: "山脉" },
    flower:   { en: "Oak",        es: "Roble",       it: "Quercia",     fr: "Chêne",       de: "Eiche",       ru: "Дуб",        ko: "참나무",    ja: "オーク",    zh: "橡树" },
    beverage: { en: "Liquor",     es: "Licor",       it: "Liquore",     fr: "Liqueur",     de: "Likör",       ru: "Ликёр",      ko: "리큐르",    ja: "リキュール",  zh: "利口酒" },
  },
  quartz: {
    gems:     { en: "Quartz",     es: "Cuarzo",      it: "Quarzo",      fr: "Quartz",      de: "Quarz",       ru: "Кварц",      ko: "석영",     ja: "クォーツ",   zh: "石英" },
    pigment:  { en: "Graphite",   es: "Grafito",     it: "Grafite",     fr: "Graphite",    de: "Graphit",     ru: "Графит",     ko: "그라파이트",  ja: "グラファイト", zh: "石墨" },
    natural:  { en: "Arctic",     es: "Ártico",      it: "Artico",      fr: "Arctique",    de: "Arktis",      ru: "Арктика",    ko: "북극",     ja: "北極",      zh: "北极" },
    flower:   { en: "Edelweiss",  es: "Edelweiss",   it: "Edelweiss",   fr: "Edelweiss",   de: "Edelweiß",    ru: "Эдельвейс",  ko: "에델바이스",  ja: "エーデルワイス", zh: "雪绒花" },
    beverage: { en: "Schnapps",   es: "Schnapps",    it: "Schnapps",    fr: "Schnapps",    de: "Schnaps",     ru: "Шнапс",      ko: "슈냅스",    ja: "シュナップス", zh: "杜松烧酒" },
  },
};

/** Ordered palette keys — matches the 5×3 grid layout (warm → cool → neutral). */
export const PALETTE_ORDER = [
  "ruby",      "gold",     "anthracite",     "amber",     "diamond",
  "onyx",      "topaz",    "emerald",        "sapphire",  "amethyst",
  "opal",      "tourmaline", "marble",       "agate",     "quartz",
];

/** Default palette key. */
export const DEFAULT_PALETTE = "amber";
