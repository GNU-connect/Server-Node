# 커넥트 지누

![](https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F779e2c30-d00c-41e5-9026-e00f93a5505c%2Fb605875c-8bfc-4fd1-ae59-bd1cd3d8e99e%2FUntitled.png&blockId=73bbe720-67fa-4a92-8e45-318b1a78bd57)

![](https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F779e2c30-d00c-41e5-9026-e00f93a5505c%2Fedc996bb-61ab-4f8a-8582-284d6ba31e7f%2FUntitled.png&blockId=4192f6ec-4823-4e26-9304-d254759cc2d2)

# 1. 개요
- 프로젝트 명: 커넥트 지누
- 개발 기간: 2024. 03. 04 ~ 2024. 06. 02
- 운영 기간: 2024. 06. 03 ~ **현재**
- 인력 구성: 5명
- 서비스 링크: [`https://pf.kakao.com/_bikxiG`](https://pf.kakao.com/_bikxiG)
- Github 링크
    - 웹 스크래핑: https://github.com/GNU-connect/web-scraping
    - 챗봇 API 서버(Spring): https://github.com/GNU-connect/Server-JavaSpring
    - 챗봇 API 서버(NestJS): https://github.com/GNU-connect/Server-Node

# 2.  기술 스택

**COMMON**

- Notion
- Github
- Figjam
- Slack

**FRONT**

- 카카오 i 오픈 빌더

**BACK**

- Flask
- Spring
- PostgreSQL
- Tesseract OCR

**DEPLOY**

- Supabase
- Docker
- Docker Hub
- Nginx
- Jenkins
- Github Action
- Cent OS

# 3. 팀 구성

![](https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F779e2c30-d00c-41e5-9026-e00f93a5505c%2F621e14b0-4426-4eb3-a71e-ee344251a776%2FUntitled.png&blockId=388bd033-aeb7-4aa7-8846-d96ca56a492f)

# 4. 시스템 아키텍처

![](https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F779e2c30-d00c-41e5-9026-e00f93a5505c%2Fd6b58c95-d3ee-4319-943c-99c5b2405d47%2Fimage.png&blockId=1055ca9b-265e-8015-a3a7-feaf1d886a21)
![](https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F779e2c30-d00c-41e5-9026-e00f93a5505c%2F89754071-eb21-4b1b-9f29-c0148edf9fc3%2Fimage.png&blockId=1405ca9b-265e-8048-8f32-d747412e7170)

- 사용자가 **카카오톡 챗봇**에 요청을 보내면, 챗봇이 사용자의 **발화문을 분석**하여 **의도를 파악**한 후, 팀에서 미리 정의한 **서버 URL로 요청**을 보낸다.
- **Nginx**는 요청을 **Flask** 기반의 API 서버(이하 ‘학과 인증 API 서버’) 또는 Spring 기반의 API 서버(이하 ‘정보 전달 API 서버’)로 라우팅한다.
- **학과 인증 API 서버**는 **Tesseract OCR**을 사용해 사용자가 보낸 모바일 카드에서 학과 정보를 추출해내고 데이터베이스에 유저 정보를 전달하는 역할을 담당한다.
- **챗봇 API 서버**는 학과 공지사항 등 다양한 정보를 데이터베이스에서 꺼내와 사용자에게 맞춤형으로 제공하는 역할을 한다. 이 API 서버 같은 경우 커넥션 풀(Connection Pool)을 통해 데이터베이스를 효율적으로 관리하여, 많은 요청을 처리할 때도 성능을 유지할 수 있다.
- 데이터의 신뢰성과 정확성을 유지하기 위해 주기적으로 **웹 스크래핑 서버**를 가동하여 학교 웹사이트에서 데이터를 수집하고 처리한다. 이 서버는 스크래핑된 데이터를 데이터베이스에 저장하거나 업데이트한다.
- 마지막으로, **Github Actions**과 **Jenkins**를 활용한 **CI/CD 파이프라인**을 통해 자동으로 빌드, 테스트, 배포가 이루어지며, **Docker Hub**에 이미지를 푸시하여 각 서버가 이를 최신 상태로 유지한다.

# 5. 주요 기능

## 5.1. 공지사항

![](https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F779e2c30-d00c-41e5-9026-e00f93a5505c%2F56a3841e-fa68-4add-9f0f-a40df93f50e3%2FUntitled.png&blockId=6d7a3f91-a08b-42b3-8384-93e5b79ddc1e)

학교 공지사항 기능은 경상국립대학교에 대한 소식 및 정보를 알려주는 기능이다. 카테고리별로 공지사항을 확인할 수 있으며 날짜순으로 정렬하여 사용자가 가장 최근의 공지를 신속하게 확인할 수 있도록 하였다. 또한 각각의 공지 제목을 클릭하면 해당 공지사항 페이지로 이동하여 자세한 내용을 볼 수 있다.

학과 공지사항 기능은 위의 학교 공지사항과 동일한 기능을 수행하지만  사용 대상이 학교 전체 재학생들이 아닌 해당 학과의 학생들이다. 따라서 학과 인증을 완료한 학생들을 대상으로 사용자의 학과에 해당하는 공지사항들을 카테고리별로 확인 가능하다.

## 5.2. 학식 메뉴

![](https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F779e2c30-d00c-41e5-9026-e00f93a5505c%2F229e893e-ebb4-45b4-b49e-b0a43d453ddf%2FUntitled.png&blockId=e9e33ad0-a74c-466e-866e-1474de9445a3)

학식 메뉴 기능은 학생들이 평소에 가장 많이 찾아보고 궁금해하는 정보 중 하나이다. 커넥트 지누에서는 사진과 같이 “오늘 아람관 저녁 뭐 나와?” 와 같은 자연어를 이용해 챗봇에게 질문할 수 있다. 챗봇은 이러한 사용자의 질문 의도를 이해하고, 사용자의 발화문에서 중요한 정보들을 추출하여 그에 맞는 메뉴를 제공하도록 하였다.

## 5.3. 학사 일정

![](https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F779e2c30-d00c-41e5-9026-e00f93a5505c%2Fe10a8e79-9081-4357-b3ed-a0211ff08f0e%2FUntitled.png&blockId=8edcbb1d-286f-4ea2-bae4-91afc64cbd35)

학사 일정 기능도 학생들에게 중요한 정보 중 하나이다. 좌측 사진과 같이 월별 학사일정을 확인할 수도 있고, 우측 사진과 같이 ＂방학 언제야?” 같은 자연어를 이용해 질문을 해서 답변을 받을 수도 있다.

## 5.4. 열람실 좌석 조회

![](https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F779e2c30-d00c-41e5-9026-e00f93a5505c%2F4a292dd0-1f25-4de2-837f-92ca8b21eb7d%2FUntitled.png&blockId=5f3070d9-6a1e-4d5f-903e-1e6df2eda387)

열람실 좌석 조회 기능은 중앙도서관 각 열람실의 좌석 수와 좌석 현황을 이미지로 확인할 수 있는 기능이다. 기존에 클리커로 좌석을 조회할 때는 비콘 탐색으로 인해 4~5초 정도의 지연 시간이 발생해 불편함이 컸다. 커넥트 지누에서는 주기적으로 클리커 웹사이트에 직접 접근해 스크린샷을 찍어 유저에게 보여주는 방식으로 이를 개선했다.

## 5.5. 기본 감정

![](https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F779e2c30-d00c-41e5-9026-e00f93a5505c%2Fba73221c-69d3-4e35-8051-3a06bb1aa2ac%2FUntitled.png&blockId=01a5c274-7791-436e-89e6-90c1b0f8bef5)

지누의 캐릭터 이미지를 활용해 상황에 맞는 15개의 감정 메세지를 출력한다.

# 6. 기술적 고민

내가 팀에서 담당했던 역할은 교내 정보 수집 자동화와 데브옵스 환경을 구축하는 것이다.

이를 위해 다음과 같은 목표와 방법을 추구했다.
  1. 사람의 개입 없이 서비스가 돌아갈 수 있도록 정보 수집을 자동화 해야 한다.
  2. 오류가 발생할 경우 팀이 즉각 대응할 수 있도록 모니터링 시스템을 구축해야 한다.
  3. 장기적인 운영을 고려하여 소프트웨어 운영 비용을 최소화 해야 한다.

## 6.1. 교내 정보 수집 자동화

![](https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F779e2c30-d00c-41e5-9026-e00f93a5505c%2Fddcfcc7c-154f-4ad1-9f29-5ebc3ba67495%2FUntitled.png&blockId=546a3760-06d9-4662-8530-0dbd21f87ae6)

교내 정보 수집 자동화를 위해 BeautifulSoup, Selenium 과 같은 웹 스크래핑 라이브러리를 사용한 파이썬 스크립트를 작성하고, 이 스크립트를 Github Actions를 통해 주기적으로 실행하도록 설정하였다. 같은 카테고리에 속하는 교내 정보들의 HTML 구조는 크게 다르지 않았기에, 수집할 웹페이지 URL만 변경하고 공통 스크립트를 재사용하여 효율적으로 데이터를 수집할 수 있도록 하였다.

![](https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F779e2c30-d00c-41e5-9026-e00f93a5505c%2F90fb0bea-9a60-4ad1-a4f0-6aff3e9c6592%2FUntitled.png&blockId=6cafec49-8b32-4538-adde-08e8fee9d229)
![](https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F779e2c30-d00c-41e5-9026-e00f93a5505c%2F6d14089f-24f4-47e2-833e-4b8449db64c5%2FUntitled.png&blockId=bf192b2a-4f1b-44d2-ae06-bd1e74537254)

수집할 웹페이지 URL과 수집된 웹페이지의 정보들을 저장하기 위해 Supabase를 사용하였다. Supabase는 **PostgreSQL**을 기반으로 하는 오픈 소스 서버리스 클라우드 데이터베이스이다. 온프레미스 환경이 아닌 Supabase를 선택한 이유는 사용자 친화적인 API 및 쉬운 설정으로 개발 생산성을 크게 높일 수 있고 데이터를 읽고 쓰는데 요금이 책정되지 않았기 때문에 비용 부담을 줄일 수 있었기 때문이다.

데이터베이스 설계는 다음과 같이 진행되었다. 우선, 각 학과별로 공지사항 카테고리가 여러 개 존재할 수 있는 One-to-Many 관계이다. 이를 해결 하기 위해 `학과 공지사항 카테고리`라는 테이블을 설계하여 각 학과와 공지사항 카테고리 간의 관계를 저장하였다. 이 테이블에는 학과 공지사항 카테고리의 URl 정보이 저장된다.

또한, 실제 공지사항 정보를 저장 하기 위해 `학과 공지사항 게시글` 테이블을 만들었다. 이 테이블은 각 게시글의 제목, 내용, 작성일자 등의 필드를 포함하며, 각 게시글이 어떤 학과의 어떤 카테고리에 속하는지를 외래키로 관리한다.

![](https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F779e2c30-d00c-41e5-9026-e00f93a5505c%2F6cb1bb64-1c38-41c8-b1c2-c922fd9da4a4%2FUntitled.png&blockId=db05afcf-7d2f-4733-86df-848559c5250f)

교내 정보들이 정상적으로 수집되고 있는지 팀원들이 모두 알 수 있도록 Slack을 통해 알림이 전달된다. 이를 통해, 문제가 발생했을 때 신속하게 대응할 수 있었다.

## 6.2. 배포 자동화

![](https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F779e2c30-d00c-41e5-9026-e00f93a5505c%2F6a981398-a6a8-484d-a905-8e200d36ae77%2Fimage.png&blockId=1415ca9b-265e-80a2-b1e6-eccbf4dcef02)

 커넥트 지누의 API 서버들은 클라우드 환경이 아닌 학교 연구실 서버 환경에서 운영되고 있다. 연구실 서버의 운영체제는 CentOS이며, 개발 환경과 운영 환경의 일관성을 유지하기 위해 Docker를 도입하였다. 또한, CI/CD 파이프라인을 구축하여 애플리케이션을 패키징하고 배포한다. 커넥트 지누의 CI/CD 파이프라인은 Github, Jenkins, Docker Hub와 같은 도구를 사용하여 자동화된다. 팀원이 코드 변경 사항을 GitHub에 푸시하면, Jenkins가 이를 감지하고 빌드 및 테스트를 자동으로 수행한다. 성공적으로 빌드된 Docker 이미지는 Docker Hub에 푸시되고, 각 서버는 이를 풀링하여 최신 상태로 유지된다. 

![](https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F779e2c30-d00c-41e5-9026-e00f93a5505c%2Fccb94975-6989-47c6-9da4-0dbf6d2c8a12%2FUntitled.png&blockId=88e910f9-75af-446c-9738-e0fbe871e5b1)

 각 서버의 빌드 및 배포 상태도 마찬가지로 Slack을 통해 팀에 실시간으로 알림이 전달된다.

## 6.3. Sentry + Slack을 활용한 장애 대응

![](https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F779e2c30-d00c-41e5-9026-e00f93a5505c%2F85f37957-ddb1-4ec3-8440-9e5f78db801d%2FUntitled.png&blockId=cb98fa59-d954-437a-a6d7-d3f8c5998ac0)

Sentry와 Slack을 통합하여 팀의 장애 대응 능력을 강화하였다. Sentry는 우리 API 서버에서 발생하는 오류와 예외를 모니터링하고, 이를 Slack으로 실시간으로 알림을 받을 수 있도록 설정하였다. 이를 통해 발생한 오류에 대한 상세한 정보와 함께 신속하게 대응할 수 있는 환경을 조성하였다.

![](https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F779e2c30-d00c-41e5-9026-e00f93a5505c%2F66b6416b-f6a9-46ec-9a43-4bbb178f2324%2FUntitled.png&blockId=66239857-7141-4aa6-902a-39988b55ed67)

 커넥트 지누 초기 배포 당시, 학생들의 모바일 카드를 이용해 학과 인증을 진행했는데 예상했던과 달리 오류가 많이 발생했다. 모바일 카드를 인증하는 프로세스를 간략히 설명하면 다음과 같다.

1. **이미지 전송**: 사용자가 챗봇에게 전자출결 어플리케이션 상단에 있는 모바일 카드를 캡쳐하여 전송한다.
2. **유저 DB 조회**: 이미 학과 인증을 진행한 사용자인지 확인한다.
3. **코사인 유사도 계산:** 이미지 진위 여부를 확인하기 위해 서버에 저장돼있는 팀장의 모바일 카드와 사용자의 모바일 카드를 비교해서 코사인 유사도가 일정 threshold 값을 넘으면 다음 단계로 넘어간다.
4. **학과 정보 인식:** Tesseract OCR을 사용하여 이미지에서 텍스트를 추출한다.
5. **학과 정보 매칭:** 이미지에서 추출한 텍스트 중 DB에 등록돼있는 학과 이름과 동일한 학과 이름을 찾아낸다.
6. **유저 DB 저장:** 사용자의 카카오톡 식별자와 학과 정보를 유저 DB에 저장한다.

![](https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F779e2c30-d00c-41e5-9026-e00f93a5505c%2Fa5367352-9722-457f-97a0-94173bb4a042%2FUntitled.png&blockId=e930bf9d-3537-409d-817d-1af7bd26fed9)

원인을 파악하기 위해 각 단계 별로 오류를 해결하는데 도움이 되는 로그를 남기기 시작하였다.

실제 장애 대응을 할 때 큰 도움을 받았던 대표적인 사례 중 한 가지가 `영어영문학부` 였다.

영어영문학부는 크게 `영어영문학전공`과 `영어전공`으로 나뉘는데 실제 모바일 카드에서는 세부 전공명이 적혀있지 않아 인증이 되지 않았다.

다행히, Sentry에 모바일 카드에서 추출한 텍스트를 확인할 수 있게 만들어놨기에 빠르게 문제를 해결할 수 있었다.

## 6.4. 카카오 챗봇 통계 데이터 활용

---

![](https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F779e2c30-d00c-41e5-9026-e00f93a5505c%2Fa9b581ab-a42f-4e6b-8b93-ab30294b1b0d%2FUntitled.png&blockId=e9c6c883-014a-4ae4-bd41-b1f7d1e752a6)

2024-05-29 ~ 2024-06-27 블록 호출 수

Sentry와 더불어 서비스를 운영하는 데 가장 도움이 됐던 것은 카카오 챗봇 통계 데이터였다. 카카오 챗봇 통계 데이터를 통해 사용자들이 어떤 기능을 많이 사용하는지 알 수 있었기 때문에 자연스럽게 향후에 어떤 기능을 집중적으로 개선하고 발전시켜야 하는지를 파악할 수 있었다.

![](https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F779e2c30-d00c-41e5-9026-e00f93a5505c%2F2c0739ea-6e9a-4f81-9ab0-7b3b1d4c1b0d%2FUntitled.png&blockId=ba2e0352-5a9c-46f2-9b82-bb729a5bb6a3)

또한, 재방문사용자와 신규사용자 방문 수를 통해 서비스의 지속 가능성을 확인했다. 아무리 잘 만든 서비스라도 사용자들의 재방문이 없으면 서비스의 장기적인 성장과 발전이 어려울 수 있기 때문이다. 다행히 서비스를 홍보한 이후, 많지는 않지만 꾸준하게 서비스를 방문해주시는 분들이 계셨다.

# 7. 성과

## 7.1. 프로젝트 성과 요약

---

![](https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F779e2c30-d00c-41e5-9026-e00f93a5505c%2F8d1ad251-e384-498c-b404-42484348b7c1%2FUntitled.png&blockId=48d76906-e99a-42dc-a65a-e7b66182ce07)

 2023년 5월 26일 커넥트 지누는 클로즈드 베타 서비스를 시작한 후, 버그 수정 및 기능 개선 작업을 거쳐 2023년 6월 3일 대학교 커뮤니티 에브리타임을 통해 홍보하여 오픈 베타 서비스를 시작했다. 그 결과 1,000명 이상의 사용자가 챗봇을 방문했으며, 이 중 약 38%인 384명이 친구 추가를 했다. 또한, 이 중 약 45%인 173명이 학과 인증을 완료했으며, 현재는 62개의 학과의 학생들이 서비스를 이용하고 있는 것으로 파악되었다. 이는 많은 수의 경상국립대학교 학생들이 챗봇 서비스를 유용하게 사용하고 있음을 보여준다.

## 7.2. 만족도 조사

---

![](https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F779e2c30-d00c-41e5-9026-e00f93a5505c%2F409e37ad-f18a-42db-8fa6-01a093c291eb%2FUntitled.png&blockId=15cee004-fd6e-4420-921c-84e95b800c68)

 또한, 오픈 베타 서비스 기간 동안 구글 설문지 폼을 이용해 사용자들에게 이용 후기를 수집 하였다. 총 104분이 설문지를 작성해주셨고 93% 정도의 사용자분들이 커넥트 지누 서비스를 만족하면서 사용하고 있는 것으로 확인했다. 주요 긍정 평가로는 “평소에 공지사항 사이트를 귀찮게 들어가서 찾아보고 해야하는데 카카오톡으로 편리하게 볼 수 있어서 너무 좋았다.” 라는 내용이 주를 이루었다.
 하지만, 아직 개선할 점도 많다. 주요 부정적인 평가로는 대화가 매끄럽지 않다는 의견이 많았다. 향후에는 이러한 피드백을 바탕으로 챗봇의 자연어 처리 능력을 강화하여 사용자와의 상호작용을 보다 자연스럽고 유연하게 만들고자 한다.
