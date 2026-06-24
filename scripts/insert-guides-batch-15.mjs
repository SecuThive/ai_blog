import { createClient } from '@supabase/supabase-js/dist/index.mjs';

const supabase = createClient(
  'https://isfzeksbzxtuqymfocqv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzZnpla3Nienh0dXF5bWZvY3F2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODczMzc2NCwiZXhwIjoyMDk0MzA5NzY0fQ.DKetrvS0DzApprniPZ0_ST1lHKLKUR6Pari4JXE7la0',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const guides = [
  // ── Git / CI·CD ──────────────────────────────────────
  {
    title: 'Jenkins 파이프라인 기초 — Declarative Pipeline으로 CI/CD 구축',
    slug: 'jenkins-declarative-pipeline-guide',
    summary: 'Jenkinsfile를 사용한 Declarative Pipeline 문법을 처음부터 설명합니다. agent·stages·steps 구조, 환경 변수, 병렬 빌드, post 블록, 자격 증명 관리, 공유 라이브러리까지 실전 CI/CD 파이프라인을 코드로 정의하는 방법을 다룹니다.',
    category: 'Git / CI·CD',
    tags: ['jenkins', 'cicd', 'pipeline', 'jenkinsfile', 'automation'],
    difficulty: 'intermediate',
    os_compat: ['linux'],
    author: 'SecuThive',
    content: `## Jenkins Pipeline 이란?

Jenkins Pipeline은 빌드·테스트·배포 과정을 **코드(Jenkinsfile)** 로 정의하는 기능입니다. 웹 UI에서 클릭으로 잡(Job)을 구성하던 자유형(Freestyle) 방식과 달리, 파이프라인을 코드로 작성해 Git 저장소에 함께 보관하므로 버전 관리·코드 리뷰·재현이 가능합니다. 이를 "Pipeline as Code"라고 부릅니다.

파이프라인 작성 방식은 두 가지입니다.

| 방식 | 특징 |
|---|---|
| **Declarative** | \`pipeline { }\` 블록으로 시작하는 구조화된 문법. 가독성이 높고 검증이 쉬워 권장됨 |
| **Scripted** | Groovy 코드 기반. 자유도가 높지만 복잡하고 진입 장벽이 큼 |

이 가이드는 현업에서 표준으로 쓰이는 **Declarative Pipeline**을 다룹니다.

---

## 사전 준비

Jenkins가 설치되어 있고, 다음 플러그인이 필요합니다.

- **Pipeline** (기본 포함)
- **Git** / **GitHub Branch Source**
- **Credentials Binding** (자격 증명 주입)

새 잡 생성 시 **"Pipeline"** 또는 **"Multibranch Pipeline"** 타입을 선택하고, 소스로 \`Pipeline script from SCM\`을 지정하면 저장소 루트의 \`Jenkinsfile\`을 읽습니다.

---

## 가장 기본적인 Jenkinsfile

\`\`\`groovy
pipeline {
    agent any

    stages {
        stage('Build') {
            steps {
                echo '빌드 시작'
                sh 'make build'
            }
        }
        stage('Test') {
            steps {
                sh 'make test'
            }
        }
        stage('Deploy') {
            steps {
                sh 'make deploy'
            }
        }
    }
}
\`\`\`

핵심 구조는 다음과 같습니다.

| 블록 | 역할 |
|---|---|
| \`pipeline\` | 전체 파이프라인을 감싸는 최상위 블록 (필수) |
| \`agent\` | 어느 노드/환경에서 실행할지 지정 |
| \`stages\` | 하나 이상의 \`stage\`를 담는 컨테이너 |
| \`stage\` | 논리적 단계 (Build, Test, Deploy 등). UI에 시각화됨 |
| \`steps\` | 단계 안에서 실제로 실행할 명령 |

---

## agent — 실행 환경 지정

\`agent\`는 파이프라인(또는 개별 stage)이 어디서 실행될지 결정합니다.

\`\`\`groovy
// 1) 사용 가능한 아무 노드
agent any

// 2) 특정 라벨이 붙은 노드만
agent { label 'linux && docker' }

// 3) Docker 컨테이너 안에서 실행
agent {
    docker {
        image 'node:20-alpine'
        args  '-v /tmp:/tmp'
    }
}

// 4) 파이프라인 레벨은 none, stage마다 따로 지정
agent none
\`\`\`

> \`agent { docker { ... } }\`를 쓰면 빌드마다 깨끗한 컨테이너에서 실행되므로 "내 머신에선 됐는데" 문제를 줄일 수 있습니다. 단, 에이전트 노드에 Docker가 설치되어 있어야 합니다.

---

## environment — 환경 변수

\`environment\` 블록으로 변수를 선언합니다. 파이프라인 전체 또는 특정 stage 범위로 지정할 수 있습니다.

\`\`\`groovy
pipeline {
    agent any
    environment {
        APP_NAME   = 'my-service'
        BUILD_TAG  = "v1.\${BUILD_NUMBER}"   // 내장 변수 사용
        REGISTRY   = 'registry.example.com'
    }
    stages {
        stage('Info') {
            steps {
                sh 'echo "빌드: \$APP_NAME:\$BUILD_TAG"'
            }
        }
    }
}
\`\`\`

자주 쓰는 내장 환경 변수:

| 변수 | 의미 |
|---|---|
| \`BUILD_NUMBER\` | 빌드 일련번호 |
| \`BUILD_ID\` | 빌드 ID |
| \`JOB_NAME\` | 잡 이름 |
| \`WORKSPACE\` | 작업 디렉터리 절대 경로 |
| \`GIT_COMMIT\` | 체크아웃된 커밋 해시 |
| \`BRANCH_NAME\` | (Multibranch) 브랜치 이름 |

---

## 자격 증명(Credentials) 안전하게 사용

비밀번호·토큰을 Jenkinsfile에 평문으로 적으면 안 됩니다. **Manage Jenkins → Credentials**에 등록한 뒤 ID로 참조합니다.

\`\`\`groovy
environment {
    // Secret Text 타입 자격 증명을 환경 변수로 주입
    DOCKER_TOKEN = credentials('docker-registry-token')
}
\`\`\`

Username/Password 타입은 \`withCredentials\`로 명시적으로 묶는 방식이 안전합니다.

\`\`\`groovy
steps {
    withCredentials([usernamePassword(
        credentialsId: 'docker-login',
        usernameVariable: 'DOCKER_USER',
        passwordVariable: 'DOCKER_PASS')]) {
        sh 'echo "\$DOCKER_PASS" | docker login -u "\$DOCKER_USER" --password-stdin \$REGISTRY'
    }
}
\`\`\`

> 자격 증명은 로그에 출력되더라도 Jenkins가 자동으로 \`****\`로 마스킹합니다. 그래도 \`echo "\$DOCKER_PASS"\`처럼 직접 출력하는 코드는 절대 작성하지 마세요.

---

## 병렬 실행 — parallel

서로 의존성이 없는 작업(예: 여러 OS·버전 매트릭스 테스트)은 \`parallel\`로 동시에 돌려 시간을 단축합니다.

\`\`\`groovy
stage('Test Matrix') {
    parallel {
        stage('Unit') {
            steps { sh 'make test-unit' }
        }
        stage('Integration') {
            steps { sh 'make test-integration' }
        }
        stage('Lint') {
            steps { sh 'make lint' }
        }
    }
}
\`\`\`

---

## 조건 분기 — when

특정 조건에서만 stage를 실행합니다. 배포는 보통 \`main\` 브랜치에서만 돌립니다.

\`\`\`groovy
stage('Deploy') {
    when {
        branch 'main'
    }
    steps {
        sh 'make deploy'
    }
}
\`\`\`

\`when\`은 \`branch\`, \`environment name: 'X', value: 'Y'\`, \`expression { ... }\`, \`changeset\` 등 다양한 조건을 지원합니다.

---

## post — 빌드 후 처리

빌드 성공/실패와 무관하게 정리 작업이나 알림을 보냅니다.

\`\`\`groovy
post {
    always {
        junit 'reports/**/*.xml'   // 테스트 리포트 수집
        cleanWs()                  // 작업 공간 정리
    }
    success {
        echo '✅ 빌드 성공'
    }
    failure {
        mail to: 'team@example.com',
             subject: "실패: \${JOB_NAME} #\${BUILD_NUMBER}",
             body: "로그 확인: \${BUILD_URL}"
    }
}
\`\`\`

| 조건 | 실행 시점 |
|---|---|
| \`always\` | 결과와 무관하게 항상 |
| \`success\` | 성공했을 때만 |
| \`failure\` | 실패했을 때만 |
| \`unstable\` | 테스트 실패 등으로 불안정할 때 |
| \`changed\` | 직전 빌드와 결과가 달라졌을 때 |

---

## options & triggers

\`\`\`groovy
options {
    timeout(time: 30, unit: 'MINUTES')   // 30분 초과 시 중단
    retry(2)                             // 실패 시 2회 재시도
    disableConcurrentBuilds()            // 동시 빌드 금지
    timestamps()                         // 로그에 타임스탬프
}
triggers {
    cron('H 2 * * *')        // 매일 새벽 2시경
    pollSCM('H/15 * * * *')  // 15분마다 변경 폴링
}
\`\`\`

> \`cron('H 2 * * *')\`의 \`H\`는 해시(hash)로, 잡마다 분산된 시각을 자동 배정해 동시 부하를 막습니다. 일반 cron의 고정 분(\`0\`) 대신 권장됩니다.

---

## 완성형 예제 — Node 앱 빌드 & Docker 배포

\`\`\`groovy
pipeline {
    agent { label 'docker' }

    environment {
        REGISTRY  = 'registry.example.com'
        IMAGE     = "\${REGISTRY}/web-app"
        TAG       = "\${GIT_COMMIT.take(8)}"
    }
    options {
        timeout(time: 20, unit: 'MINUTES')
        disableConcurrentBuilds()
    }
    stages {
        stage('Checkout') {
            steps { checkout scm }
        }
        stage('Install & Test') {
            agent { docker { image 'node:20-alpine'; reuseNode true } }
            steps {
                sh 'npm ci'
                sh 'npm test'
            }
        }
        stage('Build Image') {
            steps {
                sh "docker build -t \${IMAGE}:\${TAG} ."
            }
        }
        stage('Push') {
            when { branch 'main' }
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'docker-login',
                    usernameVariable: 'U', passwordVariable: 'P')]) {
                    sh 'echo "\$P" | docker login -u "\$U" --password-stdin \$REGISTRY'
                    sh "docker push \${IMAGE}:\${TAG}"
                }
            }
        }
    }
    post {
        always  { cleanWs() }
        failure { echo '빌드 실패 — 로그 확인 필요' }
    }
}
\`\`\`

---

## 공유 라이브러리(Shared Library)

여러 프로젝트가 같은 빌드 로직을 쓴다면 별도 Git 저장소에 공유 라이브러리를 만들어 재사용합니다.

\`\`\`groovy
@Library('my-shared-lib') _

pipeline {
    agent any
    stages {
        stage('Build') {
            steps {
                buildApp(lang: 'node')   // vars/buildApp.groovy 의 호출
            }
        }
    }
}
\`\`\`

라이브러리 저장소 구조는 \`vars/\` (전역 함수), \`src/\` (Groovy 클래스), \`resources/\` (정적 파일)로 구성됩니다. **Manage Jenkins → System → Global Pipeline Libraries**에 등록합니다.

---

## 트러블슈팅

| 증상 | 원인 / 해결 |
|---|---|
| \`sh\` 단계에서 권한 오류 | 에이전트 사용자에게 실행 권한 부여, Docker 그룹 추가 |
| 파이프라인이 멈춤 | \`input\` 승인 대기 중일 수 있음. \`timeout\`으로 감싸기 |
| 자격 증명이 빈 값 | credentialsId 오타 또는 폴더 스코프 불일치 확인 |
| Docker agent에서 워크스페이스 분실 | \`reuseNode true\` 옵션 추가 |

> 문법 오류는 **Pipeline Syntax → Declarative Directive Generator**나 \`jenkins-cli declarative-linter\`로 사전 검증하면 빌드 한 번을 낭비하지 않습니다.

---

## 정리

| 항목 | 핵심 |
|---|---|
| 정의 방식 | Declarative Pipeline (\`pipeline { }\`) 권장 |
| 필수 구조 | \`agent\` → \`stages\` → \`stage\` → \`steps\` |
| 환경 변수 | \`environment { }\`, 내장 \`BUILD_NUMBER\`/\`GIT_COMMIT\` |
| 비밀 관리 | \`credentials()\`, \`withCredentials\`로 안전 주입 |
| 속도 개선 | \`parallel\`로 독립 작업 동시 실행 |
| 조건 분기 | \`when { branch 'main' }\` |
| 후처리 | \`post { always / success / failure }\` |
| 재사용 | Shared Library로 빌드 로직 공유 |

Declarative Pipeline은 코드로 CI/CD를 정의해 재현성과 협업성을 확보하는 출발점입니다. 위 완성형 예제를 기반으로 자신의 프로젝트에 맞게 stage를 조정해 나가면 됩니다.`
  },

  // ── Git / CI·CD ──────────────────────────────────────
  {
    title: 'Git LFS 완전 가이드 — 대용량 파일 버전 관리',
    slug: 'git-lfs-large-file-storage',
    summary: 'Git Large File Storage(LFS)의 동작 원리와 설치, git lfs track으로 추적 패턴 지정, .gitattributes 관리, 기존 히스토리 마이그레이션, 부분 체크아웃, 저장소 용량 관리까지 대용량 파일을 Git으로 다루는 방법을 정리합니다.',
    category: 'Git / CI·CD',
    tags: ['git', 'git-lfs', 'large-files', 'version-control'],
    difficulty: 'intermediate',
    os_compat: ['linux', 'macos', 'windows'],
    author: 'SecuThive',
    content: `## Git LFS 란?

Git은 텍스트 소스코드의 변경 이력을 다루는 데 최적화되어 있습니다. 하지만 이미지·동영상·디자인 원본·데이터셋·바이너리 같은 **대용량 파일**을 그대로 커밋하면 모든 버전이 \`.git\` 히스토리에 통째로 쌓여 저장소가 수 GB로 불어나고, clone·fetch가 극도로 느려집니다. 한 번 커밋한 큰 파일은 나중에 지워도 히스토리에 영원히 남습니다.

**Git LFS(Large File Storage)** 는 이 문제를 해결하는 확장 기능입니다. 큰 파일의 실제 내용은 별도 LFS 스토리지에 두고, Git 저장소에는 그 파일을 가리키는 **포인터(pointer) 파일**(수십 바이트의 텍스트)만 커밋합니다.

\`\`\`
version https://git-lfs.github.com/spec/v1
oid sha256:4d7a214614ab2935c943f9e0ff69d22eadbb8f32b1258daaa5e2ca24d17e2393
size 12345678
\`\`\`

체크아웃 시 이 포인터를 읽어 실제 파일을 LFS 서버에서 내려받습니다. 덕분에 히스토리는 가벼워지고 필요한 버전만 받게 됩니다.

---

## 설치

\`\`\`bash
# macOS
brew install git-lfs

# Debian / Ubuntu
sudo apt install git-lfs

# RHEL / Rocky
sudo dnf install git-lfs

# 설치 확인
git lfs version
\`\`\`

설치 후 **사용자 계정에 한 번** 초기화합니다(머신당 1회).

\`\`\`bash
git lfs install
\`\`\`

이 명령은 전역 Git 설정에 LFS용 \`filter\`/\`smudge\`/\`clean\` 후크를 등록합니다.

---

## 추적할 파일 지정 — git lfs track

저장소 안에서 어떤 파일을 LFS로 다룰지 패턴으로 지정합니다.

\`\`\`bash
# 확장자 기준
git lfs track "*.psd"
git lfs track "*.mp4"
git lfs track "*.zip"

# 특정 디렉터리 전체
git lfs track "assets/models/**"

# 현재 추적 규칙 확인
git lfs track
\`\`\`

이 명령은 저장소 루트에 \`.gitattributes\` 파일을 생성·수정합니다.

\`\`\`
*.psd  filter=lfs diff=lfs merge=lfs -text
*.mp4  filter=lfs diff=lfs merge=lfs -text
*.zip  filter=lfs diff=lfs merge=lfs -text
\`\`\`

> **\`.gitattributes\`는 반드시 커밋해야 합니다.** 이 파일이 없으면 협업자나 CI는 해당 파일을 일반 파일로 처리해 LFS가 동작하지 않습니다.

\`\`\`bash
git add .gitattributes
git commit -m "chore: track binary assets with Git LFS"
\`\`\`

이후 \`*.psd\` 같은 파일을 추가·커밋·푸시하면 자동으로 LFS로 처리됩니다.

\`\`\`bash
git add design/cover.psd
git commit -m "feat: add cover artwork"
git push origin main
\`\`\`

---

## 추적 상태 확인

\`\`\`bash
# LFS로 관리되는 파일 목록
git lfs ls-files

# 출력 예
# 4d7a214614 * design/cover.psd
# a91f0c8e2b - assets/intro.mp4

# 저장소·LFS 환경 진단
git lfs env

# 특정 파일이 포인터인지 실제 파일인지 확인
git lfs pointer --file=design/cover.psd
\`\`\`

\`ls-files\`에서 \`*\`는 작업 트리에 실제 파일이 내려와 있음을, \`-\`는 포인터만 있음을 의미합니다.

---

## 기존 히스토리 마이그레이션

이미 큰 파일을 일반 방식으로 커밋해 버린 저장소는 \`git lfs track\`만으로는 과거 커밋이 정리되지 않습니다. \`git lfs migrate\`로 히스토리를 다시 씁니다.

\`\`\`bash
# 현재 브랜치 히스토리에서 *.psd, *.zip 을 LFS로 변환
git lfs migrate import --include="*.psd,*.zip"

# 모든 브랜치/태그 대상
git lfs migrate import --include="*.psd" --everything
\`\`\`

> \`migrate import\`는 **커밋 해시를 모두 바꿉니다(history rewrite).** 공유 중인 브랜치라면 협업자와 합의 후 진행하고, 푸시는 \`git push --force-with-lease\`를 사용하세요. 진행 전 백업은 필수입니다.

반대로 LFS를 걷어내고 일반 파일로 되돌리려면 \`git lfs migrate export --include="*.psd"\`를 사용합니다.

---

## 부분 체크아웃 — 대역폭 절약

대용량 저장소에서 LFS 파일을 매번 다 받지 않도록 제어할 수 있습니다.

\`\`\`bash
# LFS 파일은 받지 않고 포인터만 clone (빠름)
GIT_LFS_SKIP_SMUDGE=1 git clone <repo-url>

# 나중에 필요한 것만 받기
git lfs pull --include="design/*.psd"

# 특정 패턴은 항상 제외
git config lfs.fetchexclude "assets/raw/**"

# 최근 커밋의 파일만 받기 (오래된 버전 스킵)
git config lfs.fetchrecentcommitsdays 7
\`\`\`

---

## LFS vs 일반 Git 처리 비교

| 항목 | 일반 Git 커밋 | Git LFS |
|---|---|---|
| 저장소에 들어가는 것 | 파일 전체(모든 버전) | 포인터 텍스트만 |
| clone 속도 | 누적될수록 느려짐 | 필요한 버전만 받아 빠름 |
| 큰 파일 diff | 거의 불가능 | 포인터 비교(메타데이터) |
| 히스토리 용량 | 계속 증가 | 가볍게 유지 |
| 적합 대상 | 텍스트 소스 | 이미지·영상·바이너리·데이터셋 |

---

## 저장소 용량과 정리

LFS 객체는 로컬 \`.git/lfs/objects\`에 캐시됩니다. 오래된 객체는 정리할 수 있습니다.

\`\`\`bash
# 원격에 이미 있고 현재 안 쓰는 로컬 LFS 객체 제거
git lfs prune

# 어떤 게 지워질지 미리보기
git lfs prune --dry-run

# 모든 LFS 객체를 미리 받아두기
git lfs fetch --all
\`\`\`

> GitHub·GitLab 등 호스팅 서비스는 LFS 저장 용량과 대역폭에 **별도 할당량**이 있습니다(예: GitHub 무료 1GB 저장 / 월 1GB 대역폭). 대용량 데이터셋은 비용을 사전에 확인하세요.

---

## 트러블슈팅

| 증상 | 원인 / 해결 |
|---|---|
| clone 후 파일이 포인터 텍스트로 보임 | \`git lfs install\` 미실행 → 실행 후 \`git lfs pull\` |
| 협업자에게 LFS가 안 먹힘 | \`.gitattributes\` 미커밋 → 커밋 후 공유 |
| push 시 \`batch response: 403\` | LFS 권한/할당량 문제. 토큰·용량 확인 |
| 큰 파일이 이미 일반 커밋됨 | \`git lfs migrate import\`로 변환 |
| \`smudge filter lfs failed\` | 네트워크/인증 문제. \`GIT_LFS_SKIP_SMUDGE=1\`로 우회 후 \`git lfs pull\` |

---

## .gitattributes 베스트 프랙티스

\`\`\`
# 미디어
*.psd   filter=lfs diff=lfs merge=lfs -text
*.ai    filter=lfs diff=lfs merge=lfs -text
*.mp4   filter=lfs diff=lfs merge=lfs -text
*.mov   filter=lfs diff=lfs merge=lfs -text

# 아카이브 / 모델
*.zip       filter=lfs diff=lfs merge=lfs -text
*.tar.gz    filter=lfs diff=lfs merge=lfs -text
*.onnx      filter=lfs diff=lfs merge=lfs -text
*.bin       filter=lfs diff=lfs merge=lfs -text
\`\`\`

\`-text\` 속성은 해당 파일을 바이너리로 취급해 줄바꿈 변환(CRLF↔LF)을 막습니다. LFS 대상에는 항상 붙이는 것이 안전합니다.

---

## 정리

| 작업 | 명령 |
|---|---|
| 머신 초기화(1회) | \`git lfs install\` |
| 추적 패턴 지정 | \`git lfs track "*.psd"\` |
| 추적 파일 목록 | \`git lfs ls-files\` |
| 기존 히스토리 변환 | \`git lfs migrate import --include="*.zip"\` |
| 포인터만 clone | \`GIT_LFS_SKIP_SMUDGE=1 git clone\` |
| 필요한 것만 받기 | \`git lfs pull --include="..."\` |
| 로컬 캐시 정리 | \`git lfs prune\` |

Git LFS는 텍스트에 최적화된 Git의 약점을 메워, 대용량 파일을 가벼운 포인터로 다루게 해 줍니다. 핵심은 \`.gitattributes\`를 반드시 커밋하고, 기존 큰 파일은 \`migrate\`로 정리하며, 호스팅 할당량을 관리하는 것입니다.`
  },

  // ── Linux / Shell ────────────────────────────────────
  {
    title: 'logrotate 완전 가이드 — 로그 자동 순환과 압축',
    slug: 'logrotate-log-rotation-guide',
    summary: 'logrotate로 로그 파일을 자동 순환·압축·보관하는 방법을 설명합니다. /etc/logrotate.conf와 /etc/logrotate.d 구조, rotate·size·compress·postrotate 지시어, copytruncate vs create 방식, cron/systemd 연동, 디버깅까지 다룹니다.',
    category: 'Linux / Shell',
    tags: ['logrotate', 'logs', 'rotation', 'cron', 'maintenance'],
    difficulty: 'intermediate',
    os_compat: ['linux'],
    author: 'SecuThive',
    content: `## logrotate 란?

서버를 오래 돌리면 \`/var/log\` 아래 로그 파일이 끝없이 커집니다. 방치하면 디스크가 가득 차 서비스가 멈추고, 수 GB짜리 단일 로그는 검색조차 어렵습니다. **logrotate**는 이 문제를 자동화하는 표준 도구로, 정해진 주기나 크기마다 로그를 새 파일로 **순환(rotate)** 하고, 오래된 것은 **압축·삭제**합니다.

순환의 기본 개념은 다음과 같습니다.

\`\`\`
app.log         ← 현재 기록 중
app.log.1       ← 직전 분량
app.log.2.gz    ← 더 오래된 것 (압축됨)
app.log.3.gz
...
\`\`\`

새 파일이 생기면 번호가 하나씩 밀리고, 보관 한도를 넘은 가장 오래된 파일은 삭제됩니다.

---

## 동작 방식과 실행 주기

logrotate는 데몬이 아니라, **cron 또는 systemd 타이머가 하루 한 번 실행**하는 일회성 명령입니다.

| 배포판 | 트리거 |
|---|---|
| 전통적 | \`/etc/cron.daily/logrotate\` |
| systemd 기반 | \`logrotate.timer\` → \`logrotate.service\` |

\`\`\`bash
# systemd 타이머 확인
systemctl list-timers logrotate.timer
systemctl status logrotate.timer
\`\`\`

설정 진입점은 \`/etc/logrotate.conf\`이며, 이 파일이 마지막에 \`include /etc/logrotate.d\`로 개별 설정 디렉터리를 읽어들입니다. **패키지나 애플리케이션별 설정은 \`/etc/logrotate.d/\` 안에 파일로 두는 것이 표준**입니다.

---

## 전역 기본값 — /etc/logrotate.conf

\`\`\`
# 주 단위 순환
weekly

# 4개 보관 (약 4주치)
rotate 4

# 순환 후 빈 새 로그 파일 생성
create

# 순환 파일에 날짜 확장자 사용 (app.log-20260618)
dateext

# 순환된 파일 압축
compress

# 개별 설정 포함
include /etc/logrotate.d
\`\`\`

\`/etc/logrotate.d\`의 개별 설정에서 같은 지시어를 다시 쓰면 전역값을 **덮어씁니다.**

---

## 개별 설정 작성 — /etc/logrotate.d/myapp

웹 애플리케이션 로그를 예로 든 실전 설정입니다.

\`\`\`
/var/log/myapp/*.log {
    daily
    rotate 14
    missingok
    notifempty
    compress
    delaycompress
    dateext
    create 0640 appuser appgroup
    sharedscripts
    postrotate
        systemctl reload myapp >/dev/null 2>&1 || true
    endscript
}
\`\`\`

각 지시어의 의미:

| 지시어 | 역할 |
|---|---|
| \`daily\` / \`weekly\` / \`monthly\` | 순환 주기 |
| \`rotate 14\` | 14개까지 보관 후 삭제 |
| \`missingok\` | 로그 파일이 없어도 오류 없이 넘어감 |
| \`notifempty\` | 비어 있으면 순환하지 않음 |
| \`compress\` | 순환 파일을 gzip 압축 |
| \`delaycompress\` | 가장 최근 순환본은 압축을 한 주기 미룸 |
| \`dateext\` | 번호 대신 날짜를 확장자로 |
| \`create 0640 user group\` | 새 로그를 지정 권한/소유자로 생성 |
| \`sharedscripts\` | 와일드카드 매칭 파일 전체에 스크립트 1회만 실행 |
| \`postrotate ... endscript\` | 순환 직후 실행할 명령 |

---

## 크기 기반 순환

시간이 아니라 **크기**로 자르고 싶을 때 사용합니다.

\`\`\`
/var/log/nginx/access.log {
    size 100M
    rotate 10
    compress
    missingok
    create 0640 www-data adm
    postrotate
        # nginx에 새 로그 파일을 열라고 신호
        [ -f /run/nginx.pid ] && kill -USR1 $(cat /run/nginx.pid)
    endscript
}
\`\`\`

| 지시어 | 의미 |
|---|---|
| \`size 100M\` | 100MB를 넘으면 순환(주기 무관, 매 실행 시 크기 검사) |
| \`maxsize 100M\` | 주기 도래 전이라도 이 크기 넘으면 순환 |
| \`minsize 10M\` | 주기가 됐어도 이 크기 미만이면 순환 안 함 |

> \`size\`만 쓰면 \`daily\`/\`weekly\` 같은 시간 조건을 **무시**합니다. "주마다 또는 100MB 넘으면"을 원하면 \`weekly\` + \`maxsize 100M\`를 함께 쓰세요.

---

## create 방식 vs copytruncate 방식

순환의 가장 중요한 두 전략입니다. 애플리케이션이 로그 파일을 다루는 방식에 따라 골라야 합니다.

| 방식 | 동작 | 적합한 경우 |
|---|---|---|
| \`create\` (기본) | 기존 파일을 \`mv\`로 옮기고 새 파일 생성 | 앱이 \`postrotate\`에서 reopen 신호(SIGHUP 등)를 받을 수 있을 때 |
| \`copytruncate\` | 원본을 복사한 뒤 원본을 0바이트로 truncate | 앱을 재시작/신호 처리할 수 없고 파일 핸들을 계속 잡고 있을 때 |

\`\`\`
/var/log/legacy-app/output.log {
    daily
    rotate 7
    compress
    copytruncate
}
\`\`\`

> \`create\` 방식인데 앱에 reopen 신호를 보내지 않으면, 앱은 \`mv\`로 옮겨진(이미 이름이 바뀐) **옛 파일 핸들에 계속 기록**합니다. 그 결과 새 \`app.log\`는 비어 있고 디스크는 줄지 않습니다. 신호를 못 보내는 앱이라면 \`copytruncate\`를 쓰되, 복사~truncate 사이 짧은 순간에 기록된 로그는 유실될 수 있다는 점을 감안하세요.

---

## prerotate / postrotate 스크립트

순환 전후로 명령을 실행합니다. 서비스에 새 파일을 열도록 신호를 보내는 데 주로 씁니다.

\`\`\`
postrotate
    # systemd 서비스 reload
    systemctl reload rsyslog >/dev/null 2>&1 || true
endscript
\`\`\`

\`sharedscripts\`가 없으면 와일드카드로 매칭된 **파일마다** 스크립트가 반복 실행됩니다. 서비스 reload는 보통 한 번이면 되므로 \`sharedscripts\`를 함께 쓰는 것이 일반적입니다.

---

## 테스트와 디버깅

설정을 바꾸면 실제 cron을 기다리지 말고 즉시 검증하세요.

\`\`\`bash
# 1) 무엇이 일어날지 보기만 함 (실제 순환 X) — 가장 자주 씀
logrotate --debug /etc/logrotate.d/myapp

# 2) 강제로 지금 순환 (주기/크기 조건 무시)
sudo logrotate --force /etc/logrotate.d/myapp

# 3) 전체 설정 강제 실행
sudo logrotate --force /etc/logrotate.conf

# 4) 마지막 순환 시각 기록 확인
cat /var/lib/logrotate/logrotate.status
\`\`\`

> \`--debug\`는 \`--verbose\`를 포함하면서 **아무 것도 실제로 바꾸지 않습니다.** 운영 서버에서 설정을 확인할 때 안전한 첫 단계입니다. 실제 동작이 안 될 때는 \`status\` 파일에서 해당 로그의 마지막 순환 날짜가 갱신됐는지 확인하세요.

---

## 자주 겪는 문제

| 증상 | 원인 / 해결 |
|---|---|
| 순환은 됐는데 디스크가 안 줄어듦 | \`create\` 방식 + reopen 신호 누락 → \`copytruncate\` 또는 \`postrotate\` 신호 추가 |
| 권한 오류로 새 로그 생성 실패 | \`create\` 권한·소유자 지정, 상위 디렉터리 권한 확인 |
| 설정이 무시됨 | \`/etc/logrotate.d/\` 파일에 실행권한·확장자 문제 또는 \`.conf\`에 미포함. 파일명에 \`.\`(점) 주의 |
| "skipping ... because parent directory has insecure permissions" | \`su user group\` 지시어 추가하거나 디렉터리 권한 교정 |
| 압축 파일이 1개 부족 | \`delaycompress\` 때문(가장 최근본은 다음 주기에 압축) — 정상 동작 |

---

## 정리

| 항목 | 핵심 |
|---|---|
| 실행 주체 | cron.daily 또는 \`logrotate.timer\` (데몬 아님) |
| 설정 위치 | 전역 \`/etc/logrotate.conf\`, 개별 \`/etc/logrotate.d/\` |
| 주기 | \`daily\`/\`weekly\`/\`monthly\` 또는 \`size\`/\`maxsize\` |
| 보관 개수 | \`rotate N\` |
| 압축 | \`compress\` + \`delaycompress\` |
| 새 파일 처리 | \`create\`(신호 필요) vs \`copytruncate\`(신호 불가 앱) |
| 후처리 | \`postrotate ... endscript\` + \`sharedscripts\` |
| 검증 | \`logrotate --debug\`, \`--force\` |

logrotate는 거의 모든 리눅스 서버에 기본 탑재된 만큼, 새 서비스를 배포할 때 \`/etc/logrotate.d/\`에 설정 한 장을 함께 넣는 습관을 들이면 디스크 풀로 인한 장애를 근본적으로 예방할 수 있습니다.`
  },

  // ── Linux / Shell ────────────────────────────────────
  {
    title: '현대적 CLI 도구 실전 — ripgrep·fd·fzf·bat로 작업 속도 높이기',
    slug: 'modern-cli-tools-ripgrep-fd-fzf',
    summary: 'ripgrep(rg)·fd·fzf·bat를 grep·find·cat 같은 고전 도구와 비교하며 설치·기본 사용법·셸 통합을 설명합니다. 빠른 검색, 직관적 문법, 퍼지 파인더, 문법 강조 출력으로 터미널 작업 속도를 끌어올리는 실전 가이드입니다.',
    category: 'Linux / Shell',
    tags: ['ripgrep', 'fd', 'fzf', 'bat', 'cli', 'productivity'],
    difficulty: 'beginner',
    os_compat: ['linux', 'macos'],
    author: 'SecuThive',
    content: `## 현대적 CLI 도구 란?

\`grep\`, \`find\`, \`cat\`은 수십 년간 터미널의 기본기였습니다. 여전히 강력하지만, 옵션이 까다롭고 대형 저장소에서는 느리며 출력도 투박합니다. 최근 Rust 등으로 다시 작성된 도구들은 같은 일을 **더 빠르고, 더 합리적인 기본값으로, 더 보기 좋게** 처리합니다.

| 고전 도구 | 현대 대체 | 핵심 차이 |
|---|---|---|
| \`grep\` | \`rg\` (ripgrep) | 빠름, .gitignore 자동 존중, 재귀가 기본 |
| \`find\` | \`fd\` | 간결한 문법, 색상 출력, 빠른 탐색 |
| \`cat\` | \`bat\` | 문법 강조, 줄 번호, Git 변경 표시 |
| (없음) | \`fzf\` | 대화형 퍼지 파인더 — 다른 명령과 결합 |

이들은 고전 도구를 "대체"하기보다, 일상 작업에서 손이 더 빨리 가는 보완재로 쓰는 것이 좋습니다.

---

## 설치

\`\`\`bash
# macOS (Homebrew)
brew install ripgrep fd fzf bat

# Debian / Ubuntu
sudo apt install ripgrep fd-find bat
# fzf는 깃 클론 설치가 셸 통합까지 해줘 편리
git clone --depth 1 https://github.com/junegunn/fzf.git ~/.fzf && ~/.fzf/install

# Arch
sudo pacman -S ripgrep fd fzf bat
\`\`\`

> Debian/Ubuntu에서는 패키지 충돌 때문에 \`fd\`가 \`fdfind\`, \`bat\`이 \`batcat\`이라는 이름으로 설치됩니다. \`alias fd=fdfind\`, \`alias bat=batcat\`를 \`~/.bashrc\`에 추가해 두면 편합니다.

---

## ripgrep (rg) — grep을 대체하는 코드 검색

\`rg\`는 디렉터리를 **재귀적으로**, \`.gitignore\`·\`.ignore\`·숨김 파일을 자동으로 제외하며 검색합니다. 그래서 별다른 옵션 없이도 코드베이스 검색에 바로 알맞습니다.

\`\`\`bash
# grep 방식: 재귀 + 줄번호 + 색상을 일일이 지정
grep -rn --color "TODO" .

# rg 방식: 이 모든 게 기본값
rg TODO
\`\`\`

자주 쓰는 옵션:

\`\`\`bash
rg "fetchUser" -t js          # JavaScript 파일만 (-t 타입)
rg "error" -i                 # 대소문자 무시
rg "config" -g "*.yaml"       # glob으로 파일 한정
rg "deprecated" -l            # 매칭된 파일 이름만
rg "handler" -A 3 -B 1        # 매칭 줄 앞 1줄, 뒤 3줄 함께
rg "v\\\\d+\\\\.\\\\d+" -o          # 매칭 부분만 출력 (정규식)
rg --hidden --no-ignore "key" # 숨김 파일·무시 파일까지 포함
\`\`\`

| 항목 | grep | ripgrep(rg) |
|---|---|---|
| 재귀 검색 | \`-r\` 필요 | 기본 |
| .gitignore 존중 | 안 함 | 자동 |
| 속도 | 보통 | 매우 빠름(병렬) |
| 파일 타입 필터 | 없음 | \`-t js\`, \`-t py\` |
| 기본 출력 | 단색 | 색상·줄번호 |

---

## fd — find를 대체하는 파일 탐색

\`find\`는 표현력은 뛰어나지만 문법이 장황합니다. \`fd\`는 가장 흔한 사용 패턴을 짧고 직관적으로 만듭니다.

\`\`\`bash
# find: 정형화된 장황한 문법
find . -type f -name "*.log"

# fd: 패턴만 적으면 됨 (부분 일치, 정규식)
fd "\\\\.log$"
fd config            # 이름에 config 포함된 항목
\`\`\`

자주 쓰는 옵션:

\`\`\`bash
fd -e log               # 확장자 log (-e)
fd -t f report         # 파일만 (-t f), 디렉터리는 -t d
fd -H secret            # 숨김 파일 포함 (-H)
fd -I node_modules      # .gitignore 무시하고 포함 (-I)
fd pattern src/         # 특정 디렉터리에서
fd -e tmp -x rm {}      # 매칭마다 명령 실행 (-x, find의 -exec 대응)
\`\`\`

| 항목 | find | fd |
|---|---|---|
| 기본 문법 | \`-name\`, \`-type\` 명시 | 패턴만 |
| 매칭 | 정확/glob | 부분 일치·정규식 |
| .gitignore | 무시 안 함 | 자동 존중 |
| 출력 | 단색 | 색상 구분 |
| 명령 실행 | \`-exec ... \\;\` | \`-x\` / \`-X\` |

---

## bat — cat을 대체하는 파일 뷰어

\`bat\`은 \`cat\`처럼 파일을 출력하되 **문법 강조, 줄 번호, Git 변경 표시**를 더합니다. 출력이 화면보다 길면 자동으로 페이저(less)에 연결됩니다.

\`\`\`bash
bat src/app.js              # 문법 강조 + 줄번호
bat -p log.txt              # plain 모드 (장식 없이, cat처럼)
bat -A config.txt           # 공백·탭 등 비표시 문자 표시
bat -r 10:30 server.log     # 10~30번째 줄만
bat -l yaml deploy.tpl      # 언어 강제 지정
\`\`\`

파이프 안에서 색상을 강제로 유지하려면 \`--color=always\`를 씁니다.

\`\`\`bash
rg -l "TODO" | xargs bat
\`\`\`

| 항목 | cat | bat |
|---|---|---|
| 문법 강조 | 없음 | 있음 |
| 줄 번호 | \`-n\`만 | 기본 |
| Git diff 표시 | 없음 | 변경 줄 마커 |
| 페이징 | 없음 | 자동(less) |
| 스크립트용 출력 | 그대로 | \`-p\`로 동일하게 |

> \`bat\`은 사람이 읽기 좋은 도구입니다. 스크립트나 파이프에서 순수 텍스트가 필요하면 \`-p\`(plain) 또는 그냥 \`cat\`을 쓰세요. 장식 문자가 섞이면 후속 처리가 깨질 수 있습니다.

---

## fzf — 대화형 퍼지 파인더

\`fzf\`는 위 도구들과 성격이 다릅니다. **표준 입력으로 받은 목록을 대화형으로 좁혀가며(fuzzy) 선택**하게 해 주는 만능 필터입니다. 다른 명령의 출력을 받아 결합할 때 진가를 발휘합니다.

\`\`\`bash
# 파일을 골라 vim으로 열기
vim $(fzf)

# fd 결과를 fzf로 고르고 bat으로 미리보기
fd -t f | fzf --preview 'bat --color=always {}'

# git 브랜치 대화형 선택 후 체크아웃
git branch | fzf | xargs git checkout

# 프로세스 선택해서 종료
ps -ef | fzf | awk '{print $2}' | xargs kill
\`\`\`

타이핑하면 부분 문자열이 흩어져 있어도 매칭되고, 방향키로 후보를 고른 뒤 Enter로 선택합니다.

---

## 셸 통합 — 진짜 속도가 나는 부분

\`fzf\`는 설치 스크립트가 셸 키바인딩과 자동완성을 등록해 줍니다. \`~/.bashrc\` 또는 \`~/.zshrc\`에 다음을 추가합니다.

\`\`\`bash
# bash
[ -f ~/.fzf.bash ] && source ~/.fzf.bash
# zsh
[ -f ~/.fzf.zsh ] && source ~/.fzf.zsh
\`\`\`

그러면 다음 키바인딩이 활성화됩니다.

| 키 | 동작 |
|---|---|
| \`Ctrl-R\` | 명령 히스토리를 퍼지 검색 |
| \`Ctrl-T\` | 현재 디렉터리 파일을 골라 명령줄에 삽입 |
| \`Alt-C\` | 하위 디렉터리로 퍼지 \`cd\` |

\`fzf\`의 파일 탐색 백엔드를 \`fd\`로 바꾸면 더 빠르고 \`.gitignore\`도 존중합니다.

\`\`\`bash
export FZF_DEFAULT_COMMAND='fd --type f --hidden --exclude .git'
export FZF_CTRL_T_COMMAND="$FZF_DEFAULT_COMMAND"
export FZF_DEFAULT_OPTS="--height 40% --reverse --border"
\`\`\`

자주 쓰는 함수 별칭 예:

\`\`\`bash
# 코드에서 검색어를 입력하며 실시간으로 rg + 미리보기
rgf() {
  rg --line-number --no-heading --color=always "\${1:-}" |
    fzf --ansi --preview 'bat --color=always {1} --highlight-line {2}'
}
\`\`\`

---

## 함께 쓰는 워크플로우 예

\`\`\`bash
# 1) "deprecated"가 들어간 파일을 찾아, 골라서, 강조 출력으로 확인
rg -l deprecated | fzf --preview 'bat --color=always {}'

# 2) 로그 디렉터리에서 .log 파일을 골라 마지막 부분만 보기
fd -e log /var/log | fzf | xargs tail -n 50

# 3) 함수 정의를 검색해 위치로 점프 (에디터 연동)
rg "function " -n | fzf
\`\`\`

---

## 정리

| 도구 | 대체 대상 | 한 줄 요약 |
|---|---|---|
| \`rg\` | grep | 빠르고 .gitignore를 아는 재귀 검색 |
| \`fd\` | find | 패턴만 적으면 되는 직관적 파일 탐색 |
| \`bat\` | cat | 문법 강조·줄번호·Git 표시 뷰어 |
| \`fzf\` | — | 모든 목록을 대화형으로 좁히는 퍼지 파인더 |

이 네 도구는 각각도 유용하지만, \`rg | fzf --preview bat\`처럼 **파이프로 조합할 때** 가장 강력합니다. 고전 도구를 버릴 필요는 없습니다. 스크립트의 호환성·이식성이 중요하면 \`grep\`/\`find\`/\`cat\`을, 사람이 직접 탐색하는 일상 작업에는 현대 도구를 쓰는 식으로 역할을 나누면 됩니다.`
  },

  // ── 클라우드 ──────────────────────────────────────────
  {
    title: 'AWS Route 53 — DNS·라우팅 정책·헬스체크 완전 가이드',
    slug: 'aws-route53-dns-routing-guide',
    summary: 'AWS Route 53의 호스팅 영역과 레코드 타입, 그리고 simple·weighted·latency·failover·geolocation 라우팅 정책을 헬스체크와 함께 설명합니다. AWS CLI로 레코드를 관리하고 장애 조치·트래픽 분산을 구성하는 실전 가이드입니다.',
    category: '클라우드',
    tags: ['aws', 'route53', 'dns', 'routing-policy', 'health-check'],
    difficulty: 'intermediate',
    os_compat: ['linux'],
    author: 'SecuThive',
    content: `## AWS Route 53 란?

**Route 53**은 AWS의 관리형 DNS 서비스입니다. 도메인 이름을 IP나 AWS 리소스로 변환해 주는 일반 DNS 기능에 더해, **트래픽 라우팅 정책**과 **헬스체크 기반 장애 조치(failover)** 를 제공한다는 점이 특징입니다. 이름의 53은 DNS가 사용하는 UDP/TCP 포트 번호에서 따온 것입니다.

이 가이드는 AWS 환경에서 DNS를 운영하는 관점에 집중합니다. 클라이언트에서 \`dig\`로 레코드를 조회하는 방법이나 Cloudflare DNS 설정과는 별개로, **Route 53 고유의 라우팅 정책·헬스체크**를 어떻게 설계·구성하는지를 다룹니다.

---

## 핵심 구성 요소

| 요소 | 설명 |
|---|---|
| **호스팅 영역(Hosted Zone)** | 한 도메인(예: example.com)의 레코드 모음 |
| **퍼블릭 호스팅 영역** | 인터넷에 공개된 DNS |
| **프라이빗 호스팅 영역** | 특정 VPC 내부에서만 해석되는 DNS |
| **레코드(Record)** | A, AAAA, CNAME, MX 등 실제 DNS 항목 |
| **Alias 레코드** | AWS 리소스(ELB, CloudFront, S3 등)를 가리키는 Route 53 전용 레코드 |
| **헬스체크** | 엔드포인트 상태를 주기적으로 점검 |
| **라우팅 정책** | 같은 이름의 여러 레코드 중 어떤 응답을 줄지 결정 |

---

## 호스팅 영역 생성

\`\`\`bash
# 퍼블릭 호스팅 영역 생성
aws route53 create-hosted-zone \\
  --name example.com \\
  --caller-reference "$(date +%s)"
\`\`\`

생성하면 Route 53이 네임서버(NS) 4개를 할당합니다. 도메인 등록 기관(레지스트라)의 NS를 이 값으로 바꿔야 위임이 완성됩니다.

\`\`\`bash
# 할당된 네임서버 확인
aws route53 get-hosted-zone --id Z123456ABCDEFG \\
  --query 'DelegationSet.NameServers'
\`\`\`

---

## 레코드 타입

| 타입 | 용도 |
|---|---|
| **A** | 도메인 → IPv4 |
| **AAAA** | 도메인 → IPv6 |
| **CNAME** | 도메인 → 다른 도메인(별칭). 루트(zone apex)에는 불가 |
| **Alias** | AWS 리소스 지정. 루트에도 사용 가능, 조회 비용 없음 |
| **MX** | 메일 서버 |
| **TXT** | SPF·도메인 인증 등 텍스트 |
| **NS** | 하위 영역 위임 |
| **SRV** | 서비스 위치 |

> 루트 도메인(\`example.com\`)을 ELB나 CloudFront에 연결할 때 \`CNAME\`은 사용할 수 없습니다. 이때 Route 53의 **Alias** 레코드를 쓰면 zone apex에서도 AWS 리소스를 가리킬 수 있고 추가 조회 요금도 들지 않습니다.

---

## CLI로 레코드 변경

Route 53의 레코드 변경은 JSON 변경 배치를 \`change-resource-record-sets\`에 전달하는 방식입니다.

\`\`\`bash
# change-batch.json
cat > change-batch.json <<'JSON'
{
  "Comment": "웹 서버 A 레코드 추가",
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "www.example.com",
        "Type": "A",
        "TTL": 300,
        "ResourceRecords": [{ "Value": "203.0.113.10" }]
      }
    }
  ]
}
JSON

aws route53 change-resource-record-sets \\
  --hosted-zone-id Z123456ABCDEFG \\
  --change-batch file://change-batch.json
\`\`\`

\`Action\`은 \`CREATE\`, \`DELETE\`, \`UPSERT\`(있으면 갱신, 없으면 생성)를 지원합니다. \`UPSERT\`가 멱등성 측면에서 가장 안전합니다.

---

## 헬스체크

라우팅 정책 중 일부는 헬스체크와 결합해 동작합니다. 엔드포인트가 정상일 때만 해당 레코드를 응답에 포함시킵니다.

\`\`\`bash
aws route53 create-health-check \\
  --caller-reference "$(date +%s)" \\
  --health-check-config '{
    "Type": "HTTPS",
    "FullyQualifiedDomainName": "www.example.com",
    "Port": 443,
    "ResourcePath": "/health",
    "RequestInterval": 30,
    "FailureThreshold": 3
  }'
\`\`\`

| 설정 | 의미 |
|---|---|
| \`Type\` | HTTP / HTTPS / TCP / 문자열 매칭 등 |
| \`ResourcePath\` | 점검할 경로(예: \`/health\`) |
| \`RequestInterval\` | 점검 주기(초). 10 또는 30 |
| \`FailureThreshold\` | 연속 N회 실패 시 비정상 판정 |

> 헬스체크는 전 세계 다수 지점에서 수행됩니다. 방화벽/보안그룹에서 Route 53 헬스체커의 IP 대역과 점검 경로(\`/health\`)를 허용해야 정상으로 인식됩니다.

---

## 라우팅 정책

같은 이름·타입의 레코드를 여러 개 두고, **어느 응답을 반환할지** 정하는 규칙입니다. Route 53의 핵심 기능입니다.

### 1) Simple (단순)

가장 기본. 레코드 하나에 값을 지정하고 그대로 응답합니다. 값이 여러 개면 무작위로 섞어 반환합니다(라우팅 제어 없음).

### 2) Weighted (가중치)

여러 엔드포인트에 **비율**로 트래픽을 분산합니다. A/B 테스트나 점진적 배포(canary)에 적합합니다.

\`\`\`json
{
  "Action": "UPSERT",
  "ResourceRecordSet": {
    "Name": "app.example.com", "Type": "A", "TTL": 60,
    "SetIdentifier": "v2-canary",
    "Weight": 10,
    "ResourceRecords": [{ "Value": "203.0.113.20" }]
  }
}
\`\`\`

\`Weight\`가 90인 레코드와 10인 레코드를 두면 약 9:1로 분산됩니다. \`SetIdentifier\`로 같은 이름의 레코드들을 구분합니다.

### 3) Latency (지연 시간 기반)

여러 AWS 리전에 리소스가 있을 때, **사용자에게 가장 지연이 낮은 리전**으로 보냅니다. \`Region\` 속성을 지정합니다.

\`\`\`json
{
  "Name": "api.example.com", "Type": "A", "TTL": 60,
  "SetIdentifier": "seoul",
  "Region": "ap-northeast-2",
  "ResourceRecords": [{ "Value": "203.0.113.30" }]
}
\`\`\`

### 4) Failover (장애 조치)

**Primary/Secondary** 두 레코드를 두고, 헬스체크가 정상이면 Primary로, 비정상이면 Secondary로 응답합니다. 액티브-스탠바이 구성에 씁니다.

\`\`\`json
{
  "Name": "www.example.com", "Type": "A", "TTL": 60,
  "SetIdentifier": "primary",
  "Failover": "PRIMARY",
  "HealthCheckId": "abcd-1234-health",
  "ResourceRecords": [{ "Value": "203.0.113.10" }]
}
\`\`\`

> Failover의 Primary 레코드에는 **반드시 헬스체크를 연결**해야 합니다. 헬스체크가 없으면 Route 53은 Primary를 항상 정상으로 간주해 절대 Secondary로 넘어가지 않습니다.

### 5) Geolocation (지리적 위치)

**사용자의 위치(대륙/국가/지역)** 에 따라 다른 응답을 줍니다. 콘텐츠 현지화나 규제 준수에 사용합니다.

\`\`\`json
{
  "Name": "www.example.com", "Type": "A", "TTL": 60,
  "SetIdentifier": "korea",
  "GeoLocation": { "CountryCode": "KR" },
  "ResourceRecords": [{ "Value": "203.0.113.40" }]
}
\`\`\`

> Geolocation을 쓸 때는 어떤 지역에도 매칭되지 않는 사용자를 위한 **기본 레코드(\`"CountryCode": "*"\`)** 를 반드시 만들어 두세요. 없으면 매칭 안 되는 사용자에게 응답이 없습니다.

### 정책 비교

| 정책 | 결정 기준 | 헬스체크 | 대표 용도 |
|---|---|---|---|
| Simple | 없음 | 선택 | 단일 엔드포인트 |
| Weighted | 가중치 비율 | 선택 | A/B, 카나리 배포 |
| Latency | 최저 지연 리전 | 선택 | 멀티 리전 성능 |
| Failover | Primary 상태 | **필수** | 액티브-스탠바이 |
| Geolocation | 사용자 위치 | 선택 | 현지화·규제 |
| Geoproximity | 위치 + 편향(bias) | 선택 | 지역 트래픽 미세 조정 |
| Multivalue | 정상 레코드 무작위 반환 | 선택 | 단순 분산 + 상태 점검 |

---

## TTL 설계 팁

| 상황 | 권장 TTL |
|---|---|
| 자주 바뀌지 않는 레코드 | 3600초 이상 |
| Failover / Weighted 등 변경 잦음 | 60초 내외 |
| 마이그레이션 직전 | 미리 낮춰두기(예: 60초) |

> Alias 레코드는 TTL을 직접 설정하지 않습니다. 대상 AWS 리소스의 TTL을 따릅니다.

---

## 정리

| 항목 | 핵심 |
|---|---|
| 호스팅 영역 | 도메인별 레코드 모음, 퍼블릭/프라이빗 |
| Alias | zone apex에서 AWS 리소스 지정, 조회 비용 없음 |
| 레코드 변경 | \`change-resource-record-sets\` + UPSERT |
| 헬스체크 | 경로·주기·임계치 지정, Failover의 전제 |
| Weighted | 비율 분산(카나리/AB) |
| Latency | 최저 지연 리전 선택 |
| Failover | Primary 헬스체크 기반 장애 조치 |
| Geolocation | 사용자 위치 기반 + 기본(\`*\`) 레코드 필수 |

Route 53의 진짜 가치는 단순 DNS가 아니라 **라우팅 정책과 헬스체크의 조합**에 있습니다. 멀티 리전 서비스라면 Latency + Failover를, 점진적 배포라면 Weighted를 적용해 가용성과 사용자 경험을 동시에 끌어올릴 수 있습니다.`
  },
];

async function insertGuides() {
  let success = 0, skipped = 0, failed = 0;
  for (const guide of guides) {
    const { error } = await supabase
      .from('engineer_guides')
      .upsert(guide, { onConflict: 'slug', ignoreDuplicates: true });
    if (error?.code === '23505') { console.log(`⏭  SKIP  ${guide.slug}`); skipped++; }
    else if (error) { console.error(`✗ FAIL  ${guide.slug}:`, error.message); failed++; }
    else { console.log(`✓ OK    ${guide.slug}`); success++; }
  }
  console.log(`\n완료: ${success}개 삽입, ${skipped}개 중복, ${failed}개 실패`);
}

insertGuides();
