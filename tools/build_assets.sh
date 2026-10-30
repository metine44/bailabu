#!/usr/bin/env bash
# Rebuilds assets/ from the YouTube project folders (C:\Youtube). Needs ffmpeg with libwebp + libmp3lame.
set -euo pipefail
Y=/c/Youtube
A="$(cd "$(dirname "$0")/.." && pwd)/assets"
mkdir -p "$A"/{brand,songs,story,chars,sfx,fonts,print}
ff() { ffmpeg -v error -y "$@"; }

# brand
ff -i "$Y/_channels/02_BailabuIsland_EN/raw/B04_codex_v2.png" -vf "scale=2000:-2:flags=lanczos" -c:v libwebp -quality 80 "$A/brand/hero.webp"
ff -i "$Y/_channels/02_BailabuIsland_EN/raw/B04_codex_v2.png" -vf "scale=1200:630:force_original_aspect_ratio=increase,crop=1200:630:x=(iw-1200)*0.75" -q:v 3 "$A/brand/og.jpg"
ff -i "$Y/_channels/02_BailabuIsland_EN/final/profile_800.png" -vf "scale=320:320:flags=lanczos" -c:v libwebp -quality 85 -pix_fmt yuva420p "$A/brand/badge.webp"
ff -i "$Y/_channels/02_BailabuIsland_EN/raw/B01.png" -vf "scale=512:512:flags=lanczos" -c:v libwebp -quality 85 -pix_fmt yuva420p "$A/brand/bear-round.webp"
ff -i "$Y/_channels/02_BailabuIsland_EN/raw/B01.png" -vf "scale=180:180:flags=lanczos" "$A/brand/apple-touch-icon.png"
ff -i "$Y/_channels/02_BailabuIsland_EN/raw/B01.png" -vf "scale=64:64:flags=lanczos" "$A/brand/favicon.png"
ff -i "$Y/_channels/01_TontisAdaTV_TR/final/profile_800.png" -vf "scale=320:320:flags=lanczos" -c:v libwebp -quality 85 "$A/brand/badge-tr.webp"

# song cards (16:9 key art, no text)
song() { ff -i "$Y/$1" -vf "scale=800:450:force_original_aspect_ratio=increase,crop=800:450" -c:v libwebp -quality 78 "$A/songs/$2.webp"; }
song "Kücük Kurbaga/images/final/I01.png"         kiko
song "Renkli Otobüs/images/final/I02.png"         rolly
song "Bes Kücük Ördek/images/final/I01.png"       ducks
song "Ari Viz Viz/images/final/I03.png"           bibi
song "Ali Babanin Ciftligi/images/final/I03.png"  tractor
song "Parla Yildiz/images/final/I01.png"          lumi
song "Ciftlikte Uyku Vakti/images/final/I03.png"  sleepy
song "Minik Balik/Bilder/V2/N05_Flucht_mit_Schwarm_v1.png" minik
song "Sayilari Ögreniyorum/images/final/G10.png"  count10
# video cards of the other formats = the real YouTube thumbnail; -tr = Turkish variant where the thumbnail has text
song "Quiz/episodes/E01_Hangisi_Farkli/output/thumbnail.jpg" odd
song "Quiz/episodes/E02_Kimin_Golgesi/output/thumbnail.jpg"  shadow
song "Geschichten/episodes/D01_Kim_Yedi_Bali/output/thumbnail.en.jpg" honey
song "Geschichten/episodes/D01_Kim_Yedi_Bali/output/thumbnail.tr.jpg" honey-tr
song "Bilderbuch/episodes/E01_Meyveler/output/thumbnail.en.jpg" fruits
song "Bilderbuch/episodes/E01_Meyveler/output/thumbnail.tr.jpg" fruits-tr
song "Geschichten/episodes/K01_Rapunzel/output/thumbnail.en.jpg" rapunzel
song "Memo ve Tonton/episodes/E01_Cilekli_Pasta/images/raw/I04.png" cake

# story: Memo & Tonton E01 (raw 3:2 → 16:9), newest variant wins
R="$Y/Memo ve Tonton/episodes/E01_Cilekli_Pasta/images/raw"
n=1
for i in I04 I13 I15 I16 I25 I27 I31 I34 I38; do
  f="$R/$i.png"; [ -f "$R/${i}_v2.png" ] && f="$R/${i}_v2.png"
  ff -i "$f" -vf "crop=1536:864,scale=1280:720:flags=lanczos" -c:v libwebp -quality 78 "$A/story/cake-$(printf %02d $n).webp"
  n=$((n+1))
done

# character cut-outs (transparent)
for c in afacan balli bailabu_bear findik kuku minik_balik pamuk paytak renkli apple_red banana pear_green strawberry star_yellow ball_blue car_blue elephant flamingo_pink kitten_white turtle_green; do
  ff -i "$Y/Quiz/assets/objects/cut/$c.png" -vf "scale=360:360:force_original_aspect_ratio=decrease:flags=lanczos" -c:v libwebp -quality 82 -pix_fmt yuva420p "$A/chars/$c.webp"
done

# coloring pages (printables): English edition for every language for now; full 300-dpi PNG (download + big preview) + small grid preview
P="$Y/_shared/printables/en"
mkdir -p "$A/print"
rm -f "$A/print"/*
for f in "$P"/*_lineart.png; do
  n=$(basename "$f" _lineart.png)
  cp "$f" "$A/print/bailabu-coloring-$n.png"
  ff -i "$f" -vf "scale=320:-2:flags=lanczos" -c:v libwebp -quality 80 "$A/print/$n.webp"
done

# sfx (locally synthesized, Quiz/scripts/make_sfx.py)
for s in ding pop cheer confetti quack honk buzz blub swish tick; do
  ff -i "$Y/Quiz/assets/sfx/$s.wav" -ac 1 -ar 44100 -c:a libmp3lame -b:a 64k "$A/sfx/$s.mp3"
done
du -sh "$A"/*

# fonts (self-hosted subsets, no Google Fonts request): needs uv
F="$Y/_shared/fonts"
uv run -q --with fonttools --with brotli pyftsubset "$F/Baloo2-VF.ttf" --unicodes="U+0000-00FF,U+0100-017F,U+0131,U+0152-0153,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2190-2193,U+2212" --layout-features='*' --flavor=woff2 --output-file="$A/fonts/baloo2.woff2"
uv run -q --with fonttools --with brotli pyftsubset "$F/BalooBhaijaan2-VF.ttf" --unicodes="U+0020-007E,U+00A0-00FF,U+0600-06FF,U+0750-077F,U+FB50-FDFF,U+FE70-FEFF,U+200C-200F,U+2000-206F" --layout-features='*' --flavor=woff2 --output-file="$A/fonts/baloo-bhaijaan2.woff2"
cp "$F/OFL_BalooBhaijaan2.txt" "$A/fonts/OFL.txt"
