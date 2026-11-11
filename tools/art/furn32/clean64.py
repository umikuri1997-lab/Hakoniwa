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

SPECK = 2   # 同じ色が、この数のドットまでしかつながっていない小さな点は、ぶつぶつに見えるので、まわりの色にそろえる（木目のすじは3ドット以上つづくので、のこる）

def rim_flatten(qi, m, mat, lab, pals):
    """元の絵のこいふち（外から3〜5ドット）は、新しい2ドットの輪郭とならんで、たて線が何本もの二重のガタガタになる。
    そこは、内がわ（外から遠い向きへ3ドット先）の面の色にする"""
    from scipy.ndimage import distance_transform_cdt
    H, W = qi.shape; dist = distance_transform_cdt(np.pad(m, 1), metric='chessboard')[1:-1, 1:-1]; q = qi.copy(); chg = np.zeros((H, W), bool)
    for y, x in zip(*np.where((dist >= 3) & (dist <= 5))):
        k = len(pals[mat[y, x]])
        if lab[y, x] < k - 2: continue   # こい色（いちばんこい2つ）だけ
        for dy, dx in ((0, 1), (0, -1), (1, 0), (-1, 0)):
            yy, xx = y + 3 * dy, x + 3 * dx
            if 0 <= yy < H and 0 <= xx < W and dist[yy, xx] >= dist[y, x] + 3 and mat[yy, xx] == mat[y, x] and lab[yy, xx] < k - 2:
                q[y, x] = qi[yy, xx]; chg[y, x] = True; break
    return q, chg

def despeckle(qi, m, mat, keep=None):
    from scipy.ndimage import label
    H, W = qi.shape; q = qi.copy()
    for _ in range(2):
        changed = False
        for M_ in set(mat[m]):
            sel = m & (mat == M_)
            for v in np.unique(q[sel]):
                lab, n = label(sel & (q == v), structure=np.ones((3, 3)))
                if not n: continue
                sizes = np.bincount(lab.ravel())
                for i in np.where(sizes[1:] <= SPECK)[0] + 1:
                    ys, xs = np.where(lab == i); nb = []
                    if keep is not None and keep[ys, xs].all(): continue   # 細いこい線（ふたのだ円・板のすじ）はけさない
                    for y, x in zip(ys, xs):
                        for dy in (-1, 0, 1):
                            for dx in (-1, 0, 1):
                                yy, xx = y + dy, x + dx
                                if 0 <= yy < H and 0 <= xx < W and sel[yy, xx] and lab[yy, xx] != i: nb.append(q[yy, xx])
                    if nb:
                        vv, cc = np.unique(nb, return_counts=True); q[ys, xs] = vv[cc.argmax()]; changed = True
        if not changed: break
    return q

NORIM = {'barrel'}   # ふちの近くのこい線をうめない材料（たるのふたのだ円の線が消える）

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
    if not (set(mats) & NORIM): qi, chg = rim_flatten(qi, m, mat, lab, pals); lab = lab.copy(); lab[chg] = 0   # うめた所は、さかいの線にもしない
    Lum = rgb @ np.array([.3, .59, .11]); P_ = np.pad(np.where(m, Lum, np.nan), 1, constant_values=np.nan)
    nbm = np.nanmean(np.stack([P_[1 + dy:H + 1 + dy, 1 + dx:W + 1 + dx] for dy in (-1, 0, 1) for dx in (-1, 0, 1) if dy or dx]), 0)
    qi = despeckle(qi, m, mat, keep=m & (Lum < nbm - 12))   # まわりより12こい細い線は、のこす
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
    base = {M_: np.median(qp[M_][qi[m & (mat == M_) & ~Lm]], 0) for M_ in pals}   # 材料ごとの、ふつうの色
    o = np.zeros((H, W, 4), np.uint8)
    for y in range(H):
        for x in range(W):
            if not m[y, x]: continue
            P = pals[mat[y, x]]; k = len(P)
            # 輪郭線（外のふち・部品のさかい＝元のいちばんこい色の線）だけ、うすい線の色に。はばは元の絵のまま（3ドットまで）
            if Lm[y, x]:   # 線：外がわ（まん中）がいちばんこく、内がわほど、その所の色（まわりの色）に近づける
                a_ = LWMIX[LV[y, x] - 1]; F = base[mat[y, x]]; Lc = np.round(P[k - 2] * .5 + P[k - 1] * .5)   # まぜる色は、その材料のふつうの色（場所ごとの色にすると、線の色がばらついてガタガタに見える）
                if LV[y, x] == 1: o[y, x, :3] = Lc
                else:   # 2・3ドットめ：まわりの色にまぜた色を、その材料の色の表のいちばん近い色に（色をふやさない）
                    c = Lc * a_ + F * (1 - a_); Q = qp[mat[y, x]]; o[y, x, :3] = Q[((Q - c) ** 2).sum(1).argmin()]
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

SYM = {'chair', 'chair>2', 'chair>2.front', 'table', 'bed'}   # たるは入れない（丸い物は、写すと、元の絵の光とかげ・ふたのだ円がくずれる）   # 左右対称にする物（光とかげだけ左右でちがう）
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

LWMIX = (1.0, .5)   # 2ドットの線の、線の色のこさ（外がわ・まん中 → 内がわ）

LW = 2   # 輪郭線（外のふちと、さかいの線）のはば：どこもちょうど2ドット（持ち主がえらんだ）

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
    # 外の輪郭のすぐ内がわ（3ドット以内）の線は、輪郭とならんで二重のガタガタになるので、線にしない。6ドットより短い線のかけらも、線にしない
    from scipy.ndimage import distance_transform_cdt, label
    dist = distance_transform_cdt(np.pad(m, 1), metric='chessboard')[1:-1, 1:-1]
    I &= dist > 3
    lab, n = label(I, structure=np.ones((3, 3)))
    if n:
        sz = np.bincount(lab.ravel()); I &= sz[lab] >= 6
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
    N[I & (N == 0)] = 1   # ななめ・丸い線（たるのふたのだ円など）は、元の線のドットをそのまま線に
    return N

WOODREF = {'bed': 'chair'}   # 木の色を、ほかの家具（いす）の木の色に合わせる物

def recolor_wood(im, ref):
    """木（色あいのある所）の色を、ref の木の色に合わせる：明るさの順位が同じ所の色に（木目はそのまま）"""
    a = np.asarray(im.convert('RGBA')).astype(float); r = np.asarray(ref.convert('RGBA')).astype(float)
    def wood(x): return (x[..., 3] > 110) & ((x[..., :3].max(-1) - x[..., :3].min(-1)) >= 40)
    wa, wr = wood(a), wood(r); La = a[..., :3][wa] @ [.3, .59, .11]; Rc = r[..., :3][wr]; Rl = Rc @ [.3, .59, .11]
    order = np.argsort(Rl); Rc, Rl = Rc[order], Rl[order]
    q = np.searchsorted(np.sort(La), La) / max(1, len(La) - 1)   # その所の明るさの順位（0〜1）
    o = a.copy(); o[..., :3][wa] = Rc[np.clip((q * (len(Rc) - 1)).round().astype(int), 0, len(Rc) - 1)]
    return Image.fromarray(o.round().astype(np.uint8), 'RGBA')

def flat_cloth_sides(img, L, w=5):
    """白い布の、左右のふち（木・線のとなり）にある灰色のかげをなくす：ふちから w ドットの所の色を、その行の w ドット内がわの色に"""
    o = np.asarray(img).copy(); H, W = o.shape[:2]; a = o[..., 3] > 0
    cl = a & ~L & ((o[..., :3].max(-1).astype(int) - o[..., :3].min(-1)) < 40)
    for y in range(H):
        for x in range(W):
            if not cl[y, x]: continue
            for d in (1, -1):   # 左がわのふち（左に布でない物）・右がわのふち
                if any(0 <= x - d * k < W and a[y, x - d * k] and not cl[y, x - d * k] for k in range(1, w + 1)):
                    X = x + d * w
                    while 0 <= X < W and cl[y, X] and any(0 <= X - d * k < W and a[y, X - d * k] and not cl[y, X - d * k] for k in range(1, w + 1)): X += d
                    if 0 <= X < W and cl[y, X]: o[y, x] = o[y, X]
                    break
    return Image.fromarray(o, 'RGBA')

# ---- 手でなおす所（12倍で見て、ドットごとに。座標は、できあがりの絵（切りとったあと）。左右対称の物は左右とも） ----
def _row_copy(o, src_y, ys, x0, x1):
    for y in ys: o[y, x0:x1 + 1] = o[src_y, x0:x1 + 1]

def hand_table(o):
    H, W = o.shape[:2]; L1 = o[0, W // 2].copy(); L2 = o[1, W // 2].copy()
    for y in range(2, 30):   # 天板の左右のふち：外から 線・線のうちがわ・面（行の面の色）
        o[y, 0] = L1; o[y, 1] = L2; o[y, 2:5] = o[y, 6]
        o[y, W - 1] = L1; o[y, W - 2] = L2; o[y, W - 5:W - 2] = o[y, W - 7]
    for y in range(30, 35):   # 天板の前の面の左右
        o[y, 2:5] = o[y, 6]; o[y, W - 5:W - 2] = o[y, W - 7]
    _band_rows(o, range(1, 4), W // 2)   # 上のふちの小さな点：行ごとに同じ色
    _legs(o, 46, 36)   # 脚：まっすぐな所を、同じ色の列で通す
    _band_rows(o, range(30, 35), W // 2)   # 天板の前の面：行ごとに同じ色で、はしまで通す
    return o

def _cols_from(o, src_y, ys, x0, x1):
    """たての部材（背もたれの板・脚）：ys の行を、きれいな行 src_y の色にそろえる（まっすぐな板に見える。透明な所もそろう）"""
    for y in ys: o[y, x0:x1 + 1] = o[src_y, x0:x1 + 1]

def _band_rows(o, ys, xc):
    """よこの帯（座面の前の板）：行ごとに、ふち（線）の内がわを、その行の xc の色に"""
    for y in ys:
        xs = np.where(o[y, :, 3] > 0)[0]
        if len(xs) > 6: o[y, xs[0] + 2:xs[-1] - 1] = o[y, xc]

def _hole_frame(o):
    """中の穴（いすの背のすきま）のまわりを、角もふくめて、ぐるりと同じ線の色に"""
    from scipy.ndimage import binary_fill_holes, binary_dilation
    a = o[..., 3] > 0; holes = binary_fill_holes(a) & ~a
    if not holes.any(): return
    ring = binary_dilation(holes, structure=np.ones((3, 3))) & a
    cols = [tuple(c) for c in o[ring][:, :3]]; L1 = max(set(cols), key=cols.count)
    o[ring, :3] = L1

def _legs(o, src_y, y0):
    """脚：まっすぐな所（y0〜下から3行目）を src_y の行の色にそろえ、下の2行は、その行のはしの線の色で"""
    H = o.shape[0]
    _cols_from(o, src_y, range(y0, H - 2), 0, o.shape[1] - 1)

def hand_chair(o):
    H, W = o.shape[:2]
    _legs(o, 56, 50)
    _hole_frame(o)
    return o

def hand_chair_side(o):
    H, W = o.shape[:2]
    _band_rows(o, range(44, 48), 24)   # 座面の前の板
    _legs(o, 56, 48)
    return o

def hand_chair_back(o):
    H, W = o.shape[:2]
    _cols_from(o, 24, range(15, 31), 2, W - 3)   # 背もたれの板：まっすぐな板に
    _band_rows(o, range(2, 5), W // 2)   # 上の板の明るい帯
    _legs(o, 50, 45)
    return o

def _band_rect(o, ys, x0, x1, xc):
    """よこの板：ys の行の x0〜x1 を、行ごとに xc の色に（よこの木目のすじになる）"""
    for y in ys: o[y, x0:x1 + 1] = o[y, xc]

def hand_bed(o):
    H, W = o.shape[:2]
    for x0, x1 in ((1, 5), (W - 6, W - 2)): _cols_from(o, 30, range(6, 58), x0, x1)   # 柱（上）：木の所だけ
    for x0, x1 in ((0, 7), (W - 8, W - 1)): _cols_from(o, 70, range(62, 79), x0, x1)   # 柱（下）
    _band_rect(o, range(66, 76), 8, W - 9, W // 2)   # 足の板
    _band_rect(o, range(1, 5), 6, W - 7, W // 2)   # 頭の板（まくらより上）
    return o

def hand_bed_side(o):
    H, W = o.shape[:2]
    for x0, x1 in ((0, 6), (W - 7, W - 1)): _cols_from(o, 30, range(3, H - 3), x0, x1)   # 柱
    _band_rect(o, range(61, 67), 7, W - 8, W // 2)   # よこの板
    xs = [x for x in range(W) if o[30, x, 3] and abs(int(o[30, x, :3].astype(int).sum()) - int(o[30, W // 2, :3].astype(int).sum())) > 0]
    _cols_from(o, 30, range(8, 56), 20, 28)   # 折り返したシーツ（たての帯）：まっすぐに
    _band_rect(o, range(7, 13), 8, 19, 13)   # まくらの上
    return o

def unify_lines(o):
    """輪郭線の色を、そろえる：いちばん外の1ドットに多い色（材料ごとの線の色）と、その内がわに多い色に、近い色（差18まで）は、その色にする"""
    a = o[..., 3] > 0; p = np.pad(a, 1); r1 = a & ~(p[:-2, 1:-1] & p[2:, 1:-1] & p[1:-1, :-2] & p[1:-1, 2:])
    q = np.pad(a & ~r1, 1); r2 = (a & ~r1) & ~(q[:-2, 1:-1] & q[2:, 1:-1] & q[1:-1, :-2] & q[1:-1, 2:])
    keys = []
    for R in (r1, r2):
        cs, cn = np.unique(o[R][:, :3], axis=0, return_counts=True)
        keys += [cs[i] for i in np.argsort(-cn)[:3] if cn[i] >= 8]
    if not keys: return o
    K = np.array(keys, float); rgb = o[..., :3].astype(float)
    d = ((rgb[..., None, :] - K[None, None]) ** 2).sum(-1); j = d.argmin(-1); near = (d.min(-1) < 18 ** 2) & a & (d.min(-1) > 0)
    o[near, :3] = K[j[near]].round().astype(np.uint8)
    return o

HAND = {'bed': hand_bed, 'bed>1': hand_bed_side, 'table': hand_table, 'chair': hand_chair, 'chair>1': hand_chair_side, 'chair>2': hand_chair_back}

SMOOTH = {'taru': ((0, 22), (44, 62))}   # りんかくを、だ円の形でなめらかにととのえる行（上のふた・下のはし）

def smooth_sil(im, ranges):
    """丸い物のりんかく：その行のはんぶんのはば w を、w^2 = A + B y + C y^2（だ円）にあてはめて、きれいな段にする。
    はみ出した所はけし、たりない所は、すぐ内がわの色でうめる"""
    a = np.asarray(im.convert('RGBA')).copy(); m = a[..., 3] > 110; H, W = m.shape
    xs = np.where(m.any(0))[0]; cx = (xs[0] + xs[-1]) / 2
    for y0, y1 in ranges:
        ys = [y for y in range(y0, y1 + 1) if m[y].any()]
        w = np.array([(np.where(m[y])[0][-1] - np.where(m[y])[0][0] + 1) / 2 for y in ys])
        c = np.polyfit(ys, w ** 2, 2)
        for y in ys:
            hw = np.sqrt(max(0, np.polyval(c, y))); L = int(round(cx - hw + .5)); R = int(round(cx + hw - .5))
            row = np.where(m[y])[0]
            for x in range(W):
                if x < L or x > R: a[y, x, 3] = 0
                elif not m[y, x]:
                    src = row[0] if x < row[0] else row[-1]; a[y, x] = a[y, src]
    return Image.fromarray(a, 'RGBA')

def build(b):
    meta = json.load(open(os.path.join(SRC, 'meta.json'))); out = {}
    for k in [k for k in meta if re.split(r'[#>:@~.]', k)[0] == b]:
        im = Image.open(os.path.join(SRC, fname(k) + '.png'))
        if k in PARA: im = para_table(im)
        if k in SMOOTH: im = smooth_sil(im, SMOOTH[k])
        if b in WOODREF: im = recolor_wood(im, Image.open(os.path.join(SRC, fname(WOODREF[b]) + '.png')))
        r, L = clean(im, *ITEMS[b])
        if k in FIXES: r, L = fix_shape(r, L, FIXES[k])
        if b == 'bed': r = flat_cloth_sides(r, L)
        if k in SYM: r = symmetric(r, L, im)
        if k in OPEN: r = open_holes(r, *OPEN[k])
        bb = r.getbbox(); fin = r.crop(bb)
        if k in HAND: fin = Image.fromarray(HAND[k](np.asarray(fin).copy()), 'RGBA')
        fin = Image.fromarray(unify_lines(np.asarray(fin).copy()), 'RGBA')
        out[k] = {'f': [fin], 'ax': round(meta[k]['ax']) + bb[0], 'ay': round(meta[k]['ay']) + bb[1]}
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
