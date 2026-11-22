"""がけ（段差）の、いままでコードで1ドットずつぬっていた所を、マップチップ（1マス64ドット、g64）に書き出す。
id は cledge:〜（ふち・かげ）と clwave:〜（地面の色の物）。256色は id の : の前ごとなので、前からの cliff:〜 の色をかえないよう、べつにしてある。
ゲームは、このチップをならべて描くだけ（js/draw-world.js の cliffRow）。でこぼこのある部品は4しゅるい（#0〜#3）、
はしのでこぼこは0にそろえて、となりのマス・丸い角とつながる。#s は、まっすぐ（丸い角のあるマスで使う）。
  草のふち  cledge:gside#k（左。右は cledge:gsideR#k）・cledge:gback#k（うしろ）
  うしろの丸い角  cliff:gcornB・gcornBR（草地）、cliff:dcornB・dcornBR（乾いた地面。岩の帯 cliff:sideL~d の色）
  手前の丸い角  cliff:gcornF・gcornFR（草：横の草の帯から正面の草の層へ）、cliff:dcornF・dcornFR（岩の帯。下ほどうすく）
  正面にたれる草・土  cliff:glip#k（はしの草のあつみは5）・cliff:dlip#k
  足もとのでこぼこ  cliff:gwave#k・cliff:dwave#k（下の地面の草・土。すぐ上の岩にうすいかげ）
  足もとのかげ  cliff:gsh#k・gshL#k・gshR#k・gshLR#k（L・R：その下の角が丸い）
  正面のはし  cliff:edgeL・edgeR（光・かげ）、cliff:hi（上のふちの光）、cliff:ao（下のかげ）、cliff:aot#…（上の面の、うしろの柱の足もとのかげ）
  python3 tools/art/cliffedge/cliffedge.py"""
import os, sys, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))
import chips
from PIL import Image

RO, TS = 16, 32
LIPC = [(150, 184, 98), (128, 162, 86), (92, 124, 66)]   # 草の層：明るい・まん中・こい（js の LIPC）
GRB = [LIPC[2], LIPC[1], LIPC[0]]                       # 草のふちの帯：外から、こい・まん中・明るい
SH = (30, 20, 12); SHG = (30, 40, 20)

def h32(i):
    i &= 0xffffffff
    i = ((i ^ 61) ^ (i >> 16)) & 0xffffffff
    i = (i + (i << 3)) & 0xffffffff
    i ^= i >> 4
    i = (i * 0x27d4eb2d) & 0xffffffff
    i ^= i >> 15
    return i / 4294967296

def noise(v, sd):   # なめらかなノイズ（0〜1）：js の lipN と同じ作り
    s = 0
    for g, a in ((9, .7), (4, .3)):
        x = v + sd; i = math.floor(x / g); f = x / g - i; u = f * f * (3 - 2 * f)
        hh = lambda n: h32((n * 7349 + g * 911) & 0xffffffff)
        s += a * (hh(i) * (1 - u) + hh(i + 1) * u)
    return s

def taper(i, n, k):  # はし k ドットで0になる
    return max(0, min(1, i / k, (n - 1 - i) / k))

def img(w, h): return Image.new('RGBA', (w, h), (0, 0, 0, 0))

def put(im, X, Y, W, H, col, a=1.0):  # 世界の点（0.5 きざみ）で、四角をぬる（重ねるときは上に合成）
    x0, y0, x1, y1 = round(X * 2), round(Y * 2), round((X + W) * 2), round((Y + H) * 2)
    for y in range(max(0, y0), min(im.height, y1)):
        for x in range(max(0, x0), min(im.width, x1)):
            over(im, x, y, col, a)

def over(im, x, y, col, a):
    r, g, b, A = im.getpixel((x, y)); A /= 255
    oa = a + A * (1 - a)
    if oa <= 0: return
    c = [(col[k] * a + (r, g, b)[k] * A * (1 - a)) / oa for k in range(3)]
    im.putpixel((x, y), (round(c[0]), round(c[1]), round(c[2]), round(oa * 255)))

def chip(C, k, im, ax, ay):
    C[k] = {'ax': ax, 'ay': ay, 'w': im.width, 'h': im.height, 'g': 64, 'f': [im]}

def mir(im): return im.transpose(Image.FLIP_LEFT_RIGHT)

def main():
    head, C = chips.load_imgs()
    SEEDS = [11, 47, 83, 131]
    # --- 草のふち（左）：外のはし x0-1.5 から内へ 3ドット。外へだけ 0〜2 ドットでこぼこ（はしは0）
    def gside(sd):
        im = img(10, 64)   # 世界 x0-3.5 〜 x0+1.5
        for r in range(32):
            o = 0 if sd is None else max(0, round((noise(r * .7, sd) * 2.6 - .6) * taper(r, 32, 6)))
            e = -1.5 - o
            for x0, w, c in ((e, 1, GRB[0]), (e + 1, 1, GRB[1]), (e + 2, 1.5 - (e + 2), GRB[2])):
                if w > 0: put(im, x0 + 3.5, r, w, 1, c)
        return im
    for k, sd in list(enumerate(SEEDS)) + [('s', None)]:
        im = gside(sd)
        chip(C, 'cledge:gside#%s' % k, im, -7, 0)
        chip(C, 'cledge:gsideR#%s' % k, mir(im), 61, 0)
        chip(C, 'cledge:gback#%s' % k, im.transpose(Image.TRANSPOSE), 0, -7)
    # --- うしろの丸い角（草）：外の角 (x0-1.5, ty-1.5) から内へ、こい・まん中・明るいの3つの輪
    im = img(32, 32)
    cx = cy = RO
    for py in range(32):
        for px in range(32):
            wx, wy = px / 2 + .25, py / 2 + .25
            d = RO - math.hypot(wx - cx, wy - cy)
            for q in range(3):
                if q <= d < q + 1: im.putpixel((px, py), GRB[q] + (255,))
    chip(C, 'cledge:gcornB', im, -3, -3); chip(C, 'cledge:gcornBR', mir(im), 35, -3)
    # --- 岩の帯の丸い角（乾いた地面）：岩の帯 cliff:sideL~d の色を、丸にそってまげる（fd：たてからよこへいくほどうすく）
    band = C['cliff:sideL~d']['f'][0].convert('RGBA'); BW, BL = band.size
    def rcband(fd):
        im = img(32, 32)
        for py in range(32):
            for px in range(32):
                wx, wy = px / 2 + .25, py / 2 + .25   # 外の角からの距離（内へ＋）
                d = math.hypot(wx - RO, wy - RO)
                if d > RO or d < RO - 3: continue
                c = min(5, math.floor((RO - d) / 3 * 6)); t = math.atan2(abs(wy - RO), abs(wx - RO)) / (math.pi / 2)
                r = min(BL - 1, math.floor(BL * .4 + t * (BL - 1) * .2)); p = band.getpixel((c, r))
                if p[3] < 8: continue
                fo = max(0, min(1, (.95 - t) / .5)) if fd else 1
                if fo <= 0: continue
                im.putpixel((px, py), p[:3] + (round(p[3] * fo),))
        return im
    b = rcband(False); chip(C, 'cledge:dcornB', b, -3, -3); chip(C, 'cledge:dcornBR', mir(b), 35, -3)
    f = rcband(True).transpose(Image.FLIP_TOP_BOTTOM)   # 手前の角：外の角 (x0-1.5, ty+TS) から上へ
    chip(C, 'cledge:dcornF', f, -3, 32); chip(C, 'cledge:dcornFR', mir(f), 35, 32)
    # --- 手前の丸い角（草）：横の草の帯（ふちをまたぐ3ドット）から、正面の草の層（ふちの外へ L=5）へ、丸にそって1本でかわる帯
    L = 5
    im = img(42, 48)    # 世界 x0-2.5 〜 x0+18.5、y：ty+TS-RO 〜 +24
    ox, oy = -2.5, 0.0
    cxw, cyw = RO, 0.0  # 角の中心（x0+RO, ty+TS-RO）
    COL = [GRB[2], GRB[1], GRB[0]]
    for py in range(48):
        for px in range(42):
            wx, wy = ox + px / 2 + .25, oy + py / 2 + .25
            ex, ey = cxw - wx, wy - cyw
            if ex < -2 or ey < 0: continue
            r = math.hypot(ex, ey); t = math.atan2(ey, max(ex, 1e-9)) / (math.pi / 2)
            ri, ro = RO - 1.5 * (1 - t), RO + 1.5 * (1 - t) + L * t
            if r < ri or r >= ro + 2 * t: continue
            if r >= ro:
                if t < .3: continue
                im.putpixel((px, py), SHG + (round(255 * (.34 if r < ro + 1 else .16)),))
            elif r >= ro - 1: im.putpixel((px, py), LIPC[2] + (255,))
            elif r < ri + 1: im.putpixel((px, py), LIPC[0] + (255,))
            else: im.putpixel((px, py), LIPC[1] + (255,))
    chip(C, 'cledge:gcornF', im, -5, 32); chip(C, 'cledge:gcornFR', mir(im), 64 - 37, 32)
    # --- 正面にたれる草の層（まっすぐな所）：明るい1・まん中・こい1、その下の岩に草のかげ2行。はしのあつみは5
    for k, sd in enumerate(SEEDS):
        im = img(64, 18)
        for x in range(32):
            Lx = 5 + round((noise(x * 1.0, sd + 300) - .5) * 4 * taper(x, 32, 5))
            put(im, x, 0, 1, 1, LIPC[0]); put(im, x, 1, 1, Lx - 2, LIPC[1]); put(im, x, Lx - 1, 1, 1, LIPC[2])
            put(im, x, Lx, 1, 1, SHG, .34); put(im, x, Lx + 1, 1, 1, SHG, .16)
        chip(C, 'cledge:glip#%d' % k, im, 0, 0)
    # --- 正面のふちに出る土（乾いた地面）：0〜2ドット。色は tex:dry、上の面と同じく少し明るく
    dry = C['tex:dry']['f'][0].convert('RGBA'); grs = C['tex:grass']['f'][0].convert('RGBA')
    MEAN = {}
    def tex(T, x, y):   # 地面の絵の色。小石・草のかげなど、まわりとちがいすぎる点は、平均の色にする（がけの下に点が出ないように）
        if id(T) not in MEAN:
            px = list(T.getdata()); MEAN[id(T)] = tuple(sum(p[k] for p in px) // len(px) for k in range(3))
        m = MEAN[id(T)]; c = T.getpixel((int(x) % T.width, int(y) % T.height))[:3]
        return c if sum(abs(c[k] - m[k]) for k in range(3)) < 45 else m
    for k, sd in enumerate(SEEDS):
        im = img(64, 6)
        for x in range(32):
            Lx = round(2.4 * noise(x * 1.0, sd + 517) * taper(x, 32, 3) + (1 - taper(x, 32, 3)) * 1)
            for y in range(Lx):
                put(im, x, y, 1, 1, tex(dry, x + k * 37, 90 + y)); put(im, x, y, 1, 1, (255, 250, 232), .08)
        chip(C, 'clwave:dlip#%d' % k, im, 0, 0)
    # --- 足もとのでこぼこ：下の地面（草 1〜4・土 1〜3 ドット）が、がけの下にかかる。いちばん上の1ドットはうすく、すぐ上の岩にうすいかげ
    for nm, T, base, amp, sd0 in (('gwave', grs, 1, 3, 31), ('dwave', dry, 1, 2, 911)):
        for k, sd in enumerate(SEEDS):
            im = img(64, 12)   # 世界 yb-6 〜 yb
            for x in range(32):
                tp = taper(x, 32, 4)
                Lx = round(base + amp * (noise(x * 1.4, sd + sd0) * tp + .5 * (1 - tp)))
                top = 6 - Lx
                put(im, x, top - 1, 1, 1, SH, .14)
                for y in range(top, 6):
                    c = tex(T, x + k * 41, 60 + y); a = .5 if y == top else 1
                    put(im, x, y, 1, 1, c, a); put(im, x, y, 1, 1, SH, .1 if y == top else .2)
            chip(C, 'clwave:%s#%d' % (nm, k), im, 0, 52)
    # --- 地面に落ちる足もとのかげ：列ごとに長さ（4〜7）がかわり、下ほどうすい。L・R はその下の角が丸い所
    for k, sd in enumerate(SEEDS):
        for cn, bl, br in (('', 0, 0), ('L', 1, 0), ('R', 0, 1), ('LR', 1, 1)):
            im = img(64, 14)
            for x in range(32):
                e = min(x if bl else 99, 31 - x if br else 99)
                kk = 1 if e >= RO - 2 else max(0, (e - 3) / (RO - 5))
                tp = taper(x, 32, 4); n = 4 + round(3 * (noise(x * .6, sd + 77) * tp + .33 * (1 - tp)))
                for q in range(n):
                    a = .22 * (1 - q / n) ** 1.6 * kk
                    a = round(a / .22 * 5) / 5 * .22
                    if a > 0: put(im, x, q, 1, 1, SH, a)
            chip(C, 'cledge:gsh%s#%d' % (cn, k), im, 0, 64)
    # --- 正面のはしの光・かげ（まるい柱の見え方）、上のふちの光、下のかげ
    im = img(4, 64); put(im, 0, 0, 2, 32, (255, 240, 220), .1); chip(C, 'cledge:edgeL', im, 0, 0)
    im = img(8, 64); put(im, 0, 0, 2, 32, SH, .1); put(im, 2, 0, 2, 32, SH, .22); chip(C, 'cledge:edgeR', im, 56, 0)
    im = img(64, 6); put(im, 0, 0, 32, 1.5, (255, 246, 222), .3); put(im, 0, 1.5, 32, 1.5, (255, 246, 222), .15); chip(C, 'cledge:hi', im, 0, 0)
    im = img(64, 12)
    for i, a in enumerate((.24, .14, .06)): put(im, 0, 6 - (i + 1) * 2, 32, 2, SH, a)
    chip(C, 'cledge:ao', im, 0, 52)
    for cn, fa, fb in (('', 0, 0), ('L', RO - 2, 0), ('R', 0, RO - 1), ('LR', RO - 2, RO - 1)):
        im = img(64, 12)
        for q, a in enumerate((.24, .14, .06)):
            ia = q * 2 if fa else 0; ib = q * 2 if fb else 0
            put(im, fa + ia, q * 2, 32 - fa - fb - ia - ib, 2, SH, a)
        chip(C, 'cledge:aot' + cn, im, 0, 0)
    chips.pack_imgs(head, C)
    print('cliff edge chips: done')

if __name__ == '__main__':
    main()
