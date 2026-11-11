#!/usr/bin/env python3
"""なめらかな絵・こまかい絵を、やわらかいドット絵にする（木・岩・家具で使う。CLAUDE.md「見た目」・スキル pixel-craft「やわらかいドット絵」）。
  1. pixdown の shrink で、セルの色の多いほうでちぢめる
  2. 形：round（ぼかしの強さ）があれば、うすさを面積の平均でちぢめてから少しぼかして半分で切り、とがった1ドットをけす（丸い物をとがらせない）
  ln があれば、もとの絵の中の細いこい線（板のすじ・すきま）を1ドットでのこし、4 のならしからはずす
  3. 色を少なくする（K 色。kmeans）→ ひとりぼっちの色の点をけす → 色のさかいのぎざぎざをならす（まわり8つで5つ以上の色に）
  4. 外の輪郭を2ドット：外がわはその色×0.85、内がわは×0.93（うすく・やわらかく）
コマのある絵は、ぜんぶのコマで同じ色の表（palette）を使う（コマどうしで色がゆれない）。
  使い方（python）：import softpix; im = softpix.make(src_rgba, w=68, k=9, rnd=.8)"""
import os, sys
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pixdown as P

OUTK = (.85, .93)
N4 = ((0, 1), (0, -1), (1, 0), (-1, 0)); N8 = N4 + ((1, 1), (1, -1), (-1, 1), (-1, -1))

def nb(a, y, x, ns):
    h, w = a.shape[:2]; return [(y + dy, x + dx) for dy, dx in ns if 0 <= y + dy < h and 0 <= x + dx < w]

def kmeans(X, k, it=30):
    L = X @ (.3, .59, .11); c = X[np.argsort(L)[np.linspace(0, len(X) - 1, k).astype(int)]].astype(float)
    for _ in range(it):
        d = ((X[:, None] - c[None]) ** 2).sum(2); l = d.argmin(1)
        for j in range(k):
            if (l == j).any(): c[j] = X[l == j].mean(0)
    return c.round()

def assign(X, pal): return ((X[:, None] - pal[None]) ** 2).sum(2).argmin(1)

def clean_shape(m):
    for _ in range(3):
        for y in range(m.shape[0]):
            for x in range(m.shape[1]):
                n = sum(m[q] for q in nb(m, y, x, N4))
                if m[y, x] and n == 0 and sum(m[q] for q in nb(m, y, x, N8)) <= 1: m[y, x] = False   # はなれた点（とがった先はのこす）
                elif not m[y, x] and n >= 3: m[y, x] = True   # 小さなへこみ・穴
    return m

def round_mask(b, ow, oh, sg):
    from scipy.ndimage import gaussian_filter
    a = np.asarray(Image.fromarray(b[..., 3].astype(np.uint8)).resize((ow, oh), Image.BOX)).astype(float) / 255
    return gaussian_filter(a, sg) >= .5

def unspike(m):
    for _ in range(2):
        r = m.copy()
        for y, x in zip(*np.where(m)):
            if sum(m[q] for q in nb(m, y, x, N4)) <= 1: r[y, x] = False
        m = r
    return m

def clean_color(lab, m, keep=None):
    for _ in range(3):
        r = lab.copy()
        for y, x in zip(*np.where(m)):
            if keep is not None and keep[y, x]: continue
            n8 = [lab[q] for q in nb(lab, y, x, N8) if m[q]]
            if lab[y, x] in n8 or not n8: continue
            v, c = np.unique(n8, return_counts=True); r[y, x] = v[c.argmax()]
        lab = r
    return lab

def mode(lab, m, it=2, keep=None):
    for _ in range(it):
        r = lab.copy()
        for y, x in zip(*np.where(m)):
            if keep is not None and keep[y, x]: continue
            n8 = [lab[q] for q in nb(lab, y, x, N8) if m[q]]
            if len(n8) < 8: continue
            v, c = np.unique(n8, return_counts=True)
            if c.max() >= 5 and v[c.argmax()] != lab[y, x]: r[y, x] = v[c.argmax()]
        lab = r
    return lab

def ring(m):
    p = np.pad(m, 1); return m & ~(p[:-2, 1:-1] & p[2:, 1:-1] & p[1:-1, :-2] & p[1:-1, 2:])

def lines(o, b, th=8, fr=.15, signs=(-1,)):
    """中の細い線：もとの絵で、まわりより th こい（-1）か うすい（+1）細い線が、セルに fr より多ければ、その線の色の1ドット。
    L：0＝線でない・-1＝こい線・+1＝うすい線。signs で、どちらをとるか（ふつうは、こい線だけ。うすい線もとると、ふちのつやを拾って点々になる）"""
    from scipy.ndimage import gaussian_filter
    H, W = b.shape[:2]; Lm = b[..., :3] @ (.3, .59, .11); m0 = b[..., 3] > 128
    bl = gaussian_filter(np.where(m0, Lm, Lm[m0].mean() if m0.any() else 0), 3)
    h, w = o.shape[:2]; xs, ys = P.grid(W, H, w, h); r = o.copy(); L = np.zeros((h, w), int)
    for sg in signs:
        ln = m0 & (sg * (Lm - bl) > th); F = np.zeros((h, w)); col = np.zeros((h, w, 3))
        for y in range(h):
            for x in range(w):
                if o[y, x, 3] == 0 or L[y, x]: continue
                sl = (slice(int(ys[y]), max(int(ys[y]) + 1, int(ys[y + 1]))), slice(int(xs[x]), max(int(xs[x]) + 1, int(xs[x + 1])))); c = ln[sl]
                if c.size and c.any(): F[y, x] = c.mean(); col[y, x] = b[sl][..., :3][c].mean(0)
        Pp = np.pad(F, 1)
        sk = (F >= fr) & (((F >= Pp[1:-1, :-2]) & (F > Pp[1:-1, 2:])) | ((F >= Pp[:-2, 1:-1]) & (F > Pp[2:, 1:-1])) | (F >= .5)) & (L == 0)
        r[sk, :3] = col[sk]; L[sk] = sg
    return r, L

def shrink(src, w=None, h=None, sc=None, thick=None, rnd=None, ln=None):
    """ちぢめた色（o）と形（m）と、のこす中の線（L。ln=(こさ,わりあい) のとき。板のすじ・すきまなど）"""
    b = np.asarray(src.convert('RGBA')).astype(float)
    if thick: b = b.copy(); b[..., 3] = np.minimum(255, b[..., 3] * thick)
    H, W = b.shape[:2]
    if w: sc = w / W
    elif h: sc = h / H
    ow, oh = max(1, round(W * sc)), max(1, round(H * sc))
    o = P.shrink(b, ow, oh); L = np.zeros((oh, ow), bool)
    if ln: o, L = lines(o, b, *ln)
    m = clean_shape(o[..., 3] > 0)
    if rnd:
        from scipy.ndimage import binary_fill_holes
        a0 = o[..., 3] > 0; holes = binary_fill_holes(a0) & ~a0   # 中の穴（いすの背のすきま など）は、ならしてもうめない
        m = unspike(clean_shape(round_mask(b, ow, oh, rnd))) & ~holes
    for y, x in zip(*np.where(m & (o[..., 3] == 0))):   # 透明からうまった所は、となりの色
        q = [o[p][:3] for p in nb(o, y, x, N8) if o[p][3] > 0]; o[y, x, :3] = np.mean(q, 0) if q else 128; o[y, x, 3] = 255
    return o, m, np.where(m, L, 0)

def finish(o, m, pal, outline=True, L=None):
    lab = np.full(m.shape, -1); lab[m] = assign(o[m][:, :3], pal)
    K = None if L is None else L != 0
    lab = mode(clean_color(lab, m, K), m, keep=K)
    r = np.zeros(m.shape + (4,), np.uint8); r[m, :3] = pal[lab[m]]; r[m, 3] = 255
    if K is not None:   # 線のドットが、まわりと同じ色になったら、こい線は1つこい色・うすい線は1つうすい色に
        lum = pal @ (.3, .59, .11)
        for y, x in zip(*np.where(K & m)):
            nl = [lab[q] for q in nb(lab, y, x, N8) if m[q] and not K[q]]
            if not nl: continue
            v, c = np.unique(nl, return_counts=True); bg = v[c.argmax()]
            if lab[y, x] != bg: continue
            sg = L[y, x]; cand = [j for j in range(len(pal)) if sg * (lum[j] - lum[bg]) >= 8 and ((pal[j] - pal[bg]) ** 2).sum() < 70 ** 2]   # まわりに近い色だけ
            if cand: j = min(cand, key=lambda j: ((pal[j] - o[y, x, :3]) ** 2).sum() + 4 * (lum[j] - lum[bg]) ** 2); lab[y, x] = j; r[y, x, :3] = pal[j]
            else: r[y, x, :3] = np.clip(pal[bg] * (.88 if sg < 0 else 1.08), 0, 255).round()
    if outline:
        e1 = ring(m); e2 = ring(m & ~e1)
        r[e1, :3] = (pal[lab[e1]] * OUTK[0]).round(); r[e2, :3] = (pal[lab[e2]] * OUTK[1]).round()
    return r

def make_frames(srcs, k=8, **kw):
    """コマ（同じ大きさの絵のならび）→ 同じ色の表で作ったコマ。切りとらない（コマの位置をそろえる）"""
    sh = [shrink(s, **kw) for s in srcs]
    pal = kmeans(np.concatenate([o[m][:, :3] for o, m, _ in sh]), k)
    return [Image.fromarray(finish(o, m, pal, L=L), 'RGBA') for o, m, L in sh]

def make(src, k=8, **kw):
    im = make_frames([src], k, **kw)[0]; return im.crop(im.getbbox())
