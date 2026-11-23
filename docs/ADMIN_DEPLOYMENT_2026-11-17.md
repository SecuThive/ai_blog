# 관리자 운영 배포 및 DB 장애 복구 · 2026-11-17

## 결과

- 운영 관리자: https://www.thivelab.com/admin/login
- 실제 운영 경로: `/Users/mainthive/project/ai-blog/.deploy/20261117-admin-login`
- PM2 서비스: `thivelab-web`, `127.0.0.1:3103`
- 배포 설정: `.deploy/admin-production.config.cjs`
- 이전 릴리스: `/Users/mainthive/project/nodelog-releases/20261115-monetization`
- 롤백 설정: `.deploy/admin-rollback.config.cjs`

기존 운영 릴리스에서 새 릴리스를 복사하고 관리자 관련 파일, 관리자 프록시 경로, 공개 글 API의 초안 노출 차단만 반영했다. 작업 폴더의 다른 미완료 변경 사항은 배포하지 않았다. node_modules는 프로젝트 루트 의존성을 참조하므로 루트 의존성 삭제·업데이트 전 운영 영향 확인이 필요하다.

관리자 환경변수는 새 릴리스의 `.env.local`에 저장되어 있다. 최초 로그인 정보는 프로젝트 루트 `.secrets/admin-login.txt`에 있고 Git에서 제외되며 파일 권한은 600이다. 운영 계정 변경 시 작업 루트가 아닌 **실제 운영 릴리스의 환경변수**를 수정하고 `pm2 restart thivelab-web --update-env`를 실행한다.

## DB 장애 원인과 복구

Docker 엔진이 시작 불가 상태였고 Docker 및 운영 웹 로그에 `FILE_ERROR_NO_SPACE` / `ENOSPC`가 기록되어 있었다. DB 주소는 502, 로컬 PostgREST 3300 포트는 연결 불가였다.

실행 중이 아닌 20261013, 20261020, 20261022, 20261023 릴리스의 재설치 가능한 node_modules를 정리하여 약 2GB를 확보했다. 소스, 현재/직전 운영 릴리스, DB 볼륨, 백업은 보존했다. 정상 Docker 재시작이 멈춘 backend 때문에 실패하여 해당 프로세스를 종료한 후 Docker Desktop을 시작했다.

`nodelog-db-postgres-1` healthy, `nodelog-db-postgrest-1` running 및 공개 DB HTTP 200을 확인했다. 복구 후 실제 조회: 글 793개, 가이드 143개, 댓글 1개, 문의 4개, 구독자 3개. 복원·초기화·스키마 변경은 하지 않았다.

## 검증

- 운영 빌드: 컴파일·타입 검사·1,440개 페이지 생성 성공.
- 임시 포트와 실제 HTTPS 운영 도메인에서 로그인, Secure/HttpOnly/SameSite 쿠키, 인증된 5개 목록 조회 확인.
- 실제 DB에 검증용 비공개 글/가이드를 생성 → 수정 → 이전 수정 시각 충돌(409) → 삭제. 모든 검증용 항목 삭제 완료.
- 공개 글 API 초안 404, 미인증 관리 API 401, 다른 Origin 변경 요청 403 확인.
- 관리자 응답 `private, no-store`, `noindex, nofollow`, `X-Frame-Options: DENY`, Cloudflare DYNAMIC 확인.

## 재시작 및 롤백

현재 릴리스 재시작: `pm2 restart thivelab-web --update-env`.

릴리스 경로를 교체할 때 기존 PM2 프로세스의 cwd가 남을 수 있으므로, 검증된 새 릴리스를 준비한 다음 해당 웹 프로세스만 교체한다. 롤백 시:

```sh
pm2 delete thivelab-web
pm2 start .deploy/admin-rollback.config.cjs --only thivelab-web
pm2 save
```

정상 새 릴리스 시작에는 `admin-production.config.cjs`를 사용한다. 서비스 교체에는 짧은 중단이 발생한다. 재부팅 복원 설정은 `pm2 save`로 저장한다. DB는 기존 Docker `restart: unless-stopped` 정책을 유지한다.

## 관리자 로그인 정보 변경

사용자 요청에 따라 아이디 로그인(`admin`)을 지원하고 지정된 비밀번호의 scrypt 해시를 설정했다. 세션 서명 키를 교체하여 이전 세션은 무효화했다. 비밀번호 평문은 배포 기록이나 소스에 저장하지 않는다. 새 릴리스에서 로그인·이전 세션 거부·로그아웃을 검증했다.
