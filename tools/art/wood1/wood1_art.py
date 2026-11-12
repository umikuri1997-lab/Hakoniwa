#!/usr/bin/env python3
"""木の家具4つ（ローテーブル・ベンチ・まるいサイドテーブル・木箱）のチップを、ドットで描きなおす（スキル pixel-redraw。大きさ・置き方はそのまま）。
  python3 tools/art/wood1/wood1_art.py <出力フォルダ>   # 絵だけ書き出す（<id>.png）
  python3 tools/art/wood1/wood1_art.py                  # チップに入れて、アトラスと chips.js を作りなおす
設計（どれも光は左上から。色は木の家具の8色。木箱だけ、前の絵の明るい木の色）：
 ローテーブル ltable（61×31）：天板 x0〜59・y1〜18／正面 y19〜23／脚 x3〜9・x50〜56、y24〜29。木目よこ2本
 ローテーブル（たて）ltable>1（26×50）：天板 x1〜24・y1〜39／正面 y40〜43／脚 x3〜8・x17〜22、y44〜49。木目たて2本
 ベンチ bench（100×44）：座面 x0〜99・y0〜26／正面 y27〜31／脚 x5〜12・x87〜94、y32〜43。木目よこ3本
 ベンチ（たて）bench>1（47×116）：座面 x0〜46・y0〜99／正面 y100〜106／脚 x4〜11・x35〜42、y107〜115。木目たて3本
 まるいサイドテーブル stable（59×64）：丸い天板（だ円 x1〜57・y1〜34、厚み6）／天板のうらの、すぼまる台 y40〜44／まん中の柱 x25〜33・y42〜63／左右にひらく丸い棒の足 y42〜55
 木箱 crate（64×69）：ふたの板4まい x8〜55・y1〜27／ふたの手前のふち y29〜33／左右の柱 x1〜7・x56〜62（かど金はなし）／正面のへこんだ板 x9〜54・y37〜60 に X のすじかい／下の板 y62〜67"""
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
    p = Pix(59, 64)
    # 1 足（うしろの物から）：左右にひらく丸い棒2本と、まん中の柱。天板の下から出る
    foot = {}
    for y in range(42, 56):
        cx = 21 - (y - 42) * .62; foot[y] = (int(round(cx - 5)), int(round(cx + 4)))
    foot[54] = (foot[54][0] + 1, foot[54][1] - 1); foot[55] = (foot[55][0] + 3, foot[55][1] - 3)   # 先を丸く
    p.shape(foot, AB, OD); p.shape({y: (58 - b, 58 - a) for y, (a, b) in foot.items()}, AB, OD)
    for y, (a, b) in foot.items():
        if y < 54: p.hl(y, a + 1, a + 2, LL); p.hl(y, 58 - a - 2, 58 - a - 1, AS)        # 光は左、かげは右
    p.leg(25, 50, 33, 63, AB, LL, AS, OD, drop=0)                                        # まん中の柱（足の前）
    p.rect(26, 42, 32, 49, AB); p.rect(26, 42, 27, 49, LL); p.rect(31, 42, 32, 49, AS)   # 柱の上（足とかさなる所は、輪郭なしでつなぐ）
    # 2 丸い天板
    p.round_top(1, 1, 57, 34, 6, top=TB, side=AB, line_top=OT, line_side=OD, lip=LIP, side_shade=AS)
    bowl = {y: r for y, r in oval_rows(15, 32, 43, 46).items() if y >= 41}                # 天板のうらの、丸くすぼまる台（天板の正面から、線なしでつづく）
    p.shape(bowl, AS, OD)
    for x in range(bowl[41][0], bowl[41][1] + 1):
        for y in (41, 40, 39):
            if p.at(x, y) == OD and p.at(x, y - 1) is not None: p.dot(x, y, AS)
            else: break
    p.inner(TB, OT, TI, sides='ULR', y0=2, y1=26)
    for y, a, b in ((10, 14, 30), (18, 26, 46), (25, 12, 28)): p.hl(y, a, b, TS)
    return p

CO = (0xa2, 0x72, 0x42); CB = (0xea, 0xba, 0x7e); CL = (0xf6, 0xcd, 0x92); CS = (0xd8, 0xa6, 0x6a); CP = (0xb6, 0x80, 0x4c); CD = (0x92, 0x62, 0x3c)
def crate():
    """木箱：色は前の絵の明るい木（CB 基本・CL 光・CS かげ・CO 輪郭と板のさかい・CP へこんだ板・CD へこんだ板のかげ）"""
    p = Pix(64, 69)
    # 1 ふたの板4まい（上の面）
    p.rect(8, 0, 55, 28, CO)
    for a, b in ((1, 6), (8, 13), (15, 20), (22, 27)): p.rect(8, a, 55, b, CB); p.hl(a, 8, 55, CL)
    # 2 ふたの手前のふち（正面）
    p.rect(8, 29, 55, 33, CB); p.hl(29, 8, 55, CL); p.hl(33, 8, 55, CS); p.rect(8, 34, 55, 35, CO)
    # 3 正面：へこんだ板と、X のすじかい、下の板
    p.rect(8, 36, 55, 68, CO); p.rect(9, 37, 54, 60, CP); p.rect(9, 37, 54, 38, CD)
    for r in range(22):
        xa = 10 + round(r * 37 / 21)
        for x0 in (xa - 2, 57 - xa):
            p.hl(39 + r, max(9, x0), min(54, x0 + 8), CB)
    for y in range(39, 61):
        for x in range(9, 55):
            if p.at(x, y) == CB and p.at(x, y - 1) in (CP, CD) and p.at(x, y + 1) == CB: p.dot(x, y, CL)
    p.rect(8, 62, 55, 67, CB); p.hl(62, 8, 55, CL); p.hl(67, 8, 55, CS)
    # 4 左右の柱（まっすぐ。上の面は明るく、正面はふたのふちの高さから）
    for L in (1, 56):
        p.rect(L, 0, L + 6, 68, CO); p.rect(L + 1, 1, L + 5, 28, CL); p.vl(L + 5, 1, 28, CB)
        p.rect(L + 1, 29, L + 5, 67, CB); p.vl(L + 1, 30, 67, CL); p.vl(L + 5, 29, 67, CS)
    return p

run({'ltable': ltable, 'ltable>1': ltable_v, 'bench': bench, 'bench>1': bench_v, 'stable': stable, 'crate': crate})
