#!/usr/bin/env bash
# Run after every change to index.html: compiled stylesheet (no CDN request) + static English lists for crawlers + check of VIDEOS against ProjektHub's channel read. Needs node + Edge.
set -euo pipefail
cd "$(dirname "$0")/.."
node tools/check_videos.js
python tools/prerender.py
npx -y tailwindcss@3.4.17 -c tools/tailwind.config.js -i tools/tailwind.css -o assets/site.css --minify
