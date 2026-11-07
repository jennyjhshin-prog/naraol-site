// 공유 미리보기 이미지(1200×630) 생성: node scripts/make-og.mjs
import sharp from 'sharp';
const W = 1200, H = 630;
const overlay = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#17140F" stop-opacity=".9"/><stop offset=".6" stop-color="#17140F" stop-opacity=".55"/><stop offset="1" stop-color="#17140F" stop-opacity=".2"/></linearGradient></defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <rect x="80" y="210" width="44" height="2" fill="#CDB585"/>
  <text x="80" y="268" font-family="Malgun Gothic, sans-serif" font-size="28" fill="#E6DCCB" letter-spacing="10">사단법인</text>
  <text x="76" y="360" font-family="Batang, 'Noto Serif KR', serif" font-weight="700" font-size="96" fill="#FBF7EF">나라얼연구소</text>
  <rect x="700" y="290" width="62" height="62" rx="4" fill="#9B2D24" transform="rotate(-3 731 321)"/>
  <text x="731" y="317" text-anchor="middle" font-family="Batang, serif" font-weight="700" font-size="19" fill="#F8EDE4" transform="rotate(-3 731 321)">나라</text>
  <text x="731" y="340" text-anchor="middle" font-family="Batang, serif" font-weight="700" font-size="19" fill="#F8EDE4" transform="rotate(-3 731 321)">얼</text>
  <text x="80" y="430" font-family="Batang, serif" font-size="30" fill="#EDE5D6">한국 전통 상·제례 문화 연구 · 국가민속문화재 제266호 경산상엿집</text>
  <text x="80" y="560" font-family="Malgun Gothic, sans-serif" font-size="24" fill="#CDB585" letter-spacing="2">naraol.org</text>
</svg>`);
await sharp('src/assets/sangyeotjip/sangyeotjip-02.jpg')
  .resize(W, H, { fit: 'cover', position: 'centre' })
  .modulate({ saturation: .75, brightness: .85 })
  .composite([{ input: overlay }])
  .jpeg({ quality: 82, mozjpeg: true })
  .toFile('public/og-image.jpg');
console.log('public/og-image.jpg');
