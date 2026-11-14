import { mesh } from "./model.mjs";
import { template } from "./project-template.mjs";

const encoder = new TextEncoder();
const crcTable = Array.from({ length: 256 }, (_, i) => {
  for (let bit = 0; bit < 8; bit++) i = (i >>> 1) ^ (i & 1 ? 0xedb88320 : 0);
  return i;
});

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 255];
  return (crc ^ 0xffffffff) >>> 0;
}

async function zip(entries) {
  const chunks = [], directory = [];
  let offset = 0, directorySize = 0;
  for (const [name, content] of Object.entries(entries)) {
    const filename = encoder.encode(name);
    const source = typeof content === "string" ? encoder.encode(content) : content;
    const method = typeof CompressionStream === "function" ? 8 : 0;
    const compressed = method
      ? new Uint8Array(await new Response(new Blob([source]).stream().pipeThrough(new CompressionStream("deflate-raw"))).arrayBuffer())
      : source;
    const local = new DataView(new ArrayBuffer(30 + filename.length));
    const central = new DataView(new ArrayBuffer(46 + filename.length));
    const crc = crc32(source);
    const writeFields = (header, start) => {
      header.setUint16(start, 20, true);
      header.setUint16(start + 4, method, true);
      header.setUint32(start + 10, crc, true);
      header.setUint32(start + 14, compressed.length, true);
      header.setUint32(start + 18, source.length, true);
      header.setUint16(start + 22, filename.length, true);
    };
    local.setUint32(0, 0x04034b50, true);
    writeFields(local, 4);
    new Uint8Array(local.buffer, 30).set(filename);
    central.setUint32(0, 0x02014b50, true);
    central.setUint16(4, 20, true);
    writeFields(central, 6);
    central.setUint32(42, offset, true);
    new Uint8Array(central.buffer, 46).set(filename);
    chunks.push(local.buffer, compressed);
    directory.push(central.buffer);
    offset += local.byteLength + compressed.length;
    directorySize += central.byteLength;
  }
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, directory.length, true);
  end.setUint16(10, directory.length, true);
  end.setUint32(12, directorySize, true);
  end.setUint32(16, offset, true);
  return new Blob([...chunks, ...directory, end.buffer], { type: "model/3mf" });
}

const core = "http://schemas.microsoft.com/3dmanufacturing/core/2015/02";
const production = "http://schemas.microsoft.com/3dmanufacturing/production/2015/06";
const componentTransform = "1 0 0 0 1 0 0 0 1 128 128 0";
const matrix = "1 0 0 128 0 1 0 128 0 0 1 0 0 0 0 1";

export async function project(d) {
  const files = { ...template };
  for (const filename of Object.keys(files)) {
    if (filename.endsWith(".png")) files[filename] = Uint8Array.from(atob(files[filename]), c => c.charCodeAt(0));
  }
  files["3D/3dmodel.model"] = files["3D/3dmodel.model"].replace(/(<component [^>]* transform=")[^"]+/g, (_, prefix) => prefix + componentTransform);
  let config = files["Metadata/model_settings.config"];
  const parts = [
    ["body", 1, "01 Pen case body"],
    ["lid", 2, "02 Twist lid"],
    ["divider", 3, `03 PETG divider (${d.compartments}-way)`],
  ];
  for (const [part, plate, name] of parts) {
    const m = mesh(d, part);
    const vertices = m.vertices.map(([x, y, z]) => `<vertex x="${x.toFixed(7)}" y="${y.toFixed(7)}" z="${z.toFixed(7)}"/>`).join("");
    const faces = m.faces.map(([a, b, c]) => `<triangle v1="${a}" v2="${b}" v3="${c}"/>`).join("");
    const id = plate * 2 - 1;
    files[`3D/Objects/object_${plate}.model`] = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xmlns="${core}" xmlns:p="${production}" xmlns:BambuStudio="http://schemas.bambulab.com/package/2021" requiredextensions="p">
<metadata name="BambuStudio:3mfVersion">1</metadata><resources>
<object id="${id}" type="model" p:UUID="000${plate}0000-81cb-4c03-9d28-80fed5dfa1dc"><mesh>
<vertices>${vertices}</vertices><triangles>${faces}</triangles>
</mesh></object></resources></model>`;
    const object = new RegExp(`<object id="${id + 1}">[\\s\\S]*?</object>`);
    config = config.replace(object, section => section
      .replace(/face_count="\d+"/g, `face_count="${m.faces.length}"`)
      .replace(/(key="name" value=")[^"]+/g, (_, prefix) => prefix + name)
      .replace(/(key="matrix" value=")[^"]+/g, (_, prefix) => prefix + matrix)
      .replace(/(key="source_offset_[xyz]" value=")[^"]+/g, (_, prefix) => prefix + "0"));
  }
  let plate = 0;
  config = config.replace(/(key="plater_name" value=")[^"]+/g, (_, prefix) => prefix + parts[plate++][2]);
  if (d.compartments !== 3) {
    // The bundled divider images depict the original three-way insert.
    const previewFiles = Object.keys(files).filter(name => /_3(?:_small)?\.png$/.test(name));
    const obsolete = new Set(previewFiles);
    config = config.replace(/^[\t ]*<metadata key="(?:thumbnail_file|thumbnail_no_light_file|top_file|pick_file)" value="([^"]+)"\/>\r?\n/gm,
      (line, filename) => obsolete.has(filename) ? "" : line);
    for (const filename of previewFiles) delete files[filename];
  }
  files["Metadata/model_settings.config"] = config;
  return zip(files);
}
