#!/usr/bin/env python3
"""家具を、元の絵（1マス64ドットのチップ、src/）の形・デザインのまま、ドットを1つずつそのまま使って整える（形はかえない）。
  1. 材料（木・金：色あいでわける）ごとに、元の絵の色を少ない色にわけ、いちばんこい色（輪郭と部品のさかいの線）を見つける
  2. 輪郭線（いちばん外の1ドットと、さかいの線）だけを、うすい線の色にする。線のはばは元の絵のまま（かげのがわを太くしない）
  3. 木目など、ほかのドットは、木目がのこるぐらいの色の数にまとめる（KQ：木20・金8・白い布6）
  4. 左右対称にできる物（SYM）は、右がわを左がわの写しにして、元の絵の左右の明るさのちがい（光とかげ）だけをかける。平行投影にする物（PARA）は、遠近のついた所をなおす
  python3 tools/art/furn32/clean64.py <出力フォルダ> [id ...] / --put"""
import os, sys, json, re
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE); sys.path.insert(0, os.path.join(HERE, '..', '..'))
SRC = os.path.join(HERE, 'src')
ITEMS = {'chair': (['wood'], {'wood': 8}), 'table': (['wood'], {'wood': 7}), 'bed': (['wood', 'cloth'], {'wood': 8, 'cloth': 6}), 'taru': (['barrel', 'metal'], {'barrel': 8, 'metal': 5})}   # 材料と、材料ごとの色の数
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
    if len(mats) > 1: mat[(sat < 40) & m] = mats[1]   # 色あいのない所（灰色・白）は、2つめの材料（金・布）
    pals = {}; lab = np.full((H, W), -1)
    for M_ in mats:
        sel = m & (mat == M_)
        if not sel.any(): continue
        pals[M_] = kmeans(rgb[sel], ks[M_]); lab[sel] = ((rgb[sel][:, None] - pals[M_][None]) ** 2).sum(2).argmin(1)
    # 色の数：木目がのこるぐらいに（材料ごとに KQ 色）。色の表は、元の絵の色から作る（線の色はべつ）
    qp = {}; qi = np.zeros((H, W), int)
    for M_ in pals:
        sel = m & (mat == M_); qp[M_] = np.round(kmeans(rgb[sel], KQ.get(M_, 12)))
        qi[sel] = ((rgb[sel][:, None] - qp[M_][None]) ** 2).sum(2).argmin(1)
    from scipy.ndimage import binary_fill_holes
    out_t = ~binary_fill_holes(m); p = np.pad(out_t, 1, constant_values=True)
    r1 = m & (p[:-2, 1:-1] | p[2:, 1:-1] | p[1:-1, :-2] | p[1:-1, 2:])   # いちばん外の1ドット
    Lm = np.zeros((H, W), bool)
    for y in range(H):
        for x in range(W):
            if m[y, x]: Lm[y, x] = r1[y, x] or lab[y, x] == len(pals[mat[y, x]]) - 1
    # 線のはばは3ドットまで：よこにもたてにも4ドット以上つづく所は、こいかげの面（線ではない）。ふちの1ドットだけ線にする
    def run(y, x, dy, dx):
        n = 0; yy, xx = y + dy, x + dx
        while 0 <= yy < H and 0 <= xx < W and Lm[yy, xx]: n += 1; yy += dy; xx += dx
        return n
    thick = np.zeros((H, W), bool)
    for y in range(H):
        for x in range(W):
            if Lm[y, x] and min(1 + run(y, x, 0, 1) + run(y, x, 0, -1), 1 + run(y, x, 1, 0) + run(y, x, -1, 0)) >= 4: thick[y, x] = True
    for y, x in zip(*np.where(thick)):
        if r1[y, x]: continue
        edge = any(0 <= y + dy < H and 0 <= x + dx < W and m[y + dy, x + dx] and not Lm[y + dy, x + dx] for dy, dx in ((0, 1), (0, -1), (1, 0), (-1, 0)))
        if not edge: Lm[y, x] = False
    LV = width3(m, Lm, r1); Lm = LV > 0
    o = np.zeros((H, W, 4), np.uint8)
    for y in range(H):
        for x in range(W):
            if not m[y, x]: continue
            P = pals[mat[y, x]]; k = len(P)
            # 輪郭線（外のふち・部品のさかい＝元のいちばんこい色の線）だけ、うすい線の色に。はばは元の絵のまま（3ドットまで）
            if Lm[y, x]:   # 線：外がわ（まん中）がいちばんこく、内がわほど、その所の色（まわりの色）に近づける
                a_ = LWMIX[LV[y, x] - 1]; F = qp[mat[y, x]][qi[y, x]]
                o[y, x, :3] = np.round((P[k - 2] * .5 + P[k - 1] * .5) * a_ + F * (1 - a_))
            else: o[y, x, :3] = qp[mat[y, x]][qi[y, x]]   # 木目など、ほかのドットは、木目がのこるぐらいの色の数にまとめた色
            o[y, x, 3] = 255
    L = Lm
    return Image.fromarray(o, 'RGBA'), L

FIXES = {'chair': [('holes',), ('diag', 25, 37)], 'chair>2': [('holes',)]}   # 形のくずれをなおす：すきまを四角に・小さな穴をうめる・ななめのふちを同じきざみの段に（左がわ。右は左右対称で写す）

def fix_shape(img, L, fixes):
    from scipy.ndimage import binary_fill_holes, label, find_objects
    o = np.asarray(img).copy(); L = L.copy(); a = o[..., 3] > 0; H, W = a.shape
    def line_col(y, x):
        for dy, dx in ((0, -1), (0, 1), (-1, 0), (1, 0), (-1, -1), (1, 1)):
            if 0 <= y + dy < H and 0 <= x + dx < W and L[y + dy, x + dx]: return o[y + dy, x + dx].copy()
        return None
    lc = o[L][0].copy() if L.any() else None
    for f in fixes:
        if f[0] == 'holes':   # 中の穴：大きい物は四角に、小さい物（8ドットより少ない）はまわりの色でうめる
            holes = binary_fill_holes(a) & ~a; lab, n = label(holes)
            for i, sl in enumerate(find_objects(lab)):
                comp = lab[sl] == i + 1
                if comp.sum() < 8:
                    for y, x in zip(*np.where(lab == i + 1)):
                        q = [o[y + dy, x + dx] for dy, dx in ((0, -1), (0, 1), (-1, 0), (1, 0)) if 0 <= y + dy < H and 0 <= x + dx < W and a[y + dy, x + dx]]
                        o[y, x] = q[0]; o[y, x, 3] = 255
                    continue
                y0, y1, x0, x1 = sl[0].start, sl[0].stop - 1, sl[1].start, sl[1].stop - 1
                o[y0:y1 + 1, x0:x1 + 1] = 0
                for y in range(y0 - 1, y1 + 2):   # 四角のまわりは線
                    for x in (x0 - 1, x1 + 1): o[y, x] = lc; L[y, x] = True
                for x in range(x0 - 1, x1 + 2):
                    for y in (y0 - 1, y1 + 1): o[y, x] = lc; L[y, x] = True
            a = o[..., 3] > 0
        if f[0] == 'diag':   # 左のふちのななめ：上と下の行のはしを結ぶ、同じきざみの段に
            _, y0, y1 = f; left = {y: np.where(a[y])[0][0] for y in range(y0, y1 + 1)}
            for y in range(y0, y1 + 1):
                t = int(round(left[y0] + (left[y1] - left[y0]) * (y - y0) / (y1 - y0))); cur = left[y]
                inner = o[y, cur + 2].copy()
                if t > cur: o[y, cur:t] = 0
                elif t < cur: o[y, t + 1:cur + 1] = inner
                o[y, t] = lc; L[y, t] = True; L[y, t + 1:t + 3] = False
                if t < cur: pass
            a = o[..., 3] > 0
    return Image.fromarray(o, 'RGBA'), L

KQ = {'wood': 20, 'barrel': 20, 'metal': 8, 'cloth': 6}   # 材料ごとの色の数（木目がのこるぐらい。白い布は少なく）

OPEN = {}   # うしろ向きのいすの小さな穴は、うめる（持ち主の指摘：3ドットの線でかこむと、こいかたまりになる）

def open_holes(img, y0, y1, ys):
    """うしろ向きのいすの、すきまの上の穴：明るいすじ（座面が見える所）の上の行を、3本とも同じはば（2ドット。元の絵の左右の穴と同じ）で透明に。
    すじのまん中にあける（まん中の穴は、左右対称のまん中にそろう）"""
    o = np.asarray(img).copy(); Lm = o[..., :3] @ np.array([.3, .59, .11]); a = o[..., 3] > 0
    row = Lm[ys]; xs = np.where(a[ys])[0]; th = np.percentile(row[xs], 75); S = xs[0] + xs[-1]
    x = xs[0] + 4; cs = []
    while x < xs[-1] - 4:
        if row[x] >= th:
            x0 = x
            while x < xs[-1] - 4 and row[x] >= th: x += 1
            cs.append((x0 + x - 1) / 2)
        x += 1
    for c in cs:   # 左のすじとまん中のすじにあけ、右は左を写す（ぴったり左右対称）
        if 2 * c > S + 3: continue
        if abs(2 * c - S) < 3: x0 = (S - 1) // 2   # まん中：左右対称のまん中の2ドット
        else: x0 = int(round(c - .5))
        for X in (x0, S - x0 - 1): o[y0:y1 + 1, X:X + 2] = 0
    return Image.fromarray(o, 'RGBA')

SYM = {'chair', 'chair>2', 'chair>2.front', 'table', 'bed', 'taru'}   # 左右対称にする物（光とかげだけ左右でちがう）
PARA = {'table'}   # 平行投影にする物（天板の奥を、手前と同じはばに）

def para_table(im):
    """天板の奥の行（手前よりせまい＝遠近のついた台形）を、手前と同じはばにひきのばす（木目はそのまま）"""
    a = np.asarray(im.convert('RGBA')); o = a.copy(); al = a[..., 3] > 110
    full = {}   # 行 → (左, 右)
    for y in range(21, 33):
        xs = np.where(al[y])[0]
        if not len(xs): continue
        tx0, tx1 = (4, 63) if y == 21 else (3, 64) if y == 22 else (2, 65)
        x0, x1 = xs[0], xs[-1]; o[y] = 0
        for X in range(tx0, tx1 + 1): o[y, X] = a[y, int(round(x0 + (X - tx0) * (x1 - x0) / max(1, tx1 - tx0)))]
    return Image.fromarray(o, 'RGBA')

def symmetric(img, L, src):
    """左右対称：右がわは、左がわをそのまま写す（形・木目・線）。そのうえで、元の絵の左右の明るさのちがい（光とかげ）だけを、
    なめらかにかける（元の絵の明るさをぼかして、右と、写した左の比をかける）。線の色はかえない"""
    from scipy.ndimage import gaussian_filter
    o = np.asarray(img).astype(float); a = o[..., 3] > 0; sr = np.asarray(src.convert('RGBA')).astype(float)
    xs = np.where(a.any(0))[0]; S = xs[0] + xs[-1]   # x → S - x
    Lm = sr[..., :3] @ np.array([.3, .59, .11]); w = (sr[..., 3] > 110).astype(float)
    sm = gaussian_filter(Lm * w, 6) / np.maximum(gaussian_filter(w, 6), 1e-3)   # 元の絵の、なめらかな明るさ
    r = o.copy(); pal = np.unique(o[a & ~L][:, :3], axis=0)   # この絵の色の表（線いがい）
    for y in range(o.shape[0]):
        for x in range(o.shape[1]):
            X = S - x
            if 2 * x <= S or not (0 <= X < o.shape[1]): continue
            r[y, x] = o[y, X] if a[y, X] else 0
    # 右がわの部材（線と線のあいだ。まん中をまたがない物）の中は、色のならびを左右もどす：
    # 写しただけだと、左の部材のかげ（右のふち）が、右の部材の光のがわ（左のふち）にきて、こい線に見える
    Lr = np.zeros_like(L)
    for y in range(o.shape[0]):
        for x in range(o.shape[1]):
            X = S - x
            if 2 * x > S and 0 <= X < o.shape[1]: Lr[y, x] = L[y, X]
            elif 2 * x <= S: Lr[y, x] = L[y, x]
    ar = r[..., 3] > 0; runs = {}
    for y in range(o.shape[0]):
        x = S // 2 + 1
        while x < o.shape[1]:
            if not ar[y, x] or Lr[y, x]: x += 1; continue
            x0 = x
            while x < o.shape[1] and ar[y, x] and not Lr[y, x]: x += 1
            if 2 * x0 > S + 2: runs.setdefault((x0, x), []).append(y)   # まん中をまたぐ部材（頭の板・ふとん）はそのまま
    for (x0, x1), ys in runs.items():   # 同じはばで6行よりながくつづく部材（柱・脚など、まっすぐな物）だけ
        ys = sorted(ys); grp = [[ys[0]]]
        for y in ys[1:]:
            if y == grp[-1][-1] + 1: grp[-1].append(y)
            else: grp.append([y])
        for g in grp:
            if len(g) >= 6:
                for y in g: r[y, x0:x1] = r[y, x0:x1][::-1].copy()
    for y in range(o.shape[0]):   # 元の絵の、ひろい光とかげ（ぼかした明るさの比）を、少しだけ
        for x in range(o.shape[1]):
            X = S - x
            if 2 * x <= S or not (0 <= X < o.shape[1]) or not ar[y, x] or Lr[y, x]: continue
            k = np.clip(sm[y, x] / max(1, sm[y, X]), .92, 1.04); c = r[y, x, :3] * k
            r[y, x, :3] = pal[((pal - c) ** 2).sum(1).argmin()]
    return Image.fromarray(r.round().astype(np.uint8), 'RGBA')

LWMIX = (1.0, .55, .25)   # 3ドットの線の、線の色のこさ（外がわ・まん中 → 内がわ）

LW = 3   # 輪郭線（外のふちと、さかいの線）のはば：どこもちょうど3ドット（持ち主がえらんだ）

def width3(m, Lm, r1):
    """線のはばを、どこもちょうど LW ドットに：外のふちは、透明（中の穴もふくむ）から LW ドットぶん。
    さかいの線は、いまの線のまん中から LW ドット（よこの線はたてに、たての線はよこに）。
    かえすのは、だん（1 いちばんこい＝外がわ・線のまん中、2・3 まわりの色に近い）。3つとも同じ色にしない（持ち主の指摘）"""
    H, W = m.shape; N = np.zeros(m.shape, int); cur = m.copy()   # N：0 線でない・1 いちばんこい・2・3 まわりの色に近い
    for i in range(LW):   # 外のふち（外がわから 1・2・3）
        p = np.pad(cur, 1, constant_values=False)   # ななめもふくめて数える（角でひし形にふくらまない。穴のまわりは四角いわく）
        ring = cur & ~(p[:-2, 1:-1] & p[2:, 1:-1] & p[1:-1, :-2] & p[1:-1, 2:] & p[:-2, :-2] & p[:-2, 2:] & p[2:, :-2] & p[2:, 2:])
        N[ring] = i + 1; cur &= ~ring
    I = Lm & ~r1   # さかいの線
    def runlen(y, x, dy, dx):
        n = 1; yy, xx = y + dy, x + dx
        while 0 <= yy < H and 0 <= xx < W and I[yy, xx]: n += 1; yy += dy; xx += dx
        yy, xx = y - dy, x - dx
        while 0 <= yy < H and 0 <= xx < W and I[yy, xx]: n += 1; yy -= dy; xx -= dx
        return n
    for x in range(W):   # よこの線：たてのつづき（はば）のまん中から3ドット
        y = 0
        while y < H:
            if not I[y, x]: y += 1; continue
            y0 = y
            while y < H and I[y, x]: y += 1
            n = y - y0; c = y0 + n // 2
            if n <= LW and runlen(c, x, 0, 1) > n:
                for yy in range(c - (LW - 1) // 2, c - (LW - 1) // 2 + LW):
                    if 0 <= yy < H and m[yy, x]: v = 1 if yy == c else 2; N[yy, x] = v if N[yy, x] == 0 else min(N[yy, x], v)
    for y in range(H):   # たての線：よこのつづき（はば）のまん中から3ドット
        x = 0
        while x < W:
            if not I[y, x]: x += 1; continue
            x0 = x
            while x < W and I[y, x]: x += 1
            n = x - x0; c = x0 + n // 2
            if n <= LW and runlen(y, c, 1, 0) > n:
                for xx in range(c - (LW - 1) // 2, c - (LW - 1) // 2 + LW):
                    if 0 <= xx < W and m[y, xx]: v = 1 if xx == c else 2; N[y, xx] = v if N[y, xx] == 0 else min(N[y, xx], v)
    return N

def build(b):
    meta = json.load(open(os.path.join(SRC, 'meta.json'))); out = {}
    for k in [k for k in meta if re.split(r'[#>:@~.]', k)[0] == b]:
        im = Image.open(os.path.join(SRC, fname(k) + '.png'))
        if k in PARA: im = para_table(im)
        r, L = clean(im, *ITEMS[b])
        if k in FIXES: r, L = fix_shape(r, L, FIXES[k])
        if k in SYM: r = symmetric(r, L, im)
        if k in OPEN: r = open_holes(r, *OPEN[k])
        bb = r.getbbox()
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
