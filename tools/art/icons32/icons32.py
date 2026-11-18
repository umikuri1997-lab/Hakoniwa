#!/usr/bin/env python3
"""もらった白背景のアイコンのシート（3まい）を、1こずつ 32×32 のドット絵にする。
白い背景は、ふちからつながる白だけを透明にする。ちぢめるのは pixdown（セルの多いほうの色・中の線・外の輪郭）。
使い方：python3 tools/art/icons32/icons32.py <出力フォルダ> <シート1> <シート2> <シート3>"""
import sys, os
import numpy as np
from PIL import Image
from scipy.ndimage import label, binary_dilation, find_objects
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
import pixdown as pd

SHEETS = [  # (列, 行, 名前)
 (4, 4, 'bell_copper medal_iron necklace hairpin_flower crystal_pink pouch bell_leaf flute '
        'ring_copper bracelet drop_purple pin_flower medal_gold feather scythe watering_can'),
 (5, 3, 'shears pickaxe_copper pickaxe_iron pickaxe_silver hammer shovel pot ore_hook torch_heart bucket '
        'ladle bottle basket feather_silver scarf'),
 (4, 4, 'acorn egg milk cotton flour dango sandwich milkshake berry_milk pancake map_piece treasure_map '
        'lucky_bag letter ingot ore'),
]
N, IN = 32, 30  # できあがりの大きさ・中身の長い辺（まわり1ドットあけ）

def cutout(im):
    a = np.asarray(im.convert('RGB')).astype(int)
    white = (a.min(2) > 236) & (a.max(2) - a.min(2) < 14)
    lab, _ = label(white); edge = set(np.unique(np.r_[lab[0], lab[-1], lab[:, 0], lab[:, -1]])) - {0}
    bg = np.isin(lab, list(edge))
    # かこまれた白（輪の中・取っ手の中）：背景と同じ、むらのない白だけ
    for i in set(range(1, lab.max() + 1)) - edge:
        r = lab == i
        if r.sum() > 150 and a[r].std() < 2.5 and a[r].mean() > 250: bg |= r
    rgba = np.dstack([a, np.where(bg, 0, 255)]).astype(np.uint8)
    return Image.fromarray(rgba, 'RGBA')

def main(dst, paths):
    os.makedirs(dst, exist_ok=True); allims = []
    for (cols, rows, names), p in zip(SHEETS, paths):
        src = cutout(Image.open(p)); W, H = src.size; names = names.split()
        m = np.asarray(src)[..., 3] > 0
        for k, nm in enumerate(names):
            cx, cy = k % cols, k // cols
            x0, x1, y0, y1 = W * cx // cols, W * (cx + 1) // cols, H * cy // rows, H * (cy + 1) // rows
            sub = m[y0:y1, x0:x1]; lab, n = label(binary_dilation(sub, iterations=8))
            sizes = [(lab == i).sum() for i in range(1, n + 1)]
            keep = np.zeros_like(sub)
            for i, s in enumerate(sizes):
                if s >= max(sizes) * .05: keep |= (lab == i + 1)
            ys, xs = np.where(keep & sub)
            box = (x0 + xs.min(), y0 + ys.min(), x0 + xs.max() + 1, y0 + ys.max() + 1)
            bw, bh = box[2] - box[0], box[3] - box[1]
            sc = IN / max(bw, bh)
            o = pd.make(src, box, sc=sc)
            c = Image.new('RGBA', (N, N)); c.alpha_composite(o, ((N - o.width) // 2, N - 1 - o.height if bh > bw else (N - o.height) // 2))
            c.save(os.path.join(dst, nm + '.png')); allims.append((nm, c)); print(nm, o.size)
    # 一覧（8倍）
    k = 8; cols = 8; rows = (len(allims) + cols - 1) // cols
    sh = Image.new('RGBA', (cols * (N * k + 8) + 8, rows * (N * k + 8) + 8), (236, 236, 236, 255))
    for i, (nm, c) in enumerate(allims):
        sh.alpha_composite(c.resize((N * k, N * k), Image.NEAREST), (8 + (i % cols) * (N * k + 8), 8 + (i // cols) * (N * k + 8)))
    sh.save(os.path.join(dst, '_sheet.png'))

if __name__ == '__main__': main(sys.argv[1], sys.argv[2:5])
