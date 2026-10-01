import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('published privacy page distinguishes SDK versions and excludes practice data', () => {
  const html = readFileSync(new URL('../dist/works/10000-hours/privacy/index.html', import.meta.url), 'utf8');
  for (const phrase of ['2026年10月1日', '1.2以前', 'バージョン1.3以降', '購入履歴', '売上分析', '目標名、計測時間、履歴、設定', '匿名', 'TestFlight', 'Privacy policy', 'https://www.revenuecat.com/privacy']) {
    assert.ok(html.includes(phrase), `Missing privacy disclosure: ${phrase}`);
  }
  assert.ok(!html.includes('外部分析SDKおよび広告SDKも使用していません'));
});

test('app summary agrees with purchase disclosure', () => {
  const html = readFileSync(new URL('../dist/works/10000-hours/index.html', import.meta.url), 'utf8');
  assert.ok(html.includes('RevenueCat'));
  assert.ok(html.includes('学習記録を外部へ送信しない'));
  assert.ok(!html.includes('外部分析SDK・広告SDKなし'));
});
