#!/usr/bin/env bash
# Run after every change to index.html: compiled stylesheet (no CDN request) + static English lists for crawlers. Needs node + Edge.
set -euo pipefail
cd "$(dirname "$0")/.."
python tools/prerender.py
npx -y tailwindcss@3.4.17 -c tools/tailwind.config.js -i tools/tailwind.css -o assets/site.css --minify
