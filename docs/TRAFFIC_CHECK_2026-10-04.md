# 2026-10-04 방문자 급증 점검

## 확인한 사실

- 사용자 화면의 Vercel Visitors 250은 계정 데이터에 직접 접근할 수 없어 분포를 검증하지 못했다. Vercel 연결은 아직 활성화되지 않았다.
- Vercel은 선택한 기간의 방문자를 하루 동안 유효한 해시로 구분하고, 알려진 자동 트래픽을 User-Agent로 제외한다. 따라서 250은 해당 조건의 집계값일 수 있으나 사람 250명이라는 증거는 아니다. [Vercel Web Analytics](https://vercel.com/docs/analytics)
- 저장소의 Vercel Analytics 컴포넌트는 한 번만 설치된다. 소스에서 중복 설치로 숫자가 2배가 되는 경로는 발견되지 않았다. 글별 `views`는 별도 누적 카운터이며 Vercel Visitors와 비교할 수 없다.
- Search Console API에서 2026-10-01 검색 클릭 19, 10-02 클릭 6, 10-03 클릭 1, 10-04 클릭 0을 반환했다. 최신 날짜는 미완성 데이터이고 검색 유입만 나타내므로 Vercel 250과 모순이라고 판정할 수 없다.
- `http://thivelab.com/`은 2026-10-04에도 자기 자신으로 301을 반복한다. Cloudflare/원본 설정에서 HTTPS 대표 호스트로 보내는 규칙을 고쳐야 한다.

## 이번 코드 수정

- Vercel Analytics의 `beforeSend`에서 구독 해지 경로의 이벤트를 취소하고 모든 전송 URL의 쿼리·해시를 제거한다. 페이지 전환 뒤 스크립트가 남아 있어도 이메일이 포함된 옛 해지 URL을 전송하지 않게 한다.
- GA4 최초 페이지 설정의 `page_location`에서 쿼리·해시를 제외한다. GA4 계정의 Enhanced Measurement 설정과 소프트 내비게이션은 계정 접근 후 확인해야 한다.
- 타입 검사와 `npm run build` 통과. 코드는 배포하지 않았다.

## 250명 진위 판단에 필요한 계정 자료

Vercel Analytics에서 같은 기간·Production 환경으로 **Hostname, Pages, Referrers, Country, Browser/Device, Page Views**를 본다. `www.thivelab.com` 이외 호스트나 Preview가 섞였는지, 특정 페이지와 출처에 급증이 집중됐는지 확인한다. Vercel이 User-Agent로 자동 트래픽을 제외해도 일반 브라우저로 위장한 자동화는 남을 수 있다. 현재는 이 분포에 접근할 수 없어 정상 유입·자동화 중 어느 쪽인지 결론 내리지 않는다.
