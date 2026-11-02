"""Copies the coloring pages into assets/print/<lang>/ for the site.
Source: _shared/printables (Turkish in the top folder, the others in <lang>/), built by _pipeline/build_coloring_book_v2.py.
The native file names stay. Arabic ones are ASCII in the URL and get their Arabic name from the page's download attribute."""
import json, pathlib, shutil, unicodedata

SITE = pathlib.Path(__file__).resolve().parent.parent
SRC = SITE.parent / "_shared" / "printables"
SUFFIX = dict(tr="boyama", en="coloring", es="colorear", de="ausmalbild", pt="colorir", ar="talween")


def slug(text):
    text = text.translate(str.maketrans("ıİşŞğĞ", "iIsSgG"))
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode().lower()
    return "_".join(text.replace("-", " ").split())


catalog = json.loads((SRC / "character_catalog.json").read_text(encoding="utf-8"))
for code, suffix in SUFFIX.items():
    out = SITE / "assets" / "print" / code
    shutil.rmtree(out, ignore_errors=True)
    out.mkdir(parents=True)
    for entry in catalog:
        stem = entry["id"] if code == "ar" else slug(entry["names"][code])
        # Arabic pages take the English page id, the one the page script knows
        target = slug(entry["names"]["en"]) if code == "ar" else stem
        shutil.copy2(SRC / ("" if code == "tr" else code) / f"{stem}_{suffix}.pdf", out / f"{target}_{suffix}.pdf")
    print(code, len(list(out.glob("*.pdf"))))
