-- ============================================================
-- engineer_guides table
-- 엔지니어 가이드 (Linux, Docker, Git, 네트워킹, OS, 보안, 클라우드, DB)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.engineer_guides (
  id          BIGSERIAL PRIMARY KEY,
  title       TEXT        NOT NULL,
  slug        TEXT        NOT NULL UNIQUE,
  summary     TEXT        DEFAULT '',
  content     TEXT        NOT NULL DEFAULT '',
  category    TEXT        NOT NULL,
  tags        TEXT[]      DEFAULT '{}',
  difficulty  TEXT        DEFAULT 'beginner'
              CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  os_compat   TEXT[]      DEFAULT '{}',   -- e.g. ['ubuntu', 'centos', 'macos']
  author      TEXT        DEFAULT 'SecuThive',
  views       INTEGER     DEFAULT 0,
  status      TEXT        DEFAULT 'published'
              CHECK (status IN ('draft', 'published')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Row-level security
ALTER TABLE public.engineer_guides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_public_read" ON public.engineer_guides
  FOR SELECT USING (status = 'published');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_eng_guides_slug       ON public.engineer_guides (slug);
CREATE INDEX IF NOT EXISTS idx_eng_guides_category   ON public.engineer_guides (category);
CREATE INDEX IF NOT EXISTS idx_eng_guides_status     ON public.engineer_guides (status);
CREATE INDEX IF NOT EXISTS idx_eng_guides_created_at ON public.engineer_guides (created_at DESC);

-- ============================================================
-- Sample seed data (Linux / Shell)
-- ============================================================

INSERT INTO public.engineer_guides (title, slug, summary, content, category, tags, difficulty, os_compat, author)
VALUES (
  'Linux 필수 명령어 100선',
  'linux-essential-commands',
  '실무에서 매일 쓰는 리눅스 명령어를 카테고리별로 정리했습니다. 파일 조작부터 프로세스 관리까지.',
  E'## 파일 및 디렉터리 조작\n\n### ls — 목록 보기\n\n```bash\nls -lah          # 숨김 포함, 사람이 읽기 좋은 크기로 목록 출력\nls -lt           # 수정 시간 최신순 정렬\n```\n\n### cp / mv / rm\n\n```bash\ncp -r src/ dest/          # 디렉터리 재귀 복사\nmv old.txt new.txt        # 이름 변경 또는 이동\nrm -rf dir/               # 디렉터리 강제 삭제 (주의)\n```\n\n### find — 파일 검색\n\n```bash\nfind /var/log -name "*.log" -mtime -7   # 7일 이내 수정된 .log\nfind . -type f -size +100M              # 100MB 초과 파일\nfind . -name "*.sh" -exec chmod +x {} \\;\n```\n\n---\n\n## 텍스트 처리\n\n### grep\n\n```bash\ngrep -rn "ERROR" /var/log/   # 재귀·행 번호 포함\ngrep -v "DEBUG" app.log      # DEBUG 제외\ngrep -E "error|warn" app.log # 정규식 OR\n```\n\n### awk\n\n```bash\nawk ''{print $1, $3}'' access.log          # 1·3번째 컬럼 출력\nawk -F: ''{print $1}'' /etc/passwd         # 구분자 : 로 사용\nawk ''NR>5{print}'' file.txt               # 5행 이후만 출력\n```\n\n### sed\n\n```bash\nsed -i ''s/old/new/g'' file.txt    # 파일 내 치환 (in-place)\nsed -n ''10,20p'' file.txt         # 10~20행만 출력\nsed ''/^#/d'' config.conf          # 주석 행 삭제\n```\n\n---\n\n## 프로세스 관리\n\n```bash\nps aux | grep nginx          # 프로세스 확인\ntop -c                       # CPU/메모리 실시간 (명령어 전체 표시)\nhtop                         # 인터랙티브 뷰어\nkill -9 PID                  # 강제 종료\npkill -f "python app.py"     # 이름으로 종료\nnohup ./script.sh &          # 백그라운드 + 터미널 종료 후에도 유지\n```\n\n---\n\n## 권한 관리\n\n```bash\nchmod 755 script.sh          # rwxr-xr-x\nchown user:group file.txt    # 소유자 변경\numask 022                    # 기본 권한 마스크\nsudo -u www-data bash        # 다른 사용자로 셸 실행\n```\n\n---\n\n## 디스크 / 메모리\n\n```bash\ndf -h                        # 디스크 사용량\ndu -sh /var/*                # 디렉터리별 크기\nfree -h                      # 메모리 현황\niostat -xz 1                 # I/O 통계 (1초 간격)\n```',
  'Linux / Shell',
  ARRAY['linux', 'shell', 'bash', '명령어', '레퍼런스'],
  'beginner',
  ARRAY['ubuntu', 'centos', 'debian', 'macos'],
  'SecuThive'
),
(
  'SSH 보안 강화 설정 완전 가이드',
  'ssh-hardening-guide',
  '기본 설치된 SSH 서버의 보안 취약점을 제거하고, 키 기반 인증과 접근 제어를 설정하는 방법.',
  E'## 기본 SSH 보안 점검\n\nSSH 서버의 기본 설정은 편의성 위주라 보안 위험이 존재합니다.\n\n```bash\nsudo sshd -T | grep -E "permitrootlogin|passwordauthentication|port"\n```\n\n---\n\n## /etc/ssh/sshd_config 핵심 설정\n\n```bash\n# 포트 변경 (기본 22 → 사용자 지정)\nPort 2222\n\n# root 직접 로그인 차단\nPermitRootLogin no\n\n# 패스워드 인증 비활성화 (키 설정 후 진행)\nPasswordAuthentication no\nChallengeResponseAuthentication no\n\n# 빈 패스워드 허용 금지\nPermitEmptyPasswords no\n\n# 인증 시도 횟수 제한\nMaxAuthTries 3\n\n# 로그인 시간 제한 (30초)\nLoginGraceTime 30\n\n# 특정 사용자만 허용\nAllowUsers deploy admin\n\n# X11 포워딩 비활성화\nX11Forwarding no\n```\n\n적용:\n\n```bash\nsudo systemctl reload sshd\n```\n\n---\n\n## SSH 키 기반 인증 설정\n\n**클라이언트 측 (내 PC)**\n\n```bash\nssh-keygen -t ed25519 -C "deploy@myserver"\n# 생성된 공개키 확인\ncat ~/.ssh/id_ed25519.pub\n```\n\n**서버 측**\n\n```bash\nmkdir -p ~/.ssh\nchmod 700 ~/.ssh\necho "공개키_내용" >> ~/.ssh/authorized_keys\nchmod 600 ~/.ssh/authorized_keys\n```\n\n---\n\n## Fail2Ban으로 무작위 대입 공격 차단\n\n```bash\nsudo apt install fail2ban\n\n# /etc/fail2ban/jail.local\n[sshd]\nenabled  = true\nport     = 2222\nfindtime = 600\nmaxretry = 3\nbantime  = 3600\n```\n\n```bash\nsudo systemctl enable --now fail2ban\nsudo fail2ban-client status sshd   # 상태 확인\n```\n\n---\n\n## UFW 방화벽 연동\n\n```bash\nsudo ufw allow 2222/tcp\nsudo ufw enable\nsudo ufw status verbose\n```',
  '보안 설정',
  ARRAY['ssh', 'security', '보안', '서버', 'fail2ban', 'ufw'],
  'intermediate',
  ARRAY['ubuntu', 'debian', 'centos'],
  'SecuThive'
),
(
  'Docker 컴포즈로 개발 환경 구축하기',
  'docker-compose-dev-environment',
  'Docker Compose를 사용해 일관된 개발 환경을 구성하는 실전 패턴. 볼륨, 네트워크, 환경변수 관리까지.',
  E'## Docker Compose 기본 구조\n\n```yaml\n# docker-compose.yml\nversion: "3.9"\n\nservices:\n  app:\n    build:\n      context: .\n      dockerfile: Dockerfile.dev\n    ports:\n      - "3000:3000"\n    volumes:\n      - .:/app\n      - /app/node_modules   # 컨테이너 node_modules 보호\n    environment:\n      - NODE_ENV=development\n    depends_on:\n      db:\n        condition: service_healthy\n\n  db:\n    image: postgres:16-alpine\n    environment:\n      POSTGRES_USER: dev\n      POSTGRES_PASSWORD: devpass\n      POSTGRES_DB: myapp\n    volumes:\n      - pg_data:/var/lib/postgresql/data\n    healthcheck:\n      test: ["CMD-SHELL", "pg_isready -U dev"]\n      interval: 5s\n      timeout: 3s\n      retries: 5\n\n  redis:\n    image: redis:7-alpine\n    command: redis-server --save 60 1\n\nvolumes:\n  pg_data:\n```\n\n---\n\n## 자주 쓰는 Compose 명령어\n\n```bash\ndocker compose up -d              # 백그라운드 실행\ndocker compose up --build         # 이미지 재빌드 후 실행\ndocker compose down -v            # 컨테이너 + 볼륨 삭제\ndocker compose logs -f app        # 특정 서비스 로그 팔로우\ndocker compose exec app bash      # 컨테이너 셸 접속\ndocker compose ps                 # 서비스 상태 확인\n```\n\n---\n\n## 환경변수 파일 분리\n\n```bash\n# .env (git 제외)\nDB_PASSWORD=secretpass\nAPI_KEY=abc123\n\n# docker-compose.yml\nservices:\n  app:\n    env_file:\n      - .env\n```\n\n---\n\n## 개발/프로덕션 설정 분리\n\n```bash\n# docker-compose.override.yml (개발용, git 제외 가능)\nservices:\n  app:\n    volumes:\n      - .:/app\n    command: npm run dev\n```\n\n```bash\ndocker compose -f docker-compose.yml -f docker-compose.prod.yml up -d\n```',
  'Docker / 컨테이너',
  ARRAY['docker', 'compose', '개발환경', 'container'],
  'beginner',
  ARRAY['ubuntu', 'macos', 'windows'],
  'SecuThive'
);
