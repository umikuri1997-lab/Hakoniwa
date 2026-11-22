"""がけ（段差）のオートタイル（タイルセット）を、いまのチップ（cliff:block・cliff:sideL~d・cledge:〜・clwave:〜）から組む。
作り方は、ゲーム制作のふつうの作法（RPGツクールのA4・壁タイル、Godot のテレイン）：
  上の面 cltop:<g|d><m>#<v>   47まいのブロブ。m は、となり8マスのつながり（N1 E2 S4 W8、角 NE16 SE32 SW64 NW128。
        角は、両どなりがつながるときだけ数える）。g 草地・d 乾いた地面と石。v はちがう絵（0・1）。
        まん中はすけていて、ゲームは上の面の地面（地面の下絵・ブロックの絵）を、タイルの形で切って先に描く。
        タイルは、ふちの帯・丸い角・手前の角で正面の岩が丸にそって上がる所・正面にたれる草や土をふくむ。
  正面   clface:<lr><u><b>#<v>  1だんぶんの壁タイル。lr：左右のつながり（L1 R2）、u：上へつづく 1、
        b：下のはし（m 下へつづく・g 草地につく・d 乾いた地面につく・k ブロックの上にのる）。足もとのかげ・でこぼこもふくむ。
世界の 1 点 = タイルの 2 ドット（g64）。上の面タイルは、マスの左上から (-4,-4) 〜 (36,42)、正面タイルは (0,0) 〜 (32,42)（左右によゆうを入れない：絵をなめらかにのばすとき、すけたよゆうとまざって、さかいめに線が出る）。
  python3 tools/art/cliffedge/cliff_autotile.py"""
import os, sys, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))
import chips
from PIL import Image, ImageChops

RO, TS = 16, 32
N, E, S_, W_, NE, SE, SW, NW = 1, 2, 4, 8, 16, 32, 64, 128
PAD = 4

def blob_masks():
    out = set()
    for m in range(256):
        r = m & 15
        if not (r & N and r & E): m &= ~NE
        if not (r & S_ and r & E): m &= ~SE
        if not (r & S_ and r & W_): m &= ~SW
        if not (r & N and r & W_): m &= ~NW
        out.add(m)
    return sorted(out)

class Canvas:
    def __init__(self, x0, y0, x1, y1):
        self.x0, self.y0 = x0, y0
        self.im = Image.new('RGBA', ((x1 - x0) * 2, (y1 - y0) * 2), (0, 0, 0, 0))
    def put(self, src, wx, wy, box=None, alpha=None):
        if src is None: return
        if box: src = src.crop(box)
        if src.width <= 0 or src.height <= 0: return
        L = Image.new('RGBA', self.im.size, (0, 0, 0, 0))
        L.paste(src, (round((wx - self.x0) * 2), round((wy - self.y0) * 2)))
        self.im = Image.alpha_composite(self.im, L)
    def fill(self, wx, wy, w, h, col, a):
        x0, y0 = round((wx - self.x0) * 2), round((wy - self.y0) * 2)
        L = Image.new('RGBA', self.im.size, (0, 0, 0, 0)); L.paste(Image.new('RGBA', (round(w * 2), round(h * 2)), col + (round(255 * a),)), (x0, y0))
        self.im = Image.alpha_composite(self.im, L)
    def px(self, wx, wy):  # 世界の点 → ドット
        return round((wx - self.x0) * 2), round((wy - self.y0) * 2)

def main():
    head, C = chips.load_imgs()
    G = lambda k: C[k]['f'][0].convert('RGBA') if k in C else None
    blk, blm = G('cliff:block'), G('cliff:blockm')
    def arcY(x, fy, tl, tr):
        xc = max(0, min(TS - 1, x)) + .5
        if tl and xc < RO: d = RO - xc; return round(fy - RO + math.sqrt(max(0, RO * RO - d * d)))
        if tr and xc > TS - RO: d = xc - (TS - RO); return round(fy - RO + math.sqrt(max(0, RO * RO - d * d)))
        return fy
    def col_face(cv, x, fy, d, ya, yb):   # 正面の絵を、1点のはばの列で d だけ上へずらす（js の colFace）
        t0 = fy - d; sx = (x % TS) * 2
        a, b = max(ya, t0), min(yb, t0 + TS)
        if b > a: cv.put(blk, x, a, (sx, (a - t0) * 2, sx + 2, (b - t0) * 2))
        c, e = max(ya, t0 + TS), min(yb, t0 + 2 * TS)
        if e > c: cv.put(blm, x, c, (sx, (c - t0 - TS) * 2, sx + 2, (e - t0 - TS) * 2))
    def below_arc_mask(cv, fy, tl, tr):   # 丸い角の、弧より下だけを残すマスク（上の面の地面が見える所はすかす）
        m = Image.new('L', cv.im.size, 255); P = m.load()
        for X in range(cv.im.width):
            for Y in range(cv.im.height):
                wx, wy = cv.x0 + X / 2 + .25, cv.y0 + Y / 2 + .25
                inc = (tl and 0 <= wx < RO) or (tr and TS - RO <= wx < TS)
                if inc and wy < fy and wy < arcY(int(math.floor(wx)), fy, tl, tr): P[X, Y] = 0
        return m
    out = {}
    # ---------------- 上の面（47まい × 草地・乾いた地面 × 2）
    for st in ('g', 'd'):
        for m in blob_masks():
            for v in (0, 1):
                cv = Canvas(-PAD, -PAD, TS + PAD, TS + 10)
                oN, oE, oS, oW = not m & N, not m & E, not m & S_, not m & W_
                k0, k1, k2, k3 = oN and oW, oN and oE, oS and oW, oS and oE   # 外の角：うしろ左・うしろ右・手前左・手前右
                fy = TS
                # 手前の丸い角：正面の岩が丸にそって上がる（弧より下だけ）・暗く・はしの光とかげ
                if k2 or k3:
                    L = Canvas(-PAD, -PAD, TS + PAD, TS + 10)
                    for x in range(TS):
                        if (k2 and x < RO) or (k3 and x >= TS - RO): col_face(L, x, fy, fy - arcY(x, fy, k2, k3), arcY(x, fy, k2, k3), fy)
                    if k2: L.fill(0, fy - RO, RO, RO, (30, 20, 12), .38); L.put(G('cledge:edgeL'), 0, fy - RO, (0, 0, 4, RO * 2))
                    if k3: L.fill(TS - RO, fy - RO, RO, RO, (30, 20, 12), .38); L.put(G('cledge:edgeR'), TS - 2, fy - RO, (4, 0, 8, RO * 2))
                    L.im.putalpha(ImageChops.multiply(L.im.getchannel('A'), below_arc_mask(L, fy, k2, k3)))
                    cv.im = Image.alpha_composite(cv.im, L.im)
                # 正面にたれる草・土（まっすぐな所）
                xs, xe = (RO if k2 else 0), (TS - RO if k3 else TS)
                if oS:
                    if st == 'g': cv.put(G('cledge:glip#%d' % (v * 2)), xs, fy, (xs * 2, 0, xe * 2, 18))
                    else: cv.put(G('clwave:dlip#%d' % (v * 2)), xs, fy, (xs * 2, 0, xe * 2, 6))
                # ふちの帯（うしろ・左・右）。丸い角のあるがわは、まっすぐな絵
                sa, sb = (RO - 1.5 if k0 else 0), (RO - 1.5 if k1 else 0)
                ea, eb = (RO if k2 else 0), (RO if k3 else 0)
                B = Canvas(-PAD, -PAD, TS + PAD, TS + 10)
                if st == 'g':
                    vb = 's' if (k0 or k1) else v * 2; vs = 's' if (k0 or k2) else v * 2 + 1; vr = 's' if (k1 or k3) else v * 2
                    if oN: B.put(G('cledge:gback#%s' % vb), sa, -3.5, (round(sa * 2), 0, round((TS - sb) * 2), 10))
                    if oW: B.put(G('cledge:gside#%s' % vs), -3.5, sa, (0, round(sa * 2), 10, round((TS - ea) * 2)))
                    if oE: B.put(G('cledge:gsideR#%s' % vr), TS - 1.5, sb, (0, round(sb * 2), 10, round((TS - eb) * 2)))
                    if k0: B.put(G('cledge:gcornB'), -1.5, -1.5)
                    if k1: B.put(G('cledge:gcornBR'), TS + 1.5 - RO, -1.5)
                else:
                    if oN: B.put(G('cliff:back~d'), sa, -1.5, (round(sa * 2), 0, round((TS - sb) * 2), 6))
                    if oW: B.put(G('cliff:sideL~d'), -1.5, sa, (0, 0, 6, round((TS - sa - ea) * 2)))
                    if oE: B.put(G('cliff:sideR~d'), TS - 1.5, sb, (0, 0, 6, round((TS - sb - eb) * 2)))
                    if k0: B.put(G('cledge:dcornB'), -1.5, -1.5)
                    if k1: B.put(G('cledge:dcornBR'), TS + 1.5 - RO, -1.5)
                    # 岩の帯と上の面のさかいをぼかす：帯の内がわほど、下の地面がすける（内 .6・まん中 .3・外 .1）
                    A = B.im.getchannel('A'); P = A.load()
                    for X in range(B.im.width):
                        for Y in range(B.im.height):
                            if not P[X, Y]: continue
                            wx, wy = B.x0 + X / 2 + .25, B.y0 + Y / 2 + .25; ds = []
                            if oW and sa <= wy < TS - ea: ds.append(wx + 1.5)
                            if oE and sb <= wy < TS - eb: ds.append(TS + 1.5 - wx)
                            if oN and sa <= wx < TS - sb: ds.append(wy + 1.5)
                            if k0 and wx < RO - 1.5 and wy < RO - 1.5: ds.append(RO - math.hypot(wx - (RO - 1.5), wy - (RO - 1.5)))
                            if k1 and wx > TS - RO + 1.5 and wy < RO - 1.5: ds.append(RO - math.hypot(wx - (TS - RO + 1.5), wy - (RO - 1.5)))
                            if not ds: continue
                            dd = min(ds); al = .6 if dd >= 2 else .3 if dd >= 1 else .1
                            P[X, Y] = round(P[X, Y] * (1 - al))
                    B.im.putalpha(A)
                # うしろの内の角（両どなりはつながり、ななめが低い）：両がわの帯を角でつなぐ
                for on, sx in ((m & N and m & W_ and not m & NW, 1), (m & N and m & E and not m & NE, -1)):
                    if not on: continue
                    ox = 0 if sx > 0 else TS
                    band = G('cliff:sideL~d')
                    for X in range(B.im.width):
                        for Y in range(B.im.height):
                            wx, wy = B.x0 + X / 2 + .25, B.y0 + Y / 2 + .25
                            u = (wx - (ox - 1.5)) if sx > 0 else ((ox + 1.5) - wx); vv = wy + 1.5
                            if not (0 <= u < 3 and 0 <= vv < 3): continue
                            dd = min(u, vv)
                            if st == 'g': c = [(92, 124, 66), (128, 162, 86), (150, 184, 98)][min(2, int(dd))] + (255,)
                            else: c = band.getpixel((min(5, int(dd * 2)), 20)); c = c[:3] + (round(c[3] * (1 - (.6 if dd >= 2 else .3 if dd >= 1 else .1))),)
                            B.im.putpixel((X, Y), c)
                cv.im = Image.alpha_composite(cv.im, B.im)
                # 手前のふち：上の面の下はしの光（まっすぐな所）と、手前の丸い角
                if oS:
                    cv.fill(xs, TS - 1.5, xe - xs, 1.5, (255, 246, 222), .3)
                    if st == 'g':
                        if k2: cv.put(G('cledge:gcornF'), -2.5, TS - RO)
                        if k3: cv.put(G('cledge:gcornFR'), TS - 18.5, TS - RO)
                    else:
                        if k2: cv.put(G('cledge:dcornF'), -1.5, TS - RO)
                        if k3: cv.put(G('cledge:dcornFR'), TS + 1.5 - RO, TS - RO)
                out['cltop:%s%d#%d' % (st, m, v)] = cv.im
    # ---------------- 正面（1だんぶん）
    for lr in range(4):
        for up in (0, 1):
            for b in ('m', 'g', 'd', 'k'):
                for v in (0, 1):
                    cv = Canvas(0, 0, TS, TS + 10)
                    lft, rgt = not lr & 1, not lr & 2; dn = b == 'm'
                    tl, tr = (not up) and lft, (not up) and rgt
                    F = Canvas(0, 0, TS, TS + 10)
                    for x in range(TS):
                        src = blm if up else blk
                        F.put(src, x, 0, ((x % TS) * 2, 0, (x % TS) * 2 + 2, 64))
                        if (tl and x < RO) or (tr and x >= TS - RO): col_face(F, x, 0, 0 - arcY(x, 0, tl, tr), 0, TS)
                    F.fill(0, 0, TS, TS, (30, 20, 12), .38)
                    if lft: F.put(G('cledge:edgeL'), 0, 0)
                    if rgt: F.put(G('cledge:edgeR'), TS - 4, 0)
                    if not up:
                        xa, xb = (RO if tl else 0), (TS - RO if tr else TS)
                        F.put(G('cledge:hi'), xa, 0, (xa * 2, 0, xb * 2, 6))
                    if not dn:
                        F.put(G('cledge:ao'), 0, TS - 6)
                        if b in 'gd': F.put(G('clwave:%swave#%d' % (b, v)), 0, TS - 6)
                        # 地面につく左右の下の角：丸く切る
                        bl, br = lft, rgt
                        A = F.im.getchannel('A'); P = A.load()
                        for X in range(F.im.width):
                            for Y in range(F.im.height):
                                wx, wy = F.x0 + X / 2 + .25, Y / 2 + .25
                                for on, ox, dx in ((bl, -2, 1), (br, TS + 1, -1)):
                                    if not on: continue
                                    cx, cy, rr = ox + dx * RO, TS + 1.5 - RO, RO - 1.5
                                    if (wx - cx) * dx < 0 and wy > cy and math.hypot(wx - cx, wy - cy) > rr: P[X, Y] = 0
                        F.im.putalpha(A)
                    cv.im = Image.alpha_composite(cv.im, F.im)
                    if b in 'gd': cv.put(G('cledge:gsh%s#%d' % (('L' if lft else '') + ('R' if rgt else ''), v * 2)), 0, TS)
                    if b == 'k':
                        fa, fb = (RO - 2 if lft else 0), (RO - 1 if rgt else 0)
                        cv.put(G('cliff:foot'), fa, TS, (fa * 2, 0, 64 - fb * 2, 6))
                    out['clface:%d%d%s#%d' % (lr, up, b, v)] = cv.im
    for k, im in out.items():
        C[k] = {'ax': -PAD * 2 if k.startswith('cltop') else 0, 'ay': -PAD * 2 if k.startswith('cltop') else 0, 'w': im.width, 'h': im.height, 'g': 64, 'f': [im]}
    chips.pack_imgs(head, C)
    print(len(out), 'tiles')

if __name__ == '__main__':
    main()
