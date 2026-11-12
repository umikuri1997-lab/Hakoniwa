#!/usr/bin/env python3
"""しまう家具4つ（食料箱・素材箱・たる・あさぶくろ）のチップを、ドット絵の決まりに近づける（スキル pixel-redraw の「部品の多い物」のやり方。大きさ・置き方はそのまま）。
  python3 tools/art/store1/store1_art.py <出力フォルダ>   # 絵だけ書き出す（<id>.png）
  python3 tools/art/store1/store1_art.py                  # チップに入れて、アトラスと chips.js を作りなおす
元の絵は src/（描きなおす前のチップ。作りなおすときは、ここから）。
 たる taru・あさぶくろ asabukuro：前の絵の形のまま、ドットの色だけをまとめる（pixclean：64色まで）。
 食料箱 stor・素材箱 mbox：箱の木の所（柱・ふち・X のすじかい・下の板）は、木箱と同じ色・同じ作りで、コードで描く（かど金はなし）。
   中の物（やさい・丸太・石）と、箱のおくの面は、前の絵からとって、色をまとめて（64色まで）のせる。
   箱：柱 x2〜8・x55〜61（上の面 y7〜30、正面 y31〜65）／おくのふち y6〜9／手前のふち y31〜35／へこんだ板 x9〜54・y37〜59 に X／下の板 y61〜65"""
import sys, os, colorsys
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, os.path.dirname(HERE))
from pixdraw import Pix, run
import pixclean
CO = (0xa2, 0x72, 0x42); CB = (0xea, 0xba, 0x7e); CL = (0xf6, 0xcd, 0x92); CS = (0xd8, 0xa6, 0x6a); CP = (0xb6, 0x80, 0x4c); CD = (0x92, 0x62, 0x3c)

def box():
    """ふたのない箱（木箱と同じ色・同じ作り）"""
    p = Pix(64, 68)
    p.rect(9, 6, 54, 66, CO)
    p.rect(9, 7, 54, 9, CB); p.hl(7, 9, 54, CL)                       # おくのふち
    p.rect(9, 11, 54, 30, CP); p.rect(9, 11, 54, 12, CD)              # 箱の中（おくの面）
    p.rect(9, 31, 54, 35, CB); p.hl(31, 9, 54, CL); p.hl(35, 9, 54, CS)   # 手前のふち
    p.xpanel(10, 37, 53, 59, CB, CL, CS, CO, CP, CD, arm=8)           # 正面：左右のたての板・へこんだ板に X のすじかい（前の絵と同じかたむき）
    p.rect(9, 61, 54, 65, CB); p.hl(61, 9, 54, CL); p.hl(65, 9, 54, CS)   # 下の板
    for L in (2, 55):                                                 # 左右の柱（まっすぐ）
        p.rect(L, 6, L + 6, 66, CO); p.rect(L + 1, 7, L + 5, 30, CL); p.vl(L + 5, 7, 30, CB)
        p.rect(L + 1, 31, L + 5, 65, CB); p.vl(L + 1, 32, 65, CL); p.vl(L + 5, 31, 65, CS)
    return p

def open2(m):
    """2×2 の四角が入らない所（1ドットの線・点）をけす"""
    e = m[:-1, :-1] & m[1:, :-1] & m[:-1, 1:] & m[1:, 1:]; o = np.zeros_like(m)
    o[:-1, :-1] |= e; o[1:, :-1] |= e; o[:-1, 1:] |= e; o[1:, 1:] |= e
    return o

def woodlike(c):
    h, s, v = colorsys.rgb_to_hsv(c[0] / 255, c[1] / 255, c[2] / 255); return 22 <= h * 360 <= 48 and .25 <= s <= .85

def with_contents(name, n=64):
    """箱に、前の絵の中の物をのせる：箱の中（x9〜54・y30 まで）と、箱の上にはみ出した所は、ぜんぶ前の絵。柱の上にかさなる所は、木の色でないドットだけ"""
    p = box(); src = Image.open(os.path.join(HERE, 'src', name + '.png')).convert('RGBA'); a = np.asarray(src); op = a[..., 3] > 127
    ys, xs = np.mgrid[0:68, 0:64]; nw = np.array([[not woodlike(a[y, x]) for x in range(64)] for y in range(68)])
    inside = op & (xs >= 9) & (xs <= 54) & (ys >= 10) & (ys <= 30)                          # 箱の中
    stick = op[5][None, :] & (xs >= 9) & (xs <= 54)                                         # 箱の上にはみ出している物の列
    over = op & (ys <= 30) & ~inside & ((ys < 6) | ((ys < 10) & stick) | (nw & (xs >= 2) & (xs <= 61) & ((xs < 9) | (xs > 54))))   # 箱の上・おくのふちにかさなる所・柱にかさなる所
    side = over & ((xs < 9) | (xs > 54)); over = (over & ~side) | open2(side)               # 柱の上の、1ドットの線・点（前の箱の輪郭のなごり）は、とらない
    mask = inside | over; cont = np.zeros_like(a); cont[mask] = a[mask]; cont[mask, 3] = 255
    q = np.asarray(pixclean.clean(Image.fromarray(cont, 'RGBA'), n, 2, 0))               # 中の物は、色を多くのこす（色がおかしくならないように）
    for y in range(31):
        for x in range(64):
            if q[y, x, 3] > 127: p.dot(x, y, tuple(int(v) for v in q[y, x, :3]))
    return p

def cleaned(name, n=64):
    """描きなおさない。前の絵の形のまま、色だけをまとめる"""
    im = pixclean.clean(Image.open(os.path.join(HERE, 'src', name + '.png')), n, 2, 0); p = Pix(*im.size); p.im = im; p.px = im.load(); return p

# たる・あさぶくろは、ゲームに入れない（持ち主が、いまの絵のままにするとえらんだ）。絵を見るときは cleaned('taru') を書き出す
run({'stor': lambda: with_contents('stor'), 'mbox': lambda: with_contents('mbox')})
