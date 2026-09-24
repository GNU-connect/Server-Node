<div align="center">
  <img src="./mobile/assets/images/icon.png" alt="커넥트 지누 아이콘" width="80" height="80">
  <h2>커넥트 지누</h2>
</div>

<div align="center">
  <b>경상국립대학교 종합 정보 챗봇 서비스</b>
  <p>2024.03 - 운영 중</p>
  <img src="https://img.shields.io/badge/서비스%20상태-운영중-00C851?style=for-the-badge" alt="서비스 상태 운영중">
  <img src="https://img.shields.io/badge/카카오톡%20친구-2,818명-FFCD00?style=for-the-badge&logo=kakaotalk&logoColor=000000" alt="카카오톡 친구 2,818명">

</div>

---

## 🔷 프로젝트 개요

경상국립대학교 학우들이 학교 생활에 필요한 정보를 빠르게 확인할 수 있도록 돕는 서비스입니다.

공지사항, 학식, 학사일정, 셔틀버스 시간표 등 학교 생활에 필요한 정보를 제공합니다.

- [KBS 라이브 진주 인터뷰 - 커넥트 지누 편](https://www.youtube.com/watch?v=B3Gx3Jap5vA&ab_channel=KBS진주)
- [경상국립대 전용 챗봇, ‘커넥트 지누’ 개발팀을 만나다](https://www.gnunews.kr/news/articleView.html?idxno=28480)

---

## 🔷 기술 스택

<div>

### Backend

<img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS">
<img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
<img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python">

### Database & ORM

<img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL">
<img src="https://img.shields.io/badge/TypeORM-FE0803?style=for-the-badge&logo=typeorm&logoColor=white" alt="TypeORM">

### Infrastructure & Monitoring

<img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker">
<img src="https://img.shields.io/badge/Docker%20Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker Compose">
<img src="https://img.shields.io/badge/GitHub%20Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white" alt="GitHub Actions">
<img src="https://img.shields.io/badge/GCP%20Compute%20Engine-4285F4?style=for-the-badge&logo=googlecloud&logoColor=white" alt="GCP Compute Engine">
<img src="https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase">
<img src="https://img.shields.io/badge/Sentry-362D59?style=for-the-badge&logo=sentry&logoColor=white" alt="Sentry">
<img src="https://img.shields.io/badge/Prometheus-E6522C?style=for-the-badge&logo=prometheus&logoColor=white" alt="Prometheus">
<img src="https://img.shields.io/badge/Grafana-F46800?style=for-the-badge&logo=grafana&logoColor=white" alt="Grafana">

### Testing

<img src="https://img.shields.io/badge/Jest-C21325?style=for-the-badge&logo=jest&logoColor=white" alt="Jest">

</div>

---

## 🔷 서비스 아키텍처

<img width="1217" height="766" alt="image" src="https://github.com/user-attachments/assets/c40a1555-2fc1-46c4-84c8-ed439428e0db" />

---

## 🔷 프로젝트 기능 소개

### ✔︎ 학교 & 학과 공지사항 조회

<img src="https://github.com/GNU-connect/.github/blob/main/profile/image/notice.gif?raw=true" alt="notice" width="750px">

- 116개의 학과, 169개의 게시판에서 실시간으로 공지사항을 스크래핑하여 제공합니다.
- 사용자는 자신의 단과대학 및 학과를 선택하여 맞춤형 공지사항을 제공받을 수 있습니다.
- 공지사항을 클릭하면 원본 게시글로 이동할 수 있습니다.

---

### ✔︎ 학식 메뉴 조회

<img src="https://github.com/GNU-connect/.github/blob/main/profile/image/diet.gif?raw=true" alt="diet" width="750px">

- 4개 캠퍼스, 9개의 식당 학식 메뉴를 조회할 수 있습니다.
- 원하는 캠퍼스 및 식당을 선택하면 해당 날짜의 메뉴를 한눈에 확인할 수 있습니다.
- 매주 새로운 학식 메뉴가 자동으로 업데이트됩니다.

---

### ✔︎ 학사일정 조회

<img src="https://github.com/GNU-connect/.github/blob/main/profile/image/calendar.gif?raw=true" alt="calendar" width="750px">

- 매월 주요 학사 일정을 한눈에 확인할 수 있습니다.
- 개강, 중간·기말고사, 수강신청 등 중요한 일정을 놓치지 않도록 도와줍니다.
- 학사 일정이 업데이트되면 자동으로 반영됩니다.

---

## 🔷 사용자 요청 처리 흐름

<img width="1287" height="413" alt="image" src="https://github.com/user-attachments/assets/e866bc56-66e4-4196-bb81-4a447d2550c4" />

- 카카오 챗봇은 사용자의 발화를 미리 정의된 의도와 매칭하고, 각 의도에 연결된 API를 호출하는 구조입니다.
- 예를 들어 "내일 기숙사 식당 점심 알려줘" 와 같은 자연어 요청이 들어오면, NLU가 식단 조회 의도로 분류 후 연결된 식단 API를 호출해 결과를 반환합니다.

---

## 🔷 설계 과정과 이유

제한된 기간과 팀 상황 안에서 왜 그렇게 설계했는지를 남기기 위해 작성했습니다.

각 의사결정은 `문제 → 원인 → 해결 → 결과/트레이드오프 → 느낀 점` 순서로 정리했습니다.

### 1. 데이터 모델링

<img width="4400" height="1026" alt="drawSQL-image-export-2026-04-30" src="https://github.com/user-attachments/assets/3cabfd3a-d025-4e36-957d-327afd0f7e2e" />
<br>

**캠퍼스/단과대학/학과(Campus/College/Department)**

- 캠퍼스, 단과대학, 학과는 서로 계층적인 관계를 가지고 있습니다.
- 4개의 캠퍼스, 17개의 단과대학, 116개의 학과가 있습니다. (2024년 기준)
- 캠퍼스, 단과대학, 학과는 각각 고유한 한글 이름과 영어 이름을 가지고 있습니다.
- 한글 이름은 사용자에게 보여주는 값으로 사용하고, 영어 이름은 데이터 수집 시 식별자로 사용합니다.

**공지사항(Notice)**

- 각 학과에는 0개 또는 1개 이상의 공지사항 게시판이 있습니다.
- 게시판 정보는 `notice_category`에 저장하고, 실제 공지 내용은 `notice`에 저장했습니다.
- `notice_category`에는 학과 ID, 게시판 ID, 마지막으로 수집한 공지 번호를 저장합니다.
- `notice`에는 제목, 작성일처럼 사용자에게 보여줄 공지 데이터를 저장합니다.
- 이렇게 분리하면 게시판별 수집 상태와 실제 공지 데이터를 따로 관리할 수 있습니다.

**학식(Cafeteria)**

- 학식 데이터는 식당 정보와 날짜별 메뉴 정보로 나누었습니다.
- `cafeteria`에는 캠퍼스, 식당명, 식당 타입, 외부 식당 ID 같은 정보를 저장합니다.
- `cafeteria_diet`에는 날짜, 요일, 시간대, 메뉴명처럼 매일 바뀌는 정보를 저장합니다.
- 식당 정보와 식단 정보를 분리해 같은 식당 정보를 반복해서 저장하지 않도록 했습니다.

**학사일정(Academic Calendar)**

- 학사일정은 일정 유형, 시작일, 종료일, 내용을 기준으로 저장했습니다.
- 개강, 시험, 수강신청처럼 기간이 있는 일정이 많아 시작일과 종료일을 따로 두었습니다.
- 특정 학과나 사용자보다 학교 전체에서 공통으로 사용하는 정보에 가까워 독립 테이블로 관리했습니다.
- 일정 유형을 저장해 특정 유형의 일정 필터링(예: 대학생, 대학원생 등)이 가능하도록 했습니다.

<br><br>

### 2. 제한된 리소스 환경에서의 인스턴스 분리

**문제**

- 서비스 초기에 GCP 프리티어 단일 인스턴스에서 API 서버, 스크래핑 작업, 모니터링을 함께 운영했습니다.
- 스크래핑 작업이나 메트릭 수집 시 API 응답이 눈에 띄게 느려지는 문제가 발생했습니다.

**원인**

- 배치 작업이 CPU와 메모리를 많이 사용하면서 API 서버가 사용할 자원이 부족해졌습니다.
- 메모리가 부족해지면서 스왑 메모리를 사용하게 되었고, 이로 인해 디스크 I/O가 증가했습니다.
- 여러 작업이 동시에 실행되면서 컨텍스트 스위칭이 증가해 전체적인 성능이 저하되었습니다.

<img width="60%" alt="image" src="https://github.com/user-attachments/assets/a6b9531e-9ee7-43c0-9303-7ff5072c34bf" />

**해결**

- 문제를 해결하기 위해 역할에 따라 인스턴스를 분리하는 구조로 개선했습니다.
  1. API 서버 전용 인스턴스
  2. 스크래핑 작업 전용 인스턴스
  3. 모니터링 전용 인스턴스
- 구글 계정 2개를 사용해 프리티어 인스턴스를 추가로 확보하여, 비용을 늘리지 않으면서도 작업을 나눠서 실행할 수 있었습니다.
- 스크래핑 작업은 Github Actions Runner를 활용하여 주기적으로 실행되도록 구성했습니다.

<img width="625" height="456" alt="image" src="https://github.com/user-attachments/assets/443aad76-76d1-4287-88e4-c9169a1aba75" />

**결과**

- 리소스 경쟁이 줄어들면서 전체 시스템의 성능이 개선되었습니다.
- 서비스 간 장애 전파 가능성을 줄였습니다.
- 수직 확장(서버 스펙 증가)이나 수평 확장(인스턴스 추가)을 하지 않고도 문제를 해결할 수 있었습니다.
- 결과적으로 성능 개선과 비용 절감을 동시에 달성할 수 있었습니다.

**트레이드오프**

- 배포 대상과 운영 지점이 늘어나 환경 변수, 네트워크, 모니터링 설정을 더 꼼꼼히 관리해야 했습니다.

**느낀 점**

- 인프라 자원은 정말 비싸다는 것을 느꼈습니다.
- 프리티어 자원을 최대한으로 활용하면 비용 지출 없이도 충분히 서비스를 운영할 수 있다는 것을 배웠습니다.

<br><br>

### 3. 교내 데이터 수집 방식 분리

**문제**

- 교내 페이지를 HTTP 요청 기반으로 수집했을 때 응답은 정상이어도 실제 데이터가 비어 있는 경우가 있었습니다.
- 동일한 페이지를 브라우저에서는 정상적으로 확인할 수 있었지만, 코드로 수집할 경우 데이터가 누락되는 문제가 발생했습니다.

**원인**

- 일부 페이지는 서버에서 완성된 HTML을 반환하는 SSR 방식이 아니라, JavaScript 실행 이후 데이터가 렌더링되는 CSR 구조였습니다.
- 따라서 단순 HTTP 요청으로는 초기 HTML만 받아오게 되어 실제 데이터가 포함되지 않았습니다.
- 브라우저에서는 JavaScript가 실행되면서 추가 API 요청을 통해 데이터를 가져오고 화면에 렌더링되기 때문에 차이가 발생했습니다.

<table>
  <tr>
    <td align="center">
      <img src="https://github.com/user-attachments/assets/a0d2b371-f61a-4b64-bf09-b387eed6ae6c" width="250"/><br/>
      <sub>SSR</sub>
    </td>
    <td align="center">
      <img src="https://github.com/user-attachments/assets/80b859da-e6ca-4c63-b4e9-e0885c676e85" width="250"/><br/>
      <sub>CSR</sub>
    </td>
  </tr>
</table>

**해결**

- 페이지 렌더링 방식에 따라 수집 방식을 분리했습니다.
  1. SSR 페이지 → HTTP 요청 기반 수집 유지
  2. CSR 페이지 → Selenium 기반 브라우저 렌더링 수집 적용
- 모든 페이지를 Selenium으로 처리하는 대신, 필요한 경우에만 선택적으로 적용하도록 설계했습니다.
- 이를 위해 페이지 구조를 분석하여 CSR 여부를 판단하는 기준을 정리하고, 수집 로직을 분기 처리했습니다.

<img width="789" height="460" alt="image" src="https://github.com/user-attachments/assets/d3de9343-feba-4ee5-a7b1-7226ec88d0c6" />

<br>

**결과**

- 데이터가 비어 오는 문제를 해결하고 수집 정확도를 크게 개선할 수 있었습니다.
- 필요한 페이지에만 Selenium을 적용하여 실행 시간과 리소스 사용량을 최소화할 수 있었습니다.

**느낀 점**

- 데이터를 잘 수집하기 위해서는 웹 통신 과정에 대한 이해가 꼭 필요하다는 것을 느꼈습니다.
- 특히 네트워크 탭을 통해 실제 API 요청 흐름을 분석하면서 문제를 해결할 수 있었던 경험이 인상 깊었습니다.
- 이 경험을 통해 기능 구현 전에 동작 원리를 먼저 이해하려는 습관이 중요하다는 것을 배웠습니다.

<br><br>

### 4. 수집 지연 감지를 위한 모니터링

**문제**

- 학식, 셔틀버스, 공지사항과 같은 데이터 수집이 지연되더라도 즉시 인지하기 어려웠습니다.
- 사용자가 오래된 데이터를 확인하기 전까지는 문제가 드러나지 않아 대응이 늦어지는 상황이 발생했습니다.

**원인**

- 기존에는 서버가 살아 있는지만 확인하고 있었습니다.
- 하지만 실제로 중요한 "데이터가 언제 마지막으로 갱신되었는지"는 확인하지 않고 있었습니다.
- 이로 인해 수집이 실패하거나 지연되더라도 바로 알 수 없는 구조였습니다.

**해결**

- Prometheus, Grafana, Sentry를 활용해 모니터링 환경을 구성했습니다.
- 데이터 수집 지연 감지는 PostgreSQL에 저장된 마지막 수집 시간과 현재 시간의 차이를 확인하는 쿼리로 체크했습니다.
- 해당 값을 Grafana 대시보드로 시각화하여, 데이터가 얼마나 지연되고 있는지 한눈에 확인할 수 있도록 했습니다.

<img width="70%" alt="image" src="https://github.com/user-attachments/assets/9819c68d-6664-4a7f-969f-e70ee26edceb" />

**결과**

- 실제로 셔틀버스 데이터가 약 156분 지연된 문제를 대시보드를 통해 빠르게 확인할 수 있었습니다.
- 원인을 확인한 결과 Github Actions의 cron 설정 문제였고, 실행 시간을 조정하여 해결했습니다.
- 이후에는 데이터 수집 지연을 빠르게 인지하고 대응할 수 있게 되었습니다.
- 다만 데이터 구조가 바뀔 때마다 모니터링 쿼리와 대시보드를 함께 수정해야 하는 번거로움이 있었습니다.

<img width="1301" height="224" alt="image" src="https://github.com/user-attachments/assets/2f066c7c-960c-483d-ba5a-313f9dd31a3f" />

**느낀 점**

- [모니터링을 공부](https://dongho-blog.kro.kr/posts/3145ca9b-265e-8028-9953-f659ea1a9c67)하면서 사용자가 알기 전에 문제를 발견할 수 있도록 하는 것이 서비스 운영에서 매우 중요하다고 느꼈습니다.
- 특히 p95 응답 속도, 에러율 같은 지표를 통해 사용자 경험에 직접적인 영향을 주는 요소를 기준으로 서비스를 바라봐야 한다는 것을 배웠습니다.

---

## 🔷 팀원 소개

<div align="center">
  <table>
    <tr>
      <td align="center" width="180">
        <a href="https://github.com/JangDongHo">
          <img src="https://github.com/JangDongHo.png" width="120" height="120" alt="Dongho Jang">
        </a>
        <br>
        <b>장동호</b>
        <br>
        <a href="https://github.com/JangDongHo">
          <img src="https://img.shields.io/badge/GitHub-JangDongHo-181717?style=flat-square&logo=github&logoColor=white" alt="JangDongHo">
        </a>
      </td>
      <td align="center" width="180">
        <a href="https://github.com/hykim02">
          <img src="https://github.com/hykim02.png" width="120" height="120" alt="hykim02">
        </a>
        <br>
        <b>김희영</b>
        <br>
        <a href="https://github.com/hykim02">
          <img src="https://img.shields.io/badge/GitHub-hykim02-181717?style=flat-square&logo=github&logoColor=white" alt="hykim02">
        </a>
      </td>
      <td align="center" width="180">
        <a href="https://github.com/hayeonkang">
          <img src="https://github.com/hayeonkang.png" width="120" height="120" alt="hayeonkang">
        </a>
        <br>
        <b>강하연</b>
        <br>
        <a href="https://github.com/hayeonkang">
          <img src="https://img.shields.io/badge/GitHub-hayeonkang-181717?style=flat-square&logo=github&logoColor=white" alt="hayeonkang">
        </a>
      </td>
      <td align="center" width="180">
        <a href="https://github.com/brainVRG">
          <img src="https://github.com/brainVRG.png" width="120" height="120" alt="brainVRG">
        </a>
        <br>
        <b>남민우</b>
        <br>
        <a href="https://github.com/brainVRG">
          <img src="https://img.shields.io/badge/GitHub-brainVRG-181717?style=flat-square&logo=github&logoColor=white" alt="brainVRG">
        </a>
      </td>
      <td align="center" width="180">
        <a href="https://github.com/minseob">
          <img src="https://github.com/minseob.png" width="120" height="120" alt="minseob">
        </a>
        <br>
        <b>김민섭</b>
        <br>
        <a href="https://github.com/minseob">
          <img src="https://img.shields.io/badge/GitHub-minseob-181717?style=flat-square&logo=github&logoColor=white" alt="minseob">
        </a>
      </td>
    </tr>
  </table>
</div>
