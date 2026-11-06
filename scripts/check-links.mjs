// 빌드 결과(dist)의 내부 링크·이미지가 실제 파일을 가리키는지 검사한다.
// 사용법: node scripts/check-links.mjs dist   (깨진 링크가 있으면 종료 코드 1)
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

function htmlFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...htmlFiles(p));
    else if (name.endsWith('.html')) out.push(p);
  }
  return out;
}

function linksIn(html) {
  const links = [];
  for (const m of html.matchAll(/\s(?:href|src)\s*=\s*["']([^"']+)["']/g)) links.push(m[1]);
  for (const m of html.matchAll(/\ssrcset\s*=\s*["']([^"']+)["']/g)) {
    for (const part of m[1].split(',')) {
      const url = part.trim().split(/\s+/)[0];
      if (url) links.push(url);
    }
  }
  return links;
}

function exists(distDir, link) {
  let p = link.split('#')[0].split('?')[0];
  try {
    p = decodeURIComponent(p);
  } catch {
    return false;
  }
  const base = join(distDir, p);
  const isFile = (f) => existsSync(f) && statSync(f).isFile();
  return isFile(base) || isFile(join(base, 'index.html')) || isFile(`${base.replace(/[\\/]$/, '')}.html`);
}

/** @returns {Promise<string[]>} `"<페이지> -> <링크>"` 목록 */
export async function findBrokenLinks(distDir) {
  const broken = [];
  for (const file of htmlFiles(distDir).sort()) {
    const page = relative(distDir, file).split(sep).join('/');
    const seen = new Set();
    for (const link of linksIn(readFileSync(file, 'utf8'))) {
      if (!link.startsWith('/') || link.startsWith('//')) continue;
      if (seen.has(link)) continue;
      seen.add(link);
      if (!exists(distDir, link)) broken.push(`${page} -> ${link}`);
    }
  }
  return broken;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const dir = process.argv[2] ?? 'dist';
  const broken = await findBrokenLinks(dir);
  if (broken.length) {
    console.error(`깨진 링크 ${broken.length}건:\n${broken.join('\n')}`);
    process.exit(1);
  }
  console.log('깨진 링크 없음');
}
