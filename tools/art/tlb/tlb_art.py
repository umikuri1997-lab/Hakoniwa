#!/usr/bin/env python3
"""調理台・ハシゴ（オーク・竹、正面とよこ）・橋（よこ・たて、はし・まん中・1マス）のチップを、もらった絵 table-ladder-bridge.png から作る。
もらった絵は、うしろが透明でなく（市松もようと灰色のかげが絵にやきついている）、橋の部品のあいだに白い区切り線がある：
  あざやかさ（最大−最小）が45以上の所を物とし、物にかこまれた小さい穴・暗い穴（くぎ・包丁の刃）はうめる。区切り線の行・列は、とばしてつなぐ。
  python3 tools/art/tlb/tlb_art.py <出力フォルダ>"""
import sys, os
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, 'table-ladder-bridge.png')
SRC2 = os.path.join(HERE, 'table-ladder-bridge-v2.png')  # なおしてもらった絵（半分の大きさ）。よこの橋だけ、こちらを使う

def clean(path=SRC, xc=330):
    from scipy.ndimage import label, binary_fill_holes, find_objects, binary_opening
    im = Image.open(path).convert('RGBA'); bg = Image.new('RGBA', im.size, (242, 242, 242, 255)); bg.alpha_composite(im)  # v2 は、うしろが半分透明
    a = np.asarray(bg.convert('RGB')).astype(int)
    s = a.max(2) - a.min(2); L = a.mean(2)
    # 白いかげ（とても明るい所）は物にしない
    m = binary_opening((s >= 45) & (a.min(2) <= 225) & (a[..., 0] >= a[..., 2]), iterations=1)
    lab, _ = label(m); keep = np.zeros_like(m)
    for i, sl in enumerate(find_objects(lab)):
        if (lab[sl] == i + 1).sum() > 300: keep |= lab == i + 1
    hl, _ = label(binary_fill_holes(keep) & ~keep)
    for i, sl in enumerate(find_objects(hl)):
        h = hl == i + 1
        x0 = sl[1].start
        if h.sum() < 60 or L[h].mean() < 200 or x0 < xc: keep |= h  # 調理台（左はし）の穴（包丁の刃）はぜんぶうめる
    return np.dstack([a, keep * 255]).astype(np.uint8)

def cat(A, parts, axis):
    """もらった絵の帯（x0,x1 か y0,y1）をつなぐ（区切り線をとばす）。よこ（axis=1）は y 594〜911、たては x 1200〜1469"""
    if axis == 1: return np.concatenate([A[295:458, a:b] for a, b in parts], 1)  # v2
    return np.concatenate([A[a:b, 1200:1470] for a, b in parts], 0)

def pieces(A, B):
    A2 = A; H = 64 / 149; V = 64 / 227  # まん中の部品（板のさかいからさかいまで）が、ちょうど1マス
    return {
        'cooktable': (A2[186:474, 73:320], {'w': 64}),
        'ladder_wood:front': (A2[164:471, 406:557], {'h': 58}),
        'ladder_bamboo:front': (A2[164:471, 792:956], {'h': 58}),
        'ladder_wood:side': (A2[164:471, 640:689], {'h': 32}),
        'ladder_bamboo:side': (A2[164:471, 1043:1096], {'h': 32}),
        'bridge:hS': (cat(B, [(50, 218), (223, 224)], 1), {'sc': H}),
        'bridge:hM': (cat(B, [(224, 373)], 1), {'w': 64}),
        'bridge:hE': (cat(B, [(373, 375), (380, 548)], 1), {'sc': H}),
        'bridge:h1': (cat(B, [(50, 134), (463, 548)], 1), {'sc': H}),
        'bridge:vS': (cat(A2, [(109, 394), (399, 406)], 0), {'sc': V}),
        'bridge:vM': (cat(A2, [(406, 633)], 0), {'h': 64}),
        'bridge:vE': (cat(A2, [(633, 643), (648, 935)], 0), {'sc': V}),
        'bridge:v1': (cat(A2, [(109, 274), (743, 935)], 0), {'sc': V}),
    }
FIX = {}
def seam_h(D):
    """よこの橋：もらった部品は、手すりの明るさが左右で少しちがう（つなぐと手すりに線が出る）。
    まん中の部品の手すりの行を、左はしと右はしが同じ色になるように、ゆるやかにならし、はしの部品のつなぐ列を、それに合わせる"""
    M = np.asarray(D['bridge:hM']).astype(float).copy(); w = M.shape[1]; S = np.asarray(D['bridge:hS']).astype(float).copy(); E = np.asarray(D['bridge:hE']).astype(float).copy()
    for y in range(M.shape[0]):
        if 17 <= y < 52 or not (M[y, 0, 3] and M[y, -1, 3]): continue
        d = M[y, -1, :3] - M[y, 0, :3]
        if np.abs(d).max() > 40: continue
        M[y, :, :3] -= d * (np.arange(w)[:, None] / (w - 1) - .5)
        if S[y, -1, 3]: S[y, -1, :3] = M[y, 0, :3]
        if E[y, 0, 3]: E[y, 0, :3] = M[y, -1, :3]
    for k, v in (('bridge:hM', M), ('bridge:hS', S), ('bridge:hE', E)): D[k].paste(Image.fromarray(v.clip(0, 255).round().astype(np.uint8), 'RGBA'))
CUT = {'bridge:hS': 'R', 'bridge:hM': 'LR', 'bridge:hE': 'L', 'bridge:vS': 'D', 'bridge:vM': 'UD', 'bridge:vE': 'U'}  # 切った辺（つなぐ所）
def make(pd, src, o, cut, fix):
    """pixdown.make と同じ。ただし切った辺（となりの部品につづく所）は、外の輪郭の色にしない（つなぎ目に線が出ないように）。かこみで切りとらない"""
    b = np.asarray(src).astype(float); H, W = b.shape[:2]
    sc = o.get('sc') or (o['w'] / W if o.get('w') else o['h'] / H)
    ow, oh = max(1, round(W * sc)), max(1, round(H * sc))
    r0 = pd.lines(pd.shrink(b, ow, oh), b); r = pd.outline(r0, b)
    # もらった部品は、ふちにも輪郭がある：手すりの所は、となりの列（行）でうめる（板のさかいの線はのこす）
    hz = 'L' in cut or 'R' in cut; keep = slice(17, 52) if hz else slice(14, 62)
    for side, i, n in (('L', 0, 1), ('R', -1, -2), ('U', 0, 1), ('D', -1, -2)):
        if side not in cut: continue
        if hz: col = r0[:, n].copy(); col[keep] = r0[keep, i]; r[:, i] = col
        else: row = r0[n].copy(); row[keep] = r0[i, keep]; r[i] = row
    if fix: fix(r)
    return Image.fromarray(r.round().astype(np.uint8), 'RGBA')
def build(dst):
    sys.path.insert(0, os.path.dirname(HERE)); import pixdown
    os.makedirs(dst, exist_ok=True); A = clean(); B = clean(SRC2, 0); out = {}
    Image.fromarray(A).save(os.path.join(dst, '_clean.png'))
    P = pieces(A, B); R = {}
    for k, (arr, o) in P.items():
        src = Image.fromarray(np.ascontiguousarray(arr)); R[k] = (src, make(pixdown, src, o, CUT.get(k, ''), FIX.get(k)))
    seam_h({k: R[k][1] for k in ('bridge:hS', 'bridge:hM', 'bridge:hE')})
    for k, (src, im) in R.items():
        box = (0, 0, src.width, src.height)
        n = k.replace(':', '_'); im.save(os.path.join(dst, n + '.png')); pixdown.compare(src, box, im).save(os.path.join(dst, n + '_cmp.png'))
        out[k] = im; print(k, im.size)
    return out
if __name__ == '__main__': build(sys.argv[1] if len(sys.argv) > 1 else '.')
