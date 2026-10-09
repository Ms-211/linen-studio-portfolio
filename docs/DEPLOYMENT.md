# 배포와 외부 서비스 설정

원본 배포 문서의 서비스 구성·환경변수·인증·도메인·점검 절차를 유지한 개발 참고 문서입니다. 실제 운영 도메인은 예시로 교체하고 계정값·연락처·운영 접근 정책 상태는 제외했습니다.

**‘원본 구현’ 절은 원본 서버 코드가 전제한 구성입니다. 이 공개 데모에는 해당 서버 코드와 서비스 연결이 없습니다.** 변수 이름과 서비스명은 설계를 설명하기 위해 남겼으며 비밀값은 기록하지 않습니다. 현재 데모의 실행·배포는 마지막 절을 따릅니다. 관리 화면의 위치와 항목은 원본 문서의 참고 정보이며 현재 계정이나 서비스 화면을 직접 확인한 결과가 아닙니다.

## 원본 구현 · 배포 구조

저장소는 루트의 정적 HTML·CSS·JS·이미지와 functions/ (`../functions/`)의 Cloudflare Pages Functions 경로를 사용합니다. 빌드 스크립트나 별도 산출물 디렉터리는 없습니다. GitHub 연동, Cloudflare Pages 프로젝트, Production branch, 실제 배포 상태는 저장소 파일만으로 검증할 수 없으므로 Cloudflare Dashboard의 프로젝트 **Settings / Builds & deployments** 및 **Deployments**에서 확인하세요.

Pages 설정을 점검할 때는 Root directory가 저장소 루트, Build output directory가 `.`, 별도 빌드가 없는 명령(`exit 0`)인지 확인합니다. 이 값들은 현재 파일 배치에 맞는 설정이며, **실제 계정에 적용된 값이라는 뜻은 아닙니다**. `.openai/hosting.json` (`../.openai/hosting.json`)의 정적 디렉터리 설정은 Cloudflare Pages의 빌드·브랜치 설정을 증명하지 않습니다.

도메인 관련 설명의 `https://example.com`은 예시 주소입니다. 원본 운영 도메인은 포함하지 않습니다. Custom Domain, DNS, 인증서·HTTPS, apex와 `www` 처리 및 리디렉션은 Cloudflare Dashboard에서 별도로 확인해야 합니다.

## 원본 구현 · Pages Functions

| 경로 | 구현 | 역할 |
| --- | --- | --- |
| `POST /api/contact` | functions/api/contact.js (`../functions/api/contact.js`) | 문의 검증, Turnstile 확인, Resend 이메일 전송 |
| `GET /dashboard/api/data?range=7\|30\|90` | functions/dashboard/api/data.js (`../functions/dashboard/api/data.js`) | GA4·Search Console 통계 조회 |

Python 정적 서버는 이 Function들을 실행하지 않습니다. Function까지 로컬에서 시험하려면 Wrangler 실행 환경과 로컬용 변수가 필요합니다. 저장소의 `.gitignore` (`../.gitignore`)는 `.dev.vars*`, `.env*`, `.wrangler/`를 제외합니다. 로컬 변수에는 운영 Secret을 그대로 복사하지 말고 별도 테스트 자격 증명을 사용하세요.

## 원본 구현 · 환경변수와 Secret

각 변수의 **실제 값과 Production·Preview 등록 상태**는 Cloudflare Pages 프로젝트의 **Settings → Variables and Secrets**에서 각각 확인합니다. 저장소에는 값을 기록하지 않습니다.

| 변수 | 사용처·용도 | Secret |
| --- | --- | --- |
| `TURNSTILE_SECRET_KEY` | 문의 Function의 Turnstile 서버 검증 | 예 |
| `RESEND_API_KEY` | Resend 이메일 API 인증 | 예 |
| `CONTACT_TO_EMAIL` | 문의 수신 주소 | 인증 Secret은 아님 |
| `CONTACT_FROM_EMAIL` | 인증된 발신 도메인의 발신 주소 | 인증 Secret은 아님 |
| `GA4_PROPERTY_ID` | 대시보드 GA4 속성 조회 | 인증 Secret은 아님 |
| `SEARCH_CONSOLE_SITE` | Search Console 사이트 식별자 | 인증 Secret은 아님 |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | 대시보드의 Google API 인증 | 예 |

두 Function은 필요한 변수가 없으면 서비스 불가 응답을 냅니다. Production과 Preview는 변수를 별도로 확인해야 합니다. Google 서비스 계정에는 대상 GA4 속성과 Search Console 사이트를 읽을 권한이 필요하며, 실제 권한은 Google 관리 화면에서 확인합니다.

## 원본 구현 · Turnstile과 Resend

견적 문의 페이지 (`../contact/index.html`)의 Turnstile Site Key는 브라우저에 노출되는 공개 설정입니다. 토큰은 app.js (`../app.js`)가 문의 요청에 포함하고, 문의 Function은 `TURNSTILE_SECRET_KEY`로 Siteverify를 호출해 성공과 호스트 이름을 확인합니다. 검증이 실패하면 Resend 호출 전에 요청을 거절합니다. 위젯의 운영·Preview 허용 호스트와 Site Key/Secret의 짝은 Cloudflare Turnstile 설정에서 확인하세요.

문의 Function은 `CONTACT_FROM_EMAIL`과 `CONTACT_TO_EMAIL`을 사용합니다. 제목은 업체명과 업종을 포함하고, 본문은 텍스트와 HTML 두 형식입니다. 선택 이메일이 있으면 Reply-To로 사용합니다. Resend API Key, 발신 도메인의 인증 상태, DNS 레코드, 전송·수신 기록은 Resend와 DNS 관리 화면에서 확인합니다. 기존 수신용 DNS 레코드는 확인 없이 변경하지 마세요.

## 원본 구현 · GA4와 Search Console

GA4 브라우저 태그는 홈 (`../index.html`), 회사소개 (`../about/index.html`), 서비스 (`../services/index.html`), 공정 (`../process/index.html`), 시설 (`../facility/index.html`), 문의 (`../contact/index.html`), 개인정보처리방침 (`../privacy/index.html`)의 HTML에 각각 있습니다. Measurement ID를 변경할 때는 일곱 파일의 태그 URL과 `gtag('config', ...)`를 함께 확인합니다. 폼 성공 이벤트는 `app.js`의 `generate_lead`입니다.

대시보드 API의 GA4 Data API 조회는 브라우저 태그와 별도입니다. 서버 변수 `GA4_PROPERTY_ID`와 `GOOGLE_SERVICE_ACCOUNT_JSON`을 사용합니다. Search Console 조회는 같은 서비스 계정과 `SEARCH_CONSOLE_SITE`를 사용합니다. sitemap.xml (`../sitemap.xml`)은 색인 대상 여섯 페이지를 열거하고 robots.txt (`../robots.txt`)는 sitemap 주소를 알립니다. Search Console의 사이트 등록·sitemap 제출·권한 상태는 Google 관리 화면에서 확인하세요.

## 원본 구현 · 대시보드 접근 제한

내부용 대시보드는 화면과 API를 함께 접근 정책으로 보호해야 합니다. 로그인 화면만 보호하고 데이터 API를 공개하면 통계가 노출될 수 있으므로 두 경로를 별도로 확인합니다. 검색 제외 설정은 접근 보호를 대신하지 않습니다. 이 문서는 실제 운영 정책과 적용 상태를 공개하거나 정책을 설정하지 않습니다.

## 원본 구현 · 도메인과 SEO

도메인을 변경하면 일곱 페이지의 canonical·Open Graph URL, 대시보드 canonical, sitemap.xml (`../sitemap.xml`), robots.txt (`../robots.txt`), 홈의 Organization JSON-LD, check_site.py (`../check_site.py`)와 dashboard/check.py (`../dashboard/check.py`)의 기대 URL을 함께 검토합니다. Turnstile 허용 호스트, Cloudflare Custom Domain, Search Console 사이트 식별자와 Resend 발신 도메인도 별도 확인이 필요합니다. 변경 위치별 안내는 유지보수 문서 (`MAINTENANCE.md#도메인과-seo`)에 있습니다.

## 원본 구현 · 배포 순서

1. 로컬에서 수정하고 검사 (`MAINTENANCE.md#검사`)를 실행합니다.
2. Git commit·push 후 Cloudflare Pages의 해당 branch 배포가 완료됐는지 확인합니다.
3. 운영 도메인에서 홈·공개 페이지·404, 모바일 메뉴, partial, 이미지와 폰트를 확인합니다.
4. Preview/운영 환경에 맞는 테스트 문의 한 건으로 Turnstile, Function 응답, Resend 기록과 수신함 도착을 확인합니다. 실제 개인정보를 테스트 데이터로 사용하지 않습니다.
5. GA4 이벤트·Search Console 연결과 대시보드 데이터/접근 제한을 확인합니다.

## 원본 구현 · 배포 후 체크리스트

- [ ] 일곱 공개 페이지와 404가 정상적으로 열리고 모바일 메뉴가 동작한다.
- [ ] 공통 문의 영역·푸터, 이미지·폰트에 로드 오류가 없다.
- [ ] 문의폼 검증, Turnstile, 수신 이메일과 Reply-To가 확인된다.
- [ ] GA4 방문·문의 이벤트 및 대시보드의 GA4·Search Console 데이터가 확인된다.
- [ ] 대시보드 화면과 API의 접근 정책을 확인했다.
- [ ] `sitemap.xml`, `robots.txt`, canonical과 운영 도메인이 일치한다.

## 현재 공개 데모 실행과 배포

공개 데모는 루트의 HTML·CSS·JavaScript·벡터 이미지·폰트·샘플 JSON을 정적으로 제공합니다. 외부 서비스 인증정보와 별도 빌드 단계가 필요하지 않습니다.

```sh
python -m http.server 4173 --bind 127.0.0.1
```

- 홈: <http://127.0.0.1:4173/>
- 문의 데모: <http://127.0.0.1:4173/contact/>
- 통계 데모: <http://127.0.0.1:4173/dashboard/>

`file://`로 직접 열면 공통 HTML 로딩이 정상적으로 동작하지 않을 수 있습니다. Python 정적 서버로 모든 공개 데모 기능을 체험할 수 있습니다. 원본 외부 서비스 설정을 복사하거나 운영키를 등록하지 않습니다.

| 설정·동작 | 현재 데모에서 확인할 내용 |
| --- | --- |
| 정적 제공 디렉터리 | 공개 저장소 루트 |
| 빌드 | 별도 빌드 명령과 산출물 없음 |
| 디렉터리 URL | `/about/` 등이 해당 `index.html`로 연결 |
| 공통 파일 | `partials/`, `assets/`, `fonts/` 함께 제공 |
| 통계 | `dashboard/`의 HTML·CSS·JS·샘플 JSON 함께 제공 |
| 오류 페이지 | 잘못된 경로에 대한 `404.html` 제공은 호스팅 설정 확인 |
| 문의 | 서버 전송 없이 데모 검증·완료 안내 |
| 분석 | 운영 분석 태그와 외부 통계 API 호출 없음 |

HTML·스크립트·CSS의 `/` 기준 경로는 사이트 루트 제공을 전제로 합니다. GitHub Pages의 `사용자.github.io/저장소명/` 형태는 현재 지원하지 않습니다. 하위 경로를 지원하려면 메뉴와 페이지 링크뿐 아니라 partial·샘플 JSON·이미지·스타일·폰트 요청 경로를 함께 바꾸고 검사해야 합니다.

## 공개 데모 배포 순서

1. [공개 데모 검사](MAINTENANCE.md#공개-데모-검사)를 실행하고 변경 파일을 검토합니다.
2. 실행 코드·문서·미리보기에 회사 자료·실제 개인정보·계정 식별자·인증정보가 추가되지 않았는지 확인합니다.
3. 저장소 루트를 제공하는 정적 호스팅 설정과 배포할 커밋을 확인합니다.
4. 데스크톱과 모바일에서 모든 페이지·푸터·이미지·폰트를 확인합니다.
5. 예시 입력으로 문의 오류·파일 제한·확인 체크박스·완료·초기화를 확인합니다.
6. 통계의 7·30·90일 전환과 지표·표·차트가 샘플 자료로 갱신되는지 확인합니다.
7. Network에서 실제 문의 전송·분석 서비스 요청이 없는지 확인합니다.
8. 오류 페이지와 `fonts/LICENSE` 제공 여부를 확인합니다.

이 문서는 호스팅 설정이나 사이트 배포를 수행하지 않습니다. 저장소가 Public인 것과 웹사이트가 배포되어 있는 것은 별개의 상태입니다.

## 공개 데모 배포 후 체크리스트

- [ ] 홈과 여섯 소개·문의·안내 페이지, 통계 화면이 열린다.
- [ ] 공통 푸터·이미지·폰트·샘플 JSON에 로드 오류가 없다.
- [ ] 모바일 메뉴·Escape·키보드 이동과 좁은 화면 배치를 확인했다.
- [ ] 문의 완료가 실제 접수로 오해되지 않으며 데이터 전송·저장이 없다.
- [ ] 통계 화면의 가상 데이터 표시와 고정 예시 날짜를 확인했다.
- [ ] 사이트 루트·하위 페이지·오류 페이지 경로를 확인했다.
- [ ] 운영 계정값·비밀키·실제 회사 자료가 포함되지 않았다.
- [ ] 사용하는 폰트 라이선스를 함께 제공한다.

데모의 [개인정보 안내](../privacy/index.html)는 전송·저장 없는 현재 동작을 설명합니다. 실제 배포 시 호스팅 제공자의 기본 접속 로그 처리와 안내가 맞는지도 확인합니다. 실제 서비스로 전환한다면 서버 검증·인증정보 관리·봇 방어·관리자 접근 보호와 개인정보 처리 절차를 별도로 구축해야 합니다.
