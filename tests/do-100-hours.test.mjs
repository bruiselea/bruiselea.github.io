import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const page = (path) => readFileSync(resolve('dist', path, 'index.html'), 'utf8');
const base = 'works/do-100-hours';

for (const suffix of ['', '/support', '/privacy']) {
  test(`Do 100 Hours ${suffix || 'product'} is public and has valid local links`, () => {
    const html = page(base + suffix);
    assert.match(html, /Do 100 Hours/);
    assert.match(html, /<html lang="ja"/);
    assert.doesNotMatch(html, /<script|<form|<iframe|chatgpt\.site/);
    for (const [, path] of html.matchAll(/(?:src|href)="(\/[^"#?]*)/g)) {
      assert.ok(existsSync(resolve('dist', '.' + path)), `missing local resource ${path}`);
    }
  });
}

test('Works links to the distinct app without changing Studio objects', () => {
  assert.match(page('works'), /href="\/works\/do-100-hours\/"/);
  assert.doesNotMatch(page(''), /orbit-label--hundred-hours/);
});

test('product is honest about launch, free slots and purchase', () => {
  const html = page(base);
  for (const text of ['公開準備中', '3つまで無料', '買い切り', '500円', '1マス', '完了', 'ウィジェット', '保証']) {
    assert.ok(html.includes(text), `missing ${text}`);
  }
  assert.doesNotMatch(html, /apps\.apple\.com|7割|必ず上達/);
});

test('support prioritizes record safety and correct commerce recovery', () => {
  const html = page(base + '/support');
  for (const text of ['チェック', '保留', '購入を復元', 'Apple Account', '再購入', '削除・再インストール', 'mailto:wlknts28786@gmail.com']) {
    assert.ok(html.includes(text), `missing ${text}`);
  }
});

test('privacy describes this app, not the original RevenueCat app', () => {
  const html = page(base + '/privacy');
  for (const text of ['2026年10月27日', '佐藤夏樹', '目標名', 'App Group', 'StoreKit', 'バックアップ', 'お問い合わせ', 'GitHub Pages', 'Privacy policy', 'not sent to the developer']) {
    assert.ok(html.includes(text), `missing ${text}`);
  }
  assert.doesNotMatch(html, /RevenueCat|目標ごとの記録を編集・削除できます/);
});
