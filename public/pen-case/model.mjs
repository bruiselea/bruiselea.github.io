export const defaults = { diameter: 50, bodyHeight: 120.24, lidHeight: 58.64 };
const tau = 2 * Math.PI;
export const floor = 0.96, engagement = 17.64, bodyWall = 1.10, lidWall = 1.45;
const depth = 0.95, clearance = 0.35, stretch = 1.5, lead = 21.6;
const clean = x => Number(x.toFixed(2));
const align = x => clean(0.4 + Math.round((x - 0.4) / 0.56) * 0.56);
const ramp = (x, a, b) => Math.max(0, Math.min(1, (x - a) / (b - a)));

export function dimensions({ diameter, bodyHeight, lidHeight, dividerHeight }) {
  if (![diameter, bodyHeight, lidHeight].every(x => Number.isFinite(x) && x > 0)) {
    throw new Error("寸法を正の数で入力してください。");
  }
  const body = align(bodyHeight);
  const lid = align(lidHeight);
  const extension = clean(lid - floor - engagement);
  const radius = diameter / 2;
  const lidDiameter = clean(diameter + 2 * (lidWall + clearance));
  const dividerRadius = radius - bodyWall - depth - clearance;
  const maxDivider = clean(Math.floor((body - floor - 0.5) / 0.32 + 1e-9) * 0.32);
  const divider = dividerHeight === undefined ? maxDivider : clean(Math.round(dividerHeight / 0.32) * 0.32);
  if (dividerRadius <= 1.9 / Math.sqrt(3) + 0.4) throw new Error("仕切りが入るように、胴の外径を広げてください。");
  if (body < 24.39) throw new Error("ねじ部を確保するため、胴の高さを24.4 mm以上にしてください。");
  if (extension < 0) throw new Error("ねじ部を確保するため、フタの高さを18.88 mm以上にしてください。");
  if (Math.max(lidDiameter, body, lid) > 256) throw new Error("A1の造形範囲（256 mm角）に収まる寸法を入力してください。");
  if (!Number.isFinite(divider) || divider < 1.60 || divider > maxDivider) {
    throw new Error(`仕切りの長さは1.60〜${maxDivider.toFixed(2)} mmで入力してください。`);
  }
  return { diameter, radius, body, lid, extension, lidDiameter, divider, maxDivider, dividerRadius,
    closed: clean(body + lid - engagement), inside: clean(body + lid - engagement - 2 * floor) };
}

function thread(phase) {
  const pitch = lead / 3;
  const distance = Math.abs(((phase + pitch / 2) % pitch + pitch) % pitch - pitch / 2);
  return 1 - ramp(distance, 0.35, 3.25);
}

function shellRadius(d, part, z, a) {
  const bevel = 0.24 * (1 - ramp(z, 0, 0.84));
  if (part === "body") {
    const y = (d.body - z) / stretch;
    const amplitude = 1 - ramp(y, 11.85, 15.70);
    const groove = 1 - ramp(y, 0.30, 3.95) * thread(y + lead * a / tau);
    return d.radius - depth * groove * amplitude - bevel;
  }
  const y = (z - floor - d.extension) / stretch;
  const blend = ramp(2.08 + y, 2.30, 6.00) * (1 - ramp(2.08 + y, 9.10, 13.84));
  return d.radius + lidWall + clearance - depth * (1 - thread(y - lead * a / tau)) * blend - bevel;
}

function joinRings(rings, bottom, top) {
  const size = rings[0].length;
  const vertices = rings.flat();
  const faces = [];
  for (let k = 0; k < rings.length - 1; k++) {
    for (let i = 0; i < size; i++) {
      const a = k * size + i, b = k * size + (i + 1) % size;
      faces.push([a, b, b + size], [a, b + size, a + size]);
    }
  }
  const end = (rings.length - 1) * size;
  for (let i = 0; i < size; i++) {
    const j = (i + 1) % size;
    faces.push([vertices.length, j, i], [vertices.length + 1, end + i, end + j]);
  }
  vertices.push([0, 0, bottom], [0, 0, top]);
  return { vertices, faces };
}

export function mesh(d, part, preview = false) {
  if (part === "divider") {
    const corners = (r, z) => {
      const half = Math.asin(1.90 / (2 * r));
      const polar = (radius, angle) => [radius * Math.cos(angle), radius * Math.sin(angle), z];
      return [0, tau / 3, 2 * tau / 3].flatMap(a => [
        ...[-half, -half / 2, 0, half / 2, half].map(t => polar(r, a + t)),
        polar(1.90 / Math.sqrt(3), a + tau / 6),
      ]);
    };
    const r = d.dividerRadius, h = d.divider;
    return joinRings([corners(r - 0.40, 0), corners(r, 0.64),
      corners(r, h - 0.64), corners(r - 0.40, h)], 0, h);
  }
  const isBody = part === "body";
  const height = isBody ? d.body : d.lid;
  const straight = isBody ? d.body - 15.70 * stretch : floor + d.extension;
  const sides = preview ? 64 : 240;
  const step = preview ? 0.85 : 0.08;
  const angles = Array.from({ length: sides }, (_, i) => tau * i / sides);
  const rings = (start, inset) => {
    const marks = [start, ...[0.84, straight].filter(z => z > start && z < height), height];
    const heights = [start];
    for (let i = 1; i < marks.length; i++) {
      const low = marks[i - 1], high = marks[i];
      const steps = low >= 0.84 && high <= straight ? 1 : Math.max(1, Math.round((high - low) / step));
      for (let k = 1; k < steps; k++) heights.push(low + (high - low) * k / steps);
      heights.push(high);
    }
    return heights.map(z => angles.map(a => {
      const r = shellRadius(d, part, z, a) - inset;
      return [r * Math.cos(a), r * Math.sin(a), z];
    }));
  };
  const inner = rings(floor, isBody ? bodyWall : lidWall).reverse();
  const shell = joinRings([...rings(0, 0), ...inner], 0, floor);
  if (preview) shell.rim = inner[0];
  return shell;
}

export function binaryStl({ vertices, faces }) {
  const view = new DataView(new ArrayBuffer(84 + 50 * faces.length));
  view.setUint32(80, faces.length, true);
  for (let i = 0; i < faces.length; i++) {
    let offset = 96 + i * 50;
    for (const index of faces[i]) {
      for (const coordinate of vertices[index]) {
        view.setFloat32(offset, coordinate, true);
        offset += 4;
      }
    }
  }
  return view.buffer;
}
