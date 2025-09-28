import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Download,
  Image as ImageIcon,
  Settings2,
  Sparkles,
} from "lucide-react";

// --- Utility: clamp ---
const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

// --- Image processing helpers ---
function toGrayscale(imgData: ImageData) {
  const { data, width, height } = imgData;
  const gray = new Uint8ClampedArray(width * height);
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    // perceptual luma (Rec. 709)
    const g = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    gray[j] = g;
  }
  return { gray, width, height };
}

function boxBlur1D(
  src: Uint8ClampedArray,
  width: number,
  height: number,
  radius: number
) {
  if (radius <= 0) return src.slice();
  const dst = new Uint8ClampedArray(src.length);
  const w = width,
    h = height;
  const win = radius * 2 + 1;
  // horizontal
  const tmp = new Uint16Array(src.length);
  for (let y = 0; y < h; y++) {
    let acc = 0;
    const row = y * w;
    for (let x = -radius; x <= radius; x++)
      acc += src[row + clamp(x, 0, w - 1)];
    for (let x = 0; x < w; x++) {
      tmp[row + x] = Math.round(acc / win);
      const xAdd = x + radius + 1;
      const xSub = x - radius;
      acc +=
        src[row + clamp(xAdd, 0, w - 1)] - src[row + clamp(xSub, 0, w - 1)];
    }
  }
  // vertical
  for (let x = 0; x < w; x++) {
    let acc = 0;
    for (let y = -radius; y <= radius; y++)
      acc += tmp[clamp(y, 0, h - 1) * w + x];
    for (let y = 0; y < h; y++) {
      dst[y * w + x] = Math.round(acc / win);
      const yAdd = y + radius + 1;
      const ySub = y - radius;
      acc +=
        tmp[clamp(yAdd, 0, h - 1) * w + x] - tmp[clamp(ySub, 0, h - 1) * w + x];
    }
  }
  return dst;
}

function threshold(
  gray: Uint8ClampedArray,
  width: number,
  height: number,
  t: number,
  invert: boolean
) {
  const bin = new Uint8Array(width * height);
  const thr = clamp(Math.round(t), 0, 255);
  for (let i = 0; i < gray.length; i++) {
    const v = gray[i] >= thr ? 1 : 0;
    bin[i] = invert ? 1 - v : v;
  }
  return bin; // 0 or 1 per pixel
}

// --- Marching Squares Vectorization ---
// Produces SVG path data for the 0.5 contour of the binary field
function marchingSquares(bin: Uint8Array, width: number, height: number) {
  const paths: string[] = [];

  // sample function f(x,y) = bin(y*w+x) as 0/1. We'll trace edges where value changes.
  // We'll mark visited edges to avoid duplicates.
  const visited = new Set<string>();
  const idx = (x: number, y: number) => y * width + x;

  function cellCase(x: number, y: number) {
    const a = bin[idx(x, y)];
    const b = bin[idx(x + 1, y)];
    const c = bin[idx(x + 1, y + 1)];
    const d = bin[idx(x, y + 1)];
    return (a << 3) | (b << 2) | (c << 1) | d; // 4-bit case
  }

  function edgeKey(x: number, y: number, ex: number, ey: number) {
    return `${x},${y},${ex},${ey}`;
  }

  // interpolate midpoints (0.5 between grid points)
  function mid(p1: [number, number], p2: [number, number]) {
    return [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2] as [number, number];
  }

  // For each cell, start a trace for each unvisited edge
  for (let y = 0; y < height - 1; y++) {
    for (let x = 0; x < width - 1; x++) {
      const c = cellCase(x, y);
      if (c === 0 || c === 15) continue; // no edges

      // collect edges for this cell based on MS cases (ambiguous 5/10 resolved with standard rule)
      const edges: Array<[[number, number], [number, number]]> = [];
      const tl: [number, number] = [x, y];
      const tr: [number, number] = [x + 1, y];
      const br: [number, number] = [x + 1, y + 1];
      const bl: [number, number] = [x, y + 1];
      const t = mid(tl, tr);
      const r = mid(tr, br);
      const b = mid(bl, br);
      const l = mid(tl, bl);

      const push = (p: [number, number], q: [number, number]) =>
        edges.push([p, q]);

      switch (c) {
        case 1:
        case 14:
          push(b, l);
          break;
        case 2:
        case 13:
          push(r, b);
          break;
        case 3:
        case 12:
          push(r, l);
          break;
        case 4:
        case 11:
          push(t, r);
          break;
        case 5:
          // ambiguous: create two edges, choose consistent winding by value at center
          push(t, r);
          push(b, l);
          break;
        case 6:
        case 9:
          push(t, b);
          break;
        case 7:
        case 8:
          push(t, l);
          break;
        case 10:
          push(t, r);
          push(b, l);
          break;
        default:
          break;
      }

      for (const [p, q] of edges) {
        const key = edgeKey(x, y, p[0] + q[0], p[1] + q[1]);
        if (visited.has(key)) continue;
        // trace the contour starting from this segment
        let cx = x,
          cy = y;
        let from = p as [number, number];
        let to = q as [number, number];
        const points: [number, number][] = [from, to];
        visited.add(key);

        // Follow edges by walking to adjacent cell that shares the endpoint
        let guard = 0;
        while (guard++ < width * height) {
          // Determine which endpoint to extend from (current 'to')
          const ex = to[0],
            ey = to[1];
          // Find neighboring cell that contains this midpoint as an edge
          const eps = 1e-6;
          let nx = cx,
            ny = cy;
          if (Math.abs(ey - y) < eps && ex > x && ex < x + 1) {
            ny = cy - 1;
            nx = cx;
          } // top neighbor
          else if (Math.abs(ex - (x + 1)) < eps && ey > y && ey < y + 1) {
            nx = cx + 1;
            ny = cy;
          } // right
          else if (Math.abs(ey - (y + 1)) < eps && ex > x && ex < x + 1) {
            ny = cy + 1;
            nx = cx;
          } // bottom
          else if (Math.abs(ex - x) < eps && ey > y && ey < y + 1) {
            nx = cx - 1;
            ny = cy;
          } // left
          else {
            // estimate neighbor by quadrant
            if (ey === y) {
              ny = cy - 1;
              nx = cx;
            } else if (ex === x + 1) {
              nx = cx + 1;
              ny = cy;
            } else if (ey === y + 1) {
              ny = cy + 1;
              nx = cx;
            } else if (ex === x) {
              nx = cx - 1;
              ny = cy;
            }
          }

          if (nx < 0 || ny < 0 || nx >= width - 1 || ny >= height - 1) break; // reached border

          cx = nx;
          cy = ny;
          x = cx;
          y = cy; // move
          const cc = cellCase(cx, cy);
          if (cc === 0 || cc === 15) break;

          // Recompute local midpoints for new cell
          const tl2: [number, number] = [cx, cy];
          const tr2: [number, number] = [cx + 1, cy];
          const br2: [number, number] = [cx + 1, cy + 1];
          const bl2: [number, number] = [cx, cy + 1];
          const t2 = mid(tl2, tr2),
            r2 = mid(tr2, br2),
            b2 = mid(bl2, br2),
            l2 = mid(tl2, bl2);
          const segs: Array<[[number, number], [number, number]]> = [];
          const push2 = (pp: [number, number], qq: [number, number]) =>
            segs.push([pp, qq]);

          switch (cc) {
            case 1:
            case 14:
              push2(b2, l2);
              break;
            case 2:
            case 13:
              push2(r2, b2);
              break;
            case 3:
            case 12:
              push2(r2, l2);
              break;
            case 4:
            case 11:
              push2(t2, r2);
              break;
            case 5:
              push2(t2, r2);
              push2(b2, l2);
              break;
            case 6:
            case 9:
              push2(t2, b2);
              break;
            case 7:
            case 8:
              push2(t2, l2);
              break;
            case 10:
              push2(t2, r2);
              push2(b2, l2);
              break;
          }

          // choose the segment that continues from 'to'
          let found = false;
          for (const [pp, qq] of segs) {
            const k2 = edgeKey(cx, cy, pp[0] + qq[0], pp[1] + qq[1]);
            const isContinuation =
              (Math.abs(pp[0] - to[0]) < 1e-6 &&
                Math.abs(pp[1] - to[1]) < 1e-6) ||
              (Math.abs(qq[0] - to[0]) < 1e-6 &&
                Math.abs(qq[1] - to[1]) < 1e-6);
            if (!visited.has(k2) && isContinuation) {
              let np: [number, number], nq: [number, number];
              if (
                Math.abs(pp[0] - to[0]) < 1e-6 &&
                Math.abs(pp[1] - to[1]) < 1e-6
              ) {
                np = pp;
                nq = qq;
              } else {
                np = qq;
                nq = pp;
              }
              visited.add(k2);
              points.push(nq);
              to = nq;
              found = true;
              break;
            }
          }
          if (!found) break; // path finished
        }

        // Convert points to path (scale to pixels)
        if (points.length > 2) {
          const d =
            `M ${points[0][0]} ${points[0][1]} ` +
            points
              .slice(1)
              .map((p) => `L ${p[0]} ${p[1]}`)
              .join(" ") +
            " Z";
          paths.push(d);
        }
      }
    }
  }
  return paths;
}

function makeSVG(
  paths: string[],
  width: number,
  height: number,
  fillColor = "#000000",
  bgTransparent = true
) {
  const viewBox = `0 0 ${width} ${height}`;
  const bg = bgTransparent
    ? ""
    : `<rect width=\"100%\" height=\"100%\" fill=\"white\"/>`;
  const body = paths
    .map((d) => `<path d=\"${d}\" fill=\"${fillColor}\"/>`)
    .join("\n");
  return `<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"${viewBox}\" width=\"${width}\" height=\"${height}\">\n${bg}\n${body}\n</svg>`;
}

// --- Main Component ---
export default function SVGThresholdVectorizer() {
  const [file, setFile] = useState<File | null>(null);
  const [imgURL, setImgURL] = useState<string | null>(null);
  const [thresholdValue, setThresholdValue] = useState<number>(180);
  const [invert, setInvert] = useState<boolean>(false);
  const [blurRadius, setBlurRadius] = useState<number>(1);
  const [paths, setPaths] = useState<string[] | null>(null);
  const [binURL, setBinURL] = useState<string | null>(null);
  const [busy, setBusy] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<string>("svg");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load image
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImgURL(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const loadImageToCanvas = async (): Promise<{
    width: number;
    height: number;
  } | null> => {
    if (!imgURL || !canvasRef.current) return null;
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const maxW = 1400; // safety limit
        const scale = img.width > maxW ? maxW / img.width : 1;
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = canvasRef.current!;
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, w, h);
        resolve({ width: w, height: h });
      };
      img.onerror = reject;
      img.src = imgURL;
    });
  };

  const process = async () => {
    setBusy(true);
    setError(null);
    try {
      const dims = await loadImageToCanvas();
      if (!dims || !canvasRef.current) return;
      const { width, height } = dims;
      const ctx = canvasRef.current.getContext("2d")!;
      const imgData = ctx.getImageData(0, 0, width, height);
      const { gray } = toGrayscale(imgData);
      const blurred = boxBlur1D(gray, width, height, blurRadius);
      const bin = threshold(blurred, width, height, thresholdValue, invert);

      // preview binary bitmap into a dataURL
      const prev = ctx.createImageData(width, height);
      for (let i = 0, j = 0; i < prev.data.length; i += 4, j++) {
        const v = bin[j] ? 0 : 255; // black foreground
        prev.data[i] = v;
        prev.data[i + 1] = v;
        prev.data[i + 2] = v;
        prev.data[i + 3] = 255;
      }
      ctx.putImageData(prev, 0, 0);
      const url = canvasRef.current.toDataURL("image/png");
      setBinURL(url);

      // vectorize with marching squares
      const p = marchingSquares(bin, width, height);
      setPaths(p);
      setTab("svg");
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  };

  const svgMarkup = useMemo(() => {
    if (!paths || !canvasRef.current) return null;
    const w = canvasRef.current.width,
      h = canvasRef.current.height;
    return makeSVG(paths, w, h, "#000", true);
  }, [paths]);

  const handleSave = () => {
    if (!svgMarkup) return;
    const nameBase = file?.name
      ? file.name.replace(/\.[^.]+$/, "")
      : "vectorized";
    const blob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${nameBase}.svg`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-white to-slate-50 p-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex items-center gap-3">
          <Sparkles className="h-7 w-7" />
          <h1 className="text-2xl font-bold">SVG生成アプリ｜2値化→ベクタ化</h1>
        </header>

        <Card className="mb-4">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg">1. 画像を選択</CardTitle>
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  setFile(f);
                  setPaths(null);
                  setBinURL(null);
                }}
              />
              <Button
                variant="secondary"
                onClick={() => {
                  setFile(null);
                  setImgURL(null);
                  setPaths(null);
                  setBinURL(null);
                }}
              >
                リセット
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!file ? (
              <div className="flex items-center gap-2 text-slate-500">
                <ImageIcon className="h-5 w-5" /> 画像ファイルを選んでください。
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="col-span-2">
                  <Tabs value={tab} onValueChange={setTab}>
                    <TabsList>
                      <TabsTrigger value="original">元画像</TabsTrigger>
                      <TabsTrigger value="binary">2値化プレビュー</TabsTrigger>
                      <TabsTrigger value="svg">SVGプレビュー</TabsTrigger>
                    </TabsList>
                    <TabsContent value="original">
                      {imgURL && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={imgURL}
                          alt="original"
                          className="max-h-[60vh] w-auto rounded-2xl border object-contain shadow"
                        />
                      )}
                    </TabsContent>
                    <TabsContent value="binary">
                      {binURL ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={binURL}
                          alt="binary"
                          className="max-h-[60vh] w-auto rounded-2xl border object-contain shadow"
                        />
                      ) : (
                        <div className="text-slate-500">
                          「ベクタ化を実行」を押すと表示されます。
                        </div>
                      )}
                    </TabsContent>
                    <TabsContent value="svg">
                      {svgMarkup ? (
                        <div className="max-h-[60vh] overflow-auto rounded-2xl border p-3 shadow">
                          <div
                            dangerouslySetInnerHTML={{ __html: svgMarkup }}
                          />
                        </div>
                      ) : (
                        <div className="text-slate-500">
                          「ベクタ化を実行」を押すと表示されます。
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>

                <div className="space-y-4 rounded-2xl border p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Settings2 className="h-4 w-4" /> パラメータ
                  </div>

                  <div>
                    <div className="mb-2 flex justify-between text-sm text-slate-600">
                      <span>しきい値</span>
                      <span>{thresholdValue}</span>
                    </div>
                    <Slider
                      value={[thresholdValue]}
                      min={0}
                      max={255}
                      step={1}
                      onValueChange={(v) => setThresholdValue(v[0])}
                    />
                  </div>

                  <div>
                    <div className="mb-2 flex justify-between text-sm text-slate-600">
                      <span>平滑化（ぼかし半径）</span>
                      <span>{blurRadius}px</span>
                    </div>
                    <Slider
                      value={[blurRadius]}
                      min={0}
                      max={6}
                      step={1}
                      onValueChange={(v) => setBlurRadius(v[0])}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-600">色を反転</div>
                    <Switch checked={invert} onCheckedChange={setInvert} />
                  </div>

                  <div className="pt-2">
                    <Button
                      onClick={process}
                      disabled={!file || busy}
                      className="w-full"
                    >
                      {busy ? "処理中..." : "ベクタ化を実行"}
                    </Button>
                  </div>

                  <div className="pt-2">
                    <Button
                      onClick={handleSave}
                      disabled={!svgMarkup}
                      className="w-full"
                      variant="outline"
                    >
                      <Download className="mr-2 h-4 w-4" /> SVGを保存
                    </Button>
                    <p className="mt-2 text-xs text-slate-500">
                      保存時のファイル名は元画像のタイトル（拡張子除く）+「.svg」です。
                    </p>
                  </div>
                </div>
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />

            {error && (
              <div className="mt-4">
                <Alert variant="destructive">
                  <AlertTitle>エラー</AlertTitle>
                  <AlertDescription className="whitespace-pre-wrap">
                    {error}
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">使い方メモ</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-600">
              <li>「画像を選択」でファイルを選ぶ</li>
              <li>しきい値・平滑化・反転を調整</li>
              <li>
                「ベクタ化を実行」を押してプレビュー（2値化 / SVGタブで確認）
              </li>
              <li>「SVGを保存」でダウンロード（元画像の名前で保存）</li>
            </ol>
            <p className="mt-3 text-xs text-slate-500">
              ※ 高解像度画像は自動的に縮小して処理します（最大幅 1400px）。
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
