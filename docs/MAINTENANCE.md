# 유지보수 안내

원본 문서의 수정 위치, 관련 파일, 검증 순서와 문제 해결 절차를 유지했습니다. 원본의 업무 항목은 일반적인 변경 유형으로만 설명하며 실제 회사 정보·연락처·계정값은 포함하지 않습니다.

**‘원본 구현’ 절의 파일과 검사 명령은 원본 구성의 설명입니다. 공개 데모에 없는 파일을 실행하거나 연결하라는 안내가 아닙니다.** 현재 저장소의 수정 위치와 명령은 마지막 ‘공개 데모 수정 위치’부터 확인하세요. 원본 경로는 일반 텍스트로 표시합니다.

수정 후에는 검사 (`#검사`)를 실행하고 실제 화면을 확인하세요. 공통 내용도 HTML에 직접 들어간 부분과 partial로 공유하는 부분이 다릅니다.

## 원본 구현 · 수정 위치

| 바꿀 내용 | 확인할 파일 |
| --- | --- |
| 회사 소개·연혁·공장 현황 | 홈 (`../index.html`), 회사소개 (`../about/index.html`), 시설 (`../facility/index.html`) |
| 운영 경력·현 공장 연수 | 홈 (`../index.html`)의 `data-start-year`·`factory-year`, app.js (`../app.js`)의 연도 계산, 회사소개 (`../about/index.html`)의 연혁 |
| 정기 거래처·차량·서비스 지역 | 홈 (`../index.html`), 공정 (`../process/index.html`), 서비스 (`../services/index.html`), 문의 (`../contact/index.html`), 공통 문의 영역 (`../partials/inquiry.html`) |
| 취급 품목·거래 조건 | 서비스 (`../services/index.html`), 문의 (`../contact/index.html`) |
| 공정·품질 설명 | 공정 (`../process/index.html`), 홈 (`../index.html`) |
| 설비·사진 설명 | 시설 (`../facility/index.html`), 홈 (`../index.html`) |
| 회사명·대표자·공장 표기 | 공통 푸터 (`../partials/footer.html`), 홈의 Organization JSON-LD (`../index.html`), 관련 페이지 HTML |
| 개인정보 보호 담당자·시행일 | 개인정보처리방침 (`../privacy/index.html`) |

회사 대표 연락처는 푸터 (`../partials/footer.html`), 공통 문의 영역 (`../partials/inquiry.html`), 문의 페이지 (`../contact/index.html`), 홈의 JSON-LD (`../index.html`), app.js (`../app.js`)의 partial 실패/폼 실패 안내에 있습니다. 개인정보 보호 담당자의 별도 연락처는 privacy/index.html (`../privacy/index.html`)에 있으므로 대표 연락처와 구분해 확인하세요. 반복 정보 변경 시 저장소 전체에서 이전 값을 검색합니다.

## 원본 구현 · Header·메뉴·푸터

Header와 상단 navigation은 홈 (`../index.html`), about (`../about/index.html`), services (`../services/index.html`), process (`../process/index.html`), facility (`../facility/index.html`), contact (`../contact/index.html`), privacy (`../privacy/index.html`)에 각각 직접 들어 있습니다. 메뉴 항목을 바꾸면 일곱 HTML과 공통 푸터 (`../partials/footer.html`)를 함께 확인하고 `aria-current` 표시를 점검합니다. 모바일 열기·닫기·Escape 동작은 app.js (`../app.js`), 모양은 styles.css (`../styles.css`)에 있습니다. 404.html (`../404.html`)은 별도 단순 Header입니다.

푸터 내용은 `partials/footer.html` 한 곳에서 수정합니다. 일곱 페이지가 `data-include="footer"`로 불러오며 `app.js`가 연도와 현재 페이지를 갱신합니다. 푸터의 ‘관리자’ 링크는 대시보드로 연결됩니다.

## 원본 구현 · 공통 문의 영역과 견적 폼

partials/inquiry.html (`../partials/inquiry.html`)은 홈·about·services·process·facility의 하단 상담 안내입니다. contact/index.html (`../contact/index.html`)은 이 partial 대신 자체 견적 폼을 사용하며, privacy 페이지도 공통 문의 영역을 넣지 않습니다. partial 경로와 실패 시 대체 안내는 `app.js`의 `loadSharedSections`를 확인합니다.

폼 필드를 변경할 때는 다음 순서로 확인합니다.

1. `contact/index.html`의 입력·label·필수 표시·오류 영역·동의 문구를 수정합니다.
2. `app.js`의 필드 수집과 클라이언트 검증, 전화번호 처리 및 전송 payload를 확인합니다.
3. `functions/api/contact.js`의 허용 필드, 서버 검증, 값 목록·길이, 이메일 내용을 확인합니다.
4. 수집 항목이 달라지면 `privacy/index.html`의 게시 내용도 검토합니다.
5. `check_site.py`, `check_form.cjs`, `check_contact.cjs`의 관련 검사를 실행하고 필요한 기대값을 갱신합니다.

문의 수신·발신 주소는 서버의 `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` 변수에서 관리합니다. 페이지에 표시하는 대표 이메일 주소를 바꾸는 일과 구분하세요. Resend 인증은 `RESEND_API_KEY`, Turnstile 서버 인증은 `TURNSTILE_SECRET_KEY`이며 실제 값은 문서·Git에 넣지 않습니다.

## 원본 구현 · 이미지와 스타일

운영 이미지 파일은 photos/ (`../photos/`)에 있습니다. 이름을 바꾸거나 교체할 때 HTML의 `src`뿐 아니라 `srcset`, OG 이미지, CSS `url(...)`와 JS의 동적 경로를 검색합니다. 800px/1600px 등 여러 크기를 쓰는 이미지는 두 파일과 `srcset` 폭 표기를 함께 확인합니다. `alt`, `width`, `height`와 lazy loading 속성을 유지하고 `python check_site.py`로 누락을 확인합니다.

styles.css (`../styles.css`)는 공개 페이지 전체에 공통입니다. `767/768`, `1100/1101`, `1279/1280`, `1280–1440px` 구간의 규칙과 `prefers-reduced-motion`을 확인하고 여러 페이지 폭에서 살핍니다. 대시보드는 dashboard/styles.css (`../dashboard/styles.css`)를 별도로 사용합니다. 실제 CSS 분기점과 검수에 사용한 화면 너비는 구분합니다.

## 원본 구현 · 개인정보처리방침

담당자·연락처·시행일, 문의 수집 항목, Cloudflare·Turnstile·Resend·GA4 및 위탁 설명은 privacy/index.html (`../privacy/index.html`)에서 확인합니다. 실제 폼의 필수값과 게시 문구가 일치하는지도 함께 검토하세요. 내용 변경은 회사의 운영 판단이 필요합니다.

## 원본 구현 · 분석과 대시보드

GA4 Measurement ID는 일곱 공개 페이지 HTML의 태그 URL과 `gtag('config', ...)`에 반복됩니다. 문의 성공 이벤트 호출은 app.js (`../app.js`)에 있습니다. Search Console 사이트 식별자와 GA4 속성 ID는 대시보드 Function의 환경변수 `SEARCH_CONSOLE_SITE`, `GA4_PROPERTY_ID`에서 관리합니다. Google 서비스 계정은 `GOOGLE_SERVICE_ACCOUNT_JSON` Secret이며 실제 값은 저장소에 두지 않습니다.

대시보드 화면·기간 버튼·표시는 dashboard/index.html (`../dashboard/index.html`), dashboard/app.js (`../dashboard/app.js`), dashboard/styles.css (`../dashboard/styles.css`)를 봅니다. GA4·Search Console 요청과 응답 매핑은 functions/dashboard/api/data.js (`../functions/dashboard/api/data.js`)를 봅니다. dashboard/check.py (`../dashboard/check.py`)와 dashboard/check_api.mjs (`../dashboard/check_api.mjs`)는 정적 구성과 API 응답을 검사합니다. 내부 대시보드의 화면과 API 접근 정책은 별도로 확인합니다. 실제 정책 적용 상태는 공개하지 않습니다.

## 원본 구현 · 도메인과 SEO

페이지의 `<title>`, description, canonical, OG title·description·URL·image는 각 HTML의 `<head>`에서 수정합니다. sitemap.xml (`../sitemap.xml`)은 색인 대상 여섯 페이지, robots.txt (`../robots.txt`)는 sitemap 위치를 담습니다. privacy/index.html (`../privacy/index.html`)과 dashboard/index.html (`../dashboard/index.html`)은 `noindex`이며, 404.html (`../404.html`)은 별도 오류 페이지입니다.

도메인을 바꾸면 각 HTML의 canonical·OG URL, 홈의 Organization JSON-LD, sitemap·robots, 대시보드 canonical, check_site.py (`../check_site.py`), dashboard/check.py (`../dashboard/check.py`)의 기대 URL을 검색합니다. 서버의 Turnstile 허용 호스트, Cloudflare Custom Domain, Search Console 사이트 식별자와 Resend 발신 도메인은 별도 운영 설정에서 확인합니다.

## 원본 구현 · 새 공개 페이지

새 디렉터리의 `index.html`에 공통 Header, `app.js`·`styles.css`, 필요한 `data-include`, GA4 태그와 SEO 메타데이터를 넣습니다. 기존 일곱 페이지의 상단 메뉴와 `partials/footer.html`에 링크를 추가하고 `sitemap.xml`에 색인 여부를 반영합니다. `check_site.py`의 페이지 목록·SEO 기대 경로도 갱신하세요. 페이지가 공통 문의 영역을 사용하지 않는다면 그 검사 조건도 함께 검토합니다.

## 원본 구현 · 검사

저장소 루트에서 실행합니다. 이 검사는 실제 외부 서비스로 문의를 보내지 않습니다.

```powershell
python check_site.py
node --check app.js
node --check functions/api/contact.js
node check_shared.cjs
node check_form.cjs
node check_contact.cjs
node check_sections.cjs
python dashboard/check.py
node dashboard/check_api.mjs
node --check dashboard/app.js
node --check functions/dashboard/api/data.js
git diff --check
```

`check_site.py`는 페이지·링크·anchor·중복 ID·asset·이미지 alt·폼 label/required·partial·SEO·sitemap·개인정보처리방침 TODO 표시를 확인합니다. 특정 문장이나 섹션 개수는 검사하지 않습니다.

## 원본 구현 · 문제 해결과 정기 확인

| 증상 | 확인 순서 |
| --- | --- |
| 문의 메일 미수신 | 브라우저 Network의 `/api/contact` 응답 → Turnstile → Function 로그와 변수 → Resend 전송 기록 → 수신함·스팸함 |
| 대시보드 데이터 없음 | `/dashboard/api/data` 응답 → Function 변수 → Google 서비스 계정 인증·GA4/Search Console 권한 |
| 페이지 일부가 비어 있음 | 브라우저 Console·Network → `/partials/...` fetch → 이미지·폰트 경로 → CSS |
| 배포 변경 미반영 | GitHub push/branch → Cloudflare Pages Deployment와 로그 → 운영 도메인·캐시 |

정기적으로 문의 접수, 대표 연락처와 회사 정보, 개인정보처리방침, GA4·Search Console 데이터, 대시보드 접근 제한 및 Cloudflare 배포 상태를 확인합니다.

## 공개 데모 수정 위치

| 바꿀 내용 | 현재 파일·함께 확인할 부분 |
| --- | --- |
| 가상 브랜드·소개 문구 | 각 페이지 HTML의 title·description·본문과 [푸터](../partials/footer.html) |
| 상단 메뉴 | 일곱 페이지 Header·현재 페이지 표시·푸터 메뉴 |
| 문의 항목 | [폼 HTML](../contact/index.html)의 필드·label·타입·필수 표시·오류 영역 |
| 문의 동작 | [app.js](../app.js)의 `validate`, `formatDomesticPhone`, 제출 처리 |
| 파일 선택 | `accept`·`allowedExtensions`·`attachmentError`·`addFiles`·`renderFiles` |
| 개인정보 안내 | [privacy/index.html](../privacy/index.html)과 폼의 데모 확인 문구 |
| 공통 화면 | [styles.css](../styles.css)의 공통 규칙·반응형 규칙·파일 끝의 데모 규칙 |
| 통계 화면 | [dashboard/index.html](../dashboard/index.html)의 ID·버튼 데이터 속성·상태 안내 |
| 통계 동작 | [dashboard/app.js](../dashboard/app.js)의 `loadDashboard`와 렌더링 함수 |
| 샘플 통계 | `dashboard/sample-7.json`, `sample-30.json`, `sample-90.json` |
| 데모 이미지 | `assets/`와 HTML·CSS 참조, 이미지 alt·크기 |
| 화면 미리보기 | `previews/`와 README 이미지·링크 |
| 개발 설명 | [기술 문서](PROJECT.md)와 [배포 문서](DEPLOYMENT.md), [README](../README.md) |

## 공개 데모 폼 변경 절차

1. 입력 ID·name·label·required·maxlength와 `{입력 ID}-error` 요소를 함께 수정합니다.
2. 새 항목이 `.form-grid`의 필드 수집에 포함되는지와 `validate`의 안내를 확인합니다.
3. 전화번호와 선택값·날짜·이메일의 허용 범위를 확인합니다. 현재 검증이 해당 변경의 의미를 충분히 확인하는지도 따로 판단합니다.
4. 파일 항목은 일반 필드 검증에서 제외되므로 전용 선택·제한 처리와 연결 상태를 확인합니다.
5. 데모 확인 체크박스·완료 메시지·privacy 안내를 실제 동작과 맞춥니다.
6. 입력 오류 → 수정 → 완료 → 폼·파일 초기화 흐름을 확인합니다.

파일은 선택 직후 확장자·빈 파일·개수·개별 용량·총 용량을 검사합니다. 중복 판정은 이름·크기·수정 시각을 기준으로 합니다. 파일을 삭제한 뒤 추가할 수 있는지, 최대 개수에서 선택 영역의 키보드 상태가 바뀌는지 확인합니다. 허용 확장자만으로 파일 내용의 안전성을 검증했다고 설명하지 않습니다.

현재 제출에는 서버 요청이 없습니다. 원본의 전송 코드나 봇 위젯을 일부만 복사하면 데모 경계와 개인정보 안내가 달라질 수 있으므로 화면과 스크립트·검사·문서를 함께 검토해야 합니다.

## 공개 데모 통계 변경 절차

1. JSON의 `meta.source`는 `sample`로 유지합니다.
2. 추이 길이를 7·30·90일과 맞추고 각 날짜와 `range`를 일치시킵니다.
3. 문의 추이 합계와 `summary.inquiries`, `inquiryStats.leads`를 맞춥니다.
4. 문의 전환율은 `leads / contactPageViews × 100`과 일치시킵니다.
5. 데이터 단위와 `percent`·`changeLine` 표시를 확인합니다. 비율과 퍼센트 값을 혼동하지 않습니다.
6. 검색 페이지 성과의 `null`, 빈 배열, 오류 상태를 각각 확인합니다.
7. 지표 전환과 빠른 기간 전환에서 이전 응답이 새 화면을 덮어쓰지 않는지 확인합니다.

샘플 비교값은 예시 값이며 원본 서버의 이전 기간 조회를 실행해 계산한 결과가 아닙니다. 실제 통계와 검색어를 복사하지 않습니다. 새 기간을 추가한다면 HTML 버튼·JSON 파일·현재 검사 대상 목록을 함께 바꿔야 합니다.

## 공개 데모 페이지·이미지 변경 절차

새 페이지를 추가하면 Header, skip link, `main`, 공통 CSS·스크립트, 푸터를 연결합니다. 관련 상단·하단 메뉴와 현재 페이지 표시를 확인하고 README·문서의 페이지 목록을 갱신합니다. 현재 `check_demo.py`는 HTML을 재귀 탐색하므로 새 페이지도 검사 대상에 들어갑니다.

이미지 변경 시 HTML의 `src`와 CSS 참조를 확인합니다. `alt`, `width`, `height`를 유지하고 lazy loading이 실제 이미지에 필요한지 확인합니다. 폰트는 [라이선스](../fonts/LICENSE)를 함께 유지합니다. 실제 회사 사진을 새 이미지로 추가하지 않습니다.

공통 스타일 수정은 소개·문의 페이지에 동시에 영향을 줍니다. 모바일 1단 전환과 폼·파일 목록을 함께 확인합니다. 사용하지 않는 원본 규칙도 남아 있으므로 실제 매칭되는 요소를 확인한 뒤 수정합니다. 코드에 정의된 media query와 검수한 화면 폭은 구분해서 기록합니다.

## 공개 데모 검사

```sh
python check_demo.py
node --check app.js
node --check dashboard/app.js
git diff --check
```

| 검사 | 현재 확인하는 내용 |
| --- | --- |
| HTML 링크·자료 | src·href가 같은 출처의 존재하는 파일을 가리키는지 |
| 이미지 | alt·width·height 속성 존재 |
| 문의 경계 | form에 action·data-endpoint가 없는지 |
| 실행 자료 | 외부 운영 연동의 일부 문자열 패턴이 없는지 |
| 인증정보 | 문서를 포함한 텍스트의 일부 토큰·비밀키 패턴 |
| 폴더·라이선스 | 운영 서버·사진 폴더 제외와 폰트 라이선스 존재 |
| 데이터 | sample 출처·기간별 길이·문의 합계·전환율 일관성 |
| JavaScript | 두 실행 파일의 문법 |

서비스 이름을 문서에서 설명하는 것은 허용합니다. Markdown에도 인증정보 패턴 검사는 적용하지만 HTML·JS처럼 운영 서비스명 자체를 거절하지는 않습니다. 정적 검사는 모든 비밀값을 탐지하거나 사용자 입력의 실제 동작을 실행하는 검사가 아닙니다. 원본의 중복 ID·anchor·SEO 검사를 모두 이식한 것도 아닙니다.

## 공개 데모 수동 확인과 문제 해결

| 확인 항목·증상 | 점검 순서 |
| --- | --- |
| 푸터가 비어 있음 | HTTP 실행 여부 → Network의 partial 응답 → Console → data-include 경로 |
| 파일이 로드되지 않음 | HTML·CSS 경로 → 서버 루트 → 파일명·대소문자 → 응답 상태 |
| 폼 오류 | 입력 ID·오류 요소·label → 필드 수집 → 검증 함수 → 포커스·aria 상태 |
| 첨부 목록 이상 | 파일 제한 → 중복 판정 → 삭제·재추가 → 목록·전체 크기 표시 |
| 통계 데이터 없음 | 샘플 응답 → JSON 문법 → meta.source → 렌더링에 필요한 항목 |
| 빠른 기간 전환 이상 | 요청 취소 → 현재 controller 확인 → 상태 안내·최종 기간 |
| 화면 가로 넘침 | 이미지 크기·aspect-ratio → 그리드 최소 폭 → 표·파일명·버튼 |
| 배포 경로 문제 | `/` 기준 요청 → 루트·하위 경로 설정 → 실제 배포 파일 |
| 변경 미반영 | 배포 커밋 → Console·Network → 캐시 → README 미리보기 갱신 |

데스크톱과 모바일에서 모든 페이지·푸터·이미지·폰트·메뉴를 확인합니다. 폼의 필수값·전화·이메일·파일 개수·개별 및 총 용량·확인 체크박스·완료 후 초기화를 확인합니다. 통계 기간·지표·빈 값·로드 실패도 확인합니다. Network에서 실제 문의 제출이나 외부 분석 요청이 없는지 확인합니다.

## 문서·공개 자료의 정기 확인

화면 기능을 바꿀 때 README의 구현 범위와 검사 이력, PROJECT의 데이터·흐름 설명, DEPLOYMENT의 실행 조건을 함께 확인합니다. 미리보기는 실제 화면과 달라지면 갱신합니다. 원본 코드의 설명을 수정할 때는 원본 동작을 대조하고, 공개 데모 기능으로 오해할 표현이 없는지 확인합니다.

회사 식별정보, 계정값, 비밀키, 실제 사용자 데이터와 운영 접근 정책을 문서에 추가하지 않습니다. 입력 수집이나 외부 연동을 도입한다면 개인정보 안내와 검사 범위도 함께 검토해야 합니다.
