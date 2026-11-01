"""Spoken game lines for the website, made with ElevenLabs: assets/voice/<lang>/<key>.mp3 + assets/voice/manifest.json.

usage: python tools/build_voices.py [--lang en de ...] [--dry]
Lines come from index.html (tools/voice_lines.js). A take is only made when its text or voice changed, so a rerun costs
nothing and changing one language's voice in VOICES below remakes only that language. --dry prints the character count.
Afterwards update COST.md in the root folder. Files are mono 64 kbps, with the silence at both ends cut.
"""
import argparse, json, os, subprocess, tempfile, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "assets", "voice")
MANIFEST = os.path.join(OUT, "manifest.json")
ELLA, DENIZ = "kC1WIuSSgwH2T8iOV4iJ", "2w5twzryiFg9VNnXphRP"
VOICES = {"en": ELLA, "es": ELLA, "de": ELLA, "pt": ELLA, "ar": ELLA, "tr": DENIZ}
SPOKEN = {("de", "n4"): "Vier, ", ("ar", "praise1"): "رَائِعٌ!"}   # spelled for the voice: "Vier!" came out with a w, bare "رائع!" garbled
SETTINGS = {"stability": 0.5, "similarity_boost": 0.75, "speed": 1.0}   # same as the quiz voices
TRIM = "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse"


def api_key():
    def find(o):
        if isinstance(o, dict):
            if "ELEVENLABS_API_KEY" in o:
                return o["ELEVENLABS_API_KEY"]
            return next(filter(None, map(find, o.values())), None)
        return None
    if os.environ.get("ELEVENLABS_API_KEY"):
        return os.environ["ELEVENLABS_API_KEY"]
    return find(json.load(open(os.path.expanduser("~/.claude-2/.claude.json"), encoding="utf-8")))


def tts(key, text, voice, lang, out):
    body = {"text": text, "model_id": "eleven_v4", "language_code": lang, "voice_settings": SETTINGS}
    req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{voice}?output_format=mp3_44100_128",
                                 data=json.dumps(body).encode(), headers={"xi-api-key": key, "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=120) as r:
        data = r.read()
    with tempfile.TemporaryDirectory() as d:
        raw = os.path.join(d, "raw.mp3")
        open(raw, "wb").write(data)
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", raw, "-af", TRIM, "-ac", "1", "-c:a", "libmp3lame", "-b:a", "64k", out], check=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--lang", nargs="+", default=list(VOICES)), ap.add_argument("--dry", action="store_true")
    a = ap.parse_args()
    lines = json.loads(subprocess.run(["node", os.path.join(HERE, "voice_lines.js")], capture_output=True, check=True).stdout.decode("utf-8"))
    done = json.load(open(MANIFEST, encoding="utf-8")) if os.path.exists(MANIFEST) else {}
    key = None if a.dry else api_key()
    chars = 0
    for lang in a.lang:
        os.makedirs(os.path.join(OUT, lang), exist_ok=True)
        for k, text in lines[lang].items():
            want = {"text": text, "voice": VOICES[lang]}
            path = os.path.join(OUT, lang, k + ".mp3")
            if done.get(lang, {}).get(k) == want and os.path.exists(path):
                continue
            chars += len(text)
            if not a.dry:
                tts(key, SPOKEN.get((lang, k), text), VOICES[lang], lang, path)
                done.setdefault(lang, {})[k] = want
                json.dump(done, open(MANIFEST, "w", encoding="utf-8"), ensure_ascii=False, indent=0)
        print(lang, "done", flush=True)
    print(("would cost " if a.dry else "cost ") + f"{chars} characters")


if __name__ == "__main__":
    main()
