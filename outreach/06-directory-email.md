# 06 — 디렉토리 등록 요청 메일 초안

**발송 금지.** 운영자가 검토·수정한 뒤 직접 보낸다.

---

## 06-A. DevHub (dev-hub.dev) 피드 등록 요청

- **대상**: DevHub 운영자
- **주소**: `writer0713@naver.com` (https://dev-hub.dev/contact 에 난독화 게시된 주소)
- **근거**: DevHub는 국내 개발 블로그 RSS를 모아 요약해주는 애그리게이터이고, 문의 페이지에서 검토받고 싶은 URL을 함께 보내달라고 안내하고 있음
- **발송 전 확인**: 보내기 직전 https://dev-hub.dev/blog/feeds 에서 Nodelog가 이미 들어갔는지 다시 확인할 것

**제목**
```
[피드 등록 요청] Nodelog — IT·개발·보안 기술 미디어 RSS
```

**본문**
```
안녕하세요, DevHub 운영자님.

Nodelog(노드로그, https://www.thivelab.com)를 운영하고 있습니다.
dev-hub.dev의 블로그 피드 목록에 등록을 검토해 주십사 메일 드립니다.

■ 등록 요청 정보
- 사이트명: Nodelog (노드로그)
- URL: https://www.thivelab.com
- RSS: https://www.thivelab.com/rss  (RSS 2.0, 최근 글 50건)
- 분야: 인프라·DevOps, 리눅스, 데이터베이스, 정보보안, AI/LLM 운영
- 언어: 한국어

■ 어떤 글을 쓰는지
IT·개발·보안 실무자를 위한 기술 미디어입니다.
공식 문서와 표준 문서 등 1차 자료를 근거로 초안을 작성하고,
편집자가 명령어와 사실관계를 검증한 뒤 발행합니다.
AI를 초안 작성에 쓰고 있다는 점은 사이트 소개(https://www.thivelab.com/about)에 명시해 두었습니다.

대표 글 몇 편입니다.
- 파일 권한 완전 가이드 — chmod · chown · ACL
  https://www.thivelab.com/engineer/linux-file-permission-acl-guide
- Too many open files — ulimit 파일 디스크립터 한계 해결
  https://www.thivelab.com/engineer/too-many-open-files-fix
- PgBouncer 연결 풀링 — PostgreSQL 성능 최적화
  https://www.thivelab.com/engineer/pgbouncer-connection-pooling

DevHub의 수록 기준에 맞지 않는다면 알려주시면 그대로 따르겠습니다.
검토해 주셔서 감사합니다.

Nodelog 편집팀
https://www.thivelab.com
https://github.com/SecuThive
```

**메모**: AI 초안 사용을 먼저 밝혀 두었다. 일부 애그리게이터는 이를 이유로 거절하는데, 숨겼다가 나중에 드러나 삭제되는 쪽이 훨씬 손해다.

---

## 06-B. ooh.directory 제출 폼 입력값

메일이 아니라 웹 폼(https://ooh.directory/suggest/, 계정 불필요). 아래 값을 그대로 입력.

| 필드 | 입력값 |
| --- | --- |
| Blog URL | `https://www.thivelab.com` |
| Category | Technology (하위에 Programming/Sysadmin 계열이 있으면 그쪽) |
| Notes | 아래 영문 문구 |

```
Nodelog is a Korean-language tech media site for IT, development, and security
practitioners. Drafts are generated with AI from primary sources such as official
documentation and standards, then fact-checked by human editors before publishing
— this workflow is disclosed on the site's About page. Topics: Linux, Kubernetes,
Docker, PostgreSQL, networking, security operations, and LLM/AI governance.
RSS: https://www.thivelab.com/rss
```

---

## 06-C. daily.dev / Feedspot

폼 제출이라 메일 초안 불필요. `04-directory-submission.md`의 표준 소개 문구(160자/400자)와 태그 목록을 그대로 사용한다.

- daily.dev는 문서상 "corporate and personal blogs"를 제외한다고 명시 → 거절 가능성을 감안하고 제출
- Feedspot은 **무료 등재만** 진행. 유료 featured 업셀은 거절 (유료 링크 금지 원칙)
