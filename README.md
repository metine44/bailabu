# Bailabu – bailabu.com

Landing page for the Bailabu kids channels (EN · ES · DE · PT-BR · AR) and the Turkish sister channel Tontiş Ada.
One static `index.html` (semantic HTML5, Tailwind via CDN, vanilla JS), hosted on GitHub Pages.

## What's on the page
- **Language**: `?lang=xx` → saved choice → browser language (`navigator.languages`) → English. Arabic switches to RTL (font Baloo Bhaijaan 2, Eastern Arabic digits).
- **Friends**: tap a character → wiggle, sound and spoken name.
- **Songs**: cards link to a search on the channel of the visitor's language (falls back to the English channel while a channel is not live).
- **Games & riddles** (no reading needed, prompts are spoken via the browser's speech synthesis): Memory (3/6 pairs), Odd one out, Whose shadow?, How many?
- **Stories**: picture book reader "Memo & Tonton: The Strawberry Cake" with "Read to me", swipe/arrow keys and a counting page.
- No cookies, no analytics, no ads. `localStorage` only keeps language, sound on/off, stars and memory size. Fonts are self-hosted.

## Editing
- Texts: `T` object in `index.html` (one block per language). Characters: `CAST`, songs: `SONGS`, channels: `CHANNELS`.
- **When a channel launches**: set `live: true` for it in `CHANNELS`.
- New story: add images to `assets/story/` and the page texts to `story` in every language.
- Assets are built from the YouTube project folders: `bash tools/build_assets.sh` (needs ffmpeg + uv).

## Domain
`CNAME` = bailabu.com. DNS (Cloudflare): `A @ 185.199.108.153 / .109.153 / .110.153 / .111.153` (DNS only, grey cloud) and `CNAME www metine44.github.io`. Then GitHub → Settings → Pages → "Enforce HTTPS".
