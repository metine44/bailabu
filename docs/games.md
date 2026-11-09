# Visual-first games

**Show the child what to do instead of telling the child what to do.** A round must work without reading its instruction or enabling sound. The site remains one static `index.html`, vanilla JavaScript, compiled local Tailwind CSS, existing character WebP art and local MP3 voices. No framework, service, remote speech or new persistence is needed.

## Round contract

`GAMES` supplies the localized selector label, default semantic question key (`q`) and round generator (`start`). A generator builds its playable content in `stage` and optionally returns:

```js
return {
  visualPrompt: { kind: "object", id: target.id },
  accessiblePrompt: t("q_find").replace("{n}", castName(target)),
  audioPromptKey: "find_" + target.id,
};
```

`visualPrompt` is the visible instruction. The shared renderer accepts a validated object ID, a known color (`{ kind: "color", color }`), or an existing stage node (`{ node: field }`) for counting/patterns. Invalid optional prompts are ignored without throwing or reserving space. References use a round dashed frame; selectable answers use large rounded cards. The source and answers must be easy to compare and distinguish.

`accessiblePromptKey` optionally overrides the default localized semantic key. `accessiblePrompt` carries an already localized, interpolated instruction when the round needs a character or color name. `audioPromptKey` optionally selects the existing locale-specific MP3, otherwise the game's `q` is used. A visible `textPromptKey` is not required or rendered by any engine. Do not add written task banners as a fallback.

No separate visual prompt is needed for Memory, Odd One Out, basic Bubbles or free Music: the playable arrangement demonstrates the action. Their generators may return nothing; no blank prompt area appears. A separate visual reference is required for finding an object, matching a shadow or matching a color. Countable objects and a sequence with its empty final slot are themselves the prompt for Counting and What's Next.

## Per-game patterns

| Game | Visible task and behavior |
| --- | --- |
| Memory | Card grid with the existing card backs. Six/twelve-card previews preserve the original three/six-pair progression. Two-card comparisons lock rapid input until feedback resolves; matched pairs remain visible. Replay is offered after the complete deck. |
| Odd One Out | All four candidates together. Existing same-item and category rounds are preserved. No additional reference. |
| Shadows | A picture reference above three silhouette choices. Candidate labels are localized numbered shadows, never the identity that reveals the answer. The selected correct silhouette reveals its picture. |
| Counting | Stationary countable objects above three large numerical answers. Tapping an object numbers it once and optionally speaks that number. No unrelated countable decorations. |
| Where Is? | A large picture reference with adjacent optional speaker, then three/four picture choices. The character's written name is unnecessary. |
| Colors | A noninteractive target swatch with adjacent speaker above three/four object choices. Color names remain in semantic instructions. Existing near-color exclusions remain. |
| Bubbles | Several bubbles are ready immediately. Slow, predictable three-lane motion; stationary positions with reduced motion. Every bubble is valid. No score or pop counter. |
| Music | Six one-shot pentatonic pads retain the existing sound engine. A dark outline/glow marks each sounding pad briefly. Repeated taps replace the same note instead of stacking duplicate oscillators. The optional illustrated bear-to-pad control retains the two-to-five-note echo game, with picture/symbol listen/turn cues and an icon Stop control. These are short notes, not loop toggles. |
| What's Next? | One uninterrupted sequence ending in a dashed question slot, then three answer cards. Existing AB/AAB/ABB/ABC progression remains. The row scales without wrapping into an ambiguous second sequence. |

Wrong answers only receive a brief gentle motion, with no failure sound, deduction or negative text. Correct answers retain brief local praise and positive feedback. Reduced motion disables task animation and leaves feedback usable. Completing a deck may still show the existing celebration/replay control.

## Navigation, focus and layout

The selector shows approximately two to three items on phones and four to five on tablets. Partial neighboring items and a native scrollbar afford horizontal scrolling. Desktop fits all nine items. The active tab has a dark border and raised edge, independent of color. Labels stay on one line; full localized names remain available to assistive technology and via `title` when visually truncated.

Touch scroll, mouse and keyboard all work. The tablist uses a roving tabindex, Left/Right (reversed in RTL), Home and End. Activation keeps focus on the active tab and centers a clipped selection inside the rail. A ResizeObserver keeps it visible without regenerating a round or scrolling the entire page. Sound controls share the selector strip, so no separate task/header row occupies game space. Child-facing controls target at least 48 CSS pixels; answer cards are generally much larger.

The focusable tabpanel is associated with the selected tab and the complete localized `#gamePrompt` description. That instruction is screen-reader-only and updated politely once per task/phase, not on each answer's focus. Decorative duplicates may have empty alt text; interactive ancestors are never `aria-hidden`. After automatic advancement from an answer, focus returns to the new panel. Memory completion focuses Replay. Popping a focused bubble passes focus to another bubble or the panel. Music echo moves focus from its hidden start control to Stop, then to the first pad when the turn begins if the child has kept focus there.

## Audio, lifecycle and progress

Instructions never autoplay when selecting or advancing games. The optional speaker explicitly requests a local `assets/voice/<locale>/<key>.mp3`. One voice element replaces prior requests. Sound is optional and all tasks remain visual. Existing sound preferences apply to speech, effects and notes. There is no remote speech fallback; missing recordings fail quietly. Do not create audio for new semantic strings without the established offline voice workflow and cost accounting.

Round timers and audio are cleared when switching games or leaving the activity, including scrolling away, another hash destination or a hidden document. Completed timers remove themselves from the active list, keeping long Bubbles/Music sessions bounded. Returning starts a fresh unlocked task. Responsive relayout alone preserves the current round. Muting immediately stops cached effects, speech and the WebAudio context. Music Stop cancels the current echo and restores free play.

Persistent stars had no progression role, so the cumulative score and bubble counter are removed rather than replaced with another performance measure. Existing progression counters remain session-only inputs to round generation. Old `bailabu.stars` values are neither read nor updated and are left in place. Language, sound and Memory size retain their original storage behavior. Privacy text in all six locales describes the current settings. No tracking or other data collection was added; existing site privacy behavior and static paths are retained.

## Adding a game

First build a round that communicates its action through pictures, layout and a safe first tap. Add its short selector label and full semantic instruction to **all six** locale dictionaries (EN, DE, ES, PT, TR, AR). Interpolate names using existing localized helpers. Use a shared visual reference only when there is something distinct to compare with the answers; otherwise return no prompt. Register a `GAMES` entry and preserve the shared focus/audio lifecycle. Add a matching pattern and meaningful flow checks to `tools/check_games_browser.py`.

## Focused verification

From the repository root, use the project's existing tools (prefix shell commands with `rtk` in Codex sessions):

```sh
bash tools/build_page.sh
python -m http.server 8765 --bind 127.0.0.1
python tools/check_games_browser.py
node tools/test-coloring.js
python tools/check_coloring_browser.py
python tools/check_drawing_input.py
```

The game runner uses installed Edge through the already-used Python Playwright library, without installing browsers or adding a production test API. It checks all nine games at 320×568, 390×844, 768×1024, 1024×768 and 1440×900 in every locale, plus initial/advanced answer flows, Memory locking/replay, Bubbles touch, Music echo/audio cleanup, keyboard tabs and a normal-motion smoke check. Its media-play spy checks instruction timing/locale without playing audio during the layout matrix; separate flow checks exercise real WebAudio. Temporary screenshots cover all nine games at all five sizes for human visual review. These are desktop browser inspection and emulated input, not physical-device or child-user usability testing.

After a behavior-only change, `python tools/check_games_browser.py --flows-only` reruns the interaction checks without repeating the unchanged layout matrix.

The legacy coloring DOM-dump runner uses accelerated virtual time. If artwork loading times out there, run the same `tools/test-coloring-browser.html` harness in installed Edge through Playwright with normal time and require its final `PASS:` result; do not treat a timeout as a passing check.

Run the required page build after HTML changes and review the diff, especially prerendered content. Follow the verified existing GitHub upstream for publication. Do not inspect or manage downstream hosting for a games change.
