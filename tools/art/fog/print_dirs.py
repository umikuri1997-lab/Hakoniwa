#!/usr/bin/env python3
"""ヌシ様のあしあと（nushiprint、つま先が上）を、ドットのまま90度ずつまわして、右・下・左向きのチップを作る（nushiprint~r・~d・~l）。
足あとの中心（マスの中の場所）は、上向きと同じ。芽・葉（緑のドットのかたまり）は、まわさずに上向きのまま、まわした場所へ置きなおす
（芽のあとは、まわりの足あとの色でうめる）。もとの絵をかえたら、これをもう1回動かす。
  python3 tools/art/fog/print_dirs.py"""
import os, sys, colorsys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
from PIL import Image
import chips as CH

def green(p):
    r, g, b, a = p
    if a < 40: return False
    h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    return .13 < h < .40 and s > .25

def split(im):
    """芽のかたまり（8方向でつながる緑）と、芽をぬいて、まわりの色でうめた足あと"""
    w, h = im.size; px = im.load(); G = {(x, y) for y in range(h) for x in range(w) if green(px[x, y])}
    cl, seen = [], set()
    for p in sorted(G):
        if p in seen: continue
        st, c = [p], []; seen.add(p)
        while st:
            x, y = st.pop(); c.append((x, y))
            for dx in (-1, 0, 1):
                for dy in (-1, 0, 1):
                    q = (x + dx, y + dy)
                    if q in G and q not in seen: seen.add(q); st.append(q)
        cl.append(c)
    base = im.copy(); bp = base.load(); left = set(G)
    while left:  # 外がわから、まわりの足あとの色（緑でない・うすくない）の平均でうめる。まわりがほとんど透明なら透明
        nxt = set(); fill = {}
        for (x, y) in left:
            nb = [bp[x + dx, y + dy] for dx in (-1, 0, 1) for dy in (-1, 0, 1) if (dx or dy) and 0 <= x + dx < w and 0 <= y + dy < h and (x + dx, y + dy) not in left]
            if not nb: nxt.add((x, y)); continue
            op = [q for q in nb if q[3] >= 200]
            if len(op) * 2 < len(nb): fill[(x, y)] = (0, 0, 0, 0)
            else: fill[(x, y)] = tuple(round(sum(q[i] for q in op) / len(op)) for i in range(3)) + (255,)
        if not fill: break
        for k, v in fill.items(): bp[k] = v
        left = nxt
    return base, [(c, {p: px[p] for p in c}) for c in cl]

head, C = CH.load_imgs()
b = C['nushiprint']; im = b['f'][0]; w, h = im.size; cx, cy = b['ax'] + w / 2, b['ay'] + h / 2
base, cl = split(im)
ROT = {'r': (Image.Transpose.ROTATE_270, lambda x, y: (h - 1 - y, x)), 'd': (Image.Transpose.ROTATE_180, lambda x, y: (w - 1 - x, h - 1 - y)), 'l': (Image.Transpose.ROTATE_90, lambda x, y: (y, w - 1 - x))}
for k, (t, mp) in ROT.items():
    r = base.transpose(t); W2, H2 = r.size; rp = r.load()
    for c, cols in cl:
        mx = sum(p[0] for p in c) / len(c); my = sum(p[1] for p in c) / len(c); nx, ny = mp(mx, my)
        ox, oy = round(nx - mx), round(ny - my)
        x0, x1 = min(p[0] for p in c) + ox, max(p[0] for p in c) + ox; y0, y1 = min(p[1] for p in c) + oy, max(p[1] for p in c) + oy
        ox -= min(0, x0) + max(0, x1 - (W2 - 1)); oy -= min(0, y0) + max(0, y1 - (H2 - 1))  # 絵の外へ出ないように
        for (x, y), v in cols.items(): rp[x + ox, y + oy] = v
    C['nushiprint~' + k] = {'ax': round(cx - W2 / 2), 'ay': round(cy - H2 / 2), 'w': W2, 'h': H2, 'g': b.get('g', 64), 'f': [r]}
CH.pack_imgs(head, C)
print('ok')
