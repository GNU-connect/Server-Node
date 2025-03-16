<div align="center">
  <img src="https://github.com/GNU-connect/.github/blob/main/profile/image/logo.png?raw=true" alt="logo" width="200px">
  <br><br>
  <b>경상국립대 학우들을 위한 교내 정보 제공 카카오톡 챗봇 서비스</b>
  <br><br>

  [서비스 링크](https://pf.kakao.com/_bikxiG) &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp; [API 명세서](https://github.com/GNU-connect/.github/wiki/API-%EB%AA%85%EC%84%B8%EC%84%9C)&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;[DB 스키마](https://github.com/GNU-connect/.github/wiki/DB-%EC%8A%A4%ED%82%A4%EB%A7%88)&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;[컨벤션](https://github.com/GNU-connect/.github/wiki/%EC%BB%A8%EB%B2%A4%EC%85%98)

  <br> 2025.03.04 친구 수 2,000명 돌파 🎉
  <br> 2025.02.11 친구 수 1,500명 돌파 🎉
  <br> 2024.10.08 친구 수 1,000명 돌파 🎉
  <br> 2024.08.15 친구 수 500명 돌파 🎉
  <br> 2024.05.27 베타 테스트 시작
</div>
<br><br>

# ⭐️ 프로젝트 기능 소개
<br><br>

<div align="center">
  <h3>학교 & 학과 공지사항 조회</h3>
  <img src="https://github.com/GNU-connect/.github/blob/main/profile/image/notice.gif?raw=true" alt="notice" width="750px">
</div>
<br>

- 116개의 학과, 169개의 게시판에서 실시간으로 공지사항을 스크래핑하여 제공합니다.
- 사용자는 자신의 단과대학 및 학과를 선택하여 맞춤형 공지사항을 제공받을 수 있습니다.
- 공지사항을 클릭하면 원본 게시글로 이동할 수 있습니다.

<br><br>

<div align="center">
  <h3>학식 메뉴 조회</h3>
  <img src="https://github.com/GNU-connect/.github/blob/main/profile/image/diet.gif?raw=true" alt="diet" width="750px">
</div>
<br>

- 4개 캠퍼스, 9개의 식당 학식 메뉴를 조회할 수 있습니다.
- 원하는 캠퍼스 및 식당을 선택하면 해당 날짜의 메뉴를 한눈에 확인할 수 있습니다.
- 매주 새로운 학식 메뉴가 자동으로 업데이트됩니다.

<div align="center">
  <h3>학사일정</h3>
  <img src="https://github.com/GNU-connect/.github/blob/main/profile/image/calendar.gif?raw=true" alt="calendar" width="750px">
</div>
<br>

- 매월 주요 학사 일정을 한눈에 확인할 수 있습니다.
- 개강, 중간·기말고사, 수강신청 등 중요한 일정을 놓치지 않도록 도와줍니다.
- 학사 일정이 업데이트되면 자동으로 반영됩니다.

<br><br>

<div align="center">
  <h3>열람실 좌석</h3>
  <img src="https://github.com/GNU-connect/.github/blob/main/profile/image/library.gif?raw=true" alt="library" width="750px">
</div>
<br>

- 실시간으로 도서관 열람실의 잔여 좌석을 확인할 수 있습니다.
- Selenium 스크린샷 메서드를 활용하여 5분 간격으로 열람실 좌석 정보를 캡쳐하여 Supabase Stroage에 저장합니다.

<br><br>

# ⚙️ 프로젝트 구조

## 시스템 아키텍처

![alt text](https://raw.githubusercontent.com/GNU-connect/.github/refs/heads/main/profile/image/architecture.png)
<br><br>

## 기술 스택

| Category | Stack |
| :---: | --- |
| Frontend | ![](https://img.shields.io/badge/Kakao%20i%20Open%20Builder-FFCD00?logo=kakaotalk&logoColor=ffffff) |
| Backend | ![](https://img.shields.io/badge/python-3776AB?logo=python&logoColor=ffffff) ![](https://camo.githubusercontent.com/56177508a398e0e29196654b3d18d71e7afe4958e69dabfad6eae1ee05c282e7/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f4e6f64652e6a732d3131343431313f6c6f676f3d6e6f64652e6a73) ![](https://camo.githubusercontent.com/c1a21d38ebe312ca67c4239b306a70ad5c45cc97d35a987ee483c5d4fffdffc7/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f547970655363726970742d3331373843363f6c6f676f3d74797065736372697074266c6f676f436f6c6f723d666666666666) ![](https://camo.githubusercontent.com/771c66c24efade30eb5003b9bd0c0b95934decdaabb0147e118819eaa794f7db/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f4e6573744a532d4530323334453f6c6f676f3d6e6573746a73266c6f676f436f6c6f723d666666666666) ![](https://camo.githubusercontent.com/4e047329d99d0f2e66780a3a8f05a58374a7be61e1b2033ea3d8a43aa4a63644/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f547970654f524d2d4644463234413f6c6f676f3d747970656f726d266c6f676f436f6c6f723d666666666666) ![](https://img.shields.io/badge/pnpm-F69220?logo=pnpm&logoColor=ffffff) <br> ![](https://img.shields.io/badge/Spring%20Boot-6DB33F?logo=springboot&logoColor=white) ![](https://img.shields.io/badge/Redis-DC382D?logo=Redis&logoColor=white) ![](https://img.shields.io/badge/JUnit5-25A162?&logo=JUnit5&logoColor=white) ![](https://img.shields.io/badge/Hibernate-59666C?&logo=Hibernate&logoColor=white) ![](https://camo.githubusercontent.com/8571b20aadb7cc940f1b5b0610725fd53ee0f964b891b01d247d19ecff99926e/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f506f737467726553514c2d3431363945313f6c6f676f3d706f737467726573716c266c6f676f436f6c6f723d666666666666) |
| Deployment | ![](https://img.shields.io/badge/Google%20Cloud%20Platform-4285F4?logo=google-cloud&logoColor=ffffff) ![](https://camo.githubusercontent.com/ca093296b9d015edbfd5a950c38f335486f3be08b04022c70b2949aa4b97365a/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f6e67696e782d3031343533323f6c6f676f3d4e67696e78266c6f676f436f6c6f723d30303936333926) ![](https://camo.githubusercontent.com/00e52a40c165fca8664e331c61c4a9590d2c470a1b21532d57935c9672065159/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f47697448756220416374696f6e732d3230383846463f6c6f676f3d47697448756220416374696f6e73266c6f676f436f6c6f723d666666666666) ![](https://camo.githubusercontent.com/2f0cdd506c8a73c472da0bc4342401b8a3cdce3f12f1e4bdb92ca1f8627f667d/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f446f636b65722d3234393645443f6c6f676f3d646f636b6572266c6f676f436f6c6f723d666666666666) ![](https://img.shields.io/badge/sentry-362D59?logo=sentry&logoColor=ffffff) |
| Collaboration | ![](https://camo.githubusercontent.com/77eecc15d2bbf26e04ff2ce7f34025d72a0e11327fac97688a1c3fe0701853d5/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f4e6f74696f6e2d3030303030303f6c6f676f3d4e6f74696f6e) ![](https://camo.githubusercontent.com/f0a2f97aebc746865ebb9c711364148593ae2e35b8b7360b9ebf3d99a6fb1919/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f4669676d612d4632344531453f6c6f676f3d4669676d61266c6f676f436f6c6f723d666666666666) ![](https://camo.githubusercontent.com/8dfedc7e808ce3f0713da774a328e1f411774b13958e63df895bbaa4689e17b4/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f536c61636b2d3441313534423f6c6f676f3d536c61636b266c6f676f436f6c6f723d666666666666) |

<br><br>

# 🐾 팀원 소개

| <img src="https://avatars.githubusercontent.com/u/29221823?v=4" width="150" height="150"/> | <img src="https://avatars.githubusercontent.com/u/114382247?v=4" width="150" height="150"/> | <img src="https://avatars.githubusercontent.com/u/86334704?v=4" width="150" height="150"/> | <img src="https://avatars.githubusercontent.com/u/104495232?v=4" width="150" height="150"/> | <img src="https://avatars.githubusercontent.com/u/104495232?v=4" width="150" height="150"/> |
| :----------------------------------------------------------------------------------------: | :-----------------------------------------------------------------------------------------: | :----------------------------------------------------------------------------------------: | :-----------------------------------------------------------------------------------------: | :-----------------------------------------------------------------------------------------: |
|                Dongho Jang<br/>[@JangDongHo](https://github.com/JangDongHo)                |                     hykim02<br/>[@hykim02](https://github.com/hykim02)                      |                hayeonkang<br/>[@hayeonkang](https://github.com/hayeonkang)                 |                          [@brainVRG](https://github.com/brainVRG)                           |                                          @minseob                                           |

<sub>[Table made by TIT](https://team-info-table.seondal.kr/)</sub>
