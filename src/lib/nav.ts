export type NavItem = { label: string; href: string; children?: { label: string; href: string }[] };

export const NAV: NavItem[] = [
  {
    label: '연구소 소개',
    href: '/about/',
    children: [
      { label: '설립 목적', href: '/about/' },
      { label: '연혁', href: '/about/history/' },
      { label: '임원', href: '/about/people/' },
      { label: '법인 정보·오시는 길', href: '/about/info/' },
    ],
  },
  {
    label: '주요 사업',
    href: '/programs/conference/',
    children: [
      { label: '국제학술대회', href: '/programs/conference/' },
      { label: '인문학강좌', href: '/programs/lectures/' },
      { label: '물볕아카데미', href: '/programs/academy/' },
      { label: '문화예술·문화공간 물볕', href: '/programs/culture/' },
    ],
  },
  { label: '경산상엿집', href: '/sangyeotjip/' },
  {
    label: '아카이브',
    href: '/archive/press/',
    children: [
      { label: '언론보도', href: '/archive/press/' },
      { label: '사진 기록', href: '/archive/photos/' },
    ],
  },
  { label: '후원', href: '/support/' },
];
