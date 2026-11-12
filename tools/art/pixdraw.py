#!/usr/bin/env python3
"""ドット絵を、コードで1ドットずつ描くための小さな道具（チップの描きなおし用。スキル pixel-redraw）。
  from pixdraw import Pix
  p = Pix(68, 74)
  p.slab(2, 21, 65, 57, fill=TB, line=OT, top=(4, 2, 1, 1), bottom=(2, 1))   # 角が段々の板
  p.hl(50, 3, 64, LIP)                                                        # よこ線
  p.inner(TB, OT, TI, sides='ULR')                                            # 輪郭の内がわ1ドット
  p.oval(4, 2, 37, 30, fill=TB, line=OT)                                      # だ円（丸い物）
  p.shape(rows_from('before/stool.png'), fill=TB, line=OT)                    # 前の絵と同じ形
  p.round_top(1, 1, 40, 27, 6, top=TB, side=AB, line_top=OT, line_side=OD, lip=LIP, side_shade=AS)   # 丸い板（上の面＋厚み）
  p.leg(6, 58, 15, 73, LB, LL, LS, OD)                                        # 脚
  p.put('table')                                                              # チップに入れて、アトラスと chips.js を作りなおす
色は (r, g, b)。座標はチップのドット（左上が 0,0）。x1・y1 はその点もふくむ。"""
import os, sys
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# 木の家具の色（食卓・スツール・ベンチなど、同じ木の家具は、この8色を使いまわす）
OT = (0xaf, 0x7b, 0x48)   # 上の面の輪郭・正面の面・脚
OD = (0x8f, 0x5b, 0x36)   # 正面・脚の輪郭
TB = (0xe0, 0xaf, 0x67)   # 上の面
TS = (0xd9, 0xa7, 0x61)   # 上の面の木目
TI = (0xcc, 0x98, 0x59)   # 上の面の輪郭の内がわ
LIP = (0xee, 0xc5, 0x7c)  # 上の面の手前のふちの光
AB = OT                   # 正面の面（上の面の輪郭と同じ色）
AS = (0xa2, 0x6e, 0x43)   # 正面・脚のかげ
LL = (0xbd, 0x88, 0x52)   # 脚の光

class Pix:
    def __init__(self, w, h):
        self.w, self.h = w, h; self.im = Image.new('RGBA', (w, h), (0, 0, 0, 0)); self.px = self.im.load()
    def at(self, x, y):
        """その点の色（透明・外は None）"""
        if not (0 <= x < self.w and 0 <= y < self.h): return None
        c = self.px[x, y]; return c[:3] if c[3] else None
    def dot(self, x, y, c): self.px[x, y] = tuple(c) + (255,)
    def clear(self, x, y): self.px[x, y] = (0, 0, 0, 0)
    def hl(self, y, x0, x1, c):
        for x in range(x0, x1 + 1): self.dot(x, y, c)
    def vl(self, x, y0, y1, c):
        for y in range(y0, y1 + 1): self.dot(x, y, c)
    def rect(self, x0, y0, x1, y1, c):
        for y in range(y0, y1 + 1): self.hl(y, x0, x1, c)
    def slab(self, x0, y0, x1, y1, fill, line, top=(), bottom=(), line_rows=None):
        """角が段々の四角。top・bottom は、上・下のはしの行から順の、左右のへこみ（例 (4,2,1,1)）。
        中を fill でぬり、いちばん外の1ドットを line にする。line_rows={行: 色} で、行ごとに輪郭の色をかえられる。"""
        ins = {}
        for i, d in enumerate(top): ins[y0 + i] = d
        for i, d in enumerate(bottom): ins[y1 - i] = d
        for y in range(y0, y1 + 1): self.hl(y, x0 + ins.get(y, 0), x1 - ins.get(y, 0), fill)
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                if self.at(x, y) != tuple(fill): continue
                if any(self.at(x + dx, y + dy) is None or not (x0 <= x + dx <= x1 and y0 <= y + dy <= y1) for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                    self.px[x, y] = (255, 0, 255, 254)   # 印（あとで輪郭の色に）
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                if self.px[x, y] == (255, 0, 255, 254): self.dot(x, y, (line_rows or {}).get(y, line))
    def inner(self, base, line, c, sides='ULRD', y0=0, y1=None):
        """輪郭（line）のとなりの base のドットを c にする（輪郭の内がわのなじむ色）。sides：輪郭がどちらがわにあるとき（U上 D下 L左 R右）。
        ななめのとなりも見るので、丸い形・段々の角でも、とぎれない1ドットの帯になる"""
        D = {'U': ((0, -1), (-1, -1), (1, -1)), 'D': ((0, 1), (-1, 1), (1, 1)), 'L': ((-1, 0), (-1, -1), (-1, 1)), 'R': ((1, 0), (1, -1), (1, 1))}
        ds = {d for s in sides for d in D[s]}
        for k in 'UDLR':   # えらんでいないがわ（まっすぐ）にしか輪郭がないドットは、ぬらない
            if k not in sides: ds.discard(D[k][0])
        base, line = tuple(base), tuple(line); hit = []
        for y in range(y0, (self.h - 1 if y1 is None else y1) + 1):
            for x in range(self.w):
                if self.at(x, y) == base and any(self.at(x + dx, y + dy) == line for dx, dy in ds): hit.append((x, y))
        for x, y in hit: self.dot(x, y, c)
    def shape(self, rows, fill, line, line_rows=None):
        """行ごとの左はし・右はしの表 rows={y:(x0,x1)} の形を fill でぬり、いちばん外の1ドット（ななめもつながる）を line にする。丸い物・自由な形に使う"""
        for y, (a, b) in rows.items(): self.hl(y, a, b, fill)
        ins = lambda x, y: y in rows and rows[y][0] <= x <= rows[y][1]
        for y, (a, b) in rows.items():
            for x in range(a, b + 1):
                if not all(ins(x + dx, y + dy) for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))): self.dot(x, y, (line_rows or {}).get(y, line))
    def oval(self, x0, y0, x1, y1, fill, line, line_rows=None):
        """だ円（x0,y0〜x1,y1 にぴったり入る）。段の長さは、だ円の式から出すので、なめらかにかわる"""
        self.shape(oval_rows(x0, y0, x1, y1), fill, line, line_rows)
    def round_top(self, x0, y0, x1, y1, thick, top, side, line_top, line_side, lip=None, side_shade=None):
        """丸い板（丸い座面・丸いテーブル・たるのふた）：上の面のだ円（x0,y0〜x1,y1）と、その下の厚み thick ドットの正面の帯。
        先に帯（だ円を下へずらして、あいだをうめた形）を side でぬって輪郭 line_side、その上に上の面を top でぬって輪郭 line_top。
        上の面の手前のふち（下が帯の所）は lip の色の1行（光）。side_shade があれば、帯のいちばん下の行をその色に"""
        R = oval_rows(x0, y0, x1, y1); B = {}
        for y, (a, b) in R.items():
            for yy in range(y, y + thick + 1):
                o = B.get(yy); B[yy] = (min(a, o[0]), max(b, o[1])) if o else (a, b)
        self.shape(B, side, line_side)
        if side_shade:
            for y, (a, b) in B.items():
                for x in range(a, b + 1):
                    if self.at(x, y) == tuple(side) and self.at(x, y + 1) == tuple(line_side): self.dot(x, y, side_shade)
            for y, (a, b) in B.items():   # 1ドットだけのかげは、もどす
                for x in range(a, b + 1):
                    if self.at(x, y) == tuple(side_shade) and not any(self.at(x + dx, y + dy) == tuple(side_shade) for dx in (-1, 0, 1) for dy in (-1, 0, 1) if dx or dy): self.dot(x, y, side)
        self.shape(R, top, line_top)
        if lip:
            for y, (a, b) in R.items():
                for x in range(a + 1, b):
                    if self.at(x, y) == tuple(line_top) and self.at(x, y + 1) in (tuple(side), tuple(side_shade or side)): self.dot(x, y, lip)
            for y, (a, b) in R.items():   # 1ドットだけの光は、輪郭にもどす（孤立ドットにしない）
                for x in range(a, b + 1):
                    if self.at(x, y) == tuple(lip) and not any(self.at(x + dx, y + dy) == tuple(lip) for dx in (-1, 0, 1) for dy in (-1, 0, 1) if dx or dy): self.dot(x, y, line_top)
    def drop_shadow(self, under, on, c, n=2):
        """落ちるかげ：色 under（上の物の輪郭）のすぐ下 n 行にある、色 on（脚の色など。いくつでも）のドットを c にする"""
        on = {tuple(k) for k in on}; under = tuple(under); hit = []
        for y in range(self.h):
            for x in range(self.w):
                if self.at(x, y) in on and any(self.at(x, y - k) == under and all(self.at(x, y - i) in on for i in range(1, k)) for k in range(1, n + 1)): hit.append((x, y))
        for x, y in hit: self.dot(x, y, c)
    def leg(self, x0, y0, x1, y1, base, light, shade, line, drop=2):
        """脚・柱（まっすぐ）：左右と下に輪郭1ドット、左2ドットが光、右2ドットがかげ、上 drop 行が、上の物の落とすかげ。はばは8〜10"""
        self.rect(x0 + 1, y0, x1 - 1, y1 - 1, base); self.rect(x0 + 1, y0, x0 + 2, y1 - 1, light); self.rect(x1 - 2, y0, x1 - 1, y1 - 1, shade)
        if drop: self.rect(x0 + 1, y0, x1 - 1, y0 + drop - 1, shade)
        self.vl(x0, y0, y1 - 1, line); self.vl(x1, y0, y1 - 1, line); self.hl(y1, x0 + 1, x1 - 1, line)
    def board(self, x0, y0, x1, y1, front, legs=(), leg_w=10, leg_bottom=None, grain=(), vgrain=(), top=(4, 2, 1, 1), bottom=(2, 1), fcorner=()):
        """木の板の台（食卓・ローテーブル・ベンチ）を、木の家具の色で描く：上の面 y0〜y1-front（いちばん手前の行は光）、その下 front 行が正面、脚は legs（左はしの x）から leg_bottom まで。
        grain=((y,xa,xb),…) はよこの木目、vgrain=((x,ya,yb),…) はたての木目（たてに長い板）。
        fcorner=(3, 2, 1) で、上の面の手前の左右の角を丸くする（手前の行から順のへこみ。へこんだ所は正面の色になり、光の線が角にそって上がる）"""
        yt = y1 - front
        self.slab(x0, y0, x1, y1, fill=TB, line=OT, top=top, bottom=bottom, line_rows={y: OD for y in range(yt + 1, y1 + 1)})
        self.rect(x0 + 1, yt + 1, x1 - 1, y1 - 2, AB)
        self.hl(yt, x0 + 1, x1 - 1, LIP)
        for x in range(x0, x1 + 1):
            if self.at(x, y1 - 1) in (AB, TB) and self.at(x - 1, y1 - 1) is not None and self.at(x + 1, y1 - 1) is not None: self.dot(x, y1 - 1, AS)
        self.vl(x0 + 1, yt + 1, y1 - 2, AS); self.vl(x1 - 1, yt + 1, y1 - 2, AS)
        for i, d in enumerate(fcorner):          # 上の面の手前の角を丸く：へこんだ所を正面の色に、その行の輪郭は正面の輪郭の色に
            y = yt - i
            self.hl(y, x0 + 1, x0 + d, AB); self.hl(y, x1 - d, x1 - 1, AB); self.dot(x0 + 1, y, AS); self.dot(x1 - 1, y, AS)
            self.dot(x0, y, OD); self.dot(x1, y, OD)
        for y in range(yt - len(fcorner), yt + 1):  # 光の線は、上の面の下のふちにそう
            for x in range(x0 + 1, x1):
                if self.at(x, y) in (TB, LIP) and self.at(x, y + 1) in (AB, AS): self.dot(x, y, LIP)
                elif self.at(x, y) == LIP: self.dot(x, y, TB)
        for y, a, b in grain: self.hl(y, a, b, TS)
        for x, a, b in vgrain: self.vl(x, a, b, TS)
        self.inner(TB, OT, TI, sides='ULR', y0=y0 + 1, y1=yt - 1 - len(fcorner))
        for L in legs: self.leg(L, y1 + 1, L + leg_w - 1, leg_bottom, AB, LL, AS, OD)
    def xpanel(self, x0, y0, x1, y1, base, light, shade, line, panel, pshade, stile=3, arm=8, slope=1.3):
        """箱の正面：左右のたての板（stile ドット）と、そのあいだのへこんだ板に X のすじかい。x0〜x1・y0〜y1 は、わくの線の内がわ。
        X は、まん中でまじわり、1行で slope ドットずつよこへ進む（前の絵と同じかたむき。ねかせすぎない）。太さは、よこに arm ドット"""
        self.rect(x0, y0, x1, y1, panel); self.hl(y0, x0, x1, pshade)
        for a, b in ((x0, x0 + stile - 1), (x1 - stile + 1, x1)):
            self.rect(a, y0, b, y1, base); self.vl(a, y0, y1, light); self.vl(b, y0, y1, shade)
        px0, px1 = x0 + stile, x1 - stile; cx, cy = (px0 + px1) / 2, (y0 + y1) / 2
        for y in range(y0 + 1, y1 + 1):
            for sgn in (1, -1):
                c = cx + sgn * (y - cy) * slope; a = int(round(c - arm / 2)); self.hl(y, max(px0, a), min(px1, a + arm - 1), base) if a + arm - 1 >= px0 and a <= px1 else None
        for y in range(y0 + 1, y1 + 1):
            for x in range(px0, px1 + 1):
                if self.at(x, y) == tuple(base) and self.at(x, y - 1) in (tuple(panel), tuple(pshade)) and self.at(x, y + 1) == tuple(base): self.dot(x, y, light)
    def rod(self, xa, ya, xb, yb, r, fill, line):
        """丸い棒（ななめの足など）：(xa,ya) から (xb,yb) まで、半径 r の丸をならべた形。先は丸くなる"""
        rows = {}; n = int(max(abs(xb - xa), abs(yb - ya)) * 2) + 1
        for i in range(n + 1):
            cx, cy = xa + (xb - xa) * i / n, ya + (yb - ya) * i / n
            for y in range(int(cy - r - 1), int(cy + r + 2)):
                d = r * r - (y - cy) ** 2
                if d < 0: continue
                a, b = int(round(cx - d ** .5)), int(round(cx + d ** .5)); o = rows.get(y); rows[y] = (min(a, o[0]), max(b, o[1])) if o else (a, b)
        self.shape({y: v for y, v in rows.items() if 0 <= y < self.h}, fill, line)
    def save(self, path): self.im.save(path)
    def put(self, cid, frame=0):
        """チップ cid の絵をさしかえて、アトラスと chips.js を作りなおす（大きさは同じでなければならない。ax・ay はそのまま）"""
        sys.path.insert(0, os.path.join(ROOT, 'tools')); import chips
        h, C = chips.load_imgs()
        if (C[cid]['w'], C[cid]['h']) != self.im.size: raise SystemExit('大きさがちがう: %s は %dx%d' % (cid, C[cid]['w'], C[cid]['h']))
        C[cid]['f'][frame] = self.im; chips.pack_imgs(h, C)
        open(os.path.join(ROOT, '.chips_changed'), 'w').write(cid)

def oval_rows(x0, y0, x1, y1):
    """だ円の、行ごとの左はし・右はし {y:(xa,xb)}。一部だけ使うとき（上半分だけ など）は、行をえらんで shape にわたす"""
    cx, cy, rx, ry = (x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0 + 1) / 2, (y1 - y0 + 1) / 2; rows = {}
    for y in range(y0, y1 + 1):
        t = 1 - ((y - cy) / ry) ** 2; d = rx * max(t, 0) ** .5
        a, b = int(round(cx - d + .5)), int(round(cx + d - .5))
        if b >= a: rows[y] = (max(a, x0), min(b, x1))
    return rows

def rows_from(png, y0=None, y1=None, x0=None, x1=None):
    """絵（前の絵など）の形から、行ごとの左はし・右はし {y:(x0,x1)} をとる（うすさが半分より上の所。x0・x1 で、よこのはんいをしぼれる：脚1本だけ など）。前の絵と同じ形で描きはじめるときに使う"""
    im = Image.open(png).convert('RGBA'); px = im.load(); rows = {}
    for y in range(im.height):
        if (y0 is not None and y < y0) or (y1 is not None and y > y1): continue
        xs = [x for x in range(im.width) if px[x, y][3] > 127 and (x0 is None or x >= x0) and (x1 is None or x <= x1)]
        if xs: rows[y] = (xs[0], xs[-1])
    return rows

def put_all(pics):
    """いくつかのチップを、まとめてさしかえる（{id: Pix}）。アトラスと chips.js の作りなおしは1回だけ"""
    sys.path.insert(0, os.path.join(ROOT, 'tools')); import chips
    h, C = chips.load_imgs()
    for cid, p in pics.items():
        if (C[cid]['w'], C[cid]['h']) != p.im.size: raise SystemExit('大きさがちがう: %s は %dx%d' % (cid, C[cid]['w'], C[cid]['h']))
        C[cid]['f'][0] = p.im
    chips.pack_imgs(h, C); open(os.path.join(ROOT, '.chips_changed'), 'w').write('\n'.join(pics))

def run(draws):
    """スクリプトのおわりに書く：run({id: 描く関数})。引数にフォルダがあれば <id>.png を書き出すだけ（: > は _ に）、なければチップに入れる"""
    pics = {k: f() for k, f in draws.items()}
    if len(sys.argv) > 1:
        os.makedirs(sys.argv[1], exist_ok=True)
        for k, p in pics.items(): p.save(os.path.join(sys.argv[1], k.replace(':', '_').replace('>', '_r').replace('#', '_f') + '.png'))
    else: put_all(pics)
