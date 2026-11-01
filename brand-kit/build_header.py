#!/usr/bin/env python3
"""Animated email header from markets.json: logo, category ribbon, live-country chips, product photos that crossfade.
Frame 0 is the complete header (Outlook shows only that)."""
import json, math, pathlib
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


def star(d, cx, cy, r, fill):
    pts = []
    for i in range(10):
        a = -math.pi / 2 + i * math.pi / 5; rr = r if i % 2 == 0 else r * 0.4
        pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
    d.polygon(pts, fill=fill)

def flag(code, fw=34, fh=24):
    k = 6; w, h = fw * k, fh * k
    im = Image.new("RGBA", (w, h), (255, 255, 255, 255)); d = ImageDraw.Draw(im)
    if code == "za":
        d.rectangle((0, 0, w, h // 2), fill=(222, 56, 49)); d.rectangle((0, h // 2, w, h), fill=(0, 35, 149))
        y = [(0, 0), (w * 0.42, h / 2), (0, h)]
        for col, wd in (((255, 255, 255), h * 0.36), ((0, 122, 77), h * 0.22)):
            d.line([y[0], y[1], y[2]], fill=col, width=int(wd), joint="curve"); d.line([y[1], (w, h / 2)], fill=col, width=int(wd))
        d.polygon([(0, h * 0.14), (w * 0.3, h / 2), (0, h * 0.86)], fill=(255, 182, 18)); d.polygon([(0, h * 0.26), (w * 0.2, h / 2), (0, h * 0.74)], fill=(0, 0, 0))
    elif code == "tn":
        d.rectangle((0, 0, w, h), fill=(231, 0, 19)); r = h * 0.3
        d.ellipse((w / 2 - r, h / 2 - r, w / 2 + r, h / 2 + r), fill=(255, 255, 255))
        d.ellipse((w / 2 - r * 0.78 + r * 0.16, h / 2 - r * 0.78, w / 2 + r * 0.78 + r * 0.16, h / 2 + r * 0.78), fill=(231, 0, 19))
        star(d, w / 2 + r * 0.12, h / 2, r * 0.5, (231, 0, 19))
    elif code == "dz":
        d.rectangle((0, 0, w / 2, h), fill=(0, 98, 51)); d.rectangle((w / 2, 0, w, h), fill=(255, 255, 255)); r = h * 0.3
        d.ellipse((w / 2 - r, h / 2 - r, w / 2 + r, h / 2 + r), fill=(210, 16, 52))
        d.ellipse((w / 2 - r * 0.78 + r * 0.2, h / 2 - r * 0.78, w / 2 + r * 0.78 + r * 0.2, h / 2 + r * 0.78), fill=(255, 255, 255))
        star(d, w / 2 + r * 0.15, h / 2, r * 0.5, (210, 16, 52))
    else:
        d.rectangle((0, 0, w, h), fill=(220, 220, 216))
    mask = Image.new("L", im.size, 0); ImageDraw.Draw(mask).rounded_rectangle((0, 0, w - 1, h - 1), radius=5 * k, fill=255)
    d2 = ImageDraw.Draw(im); d2.rounded_rectangle((0, 0, w - 1, h - 1), radius=5 * k, outline=(0, 0, 0, 40), width=k)
    im.putalpha(mask)
    return im.resize((fw * S // 1, fh * S // 1), Image.LANCZOS)
flags = {m["code"]: flag(m["code"]) for m in ms}

tiles = [[tile(n) for n in g["photos"]] for g in groups]

def base(active, p=0.0):
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
        w = d.textlength(name, font=cf) / S + 112
        d.rounded_rectangle((x * S, 222 * S, (x + w) * S, 266 * S), radius=22 * S, fill=(246, 246, 243), outline=(226, 226, 222), width=2 * S)
        cx, cy = (x + 25) * S, 244 * S
        if live:
            r = (7 + 9 * p) * S; ov = Image.new("RGBA", im.size, (0, 0, 0, 0))
            ImageDraw.Draw(ov).ellipse((cx - r, cy - r, cx + r, cy + r), fill=GREEN + (int(130 * (1 - p)),)); im.alpha_composite(ov); d = ImageDraw.Draw(im)
            d.ellipse((cx - 7 * S, cy - 7 * S, cx + 7 * S, cy + 7 * S), fill=GREEN)
        else:
            d.ellipse((cx - 7 * S, cy - 7 * S, cx + 7 * S, cy + 7 * S), outline=GREY, width=2 * S)
        im.alpha_composite(flags[m["code"]], (int((x + 42) * S), int(244 * S - flags[m["code"]].height / 2))); d = ImageDraw.Draw(im)
        d.text(((x + 84) * S, 244 * S), name, font=cf, fill=INK if live else GREY, anchor="lm")
        x += w + 14
    d.rectangle((0, (H - 8) * S, W * S, H * S), fill=RED)
    return im

def compose(a, b, t, p=0.0):
    im = base(a if t < 0.5 else b, p)
    for k in range(3):
        pa, ma = tiles[a][k]; pb, _ = tiles[b][k]
        p = Image.blend(pa, pb, t) if t else pa
        im.paste(p, ((TX + k * (TW + GAP)) * S, TY * S), ma)
    return im.convert("RGB").resize((OW, OH), Image.LANCZOS)

n = len(groups); frames, durs = [], []
PH = 8  # pulse steps per group hold, ~1.6 s
for a in range(n):
    b = (a + 1) % n
    for k in range(PH):
        frames.append(compose(a, b, 0, k / PH)); durs.append(200)
    frames.append(compose(a, b, 0.5, 0)); durs.append(90)
sheet = Image.new("RGB", (OW, OH * len(frames)))
for i, f in enumerate(frames): sheet.paste(f, (0, i * OH))
pal = sheet.quantize(128, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
pf = [f.quantize(palette=pal, dither=Image.Dither.FLOYDSTEINBERG) for f in frames]
out = here / "out"; out.mkdir(exist_ok=True)
pf[0].save(out / "plentovo-header.gif", save_all=True, append_images=pf[1:], duration=durs, loop=0, optimize=False, disposal=1)
frames[0].save(out / "plentovo-header-static.png", optimize=True)
print((out / "plentovo-header.gif").stat().st_size // 1024, "KB gif;", len(frames), "frames")
