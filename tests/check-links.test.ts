import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { expect, test } from 'vitest';
// @ts-expect-error -- plain ESM script without types
import { findBrokenLinks } from '../scripts/check-links.mjs';

function site(files: Record<string, string>) {
  const dir = mkdtempSync(join(tmpdir(), 'naraol-dist-'));
  for (const [p, body] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, p)), { recursive: true });
    writeFileSync(join(dir, p), body, 'utf8');
  }
  return dir;
}

test('resolves percent-encoded Korean paths', async () => {
  const dir = site({
    'archive/photos/2025-11-제12회-학술제/index.html': '<p>ok</p>',
    'index.html': '<a href="/archive/photos/2025-11-%EC%A0%9C12%ED%9A%8C-%ED%95%99%EC%88%A0%EC%A0%9C/">사진</a>',
  });
  expect(await findBrokenLinks(dir)).toEqual([]);
});

test('reports missing page and image', async () => {
  const dir = site({ 'index.html': '<a href="/nope/"><img src="/_astro/x.webp"></a>' });
  expect(await findBrokenLinks(dir)).toEqual(['index.html -> /nope/', 'index.html -> /_astro/x.webp']);
});

test('ignores external, mailto, tel and hash links and checks srcset', async () => {
  const dir = site({
    'a.webp': 'x',
    'index.html':
      '<a href="https://example.com/">x</a><a href="mailto:a@b.c">m</a><a href="tel:010">t</a><a href="#top">h</a>' +
      '<img srcset="/a.webp 480w, /b.webp 960w">',
  });
  expect(await findBrokenLinks(dir)).toEqual(['index.html -> /b.webp']);
});
