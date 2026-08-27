import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const output = resolve("dist");
const read = (route) => readFileSync(resolve(output, `.${route}index.html`), "utf8");
const index = read("/works/");
assert(index.includes('href="/works/hondana-scan/"'), "Works must link to the app");
for (const route of ["/works/hondana-scan/", "/works/hondana-scan/privacy/"]) {
  const html = read(route);
  assert(html.includes("本棚スキャン"));
  assert(html.includes("mailto:wlknts28786@gmail.com"));
  assert(html.includes('property="og:image" content="https://nuunnu.com/works/hondana-scan/app-icon.png"'));
  assert(html.includes('name="twitter:title" content="本棚スキャン'));
  for (const match of html.matchAll(/(?:href|src)="(\/[^"?#]*)(?:#[^"]*)?"/g)) {
    const localPath = resolve(output, `.${match[1]}`);
    assert(existsSync(localPath), `Missing local target: ${match[1]}`);
  }
  assert(!html.includes("Cloudflare"), "No obsolete hosting instructions");
}
const app = read("/works/hondana-scan/");
assert(app.includes('id="support"'));
assert(app.includes('href="/works/hondana-scan/privacy/"'));
assert(app.includes("App Store公開準備中"));
const policy = read("/works/hondana-scan/privacy/");
for (const text of ["Google Books", "国立国会図書館サーチ", "Open Library", "表紙", "削除", "バックアップ"]) {
  assert(policy.includes(text), `Missing privacy topic: ${text}`);
}
assert(existsSync(resolve(output, "works/10000-hours/privacy/index.html")));
console.log("Hondana Scan: Works link, support, privacy, local assets and social metadata passed.");
