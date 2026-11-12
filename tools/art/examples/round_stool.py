#!/usr/bin/env python3
"""丸い物のお手本（スキル pixel-redraw）：丸い座面のスツールを、round_top と leg だけで描く。絵を書き出すだけで、チップには入れない。
  python3 tools/art/examples/round_stool.py <出力.png>
設計：
 1 部分：丸い座面（上の面のだ円 x1〜40・y1〜26、厚み7）／脚2本（x5〜12・x29〜36、y28〜46。座面の帯のうしろから出る）
 2 光：左上から。上の面 → 手前のふちの光 → 正面の帯 → 帯の下・脚の右のかげ
 3 色：食卓と同じ8色（同じ木の家具は、同じ色を使いまわす）
 4 輪郭：上の面は OT、正面の帯と脚は OD。上の面の内がわに TI を1ドット
 5 質感：木目は、よこの短い線2本"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__)))); from pixdraw import Pix
OT = (0xaf, 0x7b, 0x48); OD = (0x8f, 0x5b, 0x36); TB = (0xe0, 0xaf, 0x67); TS = (0xd9, 0xa7, 0x61); TI = (0xcc, 0x98, 0x59)
LIP = (0xee, 0xc5, 0x7c); AB = OT; AS = (0xa2, 0x6e, 0x43); LL = (0xbd, 0x88, 0x52)

def draw():
    p = Pix(42, 48)
    for L in (5, 29): p.leg(L, 28, L + 7, 46, AB, LL, AS, OD, drop=0)        # 1 脚を先に（座面のうしろ。はばは前の絵と同じ8）
    p.round_top(1, 1, 40, 26, 7, top=TB, side=AB, line_top=OT, line_side=OD, lip=LIP, side_shade=AS)   # 2 座面を上にかさねる
    p.drop_shadow(OD, (AB, LL), AS, n=2)                                      # 3 座面が脚に落とすかげ（座面のすぐ下の2行）
    p.inner(TB, OT, TI, sides='ULR', y0=2, y1=20)                             # 4 輪郭の内がわ（上の面の上・左・右）
    for y, a, b in ((9, 10, 22), (17, 20, 33)): p.hl(y, a, b, TS)             # 5 木目
    return p

if __name__ == '__main__':
    if len(sys.argv) < 2: raise SystemExit('出力の png のパスをわたす')
    draw().save(sys.argv[1])
