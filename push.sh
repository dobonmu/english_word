#!/usr/bin/env bash
# 변경사항을 커밋하고 GitHub(main)로 바로 push합니다.
# 사용법:
#   ./push.sh                 -> 자동 커밋 메시지로 push
#   ./push.sh "커밋 메시지"    -> 지정한 메시지로 push
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

if [ -z "$(git status --porcelain)" ]; then
  echo "변경사항이 없습니다. push할 내용이 없어요."
  exit 0
fi

MSG="${1:-update $(date '+%Y-%m-%d %H:%M')}"

git add -A
git commit -m "$MSG"
git push -u origin main

echo "완료: GitHub에 push 되었습니다."
