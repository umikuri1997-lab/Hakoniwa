#!/usr/bin/env python3
"""家具を、1マス32ドットで、部品ごとに手で描く（tools/art/furn32/furn32_art.py の自動では、まっすぐな木がガタガタ・同じ部材の太さがちがう・輪郭の色がばらばらになるため）。
決まり（スキル pixel-craft「やわらかいドット絵」）：
  ・まず、何の部品でできているか（脚・座面・背もたれの板…）を元の絵から読み、元の絵の半分の大きさ・同じ位置に、部品を四角などで描く
  ・まっすぐな木材は、まっすぐ（段を作らない）。同じ部材（左右の脚・たて板）は、同じ太さ
  ・色は材料ごとに決めた色のはしご（MAT、.5 は中間の色）だけ。輪郭は1ドットで、材料ごとに1色（LINE。うすめ）
  ・左右対称にできる物は、左半分を描いて写す（Cv.mirror）。光は左上から：shade で、上・左のふちを明るく、下・右のふちを暗く（形はかえず、光とかげだけ）
  ・部品のさかいの線（座面と脚・まくらのふち・板のすじ・金の帯のふち）も、輪郭と同じ line の色（Cv.line）
  ・木（Cv.wood）：板ごとに、上（左）のふちが明るく下（右）が暗い。板のさかいは線。長さのちがう木目のすじ（こい色が多く、うすい色が少し）
  ・中の穴（背もたれのすきま など、まわりをかこまれた透明）には輪郭をつけない
  ・角は1ドット落として、やわらかく（round）
  python3 tools/art/furn32/draw32.py <出力フォルダ> [id ...]   → <チップ名>.png・見くらべ cmp_<id>.png
  python3 tools/art/furn32/draw32.py --put <出力フォルダ> [id ...]   → チップに入れる"""
import os, sys, json, re
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.join(HERE, '..', '..', '..')
sys.path.insert(0, os.path.join(ROOT, 'tools'))
SRC = os.path.join(HERE, 'src')

def hx(s): return tuple(int(s[i:i + 2], 16) for i in (1, 3, 5))
# 材料ごとの色：明るい順のはしご（0 hi・1 top・2 base・3 side・4 dark）と、輪郭・さかいの線（line。うすめ：side と dark のあいだ）
MAT = {
    'wood':   ['#f4d08f', '#e9ba72', '#d6a262', '#c08d55', '#ab794a'],
    'ywood':  ['#fcdc95', '#f3c66a', '#e5b055', '#d29b43', '#bb8838'],
    'cloth':  ['#ffffff', '#f6f7f9', '#eaedf1', '#d8dde4', '#c6ccd5'],
    'barrel': ['#f1b874', '#e7a865', '#d4965a', '#c0824d', '#a96f43'],
    'metal':  ['#c9ced4', '#b3b9c1', '#a0a7b1', '#8d939e', '#7b818c'],
}
LINE = {'wood': '#b07e4e', 'ywood': '#c0903f', 'cloth': '#bcc2cb', 'barrel': '#ad7446', 'metal': '#80868f'}
LN = 99   # 線（輪郭・さかい）
def color(mat, t):
    if t == LN: return hx(LINE[mat])
    L = MAT[mat]; t = max(0, min(4, t)); i = int(t); f = t - i
    if f == 0 or i == 4: return hx(L[i])
    A, B = hx(L[i]), hx(L[i + 1]); return tuple(round(A[k] * (1 - f) + B[k] * f) for k in range(3))   # .5：木目・中間の色

class Cv:
    """t は色のはしごの番号（.5 は中間の色）か LN（線）"""
    def __init__(s, w, h): s.w, s.h = w, h; s.m = np.full((h, w), '', object); s.t = np.zeros((h, w)); s.fixed = np.zeros((h, w), bool)
    def ok(s, x, y): return 0 <= x < s.w and 0 <= y < s.h
    def rect(s, x0, y0, x1, y1, mat, t=2, fixed=False):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                if s.ok(x, y): s.m[y, x] = mat; s.t[y, x] = t; s.fixed[y, x] = fixed
    def px(s, x, y, mat, t, fixed=True):
        if s.ok(x, y): s.m[y, x] = mat; s.t[y, x] = t; s.fixed[y, x] = fixed
    def clear(s, x, y):
        if s.ok(x, y): s.m[y, x] = ''
    def tone(s, x0, y0, x1, y1, t):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                if s.ok(x, y) and s.m[y, x] and not s.fixed[y, x]: s.t[y, x] = t
    def line(s, x0, y0, x1, y1, mat):
        """部品のさかいの線：輪郭と同じ色"""
        s.rect(x0, y0, x1, y1, mat, LN, True)
    def wood(s, x0, y0, x1, y1, mat, t, d='h', seed=0, planks=0):
        """木の面（添付の木の絵の作り方）：板ごとに、上（左）のふちが明るく、下（右）のふちが暗い。板のさかいは線。
        板の中に、木目のすじ（長さのちがう、こい色のすじと、少しのうすい色のすじ）"""
        import random
        rnd = random.Random(seed)
        s.rect(x0, y0, x1, y1, mat, t)
        L0, L1 = (y0, y1) if d == 'h' else (x0, x1); A0, A1 = (x0, x1) if d == 'h' else (y0, y1)
        n = planks or 1; size = (L1 - L0 + 1) / n; cuts = [L0 + round(i * size) for i in range(n)] + [L1 + 1]
        for i in range(n):
            a, b = cuts[i], cuts[i + 1] - 1
            if i > 0: a += 1; s._set_line(d, cuts[i], A0, A1, mat)
            for u in range(a + 1, b):   # すじ
                pos = A0 + 1 + rnd.randrange(0, 4)
                while pos < A1 - 1:
                    ln = rnd.randrange(3, 9); dark = rnd.random() < .8
                    for v in range(pos, min(A1 - 1, pos + ln)):
                        if (u - a) % 2 == 0 or rnd.random() < .15: s._set(d, u, v, t + (.5 if dark else -.5))
                    pos += ln + rnd.randrange(2, 6)
    def _set(s, d, u, v, t):
        x, y = (v, u) if d == 'h' else (u, v)
        if s.ok(x, y) and s.m[y, x] and not s.fixed[y, x]: s.t[y, x] = t
    def _set_line(s, d, u, A0, A1, mat):
        for v in range(A0, A1 + 1):
            x, y = (v, u) if d == 'h' else (u, v)
            if s.ok(x, y) and s.m[y, x]: s.px(x, y, mat, LN)
    def shade(s, x0, y0, x1, y1, d='h'):
        """光は左上から：上・左のふちを1つ明るく、下・右のふちを1つ暗く（形は左右対称のまま、光とかげだけかえる）"""
        def add(x, y, k):
            if s.ok(x, y) and s.m[y, x] and not s.fixed[y, x]: s.t[y, x] = max(0, min(4, round(s.t[y, x]) + k))
        if d in ('h', 'hv'):
            for x in range(x0, x1 + 1): add(x, y0, -1); add(x, y1, 1)
        if d in ('v', 'hv'):
            for y in range(y0 + (d == 'hv'), y1 + 1 - (d == 'hv')): add(x0, y, -1); add(x1, y, 1)
    def mirror(s, xsum, x_from=0, x_to=None):
        """左半分を右へうつす（左右対称）：x → xsum - x"""
        x_to = x_to if x_to is not None else (xsum - 1) // 2
        for y in range(s.h):
            for x in range(x_from, x_to + 1):
                X = xsum - x
                if s.ok(X, y): s.m[y, X] = s.m[y, x]; s.t[y, X] = s.t[y, x]; s.fixed[y, X] = s.fixed[y, x]
    def round(s, x0, y0, x1, y1, corners='tl tr bl br'):
        for c in corners.split(): s.clear(x0 if c[1] == 'l' else x1, y0 if c[0] == 't' else y1)
    def render(s):
        from scipy.ndimage import binary_fill_holes
        f = s.m != ''; out_t = ~binary_fill_holes(f)   # 外（まわりの透明）。中の穴はふくめない
        p = np.pad(out_t, 1, constant_values=True)
        r1 = f & (p[:-2, 1:-1] | p[2:, 1:-1] | p[1:-1, :-2] | p[1:-1, 2:])
        img = np.zeros((s.h, s.w, 4), np.uint8)
        for y in range(s.h):
            for x in range(s.w):
                if not f[y, x]: continue
                t = LN if r1[y, x] and not s.fixed[y, x] else s.t[y, x]
                img[y, x, :3] = color(s.m[y, x], t); img[y, x, 3] = 255
        return Image.fromarray(img, 'RGBA')

# ---- 座標は、元の絵を半分にした絵（tools/art/furn32/src の絵を、原点を偶数にそろえて BOX で半分）と同じ。原点（ox, oy）も、その原点 ----
def spans(c, rows, mat, t=2):
    for y, (x0, x1) in rows.items(): c.rect(x0, y, x1, y, mat, t)

def chair():
    W = 'wood'
    c = Cv(22, 33)   # 前：左右対称（まん中 x=10.5）
    c.wood(5, 0, 16, 1, W, 1, 'h', 1); c.rect(3, 1, 18, 1, W, 1); c.wood(2, 2, 19, 5, W, 2, 'h', 2); c.tone(2, 2, 19, 2, 1); c.clear(2, 1); c.clear(19, 1)
    c.line(3, 6, 18, 6, W)
    c.wood(3, 7, 6, 12, W, 2, 'v', 3); c.wood(8, 7, 9, 12, W, 2, 'v', 4)   # 柱・板（左）
    for y in range(7, 12): c.clear(7, y); c.clear(10, y)
    c.mirror(21, 3, 10)
    c.line(3, 13, 18, 13, W); c.rect(3, 12, 18, 12, W, 3)
    c.wood(2, 14, 19, 16, W, 1, 'h', 5); c.wood(1, 17, 20, 22, W, 1, 'h', 6); c.rect(2, 14, 19, 14, W, 0)   # 座面の上
    c.wood(1, 23, 20, 24, W, 2, 'h', 7); c.line(2, 25, 19, 25, W)   # 座面の前
    c.wood(2, 26, 5, 31, W, 2, 'v', 8); c.mirror(21, 2, 5)   # 脚
    for x0, x1 in ((3, 6), (15, 18)): c.shade(x0, 7, x1, 12, 'v')
    for x0, x1 in ((8, 9), (12, 13)): c.shade(x0, 7, x1, 11, 'v')
    for x0, x1 in ((2, 5), (16, 19)): c.shade(x0, 26, x1, 31, 'v')
    c.shade(1, 23, 20, 24, 'h')
    s = Cv(21, 34)   # よこ：うしろへかたむいた背もたれ
    spans(s, {1: (3, 6), 2: (3, 6), 3: (2, 6), 4: (2, 6), 5: (2, 6), 6: (1, 6), 7: (1, 6), 8: (1, 7), 9: (1, 7), 10: (1, 7), 11: (1, 7)}, W, 2)
    for y in range(1, 12): x0 = 3 if y < 3 else 2 if y < 6 else 1; s.tone(x0, y, x0, y, 1)
    s.wood(2, 12, 6, 23, W, 2, 'v', 9)
    for y in range(2, 11, 2): s.tone(4 if y < 6 else 3, y, 4 if y < 6 else 3, y + 1, 2.5)
    s.wood(8, 13, 20, 21, W, 1, 'h', 10); s.rect(8, 13, 20, 13, W, 0); s.line(7, 13, 7, 23, W)   # 座面
    s.wood(8, 22, 20, 23, W, 2, 'h', 11); s.line(3, 24, 20, 24, W)
    s.wood(3, 25, 6, 32, W, 2, 'v', 12); s.wood(16, 25, 19, 32, W, 2, 'v', 12)
    for x0, x1 in ((3, 6), (16, 19)): s.shade(x0, 25, x1, 32, 'v')
    b = Cv(21, 31)   # うしろ：左右対称（まん中 x=10）
    b.wood(2, 1, 18, 1, W, 1, 'h', 13); b.wood(1, 2, 19, 6, W, 2, 'h', 14); b.tone(1, 2, 19, 2, 1); b.line(1, 7, 19, 7, W)
    b.rect(1, 8, 19, 15, W, 3); b.wood(1, 8, 3, 15, W, 2, 'v', 15); b.line(4, 8, 4, 15, W); b.wood(5, 8, 7, 15, W, 2, 'v', 16); b.line(8, 8, 8, 15, W); b.wood(9, 8, 10, 15, W, 2, 'v', 17)
    b.mirror(20, 1, 10)
    b.line(1, 16, 19, 16, W); b.rect(1, 17, 19, 17, W, 1); b.rect(1, 18, 19, 20, W, 3); b.line(1, 21, 19, 21, W)
    b.wood(1, 22, 4, 28, W, 2, 'v', 18); b.mirror(20, 1, 4)
    for x0, x1 in ((1, 3), (5, 7), (9, 11), (13, 15), (17, 19)): b.shade(x0, 8, x1, 15, 'v')
    for x0, x1 in ((1, 4), (16, 19)): b.shade(x0, 22, x1, 28, 'v')
    return {'chair': (c, 5, -7), 'chair>1': (s, 5, -12), 'chair>2': (b, 5, -9)}

def table():
    W = 'wood'
    c = Cv(35, 38)   # 左右対称（まん中 x=17）
    c.wood(1, 11, 33, 25, W, 1, 'h', 20); c.clear(1, 11); c.clear(2, 11); c.clear(32, 11); c.clear(33, 11)
    for y in range(12, 17): c.clear(1, y); c.clear(33, y)
    c.rect(3, 12, 31, 12, W, 0)
    c.wood(1, 26, 33, 28, W, 2, 'h', 21); c.line(2, 29, 32, 29, W)   # 天板の前・脚とのさかい
    c.wood(3, 30, 8, 36, W, 2, 'v', 22); c.rect(5, 37, 6, 37, W, 2); c.mirror(34, 3, 8)   # 脚
    for x0, x1 in ((3, 8), (26, 31)): c.shade(x0, 30, x1, 36, 'v')
    c.shade(1, 26, 33, 28, 'h')
    return {'table': (c, -2, -11)}

def bed():
    Y, L = 'ywood', 'cloth'
    c = Cv(32, 41)   # たて：左右対称（まん中 x=15.5）。左半分を描いて写す
    c.rect(4, 4, 15, 31, Y, 3)   # わくの中（ふとんのまわりに見える）
    c.wood(4, 1, 15, 3, Y, 1, 'h', 30); c.rect(4, 1, 15, 1, Y, 0); c.line(4, 3, 15, 3, Y)   # 頭の板
    # まくら：大きく、角が丸い。ふちは線、上が明るく下へかげ
    c.rect(6, 4, 15, 9, L, 0); c.rect(6, 8, 15, 9, L, 1); c.line(7, 4, 15, 4, L); c.line(6, 10, 15, 10, L); c.line(5, 5, 5, 9, L); c.px(6, 5, L, LN); c.px(6, 9, L, LN)
    # 折り返したシーツ：ふとんより外へ（柱の前まで）。両はしは丸い
    c.rect(3, 11, 15, 13, L, 0); c.rect(3, 13, 15, 13, L, 1); c.line(3, 10, 15, 10, L); c.line(3, 14, 15, 14, L); c.line(2, 11, 2, 13, L)
    # かけぶとん：わくから1ドット内がわ。ふちは線、すその角は丸い。すそへ少しずつかげ
    c.rect(5, 15, 15, 30, L, 1); c.rect(5, 26, 15, 27, L, 1.5); c.rect(5, 28, 15, 30, L, 2); c.line(4, 15, 4, 29, L); c.line(6, 31, 15, 31, L); c.px(5, 30, L, LN)
    c.wood(4, 32, 15, 38, Y, 1, 'h', 31); c.rect(4, 33, 15, 33, Y, 0); c.line(4, 32, 15, 32, Y)   # 足の板（1まい）
    c.wood(0, 3, 3, 40, Y, 2, 'v', 32); c.rect(1, 0, 2, 0, Y, 1); c.rect(0, 1, 3, 2, Y, 1); c.px(1, 1, Y, 0); c.line(0, 3, 3, 3, Y)   # 柱と、上の玉
    c.wood(0, 28, 3, 31, Y, 1, 'v', 33); c.line(0, 28, 3, 28, Y); c.line(0, 32, 3, 32, Y)   # 柱の飾り
    c.line(3, 4, 3, 27, Y)
    c.mirror(31, 0, 15)
    for x0, x1 in ((0, 3), (28, 31)): c.shade(x0, 4, x1, 27, 'v'); c.shade(x0, 33, x1, 40, 'v'); c.shade(x0, 29, x1, 31, 'v')
    c.tone(5, 15, 5, 27, 0); c.tone(26, 15, 26, 29, 2.5); c.tone(25, 15, 25, 27, 1.5)   # ふとんの左は明るく、右はかげ
    c.tone(25, 5, 25, 9, 1.5); c.tone(28, 11, 28, 13, 1.5)
    s = Cv(39, 39)   # よこ：頭が左（柱の形は左右同じ）
    s.rect(4, 3, 34, 29, Y, 3)
    # まくら（立っている）：ふちは線、角は丸い。右と下はかげ
    s.rect(5, 4, 9, 21, L, 0); s.rect(9, 5, 9, 21, L, 1.5); s.rect(5, 19, 9, 21, L, 1); s.line(5, 3, 9, 3, L); s.line(4, 4, 4, 21, L); s.line(10, 4, 10, 21, L); s.line(5, 22, 9, 22, L)
    s.rect(4, 23, 10, 29, L, 2); s.rect(4, 27, 10, 29, L, 3); s.line(4, 23, 10, 23, L) if False else None
    # 折り返したシーツ：上は丸く、左が明るい
    s.rect(12, 2, 14, 31, L, 0); s.rect(14, 3, 14, 31, L, 1.5); s.line(11, 2, 11, 31, L); s.line(15, 2, 15, 31, L); s.line(12, 1, 14, 1, L)
    # ふとん：ふちは線、右上の角は丸い。下の、たれた所はかげ
    s.rect(16, 4, 33, 29, L, 1); s.rect(16, 4, 33, 4, L, 0); s.line(16, 3, 33, 3, L); s.line(34, 4, 34, 29, L); s.px(33, 4, L, LN)
    s.rect(16, 23, 33, 24, L, 1.5); s.rect(16, 25, 33, 29, L, 2); s.rect(16, 28, 33, 29, L, 2.5)
    s.wood(4, 30, 34, 34, Y, 1, 'h', 33); s.rect(4, 31, 34, 31, Y, 0); s.line(4, 30, 34, 30, Y)   # よこの板
    s.wood(0, 0, 3, 38, Y, 2, 'v', 34); s.rect(0, 0, 3, 5, Y, 1); s.rect(0, 21, 3, 38, Y, 1.5); s.line(0, 6, 3, 6, Y); s.line(0, 20, 3, 20, Y); s.line(3, 7, 3, 34, Y); s.round(0, 0, 3, 38, 'tl tr')
    s.mirror(38, 0, 3)
    for x0, x1 in ((0, 3), (35, 38)): s.shade(x0, 0, x1, 5, 'v'); s.shade(x0, 7, x1, 19, 'v'); s.shade(x0, 21, x1, 38, 'v')
    return {'bed': (c, 0, -9), 'bed>1': (s, -2, -7)}

def taru():
    B, M = 'barrel', 'metal'
    c = Cv(24, 32)   # 左右対称（まん中 x=11.5）
    rows = {0: (9, 14), 1: (6, 17), 2: (4, 19), 3: (3, 20), 4: (2, 21), 5: (2, 21), 6: (1, 22), 7: (1, 22), 8: (1, 22), 9: (1, 22)}
    rows.update({y: (0, 23) for y in range(10, 24)}); rows.update({24: (1, 22), 25: (1, 22), 26: (2, 21), 27: (2, 21), 28: (2, 21), 29: (3, 20), 30: (5, 18), 31: (8, 15)})
    spans(c, rows, B, 2)
    for i, (x0, x1) in enumerate(((0, 7), (9, 11))): c.wood(x0, 9, x1, 31, B, 2, 'v', 40 + i)   # 胴の板（左半分）
    for y, (x0, x1) in rows.items():
        for x in range(24):
            if not (x0 <= x <= x1): c.clear(x, y)
    lid = {2: (4, 19), 3: (3, 20), 4: (3, 20), 5: (3, 20), 6: (3, 20), 7: (3, 20), 8: (4, 19), 9: (6, 17)}
    for y, (x0, x1) in lid.items(): c.rect(x0, y, x1, y, B, 3)   # ふたのふち
    inner = {3: (6, 17), 4: (4, 19), 5: (4, 19), 6: (4, 19), 7: (5, 18)}
    for y, (x0, x1) in inner.items(): c.rect(x0, y, x1, y, B, 1); c.px(x0 - 1, y, B, LN); c.px(x1 + 1, y, B, LN)
    c.line(6, 2, 17, 2, B); c.line(6, 8, 17, 8, B); c.px(4, 3, B, LN); c.px(5, 3, B, LN); c.px(4, 7, B, LN)
    c.rect(6, 4, 8, 6, B, 0); c.line(9, 3, 9, 7, B)
    c.line(8, 10, 8, 30, B)   # 胴の板のさかい
    c.mirror(23, 0, 11)
    for y, (x0, x1) in rows.items():   # 丸みの光とかげ：左のはしは明るく、右がわはかげ
        if y >= 10:
            c.tone(x0 + 1, y, x0 + 1, y, 1)
            for x in range(16, x1): 
                if not c.fixed[y, x]: c.t[y, x] = min(4, c.t[y, x] + 1)
    def band(y0):   # 金の帯：はば4、まん中ほど下がる。上と下のふちは線
        for x in range(24):
            d = abs(x - 11.5) / 12; dip = round(4 * (1 - d * d))
            for k, t in enumerate((LN, 0 if x < 8 else 1 if x < 16 else 2, 2 if x < 16 else 3, LN)):
                y = y0 + dip + k
                if 0 <= y < 32 and c.m[y, x]: c.px(x, y, M, t, True)
    band(10); band(21)
    return {'taru': (c, 4, -10)}

DESIGNS = {'chair': chair, 'table': table, 'bed': bed, 'taru': taru}

def front_from(parent_img, px0, py0, key):
    """すわった子の前にかさねる部品：本体の絵から、元の部品の形の所を切りとる"""
    meta = json.load(open(os.path.join(SRC, 'meta.json'))); m = meta[key]
    fn = re.sub(r'[^0-9A-Za-z_.-]', lambda q: '_%02x' % ord(q.group()), key)
    a = np.asarray(Image.open(os.path.join(SRC, fn + '.png')).convert('RGBA'))[..., 3] > 100
    P = np.asarray(parent_img); out = np.zeros(P.shape, np.uint8)
    ax, ay = round(m['ax']), round(m['ay']); x0, y0 = ax - ax % 2, ay - ay % 2   # 元の絵の原点を、半分にした絵と同じにそろえる
    for y in range(P.shape[0]):
        for x in range(P.shape[1]):
            sy, sx = (y + py0) * 2 - ay, (x + px0) * 2 - ax
            if 0 <= sy < a.shape[0] and 0 <= sx < a.shape[1] and a[sy:sy + 2, sx:sx + 2].any(): out[y, x] = P[y, x]
    return Image.fromarray(out, 'RGBA')

def build(b):
    res = {}
    for k, (cv, ax, ay) in DESIGNS[b]().items():
        im = cv.render(); res[k] = (im, ax, ay)   # ax, ay：キャンバスの原点（g32）
    if b == 'chair':
        im, ox, oy = res['chair>2']; res['chair>2.front'] = (front_from(im, ox, oy, 'chair>2.front'), ox, oy)
    out = {}
    for k, (im, ox, oy) in res.items():
        bb = im.getbbox(); out[k] = {'f': [im.crop(bb)], 'ax': ox + bb[0], 'ay': oy + bb[1]}
    return out

def compare(b, final, z=6):
    meta = json.load(open(os.path.join(SRC, 'meta.json'))); cells = []
    for k in sorted(final):
        fn = re.sub(r'[^0-9A-Za-z_.-]', lambda q: '_%02x' % ord(q.group()), k)
        s = Image.open(os.path.join(SRC, fn + '.png')).convert('RGBA'); n = final[k]['f'][0]
        cells.append((s.resize((s.width * z // 2, s.height * z // 2), Image.NEAREST), n.resize((n.width * z, n.height * z), Image.NEAREST)))
    W = sum(max(a.width, c.width) + 12 for a, c in cells); Ha = max(a.height for a, _ in cells); H = Ha + max(c.height for _, c in cells) + 20
    sh = Image.new('RGBA', (W, H), (200, 220, 180, 255)); x = 6
    for a, c in cells: sh.alpha_composite(a, (x, 6)); sh.alpha_composite(c, (x, 14 + Ha)); x += max(a.width, c.width) + 12
    return sh

if __name__ == '__main__':
    a = sys.argv[1:]; put = a and a[0] == '--put'
    if put: a = a[1:]
    d = a[0]; ids = a[1:] or list(DESIGNS); os.makedirs(d, exist_ok=True)
    if put:
        import chips
        h, C = chips.load_imgs()
    for b in ids:
        final = build(b)
        for k, v in final.items():
            v['f'][0].save(os.path.join(d, re.sub(r'[^0-9A-Za-z_.-]', lambda q: '_%02x' % ord(q.group()), k) + '.png'))
            if put: C[k] = {'ax': v['ax'], 'ay': v['ay'], 'w': v['f'][0].width, 'h': v['f'][0].height, 'f': v['f']}
            print(k, v['f'][0].size, v['ax'], v['ay'])
        compare(b, final).save(os.path.join(d, 'cmp_' + b + '.png'))
    if put: chips.pack_imgs(h, C)
