#!/usr/bin/env python3
"""水と闇のステージの草・花・素材の絵を、もらった絵 sheet19.webp（白い背景。unwhite.py で sheet19.png にすかす）から作る。
  python3 tools/art/mizuyami/mizuyami_art.py <見本の出力フォルダ> [--game]
マップの草（水：あし weed3g・がま weed3k、闇：夜つゆ草 weed5g・かげ草 weed5k）と、花（アイリス ayame・月見草 tsukimi）は pixdown で1マス64ドットのチップに。
素材のアイコン（あし・がま・粘土・丸石・夜つゆ草・かげ草・月光石・古木の材）は icons32 で 32×32 → 96×96（ICONS）。"""
import sys, os
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); ART = os.path.join(HERE, '..'); R = os.path.join(ART, '..', '..')
sys.path.insert(0, ART); sys.path.insert(0, os.path.join(ART, 'icons32')); sys.path.insert(0, os.path.join(R, 'tools'))
import pixdown as pd
SRC = os.path.join(HERE, 'sheet19.png')
B = [(24, 131, 220, 461), (263, 157, 456, 461), (500, 182, 688, 461), (728, 201, 924, 461), (966, 207, 1173, 460), (1196, 211, 1412, 458), (1442, 324, 1654, 458), (18, 636, 252, 792), (268, 646, 487, 793), (507, 645, 720, 792), (752, 644, 988, 793), (1021, 662, 1188, 789), (1242, 663, 1385, 786), (1443, 663, 1651, 789)]
OBJS = {  # [かこみ, 高さ]（下のはしは、ほかの草・花と同じ60）
    'weed3g': (B[0], 56), 'weed3k': (B[1], 56), 'ayame': (B[2], 60), 'weed5g': (B[3], 54), 'weed5k': (B[4], 54), 'tsukimi': (B[5], 56)}
ICON = {'nendo': B[6], 'ashi': B[7], 'gama': B[8], 'yotsuyu': B[9], 'kagekusa': B[10], 'maruishi': B[11], 'gekko': B[12], 'kogi': B[13]}

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
    can = Image.new('RGBA', (64 * 6 + 100 * 8 + 60, 110), (150, 190, 120, 255)); x = 4
    for k, im in C0.items(): can.alpha_composite(im, (x + (64 - im.width) // 2, 100 - im.height)); x += 70
    for k, im in I0.items(): can.alpha_composite(im.resize((96, 96), Image.NEAREST), (x, 6)); x += 100
    can.resize((can.width * 3, can.height * 3), Image.NEAREST).save(os.path.join(dst, 'mizuyami_x3.png'))
    if '--game' in sys.argv:
        import chips, game
        h, C = chips.load_imgs()
        for k, im in C0.items():
            C[k] = {'g': 64, 'ax': (64 - im.width) // 2, 'ay': 60 - im.height, 'w': im.width, 'h': im.height, 'f': [im]}
        chips.pack_imgs(h, C); game.put(I0); print('ゲームに入れた')

if __name__ == '__main__': main()
