# THIVELAB 자체 호스팅과 Cloudflare Tunnel

Cloudflare Tunnel은 Next.js 서버를 대신 실행하지 않는다. 이 컴퓨터에서 `next start`가
`127.0.0.1:3103`으로 실행되고, 터널은 공개 요청을 그 포트로 전달한다.

## 현재 구성

- `ecosystem.config.cjs`: PM2가 `thivelab-web`을 실행한다. 터널 토큰 파일이 있으면
  `thivelab-tunnel`도 실행한다. 토큰은 PM2 명령 인수나 Git에 넣지 않는다.
- `.env.local`: PostgREST, Resend, 검색 인증, IndexNow 예약 작업 등 서버 변수.
  파일 권한은 `600`으로 유지한다. `NEXT_PUBLIC_` 값은 빌드 시 번들에 포함된다.
- `thivelab-indexnow-scheduler` PM2 앱은 기존 Vercel Cron의 `0 9 * * *` UTC
  작업을 서버의 한국 시간 `18:00`에 실행한다. `run-indexnow.mjs`가
  `CRON_SECRET`을 헤더로 전송한다. macOS `crontab` 변경 권한이 없어 PM2로 관리한다.
- GA4는 유지한다. Vercel Analytics는 자체 호스팅에서 제거했다. Cloudflare Web
  Analytics는 사이트 토큰과 실제 운영 설정을 확인한 후 별도로 연결할 수 있다.

## 전환 전 확인

1. `npm ci`, `npm run build`, `npm run lint`, 관련 테스트를 실행한다.
2. `pm2 start ecosystem.config.cjs --only thivelab-web`으로 웹 서버를 시작한다.
   `curl -I http://127.0.0.1:3103/`이 200, 없는 글이 404인지 확인한다.
3. `.env.local`의 `SUPABASE_*`, `RESEND_API_KEY`, `BLOG_API_KEY`,
   `CRON_SECRET`, `INDEXNOW_SECRET`, 광고 설정을 운영 값과 대조한다.
   `UNSUBSCRIBE_TOKEN_SECRET`은 기존에 발송한 해지 링크를 유지하려면 Vercel에서
   사용한 **같은 값**이 필요하다. 모르면 구형 링크의 버튼이 실패하며 안내된
   이메일 처리 경로를 사용해야 한다. 임의 값으로 동일하다고 주장하지 않는다.
4. Cloudflare 계정의 `thivelab.com` Zone에서 원격 관리 Tunnel을 생성하거나
   기존 Tunnel에 경로를 추가한다. 공개 호스트 `www.thivelab.com`의 서비스 URL은
   `http://127.0.0.1:3103`으로 지정한다. 공개 콘텐츠에 Access 로그인 정책을
   적용하면 사용자와 크롤러가 읽지 못하므로 적용하지 않는다.
5. Cloudflare 대시보드가 발급한 **터널 토큰만** `.secrets/cloudflare-tunnel-token`에
   저장하고 파일 권한을 `600`으로 설정한다. 토큰을 문서, Git, PM2 인수, 채팅에
   노출하지 않는다. `pm2 start ecosystem.config.cjs --only thivelab-tunnel`로 시작한다.
6. 연결이 Healthy인 것을 확인한 뒤 `www`의 기존 Vercel DNS 레코드를 Tunnel
   경로로 바꾼다. apex `thivelab.com`은 HTTP와 HTTPS 모두
   `https://www.thivelab.com`으로 한 번에 301 이동하도록 Cloudflare 규칙을
   설정한다. 기존 `http://thivelab.com` 자기 리디렉션 규칙을 제거한다.
7. `pm2 start ecosystem.config.cjs --only thivelab-indexnow-scheduler`로 기존
   예약 작업을 대체한다. `pm2 save`로 현재 프로세스를 저장한다. 이 컴퓨터의 `com.PM2` LaunchAgent가
   부팅 시 복원되는지 확인한다.

## 공개 검증

`https://www.thivelab.com/`, 글·가이드, 영문 페이지, 구독 해지, 문의,
`/robots.txt`, `/sitemap.xml`, `/ads.txt`, `/rss`의 상태와 본문을 확인한다.
없는 URL은 404여야 한다. HTTP/apex는 대표 HTTPS 주소에 도달해야 한다.
Cloudflare가 HTML이나 RSC 요청을 잘못 캐시하지 않는지 확인하고,
PM2 로그에서 DB 및 메일 오류를 확인한다. 실제 광고 클릭이나 인위적 노출은 하지 않는다.

## 이후 배포

서버에서 원격 `main`을 반영한 뒤 `npm ci`, `npm run build`, `pm2 restart
thivelab-web`, `pm2 save`를 순서대로 실행하고 주요 URL을 다시 확인한다.
단일 인스턴스의 ISR 캐시는 이 컴퓨터의 `.next`에 저장된다. 빌드 중에는 기존
서버의 파일이 바뀔 수 있으므로 운영 중 배포는 유지보수 시간에 진행한다.

## 남은 외부 설정

Tunnel 생성·토큰 발급·DNS와 리디렉션 수정은 Cloudflare Zone 권한이 필요하다.
현재 저장소와 이 컴퓨터에는 그 인증이 없으므로 해당 작업 전까지 공개 도메인은
Vercel의 402 응답을 계속 받을 수 있다. Vercel 사용량·과금 중단 원인은 별개로
계정에서 확인해야 한다.
