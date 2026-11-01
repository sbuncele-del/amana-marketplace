#!/usr/bin/env python3
"""Animated email header from markets.json: logo, category ribbon, live-country chips, product photos that crossfade.
Frame 0 is the complete header (Outlook shows only that)."""
import json, pathlib
from PIL import Image, ImageDraw, ImageFont
here = pathlib.Path(__file__).parent
D = json.loads((here / "markets.json").read_text())
ms = [m for m in D["markets"] if m["status"] == "live" or (D["header"]["show_upcoming"] and m["status"] == "approved")]
groups = D["header"]["groups"]
W, H, S = 1200, 300, 2
RED, INK, GREY, GREEN = (218, 41, 43), (23, 27, 32), (120, 120, 116), (34, 160, 80)
F = "/System/Library/Fonts/Supplemental/Arial%s.ttf"
def font(px, bold=False): return ImageFont.truetype(F % (" Bold" if bold else ""), px * S)
logo = Image.open(here / "logo.png").convert("RGBA")
lh = 84 * S; logo = logo.resize((round(logo.width * lh / logo.height), lh), Image.LANCZOS)
OW, OH = 900, 225
TW, TH, GAP, TX, TY = 168, 228, 12, 612, 36

def tile(name):
    im = Image.open(here / "photos" / f"{name}.webp").convert("RGB")
    h = im.height; w = round(h * TW / TH); x = (im.width - w) // 2
    im = im.crop((x, 0, x + w, h)).resize((TW * S, TH * S), Image.LANCZOS)
    mask = Image.new("L", im.size, 0); ImageDraw.Draw(mask).rounded_rectangle((0, 0, im.width - 1, im.height - 1), radius=14 * S, fill=255)
    return im, mask

tiles = [[tile(n) for n in g["photos"]] for g in groups]

def base(active):
    im = Image.new("RGBA", (W * S, H * S), (255, 255, 255, 255)); d = ImageDraw.Draw(im)
    im.alpha_composite(logo, (60 * S, 32 * S))
    x = 60; f = font(19, True)
    for i, g in enumerate(groups):
        w = d.textlength(g["label"], font=f) / S
        on = i == active
        d.text((x * S, 146 * S), g["label"], font=f, fill=RED if on else (165, 165, 160))
        if on: d.rectangle((x * S, 174 * S, (x + w) * S, 177 * S), fill=RED)
        x += w + 30
    d.text((60 * S, 200 * S), "NOW SERVING", font=font(14, True), fill=GREY)
    x = 60; cf = font(22, True)
    for m in ms:
        live = m["status"] == "live"; name = m["name"]["en"]
        w = d.textlength(name, font=cf) / S + 64
        d.rounded_rectangle((x * S, 222 * S, (x + w) * S, 266 * S), radius=22 * S, fill=(246, 246, 243), outline=(226, 226, 222), width=2 * S)
        cx, cy = (x + 25) * S, 244 * S
        d.ellipse((cx - 7 * S, cy - 7 * S, cx + 7 * S, cy + 7 * S), fill=GREEN) if live else d.ellipse((cx - 7 * S, cy - 7 * S, cx + 7 * S, cy + 7 * S), outline=GREY, width=2 * S)
        d.text(((x + 44) * S, 244 * S), name, font=cf, fill=INK if live else GREY, anchor="lm")
        x += w + 14
    d.rectangle((0, (H - 8) * S, W * S, H * S), fill=RED)
    return im

def compose(a, b, t):
    im = base(a if t < 0.5 else b)
    for k in range(3):
        pa, ma = tiles[a][k]; pb, _ = tiles[b][k]
        p = Image.blend(pa, pb, t) if t else pa
        im.paste(p, ((TX + k * (TW + GAP)) * S, TY * S), ma)
    return im.convert("RGB").resize((OW, OH), Image.LANCZOS)

n = len(groups); frames, durs = [], []
for a in range(n):
    b = (a + 1) % n
    frames.append(compose(a, b, 0)); durs.append(1800)
    for t in (0.5,):
        frames.append(compose(a, b, t)); durs.append(90)
sheet = Image.new("RGB", (OW, OH * len(frames)))
for i, f in enumerate(frames): sheet.paste(f, (0, i * OH))
pal = sheet.quantize(128, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
pf = [f.quantize(palette=pal, dither=Image.Dither.FLOYDSTEINBERG) for f in frames]
out = here / "out"; out.mkdir(exist_ok=True)
pf[0].save(out / "plentovo-header.gif", save_all=True, append_images=pf[1:], duration=durs, loop=0, optimize=False, disposal=1)
frames[0].save(out / "plentovo-header-static.png", optimize=True)
print((out / "plentovo-header.gif").stat().st_size // 1024, "KB gif;", len(frames), "frames")
