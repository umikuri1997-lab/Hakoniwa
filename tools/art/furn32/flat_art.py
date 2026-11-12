"""持ち主のベッドのお手本（ref/bed.png）と同じ作り（面ごとに1色のたいらなぬり・1ドットのうすい茶色の輪郭線・12色ほど）で、
食卓・たるを描き、よこのベッド・いすのよこ向きは元の絵（clean64 の絵）の色と線をおきかえる。形と大きさは、いまのチップ（clean64 の絵）と同じ。できた絵は ref/ に書き、clean64.py がそのまま使う。
  CLEAN64_NOREF=1 python3 tools/art/furn32/clean64.py <raw> chair bed && FLAT_RAW=<raw> python3 tools/art/furn32/flat_art.py"""
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

def table():
    """食卓（64×53）：元の絵のとおり、角のまるい天板（木目のすじ2本）・あつい手前の板・ずんぐりした脚"""
    cv = Cv(64, 53)
    cv.rect(0, 0, 63, 35, B); cv.rect(1, 1, 62, 34, G)
    for x, y in ((0, 0), (1, 0), (0, 1), (63, 0), (62, 0), (63, 1), (0, 35), (1, 35), (0, 34), (63, 35), (62, 35), (63, 34)): cv.a[y, x] = 0
    for x, y in ((1, 1), (62, 1), (1, 34), (62, 34)): cv.px(x, y, B)
    cv.hline(2, 61, 1, J)                                   # 天板の上のふちの光
    cv.hline(6, 30, 11, I); cv.hline(34, 57, 19, I)         # 木目のすじ
    cv.hline(1, 62, 28, B)                                   # 天板の上の面と手前の板のさかい
    cv.hline(2, 61, 29, Hc); cv.rect(2, 30, 61, 34, E)       # 手前の板（上のふちだけ明るい）
    for x0 in (5, 49):                                       # 脚（左は明るく、右の3列はかげ）
        cv.rect(x0, 35, x0 + 9, 51, B); cv.rect(x0 + 1, 36, x0 + 8, 50, Hc); cv.rect(x0 + 6, 36, x0 + 8, 50, E)
        for x, y in ((x0, 51), (x0 + 9, 51)): cv.a[y, x] = 0
        cv.px(x0 + 1, 51, B); cv.px(x0 + 8, 51, B); cv.hline(x0 + 2, x0 + 7, 52, B)
        cv.rect(x0 + 2, 51, x0 + 7, 51, Hc); cv.rect(x0 + 6, 51, x0 + 7, 51, E)
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
            if M[y, x]: cv.px(x, y, B)
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
            if e2 <= 1 and (abs(x - cx - 6) < .5 or abs(x - cx + 6) < .5): cv.px(x, y, B)
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

# ---- 元の絵にそう作り：clean64 の絵（元の絵の形のまま）を、お手本の色と1ドットの線にする ----
WOOD = [K, E, I, G, J]            # 木：こい → 明るい
CLOTH = [Lg, D, F, C, A]          # 布
METAL = [MO, MS, MM, MH]          # 金具

def flatten(src):
    """src：clean64 の絵。材料（木・布・金具）にわけ、線（いちばんこい色のかたまり＝clean64 の2ドットの線）は1ドットにして、
    木はうすい茶色・金具はこい灰色。面は、その材料の明るさのじゅんに、お手本の色（木5・布5・金具4）へおきかえる。小さな点はまわりにそろえる"""
    a = np.asarray(src.convert('RGBA')).astype(int); Hh, Ww = a.shape[:2]
    m = a[..., 3] > 0
    rgb = a[..., :3]; lum = rgb @ np.array([.3, .59, .11]); sat = rgb.max(2) - rgb.min(2)
    mat = np.where(sat < 28, np.where(lum > 150, 1, 2), 0)            # 0 木・1 布・2 金具
    mat[~m] = -1
    lab = np.full((Hh, Ww), -1)                                         # 面の段（100*材料+段）。線は 99（木）・98（金具）
    LUM = lambda c: c[0] * .3 + c[1] * .59 + c[2] * .11
    for k, pal in ((0, WOOD), (1, CLOTH), (2, METAL)):
        sel = mat == k
        if not sel.any(): continue
        pl = np.array([LUM(c) for c in pal])
        line = sel & (lum <= lum[sel].min() + 20) if k != 1 else np.zeros_like(sel)
        rest = sel & ~line
        if k == 1: v = lum.copy()                                         # 布：明るさのまま（白は白）
        else:                                                             # 木・金具：線いがいの明るさのはばを、お手本の色のはばにあてる
            lo, hi = np.percentile(lum[rest], 3), np.percentile(lum[rest], 97)
            v = pl[0] + (lum - lo) * (pl[-1] - pl[0]) / max(1, hi - lo)
        lab[line] = 99 if k != 2 else 98
        lab[rest] = 100 * k + np.abs(v[rest][:, None] - pl[None, :]).argmin(1)
    # 線を1ドットに：2ドットの帯は、上・左がわの1ドットだけのこす
    L = (lab == 99) | (lab == 98); P = np.pad(L, 1)
    up, lf = P[:-2, 1:-1], P[1:-1, :-2]
    thin = L & ~(up & lf) & ~(up & P[1:-1, 2:] & ~lf) & ~(lf & P[2:, 1:-1] & ~up)
    drop = L & ~thin
    FACE = lambda q: q not in (-1, 98, 99)
    for _ in range(4):                                                  # けした線の所は、となりの面の色でうめる
        for y, x in zip(*np.where(drop)):
            nb = [lab[yy, xx] for yy, xx in ((y-1,x),(y+1,x),(y,x-1),(y,x+1)) if 0 <= yy < Hh and 0 <= xx < Ww and FACE(lab[yy, xx]) and not drop[yy, xx]]
            if nb: lab[y, x] = max(set(nb), key=nb.count); drop[y, x] = False
    lab[drop & (mat == 2)] = 98; lab[drop & (mat != 2)] = 99
    for _ in range(2):                                                  # 小さな点（同じ段がとなりに1つまで）は、まわりの多い段に
        n = lab.copy()
        for y in range(Hh):
            for x in range(Ww):
                if not FACE(lab[y, x]): continue
                nb = [lab[yy, xx] for yy in range(y-1, y+2) for xx in range(x-1, x+2) if (yy, xx) != (y, x) and 0 <= yy < Hh and 0 <= xx < Ww and FACE(lab[yy, xx])]
                if nb and sum(1 for q in nb if q == lab[y, x]) <= 1: n[y, x] = max(set(nb), key=nb.count)
        lab = n
    P = np.pad(m, 1); edge = m & ~(P[:-2, 1:-1] & P[2:, 1:-1] & P[1:-1, :-2] & P[1:-1, 2:])   # 外のふち：1ドットの線
    out = np.zeros((Hh, Ww, 4), np.uint8)
    for y in range(Hh):
        for x in range(Ww):
            if not m[y, x]: continue
            q = lab[y, x]
            c = MO if q == 98 else B if (edge[y, x] or q == 99) else (WOOD, CLOTH, METAL)[q // 100][q % 100]
            out[y, x, :3] = c; out[y, x, 3] = 255
    return Image.fromarray(out, 'RGBA')

RAW = os.environ.get('FLAT_RAW')   # clean64 の絵（CLEAN64_NOREF=1 で作った、元の絵の形のまま）のフォルダ

def bed_side_raw():
    """よこのベッド：元の絵の形（まくら・かけぶとんのおり返し・わく）は clean64 の絵から。柱は元の絵のとおり、上の面・帯2つ"""
    im = flatten(Image.open(os.path.join(RAW, 'bed_3e1.png'))); a = np.asarray(im).copy(); cv = Cv(77, 77); cv.a = a
    for x0 in (0, 70):
        cv.box(x0, 0, x0 + 6, 76, Hc)
        cv.rect(x0 + 1, 1, x0 + 5, 5, J); cv.rect(x0 + 1, 6, x0 + 5, 10, Hc); cv.hline(x0, x0 + 6, 11, B)
        cv.rect(x0 + 1, 12, x0 + 5, 39, G); cv.hline(x0, x0 + 6, 40, B); cv.rect(x0 + 1, 41, x0 + 5, 45, J)
    return cv.img()

def chair_side_raw():
    """いすのよこ向き：元の絵（まるい背もたれ）の形のまま、色と線をお手本の作りに"""
    return flatten(Image.open(os.path.join(RAW, 'chair_3e1.png')))

if __name__ == '__main__':
    todo = [('table', table), ('taru', taru)]
    if RAW: todo += [('bed_3e1', bed_side_raw), ('chair_3e1', chair_side_raw)]
    for n, f in todo:
        im = f(); im.save(os.path.join(REF, n + '.png')); print(n, im.size)
