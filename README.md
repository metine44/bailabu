# Bailabu – bailabu.com

Landing page for the Bailabu kids channels (EN · ES · DE · PT-BR · AR) and the Turkish sister channel Tontiş Ada.
One static `index.html` (semantic HTML5, vanilla JS) + compiled Tailwind `assets/site.css`, hosted on GitHub Pages. **After every change to `index.html`: `bash tools/build_page.sh`** (Tailwind build + static English lists for crawlers; needs node + Edge). No third-party request on page load.

## What's on the page
- **Language**: `?lang=xx` → saved choice → browser language (`navigator.languages`) → English. Arabic switches to RTL (font Baloo Bhaijaan 2, Eastern Arabic digits).
- **Friends**: tap a character → wiggle, sound and spoken name.
- **Videos** (`videoChannel`): one grid for all formats with filter tabs All · Songs · Lullabies · Quiz & games · Picture books · Stories (`CATS`, deep links `#songs` `#lullabies` `#quiz` `#books` `#tales`). A card opens the video on the visitor's own language channel if it is online there, **otherwise the English version** (user decision 2026-10-28), otherwise the Turkish original; a TR/EN chip shows when the video is in another language. Online videos come first, the rest show "Coming soon".
- **Games & riddles** (no spoken prompts: the browser voices sounded bad, user decision 2026-10-28; only sound effects play): Memory (3/6 pairs), Odd one out, Whose shadow?, How many?, Where is …? (find the friend by name), Colors, Bubbles (pop, no way to fail), Music (6 pads, WebAudio pentatonic, "Copy me!" echo mode growing from 2 to 5 notes), What comes next? (AB → AAB/ABB → ABC patterns)
- **Stories**: links to the Stories and Picture books tabs, and the picture book reader "Memo & Tonton: The Strawberry Cake" (no read-aloud: browser voices removed 2026-10-28), swipe/arrow keys and a counting page.
- **Coloring pages**: 35 line-art pages (PNG, 300 dpi, 4:5) (`assets/print/`): tap a page → big preview with a download button. For now the English edition (English file names and character names) is shown in every language.
- **Privacy** link in the footer (legal dialog, text `privacy` in every language). The imprint appears as soon as `IMPRINT` in `index.html` is filled in (still empty: needs the operator's name and address).
- No cookies, no analytics, no ads. `localStorage` only keeps language, sound on/off, stars and memory size. Fonts are self-hosted.

## Editing
- Texts: `T` object in `index.html` (one block per language). Characters: `CAST`, videos of all formats: `VIDEOS`, channels: `CHANNELS`.
- **When a channel launches**: set `live: true` for it in `CHANNELS`.
- **When a video goes public**: add the channel code to the entry's `live` list in `VIDEOS` and its video ID to `yt` (e.g. `yt: { tr: "5nh1MCtzWP8" }`; without an ID the card opens a search on the channel) (new video: add an entry with `cat` + `tag` + a `song` line in `tools/build_assets.sh` for its card image; thumbnails with text get a `-tr` variant + `trArt: true`). Rule in `C:\Youtube\CLAUDE.md` → "Website sync".
- New story: add images to `assets/story/` and the page texts to `story` in every language.
- Coloring pages: list `PRINTS` in `index.html`; files come from `C:\Youtube\_shared\printables\en\*_lineart.png` (built by `_pipeline\build_coloring_book_v2.py`). New page: rebuild the printables, add an entry to `PRINTS`, run `build_assets.sh`.
- Assets are built from the YouTube project folders: `bash tools/build_assets.sh` (needs ffmpeg + uv).

## Domain
`CNAME` = bailabu.com. DNS (Cloudflare): `A @ 185.199.108.153 / .109.153 / .110.153 / .111.153` (DNS only, grey cloud) and `CNAME www metine44.github.io`. Then GitHub → Settings → Pages → "Enforce HTTPS".
