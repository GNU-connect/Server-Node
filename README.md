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

## 설계 과정과 이유

제한된 기간과 팀 상황 안에서 왜 그렇게 설계했는지를 남기기 위해 작성했습니다.

각 의사결정은 `문제 → 선택 → 근거 → 결과/트레이드오프 → 느낀 점` 순서로 정리했습니다.

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
