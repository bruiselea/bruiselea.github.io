import createOpenSCAD from "@lofcz/openscad-wasm";
import { mountFiles } from "./staple-mount-types";
import type { MountRequest, MountResponse } from "./staple-mount-types";

let source: Promise<string> | undefined;
const baseCache = new Map<number, ArrayBuffer>();

function loadSource() {
  source ??= fetch(mountFiles + "Staple-Wall-Mount-Maker.scad").then((response) => {
    if (!response.ok) throw new Error("形状データを読み込めませんでした。");
    return response.text();
  }).catch((error) => {
    source = undefined;
    throw error;
  });
  return source;
}

function checkBinarySTL(buffer: ArrayBuffer, requireSingleSolid: boolean) {
  const view = new DataView(buffer);
  const count = view.byteLength >= 84 ? view.getUint32(80, true) : 0;
  if (!count || 84 + count * 50 !== view.byteLength) throw new Error("形状を書き出せませんでした。");
  const invalid = requireSingleSolid
    ? "自作 STL とカバーが一体につながっていません。ずらし量と接合面を確認してください。"
    : "閉じた立体を生成できませんでした。寸法を見直してください。";

  // Every edge of the joined part must be shared by two triangles.
  const vertices = new Map<string, number>();
  const edges = new Map<string, { first: number; count: number }>();
  const parent = Uint32Array.from({ length: count }, (_, i) => i);
  function root(i: number) {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]];
      i = parent[i];
    }
    return i;
  }

  for (let i = 0; i < count; i++) {
    const ids = [];
    for (let j = 0; j < 3; j++) {
      const offset = 96 + i * 50 + j * 12;
      const key = [0, 4, 8].map((axis) => Math.round(view.getFloat32(offset + axis, true) * 1e6)).join(",");
      if (!vertices.has(key)) vertices.set(key, vertices.size);
      ids.push(vertices.get(key)!);
    }
    for (let j = 0; j < 3; j++) {
      const [a, b] = [ids[j], ids[(j + 1) % 3]].sort((x, y) => x - y);
      if (a === b) throw new Error(invalid);
      const key = a + ":" + b;
      const edge = edges.get(key);
      if (edge) {
        edge.count++;
        parent[root(i)] = root(edge.first);
      } else {
        edges.set(key, { first: i, count: 1 });
      }
    }
  }

  if ([...edges.values()].some((edge) => edge.count !== 2) || parent.some((_, i) => root(i) !== root(0))) {
    throw new Error(invalid);
  }
}

async function render(part: number, base: number, vars: Record<string, number | string>, imported?: ArrayBuffer) {
  const messages: string[] = [];
  const [program, scad] = await Promise.all([
    loadSource(),
    createOpenSCAD({
      noInitialRun: true,
      print: (line) => messages.push(line),
      printErr: (line) => messages.push(line),
    }),
  ]);
  scad.FS.writeFile("/mount.scad", program + '\necho("WEB_POSE", front_bottom, plate_front, base_half_height - front_bottom + 18);\n');
  if (imported) scad.FS.writeFile("/user.stl", new Uint8Array(imported));

  const flags = Object.entries({ base_size: base, print_part: part, ...vars }).flatMap(([key, val]) => ["-D", key + "=" + val]);
  const output = "/mount-output.stl";
  let buffer: ArrayBuffer;
  try {
    const code = scad.callMain(["/mount.scad", "--backend", "CGAL", "--hardwarnings", "--export-format", "binstl", "-o", output, ...flags]);
    if (code !== 0) throw new Error("OpenSCAD exit " + code);
    buffer = scad.FS.readFile(output, { encoding: "binary" }).slice().buffer;
  } catch {
    if (messages.some((line) => line.includes("Cover outline must hide"))) {
      throw new Error("この輪郭ではベース全体を覆えません。カバーの幅か高さを広げてください。");
    }
    if (messages.some((line) => line.includes("Move the STL"))) {
      throw new Error("自作 STL をカバー正面に重ねてください。");
    }
    throw new Error("モデルを生成できませんでした。寸法と STL の形状を確認してください。");
  }
  const pose = messages.join("\n").match(/"WEB_POSE",\s*([-\d.]+),\s*([-\d.]+),\s*([-\d.]+)/);
  if (!pose) throw new Error("モデルの配置を取得できませんでした。");
  checkBinarySTL(buffer, imported !== undefined);
  return { buffer, frontBottom: Number(pose[1]), frontPlane: Number(pose[2]), lift: Number(pose[3]) };
}

async function generate({ settings: s, imported }: MountRequest) {
  let base = baseCache.get(s.base);
  if (!base) {
    base = (await render(1, s.base, {})).buffer;
    baseCache.set(s.base, base);
  }

  const result = await render(s.style === 3 ? 3 : 2, s.base, {
    mount_style: s.style === 3 ? 0 : s.style, cover_outline: s.outline,
    width_mm: s.width, height_mm: s.height, device_thickness_mm: s.depth,
    clearance_mm: s.fit, lip_height_mm: s.lip, slide_clearance_mm: s.slide,
    stl_origin_mm: JSON.stringify(s.origin), stl_offset_mm: JSON.stringify(s.offset),
    ...(imported ? { stl_file: '"/user.stl"' } : {}),
  }, imported);
  return {
    base: base.slice(0), cover: result.buffer, style: s.style, size: s.base,
    frontBottom: result.frontBottom, frontPlane: result.frontPlane, lift: result.lift,
  };
}

self.onmessage = async (event: MessageEvent<MountRequest>) => {
  try {
    const models = await generate(event.data);
    self.postMessage({ models } satisfies MountResponse, { transfer: [models.base, models.cover] });
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : "モデルを生成できませんでした。" } satisfies MountResponse);
  }
};
