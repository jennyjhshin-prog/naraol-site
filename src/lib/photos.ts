import type { ImageMetadata } from 'astro';

const all = import.meta.glob<{ default: ImageMetadata }>('/src/content/photos/*/*.{jpg,jpeg,png,webp}', { eager: true });

/** 사진 기록 폴더(slug) 안의 이미지를 파일명순으로. */
export function photosIn(slug: string): ImageMetadata[] {
  const prefix = `/src/content/photos/${slug}/`;
  return Object.keys(all)
    .filter((k) => k.startsWith(prefix))
    .sort()
    .map((k) => all[k].default);
}

/** Date → YYYY-MM-DD (한국 시간 기준 빌드) */
export function isoDay(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
