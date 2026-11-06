#!/usr/bin/env python3
"""霧の中で見つける物（fogbox・nushiprint・fogspring）の絵を、もらった絵 fog3.png から作る（tools/art/pixdown.py の設定）。
  python3 tools/art/fog/fog_art.py <出力フォルダ>   または   python3 tools/art/pixdown.py --config tools/art/fog/fog_art.py <出力フォルダ>"""
import sys, os
HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, 'fog3.png')
OBJS = {  # 宝箱・あしあとは1マス（倍率0.13）、泉は2×2（はば118）
    'fogbox': {'box': (219, 269, 553, 567), 'sc': 0.13},
    'nushiprint': {'box': (875, 239, 1257, 577), 'sc': 0.13},
    'fogspring': {'box': (1535, 231, 1992, 600), 'w': 118, 'lines': (8, .15)},
}
def fix_box(o):
    """錠前：平均で、かぎ穴が十字になる → 丸い金の板と、丸い頭・下の細い かぎ穴にかきなおす"""
    rim, gold, hi, hole = (156, 106, 53), (220, 170, 92), (240, 207, 134), (74, 46, 30)
    cx, cy, R = 21, 26.5, 3.6
    for y in range(22, 32):
        for x in range(17, 26):
            d = ((x - cx) ** 2 + (y - cy) ** 2) ** .5
            if d <= R: o[y, x, :3] = rim if d > R - 1 else gold
    for x, y in ((19, 24), (20, 24), (19, 25)): o[y, x, :3] = hi
    for x, y in ((20, 25), (21, 25), (22, 25), (20, 26), (21, 26), (22, 26), (21, 27), (21, 28)): o[y, x, :3] = hole
    for x, y in ((20, 25), (22, 25)): o[y, x, :3] = (120, 82, 48)  # 頭の角を丸く

def fix_print(o):
    """ひづめの割れ目：平均でうすれて切れる → ふちの色の1ドットの線で、上のくぼみから下へつなぐ"""
    line = (222, 190, 158)
    for y in range(20, 31): o[y, 14, :3] = line
    for y in range(4, 14): o[y, 36, :3] = line

def fix_spring(o):
    """右下の小さな花：平均で、まん中が十字になり、花びらのさかいがうすれる → 丸いまん中と、5まいの花びらのさかいの線にかきなおす"""
    pet, yel, ydk, gap = (251, 247, 240), (252, 210, 134), (240, 190, 110), (196, 182, 166)
    for y in range(80, 87):
        for x in range(97, 103):
            if o[y, x, 3] and min(o[y, x, :3]) > 200: o[y, x, :3] = pet  # 花びらを白にそろえる
    for x, y in ((99, 81), (100, 81), (98, 82), (99, 82), (100, 82), (101, 82), (98, 83), (99, 83)): o[y, x, :3] = yel
    for x, y in ((100, 83), (101, 83), (99, 84), (100, 84)): o[y, x, :3] = ydk
    for x, y in ((97, 80), (102, 80), (96, 84), (95, 84), (102, 85), (103, 85), (99, 86), (99, 87)): o[y, x, :3] = gap

FIX = {'fogbox': fix_box, 'nushiprint': fix_print, 'fogspring': fix_spring}  # 形がくずれた所の手なおし（座標は出来上がりの絵のドット）
if __name__ == '__main__':
    sys.path.insert(0, os.path.dirname(HERE)); import pixdown
    from PIL import Image
    pixdown.run_objs(Image.open(SRC).convert('RGBA'), OBJS, FIX, sys.argv[1] if len(sys.argv) > 1 else '.')
