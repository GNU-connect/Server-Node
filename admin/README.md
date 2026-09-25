# 커넥트 지누 어드민

배치 수집(셔틀·공지사항·학식·학사 일정)의 상태를 보고 수동으로 다시 돌리는 로컬 전용 어드민 웹이에요.

## 실행

```bash
cd admin
pnpm install
cp .env.example .env.local   # 운영 서버에 붙이려면 VITE_API_TARGET=https://api.connectgnu.kro.kr
pnpm dev                      # http://localhost:5173
```

로그인 화면에 API 서버의 `ADMIN_API_KEY` 값을 넣어요. 키는 브라우저 탭의 sessionStorage에만 남고, 탭을 닫으면 사라져요.
API 서버에 `ADMIN_API_KEY`가 설정돼 있지 않으면 모든 admin 요청이 403이라 로그인할 수 없어요.

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
