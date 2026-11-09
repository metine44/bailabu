"""Focused expansion checks in installed Edge; no production testing API.

Run with a loopback server on 8765. Screenshots are optional, in OS temp only.
"""
from pathlib import Path
import json
import tempfile
import sys
from playwright.sync_api import sync_playwright

LAYOUTS = [(320, 568), (390, 844), (768, 1024), (1024, 768), (1440, 900)]
BASE = 'http://127.0.0.1:8765'

with sync_playwright() as p:
    browser = p.chromium.launch(channel='msedge', headless=True)
    page = browser.new_page(viewport={'width': 1440, 'height': 900}, device_scale_factor=2,
                            reduced_motion='reduce', has_touch=True)
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(BASE + '/?lang=en#color-online')
    page.locator('[data-region]').first.wait_for()
    page.evaluate('''() => {
      const render=BailabuDrawing.render;
      BailabuDrawing.render=(c,s,...args)=>{window.testState=s;return render(c,s,...args)};
      window.chooseTest=id=>document.querySelector(`[data-picture="${id}"]`).click();
      window.clickTest=s=>document.querySelector(s.startsWith('[data-mode') ? 'button'+s : s).click();
      window.dotTest=(x,y)=>{
        const c=document.querySelector('#draw-layer'),r=c.getBoundingClientRect();
        for(const type of ['pointerdown','pointerup'])c.dispatchEvent(new PointerEvent(type,{
          bubbles:true,cancelable:true,isPrimary:true,pointerId:1,button:0,
          clientX:r.left+r.width*x,clientY:r.top+r.height*y}));
      };
      const create=URL.createObjectURL;
      URL.createObjectURL=function(blob){if(blob.type==='image/png')window.testBlob=blob;return create.call(this,blob)};
      HTMLAnchorElement.prototype.click=function(){if(!this.download)throw Error('Unexpected download link')};
      window.exportTest=async()=>{
        await downloadColoring(document.querySelector('#color-paper svg'),testState.picture,testState);
        const image=await createImageBitmap(testBlob),c=document.createElement('canvas');
        c.width=image.width;c.height=image.height;const ctx=c.getContext('2d');ctx.drawImage(image,0,0);image.close();
        window.exportContext=ctx;return [c.width,c.height,testBlob.size];
      };
    }''')

    def click(selector):
        page.evaluate('(s)=>clickTest(s)', selector)

    def choose(name):
        page.evaluate('(id)=>chooseTest(id)', name)
        page.wait_for_function('(id)=>window.testState?.picture===id && !document.querySelector("#color-tools").hidden', arg=name)

    def dot(x, y):
        page.evaluate('([x,y])=>dotTest(x,y)', [x, y])

    templates = page.evaluate('BailabuStudio.templates')
    assert len(templates) == 51
    click('[data-mode="draw"]')
    for t in templates:
        choose(t['id'])
        click('[data-mode="draw"]')
        assert page.evaluate('testState.mode') == 'draw'
        click('[data-tool="brush"]')
        dot(.1, .1)
        assert page.evaluate('testState.strokes.length') == 1, t['id']
        assert page.locator('[data-print]').is_visible() == t['printable']
        assert page.locator('[data-mode="color"]').is_disabled() == (not t['modes']['color'])
        if t['modes']['color']:
            click('[data-mode="color"]')
            click('[data-color="#ff5a5f"]')
            if t['id']=='birthday-cake':
                page.locator('[data-region]').first.focus(); page.keyboard.press('Enter')
            else:
                page.locator('[data-region]').first.evaluate('(n)=>n.dispatchEvent(new MouseEvent("click",{bubbles:true}))')
            assert page.evaluate('Object.values(testState.fills).includes("#ff5a5f")')
            assert page.evaluate('''[...document.querySelectorAll('[data-region]')].every(n=>n.getTotalLength()>0 && n.getBBox().width>0 && n.getBBox().height>0)''')
        # Actual SVG serialization + Canvas rasterization, not a mocked exporter.
        if t['id'] in ('birthday-cake', 'balloons', 'pear', 'banana', 'kitten', 'blank'):
            dims = page.evaluate('exportTest()')
            assert dims[0:2] == [1200, 1500] and dims[2] > 1000, (t['id'], dims)
            counts=page.evaluate('''()=>{const p=exportContext.getImageData(0,0,1200,1500).data;
              let red=0,ink=0;for(let i=0;i<p.length;i+=4){
                if(p[i]===255 && p[i+1]===90 && p[i+2]===95)red++;
                if(p[i]<60 && p[i+1]<60 && p[i+2]<60)ink++;
              }return {red,ink};}''')
            assert page.evaluate('Array.from(exportContext.getImageData(120,150,1,1).data)') == [61,184,245,255], ('brush PNG',t['id'])
            if t['modes']['color']: assert counts['red']>100, ('region PNG',t['id'],counts)
            if t['id']!='blank': assert counts['ink']>1000, ('ink PNG',t['id'],counts)
        click('#color-reset')
    print('PASS: all 51 templates open/draw; 20 fill-capable definitions; local PNG for old/new/vector/raster/blank; capability/print controls')

    choose('blank')
    positions = [(.005,.005),(.995,.005),(.005,.995),(.995,.995),(.5,.5),(.5,.005),(.5,.995),(.005,.5),(.995,.5)]
    for width, height in LAYOUTS:
        page.set_viewport_size({'width': width, 'height': height})
        click('#color-reset')
        click('[data-color="#ff5a5f"]')
        for x, y in positions:
            dot(x, y)
            point = page.evaluate('testState.strokes.at(-1).points[0]')
            assert abs(point['x']-800*x) < .01 and abs(point['y']-1000*y) < .01
        bounds = page.locator('.color-stage').bounding_box()
        paper = page.locator('#color-paper').bounding_box()
        assert abs(bounds['width']-(paper['width']-22)) < 2, 'full blank workspace width'
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'), 'overflow'
        before = page.evaluate('JSON.stringify({strokes:testState.strokes,past:testState.past})')
        page.set_viewport_size({'width': height, 'height': width})
        page.wait_for_timeout(100)
        assert page.evaluate('JSON.stringify({strokes:testState.strokes,past:testState.past})') == before
        for x, y in positions:
            assert page.evaluate('''([x,y])=>{const c=document.querySelector('#draw-layer');return c.getContext('2d').getImageData(Math.min(c.width-1,Math.floor(x*c.width)),Math.min(c.height-1,Math.floor(y*c.height)),1,1).data[3]>200}''', [x,y])
        page.evaluate('exportTest()')
        for x, y in positions:
            rgba = page.evaluate('([x,y])=>Array.from(exportContext.getImageData(Math.floor(x*1200),Math.floor(y*1500),1,1).data)', [x,y])
            assert rgba == [255,90,95,255], ('edge export',x,y,rgba)
        for n in page.locator('.swatch,[data-mode],[data-tool],[data-size],.color-picker:not([hidden])').all():
            b=n.bounding_box()
            assert b['width']>=48 and b['height']>=48, 'touch target'
        print(f'PASS: blank full width, all corners/edges/center, canonical coordinates, rotation replay and PNG pixels at {width}x{height}')

    click('#color-reset')
    palette = page.evaluate('BailabuStudio.palette')
    for i,c in enumerate(palette):
        click('[data-color="'+c['value']+'"]')
        assert page.locator('[data-color="'+c['value']+'"]').get_attribute('aria-pressed') == 'true'
        click('[data-tool="crayon"]')
        assert page.evaluate('testState.color') == c['value']
        dot(.75,(i+1)/20)
        click('[data-tool="brush"]')
        assert page.evaluate('testState.color') == c['value']
        dot(.25,(i+1)/20)
        click('#color-undo'); click('#color-redo')
        assert page.evaluate('testState.strokes.at(-1).color') == c['value']
    page.evaluate('exportTest()')
    for i,c in enumerate(palette):
        rgba=page.evaluate('(y)=>Array.from(exportContext.getImageData(300,Math.floor(y*1500),1,1).data)', (i+1)/20)
        assert rgba == [int(c['value'][j:j+2],16) for j in (1,3,5)] + [255], (c,rgba)
    print('PASS: 18 selectable colors, Brush/Crayon stability, exact Undo/Redo values and every palette color in PNG')

    # Normal keyboard activation and template-isolated reset/history.
    choose('birthday-cake')
    page.locator('button[data-mode="draw"]').focus(); page.keyboard.press('Enter')
    dot(.2,.2)
    before=page.evaluate('JSON.stringify(testState.strokes)')
    choose('balloons'); dot(.3,.3); click('#color-reset')
    page.locator('[data-picture="birthday-cake"]').focus(); page.keyboard.press('Enter')
    page.wait_for_function('testState.picture==="birthday-cake"')
    assert page.evaluate('JSON.stringify(testState.strokes)')==before
    for lang in ('en','de','es','pt','tr','ar'):
        page.evaluate('''lang=>{document.querySelector('#langBtn').click();document.querySelector(`#langMenu button[lang="${lang}"]`).click()}''',lang)
        assert page.evaluate('''() => [...document.querySelectorAll('.swatch')].every(n=>n.getAttribute('aria-label') && n.getAttribute('aria-label')!=='undefined')''')
        for t in templates:
            if t['id']!='blank':
                assert page.locator('[data-picture="'+t['id']+'"] span').inner_text() == t['labels'][lang]
        for width,height in LAYOUTS:
            page.set_viewport_size({'width':width,'height':height})
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'), (lang,width)
        for category in page.evaluate('BailabuStudio.categories'):
            click('[data-category="'+category['id']+'"]')
            assert page.locator('[data-picture="blank"]').is_visible()
            assert page.locator('.color-pictures .color-picker:not([hidden])').count()>0
        click('[data-category="all"]')
    assert not errors, errors
    print('PASS: keyboard templates/modes, independent work/reset, all template/color/category labels in six locales, category filters, five-width RTL/overflow checks')

    if '--screenshots' in sys.argv:
        output=Path(tempfile.mkdtemp(prefix='bailabu-studio-review-'))
        page.evaluate('''()=>{document.querySelector('#langBtn').click();document.querySelector('#langMenu button[lang="en"]').click()}''')
        # Source-art contact sheet and prepared-fruit fill review.
        page.goto(BASE+'/tools/preview-studio.html')
        page.set_viewport_size({'width':1200,'height':1500})
        page.locator('img').last.wait_for()
        page.wait_for_function('document.body.dataset.ready==="true" && [...document.images].every(i=>i.complete)')
        page.screenshot(path=str(output/'motifs.png'),full_page=True)
        page.goto(BASE+'/?lang=en#color-online')
        page.locator('[data-region]').first.wait_for()
        for i,(width,height) in enumerate(LAYOUTS):
            page.set_viewport_size({'width':width,'height':height})
            target=['birthday-cake','balloons','blank','kitten','banana'][i]
            page.locator('[data-picture="'+target+'"]').evaluate('(n)=>n.click()')
            page.wait_for_function('(id)=>document.querySelector(`[data-picture="${id}"]`).getAttribute("aria-pressed")==="true" && !document.querySelector("#color-tools").hidden',arg=target)
            page.locator('button[data-mode="draw"]').click()
            page.evaluate('scrollTo(0,0)')
            page.screenshot(path=str(output/f'{target}-{width}.png'),full_page=True)
        print('Review screenshots:',output)
    browser.close()
