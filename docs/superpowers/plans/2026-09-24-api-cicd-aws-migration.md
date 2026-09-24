# API CI/CD 리팩토링 및 AWS EC2 이전 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `main` push 시 lint/test/build를 통과한 커밋만 AWS EC2(`/opt/connectgnu/api`)에 배포되고, 배포 후 app이 healthy가 아니면 워크플로가 실패하도록 GitHub Actions를 재구성한다.

**Architecture:** `api-ci.yml`을 `workflow_call`로 재사용 가능하게 만들고, `api-cd.yml`이 `ci → build-and-push → deploy` 순서로 호출한다. 배포는 SSH(appleboy scp/ssh)로 compose 파일과 `nginx/prod.conf`만 동기화한 뒤 서버에서 `docker compose`로 app을 교체하고 헬스체크 대기 → nginx 설정 검사/reload 순으로 진행한다. nginx는 디렉터리 마운트로 바꿔 scp로 교체된 설정이 reload로 반영되게 한다.

**Tech Stack:** GitHub Actions, Docker Compose v2 plugin, DockerHub, nginx 1.29.5-alpine, pnpm 9.9.0, Node 24, NestJS

**Spec:** `docs/superpowers/specs/2026-09-24-api-cicd-aws-migration-design.md`

**Branch:** `chore/api-cicd-aws` (dev에서 분기)

## Global Constraints

- 배포 경로: `/opt/connectgnu/api` (워크플로 `env.DEPLOY_DIR`)
- 서버 사용자: `ec2-user`, `sudo` 사용 금지 (`docker` 그룹 소속 전제)
- compose 명령은 `docker compose`(v2 플러그인). `docker-compose` 금지
- 서버로 동기화하는 파일은 `services/api/docker-compose.yml`, `services/api/nginx/prod.conf` 두 개뿐. `letsencrypt/`, `nginx/dev.conf`, `.env`는 절대 건드리지 않는다
- 로깅은 모든 서비스에 `json-file`, `max-size: "10m"`, `max-file: "3"` 블록을 서비스별로 명시 (이미 적용됨, 유지)
- app `healthcheck`와 nginx `depends_on: app`은 유지 (배포 헬스 대기가 healthcheck에 의존)
- 이미지: `dongho18/connect-gnu-node` (compose 하드코딩). CD의 `${DOCKER_USERNAME}/${DOCKER_IMAGE_NAME}`와 같아야 한다
- 빌드 아키텍처: amd64 (`ubuntu-latest`). t3.micro
- 액션 버전: `actions/checkout@v7`, `actions/setup-node@v7`, `pnpm/action-setup@v6`, `docker/setup-buildx-action@v4`, `docker/login-action@v4`, `docker/build-push-action@v7`, `appleboy/scp-action@v1.0.0`, `appleboy/ssh-action@v1.2.5`
- `appleboy/ssh-action` v1.2.x에는 `script_stop`이 없다. 스크립트 첫 줄 `set -euo pipefail`로 실패 시 중단
- 커밋 메시지 규칙: 저장소 관례(gitmoji + 한글, 예: `👷 ci: ...`, `🔧 chore: ...`), 끝에 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`
- 범위 밖: batch/monitoring, 자동 롤백, SHA 태그 배포(Quire #11), OIDC/SSM, CloudWatch

## Review Focus

1. **app 컨테이너에 healthcheck가 없음** → `docker inspect`의 `.State.Health`가 없어 템플릿 에러로 로그 없이 종료되면 안 된다. `none`으로 판별해 즉시 로그 출력 후 실패해야 한다. (Task 4 Step 2 시뮬레이션의 `none` 케이스)
2. **app이 unhealthy로 전환** → 90초를 다 기다리지 말고 즉시 로그 출력 후 exit 1, nginx reload와 prune은 실행되지 않아야 한다. (Task 4 Step 2 `unhealthy` 케이스)
3. **nginx 컨테이너가 방금 재생성됨** (첫 배포 시 볼륨 변경으로 recreate) → master 프로세스가 뜨기 전 `nginx -s reload`가 pid 파일 없음으로 실패할 수 있다. 재시도 후에도 실패하면 명시적으로 실패해야 한다. (Task 4 Step 2 스크립트의 reload 재시도 루프, Task 2 Step 2 검증)
4. **서버 `nginx/` 디렉터리에 `prod.conf` 외 `.conf`가 있음** (예: 저장소처럼 `dev.conf`가 섞임) → 디렉터리 마운트 시 server 블록이 중복된다. 동기화 대상은 `prod.conf`만이어야 한다. (Task 2 Step 2에서 prod.conf만 담은 디렉터리로 `nginx -t` 검증, Task 4 scp `source` 확인)
5. **`workflow_call`로 호출된 CI의 concurrency 그룹이 CD 그룹과 충돌** → 교착/취소가 없어야 한다. CI 그룹은 `api-ci-` 접두어 + 호출자 워크플로 이름, CD는 `api-cd-` 접두어. (Task 1 Step 3, Task 3 Step 3의 actionlint 및 그룹 문자열 확인)

---

## File Map

| 파일 | 역할 | Task |
|---|---|---|
| `.github/workflows/api-ci.yml` | PR 검증 + CD에서 재사용되는 CI (lint/test/build) | 1 |
| `services/api/docker-compose.yml` | 운영 compose. nginx 볼륨을 디렉터리 마운트로 변경 | 2 |
| `.github/workflows/api-cd.yml` | CI 게이트 → 이미지 빌드/푸시 → EC2 배포 | 3, 4 |

---

### Task 1: CI를 재사용 워크플로로 전환

Quire: [#17](https://quire.io/w/jt27208/17) (태스크 #32, #33, #34)

**Files:**
- Modify: `.github/workflows/api-ci.yml` (전체 교체)

**Interfaces:**
- Consumes: 없음
- Produces: `workflow_call` 트리거가 있는 재사용 워크플로 `./.github/workflows/api-ci.yml`. 입력/시크릿 없음. job 이름 `verify`. Task 3이 `uses: ./.github/workflows/api-ci.yml`로 호출한다.

- [ ] **Step 1: 현재 워크플로가 lint를 통과하는지 기준선 확인**

Run:
```bash
cd /Users/dongho/Desktop/Github/Server-Node
docker run --rm -v "$PWD":/repo -w /repo rhysd/actionlint:latest -color .github/workflows/api-ci.yml
```
Expected: 출력 없이 exit 0 (기존 파일 기준선). 에러가 나오면 기록해 두고 Step 2에서 함께 해소한다.

- [ ] **Step 2: `api-ci.yml` 전체 교체**

```yaml
name: API CI

on:
  pull_request:
    branches:
      - main
      - dev
    paths:
      - 'services/api/app/**'
      - '.github/workflows/api-ci.yml'

  workflow_call:

  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: api-ci-${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  verify:
    name: Lint, Test and Build
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: services/api/app

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v7

      - name: Set up pnpm
        uses: pnpm/action-setup@v6
        with:
          package_json_file: services/api/app/package.json

      - name: Set up Node.js
        uses: actions/setup-node@v7
        with:
          node-version: 24
          cache: pnpm
          cache-dependency-path: services/api/app/pnpm-lock.yaml

      - name: Install Dependencies
        run: pnpm install --frozen-lockfile

      - name: Run Lint
        run: pnpm lint:check

      - name: Run Tests
        run: pnpm test

      - name: Build
        run: pnpm build
```

변경 이유:
- `pnpm/action-setup`은 `version: 9.9.0` 대신 `package_json_file`로 app의 `packageManager`(`pnpm@9.9.0+sha512...`)를 읽는다. 버전 정의를 한 곳으로 모은다.
- `workflow_call`로 호출되면 `github.workflow`는 호출자 이름(`API CD`)이 되어 그룹이 `api-ci-API CD-refs/heads/main`이 된다. CD의 `api-cd-...` 그룹과 겹치지 않는다.

- [ ] **Step 3: actionlint 통과 확인**

Run:
```bash
docker run --rm -v "$PWD":/repo -w /repo rhysd/actionlint:latest -color .github/workflows/api-ci.yml
```
Expected: 출력 없이 exit 0

- [ ] **Step 4: CI 명령이 로컬에서 통과하는지 확인**

Run:
```bash
cd services/api/app && pnpm install --frozen-lockfile && pnpm lint:check && pnpm test && pnpm build; cd -
```
Expected: 네 명령 모두 성공. 실패하면 워크플로 문제가 아니라 코드 문제이므로 원인을 보고하고 멈춘다(이 계획 범위에서 앱 코드를 고치지 않는다).

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/api-ci.yml
git commit -m "👷 ci: API CI를 재사용 워크플로로 전환하고 빌드 검증 추가

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: nginx 설정을 디렉터리 마운트로 변경

Quire: [#19](https://quire.io/w/jt27208/19) 태스크 #43 (nginx 볼륨 디렉터리 마운트)

**Files:**
- Modify: `services/api/docker-compose.yml` (nginx `volumes` 첫 줄)

**Interfaces:**
- Consumes: 없음
- Produces: nginx 컨테이너가 `/opt/connectgnu/api/nginx/` 디렉터리 전체를 `/etc/nginx/conf.d`로 읽는다. Task 4의 scp가 `nginx/prod.conf`를 교체하면 `nginx -s reload`로 반영된다.

- [ ] **Step 1: 볼륨 변경**

`services/api/docker-compose.yml`의 nginx `volumes`에서:

```yaml
      - ./nginx/prod.conf:/etc/nginx/conf.d/default.conf
```
를
```yaml
      - ./nginx:/etc/nginx/conf.d:ro
```
로 바꾼다. 다른 줄은 건드리지 않는다.

- [ ] **Step 2: prod.conf만 담은 디렉터리로 nginx 문법 검증**

서버와 같은 조건(디렉터리에 `prod.conf`만, 인증서 경로 존재, upstream `app` 해석 가능)을 로컬에 만든다. 이 검증 파일들은 스크래치 디렉터리에만 만들고 커밋하지 않는다.

Run:
```bash
T="${TMPDIR:-/tmp}/api-cicd-nginx-check"
rm -rf "$T"
mkdir -p "$T/nginx" "$T/le/live/api.connectgnu.kro.kr-0001"
cp services/api/nginx/prod.conf "$T/nginx/"
openssl req -x509 -nodes -newkey rsa:2048 -days 1 -subj "/CN=api.connectgnu.kro.kr" \
  -keyout "$T/le/live/api.connectgnu.kro.kr-0001/privkey.pem" \
  -out "$T/le/live/api.connectgnu.kro.kr-0001/fullchain.pem" 2>/dev/null
docker run --rm --add-host app:127.0.0.1 \
  -v "$T/nginx":/etc/nginx/conf.d:ro \
  -v "$T/le":/etc/letsencrypt:ro \
  nginx:1.29.5-alpine nginx -t
```
Expected: `nginx: configuration file /etc/nginx/nginx.conf test is successful`

- [ ] **Step 3: 저장소 nginx 디렉터리를 통째로 마운트하면 실패함을 확인 (Review Focus 4)**

Run (Step 2의 `$T`를 다시 지정한다. 단계마다 셸이 새로 뜰 수 있다):
```bash
T="${TMPDIR:-/tmp}/api-cicd-nginx-check"
cp services/api/nginx/dev.conf "$T/nginx/"
docker run --rm --add-host app:127.0.0.1 \
  -v "$T/nginx":/etc/nginx/conf.d:ro \
  -v "$T/le":/etc/letsencrypt:ro \
  nginx:1.29.5-alpine nginx -t; echo "exit=$?"
rm -rf "$T"
```
Expected: 에러 또는 `conflicting server name` 경고가 나온다. 이 결과는 Task 4에서 scp `source`를 `nginx/prod.conf` 단일 파일로 제한해야 하는 근거다. (에러 없이 통과하더라도 계획은 바뀌지 않는다. 결과만 기록한다.)

- [ ] **Step 4: compose 문법 검증**

Run:
```bash
docker compose -f services/api/docker-compose.yml config -q && echo OK
```
Expected: `OK`

- [ ] **Step 5: Commit**

```bash
git add services/api/docker-compose.yml
git commit -m "🔧 chore: nginx 설정을 디렉터리 마운트로 변경해 배포 시 reload 반영

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: CD에 CI 게이트 추가 및 빌드/푸시 정리

Quire: [#18](https://quire.io/w/jt27208/18) (태스크 #35, #36, #37, #38)

**Files:**
- Modify: `.github/workflows/api-cd.yml` (트리거·설정·`ci`·`build-and-push` 영역. `deploy` job은 Task 4에서 교체하므로 이 Task에서는 기존 내용을 그대로 둔다)

**Interfaces:**
- Consumes: Task 1의 `./.github/workflows/api-ci.yml` (`workflow_call`)
- Produces: job id `ci`, `build-and-push`. 워크플로 `env.DEPLOY_DIR: /opt/connectgnu/api`. Task 4의 `deploy` job은 `needs: build-and-push`와 `env.DEPLOY_DIR`을 사용한다.

- [ ] **Step 1: 기준선 actionlint**

Run:
```bash
docker run --rm -v "$PWD":/repo -w /repo rhysd/actionlint:latest -color .github/workflows/api-cd.yml
```
Expected: 결과 기록 (기존 파일 기준선)

- [ ] **Step 2: `api-cd.yml`의 `deploy` job 이전 부분을 교체**

파일 시작부터 `jobs:` 아래 `build-and-push` job 끝까지를 아래로 바꾼다. 기존 `deploy:` job 블록은 그대로 뒤에 남긴다(Task 4에서 교체).

```yaml
name: API CD

on:
  push:
    branches:
      - main
    paths:
      - 'services/api/app/src/**'
      - 'services/api/app/package.json'
      - 'services/api/app/pnpm-lock.yaml'
      - 'services/api/app/Dockerfile'
      - 'services/api/app/.dockerignore'
      - 'services/api/app/tsconfig*.json'
      - 'services/api/app/nest-cli.json'
      - 'services/api/docker-compose.yml'
      - 'services/api/nginx/**'
      - '.github/workflows/api-cd.yml'

  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: api-cd-${{ github.ref }}
  cancel-in-progress: false

env:
  DEPLOY_DIR: /opt/connectgnu/api

jobs:
  ci:
    name: CI
    uses: ./.github/workflows/api-ci.yml

  build-and-push:
    name: Build and Push Docker Image
    runs-on: ubuntu-latest
    needs: ci

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v7

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v4

      - name: Login to DockerHub
        uses: docker/login-action@v4
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build and Push Docker Image
        uses: docker/build-push-action@v7
        with:
          context: services/api/app
          target: prod
          push: true
          pull: true
          tags: |
            ${{ secrets.DOCKER_USERNAME }}/${{ secrets.DOCKER_IMAGE_NAME }}:latest
            ${{ secrets.DOCKER_USERNAME }}/${{ secrets.DOCKER_IMAGE_NAME }}:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

- [ ] **Step 3: actionlint 통과 및 concurrency 그룹 확인**

Run:
```bash
docker run --rm -v "$PWD":/repo -w /repo rhysd/actionlint:latest -color .github/workflows/api-cd.yml .github/workflows/api-ci.yml
grep -n "group:" .github/workflows/api-ci.yml .github/workflows/api-cd.yml
```
Expected: actionlint 출력 없음. `group:` 두 줄이 각각 `api-ci-${{ github.workflow }}-${{ github.ref }}`, `api-cd-${{ github.ref }}` (Review Focus 5). 기존 `deploy` job의 `appleboy` 구버전 관련 경고가 남아 있다면 Task 4에서 해소되므로 기록만 한다.

- [ ] **Step 4: prod 타깃 이미지가 로컬에서 빌드되는지 확인**

Run:
```bash
docker build --target prod -t connect-gnu-node:plan-check services/api/app && docker image rm connect-gnu-node:plan-check
```
Expected: 빌드 성공

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/api-cd.yml
git commit -m "👷 ci: API CD에 CI 게이트 추가 및 이미지 빌드 설정 정리

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: EC2 배포 job 구현

Quire: [#19](https://quire.io/w/jt27208/19) (태스크 #39, #40, #41, #42, #44)

**Files:**
- Modify: `.github/workflows/api-cd.yml` (`deploy` job 전체 교체)

**Interfaces:**
- Consumes: Task 3의 `needs: build-and-push`, `env.DEPLOY_DIR`. Task 2의 nginx 디렉터리 마운트. compose의 app `healthcheck`.
- Produces: 없음 (최종 job)

- [ ] **Step 1: 헬스 대기 로직 시뮬레이션 준비 (Review Focus 1, 2)**

배포 스크립트의 헬스 판정 부분을 로컬 Docker로 먼저 검증한다. 스크래치 디렉터리에만 만들고 커밋하지 않는다.

```bash
S="${TMPDIR:-/tmp}/api-cicd-health-sim"
rm -rf "$S" && mkdir -p "$S"
cat > "$S/health-wait.sh" <<'EOF'
set -euo pipefail
cid=$(docker compose ps -q app)
if [ -z "$cid" ]; then
  echo "app container not found"
  docker compose ps
  exit 1
fi

status=none
for _ in $(seq 1 30); do
  status=$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$cid")
  case "$status" in
    healthy|unhealthy|none) break ;;
  esac
  sleep 3
done

if [ "$status" != healthy ]; then
  echo "app health status: $status"
  docker compose logs --tail 100 app
  exit 1
fi
echo "app is healthy"
EOF

mkdir -p "$S/healthy" "$S/unhealthy" "$S/none"
cat > "$S/healthy/compose.yml" <<'EOF'
services:
  app:
    image: busybox:1.36
    command: sh -c 'touch /tmp/ok; sleep 3600'
    healthcheck:
      test: ['CMD-SHELL', 'test -f /tmp/ok']
      interval: 2s
      retries: 1
EOF
cat > "$S/unhealthy/compose.yml" <<'EOF'
services:
  app:
    image: busybox:1.36
    command: sleep 3600
    healthcheck:
      test: ['CMD-SHELL', 'false']
      interval: 2s
      retries: 1
EOF
cat > "$S/none/compose.yml" <<'EOF'
services:
  app:
    image: busybox:1.36
    command: sleep 3600
EOF
```

- [ ] **Step 2: 세 가지 케이스 실행**

Run:
```bash
S="${TMPDIR:-/tmp}/api-cicd-health-sim"
for c in healthy unhealthy none; do
  (
    cd "$S/$c"
    export COMPOSE_PROJECT_NAME="hw-$c"
    docker compose up -d >/dev/null 2>&1
    start=$(date +%s)
    bash "$S/health-wait.sh"
    echo "[$c] exit=$? elapsed=$(( $(date +%s) - start ))s"
    docker compose down -t 0 >/dev/null 2>&1
  )
done
rm -rf "$S"
```

`set -euo pipefail`은 `bash` 자식 프로세스 안에서만 적용되므로 실패 케이스에서도 바깥 루프는 계속 돈다. `COMPOSE_PROJECT_NAME`을 export해야 스크립트 안의 `docker compose ps`가 같은 프로젝트를 찾는다.

Expected:
- `[healthy] exit=0` + `app is healthy`
- `[unhealthy] exit=1` + `app health status: unhealthy`, 10초 안쪽
- `[none] exit=1` + `app health status: none`, 즉시

- [ ] **Step 3: `deploy` job 교체**

`api-cd.yml`의 기존 `deploy:` job 블록 전체를 아래로 바꾼다. 헬스 판정 부분은 Step 1에서 검증한 로직과 동일해야 한다.

```yaml
  deploy:
    name: Deploy to API Server
    runs-on: ubuntu-latest
    needs: build-and-push

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v7

      - name: Copy files to server
        uses: appleboy/scp-action@v1.0.0
        with:
          host: ${{ secrets.API_SSH_HOST }}
          username: ${{ secrets.API_SSH_USERNAME }}
          key: ${{ secrets.API_SSH_PRIVATE_KEY }}
          source: services/api/docker-compose.yml,services/api/nginx/prod.conf
          target: ${{ env.DEPLOY_DIR }}
          strip_components: 2

      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1.2.5
        with:
          host: ${{ secrets.API_SSH_HOST }}
          username: ${{ secrets.API_SSH_USERNAME }}
          key: ${{ secrets.API_SSH_PRIVATE_KEY }}
          script: |
            set -euo pipefail
            cd ${{ env.DEPLOY_DIR }}

            docker compose pull app
            docker compose up -d --no-deps app

            cid=$(docker compose ps -q app)
            if [ -z "$cid" ]; then
              echo "app container not found"
              docker compose ps
              exit 1
            fi

            status=none
            for _ in $(seq 1 30); do
              status=$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$cid")
              case "$status" in
                healthy|unhealthy|none) break ;;
              esac
              sleep 3
            done

            if [ "$status" != healthy ]; then
              echo "app health status: $status"
              docker compose logs --tail 100 app
              exit 1
            fi

            docker compose up -d --no-deps nginx
            docker compose exec -T nginx nginx -t

            reloaded=false
            for _ in 1 2 3 4 5; do
              if docker compose exec -T nginx nginx -s reload; then
                reloaded=true
                break
              fi
              sleep 2
            done
            if [ "$reloaded" != true ]; then
              echo "nginx reload failed"
              docker compose logs --tail 50 nginx
              exit 1
            fi

            docker image prune -f
```

포인트:
- scp `source`는 `nginx/prod.conf` 단일 파일. `strip_components: 2`로 `services/api/`가 제거되어 서버에 `docker-compose.yml`, `nginx/prod.conf`로 놓인다.
- `{{ ... }}`(Go 템플릿)는 `${{ }}`가 아니므로 GitHub Actions 표현식으로 해석되지 않는다.
- reload 재시도 루프는 첫 배포처럼 nginx가 방금 재생성된 경우를 위한 것이다(Review Focus 3).
- 헬스 실패·`nginx -t` 실패 시 reload와 prune은 실행되지 않는다.

- [ ] **Step 4: 전체 워크플로 검증**

Run:
```bash
docker run --rm -v "$PWD":/repo -w /repo rhysd/actionlint:latest -color .github/workflows/api-ci.yml .github/workflows/api-cd.yml
grep -nE "sudo|docker-compose |prune -af|connect-gnu/services" .github/workflows/api-cd.yml || echo "no legacy patterns"
```
Expected: actionlint 출력 없음, `no legacy patterns`

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/api-cd.yml
git commit -m "👷 ci: EC2 배포 job에 헬스체크 대기와 nginx 설정 반영 추가

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Secrets·서버 사전 조건 확인 및 파이프라인 검증 (사람 작업 포함)

Quire: [#20](https://quire.io/w/jt27208/20) (#45, #46, #48), [#21](https://quire.io/w/jt27208/21) (#49, #50, #51)

이 Task는 GitHub 설정과 EC2 접속이 필요하다. 에이전트는 체크리스트를 제시하고 사용자 확인을 받은 뒤 진행한다. Secrets 값 입력과 서버 명령은 사용자가 직접 수행한다.

**Files:** 없음 (코드 변경 없음)

**Interfaces:**
- Consumes: Task 1~4의 워크플로
- Produces: 없음

- [ ] **Step 1: 서버 사전 조건 확인 (사용자가 EC2에서 실행)**

```bash
docker compose version            # v2 플러그인 동작
id -nG | grep -w docker           # ec2-user가 docker 그룹
ls -la /opt/connectgnu/api        # .env, docker-compose.yml, nginx/, letsencrypt/ 존재, 소유자 ec2-user
ls /opt/connectgnu/api/nginx      # prod.conf 하나만
sudo ls /opt/connectgnu/api/letsencrypt/conf/live/   # api.connectgnu.kro.kr-0001 존재
```
Expected: 모두 조건 충족. `docker` 그룹이 아니면 `sudo usermod -aG docker ec2-user` 후 재로그인.

- [ ] **Step 2: GitHub Secrets 확인 (사용자)**

`Settings → Secrets and variables → Actions`에서:
- `API_SSH_HOST` = EC2 Elastic IP
- `API_SSH_USERNAME` = `ec2-user`
- `API_SSH_PRIVATE_KEY` = EC2 키 페어 개인키 (PEM 전체)
- `DOCKER_USERNAME`=`dongho18`, `DOCKER_IMAGE_NAME`=`connect-gnu-node` 인지 확인 (compose 이미지와 일치해야 함)

보안 그룹 인바운드 22/80/443 확인.

- [ ] **Step 3: 브랜치 푸시 및 dev 대상 PR 생성**

사용자 확인 후:
```bash
git push -u origin chore/api-cicd-aws
gh pr create --base dev --title "👷 ci: API CI/CD 리팩토링 및 AWS EC2 배포 전환" --body "$(cat <<'EOF'
## 요약
- API CI를 재사용 워크플로로 전환하고 build 검증 추가
- CD에 CI 게이트 추가, EC2(/opt/connectgnu/api) 배포로 전환
- 배포 후 app 헬스체크 대기, nginx -t 후 reload
- 운영 compose/nginx를 서버 반영본으로 동기화, nginx 디렉터리 마운트

## 스펙/계획
- docs/superpowers/specs/2026-09-24-api-cicd-aws-migration-design.md
- docs/superpowers/plans/2026-09-24-api-cicd-aws-migration.md

## 배포 전 확인
- [ ] GitHub Secrets(API_SSH_*) EC2 값으로 교체
- [ ] EC2 ec2-user docker 그룹, compose 플러그인

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
Expected: PR 생성. `API CI / Lint, Test and Build`가 실행되어 통과.

- [ ] **Step 4: main 반영 후 CD 확인 (사용자가 머지 시점 결정)**

dev → main 머지 후:
```bash
gh run list --workflow "API CD" --limit 1
gh run watch <run-id>
curl -fsS https://api.connectgnu.kro.kr/api/health
```
Expected: `CI → Build and Push → Deploy` 모두 성공, health 응답 200.

첫 배포에서는 nginx 볼륨 변경 때문에 nginx 컨테이너가 재생성되어 1~2초 끊김이 있을 수 있다.

- [ ] **Step 5: Quire 상태 갱신**

에픽 [#10](https://quire.io/w/jt27208/10) 하위 #17~#21 스토리와 해당 태스크를 완료 처리한다.
