# Bailabu – bailabu.com

Landing page for the Bailabu kids channels (EN · ES · DE · PT-BR · AR) and the Turkish sister channel Tontiş Ada.
One static `index.html` (semantic HTML5, Tailwind via CDN, vanilla JS), hosted on GitHub Pages.

## What's on the page
- **Language**: `?lang=xx` → saved choice → browser language (`navigator.languages`) → English. Arabic switches to RTL (font Baloo Bhaijaan 2, Eastern Arabic digits).
- **Friends**: tap a character → wiggle, sound and spoken name.
- **Songs**: songs that are online on the visitor's channel come first and open the video (`yt`), or a search on that channel while the ID is missing (falls back to the English channel while a channel is not live); the rest show "Coming soon". Online on Tontiş Ada (2026-10-27): Minik Balık Kaç, Renkli Otobüs, Arı Vız Vız, Pat Pat Traktör, Parla Yıldız.
- **Games & riddles** (no reading needed, prompts are spoken via the browser's speech synthesis): Memory (3/6 pairs), Odd one out, Whose shadow?, How many?, Where is …? (find the friend by name), Colors, Bubbles (pop, no way to fail), Music (6 pads, WebAudio pentatonic, "Copy me!" echo mode growing from 2 to 5 notes), What comes next? (AB → AAB/ABB → ABC patterns)
- **Stories**: picture book reader "Memo & Tonton: The Strawberry Cake" with "Read to me", swipe/arrow keys and a counting page.
- **Coloring pages**: 35 line-art pages (PNG, 300 dpi, 4:5) to download one by one or as one zip (`assets/print/`). For now the English edition (English file names and character names) is shown in every language.
- No cookies, no analytics, no ads. `localStorage` only keeps language, sound on/off, stars and memory size. Fonts are self-hosted.

## Editing
- Texts: `T` object in `index.html` (one block per language). Characters: `CAST`, songs: `SONGS`, channels: `CHANNELS`.
- **When a channel launches**: set `live: true` for it in `CHANNELS`.
- **When a video goes public**: add the channel code to the song's `live` list in `SONGS` and its video ID to `yt` (e.g. `yt: { tr: "5nh1MCtzWP8" }`; without an ID the card opens a search on the channel) (new song: add an entry + a `song` line in `tools/build_assets.sh` for its card image). Rule in `C:\Youtube\CLAUDE.md` → "Website sync".
- New story: add images to `assets/story/` and the page texts to `story` in every language.
- Coloring pages: list `PRINTS` in `index.html`; files come from `C:\Youtube\_shared\printables\en\*_lineart.png` (built by `_pipeline\build_coloring_book_v2.py`). New page: rebuild the printables, add an entry to `PRINTS`, run `build_assets.sh`, update the count in `coloring_all`.
- Assets are built from the YouTube project folders: `bash tools/build_assets.sh` (needs ffmpeg + uv).

## Domain
`CNAME` = bailabu.com. DNS (Cloudflare): `A @ 185.199.108.153 / .109.153 / .110.153 / .111.153` (DNS only, grey cloud) and `CNAME www metine44.github.io`. Then GitHub → Settings → Pages → "Enforce HTTPS".
