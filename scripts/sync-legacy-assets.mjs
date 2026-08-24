import { cp, copyFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const publicDir = resolve(root, "public");

await mkdir(publicDir, { recursive: true });

const directories = ["pccam", "svgmaker", "app-previews", "snsicons"];
for (const name of directories) {
  const source = resolve(root, name);
  if (existsSync(source)) {
    await cp(source, resolve(publicDir, name), { recursive: true, force: true });
  }
}

const files = ["sns-links.html", "sns-links-business.html"];
for (const name of files) {
  const source = resolve(root, name);
  if (existsSync(source)) {
    await copyFile(source, resolve(publicDir, name));
  }
}

const fontSource = resolve(root, "GoogleSansFlex.ttf");
if (existsSync(fontSource)) {
  const fontsDir = resolve(publicDir, "fonts");
  await mkdir(fontsDir, { recursive: true });
  await copyFile(fontSource, resolve(fontsDir, "GoogleSansFlex.ttf"));
}
