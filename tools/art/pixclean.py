#!/usr/bin/env python3
"""部品やもようの多いチップ（食べ物ののった箱・たる・ふくろ など）を、形と部品はそのままに、ドット絵の決まりに近づける（スキル pixel-redraw の「向いていない物」用）。
コードで描きなおさない。いまの絵のドットを1つずつ、きめた数の色のどれかに置きかえる（絵をぼかさない・ちぢめない）。
  1 うすさを 0 か 255 に（半分より上を不透明）
  2 色を n 色にまとめる（見た目の色の差で、にた色をあつめて、その平均の色に。差が merge より小さい色どうしは1つに。細い線は、とぎれないように先に少し強める）
  3 孤立ドット（まわり8つに同じ色がない1ドット）を、まわりでいちばん多い色に
  4 --thin：輪郭が2ドット以上の所（chipcheck と同じ数え方）の、内がわのドットを、となりの中の色に（外がわの1ドットだけのこす）
  5 --outline：輪郭のとぎれ（透明にふれるのに、中の色と同じ明るさの所）を、その色を暗くした色でつなぐ
使い方：
  python3 tools/art/pixclean.py <前.png> <出力.png> [--n 20] [--merge 6] [--k 0.8] [--thin] [--outline]
      --k：細い線を強める強さ（0 で強めない。色を多く（48色より上）のこすときは 0）
  python3 tools/art/pixclean.py --put <id> <出力.png>     # できた絵をチップに入れる（大きさは同じ）"""
import sys, os
import numpy as np
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def kmeans(P, n, it=30):
    """色のあつまり n こ（はじめの中心は、はなれた色から順に。毎回同じ結果になる）"""
    C = [P.mean(0)]
    for _ in range(n - 1):
        d = np.min([((P - c) ** 2).sum(1) for c in C], 0); C.append(P[d.argmax()])
    C = np.array(C, float)
    for _ in range(it):
        L = ((P[:, None, :] - C[None]) ** 2).sum(2).argmin(1)
        for k in range(len(C)):
            if (L == k).any(): C[k] = P[L == k].mean(0)
    return C, L

def oklab(rgb):
    """RGB（0〜255）→ 見た目の色の差に近い色の空間（OKLab ×100）。色あいのちがう色（だいだいと赤茶）が、まざりにくい"""
    c = rgb / 255.0; c = np.where(c <= .04045, c / 12.92, ((c + .055) / 1.055) ** 2.4)
    l = .4122214708 * c[..., 0] + .5363325363 * c[..., 1] + .0514459929 * c[..., 2]
    m = .2119034982 * c[..., 0] + .6806995451 * c[..., 1] + .1073969566 * c[..., 2]
    s = .0883024619 * c[..., 0] + .2817188376 * c[..., 1] + .6299787005 * c[..., 2]
    l, m, s = np.cbrt(l), np.cbrt(m), np.cbrt(s)
    return 100 * np.stack([.2104542553 * l + .7936177850 * m - .0040720468 * s, 1.9779984951 * l - 2.4285922050 * m + .4505937099 * s, .0259040371 * l + .7827717662 * m - .8086757660 * s], -1)

def sharpen(a, m, k=.8):
    """細い線（板のさかい・わく）をとぎれさせない：まわり（3×3）の平均より暗いドットは、その分だけもっと暗く、明るいドットは明るく（色をまとめる前だけ。絵はぼかさない）"""
    h, w = m.shape; out = a[..., :3].copy()
    for y in range(h):
        for x in range(w):
            if not m[y, x]: continue
            nb = [a[y + dy, x + dx, :3] for dy in (-1, 0, 1) for dx in (-1, 0, 1) if 0 <= y + dy < h and 0 <= x + dx < w and m[y + dy, x + dx]]
            out[y, x] = np.clip(a[y, x, :3] + k * (a[y, x, :3] - np.mean(nb, 0)), 0, 255)
    return out

def clean(im, n=20, merge=6, k=.8):
    a = np.asarray(im.convert('RGBA')).astype(float); m = a[..., 3] > 127
    P0 = a[m][:, :3]; P = oklab(sharpen(a, m, k)[m])
    C, L = kmeans(P, n)
    # にた色をまとめる（多いほうの色に）。色は、そのあつまりのドットの、もとの色の平均
    cnt = np.bincount(L, minlength=len(C)); alive = list(np.argsort(-cnt)); keep = []
    for q in alive:
        if cnt[q] == 0: continue
        j = next((r for r in keep if ((C[q] - C[r]) ** 2).sum() < merge * merge), None)
        if j is None: keep.append(q)
        else: L[L == q] = j
    C = np.array([P0[L == q].mean(0) if (L == q).any() else [0, 0, 0] for q in range(len(C))])
    C = np.round(C).astype(int); idx = -np.ones(m.shape, int); idx[m] = L; h, w = m.shape
    for _ in range(4):   # 孤立ドットを、まわりでいちばん多い色に
        ch = 0; nxt = idx.copy()
        for y in range(h):
            for x in range(w):
                if idx[y, x] < 0: continue
                nb = [idx[y + dy, x + dx] for dy in (-1, 0, 1) for dx in (-1, 0, 1) if (dx or dy) and 0 <= y + dy < h and 0 <= x + dx < w and idx[y + dy, x + dx] >= 0]
                if nb and idx[y, x] not in nb:
                    v = np.bincount(nb); nxt[y, x] = v.argmax(); ch += 1
        idx = nxt
        if not ch: break
    out = np.zeros((h, w, 4), np.uint8); out[m, :3] = C[idx[m]]; out[m, 3] = 255
    return Image.fromarray(out, 'RGBA')

def thin(im):
    """太い輪郭を1ドットに：内がわのこいドットを、上下左右のとなりの、いちばん明るい中の色にする"""
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from chipcheck import thick_points
    a = np.asarray(im.convert('RGBA')).astype(int).copy(); h, w = a.shape[:2]
    for _ in range(4):
        T = thick_points(a)
        if not T: break
        Lm = a[..., :3] @ (.3, .59, .11); ts = set(T)
        for x, y in T:
            nb = [(Lm[y + dy, x + dx], x + dx, y + dy) for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)) if 0 <= y + dy < h and 0 <= x + dx < w and a[y + dy, x + dx, 3] > 127 and (x + dx, y + dy) not in ts]
            nb = [q for q in nb if q[0] > Lm[y, x] + 8]
            if nb: _, qx, qy = max(nb); a[y, x, :3] = a[qy, qx, :3]
    return deorphan(a)

def deorphan(a):
    """孤立ドット（まわり8つに同じ色がない1ドット）を、まわりでいちばん多い色に"""
    h, w = a.shape[:2]
    for _ in range(3):   # 細くしたあとにのこった孤立ドットを、まわりでいちばん多い色に
        ch = 0; b = a.copy()
        for y in range(h):
            for x in range(w):
                if a[y, x, 3] <= 127: continue
                nb = [tuple(a[y + dy, x + dx, :3]) for dy in (-1, 0, 1) for dx in (-1, 0, 1) if (dx or dy) and 0 <= y + dy < h and 0 <= x + dx < w and a[y + dy, x + dx, 3] > 127]
                if nb and tuple(a[y, x, :3]) not in nb: b[y, x, :3] = max(set(nb), key=nb.count); ch += 1
        a = b
        if not ch: break
    return Image.fromarray(a.astype(np.uint8), 'RGBA')

def close_outline(im, k=.8):
    """輪郭のとぎれをつなぐ：透明にふれるドット（上下左右）のうち、中の色とくらべて暗くない所（輪郭がぬけている所）を、その色を k 倍に暗くした色にいちばん近い、絵の中の色にする"""
    a = np.asarray(im.convert('RGBA')).astype(int).copy(); h, w = a.shape[:2]; m = a[..., 3] > 127
    pal = np.array(sorted({tuple(c) for c in a[m][:, :3]})); Lp = pal @ (.3, .59, .11); L = a[..., :3] @ (.3, .59, .11); b = a.copy()
    for y in range(h):
        for x in range(w):
            if not m[y, x]: continue
            if all(0 <= y + dy < h and 0 <= x + dx < w and m[y + dy, x + dx] for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))): continue
            deep = [L[y + dy, x + dx] for dy in range(-3, 4) for dx in range(-3, 4) if 0 <= y + dy < h and 0 <= x + dx < w and m[y + dy, x + dx]
                    and all(0 <= y + dy + e < h and 0 <= x + dx + f < w and m[y + dy + e, x + dx + f] for e in (-1, 0, 1) for f in (-1, 0, 1))]
            if len(deep) < 3 or L[y, x] < np.median(deep) * .9: continue
            t = a[y, x, :3] * k; ok = Lp < L[y, x] * .93
            if ok.any(): b[y, x, :3] = pal[ok][((pal[ok] - t) ** 2).sum(1).argmin()]
    return deorphan(b)

if __name__ == '__main__':
    av = sys.argv[1:]
    if not av: print(__doc__); sys.exit()
    if av[0] == '--put':
        sys.path.insert(0, os.path.join(ROOT, 'tools')); import chips
        h, C = chips.load_imgs(); im = Image.open(av[2]).convert('RGBA')
        if (C[av[1]]['w'], C[av[1]]['h']) != im.size: raise SystemExit('大きさがちがう')
        C[av[1]]['f'][0] = im; chips.pack_imgs(h, C); sys.exit()
    kk = float(av[av.index('--k') + 1]) if '--k' in av else .8
    n = int(av[av.index('--n') + 1]) if '--n' in av else 20; mg = int(av[av.index('--merge') + 1]) if '--merge' in av else 6
    im = clean(Image.open(av[0]), n, mg, kk)
    if '--thin' in av: im = thin(im)
    if '--outline' in av: im = close_outline(im)
    im.save(av[1])
