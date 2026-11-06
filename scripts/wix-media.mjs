// 예전 Wix 사이트 이미지를 원본 해상도로 내려받는다.
// 사용법: node scripts/wix-media.mjs <목록.txt> <출력폴더>
// 목록 한 줄: `URL [파일명]` — URL의 `/v1/...` 이하는 잘라내 원본을 받는다. 이미 있는 파일은 건너뛴다.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

export function originalUrl(url) {
  const u = url.startsWith('http') ? url : `https://${url}`;
  return u.replace(/\/v1\/.*$/, '');
}

async function main() {
  const [list, outDir] = process.argv.slice(2);
  if (!list || !outDir) {
    console.error('사용법: node scripts/wix-media.mjs <목록.txt> <출력폴더>');
    process.exit(2);
  }
  mkdirSync(outDir, { recursive: true });
  const failed = [];
  const lines = readFileSync(list, 'utf8').split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
  for (const line of lines) {
    const [raw, name] = line.split(/\s+/);
    const url = originalUrl(raw);
    const file = join(outDir, name ?? basename(new URL(url).pathname));
    if (existsSync(file)) {
      console.log(`건너뜀 ${file}`);
      continue;
    }
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      writeFileSync(file, Buffer.from(await res.arrayBuffer()));
      console.log(`받음 ${file}`);
    } catch (e) {
      failed.push(`${url} (${e.message})`);
    }
  }
  if (failed.length) {
    console.error(`실패 ${failed.length}건:\n${failed.join('\n')}`);
    process.exit(1);
  }
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}` || process.argv[1]?.endsWith('wix-media.mjs')) {
  main();
}
