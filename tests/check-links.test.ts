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

test('CLI reports broken links even when invoked with a differently-cased path', async () => {
  const { spawnSync } = await import('node:child_process');
  const { resolve } = await import('node:path');
  const dir = site({ 'index.html': '<a href="/nope/">x</a>' });
  let script = resolve('scripts/check-links.mjs');
  script = /^[A-Z]:/.test(script) ? script[0].toLowerCase() + script.slice(1) : script;
  const r = spawnSync(process.execPath, [script, dir], { encoding: 'utf8' });
  expect(r.status).toBe(1);
  expect(r.stderr).toContain('index.html -> /nope/');
});

test('CLI prints how many pages and links it checked on a clean run', async () => {
  const { spawnSync } = await import('node:child_process');
  const dir = site({ 'index.html': '<a href="/">home</a>', 'a/index.html': '<a href="/a/">a</a>' });
  const r = spawnSync(process.execPath, ['scripts/check-links.mjs', dir], { encoding: 'utf8' });
  expect(r.status).toBe(0);
  expect(r.stdout).toContain('2개 페이지');
  expect(r.stdout).toContain('2개 링크');
});
