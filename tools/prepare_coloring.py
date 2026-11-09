"""Offline preparation of repository printables. Requires Pillow and OpenCV.

The original black line layer is preserved. Review every generated definition;
never run boundary detection in the browser or accept arbitrary uploads.
"""
from pathlib import Path
import base64
import io
import json
import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'assets' / 'coloring'
OUT.mkdir(exist_ok=True)
for name in ('apple', 'ball', 'star'):
    source = ROOT / 'assets' / 'print' / f'bailabu-coloring-{name}.png'
    im = Image.open(source).convert('L')
    im.thumbnail((800, 1000))
    gray = np.array(im)
    count, labels, stats, centers = cv2.connectedComponentsWithStats((gray > 180).astype('uint8'))
    regions = []
    for i in range(1, count):
        x, y, w, h, area = stats[i]
        if x == 0 or y == 0 or x+w == im.width or y+h == im.height or area < 450:
            continue
        mask = (labels == i).astype('uint8')
        # Expand under the original ink to prevent white seams.
        mask = cv2.dilate(mask, np.ones((3, 3), dtype='uint8'))
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        paths = []
        for contour in contours:
            points = cv2.approxPolyDP(contour, .6, True).reshape(-1, 2)
            paths.append('M' + ' L'.join(f'{x},{y}' for x, y in points) + ' Z')
        regions.append({'id': f'region-{len(regions)+1}', 'd': ' '.join(paths), 'defaultColor': '#ffffff'})
    rgba = np.zeros((*gray.shape, 4), dtype='uint8')
    rgba[:, :, 3] = 255 - gray
    buf = io.BytesIO()
    Image.fromarray(rgba).save(buf, format='PNG')
    definition = {'id': name, 'width': im.width, 'height': im.height,
                  'source': f'assets/print/bailabu-coloring-{name}.png',
                  'provenance': 'Existing Bailabu printable; see README.md, Coloring pages.',
                  'ink': 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode(),
                  'regions': regions}
    (OUT / f'{name}.json').write_text(json.dumps(definition, separators=(',', ':')), encoding='utf-8')
    print(name, len(regions), 'regions')
