# 守り神のわざのエフェクト（まもりの光・こもれびのまもり・葉のかべ）のコマならびの絵を assets/g に作る。
# ドット絵（整数のドットだけ）。1ドット＝世界の1点（1マス32点）。名前は中身の sha1 の先10文字。
# つかいかた：python3 tools/fx-guard.py  → 出てきた行を js/draw-world.js の FXS に書く。
#   --show <フォルダ>：たしかめ用に、夜の色の上に3倍でならべた PNG も出す。
#   godlight  ：まもりの光が当たった所。まぶしい玉・8方向の光のすじ・太い2重の輪・とびちる星
#   areaguard ：こもれびのまもりのまん中。地面からのぼる緑の光の柱と、まわりをまわってのぼる葉
#   arealeaf  ：こもれびのまもりの、はんいのふち（ゲームで、ふちの円にそってならべる）
#   leafsprout：葉のかべが生えるマス。葉がはじけて、緑の光がのぼる
from PIL import Image
import hashlib, io, math, os, sys

def P(px, W, H, x, y, col):
    x, y = int(round(x)), int(round(y))
    if 0 <= x < W and 0 <= y < H and col[3] > 0:
        o = px[x, y]
        if o[3] == 0 or col[3] >= o[3]: px[x, y] = col

def A(col, a):
    return (col[0], col[1], col[2], max(0, min(255, int(a))))

def disc(px, W, H, cx, cy, r, fill, edge):
    for y in range(int(cy - r) - 1, int(cy + r) + 2):
        for x in range(int(cx - r) - 1, int(cx + r) + 2):
            d = math.hypot(x + .5 - cx, y + .5 - cy)
            if d <= r - 1: P(px, W, H, x, y, fill)
            elif d <= r: P(px, W, H, x, y, edge)

def ring(px, W, H, cx, cy, rx, ry, th, col):
    """だ円の輪（太さ th ドット）"""
    for y in range(int(cy - ry) - 2, int(cy + ry) + 3):
        for x in range(int(cx - rx) - 2, int(cx + rx) + 3):
            dx, dy = (x + .5 - cx), (y + .5 - cy)
            d = math.hypot(dx / max(rx, .1), dy / max(ry, .1)) * max(rx, ry)
            if max(rx, ry) - th <= d <= max(rx, ry): P(px, W, H, x, y, col)

def star(px, W, H, cx, cy, s, fill, core):
    """十字の星（とげの長さ s）"""
    cx, cy = int(round(cx)), int(round(cy))
    for k in range(1, s + 1):
        c = fill if k < s else A(fill, fill[3] * .6)
        for dx, dy in ((k, 0), (-k, 0), (0, k), (0, -k)): P(px, W, H, cx + dx, cy + dy, c)
    P(px, W, H, cx, cy, core)

def leaf(px, W, H, x, y, a, col, edge):
    """小さな葉（4×2 くらい、向き a）"""
    ca, sa = math.cos(a), math.sin(a)
    for t, w in ((-2, 0), (-1, 1), (0, 1), (1, 1), (2, 0)):
        for s in range(-w, w + 1):
            c = edge if (abs(t) == 2 or abs(s) == w and w) else col
            P(px, W, H, x + ca * t - sa * s * .7, y + sa * t + ca * s * .7, c)

def hsh(i):
    return (math.sin(i * 12.9898 + 4.1) * 43758.5453) % 1

WHITE = (255, 253, 240, 255)
GOLD, GOLDE, GOLDD = (255, 236, 150, 255), (246, 206, 108, 255), (226, 176, 84, 255)
GRN, GRNL, GRNE, GRNW = (140, 214, 100, 255), (196, 242, 156, 255), (98, 170, 74, 255), (236, 255, 214, 255)

# ---------- まもりの光 ----------
GL = dict(w=112, h=112, n=16, fps=20, ax=56, ay=56)
def godlight(i):
    W, H = GL['w'], GL['h']; im = Image.new('RGBA', (W, H), (0, 0, 0, 0)); px = im.load(); cx, cy = GL['ax'], GL['ay']
    # 8方向の光のすじ（はじめの6コマ）
    if i < 7:
        L = [22, 34, 44, 50, 52, 46, 34][i]; k = [1, 1, 1, .85, .7, .5, .3][i]
        for d in range(8):
            a = d * math.pi / 4 + .2; ln = L if d % 2 == 0 else L * .6; th = 2 if d % 2 == 0 and i < 5 else 1
            for t in range(6, int(ln)):
                f = 1 - t / ln; col = A(WHITE if f > .55 else GOLD if f > .25 else GOLDE, 255 * k * (.5 + f * .5))
                x, y = cx + math.cos(a) * t, cy + math.sin(a) * t
                P(px, W, H, x, y, col)
                if th == 2: P(px, W, H, x - math.sin(a), y + math.cos(a), A(col, col[3] * .8))
    # まぶしい玉
    cr = [6, 11, 14, 13, 11, 8, 6, 4, 3, 2][i] if i < 10 else 0
    if cr:
        disc(px, W, H, cx, cy, cr + 3, A(GOLD, 150 if i < 6 else 100), A(GOLDE, 190))
        disc(px, W, H, cx, cy, cr, WHITE, A(GOLD, 255))
    # 太い2重の輪
    for lag, th, col in ((0, 3, GOLD), (3, 2, WHITE)):
        t = i - 1 - lag
        if 0 <= t < 11:
            r = 12 + t * 4.2; a = 255 * (1 - t / 11) ** .7
            ring(px, W, H, cx, cy, r, r, th, A(col, a))
            if t < 8: ring(px, W, H, cx, cy, r - th, r - th, 1, A(GOLDE, a * .5))
    # とびちる星
    for k in range(18):
        t0 = int(hsh(k) * 3); t = i - t0
        if t < 0: continue
        a = k * 2 * math.pi / 18 + hsh(k + 9) * .3; sp = 3 + hsh(k + 3) * 2.4
        x = cx + math.cos(a) * (10 + t * sp); y = cy + math.sin(a) * (10 + t * sp) + t * t * .18
        life = 10 + int(hsh(k + 5) * 4)
        if t >= life: continue
        al = 255 * (1 - t / life)
        if t < 5: star(px, W, H, x, y, 2 if t < 3 else 1, A(GOLD, al), A(WHITE, al))
        else: P(px, W, H, x, y, A(GOLD if k % 2 else WHITE, al))
    return im

# ---------- こもれびのまもり（まん中） ----------
AG = dict(w=96, h=136, n=18, fps=18, ax=48, ay=112)
def areaguard(i):
    W, H = AG['w'], AG['h']; im = Image.new('RGBA', (W, H), (0, 0, 0, 0)); px = im.load(); cx, cy = AG['ax'], AG['ay']
    # 地面の光
    if i < 12:
        k = 1 - i / 12
        for n, (rx, th) in enumerate(((10 + i * 3.2, 3), (6 + i * 2.2, 2))):
            ring(px, W, H, cx, cy, rx, rx * .45, th, A(GRNL if n else GRN, 255 * k))
        disc(px, W, H, cx, cy, 0, GRN, GRN)
    # 光の柱（のぼる → 太くなる → 細くなって消える）
    top = [cy - 20, cy - 50, cy - 80, cy - 104, cy - 108, cy - 108, cy - 108, cy - 108, cy - 108, cy - 108, cy - 108, cy - 108, cy - 108, cy - 108][i] if i < 14 else None
    if top is not None:
        hw = [3, 5, 7, 9, 10, 10, 9, 8, 7, 6, 4, 3, 2, 1][i]; al = 255 if i < 9 else 255 * (14 - i) / 5
        for y in range(int(top), cy + 1):
            f = (y - top) / max(1, cy - top); wv = hw * (.55 + .45 * f)
            fade = min(1, (y - top) / 10)
            for x in range(int(cx - wv), int(cx + wv) + 1):
                e = abs(x + .5 - cx) / max(wv, .5)
                col = GRNW if e < .35 else GRNL if e < .7 else GRN
                P(px, W, H, x, y, A(col, al * fade * (1 if e < .7 else .75)))
    # まわりをまわってのぼる葉
    for k in range(10):
        t = i - int(k * .6)
        if t < 0 or t > 14: continue
        a = k * 2 * math.pi / 10 + t * .55; rr = 14 + t * 1.6 - (t > 9) * (t - 9) * 2
        x = cx + math.cos(a) * rr; y = cy - 6 - t * 6.5 + math.sin(a) * rr * .35
        al = 255 * (1 if t < 10 else (15 - t) / 5)
        leaf(px, W, H, x, y, a * 1.7, A(GRN if k % 2 else GRNL, al), A(GRNE, al))
    # 光のつぶ
    for k in range(14):
        t = i - 3 - int(hsh(k) * 6)
        if t < 0 or t > 8: continue
        x = cx + (hsh(k + 2) - .5) * 44; y = cy - 20 - hsh(k + 4) * 70 - t * 3
        al = 255 * (1 - t / 9)
        if t < 3: star(px, W, H, x, y, 1, A(GRNL, al), A(GRNW, al))
        else: P(px, W, H, x, y, A(GRNW, al))
    return im

# ---------- こもれびのまもり（はんいのふち） ----------
AL = dict(w=32, h=44, n=12, fps=16, ax=16, ay=34)
def arealeaf(i):
    W, H = AL['w'], AL['h']; im = Image.new('RGBA', (W, H), (0, 0, 0, 0)); px = im.load(); cx, cy = AL['ax'], AL['ay']
    if i < 7:
        r = 3 + i * 1.6; ring(px, W, H, cx, cy, r, r * .45, 2, A(GRNL, 255 * (1 - i / 7)))
    if i < 4:
        star(px, W, H, cx, cy - 4 - i * 2, [2, 4, 3, 2][i], A(GRNL, 255), A(GRNW, 255))
    for k in range(4):
        t = i - k // 2
        if t < 0 or t > 10: continue
        a = (-.5 + k / 3) * 1.6 - math.pi / 2; v = 2.6 + hsh(k) * .8
        x = cx + math.cos(a) * v * t * .9; y = cy - 4 + math.sin(a) * v * t + t * t * .32
        al = 255 * (1 if t < 7 else (11 - t) / 4)
        leaf(px, W, H, x, y, t * .7 + k, A(GRN if k % 2 else GRNL, al), A(GRNE, al))
    return im

# ---------- 葉のかべが生える ----------
LS = dict(w=56, h=64, n=14, fps=18, ax=28, ay=46)
def leafsprout(i):
    W, H = LS['w'], LS['h']; im = Image.new('RGBA', (W, H), (0, 0, 0, 0)); px = im.load(); cx, cy = LS['ax'], LS['ay']
    if i < 8:
        r = 6 + i * 2.6; ring(px, W, H, cx, cy, r, r * .45, 2, A(GRN, 255 * (1 - i / 8)))
    if i < 7:  # のぼる緑の光
        top = cy - [10, 22, 34, 40, 42, 42, 42][i]; hw = [2, 3, 4, 3, 2, 2, 1][i]; al = 255 if i < 4 else 255 * (7 - i) / 3
        for y in range(int(top), cy + 1):
            for x in range(cx - hw, cx + hw + 1):
                P(px, W, H, x, y, A(GRNW if abs(x - cx) < hw * .5 else GRNL, al * min(1, (y - top) / 6)))
    for k in range(8):  # はじける葉
        t = i - (k % 2)
        if t < 0 or t > 12: continue
        a = k * 2 * math.pi / 8 + .3; v = 2.4 + hsh(k + 7)
        x = cx + math.cos(a) * v * t; y = cy - 6 + math.sin(a) * v * t * .6 - t * 1.6 + t * t * .2
        al = 255 * (1 if t < 8 else (13 - t) / 5)
        leaf(px, W, H, x, y, a + t * .6, A(GRN if k % 2 else GRNL, al), A(GRNE, al))
    for k in range(6):
        t = i - 2 - int(hsh(k + 1) * 4)
        if t < 0 or t > 6: continue
        x = cx + (hsh(k + 3) - .5) * 30; y = cy - 10 - hsh(k + 5) * 26 - t * 2
        star(px, W, H, x, y, 1 if t > 2 else 2, A(GRNL, 255 * (1 - t / 7)), A(GRNW, 255 * (1 - t / 7)))
    return im

def sheet(f, o):
    im = Image.new('RGBA', (o['w'] * o['n'], o['h']), (0, 0, 0, 0))
    for i in range(o['n']): im.paste(f(i), (i * o['w'], 0))
    return im

def save(name, im, o):
    b = io.BytesIO(); im.save(b, 'WEBP', lossless=True, exact=True); d = b.getvalue(); h = hashlib.sha1(d).hexdigest()[:10]
    open('assets/g/%s.webp' % h, 'wb').write(d)
    print('"%s":{"src":"assets/g/%s.webp","w":%d,"h":%d,"n":%d,"fps":%d,"ax":%d,"ay":%d}' % (name, h, o['w'], o['h'], o['n'], o['fps'], o['ax'], o['ay']))

if __name__ == '__main__':
    show = sys.argv[sys.argv.index('--show') + 1] if '--show' in sys.argv else None
    for name, f, o in (('godlight', godlight, GL), ('areaguard', areaguard, AG), ('arealeaf', arealeaf, AL), ('leafsprout', leafsprout, LS)):
        im = sheet(f, o); save(name, im, o)
        if show:
            os.makedirs(show, exist_ok=True); bg = Image.new('RGBA', im.size, (40, 50, 70, 255)); bg.alpha_composite(im)
            bg.resize((im.size[0] * 3, im.size[1] * 3), Image.NEAREST).save(os.path.join(show, name + '.png'))
