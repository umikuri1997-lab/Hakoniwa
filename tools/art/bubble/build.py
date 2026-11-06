#!/usr/bin/env python3
"""ふきだしの絵（30こ）を、32×32 のドット絵として描いて、1まいの WebP（6列×5行、192×160）にする。
もらった絵（sheet.png）は見本。ちぢめた絵はでこぼこ・にじみ・2ドットの輪郭が出るので、ここで形（円・だ円・多角形・線）から
ドットをきめて描く（ドットのまん中が形の中なら、ぬる）。
- 輪郭は1ドット：形の外がわのドットと、うしろの部品とのさかいのドットを、その部品の輪郭の色（ぬり色より少し暗い色）に。
- かげは、右下のふちの内がわ1ドット。光は小さな形で。うすさは、あり・なしだけ。まわり1ドットはあける。
使い方：python3 tools/art/bubble/build.py <出力フォルダ>   出力：bubble.png（確認用）・bubble.webp"""
import sys, os, math, hashlib, numpy as np
from PIL import Image

NAMES = 'spark box fire drops coffee basket hammer drop heart clap wave note sprout pick spring axe dizzy zzz gheart fish lantern firework gift pan chestnut notes house rice dots q'.split()

# ---- 形（ドットのまん中 x+.5, y+.5 で調べる）----
def C(cx, cy, r): return lambda x, y: (x - cx) ** 2 + (y - cy) ** 2 <= r * r
def El(cx, cy, rx, ry, a=0):
    ca, sa = math.cos(math.radians(a)), math.sin(math.radians(a))
    def f(x, y):
        u, v = (x - cx) * ca + (y - cy) * sa, -(x - cx) * sa + (y - cy) * ca
        return (u / rx) ** 2 + (v / ry) ** 2 <= 1
    return f
def R(x0, y0, x1, y1): return lambda x, y: x0 <= x <= x1 and y0 <= y <= y1  # ドットの番号で（両はし入る）、まん中で調べる
def P(*pts):
    def f(x, y):
        ins = False; n = len(pts)
        for i in range(n):
            (x1, y1), (x2, y2) = pts[i], pts[(i + 1) % n]
            if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1: ins = not ins
        return ins
    return f
def L(x0, y0, x1, y1, w):  # 太さ w の線（はしは丸い）
    def f(x, y):
        dx, dy = x1 - x0, y1 - y0; t = max(0, min(1, ((x - x0) * dx + (y - y0) * dy) / (dx * dx + dy * dy)))
        return (x - x0 - t * dx) ** 2 + (y - y0 - t * dy) ** 2 <= w * w / 4
    return f
def OR(cx, cy, ln, w, a):  # 向きのある四角
    ca, sa = math.cos(math.radians(a)), math.sin(math.radians(a))
    return lambda x, y: abs((x - cx) * ca + (y - cy) * sa) <= ln / 2 and abs(-(x - cx) * sa + (y - cy) * ca) <= w / 2
def Star4(cx, cy, r, p=.55): return lambda x, y: (abs(x - cx) / r) ** p + (abs(y - cy) / r) ** p <= 1
def Star5(cx, cy, r, ri):
    pts = [(cx + (r if i % 2 == 0 else ri) * math.sin(i * math.pi / 5), cy - (r if i % 2 == 0 else ri) * math.cos(i * math.pi / 5)) for i in range(10)]
    return P(*pts)
def U(*fs): return lambda x, y: any(f(x, y) for f in fs)
def I(*fs): return lambda x, y: all(f(x, y) for f in fs)
def D(a, *bs): return lambda x, y: a(x, y) and not any(b(x, y) for b in bs)
def Px(pts): s = set(pts); return lambda x, y: (int(x), int(y)) in s  # ドットをじかに
def Ring(cx, cy, r0, r1, a0=0, a1=360):  # 円の帯（角度は、右0・下90）
    def f(x, y):
        d = math.hypot(x - cx, y - cy); a = math.degrees(math.atan2(y - cy, x - cx)) % 360
        return r0 <= d <= r1 and (a0 <= a <= a1 if a0 <= a1 else (a >= a0 or a <= a1))
    return f
def MX(f, c=15.5): return lambda x, y: f(x, y) or f(2 * c - x, y)  # 左右対称に

def hx(h): h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))

# 部品：(形, ぬり色, 輪郭の色 or None, かげの色 or None)。あとの部品ほど手前。
def part(f, fill, line=None, shade=None): return (f, fill, line, shade)
Y, YL, YS = '#f8d65c', '#d9a330', '#eebd3e'       # 黄
WD, WDL, WDS, WDH = '#eab47c', '#a8703f', '#d39a62', '#f6cf9e'  # 木
BL, BLL, BLS = '#8cc6f2', '#4d8cc8', '#6eaee6'    # 水
PK, PKL, PKS = '#f797aa', '#c75a70', '#e57e94'    # ピンク
GR, GRL, GRS = '#b6de84', '#6a9c42', '#9ccc6c'    # みどり
PU, PUL, PUS = '#b384d6', '#7a52a8', '#9c6cc4'    # むらさき
GY, GYL, GYS = '#c4bcbe', '#7c7276', '#aaa0a4'    # 鉄
SK, SKL, SKS = '#f8d2ae', '#c48e66', '#eab88e'    # はだ
OR_, ORL, ORS = '#f8924a', '#d0532e', '#ee7a38'   # 火
CR, CRL = '#fbf3e4', '#b8916a'                    # クリーム
W = '#ffffff'

def steam(x0, y0, h, ph=0):  # ゆらゆらの湯気（1ドット）
    return Px([(x0 + (1 if ((i + ph) // 2) % 2 else 0), y0 + i) for i in range(h)])

ART = {
 'spark': [part(Star4(13.5, 16.5, 11, .7), Y, YL, YS), part(Star4(5.5, 5.5, 4.5, .7), Y, YL), part(Star4(24.5, 25.5, 4.5, .7), Y, YL), part(R(11, 12, 12, 14), '#fff5c8')],
 'box': [part(R(4, 6, 27, 26), WD, WDL, WDS), part(R(7, 9, 24, 23), WDH, WDL),
         part(I(L(7.5, 23.5, 24.5, 9.5, 3.2), R(7, 9, 24, 23)), WD, WDL)],
 'fire': [part(U(C(15.5, 20, 9.5), P((6.4, 17), (10, 9), (12, 11), (15.5, 2), (19, 11), (21, 9), (24.6, 17))), OR_, ORL, ORS),
          part(U(C(15.5, 23, 5), P((10.6, 22), (15.5, 11), (20.4, 22))), Y, '#f5a838')],
 'drops': [part(U(C(12, 20.5, 7.5), P((4.7, 18.5), (12, 6), (19.3, 18.5))), BL, BLL, BLS), part(R(8, 18, 8, 21), W),
           part(U(C(24.5, 11, 4.2), P((20.4, 10), (24.5, 2), (28.6, 10))), BL, BLL, BLS)],
 'coffee': [part(D(El(23.5, 18.5, 5, 4.5), El(23.5, 18.5, 2.2, 1.8)), CR, CRL),
            part(U(R(4, 12, 21, 20), El(13, 20, 9, 6.6)), CR, CRL, '#eedcc2'), part(R(6, 13, 19, 15), '#8a5a3a'),
            part(steam(9, 3, 7), '#9a7a5c'), part(steam(14, 3, 7, 1), '#9a7a5c')],
 'basket': [part(D(Ring(15.5, 14, 8, 10, 180, 360), R(0, 15, 31, 31)), WD, WDL),
            part(P((4, 16), (28, 16), (25, 28), (7, 28)), WD, WDL, WDS),
            part(I(P((4, 16), (28, 16), (25, 28), (7, 28)), lambda x, y: y > 18 and (int(x) // 3 + int(y) // 2) % 2 == 0), WDS),
            part(R(3, 13, 28, 16), WDH, WDL)],
 'hammer': [part(L(6, 26, 17, 15, 4.2), WD, WDL, WDS), part(OR(18.5, 12.5, 18, 8, 45), GY, GYL, GYS), part(Px([(15, 7), (14, 8), (13, 9)]), '#e8e2e4')],
 'drop': [part(U(C(15.5, 19.5, 9.5), P((6.3, 17.5), (15.5, 2), (24.7, 17.5))), BL, BLL, BLS), part(R(10, 17, 10, 21), W), part(R(11, 22, 11, 22), W)],
 'heart': [part(MX(U(C(10.5, 11.5, 6.6), P((4, 13.5), (16.5, 13.5), (16.5, 28.5)))), PK, PKL, PKS), part(R(8, 9, 9, 10), W)],
 'gheart': [part(MX(U(C(10.5, 11.5, 6.6), P((4, 13.5), (16.5, 13.5), (16.5, 28.5)))), GR, GRL, GRS), part(R(8, 9, 9, 10), W)],
 'clap': [part(U(El(12.5, 19, 6, 9, -25), L(9, 12, 12, 5, 4)), SK, SKL, SKS),
          part(U(El(17.5, 20.5, 6, 9, -25), L(13, 25, 9, 21, 3.6)), SK, SKL, SKS),
          part(Px([(18, 15), (19, 16), (20, 17), (19, 19), (20, 20), (21, 21)]), SKL),
          part(L(21, 3, 21.5, 6, 1.6), YL), part(L(25.5, 5, 24, 8, 1.6), YL), part(L(28.5, 10, 25.5, 10.5, 1.6), YL)],
 'wave': [part(U(El(13, 21, 8, 8.5), L(7, 18, 4, 13, 3.6), L(9, 14, 8, 6, 3.6), L(13, 13, 13, 4.5, 3.6), L(16.5, 14, 17.5, 6, 3.6), L(19.5, 16, 21, 9.5, 3.6)), SK, SKL, SKS),
          part(Ring(19, 13, 6, 7.3, 280, 340), YL), part(Ring(19, 13, 9.5, 10.8, 285, 345), YL)],
 'note': [part(U(El(10, 23.5, 5.6, 4.2, -20), R(14, 5, 16, 22), P((14, 5), (25, 5), (25, 14), (23, 14), (23, 9), (16, 9))), PU, PUL, PUS), part(R(7, 22, 8, 22), '#d8b8ee')],
 'sprout': [part(R(14, 15, 17, 25), GR, GRL), part(El(9, 12, 6.5, 4.6, 20), GR, GRL, GRS), part(El(22, 12, 6.5, 4.6, -20), GR, GRL, GRS),
            part(El(15.5, 27, 9, 3), WD, WDL)],
 'pick': [part(L(5, 27, 19, 13, 4.2), WD, WDL, WDS),
          part(I(Ring(19, 25, 13, 18, 200, 330), lambda x, y: x - y < 21), GY, GYL, GYS)],
 'spring': [part(C(15.5 + 10.5 * math.cos(a), 21.5 + 5.5 * math.sin(a), 4.3), GY, GYL, GYS) for a in sorted([k * math.pi / 4 for k in range(8)], key=math.sin)][:5] +
           [part(El(15.5, 20.5, 7, 3.2), BL, BLL), part(R(12, 19, 14, 19), W)] +
           [part(C(15.5 + 10.5 * math.cos(a), 21.5 + 5.5 * math.sin(a), 4.3), GY, GYL, GYS) for a in sorted([k * math.pi / 4 for k in range(8)], key=math.sin)][5:] +
           [part(steam(9, 3, 8), BLL), part(steam(15, 2, 8, 1), BLL), part(steam(21, 3, 8), BLL)],
 'axe': [part(L(6, 28, 18, 11, 4.2), WD, WDL, WDS),
         part(P((13, 7), (18, 3), (25, 7), (28, 13), (26, 20), (21, 19), (15, 12)), GY, GYL, GYS), part(Px([(24, 8), (25, 9), (26, 10)]), '#eeeaec')],
 'dizzy': [part(Star5(9, 10, 6.5, 3.2), Y, YL, YS), part(Star5(22, 21, 6.5, 3.2), Y, YL, YS),
           part(Ring(15.5, 15.5, 12.4, 13.6, 250, 340), PU), part(Ring(15.5, 15.5, 12.4, 13.6, 70, 160), PU)],
 'zzz': [part(U(L(3, 20, 9, 20, 2.4), L(9, 20, 3, 27, 2.4), L(3, 27, 9, 27, 2.4)), PU, PUL),
         part(U(L(12, 13, 19, 13, 2.6), L(19, 13, 12, 21, 2.6), L(12, 21, 19, 21, 2.6)), PU, PUL),
         part(U(L(21, 4, 29, 4, 2.8), L(29, 4, 21, 13, 2.8), L(21, 13, 29, 13, 2.8)), PU, PUL)],
 'fish': [part(P((19, 16), (29, 8), (27, 16), (29, 24)), BL, BLL, BLS), part(El(13, 16, 10.5, 7), BL, BLL, BLS),
          part(P((10, 9), (15, 5), (18, 10)), BL, BLL), part(R(7, 14, 8, 15), '#2f5f8a'), part(Px([(15, y) for y in range(13, 20)]), BLL)],
 'lantern': [part(D(Ring(15.5, 6, 3, 4.6, 180, 360), R(0, 6, 31, 31)), WDL), part(R(8, 6, 23, 9), WD, WDL),
             part(R(9, 9, 22, 24), '#ffd75e', WDL), part(R(12, 15, 13, 20), '#fff4b8'),
             part(Px([(x, y) for x in (11, 20) for y in range(10, 24)]), WDL), part(R(7, 24, 24, 28), WD, WDL, WDS)],
 'firework': [part(C(15.5, 15.5, 1.6), PK)] + [part(L(15.5 + math.cos(a) * 6.5, 15.5 + math.sin(a) * 6.5, 15.5 + math.cos(a) * 12.5, 15.5 + math.sin(a) * 12.5, 2.6), PK if i % 2 == 0 else Y) for i, a in enumerate([k * math.pi / 4 - math.pi / 2 for k in range(8)])],
 'gift': [part(R(5, 15, 26, 28), PK, PKL, PKS), part(R(4, 11, 27, 15), PK, PKL), part(R(14, 11, 17, 28), Y, YL),
          part(MX(El(11, 7.5, 4.2, 3, 25)), Y, YL), part(R(14, 7, 17, 10), Y, YL)],
 'pan': [part(L(22, 11, 29, 3, 3.6), WD, WDL), part(C(13.5, 18.5, 11.2), '#8c8486', '#5e5658'), part(C(13.5, 18.5, 8.2), '#a8a0a2'),
         part(U(C(12, 18, 5.5), C(16, 16.5, 4.5)), W, '#d8d0c8'), part(C(13.5, 18, 2.6), '#f8c838', '#e0a020')],
 'chestnut': [part(MX(U(I(C(15.5, 18.5, 12), R(0, 9, 31, 31)), P((5, 15), (15.5, 3), (16.5, 4), (16.5, 15)))), '#c98a5a', '#8a5434', '#b07448'),
              part(MX(I(C(15.5, 18.5, 12), R(0, 23, 31, 31))), '#f4c89a', '#8a5434'), part(R(10, 13, 11, 16), '#e4aa78')],
 'notes': [part(U(El(8, 24, 5, 3.8, -20), El(22, 21, 5, 3.8, -20), R(11, 6, 13, 23), R(25, 3, 27, 20), P((11, 6), (27, 3), (27, 8), (11, 11))), PU, PUL, PUS)],
 'house': [part(R(22, 4, 25, 12), OR_, ORL), part(R(6, 15, 25, 28), '#fbe2b8', CRL, '#f0cc9a'),
           part(P((2, 17.5), (15.5, 4), (29, 17.5)), OR_, ORL, ORS),
           part(R(9, 20, 13, 28), WD, WDL), part(R(18, 19, 22, 23), BL, BLL), part(R(20, 19, 20, 23), BLL), part(R(18, 21, 22, 21), BLL)],
 'rice': [part(MX(lambda x, y: y <= 28 and (C(15.5, 9, 5)(x, y) or C(8.5, 22, 6.5)(x, y) or P((11, 5.5), (2.4, 21), (8, 28.5), (16.5, 28.5), (16.5, 4.5))(x, y))), W, '#b8a898', '#ece4dc'),
          part(R(11, 18, 20, 28), '#5e6658', '#454c42')],
 'dots': [part(C(6.5, 16, 2.8), '#9a6e4a', '#7a5236'), part(C(15.5, 16, 2.8), '#9a6e4a', '#7a5236'), part(C(24.5, 16, 2.8), '#9a6e4a', '#7a5236')],
 'q': [part(U(Ring(15.5, 10.5, 3.5, 7.5, 170, 75), L(18.5, 16, 15.5, 18.5, 3.6), R(14, 18, 17, 21)), PU, PUL, PUS), part(C(15.5, 26.5, 2.5), PU, PUL)],
}

def render(parts):
    Lb = np.full((32, 32), -1)
    for i, (f, *_r) in enumerate(parts):
        for y in range(1, 31):
            for x in range(1, 31):
                if f(x + .5, y + .5): Lb[y, x] = i
    out = np.zeros((32, 32, 4), np.uint8)
    for y in range(32):
        for x in range(32):
            i = Lb[y, x]
            if i < 0: continue
            f, fill, line, shade = parts[i]; col = fill
            if line:
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    j = Lb[y + dy, x + dx] if 0 <= y + dy < 32 and 0 <= x + dx < 32 else -1
                    if j < 0 or (j < i and parts[j][2]): col = line; break
                    if j > i and not parts[j][2] and not f(x + dx + .5, y + dy + .5): col = line; break
            if col == fill and shade and not f(x + 2.5, y + 2.5) and Lb[y + 1, x + 1] == i: col = shade
            out[y, x, :3] = hx(col); out[y, x, 3] = 255
    return out

def main():
    out = Image.new('RGBA', (192, 160), (0, 0, 0, 0))
    for i, nm in enumerate(NAMES):
        out.alpha_composite(Image.fromarray(render(ART[nm]), 'RGBA'), (i % 6 * 32, i // 6 * 32))
    d = sys.argv[1] if len(sys.argv) > 1 else '.'; os.makedirs(d, exist_ok=True)
    out.save(os.path.join(d, 'bubble.png'))
    out.save(os.path.join(d, 'bubble.webp'), lossless=True, exact=True, method=4)
    print(hashlib.sha1(open(os.path.join(d, 'bubble.webp'), 'rb').read()).hexdigest()[:10])

main()
