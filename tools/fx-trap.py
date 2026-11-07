# 罠のエフェクト（どくの罠・すべる水たまり）のコマならびの絵を assets/g に作る。
# ドット絵（整数のドットだけ）。1ドット＝世界の1点（1マス32点）。名前は中身の sha1 の先10文字。
# つかいかた：python3 tools/fx-trap.py  → 出てきた行を js/draw-world.js の FXS に書く。
#   --show <フォルダ>：たしかめ用に、草の色の上に3倍でならべた PNG も出す。
from PIL import Image
import hashlib, io, math, sys

def disc(px, W, H, cx, cy, r, fill, edge, hi=None):
    """まるいドットの玉。ふちは中の色より少しこい色、左上に光"""
    for y in range(int(cy - r) - 1, int(cy + r) + 2):
        for x in range(int(cx - r) - 1, int(cx + r) + 2):
            if not (0 <= x < W and 0 <= y < H): continue
            d = math.hypot(x + .5 - cx, y + .5 - cy)
            if d <= r - .9: px[x, y] = fill
            elif d <= r: px[x, y] = edge
    if hi and r >= 2:
        hx, hy = int(cx - r * .45), int(cy - r * .45)
        if 0 <= hx < W and 0 <= hy < H: px[hx, hy] = hi
        if r >= 3.5 and 0 <= hx + 1 < W: px[hx + 1, hy] = hi

def ring(px, W, H, cx, cy, rx, ry, col, edge):
    """地面にひろがる、うすいだ円（中はすけた色、ふちは少しこい色）"""
    for y in range(int(cy - ry) - 1, int(cy + ry) + 2):
        for x in range(int(cx - rx) - 1, int(cx + rx) + 2):
            if not (0 <= x < W and 0 <= y < H): continue
            d = math.hypot((x + .5 - cx) / rx, (y + .5 - cy) / ry)
            if d <= 1 - 1.2 / max(rx, ry): px[x, y] = col
            elif d <= 1: px[x, y] = edge

def dot(px, W, H, x, y, col):
    x, y = int(round(x)), int(round(y))
    if 0 <= x < W and 0 <= y < H: px[x, y] = col

def star(px, W, H, cx, cy, fill, edge):
    """十字の星（まん中2×2、上下左右に2ドットのとげ）"""
    cx, cy = int(round(cx)), int(round(cy))
    for dx, dy in ((0, -2), (1, -2), (0, 3), (1, 3), (-2, 0), (-2, 1), (3, 0), (3, 1)): dot(px, W, H, cx + dx, cy + dy, edge)
    for dx, dy in ((0, -1), (1, -1), (0, 2), (1, 2), (-1, 0), (-1, 1), (2, 0), (2, 1)): dot(px, W, H, cx + dx, cy + dy, fill)
    for dx in (0, 1):
        for dy in (0, 1): dot(px, W, H, cx + dx, cy + dy, (255, 252, 230, 255))

# どく：足もとから、みどりのあわが、ぷくぷくのぼって、はじける
PO = dict(w=48, h=56, n=14, fps=12, ax=24, ay=48)
PF, PE, PH = (176, 218, 128, 235), (126, 176, 96, 255), (236, 250, 208, 255)
PP, PPE = (196, 160, 214, 230), (150, 118, 176, 255)  # むらさきのあわ（少しまぜる）
BUB = [(-9, 0, 4.6, 0), (6, 2, 3.8, 2), (-1, -1, 5.2, 4), (11, -2, 3.4, 6), (-7, 1, 3.6, 8)]  # x, 出る高さ, 大きさ, 出るコマ
def poison(i):
    W, H = PO['w'], PO['h']; im = Image.new('RGBA', (W, H), (0, 0, 0, 0)); px = im.load(); ox, oy = PO['ax'], PO['ay']
    if i < 9:  # 足もとの、うすいどくの輪
        k = 1 - i / 9; ring(px, W, H, ox, oy, 10 + i * .9, 3.5 + i * .3, (150, 200, 110, int(110 * k) + 30), (120, 172, 92, int(170 * k) + 50))
    for j, (bx, by, r, t0) in enumerate(BUB):
        t = i - t0
        if t < 0: continue
        life = 6
        if t < life:
            rr = min(r, 1.5 + t * 1.2); y = oy + by - t * 4.2 - (t * t) * .25; x = ox + bx + math.sin(t * 1.3 + j) * 1.2
            pur = j % 3 == 2
            disc(px, W, H, x, y, rr, PP if pur else PF, PPE if pur else PE, PH)
        elif t < life + 2:  # はじける：まわりに4つの点
            y = oy + by - life * 4.2 - life * life * .25; x = ox + bx + math.sin(life * 1.3 + j) * 1.2; s = r + (t - life) * 2
            for dx, dy in ((-s, 0), (s, 0), (0, -s), (0, s), (-s * .7, -s * .7), (s * .7, -s * .7), (-s * .7, s * .7), (s * .7, s * .7)):
                dot(px, W, H, x + dx, y + dy, PE); dot(px, W, H, x + dx + 1, y + dy, PF)
    return im

# すべる：足もとで水がはねて、頭の上に星がくるっとまわる
SL = dict(w=64, h=84, n=14, fps=14, ax=32, ay=72)
WF, WE, WH = (168, 216, 240, 235), (112, 168, 206, 255), (240, 250, 255, 255)
SF, SE = (255, 240, 160, 255), (226, 186, 96, 255)
DROPS = [(-1, -3.4, 3.4), (1, -3.4, 3.4), (-1.8, -2.6, 2.8), (1.8, -2.6, 2.8), (-.6, -4.2, 2.6), (.6, -4.2, 2.6), (-2.6, -1.6, 2.2), (2.6, -1.6, 2.2)]
def slip(i):
    W, H = SL['w'], SL['h']; im = Image.new('RGBA', (W, H), (0, 0, 0, 0)); px = im.load(); ox, oy = SL['ax'], SL['ay']
    if i < 10:  # ひろがる水の輪
        k = 1 - i / 10; ring(px, W, H, ox, oy, 7 + i * 1.8, 2.5 + i * .6, (168, 214, 240, int(120 * k) + 30), (120, 176, 214, int(180 * k) + 50))
    if i < 9:  # 水しぶき：外へとんで、おちる
        for vx, vy, r in DROPS:
            t = i + 1; x = ox + vx * t * 1.6; y = oy + vy * t * 1.6 + .5 * .9 * t * t
            if y <= oy + 1: disc(px, W, H, x, y, max(1.5, r - i * .15), WF, WE, WH)
    if 2 <= i:  # 頭の上を、星が3つ、くるっとまわる
        a0 = (i - 2) * .55
        for s in range(3):
            a = a0 + s * 2 * math.pi / 3; x = ox + math.cos(a) * 10; y = oy - 54 + math.sin(a) * 3.5
            if i < SL['n'] - 1 or s == 0: star(px, W, H, x, y, SF, SE)
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
    for name, f, o in (('poison', poison, PO), ('slip', slip, SL)):
        im = save(name, sheet(f, o), o)
        if out:
            bg = Image.new('RGBA', im.size, (110, 150, 90, 255)); bg.alpha_composite(im)
            bg.resize((im.width * 3, im.height * 3), Image.NEAREST).save('%s/fx_%s.png' % (out, name))
