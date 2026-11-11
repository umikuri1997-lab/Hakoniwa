"""持ち主のベッドのお手本（ref/bed.png）と同じ作り（面ごとに1色のたいらなぬり・1ドットのうすい茶色の輪郭線・12色ほど）で、
よこのベッド・食卓・たるを描く。形と大きさは、いまのチップ（clean64 の絵）と同じ。できた絵は ref/ に書き、clean64.py がそのまま使う。
  python3 tools/art/furn32/flat_art.py"""
import os
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__)); REF = os.path.join(HERE, 'ref')
# ベッドのお手本の色
B = (191, 137, 81)                                   # 輪郭線
J, G, Hc, I, E, K = (238, 196, 124), (232, 185, 112), (228, 179, 106), (225, 175, 103), (220, 169, 99), (204, 151, 88)  # 木：上の面 → こい所
A, C, F, D, Lg = (250, 250, 250), (243, 243, 243), (231, 231, 231), (216, 215, 215), (178, 175, 172)                    # 布：白 → こい所
# 金具（たるの輪）：布の灰色にそろえた、やわらかい灰色
MH, MM, MS, MO = (226, 225, 223), (206, 204, 200), (186, 183, 179), (160, 156, 152)

class Cv:
    def __init__(s, w, h): s.a = np.zeros((h, w, 4), np.uint8); s.w, s.h = w, h
    def px(s, x, y, c):
        if 0 <= x < s.w and 0 <= y < s.h: s.a[y, x, :3] = c; s.a[y, x, 3] = 255
    def rect(s, x0, y0, x1, y1, c):                   # x1・y1 もふくむ
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1): s.px(x, y, c)
    def hline(s, x0, x1, y, c): s.rect(x0, y, x1, y, c)
    def vline(s, x, y0, y1, c): s.rect(x, y0, x, y1, c)
    def box(s, x0, y0, x1, y1, fill, ol=B, cut=True):   # 輪郭線つきの四角（角を1ドットおとす）
        s.rect(x0, y0, x1, y1, ol); s.rect(x0 + 1, y0 + 1, x1 - 1, y1 - 1, fill)
        if cut:
            for x, y in ((x0, y0), (x1, y0), (x0, y1), (x1, y1)): s.a[y, x] = 0
    def img(s): return Image.fromarray(s.a, 'RGBA')

def post(cv, x0, y0, x1, y1, body=G, cap=J):
    """柱：上に2行の上の面、そのあとに線、下は前の面"""
    cv.box(x0, y0, x1, y1, body); cv.rect(x0 + 1, y0 + 1, x1 - 1, y0 + 2, cap); cv.hline(x0, x1, y0 + 3, B)

def bed_side():
    """よこのベッド（bed>1、77×77）：頭は左。左右の柱・マットレスの上の面・まくら・かけぶとん・手前のわく"""
    cv = Cv(77, 77)
    top, side, rail = 6, 56, 60                       # マットレスの上の面（6〜55行）・横の面（56〜58）・わく（60〜68）
    cv.rect(7, top, 69, side - 1, A)
    cv.hline(7, 69, top, C); cv.vline(69, top, side - 1, F)          # ふちのやわらかいかげ
    cv.box(9, top + 4, 19, side - 4, A, ol=D, cut=True)                # まくら（よこ向き）
    cv.rect(10, side - 7, 18, side - 5, C); cv.hline(10, 18, side - 5, F)
    cv.rect(21, top, 26, side - 1, A); cv.vline(26, top, side - 1, C)  # かけぶとんのおり返し
    cv.vline(27, top, side - 1, D); cv.vline(28, top, side - 1, F)
    cv.rect(29, top + 1, 68, side - 2, A); cv.hline(29, 68, side - 2, C); cv.vline(29, top + 1, side - 2, C)
    cv.rect(7, side, 69, side + 2, D); cv.hline(7, 69, side + 3, Lg)   # マットレスの横の面
    cv.hline(7, 69, rail, B); cv.hline(7, 69, rail + 1, J); cv.hline(7, 69, rail + 2, Hc)
    cv.hline(7, 69, rail + 3, B); cv.rect(7, rail + 4, 69, rail + 5, Hc); cv.rect(7, rail + 6, 69, rail + 7, E)
    cv.hline(7, 69, rail + 8, B)
    post(cv, 0, 0, 6, 76); post(cv, 70, 0, 76, 76)
    return cv.img()

def table():
    """食卓（64×53）：天板の上の面・天板の手前の板・まえいた・脚2本"""
    cv = Cv(64, 53)
    cv.box(0, 0, 63, 35, G)
    cv.hline(1, 62, 1, J)                              # 天板の上のふちの光
    cv.hline(0, 63, 29, B); cv.rect(1, 30, 62, 31, Hc)  # 天板の手前の板
    cv.hline(0, 63, 32, B); cv.rect(1, 33, 62, 34, E)   # まえいた
    for x0 in (4, 50):                                  # 脚
        cv.rect(x0, 35, x0 + 9, 51, B); cv.rect(x0 + 1, 35, x0 + 8, 50, Hc); cv.rect(x0 + 6, 35, x0 + 8, 50, E)
        cv.a[51, x0] = 0; cv.a[51, x0 + 9] = 0
        cv.hline(x0 + 1, x0 + 8, 52, B); cv.a[52, x0 + 1] = 0; cv.a[52, x0 + 8] = 0
    cv.hline(5, 12, 35, B); cv.hline(51, 58, 35, B)
    cv.a[35, 0] = 0; cv.a[35, 63] = 0
    cv.hline(1, 62, 35, B)
    return cv.img()

def taru():
    """たる（48×63）：ふた（上の面）・おけのふち・たての板・金具の輪2本・下のまるみ"""
    W, H = 48, 63; cv = Cv(W, H); cx = (W - 1) / 2
    ty, by, ry = 10, 52, 10                            # ふたの円のまん中・底の円のまん中・円のたての半径
    def hw(y):                                         # その行の、たるのはんぶんのはば（まん中がふくらむ）
        if y < ty: return 22 * np.sqrt(max(0, 1 - ((ty - y) / ry) ** 2))
        if y > by: return 20 * np.sqrt(max(0, 1 - ((y - by) / ry) ** 2))
        return 20 + 3.5 * np.sin(np.pi * (y - ty) / (by - ty)) + 2 * (by - y) / (by - ty)
    M = np.zeros((H, W), bool)
    for y in range(H):
        h = hw(y + .5)
        for x in range(W): M[y, x] = abs(x - cx) <= h - .25
    # たての板：明るい左・ふつう・かげの右
    for y in range(H):
        for x in range(W):
            if not M[y, x]: continue
            d = (x - cx) / max(1, hw(y + .5))
            cv.px(x, y, G if d < -.45 else (E if d > .45 else Hc))
    for k in (-.72, -.36, 0, .36, .72):                # 板のさかいの線（ふくらみにそって）
        for y in range(ty, H):
            x = int(round(cx + k * hw(y + .5)))
            if M[y, x]: cv.px(x, y, K)
    # 金具の輪：まん中ほど下へまがる帯
    for base in (20, 41):
        for x in range(W):
            if not M[:, x].any(): continue
            dx = (x - cx) / 24; y0 = int(round(base + 4 * np.sqrt(max(0, 1 - dx * dx))))
            for k, c in enumerate((MO, MH, MM, MM, MS, MO)):
                if M[y0 + k, x]: cv.px(x, y0 + k, c)
    # ふた：外の円（ふち）と内の円（上の面）
    for y in range(H):
        for x in range(W):
            e1 = ((x - cx) / 22.2) ** 2 + ((y + .5 - ty) / 9.6) ** 2
            e2 = ((x - cx) / 18.6) ** 2 + ((y + .5 - ty) / 7.6) ** 2
            if e2 <= 1: cv.px(x, y, J)
            elif e1 <= 1: cv.px(x, y, G)
    for y in range(H):                                 # ふたの板の線と、内の円のふちの線
        for x in range(W):
            e2 = ((x - cx) / 18.6) ** 2 + ((y + .5 - ty) / 7.6) ** 2
            if e2 <= 1 and abs(x - cx - 6) < .5 or e2 <= 1 and abs(x - cx + 6) < .5: cv.px(x, y, G)
    I2 = np.zeros((H, W), bool)
    for y in range(H):
        for x in range(W): I2[y, x] = ((x - cx) / 18.6) ** 2 + ((y + .5 - ty) / 7.6) ** 2 <= 1
    O1 = np.zeros((H, W), bool)
    for y in range(H):
        for x in range(W): O1[y, x] = ((x - cx) / 22.2) ** 2 + ((y + .5 - ty) / 9.6) ** 2 <= 1
    def edge(m):                                       # 4つのとなりのどれかが外のマス（はしは外とみる）
        p = np.pad(m, 1); return m & ~(p[:-2, 1:-1] & p[2:, 1:-1] & p[1:-1, :-2] & p[1:-1, 2:])
    for y, x in zip(*np.where(edge(I2))): cv.px(x, y, B)
    for y, x in zip(*np.where(edge(O1))): cv.px(x, y, B)   # ふちの外がわ（上は輪郭、下は板とのさかい）
    for y, x in zip(*np.where(edge(M))): cv.px(x, y, B)                                       # 外の輪郭
    return cv.img()

if __name__ == '__main__':
    for n, f in (('bed_3e1', bed_side), ('table', table), ('taru', taru)):
        im = f(); im.save(os.path.join(REF, n + '.png')); print(n, im.size)
