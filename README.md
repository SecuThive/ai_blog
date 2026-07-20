# Nodelog — 노드로그

> AI 초안에 사람의 검토를 더한, 오늘의 실전 IT 인사이트
>
> **[www.thivelab.com](https://www.thivelab.com)**

Nodelog는 IT·개발·보안 실무자를 위한 테크 미디어입니다. AI 에이전트가 공식 문서와 1차 기술 자료를 바탕으로 초안을 만들고, 편집자가 사실관계와 실무 적용 가능성을 검증한 뒤 발행합니다. 이 저장소는 그 사이트를 구동하는 코드입니다.

## 무엇을 다루나

| 영역 | 내용 |
| --- | --- |
| AI·자동화 | LLM 운영, RAG, AI 거버넌스·컴플라이언스 |
| 인프라·DevOps | Kubernetes, Docker, CI/CD, 리눅스 운영 |
| 보안 | 취약점 점검, 네트워크 보안, 규제 대응 |
| 데이터베이스·네트워크 | PostgreSQL 튜닝, 커넥션 풀링, 트러블슈팅 |

## 자주 찾는 문서

- [파일 권한 완전 가이드 — chmod · chown · ACL](https://www.thivelab.com/engineer/linux-file-permission-acl-guide)
- [Too many open files — ulimit 파일 디스크립터 한계 해결](https://www.thivelab.com/engineer/too-many-open-files-fix)
- [nmap 포트 스캔 — 서버 보안 점검 실전 가이드](https://www.thivelab.com/engineer/nmap-port-scan-security-guide)
- [PgBouncer 연결 풀링 — PostgreSQL 성능 최적화](https://www.thivelab.com/engineer/pgbouncer-connection-pooling)

전체 목록: [엔지니어 가이드](https://www.thivelab.com/engineer) · [시리즈](https://www.thivelab.com/series) · [RSS](https://www.thivelab.com/rss)

## 기술 스택

- **Next.js** (App Router) — ISR 기반 정적 재생성
- **Supabase** (PostgreSQL) — 글·가이드·구독자 저장
- **Vercel** — 호스팅 및 배포
- **Resend** — 뉴스레터 발송

## 로컬 실행

```bash
npm install
cp .env.example .env.local   # Supabase·API 키 입력
npm run dev                  # http://localhost:3000
```

## 편집 원칙

- 모든 글은 공식 문서·표준 문서 등 1차 출처를 명시합니다.
- AI 초안은 발행 전 사람 편집자의 검토를 거칩니다.
- 사실이 바뀌면 기존 글을 갱신하고 갱신 이력을 남깁니다.

자세한 운영 방식은 [About](https://www.thivelab.com/about), 문의는 [Contact](https://www.thivelab.com/contact)를 참고하세요.
