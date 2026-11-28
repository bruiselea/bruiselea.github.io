import { Vector3 } from "three";
import { STLLoader } from "three/addons/loaders/STLLoader.js";
import { coverInAssembly, createMountViewer } from "./staple-mount-viewer";
import { mountFiles } from "./staple-mount-types";
import type { MountModels, MountRequest, MountResponse, MountStyle, MountView } from "./staple-mount-types";

const form = document.querySelector<HTMLFormElement>("#mount-form")!;
const stage = document.getElementById("mount-stage")!;
const status = document.getElementById("mount-status")!;
const dimensions = document.getElementById("mount-dimensions-readout")!;
const baseButton = document.querySelector<HTMLButtonElement>("#mount-download-base")!;
const coverButton = document.querySelector<HTMLButtonElement>("#mount-download-cover")!;
const submit = form.querySelector<HTMLButtonElement>("button[type=submit]")!;
const viewButtons = [...document.querySelectorAll<HTMLButtonElement>("[data-view]")];
const loader = new STLLoader();
const maxFileSize = 12_000_000;
const names = ["S", "M", "L"];
const outlineDefaults = [[104, 78], [116, 104], [132, 146]];
// Sleeve height is the base height plus 1 mm at the bottom and 3 mm at the top.
const coverHeights = [38, 63.5, 97.5];
let outlineEdited = false;
const fmt = Intl.NumberFormat("ja-JP", { maximumFractionDigits: 1 });

let revision = 0;
let busy = false;
let current: MountModels | undefined;
let currentRevision = -1;
let view: MountView = "exploded";
let viewer: ReturnType<typeof createMountViewer> | undefined;

try {
  viewer = createMountViewer(stage);
} catch {
  for (const button of viewButtons) button.disabled = true;
}

function value(name: string) {
  return (form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement).value;
}

function mode() {
  return Number(value("style")) as MountStyle;
}

function toggleGroup(id: string, enabled: boolean) {
  const fieldset = document.querySelector<HTMLFieldSetElement>("#" + id)!;
  fieldset.hidden = !enabled;
  fieldset.disabled = !enabled;
}

function chosenOutline() {
  return mode() === 1 ? Number(value("outline")) : 0;
}

function syncMode() {
  const style = mode();
  const shaped = chosenOutline() !== 0;
  const size = Number(value("base"));
  toggleGroup("mount-outline", style === 1);
  toggleGroup("mount-outline-size", shaped);
  toggleGroup("mount-dimensions", style < 2 && !shaped);
  if (shaped && !outlineEdited) {
    const [width, height] = outlineDefaults[size];
    (form.elements.namedItem("outlineWidth") as HTMLInputElement).value = String(width);
    (form.elements.namedItem("outlineHeight") as HTMLInputElement).value = String(height);
  }
  document.getElementById("outline-help")!.textContent =
    "輪郭の内側に " + names[size] + " ベースの覆い範囲（73 × " + coverHeights[size] + " mm）が入る寸法にします。";
  toggleGroup("mount-holder", style === 0);
  toggleGroup("mount-import", style === 2);
  document.getElementById("mount-cad-help")!.hidden = style !== 3;
  document.getElementById("mount-width-label")!.textContent = style === 1 ? "平板の幅" : "機器の幅";
  document.getElementById("mount-height-label")!.textContent = style === 1 ? "平板の高さ" : "背板の高さ";
  coverButton.textContent = style === 3 ? "CAD用 STL" : "カバー STL";
}

function message(text: string, error = false) {
  status.textContent = text;
  status.dataset.error = String(error);
}

function updateButtons() {
  const ready = Boolean(current) && currentRevision === revision && !busy;
  baseButton.disabled = !ready;
  coverButton.disabled = !ready;
  submit.disabled = busy;
  form.setAttribute("aria-busy", String(busy));
}

function render(models: MountModels, visibleRevision: number) {
  current = models;
  currentRevision = visibleRevision;
  const geometry = coverInAssembly(models);
  geometry.computeBoundingBox();
  const size = geometry.boundingBox!.getSize(new Vector3());
  dimensions.textContent = "カバー " + [size.x, size.y, size.z].map((n) => fmt.format(n)).join(" × ") + " mm";
  geometry.dispose();
  viewer?.show(models, view);
  updateButtons();
}

function setView(newView: MountView) {
  view = newView;
  for (const button of viewButtons) button.setAttribute("aria-pressed", String(button.dataset.view === newView));
  if (current) viewer?.show(current, view);
}

for (const button of viewButtons) {
  button.addEventListener("click", () => setView(button.dataset.view as MountView));
}

function filename(part: "base" | "cover", models: MountModels) {
  return "staple-mount-" + names[models.size] + "-" + (part === "cover" && models.style === 3 ? "cad-cover" : part) + ".stl";
}

function save(part: "base" | "cover") {
  if (!current || currentRevision !== revision || busy) return;
  const url = URL.createObjectURL(new Blob([current[part]], { type: "model/stl" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename(part, current);
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

baseButton.addEventListener("click", () => save("base"));
coverButton.addEventListener("click", () => save("cover"));

async function inputs(): Promise<MountRequest> {
  const style = mode();
  const outline = chosenOutline();
  const settings = {
    style, outline, base: Number(value("base")), slide: Number(value("slide")),
    width: style < 2 ? Number(value(outline ? "outlineWidth" : "width")) : 60,
    height: style < 2 ? Number(value(outline ? "outlineHeight" : "height")) : 80,
    depth: style === 0 ? Number(value("depth")) : 18,
    fit: style === 0 ? Number(value("fit")) : 0.5,
    lip: style === 0 ? Number(value("lip")) : 6,
    origin: [0, 0, 0] as [number, number, number],
    offset: [0, 0] as [number, number],
  };
  if (style !== 2) return { settings };

  settings.offset = [Number(value("offsetX")), Number(value("offsetY"))];
  const file = (form.elements.namedItem("stl") as HTMLInputElement).files?.[0];
  if (!file || file.size === 0 || file.size > maxFileSize) throw new Error("12 MB以下の STL を選んでください。");
  const imported = await file.arrayBuffer();
  const data = new DataView(imported);
  const isBinary = imported.byteLength >= 84 && data.getUint32(80, true) * 50 + 84 === imported.byteLength;
  const textStart = new TextDecoder().decode(imported.slice(0, 256));
  if (!isBinary && !/^solid\b/.test(textStart)) throw new Error("読み込める STL 形式を確認してください。");

  let geometry;
  try {
    geometry = loader.parse(imported);
    geometry.computeBoundingBox();
    const box = geometry.boundingBox!;
    const size = box.getSize(new Vector3());
    const center = box.getCenter(new Vector3());
    if (!geometry.attributes.position.count || ![size.x, size.y, size.z, center.x, center.y, box.min.z].every(Number.isFinite) ||
        size.x <= 0 || size.y <= 0 || size.z <= 0) {
      throw new Error("閉じた立体の STL を選んでください。");
    }
    if (Math.max(size.x, size.y, size.z) > 250) throw new Error("STL の外寸は各方向 250 mm 以内にしてください。");
    settings.width = Math.max(size.x, 10);
    settings.height = Math.max(size.y, 20);
    settings.origin = [center.x, center.y, box.min.z];
  } catch (error) {
    if (error instanceof Error && /^閉じた|^STL の外寸/.test(error.message)) throw error;
    throw new Error("STL を読み込めませんでした。ファイルの形式を確認してください。");
  } finally {
    geometry?.dispose();
  }
  return { settings, imported };
}

let worker: Worker | undefined;

function generate(request: MountRequest): Promise<MountModels> {
  return new Promise((resolve, reject) => {
    worker ??= new Worker(new URL("./staple-mount-worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = ({ data }: MessageEvent<MountResponse>) => {
      if ("models" in data) resolve(data.models);
      else reject(new Error(data.error));
    };
    worker.onerror = () => {
      worker?.terminate();
      worker = undefined;
      reject(new Error("生成エンジンを読み込めませんでした。再度お試しください。"));
    };
    worker.postMessage(request, request.imported ? [request.imported] : []);
  });
}

form.addEventListener("input", (event) => {
  if (event.target instanceof HTMLInputElement && ["outlineWidth", "outlineHeight"].includes(event.target.name)) {
    outlineEdited = true;
  }
  revision += 1;
  syncMode();
  updateButtons();
  message("設定を変更しました。「3Dモデルを生成」で更新できます。");
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (busy || !form.reportValidity()) return;
  const activeRevision = revision;
  busy = true;
  updateButtons();
  message("モデルを生成しています。初回は読み込みに時間がかかることがあります。");

  try {
    const models = await generate(await inputs());
    if (revision !== activeRevision) return;
    render(models, activeRevision);
    message(viewer ? "STLをダウンロードできます。" : "3D表示を利用できない環境です。生成したSTLはダウンロードできます。");
  } catch (error) {
    if (revision === activeRevision) message(error instanceof Error ? error.message : "生成できませんでした。", true);
  } finally {
    busy = false;
    updateButtons();
  }
});

async function sample(file: string) {
  const response = await fetch(mountFiles + file);
  if (!response.ok) throw new Error("サンプルを読み込めませんでした。");
  return response.arrayBuffer();
}

syncMode();
void Promise.all([sample("Slide-Mount-S-Base.stl"), sample("Slide-Mount-S-Holder-60x18.stl")]).then(([base, cover]) => {
  if (revision !== 0 || busy) return;
  render({ base, cover, style: 0, size: 0, frontBottom: -40, frontPlane: 12.4, lift: 75 }, 0);
  message(viewer ? "Sベースと幅60 mm・厚み18 mmのサンプルです。" : "3D表示を利用できない環境です。サンプルSTLはダウンロードできます。");
}).catch(() => {
  if (revision === 0 && !busy) message("サンプルを読み込めませんでした。「3Dモデルを生成」で作り直せます。", true);
});
