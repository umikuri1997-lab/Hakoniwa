#!/usr/bin/env python3
"""ふきだしの絵（もらった30こ）を 32×32 にして、1まいの WebP（6列×5行、192×160）にする。
使い方：python3 tools/art/bubble/build.py <出力フォルダ>   出力：bubble.png（確認用）・bubble.webp・BUBSPR の行"""
import sys, os, hashlib, numpy as np
from PIL import Image
SRC = os.path.join(os.path.dirname(__file__), 'sheet.png')
NAMES = 'spark box fire drops coffee basket hammer drop heart clap wave note sprout pick spring axe dizzy zzz gheart fish lantern firework gift pan chestnut notes house rice dots q'.split()
im = Image.open(SRC).convert('RGBA'); a = np.array(im); W, H = im.size
PW, PH = W / 6, H / 5; SC = 32 / 37; out = Image.new('RGBA', (192, 160), (0, 0, 0, 0))
for i, n in enumerate(NAMES):
    cx, cy = i % 6, i // 6
    x0, y0, x1, y1 = int(cx * PW), int(cy * PH), int((cx + 1) * PW), int((cy + 1) * PH)
    cell = a[y0:y1, x0:x1]; ys, xs = np.where(cell[..., 3] > 128)
    mx, my = (xs.min() + xs.max() + 1) / 2 + x0, (ys.min() + ys.max() + 1) / 2 + y0
    win = 37; sx, sy = int(round(mx - win / 2)), int(round(my - win / 2))
    pad = np.zeros((win, win, 4), np.uint8)
    for yy in range(win):
        for xx in range(win):
            X, Y = sx + xx, sy + yy
            if x0 <= X < x1 and y0 <= Y < y1: pad[yy, xx] = a[Y, X]
    p = pad.astype(float); p[..., :3] *= p[..., 3:] / 255
    t = Image.fromarray(p.astype(np.uint8), 'RGBA').resize((32, 32), Image.BOX)
    q = np.array(t).astype(float); al = q[..., 3]
    rgb = np.where(al[..., None] > 0, q[..., :3] * 255 / np.maximum(al[..., None], 1), 0)
    keep = al >= 170; res = np.zeros((32, 32, 4), np.uint8)
    res[..., :3] = np.clip(rgb, 0, 255).astype(np.uint8); res[..., 3] = np.where(keep, 255, 0)
    res[~keep] = 0
    out.alpha_composite(Image.fromarray(res, 'RGBA'), (cx * 32, cy * 32))
d = sys.argv[1] if len(sys.argv) > 1 else '.'; os.makedirs(d, exist_ok=True)
out.save(os.path.join(d, 'bubble.png'))
out.save(os.path.join(d, 'bubble.webp'), lossless=True, exact=True, method=4)
h = hashlib.sha1(open(os.path.join(d, 'bubble.webp'), 'rb').read()).hexdigest()[:10]
print(h, {n: [i % 6, i // 6] for i, n in enumerate(NAMES)})
