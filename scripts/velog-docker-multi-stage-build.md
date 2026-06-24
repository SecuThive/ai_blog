---
title: "Docker 멀티스테이지 빌드 — 이미지 크기 최소화"
tags: ["docker", "dockerfile", "멀티스테이지", "이미지최적화"]
---

> 이 글은 **[Nodelog](https://www.thivelab.com/engineer/docker-multi-stage-build)** 에 게재된 엔지니어 가이드입니다.

## 멀티스테이지 빌드란?

하나의 Dockerfile에서 여러 `FROM`을 사용해 빌드 도구는 첫 스테이지에서만 쓰고, 최종 이미지에는 실행에 필요한 결과물만 복사하는 방법입니다.

**일반 빌드**: 빌드 도구 + 소스코드 + 결과물 → 이미지 크기 큼
**멀티스테이지**: 결과물만 복사 → 이미지 크기 최소화

---

## Node.js 예제

```dockerfile
# ── Stage 1: 의존성 설치 + 빌드 ──────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# ── Stage 2: 실행 이미지 ──────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# 빌드 결과물만 복사
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# 비루트 사용자
RUN addgroup -S app && adduser -S app -G app
USER app

EXPOSE 3000
CMD ["node", "dist/server.js"]
```

---

## Go 예제 (정적 바이너리)

```dockerfile
# ── Stage 1: 빌드 ────────────────────────────────
FROM golang:1.22-alpine AS builder
WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o server ./cmd/server

# ── Stage 2: scratch (최소 이미지) ───────────────
FROM scratch
COPY --from=builder /app/server /server
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

EXPOSE 8080
ENTRYPOINT ["/server"]
```

> **scratch** 이미지: OS 없이 바이너리만 포함, 수 MB 수준

---

## Java / Spring Boot 예제

```dockerfile
FROM eclipse-temurin:21-jdk AS builder
WORKDIR /app
COPY . .
RUN ./gradlew bootJar --no-daemon

FROM eclipse-temurin:21-jre AS runner
WORKDIR /app
COPY --from=builder /app/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

---

## 특정 스테이지만 빌드

```bash
# 빌더 스테이지까지만 빌드 (디버그용)
docker build --target builder -t myapp:builder .

# 최종 이미지
docker build -t myapp:latest .
```

---

## BuildKit 캐시 최적화

```dockerfile
# syntax=docker/dockerfile:1
FROM node:20-alpine AS builder
WORKDIR /app

# 패키지만 먼저 복사 → 소스 변경 시 캐시 재사용
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci

COPY . .
RUN npm run build
```

```bash
# BuildKit 활성화 후 빌드
DOCKER_BUILDKIT=1 docker build -t myapp .
```

---

## 이미지 크기 비교 팁

```bash
# 이미지 크기 확인
docker images myapp

# 레이어별 크기 분석
docker history myapp:latest

# dive 도구로 레이어 분석
docker run --rm -it \
  -v /var/run/docker.sock:/var/run/docker.sock \
  wagoodman/dive myapp:latest
```

---

> 📌 더 많은 실전 가이드는 **[thivelab.com/engineer](https://www.thivelab.com/engineer)** 에서 확인하세요.