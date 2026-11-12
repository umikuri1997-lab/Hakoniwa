#!/usr/bin/env python3
"""食卓（table）のチップを、ドットで描きなおす（もらった絵はない。前のチップの形・色・大きさ・置き方はそのまま）。スキル pixel-redraw の、四角い物のお手本。
直した所：輪郭を、外がわ1ドット＋内がわのなじむ色1ドットに・角の段を 4・2・1・1 に・色を8色に（にた色の帯をまとめる）・うすさを 0 か 255 に・木目は板の向きの短い線だけ。
  python3 tools/art/table/table_art.py            # チップに入れて、アトラスと chips.js を作りなおす
  python3 tools/art/table/table_art.py <出力.png>  # 絵だけ書き出す
設計：
 1 部分：天板 x2〜65・y21〜50／前の面 y51〜57（7行）／脚2本 x6〜15・x52〜61、y58〜73
 2 光：左上から。天板 → 手前のふちの光（y50）→ 前の面 → 前の面の下・脚の右のかげ
 3 色：木の家具の8色（pixdraw の OT〜LL）
 4 輪郭：天板は OT、前の面と脚は OD。天板の内がわに TI を1ドット
 5 質感：木目は、よこの短い線3本"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__)))); from pixdraw import Pix

def draw():
    p = Pix(68, 74)
    p.board(2, 21, 65, 57, front=7, legs=(6, 52), leg_w=10, leg_bottom=73, grain=((28, 10, 25), (35, 36, 55), (43, 14, 32)))
    return p

if __name__ == '__main__':
    p = draw()
    if len(sys.argv) > 1: p.save(sys.argv[1])
    else: p.put('table')
