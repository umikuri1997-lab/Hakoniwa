#!/usr/bin/env python3
"""ふきだしの絵（30こ）を、もらったドット絵 icons.png（6列×5行）から 32×32 にとりだし、1まいの WebP（6列×6行、192×192。6行めは顔5こ）にする。
もらった絵は、ドット絵をなめらかに大きくした絵（1ドット約1.45ピクセル、きっちりの整数倍ではない）なので：
- マスごとに、1ドット S ピクセルの格子をあて、ドットごとに、いちばん多い色（色はアイコンごとにまとめた色の表から）をとる。
  うすさは、あり・なしだけ（格子の中の平均が ATH 以上ならあり）。
- 輪郭は1ドット：外がわのドットで、ぬり色のままの所は、近くの輪郭の色に。2ドットになった輪郭は、内がわを中の色に、
  外がわにはみ出した輪郭のドットはけす（ぬり色が外に出ないときだけ）。
- 32×32 のまん中に置き、下のはしは 30 にそろえる（ひくい絵（高さ 20 より下）は、上下もまん中）。
使い方：python3 tools/art/bubble/build.py <出力フォルダ>   出力：bubble.png（確認用）・bubble.webp"""
import sys, os, hashlib, numpy as np
from collections import deque
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
NAMES = 'spark box fire drops coffee basket hammer drop heart clap wave note sprout pick spring axe dizzy zzz gheart fish lantern firework gift pan chestnut notes house rice dots q'.split()
S, ATH, DARK = 1.45, 100, .78
N4 = ((1, 0), (-1, 0), (0, 1), (0, -1))
N8 = [(a, b) for a in (-1, 0, 1) for b in (-1, 0, 1) if a or b]

def lum(c): return .299 * c[0] + .587 * c[1] + .114 * c[2]

def cells():
    a = np.array(Image.open(os.path.join(HERE, 'icons.png')).convert('RGBA')).astype(float); H, W = a.shape[:2]
    for i in range(30):
        cx, cy = i % 6, i // 6
        c = a[int(cy * H / 5):int((cy + 1) * H / 5), int(cx * W / 6):int((cx + 1) * W / 6)]
        ys, xs = np.where(c[..., 3] > 100); yield c[ys.min():ys.max() + 1, xs.min():xs.max() + 1]

def kmeans(X, k, it=20):
    C = X[np.random.default_rng(0).choice(len(X), k, replace=False)]
    for _ in range(it):
        l = ((X[:, None] - C[None]) ** 2).sum(2).argmin(1)
        for j in range(k):
            if (l == j).any(): C[j] = X[l == j].mean(0)
    return C

def merge(C, th=22):  # 近い色はひとつに
    C = [c.copy() for c in C]
    while True:
        best = None
        for i in range(len(C)):
            for j in range(i + 1, len(C)):
                d = ((C[i] - C[j]) ** 2).sum() ** .5
                if d < th and (best is None or d < best[0]): best = (d, i, j)
        if not best: return np.array(C)
        _, i, j = best; C[i] = (C[i] + C[j]) / 2; C.pop(j)

def resample(c):
    h, w = c.shape[:2]; nw, nh = int(np.ceil(w / S)), int(np.ceil(h / S)); ox, oy = (nw * S - w) / 2, (nh * S - h) / 2
    X = c[c[..., 3] > 128][:, :3]; C = merge(kmeans(X.copy(), min(14, len(np.unique(X.astype(int), axis=0))))); k = len(C)
    lab = ((c[..., None, :3] - C[None, None]) ** 2).sum(3).argmin(2)
    gx, gy = np.floor((np.arange(w) + .5 + ox) / S), np.floor((np.arange(h) + .5 + oy) / S)
    out = np.zeros((nh, nw, 4), np.uint8)
    for Y in range(nh):
        for Xd in range(nw):
            ys, xs = np.where(gy == Y)[0], np.where(gx == Xd)[0]
            if not len(ys) or not len(xs): continue
            al = c[np.ix_(ys, xs)][..., 3]
            if al.mean() < ATH: continue
            v = np.bincount(lab[np.ix_(ys, xs)][al > 128], minlength=k)
            out[Y, Xd, :3] = C[v.argmax()].round(); out[Y, Xd, 3] = 255
    return out

def darkmask(o):
    op = o[..., 3] > 0; L = np.array([[lum(p) for p in row] for row in o.astype(float)]); return op, op & (L < np.median(L[op]) * DARK)

def outline(o):
    o = np.pad(o, ((1, 1), (1, 1), (0, 0))); h, w = o.shape[:2]; op, dark = darkmask(o)
    bnd = np.zeros_like(op)
    for y in range(h):
        for x in range(w):
            if op[y, x] and any(not op[y + dy, x + dx] for dx, dy in N4): bnd[y, x] = True
    inter = op & ~bnd; added = np.zeros_like(op)
    for y in range(h):  # 外がわのドットがぬり色なら、近くの輪郭の色に（細い線はそのまま）
        for x in range(w):
            if bnd[y, x] and not dark[y, x] and inter[max(0, y - 1):y + 2, max(0, x - 1):x + 2].any():
                for r in (1, 2, 3):
                    ys, xs = np.where(dark[max(0, y - r):y + r + 1, max(0, x - r):x + r + 1])
                    if len(ys):
                        cols = [tuple(o[max(0, y - r) + a, max(0, x - r) + b, :3]) for a, b in zip(ys, xs)]
                        o[y, x, :3] = max(set(cols), key=cols.count); added[y, x] = True; break
    dark |= added
    for y in range(1, h - 1):  # 2ドットの輪郭の内がわ → 中の色
        for x in range(1, w - 1):
            if dark[y, x] and not bnd[y, x]:
                for dx, dy in N4:
                    a, b = (y + dy, x + dx), (y - dy, x - dx)
                    if bnd[a] and dark[a] and op[b] and not dark[b]: o[y, x, :3] = o[b][:3]; break
    return o[1:-1, 1:-1]

def peel(o):  # 外にはみ出した輪郭のドット（まわりが輪郭だけ）をけす
    o = np.pad(o, ((1, 1), (1, 1), (0, 0))); h, w = o.shape[:2]; op, dark = darkmask(o); ch = True
    while ch:
        ch = False
        for y in range(1, h - 1):
            for x in range(1, w - 1):
                if not dark[y, x]: continue
                nb = [(dy, dx) for dy, dx in N4 if op[y + dy, x + dx]]
                if len(nb) != 3 or any(not dark[y + dy, x + dx] for dy, dx in nb): continue
                if not any(op[y + dy + a, x + dx + b] and not dark[y + dy + a, x + dx + b] for dy, dx in nb for a, b in N4): continue
                d8 = [(a, b) for a, b in N8 if dark[y + a, x + b]]; seen = {d8[0]}; st = [d8[0]]
                while st:
                    a, b = st.pop()
                    for c, d in d8:
                        if (c, d) not in seen and abs(c - a) <= 1 and abs(d - b) <= 1: seen.add((c, d)); st.append((c, d))
                if len(seen) < len(d8): continue
                o[y, x] = 0; op[y, x] = dark[y, x] = False; ch = True
    return o[1:-1, 1:-1]

def tile(c):
    o = peel(outline(resample(c))); ys, xs = np.where(o[..., 3] > 0); o = o[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    h, w = o.shape[:2]; assert w <= 32 and h <= 32, (w, h)
    t = np.zeros((32, 32, 4), np.uint8); x0 = (32 - w) // 2; y0 = 31 - h if h >= 20 else (32 - h) // 2
    y0 = max(0, min(y0, 32 - h)); t[y0:y0 + h, x0:x0 + w] = o; return t

def main():
    out = Image.new('RGBA', (192, 192), (0, 0, 0, 0))
    for i, c in enumerate(cells()): out.alpha_composite(Image.fromarray(tile(c), 'RGBA'), (i % 6 * 32, i // 6 * 32))
    # 6行め：顔（もらった絵からとりだしたドット。tools/art/faces/build.py）
    sys.path.insert(0, os.path.join(HERE, '..', 'faces'))
    import build as faces
    for i, t in enumerate(faces.tiles()): out.alpha_composite(Image.fromarray(t, 'RGBA'), (i * 32, 160))
    d = sys.argv[1] if len(sys.argv) > 1 else '.'; os.makedirs(d, exist_ok=True)
    out.save(os.path.join(d, 'bubble.png'))
    out.save(os.path.join(d, 'bubble.webp'), lossless=True, exact=True, method=4)
    print(hashlib.sha1(open(os.path.join(d, 'bubble.webp'), 'rb').read()).hexdigest()[:10])

main()
