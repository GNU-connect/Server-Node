# 어드민 웹 배포 (admin.connectgnu.kro.kr) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `admin/`을 `https://admin.connectgnu.kro.kr`로 배포한다. API와 같은 EC2 nginx가 정적 파일을 서빙하고 `/api/admin/`을 app으로 프록시하며, `main` 반영 시 GitHub Actions가 빌드 결과를 릴리스 디렉터리로 올리고 `current` 링크를 원자 교체한다.

**Architecture:** nginx `prod.conf`에 admin 443 서버 블록을 추가하고 80번 블록이 admin도 받게 한다. compose nginx가 `./admin`을 `/usr/share/nginx/admin`으로 읽기 전용 마운트하고, root는 `current`(상대 심볼릭 링크 → `releases/<sha>`)다. 새 `admin-ci.yml`(PR·재사용)과 `admin-cd.yml`(main push)은 api 워크플로 패턴을 따른다. 릴리스 전환·정리는 테스트 가능한 셸 스크립트 `admin/scripts/activate-release.sh`로 두고 CD가 서버에 올려 실행한다.

**Tech Stack:** nginx 1.29.5-alpine(운영) / Homebrew nginx 1.27.5(로컬 검증), Docker Compose v2, GitHub Actions(`actions/checkout@v7`, `pnpm/action-setup@v6`, `actions/setup-node@v7`, `appleboy/scp-action@v1.0.0`, `appleboy/ssh-action@v1.2.5`), pnpm 9.9.0, Node 24, bash, actionlint

**Spec:** `docs/superpowers/specs/2026-09-26-admin-deploy-design.md`

**Branch:** `feat/admin-deploy` (origin/dev에서 분기, 이미 체크아웃됨)

## Global Constraints

- 운영 경로: `DEPLOY_DIR=/opt/connectgnu/api`, 어드민 파일 `$DEPLOY_DIR/admin/{releases/<sha>, current, activate-release.sh}`. `current`는 **상대** 링크 `releases/<sha>`.
- 인증서: `/etc/letsencrypt/live/admin.connectgnu.kro.kr/{fullchain,privkey}.pem` (서버에 이미 있음). api는 기존 `/etc/letsencrypt/live/api.connectgnu.kro.kr-0001/`을 그대로 둔다.
- nginx 컨테이너 마운트: `./admin:/usr/share/nginx/admin:ro`, admin root `/usr/share/nginx/admin/current`.
- admin 블록은 `/api/admin/`만 프록시한다. 프록시 헤더는 api 블록의 `/api`와 같다.
- 캐시: `/assets/` → `Cache-Control: public, max-age=31536000, immutable`, 그 외 → `Cache-Control: no-cache`. 보안 헤더 `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: same-origin`을 두 location에 모두 `always`로 붙인다(하위 location의 `add_header`는 상위를 덮는다).
- 릴리스 보존 3개, 활성 릴리스는 개수와 무관하게 보존. `index.html` 없는 릴리스는 활성화하지 않는다.
- SSH 시크릿: 기존 `API_SSH_HOST`, `API_SSH_USERNAME`, `API_SSH_PRIVATE_KEY`. 서버 사용자 `ec2-user`, `sudo` 금지.
- `admin/package.json`: `"packageManager": "pnpm@9.9.0"`. 워크플로 Node 24.
- 서버·앱 코드(`services/api/app`, `admin/src`)와 CORS는 바꾸지 않는다. dev 설정(`dev.conf`, `docker-compose.dev.yml`)도 그대로.
- 로컬 검증은 스펙 §9의 docker 대신 Homebrew nginx로 한다(이 머신에서 Docker 데몬이 떠 있지 않다). 검증 대상(`prod.conf` 원문, 체크 항목)은 같다.
- 커밋 메시지: gitmoji + 한글(`👷 ci:`, `🔧 chore:`, `📝 docs:` 등), 끝에 빈 줄 후 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- 검증용 스크립트(nginx 하네스, 릴리스 스크립트 테스트)는 plan 작업 공간 `.superpowers/sdd/2026-09-26-admin-deploy/`에 두고 커밋하지 않는다.

## Review Focus

1. **CD 순서가 뒤바뀐 첫 배포** — admin CD가 api CD보다 먼저 끝나거나 늦게 끝나도, `admin/` 디렉터리가 root 소유로 생기지 않고 결과가 같아야 한다. (Task 3: api CD의 `mkdir -p admin`, admin CD의 선생성 단계)
2. **빈/깨진 업로드** — scp가 일부만 올렸거나 빌드가 비어 `index.html`이 없으면 `current`를 바꾸지 않고 CD가 실패해야 한다. (Task 3 스크립트 테스트 "빈 릴리스 거부")
3. **롤백 후 재배포** — 운영자가 수동으로 옛 릴리스로 되돌린 뒤 다음 배포가 돌 때, 정리 단계가 활성 릴리스를 지우면 안 된다. (Task 3 테스트 "활성 릴리스는 정리 대상에서 제외")
4. **api 도메인 회귀** — admin 블록 추가 후에도 `api.connectgnu.kro.kr`의 `/api` 프록시·`/` 차단·api 인증서가 그대로여야 한다. (Task 2 하네스 api 체크)
5. **SPA 새로고침과 없는 asset** — `/scrape-runs?run=3` 새로고침은 index를 주고, 없는 `/assets/*.js`는 index가 아닌 404를 줘야 한다(그렇지 않으면 브라우저가 HTML을 JS로 파싱해 흰 화면). (Task 2 하네스)

---

## File Structure

```
admin/package.json                          (수정) packageManager
admin/scripts/activate-release.sh           (신규) 릴리스 활성화·정리
admin/README.md                             (수정) 배포·롤백 안내
services/api/nginx/prod.conf                (수정) admin 서버 블록
services/api/docker-compose.yml             (수정) nginx admin 볼륨
.github/workflows/admin-ci.yml              (신규)
.github/workflows/admin-cd.yml              (신규)
.github/workflows/api-cd.yml                (수정) mkdir -p admin
.superpowers/sdd/2026-09-26-admin-deploy/   (git 무시, 검증 스크립트)
  verify-nginx.sh
  activate-release.test.sh
```

---

### Task 1: 어드민 CI

**Files:**
- Modify: `admin/package.json`
- Create: `.github/workflows/admin-ci.yml`

**Interfaces:**
- Consumes: 없음
- Produces: 재사용 워크플로 `./.github/workflows/admin-ci.yml` (`workflow_call`, 입력·시크릿 없음). job `verify`.

- [ ] **Step 1: 도구 준비**

Run: `brew install actionlint coreutils`
Expected: `actionlint --version`이 1.7.x를 출력. (coreutils는 Task 3에서 쓴다)

- [ ] **Step 2: pnpm 버전 고정**

`admin/package.json`의 `"type": "module",` 다음 줄에 추가:

```json
  "packageManager": "pnpm@9.9.0",
```

- [ ] **Step 3: pnpm 9.9.0으로 frozen 설치가 되는지 확인**

Run:

```bash
cd admin && rm -rf node_modules && npx -y pnpm@9.9.0 install --frozen-lockfile && npx -y pnpm@9.9.0 test
```

Expected: 설치 성공(esbuild postinstall 실행), 테스트 91개 통과. 실패하면 lockfile 호환 문제이므로 멈추고 원인부터 본다.

- [ ] **Step 4: CI 워크플로 작성**

`.github/workflows/admin-ci.yml`:

```yaml
name: Admin CI

on:
  pull_request:
    branches:
      - main
      - dev
    paths:
      - 'admin/**'
      - '.github/workflows/admin-ci.yml'

  workflow_call:

  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: admin-ci-${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  verify:
    name: Test, Typecheck and Build
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: admin

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v7

      - name: Set up pnpm
        uses: pnpm/action-setup@v6
        with:
          package_json_file: admin/package.json

      - name: Set up Node.js
        uses: actions/setup-node@v7
        with:
          node-version: 24
          cache: pnpm
          cache-dependency-path: admin/pnpm-lock.yaml

      - name: Install Dependencies
        run: pnpm install --frozen-lockfile

      - name: Run Tests
        run: pnpm test

      - name: Typecheck
        run: pnpm typecheck

      - name: Build
        run: pnpm build
```

- [ ] **Step 5: actionlint 확인**

Run: `actionlint .github/workflows/admin-ci.yml`
Expected: 출력 없음, exit 0

- [ ] **Step 6: Commit**

```bash
git add admin/package.json .github/workflows/admin-ci.yml
git commit -m "$(cat <<'EOF'
👷 ci: 어드민 웹 CI 워크플로 추가

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: nginx admin 서버 블록과 compose 볼륨

**Files:**
- Modify: `services/api/nginx/prod.conf`
- Modify: `services/api/docker-compose.yml`
- Create (커밋 안 함): `.superpowers/sdd/2026-09-26-admin-deploy/verify-nginx.sh`

**Interfaces:**
- Consumes: `admin/dist` (`cd admin && pnpm build`)
- Produces: nginx가 기대하는 서버 레이아웃 — `/usr/share/nginx/admin/current/index.html`, `/etc/letsencrypt/live/admin.connectgnu.kro.kr/*.pem`. Task 3 CD는 이 레이아웃에 맞춰 파일을 올린다.

- [ ] **Step 1: 검증 하네스 작성**

`.superpowers/sdd/2026-09-26-admin-deploy/verify-nginx.sh`:

```bash
#!/usr/bin/env bash
# prod.conf를 Homebrew nginx로 로컬 검증한다. 컨테이너 경로·포트만 바꾸고 나머지는 원문 그대로 쓴다.
# 사용: verify-nginx.sh  (저장소 루트에서, admin/dist가 빌드돼 있어야 한다)
set -uo pipefail
REPO=$(git rev-parse --show-toplevel)
T=$(mktemp -d)
HTTP=18080
HTTPS=18443
APP=13000

cleanup() {
  nginx -p "$T" -c "$T/nginx.conf" -s stop 2>/dev/null || true
  [ -n "${APP_PID:-}" ] && kill "$APP_PID" 2>/dev/null || true
  rm -rf "$T"
}
trap cleanup EXIT

mkdir -p "$T/conf.d" "$T/certbot" "$T/admin/releases" "$T/logs" "$T/tmp"
for name in api.connectgnu.kro.kr-0001 admin.connectgnu.kro.kr; do
  mkdir -p "$T/letsencrypt/live/$name"
  openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout "$T/letsencrypt/live/$name/privkey.pem" \
    -out "$T/letsencrypt/live/$name/fullchain.pem" \
    -subj "/CN=${name%-0001}" 2>/dev/null
done

cp -R "$REPO/admin/dist" "$T/admin/releases/test"
ln -s releases/test "$T/admin/current"

sed -e "s#/etc/letsencrypt#$T/letsencrypt#g" \
    -e "s#/var/www/certbot#$T/certbot#g" \
    -e "s#/usr/share/nginx/admin#$T/admin#g" \
    -e "s#server app:3000;#server 127.0.0.1:$APP;#" \
    -e "s#listen 80;#listen $HTTP;#" \
    -e "s#listen 443 ssl;#listen $HTTPS ssl;#" \
    "$REPO/services/api/nginx/prod.conf" > "$T/conf.d/prod.conf"

cat > "$T/nginx.conf" <<EOF
worker_processes 1;
error_log $T/logs/error.log;
pid $T/nginx.pid;
events {}
http {
  include $(brew --prefix)/etc/nginx/mime.types;
  access_log off;
  client_body_temp_path $T/tmp/body;
  proxy_temp_path $T/tmp/proxy;
  fastcgi_temp_path $T/tmp/fastcgi;
  uwsgi_temp_path $T/tmp/uwsgi;
  scgi_temp_path $T/tmp/scgi;
  include $T/conf.d/*.conf;
}
EOF

# app 흉내: 경로를 JSON으로 돌려주고, 키 없는 admin 요청은 403
node -e "
require('http').createServer((q, s) => {
  const denied = q.url.startsWith('/api/admin/') && q.headers['x-admin-api-key'] !== 'k';
  s.writeHead(denied ? 403 : 200, { 'content-type': 'application/json' });
  s.end(JSON.stringify({ proxied: q.url }));
}).listen($APP);
" &
APP_PID=$!

fail=0
check() {
  if eval "$2"; then echo "PASS $1"; else echo "FAIL $1"; fail=1; fi
}

check "nginx -t" 'nginx -p "$T" -c "$T/nginx.conf" -t >/dev/null 2>&1'
nginx -p "$T" -c "$T/nginx.conf" || { echo "FAIL nginx 기동"; cat "$T/logs/error.log"; exit 1; }
sleep 0.5

admin() { curl -sk --resolve "admin.connectgnu.kro.kr:$HTTPS:127.0.0.1" "$@"; }
api() { curl -sk --resolve "api.connectgnu.kro.kr:$HTTPS:127.0.0.1" "$@"; }
cn() { echo | openssl s_client -connect "127.0.0.1:$HTTPS" -servername "$1" 2>/dev/null | openssl x509 -noout -subject 2>/dev/null; }
ASSET=$(cd "$T/admin/current/assets" && ls | head -1)

check "admin SNI는 admin 인증서" '[[ "$(cn admin.connectgnu.kro.kr)" == *"CN=admin.connectgnu.kro.kr"* ]]'
check "api SNI는 api 인증서" '[[ "$(cn api.connectgnu.kro.kr)" == *"CN=api.connectgnu.kro.kr"* ]]'
check "admin / 는 index" 'admin "https://admin.connectgnu.kro.kr:$HTTPS/" | grep -q "id=\"root\""'
check "admin / no-cache" 'admin -D - -o /dev/null "https://admin.connectgnu.kro.kr:$HTTPS/" | grep -qi "^cache-control: no-cache"'
check "admin / 보안 헤더" 'h=$(admin -D - -o /dev/null "https://admin.connectgnu.kro.kr:$HTTPS/"); grep -qi "^x-frame-options: DENY" <<<"$h" && grep -qi "^x-content-type-options: nosniff" <<<"$h" && grep -qi "^referrer-policy: same-origin" <<<"$h"'
check "SPA 경로 새로고침은 index" 'admin "https://admin.connectgnu.kro.kr:$HTTPS/scrape-runs?run=3" | grep -q "id=\"root\""'
check "asset 200 + immutable" 'h=$(admin -D - -o /dev/null "https://admin.connectgnu.kro.kr:$HTTPS/assets/$ASSET"); grep -q " 200" <<<"$h" && grep -qi "^cache-control: public, max-age=31536000, immutable" <<<"$h"'
check "asset 보안 헤더" 'admin -D - -o /dev/null "https://admin.connectgnu.kro.kr:$HTTPS/assets/$ASSET" | grep -qi "^x-frame-options: DENY"'
check "없는 asset은 404" '[ "$(admin -o /dev/null -w "%{http_code}" "https://admin.connectgnu.kro.kr:$HTTPS/assets/nope.js")" = 404 ]'
check "admin API 프록시(키 없음 403)" '[ "$(admin -o /dev/null -w "%{http_code}" "https://admin.connectgnu.kro.kr:$HTTPS/api/admin/scrapers")" = 403 ]'
check "admin API 프록시 헤더 전달" 'admin -H "x-admin-api-key: k" "https://admin.connectgnu.kro.kr:$HTTPS/api/admin/scrapers" | grep -q "\"proxied\":\"/api/admin/scrapers\""'
check "admin 도메인은 admin 외 API를 프록시하지 않음" '! admin "https://admin.connectgnu.kro.kr:$HTTPS/api/health" | grep -q proxied'
check "admin HTTP → HTTPS 301" '[[ "$(curl -s -o /dev/null -w "%{http_code} %{redirect_url}" -H "Host: admin.connectgnu.kro.kr" "http://127.0.0.1:$HTTP/scrapers")" == "301 https://admin.connectgnu.kro.kr/scrapers" ]]'
check "admin HTTP ACME 경로" 'mkdir -p "$T/certbot/.well-known/acme-challenge" && echo tok > "$T/certbot/.well-known/acme-challenge/t" && [ "$(curl -s -H "Host: admin.connectgnu.kro.kr" "http://127.0.0.1:$HTTP/.well-known/acme-challenge/t")" = tok ]'
check "api /api 프록시 유지" 'api "https://api.connectgnu.kro.kr:$HTTPS/api/health" | grep -q "\"proxied\":\"/api/health\""'
check "api / 차단 유지" '[ "$(api -o /dev/null -w "%{http_code}" "https://api.connectgnu.kro.kr:$HTTPS/")" = 403 ]'
check "api HTTP → HTTPS 301 유지" '[ "$(curl -s -o /dev/null -w "%{http_code}" -H "Host: api.connectgnu.kro.kr" "http://127.0.0.1:$HTTP/")" = 301 ]'

exit $fail
```

Run: `chmod +x .superpowers/sdd/2026-09-26-admin-deploy/verify-nginx.sh && (cd admin && pnpm build)`

- [ ] **Step 2: 하네스가 지금 설정에서 실패하는지 확인**

Run: `.superpowers/sdd/2026-09-26-admin-deploy/verify-nginx.sh`
Expected: exit 1.
- PASS: `nginx -t`, api 체크 4개(`api SNI`, `api /api 프록시 유지`, `api / 차단 유지`, `api HTTP → HTTPS 301 유지`), 그리고 admin 요청을 기본 서버(api 블록)가 받아서 우연히 통과하는 `admin HTTP → HTTPS 301`, `admin HTTP ACME 경로`, `admin API 프록시(키 없음 403)`, `admin API 프록시 헤더 전달`
- FAIL: `admin SNI는 admin 인증서`, `admin / 는 index`, `admin / no-cache`, `admin / 보안 헤더`, `SPA 경로 새로고침은 index`, `asset 200 + immutable`, `asset 보안 헤더`, `없는 asset은 404`, `admin 도메인은 admin 외 API를 프록시하지 않음`
- api 체크가 FAIL이면 하네스가 틀린 것이므로 하네스부터 고친다.

- [ ] **Step 3: prod.conf 수정**

80번 블록의 `server_name` 줄을 바꾼다:

```nginx
  server_name api.connectgnu.kro.kr admin.connectgnu.kro.kr;
```

파일 끝(api 443 블록 닫는 `}` 다음)에 추가:

```nginx

# HTTPS - 어드민 웹
server {
  listen 443 ssl;
  http2 on;
  server_name admin.connectgnu.kro.kr;
  underscores_in_headers on;

  # SSL 인증서
  ssl_certificate /etc/letsencrypt/live/admin.connectgnu.kro.kr/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/admin.connectgnu.kro.kr/privkey.pem;

  # admin CD가 releases/<sha>로 올리고 current 링크를 바꾼다
  root /usr/share/nginx/admin/current;
  index index.html;

  # admin API만 같은 출처로 프록시
  location /api/admin/ {
    proxy_pass http://app;
    proxy_http_version 1.1;
    proxy_pass_request_headers on;
    proxy_set_header Connection "";
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header Host $http_host;
    proxy_set_header X-NginX-Proxy true;
  }

  # 파일명에 해시가 붙은 빌드 산출물: 오래 캐시하고, 없으면 index로 떨어지지 않게 404
  location /assets/ {
    add_header Cache-Control "public, max-age=31536000, immutable" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header Referrer-Policy same-origin always;
    try_files $uri =404;
  }

  # SPA: 없는 경로는 index.html, 매번 최신 index를 확인
  location / {
    add_header Cache-Control "no-cache" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header Referrer-Policy same-origin always;
    try_files $uri /index.html;
  }
}
```

- [ ] **Step 4: compose 볼륨 추가**

`services/api/docker-compose.yml`의 nginx `volumes`에서 `- ./letsencrypt/www:/var/www/certbot` 다음 줄에 추가:

```yaml
      - ./admin:/usr/share/nginx/admin:ro
```

Run: `docker compose -f services/api/docker-compose.yml config --quiet 2>&1 || echo "docker 없음: YAML만 확인"; python3 -c "import yaml,sys; d=yaml.safe_load(open('services/api/docker-compose.yml')); print(d['services']['nginx']['volumes'])"`
Expected: 볼륨 목록에 `./admin:/usr/share/nginx/admin:ro` 포함. (`docker compose config`는 `.env`가 없어 실패할 수 있다. 그 경우 python 출력만 본다. PyYAML이 없으면 `grep -n "admin" services/api/docker-compose.yml`로 대신한다.)

- [ ] **Step 5: 하네스 통과 확인**

Run: `.superpowers/sdd/2026-09-26-admin-deploy/verify-nginx.sh`
Expected: 모든 줄 PASS, exit 0

- [ ] **Step 6: Commit**

```bash
git add services/api/nginx/prod.conf services/api/docker-compose.yml
git commit -m "$(cat <<'EOF'
🔧 chore: nginx에 admin.connectgnu.kro.kr 서버 블록 추가

어드민 정적 파일을 current 릴리스에서 서빙하고 /api/admin/만 app으로 프록시한다.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: 릴리스 스크립트와 어드민 CD

**Files:**
- Create: `admin/scripts/activate-release.sh`
- Create (커밋 안 함): `.superpowers/sdd/2026-09-26-admin-deploy/activate-release.test.sh`
- Create: `.github/workflows/admin-cd.yml`
- Modify: `.github/workflows/api-cd.yml` (Deploy via SSH 스크립트)

**Interfaces:**
- Consumes: Task 1 `./.github/workflows/admin-ci.yml`; Task 2 서버 레이아웃(`$DEPLOY_DIR/admin/current` → `releases/<sha>`)
- Produces: `activate-release.sh <admin 디렉터리> <릴리스 이름> [보존 개수=3]` — 성공 exit 0, `index.html` 없으면 exit 1(링크 불변)

- [ ] **Step 1: 실패하는 스크립트 테스트 작성**

`.superpowers/sdd/2026-09-26-admin-deploy/activate-release.test.sh`:

```bash
#!/usr/bin/env bash
# activate-release.sh 동작 확인. 서버와 같은 GNU mv를 쓰려고 coreutils gnubin을 PATH 앞에 둔다.
set -uo pipefail
SCRIPT=$(git rev-parse --show-toplevel)/admin/scripts/activate-release.sh
export PATH="$(brew --prefix)/opt/coreutils/libexec/gnubin:$PATH"
T=$(mktemp -d)
trap 'rm -rf "$T"' EXIT

fail=0
check() {
  if eval "$2"; then echo "PASS $1"; else echo "FAIL $1"; fail=1; fi
}
# mk <이름> <mtime YYYYMMDDhhmm>: index.html이 든 릴리스를 만든다
mk() {
  mkdir -p "$T/releases/$1"
  echo "$1" > "$T/releases/$1/index.html"
  touch -t "$2" "$T/releases/$1"
}
activate() { bash "$SCRIPT" "$T" "$@"; }

check "스크립트 존재" '[ -f "$SCRIPT" ]'

mk r1 202601010000
check "첫 활성화 성공" 'activate r1'
check "current는 상대 링크" '[ "$(readlink "$T/current")" = releases/r1 ]'

mkdir -p "$T/releases/broken"
check "index.html 없는 릴리스 거부" '! activate broken 2>/dev/null'
check "거부 후 current 유지" '[ "$(readlink "$T/current")" = releases/r1 ]'
rm -rf "$T/releases/broken"

check "없는 릴리스 거부" '! activate nope 2>/dev/null'

mk r2 202601020000
activate r2
check "전환 후 current가 새 릴리스" '[ "$(cat "$T/current/index.html")" = r2 ]'
check "임시 링크가 남지 않음" '[ ! -e "$T/current.tmp" ] && [ ! -L "$T/current.tmp" ]'
check "current가 디렉터리 안으로 들어가지 않음" '[ ! -e "$T/releases/r2/current.tmp" ] && [ ! -e "$T/releases/r1/current.tmp" ]'

mk r3 202601030000
mk r4 202601040000
activate r4
check "최신 3개만 남김" '[ "$(ls "$T/releases" | sort | tr "\n" " ")" = "r2 r3 r4 " ]'

mk r5 202601050000
activate r2
check "활성 릴리스는 정리 대상에서 제외" '[ "$(ls "$T/releases" | sort | tr "\n" " ")" = "r2 r3 r4 r5 " ] && [ "$(readlink "$T/current")" = releases/r2 ]'

check "보존 개수 인자" 'activate r5 1 && [ "$(ls "$T/releases" | tr "\n" " ")" = "r5 " ]'

exit $fail
```

Run: `chmod +x .superpowers/sdd/2026-09-26-admin-deploy/activate-release.test.sh && .superpowers/sdd/2026-09-26-admin-deploy/activate-release.test.sh`
Expected: exit 1, `FAIL 스크립트 존재`와 이어지는 체크들 FAIL

- [ ] **Step 2: 스크립트 구현**

`admin/scripts/activate-release.sh`:

```bash
#!/usr/bin/env bash
# 어드민 릴리스를 활성화하고 오래된 릴리스를 정리한다. admin CD가 서버에서 실행한다.
# 사용: activate-release.sh <admin 디렉터리> <릴리스 이름> [보존 개수=3]
#   <admin 디렉터리>/releases/<릴리스 이름>/index.html 이 있어야 한다.
#   current 는 releases/<릴리스 이름> 을 가리키는 상대 링크로 원자 교체된다(nginx 컨테이너 안에서도 풀리도록).
set -euo pipefail

dir=$1
release=$2
keep=${3:-3}

cd "$dir"

if [ ! -f "releases/$release/index.html" ]; then
  echo "releases/$release/index.html 이 없어 활성화하지 않습니다." >&2
  exit 1
fi

ln -sfn "releases/$release" current.tmp
# -T: current 가 디렉터리 링크여도 그 안으로 옮기지 않고 링크 자체를 바꾼다(rename 은 원자적)
mv -Tf current.tmp current

active=$(basename "$(readlink current)")
ls -1t releases | tail -n +"$((keep + 1))" | while read -r old; do
  if [ "$old" != "$active" ]; then
    rm -rf "releases/$old"
  fi
done

echo "활성 릴리스: $active"
```

Run: `chmod +x admin/scripts/activate-release.sh`

- [ ] **Step 3: 스크립트 테스트 통과 확인**

Run: `.superpowers/sdd/2026-09-26-admin-deploy/activate-release.test.sh`
Expected: 모든 줄 PASS, exit 0

- [ ] **Step 4: CD 워크플로 작성**

`.github/workflows/admin-cd.yml`:

```yaml
name: Admin CD

on:
  push:
    branches:
      - main
    paths:
      - 'admin/**'
      - '.github/workflows/admin-cd.yml'
      - '.github/workflows/admin-ci.yml'

  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: admin-cd-${{ github.ref }}
  cancel-in-progress: false

env:
  ADMIN_DIR: /opt/connectgnu/api/admin

jobs:
  ci:
    name: CI
    uses: ./.github/workflows/admin-ci.yml

  deploy:
    name: Deploy Admin Web
    runs-on: ubuntu-latest
    needs: ci

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v7

      - name: Set up pnpm
        uses: pnpm/action-setup@v6
        with:
          package_json_file: admin/package.json

      - name: Set up Node.js
        uses: actions/setup-node@v7
        with:
          node-version: 24
          cache: pnpm
          cache-dependency-path: admin/pnpm-lock.yaml

      - name: Build
        working-directory: admin
        run: |
          pnpm install --frozen-lockfile
          pnpm build

      - name: Prepare release directory
        uses: appleboy/ssh-action@v1.2.5
        with:
          host: ${{ secrets.API_SSH_HOST }}
          username: ${{ secrets.API_SSH_USERNAME }}
          key: ${{ secrets.API_SSH_PRIVATE_KEY }}
          script: |
            set -euo pipefail
            mkdir -p ${{ env.ADMIN_DIR }}/releases/${{ github.sha }}

      - name: Copy build output
        uses: appleboy/scp-action@v1.0.0
        with:
          host: ${{ secrets.API_SSH_HOST }}
          username: ${{ secrets.API_SSH_USERNAME }}
          key: ${{ secrets.API_SSH_PRIVATE_KEY }}
          source: admin/dist/*
          target: ${{ env.ADMIN_DIR }}/releases/${{ github.sha }}
          strip_components: 2

      - name: Copy release script
        uses: appleboy/scp-action@v1.0.0
        with:
          host: ${{ secrets.API_SSH_HOST }}
          username: ${{ secrets.API_SSH_USERNAME }}
          key: ${{ secrets.API_SSH_PRIVATE_KEY }}
          source: admin/scripts/activate-release.sh
          target: ${{ env.ADMIN_DIR }}
          strip_components: 2

      - name: Activate release
        uses: appleboy/ssh-action@v1.2.5
        with:
          host: ${{ secrets.API_SSH_HOST }}
          username: ${{ secrets.API_SSH_USERNAME }}
          key: ${{ secrets.API_SSH_PRIVATE_KEY }}
          script: |
            set -euo pipefail
            bash ${{ env.ADMIN_DIR }}/activate-release.sh ${{ env.ADMIN_DIR }} ${{ github.sha }}
```

- [ ] **Step 5: api CD에 admin 디렉터리 선생성 추가**

`.github/workflows/api-cd.yml`의 `Deploy via SSH` 스크립트에서

```yaml
            set -euo pipefail
            cd ${{ env.DEPLOY_DIR }}
```

를 다음으로 바꾼다:

```yaml
            set -euo pipefail
            cd ${{ env.DEPLOY_DIR }}

            # nginx가 마운트하는 어드민 디렉터리. compose가 root 소유로 만들지 않게 먼저 만든다
            mkdir -p admin
```

- [ ] **Step 6: actionlint 확인**

Run: `actionlint .github/workflows/admin-cd.yml .github/workflows/admin-ci.yml .github/workflows/api-cd.yml`
Expected: 출력 없음, exit 0. (shellcheck가 설치돼 있으면 `run:` 블록도 검사한다. 경고가 나오면 읽고, 이 Task에서 추가한 줄에 대한 것만 고친다.)

- [ ] **Step 7: scp strip 결과 확인**

`strip_components: 2`가 `admin/dist/index.html` → `index.html`, `admin/dist/assets/x.js` → `assets/x.js`, `admin/scripts/activate-release.sh` → `activate-release.sh`가 되는지 tar로 흉내 낸다.

Run:

```bash
T=$(mktemp -d) && tar -cf - admin/dist admin/scripts/activate-release.sh | tar -xf - -C "$T" --strip-components 2 && ls "$T" "$T/assets" | head && rm -rf "$T"
```

Expected: `$T`에 `index.html`, `assets`, `jinu-app-icon.webp`, `activate-release.sh`가 있고 `$T/assets`에 해시 파일들.

- [ ] **Step 8: Commit**

```bash
git add admin/scripts/activate-release.sh .github/workflows/admin-cd.yml .github/workflows/api-cd.yml
git commit -m "$(cat <<'EOF'
👷 ci: 어드민 웹 CD 워크플로와 릴리스 전환 스크립트 추가

main 반영 시 빌드 결과를 releases/<sha>로 올리고 current 링크를 원자 교체한다.
api CD는 nginx가 마운트할 admin 디렉터리를 먼저 만든다.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: 배포 안내와 최종 확인

**Files:**
- Modify: `admin/README.md`

**Interfaces:**
- Consumes: 전체
- Produces: 없음

- [ ] **Step 1: README에 배포 절 추가**

`admin/README.md`의 `## 개발` 절 앞에 추가:

````markdown
## 배포

`https://admin.connectgnu.kro.kr` 로 배포돼요. API 서버와 같은 EC2의 nginx가 정적 파일을 서빙하고, `/api/admin/` 만 app으로 넘겨요.

- `main` 에 `admin/**` 변경이 반영되면 `Admin CD` 가 테스트·빌드 후 서버의 `/opt/connectgnu/api/admin/releases/<커밋>/` 에 올리고 `current` 링크를 바꿔요. 최근 릴리스 3개만 남아요.
- nginx 설정(`services/api/nginx/prod.conf`)과 compose 는 `API CD` 가 배포해요.
- 인증서는 `/etc/letsencrypt/live/admin.connectgnu.kro.kr/` 에 있고 certbot 컨테이너가 갱신해요.

되돌리기(서버에서):

```bash
cd /opt/connectgnu/api/admin
ls -t releases                      # 최신순
bash activate-release.sh . <되돌릴 커밋>
```
````

- [ ] **Step 2: 전체 확인**

Run:

```bash
.superpowers/sdd/2026-09-26-admin-deploy/verify-nginx.sh \
  && .superpowers/sdd/2026-09-26-admin-deploy/activate-release.test.sh \
  && actionlint .github/workflows/admin-ci.yml .github/workflows/admin-cd.yml .github/workflows/api-cd.yml \
  && (cd admin && pnpm test && pnpm typecheck && pnpm build)
```

Expected: 모두 PASS / exit 0, 테스트 91개 통과

Run: `git status --short`
Expected: README 변경만 남음

- [ ] **Step 3: Commit**

```bash
git add admin/README.md
git commit -m "$(cat <<'EOF'
📝 docs: 어드민 웹 배포·롤백 안내 추가

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 4: 머지 후 운영 확인 (런북, PR 본문에 옮겨 적는다)**

`main` 반영 후 API CD와 Admin CD가 모두 성공하면:

```bash
curl -sI http://admin.connectgnu.kro.kr/ | head -3                     # 301 → https://admin...
echo | openssl s_client -connect admin.connectgnu.kro.kr:443 -servername admin.connectgnu.kro.kr 2>/dev/null | openssl x509 -noout -subject   # CN=admin.connectgnu.kro.kr
curl -s https://admin.connectgnu.kro.kr/scrape-runs | grep -c 'id="root"'   # 1
curl -s -o /dev/null -w '%{http_code}\n' https://admin.connectgnu.kro.kr/api/admin/scrapers   # 403
curl -s https://api.connectgnu.kro.kr/api/health                        # api 회귀 없음
```

브라우저에서 `https://admin.connectgnu.kro.kr` 로그인 → 수집 상태 확인.
