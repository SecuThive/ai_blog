-- stale-refresh 2026-10-04 post #224 컨테이너-이미지-보안-빌드부터-런타임까지-완전-강화-가이드
-- KO+EN content change: updated_at bumped by trigger, contentUpdatedAt set
-- Guarded by original md5 values; re-running updates 0 rows.
BEGIN;
UPDATE posts SET content=$sr$## 왜 컨테이너 이미지 보안이 중요한가

컨테이너 기반 인프라가 일반화되면서 이미지 보안은 현대 DevSecOps의 핵심 과제가 됐습니다. 스캐너가 보고하는 취약점 가운데 베이스 이미지에서 온 것은 패치된 베이스 이미지로 바꾸면 함께 사라지므로, 베이스 이미지 관리부터 시작하는 것이 효율적입니다.

공격 표면은 크게 세 가지로 나뉩니다:
- **빌드 시**: 취약한 베이스 이미지, 불필요한 패키지, 하드코딩된 시크릿
- **레지스트리**: 서명되지 않은 이미지, 접근 제어 미비
- **런타임**: 과도한 권한, 민감한 마운트, 비정상 프로세스 실행

## 빌드 단계 보안 강화

### 1. 최소화된 베이스 이미지 사용

```dockerfile
# 나쁜 예 — 불필요한 패키지 포함
FROM ubuntu:22.04

# 좋은 예 — distroless로 최소화
FROM gcr.io/distroless/nodejs20-debian12

# 또는 Alpine 기반
FROM node:20-alpine3.19
```

Alpine은 5MB 수준으로 공격 표면을 대폭 줄이고, distroless는 셸조차 없어 컨테이너 탈출 시 공격자가 할 수 있는 일을 최소화합니다.

### 2. 멀티스테이지 빌드

```dockerfile
# 빌드 스테이지
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# 프로덕션 스테이지 — 빌드 도구 제외
FROM gcr.io/distroless/nodejs20-debian12
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
USER nonroot
EXPOSE 3000
CMD ["dist/server.js"]
```

### 3. 루트 사용자 금지

```dockerfile
# 전용 비권한 사용자 생성
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
```

Kubernetes에서는 PodSecurityContext로 이를 강제할 수 있습니다:

```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  readOnlyRootFilesystem: true
  allowPrivilegeEscalation: false
```

## 취약점 스캐닝: Trivy 실전 활용

[Trivy](/blog/trivy-vs-grype-비교-컨테이너-취약점-스캐너-선택-가이드)는 현재 가장 널리 쓰이는 오픈소스 컨테이너 스캐너입니다.

### 기본 스캔

```bash
# 이미지 스캔
trivy image nginx:1.25

# 심각도 필터링 (HIGH, CRITICAL만)
trivy image --severity HIGH,CRITICAL nginx:1.25

# JSON 출력 (CI 파이프라인용)
trivy image --format json --output results.json myapp:latest

# 특정 CVE 무시 (false positive 처리)
trivy image --ignorefile .trivyignore myapp:latest
```

### CI/CD 통합 (GitHub Actions)

```yaml
- name: Run Trivy vulnerability scanner
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: ${{ env.IMAGE_TAG }}
    format: sarif
    output: trivy-results.sarif
    severity: CRITICAL,HIGH
    exit-code: 1  # 취약점 발견 시 빌드 실패

- name: Upload Trivy scan results
  uses: github/codeql-action/upload-sarif@v3
  with:
    sarif_file: trivy-results.sarif
```

### SBOM 생성

[SBOM](/blog/공급망-보안supply-chain-security과-sbom-관리-전략)(Software Bill of Materials)은 이미지에 포함된 모든 컴포넌트를 목록화합니다:

```bash
# CycloneDX 형식으로 SBOM 생성
trivy image --format cyclonedx --output sbom.json myapp:latest

# SPDX 형식
trivy image --format spdx-json --output sbom.spdx.json myapp:latest
```

## 이미지 서명: Cosign + Sigstore

```bash
# Cosign 설치 및 키 생성
cosign generate-key-pair

# 이미지 서명
cosign sign --key cosign.key registry.example.com/myapp:latest

# 서명 검증
cosign verify --key cosign.pub registry.example.com/myapp:latest

# keyless 서명 (OIDC 기반, GitHub Actions)
cosign sign --yes registry.example.com/myapp:${{ github.sha }}
```

Kubernetes에서 서명된 이미지만 허용하려면 Kyverno나 OPA Gatekeeper 정책을 사용합니다:

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: verify-image-signature
spec:
  validationFailureAction: Enforce
  rules:
  - name: check-image
    match:
      any:
      - resources:
          kinds: [Pod]
    verifyImages:
    - imageReferences: ["registry.example.com/*"]
      attestors:
      - count: 1
        entries:
        - keys:
            publicKeys: |- 
              -----BEGIN PUBLIC KEY-----
              ...
```

## 런타임 보안: Falco

Falco는 컨테이너 런타임에서 비정상 행위를 실시간 탐지합니다.

```yaml
# falco-rules.yaml — 주요 탐지 규칙 예시
- rule: Terminal shell in container
  desc: 컨테이너 내 셸 실행 탐지
  condition: >
    spawned_process and container and
    proc.name in (shell_binaries)
  output: >
    Shell spawned in container (user=%user.name container=%container.name
    image=%container.image.repository)
  priority: WARNING

- rule: Write below etc
  desc: /etc 디렉토리 쓰기 시도
  condition: >
    open_write and container and fd.directory=/etc
  output: File opened for writing below /etc (user=%user.name file=%fd.name)
  priority: ERROR
```

## 레지스트리 보안 체크리스트

| 항목 | 권장 설정 |
|------|-----------|
| 접근 제어 | RBAC + 최소 권한 원칙 |
| 이미지 스캔 | 푸시 시 자동 스캔 활성화 |
| 서명 정책 | 서명된 이미지만 pull 허용 |
| 취약 이미지 | CRITICAL 발견 시 자동 격리 |
| 감사 로깅 | 모든 pull/push 이벤트 기록 |
| 보존 정책 | 오래된 이미지 자동 삭제 |

## 보안 강화 로드맵

1. **즉시 적용** (1주): Trivy를 CI 파이프라인에 통합, CRITICAL 취약점 빌드 차단
2. **단기** (1달): 멀티스테이지 빌드 + distroless/Alpine 마이그레이션, non-root 사용자 강제
3. **중기** (3달): Cosign 이미지 서명 도입, Kyverno 서명 검증 정책 적용
4. **장기** (6달): Falco 런타임 탐지, SBOM 자동 생성 및 취약점 추적 체계 완성

이미지 보안은 한 번 설정하고 끝나는 게 아닙니다. 새로운 CVE가 매일 발표되므로, 배포된 이미지를 주기적으로 재스캔하고 베이스 이미지를 최신으로 유지하는 자동화 체계를 구축하는 것이 핵심입니다.

## 취약점 스캔 결과 대응 의사결정표

Trivy가 수백 건을 쏟아낼 때, 전부 고치려다 아무것도 못 고치는 것이 최악입니다.

| 상황 | 판단 | 조치 |
|---|---|---|
| Critical + 수정 버전 존재 | 즉시 대응 | 베이스 이미지/패키지 버전 업 → 재빌드·재배포 |
| Critical인데 패치 미출시 | 노출면 평가 | 해당 라이브러리가 실제 실행 경로에 있는지 확인 — 미사용이면 예외 등록(만료일 필수), 사용 중이면 완화책(네트워크 격리 등) 문서화 |
| 취약점 대부분이 베이스 이미지 유래 | 구조 개선 | distroless/alpine 등 최소 이미지로 교체가 개별 패치보다 효과적 |
| 동일 CVE가 매주 재등장 | 프로세스 문제 | 베이스 이미지 주기적 리빌드 파이프라인(주 1회) 부재 — 자동화 |
| 오탐 판단 | 근거 기록 | `.trivyignore`에 사유·검토자·만료일 주석과 함께 등록 |

## 운영 체크리스트

- [ ] CI 게이트 기준 명문화 — 예: Critical=차단, High=경고 후 7일 내 조치
- [ ] 예외(ignore) 목록에 만료일 — 영구 예외 금지
- [ ] 런타임 이미지와 스캔 이미지의 태그 일치 검증 (latest 스캔은 무의미)
- [ ] 서명 검증을 배포 어드미션에서 강제해야 서명이 의미를 가짐

---

## 자주 묻는 질문 (FAQ)

**Q. 컨테이너 이미지 보안 검증은 어떻게 하나요?**
A. ① 취약점 스캔 — Trivy·Grype로 OS·라이브러리 CVE 검사 ② 이미지 서명 검증 — Cosign으로 서명·검증해 변조 방지 ③ SBOM 생성 — 구성요소 목록화 ④ 베이스 이미지 최소화(distroless·slim)로 공격면 축소. CI 파이프라인에서 스캔을 게이트로 걸어 실패 시 배포를 막는 것이 핵심입니다.

**Q. 이미지 스캔은 언제 하나요?**
A. 빌드 시(CI), 레지스트리 등록 후, 런타임(주기적 재스캔) 3단계 모두 권장합니다. CVE는 배포 이후에도 새로 공개되므로 이미 떠 있는 이미지도 주기적으로 재검증해야 합니다.
$sr$, content_evidence=jsonb_set($j${"en": {"title": "Hardening Container Images: Build, Scan, Sign, and Runtime Checks", "content": "## Why Container Image Security Matters\n\nAs container-based infrastructure has become the norm, image security is a core challenge for modern DevSecOps. Vulnerabilities that come from the base image disappear when you switch to a patched base image, so base-image management is an efficient place to start.\n\nThe attack surface falls into three main areas:\n- **At build time**: Vulnerable base images, unnecessary packages, hardcoded secrets\n- **In the registry**: Unsigned images, inadequate access control\n- **At runtime**: Excessive privileges, sensitive mounts, abnormal process execution\n\n## Hardening the Build Stage\n\n### 1. Use Minimal Base Images\n\n```dockerfile\n# 나쁜 예 — 불필요한 패키지 포함\nFROM ubuntu:22.04\n\n# 좋은 예 — distroless로 최소화\nFROM gcr.io/distroless/nodejs20-debian12\n\n# 또는 Alpine 기반\nFROM node:20-alpine3.19\n```\n\nAlpine cuts the attack surface dramatically at around 5MB, and distroless does not even include a shell, which minimizes what an attacker can do if they compromise the container.\n\n### 2. Multi-Stage Builds\n\n```dockerfile\n# 빌드 스테이지\nFROM node:20-alpine AS builder\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci --only=production\nCOPY . .\nRUN npm run build\n\n# 프로덕션 스테이지 — 빌드 도구 제외\nFROM gcr.io/distroless/nodejs20-debian12\nWORKDIR /app\nCOPY --from=builder /app/dist ./dist\nCOPY --from=builder /app/node_modules ./node_modules\nUSER nonroot\nEXPOSE 3000\nCMD [\"dist/server.js\"]\n```\n\n### 3. Never Run as Root\n\n```dockerfile\n# 전용 비권한 사용자 생성\nRUN addgroup -S appgroup && adduser -S appuser -G appgroup\nUSER appuser\n```\n\nIn Kubernetes, you can enforce this with PodSecurityContext:\n\n```yaml\nsecurityContext:\n  runAsNonRoot: true\n  runAsUser: 1000\n  readOnlyRootFilesystem: true\n  allowPrivilegeEscalation: false\n```\n\n## Vulnerability Scanning: Practical Trivy Usage\n\n[Trivy](/blog/trivy-vs-grype-비교-컨테이너-취약점-스캐너-선택-가이드) is currently the most widely used open-source container scanner.\n\n### Basic Scanning\n\n```bash\n# 이미지 스캔\ntrivy image nginx:1.25\n\n# 심각도 필터링 (HIGH, CRITICAL만)\ntrivy image --severity HIGH,CRITICAL nginx:1.25\n\n# JSON 출력 (CI 파이프라인용)\ntrivy image --format json --output results.json myapp:latest\n\n# 특정 CVE 무시 (false positive 처리)\ntrivy image --ignorefile .trivyignore myapp:latest\n```\n\n### CI/CD Integration (GitHub Actions)\n\n```yaml\n- name: Run Trivy vulnerability scanner\n  uses: aquasecurity/trivy-action@master\n  with:\n    image-ref: ${{ env.IMAGE_TAG }}\n    format: sarif\n    output: trivy-results.sarif\n    severity: CRITICAL,HIGH\n    exit-code: 1  # 취약점 발견 시 빌드 실패\n\n- name: Upload Trivy scan results\n  uses: github/codeql-action/upload-sarif@v3\n  with:\n    sarif_file: trivy-results.sarif\n```\n\n### Generating an SBOM\n\nAn [SBOM](/blog/공급망-보안supply-chain-security과-sbom-관리-전략) (Software Bill of Materials) inventories every component included in the image:\n\n```bash\n# CycloneDX 형식으로 SBOM 생성\ntrivy image --format cyclonedx --output sbom.json myapp:latest\n\n# SPDX 형식\ntrivy image --format spdx-json --output sbom.spdx.json myapp:latest\n```\n\n## Image Signing: Cosign + Sigstore\n\n```bash\n# Cosign 설치 및 키 생성\ncosign generate-key-pair\n\n# 이미지 서명\ncosign sign --key cosign.key registry.example.com/myapp:latest\n\n# 서명 검증\ncosign verify --key cosign.pub registry.example.com/myapp:latest\n\n# keyless 서명 (OIDC 기반, GitHub Actions)\ncosign sign --yes registry.example.com/myapp:${{ github.sha }}\n```\n\nTo allow only signed images in Kubernetes, use a Kyverno or OPA Gatekeeper policy:\n\n```yaml\napiVersion: kyverno.io/v1\nkind: ClusterPolicy\nmetadata:\n  name: verify-image-signature\nspec:\n  validationFailureAction: Enforce\n  rules:\n  - name: check-image\n    match:\n      any:\n      - resources:\n          kinds: [Pod]\n    verifyImages:\n    - imageReferences: [\"registry.example.com/*\"]\n      attestors:\n      - count: 1\n        entries:\n        - keys:\n            publicKeys: |- \n              -----BEGIN PUBLIC KEY-----\n              ...\n```\n\n## Runtime Security: Falco\n\nFalco detects anomalous behavior in the container runtime in real time.\n\n```yaml\n# falco-rules.yaml — 주요 탐지 규칙 예시\n- rule: Terminal shell in container\n  desc: 컨테이너 내 셸 실행 탐지\n  condition: >\n    spawned_process and container and\n    proc.name in (shell_binaries)\n  output: >\n    Shell spawned in container (user=%user.name container=%container.name\n    image=%container.image.repository)\n  priority: WARNING\n\n- rule: Write below etc\n  desc: /etc 디렉토리 쓰기 시도\n  condition: >\n    open_write and container and fd.directory=/etc\n  output: File opened for writing below /etc (user=%user.name file=%fd.name)\n  priority: ERROR\n```\n\n## Registry Security Checklist\n\n| Item | Recommended setting |\n|------|-----------|\n| Access control | RBAC + least privilege |\n| Image scanning | Enable automatic scanning on push |\n| Signing policy | Allow pull of signed images only |\n| Vulnerable images | Auto-quarantine on CRITICAL findings |\n| Audit logging | Record all pull/push events |\n| Retention policy | Automatically delete old images |\n\n## Hardening Roadmap\n\n1. **Apply immediately** (1 week): Integrate Trivy into the CI pipeline; fail builds on CRITICAL vulnerabilities\n2. **Short term** (1 month): Multi-stage builds + migrate to distroless/Alpine; enforce non-root users\n3. **Medium term** (3 months): Introduce Cosign image signing; apply Kyverno signature-verification policies\n4. **Long term** (6 months): Falco runtime detection; complete automated SBOM generation and vulnerability tracking\n\nImage security is not a one-time setup. New CVEs are published every day, so the key is building automation that periodically rescans deployed images and keeps base images up to date.\n\n## Vulnerability Scan Results Decision Table\n\nWhen Trivy dumps hundreds of findings, trying to fix everything and ending up fixing nothing is the worst outcome.\n\n| Situation | Assessment | Action |\n|---|---|---|\n| Critical + a fix is available | Respond immediately | Bump the base image/package version → rebuild and redeploy |\n| Critical but no patch released | Assess exposure | Check whether the library is actually on the execution path — if unused, register an exception (expiration date required); if in use, document mitigations (e.g., network isolation) |\n| Most vulnerabilities originate from the base image | Improve the structure | Replacing with a minimal image (distroless/Alpine) is more effective than patching individually |\n| The same CVE reappears every week | Process problem | No periodic base-image rebuild pipeline (weekly) — automate it |\n| Judged a false positive | Record the rationale | Register it in `.trivyignore` with comments for reason, reviewer, and expiration date |\n\n## Operations Checklist\n\n- [ ] Document CI gate criteria — e.g., Critical = block, High = warn then remediate within 7 days\n- [ ] Expiration dates on the exception (ignore) list — no permanent exceptions\n- [ ] Verify that runtime image tags match scanned image tags (scanning `latest` is meaningless)\n- [ ] Enforce signature verification at admission control — otherwise signing is meaningless\n\n---\n\n## Frequently Asked Questions (FAQ)\n\n**Q. How do you verify container image security?**\nA. (1) Vulnerability scanning — inspect OS and library CVEs with Trivy or Grype. (2) Image signature verification — sign and verify with Cosign to prevent tampering. (3) SBOM generation — inventory components. (4) Minimize the base image (distroless/slim) to shrink the attack surface. The key is gating scans in the CI pipeline so that a failed scan blocks deployment.\n\n**Q. When should you scan images?**\nA. At all three stages: at build time (CI), after registry registration, and at runtime (periodic rescan). CVEs continue to be disclosed after deployment, so images that are already running must be revalidated periodically.", "excerpt": "Container image security must be managed systematically from build through runtime. This practical guide covers Docker image vulnerability scanning, SBOM generation, and runtime security policies."}, "verifiedAt": "2026-10-04", "changeSummary": "출처와 맞지 않는 \"2024년 Sysdig 보고서, 프로덕션 컨테이너 87%\" 통계 삭제(해당 수치는 이미지 기준의 이전 보고서 값이며 최신 보고서와 대조되지 않음)."}$j$::jsonb,'{contentUpdatedAt}',to_jsonb(to_char(now() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"')))
WHERE id=224 AND md5(content)='ac405a0c17d19ac57571a38e19393cfa' AND md5(content_evidence::text)='86c26f658128cb152a4731235e79d275' AND md5(coalesce(array_to_string(tags,'|'),''))='91f61814f8fbaa3cb950c40e2348dfcd';
COMMIT;
