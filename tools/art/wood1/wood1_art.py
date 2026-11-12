#!/usr/bin/env python3
"""木の家具4つ（ローテーブル・ベンチ・まるいサイドテーブル・木箱）のチップを、ドットで描きなおす（スキル pixel-redraw。大きさ・置き方はそのまま）。
  python3 tools/art/wood1/wood1_art.py <出力フォルダ>   # 絵だけ書き出す（<id>.png）
  python3 tools/art/wood1/wood1_art.py                  # チップに入れて、アトラスと chips.js を作りなおす
設計（どれも光は左上から。色は木の家具の8色。木箱だけ、前の絵の明るい木の色）：
 ローテーブル ltable（61×31）：天板 x0〜59・y1〜18／正面 y19〜23／脚 x3〜9・x50〜56、y24〜29。木目よこ2本
 ローテーブル（たて）ltable>1（26×50）：天板 x1〜24・y1〜39／正面 y40〜43／脚 x3〜8・x17〜22、y44〜49。木目たて2本
 ベンチ bench（100×44）：座面 x0〜99・y0〜26／正面 y27〜31／脚 x5〜12・x87〜94、y32〜43。木目よこ3本
 ベンチ（たて）bench>1（47×116）：座面 x0〜46・y0〜99／正面 y100〜106／脚 x4〜11・x35〜42、y107〜115。木目たて3本
 まるいサイドテーブル stable（59×64）：持ち主が直した絵（src/stable_owner.png）をそのまま
 木箱 crate（64×69）：描きなおさず、前の絵（src/crate.png）の色だけをまとめる"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from pixdraw import Pix, run, oval_rows, OT, OD, TB, TS, TI, LIP, AB, AS, LL

def ltable():
    p = Pix(61, 31); p.board(0, 1, 59, 23, front=5, legs=(3, 50), leg_w=7, leg_bottom=29, grain=((6, 8, 24), (12, 30, 50)), bottom=(3, 2, 1), fcorner=(3, 2, 1)); return p
def ltable_v():
    p = Pix(26, 50); p.board(1, 1, 24, 43, front=4, legs=(3, 17), leg_w=6, leg_bottom=49, vgrain=((8, 6, 18), (16, 20, 33)), top=(2, 1), bottom=(2, 1), fcorner=(2, 1)); return p
def bench():
    p = Pix(100, 44); p.board(0, 0, 99, 31, front=5, legs=(5, 87), leg_w=8, leg_bottom=43, grain=((7, 12, 34), (14, 52, 84), (20, 20, 46)), bottom=(3, 2, 1), fcorner=(3, 2, 1)); return p
def bench_v():
    p = Pix(47, 116); p.board(0, 0, 46, 106, front=7, legs=(4, 35), leg_w=8, leg_bottom=115, vgrain=((12, 14, 40), (24, 52, 86), (35, 22, 50)), bottom=(3, 2, 1, 1), fcorner=(3, 2, 1)); return p

def stable():
    """まるいサイドテーブル：持ち主が直した絵（src/stable_owner.png）を、そのまま使う（わたしのコードの絵は、脚がおかしいと言われた）"""
    from PIL import Image
    im = Image.open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'src', 'stable_owner.png')).convert('RGBA')
    p = Pix(*im.size); p.im = im; p.px = im.load(); return p

def crate():
    """木箱：描きなおさない。前の絵（src/crate.png）の形のまま、色だけをまとめる（持ち主がえらんだ）"""
    import pixclean
    from PIL import Image
    im = pixclean.clean(Image.open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'src', 'crate.png')), 64, 2, 0)
    p = Pix(*im.size); p.im = im; p.px = im.load(); return p

run({'ltable': ltable, 'ltable>1': ltable_v, 'bench': bench, 'bench>1': bench_v, 'stable': stable, 'crate': crate})
