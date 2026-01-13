# syntax=docker/dockerfile:1.7
## buildkit 전용

# native 모듈이 사용될 수 있음으로 alpine -> slim으로 안정성을 더하는 선택
FROM node:22-slim AS base
WORKDIR /app

# pnpm && yarn과 같은 패키지 매니저 사용 허용 & pnpm 설치
RUN corepack enable \
  && corepack prepare pnpm@10.0.0 --activate

# 의존성 설치를 위해서
FROM base AS build

# pnpm 설치를 위한 파일 복사
COPY package.json pnpm-lock.yaml ./

# 임시 캐시 볼륨을 마운트 하고 (이미지에는 안남고 빌드 캐시로만) -> pnpm-store라는 캐시 공간을 공유하고 그 공간을 정한다.
# buildkit을 이용해서 빌드를 빠르게 한다 
RUN --mount=type=cache,id=pnpm-store-tool-backend,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

COPY . .

# 빌드 후 prod만 남기기
RUN pnpm build
RUN pnpm prune --prod

# 실제 실행 -> 이것만 남음
FROM node:22-slim AS runner

WORKDIR /app

# 빌드 패키지에서 실행에 필요한 빌드 결과물 가져오기
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

# 실행 관련
# USER node # 이부분은 실행 할때 누구의 권한으로 실행하느냐이다. 이게 없으면 root라는 점이다. ( 좀 불편한점은 많지만 보안적으로는 더 좋다. )
EXPOSE 8000
CMD ["node", "dist/main.js"]