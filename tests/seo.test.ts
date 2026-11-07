import { describe, expect, it } from 'vitest';
import { siteJsonLd } from '../src/lib/seo';

const org = {
  name: '(사)나라얼연구소',
  address: '경북 경산시 하양읍 무학로62길 162',
  phone: '010-8101-2414',
  kakaoUrl: 'http://pf.kakao.com/_tSdcn/chat',
  cafeUrl: 'https://cafe.daum.net/dagugukhak',
  youtubeUrl: 'https://www.youtube.com/@x',
};

describe('siteJsonLd', () => {
  const [site, corp] = siteJsonLd(org, 'https://naraol.org', '/logo.png');

  it('사이트 이름은 (사) 없이 "나라얼연구소", 정식 명칭은 별칭으로', () => {
    expect(site['@type']).toBe('WebSite');
    expect(site.name).toBe('나라얼연구소');
    expect(site.alternateName).toContain('(사)나라얼연구소');
    expect(site.url).toBe('https://naraol.org/');
  });

  it('기관 정보에 주소·전화·로고·외부 채널이 들어간다', () => {
    expect(corp['@type']).toBe('Organization');
    expect(corp.name).toBe('(사)나라얼연구소');
    expect(corp.logo).toBe('https://naraol.org/logo.png');
    expect(corp.telephone).toBe('+82-10-8101-2414');
    expect(corp.address).toMatchObject({ '@type': 'PostalAddress', addressCountry: 'KR', streetAddress: org.address });
    expect(corp.sameAs).toEqual([org.cafeUrl, org.youtubeUrl]);
  });

  it('없는 채널은 sameAs 에서 빠진다', () => {
    const [, c] = siteJsonLd({ ...org, cafeUrl: undefined, youtubeUrl: undefined }, 'https://naraol.org', '/logo.png');
    expect(c.sameAs).toBeUndefined();
  });
});
