# syntax=docker/dockerfile:1.7
## buildkit 전용

# native 모듈이 사용될 수 있음으로 alpine -> slim으로 안정성을 더하는 선택
FROM node:22-slim AS base
WORKDIR /app

# pnpm && yarn과 같은 패키지 매니저 사용 허용 & pnpm 설치
RUN corepack enable \
  && corepack prepare pnpm@10.0.0 --activate

# 의존성 설치를 위해서
FROM base AS deps

# pnpm 설치를 위한 파일 복사
COPY package.json pnpm-lock.yaml ./

# 임시 캐시 볼륨을 마운트 하고 (이미지에는 안남고 빌드 캐시로만) -> pnpm-store라는 캐시 공간을 공유하고 그 공간을 정한다.
# buildkit을 이용해서 빌드를 빠르게 한다 
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# 빌드를 위해서 사용
FROM base AS build

# deps에서 설치한 node_modules를 복사한다.
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 빌드 
RUN pnpm build

# 실제 실행 -> 이것만 남음
FROM base AS runner

# 필요한 의존성 가져오기
COPY package.json pnpm-lock.yaml ./

# 따로 설치해서 실행이 되도록 하기 -> 기존 캐시 최대한 유지
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --prod --frozen-lockfile

# 빌드 패키지에서 빌드 결과물 가져오기
COPY --from=build /app/dist ./dist

# 실행 관련
EXPOSE 8080
CMD ["node", "dist/main.js"]