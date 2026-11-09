# Online coloring

The site remains static HTML, vanilla JavaScript and locally compiled Tailwind on GitHub Pages. `#color-online` opens the activity; all old hashes, including `#coloring` for paper printables, remain valid. There is no new route requiring a server rewrite.

The homepage keeps three live videos and six printables visible initially. Disclosure buttons retain access to complete collections; category deep links reveal the corresponding live videos. Upcoming entries stay in the content model, represented by one existing teaser. Channels and parent information remain below the activities. Existing metadata and language behavior are retained.

## Prepared pictures

The initial ball, apple and star use existing Bailabu printables, whose source pipeline is documented under Coloring pages in README.md. They offer three, five and one regions respectively. They deliberately differ in complexity. Character printables remain available on paper; arbitrary PNGs and PDFs cannot be filled online.

`assets/coloring/{id}.json` contains stable picture and region IDs, dimensions, SVG path data, default colors, provenance and an embedded PNG ink layer. No external images, scripts or SVG markup are accepted in definitions. The original ink is preserved over region fills. Region preparation is offline, never performed on a child's device.

To prepare these sources again, run `python tools/prepare_coloring.py` with Pillow and OpenCV available. This maintenance-only script uses enclosed white areas from the original repository PNGs. It is not a general artwork importer: visually inspect every generated picture, especially gaps, enclosed areas and small regions. Reordering or changing the source can change generated IDs, so retain approved IDs manually when editing existing content. Do not reuse the tool on third-party artwork without documented permission.

For another approved picture, prepare paths and the ink layer in the same format, give each region a unique stable identifier matching `[a-z][a-z0-9-]*`, and use six-digit hex defaults. Paths currently accept only M/L/Z commands. Add its ID to `ids` and its translated name to each `words` array in `assets/coloring-ui.js`, plus a repository preview at `assets/print/{id}.webp`. Verify coarse-touch region sizes on phones; merge small regions when needed. The engine rejects empty, duplicate, malformed and remotely referenced definitions, and the UI offers retry or another picture.

## Color and Draw architecture

Color remains the default: click/tap or Enter/Space on a focused SVG region fills it. Draw is a separate, transparent Canvas over that SVG; the white background, structured fills and embedded original ink remain intact underneath. Drawing is visible in both modes. The Draw toolbar contains brush, crayon, eraser, three sizes, eight colors and shared Undo/Redo. More contains picture selection, Blank page, recoverable Start again, Save picture and paper printables. Primary controls target at least 48 CSS pixels and reflow below the artwork on phones; tablets and desktops keep them alongside it.

`coloring-engine.js` owns immutable per-artwork session data. `coloring-ui.js` converts Pointer Events and renders the SVG/controls; `coloring-renderer.js` replays the drawing layer for both screen and export; `coloring-export.js` composes the PNG. No drawing library, server or remote texture is needed.

### State and coordinates

The existing pictures and built-in blank page use an intrinsic 800 × 1000 artwork space. The blank definition is `BailabuColoring.BLANK`: white background, no regions and no ink, with the same session and export contract as other pictures. It opens Draw automatically. Other picture switches retain the current mode and restore each picture’s tool, color, size, content and history. Switching modes does not alter content. Language changes, responsive layout, leaving/returning and orientation changes preserve session data. Reloading or closing the page discards it.

Each state has picture ID, intrinsic dimensions, default/current region fills, ordered strokes, past/future content history, mode, tool, color and size. Each stroke has `tool` (brush/crayon/eraser), six-digit hex `color`, intrinsic `width` (8/20/40), and ordered finite `{x, y}` points within the artwork bounds. The engine validates and copies incoming strokes; Canvas bitmaps and DOM attributes are never canonical state. Tool settings do not consume history entries.

Undo/Redo each restores one completed content action: fill, brush, crayon, eraser or reset of both fills and drawing. New content actions clear redo. History contains structurally shared fill/stroke references, never serialized SVGs or PNGs. Limits per picture: 80 undo/redo entries, 160 strokes including erasers, 1024 points per stroke. At the stroke limit, save, undo or reset is offered in a localized status. Dense active paths halve interior samples when full, retaining endpoints. History can retain at most about 240 distinct strokes per picture (current content plus 80 action transitions); four finite sessions bound aggregate memory. Additions beyond the stroke limit are rejected rather than silently losing older work.

### Tools and input

Brush uses connected paths with round caps and joins. Crayon uses a translucent path plus five fixed dashed wax ridges. There is no randomness or external texture: stored strokes replay deterministically. Eraser uses Canvas `destination-out` on the transparent drawing layer only, so it reveals existing ink/fills/background and is independently undoable. Sizes stay in artwork coordinates. Pressure is deliberately not required or used; mouse, finger and stylus have stable widths.

Pointer down/move/up share one input path, using primary-pointer checks and capture. Coalesced samples are accepted; requestAnimationFrame batches incremental live drawing. A gesture commits at most one stroke. Cancellation/lost capture discards the unfinished preview; completed actions remain. Leaving artwork bounds ends that stroke immediately, preventing a line across an outside excursion and re-entry. Secondary pointers and non-primary buttons are ignored. Mode/tool/picture/language changes, page hiding or window blur cancel an unfinished gesture. Only the Draw surface uses `touch-action: none`; the rest of the page retains scrolling and browser zoom. Pinch gestures beginning on the drawing surface are reserved for drawing.

### Responsive rendering

The stage and SVG share the same aspect ratio and bounds. Pointer positions map from its current rectangle into intrinsic coordinates; invalid/outside samples are rejected. A ResizeObserver plus window/visual-viewport resize and DPR-change listeners schedule replay from state. Canvas backing dimensions use CSS size times DPR clamped to 1–2, with a further 2400-pixel bound per dimension. CSS dimensions stay independent. Every replay resets the transform explicitly before applying artwork-to-backing scaling, preventing cumulative scaling. No polling or perpetual animation loop is used. Full replay happens on completed actions and responsive changes; active drawing renders only newly sampled segments between replays. Crayon preview overlaps can settle when the completed canonical path is rendered.

### Accessibility and localization

Mode, tool, size and palette controls are semantic buttons with localized names and pressed states; Undo/Redo and reset expose disabled states, and focus remains visible. All controls and SVG fill regions remain keyboard reachable in Color. Freehand drawing requires pointing input; it does not provide keyboard freehand equivalence or a cursor simulation. Color is the keyboard-accessible creative path. No focus trap, sound dependency, age gate or age label is introduced. Reduced-motion styles remain in effect. Six complete Draw word sets live alongside the existing six Color word sets in the UI (EN/DE/ES/PT/TR/AR); metadata and public audience copy welcome children approximately 1–8. White means white, separately from the actual eraser.

### Privacy

Drawing state stays in memory only. No persistence, account, upload, telemetry, cookie, remote texture or new third-party request is added. Artwork definitions load from the same origin. Existing language/game local storage, aggregate GoatCounter counting and the parent contact form remain unchanged; drawing controls carry no counting events. This does not establish a site-wide no-tracking claim. Content Security Policy, custom domain and static hash routing remain unchanged.

## Export and browser limits

The adapter clones only the base SVG, removes focus/interaction attributes, rasterizes white background + structured fills + original ink, then composites a separate transparent replay of strokes (including erasers). Output is always 1200 × 1500 for current artwork, independent of viewport or DPR. Blank pages use the same path. Only artwork pixels are included; there is no new account/device metadata. PNG uses `toBlob`, a temporary Blob URL and a stable `bailabu-{picture}.png` filename. The SVG source URL is revoked in `finally`; the download URL is revoked after 60 seconds to allow browser handoff. Concurrent exports are disabled. Unsupported Canvas/Blob APIs, serialization/image failures and null PNG blobs produce the localized friendly fallback. Browsers may still silently restrict downloads or use their normal preview/save flow; successful dispatch cannot prove the user saved the file.

Real iPadOS/Safari, Android WebView and physical touch/stylus downloads have not been verified. Browser checks include both scripted Pointer Events and trusted Edge mouse/pen/emulated touch input with native capture/cancellation; they do not constitute physical-device or operating-system palm-rejection testing. Emulated secondary pointers are ignored; hardware palm rejection remains browser/device dependent.

## Adding tools safely

Keep future tools inside the validated stroke data contract. Add an allowed engine tool, six localized labels and a semantic pressed-state button. Implement deterministic replay in the shared renderer, including screen/export parity and draw-only erasing. Keep stroke actions atomic, bounded and intrinsic-coordinate based; do not introduce bitmaps into normal history. Extend logic, cancellation, resize, mixed-history and PNG-pixel checks before adding the tool. New artwork with a different aspect ratio must also adapt stage size constraints and test pointer mapping/export at every viewport.

## Validation

After changing `index.html`, run `bash tools/build_page.sh` (Git Bash on Windows). This runs the existing video-cache audit, English prerendering in Edge and Tailwind compilation. There is no package manifest, lint command or type checker in this repository.

- `node tools/test-coloring.js`: deterministic state, malformed definitions, blank page, tool/mode/size/color selection, intrinsic coordinates, mixed history, bounded history/strokes/points, recoverable reset, sessions and script syntax.
- Start a loopback preview: `python -m http.server 8765 --bind 127.0.0.1`.
- `python tools/check_coloring_browser.py`: headless Edge checks using `tools/test-coloring-browser.html`: hierarchy, collection access, keyboard controls, brush/crayon/eraser pixels, three sizes, mixed undo/redo/reset, branching, per-picture/blank state, dense points, cancellation/lost capture/secondary pointers/re-entry, five viewport sizes and rotation, six languages including RTL, reduced motion, malformed/retry, composite/blank/erased PNG pixels, null-blob/serialization failures and duplicate export prevention.
- `python tools/check_coloring_browser.py --screenshots`: also captures home/Color/Draw at 320×568, 390×844, 768×1024, 1024×768 and 1440×900 into an OS temporary directory for visual review. Screenshot preparation needs Pillow. The preview wrapper uses exact iframe viewports to avoid Edge's minimum outer window size. Do not commit screenshots.
- `python tools/check_drawing_input.py`: optional Python Playwright check using the installed Edge executable; trusted mouse/pen/emulated touch, native capture/cancellation, actual keyboard activation, DPR 2 and rotation at the same five viewports. Playwright is a maintenance-only dependency, never shipped to visitors.

The native input check accepts a site base URL as its optional first argument for post-publication verification. Omit it for the local preview.

These checks cover scripted browser behavior and responsive geometry, not a formal accessibility audit or real finger/stylus usability study. Keyboard focus/activation and mouse/touch/pen events are scripted. Physical tablet touch, screen-reader interaction, OS palm rejection and real-device downloads require additional testing. Screenshot output stays outside the repository. Publication status belongs in the implementation report, not in a permanent claim about the live site.
