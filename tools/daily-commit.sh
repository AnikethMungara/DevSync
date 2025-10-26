#!/usr/bin/env bash
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

if git status --porcelain | grep -qE '^( M|M |A |??)'; then
  if ! grep -q "$(date +%F)" DEVLOG.md; then
    {
      echo ""
      echo "## $(date +%F)"
      echo "- "
    } >> DEVLOG.md
  fi

  git add -A
  git commit -m "chore(devlog): update for $(date +%F)"
  git push
else
  echo "No changes to commit today."
fi
