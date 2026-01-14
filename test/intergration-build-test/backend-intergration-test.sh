#!/usr/bin/bash

MAIN_BACKEND_URL=$1
TOOL_BACKEND_URL=$2

if [ -z "$MAIN_BACKEND_URL" ] || [ -z "$TOOL_BACKEND_URL" ]; then
  echo "❌ 백엔드 URL을 확인해주세요"
  exit 1
fi

main_ok=false
tool_ok=false

# 잘 빌드가 되었는지 확인하는 로직
for i in {1..30}; do
  echo "⏳ main_backend health 체크를 시도하고 있습니다. $i"
  if curl -sSf "$MAIN_BACKEND_URL/api/health" > /dev/null; then
    echo "✅ main 백엔드 헬스체크 완료"
    main_ok=true
    break
  fi
  sleep 2
done

for i in {1..30}; do
  echo "⏳ tool_backend health 체크를 시도하고 있습니다. $i"
  if curl -sSf "$TOOL_BACKEND_URL/tool/health" > /dev/null; then
    echo "✅ tool 백엔드 헬스체크 완료"
    tool_ok=true
    break
  fi
  sleep 2
done

if [ "$main_ok" = true ] && [ "$tool_ok" = true ]; then
  echo "🎉 모든 백엔드 헬스체크 통과"
  exit 0
else
  echo "❌ 헬스체크 실패"
  [ "$main_ok" = false ] && echo "  - main backend 실패: $MAIN_BACKEND_URL/api/health"
  [ "$tool_ok" = false ] && echo "  - tool backend 실패: $TOOL_BACKEND_URL/tool/health"
  exit 1
fi