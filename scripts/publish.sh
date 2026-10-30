#!/bin/sh
# Test, commit and push the site. GitHub Pages redeploys within a minute or two.
# Usage: scripts/publish.sh "What changed"
set -e
cd "$(dirname "$0")/.."

msg="${1:-Update site}"

if [ "$2" = "--copy-pdf" ] || [ "$1" = "--copy-pdf" ]; then
  cp ../website/Bhawna-Sharma-Portfolio.pdf .
  [ "$1" = "--copy-pdf" ] && msg="Update portfolio PDF"
fi

out=$(python3 scripts/test.py 2>&1) || true
echo "$out"
echo "$out" | grep -q "^PASS [0-9]*  FAIL 0$" || { echo "Tests failed, not publishing."; exit 1; }

git add -A
if git diff --cached --quiet; then
  echo "Nothing to publish."
  exit 0
fi
git commit -m "$msg"
git push
echo "Pushed. Live in a minute or two at https://bhawna98.github.io/"
