#!/usr/bin/env python3
"""食卓（table）のチップを、ドットで描きなおす（もらった絵はない。前のチップの形・色・大きさ・置き方はそのまま）。スキル pixel-redraw のお手本。
直した所：輪郭を、外がわ1ドット＋内がわのなじむ色1ドットに・角の段を 4・2・1・1 に・色を8色に（にた色の帯をまとめる）・うすさを 0 か 255 に・木目は板の向きの短い線だけ。
  python3 tools/art/table/table_art.py            # チップに入れて、アトラスと chips.js を作りなおす
  python3 tools/art/table/table_art.py <出力.png>  # 絵だけ書き出す"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__)))); from pixdraw import Pix
W, H = 68, 74
OT = (0xaf, 0x7b, 0x48)   # 天板の輪郭（天板より少し暗い）
OD = (0x8f, 0x5b, 0x36)   # 前の面・脚の輪郭
TB = (0xe0, 0xaf, 0x67)   # 天板
TS = (0xd9, 0xa7, 0x61)   # 天板の木目
TI = (0xcc, 0x98, 0x59)   # 天板の輪郭の内がわ（輪郭と天板のあいだの色）
LIP = (0xee, 0xc5, 0x7c)  # 天板の手前のふちの光
AB = OT                   # 前の面（天板の輪郭と同じ色。にた色をふやさない）
AS = (0xa2, 0x6e, 0x43)   # 前の面の下のかげ
LB = AB                   # 脚（前の面と同じ色）
LL = (0xbd, 0x88, 0x52)   # 脚の光（左上から）
LS = AS                   # 脚のかげ（前の面のかげと同じ色）

def draw():
    p = Pix(W, H)
    X0, X1, Y0, YT, Y1 = 2, 65, 21, 50, 57   # 天板 Y0〜YT、前の面 YT+1〜Y1
    # 1 シルエット：天板と前の面で1まいの板。角の段は上 4・2・1・1、下 2・1。輪郭は、天板の行は OT、前の面の行は OD
    p.slab(X0, Y0, X1, Y1, fill=TB, line=OT, top=(4, 2, 1, 1), bottom=(2, 1), line_rows={y: OD for y in range(YT + 1, Y1 + 1)})
    # 2 大きな面：前の面
    p.rect(X0 + 1, YT + 1, X1 - 1, Y1 - 2, AB)
    # 3 かげと光
    p.hl(YT, X0 + 1, X1 - 1, LIP)          # 手前のふちの光
    p.hl(Y1 - 1, X0 + 2, X1 - 2, AS)       # 前の面の下のかげ
    p.vl(X0 + 1, YT + 1, Y1 - 2, AS); p.vl(X1 - 1, YT + 1, Y1 - 2, AS)   # 前の面の左右
    # 4 質感：木目は板の向き（よこ）の短い線3本。1ドットの点にしない
    for y, a, b in ((28, 10, 25), (35, 36, 55), (43, 14, 32)): p.hl(y, a, b, TS)
    p.inner(TB, OT, TI, sides='ULR', y0=Y0 + 1, y1=YT - 1)   # 輪郭の内がわの1ドット（天板の上・左・右）
    # 5 脚（手前の2本）：光は左、かげは右と、前の面のすぐ下
    for L in (6, 52): p.leg(L, Y1 + 1, L + 9, H - 1, LB, LL, LS, OD)
    return p

if __name__ == '__main__':
    p = draw()
    if len(sys.argv) > 1: p.save(sys.argv[1])
    else: p.put('table')
