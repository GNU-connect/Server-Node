# API CI/CD 리팩토링 및 AWS EC2 이전 설계

- 작성일: 2026-09-24
- 대상: `.github/workflows/api-ci.yml`, `.github/workflows/api-cd.yml`, `services/api/docker-compose.yml`

## 1. 목표

API 서버(app + nginx) 배포 대상을 GCP VM에서 AWS EC2(t3.micro, amd64, Amazon Linux)로 옮기고, 그 과정에서 GitHub Actions CI/CD를 정리한다.

성공 기준:

- `main` push 시 lint/test/build를 통과한 커밋만 EC2에 배포된다.
- 배포 후 app 컨테이너가 `healthy`가 되지 않으면 워크플로가 실패한다.
- `nginx/prod.conf` 변경이 배포 시 실제로 반영된다.
- EC2에서 GCP 전용 설정(`gcplogs`) 없이 모든 컨테이너가 기동한다.

## 2. 범위

포함:

- API(app + nginx) CI/CD 워크플로 수정
- `services/api/docker-compose.yml`의 로깅·nginx 볼륨 수정
- 배포 전 테스트 게이트, 배포 후 헬스체크 대기, nginx 설정 반영, 액션 버전·concurrency 정리

제외:

- batch 서비스, monitoring 배포
- DNS 전환 및 GCP 서버 정리
- 자동 롤백, SHA 태그 기반 배포
- OIDC/SSM 등 SSH 외 접속 방식, CloudWatch 로깅

## 3. 결정 사항

| 항목 | 결정 | 이유 |
|---|---|---|
| EC2 접근 | SSH 키 (`appleboy/scp-action`, `appleboy/ssh-action`) | 기존 흐름 유지, 마이그레이션 위험 최소화 |
| 로깅 | `json-file` + 로테이션 (`10m` × 3) | 추가 AWS 설정 없음, 에러 추적은 Sentry가 담당 |
| 파일 동기화 | `docker-compose.yml`, `nginx/prod.conf`만 | `letsencrypt/`는 root 소유이고 인증서는 certbot이 관리 |
| 워크플로 구조 | CI를 `workflow_call`로 재사용, CD가 호출 | CI 정의 단일화, 파일 역할 유지 |
| 이미지 레지스트리 | DockerHub 유지 | 변경 필요 없음 |
| 빌드 아키텍처 | amd64 (기존 `ubuntu-latest`) | t3.micro는 x86_64 |

## 4. 전체 흐름

```
PR (main/dev)            → api-ci.yml : verify (lint → test → build)
push main / 수동 실행      → api-cd.yml : ci (api-ci.yml 호출) → build-and-push → deploy
```

## 5. CI: `api-ci.yml`

트리거:

- `pull_request`: `main`, `dev` 대상, `paths`: `services/api/app/**`, `.github/workflows/api-ci.yml`
- `workflow_call` (신규)
- `workflow_dispatch`

설정:

- `permissions: contents: read`
- `concurrency: { group: api-ci-${{ github.workflow }}-${{ github.ref }}, cancel-in-progress: true }`
  - `workflow_call`로 호출되면 `github.workflow`는 호출자 이름(`API CD`)이 되므로 CD의 concurrency 그룹(`api-cd-...`)과 겹치지 않는다.

Job `verify` (기존 `lint-and-test` 이름 변경), `working-directory: services/api/app`:

1. checkout
2. pnpm 9.9.0 설치
3. Node 24 설정, pnpm 캐시 (`cache-dependency-path: services/api/app/pnpm-lock.yaml`)
4. `pnpm install --frozen-lockfile`
5. `pnpm lint:check`
6. `pnpm test`
7. `pnpm build` (신규)

액션(`actions/checkout`, `actions/setup-node`, `pnpm/action-setup`)은 구현 시점의 최신 메이저 태그로 올린다.

## 6. CD: `api-cd.yml`

트리거:

- `push`: `main`, `paths`:
  - `services/api/app/src/**`
  - `services/api/app/package.json`
  - `services/api/app/pnpm-lock.yaml`
  - `services/api/app/Dockerfile`
  - `services/api/app/.dockerignore` (신규)
  - `services/api/app/tsconfig*.json` (신규)
  - `services/api/app/nest-cli.json` (신규)
  - `services/api/docker-compose.yml`
  - `services/api/nginx/**`
  - `.github/workflows/api-cd.yml`
- `workflow_dispatch`

설정:

- `permissions: contents: read`
- `concurrency: { group: api-cd-${{ github.ref }}, cancel-in-progress: false }` — 진행 중인 배포를 취소하지 않고 대기시킨다.
- `env.DEPLOY_DIR: /opt/connectgnu/api`

### 6.1 Job `ci`

`uses: ./.github/workflows/api-ci.yml`. 실패 시 이후 job은 실행되지 않는다.

### 6.2 Job `build-and-push` (`needs: ci`)

1. checkout
2. `docker/setup-buildx-action`
3. `docker/login-action` (DockerHub)
4. `docker/build-push-action`
   - `context: services/api/app`
   - `target: prod` (신규, 명시)
   - `push: true`, `pull: true`
   - 태그: `${DOCKER_USERNAME}/${DOCKER_IMAGE_NAME}:latest`, `:${{ github.sha }}`
   - `cache-from: type=gha`, `cache-to: type=gha,mode=max`

docker 액션은 구현 시점의 최신 메이저 태그로 올린다.

### 6.3 Job `deploy` (`needs: build-and-push`)

1. checkout
2. `appleboy/scp-action` (최신 v1)
   - `source: services/api/docker-compose.yml,services/api/nginx/prod.conf`
   - `target: ${{ env.DEPLOY_DIR }}`
   - `strip_components: 2`
3. `appleboy/ssh-action` (최신 v1), 스크립트:

```bash
set -euo pipefail
cd /opt/connectgnu/api   # 워크플로에서는 ${{ env.DEPLOY_DIR }}

docker compose pull app
docker compose up -d --no-deps app

# 헬스체크 대기 (최대 약 90초)
cid=$(docker compose ps -q app)
status=""
for i in $(seq 1 30); do
  status=$(docker inspect -f '{{.State.Health.Status}}' "$cid")
  [ "$status" = healthy ] && break
  [ "$status" = unhealthy ] && break
  sleep 3
done
if [ "$status" != healthy ]; then
  echo "app health status: $status"
  docker compose logs --tail 100 app
  exit 1
fi

# nginx 설정 반영
docker compose up -d --no-deps nginx
docker compose exec -T nginx nginx -t
docker compose exec -T nginx nginx -s reload

docker image prune -f
```

동작 규칙:

- 헬스체크 실패 시 로그를 출력하고 실패 처리한다. nginx reload와 prune은 실행하지 않는다. 자동 롤백은 하지 않는다.
- `nginx -t`가 실패하면 reload하지 않고 워크플로가 실패한다. 기존 nginx 프로세스는 이전 설정으로 계속 동작한다.
- `sudo`를 쓰지 않는다 (`ec2-user`가 `docker` 그룹 소속이라는 전제).
- `docker image prune -af` 대신 `-f`를 사용해 dangling 이미지만 정리한다.

## 7. `services/api/docker-compose.yml` 변경

1. 로깅을 공통 앵커로 정의하고 app, nginx, certbot에 적용한다.

   ```yaml
   x-logging: &default-logging
     driver: json-file
     options:
       max-size: "10m"
       max-file: "3"
   ```

   app, nginx의 `gcplogs` 설정을 제거한다.

2. nginx 설정을 단일 파일 마운트에서 디렉터리 마운트로 변경한다.

   ```yaml
   # before
   - ./nginx/prod.conf:/etc/nginx/conf.d/default.conf
   # after
   - ./nginx:/etc/nginx/conf.d:ro
   ```

   이유: scp-action은 tar 해제로 파일을 새로 생성하므로 inode가 바뀐다. 단일 파일 bind mount는 기존 inode를 계속 참조하므로 `nginx -s reload`를 해도 새 설정이 반영되지 않는다. 디렉터리 마운트는 이 문제가 없다.

3. 이미지, healthcheck, certbot, 네트워크 설정은 유지한다. `docker-compose.dev.yml`은 변경하지 않는다.

## 8. GitHub Secrets

| Secret | 값 |
|---|---|
| `API_SSH_HOST` | EC2 Elastic IP (또는 고정 DNS) |
| `API_SSH_USERNAME` | `ec2-user` |
| `API_SSH_PRIVATE_KEY` | EC2 키 페어 개인키 |
| `DOCKER_USERNAME`, `DOCKER_PASSWORD`, `DOCKER_IMAGE_NAME` | 유지 |

## 9. 서버 사전 조건 (수동, 1회)

- [ ] Docker 및 compose 플러그인 설치 (`docker compose version` 동작)
- [ ] `ec2-user`를 `docker` 그룹에 추가
- [ ] `/opt/connectgnu/api` 소유자 `ec2-user`, `.env` 존재
- [ ] `/opt/connectgnu/api/nginx/`에 `prod.conf` 하나만 존재 (다른 `.conf`가 있으면 server 블록 중복)
- [ ] `/opt/connectgnu/api/letsencrypt/conf`에 인증서 발급 완료
- [ ] 보안 그룹 인바운드: 22 (키 인증만 허용), 80, 443
- [ ] Elastic IP 연결

## 10. 검증

- 로컬: `actionlint`로 두 워크플로 검사, `docker compose -f services/api/docker-compose.yml config`로 compose 검증
- PR(`dev` 대상): CI `verify`가 lint → test → build 순서로 통과하는지 확인
- `main` 머지 후: CD가 `ci` → `build-and-push` → `deploy` 순서로 실행되고 헬스 대기를 통과하는지 확인, `curl https://<도메인>/api/health` 응답 확인

## 11. 주의 사항

- `workflow_dispatch`는 선택한 브랜치의 코드를 배포한다. 수동 배포 시 `main`을 선택한다.
- GitHub Secrets를 EC2 값으로 바꾸는 시점부터 GCP 서버로는 배포되지 않는다. DNS 전환 시점과 맞춘다.
