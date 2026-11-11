#!/usr/bin/env python3
"""草原の木（tree・ntree・fruit）・枯れ木（deadtree）・岩（rock）のチップを、前のゲームの絵（なめらかな絵 ART.tree・dead・rock、assets/g）から作る。
1マス32ドット・前のチップと同じ大きさのドット絵にする：
  1. pixdown の shrink で、セルの色の多いほうでちぢめる
  2. 色を少なくする（物ごとに K 色。ドット絵スキル「少ない色からつくる」）
  3. ばらばらの1ドット（まわりとちがう色の点・とびだした点・小さな穴）をなくす
  4. 外の輪郭を1ドット：その色より少しだけ暗い色（黒にしない）
  5. のこったくずれは FIX で1ドットずつなおす
  python3 tools/art/nature/nature_art.py <出力フォルダ>   → <id>.png と、見くらべ <id>_cmp.png
（同じフォルダの tree.png・deadtree.png・rock.png は、前にもらったドット絵。いまのチップには使っていない）"""
import os, sys
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, os.path.join(HERE, '..'))
import pixdown as P
G = os.path.join(HERE, '..', '..', '..', 'assets', 'g')
OBJS = {  # 元の絵・はば（前のチップと同じ）・色の数・round：丸い物の形をならすぼかし
    'tree': {'src': '88a858c5e3.webp', 'w': 68, 'k': 9, 'round': .8},
    'deadtree': {'src': '8c9a3ef253.webp', 'w': 50, 'k': 6, 'thick': 1.8},   # 細い枝がとぎれないよう、うすい所も物に入れる
    'rock': {'src': '9c4f9195d8.webp', 'w': 32, 'k': 6, 'round': 1.3},
}
OUTK = (.85, .93)   # 輪郭は2ドット：外がわはその色×0.85、内がわは×0.93（うすく・やわらかく）

def kmeans(X, k, it=30):
    L = X @ (.3, .59, .11); c = X[np.argsort(L)[np.linspace(0, len(X) - 1, k).astype(int)]].astype(float)
    for _ in range(it):
        d = ((X[:, None] - c[None]) ** 2).sum(2); l = d.argmin(1)
        for j in range(k):
            if (l == j).any(): c[j] = X[l == j].mean(0)
    return c.round(), l

N4 = ((0, 1), (0, -1), (1, 0), (-1, 0)); N8 = N4 + ((1, 1), (1, -1), (-1, 1), (-1, -1))
def nb(a, y, x, ns):
    h, w = a.shape[:2]; return [(y + dy, x + dx) for dy, dx in ns if 0 <= y + dy < h and 0 <= x + dx < w]

def clean_shape(m):
    for _ in range(3):
        for y in range(m.shape[0]):
            for x in range(m.shape[1]):
                n = sum(m[q] for q in nb(m, y, x, N4))
                if m[y, x] and n == 0 and sum(m[q] for q in nb(m, y, x, N8)) <= 1: m[y, x] = False   # はなれた点（枝の先はのこす）
                elif not m[y, x] and n >= 3: m[y, x] = True   # 小さなへこみ・穴
    return m

def clean_color(lab, m):
    for _ in range(3):
        r = lab.copy()
        for y, x in zip(*np.where(m)):
            n4 = [lab[q] for q in nb(lab, y, x, N8) if m[q]]
            if lab[y, x] in n4: continue                       # 同じ色がまわりにある
            n8 = [lab[q] for q in nb(lab, y, x, N8) if m[q]]
            if n8: v, c = np.unique(n8, return_counts=True); r[y, x] = v[c.argmax()]   # ひとりぼっちの色の点
        lab = r
    return lab

def mode(lab, m, it=2):
    """色のさかいをなめらかに：まわり8つで、いちばん多い色が5つ以上なら、その色に（段のみだれ・ぎざぎざをへらす）"""
    for _ in range(it):
        r = lab.copy()
        for y, x in zip(*np.where(m)):
            n8 = [lab[q] for q in nb(lab, y, x, N8) if m[q]]
            if len(n8) < 8: continue                           # ふちはそのまま（形をかえない）
            v, c = np.unique(n8, return_counts=True)
            if c.max() >= 5 and v[c.argmax()] != lab[y, x]: r[y, x] = v[c.argmax()]
        lab = r
    return lab

def round_mask(b, ow, oh, sg):
    """丸い物の形：もとの絵のうすさを面積の平均でちぢめ、少しぼかしてから半分で切る（角がとがらず、段がそろった丸になる）"""
    from scipy.ndimage import gaussian_filter
    a = np.asarray(Image.fromarray(b[..., 3].astype(np.uint8)).resize((ow, oh), Image.BOX)).astype(float) / 255
    return gaussian_filter(a, sg) >= .5

def unspike(m):
    """丸い物：とがった1ドット（となりが1つだけ）と、ななめにとびだした角のドットをけす"""
    for _ in range(2):
        r = m.copy()
        for y, x in zip(*np.where(m)):
            n = [m[q] for q in nb(m, y, x, N4)]
            if sum(n) <= 1: r[y, x] = False
        m = r
    return m

def ring(m):
    p = np.pad(m, 1); return m & ~(p[:-2, 1:-1] & p[2:, 1:-1] & p[1:-1, :-2] & p[1:-1, 2:])

def make(k):
    c = OBJS[k]; src = Image.open(os.path.join(G, c['src'])).convert('RGBA'); b = np.asarray(src).astype(float)
    if c.get('thick'): b[..., 3] = np.minimum(255, b[..., 3] * c['thick'])
    H, W = b.shape[:2]; ow = c['w']; oh = round(H * ow / W)
    o = P.shrink(b, ow, oh); m = clean_shape(o[..., 3] > 0)
    if c.get('round'): m = unspike(clean_shape(round_mask(b, ow, oh, c['round'])))
    # 透明からうまった所は、となりの色
    for y, x in zip(*np.where(m & (o[..., 3] == 0))):
        q = [o[p][:3] for p in nb(o, y, x, N8) if o[p][3] > 0]; o[y, x, :3] = np.mean(q, 0) if q else 128; o[y, x, 3] = 255
    pal, l = kmeans(o[m][:, :3], c['k']); lab = np.full(m.shape, -1); lab[m] = l
    lab = mode(clean_color(lab, m), m)
    r = np.zeros((oh, ow, 4), np.uint8); r[m, :3] = pal[lab[m]]; r[m, 3] = 255
    e1 = ring(m); e2 = ring(m & ~e1)                           # 外の輪郭（1ドットめ・2ドットめ）
    r[e1, :3] = (pal[lab[e1]] * OUTK[0]).round(); r[e2, :3] = (pal[lab[e2]] * OUTK[1]).round()
    if k in FIX: FIX[k](r)
    im = Image.fromarray(r, 'RGBA'); return im.crop(im.getbbox()), src

FIX = {}

if __name__ == '__main__':
    d = sys.argv[1]; os.makedirs(d, exist_ok=True)
    for k in OBJS:
        im, src = make(k); im.save(os.path.join(d, k + '.png')); P.compare(src, (0, 0) + src.size, im, k=8).save(os.path.join(d, k + '_cmp.png'))
        print(k, im.size, len({tuple(p) for p in np.asarray(im).reshape(-1, 4) if p[3]}))
