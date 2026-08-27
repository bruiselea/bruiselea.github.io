export type WorkAsset = {
  type: "image" | "model";
  src: string;
  modelSrc?: string;
  scale: number;
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
  externalUrl?: string;
};

export const works: Work[] = [
  {
    id: "keyboard",
    index: "01",
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
    id: "robot",
    index: "02",
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
    id: "keychain",
    index: "03",
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
    id: "scheduler",
    index: "04",
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
    id: "print",
    index: "05",
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
    id: "filter",
    index: "06",
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
    id: "keyboard-full",
    index: "07",
    symbol: "Pt",
    slug: "periodic-table-keyboard-build",
    title: "周期表キーボード — Build",
    titleEn: "Periodic Keyboard Build",
    category: "hardware",
    categoryLabel: "PERIODIC KB",
    summary: "配列、基板、筐体をひとつの入力装置として組み上げる制作記録。",
    description:
      "周期表キーボードの全体像と制作過程をまとめるケーススタディです。完成品だけでなく、配列の検討、基板、組み立て、次の改善点までを残します。",
    role: ["Research", "Hardware", "Documentation"],
    tools: ["KiCad", "QMK", "3D Print"],
    accent: "#55bcd3",
    asset: { type: "image", src: "/generated/periodic-keyboard.png", scale: 2.55 },
  },
  {
    id: "hours",
    index: "08",
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
    id: "nib-housing",
    index: "09",
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
    id: "hondana-scan",
    index: "10",
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
];

export const featuredWorks = works.slice(0, 6);

export function getWorkBySlug(slug: string) {
  return works.find((work) => work.slug === slug);
}
