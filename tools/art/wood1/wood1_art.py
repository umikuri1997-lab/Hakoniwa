#!/usr/bin/env python3
"""木の家具4つ（ローテーブル・ベンチ・まるいサイドテーブル・木箱）のチップを、ドットで描きなおす（スキル pixel-redraw。大きさ・置き方はそのまま）。
  python3 tools/art/wood1/wood1_art.py <出力フォルダ>   # 絵だけ書き出す（<id>.png）
  python3 tools/art/wood1/wood1_art.py                  # チップに入れて、アトラスと chips.js を作りなおす
設計（どれも光は左上から。色は木の家具の8色。木箱だけ、前の絵の明るい木の色）：
 ローテーブル ltable（61×31）：天板 x0〜59・y1〜18／正面 y19〜23／脚 x3〜9・x50〜56、y24〜29。木目よこ2本
 ローテーブル（たて）ltable>1（26×50）：天板 x1〜24・y1〜39／正面 y40〜43／脚 x3〜8・x17〜22、y44〜49。木目たて2本
 ベンチ bench（100×44）：座面 x0〜99・y0〜26／正面 y27〜31／脚 x5〜12・x87〜94、y32〜43。木目よこ3本
 ベンチ（たて）bench>1（47×116）：座面 x0〜46・y0〜99／正面 y100〜106／脚 x4〜11・x35〜42、y107〜115。木目たて3本
 まるいサイドテーブル stable（59×64）：丸い天板（だ円 x1〜57・y1〜34、厚み6）／つけ根の台／外へひらく丸い棒の脚（前・左・右。つくりは stable() の説明）
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
    """まるいサイドテーブルのつくり（描く前にきめる）：
     ・丸い天板（あつみ6ドット）。そのうらのまん中に、丸くすぼまる台（脚のつけ根）。
     ・脚は、つけ根から外へひらく丸い棒が4本（前・左・右・うしろ）。うしろの1本は、天板と前の脚にかくれて見えない。
     ・地面につく所：前の脚は手前（絵でいちばん下 y63）、左右の脚は、それよりおく（絵で上 y52〜55）で、左右に16ドットずつはなれる。
     ・かさなり：左右の脚 → 前の脚（手前）→ つけ根の台 → 天板 の順に、うしろから描く。"""
    p = Pix(59, 64); HUB = (29, 42)
    for hx, fx in ((21, 13), (37, 45)): p.rod(hx, 42, fx, 52, 3.8, AB, OD)                # 1 左右の脚（おく）。つけ根の台のふちから、外へ・下へ
    for y in range(40, 57):                                                              #   光は左がわ、かげは右がわ
        for half in (range(0, 29), range(30, 59)):
            xs = [x for x in half if p.at(x, y) == AB]
            if len(xs) >= 5: p.hl(y, xs[0], xs[0] + 1, LL); p.hl(y, xs[-1] - 1, xs[-1], AS)
    p.leg(25, 44, 33, 63, AB, LL, AS, OD, drop=0)                                        # 2 前の脚（手前。まっすぐ下へ）
    for x in (25, 33): p.clear(x, 62)                                                    #   下のはしを丸く
    p.dot(26, 62, OD); p.dot(32, 62, OD)
    bowl = {y: r for y, r in oval_rows(19, 33, 39, 46).items() if y >= 40}                # 3 つけ根の台（天板の正面から、線なしでつづく）
    p.shape(bowl, AS, OD)
    p.round_top(1, 1, 57, 34, 6, top=TB, side=AB, line_top=OT, line_side=OD, lip=LIP, side_shade=AS)   # 4 丸い天板
    for x in range(bowl[40][0], bowl[40][1] + 1):
        for y in (41, 40, 39):
            if p.at(x, y) == OD and p.at(x, y - 1) is not None: p.dot(x, y, AS)
    p.inner(TB, OT, TI, sides='ULR', y0=2, y1=26)
    for y, a, b in ((10, 14, 30), (18, 26, 46), (25, 12, 28)): p.hl(y, a, b, TS)
    return p

CO = (0xa2, 0x72, 0x42); CB = (0xea, 0xba, 0x7e); CL = (0xf6, 0xcd, 0x92); CS = (0xd8, 0xa6, 0x6a); CP = (0xb6, 0x80, 0x4c); CD = (0x92, 0x62, 0x3c)
def crate():
    """木箱：描きなおさない。前の絵（src/crate.png）の形のまま、色だけをまとめる（持ち主がえらんだ）"""
    import pixclean
    from PIL import Image
    im = pixclean.clean(Image.open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'src', 'crate.png')), 64, 2, 0)
    p = Pix(*im.size); p.im = im; p.px = im.load(); return p

run({'ltable': ltable, 'ltable>1': ltable_v, 'bench': bench, 'bench>1': bench_v, 'stable': stable, 'crate': crate})
