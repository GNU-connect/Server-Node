# 커넥트 지누 어드민

배치 수집(셔틀·공지사항·학식·학사 일정)의 상태를 보고 수동으로 다시 돌리는 로컬 전용 어드민 웹이에요.

## 실행

```bash
cd admin
pnpm install
cp .env.example .env.local   # 운영 서버에 붙이려면 VITE_API_TARGET=https://admin.connectgnu.kro.kr
pnpm dev                      # http://localhost:5173
```

로그인 화면에 운영자 계정의 이메일과 비밀번호를 넣어요. 서버가 DB에 세션을 만들고 HttpOnly 쿠키로 돌려줘요(24시간, 쓰는 동안 연장). 연속 5번 틀리면 15분 동안 잠겨요.
계정은 API 서버에서 시드 스크립트로 만들어요. 비밀번호를 명령줄에 적지 않도록 먼저 입력받아 환경변수로 올려요.

```bash
# 운영 (서버에서)
read -s ADMIN_SEED_PASSWORD; export ADMIN_SEED_PASSWORD
docker compose exec -e ADMIN_SEED_EMAIL=admin@example.com -e ADMIN_SEED_PASSWORD app node dist/scripts/seed-admin.js

# 로컬 (services/api/app에서 pnpm build 뒤에)
# 스크립트는 .env를 읽지 않으므로 DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE도 설정돼 있어야 해요.
read -s ADMIN_SEED_PASSWORD; export ADMIN_SEED_PASSWORD
ADMIN_SEED_EMAIL=admin@example.com node --env-file=.env dist/scripts/seed-admin.js
```

## 화면

- 수집 상태(`/scrapers`): 타입별 최근 실행, 마지막 성공, 실패 오류, "지금 수집" 버튼. 수집이 진행 중이면 3초, 아니면 30초마다 새로 불러와요.
- 실행 기록(`/scrape-runs`): 타입·상태로 거르고 "더 보기"로 이어 봐요. 행을 누르면 오른쪽에 상세가 열려요.

## 개발

```bash
pnpm test        # Vitest (TZ=Asia/Seoul)
pnpm typecheck
pnpm build
```

디자인 토큰(`src/design/tokens.css`)과 컴포넌트 스타일(`src/design/jinu.css`)은 커넥트 지누 디자인 시스템 아티팩트에서 가져왔어요. 바꿀 때는 디자인 시스템을 먼저 고치고 다시 복사해요.
