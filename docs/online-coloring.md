# Online coloring

The site remains static HTML, vanilla JavaScript and locally compiled Tailwind on GitHub Pages. `#color-online` opens the activity; all old hashes, including `#coloring` for paper printables, remain valid. There is no new route requiring a server rewrite.

The homepage keeps three live videos and six printables visible initially. Disclosure buttons retain access to complete collections; category deep links reveal the corresponding live videos. Upcoming entries stay in the content model, represented by one existing teaser. Channels and parent information remain below the activities. Existing metadata and language behavior are retained.

## Prepared pictures

The initial ball, apple and star use existing Bailabu printables, whose source pipeline is documented under Coloring pages in README.md. They offer three, five and one regions respectively. They deliberately differ in complexity. Character printables remain available on paper; arbitrary PNGs and PDFs cannot be filled online.

`assets/coloring/{id}.json` contains stable picture and region IDs, dimensions, SVG path data, default colors, provenance and an embedded PNG ink layer. No external images, scripts or SVG markup are accepted in definitions. The original ink is preserved over region fills. Region preparation is offline, never performed on a child's device.

To prepare these sources again, run `python tools/prepare_coloring.py` with Pillow and OpenCV available. This maintenance-only script uses enclosed white areas from the original repository PNGs. It is not a general artwork importer: visually inspect every generated picture, especially gaps, enclosed areas and small regions. Reordering or changing the source can change generated IDs, so retain approved IDs manually when editing existing content. Do not reuse the tool on third-party artwork without documented permission.

For another approved picture, prepare paths and the ink layer in the same format, give each region a unique stable identifier matching `[a-z][a-z0-9-]*`, and use six-digit hex defaults. Paths currently accept only M/L/Z commands. Add its ID to `ids` and its translated name to each `words` array in `assets/coloring-ui.js`, plus a repository preview at `assets/print/{id}.webp`. Verify coarse-touch region sizes on phones; merge small regions when needed. The engine rejects empty, duplicate, malformed and remotely referenced definitions, and the UI offers retry or another picture.

## Interaction and privacy

One click activation path serves touch, mouse and pen; Enter and Space fill a focused SVG region. Palette buttons expose pressed states and a visible check. White restores an unfilled region. Reset is immediately undoable. Each picture has separate in-memory fills and undo/redo history, capped at 80 snapshots. Switching pictures, language changes and responsive orientation changes retain drawings; reload or closing the page discards them. There is no drawing persistence, account, upload, telemetry, cookie or new third-party request. Assets load from the same origin on activity entry and picture choice.

The site already has language/game local storage, aggregate GoatCounter counting and a parent contact form; these integrations were not removed or expanded. The coloring controls carry no counting events. This feature does not establish a site-wide no-tracking claim.

The palette and essential controls stay alongside the picture on tablets and reflow below it on phones. Scroll, pinch zoom and text scaling remain enabled. Picture reset is recoverable, and leaving the activity retains work for the current page session. There is no sound or animated celebration; completion produces a short, nonblocking status message. Reduced-motion styles suppress transitions.

## Export and browser limits

The isolated export adapter clones only the current artwork into a self-contained SVG, renders it locally through Canvas and downloads a PNG at 1200 pixels wide with the original aspect ratio. It contains no remote resources or account data. Object URLs are released after use. Export failure displays a translated fallback suggesting another browser or paper coloring. Mobile browsers may open a preview or require their normal save-image flow; embedded Android WebViews can restrict downloads. Real-device Safari/iPadOS and Android WebView downloads have not been verified. No server is used for export.

## Validation

After changing `index.html`, run `bash tools/build_page.sh` (Git Bash on Windows). This runs the existing video-cache audit, English prerendering in Edge and Tailwind compilation. There is no package manifest, lint command or type checker in this repository.

- `node tools/test-coloring.js`: deterministic state, malformed definitions, bounded history, branch history, recoverable reset, picture sessions and script syntax.
- Start a loopback preview: `python -m http.server 8765 --bind 127.0.0.1`.
- `python tools/check_coloring_browser.py`: headless Edge checks using `tools/test-coloring-browser.html`: hierarchy, collection access, region keyboard activation, undo/redo/reset, picture switching, five viewport sizes, six languages including RTL, reduced motion, malformed content/retry, export pixels and export failure UI.
- `python tools/check_coloring_browser.py --screenshots`: also captures home/activity at 320×568, 390×844, 768×1024, 1024×768 and 1440×900 into an OS temporary directory for visual review. Screenshot preparation needs Pillow. The preview wrapper uses exact iframe viewports to avoid Edge's minimum outer window size. Do not commit screenshots.

These checks cover scripted browser behavior and responsive geometry, not a formal accessibility audit or real finger/stylus usability study. Browser keyboard events are scripted; physical tablet touch, screen-reader interaction and real-device downloads require additional testing. The initial public-site comparison could not be completed because the web fetch tool could not access the production URL. Implementation follows the checkout.
