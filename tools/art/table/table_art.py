#!/usr/bin/env python3
"""食卓（table）のチップを、ドットで描きなおす（もらった絵はない。前のチップの形・色・大きさ・置き方はそのまま）。
直した所：輪郭を、外がわ1ドット＋内がわのなじむ色1ドットに・角の段を 4・2・1・1 に・色を11色に（にた色の帯をまとめる）・うすさを 0 か 255 に・木目は板の向きの短い線だけ。
  python3 tools/art/table/table_art.py            # チップに入れて、アトラスと chips.js を作りなおす
  python3 tools/art/table/table_art.py <出力.png>  # 絵だけ書き出す"""
import sys, os
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))
W, H = 68, 74
OT = (0xaf, 0x7b, 0x48)   # 天板の輪郭（天板より少し暗い）
OD = (0x8f, 0x5b, 0x36)   # 前の面・脚の輪郭
TB = (0xe0, 0xaf, 0x67)   # 天板
TS = (0xd9, 0xa7, 0x61)   # 天板の木目
TI = (0xcc, 0x98, 0x59)   # 天板の輪郭の内がわ（輪郭と天板のあいだの色）
LIP = (0xee, 0xc5, 0x7c)  # 天板の手前のふちの光
AB = (0xb2, 0x7d, 0x4b)   # 前の面
AS = (0xa2, 0x6e, 0x43)   # 前の面の下のかげ
LB = (0xae, 0x79, 0x4b)   # 脚
LL = (0xbd, 0x88, 0x52)   # 脚の光（左上から）
LS = (0x9c, 0x69, 0x40)   # 脚のかげ

def draw():
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0)); px = im.load()
    def hl(y, x0, x1, c):
        for x in range(x0, x1 + 1): px[x, y] = c + (255,)
    X0, X1, Y0, YT, Y1 = 2, 65, 21, 50, 57   # 天板 Y0〜YT、前の面 YT+1〜Y1
    ins = {Y0: 4, Y0 + 1: 2, Y0 + 2: 1, Y0 + 3: 1, Y1 - 1: 1, Y1: 2}   # 角の段
    for y in range(Y0, Y1 + 1):
        a, b = X0 + ins.get(y, 0), X1 - ins.get(y, 0); top = y <= YT; o = OT if top else OD
        hl(y, a, b, TB if top else AB); px[a, y] = px[b, y] = o + (255,)
    # 上と下の輪郭（角の段の横の線もふくめる）
    hl(Y0, X0 + 4, X1 - 4, OT)
    for y, d0, d1 in ((Y0 + 1, 2, 3), (Y0 + 2, 1, 1)): hl(y, X0 + d0, X0 + d1, OT); hl(y, X1 - d1, X1 - d0, OT)
    hl(Y1, X0 + 2, X1 - 2, OD)
    hl(YT, X0 + 1, X1 - 1, LIP)            # 手前のふちの光
    hl(Y1 - 1, X0 + 2, X1 - 2, AS)         # 前の面の下のかげ
    # 木目：板の向き（よこ）の短い線。1ドットの点にしない
    for y, a, b in ((28, 10, 25), (35, 36, 55), (43, 14, 32)): hl(y, a, b, TS)
    # 輪郭の内がわの1ドット（天板の上・左・右）：輪郭のとなりのドットを、なじむ色に
    for y in range(Y0 + 1, YT):
        xs = [x for x in range(W) if px[x, y][:3] == TB and any(px[x + dx, y + dy][:3] == OT for dx, dy in ((1, 0), (-1, 0), (0, -1)))]
        for x in xs: px[x, y] = TI + (255,)
    for y in range(YT + 1, Y1 - 1): px[X0 + 1, y] = px[X1 - 1, y] = AS + (255,)   # 前の面の左右
    # 脚（手前の2本）：光は左、かげは右と、前の面のすぐ下
    for L in (6, 52):
        R = L + 9
        for y in range(Y1 + 1, H - 1):
            hl(y, L + 1, R - 1, LB); hl(y, L + 1, L + 2, LL); hl(y, R - 2, R - 1, LS); px[L, y] = px[R, y] = OD + (255,)
        hl(Y1 + 1, L + 1, R - 1, LS); hl(Y1 + 2, L + 1, R - 1, LS)
        hl(H - 1, L + 1, R - 1, OD)
    return im

if __name__ == '__main__':
    im = draw()
    if len(sys.argv) > 1: im.save(sys.argv[1]); sys.exit()
    sys.path.insert(0, os.path.join(ROOT, 'tools')); import chips
    h, C = chips.load_imgs()
    assert (C['table']['w'], C['table']['h']) == im.size
    C['table']['f'] = [im]; chips.pack_imgs(h, C)
