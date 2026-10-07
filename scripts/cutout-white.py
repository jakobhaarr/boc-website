#!/usr/bin/env python3
"""
Cuts a person out of a photo shot on a plain white studio background: the white
that touches the picture's edge becomes transparent, with a softened edge, so the
person can stand on any ground (the profile band on a member's story page).

  python3 scripts/cutout-white.py in.png out.png [tolerance]

Needs Pillow only. Near-white means every channel at or above 255 - tolerance
(default 14); white inside the person (a helmet's highlight, glasses) is kept,
since only white connected to the border is removed.
"""
import sys
from PIL import Image, ImageDraw, ImageFilter

src, dst = sys.argv[1], sys.argv[2]
tol = int(sys.argv[3]) if len(sys.argv) > 3 else 14

img = Image.open(src).convert("RGB")
w, h = img.size
floor = 255 - tol
# 255 where a pixel is near-white, else 0.
near = img.point(lambda v: 255 if v >= floor else 0).split()
white = Image.eval(near[0], lambda v: v)
white = Image.composite(near[0], Image.new("L", (w, h), 0), near[1])
white = Image.composite(white, Image.new("L", (w, h), 0), near[2])
# Flood the white that is connected to the border.
for seed in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1), (w // 2, 0), (0, h // 2), (w - 1, h // 2)]:
    if white.getpixel(seed) == 255:
        ImageDraw.floodfill(white, seed, 128)
background = white.point(lambda v: 255 if v == 128 else 0)
alpha = background.point(lambda v: 255 - v)
# Pull the edge in a pixel so no white fringe stays, then soften it.
alpha = alpha.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.4))
out = img.convert("RGBA")
out.putalpha(alpha)
out.save(dst, optimize=True)
