#!/bin/sh
# Runs here the same checks as the CI pipeline, and stops at the first one that fails.
# Use it before a push:  sh scripts/check.sh
set -e
cd "$(dirname "$0")/.."

echo "== JavaScript"
for f in site/js/*.js; do node --check "$f"; done

echo "== HTML"
npx --yes html-validate@9 site/index.html site/404.html

echo "== CV"
python3 scripts/build_cv.py

echo "== Site checks"
python3 scripts/check_site.py --cv

echo
echo "All checks passed."
