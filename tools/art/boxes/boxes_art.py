"""木箱（crate）・食料箱（stor）・素材箱（mbox）のドット絵を、1ドットずつ置いて作る。
python3 tools/art/boxes/boxes_art.py <出力フォルダ>
3つとも同じ箱（ふた／ふちの帯・正面の柱と横板・くぎ）で、木の色は食卓に近い色。
はば64（1マス）、下のはしはチップの ay で g64 の 45 にそろえる。
"""
import sys, os, math
from PIL import Image

def hx(s): s = s.lstrip('#'); return (int(s[0:2], 16), int(s[2:4], 16), int(s[4:6], 16), 255)

# 木（はこにわの木の色）
OL, SEP = hx('9a6036'), hx('aa7240')
TL, T, TG1, TG2, TS = hx('f0cf9c'), hx('deae6c'), hx('e5b878'), hx('d19d5f'), hx('c48e54')
PL, P, PS = hx('f5d4a0'), hx('e0ac6a'), hx('cc9658')
FL, F, FG, FS = hx('eabe7e'), hx('d39c5e'), hx('daa566'), hx('c08a50')
IN, IND = hx('b98049'), hx('a8703f')          # 箱の中（うしろの壁の内がわ・ふちの下のかげ）

W = 64
BODY_H = 69                                     # ふたの上から、箱の下まで


class Pic:
    def __init__(s, w, h): s.w, s.h = w, h; s.px = [[None] * w for _ in range(h)]
    def set(s, x, y, c):
        if 0 <= x < s.w and 0 <= y < s.h: s.px[y][x] = c
    def get(s, x, y): return s.px[y][x] if 0 <= x < s.w and 0 <= y < s.h else None
    def rect(s, x0, y0, x1, y1, c):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1): s.set(x, y, c)
    def hl(s, x0, x1, y, c): s.rect(x0, y, x1, y, c)
    def vl(s, x, y0, y1, c): s.rect(x, y0, x, y1, c)
    def img(s):
        im = Image.new('RGBA', (s.w, s.h), (0, 0, 0, 0))
        for y in range(s.h):
            for x in range(s.w):
                if s.px[y][x]: im.putpixel((x, y), s.px[y][x])
        return im


def nail(p, x, y):
    """3×3 のくぎ：こい四角の中に明るい1ドット。"""
    p.rect(x, y, x + 2, y + 2, SEP); p.set(x + 1, y + 1, FL)


def body(p, oy):
    """正面（柱と横板3まい）。oy はふた／ふちの上の行。"""
    t = oy + 25; b = oy + BODY_H - 1
    p.rect(1, t, 62, b, F)
    p.hl(2, 61, t, FS); p.hl(2, 61, t + 1, FS)            # ふたの下のかげ2行
    p.hl(2, 61, t, hx('b58048'))
    top = t + 2
    # 柱（左に明るい帯、右にかげ）
    for x0 in (2, 57):
        p.vl(x0, top, b - 1, PL); p.rect(x0 + 1, top, x0 + 3, b - 1, P); p.vl(x0 + 4, top, b - 1, PS)
        p.hl(x0, x0 + 3, top, PL)
    p.vl(7, top, b - 1, SEP); p.vl(56, top, b - 1, SEP)
    # 横板：13行・さかい1行
    grain = [  # (板, x0, 長さ, 行, 色)
        (0, 12, 14, 4, FG), (0, 34, 10, 8, FS), (0, 44, 8, 3, FG),
        (1, 20, 18, 5, FG), (1, 10, 8, 9, FG), (1, 41, 9, 7, FS),
        (2, 14, 10, 3, FS), (2, 30, 16, 6, FG), (2, 22, 8, 10, FG),
    ]
    for k in range(3):
        y0 = top + k * 14; y1 = y0 + 12
        p.rect(8, y0, 55, y1, F); p.hl(8, 55, y0, FL); p.hl(8, 55, y1, FS)
        if k < 2: p.hl(8, 55, y1 + 1, SEP)
        for (pk, gx, gl, gy, gc) in grain:
            if pk == k: p.hl(gx, gx + gl - 1, y0 + gy, gc)
    nail(p, 9, top + 5); nail(p, 52, top + 5)
    nail(p, 9, top + 33); nail(p, 52, top + 33)
    # 輪郭
    p.vl(1, t, b, OL); p.vl(62, t, b, OL); p.hl(1, 62, b, OL)
    p.set(1, b, None); p.set(62, b, None); p.set(2, b - 1, OL); p.set(61, b - 1, OL)


def lid_edge(p, oy):
    """ふた／ふちの手前の厚み：明るい角の線 → かげ2行 → 輪郭線。"""
    y = oy + 21
    p.hl(1, 62, y, FL); p.hl(1, 62, y + 1, FS); p.hl(1, 62, y + 2, FS); p.hl(0, 63, y + 3, OL)
    p.hl(1, 62, y + 1, F)
    p.vl(0, y, y + 3, OL); p.vl(63, y, y + 3, OL)
    p.set(0, y + 3, None); p.set(63, y + 3, None)


def crate():
    p = Pic(W, BODY_H)
    body(p, 0)
    # ふたの上面：横板3まい
    grain = [(0, 6, 12, 3, TG1), (0, 28, 16, 2, TG2), (0, 50, 8, 4, TG1),
             (1, 14, 18, 2, TG2), (1, 40, 10, 3, TG1), (1, 4, 8, 4, TG1),
             (2, 22, 14, 3, TG1), (2, 46, 12, 2, TG2), (2, 8, 9, 4, TG2)]
    for k in range(3):
        y0 = 1 + k * 7; y1 = y0 + 5
        p.rect(1, y0, 62, y1, T); p.hl(1, 62, y0, TL); p.hl(1, 62, y1, TS)
        if k < 2: p.hl(1, 62, y1 + 1, SEP)
        for (pk, gx, gl, gy, gc) in grain:
            if pk == k: p.hl(gx, gx + gl - 1, y0 + gy, gc)
    p.hl(1, 62, 0, OL); p.vl(0, 1, 20, OL); p.vl(63, 1, 20, OL)
    lid_edge(p, 0)
    return p


def open_box(fill, rise):
    """上があいた箱。fill(p, oy) で中の物を描く（うしろのふちの上へ rise 行まで出る）。"""
    oy = rise
    p = Pic(W, BODY_H + oy)
    body(p, oy)
    # 中（うしろの壁の内がわ）
    p.rect(4, oy + 4, 59, oy + 16, IN); p.hl(4, 59, oy + 4, IND); p.hl(4, 59, oy + 5, IND)
    # うしろ・左右のふち（上面）
    p.rect(1, oy + 1, 62, oy + 3, T); p.hl(1, 62, oy + 1, TL); p.hl(4, 59, oy + 4, SEP)
    p.rect(1, oy + 1, 3, oy + 20, T); p.vl(1, oy + 1, oy + 20, TL); p.vl(4, oy + 4, oy + 16, SEP)
    p.rect(60, oy + 1, 62, oy + 20, T); p.vl(62, oy + 1, oy + 20, TS); p.vl(59, oy + 4, oy + 16, SEP)
    p.hl(8, 19, oy + 2, TG1); p.hl(36, 47, oy + 2, TG2)
    fill(p, oy)
    # 手前のふち（中の物より手前）
    p.hl(4, 59, oy + 16, SEP)
    p.rect(1, oy + 17, 62, oy + 20, T); p.hl(1, 62, oy + 17, TL); p.hl(1, 62, oy + 20, TS)
    p.vl(1, oy + 17, oy + 20, TL); p.vl(62, oy + 17, oy + 20, TS)
    p.hl(10, 25, oy + 18, TG1); p.hl(38, 49, oy + 19, TG2)
    p.hl(1, 62, oy, OL); p.vl(0, oy + 1, oy + 20, OL); p.vl(63, oy + 1, oy + 20, OL)
    lid_edge(p, oy)
    return p


# ---- 丸い物（りんご・キャベツ・丸太・石） ----
def blob(p, cx, cy, rx, ry, pal, hi=True, sq=1.0):
    """まるい物。pal=(輪郭, かげ, 基本, 明るい, 光)。光は左上。"""
    ol, sh, ba, li, hl = pal
    cells = set()
    for y in range(int(cy - ry) - 1, int(cy + ry) + 2):
        for x in range(int(cx - rx) - 1, int(cx + rx) + 2):
            dx = (x + .5 - cx) / rx; dy = (y + .5 - cy) / ry
            if abs(dx) ** 2 + abs(dy) ** (2 * sq) <= 1: cells.add((x, y))
    for (x, y) in cells:
        dx = (x + .5 - cx) / rx; dy = (y + .5 - cy) / ry
        edge = any((x + a, y + b) not in cells for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1)))
        if edge: c = ol
        else:
            v = -dx * .55 - dy * .65
            c = li if v > .25 else ba if v > -.45 else sh
            if hi and -.62 < dx < -.18 and -.66 < dy < -.3: c = hl
        p.set(x, y, c)
    return cells


def clean(p, box):
    """ひとつだけとびだした色のドットを、まわりの色にまとめる。"""
    x0, y0, x1, y1 = box
    for _ in range(2):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                c = p.get(x, y)
                if c is None: continue
                nb = [p.get(x + a, y + b) for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1))]
                if c not in nb:
                    cnt = {}
                    for n in nb:
                        if n: cnt[n] = cnt.get(n, 0) + 1
                    if not cnt: continue
                    best = max(cnt.items(), key=lambda t: t[1])
                    if best[1] >= 3: p.set(x, y, best[0])


APPLE = (hx('a8494a'), hx('c44c50'), hx('df5e5c'), hx('ec8478'), hx('f8c4b0'))
CABB = (hx('6e8a3c'), hx('86a648'), hx('9bbe50'), hx('b8d470'), hx('d6e8a0'))
CARR = (hx('b0603a'), hx('d27a42'), hx('eb9450'), hx('f6b072'), hx('fbd0a0'))
LEAF = (hx('5f7a34'), hx('80a044'), hx('a6c858'))
STONE = (hx('898389'), hx('a3a1ad'), hx('bdbdc8'), hx('d3d2dc'), hx('e6e5ec'))
BARK = (hx('8a5530'), hx('a86d3e'), hx('c08550'))
END = (hx('d8a86a'), hx('f0d09a'), hx('f8e2b8'))   # 切り口：年輪・切り口・明るい所


def food(p, oy):
    # キャベツ（左）：外の葉と、中の明るい玉
    blob(p, 15, oy + 7, 11, 10, CABB, hi=False)
    inner = blob(p, 14, oy + 5, 7, 6, (CABB[1], CABB[2], CABB[3], CABB[4], CABB[4]), hi=False)
    p.hl(9, 11, oy + 1, CABB[4])
    # にんじん（まん中、立てて入れてある）
    for cx, top in ((30, oy + 1), (37, oy + 4)):
        for y in range(top, oy + 17):
            hw = 2 if y == top else 3
            for x in range(cx - hw, cx + hw + 1):
                c = CARR[2]
                if x == cx - hw + 1: c = CARR[3]
                if x >= cx + hw - 1: c = CARR[1]
                if x in (cx - hw, cx + hw) or y == top: c = CARR[0]
                p.set(x, y, c)
        p.hl(cx - 1, cx + 1, top + 5, CARR[1]); p.hl(cx, cx + 1, top + 10, CARR[1])
        # 葉（上へ、まっすぐ）
        for (lx, l0) in ((cx - 2, top - 6), (cx, top - 9), (cx + 2, top - 6)):
            p.rect(lx, l0, lx + 1, top - 1, LEAF[1]); p.vl(lx + 1, l0 + 1, top - 1, LEAF[0])
            p.set(lx, l0, LEAF[2])
    # りんご（右：うしろに1こ、手前に2こ）
    for (cx, cy) in [(50, oy + 3), (45, oy + 11), (54, oy + 11)]:
        blob(p, cx, cy, 6, 5.5, APPLE)
        p.vl(cx, cy - 7, cy - 5, hx('8a5530')); p.hl(cx + 1, cx + 2, cy - 7, LEAF[1]); p.set(cx + 3, cy - 8, LEAF[0])
    clean(p, (5, 0, 58, oy + 16))


def logend(p, cx, cy, r):
    blob(p, cx, cy, r, r, (BARK[0], BARK[1], BARK[2], BARK[2], BARK[2]), hi=False)
    face = blob(p, cx, cy, r - 2, r - 2, (END[0], END[1], END[1], END[2], END[2]), hi=False)
    ring = blob(p, cx, cy, (r - 2) * .5, (r - 2) * .5, (END[0], END[1], END[1], END[1], END[1]), hi=False)


def mats(p, oy):
    # 丸太（左：下に2本、上に1本。切り口を手前に）
    logend(p, 13, oy + 10, 9); logend(p, 31, oy + 10, 9); logend(p, 22, oy - 4, 9)
    # 石（右）
    blob(p, 49, oy + 2, 8, 7, STONE)
    blob(p, 44, oy + 11, 6.5, 5.5, STONE)
    blob(p, 54, oy + 12, 6.5, 5.5, STONE)
    clean(p, (5, 0, 58, oy + 16))


def build(out):
    os.makedirs(out, exist_ok=True)
    res = {'crate': crate(), 'stor': open_box(food, 12), 'mbox': open_box(mats, 14)}
    for k, p in res.items(): p.img().save(os.path.join(out, k + '.png'))
    return res


if __name__ == '__main__':
    build(sys.argv[1] if len(sys.argv) > 1 else 'boxes_out')
