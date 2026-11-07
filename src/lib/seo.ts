// 검색엔진(구글·네이버)용 구조화 데이터(JSON-LD)
type OrgLike = {
  name: string;
  address: string;
  phone: string;
  cafeUrl?: string;
  youtubeUrl?: string;
};

/** 010-1234-5678 → +82-10-1234-5678 */
const intlPhone = (p: string) => p.replace(/^0/, '+82-');

export function siteJsonLd(org: OrgLike, site: string, logoPath: string) {
  const url = new URL('/', site).href;
  const shortName = org.name.replace(/^\(사\)\s*/, '');
  const sameAs = [org.cafeUrl, org.youtubeUrl].filter((u): u is string => Boolean(u));
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: shortName,
      alternateName: [org.name, '사단법인 나라얼연구소', '나라얼 연구소'],
      url,
      inLanguage: 'ko-KR',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: org.name,
      alternateName: [shortName, '사단법인 나라얼연구소'],
      url,
      logo: new URL(logoPath, site).href,
      telephone: intlPhone(org.phone),
      address: { '@type': 'PostalAddress', streetAddress: org.address, addressLocality: '경산시', addressRegion: '경상북도', addressCountry: 'KR' },
      ...(sameAs.length ? { sameAs } : {}),
    },
  ] as const satisfies readonly Record<string, unknown>[];
}
