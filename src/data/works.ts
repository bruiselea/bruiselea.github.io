export type WorkAsset = {
  type: "image" | "model";
  src: string;
  modelSrc?: string;
  scale: number;
  // Low-resolution sources render at their natural size instead of being upscaled.
  lowRes?: boolean;
  alt?: string;
  caption?: string;
};

export type Work = {
  id: string;
  index: string;
  symbol: string;
  slug: string;
  title: string;
  titleEn: string;
  category: "hardware" | "robotics" | "product" | "software" | "interaction";
  categoryLabel: string;
  summary: string;
  description: string;
  role: string[];
  tools: string[];
  accent: string;
  asset: WorkAsset;
  gallery?: { src: string; alt: string; caption: string }[];
  externalUrl?: string;
};

export const works: Work[] = [
  {
    id: "nib-housing",
    index: "01",
    symbol: "Nh",
    slug: "nib-housing-generator",
    title: "Nib Housing Generator",
    titleEn: "Nib Housing Generator",
    category: "software",
    categoryLabel: "CAD TOOL",
    summary: "万年筆のペン先ハウジングを、寸法編集から3D確認・書き出しまで一貫して設計するWebツール。",
    description:
      "Bock 250やJoWo #6を起点に、ペン先ハウジングの側面形状、ねじ、内径をパラメトリックに調整できるWebアプリです。肉厚を検証しながら3D形状と縦断面を確認し、編集可能なOpenSCADと3Dプリント用STLを書き出せます。",
    role: ["Product", "UI", "Parametric CAD", "3D", "Deployment"],
    tools: ["React", "Three.js", "OpenSCAD", "Cloudflare Workers"],
    accent: "#4f85d8",
    asset: {
      type: "image",
      src: "/works/nib-housing-generator/app.png",
      scale: 1,
      alt: "Nib Housing Generatorの寸法編集画面と3Dプレビュー",
      caption: "LIVE PRODUCT UI — PARAMETRIC NIB HOUSING / 3D PREVIEW",
    },
    externalUrl: "https://nib.nuunnu.com",
  },
  {
    id: "hours",
    index: "02",
    symbol: "10K",
    slug: "10000-hours",
    title: "10,000 Hours",
    titleEn: "Ten Thousand Hours",
    category: "software",
    categoryLabel: "iOS APP",
    summary: "ひとつの目標へ使った時間を、10,000時間まで静かに積み上げるiPhoneアプリ。",
    description:
      "ストップウォッチとカウントダウンで練習時間を記録し、履歴を編集しながら10,000時間までの進捗を確認できるiPhoneアプリです。計測データは端末内だけに保存します。",
    role: ["Product", "UI", "SwiftUI", "QA", "Release"],
    tools: ["SwiftUI", "Xcode", "TestFlight"],
    accent: "#f1f1ee",
    asset: {
      type: "image",
      src: "/works/10000-hours/app-icon.png",
      scale: 1.05,
      alt: "10,000 Hoursの白黒のアプリアイコン",
      caption: "APP ICON — 10,000 HOURS / iOS",
    },
  },
  {
    id: "keyboard",
    index: "03",
    symbol: "Kb",
    slug: "periodic-table-keyboard",
    title: "周期表キーボード",
    titleEn: "Periodic Table Keyboard",
    category: "hardware",
    categoryLabel: "HW",
    summary: "元素周期表の配置を、そのまま入力体験へ変換した自作キーボード。",
    description:
      "元素周期表のレイアウトをキー配列にした自作キーボードです。PCB設計、部品選定、THT手はんだ、ケース検討まで、物理と情報の境界を一貫して設計しています。",
    role: ["Concept", "PCB", "Electronics", "Modeling", "Prototype"],
    tools: ["KiCad", "PCB", "QMK", "3D Print"],
    accent: "#ff713f",
    asset: { type: "image", src: "/generated/kb-keycap.png", scale: 2.1 },
  },
  {
    id: "mi-band-stand",
    index: "04",
    symbol: "Mb",
    slug: "mi-band-charging-stand",
    title: "Mi Band 充電スタンド",
    titleEn: "Mi Band Charging Stand",
    category: "product",
    categoryLabel: "PRODUCT",
    summary: "Xiaomi Smart Band 8/9を、充電しながら机の上で時計として眺められる3Dプリント製スタンド。",
    description:
      "純正の充電器をヘッドにはめ込み、バンドを載せたまま充電と時刻表示ができるスタンドです。ヘッドと土台は直径13.2mmの球でつなぐ構造で、土台だけを自作して差し替えることもでき、ケーブルの向きに合わせてヘッドを2種類用意しています。MakerWorldで造形データを公開し（2024年12月・第2版）、評価4.4（15件）、レビュー22件をいただきました。組み立て時に細い軸が折れるという声が複数届いたため、現在は軸に鋼管を通して強度を上げる改良版を設計しています。",
    role: ["Product Design", "CAD", "Prototype", "Release", "Iteration"],
    tools: ["CAD", "3D Print", "PLA", "MakerWorld"],
    accent: "#3ddc97",
    asset: {
      type: "image",
      src: "/works/mi-band-stand/photo-1.webp",
      scale: 1,
      alt: "黒いスタンドに載せたXiaomi Smart Bandが充電中の画面を表示している写真",
      caption: "PHOTO — MI BAND CHARGING STAND / PLA",
    },
    gallery: [
      { src: "/works/mi-band-stand/photo-3.webp", alt: "スタンドのヘッドと、上端に球のある土台を分解して並べた写真", caption: "PARTS — HEAD / BASE WITH 13.2MM BALL" },
      { src: "/works/mi-band-stand/photo-4.webp", alt: "ヘッドに純正の充電器をはめ込んだスタンド", caption: "CHARGER SEATED IN THE HEAD" },
      { src: "/works/mi-band-stand/photo-5.webp", alt: "バンドを載せる前のスタンドのヘッド部分", caption: "HEAD — BAND CRADLE" },
      { src: "/works/mi-band-stand/photo-2.webp", alt: "机の上でバンドを充電しているスタンド", caption: "IN USE — ON THE DESK" },
    ],
    externalUrl: "https://makerworld.com/en/models/854653-mi-band-charging-stand-for-band8-9",
  },
  {
    id: "zidoukaken-world",
    index: "05",
    symbol: "Zw",
    slug: "zidoukaken-world",
    title: "じどうかけん ワールド",
    titleEn: "Zidoukaken World",
    category: "interaction",
    categoryLabel: "WEB / 3D",
    summary: "東北大学 自動化研究会の公式サイトを、歩いてめぐるブロックの世界にしたWebオープンワールド。",
    description:
      "公式サイトの7つのSTAGEを、三人称で歩き回れるボクセルの世界として再構成したWebアプリです（試作）。体の当たり判定をx→z→yの順に解く移動処理、1ブロックの段差の自動登坂、人や看板との会話、STAGEごとのスタンプとミニマップを実装し、7つ集めると裏世界のタイムアタックが開きます。",
    role: ["Concept", "3D", "Game Design", "Frontend"],
    tools: ["Three.js", "JavaScript", "WebGL"],
    accent: "#3d7cc9",
    asset: {
      type: "image",
      src: "/works/zidoukaken-world/world.jpg",
      scale: 1,
      alt: "じどうかけん ワールドのボクセルの広場と自動化研究会の歯車ロゴ",
      caption: "LIVE WORLD — ZIDOUKAKEN WORLD / THREE.JS",
    },
    externalUrl: "https://zidoukaken.labo-robo.jp/world/",
  },
  {
    id: "hand-spinner",
    index: "06",
    symbol: "Hs",
    slug: "hand-spinner",
    title: "Hand Spinner",
    titleEn: "Hand Spinner: Trackpad Toy",
    category: "interaction",
    categoryLabel: "macOS / TOY",
    summary: "スペースキーと指一本で回す、Macのための小さなハンドスピナー。",
    description: "トラックパッドの動きを回転の勢いに変える、デスクトップ上のピクセルアートのハンドスピナーです。慣性、加速、ブレーキと、4色の半透明スキンを楽しめます。Mac App Storeで公開準備中。",
    role: ["Interaction", "App", "Pixel Art"],
    tools: ["Swift", "AppKit", "StoreKit"],
    accent: "#ff713f",
    asset: {
      type: "image",
      src: "/works/hand-spinner/app-icon.png",
      scale: 1.05,
      alt: "Hand Spinnerの黒とシルバー、オレンジのアプリアイコン",
      caption: "APP ICON — HAND SPINNER / macOS",
    },
  },
  {
    id: "hondana-scan",
    index: "07",
    symbol: "Bk",
    slug: "hondana-scan",
    title: "本棚スキャン",
    titleEn: "Hondana Scan",
    category: "software",
    categoryLabel: "iOS APP",
    summary: "本のバーコードから、自分の本棚と読書記録をiPhoneの中につくる。",
    description: "ISBNから書誌情報を検索し、読書進捗、読み始めた日・読み終えた日、メモを端末内に保存するiPhoneアプリです。本棚をMarkdownで共有できます。",
    role: ["Product", "SwiftUI", "Development"],
    tools: ["SwiftUI", "SwiftData", "ISBN"],
    accent: "#e2b54d",
    asset: {
      type: "image",
      src: "/works/hondana-scan/app-icon.png",
      scale: 1.05,
      alt: "バーコードと積み上げた本を描いた本棚スキャンのアイコン",
      caption: "APP ICON — HONDANA SCAN / iOS",
    },
  },
  {
    id: "filter",
    index: "08",
    symbol: "Yt",
    slug: "youtube-feed-filter",
    title: "YouTube Feed Filter",
    titleEn: "YouTube Feed Filter",
    category: "software",
    categoryLabel: "EXTENSION",
    summary: "見たいキーワードだけにフィードを絞るChrome拡張。",
    description:
      "YouTubeのフィードを、指定したキーワードを含む動画だけに整えるChrome拡張です。情報量を増やすのではなく、注意の向け先を設計する小さな道具です。",
    role: ["Concept", "Extension", "Frontend", "Release"],
    tools: ["JavaScript", "Chrome Extension", "Store"],
    accent: "#7a8bea",
    asset: { type: "image", src: "/generated/feed-filter.png", scale: 2.0 },
    externalUrl:
      "https://chromewebstore.google.com/detail/youtube-feed-filter/iiiloooblnpcagiemmpahoiipladigll",
  },
  {
    id: "three-tabs",
    index: "09",
    symbol: "Tb",
    slug: "3tabs",
    title: "3Tabs",
    titleEn: "3Tabs: Tab Limiter",
    category: "software",
    categoryLabel: "EXTENSION",
    summary: "ウィンドウあたりのタブを3枚に制限する、ミニマリスト向けChrome拡張。",
    description:
      "4枚目のタブを開くと、閉じるタブを選ぶUIが表示され、タブが散らかる前に整理できます。7言語に対応し、Chromeウェブストアで公開しています。",
    role: ["Concept", "Extension", "Frontend", "i18n", "Release"],
    tools: ["JavaScript", "Chrome Extension", "Store"],
    accent: "#43cea2",
    asset: {
      type: "image",
      src: "/app-previews/3tabs.png",
      scale: 1.05,
      lowRes: true,
      alt: "3Tabsのアプリアイコン",
      caption: "APP ICON — 3TABS / CHROME EXTENSION",
    },
    externalUrl: "https://chromewebstore.google.com/detail/3tabs-tab-limiter/lagdbndhbabfjefhlhbmpncplepiadcc",
  },
  {
    id: "scheduler",
    index: "10",
    symbol: "Cs",
    slug: "circular-scheduler",
    title: "Circular Scheduler",
    titleEn: "Circular Scheduler",
    category: "interaction",
    categoryLabel: "INTERACTION",
    summary: "一日の時間を円で捉える、Google Tasks連携スケジューラー。",
    description:
      "直線の予定表ではなく、時計の円周上でタスクと時間の流れを捉えるWebアプリです。時間感覚とタスク操作の関係をインターフェースとして探っています。",
    role: ["Product", "UI", "Interaction", "Frontend"],
    tools: ["Web App", "Google Tasks", "UI Design"],
    accent: "#8fd85f",
    asset: { type: "image", src: "/generated/circular-scheduler.png", scale: 2.05 },
    externalUrl: "https://circular-schedule.vercel.app",
  },
  {
    id: "robot",
    index: "11",
    symbol: "Bm",
    slug: "desktop-companion",
    title: "デスクトップ・コンパニオン",
    titleEn: "Desktop Companion",
    category: "robotics",
    categoryLabel: "ROBOT",
    summary: "表情と首振りで応答する、小さな卓上ロボットの実験。",
    description:
      "M5Stackとサーボを使い、表情・動き・対話の手触りを検討している卓上ロボットです。キャラクター性と機構を同時に扱う、継続中のプロトタイプです。",
    role: ["Interaction", "Embedded", "Motion", "Prototype"],
    tools: ["M5Stack", "ESP32", "Servo", "3D Print"],
    accent: "#52cfcb",
    asset: { type: "image", src: "/generated/desktop-companion.png", scale: 2.25 },
  },
  {
    id: "print",
    index: "12",
    symbol: "3D",
    slug: "printed-products",
    title: "3Dプリント製品開発",
    titleEn: "3D Printed Products",
    category: "product",
    categoryLabel: "3D PRINT",
    summary: "CADから試作、製造までを往復するプロダクト開発。",
    description:
      "用途と造形条件を行き来しながら、独自の3Dプリント製品を設計・試作しています。見た目だけでなく、積層方向、強度、組み立て、量産性までを設計対象にします。",
    role: ["CAD", "Modeling", "Prototype", "Fabrication"],
    tools: ["CAD", "FDM", "Material Test"],
    accent: "#a98de8",
    asset: { type: "image", src: "/generated/printed-object.png", scale: 2.25 },
  },
  {
    id: "keychain",
    index: "13",
    symbol: "Al",
    slug: "unit-keychain",
    title: "単位キーホルダー",
    titleEn: "Unit Keychain",
    category: "product",
    categoryLabel: "PRODUCT",
    summary: "単位記号の文字の形を、持ち歩けるプロダクトへ。",
    description:
      "単位記号そのものを立体化した3Dプリント製キーホルダーです。文字の可読性、厚み、強度、触り心地を小さな造形の中で検証しています。",
    role: ["Product", "Typography", "Modeling", "Fabrication"],
    tools: ["CAD", "3D Print", "Finishing"],
    accent: "#f4bd55",
    asset: { type: "image", src: "/generated/unit-keychain.png", scale: 1.75 },
  },
  {
    id: "hundred-hours",
    index: "14",
    symbol: "100",
    slug: "do-100-hours",
    title: "Do 100 Hours",
    titleEn: "Do 100 Hours",
    category: "software",
    categoryLabel: "iOS APP / COMING SOON",
    summary: "やってみたいことに、まず100時間。進み具合が100マスで見えるiPhoneアプリ。",
    description: "ひとつずつでも並行しても、100時間の挑戦を計測・保存。終えた挑戦も記録に残せます。公開準備中。",
    role: ["Product", "UI", "SwiftUI", "QA"],
    tools: ["SwiftUI", "WidgetKit", "StoreKit"],
    accent: "#f1f1ee",
    asset: { type: "image", src: "/works/do-100-hours/app-icon.png", scale: 1, alt: "Do 100 Hoursの白黒のアイコン", caption: "DO 100 HOURS / iOS — COMING SOON" },
  },
];

export const featuredWorks = works.slice(0, 6);

export function getWorkBySlug(slug: string) {
  return works.find((work) => work.slug === slug);
}
