"""Native Edge input checks. Requires Python Playwright and a loopback preview.

Mouse/pen use browser input dispatch; touch uses Chromium's device emulation.
This is not a physical-device test. No browser download or account is needed.
"""
from playwright.sync_api import sync_playwright
import sys

LAYOUTS = [(320, 568), (390, 844), (768, 1024), (1024, 768), (1440, 900)]
BASE_URL = sys.argv[1].rstrip('/') if len(sys.argv) > 1 else 'http://127.0.0.1:8765'

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(channel='msedge', headless=True)
    for width, height in LAYOUTS:
        context = browser.new_context(viewport={'width': width, 'height': height},
                                      device_scale_factor=2, has_touch=True, reduced_motion='reduce')
        page = context.new_page()
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(BASE_URL + '/?lang=en#color-online')
        try:
            page.locator('#draw-layer').wait_for(state='attached')
        except Exception:
            print('Browser errors:', errors, 'Activity:', page.locator('#online-coloring').inner_text(), flush=True)
            raise
        page.evaluate('''() => {
          const render = BailabuDrawing.render;
          BailabuDrawing.render = (canvas,state,...args) => { window.testState=state;return render(canvas,state,...args) };
          window.testEvents=[];
          for (const type of ['pointerdown','gotpointercapture','pointercancel'])
            document.querySelector('#draw-layer').addEventListener(type,e=>testEvents.push({type,trusted:e.isTrusted,pointer:e.pointerType}));
        }''')
        # Real keyboard activation of the modes, tools, colors and sizes.
        for selector in ['[data-mode="draw"]', '[data-tool="brush"]', '[data-size="large"]',
                         '[data-color="#ff5a5f"]']:
            page.locator(selector).focus()
            page.keyboard.press('Enter')
        page.locator('#draw-layer').scroll_into_view_if_needed()
        bounds = page.locator('#draw-layer').bounding_box()
        x = bounds['x'] + bounds['width'] * .2
        y = bounds['y'] + bounds['height'] * .2
        end = x + bounds['width'] * .5
        page.mouse.move(x, y)
        page.mouse.down()
        page.mouse.move(end, y, steps=15)
        page.mouse.up()
        assert page.evaluate('testState.strokes.length') == 1, f'mouse stroke {width}'
        assert page.evaluate('testEvents.some(e=>e.type==="gotpointercapture"&&e.trusted)'), 'native capture'
        assert abs(page.evaluate('testState.strokes[0].points[0].x') - 160) < 1, 'intrinsic mouse coordinates'
        assert page.evaluate('testState.strokes[0].width') == 40, 'keyboard size'
        cdp = context.new_cdp_session(page)
        # Trusted pen input through the same Pointer Events path, with no pressure requirement.
        for event, px, button, buttons in [('mousePressed', x, 'left', 1),
                                           ('mouseMoved', end, 'none', 1), ('mouseReleased', end, 'left', 0)]:
            cdp.send('Input.dispatchMouseEvent', {'type': event, 'x': px, 'y': y + 30,
                     'button': button, 'buttons': buttons, 'clickCount': 1, 'pointerType': 'pen'})
        assert page.evaluate('testState.strokes.length') == 2, f'pen stroke {width}'
        def touch(event, points):
            cdp.send('Input.dispatchTouchEvent', {'type': event, 'touchPoints': points})
        point = {'x': x, 'y': y + 60, 'id': 1}
        touch('touchStart', [point])
        touch('touchMove', [{**point, 'x': end}])
        touch('touchEnd', [])
        assert page.evaluate('testState.strokes.length') == 3, f'touch stroke {width}'
        touch('touchStart', [point])
        touch('touchMove', [{**point, 'x': end}])
        touch('touchCancel', [])
        assert page.evaluate('testState.strokes.length') == 3, f'touch cancellation {width}'
        assert page.evaluate('testEvents.some(e=>e.type==="pointercancel"&&e.trusted&&e.pointer==="touch")'), 'trusted cancellation'
        assert page.evaluate('testEvents.filter(e=>e.type==="pointerdown").every(e=>e.trusted)'), 'trusted input'
        before = page.evaluate('JSON.stringify({strokes:testState.strokes,past:testState.past})')
        page.set_viewport_size({'width': height, 'height': width})
        page.wait_for_timeout(150)
        assert page.evaluate('JSON.stringify({strokes:testState.strokes,past:testState.past})') == before, 'native resize retention'
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'), 'native rotation overflow'
        assert page.evaluate('document.querySelector("#draw-layer").width <= 2400'), 'backing resolution cap'
        # Undo, redo and recoverable reset also work through normal Enter activation.
        for selector in ['#color-undo', '#color-redo']:
            page.locator(selector).focus()
            page.keyboard.press('Enter')
        page.locator('#color-extra').evaluate('(node)=>node.open=true')
        page.locator('#color-reset').focus()
        page.keyboard.press('Enter')
        assert page.evaluate('testState.strokes.length') == 0, 'keyboard clear'
        page.locator('#color-undo').focus()
        page.keyboard.press('Enter')
        assert page.evaluate('testState.strokes.length') == 3, 'keyboard recover reset'
        assert not errors, errors
        print(f'PASS: {width}x{height}, trusted mouse/pen/emulated touch, capture/cancel, keyboard, DPR 2 and rotation')
        context.close()
    browser.close()
