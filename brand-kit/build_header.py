#!/usr/bin/env python3
"""Animated email header from markets.json. Frame 0 is the complete header (Outlook shows only that)."""
import json, pathlib
from PIL import Image, ImageDraw, ImageFont
here = pathlib.Path(__file__).parent
D = json.loads((here / "markets.json").read_text())
ms = [m for m in D["markets"] if m["status"] == "live" or (D["header"]["show_upcoming"] and m["status"] == "approved")]
W, H, S = 1200, 260, 2
RED, INK, GREY, GREEN = (218, 41, 43), (23, 27, 32), (120, 120, 116), (34, 160, 80)
F = "/System/Library/Fonts/Supplemental/Arial%s.ttf"
def font(px, bold=False): return ImageFont.truetype(F % (" Bold" if bold else ""), px * S)
logo = Image.open(here / "logo.png").convert("RGBA")
lh = 92 * S; logo = logo.resize((round(logo.width * lh / logo.height), lh), Image.LANCZOS)

def frame(t):  # t in 0..1: pulse phase and bar sweep
    im = Image.new("RGBA", (W * S, H * S), (255, 255, 255, 255)); d = ImageDraw.Draw(im)
    im.alpha_composite(logo, (60 * S, 34 * S))
    d.text((W * S - 60 * S, 60 * S), "plentovo.com", font=font(30, True), fill=RED, anchor="ra")
    d.text((W * S - 60 * S, 104 * S), "Everyday essentials, delivered", font=font(22), fill=GREY, anchor="ra") if False else None
    d.text((60 * S, 152 * S), "NOW SERVING" if all(m["status"] == "live" for m in ms) else "OUR MARKETS", font=font(17, True), fill=GREY)
    x = 60
    for m in ms:
        live = m["status"] == "live"; name = m["name"]["en"]; f = font(26, True)
        tw = d.textlength(name, font=f) / S; w = tw + 74
        d.rounded_rectangle((x * S, 180 * S, (x + w) * S, 232 * S), radius=26 * S, fill=(246, 246, 243) if live else (255, 255, 255), outline=(226, 226, 222) if live else (200, 200, 196), width=2 * S)
        cx, cy = (x + 30) * S, 206 * S
        if live:
            r = (8 + 10 * t) * S; a = int(120 * (1 - t))
            ov = Image.new("RGBA", im.size, (0, 0, 0, 0)); ImageDraw.Draw(ov).ellipse((cx - r, cy - r, cx + r, cy + r), fill=GREEN + (a,)); im.alpha_composite(ov); d = ImageDraw.Draw(im)
            d.ellipse((cx - 8 * S, cy - 8 * S, cx + 8 * S, cy + 8 * S), fill=GREEN)
        else:
            d.ellipse((cx - 8 * S, cy - 8 * S, cx + 8 * S, cy + 8 * S), outline=GREY, width=2 * S)
        d.text(((x + 52) * S, 206 * S), name, font=f, fill=INK if live else GREY, anchor="lm")
        x += w + 16
    d.rectangle((0, (H - 8) * S, W * S, H * S), fill=RED)
    sx = int((-0.3 + 1.6 * t) * W); ov = Image.new("RGBA", im.size, (0, 0, 0, 0))
    ImageDraw.Draw(ov).rectangle((sx * S, (H - 8) * S, (sx + 260) * S, H * S), fill=(120, 10, 14, 255)); im.alpha_composite(ov)
    return im.convert("RGB").resize((W, H), Image.LANCZOS)

N = 14
frames = [frame(0)] + [frame(i / N) for i in range(1, N + 1)]
pal = [f.quantize(48, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE) for f in frames]
durs = [1800] + [110] * N
out = here / "out"; out.mkdir(exist_ok=True)
pal[0].save(out / "plentovo-header.gif", save_all=True, append_images=pal[1:], duration=durs, loop=0, optimize=True, disposal=1)
frames[0].save(out / "plentovo-header-static.png", optimize=True)
print((out / "plentovo-header.gif").stat().st_size // 1024, "KB gif;", (out / "plentovo-header-static.png").stat().st_size // 1024, "KB png")
