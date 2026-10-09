# 프로젝트 기술 구성

원본 프로젝트의 기술 문서를 기반으로 구현 흐름, 검증, 외부 서비스 연동, 반응형·접근성과 검사 구성을 상세히 정리했습니다. 회사명·운영 도메인·실제 계정값·접근 정책 상태는 제외했습니다.

**본문의 ‘원본 구현’은 개발 경험을 설명합니다. 현재 공개 저장소의 실행 방법은 마지막 ‘현재 공개 데모와의 차이’를 기준으로 확인하세요.** 원본 경로는 일반 텍스트로 표시하며 해당 파일이 공개 저장소에 있다는 뜻은 아닙니다. 코드에서 확인한 동작과 실제 외부 서비스 설정·운영 검증 결과도 구분합니다.

## 원본 구현 · 개요와 흐름

원본 프로젝트는 기업 고객에게 서비스·품목·공정·시설 정보를 제공하고 문의를 받는 정적 다중 페이지 사이트입니다.

```text
브라우저 ── 정적 HTML·CSS·JS ── Cloudflare Pages
견적 문의 ── Turnstile ── POST /api/contact ── Resend ── 담당자 이메일
대시보드 ── GET /dashboard/api/data ── GA4 Data API·Search Console API
```

저장소에는 별도 프런트엔드 빌드 단계나 문의 DB 코드가 없습니다. functions/ (`../functions/`)는 요청 시 실행되는 Pages Functions의 경로 기반 엔드포인트입니다.

## 원본 구현 · 화면과 공통 부분

홈 index.html (`../index.html`)과 about (`../about/index.html`), services (`../services/index.html`), process (`../process/index.html`), facility (`../facility/index.html`), contact (`../contact/index.html`), privacy (`../privacy/index.html`) 페이지가 각각 완성된 HTML입니다. Header와 상단 navigation도 각 HTML에 직접 들어 있습니다. styles.css (`../styles.css`)는 이 페이지들의 공통 CSS이고 app.js (`../app.js`)는 모바일 메뉴, 페이지 내 섹션 표시, 공통 HTML 로딩, 문의폼 동작을 담당합니다.

`data-include="inquiry"`와 `data-include="footer"` 요소는 `app.js`가 `/partials/{이름}.html`을 가져와 채웁니다. partials/inquiry.html (`../partials/inquiry.html`)은 홈·회사소개·서비스·공정·시설 페이지에 들어갑니다. 견적 문의 페이지에는 별도 폼이 있으므로, 개인정보처리방침 페이지와 함께 공통 문의 영역을 넣지 않습니다. partials/footer.html (`../partials/footer.html`)은 일곱 페이지 모두에 들어가며 저작권 연도와 현재 페이지 표시를 스크립트가 갱신합니다. partial을 가져오지 못하면 연락처로 이동할 수 있는 대체 내용이 표시됩니다.

## 원본 구현 · 견적 문의

폼은 contact/index.html (`../contact/index.html`)에 있습니다. 필수 입력은 업체명, 담당자명, 전화번호, 사업장 지역, 업종, 희망 수거 주기와 개인정보 동의입니다. 이메일, 객실 수, 시작 희망일, 문의 내용은 선택입니다. 화면은 `novalidate`를 사용하며 `app.js`가 필드별 오류를 표시하고 국내 전화번호를 정규화합니다.

제출 시 클라이언트는 동의, Turnstile 토큰, 같은 출처의 `/api/contact` 엔드포인트와 HTTPS 조건을 확인합니다. 전송 중 중복 제출을 막고 90초 제한을 둡니다. 성공하면 폼을 초기화하고 GA4 `generate_lead` 이벤트를 보냅니다. 실패하면 입력은 남겨 두고 오류 메시지를 표시합니다.

functions/api/contact.js (`../functions/api/contact.js`)는 POST, HTTPS/로컬 호스트, 동일 Origin, multipart/form-data 형식과 요청 크기 제한을 확인합니다. 허용 필드·필수값·길이·전화번호·선택값·동의를 다시 검증하고 숨김 `website` 필드에 값이 있으면 거절합니다. Turnstile Siteverify의 성공과 호스트 이름을 확인한 뒤 Resend로 텍스트·HTML 이메일을 전송합니다. 이메일 제목에는 업체명과 업종이 들어가며, 이메일 주소가 입력된 경우 Reply-To를 설정합니다. 성공·오류는 JSON과 HTTP 상태로 반환하고 문의 내용을 DB에 저장하지 않습니다. 담당자 수신함과 외부 전송 서비스에서의 처리 여부는 별도 운영 영역입니다.

## 원본 구현 · 통계 대시보드

dashboard/index.html (`../dashboard/index.html`), dashboard/styles.css (`../dashboard/styles.css`), dashboard/app.js (`../dashboard/app.js`)는 별도 화면입니다. 기본 30일과 7·90일 선택을 제공하며 방문자, 검색 유입, 문의 전환, 추이, 유입 경로, 인기 페이지와 검색어를 표시합니다. 브라우저는 같은 출처의 `/dashboard/api/data?range=...`만 호출합니다.

functions/dashboard/api/data.js (`../functions/dashboard/api/data.js`)는 서버 환경변수의 Google 서비스 계정으로 액세스 토큰을 얻어 GA4 Data API와 Search Console API를 조회합니다. 한국 시간 기준 전일까지의 기간을 이전 동일 기간과 비교하고, 한 서비스만 실패하면 가능한 데이터와 오류 상태를 함께 반환합니다. 서비스 계정 비밀값은 브라우저 스크립트에 포함되지 않습니다.

내부 통계 화면에는 화면과 API 양쪽의 접근 보호가 필요합니다. 검색 제외 메타데이터와 sitemap 제외는 접근 제한을 대신하지 않습니다. 실제 운영 접근 정책과 그 적용 상태는 공개 문서에 포함하지 않습니다.

## 원본 구현 · 개인정보와 외부 서비스

privacy/index.html (`../privacy/index.html`)은 문의폼 수집 항목과 처리방침을 게시합니다. 코드상 문의 데이터는 Pages Function에서 검증 후 Resend로 이메일 전송되며 별도 문의 DB는 없습니다. Cloudflare Pages·Turnstile은 사이트·봇 확인에, GA4는 방문 분석에 사용됩니다. 실제 외부 서비스의 보관·권한 설정은 저장소 밖에서 확인해야 합니다.

## 원본 구현 · 분석·검색·오류 페이지

GA4 브라우저 태그는 일곱 공개 페이지에 있고 문의 성공 시 `generate_lead`를 기록합니다. 대시보드 API의 GA4 조회는 별도의 서버 측 서비스 계정 인증입니다. Search Console은 대시보드 API가 조회하며, sitemap.xml (`../sitemap.xml`)은 색인 대상 여섯 페이지를 나열하고 robots.txt (`../robots.txt`)는 해당 sitemap을 알립니다. 각 색인 페이지에는 title, description, canonical, Open Graph URL·이미지가 있습니다. 개인정보처리방침은 `noindex, follow`, 404.html (`../404.html`)은 `noindex, follow`입니다.

## 원본 구현 · 반응형·이미지·접근성

공개 페이지 CSS의 주요 media query는 `767px` 이하, `768px` 이상, `1100px` 이하/`1101px` 이상, `1279px` 이하/`1280px` 이상과 `1280–1440px`입니다. `prefers-reduced-motion`도 처리합니다. `app.js`의 데스크톱 섹션 표시는 `1280px` 이상에서 동작합니다. 이는 코드의 분기점이며 특정 화면 폭의 검수 기록과 구별해야 합니다. 대시보드 CSS에는 `1000/800/600/360px` 분기점이 있습니다.

photos/ (`../photos/`)의 이미지는 HTML의 `src`, 일부 `srcset`, OG 이미지에서 사용됩니다. 사용 이미지에는 `alt`가 있고 정적 검사 대상 페이지의 `img`에는 `width`와 `height`가 있습니다. 일부 하단 이미지는 `loading="lazy"`를 사용합니다. fonts/ (`../fonts/`)의 Pretendard Regular·Medium·SemiBold·Bold WOFF는 공개 페이지와 대시보드 CSS에서 불러옵니다. skip link, label, 상태 메시지와 모바일 메뉴의 Escape 닫기 동작도 코드에 있습니다.

## 원본 구현 · 검사

check_site.py (`../check_site.py`)는 공개 페이지·partial의 존재, 내부 링크와 anchor, 중복 ID, 이미지·asset, alt와 크기, label·필수 필드, SEO 메타데이터, sitemap 및 개인정보처리방침의 TODO 표시를 검사합니다. 문구나 섹션 수를 고정하는 검사는 없습니다. check_shared.cjs (`../check_shared.cjs`), check_form.cjs (`../check_form.cjs`), check_contact.cjs (`../check_contact.cjs`), check_sections.cjs (`../check_sections.cjs`)는 공통 로딩, 폼, 문의 Function, 섹션 이동을 검사합니다. 대시보드는 dashboard/check.py (`../dashboard/check.py`)와 dashboard/check_api.mjs (`../dashboard/check_api.mjs`)로 확인합니다. 실행 명령은 유지보수 문서 (`MAINTENANCE.md#검사`)에 있습니다.

### 문의 첨부파일과 오류 처리 세부사항

원본 문의는 `multipart/form-data`에서 일반 필드와 첨부파일을 분리합니다. 일반 필드는 허용 목록과 중복 여부를 확인하고 문자열이 아닌 값은 거절합니다. 첨부파일은 최대 3개, 파일당 10MB, 합계 20MB이며 요청의 Content-Length에는 22MB 제한을 적용합니다. Content-Length 검사만으로 모든 요청 크기 제한을 보장하는 것으로 설명하지 않습니다.

첨부파일은 비어 있는 파일과 허용하지 않은 확장자를 거절하고, 알려진 MIME 타입이면 확장자와의 조합도 확인합니다. 파일 이름의 경로 부분과 제어 문자를 제거한 뒤 이메일 첨부용 Base64로 변환합니다. 파일 내용 전체를 검사하거나 악성코드를 탐지하는 기능은 구현 범위가 아닙니다.

| 단계 | 원본 처리 | 실패 시 동작 |
| --- | --- | --- |
| 요청 확인 | POST·동일 Origin·프로토콜·multipart·설정 확인 | 이메일 서비스 호출 전에 거절 |
| 입력 읽기 | 허용 필드·중복값·개인정보 동의·봇 함정 필드 확인 | 입력 오류 응답 |
| 필드·파일 검증 | 필수값·길이·선택값·전화·날짜·첨부 제한 확인 | 입력 또는 파일 오류 응답 |
| 봇 확인 | 검증 성공과 요청 호스트의 일치 확인 | 전송하지 않고 봇 검증 오류 응답 |
| 이메일 구성 | 텍스트·HTML, 선택 Reply-To, 첨부 구성 | 첨부 읽기 실패 시 전송 실패 응답 |
| 서비스 호출 | Resend 응답 상태와 결과 ID 확인 | 실패 또는 시간 초과를 전송 실패로 안내 |

Turnstile 서버 검증 요청에는 10초, 이메일 서비스에는 60초, 브라우저의 전체 전송에는 90초 제한이 있습니다. 브라우저 요청 취소가 외부 서비스에서 이미 시작된 이메일 전송의 취소를 보장하지는 않습니다. 성공 상태는 원본 코드가 처리한 서비스 응답을 뜻하며 수신함 도착은 별도 확인 대상입니다.

### 통계 인증·응답 구조와 계산

원본 서버는 Google 서비스 계정 JSON을 환경변수에서 읽고 서명된 JWT를 만들어 액세스 토큰을 얻습니다. 요청 범위는 분석·검색 읽기 권한이며 비밀키를 브라우저에 전달하지 않습니다. 토큰 요청에는 10초, 통계 서비스 요청에는 12초 제한이 있습니다.

조회 기간은 7·30·90일 중 하나만 허용하며 추가 쿼리 키는 거절합니다. 날짜는 한국 시간 기준 전일까지를 현재 기간으로 잡고 바로 앞의 동일 길이 기간과 비교합니다. 날짜별 값이 없는 추이 항목은 0으로 채웁니다.

| 응답 항목 | 역할 |
| --- | --- |
| `range` | 현재·비교 조회 기간 |
| `summary` | 방문자, 검색 유입, 문의 수, 문의 전환율과 비교값 |
| `visitorTrend` | 날짜별 방문자·검색 세션·문의 이벤트 |
| `trafficSources` | 유입 경로별 세션 |
| `popularPages` | 페이지별 조회수와 방문자 |
| `searchConsole` | 클릭·노출·클릭률·평균 검색순위와 비교값 |
| `searchQueries`, `searchPages` | 검색어별·페이지별 검색 성과 |
| `inquiryStats` | 문의 페이지 조회·문의 이벤트·전환율 |
| `meta` | 갱신 시각, 데이터 출처, 서비스별 오류 |

일반 증감률은 `(현재 - 이전) / 이전 × 100`입니다. 이전 값이 0이면 변화 없음 또는 비교 불가 상태로 처리합니다. 문의 전환율은 문의 이벤트 수를 문의 페이지 조회수로 나눈 값이며 실제 계약 성사율은 아닙니다. 전환율과 검색 클릭률의 변화는 퍼센트포인트로 표시하고, 평균 검색순위는 값이 작아지는 방향을 개선으로 표시합니다.

GA4와 Search Console 요청은 `Promise.allSettled`로 처리합니다. 한 서비스만 실패하면 나머지 결과와 서비스별 오류를 반환하며, 둘 다 실패하면 오류 상태로 응답합니다. 검색 페이지 조회만 실패한 경우 해당 데이터는 `null`로 구분합니다. 운영 응답은 `private, no-store`로 캐시하지 않도록 구성했습니다.

## 현재 공개 데모와의 차이

| 영역 | 원본 구현 | 공개 데모 |
| --- | --- | --- |
| 소개 자료 | 실제 기업의 소개·품목·공정·시설 자료 | 가상 브랜드와 일반 예시 콘텐츠 |
| 문의 partial | 공통 문의 영역과 푸터 | 공통 푸터만 사용, 문의 안내는 페이지에 직접 구성 |
| 문의 제출 | 봇 검증·서버 검증·이메일 서비스 호출 | 클라이언트 검증 후 데모 완료·초기화 |
| 개인정보 안내 | 실제 문의 처리와 외부 서비스 안내 | 전송·저장 없는 데모 처리 안내 |
| 분석·통계 | 방문 분석 태그와 서버 통계 조회 | 외부 분석 태그 없이 가상 JSON 조회 |
| 검색·SEO | canonical·OG·구조화 데이터·sitemap·robots | 운영 주소와 회사 메타데이터 제외 |
| 이미지 | 운영 사진과 반응형 이미지 변형 | 데모 전용 SVG와 README 화면 미리보기 |
| 서버 코드·설정 | 서버 함수와 운영 환경변수 | 서버 함수·인증정보·호스팅 계정 설정 제외 |
| 검사 | 화면·폼·서버 API·SEO별 검사 | 데모 경계·자료·샘플 데이터 검사 |

현재 [문의 화면](../contact/index.html)에는 전송 엔드포인트가 없고 [공통 스크립트](../app.js)는 검증 후 완료 메시지만 표시합니다. 파일은 현재 브라우저 메모리에서만 관리하며 이메일·서버·브라우저 저장소로 보내지 않습니다. 동의 문구도 실제 수집 동의가 아닌 데모 확인으로 바꿨습니다.

[대시보드 스크립트](../dashboard/app.js)는 [7일](../dashboard/sample-7.json), [30일](../dashboard/sample-30.json), [90일](../dashboard/sample-90.json) 샘플을 읽습니다. `meta.source`는 `sample`이고 날짜는 고정된 예시 기간입니다. 기간 선택, 지표 전환, 차트·표와 로딩·실패 처리는 체험할 수 있으나 원본 서버의 비교 기간 계산이나 Google 인증을 실행하지는 않습니다.

현재 푸터는 [partials/footer.html](../partials/footer.html), 소개 페이지 스타일은 [styles.css](../styles.css), 통계 스타일은 [dashboard/styles.css](../dashboard/styles.css)에서 확인합니다. 공개 화면에서 사용하지 않는 원본 연도·섹션 탐색 코드와 일부 스타일 규칙도 공통 파일에 남아 있습니다. 이를 새로운 데모 기능으로 소개하지 않습니다.

## 공개 데모 검사와 확인 범위

현재 실행할 수 있는 검사는 [check_demo.py](../check_demo.py)와 두 JavaScript 파일의 문법 검사입니다. 상세 명령과 수동 검수는 [유지보수 문서](MAINTENANCE.md#공개-데모-검사)에 있습니다.

브라우저 검사는 Edge에서 페이지·폼 오류·파일 선택·확인 체크박스·완료 후 초기화·기간 및 지표 전환·모바일 메뉴를 확인했습니다. 390px 홈 화면의 가로 넘침과 외부 요청·실제 제출 부재도 확인했습니다. 모든 반응형 구간·보조기술·브라우저, 성능 지표와 원본 외부 서비스 운영 상태를 검증한 기록은 아닙니다.
