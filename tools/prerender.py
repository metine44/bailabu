"""Writes the English lists into index.html, so crawlers and link previews see them without JavaScript.
The page script replaces them on load (language switch, filters). Needs Microsoft Edge."""
import os, re, subprocess, tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGE = os.path.join(ROOT, "index.html")
EDGE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
GRIDS = ["langMenu", "friendsGrid", "videoTabs", "videoGrid", "coloringGrid", "channelGrid"]

with tempfile.TemporaryDirectory() as profile:
    url = "file:///" + PAGE.replace("\\", "/") + "?lang=en"
    dom = subprocess.run([EDGE, "--headless=new", "--disable-gpu", "--allow-file-access-from-files", f"--user-data-dir={profile}",
                          "--virtual-time-budget=3000", "--dump-dom", url],
                         capture_output=True, encoding="utf-8", timeout=120).stdout

src = open(PAGE, encoding="utf-8", newline="").read()
for g in GRIDS:
    tag = "div" if g == "videoTabs" else "ul"
    inner = re.search(rf'<{tag} id="{g}"[^>]*>(.*?)</{tag}>', dom, re.S).group(1).strip()
    assert inner, g
    src, n = re.subn(rf'(<{tag} id="{g}"[^>]*>).*?(</{tag}>)', lambda x: x.group(1) + inner + x.group(2), src, count=1, flags=re.S)
    assert n == 1, g
    print(g, len(inner))
open(PAGE, "w", encoding="utf-8", newline="").write(src)
