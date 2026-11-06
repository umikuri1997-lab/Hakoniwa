#!/usr/bin/env python3
"""霧の中で見つける物（fogbox・nushiprint・fogspring）の絵を、もらった絵 fog3.png から作る。
縮小は、マス（セル）ごとの色の平均（不透明な所だけ。2つの色にまたがるセルは多いほうの平均。透過は半分より多いか）。
そのあと、外の輪郭を1ドットにそろえ、こわれた形を FIX でなおす。
  python3 tools/art/fog/fog_art.py <出力フォルダ>   → <id>.png を書く"""
import sys, os
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
SC = 0.13  # 3つとも同じ倍率（1マス64ドット）
BOXES = {'fogbox': (219, 269, 553, 567), 'nushiprint': (875, 239, 1257, 577), 'fogspring': (1535, 231, 1992, 600)}

def major(p):
    """セルの色の平均。セルに2つの色の所がまたがるときは、多いほうの所だけの平均（さかい目でまざって、にじまない）"""
    if len(p) < 4: return p.mean(0)
    l = p @ (.3, .59, .11); c0, c1 = p[l.argmin()], p[l.argmax()]
    for _ in range(6):
        k = ((p - c0) ** 2).sum(1) > ((p - c1) ** 2).sum(1)
        if k.all() or (~k).all(): return p.mean(0)
        c0, c1 = p[~k].mean(0), p[k].mean(0)
    if ((c0 - c1) ** 2).sum() < 900: return p.mean(0)
    return c1 if k.sum() * 2 > len(p) else c0

def shrink(src, box):
    b = np.asarray(src.crop(box)).astype(float)
    H, W = b.shape[:2]; w, h = round(W * SC), round(H * SC)
    out = np.zeros((h, w, 4))
    xs = np.linspace(0, W, w + 1); ys = np.linspace(0, H, h + 1)
    for j in range(h):
        for i in range(w):
            c = b[int(ys[j]):max(int(ys[j]) + 1, int(ys[j + 1])), int(xs[i]):max(int(xs[i]) + 1, int(xs[i + 1]))].reshape(-1, 4)
            a = c[:, 3] / 255
            if a.mean() < .5: continue
            p = c[a > .5, :3]
            out[j, i, :3] = major(p); out[j, i, 3] = 255
    return out

def outline(o, src, box):
    """外の輪郭：透明ととなりあうドットを1ドットの輪郭にする。色は、そのセルの中の、もらった絵の輪郭の所（透明から4ドット以内）の色の平均"""
    from scipy.ndimage import binary_erosion
    b = np.asarray(src.crop(box)).astype(float); H, W = b.shape[:2]
    m0 = b[..., 3] > 128; rim = m0 & ~binary_erosion(m0, iterations=4)
    m = o[..., 3] > 0; h, w = m.shape; r = o.copy()
    xs = np.linspace(0, W, w + 1); ys = np.linspace(0, H, h + 1)
    for y in range(h):
        for x in range(w):
            if not m[y, x]: continue
            if all(0 <= y + dy < h and 0 <= x + dx < w and m[y + dy, x + dx] for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))): continue
            y0, x0 = int(ys[y]) - 2, int(xs[x]) - 2; y1, x1 = int(ys[y + 1]) + 2, int(xs[x + 1]) + 2
            y0, x0 = max(0, y0), max(0, x0)
            sel = rim[y0:y1, x0:x1]
            if sel.any(): r[y, x, :3] = b[y0:y1, x0:x1, :3][sel].mean(0)
    return r

def lines(o, src, box, th=16, fr=.2):
    """中の線（石と石のさかい・ふたのさかい・ひづめの割れ目など）：もらった絵で、まわりより こい細い線のドットを見つけ、
    セルの中にその線が fr より多くあれば、線の色の1ドットにする。線は細めて1ドットにする"""
    from scipy.ndimage import gaussian_filter
    b = np.asarray(src.crop(box)).astype(float); H, W = b.shape[:2]
    L = b[..., :3] @ (.3, .59, .11); m0 = b[..., 3] > 128
    Lb = gaussian_filter(np.where(m0, L, L[m0].mean()), 5)
    ln = m0 & (L < Lb - th)
    h, w = o.shape[:2]; xs = np.linspace(0, W, w + 1); ys = np.linspace(0, H, h + 1)
    fm = np.zeros((h, w), bool); F = np.zeros((h, w)); col = np.zeros((h, w, 3))
    for y in range(h):
        for x in range(w):
            if o[y, x, 3] == 0: continue
            c = ln[int(ys[y]):int(ys[y + 1]), int(xs[x]):int(xs[x + 1])]
            if c.size: F[y, x] = c.mean()
            if c.size and c.mean() >= fr:
                fm[y, x] = True; col[y, x] = b[int(ys[y]):int(ys[y + 1]), int(xs[x]):int(xs[x + 1]), :3][c].mean(0)
    P = np.pad(F, 1)  # 細める：線にそって、となりより線が多い所（尾根）だけのこす
    sk = fm & (((F >= P[1:-1, :-2]) & (F > P[1:-1, 2:])) | ((F >= P[:-2, 1:-1]) & (F > P[2:, 1:-1])))
    r = o.copy(); r[sk, :3] = col[sk]
    return r

def run(dst):
    src = Image.open(os.path.join(HERE, 'fog3.png')).convert('RGBA')
    for k, bx in BOXES.items():
        o = outline(lines(shrink(src, bx), src, bx, *LN.get(k, ())), src, bx)
        if k in FIX: FIX[k](o)
        im = Image.fromarray(o.round().astype(np.uint8), 'RGBA'); im = im.crop(im.getbbox())
        im.save(os.path.join(dst, k + '.png')); print(k, im.size)

LN = {'fogspring': (8, .15)}  # 中の線を見つける強さ（こさ・セルの中の線の多さ）
def fix_box(o):
    """錠前：平均で、かぎ穴が十字になる → 丸い金の板と、丸い頭・下の細い かぎ穴にかきなおす"""
    rim, gold, hi, hole = (156, 106, 53), (220, 170, 92), (240, 207, 134), (74, 46, 30)
    cx, cy, R = 21, 26.5, 3.6
    for y in range(22, 32):
        for x in range(17, 26):
            d = ((x - cx) ** 2 + (y - cy) ** 2) ** .5
            if d <= R: o[y, x, :3] = rim if d > R - 1 else gold
    for x, y in ((19, 24), (20, 24), (19, 25)): o[y, x, :3] = hi
    for x, y in ((20, 25), (21, 25), (22, 25), (20, 26), (21, 26), (22, 26), (21, 27), (21, 28)): o[y, x, :3] = hole
    for x, y in ((20, 25), (22, 25)): o[y, x, :3] = (120, 82, 48)  # 頭の角を丸く

def fix_print(o):
    """ひづめの割れ目：平均でうすれて切れる → ふちの色の1ドットの線で、上のくぼみから下へつなぐ"""
    line = (222, 190, 158)
    for y in range(20, 31): o[y, 14, :3] = line
    for y in range(4, 14): o[y, 36, :3] = line

FIX = {'fogbox': fix_box, 'nushiprint': fix_print}  # 形がくずれた所の手なおし（座標は出来上がりの絵のドット）
if __name__ == '__main__': run(sys.argv[1] if len(sys.argv) > 1 else '.')
