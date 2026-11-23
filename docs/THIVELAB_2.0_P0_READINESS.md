# THIVELAB 2.0 — P0 검증과 TOOLS 개발 준비

검증 시각: **2026-10-09 20:14–20:20 KST**. 대상 저장소 HEAD `7ed7435`. 기준 문서: [현황 진단](./THIVELAB_2.0_AUDIT.md), [기술 로드맵](./THIVELAB_2.0_ROADMAP.md), [최신 B2C 전략](./THIVELAB_2.0_B2C_STRATEGY.md). 최신 B2C 전략의 여섯 도구를 MVP로 취급한다. 이 점검은 읽기 전용 명령과 공개 GET 요청만 사용했다. DB 복원, 빌드, 서비스 재시작, DNS·Cloudflare 변경은 하지 않았다. **PASS는 표에 적힌 검증 범위에만 해당한다.**

## 결론

**P0 전체: 미완료.** 운영·DEV 빌드 격리 실패, 최신 DB 덤프의 격리 복원 미검증, 외부 백업 부재, Cloudflare 원격 라우트·정책 미검증, 안전한 운영 롤백 절차 미검증이다. `tools.thivelab.com` 공개와 기존 NODELOG 메뉴 배포는 **NO-GO**다.

**P1의 독립 코드 작성·로컬 테스트: 조건부 GO.** 기존 `ai-blog` 실행·빌드 경로를 사용하지 않는 별도 TOOLS 프로젝트에서 정적 앱과 fixture 테스트를 작성할 수 있다. 지금은 프로젝트를 만들거나 실행하지 않았다. 기존 운영 서비스와 연결하거나 외부 호스트에 공개하는 단계는 아래 P0 차단 항목이 끝난 뒤 별도 승인으로 진행한다.

## 1. P0 상태표

판정 기준: `PASS` = 명시된 관측이 실제로 성공, `FAIL` = 요구 조건이 현재 충족되지 않음, `NOT VERIFIED` = 근거·권한·실험 부족. 상태가 여러 갈래인 항목은 별도 행으로 분리했다.

| 항목·기준 | 상태 | 실제 근거와 범위 | 남은 조치 |
| --- | --- | --- | --- |
| NODELOG 공개 홈·핵심 발견 경로 응답 | **PASS** | `www.thivelab.com/`, `/robots.txt`, `/sitemap.xml`, `/rss` 모두 GET 200; 임의 없는 경로 404. PM2 `thivelab-web` online, 3103 localhost 수신 | 검색·구독·댓글의 기능별 실제 제출은 이번 표본에 없음 |
| CIPHER 공개 홈·프로세스 | **PASS** | `game.thivelab.com/` 200, Docker frontend up, backend·sandbox healthy; 호스트 `127.0.0.1:3100` 수신 | 로그인·게임 완료·DB 복구 등 내부 기능은 별도 E2E 필요 |
| MOA 공개 홈·프로세스 | **PASS** | `moa.thivelab.com/` 200, PM2 `moa` online, `127.0.0.1:5173` 수신 | 로그인·저장 등 내부 기능과 백업 복원은 별도 검증 필요 |
| 운영과 DEV 소스·빌드 격리 | **FAIL** | PM2 `thivelab-web`과 `thivelab-dev` 모두 `/Users/mainthive/project/ai-blog`를 cwd로 사용. DEV는 `0.0.0.0:3104`; `.next/dev`와 `.next/server`가 같은 저장소 아래에 있음. 별도 운영 checkout·빌드 산출물 없음 | 독립 checkout/릴리스 디렉터리에서 빌드해 운영 경로를 고정하고, DEV를 별도 작업 경로로 분리. 기존 소스 변경이 운영 빌드에 닿지 않게 검증 |
| NODELOG DB 일일 백업 생성·아카이브 읽기 | **PASS** | launchd `com.newgen.nodelog-backup` 등록, 마지막 실행 코드 0; `backup.log` 10월 9일 04:17 성공, `nodelog-20261009-0417.dump` 5.4MiB. `pg_restore --list`에서 public TABLE DATA 6개 확인 | 이것은 덤프의 목록 검사이며 복원 성공·데이터 무결성 증거가 아님 |
| 최신 NODELOG DB 덤프의 **격리 복원** | **NOT VERIFIED** | 2026-09-29 마이그레이션 복원 기록은 `~/project/nodelog-db/README.md`에 있으나 10월 9일 덤프를 별도 DB로 복원한 기록은 없음. 이번 점검에서 DB를 쓰지 않음 | 별도 컨테이너/볼륨에 최신 덤프 복원, 핵심 테이블 행 수·스키마·권한·읽기 시험, 시간·절차·폐기 기록 |
| NODELOG DB 외부 백업 | **FAIL** | 백업 launchd plist의 `OFFSITE_DEST`가 빈 값. 덤프는 같은 Mac의 `~/project/nodelog-db/backups`에 있음 | 암호화·접근 제어된 외부 사본, 실패 경보, 정기 복원 리허설 마련 |
| CIPHER·MOA 데이터 백업·격리 복원 | **NOT VERIFIED** | 별도 DB/SQLite 사용은 프로세스·설정에서 확인했으나 이번 작업에서 각 서비스의 최신 백업·복원 결과를 검증하지 않음 | 각 서비스 운영 절차와 최신 백업을 별도로 감사 |
| Cloudflare Tunnel 프로세스·`www` 공개 경로 | **PASS** | PM2 `thivelab-tunnel` online, 토큰 **파일** 방식으로 실행; `www` 공개 응답 200. `ecosystem.config.cjs`는 원격 관리 Tunnel이라고 명시 | 이는 프로세스·공개 응답 확인이며 대시보드의 라우트 구성 확인은 아님 |
| Cloudflare 원격 hostname→origin, WAF·Access·캐시 설정 | **NOT VERIFIED** | 계정 대시보드/설정 내보내기 접근 근거 없음. `www` DNS·공개 응답만으로 실제 service URL과 정책을 확정할 수 없음. `tools.thivelab.com` DNS 조회 결과 없음 | 기존 호스트별 라우트·Access·WAF·Cache Rules를 내보내고 신규 `tools` 경로와 충돌 여부 확인 |
| Caddy 실행과 MOA·CIPHER·DB 설정 경로 | **PASS** | `com.newgen.caddy` launchd는 running이고 plist가 `~/project/NEWGEN/Caddyfile`을 가리킴. 해당 파일에 MOA→5173, game→3100, DB `/rest/v1/*`→3300. MOA·game 공개 홈 200, 두 호스트의 CNAME은 `thive.iptime.org` | 실행 중 구성의 세부 핸들러·DB 외부 권한 정책은 추가 대조 필요 |
| 기존 표본 URL·canonical·redirect | **PASS** | `docs/seo/baseline-pages.json`의 9개 URL 모두 현재 200; canonical은 HTML entity를 해석하면 9/9 기준선과 동일. 9개 표본 모두 ko/en alternate 태그 존재. apex HTTP/HTTPS→`www` 301, `/ko`→기본 URL 308, `/blog`→`/` 308, 없는 URL 404 | 태그 존재 확인은 대상 URL 전체의 상호 관계·색인 상태 검증이 아님 |
| 기존 sitemap 변화의 설명 가능성 | **PASS** | 저장된 560 URL과 현재 540 URL을 URL 디코딩 후 비교: 누락 20, 추가 0. 누락 18개는 308 후 최종 200, 2개는 200+`noindex, follow`. 관련 코드 `src/lib/postRedirects.ts`, `src/lib/noindexPosts.ts` 존재 | 콘텐츠 정리 이력과 최신 기준선 변경 사유를 함께 보관. 모든 글·hreflang 검사는 별도 |
| 최신 SEO 기준선 스냅샷·GSC 확인 | **NOT VERIFIED** | 페이지 표본 기준선은 9월 26일, sitemap 저장본은 560개인 과거 상태. 현재 GSC 보고서·사이트 전체 링크/alternate 검증 없음 | 540개 현재 sitemap, 주요 경로/메타/alternate/상태를 새 기준선으로 저장하고 변경 승인 이력 연결. GSC 확인 |
| 스토리지 여유 관측 | **PASS** | `/System/Volumes/Data` 460GiB 중 368GiB 사용, **50GiB 가용·88% 사용**. `.next` 2.7GiB, `node_modules` 684MiB, PM2 로그 729MiB | 충분한 여유라는 판정이 아님. TOOLS 정적 앱 빌드·로그 예상량과 추이 측정 필요 |
| 로그 크기·오류 원인 관리 | **FAIL** | `pm2-logrotate` online(50MiB/파일, 보관 14, 압축 설정). PM2 로그 총 729MiB이며 `blog-approval-error` 과거 회전 파일이 다수 50MiB. 원인은 이번 읽기 전용 점검에서 확정하지 않음 | 개인 정보 노출에 주의하며 오류 원인 조사, 보관·디스크 경보와 운영 영향 평가. 무단 로그 삭제 금지 |
| PM2·DB 백업 launchd 등록 | **PASS** | `launchctl print gui/501/com.PM2`: RunAtLoad 작업 1회, 마지막 코드 0. DB 백업 작업 11회, 마지막 코드 0. Caddy 작업 running | 등록·과거 실행 확인 범위만 해당 |
| 실제 재부팅 후 전체 자동 복구 | **NOT VERIFIED** | Mac 재부팅·로그인, Docker·PM2·Tunnel·Caddy 동시 복구 리허설 수행하지 않음 | 유지보수 창에 재시작 리허설과 수동 복구 순서 기록 |
| 버전별 운영 배포·즉시 롤백 리허설 | **FAIL** | 현재 `docs/SELF_HOST_CLOUDFLARE.md`는 같은 저장소에서 `npm ci`·`npm run build` 후 PM2 재시작을 안내. 버전별 고정 산출물·원자적 전환과 실제 롤백 시험 근거 없음 | 기존 운영 빌드를 별도 checkout에서 만들고 건강 검증 후 포트/경로 전환, 이전 버전 복귀 시험. TOOLS는 처음부터 별도 릴리스 구조 |

### 판정 해석

- 위 서비스 `PASS`는 **홈 응답과 프로세스 상태**다. CIPHER 게임 진행, MOA 로그인, NODELOG 작성·댓글·메일, 광고·분석 계정 상태의 완전한 검증으로 확대하지 않는다.
- sitemap의 20개 감소는 현재 표본에서 URL 유실로 판정되지 않는다. 18개 308→200과 2개 `noindex`가 확인됐다. 다만 9월 기준선이 낡았으므로 새 스냅샷과 변경 이유를 남겨야 한다.
- `.next/dev` 폴더가 따로 있어도 **소스 checkout과 운영 빌드 파이프라인 분리는 되지 않았다.** `next build` 실행은 이번 범위에서 피했다.

## 2. TOOLS 공통 구현 계약(설계)

- 별도 정적 멀티 페이지 앱. 6개 경로의 HTML에 각각 작업 설명·지원 형식·한계·자기 canonical을 넣는다. 없는 경로는 실제 404. 기존 NODELOG DB·키·라우트·빌드를 사용하지 않는다.
- 파일 선택 후 브라우저 메모리에서만 디코드/변환한다. 사용자 파일·텍스트·파일명·미리보기·결과를 서버, 분석, URL, 오류 수집 서비스에 보내거나 영구 저장하지 않는다. 서버는 정적 파일만 제공한다. 브라우저는 메모리 또는 임시 저장을 자체적으로 사용할 수 있으므로 “기기 내에서만 처리”처럼 정확히 고지한다.
- **한도 후보(아직 보장값 아님):** 파일당 25MiB, 작업 합계 100MiB, 20개, PDF 합계 200페이지, 텍스트 2MiB. 압축된 파일 크기만으로 메모리를 예측할 수 없으므로 이미지 디코드 픽셀 수와 PDF 페이지·내장 이미지 규모도 제한한다. 16MP 이미지 하나의 RGBA 버퍼는 약 64MiB이며 디코드·Canvas·출력이 겹치면 더 커진다. 저사양 모바일 시험으로 도구별 더 낮은 제한과 오류 문구를 정한다.
- 공통 화면: 목적과 개인정보 안내 → 선택/붙여넣기 → 옵션 → 실행/미리보기 → 결과 검증·다운로드/복사. 단계별 로딩·오류·취소를 표시하고 원본은 덮어쓰지 않는다. Web Worker 사용은 실제 성능 시험 후 결정한다. 파일 목록·결과 Blob/Object URL·ImageBitmap은 새 작업과 unmount 때 정리한다.
- 오류 코드는 `unsupported_format`, `invalid_file`, `encrypted_pdf`, `too_large`, `too_many_pages`, `memory_limit`, `conversion_failed`, `cancelled` 같은 고정 범주만 사용한다. 원본 파서 오류나 파일 경로를 화면·분석에 그대로 보내지 않는다. 다운로드 파일명은 로컬에서 안전하게 생성한다.
- 접근성: 입력·버튼 레이블, 키보드로 파일 추가/순서 변경/제거, 보이는 초점, 상태 메시지 `aria-live`, 오류와 필드 연결, 드래그 없이 대체 조작, 작은 화면에서 가로 넘침 없는 옵션·미리보기. 실제 모바일 Safari/Chrome과 데스크톱 Chromium/Firefox/WebKit 계열에서 확인한다.
- 개인정보 비전송 시험: 브라우저 네트워크 요청을 캡처하여 선택 전후·작업·다운로드 중 외부 요청의 URL·method·body를 대조한다. 파일 바이트·파일명·텍스트 샘플이 요청·로그·이벤트에 없는지 sentinel fixture로 확인한다. 테스트용 분석은 이벤트 종류만 보내고 본문은 보내지 않는다. 써드파티 라이브러리의 네트워크 호출도 차단·검사한다.

## 3. 여섯 도구 상세 설계·시험

공통 후보: 이미지 디코드의 브라우저 `createImageBitmap`/`Image`, 크기 조절·출력의 Canvas `toBlob`, PDF 생성·페이지 복사의 `pdf-lib`, 글자 단위의 `Intl.Segmenter`. **채택 확정이 아니다.** 브라우저 호환성, 번들 크기, 라이선스·유지보수·파일 손실을 P1 spike에서 비교한다. Canvas 출력은 요청한 MIME을 지원하지 않으면 PNG로 대체될 수 있으므로 실제 Blob `type`을 검사한다([MDN Canvas.toBlob](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob)); `pdf-lib`는 이미지 임베드·페이지 복사 API를 제공한다([공식 API](https://pdf-lib.js.org/docs/api/classes/pdfdocument)); `Intl.Segmenter`는 글자 집합 분리 후보이나 오래된 브라우저의 지원은 시험한다([MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter)).

### 3.1 이미지 크기·용량 조절 — `/image/resize`

- **과업·UI:** 원본 선택 → 가로/세로 픽셀, 비율 고정, 출력 형식·품질 → 전후 크기·픽셀 표시 → 사본 다운로드. 용량 목표를 정확히 맞춘다고 약속하지 않고 예상 결과를 실제 인코딩 뒤 표시한다.
- **입출력:** 입력 JPEG/PNG/WebP 중 실제 디코드 성공 형식, 출력 PNG/JPEG/WebP 중 실제 인코딩 지원 형식. GIF 애니메이션·SVG·HEIC는 기본 지원 밖. EXIF·ICC·방향·투명도는 보존 여부를 시험·고지한다.
- **후보·한도:** `createImageBitmap` 또는 `Image` + Canvas `toBlob`; 25MiB/파일 외에 디코드 픽셀 한도 필요. 모바일에는 별도 낮은 한도 후보. 브라우저가 디코드 전에 폭·높이를 파악할 수 없는 파일의 메모리 위험도 확인.
- **오류·취소·다운로드:** 0/음수/과대 치수, 미지원 출력, 메모리 부족, 디코드 실패를 구분. 실행 중 취소는 다음 단계 중지와 결과 폐기까지 보장하는 방식으로 설계; 이미 실행 중인 동기 인코딩 즉시 중단을 약속하지 않음. 원본 이름에서 안전한 새 확장자 사용.
- **테스트:** 단위: 비율·치수 경계·형식 fallback 판정. 브라우저 E2E: 1×1, 투명 PNG, 회전 EXIF, 큰 JPEG, 손상 파일, 변환 결과 실제 픽셀·Blob MIME·다운로드. 키보드·터치와 네트워크 비전송 공통 시험.

### 3.2 이미지 형식 변환 — `/image/convert`

- **과업·UI:** 입력 이미지 미리보기 → 지원 가능한 출력 형식 선택 → 투명 영역의 JPEG 배경색 선택 → 결과 형식·크기 확인 → 다운로드.
- **입출력:** JPEG/PNG/WebP 입력·출력 후보. 브라우저 디코더·인코더가 실제 지원한 조합만 공개. 애니메이션은 첫 프레임만 될 수 있으므로 MVP 지원에서 제외하거나 명확히 차단. SVG/HEIC는 지원을 주장하지 않음.
- **후보·한도:** Canvas `toBlob`; 이미지 디코드 결과와 출력 `Blob.type` 비교. 픽셀·파일 크기 한도는 resize와 공유하되 형식 변환의 메모리 비용을 따로 측정.
- **오류·취소·다운로드:** 같은 형식 재출력 여부, JPEG 투명도 소실, 출력 MIME fallback, 변환 실패 안내. 결과가 선택 형식이 아니면 성공으로 처리하지 않음.
- **테스트:** 단위: 입력/출력 허용표, 확장자·MIME 매핑, 알파 배경. E2E: PNG→JPEG, JPEG→WebP, 투명/불투명, 미지원 브라우저 경로, 손상 이미지, 실제 결과 헤더·다운로드 이름, 접근성·비전송.

### 3.3 PDF 합치기 — `/pdf/merge`

- **과업·UI:** PDF 여러 개 선택 → 파일별 페이지 수·순서 표시 → 버튼/키보드로 순서 변경 → 합치기 → 총 페이지 수와 결과 크기 확인·다운로드.
- **입출력:** 입력·출력 `application/pdf`만. 암호·권한 제한·손상 PDF는 지원하지 않는 상태로 시작하며 파일을 외부로 보내 복구하지 않음.
- **후보·한도:** `pdf-lib`의 `PDFDocument.load`, `copyPages`, `save`. 25MiB/파일·100MiB 합계·20개·200페이지는 시험용 상한이며 복잡한 PDF가 메모리를 더 쓸 수 있어 실제 한도를 낮출 수 있음. 전체 문서를 동시에 메모리에 올리는 비용을 측정.
- **오류·취소·다운로드:** 하나의 파일만 선택, 암호화, 손상, 복사 실패, 최대 페이지 초과 시 상태를 표시. 취소·새 작업은 생성 중인 참조와 임시 결과를 버림. 결과가 `%PDF-`로 시작하고 다시 열리는지 검사.
- **테스트:** 단위: 순서·페이지 인덱스·한도 계산. E2E: 두 PDF의 페이지 표식 순서, 대량/암호/손상 입력, 결과 재열기·페이지 수, 다운로드·모바일 파일 선택·키보드 재정렬·비전송.

### 3.4 PDF 페이지 추출 — `/pdf/extract`

- **과업·UI:** PDF 선택 → 전체 페이지 수 표시 → `1,3-5` 같은 범위 입력과 선택 미리보기 → 새 PDF 다운로드. 드래그 전용 페이지 선택은 금지.
- **입출력:** PDF→PDF. 숫자 범위는 1부터 시작한다고 명시. 중복 페이지를 보존할지 제거할지 구현 전에 정하고 화면에 표시.
- **후보·한도:** `pdf-lib` 페이지 복사. 파일당 25MiB·200페이지 후보를 재검증. 썸네일 렌더러는 추가 JS·메모리 비용이 있으므로 MVP 필수 아님; 페이지 번호 중심 UI가 우선.
- **오류·취소·다운로드:** 빈 범위, 0, 범위 역전, 없는 페이지, 암호·손상 파일을 구분. 실패 시 이전 결과 다운로드가 남지 않게 정리.
- **테스트:** 단위: 범위 파서의 공백·중복·역순·경계값. E2E: 선택 페이지의 표식·순서, 결과 재열기, 실패 후 재시도, 키보드 범위 입력, 비전송.

### 3.5 이미지→PDF — `/pdf/from-images`

- **과업·UI:** 이미지 여러 장 선택 → 순서 변경 → 페이지 크기(A4/이미지 맞춤 등 검증된 옵션), 방향·여백·비율 유지 → PDF 생성·다운로드. 사진이 잘리지 않도록 미리보기 또는 적합한 배치 설명 제공.
- **입출력:** JPEG/PNG 입력 우선, WebP는 Canvas로 JPEG/PNG로 변환 가능할 때만 지원; PDF 출력. 애니메이션·SVG·HEIC는 MVP 밖. 색상·메타데이터 변경 가능성 명시.
- **후보·한도:** 이미지 디코드/Canvas + `pdf-lib`의 `embedJpg`·`embedPng`. 이미지 원본·RGBA·PDF 내장 사본이 겹치므로 PDF 도구 공통 상한보다 낮은 이미지 수·픽셀 상한 후보를 모바일 시험으로 결정. PDF 파일 크기와 페이지 수를 결과에서 표시.
- **오류·취소·다운로드:** 파일별 디코드 실패 위치, 지원하지 않는 형식, 과대 이미지, 생성 실패를 표시. 일부만 성공한 PDF를 정상 완료로 내지 않음. 순서·방향 선택은 키보드로 조작 가능.
- **테스트:** 단위: 비율 유지·A4 좌표/여백·회전·페이지 크기 계산. E2E: 가로/세로 혼합, 여러 장 순서, 투명 PNG, 큰 사진, 손상 이미지, 결과 PDF 페이지 수·배치·열기, 다운로드·모바일·비전송.

### 3.6 글자 수 세기 — `/text/count`

- **과업·UI:** 입력/붙여넣기 → 공백 포함/제외 글자 수, 단어 수, 줄 수 즉시 표시. 복사 버튼은 **결과 수치**만 복사하는지, 원문 복사인지 분명히 레이블링. 원문 자동 저장·공유 URL 없음.
- **입출력:** 입력은 화면에 붙여넣거나 타이핑한 Unicode 텍스트. 파일 업로드·다운로드 없음. 결과는 화면 숫자와 선택적 수치 복사. `.txt` 읽기는 이용자 수요 확인 뒤 별도 결정.
- **후보·한도:** `Intl.Segmenter` grapheme/word 후보. 공백 포함/제외 기준(Unicode 공백과 개행 포함 여부), 줄 수(빈 줄 포함), 단어 기준을 화면 도움말과 fixture에 고정. 오래된 브라우저는 기준이 다른 조용한 fallback보다 명시적 지원 안내 또는 검증된 대체 구현 선택. 입력 길이 2MiB 후보, 긴 입력은 갱신 빈도 제한·메인 스레드 응답성 시험.
- **오류·취소·다운로드:** 너무 긴 붙여넣기와 클립보드 권한 거부 안내. `지우기`는 브라우저 상태만 비우며 서버 삭제를 주장하지 않음. 완료 이벤트를 매 키 입력마다 보내지 않음.
- **테스트:** 단위: 빈 문자열, 공백·탭·개행, 한글 자모·완성형, 이모지 ZWJ, 조합 악센트, 2MiB 경계. E2E: 붙여넣기·입력·지우기·수치 복사, 모바일 키보드, 화면 낭독·상태 알림, 입력 sentinel 비전송.

## 4. 공통 자동화와 브라우저 E2E 게이트

1. 순수 함수 단위 테스트: 치수·범위·페이지 배치·문자 분리·한도·오류 코드. fixture는 사용권이 명확한 자체 제작 작은 이미지/PDF/텍스트와 손상·암호 파일을 사용한다. 테스트 로그에 입력 본문을 기록하지 않는다.
2. 브라우저 E2E: Chromium·Firefox·WebKit에서 파일 선택, 순서 변경, 실행, 결과 다운로드, 실패·재시도, 키보드·모바일 viewport. Playwright의 파일 입력·다운로드 기능을 후보로 검토한다([공식 입력](https://playwright.dev/docs/next/input), [공식 다운로드](https://playwright.dev/docs/next/downloads)). 실제 iOS/Android 장치 시험은 자동화와 별도다.
3. 비전송 증거: 작업 전후 모든 요청을 관찰해 입력·파일명 sentinel이 요청 URL/body, 오류 수집, 분석 payload에 없는지 확인. 페이지 초기 정적 자산 요청은 허용하되 외부 CDN 런타임 라이브러리·업로드 endpoint는 MVP에서 금지한다.
4. 정적 SEO·운영: 도구 페이지 첫 HTML의 고유 제목·설명·canonical·실제 내용, 존재하지 않는 URL의 404, `robots.txt`·sitemap의 유효 URL. 기존 `www`, CIPHER, MOA 주요 URL·canonical·redirect·sitemap 기준선은 도구 앱 배포 전후 비교한다.
5. 성능·메모리: 저사양 모바일에서 한도 근처 파일·복잡한 PDF를 측정해 최대 메모리·작업 시간·UI 응답성을 기록한다. 시간·용량의 합격값은 이 실험으로 정하며 문서의 후보 수치를 성능 보장으로 쓰지 않는다.

## 5. B2C 검증 계획

### 검색 의도와 경쟁 서비스 조사

- 각 도구마다 “어떤 작업을 끝내려는가”에 해당하는 검색어 묶음 3~5개를 **조사 후보**로 만들고 한국어·모바일 검색 결과, Search Console 노출/클릭, 자동완성·관련 검색을 확인한다. 검색량·난이도·예상 수익은 자료 없이 쓰지 않는다.
- 같은 과업의 제품을 실제로 사용해 ①로그인 전 과업 완료 가능 여부, ②파일이 서버로 전송되는지 공개 고지와 네트워크 동작, ③형식·크기 제한, ④모바일 단계 수, ⑤광고·유료 진입, ⑥결과 품질·오류 안내를 기록한다. 조사 시점·제품 URL·무료/유료 조건을 함께 적고 경쟁사 내부 처리 방식은 공개 자료만으로 단정하지 않는다. 시작 표본 후보: [Adobe Acrobat 온라인 PDF 합치기](https://www.adobe.com/acrobat/online/merge-pdf.html), [WordCounter](https://wordcounter.net/); 이미지 도구는 조사 시작 시 실제 상위 노출 제품을 선정한다.
- 차별성 가설은 **로컬 처리의 명확한 고지, 작은 화면에서 완료 가능한 단순 흐름, 결과 확인과 실패 이유의 정확성**이다. 경쟁 서비스보다 우월하다고 미리 주장하지 않고 동일 fixture·기기에서 비교한다. 같은 뜻의 키워드별 자동 페이지는 만들지 않는다.

### 최소 분석 이벤트와 해석

| 이벤트 | 속성 허용 범위 | 금지/주의 |
| --- | --- | --- |
| `tool_open` | 도구 코드, 공개 페이지 경로, 기기 범주 | 전체 쿼리, referrer의 민감 쿼리 수집 금지 |
| `job_start` | 도구 코드, 입력 개수 범주, 형식 범주 | 파일명·바이트·원문·해시 금지 |
| `job_success` / `job_error` / `job_cancel` | 도구 코드, 고정 오류 코드, 처리 시간 구간 | 파서 원문 오류·PDF 텍스트 금지 |
| `download_click` / `related_tool_click` | 도구 코드, 다음 공개 도구 코드 | 파일명·결과 내용 금지 |

이벤트 제공자와 사용 여부는 개인정보 고지·동의·실제 비용을 확인한 뒤 결정한다. MVP에서 새 DB나 유료 분석 서비스를 전제하지 않는다. 방문자 수는 사람의 정확한 수와 다를 수 있다. 재방문 식별은 쿠키/기기 식별·동의 설계가 준비되지 않으면 **NOT MEASURABLE**로 표시하고 임의로 추산하지 않는다.

- 작업 시작률 = `job_start`가 있는 도구 방문 세션 / 유효 도구 페이지 세션. 완료율 = `job_success` / `job_start`; 다운로드율 = `download_click` / `job_success`. 글자 수 도구의 시작은 첫 유효 입력, 성공은 첫 계산 표시로 정의하되 키 입력마다 중복 발송하지 않는다.
- 공개 후 각 도구별 일·주 단위로 검색 유입, 시작, 완료, 고정 오류 코드, 다운로드를 본다. 채널·기기별 표본 크기와 계절·외부 유입 변화를 함께 기록한다. 재방문율은 위 식별 조건을 충족할 때만 같은 기간·정의로 계산한다. 표본이 적으면 추세나 인과를 단정하지 않는다.
- 관련 도구 이동률 = 한 도구 성공 뒤 다른 도구 링크를 선택한 세션 / 성공 세션. NODELOG와 TOOLS 간 이동은 공개 경로 클릭으로 측정하되 두 호스트의 방문자를 동의 없이 묶어 개인별 추적하지 않는다.

### 광고·유료화 전 게이트

- 광고: 실제 공개·유용한 페이지 내용, 사용 흐름과 버튼 간 거리, 오류/빈/완료 화면 제외, 개인정보 방침, 지역별 동의, 계정 사이트·코드 적용 범위, 페이지 성능·완료율 영향을 확인한다. MVP에는 광고 코드·자리표시자를 넣지 않는다. Google은 콘텐츠 없는 화면의 광고를 제한한다([공식 정책](https://support.google.com/publisherpolicies/answer/11112688?hl=en)).
- 유료 일괄 처리: 반복 과업자 인터뷰와 동일 작업의 빈도·시간 절약·지불 의사를 검증한다. 브라우저가 감당하는 범위 안의 고급 일괄 옵션인지, 서버가 필요한지 구분하고 원가·지원 부담을 측정한다. 무료 핵심 기능을 축소하지 않는다.
- AI 보조: 한정된 작업에 대해 정확도·명시적 동의·요청당 비용·오용 위험을 평가한 뒤 별도 AI Cost Gateway를 설계한다. 지금은 AI API, 결제, 회원가입, 관련 DB를 만들지 않는다.

## 6. 변경 경계

| 지금 허용되는 신규 작업(후속 P1 승인 범위 안) | 지금 변경 금지인 기존 운영 자산 |
| --- | --- |
| 별도 `~/project/thivelab-tools/` 저장소의 `app/` 정적 페이지, `src/shared/`, `src/tools/{image,pdf,text}/`, `tests/`, 문서와 테스트 fixture. 개발 서버·빌드 출력도 TOOLS 프로젝트 내부에서만 사용 | `ai-blog/src/app/`, `src/components/`, `src/lib/`, `src/proxy.ts`, `next.config.ts`, `ecosystem.config.cjs`, `.next/`, 기존 SEO·redirect 파일과 공개 URL |
| 분리된 임시 로컬 테스트 주소와 전용 포트(사용 전 점유 확인), 로컬 자동화 fixture·네트워크 검사 | NODELOG·CIPHER·MOA 운영 코드/프로세스/포트, 콘텐츠 DB·Docker 볼륨·마이그레이션, MOA SQLite, CIPHER DB |
| 설계·점검 문서인 `docs/THIVELAB_2.0_P0_READINESS.md` | `.env.local`, `.secrets`, `~/project/NEWGEN/Caddyfile`, Cloudflare Tunnel·DNS·WAF·캐시, PM2·launchd 설정, 배포 및 공개 호스트 |

기존 NODELOG 메뉴에 TOOLS를 넣는 작업은 P1의 **별도 후속 변경**이다. 현재의 uncommitted DEV 시안(`src/app/[locale]/page.tsx`, `src/app/globals.css`, `src/components/HeroDepthScene.tsx`)은 이번 점검 전에 있었고 수정하지 않았다. 별도 프로젝트의 생성·실행도 이번 범위에서는 수행하지 않았다. 신규 경로의 파일 작성은 후속 작업의 대상이지 지금 완료된 작업이 아니다.

## 7. 미완료 항목과 권장 순서

1. **즉시 운영 보호:** 운영/DEV checkout·빌드와 배포 산출물 격리. 운영 `npm run build`를 현재 공유 경로에서 하지 않는 절차 확정. 로그 729MiB의 원인·보관량 점검과 디스크 경보 추가.
2. **복구 가능성:** 최신 NODELOG 덤프의 격리 복원과 무결성 확인, 외부 백업 사본 및 주기적 복원 시험. CIPHER·MOA 백업도 각 서비스별 확인.
3. **라우트·SEO 기준:** Cloudflare 계정의 `www` 실제 service URL/Access/WAF/Cache Rules와 Caddy 활성 설정 대조. 540개 sitemap·대표 메타·redirect·hreflang 기준선을 최신화하고 20개 제외 이력과 연결.
4. **TOOLS P1 로컬:** 별도 정적 앱의 공통 화면/비전송 게이트를 먼저 만들고 이미지 조절→형식 변환→글자 수→이미지 PDF→PDF 합치기→추출 순으로 fixture·실기기 결과에 따라 진행. 라이브러리·지원 형식·한도는 spike 후 확정.
5. **공개 전 별도 승인:** 스테이징 분리와 접근 제한, 6개 도구 E2E·사용성·개인정보·SEO 회귀, 포트·호스트·캐시·롤백 계획을 증거와 함께 제시한다. 운영 메뉴 수정과 `tools.thivelab.com` 공개는 이후에만 진행한다.

현재 단계의 권장 결정은 **독립 로컬 TOOLS 개발만 시작**하는 것이다. P0의 `FAIL`/`NOT VERIFIED`가 해결되었다고 해석하거나 공개 배포를 진행해서는 안 된다.
