# 어드민 웹 배포 설계 (admin.connectgnu.kro.kr)

- 작성일: 2026-09-26
- 대상: `services/api/nginx/prod.conf`, `services/api/docker-compose.yml`, `.github/workflows/admin-ci.yml`(신규), `.github/workflows/admin-cd.yml`(신규), `admin/scripts/activate-release.sh`(신규), `admin/package.json`
- 선행: 어드민 웹(`admin/`, #93), 설계 `docs/superpowers/specs/2026-09-25-admin-web-design.md`

## 1. 목표

로컬 전용이던 어드민 웹을 `https://admin.connectgnu.kro.kr`로 배포한다. API 서버와 같은 EC2의 nginx가 정적 파일을 서빙하고, `/api/admin/`은 같은 출처에서 app으로 프록시한다.

성공 기준:

- `https://admin.connectgnu.kro.kr`가 admin 전용 Let's Encrypt 인증서로 응답하고 로그인 화면을 보여 준다.
- `http://admin.connectgnu.kro.kr`는 HTTPS로 301 리다이렉트된다.
- `/scrapers`, `/scrape-runs` 같은 SPA 경로를 새로고침해도 `index.html`이 응답한다.
- `https://admin.connectgnu.kro.kr/api/admin/scrapers`가 app의 admin API로 전달된다(키 없으면 403 JSON).
- `admin/**`가 `main`에 반영되면 테스트·빌드를 통과한 결과만 자동 배포되고, 배포 중에 옛 index와 새 assets가 섞여 보이지 않는다.
- 기존 `api.connectgnu.kro.kr` 동작은 바뀌지 않는다.

## 2. 범위

포함:

- nginx에 admin 서버 블록 추가, 80번 블록 `server_name`에 admin 추가
- compose nginx에 admin 정적 파일 볼륨 추가
- `admin-ci.yml`(PR·재사용), `admin-cd.yml`(main push 배포)
- 릴리스 전환 스크립트 `admin/scripts/activate-release.sh`
- `admin/package.json`에 `packageManager` 고정

제외:

- 인증서 발급 (서버에서 수동으로 이미 완료: `/etc/letsencrypt/live/admin.connectgnu.kro.kr/`, 만료 2026-12-25, 갱신은 기존 certbot 컨테이너)
- DNS (이미 `admin.connectgnu.kro.kr` → 3.35.117.126)
- 서버 `admin/` 디렉터리 생성 (서버에서 `ec2-user` 소유로 수동으로 이미 완료)
- 접근 제한 추가(Basic Auth, IP 허용 목록). 보호는 어드민의 `ADMIN_API_KEY` 로그인만 쓴다
- 서버 CORS 변경, 어드민 코드 변경
- dev 환경(`nginx/dev.conf`, `docker-compose.dev.yml`) 배포

## 3. 결정 사항

| 항목 | 결정 | 이유 |
|---|---|---|
| 호스팅 | 같은 EC2 nginx가 정적 서빙 (접근안 A) | 인프라 추가 없음. 같은 출처라 CORS·코드 변경 없음 |
| API 호출 | admin 서버 블록에서 `location /api/admin/`만 app으로 프록시 | 어드민은 admin API만 쓴다. 노출 경로 최소화 |
| 접근 제한 | 없음(API 키 로그인만) | admin API는 이미 `api.` 도메인에 공개돼 있어 프론트 공개로 공격 면이 늘지 않음 |
| 인증서 | admin 단독 인증서, HTTP-01 webroot, `--cert-name admin.connectgnu.kro.kr` | kro.kr은 DNS API가 없어 와일드카드(DNS-01) 자동 갱신 불가 |
| 정적 파일 전달 | CD가 빌드 결과를 scp → `admin/releases/<sha>/`, `admin/current` 상대 심볼릭 링크를 원자 교체 | 배포 중 index/asset 불일치 방지, 즉시 롤백 가능 |
| 볼륨 | `./admin:/usr/share/nginx/admin:ro`, root `/usr/share/nginx/admin/current` | 링크 대상이 상대 경로라 컨테이너 안에서도 풀린다. 디렉터리를 통째로 마운트해 링크 교체가 즉시 보인다 |
| nginx reload | admin CD에서는 하지 않음 | 파일만 바뀜. nginx는 요청마다 경로를 새로 연다 |
| 워크플로 | `admin-ci.yml`(pull_request + workflow_call) / `admin-cd.yml`(main push, `needs: ci`) | 기존 api·batch 워크플로 패턴과 동일 |
| pnpm | `admin/package.json`에 `"packageManager": "pnpm@9.9.0"` | `pnpm/action-setup`이 이 필드로 버전을 고른다. lockfile `9.0` 형식이라 호환 |
| SSH 시크릿 | 기존 `API_SSH_HOST`, `API_SSH_USERNAME`, `API_SSH_PRIVATE_KEY` 재사용 | 같은 서버 |

## 4. 서버 디렉터리

```
/opt/connectgnu/api/            (DEPLOY_DIR, 기존)
  docker-compose.yml
  nginx/prod.conf
  letsencrypt/...
  admin/                        (신규, ec2-user 소유)
    releases/
      <git sha>/                index.html, assets/..., jinu-app-icon.webp
    current -> releases/<git sha>   (상대 심볼릭 링크)
```

- `admin/`은 서버에 `ec2-user` 소유로 미리 만들어 둔다(수동, CD가 만들지 않는다). 없는 상태에서 compose가 nginx를 띄우면 바인드 경로가 root 소유로 생겨 admin CD가 쓸 수 없으므로, 서버를 새로 꾸릴 때도 nginx보다 먼저 만든다.
- 릴리스는 최신 3개만 남긴다(현재 링크 대상은 항상 보존).

## 5. nginx (`services/api/nginx/prod.conf`)

80번 블록:

```nginx
server_name api.connectgnu.kro.kr admin.connectgnu.kro.kr;
```

ACME 경로와 `return 301 https://$host$request_uri;`는 그대로 쓴다(`$host`라 admin도 admin으로 간다).

443 admin 블록(신규):

```nginx
server {
  listen 443 ssl;
  http2 on;
  server_name admin.connectgnu.kro.kr;

  ssl_certificate /etc/letsencrypt/live/admin.connectgnu.kro.kr/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/admin.connectgnu.kro.kr/privkey.pem;

  root /usr/share/nginx/admin/current;
  index index.html;

  add_header X-Frame-Options DENY always;
  add_header X-Content-Type-Options nosniff always;
  add_header Referrer-Policy same-origin always;

  location /api/admin/ {
    proxy_pass http://app;
    (api 블록의 /api와 같은 proxy 헤더)
  }

  location /assets/ {
    expires 1y;
    add_header Cache-Control "public, immutable" always;
    (보안 헤더 3종 반복: 하위 location의 add_header는 상위 것을 덮는다)
    try_files $uri =404;
  }

  location / {
    add_header Cache-Control "no-cache" always;
    (보안 헤더 3종 반복)
    try_files $uri /index.html;
  }
}
```

- `/assets/`는 Vite가 파일명에 해시를 붙이므로 1년 불변 캐시, 없는 asset은 SPA로 떨어지지 않고 404.
- 그 외 경로는 `no-cache`로 항상 최신 `index.html`을 확인한다.
- `current`가 아직 없으면(첫 admin 배포 전) 모든 경로가 404/500이다. 첫 배포 한 번만의 창이다.

## 6. compose (`services/api/docker-compose.yml`)

nginx `volumes`에 추가:

```yaml
- ./admin:/usr/share/nginx/admin:ro
```

## 7. 워크플로

`admin-ci.yml`:

- 트리거: `pull_request`(main, dev; paths `admin/**`, `.github/workflows/admin-ci.yml`), `workflow_call`, `workflow_dispatch`
- `working-directory: admin`: pnpm(`package_json_file: admin/package.json`) → Node 24 + pnpm 캐시 → `pnpm install --frozen-lockfile` → `pnpm test` → `pnpm typecheck` → `pnpm build`

`admin-cd.yml`:

- 트리거: `push`(main; paths `admin/**`, `.github/workflows/admin-cd.yml`), `workflow_dispatch`
- `concurrency: admin-cd-${{ github.ref }}`, `cancel-in-progress: false`
- `ci` job: `uses: ./.github/workflows/admin-ci.yml`
- `deploy` job (`needs: ci`):
  1. checkout, pnpm/Node 설정, `pnpm install --frozen-lockfile`, `pnpm build`
  2. SSH로 `mkdir -p $DEPLOY_DIR/admin/releases/${{ github.sha }}`
  3. scp `admin/dist/*` → `$DEPLOY_DIR/admin/releases/${{ github.sha }}` (`strip_components: 2`)
  4. scp `admin/scripts/activate-release.sh` → `$DEPLOY_DIR/admin/activate-release.sh`
  5. SSH: `bash activate-release.sh <admin 디렉터리> <sha>` 실행. 스크립트는 `releases/<sha>/index.html` 존재 확인(없으면 링크를 바꾸지 않고 실패) → `ln -sfn releases/<sha> current.tmp && mv -Tf current.tmp current` → 활성 릴리스를 뺀 오래된 릴리스를 최신 3개만 남기고 삭제
  - CD에서 `curl`로 도메인을 확인하지 않는다. 첫 배포 때 api CD(nginx admin 블록 적용)보다 먼저 끝나면 실패하기 때문이다. 접속 확인은 런북 4단계에서 한다.

`api-cd.yml`은 바꾸지 않는다.

## 8. 배포 순서 (런북)

1. (완료) 서버에서 admin 인증서 발급, `/opt/connectgnu/api/admin` 디렉터리 생성(`ec2-user` 소유)
2. 이 브랜치 PR → `dev` 머지 → `main` 반영
3. `main` 반영 시 api CD(nginx·compose 변경)와 admin CD(`admin/**` 변경 없으면 트리거 안 됨)가 돈다
   - 이 PR은 `admin/package.json`, `admin/scripts/`를 바꾸므로 admin CD도 함께 돈다
   - 둘의 순서는 보장되지 않는다. `admin/`이 미리 있으므로 어느 쪽이 먼저여도 결과는 같다
4. 확인
   - `curl -I http://admin.connectgnu.kro.kr` → 301 `https://admin...`
   - `openssl s_client -connect admin.connectgnu.kro.kr:443 -servername admin.connectgnu.kro.kr` → CN `admin.connectgnu.kro.kr`
   - `curl -s https://admin.connectgnu.kro.kr/scrape-runs | grep 'id="root"'`
   - `curl -s -o /dev/null -w '%{http_code}' https://admin.connectgnu.kro.kr/api/admin/scrapers` → 403
   - 브라우저에서 로그인 → 수집 상태 확인
5. api 도메인 회귀 확인: `curl -s https://api.connectgnu.kro.kr/api/health`

롤백:

- 어드민 파일: 서버에서 `cd /opt/connectgnu/api/admin && ls -t releases`로 남은 릴리스(최근 3개)를 확인한 뒤 `bash activate-release.sh . <이전 sha>`. 되돌린 릴리스는 다음 배포 전까지 정리 대상에서 빠진다
- nginx 설정: 이전 커밋의 `prod.conf`로 revert 후 api CD 재실행

## 9. 검증 (배포 전, 로컬)

- `docker run --rm` nginx:1.29.5-alpine에 `prod.conf`, 더미 인증서(`live/api.connectgnu.kro.kr-0001`, `live/admin.connectgnu.kro.kr`), `--add-host app:127.0.0.1`을 넣어 `nginx -t` 통과
- 같은 컨테이너에 `admin/dist`를 `releases/test`로, `current` 상대 링크로 마운트해 띄우고 `curl --resolve`로
  - `/` 200 + `id="root"`, `/scrape-runs` 200 index, `/assets/<파일>` 200 + `Cache-Control: public, immutable`, `/assets/없는파일` 404, `/` 응답에 보안 헤더 3종
  - `http://` 80 → 301
- `actionlint`로 워크플로 문법 확인(설치돼 있지 않으면 `docker run rhysd/actionlint`)
- `pnpm@9.9.0 install --frozen-lockfile`이 `admin/`에서 통과
