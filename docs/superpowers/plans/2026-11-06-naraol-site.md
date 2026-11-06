# (사)나라얼연구소 홈페이지 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 예전 Wix 사이트 콘텐츠를 옮긴 Astro 정적 사이트를 만들어 GitHub Pages로 배포하고 `naraol.org`에 연결한다.

**Architecture:** Astro 정적 출력. 행사·언론보도·갤러리는 Content Collections(Markdown + zod 스키마), 임원·연혁·도서·아카데미·공통정보는 `src/data/*.yaml`. 날짜 판단 로직은 `src/lib/`의 순수 함수로 분리해 Vitest로 검증하고, 빌드 결과는 링크 검사 스크립트로 검증한다. GitHub Actions가 푸시·매일 cron·수동 실행 시 빌드·배포한다.

**Tech Stack:** Astro 5, TypeScript, Vitest, 일반 CSS, `@fontsource/noto-serif-kr`, Pretendard(`pretendard` npm), GitHub Actions(`withastro/action@v3`, `actions/deploy-pages@v4`)

**Spec:** `docs/superpowers/specs/2026-11-06-naraol-site-design.md`

## Global Constraints

- 프로젝트 루트: `C:\Users\q257v\Projects\naraol-site` (구글 드라이브 밖)
- Node 20 이상, Astro 5.x, `output: 'static'`, `site: 'https://naraol.org'`
- 모든 날짜 해석은 한국 시간: `package.json`의 `build`/`dev`/`test` 스크립트와 GitHub Actions에 `TZ=Asia/Seoul`을 설정
- 색상 토큰(정확한 값): `--paper #F5F0E6`, `--paper-deep #EAE2D2`, `--ink #2B2B2B`, `--ink-soft #5A554D`, `--accent #A83A2E`, `--line #D6CCB8`
- 글꼴: 제목 Noto Serif KR, 본문 Pretendard. 다크 모드 없음
- 휴대폰 좌우 여백 16px, 가로 스크롤 없음, 한글은 `word-break: keep-all`
- 메뉴(순서 고정): 연구소 소개 · 행사·강좌 · 문화공간 물볕 · 소식 · 후원안내
- 연락처: 주소 `경북 경산시 하양읍 무학로62길 162`, 전화 `010-8101-2414`, 카카오 `http://pf.kakao.com/_tSdcn/chat`
- 후원 계좌: `농협은행 351-0517-5594-13 황영례`, 연구회원 월 30,000원 / 일반회원 월 10,000원, 기부금 영수증 발급 안내
- 게시판·로그인·결제·CMS·다국어는 만들지 않는다
- 화면 문구는 한국어
- 커밋 메시지 끝에 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`

## Review Focus

1. **종료시각 없는 당일 행사** — `end`가 없는 오늘 행사는 그날 23:59(KST)까지 "예정"으로 보이고 신청 버튼이 살아 있어야 한다 → Task 2 테스트 `treats start-only event as open until end of its day`
2. **예정 행사가 하나도 없을 때** — 홈이 빈 칸 대신 최근 지난 행사 3개를 보여줘야 한다 → Task 2 테스트 `homeEvents falls back to recent past`
3. **한글 파일명/주소** — `2026-01-10-인문학포럼` 같은 슬러그가 퍼센트 인코딩된 링크로 나가도 링크 검사가 깨진 링크로 오판하지 않아야 한다 → Task 7 테스트 `resolves percent-encoded Korean paths`
4. **신청 링크 없음/지난 행사** — 버튼 대신 카카오톡·전화 안내가 나와야 한다 → Task 2 `isApplyOpen` 테스트 + Task 3 상세 페이지 확인 단계
5. **긴 한글 제목·약력이 375px에서 넘침** — 카드와 임원 약력이 가로 스크롤을 만들지 않아야 한다 → Task 8 화면 확인 단계(375px에서 `document.documentElement.scrollWidth <= 375`)

---

## File Structure

```
astro.config.mjs              site, static 출력
package.json                  scripts: dev/build/preview/test/check-links (TZ=Asia/Seoul)
vitest.config.ts
public/CNAME                  naraol.org
public/favicon.png
.github/workflows/deploy.yml  push(main) + cron + workflow_dispatch
src/content.config.ts         events, press, gallery 컬렉션 스키마
src/content/events/*.md
src/content/press/*.md
src/content/gallery/<slug>/index.md + 사진
src/data/site.yaml            연락처·계좌·카카오·메뉴
src/data/board.yaml | history.yaml | books.yaml | academy.yaml
src/lib/events.ts             예정/지난 구분, 신청 가능 여부
src/lib/format.ts             한국어 날짜 표기
src/lib/gallery.ts            갤러리 폴더 이미지 수집
src/styles/global.css         토큰, 기본 타이포, 레이아웃 유틸
src/layouts/Base.astro        <head>, Header, Footer
src/components/Header.astro | Footer.astro | EventCard.astro | PressItem.astro | ContactNote.astro | PageTitle.astro
src/pages/...                 스펙 3장의 경로 그대로
src/assets/                   로고, 페이지용 사진(상엿집 등)
scripts/check-links.mjs       dist 내부 링크·이미지 검사
scripts/wix-media.mjs         Wix 이미지 원본 다운로드
tests/events.test.ts | format.test.ts | check-links.test.ts
README.md                     한국어 운영 안내
```

---

### Task 1: 프로젝트 뼈대, 디자인 토큰, 공통 레이아웃, 배포 설정

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `.gitignore`, `public/CNAME`, `.github/workflows/deploy.yml`, `src/data/site.yaml`, `src/styles/global.css`, `src/layouts/Base.astro`, `src/components/Header.astro`, `src/components/Footer.astro`, `src/components/PageTitle.astro`, `src/pages/index.astro`(임시), `src/pages/404.astro`, `src/assets/logo.png`

**Interfaces:**
- Produces: `Base.astro` props `{ title: string; description?: string }` — `<title>`은 `${title} | (사)나라얼연구소`(홈은 `(사)나라얼연구소`만). `PageTitle.astro` props `{ title: string; lead?: string }`. `site.yaml` 키: `name, address, phone, kakao, mapUrl, bank: {name, account, holder}, dues: [{label, amount}], nav: [{label, href, children?: [{label, href}]}]`

- [ ] **Step 1:** `npm create astro@latest . -- --template minimal --typescript strict --no-install --no-git` 후 `npm i` / `npm i -D vitest @types/node` / `npm i @fontsource/noto-serif-kr pretendard`
- [ ] **Step 2:** `astro.config.mjs`에 `site: 'https://naraol.org'`, `trailingSlash: 'always'`. `package.json` scripts: `"dev": "cross-env TZ=Asia/Seoul astro dev"`, `"build": "cross-env TZ=Asia/Seoul astro build"`, `"test": "cross-env TZ=Asia/Seoul vitest run"`, `"check-links": "node scripts/check-links.mjs dist"` (`npm i -D cross-env`)
- [ ] **Step 3:** `site.yaml` 작성 — `nav` 하위 메뉴는 스펙 3장 경로 그대로(연구소 소개: 인사말·비전 `/about/`, 이사 및 임원, 연혁, 경산상엿집 / 행사·강좌: 전체 행사, 국제학술대회, 물볕아카데미 / 문화공간 물볕 `/space/` / 소식: 언론보도, 행사 갤러리 / 후원안내 `/support/`). `mapUrl`은 카카오맵 검색 링크 `https://map.kakao.com/?q=경북 경산시 하양읍 무학로62길 162`
- [ ] **Step 4:** `global.css` — Global Constraints의 토큰, `body{background:var(--paper);color:var(--ink)}`, 제목 Noto Serif KR, `.container{max-width:1120px;margin:0 auto;padding:0 16px}`, 카드 그리드 1→2(≥640px)→3열(≥960px), 링크·버튼 `--accent`, `:focus-visible` 외곽선
- [ ] **Step 5:** 로고 — 예전 사이트 머리말 로고 이미지를 `scripts/wix-media.mjs`(Task 6에서 작성할 스크립트를 이 단계에서 먼저 최소 형태로 만들어도 됨) 또는 브라우저로 원본 URL(`static.wixstatic.com/media/<id>` 뒤 `/v1/...` 제거)을 받아 `src/assets/logo.png`로 저장, 같은 이미지로 `public/favicon.png`
- [ ] **Step 6:** `Header.astro` — 로고+연구소명, PC 가로 메뉴(하위는 hover/focus-within 드롭다운), 768px 미만은 `<button aria-expanded>` 햄버거로 전체 메뉴 펼침(작은 인라인 스크립트). `Footer.astro` — `site.yaml`의 이름·주소·전화·카카오·후원 링크. `404.astro` — "찾으시는 페이지가 없습니다" + 홈·행사 링크
- [ ] **Step 7:** `deploy.yml` — `on: push(main) / schedule: cron '0 15 * * *'(KST 00:00) / workflow_dispatch`, `permissions: pages: write, id-token: write, contents: read`, `env: TZ: Asia/Seoul`, build job `withastro/action@v3`, deploy job `actions/deploy-pages@v4`. `public/CNAME` = `naraol.org`
- [ ] **Step 8:** 확인 — `npm run build` 성공, `dist/index.html`·`dist/404.html`·`dist/CNAME` 존재. `npm run dev` 후 브라우저 375px/1280px에서 메뉴 열고 닫기 확인
- [ ] **Step 9:** 커밋 `feat: Astro 뼈대, 디자인 토큰, 공통 레이아웃, 배포 워크플로`

---

### Task 2: 콘텐츠 스키마와 날짜 로직 (TDD)

**Files:**
- Create: `src/content.config.ts`, `src/lib/events.ts`, `src/lib/format.ts`, `tests/events.test.ts`, `tests/format.test.ts`

**Interfaces:**
- Produces (`src/lib/events.ts`), 입력은 컬렉션 항목의 `data`와 같은 모양:
  - `type EventLike = { start: Date; end?: Date; applyUrl?: string }`
  - `eventEndsAt(e: EventLike): Date` — `end`가 있으면 `end`, 없으면 `start` 날짜의 23:59:59.999(로컬=KST)
  - `splitEvents<T extends {data: EventLike}>(items: T[], now: Date): { upcoming: T[]; past: T[] }` — `eventEndsAt >= now`면 upcoming(시작 오름차순), 아니면 past(시작 내림차순)
  - `isApplyOpen(e: EventLike, now: Date): boolean` — `applyUrl`이 있고 `eventEndsAt(e) >= now`
  - `homeEvents<T>(items: T[], now: Date, n = 3): { items: T[]; kind: 'upcoming' | 'past' }` — upcoming 앞 n개, 없으면 past 앞 n개
- Produces (`src/lib/format.ts`):
  - `formatDate(d: Date): string` → `2026년 1월 10일 (토)`
  - `formatDateRange(start: Date, end?: Date): string` — 같은 날: `2026년 1월 10일 (토) 오전 11:00 – 오후 2:00`, 다른 날: `2025년 11월 7일 (금) – 11월 8일 (토)`, end 없음: 날짜만(시각이 00:00이 아니면 시각 포함)
- Produces (`src/content.config.ts`, `glob` 로더):
  - `events`: `title: string, start: z.coerce.date(), end?: z.coerce.date(), location: string, category: z.enum(['conference','lecture','booktalk','academy']), poster?: image(), applyUrl?: z.string().url(), summary?: string`
  - `press`: `title, outlet: string, date: z.coerce.date(), url?: z.string().url(), thumbnail?: image()`
  - `gallery`: `title: string, date: z.coerce.date(), cover: image()` (패턴 `*/index.md`)
  - 슬러그 = 파일명(확장자 제외) / 갤러리는 폴더명

- [ ] **Step 1: 실패하는 테스트 작성** `tests/events.test.ts`

```ts
const at = (s: string) => new Date(s); // TZ=Asia/Seoul
const ev = (start: string, end?: string, applyUrl?: string) =>
  ({ data: { start: at(start), end: end ? at(end) : undefined, applyUrl } });

test('treats start-only event as open until end of its day', () => {
  const e = ev('2026-01-10T11:00', undefined, 'https://forms.gle/x').data;
  expect(isApplyOpen(e, at('2026-01-10T23:00'))).toBe(true);
  expect(isApplyOpen(e, at('2026-01-11T00:01'))).toBe(false);
});
test('isApplyOpen is false without applyUrl', () => {
  expect(isApplyOpen(ev('2026-01-10T11:00').data, at('2026-01-01T00:00'))).toBe(false);
});
test('multi-day event stays upcoming until its end', () => {
  const items = [ev('2025-11-07T09:00', '2025-11-08T14:00')];
  expect(splitEvents(items, at('2025-11-08T10:00')).upcoming).toHaveLength(1);
  expect(splitEvents(items, at('2025-11-08T15:00')).past).toHaveLength(1);
});
test('splitEvents sorts upcoming asc and past desc', () => {
  const a = ev('2025-08-09T10:00'), b = ev('2025-11-07T09:00'), c = ev('2026-01-10T11:00'), d = ev('2026-02-01T11:00');
  const r = splitEvents([c, a, d, b], at('2025-12-01T00:00'));
  expect(r.upcoming).toEqual([c, d]);
  expect(r.past).toEqual([b, a]);
});
test('homeEvents falls back to recent past', () => {
  const a = ev('2025-08-09T10:00'), b = ev('2025-11-07T09:00');
  expect(homeEvents([a, b], at('2026-06-01T00:00'))).toEqual({ items: [b, a], kind: 'past' });
});
```

`tests/format.test.ts`:

```ts
expect(formatDate(new Date('2026-01-10T11:00'))).toBe('2026년 1월 10일 (토)');
expect(formatDateRange(new Date('2026-01-10T11:00'), new Date('2026-01-10T14:00')))
  .toBe('2026년 1월 10일 (토) 오전 11:00 – 오후 2:00');
expect(formatDateRange(new Date('2025-11-07T09:00'), new Date('2025-11-08T14:00')))
  .toBe('2025년 11월 7일 (금) – 11월 8일 (토)');
```

- [ ] **Step 2:** `npm test` → 함수 없음으로 FAIL 확인
- [ ] **Step 3:** `events.ts`, `format.ts` 구현 (`Intl` 대신 직접 조립해 출력 고정 — 요일 배열 `['일','월','화','수','목','금','토']`)
- [ ] **Step 4:** `npm test` → 전부 PASS
- [ ] **Step 5:** `content.config.ts` 작성, 샘플 행사 1개(`src/content/events/2026-01-10-인문학포럼.md`, 스펙 7장의 2026.1 포럼 정보)로 `npm run build` 성공 확인. `category`에 없는 값을 넣으면 빌드가 실패하는지 한 번 확인 후 되돌림
- [ ] **Step 6:** 커밋 `feat: 콘텐츠 스키마와 행사 날짜 로직`

---

### Task 3: 행사·강좌 페이지

**Files:**
- Create: `src/components/EventCard.astro`, `src/components/ContactNote.astro`, `src/pages/events/index.astro`, `src/pages/events/[slug].astro`, `src/pages/events/conference.astro`, `src/pages/events/academy.astro`, `src/data/academy.yaml`

**Interfaces:**
- Consumes: Task 2의 `splitEvents`, `isApplyOpen`, `formatDateRange`, `events` 컬렉션; Task 1의 `Base`, `PageTitle`, `site.yaml`
- Produces: `EventCard.astro` props `{ entry: CollectionEntry<'events'> }` (포스터 또는 한지색 자리표시, 분류 배지, 날짜, 제목, 장소, `/events/<slug>/` 링크). `ContactNote.astro` props 없음 — "문의: 카카오톡 채널 / 010-8101-2414". `academy.yaml`: `courses: [{name, teacher, bio}]`, `terms: [{title, period, items: [string]}]`

- [ ] **Step 1:** `events/index.astro` — "다가오는 행사" / "지난 행사" 두 구획, 각각 `EventCard` 그리드. 분류 이름 표기: conference=국제학술대회, lecture=월례강좌·특강, booktalk=북토크·콘서트, academy=물볕아카데미
- [ ] **Step 2:** `events/[slug].astro` — 포스터, 제목, `formatDateRange`, 장소(+`site.mapUrl` 링크), 본문. `isApplyOpen`이면 `[신청하기]`(`target=_blank rel=noopener`), 아니면 `ContactNote`. 지난 행사는 "종료된 행사입니다" 표시
- [ ] **Step 3:** `conference.astro` — 학술대회 소개 문단(예전 `naraol-conference` 페이지 텍스트) + `category==='conference'` 행사 목록(최신순). `academy.astro` — `academy.yaml`의 강좌·강사 카드와 학기 기록 + `category==='academy'` 행사 목록
- [ ] **Step 4:** 확인 — 샘플 행사로 `npm run build` 후 미리보기: 신청 링크 있는 예정 행사는 버튼, `applyUrl` 지운 경우와 날짜를 과거로 바꾼 경우는 `ContactNote`가 보이는지 확인 후 원복
- [ ] **Step 5:** 커밋 `feat: 행사·강좌 페이지`

---

### Task 4: 연구소 소개 페이지

**Files:**
- Create: `src/pages/about/index.astro`, `src/pages/about/board.astro`, `src/pages/about/history.astro`, `src/pages/about/sangyeotjip.astro`, `src/data/board.yaml`, `src/data/history.yaml`

**Interfaces:**
- Produces: `board.yaml`: `[{name, role, bio: [string]}]` (role은 이사장/이사/감사 등). `history.yaml`: `[{year: number, items: [{no?: number, date: string, speaker: string, affiliation?: string, topic: string}]}]` 최신 연도가 먼저

- [ ] **Step 1:** 예전 페이지(`/naraeolyeonguso-isa`, `/인문학강좌연혁`, `/경산상엿집-1`)의 텍스트를 브라우저로 전부 추출해 `board.yaml`·`history.yaml`에 옮김(요약 금지, 원문 그대로). 이사장 조원경을 맨 앞에
- [ ] **Step 2:** `about/index.astro` — 비전 문구("나라의 얼이 담긴 상·제례 문화의 원형을 복원하고 그 독특한 의미를 찾아내어 우리의 정체성과 주체성을 세계에 알리고자 한다") + 연구소 소개 문단 + 하위 페이지 링크
- [ ] **Step 3:** `board.astro` — 이름·직책·약력 목록. `history.astro` — 연도별 구획, 회차·날짜·강사(소속)·주제
- [ ] **Step 4:** `sangyeotjip.astro` — 상엿집 설명 원문 + 사진 그리드(예전 페이지 이미지 20장, `src/assets/sangyeotjip/`에 저장 — Task 6의 `wix-media.mjs` 사용, 이 Task를 Task 6 뒤에 해도 됨)
- [ ] **Step 5:** 확인 — 빌드 성공, 예전 페이지와 글자 수 대조(임원 명단 인원 수, 연혁 연도 수 일치)
- [ ] **Step 6:** 커밋 `feat: 연구소 소개 페이지`

---

### Task 5: 문화공간 물볕, 후원안내, 소식(언론보도·갤러리)

**Files:**
- Create: `src/pages/space.astro`, `src/pages/support.astro`, `src/pages/news/press.astro`, `src/pages/news/gallery/index.astro`, `src/pages/news/gallery/[slug].astro`, `src/components/PressItem.astro`, `src/lib/gallery.ts`, `src/data/books.yaml`

**Interfaces:**
- Consumes: `press`, `gallery` 컬렉션, `site.yaml`(bank, dues)
- Produces: `books.yaml`: `[{title, author, publisher, note?}]`. `gallery.ts`: `galleryImages(slug: string): ImageMetadata[]` — `import.meta.glob('/src/content/gallery/*/*.{jpg,jpeg,png,webp}', { eager: true })`에서 해당 폴더만 골라 파일명순 반환. `PressItem.astro` props `{ entry: CollectionEntry<'press'> }`

- [ ] **Step 1:** `space.astro` — 물볕서점(`books.yaml` 목록) · 다방물볕 · 물볕갤러리 세 구획(예전 `/naraol-space` 텍스트·사진)
- [ ] **Step 2:** `support.astro` — 회원 종류·회비(`site.dues`), 계좌(`site.bank`), "회비는 문화보존 및 학술연구에 관한 지정기부금에 해당되어 기부금 영수증이 발급됩니다", 문의 `ContactNote`
- [ ] **Step 3:** `news/press.astro` — 최신순 `PressItem`(썸네일, 매체·날짜, 제목, 요약, 원문 링크는 새 창)
- [ ] **Step 4:** `news/gallery/index.astro` — 대표 사진 카드 그리드(최신순). `[slug].astro` — `galleryImages(slug)` 그리드, 각 사진 클릭 시 원본 크기로 새 탭(라이트박스 없음)
- [ ] **Step 5:** 확인 — 샘플 언론보도 1건·갤러리 1건으로 빌드 성공, 갤러리 폴더에 사진 추가 시 자동으로 늘어나는지 확인
- [ ] **Step 6:** 커밋 `feat: 물볕·후원·소식 페이지`

---

### Task 6: 예전 Wix 콘텐츠 이전

**Files:**
- Create: `scripts/wix-media.mjs`, `src/content/events/*.md`, `src/content/press/*.md`, `src/content/gallery/*/`, 이미지 파일들
- Modify: `src/data/*.yaml`(Task 4·5에서 덜 채운 부분)

**Interfaces:**
- Produces: `node scripts/wix-media.mjs <목록.txt> <출력폴더>` — 목록의 각 줄 `URL [파일명]`을 받아, URL에서 `/v1/...` 이하를 잘라 원본 주소로 내려받음. 이미 있는 파일은 건너뜀, 실패한 URL은 마지막에 목록으로 출력하고 종료 코드 1

- [ ] **Step 1:** `wix-media.mjs` 작성 후 이미지 2개로 시험 실행 → 원본 해상도 파일이 생기는지 확인
- [ ] **Step 2:** 행사 — 예전 사이트 `/blank-1/...` 이벤트 상세 4건(스펙 7장 목록)과 `/인문학강좌` 목록에 보이는 나머지 이벤트를 브라우저로 열어 제목·일시·장소·본문·포스터를 `events/`로 옮김. 분류는 예전 필터(국제학술대회/월례강좌/북 토크/물볕아카데미) 기준. `applyUrl`은 비워 둠(제니가 폼을 주면 채움)
- [ ] **Step 3:** 언론보도 — `/news`의 기사 전부(매체·날짜·제목·발췌·원문 링크·썸네일)와 Wix 블로그 게시물 2건(`/post/...`)을 `press/` 또는 `events/`(행사 공지 성격이면)로 옮김
- [ ] **Step 4:** 갤러리 — `/경산상엿집-1`의 "국제학술대회" 등 행사 사진 묶음을 행사별 폴더로
- [ ] **Step 5:** 확인 — `npm run build` 성공(스키마 오류 0), 이전 항목 수를 예전 사이트와 대조한 표를 커밋 메시지 본문에 기록
- [ ] **Step 6:** 커밋 `content: 예전 Wix 콘텐츠 이전`

---

### Task 7: 홈 페이지와 링크 검사

**Files:**
- Modify: `src/pages/index.astro`
- Create: `scripts/check-links.mjs`, `tests/check-links.test.ts`

**Interfaces:**
- Consumes: `homeEvents`, `EventCard`, `PressItem`
- Produces: `findBrokenLinks(distDir: string): Promise<string[]>` (export, `scripts/check-links.mjs`) — dist의 모든 `.html`에서 `href`/`src`/`srcset` 중 `/`로 시작하는 내부 경로를 `decodeURIComponent` 후 `dist/<경로>`, `dist/<경로>/index.html`, `dist/<경로>.html` 중 하나라도 있으면 정상. 외부 링크·`mailto:`·`tel:`·`#` 무시. 반환은 `"<페이지> -> <링크>"` 목록. CLI로 실행하면 목록 출력 후 있으면 종료 코드 1

- [ ] **Step 1: 실패하는 테스트** — 임시 폴더에 fixture 생성

```ts
test('resolves percent-encoded Korean paths', async () => {
  // dist/events/2026-01-10-인문학포럼/index.html 존재
  // dist/index.html: <a href="/events/2026-01-10-%EC%9D%B8%EB%AC%B8%ED%95%99%ED%8F%AC%EB%9F%BC/">
  expect(await findBrokenLinks(dir)).toEqual([]);
});
test('reports missing page and image', async () => {
  // dist/index.html: <a href="/nope/"> <img src="/_astro/x.webp">
  expect(await findBrokenLinks(dir)).toEqual(['index.html -> /nope/', 'index.html -> /_astro/x.webp']);
});
```

- [ ] **Step 2:** `npm test` → FAIL 확인
- [ ] **Step 3:** `check-links.mjs` 구현 (정규식으로 속성 추출, 의존성 추가 없음)
- [ ] **Step 4:** `npm test` → PASS
- [ ] **Step 5:** 홈 — 히어로(비전 문구 + 상엿집 대표 사진), "다가오는 행사"(`homeEvents`; `kind==='past'`면 제목을 "최근 행사"로), "최근 소식" 언론보도 3개, 바로가기 3개(상엿집·물볕아카데미·후원안내)
- [ ] **Step 6:** `deploy.yml` 빌드 뒤에 `npm test`와 `npm run check-links` 단계 추가(`withastro/action` 대신 `actions/setup-node` + `npm ci` + `npm run build` + `actions/upload-pages-artifact@v3`로 바꿔도 됨 — 검사 실패 시 배포 중단이 목적)
- [ ] **Step 7:** `npm run build && npm run check-links` → 깨진 링크 0
- [ ] **Step 8:** 커밋 `feat: 홈 페이지와 링크 검사`

---

### Task 8: 화면 점검과 운영 안내

**Files:**
- Create: `README.md`
- Modify: 점검에서 나온 CSS/마크업

- [ ] **Step 1:** `npm run preview` 후 브라우저에서 375px·1280px로 모든 최상위 페이지와 행사 상세 1건 확인. 각 페이지에서 `document.documentElement.scrollWidth <= innerWidth`가 참인지 콘솔로 확인(긴 임원 약력, 긴 행사 제목 포함)
- [ ] **Step 2:** 키보드 Tab만으로 메뉴·햄버거·신청 버튼 도달 가능 확인, 이미지 `alt` 누락 검색(`grep -L 'alt=' dist/**/*.html`류)
- [ ] **Step 3:** `README.md`(한국어) — 미리보기 방법, 새 행사/언론보도/갤러리 추가 방법(필드 표와 예시 파일), 배포 흐름, 매일 자동 갱신 설명
- [ ] **Step 4:** 커밋 `docs: 운영 안내 README, 화면 점검 수정`

---

### Task 9: GitHub 저장소, Pages 배포, 도메인 연결 (제니와 함께)

> 외부 계정 작업이라 각 단계 전에 제니에게 확인받는다.

- [ ] **Step 1:** 제니에게 저장소 계정(개인/연구소)과 이름(기본 `naraol-site`) 확인 → `gh repo create <계정>/naraol-site --public --source . --push` (공개 저장소여야 무료 Pages 사용 가능함을 함께 안내)
- [ ] **Step 2:** `gh api -X POST repos/<계정>/naraol-site/pages -f build_type=workflow` 로 Pages 소스를 GitHub Actions로 설정 → Actions 실행(빌드·테스트·링크 검사·배포) 성공 확인. DNS 연결 전이라 Pages 설정에 도메인 미확인 경고가 뜨는 것은 정상
- [ ] **Step 3:** 제니와 Wix 대시보드 → 도메인 → naraol.org → DNS 레코드: 기존 Wix A/CNAME 삭제, A(@) `185.199.108.153` `185.199.109.153` `185.199.110.153` `185.199.111.153`, CNAME(www) `<계정>.github.io` (제니가 직접 입력하거나 크대리가 화면 보며 진행 — 진행 전 확인)
- [ ] **Step 4:** DNS 반영 확인 `nslookup naraol.org` → 185.199.x.153. GitHub Pages 설정에서 도메인 확인 후 Enforce HTTPS 켜기
- [ ] **Step 5:** 최종 확인 — `https://naraol.org/`, `https://www.naraol.org/`(→ 리다이렉트), `http://` → `https://`, 행사 상세·404 동작. 다음 날 cron 실행 기록 확인
- [ ] **Step 6:** 제니에게 결과 보고(주소, 운영 방법, 남은 일: 행사별 구글폼 링크, 2021년 이전 연혁)
