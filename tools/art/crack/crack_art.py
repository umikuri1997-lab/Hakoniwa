# 朽ちた壁のひび（crack#0〜5・crack:v#0〜5、g64）
# もとは tools/art/crack/crack.png の3つの形（たてに走る1本・Vの字にわれる・ななめの長いひび）。
# もらった絵は色がうすく、線もとぎれるので、その形をなぞった折れ線（PATHS）から、とぎれない1ドットの線で作りなおす。
# 色：まん中はこい茶（すきま）、左上がわに1ドットのかげ、右下がわに1ドットの明るいふち（へこみに見える）。半透明なので、壁の色にあわせて見える。
# 3つの形 × 左右反転 = 6しゅるい（drawCrack が、となりと同じにならないようにえらぶ）。
#   python3 tools/art/crack/crack_art.py [出力フォルダ]   → チップに入れる（出力フォルダがあれば、8倍のためしの絵も書く）
import sys, os
import numpy as np
from PIL import Image
CORE = (92, 60, 40, 235); DEEP = (70, 44, 30, 245)   # すきま（はじまりの所は2ドット）
SHAD = (88, 62, 44, 95)                              # 左上がわのかげ
HIL = (255, 250, 236, 150)                           # 右下がわの明るいふち
# 折れ線：(点の列, 2=はじまりが太い)。座標はマスの中のドット（64×64、y=0 が壁の正面の上はし）
PATHS = {
    'h': [
        [([(24, 6), (26, 12), (25, 18), (29, 24), (28, 30), (33, 36), (34, 44), (38, 50)], 2), ([(28, 30), (21, 34), (17, 39)], 1), ([(33, 36), (41, 38), (47, 43)], 1)],
        [([(36, 8), (37, 14), (34, 20), (36, 26)], 2), ([(36, 26), (28, 32), (24, 40), (18, 44)], 1), ([(36, 26), (42, 33), (44, 40), (50, 46)], 1)],
        [([(14, 10), (20, 15), (24, 22), (30, 26), (36, 33), (44, 38), (52, 46)], 2), ([(24, 22), (22, 30), (25, 36)], 1), ([(44, 38), (47, 32), (52, 28)], 1)],
    ],
    'v': [  # たての壁は、上から見た細い帯（x 12〜52）。ひびは帯にそってたてに
        [([(30, -6), (31, 2), (29, 9), (32, 16), (31, 24), (34, 30)], 2), ([(32, 16), (37, 20), (39, 25)], 1)],
        [([(34, -2), (32, 6), (35, 12), (33, 20)], 2), ([(33, 20), (28, 26), (27, 32)], 1), ([(33, 20), (38, 25)], 1)],
        [([(27, -8), (29, -1), (33, 5), (32, 12), (36, 19), (35, 28)], 2), ([(29, -1), (24, 4)], 1)],
    ],
}
VOFF = 12  # たての絵は、マスの上はしより12ドット上から

def line(a, b):
    (x0, y0), (x1, y1) = a, b; n = max(abs(x1-x0), abs(y1-y0))
    return [(round(x0+(x1-x0)*t/n), round(y0+(y1-y0)*t/n)) for t in range(n+1)]

def render(paths, oy=0):
    core = {}
    for pts, w in paths:
        seg = []
        for a, b in zip(pts, pts[1:]): seg += line(a, b)
        L = len(seg)
        for k, (x, y) in enumerate(seg):
            thick = w == 2 and k < L*.45
            core[(x, y+oy)] = max(core.get((x, y+oy), 0), 2 if thick else 1)
            if thick: core[(x+1, y+oy)] = 2   # はじまりは太く（右へ1ドット）
    o = np.zeros((64, 64, 4), np.uint8); ok = lambda p: 0 <= p[0] < 64 and 0 <= p[1] < 64
    for (x, y) in core:   # かげ：左・上
        for p in ((x-1, y), (x, y-1)):
            if p not in core and ok(p): o[p[1], p[0]] = SHAD
    for (x, y) in core:   # 明るいふち：右・下
        for p in ((x+1, y), (x, y+1)):
            if p not in core and ok(p): o[p[1], p[0]] = HIL
    for (x, y), t in core.items():
        if ok((x, y)): o[y, x] = DEEP if t == 2 else CORE
    return Image.fromarray(o)

def flip(paths):
    return [([(63-x, y) for x, y in pts], w) for pts, w in paths]

def build():
    out = {}
    for kind, pre, oy in (('h', 'crack#', 0), ('v', 'crack:v#', VOFF)):
        for s, p in enumerate(PATHS[kind]):
            for f in (0, 1):
                im = render(flip(p) if f else p, oy); bb = im.getbbox()
                out[pre+str(s*2+f)] = (im.crop(bb), bb[0], bb[1]-oy)
    return out

if __name__ == '__main__':
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..')); import chips
    h, C = chips.load_imgs(); B = build()
    for k, (im, ax, ay) in B.items():
        C[k] = {'g': 64, 'ax': ax, 'ay': ay, 'w': im.width, 'h': im.height, 'f': [im]}
        if len(sys.argv) > 1: im.resize((im.width*8, im.height*8), Image.NEAREST).save(os.path.join(sys.argv[1], k.replace(':', '_').replace('#', '_')+'.png'))
    chips.pack_imgs(h, C); print(sorted(B))
