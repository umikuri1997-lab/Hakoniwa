#!/usr/bin/env python3
"""部品やもようの多いチップ（食べ物ののった箱・たる・ふくろ など）を、形と部品はそのままに、ドット絵の決まりに近づける（スキル pixel-redraw の「向いていない物」用）。
コードで描きなおさない。いまの絵のドットを1つずつ、きめた数の色のどれかに置きかえる（絵をぼかさない・ちぢめない）。
  1 うすさを 0 か 255 に（半分より上を不透明）
  2 色を n 色にまとめる（にた色をあつめて、その平均の色に。差が merge より小さい色どうしは1つに）
  3 孤立ドット（まわり8つに同じ色がない1ドット）を、まわりでいちばん多い色に
  4 --thin：輪郭が2ドット以上の所（chipcheck と同じ数え方）の、内がわのドットを、となりの中の色に（外がわの1ドットだけのこす）
使い方：
  python3 tools/art/pixclean.py <前.png> <出力.png> [--n 20] [--merge 14] [--thin]
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

def clean(im, n=20, merge=14):
    a = np.asarray(im.convert('RGBA')).astype(float); m = a[..., 3] > 127; P = a[m][:, :3]
    C, L = kmeans(P, n)
    # にた色をまとめる（多いほうの色に）
    cnt = np.bincount(L, minlength=len(C)); alive = list(np.argsort(-cnt)); keep = []
    for k in alive:
        if cnt[k] == 0: continue
        j = next((q for q in keep if ((C[k] - C[q]) ** 2).sum() < merge * merge), None)
        if j is None: keep.append(k)
        else: L[L == k] = j
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

if __name__ == '__main__':
    av = sys.argv[1:]
    if not av: print(__doc__); sys.exit()
    if av[0] == '--put':
        sys.path.insert(0, os.path.join(ROOT, 'tools')); import chips
        h, C = chips.load_imgs(); im = Image.open(av[2]).convert('RGBA')
        if (C[av[1]]['w'], C[av[1]]['h']) != im.size: raise SystemExit('大きさがちがう')
        C[av[1]]['f'][0] = im; chips.pack_imgs(h, C); sys.exit()
    n = int(av[av.index('--n') + 1]) if '--n' in av else 20; mg = int(av[av.index('--merge') + 1]) if '--merge' in av else 14
    im = clean(Image.open(av[0]), n, mg)
    if '--thin' in av: im = thin(im)
    im.save(av[1])
