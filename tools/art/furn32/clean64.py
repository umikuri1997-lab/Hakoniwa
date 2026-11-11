#!/usr/bin/env python3
"""家具を、元の絵（1マス64ドットのチップ、src/）の形・デザインのまま、ドットを1つずつそのまま使って整える（形はかえない）。
  1. 材料（木・金：色あいでわける）ごとに、元の絵の色から少ない色の表を作り、どのドットも、そのいちばん近い色に（元の明るさ・かげのまま）
  2. ばらばらの1ドットだけ、まわりの色に（線・すじはのこす）
  3. 元の輪郭（まわりの透明にふれる所）を、うすい線の色に：光のがわ（上・左）1ドット、かげのがわ（下・右）2ドット。元の絵の中のこい線（部品のさかい）も、同じ線の色に
  python3 tools/art/furn32/clean64.py <出力フォルダ> [id ...] / --put"""
import os, sys, json, re
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE); sys.path.insert(0, os.path.join(HERE, '..', '..'))
SRC = os.path.join(HERE, 'src')
ITEMS = {'chair': (['wood'], {'wood': 8}), 'table': (['wood'], {'wood': 7}), 'taru': (['barrel', 'metal'], {'barrel': 8, 'metal': 5})}   # 材料と、材料ごとの色の数
def fname(k): return re.sub(r'[^0-9A-Za-z_.-]', lambda q: '_%02x' % ord(q.group()), k)

def lum(c): return np.asarray(c) @ np.array([.3, .59, .11])

def kmeans(X, k, it=25):
    L = lum(X); c = X[np.argsort(L)[np.linspace(0, len(X) - 1, k).astype(int)]].astype(float)
    for _ in range(it):
        l = ((X[:, None] - c[None]) ** 2).sum(2).argmin(1)
        for j in range(k):
            if (l == j).any(): c[j] = X[l == j].mean(0)
    return c[np.argsort(lum(c))[::-1]]   # 明るい順

def clean(im, mats, ks):
    a = np.asarray(im.convert('RGBA')).astype(float); H, W = a.shape[:2]; m = a[..., 3] > 110
    rgb = a[..., :3]; sat = rgb.max(-1) - rgb.min(-1)
    mat = np.full((H, W), mats[0], object)
    if len(mats) > 1: mat[(sat < 40) & m] = mats[1]   # 灰色は金
    pals = {}; lab = np.full((H, W), -1)
    for M_ in mats:
        sel = m & (mat == M_)
        if not sel.any(): continue
        pals[M_] = kmeans(rgb[sel], ks[M_]); lab[sel] = ((rgb[sel][:, None] - pals[M_][None]) ** 2).sum(2).argmin(1)
    # ばらばらの1ドット：まわり8つに同じ色がなく、5つ以上が同じ色なら、その色に（線・すじはのこる）
    for _ in range(2):
        r = lab.copy()
        for y in range(H):
            for x in range(W):
                if not m[y, x]: continue
                n = [lab[y + dy, x + dx] for dy in (-1, 0, 1) for dx in (-1, 0, 1) if (dy or dx) and 0 <= y + dy < H and 0 <= x + dx < W and m[y + dy, x + dx] and mat[y + dy, x + dx] == mat[y, x]]
                if lab[y, x] in n or len(n) < 6: continue
                v, c = np.unique(n, return_counts=True)
                if c.max() >= 5: r[y, x] = v[c.argmax()]
        lab = r
    from scipy.ndimage import binary_fill_holes
    out_t = ~binary_fill_holes(m); p = np.pad(out_t, 1, constant_values=True); q = np.pad(out_t, 2, constant_values=True)
    r1 = m & (p[:-2, 1:-1] | p[2:, 1:-1] | p[1:-1, :-2] | p[1:-1, 2:]); r2 = m & ~r1 & (q[4:, 2:-2] | q[2:-2, 4:])
    o = np.zeros((H, W, 4), np.uint8)
    for y in range(H):
        for x in range(W):
            if not m[y, x]: continue
            P = pals[mat[y, x]]; j = lab[y, x]; k = len(P)
            line = P[k - 2] * .5 + P[k - 1] * .5   # 線の色：元のいちばんこい色より、うすく（かげのつぎ）
            # 輪郭（光のがわ1・かげのがわ2ドット）と、元のこい線（いちばんこい色）は、線の色
            c = line if (r1[y, x] or r2[y, x] or j == k - 1) else P[j]
            o[y, x, :3] = np.round(c); o[y, x, 3] = 255
    return Image.fromarray(o, 'RGBA')

def build(b):
    meta = json.load(open(os.path.join(SRC, 'meta.json'))); out = {}
    for k in [k for k in meta if re.split(r'[#>:@~.]', k)[0] == b]:
        im = Image.open(os.path.join(SRC, fname(k) + '.png')); r = clean(im, *ITEMS[b]); bb = r.getbbox()
        out[k] = {'f': [r.crop(bb)], 'ax': round(meta[k]['ax']) + bb[0], 'ay': round(meta[k]['ay']) + bb[1]}
    return out

if __name__ == '__main__':
    a = sys.argv[1:]; put = a and a[0] == '--put'
    if put: a = a[1:]
    d = a[0]; ids = a[1:] or list(ITEMS); os.makedirs(d, exist_ok=True)
    if put:
        import chips
        h, C = chips.load_imgs()
    for b in ids:
        for k, v in build(b).items():
            v['f'][0].save(os.path.join(d, fname(k) + '.png'))
            if put: C[k] = {'ax': v['ax'], 'ay': v['ay'], 'w': v['f'][0].width, 'h': v['f'][0].height, 'g': 64, 'f': v['f']}
            print(k, v['f'][0].size, v['ax'], v['ay'])
    if put: chips.pack_imgs(h, C)
