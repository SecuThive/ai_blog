# THIVELAB 무료 도메인 메일 설정

확인일: 2026-09-26. 목표 주소: `contact@thivelab.com`, 수신함: `thive8564@gmail.com`.

## 현재 상태

- `thivelab.com` 네임서버는 Cloudflare입니다.
- 루트 도메인에 MX 레코드가 없어 `@thivelab.com` 직접 수신은 아직 동작하지 않습니다.
- Resend 발송용 `resend._domainkey.thivelab.com` DKIM과 `send.thivelab.com` SPF 레코드는 DNS에 있습니다. 이는 발송 인증의 일부를 보여주지만, 현재 Resend 계정에서 도메인이 검증됐다는 증거는 아닙니다.
- 사이트 문의 폼은 `src/app/api/contact/route.ts`에서 Resend로 `thive8564@gmail.com`에 알림을 보냅니다. 직접 보낸 메일의 수신과는 별개입니다.
- 현재 로컬 Resend API 키는 도메인 목록 조회에서 HTTP 403을 반환합니다. Cloudflare 설정 권한도 작업 환경에 없습니다.

## 수신 설정 — Cloudflare

1. Cloudflare 대시보드에서 `thivelab.com`의 **Email Service → Email Routing**을 활성화합니다. 기존 Resend 발송용 DNS 레코드를 삭제하거나 덮어쓰지 않습니다.
2. Destination address로 `thive8564@gmail.com`을 추가합니다.
3. Gmail에 도착하는 확인 메일을 열어 목적지를 인증합니다.
4. Routing rule을 `contact@thivelab.com` → `thive8564@gmail.com`으로 만듭니다.
5. 다른 메일 계정에서 `contact@thivelab.com`에 시험 메일을 보냅니다. Gmail 받은편지함과 스팸함을 확인합니다.
6. `dig MX thivelab.com +short`에 Cloudflare MX가 나타나는지 확인합니다.

## 발송 설정 — Resend

- 현재 사이트의 뉴스레터·문의 알림 발송은 Resend를 그대로 사용합니다.
- Gmail의 ‘다른 주소에서 보내기’에 `contact@thivelab.com`과 Resend SMTP (`smtp.resend.com`, 포트 465, 사용자명 `resend`, 비밀번호 Resend API 키)를 설정할 수 있습니다. 이 키는 메일 설정 화면에만 입력하고 저장소에 넣지 않습니다.
- Gmail의 주소 확인 메일을 수신 규칙으로 받아 인증한 다음, 다른 계정에 시험 발송하고 From, Reply-To, SPF/DKIM/DMARC 결과를 확인합니다.
- Resend 무료 플랜의 발송량은 사이트 자동 메일과 수동 발송을 합산해 관리합니다.

**장기 제한:** Google은 개인 Gmail의 외부 주소 ‘다른 주소에서 보내기’를 2027년 1월 종료한다고 공지했습니다. Cloudflare의 Gmail 전달은 계속되지만, 그 뒤 수동 발송은 별도 메일 프로그램의 SMTP 또는 도메인 메일 서비스가 필요합니다.

## 사이트 공개 주소 전환 조건

수신 시험과 발송 시험이 모두 통과하기 전에는 사이트의 `thive8564@gmail.com` 공개 표기를 `contact@thivelab.com`으로 바꾸지 않습니다. 시험이 통과하면 Contact, FAQ, 법적 문서, 작성자 정보의 주소를 함께 점검하고 변경합니다.

참고: [Cloudflare Email Routing](https://developers.cloudflare.com/email-service/get-started/route-emails/), [Resend SMTP](https://resend.com/docs/send-with-smtp), [Gmail 변경 안내](https://support.google.com/mail/answer/17101213?hl=en).
