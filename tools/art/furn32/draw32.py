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
LINE = {'wood': '#b98750', 'ywood': '#cb953f', 'cloth': '#c3c9d2', 'barrel': '#b97c4a', 'metal': '#888e99'}   # かげ（side）より少しだけこい（こいと「濃すぎる」と言われた）
LN = 99   # 線（輪郭・さかい）
def color(mat, t):
    if t == LN: return hx(LINE[mat])
    L = MAT[mat]; t = max(0, min(4, t)); i = int(t); f = t - i
    if f == 0 or i == 4: return hx(L[i])
    A, B = hx(L[i]), hx(L[i + 1]); return tuple(round(A[k] * (1 - f) + B[k] * f) for k in range(3))   # .5：木目・中間の色

K = 2   # 1マス64ドットで描く（設計の座標は、元の絵を半分にした絵の座標。1つを K×K ドットにして、細かい所はドットで描く）

class Cv:
    """t は色のはしごの番号（.5 は中間の色）か LN（線）。座標は半分の絵の座標（ドットは K 倍）"""
    def __init__(s, w, h): s.W, s.H = w * K, h * K; s.m = np.full((s.H, s.W), '', object); s.t = np.zeros((s.H, s.W)); s.fixed = np.zeros((s.H, s.W), bool)
    def ok(s, X, Y): return 0 <= X < s.W and 0 <= Y < s.H
    def box(s, x0, y0, x1, y1): return range(y0 * K, (y1 + 1) * K), range(x0 * K, (x1 + 1) * K)
    def rect(s, x0, y0, x1, y1, mat, t=2, fixed=False):
        ys, xs = s.box(x0, y0, x1, y1)
        for Y in ys:
            for X in xs:
                if s.ok(X, Y): s.m[Y, X] = mat; s.t[Y, X] = t; s.fixed[Y, X] = fixed
    def px(s, x, y, mat, t, fixed=True): s.rect(x, y, x, y, mat, t, fixed)
    def fpx(s, X, Y, mat, t, fixed=True):
        if s.ok(X, Y): s.m[Y, X] = mat; s.t[Y, X] = t; s.fixed[Y, X] = fixed
    def clear(s, x, y):
        ys, xs = s.box(x, y, x, y)
        for Y in ys:
            for X in xs:
                if s.ok(X, Y): s.m[Y, X] = ''
    def tone(s, x0, y0, x1, y1, t):
        ys, xs = s.box(x0, y0, x1, y1)
        for Y in ys:
            for X in xs:
                if s.ok(X, Y) and s.m[Y, X] and not s.fixed[Y, X]: s.t[Y, X] = t
    def line(s, x0, y0, x1, y1, mat, w=None):
        """部品のさかいの線：輪郭と同じ色。はばは1ドット（よこの線は下がわ・たての線は右がわに寄せる。w=2 で2ドット）"""
        ys, xs = s.box(x0, y0, x1, y1); horiz = (x1 - x0) >= (y1 - y0); w = w or 1
        for Y in ys:
            for X in xs:
                inner = (Y % K) >= K - w if horiz else (X % K) >= K - w
                if s.ok(X, Y) and inner: s.m[Y, X] = mat; s.t[Y, X] = LN; s.fixed[Y, X] = True
    def wood(s, x0, y0, x1, y1, mat, t, d='h', seed=0, planks=0):
        s.rect(x0, y0, x1, y1, mat, t); s.wood_on(x0, y0, x1, y1, mat, t, d, seed)
    def wood_on(s, x0, y0, x1, y1, mat, t, d='h', seed=0):
        """木目：部材の長いほうにそって、長さのちがうすじ（こい色が多く、うすい色が少し）。いまある形はかえない"""
        import random
        rnd = random.Random(seed)
        ys, xs = s.box(x0, y0, x1, y1); L0, L1 = (ys[0], ys[-1]) if d == 'h' else (xs[0], xs[-1]); A0, A1 = (xs[0], xs[-1]) if d == 'h' else (ys[0], ys[-1])
        for u in range(L0 + 2, L1 - 1, 2):
            pos = A0 + 2 + rnd.randrange(0, 6)
            while pos < A1 - 2:
                ln = rnd.randrange(5, 16); dark = rnd.random() < .78
                for v in range(pos, min(A1 - 2, pos + ln)):
                    X, Y = (v, u) if d == 'h' else (u, v)
                    if s.ok(X, Y) and s.m[Y, X] == mat and not s.fixed[Y, X]: s.t[Y, X] = s.t[Y, X] + (.5 if dark else -.5)
                pos += ln + rnd.randrange(3, 10)
    def shade(s, x0, y0, x1, y1, d='h'):
        """光は左上から：上・左のふちを明るく、下・右のふちを暗く（形は左右対称のまま、光とかげだけかえる）"""
        ys, xs = s.box(x0, y0, x1, y1)
        def add(X, Y, k):
            if s.ok(X, Y) and s.m[Y, X] and not s.fixed[Y, X]: s.t[Y, X] = max(0, min(4, round(s.t[Y, X]) + k))
        if d in ('h', 'hv'):
            for X in xs: add(X, ys[0], -1); add(X, ys[-1], 1)
        if d in ('v', 'hv'):
            for Y in ys: add(xs[0], Y, -1); add(xs[-1], Y, 1)
    def mirror(s, xsum, x_from=0, x_to=None):
        """左半分を右へうつす（左右対称）：半分の座標の x → xsum - x"""
        x_to = x_to if x_to is not None else (xsum - 1) // 2
        S = (xsum + 1) * K - 1
        for Y in range(s.H):
            for X in range(x_from * K, (x_to + 1) * K):
                X2 = S - X
                if s.ok(X2, Y): s.m[Y, X2] = s.m[Y, X]; s.t[Y, X2] = s.t[Y, X]; s.fixed[Y, X2] = s.fixed[Y, X]
    def rrect(s, x0, y0, x1, y1, mat, t=2, r=3, border=False, corners='tl tr bl br', fixed=False):
        """角を少しだけ丸めた四角（r は、こまかいドットでの半径。丸めすぎない）。border：ふちに1ドットの線（中の部品のふち）"""
        import math
        X0, Y0, X1, Y1 = x0 * K, y0 * K, (x1 + 1) * K - 1, (y1 + 1) * K - 1
        cut = [max(0, round(r - math.sqrt(max(0, r * r - (r - i - .5) ** 2)))) for i in range(r)]
        def inside(X, Y):
            if not (X0 <= X <= X1 and Y0 <= Y <= Y1): return False
            for c in corners.split():
                cy = Y - Y0 if c[0] == 't' else Y1 - Y; cx = X - X0 if c[1] == 'l' else X1 - X
                if cy < r and cx < cut[cy]: return False
            return True
        for Y in range(Y0, Y1 + 1):
            for X in range(X0, X1 + 1):
                if not inside(X, Y) or not s.ok(X, Y): continue
                edge = border and any(not inside(X + dx, Y + dy) for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))
                s.m[Y, X] = mat; s.t[Y, X] = LN if edge else t; s.fixed[Y, X] = edge or fixed
    def round(s, x0, y0, x1, y1, corners='tl tr bl br'):
        """角のドットを1つだけ落とす（こまかいドットで）"""
        for c in corners.split():
            X = x0 * K if c[1] == 'l' else (x1 + 1) * K - 1; Y = y0 * K if c[0] == 't' else (y1 + 1) * K - 1
            if s.ok(X, Y): s.m[Y, X] = ''
    def render(s):
        """輪郭：まわりの透明にふれるドットは線（1ドット）。下と右（かげのがわ）は、もう1ドット太く（線のはばは1〜2ドット）"""
        from scipy.ndimage import binary_fill_holes
        f = s.m != ''; out_t = ~binary_fill_holes(f)
        p = np.pad(out_t, 1, constant_values=True)
        r1 = f & (p[:-2, 1:-1] | p[2:, 1:-1] | p[1:-1, :-2] | p[1:-1, 2:])
        q = np.pad(out_t, 2, constant_values=True)
        r2 = f & ~r1 & (q[4:, 2:-2] | q[2:-2, 4:])   # 2つ下・2つ右が外
        img = np.zeros((s.H, s.W, 4), np.uint8)
        for Y in range(s.H):
            for X in range(s.W):
                if not f[Y, X]: continue
                t = LN if (r1[Y, X] or r2[Y, X]) and not s.fixed[Y, X] else s.t[Y, X]
                img[Y, X, :3] = color(s.m[Y, X], t); img[Y, X, 3] = 255
        return Image.fromarray(img, 'RGBA')

# ---- 座標は、元の絵を半分にした絵（tools/art/furn32/src の絵を、原点を偶数にそろえて BOX で半分）と同じ。原点（ox, oy）も、その原点 ----
def spans(c, rows, mat, t=2):
    for y, (x0, x1) in rows.items(): c.rect(x0, y, x1, y, mat, t)

def chair():
    W = 'wood'
    c = Cv(22, 33)   # 前：左右対称（まん中 x=10.5）
    c.rrect(2, 0, 19, 5, W, 2, 5, corners='tl tr'); c.wood_on(2, 0, 19, 5, W, 2, 'h', 2); c.tone(2, 0, 19, 1, 1)   # 背の上の板（角は丸い）
    c.line(3, 6, 18, 6, W)
    c.wood(3, 7, 6, 12, W, 2, 'v', 3); c.wood(8, 7, 9, 12, W, 2, 'v', 4)   # 柱・板（左）
    for y in range(7, 12): c.clear(7, y); c.clear(10, y)
    c.mirror(21, 3, 10)
    c.line(3, 13, 18, 13, W); c.rect(3, 12, 18, 12, W, 3)
    c.rrect(1, 14, 20, 24, W, 1, 5); c.wood_on(1, 14, 20, 22, W, 1, 'h', 6); c.tone(2, 14, 19, 14, 0)   # 座面（角は丸い）
    c.tone(1, 23, 20, 24, 2); c.line(3, 25, 18, 25, W)
    c.rrect(2, 26, 5, 31, W, 2, 2, corners='bl br'); c.wood_on(2, 26, 5, 31, W, 2, 'v', 8); c.mirror(21, 2, 5)   # 脚
    for x0, x1 in ((3, 6), (15, 18)): c.shade(x0, 7, x1, 12, 'v')
    for x0, x1 in ((8, 9), (12, 13)): c.shade(x0, 7, x1, 11, 'v')
    for x0, x1 in ((2, 5), (16, 19)): c.shade(x0, 26, x1, 30, 'v')
    s = Cv(21, 34)   # よこ：うしろへかたむいた背もたれ
    spans(s, {1: (3, 6), 2: (3, 6), 3: (2, 6), 4: (2, 6), 5: (2, 6), 6: (1, 6), 7: (1, 6), 8: (1, 7), 9: (1, 7), 10: (1, 7), 11: (1, 7)}, W, 2)
    s.clear(3, 1); s.clear(6, 1)
    for y in range(1, 12): x0 = 3 if y < 3 else 2 if y < 6 else 1; s.tone(x0, y, x0, y, 1)
    s.wood(2, 12, 6, 23, W, 2, 'v', 9)
    s.rrect(8, 13, 20, 23, W, 1, 4, corners='tr br'); s.wood_on(8, 13, 20, 21, W, 1, 'h', 10); s.tone(8, 13, 19, 13, 0); s.tone(8, 22, 20, 23, 2); s.line(7, 13, 7, 23, W)   # 座面
    s.line(3, 24, 20, 24, W)
    for x0 in (3, 16): s.rrect(x0, 25, x0 + 3, 32, W, 2, 2, corners='bl br'); s.wood_on(x0, 25, x0 + 3, 32, W, 2, 'v', 12); s.shade(x0, 25, x0 + 3, 31, 'v')
    b = Cv(21, 31)   # うしろ：左右対称（まん中 x=10）
    b.rrect(1, 1, 19, 6, W, 2, 5, corners='tl tr'); b.wood_on(1, 1, 19, 6, W, 2, 'h', 14); b.tone(1, 1, 19, 2, 1); b.line(1, 7, 19, 7, W)
    b.rect(1, 8, 19, 15, W, 3); b.wood(1, 8, 3, 15, W, 2, 'v', 15); b.line(4, 8, 4, 15, W); b.wood(5, 8, 7, 15, W, 2, 'v', 16); b.line(8, 8, 8, 15, W); b.wood(9, 8, 10, 15, W, 2, 'v', 17)
    b.mirror(20, 1, 10)
    b.line(1, 16, 19, 16, W); b.rect(1, 17, 19, 17, W, 1); b.rect(1, 18, 19, 20, W, 3); b.line(1, 21, 19, 21, W)
    b.rrect(1, 22, 4, 28, W, 2, 2, corners='bl br'); b.wood_on(1, 22, 4, 28, W, 2, 'v', 18); b.mirror(20, 1, 4)
    for x0, x1 in ((1, 3), (5, 7), (9, 11), (13, 15), (17, 19)): b.shade(x0, 8, x1, 15, 'v')
    for x0, x1 in ((1, 4), (16, 19)): b.shade(x0, 22, x1, 27, 'v')
    return {'chair': (c, 5, -7), 'chair>1': (s, 5, -12), 'chair>2': (b, 5, -9)}

def table():
    W = 'wood'
    c = Cv(35, 38)   # 左右対称（まん中 x=17）
    c.rrect(1, 11, 33, 28, W, 1, 5); c.wood_on(1, 11, 33, 25, W, 1, 'h', 20); c.tone(2, 11, 32, 11, 0)   # 天板（角は丸い）
    c.tone(1, 26, 33, 28, 2); c.wood_on(1, 26, 33, 28, W, 2, 'h', 21); c.line(4, 29, 30, 29, W)
    c.rrect(3, 30, 8, 37, W, 2, 3, corners='bl br'); c.wood_on(3, 30, 8, 37, W, 2, 'v', 22); c.mirror(34, 3, 8)   # 脚
    for x0, x1 in ((3, 8), (26, 31)): c.shade(x0, 30, x1, 36, 'v')
    return {'table': (c, -2, -11)}

def bed():
    """持ち主の見本（tools/art/furn32/ref/bed.png）の形：頭の板・まくら・折り返した白いシーツ・ふちがたれたかけぶとん・短い脚。色は、黄色い木と白い布"""
    Y, L = 'ywood', 'cloth'
    c = Cv(32, 41)   # たて：頭が上。左右対称（まん中 x=15.5）
    c.rrect(3, 0, 28, 8, Y, 2, 6, corners='tl tr'); c.wood_on(3, 0, 28, 8, Y, 2, 'v', 30); c.tone(3, 0, 28, 1, 0); c.tone(3, 2, 28, 2, 1)   # 頭の板（上の角は大きく丸い）
    c.rrect(2, 7, 29, 14, L, 1, 3, corners='tl tr')   # しきぶとんの上のシーツ
    c.rrect(7, 4, 24, 12, L, 0, 4, border=True); c.rect(8, 10, 23, 11, L, 1.5, True); c.rect(8, 13, 23, 13, L, 2)   # まくら（下にかげ）
    c.rrect(1, 14, 30, 18, L, 0, 3, border=True); c.rect(2, 17, 29, 17, L, 1.5, True); c.rect(2, 19, 29, 19, L, 2)   # 折り返したシーツ（下にかげ）
    c.rrect(1, 19, 30, 37, L, 1, 5, corners='bl br')   # かけぶとん
    c.rect(1, 30, 30, 33, L, 1.5); c.rect(4, 32, 27, 32, L, 0)   # すそのつや（見本の明るいすじ）
    c.line(1, 34, 30, 34, L); c.tone(1, 35, 30, 37, 2.5); c.line(4, 35, 4, 37, L); c.line(27, 35, 27, 37, L)   # たれたふち（前）と、角のしわ
    c.rrect(3, 38, 5, 40, Y, 2, 2, corners='bl br'); c.rrect(26, 38, 28, 40, Y, 2, 2, corners='bl br')   # 脚
    c.tone(1, 19, 1, 30, 0.5); c.tone(30, 19, 30, 33, 2); c.tone(29, 19, 29, 30, 1.5); c.tone(16, 35, 30, 36, 3)   # ふとんの左は明るく、右はかげ
    c.shade(3, 3, 28, 7, 'v'); c.tone(23, 6, 23, 10, 1.5)
    for x0, x1 in ((3, 5), (26, 28)): c.shade(x0, 38, x1, 39, 'v')
    s = Cv(39, 39)   # よこ：頭が左
    s.rrect(0, 0, 4, 31, Y, 2, 3, corners='tl tr'); s.wood_on(0, 0, 4, 31, Y, 2, 'v', 33); s.tone(0, 0, 4, 1, 0); s.tone(0, 2, 1, 31, 1); s.line(2, 3, 2, 31, Y)   # 頭の板（よこから）
    s.rrect(5, 4, 37, 29, L, 1, 3, corners='tr')   # シーツ・しきぶとん
    s.rrect(5, 5, 12, 21, L, 0, 3, border=True); s.rect(10, 6, 11, 20, L, 1.5, True); s.rect(6, 22, 12, 22, L, 2)   # まくら
    s.rrect(13, 2, 18, 25, L, 0, 3, border=True, corners='tl tr'); s.rect(17, 3, 17, 24, L, 1.5, True); s.rect(19, 4, 19, 24, L, 2)   # 折り返したシーツ
    s.rrect(19, 3, 37, 31, L, 1, 4, corners='tr br'); s.rect(20, 4, 36, 4, L, 0); s.rect(35, 5, 37, 24, L, 1.5); s.rect(21, 23, 32, 23, L, 0)   # かけぶとんの上
    s.rrect(13, 25, 37, 31, L, 2.5, 3, corners='br'); s.line(13, 25, 37, 25, L); s.rect(13, 31, 36, 31, L, 3); s.line(34, 27, 34, 31, L)   # たれたふち（前）と、しわ
    s.rect(5, 25, 12, 29, L, 2.5); s.line(5, 25, 12, 25, L)   # 頭のほうの、しきぶとんのよこ
    s.wood(5, 30, 12, 31, Y, 3, 'h', 34)
    for x0 in (1, 14, 33): s.rrect(x0, 32, x0 + 2, 36, Y, 2, 2, corners='bl br'); s.shade(x0, 32, x0 + 2, 35, 'v')   # 脚
    return {'bed': (c, 0, -9), 'bed>1': (s, -2, -7)}

def taru():
    B, M = 'barrel', 'metal'
    c = Cv(24, 32)   # 左右対称（まん中 x=11.5）
    rows = {0: (9, 14), 1: (6, 17), 2: (4, 19), 3: (3, 20), 4: (2, 21), 5: (2, 21), 6: (1, 22), 7: (1, 22), 8: (1, 22), 9: (1, 22)}
    rows.update({y: (0, 23) for y in range(10, 24)}); rows.update({24: (1, 22), 25: (1, 22), 26: (2, 21), 27: (2, 21), 28: (2, 21), 29: (3, 20), 30: (5, 18), 31: (8, 15)})
    spans(c, rows, B, 2)
    for i, (x0, x1) in enumerate(((0, 7), (9, 11))): c.wood_on(x0, 9, x1, 31, B, 2, 'v', 40 + i)   # 胴の板（左半分）
    # 形：半分の絵の行のはばを、こまかいドットでなめらかにつなぐ（2ドットの段にしない）
    hw = {y: (x1 - x0 + 1) * K / 2 for y, (x0, x1) in rows.items()}; cx = (c.W - 1) / 2
    for Y in range(c.H):
        u = (Y + .5) / K - .5; y0 = max(0, min(31, int(np.floor(u)))); y1 = min(31, y0 + 1); f = min(1, max(0, u - y0))
        w = hw[y0] * (1 - f) + hw[y1] * f
        for X in range(c.W):
            if abs(X - cx) > w - .5: s_ = c.m[Y, X] = ''
            elif not c.m[Y, X]: c.fpx(X, Y, B, 2, False)
    lid = {2: (4, 19), 3: (3, 20), 4: (3, 20), 5: (3, 20), 6: (3, 20), 7: (3, 20), 8: (4, 19), 9: (6, 17)}
    for y, (x0, x1) in lid.items(): c.rect(x0, y, x1, y, B, 3)   # ふたのふち
    inner = {3: (6, 17), 4: (4, 19), 5: (4, 19), 6: (4, 19), 7: (5, 18)}
    for y, (x0, x1) in inner.items(): c.rect(x0, y, x1, y, B, 1); c.px(x0 - 1, y, B, LN); c.px(x1 + 1, y, B, LN)
    c.line(6, 2, 17, 2, B); c.line(6, 8, 17, 8, B); c.px(4, 3, B, LN); c.px(5, 3, B, LN); c.px(4, 7, B, LN)
    c.rect(6, 4, 8, 6, B, 0); c.line(9, 3, 9, 7, B)
    c.line(8, 10, 8, 30, B)   # 胴の板のさかい
    c.mirror(23, 0, 11)
    for Y in range(18, c.H):   # 丸みの光とかげ：左のはしは明るく、右がわはかげ
        xs = [X for X in range(c.W) if c.m[Y, X]]
        if not xs: continue
        for X in xs:
            if c.fixed[Y, X]: continue
            if X in (xs[0] + 2, xs[0] + 3): c.t[Y, X] = max(0, c.t[Y, X] - 1)
            elif X >= 32: c.t[Y, X] = min(4, c.t[Y, X] + 1)
    def band(y0):   # 金の帯：はば8ドット、まん中ほど下がる（こまかいドットで、なめらかに）。上と下のふちは線
        for X in range(c.W):
            d = abs(X - (c.W - 1) / 2) / (c.W / 2); dip = round(8 * (1 - d * d))
            for k in range(8):
                Y = y0 * K + dip + k
                t = LN if k in (0, 7) else (0 if X < 16 else 1 if X < 32 else 2) if k < 4 else (2 if X < 32 else 3)
                if c.ok(X, Y) and c.m[Y, X]: c.fpx(X, Y, M, t)
    band(10); band(21)
    return {'taru': (c, 4, -10)}

DESIGNS = {'chair': chair, 'table': table, 'bed': bed, 'taru': taru}

def front_from(parent_img, px0, py0, key):
    """すわった子の前にかさねる部品：本体の絵から、元の部品の形の所を切りとる（どちらも1マス64ドット）"""
    meta = json.load(open(os.path.join(SRC, 'meta.json'))); m = meta[key]
    fn = re.sub(r'[^0-9A-Za-z_.-]', lambda q: '_%02x' % ord(q.group()), key)
    a = np.asarray(Image.open(os.path.join(SRC, fn + '.png')).convert('RGBA'))[..., 3] > 100
    P = np.asarray(parent_img); out = np.zeros(P.shape, np.uint8); ax, ay = round(m['ax']), round(m['ay'])
    for y in range(P.shape[0]):
        for x in range(P.shape[1]):
            sy, sx = y + py0 - ay, x + px0 - ax
            if 0 <= sy < a.shape[0] and 0 <= sx < a.shape[1] and a[sy, sx]: out[y, x] = P[y, x]
    return Image.fromarray(out, 'RGBA')

def build(b):
    res = {}
    for k, (cv, ax, ay) in DESIGNS[b]().items():
        res[k] = (cv.render(), ax * K, ay * K)   # 原点（1マス64ドット）
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
        cells.append((s.resize((s.width * z // 2, s.height * z // 2), Image.NEAREST), n.resize((n.width * z // 2, n.height * z // 2), Image.NEAREST)))
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
            if put: C[k] = {'ax': v['ax'], 'ay': v['ay'], 'w': v['f'][0].width, 'h': v['f'][0].height, 'g': 64, 'f': v['f']}
            print(k, v['f'][0].size, v['ax'], v['ay'])
        compare(b, final).save(os.path.join(d, 'cmp_' + b + '.png'))
    if put: chips.pack_imgs(h, C)
