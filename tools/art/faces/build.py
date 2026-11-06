#!/usr/bin/env python3
"""ふきだしの顔（5こ）：もらった絵 faces.png（ドット絵を約11倍にした絵）から、もとのドットをとりだす。
マス目ごとに、いちばん多い色（パレットの色にそろえる）。うすさは、あり・なしだけ。くずれは FIX で直す。
使い方：python3 tools/art/faces/build.py <出力フォルダ>  出力：faces.npy 相当の faces.png（32×32×5、よこ1列）"""
import sys, os, numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
NAMES = ['laugh', 'smile', 'hurt', 'scared', 'dizzyface']
PAL = {'.': None, 'o': (170, 128, 104), 'c': (252, 236, 211), 'k': (250, 180, 174), 'b': (162, 188, 212), 'w': (216, 233, 248)}

def grab():
    A = np.asarray(Image.open(os.path.join(HERE, 'faces.png')).convert('RGBA')).astype(float)
    al = A[..., 3] > 128
    cols = np.where(al.any(0))[0]
    segs = []; s = p = cols[0]
    for c in cols[1:]:
        if c > p + 5: segs.append((s, p)); s = c
        p = c
    segs.append((s, p))
    out = []
    for x0, x1 in segs:
        rows = np.where(al[:, x0:x1 + 1].any(1))[0]; y0, y1 = rows.min(), rows.max()
        nx = round((x1 - x0 + 1) / 11.2); ny = round((y1 - y0 + 1) / 11.2)
        px = (x1 - x0 + 1) / nx; py = (y1 - y0 + 1) / ny
        g = []
        for j in range(ny):
            row = ''
            for i in range(nx):
                cx0, cx1 = int(x0 + (i + .25) * px), int(x0 + (i + .75) * px)
                cy0, cy1 = int(y0 + (j + .25) * py), int(y0 + (j + .75) * py)
                blk = A[cy0:cy1, cx0:cx1].reshape(-1, 4)
                votes = {}
                for r, gg, b, a in blk:
                    if a < 128: k = '.'
                    else: k = min((kk for kk in PAL if kk != '.'), key=lambda kk: sum((v - w) ** 2 for v, w in zip((r, gg, b), PAL[kk])))
                    votes[k] = votes.get(k, 0) + 1
                row += max(votes, key=votes.get)
            g.append(row)
        out.append(g)
    return out


# ---- 仕上げ：とりだしたドットは、マス目のずれで輪郭が2ドット・左右ちがいになる所があるので、
# もらった絵と同じ形を、左右対称・1ドットの輪郭で書きなおす（顔の丸と、目・口・ほお・汗の位置は、とりだした絵のまま）。
N = 23
ROWS = {0: [(8, 14)], 1: [(6, 7)], 2: [(4, 5)], 3: [(3, 3)], 4: [(2, 2)], 5: [(2, 2)], 6: [(1, 1)], 7: [(1, 1)], 8: [(1, 1)],
        9: [(0, 0)], 10: [(0, 0)], 11: [(0, 0)], 12: [(0, 0)], 13: [(0, 0)]}
def base():
    g = [['.'] * N for _ in range(N)]
    for y in range(N):
        yy = y if y <= 13 else 22 - y if y >= 14 else y
        if y >= 14: yy = 22 - y
        for a, b in ROWS[yy]:
            for x in range(a, b + 1): g[y][x] = 'o'; g[y][N - 1 - x] = 'o'
    for y in range(N):  # 中をぬる
        xs = [x for x in range(N) if g[y][x] == 'o']
        for x in range(xs[0] + 1, xs[-1]):
            if g[y][x] == '.': g[y][x] = 'c'
    return g
def put(g, x0, y0, rows, mirror=False):
    for j, r in enumerate(rows):
        for i, ch in enumerate(r):
            if ch == ' ': continue
            ch = 'c' if ch == '.' else ch
            g[y0 + j][x0 + i] = ch
            if mirror: g[y0 + j][N - 1 - (x0 + i)] = ch
CHEEK = ['kkk', 'kkk']
DROP = [' b ', 'bwb', 'bwb', ' b ']
WAVY = [' o   o ', 'o ooo o']
SPIRAL = ['.oooo.', 'o....o', 'o.ooo.', 'o...o.', '.ooo..']
def face(nm):
    g = base()
    if nm == 'laugh':
        put(g, 5, 9, ['oooo'], True)
        put(g, 4, 10, ['o    o'], True)
        put(g, 3, 13, CHEEK, True)
        put(g, 8, 13, ['ooooooo', 'okkkkko', 'okkkkko', ' okkko ', '  ooo  '])
    elif nm == 'smile':
        put(g, 6, 10, ['oo', 'oo'], True)
        put(g, 3, 13, CHEEK, True)
        put(g, 9, 14, ['o   o', ' ooo '])
    elif nm == 'hurt':
        put(g, 5, 10, ['oooo', ' oo '], True)
        put(g, 3, 14, CHEEK, True)
        put(g, 8, 15, WAVY)
        put(g, 17, 5, DROP)
    elif nm == 'scared':
        put(g, 6, 10, ['oo', 'oo', 'oo'], True)
        put(g, 3, 14, CHEEK, True)
        put(g, 9, 14, [' ooo ', 'okkko', 'okkko', ' ooo '])
        put(g, 17, 6, DROP); put(g, 2, 9, [' b ', 'bwb', ' b '])
    elif nm == 'dizzyface':
        put(g, 3, 9, SPIRAL); put(g, 14, 9, SPIRAL)
        put(g, 3, 15, CHEEK, True)
        put(g, 8, 17, WAVY)
    return [''.join(r) for r in g]

def tile(rows, off=4):
    a = np.zeros((32, 32, 4), np.uint8)
    for y, r in enumerate(rows):
        for x, ch in enumerate(r):
            if PAL.get(ch): a[y + off, x + off, :3] = PAL[ch]; a[y + off, x + off, 3] = 255
    return a

def tiles(): return [tile(face(nm)) for nm in NAMES]

if __name__ == '__main__':
    for nm in NAMES: print(nm); print('\n'.join(face(nm)))
    d = sys.argv[1] if len(sys.argv) > 1 else '.'; os.makedirs(d, exist_ok=True)
    out = Image.new('RGBA', (32 * len(NAMES), 32), (0, 0, 0, 0))
    for i, t in enumerate(tiles()): out.paste(Image.fromarray(t, 'RGBA'), (32 * i, 0))
    out.save(os.path.join(d, 'faces.png'))
