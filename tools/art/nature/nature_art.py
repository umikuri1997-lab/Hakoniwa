#!/usr/bin/env python3
"""草原の木（tree・ntree・fruit）・枯れ木（deadtree）・岩（rock）のチップを、もらったドット絵から作る。
もらった絵は1マス約43ドットの細かさなので、いまのチップと同じ大きさ（1マス64ドット）へ1.5倍にする。
・色は、もらった絵の色だけを使う（平均でまぜない。ドット絵の色数のまま）。
・1.5倍のならび（ドットを1つおきに2つにする）で、外の輪郭が2ドットになった所は、内がわの色にもどして1ドットにする。
・のこったくずれは FIX で1ドットずつなおす。
  python3 tools/art/nature/nature_art.py <出力フォルダ>   → <id>.png と、もとの絵との見くらべ <id>_cmp.png"""
import os, sys
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
IDS = ('tree', 'deadtree', 'rock')

def up15(a):
    """1.5倍：出力のドットのまん中が入る、もとのドットの色"""
    h, w = a.shape[:2]; oh, ow = (h * 3 + 1) // 2, (w * 3 + 1) // 2
    ys = np.minimum(((np.arange(oh) + .5) / 1.5).astype(int), h - 1); xs = np.minimum(((np.arange(ow) + .5) / 1.5).astype(int), w - 1)
    return a[ys][:, xs].copy(), ys, xs

def edge(m):
    """透明ととなりあう、不透明なドット"""
    p = np.pad(m, 1); return m & ~(p[:-2, 1:-1] & p[2:, 1:-1] & p[1:-1, :-2] & p[1:-1, 2:])

def make(k):
    a = np.array(Image.open(os.path.join(HERE, k + '.png')).convert('RGBA'))
    x0, y0, x1, y1 = Image.fromarray(a).getbbox(); a = a[y0:y1, x0:x1]   # 透明なまわりを切る
    E = edge(a[..., 3] > 0)                      # もらった絵の外の輪郭
    o, ys, xs = up15(a); Eo = E[ys][:, xs]; m = o[..., 3] > 0
    thin = Eo & m & ~edge(m)                      # 輪郭の色なのに、外に面していない（2ドットめ）
    r = o.copy()
    for y, x in zip(*np.where(thin)):
        sy, sx = ys[y], xs[x]                     # もらった絵で、そのドットのとなりの、輪郭でない色
        cs = [a[sy + dy, sx + dx] for dy, dx in ((0, 1), (0, -1), (1, 0), (-1, 0)) if 0 <= sy + dy < a.shape[0] and 0 <= sx + dx < a.shape[1] and a[sy + dy, sx + dx, 3] and not E[sy + dy, sx + dx]]
        if cs:  # 出力でとなりにある色を先に
            near = [tuple(r[y + dy, x + dx]) for dy, dx in ((0, 1), (0, -1), (1, 0), (-1, 0)) if 0 <= y + dy < r.shape[0] and 0 <= x + dx < r.shape[1] and r[y + dy, x + dx, 3] and not Eo[y + dy, x + dx]]
            pick = next((c for c in cs if tuple(c) in near), cs[0]); r[y, x] = pick
    if k in FIX: FIX[k](r)
    return Image.fromarray(r, 'RGBA')

FIX = {}

def compare(k, im, z=6):
    s = Image.open(os.path.join(HERE, k + '.png')).convert('RGBA'); s = s.crop(s.getbbox())
    s = s.resize((s.width * z * 3 // 2, s.height * z * 3 // 2), Image.NEAREST); b = im.resize((im.width * z, im.height * z), Image.NEAREST)
    sh = Image.new('RGBA', (s.width + b.width + 24, max(s.height, b.height) + 16), (236, 236, 236, 255)); sh.alpha_composite(s, (8, 8)); sh.alpha_composite(b, (s.width + 16, 8)); return sh

if __name__ == '__main__':
    d = sys.argv[1]; os.makedirs(d, exist_ok=True)
    for k in IDS:
        im = make(k); im.save(os.path.join(d, k + '.png')); compare(k, im).save(os.path.join(d, k + '_cmp.png'))
        print(k, im.size, len({tuple(p) for p in np.array(im).reshape(-1, 4) if p[3]}))
