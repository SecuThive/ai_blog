# THIVELAB 3D 운영 반영 후보

2026-10-10 기준. 기존 운영 앱은 `/Users/mainthive/project/nodelog-releases/20261010-tools-entry`에서 `127.0.0.1:3103`으로 실행됐다. 새 릴리스로 PM2 앱을 전환했으며 Caddy·Cloudflare·DB 설정은 변경하지 않았다.

## URL 결정

기존 요청에 맞춘 권장안은 `/`를 NODELOG 홈으로 유지하고 `/thivelab`을 별도 THIVELAB 브랜드 홈으로 공개하는 것이다. 이 경우 기존 글 URL·NODELOG 색인 구조를 옮길 필요가 없다. `/` 자체를 3D 홈으로 바꾸는 안은 라우팅·canonical·내부 링크·사이트맵과 NODELOG의 새 대표 URL을 별도로 설계해야 하므로 같은 배포로 간주하지 않는다.

## 격리 후보

- 운영 릴리스의 소스를 `/private/tmp/thivelab-main-candidate`에 복사하고, DEV에서 확인한 `src/app/thivelab/` 및 필요한 변경만 선별 반영했다.
- 포함: `src/components/Header.tsx`의 데스크톱·모바일 THIVELAB 진입 링크, `src/proxy.ts`의 `/thivelab` 통과, `src/app/sitemap.ts`의 한국어 단일 브랜드 URL, Three.js 의존성. 기존 `/` 구현·콘텐츠·DB 코드는 운영 릴리스 그대로다.
- 생산 빌드의 `/thivelab`은 자기 canonical과 `index, follow`를 사용한다. 개발 서버의 같은 경로는 `noindex, nofollow`를 유지한다. 영어 번역이 없으므로 `/en/thivelab` hreflang은 만들지 않는다. 브랜드 홈에는 광고·분석 코드를 추가하지 않았다.
- 후보 빌드에서 Turbopack의 `next/font/google` 내부 모듈 해석 오류가 발생했다. 공식 Next CLI의 `--webpack` 옵션으로 빌드했으며 컴파일·타입 검사·정적 경로 생성이 통과했다. 이 차이는 배포 전 기록하고, 운영 릴리스에서도 동일 빌드 아티팩트를 사용해야 한다.

## 확인 결과

- 후보를 로컬 `127.0.0.1:3114`에서 실행해 `/` 200, `/thivelab` 200, 없는 URL 404를 확인했다.
- `/thivelab` HTML에 자기 canonical 및 `index, follow`, 사이트맵에 브랜드 URL 1개를 확인했다. HTML에서 광고 요청 스크립트는 발견되지 않았다.
- Chromium 1440×900, 390×844에서 3D 장면·서비스 링크·섹션 탐색·가로 넘침을 검사했다. NODELOG의 데스크톱 상단 링크와 모바일 메뉴에서 `/thivelab` 이동 및 WebGL 초기화를 확인했다. 자바스크립트 페이지 오류는 없었다.
- 실제 iOS Safari·Android Chrome과 저사양 GPU의 프레임률·발열은 아직 확인하지 못했다.

## 운영 전환과 롤백

1. URL 범위를 확정한다. 위 권장안이 확정되면 후보를 새 릴리스 경로에 복사하고 동일 아티팩트로 `3103` 전환 전 별도 로컬 포트에서 다시 검사한다.
2. 기존 `thivelab-web` 프로세스 설정과 현재 릴리스 경로를 기록한다. 새 릴리스로 PM2 프로세스를 전환한 뒤 대표 호스트의 `/`, `/thivelab`, `/blog`, `/engineer`, `/sitemap.xml`, `/robots.txt`, `/ads.txt`, 404를 확인한다.
3. 3D 렌더링·기존 URL·로그에 문제가 있으면 `thivelab-web`을 기존 `20261010-tools-entry` 릴리스의 `3103`으로 즉시 되돌린다. 기존 릴리스와 DB는 변경하지 않는다.

## 실행 결과

- 후보를 `/Users/mainthive/project/nodelog-releases/20261010-thivelab-3d`에 별도 릴리스로 복사했다. 실제 릴리스 경로의 `3114` 스테이징 검사에서 `/`와 `/thivelab`이 200이었다.
- 롤백 스크립트로 `thivelab-web`을 새 릴리스의 `3103`으로 전환했다. 로컬 상태 확인을 통과해 PM2 목록을 저장했다. 기존 릴리스는 그대로 보존했다.
- 공개 `https://www.thivelab.com/thivelab` 200, 비대표 호스트의 대표 호스트 이동, `/` 200, `/engineer` 200, 없는 브랜드 하위 URL 404, 사이트맵·robots.txt·ads.txt 200을 확인했다. 공개 HTML의 canonical, 색인 메타 태그와 NODELOG 상단 링크를 확인했다.
- 공개 주소의 Chromium 데스크톱·모바일 WebGL, 다섯 장면, 서비스 링크 및 가로 넘침 검사가 통과했다. 스테이징 `3114` 프로세스는 검증 후 종료했다.
- 물리적 모바일 기기 및 저사양 GPU의 프레임률·발열은 아직 검증하지 않았다.
