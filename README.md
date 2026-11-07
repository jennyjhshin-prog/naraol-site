# (사)나라얼연구소 공식 홈페이지

`https://naraol.org` — 지원사업 제출용 실적 중심 공식 홈페이지입니다.
Astro로 만든 정적 사이트이고, GitHub Pages에 자동 배포됩니다.
행사 신청·소식·자료는 다음카페에서 안내하고, 홈페이지는 그동안의 실적을 정리해 보여줍니다.

## 미리보기

Node.js 22.19 이상이 필요합니다.

```bash
npm install        # 처음 한 번
npm run dev        # http://localhost:4321 에서 미리보기 (데이터를 고친 뒤에는 서버를 다시 시작)
npm test           # 계산·날짜·데이터 검증 테스트
npm run build      # dist/ 에 사이트 생성
npm run check-links  # 깨진 내부 링크·이미지 검사
```

## 실적 추가하기

실적은 모두 `src/data/` 폴더의 YAML 파일에 있습니다. 한 곳만 고치면 홈 숫자, 최근 3년 실적, 상세 페이지가 함께 바뀝니다.
필수 항목이 빠지거나 형식이 틀리면 빌드가 실패하고 **배포되지 않습니다**(오류 메시지에 파일명과 항목이 나옵니다).

날짜는 `"2025-11-07"`, `"2025-11"`, `"2025"` 중 하나로 씁니다(따옴표 권장).

| 파일 | 내용 | 필드 |
|---|---|---|
| `org.yaml` | 법인·연락·후원 정보 | `name` `founded`(YYYY-MM-DD) `registeredBy` `regNo` `representative` `donationDesignated` `address` `phone` `cafeUrl` `kakaoUrl` `youtubeUrl` `youtubeName` `bank{name,account,holder}` `dues[{label,amount}]` `heritage` `googleVerification` `naverVerification` |
| `history.yaml` | 전체 연혁 (연도별) | `year`, `items[{date?, title, kind?}]` — kind: `founding` `conference` `lecture` `academy` `culture` `award` `etc` |
| `conferences.yaml` | 국제학술대회 회차 | `no` `year` `date?` `title` `theme?` `venue` `hosts[]` `photo?` `pressUrl?` |
| `lectures.yaml` | 인문학강좌 회차 | `no` `date` `speaker?` `affiliation?` `topic` |
| `people.yaml` | 임원 (이사장이 맨 앞) | `name` `role` `bio[]` |
| `academy.yaml` | 물볕아카데미 | `courses[{name,teacher,bio}]`, `terms[{title,period,items[]}]` |
| `books.yaml` | 물볕서점 추천도서 (표지 갤러리) | `title` `author` `publisher` `note?` `cover?` — 표지 파일은 `src/assets/books/`에 넣고 파일명을 `cover`에 |

예시 — 강좌 한 회 추가 (`lectures.yaml` 맨 아래):

```yaml
- no: 171
  date: "2024-05-11"
  speaker: 홍길동
  affiliation: ○○대학교
  topic: 강좌 제목
```

예시 — 학술대회 추가 (`conferences.yaml`):

```yaml
- no: 13
  year: 2026
  date: "2026-11-06"
  title: 제13회 한국 전통상례문화 전승 및 세계화 방안 국제학술제
  theme: 주제
  venue: 무학산 경산상엿집 마당
  hosts: [(사)나라얼연구소]
```

법인 정보(`founded`, `regNo` 등)를 `org.yaml`에 채우면 홈의 "설립 이후 ○년", 꼬리말, 법인 정보 페이지에 자동으로 나타납니다. 비어 있는 항목은 화면에서 숨겨집니다.

## 언론보도·사진 기록 추가

- **언론보도**: `src/content/press/YYYY-MM-DD-매체.md`

  ```markdown
  ---
  title: "기사 제목"
  outlet: 대경일보
  date: 2025-11-07
  url: https://원문주소   # 선택
  ---
  기사 내용을 한두 문장으로 요약.
  ```

- **사진 기록**: `src/content/photos/<폴더이름>/` 폴더를 만들고 사진과 `index.md`를 넣습니다. 폴더 안 사진은 파일명순으로 자동 표시되고, 캡션은 "날짜 행사명 (번호)"로 붙습니다.

  ```markdown
  ---
  title: 제13회 국제학술제
  date: 2026-11-06
  cover: ./01.jpg
  ---
  ```

  큰 사진은 `node scripts/shrink-images.mjs <폴더>`로 긴 변 2000px로 줄여서 넣어 주세요.

- 예전 Wix 이미지를 원본으로 받을 때: `node scripts/wix-media.mjs <목록.txt> <출력폴더>` (줄마다 `URL [파일명]`).

## 배포

`main` 브랜치에 푸시하면 GitHub Actions가 **테스트 → 빌드 → 링크 검사 → 배포**를 자동으로 합니다(1~2분).
하나라도 실패하면 배포하지 않고 기존 사이트가 그대로 유지됩니다. Actions 탭에서 "Run workflow"로 수동 실행도 됩니다.

도메인: Wix DNS에 A 레코드 `185.199.108.153` `185.199.109.153` `185.199.110.153` `185.199.111.153`, `www`는 CNAME `<계정>.github.io`. `public/CNAME` = `naraol.org`.

## 인쇄해서 PDF 만들기

지원서에 첨부할 때는 각 페이지(연혁, 국제학술대회, 인문학강좌, 법인 정보 등)를 브라우저에서 열고
**인쇄(Ctrl+P) → 대상: PDF로 저장 → 용지 A4**를 고르면 됩니다.
인쇄 시 메뉴·버튼은 빠지고, 맨 위에 "(사)나라얼연구소 · 페이지명 · 출력일"이 찍히며, 강좌 기록은 모든 연도가 펼쳐집니다.

## 검색 노출 (구글·네이버)

- 사이트맵 `https://naraol.org/sitemap-index.xml`, `robots.txt` 는 빌드 때 자동으로 만들어집니다.
- 홈에는 기관 정보(JSON-LD)와 공유 미리보기 이미지(`public/og-image.jpg`, `node scripts/make-og.mjs` 로 다시 만듦)가 들어 있습니다.
- 구글 서치콘솔·네이버 서치어드바이저에서 'HTML 태그' 방식 확인 코드를 받으면 `org.yaml` 의 `googleVerification` / `naverVerification` 에 content 값만 넣고 배포합니다. 확인 후 두 곳 모두에 사이트맵 주소를 제출합니다.
