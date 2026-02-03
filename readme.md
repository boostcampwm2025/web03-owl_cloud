# 🖥️ dev:meet - 코드와 설계, 대화의 맥락이 하나로 이어지는 공간

<img width="1470" height="719" alt="Image" src="https://github.com/user-attachments/assets/acf519a7-d1be-4633-98b3-40361483a6c2" />

## 🛎️ 서비스 소개

> 서비스 URL: https://www.devmeet.p-e.kr/

`"화상 회의 따로, 설계 따로, 코드 공유 따로... 번거로운 협업은 이제 그만!"`

- dev:meet는
  화상 회의, 실시간 코드 편집, 화이트보드를 하나의 브라우저 탭에서 통합 제공하는
  개발자 전용 실시간 협업 플랫폼입니다.

- 대상 사용자: 개발자 / 페어 프로그래밍 / 기술 회의

<br/>

## ❓ 문제 정의

### 기존 협업 환경의 한계

프로젝트 회의나 페어 프로그래밍 시, 우리는 여러 도구를 병행 사용합니다.

| 사용 목적         | 도구               |
| ----------------- | ------------------ |
| 화상 회의         | Zoom, Google Meet  |
| 코드 공유         | VS Code Live Share |
| 설계 / 다이어그램 | excalidraw, Miro   |

이러한 도구 파편화는 다음과 같은 문제를 발생시킵니다.

- 문제점
  - 컨텍스트 스위칭 비용: 툴 전환이 잦아질수록 집중력 저하 및 논의 흐름 단절
  - 협업 환경 설정 비용: 페어 프로그래밍을 위한 세션 생성, 권한 설정의 번거로움
  - 표현력의 한계: 코드 블럭만으로는 아키텍처, 로직 흐름 설명에 제약

### 🎯 해결 목표

dev:meet는 분리된 협업 도구로 인한 비효율을 하나의 흐름으로 통합하고자 합니다.

```
“개발자가 협업을 위해 여러 도구를 오가는 비효율을 줄이고,
하나의 공간에서 실시간 소통과 구현이 자연스럽게 이루어지도록 한다.”
```

- 협업 흐름을 단일 컨텍스트로 통합
- 실시간 미디어 환경에서도 안정적인 성능 유지
- 개발 회의에 최적화된 UX 제공

➡️ **dev:meet는 이 모든 과정을 하나로 합쳐, 오직 '개발'과 '소통'에만 집중할 수 있는 환경을 제공합니다.**

<br/>

## ⭐ 서비스 주요 기능

### 1️⃣ 그룹 화상 회의 & 화면 공유

- WebRTC (SFU) 기반 실시간 화상/음성 통화
- 화면 공유 및 발표자 전환 지원
- 참여자 수 증가 시에도 안정적인 미디어 처리

![Image](https://github.com/user-attachments/assets/018c93a1-60d8-45da-92fb-3dc78afe8adf)

### 2️⃣ 실시간 동기화 코드 에디터

- 기능
  - Monaco Editor 기반 코드 편집 환경
  - 자동 완성, 문법 하이라이팅, 에러 감지 지원
  - 다중 사용자 실시간 편집 동기화

- 활용 시나리오
  - 페어 프로그래밍
  - 라이브 코딩 리뷰
  - 알고리즘 풀이 스터디

![Image](https://github.com/user-attachments/assets/78553390-ab7a-4c69-a702-dea2d7a60887)

### 3️⃣ 공유 화이트보드

- 기능
  - Canvas API 기반 자유 드로잉
  - 아키텍처 다이어그램 및 흐름도 시각화
  - 회의 중 즉각적인 아이디어 공유

- 활용 시나리오
  - 시스템 설계 설명
  - 로직 흐름 정리
  - 브레인스토밍

![Image](https://github.com/user-attachments/assets/670f3b67-02d9-4ed2-bdfa-c712bff96ffa)

### 4️⃣ 실시간 채팅

- 회의 중 메시지 송수신
- 링크 및 파일(사진, 동영상, 문서 등) 공유
- 미디어 통화와 분리된 보조 커뮤니케이션 채널

![Image](https://github.com/user-attachments/assets/af0279ee-83ba-4bd9-a0dc-80ce31122aaf)

### 5️⃣ 추후 확장 방향

- 화면 스플릿 기능을 통한 화이트보드, 코드 에디터 동시 작업
- 화이트보드, 코드 에디터 결과물 저장 및 파일로 내보내기
- Mermaid 코드 → 다이어그램 변환
- 가상 배경 추가

<br/>

## 🔧 기술 스택

- Collaboration & Tools

  <img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white"/> <img src="https://img.shields.io/badge/Notion-000000?style=for-the-badge&logo=notion&logoColor=white"/> <img src="https://img.shields.io/badge/Slack-4A154B?style=for-the-badge&logo=slack&logoColor=white"/> <img src="https://img.shields.io/badge/Gitflow-F05032?style=for-the-badge&logo=git&logoColor=white"/>

- Frontend

  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white"/> <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white"/> <img src="https://img.shields.io/badge/TailwindCSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white"/> <img src="https://img.shields.io/badge/Zustand-443E38?style=for-the-badge&logo=react&logoColor=white"/> <img src="https://img.shields.io/badge/Konva-0D83CD?style=for-the-badge&logo=konva&logoColor=white"/> <img src="https://img.shields.io/badge/Monaco%20Editor-007ACC?style=for-the-badge&logo=visualstudiocode&logoColor=white"/> <img src="https://img.shields.io/badge/Yjs-D14836?style=for-the-badge&logo=yjs&logoColor=white"/>

- Backend

  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white"/> <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white"/> <img src="https://img.shields.io/badge/MySQL2-4479A1?style=for-the-badge&logo=mysql&logoColor=white"/> <img src="https://img.shields.io/badge/mediasoup-WebRTC-FF6F00?style=for-the-badge&logo=webrtc&logoColor=white"/> <img src="https://img.shields.io/badge/AWS%20SDK-Amazon-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white"/> <img src="https://img.shields.io/badge/Jest-C21325?style=for-the-badge&logo=jest&logoColor=white"/>

- Infra

  <img src="https://img.shields.io/badge/Naver%20Cloud%20Platform-03C75A?style=for-the-badge&logo=naver&logoColor=white"/> <img src="https://img.shields.io/badge/AWS%20S3-569A31?style=for-the-badge&logo=amazons3&logoColor=white"/> <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white"/> <img src="https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white"/> <img src="https://img.shields.io/badge/Kafka-231F20?style=for-the-badge&logo=apachekafka&logoColor=white"/> <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white"/> <img src="https://img.shields.io/badge/GitHub%20Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white"/> <img src="https://img.shields.io/badge/Kubernetes-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white"/> <img src="https://img.shields.io/badge/Prometheus-E6522C?style=for-the-badge&logo=prometheus&logoColor=white"/> <img src="https://img.shields.io/badge/Grafana-F46800?style=for-the-badge&logo=grafana&logoColor=white"/>
  

<br/>

## 🏗️ 시스템 아키텍처

<img width="12986" height="6982" alt="Image" src="https://github.com/user-attachments/assets/e8ce3827-2eca-4664-9f08-cd6d0fcfed0f" />

<br/>

## 🚀 빌드 & 실행 (One-shot)

### 1. 저장소 clone

```bash
git clone https://github.com/boostcampwm2025/web03-devmeet.git
cd devmeet
```

### 2. 환경변수 설정

각 서비스별로 .env.example 파일을 기반으로 .env 파일을 생성합니다.

<details>
  <summary>
  <b>
  [frontend/.env.example]
  </b>
  </summary>

```bash
# 소켓 통신 및 공통 서버 기본 주소
NEXT_PUBLIC_SERVER_URL="http://localhost:8080"

# REST API 호출에 사용되는 API 서버 주소
NEXT_PUBLIC_API_SERVER_URL="http://localhost:8080/api"

# 실시간 협업 툴(코드 에디터, 화이트보드) 백엔드 기본 주소
NEXT_PUBLIC_TOOL_BACKEND_URL="http://localhost:8000"

# WebSocket 공통 prefix
NEXT_PUBLIC_TOOL_BACKEND_WEBSOCKET_PREFIX="/tool/ws"

# 실시간 코드 에디터 WebSocket 엔드포인트
NEXT_PUBLIC_TOOL_BACKEND_WEBSOCKET_CODEEDITOR="/codeeditor"

# 화이트보드 WebSocket 엔드포인트
NEXT_PUBLIC_TOOL_BACKEND_WEBSOCKET_WHITEBOARD="/whiteboard"
```

</details>

<details>
  <summary>
  <b>
  [rep/main_backend/.env.example]
  </b>
  </summary>

```bash
NODE_PORT=8080
NODE_HOST="0.0.0.0"
NODE_ENV="deployment"

NODE_BACKEND_PREFIX="api"
NODE_BACKEND_WEBSOCKET_PREFIX="/api/ws"

NODE_BACKEND_SERVER="http://localhost:8080"
NODE_FRONTEND_SERVER="http://localhost:3000"

# CORS 설정
NODE_ALLOWED_ORIGIN="http://localhost:3000"
NODE_ALLOWED_METHODS="GET,POST,PUT,DELETE,PATCH"
NODE_ALLOWED_HEADERS="Content-Type, Accept, Authorization"
NODE_ALLOWED_CREDENTIALS="true"
NODE_ALLOWED_EXPOSE_HEADERS="x-access-token"

# Database 설정
NODE_APP_DATABASE_HOST="데이터베이스 host (예: 127.0.0.1)"
NODE_APP_DATABASE_PORT="데이터베이스 port (예: 3306)"
NODE_APP_DATABASE_NAME="데이터베이스 이름 (예: db)"
NODE_APP_DATABASE_USER="데이터베이스 사용자명"
NODE_APP_DATABASE_PASSWORD="데이터베이스 비밀번호"

# Redis 설정
NODE_APP_REDIS_URL="redis://localhost:6379"
NODE_APP_REDIS_PASSWORD="레디스 비밀번호"

# JWT 설정
NODE_APP_JWT_ACCESS_SECRET_KEY="access token secret"
NODE_APP_JWT_ACCESS_EXPIRED_TIME="5m"
NODE_APP_JWT_REFRESH_SECRET_KEY="refresh token secret"
NODE_APP_JWT_REFRESH_EXPIRED_TIME="7d"
NODE_APP_JWT_ISSUE_NAME="jwt issuer"
NODE_APP_JWT_AUDIENCE_NAME="jwt audience"
NODE_APP_JWT_ALGORITHM="HS256"

# Kakao OAuth 설정
NODE_APP_KAKAO_REST_API_KEY="카카오 REST API 키"
NODE_APP_KAKAO_CLIENT_SECRET="카카오 CLIENT SECRET"

# AWS S3 설정
NODE_APP_AWS_ACCESS_KEY="AWS access key"
NODE_APP_AWS_SECRET_KEY="AWS secret key"
NODE_APP_AWS_BUCKET_NAME="S3 bucket 이름"
NODE_APP_AWS_REGION_NAME="AWS region"
NODE_APP_AWS_PRESIGNED_URL_EXPIRES_SEC="presigned url 만료 시간(초)"

# Kafka 설정
NODE_APP_KAFKA_BROKERS="kafka broker 주소"
NODE_APP_KAFKA_CLIENT_ID="kafka client id"
NODE_APP_KAFKA_GROUP_ID="kafka group id"
NODE_APP_KAFKA_SASL_USERNAME="kafka username"
NODE_APP_KAFKA_SASL_PASSWORD="kafka password"
NODE_APP_KAFKA_SASL_MECHANISM="sasl mechanism"
NODE_APP_KAFKA_SSL="true/false"

# 화상회의(SFU) 설정
NODE_APP_SFU_PUBLIC_IP="SFU public IP"

# Tool Backend 협업 인증
NODE_APP_TICKET_PRIVATE_JWK="private jwk"
NODE_APP_TICKET_PUBLIC_JWK="public jwk"
NODE_APP_TICKET_ISS="main_backend"
NODE_APP_TICKET_AUD="tool_backend"

# Prometheus 설정
NODE_APP_PROMETHEUS_DEFAULT_PREFIX="main_backend_"
NODE_APP_PROMETHEUS_SERVICE_LABEL="main-backend"
NODE_APP_PROMETHEUS_SERVICE_ENV="local"

```

</details>

<details>
  <summary>
  <b>
  [rep/tool_backend/.env.example]
  </b>
  </summary>

```bash
NODE_PORT=8000
NODE_HOST="0.0.0.0"
NODE_ENV="deployment"
NODE_BACKEND_PREFIX="tool"

# CORS 설정
NODE_ALLOWED_ORIGIN="http://localhost:3000"
NODE_ALLOWED_METHODS="GET,POST,PUT,DELETE,PATCH"
NODE_ALLOWED_HEADERS="Content-Type, Accept, Authorization"
NODE_ALLOWED_CREDENTIALS="true"

# Database 설정
NODE_APP_DATABASE_HOST="데이터베이스 host"
NODE_APP_DATABASE_PORT="3306"
NODE_APP_DATABASE_NAME="db"
NODE_APP_DATABASE_USER="user"
NODE_APP_DATABASE_PASSWORD="password"

# Redis 설정
NODE_APP_REDIS_URL="redis://localhost:6379"
NODE_APP_REDIS_PASSWORD="레디스 비밀번호"

# Kafka 설정
NODE_APP_KAFKA_BROKERS="kafka broker"
NODE_APP_KAFKA_CLIENT_ID="client id"
NODE_APP_KAFKA_GROUP_ID="group id"
NODE_APP_KAFKA_SASL_USERNAME="username"
NODE_APP_KAFKA_SASL_PASSWORD="password"
NODE_APP_KAFKA_SASL_MECHANISM="mechanism"
NODE_APP_KAFKA_SSL="true/false"

# WebSocket 설정
NODE_BACKEND_WEBSOCKET_PREFIX="/tool/ws"
NODE_BACKEND_WEBSOCKET_WHITEBOARD="/whiteboard"
NODE_BACKEND_WEBSOCKET_CODEEDITOR="/codeeditor"

# JWK 검증
NODE_APP_TICKET_PUBLIC_JWK="public jwk"
NODE_APP_TICKET_AUD="tool_backend"

# Prometheus 설정
NODE_APP_PROMETHEUS_DEFAULT_PREFIX="tool_backend_"
NODE_APP_PROMETHEUS_SERVICE_LABEL="tool-backend"
NODE_APP_PROMETHEUS_SERVICE_ENV="local"

```

</details>

<br/>

**frontend**

```bash
cd frontend
cp .env.example .env.local
```

**main_backend**

```bash
cp rep/main_backend/.env.example .env.main.backend
```

**tool_backend**

```bash
cp rep/tool_backend/.env.example .env.tool.backend
```

⚠️ 실제 서버 주소, DB 정보, 인증 키 값은 .env 파일에 직접 입력해야 합니다.

### 3. 도커 실행

```bash
docker compose up -d
```

### 4. 개발 모드 실행 (선택)

Docker 없이 개별 서비스 단독 실행도 가능합니다.

### Frontend

```bash
cd frontend
pnpm install
pnpm run dev
```

### Backend

```bash
cd rep/main_backend
pnpm install
pnpm start:dev
```

```bash
cd rep/tool_backend
pnpm install
pnpm start:dev
```

### 5. 서비스 접속

브라우저에서 아래 주소로 접속하여 서비스를 이용할 수 있습니다.

👉 [**http://localhost:3000**](http://localhost:3000/)

<br/>

## ⛏️ 문제 해결 과정 및 기술 경험

### [FE] 통화 음질 개선

- 작성자: Tony (윤장호)
- [🔗 링크](https://github.com/boostcampwm2025/web03-devmeet/wiki/%5BFE%5D-%ED%86%B5%ED%99%94-%EC%9D%8C%EC%A7%88-%EA%B0%9C%EC%84%A0)

### [FE] React-Konva 라이브러리 환경에서의 SVG 렌더링 이슈 및 해결 방안

- 작성자: Kuma (차지태)
- [🔗 링크](https://github.com/boostcampwm2025/web03-devmeet/wiki/%5BFE%5D-React%E2%80%90Konva-%EB%9D%BC%EC%9D%B4%EB%B8%8C%EB%9F%AC%EB%A6%AC-%ED%99%98%EA%B2%BD%EC%97%90%EC%84%9C%EC%9D%98-SVG-%EB%A0%8C%EB%8D%94%EB%A7%81-%EC%9D%B4%EC%8A%88-%EB%B0%8F-%ED%95%B4%EA%B2%B0-%EB%B0%A9%EC%95%88)

### [n8n] 코드 리뷰 자동화
- 작성자: Kuma (차지태)
- [🔗 링크](https://github.com/boostcampwm2025/web03-devmeet/wiki/%5BCode-Review%5D-n8n%EC%9C%BC%EB%A1%9C-%EC%BD%94%EB%93%9C%EB%A6%AC%EB%B7%B0-%EA%B0%9C%EC%84%A0-%EB%B0%8F-%EB%B3%B4%EC%99%84%ED%95%98%EA%B8%B0)

### [FE] canvas 재렌더링 문제 및 개선

- 작성자: Andrew (이선우)
- [🔗 링크](https://github.com/boostcampwm2025/web03-devmeet/wiki/%5BFE%5D-canvas-%EC%9E%AC%EB%A0%8C%EB%8D%94%EB%A7%81-%EB%AC%B8%EC%A0%9C-%EB%B0%8F-%EA%B0%9C%EC%84%A0)

### [FE] Redo Undo 시 아이템 중복 생성 문제 및 개선

- 작성자: Andrew (이선우)
- [🔗 링크](https://github.com/boostcampwm2025/web03-devmeet/wiki/%5BFE%5D-Redo-Undo-%EC%8B%9C-%EC%95%84%EC%9D%B4%ED%85%9C-%EC%A4%91%EB%B3%B5-%EC%83%9D%EC%84%B1-%EB%AC%B8%EC%A0%9C-%EB%B0%8F-%EA%B0%9C%EC%84%A0)

### [FE] next image의 비동기 로딩에 따른 Layout Shift와 채팅 스크롤 동기화 개선

- 작성자: Lisey (이채민)
- [🔗 링크](https://github.com/boostcampwm2025/web03-devmeet/wiki/%5BFE%5D-next-image%EC%9D%98-%EB%B9%84%EB%8F%99%EA%B8%B0-%EB%A1%9C%EB%94%A9%EC%97%90-%EB%94%B0%EB%A5%B8-Layout-Shift%EC%99%80-%EC%B1%84%ED%8C%85-%EC%8A%A4%ED%81%AC%EB%A1%A4-%EB%8F%99%EA%B8%B0%ED%99%94-%EA%B0%9C%EC%84%A0)

### [BE] 회의 단위 협업 툴 상태 공유 문제 해결 과정

- 작성자: Logan (김동완)
- [🔗 링크](https://github.com/boostcampwm2025/web03-devmeet/wiki/%5BBE%5D-%ED%9A%8C%EC%9D%98-%EB%8B%A8%EC%9C%84-%ED%98%91%EC%97%85-%ED%88%B4-%EC%83%81%ED%83%9C-%EA%B3%B5%EC%9C%A0-%EB%AC%B8%EC%A0%9C-%ED%95%B4%EA%B2%B0-%EA%B3%BC%EC%A0%95)

### [BE] Yjs 기반 문서 동기화 문제 해결 과정

- 작성자: Logan (김동완)
- [🔗 링크](https://github.com/boostcampwm2025/web03-devmeet/wiki/%5BBE%5D-Yjs-%EA%B8%B0%EB%B0%98-%EB%AC%B8%EC%84%9C-%EB%8F%99%EA%B8%B0%ED%99%94-%EB%AC%B8%EC%A0%9C-%ED%95%B4%EA%B2%B0-%EA%B3%BC%EC%A0%95)

<br/>

## 🦉 Team OwlCloud 소개

<img width="1600" alt="image" src="https://github.com/user-attachments/assets/8a2a6ac9-b3a8-4bc1-a034-f20247321440" />

|                        Logan(로건)                         |                         Tony(토니)                         |                      Andrew(앤드류)                       |                        Lisey(리시)                        |                        Kuma(쿠마)                         |
| :--------------------------------------------------------: | :--------------------------------------------------------: | :-------------------------------------------------------: | :-------------------------------------------------------: | :-------------------------------------------------------: |
|                            ISTP                            |                            INFP                            |                           ISTP                            |                           ISTJ                            |                           ESTJ                            |
|          [@KimDwDev](https://github.com/KimDwDev)          |         [@seorang42](https://github.com/seorang42)         |         [@tjsdn052](https://github.com/tjsdn052)          |         [@chamny20](https://github.com/chamny20)          |         [@ChaJiTae](https://github.com/ChaJiTae)          |
| ![](https://avatars.githubusercontent.com/u/212347248?v=4) | ![](https://avatars.githubusercontent.com/u/123955813?v=4) | ![](https://avatars.githubusercontent.com/u/74086324?v=4) | ![](https://avatars.githubusercontent.com/u/80542421?v=4) | ![](https://avatars.githubusercontent.com/u/55056889?v=4) |
|                          준비됐엉️                          |                     마지막까지 즐겁게                      |                        일단 해보기                        |                   다 경험이고 추억이다                    |                          크아앙                           |

<br/>
