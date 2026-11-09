"""Deterministic, offline studio preparation with Pillow and OpenCV.

SVGs are authored source. JSON is the renderer's narrow data contract, not SVG
markup. Only the two reviewed fruit sources receive offline region preparation;
other raster ink is downsampled without inventing paint regions.
"""
import base64
import io
import json
from pathlib import Path
import re
import xml.etree.ElementTree as ET
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'assets/coloring'
NS = '{http://www.w3.org/2000/svg}'
PATH = re.compile(r'[MLHVCAQSTZmlhvcaqstz0-9.,\s-]+\Z')


def write(name, definition):
    (OUT / f'{name}.json').write_text(json.dumps(definition, separators=(',', ':')) + '\n', encoding='utf-8')


def prepare():
    sources = sorted((ROOT / 'assets/print').glob('bailabu-coloring-*.png'))
    for source in sources:
        name = source.stem.removeprefix('bailabu-coloring-').replace('_', '-')
        if name in ('ball', 'apple', 'star'):
            continue  # Keep the previously approved region IDs and original ink exactly.
        im = Image.open(source).convert('L')
        im.thumbnail((800, 1000), Image.Resampling.LANCZOS)
        ink = Image.new('RGBA', im.size, (0, 0, 0, 0))
        ink.putalpha(im.point(lambda p: 255-p))
        buf = io.BytesIO()
        ink.save(buf, format='PNG', optimize=True)
        regions = []
        if name in ('banana', 'pear'):
            # Two individually reviewed simple fruits, using the established
            # offline contour method. Stable IDs are assigned below after review.
            import cv2
            import numpy as np
            gray = np.array(im)
            count, labels, stats, _ = cv2.connectedComponentsWithStats((gray > 180).astype('uint8'))
            for i in range(1, count):
                x, y, w, h, area = stats[i]
                if x == 0 or y == 0 or x+w == im.width or y+h == im.height or area < 450:
                    continue
                mask = cv2.dilate((labels == i).astype('uint8'), np.ones((3, 3), dtype='uint8'))
                contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                paths = []
                for contour in contours:
                    points = cv2.approxPolyDP(contour, .6, True).reshape(-1, 2)
                    paths.append('M' + ' L'.join(f'{x},{y}' for x, y in points) + ' Z')
                regions.append(dict(id=f'{name}-part-{len(regions)+1}', d=' '.join(paths), defaultColor='#ffffff'))
            semantic = {'banana': ['stem-top', 'stem-rim', 'peel', 'tip'],
                        'pear': ['stem', 'leaf-upper', 'leaf-lower', 'fruit']}
            assert len(regions) == len(semantic[name]), 'Source changed: review regions before regenerating'
            for region, region_id in zip(regions, semantic[name]): region['id'] = region_id
            print(name, len(regions), 'reviewed closed regions')
        write(name, dict(id=name, width=im.width, height=im.height,
              source=source.relative_to(ROOT).as_posix(),
              provenance='Existing Bailabu printable; README.md Coloring pages. ' + ('Reviewed offline closed-region preparation.' if regions else 'Draw-only: no approved semantic fill regions.'),
              modes=dict(color=bool(regions), draw=True),
              ink='data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode(), regions=regions))
    for source in sorted((OUT / 'svg').glob('*.svg')):
        svg = ET.parse(source).getroot()
        name = svg.attrib['data-picture-id']
        assert source.stem == name and svg.attrib['viewBox'] == '0 0 800 1000'
        assert set(svg.attrib) == {'viewBox', 'data-picture-id'}
        allowed = {'svg', 'g', 'path'}
        attrs = {'viewBox', 'data-picture-id', 'id', 'fill', 'stroke', 'stroke-width',
                 'stroke-linejoin', 'stroke-linecap', 'pointer-events', 'd'}
        for node in svg.iter():
            assert node.tag.removeprefix(NS) in allowed
            assert set(node.attrib) <= attrs
            if 'd' in node.attrib:
                assert PATH.fullmatch(node.attrib['d'])
        groups = {g.attrib['id']: g for g in svg.findall(NS+'g')}
        assert {'background', 'regions', 'decoration'} <= set(groups) <= {'background', 'regions', 'decoration', 'underlay'}
        regions = [dict(id=p.attrib['id'], d=p.attrib['d'], defaultColor='#ffffff') for p in groups['regions']]
        assert regions and len({r['id'] for r in regions}) == len(regions)
        assert all(re.fullmatch('[a-z][a-z0-9-]*', r['id']) and r['d'].rstrip().endswith('Z') for r in regions)
        write(name, dict(id=name, width=800, height=1000,
              source=source.relative_to(ROOT).as_posix(),
              provenance='Original Bailabu SVG authored in this repository, November 2026. No external assets or generation services.',
              modes=dict(color=True, draw=True), vector=True, regions=regions,
              decoration=[p.attrib['d'] for p in groups['decoration']],
              underlay=[p.attrib['d'] for p in groups.get('underlay', [])]))
    print(f'Prepared {len(sources)-3} raster definitions (2 closed-region conversions) and {len(list((OUT / "svg").glob("*.svg")))} original vector definitions; preserved 3 approved definitions.')
    catalog = json.loads((ROOT / 'tools/studio-catalog.json').read_text(encoding='utf-8'))
    html = (ROOT / 'index.html').read_text(encoding='utf-8')
    entries = re.findall(r'\["([a-z_]+)", (\{[^\n]+\})\]', html.split('const PRINTS = [')[1].split('];')[0])
    assert len(entries) == len(sources) == 35
    templates = []
    for original, raw_names in entries:
        name = original.replace('_', '-')
        names = json.loads(raw_names)
        labels = {lang: names.get(lang, names['all']) for lang in ('en', 'de', 'es', 'pt', 'tr', 'ar')}
        if name == 'banana':
            labels.update(de='Banane', es='Plátano', pt='Banana')
        if name == 'tractor':
            labels.update(es='Tractor')
        category = 'bailabu'
        if name in ('apple', 'banana', 'pear', 'strawberry'): category = 'food'
        if name in ('ball', 'car', 'tractor'): category = 'play'
        if name in ('star', 'the-moon'): category = 'nature'
        if name in ('elephant', 'flamingo', 'kitten', 'turtle'): category = 'animals'
        templates.append(dict(id=name, labels=labels, category=category,
            thumbnail=f'assets/print/{original}.webp', artwork=f'assets/coloring/{name}.json',
            modes=dict(color=name in ('ball', 'apple', 'star', 'banana', 'pear'), draw=True), printable=True))
    for entry in catalog.pop('newTemplates'):
        name = entry['id']
        templates.append(dict(**entry, thumbnail=f'assets/coloring/svg/{name}.svg',
            artwork=f'assets/coloring/{name}.json', modes=dict(color=True, draw=True), printable=False))
    # Keep the easiest three and new themes at the front; every source is still in the gallery.
    templates.sort(key=lambda t: (0 if t['id'] in ('ball', 'apple', 'star') else 1 if not t['printable'] else 2))
    templates.insert(0, dict(id='blank', category='all', modes=dict(color=False, draw=True), printable=False))
    catalog['templates'] = templates
    payload = json.dumps(catalog, ensure_ascii=False, separators=(',', ':'))
    (ROOT / 'assets/coloring-library.js').write_text(
        '/* Generated by tools/prepare_studio.py; edit tools/studio-catalog.json or authored SVGs. */\n'
        '(function(root){const library=' + payload + ';\n'
        "if(typeof module!=='undefined') module.exports=library; else root.BailabuStudio=library;\n})(globalThis);\n", encoding='utf-8')


if __name__ == '__main__':
    prepare()
    import sys
    if '--review' in sys.argv:
        import tempfile
        sheet = Image.new('RGB', (1200, 7*210), 'white')
        painter = ImageDraw.Draw(sheet)
        for i, p in enumerate(sorted((ROOT / 'assets/print').glob('bailabu-coloring-*.png'))):
            im = Image.open(p).convert('RGB')
            im.thumbnail((160, 180))
            x, y = (i % 6)*200, (i//6)*210
            sheet.paste(im, (x, y))
            painter.text((x, y+182), p.stem.removeprefix('bailabu-coloring-'), fill='black')
        path = Path(tempfile.gettempdir()) / 'bailabu-existing-artwork.jpg'
        sheet.save(path)
        print(path)
