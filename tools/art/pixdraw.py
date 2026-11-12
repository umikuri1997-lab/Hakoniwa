#!/usr/bin/env python3
"""ドット絵を、コードで1ドットずつ描くための小さな道具（チップの描きなおし用。スキル pixel-redraw）。
  from pixdraw import Pix
  p = Pix(68, 74)
  p.slab(2, 21, 65, 57, fill=TB, line=OT, top=(4, 2, 1, 1), bottom=(2, 1))   # 角が段々の板
  p.hl(50, 3, 64, LIP)                                                        # よこ線
  p.inner(TB, OT, TI, sides='ULR')                                            # 輪郭の内がわ1ドット
  p.put('table')                                                              # チップに入れて、アトラスと chips.js を作りなおす
色は (r, g, b)。座標はチップのドット（左上が 0,0）。x1・y1 はその点もふくむ。"""
import os, sys
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

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
        """輪郭（line）のとなりの base のドットを c にする（輪郭の内がわのなじむ色）。sides：輪郭がどちらがわにあるとき（U上 D下 L左 R右）"""
        D = {'U': (0, -1), 'D': (0, 1), 'L': (-1, 0), 'R': (1, 0)}; base, line = tuple(base), tuple(line); hit = []
        for y in range(y0, (self.h - 1 if y1 is None else y1) + 1):
            for x in range(self.w):
                if self.at(x, y) == base and any(self.at(x + D[s][0], y + D[s][1]) == line for s in sides): hit.append((x, y))
        for x, y in hit: self.dot(x, y, c)
    def save(self, path): self.im.save(path)
    def put(self, cid, frame=0):
        """チップ cid の絵をさしかえて、アトラスと chips.js を作りなおす（大きさは同じでなければならない。ax・ay はそのまま）"""
        sys.path.insert(0, os.path.join(ROOT, 'tools')); import chips
        h, C = chips.load_imgs()
        if (C[cid]['w'], C[cid]['h']) != self.im.size: raise SystemExit('大きさがちがう: %s は %dx%d' % (cid, C[cid]['w'], C[cid]['h']))
        C[cid]['f'][frame] = self.im; chips.pack_imgs(h, C)
        open(os.path.join(ROOT, '.chips_changed'), 'w').write(cid)
