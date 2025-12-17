#!/usr/bin/bash

URL=$1

if [ -z "$URL" ]; then
  echo "❌ 백엔드 URL을 확인해주세요"
  exit 1
fi

# 잘 빌드가 되었는지 확인하는 로직
for i in {1..30}; do
  echo "⏳ backend health 체크를 시도하고 있습니다. $i"

  # 상태코드 에러 디버깅 중 
  CODE="$(curl -sS -o /tmp/health.body -w '%{http_code}' "$TARGET" || true)"
  if [ "$CODE" = "200" ]; then
    echo "✅ 백엔드 헬스체크 완료 (200)"
    cat /tmp/health.body || true
    exit 0
  fi

  # 에러가 발생한다면 여기에 작성
  echo "❌ HTTP $CODE"
  echo "---- response body ----"
  cat /tmp/health.body || true
  echo "-----------------------"
  if [ "$CODE" = "502" ]; then
    curl -v "$TARGET" || true
  fi

  sleep 2
done

echo "❌ 백엔드 health 체크가 실패 하였습니다. ($URL)"
exit 1