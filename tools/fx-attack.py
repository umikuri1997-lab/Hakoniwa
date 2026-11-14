# せいれいの攻撃のエフェクト（属性ごと）のコマならびの絵を assets/g に作る。
# ドット絵（整数のドットだけ）。1ドット＝世界の1点（1マス32点）。名前は中身の sha1 の先10文字。
# 絵は右向き（ゲームで左向きは反転）。足もと（ax, ay）はコワイノのまん中の少し上。
# つかいかた：python3 tools/fx-attack.py  → 出てきた行を js/draw-world.js の FXS に書く。
#   --show <フォルダ>：たしかめ用に、草の色の上に4倍でならべた PNG も出す。
from PIL import Image
import hashlib, io, math, sys

def dot(px, W, H, x, y, col):
    x, y = int(round(x)), int(round(y))
    if 0 <= x < W and 0 <= y < H: px[x, y] = col

def disc(px, W, H, cx, cy, r, fill, edge, hi=None):
    """まるいドットの玉。ふちは中の色より少しこい色、左上に光"""
    for y in range(int(cy - r) - 1, int(cy + r) + 2):
        for x in range(int(cx - r) - 1, int(cx + r) + 2):
            if not (0 <= x < W and 0 <= y < H): continue
            d = math.hypot(x + .5 - cx, y + .5 - cy)
            if d <= r - .9: px[x, y] = fill
            elif d <= r: px[x, y] = edge
    if hi and r >= 2: dot(px, W, H, cx - r * .45, cy - r * .45, hi)

def ring(px, W, H, cx, cy, rx, ry, col, edge):
    """地面にひろがる、うすいだ円"""
    for y in range(int(cy - ry) - 1, int(cy + ry) + 2):
        for x in range(int(cx - rx) - 1, int(cx + rx) + 2):
            if not (0 <= x < W and 0 <= y < H): continue
            d = math.hypot((x + .5 - cx) / rx, (y + .5 - cy) / ry)
            if d <= 1 - 1.2 / max(rx, ry): px[x, y] = col
            elif d <= 1: px[x, y] = edge

def arc(px, W, H, cx, cy, R, a0, a1, wid, cols, sq=1.0):
    """弧の帯（a0→a1 の向きにのびる）。はばは先ほど細い。cols は外がわ→内がわの色"""
    n = max(8, int(abs(a1 - a0) * R * 2))
    for k in range(n + 1):
        t = k / n; a = a0 + (a1 - a0) * t; w = max(1, round(wid * math.sin(math.pi * min(1, t * 1.15))))
        for s in range(w):
            rr = R - s; c = cols[min(len(cols) - 1, s * len(cols) // max(1, w))]
            dot(px, W, H, cx + math.cos(a) * rr, cy + math.sin(a) * rr * sq, c)

def star4(px, W, H, cx, cy, s, fill, core):
    """十字のきらめき"""
    for d in range(1, s + 1):
        for dx, dy in ((d, 0), (-d, 0), (0, d), (0, -d)): dot(px, W, H, cx + dx, cy + dy, fill)
    dot(px, W, H, cx, cy, core)

def leaf(px, W, H, cx, cy, ang, L, fill, edge):
    """小さな葉（だ円の形、まん中に葉脈の色）"""
    ca, sa = math.cos(ang), math.sin(ang)
    for y in range(int(cy - L) - 1, int(cy + L) + 2):
        for x in range(int(cx - L) - 1, int(cx + L) + 2):
            u = (x + .5 - cx) * ca + (y + .5 - cy) * sa; v = -(x + .5 - cx) * sa + (y + .5 - cy) * ca
            d = (u / L) ** 2 + (v / (L * .45)) ** 2
            if not (0 <= x < W and 0 <= y < H): continue
            if d <= .55: px[x, y] = fill if abs(v) > .6 else edge
            elif d <= 1: px[x, y] = edge

def blank(o): return Image.new('RGBA', (o['w'], o['h']), (0, 0, 0, 0))

# ---- 火：ほのおの斬撃。弧のあとに火がのこって、火の粉がのぼる ----
FI = dict(w=64, h=64, n=11, fps=20, ax=26, ay=34)
FC = [(214, 92, 60, 255), (244, 140, 72, 255), (255, 194, 96, 255), (255, 236, 168, 255)]
def fire(i):
    o = FI; im = blank(o); px = im.load(); W, H = o['w'], o['h']; cx, cy = o['ax'] - 4, o['ay']
    if i <= 5:  # 弧が上から下へ走る
        a1 = -1.9 + min(1, (i + 1) / 4) * 3.4; a0 = max(-1.9, a1 - 2.2 + i * .25)
        arc(px, W, H, cx, cy, 20, a0, a1, 5 - max(0, i - 3), FC)
    for j, (fx, fy, t0) in enumerate(((18, 4, 2), (12, -6, 3), (20, -12, 3), (8, 10, 4), (24, 2, 4))):  # のこる火
        t = i - t0
        if 0 <= t < 6:
            h = [3, 5, 6, 5, 3, 2][t]; x = cx + fx; y = cy + fy
            for k in range(h):
                w = max(1, round((h - k) * .55)); c = FC[min(3, k * 4 // max(1, h))] if t < 4 else FC[1]
                for dx in range(-w + 1, w): dot(px, W, H, x + dx + (1 if k > h * .6 and j % 2 else 0), y - k, c)
    for j in range(6):  # 火の粉
        t = i - 3 - (j % 3)
        if 0 <= t < 7:
            x = cx + 10 + j * 3 + math.sin(t + j) * 2; y = cy + 6 - j * 3 - t * 3.2
            dot(px, W, H, x, y, FC[3] if t < 3 else FC[1])
    if 2 <= i <= 4: star4(px, W, H, cx + 20, cy, 4 - abs(i - 3), FC[2], (255, 252, 230, 255))
    return im

# ---- 土：地面から岩がつき上がって、くだけた石がとぶ ----
EA = dict(w=64, h=60, n=12, fps=18, ax=32, ay=40)
ER = [(150, 112, 80, 255), (186, 146, 100, 255), (216, 182, 132, 255), (240, 214, 168, 255)]
DU = [(214, 196, 166, 200), (190, 170, 138, 220)]
def spike(px, W, H, bx, by, hgt, wid):
    """とがった岩（左が明るい・右がかげ）"""
    for k in range(int(hgt)):
        w = wid * (1 - k / hgt)
        for dx in range(-int(w), int(w) + 1):
            c = ER[0] if abs(dx) >= int(w) else (ER[3] if dx < -w * .3 and k > 1 else ER[2] if dx < w * .3 else ER[1])
            dot(px, W, H, bx + dx, by - k, c)
def earth(i):
    o = EA; im = blank(o); px = im.load(); W, H = o['w'], o['h']; cx, cy = o['ax'], o['ay'] + 8
    if i < 10:  # ひびの輪
        k = 1 - i / 10; ring(px, W, H, cx, cy, 6 + i * 1.6, 2.5 + i * .5, (170, 136, 98, int(90 * k) + 20), (140, 106, 76, int(160 * k) + 40))
    hs = [0, 7, 13, 16, 15, 12, 8, 4, 0]
    if i < len(hs) and hs[i]:  # まん中の岩と、左右の小さな岩
        spike(px, W, H, cx, cy, hs[i], 5); spike(px, W, H, cx - 9, cy + 1, hs[i] * .55, 3); spike(px, W, H, cx + 9, cy + 1, hs[i] * .6, 3)
    for j, (vx, vy, r) in enumerate(((-1.6, -3.2, 2.2), (1.8, -3.6, 2.4), (-.6, -4.2, 1.6), (2.6, -2.4, 1.8), (-2.6, -2.2, 1.6))):  # とぶ石
        t = i - 3
        if 0 <= t < 8:
            x = cx + vx * t * 1.7; y = cy - 10 + vy * t * 1.7 + .55 * t * t
            if y < cy + 2: disc(px, W, H, x, y, r, ER[2], ER[0], ER[3])
    for j in range(5):  # 土けむり
        t = i - 2 - j % 2
        if 0 <= t < 7:
            x = cx + (j - 2) * 6 + (j - 2) * t * .8; y = cy - 1 - t * .7
            disc(px, W, H, x, y, 1.5 + t * .45, DU[0], DU[1])
    return im

# ---- 木：つるのむちが、ひゅっとしなって、葉がちる ----
WO = dict(w=68, h=60, n=12, fps=18, ax=28, ay=32)
VC = [(88, 140, 70, 255), (156, 206, 104, 255), (214, 240, 160, 255)]
LF, LE = (184, 228, 128, 255), (104, 160, 82, 255)
def wood(i):
    o = WO; im = blank(o); px = im.load(); W, H = o['w'], o['h']; cx, cy = o['ax'], o['ay']
    if i <= 6:  # つるが左上から右へしなる（S字の線）
        reach = min(1, (i + 1) / 4); fade = max(0, i - 4)
        n = 60
        for k in range(int(n * reach) + 1):
            t = k / n
            if t < fade * .3: continue
            x = cx - 22 + t * 40; y = cy - 14 + math.sin(t * math.pi * 1.4 + i * .5) * 8 * (1 - t * .3) + t * 10
            w = 4 if t < .6 else 3 if t < .85 else 2
            for s in range(w): dot(px, W, H, x, y + s, VC[0] if s in (0, w - 1) else VC[2] if s == 1 else VC[1])
            if k % 12 == 6 and t < reach - .1: leaf(px, W, H, x, y - 3, -.8 + t, 4, LF, LE)
        if 2 <= i <= 4: star4(px, W, H, cx + 18, cy + 4, 4 - abs(i - 3), VC[2], (246, 252, 220, 255))
    for j, (vx, vy, a) in enumerate(((1.6, -2.2, .4), (2.4, -1.0, 1.4), (.6, -2.8, 2.2), (2.8, -2.4, 3.0), (1.2, .4, 4.0), (-.4, -1.6, 5.0))):  # ちる葉
        t = i - 3
        if 0 <= t < 9:
            x = cx + 18 + vx * t * 1.5 + math.sin(t * .9 + j) * 1.5; y = cy + 4 + vy * t * 1.3 + .3 * t * t
            leaf(px, W, H, x, y, a + t * .6, 4 if t < 6 else 3, LF, LE)
    return im

# ---- 風：三日月のかまいたちが2まい走って、うずがのこる ----
WI = dict(w=72, h=56, n=11, fps=20, ax=30, ay=30)
AC_ = [(132, 196, 214, 255), (182, 230, 236, 255), (236, 252, 250, 255)]
def wind(i):
    o = WI; im = blank(o); px = im.load(); W, H = o['w'], o['h']; cx, cy = o['ax'], o['ay']
    for j, (t0, oy, R) in enumerate(((0, -5, 13), (2, 6, 11))):  # 三日月が右へ走る
        t = i - t0
        if 0 <= t < 6:
            x = cx - 14 + t * 7; wd = [2, 3, 4, 3, 2, 1][t]
            arc(px, W, H, x, cy + oy, R, -1.15, 1.15, wd + 1, ([AC_[2], AC_[1], AC_[1], AC_[0]]) if t < 4 else AC_[:2])
    if 3 <= i < 10:  # うず
        t = i - 3; R0 = 3 + t * 1.3
        for k in range(26):
            a = k * .38 + t * .9; r = R0 * (1 - k / 34)
            if k > 22 - t * 2 or k < t: continue
            dot(px, W, H, cx + 18 + math.cos(a) * r, cy + math.sin(a) * r * .6, AC_[1 if k % 3 else 2])
    for j in range(5):  # 風のすじ
        t = i - 1 - j % 3
        if 0 <= t < 5:
            y = cy - 12 + j * 6; x0 = cx - 18 + t * 8
            for d in range(6 - t): dot(px, W, H, x0 + d, y, AC_[1] if d else AC_[2])
    return im

# ---- 水：水のたまがはじけて、しぶきと輪がひろがる（水は止めるだけ） ----
WA = dict(w=64, h=60, n=12, fps=16, ax=32, ay=34)
WF, WE, WH = (160, 212, 240, 240), (104, 162, 206, 255), (240, 250, 255, 255)
def water(i):
    o = WA; im = blank(o); px = im.load(); W, H = o['w'], o['h']; cx, cy = o['ax'], o['ay']
    if i < 3:  # 左から水のたま
        disc(px, W, H, cx - 16 + i * 7, cy - 2, 4 + i, WF, WE, WH)
    if 2 <= i < 11:  # 足もとの水の輪
        t = i - 2; k = 1 - t / 9; ring(px, W, H, cx, cy + 10, 6 + t * 2, 2 + t * .6, (160, 210, 238, int(110 * k) + 30), (110, 168, 210, int(170 * k) + 50))
    if 3 <= i < 7:  # はじける泡のかたまり
        t = i - 3; r = [7, 9, 8, 6][t]
        disc(px, W, H, cx, cy, r, WF, WE, WH)
        if t >= 2:
            for y in range(int(cy - r), int(cy + r) + 1):
                for x in range(int(cx - r), int(cx + r) + 1):
                    if math.hypot(x + .5 - cx, y + .5 - cy) < r - 2.2 - (t - 2): px[x, y] = (0, 0, 0, 0)
    for j, (vx, vy, r) in enumerate(((-2.4, -2.8, 2.6), (2.4, -2.8, 2.6), (-1, -3.8, 2.2), (1, -3.8, 2.2), (-3.2, -1.4, 2), (3.2, -1.4, 2), (0, -4.4, 1.8))):  # しぶき
        t = i - 4
        if 0 <= t < 8:
            x = cx + vx * t * 1.6; y = cy + vy * t * 1.6 + .5 * .95 * t * t
            if y < cy + 11: disc(px, W, H, x, y, max(1.2, r - t * .2), WF, WE, WH)
    if 5 <= i < 11:  # 止まった印：泡が3つ、くるくる
        a0 = (i - 5) * .7
        for s in range(3):
            a = a0 + s * 2.09; disc(px, W, H, cx + math.cos(a) * 9, cy - 18 + math.sin(a) * 3, 1.8, WF, WE, WH)
    return im

def sheet(f, o):
    im = Image.new('RGBA', (o['w'] * o['n'], o['h']), (0, 0, 0, 0))
    for i in range(o['n']): im.paste(f(i), (i * o['w'], 0))
    return im

def save(name, im, o):
    b = io.BytesIO(); im.save(b, 'WEBP', lossless=True, exact=True); d = b.getvalue(); h = hashlib.sha1(d).hexdigest()[:10]
    open('assets/g/%s.webp' % h, 'wb').write(d)
    print('"%s":{"src":"assets/g/%s.webp","w":%d,"h":%d,"n":%d,"fps":%d,"ax":%d,"ay":%d}' % (name, h, o['w'], o['h'], o['n'], o['fps'], o['ax'], o['ay']))
    return im

if __name__ == '__main__':
    out = sys.argv[sys.argv.index('--show') + 1] if '--show' in sys.argv else None
    for name, f, o in (('atk_fire', fire, FI), ('atk_earth', earth, EA), ('atk_wood', wood, WO), ('atk_wind', wind, WI), ('atk_water', water, WA)):
        im = save(name, sheet(f, o), o)
        if out:
            bg = Image.new('RGBA', im.size, (110, 150, 90, 255)); bg.alpha_composite(im)
            bg.resize((im.width * 4, im.height * 4), Image.NEAREST).save('%s/fx_%s.png' % (out, name))
