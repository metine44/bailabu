"""Run focused checks against a local preview (python -m http.server 8765).

Uses the same installed Edge path as prerender.py. Screenshots stay in a
temporary folder for inspection, never in source control.
"""
import subprocess
import tempfile
from pathlib import Path
import sys

EDGE = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
with tempfile.TemporaryDirectory() as profile:
    command = [EDGE, '--headless=new', '--disable-gpu', '--no-first-run',
               f'--user-data-dir={profile}', '--force-prefers-reduced-motion', '--virtual-time-budget=60000', '--dump-dom',
               'http://127.0.0.1:8765/tools/test-coloring-browser.html']
    result = subprocess.run(command, capture_output=True, encoding='utf-8', timeout=90)
    import re
    message = re.search(r'<pre id="result">(.*?)</pre>', result.stdout, re.S)
    if not message:
        raise SystemExit('No browser test result: ' + result.stderr[-1000:])
    print(message.group(1))
    if not message.group(1).startswith('PASS:'):
        raise SystemExit(1)

if '--screenshots' in sys.argv:
    output = Path(tempfile.mkdtemp(prefix='bailabu-review-'))
    for width, height in [(320,568),(390,844),(768,1024),(1024,768),(1440,900)]:
        for page in ['home','color','draw']:
            with tempfile.TemporaryDirectory() as profile:
                screenshot = output / f'{page}-{width}.png'
                try:
                    subprocess.run([EDGE,'--headless=new','--disable-gpu','--no-first-run',
                        '--hide-scrollbars', f'--user-data-dir={profile}',
                        '--window-size=1600,1200', '--force-device-scale-factor=1',
                        '--virtual-time-budget=4000', f'--screenshot={screenshot}',
                        f'http://127.0.0.1:8765/tools/preview-coloring.html?width={width}&height={height}&page={page}'], capture_output=True, timeout=10)
                except subprocess.TimeoutExpired:
                    if not screenshot.exists():
                        raise
                if not screenshot.exists():
                    raise SystemExit(f'Missing screenshot: {screenshot}')
                from PIL import Image
                with Image.open(screenshot) as im:
                    im.crop((0,0,width,height)).save(screenshot)
    print('Review screenshots:', output)
