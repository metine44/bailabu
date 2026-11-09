"""Focused visual-first game checks in installed Edge; no browser download.

Run with a loopback preview: python tools/check_games_browser.py [base URL].
Screenshots/contact sheets go to a temporary directory, never source control.
Test access to the existing closure is injected into the HTTP response only.
Input is keyboard/mouse plus emulated touch, never physical-device testing.
"""
from pathlib import Path
import sys
import tempfile
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw

BASE = next((arg.rstrip('/') for arg in sys.argv[1:] if not arg.startswith('--')), 'http://127.0.0.1:8765')
LAYOUTS = [(320, 568), (390, 844), (768, 1024), (1024, 768), (1440, 900)]
GAMES = ['memory', 'odd', 'shadow', 'count', 'find', 'colors', 'bubbles', 'music', 'pattern']
OUT = Path(tempfile.mkdtemp(prefix='bailabu-games-review-'))
SOURCE = (Path(__file__).resolve().parents[1] / 'index.html').read_text(encoding='utf-8')
# No test API or instrumentation is shipped in index.html.
SOURCE = SOURCE.replace('/* ---------------- Boot ---------------- */',
                        'window.gameCheck = expression => eval(expression);\n/* ---------------- Boot ---------------- */')

with sync_playwright() as pw:
    browser = pw.chromium.launch(channel='msedge', headless=True)
    for locale in ([] if '--flows-only' in sys.argv else ['en', 'de', 'es', 'pt', 'tr', 'ar']):
        for width, height in LAYOUTS:
            context = browser.new_context(viewport={'width': width, 'height': height}, has_touch=True,
                                          reduced_motion='reduce', device_scale_factor=1)
            page = context.new_page()
            errors = []
            page.on('pageerror', lambda e: errors.append(str(e)))
            context.route('**/*', lambda route: route.fulfill(body=SOURCE, content_type='text/html')
                          if route.request.url.split('?')[0].rstrip('/') == BASE else route.continue_())
            page.add_init_script('''window.plays=[];
                HTMLMediaElement.prototype.play=function(){ plays.push(this.src); return Promise.resolve() };
                window.playedTones=0;''')
            page.goto(BASE + '/?lang=' + locale + '#play')
            page.locator('#gameTabs').scroll_into_view_if_needed()
            page.wait_for_timeout(120)
            check = lambda expression: page.evaluate('(s)=>gameCheck(s)', expression)
            assert page.evaluate('plays.length') == 0, 'no initial audio'
            for game in GAMES:
                # Use native keyboard activation even for tabs outside the current scroll window.
                tab = page.locator('#game-tab-' + game)
                tab.focus()
                page.keyboard.press('Enter')
                page.wait_for_timeout(50)
                assert check('game.cur.id') == game
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), (locale, width, game, 'overflow')
                bounds = tab.bounding_box()
                rail = page.locator('#gameTabs').bounding_box()
                assert bounds['x'] >= rail['x'] - 1 and bounds['x'] + bounds['width'] <= rail['x'] + rail['width'] + 1, (locale, width, game, bounds, rail, 'active tab visible')
                assert page.locator('#gamePrompt').inner_text().strip()
                assert check('promptEl.classList.contains("sr-only")')
                assert '{' not in page.locator('#gamePrompt').inner_text(), 'no unresolved instruction placeholder'
                assert page.locator('#starCount').count() == 0
                prompt_count = page.locator('#gameStage [data-visual-prompt]').count()
                assert prompt_count == (1 if game in ['shadow', 'count', 'find', 'colors', 'pattern'] else 0), game
                assert page.locator('#sayBtn').get_attribute('aria-label') == check('t("say_again")')
                if game in ['find', 'shadow', 'colors']:
                    assert page.locator('[data-visual-prompt] #sayBtn').count() == 1
                for box in page.locator('#gameTabs button, #gameTools button, #gameStage button').all():
                    if box.is_visible():
                        b = box.bounding_box()
                        assert b['width'] >= 47.9 and b['height'] >= 47.9, (game, width, b, 'touch target')
                        assert box.get_attribute('aria-label') or box.inner_text().strip(), 'accessible control name'
                if game == 'shadow':
                    names = page.locator('#gameStage button:not(#sayBtn)').evaluate_all('(bs)=>bs.map(b=>b.getAttribute("aria-label"))')
                    assert len(set(names)) == 3 and not any(check('objName(lastShadow)') in n for n in names)
                    assert page.locator('#gameStage button img.silhouette').count() == 3
                if game == 'pattern':
                    ys = page.locator('.pattern-row > span').evaluate_all('(ns)=>ns.map(n=>n.getBoundingClientRect().top)')
                    assert max(ys) - min(ys) < 30, 'single sequence direction'
                # A relayout must retain this very round, including its DOM and instructions.
                before = page.locator('#gameStage').inner_html()
                page.set_viewport_size({'width': height, 'height': width})
                page.wait_for_timeout(50)
                assert page.locator('#gameStage').inner_html() == before, ('resize resets round', game)
                page.set_viewport_size({'width': width, 'height': height})
                page.wait_for_timeout(50)
                if locale == 'en':
                    page.locator('#gameTabs').scroll_into_view_if_needed()
                    page.locator('#gameStage').locator('..').screenshot(path=str(OUT / f'{game}-{width}.png'))
                # Instructions only play explicitly; repeated requests replace one voice element.
                prior = page.evaluate('plays.length')
                page.locator('#sayBtn').click()
                page.wait_for_timeout(30)
                assert page.evaluate('plays.length') == prior + 1
                assert f'/voice/{locale}/' in page.evaluate('plays.at(-1)')
                page.locator('#sayBtn').click()
                page.wait_for_timeout(30)
                assert page.evaluate('plays.length') == prior + 2
            assert not errors, errors
            context.close()
            print(f'PASS: {locale} {width}x{height}, all nine games, semantics, prompts, targets, selector, audio locale, resize and overflow', flush=True)

    # Rules and input flows are checked against the real production handlers.
    context = browser.new_context(viewport={'width': 390, 'height': 844}, has_touch=True, reduced_motion='reduce')
    page = context.new_page()
    context.route('**/*', lambda r: r.fulfill(body=SOURCE, content_type='text/html')
                  if r.request.url.split('?')[0].rstrip('/') == BASE else r.continue_())
    page.goto(BASE + '/?lang=en#play')
    page.locator('#gameTabs').scroll_into_view_if_needed()
    page.wait_for_timeout(100)
    check = lambda expression: page.evaluate('(s)=>gameCheck(s)', expression)

    def select(game):
        page.locator('#game-tab-' + game).focus()
        page.keyboard.press('Enter')
        assert check('game.cur.id') == game

    def activate(locator):
        locator.focus()
        page.keyboard.press('Enter')

    def image_ids(selector):
        return page.locator(selector).evaluate_all('(ns)=>ns.map(n=>n.getAttribute("src").split("/").pop().split(".")[0])')

    select('memory')
    cards = page.locator('.mcard')
    ids = image_ids('.mcard img')
    a = 0
    wrong = next(i for i, v in enumerate(ids) if v != ids[a])
    activate(cards.nth(a)); activate(cards.nth(wrong)); activate(cards.nth(next(i for i in range(6) if i not in [a, wrong])))
    assert page.locator('.mcard.flipped').count() == 2, 'mismatch locks rapid input'
    page.wait_for_timeout(1000)
    assert page.locator('.mcard.flipped').count() == 0
    for id in set(ids):
        for i, value in enumerate(ids):
            if value == id:
                activate(cards.nth(i))
        page.wait_for_timeout(380)
    page.wait_for_timeout(1200)
    assert page.locator('.mcard[aria-disabled=true]').count() == 6
    assert page.locator('#gameStage button:focus').inner_text() == 'Play again'
    activate(page.locator('#gameStage button:focus'))
    assert page.locator('.mcard.flipped').count() == 0
    activate(page.locator('.memory-size').nth(1))
    assert page.locator('.mcard').count() == 12, 'preserved memory progression'
    print('PASS: Memory mismatch input lock, every pair, completion, replay, 6/12-card previews', flush=True)

    for game in ['odd', 'shadow', 'count', 'find', 'colors', 'pattern']:
        for advanced in [False, True]:
            if advanced:
                check({'odd': 'oddRound=8', 'count': 'countRound=8', 'find': 'findRound=8',
                       'colors': 'colorRound=8', 'pattern': 'patRound=8', 'shadow': 'lastShadow=null'}[game])
            select(game)
            if game == 'odd':
                ids = image_ids('#gameStage button img')
                if len(set(ids)) == 2:
                    good = next(i for i, id in enumerate(ids) if ids.count(id) == 1)
                else:
                    kinds = [check(f'OBJ[{id!r}].kind') for id in ids]
                    good = next(i for i, kind in enumerate(kinds) if kinds.count(kind) == 1)
                buttons = page.locator('#gameStage button')
            elif game == 'count':
                n = page.locator('[data-visual-prompt] button').count()
                buttons = page.locator('#gameStage > div:last-child button')
                good = buttons.all_text_contents().index(str(n))
                page.locator('[data-visual-prompt] button').first.tap()
                assert page.locator('[data-visual-prompt] [data-n]').count() == 1, 'emulated touch counts'
            else:
                buttons = page.locator('#gameStage button:not(#sayBtn)')
                ids = image_ids('#gameStage button:not(#sayBtn) img')
                if game == 'shadow':
                    target = check('lastShadow')
                elif game == 'find':
                    target = check('lastFind')
                elif game == 'colors':
                    target = next(id for id in ids if check(f'COLOR_OBJ[lastColor].includes({id!r})'))
                else:
                    sequence = image_ids('.pattern-row img')
                    # Sequence generation repeats 2 or 3 elements; the missing item follows that unit.
                    target = sequence[len(sequence) % (2 if sequence[0] == sequence[2] else 3)]
                good = ids.index(target)
            bad = next(i for i in range(buttons.count()) if i != good)
            wrong = buttons.nth(bad)
            activate(wrong)
            assert 'shake' in wrong.get_attribute('class') and not check('!!stage.querySelector("[data-done]")')
            activate(buttons.nth(good))
            assert check('!!stage.querySelector("[data-done]")'), (game, 'correct flow')
            old_round = page.locator('#gameStage').inner_html()
            page.wait_for_timeout(2500)
            assert page.locator('#gameStage').inner_html() != old_round, (game, 'next round')
            assert page.locator('#gameStage').evaluate('(s)=>s===document.activeElement'), 'focus restored to round'
        print(f'PASS: {game}, initial/advanced round, gentle wrong answer, correct answer and next round', flush=True)

    select('bubbles')
    assert page.locator('.bubble').count() >= 4, 'immediate playable bubbles'
    page.locator('.bubble').first.tap()
    assert page.locator('.bubble.popped').count() == 1
    select('music')
    assert page.locator('#gameStage [data-visual-prompt]').count() == 0
    activate(page.locator('.pad').first)
    assert page.locator('.pad.lit').count() == 1 and check('tones.size') == 1
    for _ in range(5):
        page.locator('.pad').first.click(force=True)
    assert check('tones.size') == 1, 'duplicate notes do not stack'
    page.wait_for_timeout(800)
    assert page.locator('.pad.lit').count() == 0
    # Capture the generated echo via its existing tone calls, then repeat it using keyboard input.
    check('window.echoNotes=[]; window.originalTone=tone; tone=(f,...args)=>{echoNotes.push(NOTES.indexOf(f)); originalTone(f,...args)}')
    activate(page.locator('button[aria-label="Listen, then repeat the highlighted pictures."]'))
    assert page.locator('button[aria-label="Stop"]').evaluate('(b)=>b===document.activeElement'), 'echo starts on a visible focused control'
    page.wait_for_timeout(2400)
    assert page.locator('.pad').first.evaluate('(b)=>b===document.activeElement'), 'echo hands keyboard focus to playable pads'
    sequence = page.evaluate('echoNotes.slice()')
    assert len(sequence) == 2 and page.locator('.music-phase').inner_text().strip()
    for n in sequence:
        activate(page.locator('.pad').nth(n)); page.wait_for_timeout(150)
    page.wait_for_timeout(400)
    assert check('copyLen') == 3 and page.locator('button[aria-label="Stop"]').is_hidden()
    activate(page.locator('button[aria-label="Listen, then repeat the highlighted pictures."]'))
    activate(page.locator('button[aria-label="Stop"]'))
    assert check('game.timers.length') == 0 and check('actx') is None
    activate(page.locator('.pad').first)
    activate(page.locator('#soundBtn'))
    assert check('actx') is None and check('soundOn') is False
    activate(page.locator('#soundBtn'))
    activate(page.locator('.pad').first)
    select('odd')
    assert check('actx') is None and check('voiceEl.paused')
    check('renderVisualPrompt({kind:"object",id:"does-not-exist"})')
    assert page.locator('[data-visual-prompt]').count() == 0, 'invalid visual prompt is safe'
    # Arrow/Home/End navigation uses a roving tabindex and keeps focus on the active tab.
    page.locator('#game-tab-odd').focus(); page.keyboard.press('End')
    assert check('game.cur.id') == 'pattern'
    page.keyboard.press('Home')
    assert check('game.cur.id') == 'memory'
    page.keyboard.press('ArrowRight')
    assert check('game.cur.id') == 'odd'
    assert page.locator('#gameTabs button[tabindex="0"]').count() == 1
    select('music'); activate(page.locator('.pad').first)
    page.evaluate('location.hash="color-online"')
    page.wait_for_timeout(200)
    assert check('actx') is None and check('game.timers.length') == 0
    page.evaluate('location.hash="play"')
    page.locator('#gameTabs').scroll_into_view_if_needed(); page.wait_for_timeout(100)
    assert not check('game.paused'), 'return creates an unlocked game'
    print('PASS: Bubbles emulated touch, Music notes/echo/stop/mute/switch/leave cleanup, optional prompt failure, keyboard tabs', flush=True)
    context.close()

    # Normal motion has the same task and no page overflow; bubbles stay within their field.
    context = browser.new_context(viewport={'width': 320, 'height': 568}, reduced_motion='no-preference')
    page = context.new_page()
    page.goto(BASE + '/?lang=en#play')
    page.locator('#gameTabs').scroll_into_view_if_needed()
    page.locator('#game-tab-bubbles').click()
    page.wait_for_timeout(1000)
    assert page.locator('.bubble').count() >= 4
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
    page.locator('#game-tab-music').click()
    assert page.locator('#gamePrompt').inner_text() == 'Tap and make music!'
    context.close()
    browser.close()

for width, _ in ([] if '--flows-only' in sys.argv else LAYOUTS):
    thumbnails = []
    for game in GAMES:
        im = Image.open(OUT / f'{game}-{width}.png').convert('RGB')
        im.thumbnail((330, 700))
        cell = Image.new('RGB', (350, 740), '#eeeeee')
        cell.paste(im, ((350 - im.width) // 2, 30))
        ImageDraw.Draw(cell).text((10, 8), game, fill='black')
        thumbnails.append(cell)
    sheet = Image.new('RGB', (1050, 2220), 'white')
    for i, im in enumerate(thumbnails):
        sheet.paste(im, ((i % 3) * 350, (i // 3) * 740))
    sheet.save(OUT / f'review-{width}.jpg')
print('PASS: normal-motion compact phone smoke.')
if '--flows-only' not in sys.argv:
    print('Screenshot review directory:', OUT)
