// 큰 원본 사진을 긴 변 2000px, JPEG 품질 85로 줄인다 (저장소 용량 관리).
// 사용법: node scripts/shrink-images.mjs <폴더>
import { readdirSync, renameSync, unlinkSync } from 'node:fs';
import { extname, join } from 'node:path';
import sharp from 'sharp';

const dir = process.argv[2];
for (const f of readdirSync(dir)) {
  const ext = extname(f).toLowerCase();
  if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) continue;
  const src = join(dir, f);
  const meta = await sharp(src).metadata();
  const big = Math.max(meta.width ?? 0, meta.height ?? 0) > 2000;
  if (!big && ext !== '.png') continue;
  const out = join(dir, f.replace(/\.(png|jpeg|webp)$/i, '.jpg'));
  const tmp = out + '.tmp';
  await sharp(src).rotate().resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true }).flatten({ background: '#ffffff' }).jpeg({ quality: 85, mozjpeg: true }).toFile(tmp);
  if (src !== out) unlinkSync(src);
  renameSync(tmp, out);
  console.log(`줄임 ${f}`);
}
