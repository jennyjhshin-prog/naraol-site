# (사)나라얼연구소 공식 홈페이지 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 지원사업 제출용 실적 중심 공식 홈페이지를 Astro 정적 사이트로 만들어 GitHub Pages에 배포하고 `naraol.org`에 연결한다.

**Architecture:** Astro 정적 출력. 실적·법인 정보는 `src/data/*.yaml`을 `src/lib/data.ts`가 zod로 검증해 읽고, 홈 숫자·최근 실적 계산은 `src/lib/stats.ts` 순수 함수(Vitest)로 분리한다. 언론보도·사진 기록은 Content Collections. 빌드 결과는 링크 검사 스크립트로 검증하고, GitHub Actions가 푸시·수동 실행 시 빌드·검사·배포한다.

**Tech Stack:** Astro 5, TypeScript, zod(astro 내장 `astro/zod`), js-yaml, Vitest, 일반 CSS, `@fontsource/noto-serif-kr`, `pretendard`, GitHub Actions(`actions/upload-pages-artifact@v3`, `actions/deploy-pages@v4`)

**Spec:** `docs/superpowers/specs/2026-11-06-naraol-site-design.md`

## Global Constraints

- 프로젝트 루트: `C:\Users\q257v\Projects\naraol-site`
- Node 20 이상, Astro 5.x, 정적 출력, `site: 'https://naraol.org'`, `trailingSlash: 'always'`
- 날짜 계산은 한국 시간: `dev`/`build`/`test` 스크립트와 Actions에 `TZ=Asia/Seoul`
- 색상 토큰(정확한 값): `--paper #F5F0E6`, `--paper-deep #EAE2D2`, `--ink #2B2B2B`, `--ink-soft #5A554D`, `--accent #A83A2E`, `--line #D6CCB8`. 단청홍은 숫자·회차·구분선에만
- 글꼴: 제목·숫자 Noto Serif KR, 본문 Pretendard. 다크 모드 없음
- 휴대폰 좌우 여백 16px, 가로 스크롤 없음, 한글 `word-break: keep-all`
- 메뉴(순서 고정): 연구소 소개 · 주요 사업 · 경산상엿집 · 아카이브 · 함께하기
- 연락처: 주소 `경북 경산시 하양읍 무학로62길 162`, 전화 `010-8101-2414`, 카카오 `http://pf.kakao.com/_tSdcn/chat`
- 후원: `농협은행 351-0517-5594-13 황영례`, 연구회원 월 30,000원 / 일반회원 월 10,000원, "회비는 문화보존 및 학술연구에 관한 지정기부금에 해당되어 기부금 영수증이 발급됩니다"
- 행사 신청·일정 로직·게시판·로그인·결제·CMS·다국어는 만들지 않는다
- 사진에는 항상 날짜·행사명 캡션
- 화면 문구는 한국어. 커밋 메시지 끝에 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`

## Review Focus

1. **연혁·법인 문서 전달 전(데이터 비어 있음)** — 홈 숫자 칸과 최근 실적 섹션이 "0회"나 빈 상자 대신 숨겨져야 한다 → Task 2 테스트 `omits stats whose source is empty`
2. **설립일 없음** — `org.founded`가 비면 "설립 ○년" 칸만 숨기고 나머지는 보여야 한다 → Task 2 테스트 `omits years-since-founding without founded`
3. **연혁 연도 순서가 뒤섞인 입력** — 문서에서 옮기다 연도가 섞여도 최근 3개 연도가 정확히 나와야 한다 → Task 2 테스트 `recentHistory sorts years descending`
4. **한글 파일명/경로** — 사진 기록 폴더 `2025-11-제12회-학술제` 같은 경로의 인코딩된 링크를 링크 검사가 오판하지 않아야 한다 → Task 7 테스트 `resolves percent-encoded Korean paths`
5. **강좌 170행 표가 휴대폰·인쇄에서 깨짐** — 휴대폰에서 가로 스크롤 없이 카드형, 인쇄 시 행이 페이지 경계에서 잘리지 않아야 한다 → Task 8 화면·인쇄 확인 단계

---

## File Structure

```
astro.config.mjs | package.json | tsconfig.json | vitest.config.ts | .gitignore
public/CNAME (naraol.org) | public/favicon.png
.github/workflows/deploy.yml
src/data/org.yaml | history.yaml | conferences.yaml | lectures.yaml | people.yaml | academy.yaml | books.yaml
src/lib/schemas.ts        각 YAML의 zod 스키마와 타입
src/lib/data.ts           YAML 읽기 + 검증
src/lib/stats.ts          홈 숫자, 최근 연혁
src/lib/format.ts         한국어 날짜 표기
src/lib/photos.ts         사진 기록 폴더 이미지 수집
src/content.config.ts     press, photos 컬렉션
src/content/press/*.md | src/content/photos/<slug>/index.md + 사진
src/styles/global.css     토큰, 타이포, 그리드, 표, 타임라인
src/styles/print.css      @media print
src/layouts/Base.astro
src/components/Header | Footer | PageTitle | StatBlock | Timeline | RecordTable | PressItem | PhotoFigure (.astro)
src/pages/ ...            스펙 3장 경로 그대로
src/assets/               로고, 상엿집·사업 대표 사진
scripts/check-links.mjs | scripts/wix-media.mjs
tests/stats.test.ts | format.test.ts | data.test.ts | check-links.test.ts
README.md
```

---

### Task 1: 뼈대, 디자인 토큰, 공통 레이아웃, 인쇄 스타일, 배포 설정

**Files:**
- Create: 설정 파일들, `public/CNAME`, `.github/workflows/deploy.yml`, `src/styles/global.css`, `src/styles/print.css`, `src/layouts/Base.astro`, `src/components/Header.astro`, `src/components/Footer.astro`, `src/components/PageTitle.astro`, `src/pages/index.astro`(임시), `src/pages/404.astro`, `src/assets/logo.png`, `src/lib/nav.ts`

**Interfaces:**
- Produces: `Base.astro` props `{ title: string; description?: string }` — `<title>`은 `${title} | (사)나라얼연구소`(홈은 `(사)나라얼연구소`). `PageTitle.astro` props `{ title: string; lead?: string }` — 인쇄 시 상단에 "(사)나라얼연구소 · {title} · 출력일 YYYY.MM.DD" 줄 표시(화면에선 숨김). `nav.ts`: `export const NAV: { label: string; href: string; children?: { label: string; href: string }[] }[]` — 스펙 3장 메뉴·경로 그대로
- Footer는 Task 2 전까지 연락처를 하드코딩하고, Task 2에서 `org.yaml`로 교체

- [ ] **Step 1:** `npm create astro@latest . -- --template minimal --typescript strict --no-install --no-git`, `npm i js-yaml @fontsource/noto-serif-kr pretendard`, `npm i -D vitest cross-env @types/js-yaml @types/node`
- [ ] **Step 2:** scripts — `dev`/`build`/`test`는 `cross-env TZ=Asia/Seoul` + `astro dev`/`astro build`/`vitest run`, `"check-links": "node scripts/check-links.mjs dist"`
- [ ] **Step 3:** `global.css` — 토큰, 배경·글씨, 제목 명조, `.container{max-width:1120px;margin:0 auto;padding:0 16px}`, 카드 그리드 1→2(≥640px)→3열(≥960px), `.stat`(큰 명조 숫자 `--accent`), `.timeline`(왼쪽 세로선 `--line`, 연도 명조), `.record-table`(얇은 선 표; 640px 미만에서 행을 카드형 블록으로), `:focus-visible`
- [ ] **Step 4:** `print.css` (`@media print`) — 머리말·꼬리말·`.no-print` 숨김, 배경 흰색, `@page { size: A4; margin: 18mm }`, `tr, .timeline li { break-inside: avoid }`, `thead { display: table-header-group }`, `.print-only` 표시
- [ ] **Step 5:** 로고 — 예전 사이트 머리말 로고의 원본(URL에서 `/v1/...` 이하 제거)을 받아 `src/assets/logo.png`, 같은 이미지로 `public/favicon.png`
- [ ] **Step 6:** `Header.astro` — 로고+단체명, PC 가로 메뉴(hover/focus-within 드롭다운), 768px 미만 `<button aria-expanded>` 햄버거(인라인 스크립트), 오른쪽 작은 "다음카페" 링크. `404.astro` — "찾으시는 페이지가 없습니다" + 홈·연혁 링크
- [ ] **Step 7:** `deploy.yml` — `on: push(main), workflow_dispatch`, `permissions: { contents: read, pages: write, id-token: write }`, `env: TZ: Asia/Seoul`; build job: checkout → `actions/setup-node@v4`(node 20, npm 캐시) → `npm ci` → `npm test` → `npm run build` → `npm run check-links` → `actions/upload-pages-artifact@v3`(path: dist); deploy job: `actions/deploy-pages@v4`. (`check-links`는 Task 7 전까지 `scripts/check-links.mjs`가 없으므로 Task 7에서 단계 추가해도 됨)
- [ ] **Step 8:** 확인 — `npm run build` 성공, `dist/index.html`·`dist/404.html`·`dist/CNAME` 존재. 미리보기 375px/1280px에서 메뉴 열고 닫기, 인쇄 미리보기에서 메뉴가 사라지는지 확인
- [ ] **Step 9:** 커밋 `feat: Astro 뼈대, 디자인 토큰, 공통 레이아웃, 인쇄 스타일, 배포 워크플로`

---

### Task 2: 데이터 스키마, 홈 숫자·최근 실적 계산 (TDD)

**Files:**
- Create: `src/lib/schemas.ts`, `src/lib/data.ts`, `src/lib/stats.ts`, `src/lib/format.ts`, `src/data/*.yaml`(Wix에서 확인된 범위로 최소 내용), `tests/stats.test.ts`, `tests/format.test.ts`, `tests/data.test.ts`
- Modify: `src/components/Footer.astro`(org.yaml 사용)

**Interfaces:**
- Produces (`schemas.ts`, 스펙 4장 필드 그대로):
  - `Org` — `name: string, founded?: string(YYYY-MM-DD), registeredBy?, regNo?, representative?, donationDesignated?, address, phone, cafeUrl?: url, kakaoUrl: url, bank: {name, account, holder}, dues: {label, amount: number}[], heritage: string`
  - `HistoryYear = { year: number; items: { date?: string; title: string; kind?: 'founding'|'conference'|'lecture'|'academy'|'culture'|'award'|'etc' }[] }`, `History = HistoryYear[]`
  - `Conference = { no: number; year: number; date?: string; title: string; theme?: string; venue: string; hosts: string[]; photo?: string; pressUrl?: url }`
  - `Lecture = { no: number; date: string; speaker: string; affiliation?: string; topic: string }`
  - `Person = { name: string; role: string; bio: string[] }`
  - `Academy = { courses: {name, teacher, bio}[]; terms: {title, period, items: string[]}[] }`
  - `Book = { title, author, publisher, note? }`
- Produces (`data.ts`): `loadData<T>(file: string, schema: ZodType<T>, dir = 'src/data'): T` — 파일을 읽어 `js-yaml`로 파싱 후 검증, 실패 시 `` `${file}: ${경로} ${메시지}` ``로 throw. 편의 export: `org`, `history`, `conferences`, `lectures`, `people`, `academy`, `books` (빈 배열 파일 허용)
- Produces (`stats.ts`):
  - `type Stat = { value: number | string; unit: string; label: string }`
  - `homeStats(input: { org: Org; conferences: Conference[]; lectures: Lecture[] }, now: Date): Stat[]` — 순서: 설립 `{value: now.getFullYear()-founded연도, unit:'년', label:'설립 이후'}` (founded 없으면 생략) · `{value: max(no), unit:'회', label:'국제학술대회'}` (비면 생략) · `{value: max(no), unit:'회', label:'인문학강좌'}` (비면 생략) · `{value: '제266호', unit:'', label: org.heritage}` (항상)
  - `recentHistory(history: History, n = 3): HistoryYear[]` — 연도 내림차순 정렬 후 앞 n개, 항목이 0개인 연도는 제외
- Produces (`format.ts`): `formatDate(iso: string): string` — `2025-11-07` → `2025. 11. 7.`, `2025-11` → `2025. 11.`, `2025` → `2025`

- [ ] **Step 1: 실패하는 테스트** `tests/stats.test.ts`

```ts
const org = { /* 필수 필드 최소 */ heritage: '국가민속문화재 제266호 경산상엿집', founded: '2008-03-01' } as Org;
const now = new Date('2026-11-06T12:00');

test('computes stats from data', () => {
  const s = homeStats({ org, conferences: [{ no: 11 }, { no: 12 }] as Conference[], lectures: [{ no: 170 }] as Lecture[] }, now);
  expect(s.map(x => [x.value, x.label])).toEqual([[18, '설립 이후'], [12, '국제학술대회'], [170, '인문학강좌'], ['제266호', '국가민속문화재 제266호 경산상엿집']]);
});
test('omits stats whose source is empty', () => {
  const s = homeStats({ org, conferences: [], lectures: [] }, now);
  expect(s.map(x => x.label)).toEqual(['설립 이후', '국가민속문화재 제266호 경산상엿집']);
});
test('omits years-since-founding without founded', () => {
  const s = homeStats({ org: { ...org, founded: undefined }, conferences: [], lectures: [] }, now);
  expect(s).toHaveLength(1);
});
test('recentHistory sorts years descending', () => {
  const h = [2022, 2024, 2021, 2023].map(year => ({ year, items: [{ title: `${year}` }] }));
  expect(recentHistory(h).map(y => y.year)).toEqual([2024, 2023, 2022]);
});
test('recentHistory skips empty years', () => {
  expect(recentHistory([{ year: 2025, items: [] }, { year: 2024, items: [{ title: 'a' }] }]).map(y => y.year)).toEqual([2024]);
});
```

`tests/format.test.ts`: `formatDate('2025-11-07') === '2025. 11. 7.'`, `formatDate('2025-11') === '2025. 11.'`, `formatDate('2025') === '2025'`
`tests/data.test.ts`: 임시 폴더에 잘못된 `people.yaml`(`- name: 홍길동` — role 누락) → `loadData('people.yaml', PeopleSchema, tmp)`가 `/people.yaml: .*role/`로 throw

- [ ] **Step 2:** `npm test` → FAIL 확인
- [ ] **Step 3:** `schemas.ts`, `data.ts`, `stats.ts`, `format.ts` 구현
- [ ] **Step 4:** `npm test` → PASS
- [ ] **Step 5:** `src/data/*.yaml` 작성 — `org.yaml`은 스펙 6장의 연락·계좌·회비, `heritage`, `founded` 등 법인 필드는 비워 둠. 나머지는 빈 배열로 시작(Task 3~6에서 채움). Footer를 `org`로 교체(법인 필드가 비면 해당 항목 숨김). `npm run build` 성공 확인
- [ ] **Step 6:** 커밋 `feat: 실적 데이터 스키마와 홈 숫자 계산`

---

### Task 3: 연구소 소개 페이지

**Files:**
- Create: `src/pages/about/index.astro`, `about/history.astro`, `about/people.astro`, `about/info.astro`, `src/components/Timeline.astro`
- Modify: `src/data/people.yaml`, `src/data/history.yaml`

**Interfaces:**
- Consumes: `org`, `history`, `people`, `formatDate`
- Produces: `Timeline.astro` props `{ years: HistoryYear[]; compact?: boolean }` — 연도 머리(명조) + 항목 목록(날짜·제목). `compact`면 연도당 최대 4항목 + "외 n건"

- [ ] **Step 1:** 예전 `/naraeolyeonguso-isa` 텍스트를 원문 그대로 `people.yaml`로(이사장 조원경 맨 앞). 예전 `/인문학강좌연혁`의 2021~2024 항목을 `history.yaml`(연도별 `kind: lecture`)로
- [ ] **Step 2:** `about/index.astro` — 비전 문구(스펙 3장), 설립 목적 문단(예전 사이트 소개 문구 기반, 제니 확인 필요 표시 `<!-- 확인 필요 -->`), 하위 페이지 링크
- [ ] **Step 3:** `history.astro` — 전체 `Timeline`(연도 내림차순), 인쇄용. `people.astro` — 이름·직책·약력 목록
- [ ] **Step 4:** `info.astro` — 법인 정보 표(`org`의 값이 있는 필드만 행으로), 주소·전화·카카오맵 링크(`https://map.kakao.com/?q=` + 주소)
- [ ] **Step 5:** 확인 — 빌드 성공, 임원 수·연혁 연도 수를 예전 페이지와 대조
- [ ] **Step 6:** 커밋 `feat: 연구소 소개 페이지`

---

### Task 4: 주요 사업 페이지

**Files:**
- Create: `src/pages/programs/conference.astro`, `programs/lectures.astro`, `programs/academy.astro`, `programs/culture.astro`, `src/components/RecordTable.astro`
- Modify: `src/data/conferences.yaml`, `lectures.yaml`, `academy.yaml`, `books.yaml`

**Interfaces:**
- Consumes: `conferences`, `lectures`, `academy`, `books`, `formatDate`
- Produces: `RecordTable.astro` props `{ columns: { key: string; label: string }[]; rows: Record<string, string | number>[]; caption: string }` — `<table class="record-table">`, 휴대폰에서 각 셀에 `data-label`로 카드형 표시

- [ ] **Step 1:** 데이터 — 예전 `/naraol-conference`·Wix 이벤트·블로그의 학술대회(제7·9·10·11·12회 등 확인되는 회차)를 `conferences.yaml`로. 2021~2024 강좌(155~170회)를 `lectures.yaml`로. `/naraol-academy` → `academy.yaml`, `/naraol-space` 추천도서 → `books.yaml`
- [ ] **Step 2:** `conference.astro` — 소개 문단 + 총 개최 횟수(최대 no) + 회차 표(회차·연도·주제·장소·공동주최) + 사진 있는 회차는 `PhotoFigure`(Task 5) 대신 이 단계에선 `<figure>`+캡션
- [ ] **Step 3:** `lectures.astro` — 총 횟수 + 연도별 `<details>`(최근 연도만 열림, 인쇄 시 전부 펼침: `print.css`에 `details{display:block} details>*{display:block}` 및 인쇄 전 `beforeprint`에서 `open` 설정하는 작은 스크립트) 안에 `RecordTable`(회차·날짜·강사(소속)·주제)
- [ ] **Step 4:** `academy.astro` — 강좌·강사 카드 + 학기 기록. `culture.astro` — 문화예술행사 소개(예전 홈 "문화 예술 행사" 문단) + 문화공간 물볕(서점 추천도서 목록·다방·갤러리)
- [ ] **Step 5:** 확인 — 빌드 성공, 강좌 표 행 수 = `lectures.yaml` 항목 수
- [ ] **Step 6:** 커밋 `feat: 주요 사업 페이지`

---

### Task 5: 경산상엿집, 아카이브, 함께하기

**Files:**
- Create: `src/content.config.ts`, `src/lib/photos.ts`, `src/components/PressItem.astro`, `src/components/PhotoFigure.astro`, `src/pages/sangyeotjip.astro`, `src/pages/archive/press.astro`, `src/pages/archive/photos/index.astro`, `src/pages/archive/photos/[slug].astro`, `src/pages/support.astro`

**Interfaces:**
- Consumes: `org`
- Produces: 컬렉션(glob 로더) `press`: `title, outlet, date: z.coerce.date(), url?: url, thumbnail?: image()`; `photos`(패턴 `*/index.md`): `title, date: z.coerce.date(), cover: image()`. 슬러그 = 파일명/폴더명. `photosIn(slug: string): ImageMetadata[]` — `import.meta.glob('/src/content/photos/*/*.{jpg,jpeg,png,webp}', { eager: true })` 중 해당 폴더, 파일명순. `PhotoFigure.astro` props `{ src: ImageMetadata; caption: string }` — `<figure>` + `<figcaption>`, `<Image>`로 최적화

- [ ] **Step 1:** `sangyeotjip.astro` — 예전 `/경산상엿집-1` 설명 원문, `org.heritage` 강조, 사진 그리드(캡션 포함; 사진은 Task 6에서 받음 — 이 단계는 대표 사진 1장으로)
- [ ] **Step 2:** `archive/press.astro` — 최신순 `PressItem`(썸네일, 매체·날짜, 제목, 발췌, 원문 링크 새 창)
- [ ] **Step 3:** `archive/photos/index.astro` — 대표 사진 카드(제목·날짜). `[slug].astro` — `photosIn(slug)`를 `PhotoFigure`로(캡션: `${formatDate} ${title}`)
- [ ] **Step 4:** `support.astro` — 회원 종류·회비, 계좌, 기부금 영수증 문구, 다음카페 바로가기(`org.cafeUrl` 없으면 버튼 숨김), 카카오·전화 문의
- [ ] **Step 5:** 확인 — 샘플 언론보도 1건·사진 기록 1건으로 빌드 성공, 사진 폴더에 파일 추가 시 자동으로 늘어나는지 확인
- [ ] **Step 6:** 커밋 `feat: 경산상엿집, 아카이브, 함께하기 페이지`

---

### Task 6: 예전 Wix 콘텐츠·사진 이전

**Files:**
- Create: `scripts/wix-media.mjs`, `src/content/press/*.md`, `src/content/photos/*/`, `src/assets/` 사진들
- Modify: `src/data/*.yaml` 보완

**Interfaces:**
- Produces: `node scripts/wix-media.mjs <목록.txt> <출력폴더>` — 줄마다 `URL [파일명]`, URL의 `/v1/...` 이하를 잘라 원본 다운로드, 있는 파일은 건너뜀, 실패 목록 출력 후 종료 코드 1

- [ ] **Step 1:** 스크립트 작성 후 이미지 2개로 시험 → 원본 해상도 확인
- [ ] **Step 2:** 언론보도 — 예전 `/news` 기사 전부(매체·날짜·제목·발췌·원문 링크·썸네일)를 `press/`로
- [ ] **Step 3:** 실적 기록 — Wix 이벤트(2026.1 인문학포럼, 2025.12 물볕 동네 배움터, 2025.11 제12회 국제학술제, 2025.8 흠흠신서 강좌)와 블로그 게시물 2건을 `history.yaml`·`conferences.yaml`에 반영하고, 포스터·행사 사진은 `photos/` 행사별 폴더로
- [ ] **Step 4:** 상엿집 사진 20장 → `src/assets/sangyeotjip/`, 페이지 그리드에 캡션과 함께 연결
- [ ] **Step 5:** 확인 — `npm run build` 성공, 이전 항목 수를 예전 사이트와 대조한 표를 커밋 메시지 본문에 기록
- [ ] **Step 6:** 커밋 `content: 예전 Wix 콘텐츠·사진 이전`

---

### Task 7: 홈 페이지와 링크 검사

**Files:**
- Modify: `src/pages/index.astro`, `.github/workflows/deploy.yml`(check-links 단계가 없다면 추가)
- Create: `src/components/StatBlock.astro`, `scripts/check-links.mjs`, `tests/check-links.test.ts`

**Interfaces:**
- Consumes: `homeStats`, `recentHistory`, `Timeline`(compact), `PressItem`, `org`, `conferences`, `lectures`, `history`
- Produces: `StatBlock.astro` props `{ stats: Stat[] }` — 비어 있으면 아무것도 렌더링하지 않음. `findBrokenLinks(distDir: string): Promise<string[]>` (export) — 모든 `.html`의 `href`/`src`/`srcset` 중 `/`로 시작하는 경로를 `decodeURIComponent` 후 `dist/<p>`, `dist/<p>/index.html`, `dist/<p>.html` 중 하나라도 있으면 정상; 외부·`mailto:`·`tel:`·`#` 무시; 반환 `"<페이지> -> <링크>"`. CLI 실행 시 목록 출력, 있으면 종료 코드 1

- [ ] **Step 1: 실패하는 테스트**

```ts
test('resolves percent-encoded Korean paths', async () => {
  // fixture: dist/archive/photos/2025-11-제12회-학술제/index.html
  // dist/index.html: <a href="/archive/photos/2025-11-%EC%A0%9C12%ED%9A%8C-%ED%95%99%EC%88%A0%EC%A0%9C/">
  expect(await findBrokenLinks(dir)).toEqual([]);
});
test('reports missing page and image', async () => {
  // dist/index.html: <a href="/nope/"><img src="/_astro/x.webp">
  expect(await findBrokenLinks(dir)).toEqual(['index.html -> /nope/', 'index.html -> /_astro/x.webp']);
});
```

- [ ] **Step 2:** `npm test` → FAIL
- [ ] **Step 3:** `check-links.mjs` 구현(정규식 추출, 추가 의존성 없음)
- [ ] **Step 4:** `npm test` → PASS
- [ ] **Step 5:** 홈 — 머리(단체명·비전·상엿집 대표 사진) → `StatBlock` → 주요 사업 4카드(국제학술대회 `/programs/conference/`, 인문학강좌 `/programs/lectures/`, 물볕아카데미 `/programs/academy/`, 경산상엿집 `/sangyeotjip/`) → "최근 3년 주요 실적" `Timeline compact` + [전체 연혁 보기] (최근 실적이 비면 섹션 숨김) → 언론보도 최신 3건
- [ ] **Step 6:** `npm run build && npm run check-links` → 깨진 링크 0
- [ ] **Step 7:** 커밋 `feat: 홈 페이지와 링크 검사`

---

### Task 8: 화면·인쇄 점검과 운영 안내

**Files:**
- Create: `README.md`
- Modify: 점검에서 나온 CSS/마크업

- [ ] **Step 1:** `npm run preview` 후 375px·1280px로 모든 페이지 확인. 각 페이지에서 콘솔 `document.documentElement.scrollWidth <= innerWidth` 참(강좌 표, 긴 임원 약력 포함)
- [ ] **Step 2:** 인쇄 미리보기(A4) — 연혁·학술대회·강좌·법인 정보 페이지: 메뉴 없음, 상단에 단체명·페이지명·출력일, 표 머리 반복, 행이 페이지 경계에서 잘리지 않음, 강좌 `<details>` 전부 펼침
- [ ] **Step 3:** 키보드 Tab으로 메뉴·햄버거 조작 가능, `<img>` alt 누락 0
- [ ] **Step 4:** `README.md`(한국어) — 미리보기 방법, 실적 추가 방법(YAML별 필드 표·예시), 언론보도·사진 기록 추가, 배포 흐름, 인쇄해서 PDF 만드는 법
- [ ] **Step 5:** 커밋 `docs: 운영 안내 README, 화면·인쇄 점검 수정`

---

### Task 9: 제니 자료 반영 대기 항목 + GitHub·도메인 연결 (제니와 함께)

> 외부 계정 작업은 단계마다 제니에게 확인받는다.

- [ ] **Step 1:** 제니가 전달한 전체 연혁 문서·법인 정보를 `history.yaml`·`lectures.yaml`·`conferences.yaml`·`org.yaml`에 반영(받기 전이면 건너뛰고 Step 2 진행 후 나중에 반영) → `npm test && npm run build && npm run check-links`
- [ ] **Step 2:** 저장소 계정(개인/연구소)·이름(기본 `naraol-site`) 확인 → `gh repo create <계정>/naraol-site --public --source . --push` (무료 Pages는 공개 저장소 필요함을 안내)
- [ ] **Step 3:** `gh api -X POST repos/<계정>/naraol-site/pages -f build_type=workflow` → Actions(테스트·빌드·링크 검사·배포) 성공 확인
- [ ] **Step 4:** 제니와 Wix 대시보드 → 도메인 → naraol.org → DNS: 기존 Wix A/CNAME 삭제, A(@) `185.199.108.153` `185.199.109.153` `185.199.110.153` `185.199.111.153`, CNAME(www) `<계정>.github.io`
- [ ] **Step 5:** `nslookup naraol.org` → 185.199.x.153 확인, Pages 설정에서 Enforce HTTPS
- [ ] **Step 6:** 최종 확인 — `https://naraol.org/`, `https://www.naraol.org/` 리다이렉트, `http→https`, 404. 제니에게 결과 보고(주소, 업데이트 방법, 남은 일: 다음카페 주소·법인 정보·전체 연혁 중 미반영분)
