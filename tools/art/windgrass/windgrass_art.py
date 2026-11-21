#!/usr/bin/env python3
"""風のステージの草・花・素材の絵を、もらった絵 sheet18.webp（白い背景。unwhite.py で sheet18.png にすかす）から作る。
  python3 tools/art/windgrass/windgrass_art.py <見本の出力フォルダ> [--game]
マップの草（なびき草 weed4g・ほうき草 weed4k）と、たんぽぽ（tanpopo）は pixdown で1マス64ドットのチップに。
素材のアイコン（なびき草 nabiki・ほうき草 houki・雲わた kumowata・風の羽 hane）は icons32 で 32×32 → 96×96（ICONS）。"""
import sys, os
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); ART = os.path.join(HERE, '..'); R = os.path.join(ART, '..', '..')
sys.path.insert(0, ART); sys.path.insert(0, os.path.join(ART, 'icons32')); sys.path.insert(0, os.path.join(R, 'tools'))
import pixdown as pd
SRC = os.path.join(HERE, 'sheet18.png')
B = [(115, 109, 500, 547), (537, 85, 896, 545), (941, 125, 1353, 552), (20, 704, 393, 942), (398, 703, 749, 939), (777, 725, 1090, 936), (1122, 733, 1414, 924)]
OBJS = {  # [かこみ, 高さ, ax, ay]（下のはしは、ほかの草・花と同じ60）
    'weed4g': (B[0], 54), 'weed4k': (B[1], 54), 'tanpopo': (B[2], 60)}
ICON = {'nabiki': B[3], 'houki': B[4], 'kumowata': B[5], 'hane': B[6]}

def chips_made():
    src = Image.open(SRC).convert('RGBA'); out = {}
    for k, (box, h) in OBJS.items():
        im = pd.make(src, box, h=h); out[k] = im
    return out

def icons_made():
    import icons32 as I
    from scipy.ndimage import label
    src = Image.open(SRC).convert('RGBA'); out = {}
    for k, b in ICON.items():
        a = np.asarray(I.one(src, None, b, k)).copy(); lab, n = label(a[..., 3] > 0)
        for i in range(1, n + 1):
            if (lab == i).sum() < 6: a[lab == i] = 0   # はなれた小さな点（ちぢめたあとの、のこり）はけす
        out[k] = Image.fromarray(a, 'RGBA')
    return out

def main():
    dst = sys.argv[1]; os.makedirs(dst, exist_ok=True)
    C0 = chips_made(); I0 = icons_made()
    can = Image.new('RGBA', (64 * 3 + 96 * 4 + 40, 110), (150, 190, 120, 255)); x = 4
    for k, im in C0.items(): can.alpha_composite(im, (x + (64 - im.width) // 2, 100 - im.height)); x += 70
    for k, im in I0.items(): can.alpha_composite(im.resize((96, 96), Image.NEAREST), (x, 6)); x += 100
    can.resize((can.width * 3, can.height * 3), Image.NEAREST).save(os.path.join(dst, 'windgrass_x3.png'))
    if '--game' in sys.argv:
        import chips, game
        h, C = chips.load_imgs()
        for k, im in C0.items():
            C[k] = {'g': 64, 'ax': (64 - im.width) // 2, 'ay': 60 - im.height, 'w': im.width, 'h': im.height, 'f': [im]}
        chips.pack_imgs(h, C); game.put(I0); print('ゲームに入れた')

if __name__ == '__main__': main()
