# syntax=docker/dockerfile:1.7
## buildkit 전용

# slim으로 안정성 추가
FROM node:22-slim AS base
WORKDIR /app

# NODE_ENV=production이 필요한지? 
# ENV NODE_ENV=production

# base 처리 pnpm 사용 준비
RUN corepack enable \
  && corepack prepare pnpm@10.0.0 --activate

# 의존성 패키지 설치
FROM base AS build

# backend랑 cache 분리
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm-store-frontend,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

COPY . .

# 환경 변수 설정
RUN set -a \
  && [ -f .env.frontend ] && . ./.env.frontend || true \
  && set +a \
  && pnpm build \ 
  && rm -f .env.frontend

# 실제 runtime
FROM node:22-slim AS runner
WORKDIR /app

# 이런식으로 next 파일을 쓴다고는 하는데 맞나요?? -> build 파일에 어디를 쓰는지 알면 좋을것 같습니다.
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

# next는 기본 포트가 어떻게 되는지??
EXPOSE 3000
CMD ["node", "server.js"]