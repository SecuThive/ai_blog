# THIVELAB 무료 도메인 메일 설정

확인일: 2026-10-08. 수신 주소: `thive@thivelab.com`, 전달 대상: `thive8564@gmail.com`.

## 현재 상태

- `thivelab.com` 네임서버는 Cloudflare입니다.
- 루트 도메인의 MX 레코드 3개가 Cloudflare Email Routing을 가리킵니다.
- `thive8564@gmail.com` 전달 대상은 Cloudflare에서 인증 완료 상태입니다.
- `thive@thivelab.com`을 해당 Gmail로 전달하는 규칙을 2026-10-08에 생성했고 활성 상태를 확인했습니다. 운영자가 실제 메일 수신을 확인했습니다.
- Resend 발송용 `resend._domainkey.thivelab.com` DKIM과 `send.thivelab.com` SPF 레코드는 DNS에 있습니다. 이는 발송 인증의 일부를 보여주지만, 현재 Resend 계정에서 도메인이 검증됐다는 증거는 아닙니다.
- 사이트 문의 폼은 `src/app/api/contact/route.ts`에서 Resend로 `thive8564@gmail.com`에 알림을 보냅니다. 직접 보낸 메일의 수신과는 별개입니다.
- 사이트의 공개 문의·정정·신고·구독 해지 주소는 `thive@thivelab.com`입니다. 이 주소의 수신 전달과 문의 폼의 Resend 알림은 별개 경로입니다.
- `contact@thivelab.com`은 이전 운영 계획에 등장하지만, 이 문서에서 수신 규칙이 확인된 주소는 `thive@thivelab.com`입니다.

## 수신 설정 — Cloudflare

1. 완료: Cloudflare Email Routing MX, Gmail 전달 대상 인증, `thive@thivelab.com` 전달 규칙 활성화.
2. 완료: 운영자가 `thive@thivelab.com`으로 보낸 메일의 수신을 확인했습니다. 다른 발신 서비스에서의 전달 여부는 확인하지 않았습니다.
3. 별도 주소 `contact@thivelab.com`을 사용하려면 해당 주소의 규칙을 따로 만들고 시험합니다.

## 발송 설정 — Resend

- 현재 사이트의 뉴스레터·문의 알림 발송은 Resend를 그대로 사용합니다.
- Gmail의 ‘다른 주소에서 보내기’에 `contact@thivelab.com`과 Resend SMTP (`smtp.resend.com`, 포트 465, 사용자명 `resend`, 비밀번호 Resend API 키)를 설정할 수 있습니다. 이 키는 메일 설정 화면에만 입력하고 저장소에 넣지 않습니다.
- Gmail의 주소 확인 메일을 수신 규칙으로 받아 인증한 다음, 다른 계정에 시험 발송하고 From, Reply-To, SPF/DKIM/DMARC 결과를 확인합니다.
- Resend 무료 플랜의 발송량은 사이트 자동 메일과 수동 발송을 합산해 관리합니다.

**장기 제한:** Google은 개인 Gmail의 외부 주소 ‘다른 주소에서 보내기’를 2027년 1월 종료한다고 공지했습니다. Cloudflare의 Gmail 전달은 계속되지만, 그 뒤 수동 발송은 별도 메일 프로그램의 SMTP 또는 도메인 메일 서비스가 필요합니다.

## 사이트 공개 주소

운영자의 수신 확인에 따라 Contact, FAQ, 법적 문서, 작성자 정보, 신고 및 구독 해지 링크의 공개 주소를 `thive@thivelab.com`으로 변경했습니다. `thive@thivelab.com`에서 보내는 기능은 수신 전달과 별도로 설정·검증해야 합니다.

참고: [Cloudflare Email Routing](https://developers.cloudflare.com/email-service/get-started/route-emails/), [Resend SMTP](https://resend.com/docs/send-with-smtp), [Gmail 변경 안내](https://support.google.com/mail/answer/17101213?hl=en).
