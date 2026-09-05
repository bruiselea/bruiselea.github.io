import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve('dist');
const page = (path) => readFileSync(resolve(root, path, 'index.html'), 'utf8');
const base = 'works/hand-spinner';

for (const suffix of ['', '/support', '/privacy']) {
  test(`Hand Spinner ${suffix || 'product'} has public English content and valid local links`, () => {
    const html = page(base + suffix);
    assert.match(html, /<html lang="en"/);
    assert.match(html, /Hand Spinner/);
    assert.doesNotMatch(html, /chatgpt\.site|laborobo|Sign in required|Natsukiktst|NATSUKI SATOU/);
    assert.doesNotMatch(html, /<script|<form|<iframe/);
    assert.match(html, /<meta property="og:image" content="https:\/\/nuunnu\.com\//);
    for (const [, path] of html.matchAll(/(?:src|href)="(\/[^"#?]*)/g)) {
      assert.ok(existsSync(resolve(root, '.' + path)), `missing local resource ${path}`);
    }
  });
}

test('product is discoverable and honest about availability', () => {
  assert.match(page('works'), /href="\/works\/hand-spinner\/"/);
  const html = page(base);
  for (const name of ['Coming soon', '1998', 'Atomic Purple', 'Glacier Blue', 'Smoke', 'Tangerine', 'one-time']) {
    assert.ok(html.includes(name), `missing ${name}`);
  }
  assert.doesNotMatch(html, /apps\.apple\.com|Download on the (?:Mac )?App Store/);
});

test('the Studio does not gain a new spatial object', () => {
  assert.doesNotMatch(page(''), /orbit-label--hand-spinner/);
});

test('support covers play, escape, drag, restore and failure', () => {
  const html = page(base + '/support');
  for (const text of ['START SPINNING', 'Option', 'Space', 'Escape', 'drag', 'Restore Purchases', 'Apple Account', 'cancel', 'unavailable', 'mailto:wlknts28786@gmail.com']) {
    assert.ok(html.includes(text), `missing ${text}`);
  }
});

test('privacy distinguishes input, local settings, purchases and support', () => {
  const html = page(base + '/privacy');
  for (const text of ['not recorded or transmitted', 'preferences', 'StoreKit', 'support', 'analytics', 'September 5, 2026']) {
    assert.ok(html.includes(text), `missing ${text}`);
  }
});
