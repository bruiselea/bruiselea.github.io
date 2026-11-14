import { defaults, dimensions, mesh, binaryStl, floor } from "./model.mjs";

const presets = {
  standard: defaults,
  compact: { diameter: 42, bodyHeight: 100.08, lidHeight: 64.24 },
  short: { diameter: 42, bodyHeight: 100.08, lidHeight: 27.84 },
};
const byId = id => document.getElementById(id);
const canvas = byId("preview");
const ctx = canvas.getContext("2d");
const status = byId("status");
const error = byId("error");
const download = byId("download");
const stl = [...document.querySelectorAll("[data-stl]")];
const inputs = Object.keys(defaults).map(byId);
const preset = byId("preset");
const advanced = byId("advanced");
const dividerInput = byId("dividerHeight");
const tabs = [...document.querySelectorAll("[data-part]")];
const viewButtons = [...document.querySelectorAll("[data-view]")];
let current, models, selectedPart = "body", selectedDimension = "bodyHeight", view = "parts";
let frame = 0, busy = false;

function setButtons() {
  for (const button of [download, ...stl]) button.disabled = !current || busy;
}

function refresh() {
  let message = "";
  try {
    const values = Object.fromEntries(inputs.map(el => [el.id, el.valueAsNumber]));
    const automatic = dimensions(values);
    dividerInput.placeholder = automatic.maxDivider.toFixed(2);
    dividerInput.max = automatic.maxDivider;
    current = advanced.checked && (dividerInput.value !== "" || dividerInput.validity.badInput)
      ? dimensions({ ...values, dividerHeight: dividerInput.valueAsNumber })
      : automatic;
    models = Object.fromEntries(["body", "lid", "divider"].map(part => [part, mesh(current, part, true)]));
  } catch (e) {
    current = null;
    message = e.message;
  }
  error.textContent = message;
  error.hidden = !message;
  for (const [id, value] of [["closed", current?.closed], ["inside", current?.inside], ["divider", current?.divider]]) {
    byId(id + "-result").textContent = value === undefined ? "—" : `${value.toFixed(2)} mm`;
  }
  setButtons();
  requestDraw();
}

function requestDraw() {
  if (!frame) frame = requestAnimationFrame(draw);
}

function draw() {
  frame = 0;
  const { width, height } = canvas.getBoundingClientRect();
  const pixelRatio = Math.min(2, devicePixelRatio || 1);
  canvas.width = Math.round(width * pixelRatio);
  canvas.height = Math.round(height * pixelRatio);
  ctx.scale(pixelRatio, pixelRatio);
  if (!current || !width || !height) return;
  const d = current;
  const separate = view === "parts";
  const open = view === "open";
  const spread = d.lidDiameter + Math.max(12, d.lidDiameter * 0.31);
  const yaw = -0.22, pitch = open ? 0.82 : 0.38;
  const angles = [Math.cos(yaw), Math.sin(yaw), Math.cos(pitch), Math.sin(pitch)];
  const [cy, sy, cp, sp] = angles;
  const parts = separate ? ["body", "lid", "divider"] : ["body", open ? "divider" : "lid"];
  function projectPoint([x, y, z], part, index) {
    const flip = !separate && part === "lid";
    const vertical = flip ? d.closed - z : z + (open && part === "divider" ? floor : 0);
    const lateral = flip ? -y : y;
    const rotatedY = sy * x + cy * lateral;
    return [cy * x - sy * lateral + (separate ? (index - 1) * spread : 0),
      -sp * rotatedY - cp * vertical, -cp * rotatedY + sp * vertical];
  }
  const projected = parts.map((part, i) => models[part].vertices.map(point => projectPoint(point, part, i)));
  const bounds = [Infinity, Infinity, -Infinity, -Infinity];
  for (const vertices of projected) for (const [x, y] of vertices) {
    bounds[0] = Math.min(bounds[0], x); bounds[1] = Math.min(bounds[1], y);
    bounds[2] = Math.max(bounds[2], x); bounds[3] = Math.max(bounds[3], y);
  }
  const area = height - (separate ? 23 : 0);
  const sideMargin = width < 420 ? 22 : 42;
  const scale = Math.min((width - 2 * sideMargin) / (bounds[2] - bounds[0]), (area - 37) / (bounds[3] - bounds[1]));
  const dx = width / 2 - scale * (bounds[0] + bounds[2]) / 2;
  const dy = area / 2 - scale * (bounds[1] + bounds[3]) / 2;
  const triangles = [];
  const insetTriangles = [];
  for (let i = 0; i < parts.length; i++) {
    const color = parts[i] === "divider" ? [234, 146, 75] : [75, 158, 122];
    for (const face of models[parts[i]].faces) {
      const [a,b,c] = face.map(k => projected[i][k]);
      const u = b.map((v,k) => v - a[k]), v = c.map((v,k) => v - a[k]);
      const cross = [u[1]*v[2]-u[2]*v[1], u[2]*v[0]-u[0]*v[2], u[0]*v[1]-u[1]*v[0]];
      if (cross[2] >= 0) continue;
      const normal = Math.hypot(...cross);
      const light = (cross[0]*0.43 + cross[1]*0.46 - cross[2]*0.77) / normal;
      const visibleFaces = open && parts[i] === "divider" ? insetTriangles : triangles;
      visibleFaces.push({ points: [a,b,c], depth: (a[2]+b[2]+c[2])/3,
        color: `rgb(${color.map(k => Math.round(k * (0.62 + 0.38 * Math.max(0,light)))).join(",")})` });
    }
  }
  function trace(points) {
    ctx.beginPath();
    points.forEach(([x,y],i) => ctx[i ? "lineTo" : "moveTo"](dx + x * scale, dy + y * scale));
    ctx.closePath();
  }
  function paint(faces) {
    faces.sort((a,b) => a.depth - b.depth);
    ctx.lineWidth = 0.6;
    for (const triangle of faces) {
      trace(triangle.points);
      ctx.fillStyle = ctx.strokeStyle = triangle.color;
      ctx.fill();
      ctx.stroke();
    }
  }
  paint(triangles);
  if (open) {
    // The divider sits inside an opaque body and is only visible through its opening.
    ctx.save();
    trace(models.body.rim.map(point => projectPoint(point, "body", 0)));
    ctx.clip();
    paint(insetTriangles);
    ctx.restore();
  }
  const bodyCenter = dx - (separate ? spread * scale : 0);
  if (!separate) {
    const x = dx + bounds[2] * scale + 13;
    const height = open ? d.body : d.closed;
    const top = dy - cp * height * scale;
    drawMeasurement(x, dy, x, top, height, x, (dy + top) / 2);
  } else if (selectedDimension === "diameter") {
    const y = dy - cp * d.body * 0.45 * scale;
    const radius = d.radius * scale;
    drawMeasurement(bodyCenter - radius, y, bodyCenter + radius, y, d.diameter, bodyCenter, y - 15);
  } else {
    const divider = selectedDimension === "dividerHeight";
    const measuredHeight = divider ? d.divider : selectedPart === "lid" ? d.lid : d.body;
    const x = divider ? dx + bounds[2] * scale + 13
      : selectedPart === "lid" ? dx + d.lidDiameter * scale / 2 + 13
      : bodyCenter - d.radius * scale - 13;
    const top = dy - cp * measuredHeight * scale;
    drawMeasurement(x, dy, x, top, measuredHeight, x, (dy + top) / 2);
  }
  if (separate) {
    ctx.font = '600 12px "Yu Gothic UI",sans-serif';
    ctx.textAlign = "center";
    ctx.fillStyle = "#4a6258";
    ["胴", "回転フタ", "仕切り"].forEach((name,i) => ctx.fillText(name, dx + (i - 1) * spread * scale, height - 14));
  }
}

function drawMeasurement(x1, y1, x2, y2, value, labelX, labelY) {
  const dx = y1 === y2 ? 0 : 5;
  const dy = y1 === y2 ? 5 : 0;
  const line = () => {
    ctx.beginPath();
    ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    ctx.moveTo(x1 - dx, y1 - dy); ctx.lineTo(x1 + dx, y1 + dy);
    ctx.moveTo(x2 - dx, y2 - dy); ctx.lineTo(x2 + dx, y2 + dy);
    ctx.stroke();
  };
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#f8fcf8";
  line();
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = "#12513d";
  line();
  const label = `${Number(value.toFixed(2))} mm`;
  ctx.font = '700 12px "Yu Gothic UI",sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const width = ctx.measureText(label).width + 12;
  const center = Math.max(width / 2 + 2, Math.min(canvas.clientWidth - width / 2 - 2, labelX));
  ctx.fillStyle = "#f8fcf8";
  ctx.fillRect(center - width / 2, labelY - 9, width, 18);
  ctx.fillStyle = "#12513d";
  ctx.fillText(label, center, labelY);
  ctx.textBaseline = "alphabetic";
}

function setView(next) {
  view = next;
  for (const button of viewButtons) button.setAttribute("aria-pressed", String(button.dataset.view === view));
  const label = { parts: "パーツ別表示", closed: "フタを閉じた組み立て", open: "フタを外した組み立てで、胴の中に仕切りが入った状態" };
  canvas.setAttribute("aria-label", "ペンケースの3Dプレビュー。" + label[next]);
  byId("shell-legend").textContent = next === "open" ? "胴" : "胴・フタ";
  byId("divider-legend").hidden = next === "closed";
  requestDraw();
}

function selectPart(tab) {
  selectedPart = tab.dataset.part;
  selectedDimension = selectedPart === "body" ? "bodyHeight" : "lidHeight";
  for (const button of tabs) {
    const active = button === tab;
    button.setAttribute("aria-selected", String(active));
    button.tabIndex = active ? 0 : -1;
    byId(button.getAttribute("aria-controls")).hidden = !active;
  }
  setView("parts");
}

for (const input of [...inputs, dividerInput]) {
  input.addEventListener("focus", () => {
    selectedDimension = input.id;
    setView("parts");
  });
  input.addEventListener("input", () => {
    preset.value = "";
    refresh();
  });
}
advanced.addEventListener("change", () => {
  byId("divider-options").hidden = !advanced.checked;
  selectedDimension = advanced.checked ? "dividerHeight" : "bodyHeight";
  if (dividerInput.value !== "") preset.value = "";
  setView("parts");
  refresh();
});
preset.addEventListener("change", () => {
  for (const el of inputs) el.value = presets[preset.value][el.id];
  dividerInput.value = "";
  refresh();
});
for (const [index, tab] of tabs.entries()) {
  tab.addEventListener("click", () => selectPart(tab));
  tab.addEventListener("keydown", event => {
    const next = { ArrowLeft: (index + tabs.length - 1) % tabs.length,
      ArrowRight: (index + 1) % tabs.length, Home: 0, End: tabs.length - 1 }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    selectPart(tabs[next]);
    tabs[next].focus();
  });
}
byId("dimensions").addEventListener("submit", e => e.preventDefault());
for (const button of viewButtons) button.addEventListener("click", () => setView(button.dataset.view));
new ResizeObserver(requestDraw).observe(canvas);

function save(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

for (const button of stl) button.addEventListener("click", () => {
  if (!current) return;
  const part = button.dataset.stl;
  save(new Blob([binaryStl(mesh(current, part))], { type: "model/stl" }), `pen-case-${current.diameter}-${current.closed}-${part}.stl`);
  status.textContent = "STLを作成しました。";
});
download.addEventListener("click", async () => {
  if (!current || busy) return;
  const d = current;
  busy = true;
  setButtons();
  status.textContent = "3MFを作成中…";
  try {
    const { project } = await import("./export.mjs");
    save(await project(d), `pen-case-${d.diameter}-${d.closed}-A1.3mf`);
    status.textContent = "3MFを作成しました。Bambu Studioで開けます。";
  } catch {
    status.textContent = "3MFを作成できませんでした。ページを再読み込みしてもう一度お試しください。";
  } finally {
    busy = false;
    setButtons();
  }
});
refresh();
