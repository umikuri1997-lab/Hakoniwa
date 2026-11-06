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
PATHS = {  # 正面の板（y 0〜56）の上から下まで。はば x 6〜58（ずらしても はみ出さない）
    'h': [
        [([(22, 2), (25, 9), (23, 17), (29, 24), (27, 32), (34, 39), (35, 47), (40, 54)], 2), ([(27, 32), (19, 36), (13, 43), (8, 46)], 1), ([(34, 39), (43, 41), (50, 47), (55, 49)], 1), ([(23, 17), (17, 20), (14, 26)], 1), ([(19, 36), (20, 44), (17, 51)], 1)],
        [([(34, 2), (36, 10), (32, 18), (35, 25)], 2), ([(35, 25), (27, 31), (22, 40), (14, 45), (9, 53)], 1), ([(35, 25), (42, 33), (45, 41), (52, 47), (56, 54)], 1), ([(22, 40), (25, 48), (23, 54)], 1), ([(45, 41), (50, 36)], 1)],
        [([(7, 5), (14, 11), (20, 19), (28, 24), (35, 33), (44, 39), (51, 47), (57, 54)], 2), ([(20, 19), (18, 29), (22, 37), (20, 45)], 1), ([(44, 39), (48, 30), (55, 25)], 1), ([(35, 33), (33, 42), (36, 50)], 1)],
    ],
    'v': [  # たての壁は、上から見た細い帯（x 12〜52）。ひびは帯にそってたてに
        [([(30, -10), (31, 0), (28, 9), (32, 18), (30, 28), (34, 37), (32, 46)], 2), ([(32, 18), (38, 23), (41, 31)], 1), ([(30, 28), (24, 34), (23, 41)], 1)],
        [([(34, -8), (31, 3), (35, 12), (32, 22)], 2), ([(32, 22), (26, 30), (25, 39), (22, 47)], 1), ([(32, 22), (39, 29), (40, 38), (43, 45)], 1)],
        [([(26, -10), (29, -1), (34, 7), (32, 17), (37, 26), (35, 36), (38, 46)], 2), ([(29, -1), (23, 6), (21, 13)], 1), ([(37, 26), (42, 31)], 1)],
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
