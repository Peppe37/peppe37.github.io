#!/bin/sh
# Rebuilds the link-preview image and the PNG icons from the sources in this folder
# (needs Google Chrome and macOS `sips`). Headless Chrome will not make windows smaller than
# about 500 px, so the icons are drawn large and scaled down.
set -e
cd "$(dirname "$0")"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
OUT=../../site/assets
shot() { "$CHROME" --headless=new --disable-gpu --hide-scrollbars --default-background-color=00000000 --force-device-scale-factor=1 --window-size="$2" --screenshot="$3" "file://$PWD/$1" >/dev/null 2>&1; }
shot og.html 1200,630 "$OUT/og-giulapi.png"
shot og-github.html 1280,640 ./og-github-1280x640.png  # for Settings > Social preview of the GitHub repository (uploaded by hand)
shot icon.html 512,512 /tmp/gl-icon-512.png
shot icon-square.html 512,512 /tmp/gl-icon-square-512.png
sips -z 180 180 /tmp/gl-icon-square-512.png --out "$OUT/apple-touch-icon.png" >/dev/null
sips -z 32 32 /tmp/gl-icon-512.png --out "$OUT/favicon-32.png" >/dev/null
rm -f /tmp/gl-icon-512.png /tmp/gl-icon-square-512.png
