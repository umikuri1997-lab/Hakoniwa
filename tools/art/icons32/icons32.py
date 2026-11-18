#!/usr/bin/env python3
"""もらった白背景のアイコンのシート（3まい）を、1こずつ 32×32 のドット絵にする。
白い背景は、ふちからつながる白だけを透明にする。ちぢめるのは pixdown（セルの多いほうの色・中の線・外の輪郭）、そのまわりに1ドットの輪郭（となりの色を少し暗く）。さいごに1こ NCOL 色まで（quant：メディアンカット＋k-means、ディザなし）。くずれる物は hand.py の手で描いたドットにおきかえる。
使い方：python3 tools/art/icons32/icons32.py <出力フォルダ> <シート1> <シート2> <シート3>
      python3 tools/art/icons32/icons32.py --auto <名前のはじめ> <出力フォルダ> <シート...>（ならびを自動でさがす）"""
import sys, os
import numpy as np
from PIL import Image
from scipy.ndimage import label, binary_dilation, binary_erosion, find_objects
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
import pixdown as pd
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))
sys.path.insert(0, os.path.dirname(__file__))
import hand

SHEETS = [  # (列, 行, 名前)
 (4, 4, 'bell_copper medal_iron necklace hairpin_flower crystal_pink pouch bell_leaf flute '
        'ring_copper bracelet drop_purple pin_flower medal_gold feather scythe watering_can'),
 (5, 3, 'shears pickaxe_copper pickaxe_iron pickaxe_silver hammer shovel pot ore_hook torch_heart bucket '
        'ladle bottle basket feather_silver scarf'),
 (4, 4, 'acorn egg milk cotton flour dango sandwich milkshake berry_milk pancake map_piece treasure_map '
        'lucky_bag letter ingot ore'),
]
N, IN = 32, 30  # できあがりの大きさ・中身の長い辺（まわり1ドットあけ）
NCOL = 16  # 1この色の数（輪郭もふくめる）

def cutout(im):
    a = np.asarray(im.convert('RGB')).astype(int)
    white = (a.min(2) > 236) & (a.max(2) - a.min(2) < 14)
    lab, _ = label(white); edge = set(np.unique(np.r_[lab[0], lab[-1], lab[:, 0], lab[:, -1]])) - {0}
    bg = np.isin(lab, list(edge))
    # かこまれた白（輪の中・取っ手の中）：背景と同じ、むらのない白だけ
    for i in set(range(1, lab.max() + 1)) - edge:
        r = lab == i
        if r.sum() > 150 and a[r].std() < 2.5 and a[r].mean() > 250 and binary_erosion(r, iterations=3).sum() > 40: bg |= r   # 細い光の線はのこす
    rgba = np.dstack([a, np.where(bg, 0, 255)]).astype(np.uint8)
    return Image.fromarray(rgba, 'RGBA')

def quant(im, n=None):
    """n 色まで：メディアンカットで えらび、k-means（数でおもみ）でならす。はなれた色を むりにのこさない
    （chips の cap_colors は、はなれた色をのこすかわりに、広い所の色（白いうつわのかげ）をくずした）"""
    n = n or NCOL; a = np.asarray(im).copy(); m = a[..., 3] > 0
    px = a[..., :3][m]; U, inv, cnt = np.unique(px, axis=0, return_inverse=True, return_counts=True)
    if len(U) <= n: return im
    P = np.unique(np.asarray(Image.fromarray(px.reshape(1, -1, 3)).quantize(n, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert('RGB')).reshape(-1, 3), axis=0).astype(float)
    X = U.astype(float); w = cnt.astype(float)
    for _ in range(30):
        l = ((X[:, None] - P[None]) ** 2).sum(2).argmin(1)
        for j in range(len(P)):
            k = l == j
            if k.any(): P[j] = (X[k] * w[k, None]).sum(0) / w[k].sum()
    l = ((X[:, None] - P[None]) ** 2).sum(2).argmin(1)
    a[..., :3][m] = np.round(P[l][inv.ravel()]).astype(np.uint8)
    return Image.fromarray(a, 'RGBA')

def rim(c, k=.72):
    """外がわに1ドットの輪郭：となりの色を少し暗くした色（黒にしない）。輪の中のあなにも"""
    a = np.asarray(c).astype(float); m = a[..., 3] > 0; h, w = m.shape; o = a.copy()
    for y in range(h):
        for x in range(w):
            if m[y, x]: continue
            nb = [a[y + dy, x + dx, :3] for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))
                  if 0 <= y + dy < h and 0 <= x + dx < w and m[y + dy, x + dx]]
            if nb: o[y, x, :3] = np.mean(nb, 0) * k; o[y, x, 3] = 255
    return Image.fromarray(o.round().astype(np.uint8), 'RGBA')

def one(src, m, box, nm):
    """かこみ box の物を 32×32 に（輪郭・色の数・手の絵まで）"""
    bw, bh = box[2] - box[0], box[3] - box[1]
    o = pd.make(src, box, sc=IN / max(bw, bh))
    c = Image.new('RGBA', (N, N)); c.alpha_composite(o, ((N - o.width) // 2, N - 1 - o.height if bh > bw else (N - o.height) // 2))
    return hand.draw(*hand.HAND[nm]) if nm in hand.HAND else quant(rim(c))

def auto(dst, prefix, paths):
    """ならびのわからないシート：すかしたあと、はなれた物を1こずつ（上の行から、左から）。名前は <prefix><シート>_<番号>"""
    os.makedirs(dst, exist_ok=True); allims = []
    for si, p in enumerate(paths, 1):
        src = cutout(Image.open(p)); m = np.asarray(src)[..., 3] > 0
        lab, n = label(binary_dilation(m, iterations=3)); sl = find_objects(lab)
        bb = [((s[1].start, s[0].start, s[1].stop, s[0].stop), (lab[s] == i + 1).sum()) for i, s in enumerate(sl)]
        bx = [list(b) for b, a in bb if a > 3000]
        for b, a in bb:   # 小さなかけら（はなれた葉・つぶ）は、いちばん近い物にふくめる
            if a > 3000 or a < 30: continue
            cx, cy = (b[0] + b[2]) / 2, (b[1] + b[3]) / 2
            t = min(bx, key=lambda q: max(q[0] - cx, 0, cx - q[2]) + max(q[1] - cy, 0, cy - q[3]))
            t[:] = [min(t[0], b[0]), min(t[1], b[1]), max(t[2], b[2]), max(t[3], b[3])]
        go = True   # たてにすぐならんだ物（2本の短剣など）は1こ
        while go:
            go = False
            for i in range(len(bx)):
                for j in range(len(bx)):
                    a, b = bx[i], bx[j]
                    if i == j or b[1] < a[1]: continue
                    ov = min(a[2], b[2]) - max(a[0], b[0]); gap = b[1] - a[3]
                    if max(a[2] - a[0], b[2] - b[0]) < .25 * m.shape[1] and ov > .6 * min(a[2] - a[0], b[2] - b[0]) and -5 < gap < 20:   # 1つのマスの中だけ（矢のように、はばの広い物はならべたまま）
                        bx[i] = [min(a[0], b[0]), min(a[1], b[1]), max(a[2], b[2]), max(a[3], b[3])]; del bx[j]; go = True; break
                if go: break
        bx = [tuple(b) for b in bx]
        bx.sort(key=lambda b: (b[1] + b[3]) / 2)
        rows = []
        for b in bx:
            cy = (b[1] + b[3]) / 2
            if rows and cy - rows[-1][-1][4] < (b[3] - b[1]) * .5: rows[-1].append(b + (cy,))
            else: rows.append([b + (cy,)])
        k = 0
        for r in rows:
            for b in sorted(r):
                k += 1; nm = '%s%d_%02d' % (prefix, si, k)
                ys, xs = np.where(m[b[1]:b[3], b[0]:b[2]])
                box = (b[0] + xs.min(), b[1] + ys.min(), b[0] + xs.max() + 1, b[1] + ys.max() + 1)
                if (box[2] - box[0]) > 6 * (box[3] - box[1]):   # 矢のように細長い物は、45度ななめ（左下→右上）にしてから
                    r = src.crop(box).rotate(45, resample=Image.BICUBIC, expand=True); r = r.crop(r.getbbox())
                    c = one(r, None, (0, 0, r.width, r.height), nm)
                else: c = one(src, m, box, nm)
                c.save(os.path.join(dst, nm + '.png')); allims.append((nm, c))
        print(p, k)
    sheet(dst, allims)

def sheet(dst, allims):
    k = 8; cols = 8; rows = (len(allims) + cols - 1) // cols
    sh = Image.new('RGBA', (cols * (N * k + 8) + 8, rows * (N * k + 8) + 8), (236, 236, 236, 255))
    for i, (nm, c) in enumerate(allims):
        sh.alpha_composite(c.resize((N * k, N * k), Image.NEAREST), (8 + (i % cols) * (N * k + 8), 8 + (i // cols) * (N * k + 8)))
    sh.save(os.path.join(dst, '_sheet.png'))

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
            c = hand.draw(*hand.HAND[nm]) if nm in hand.HAND else quant(rim(c)); c.save(os.path.join(dst, nm + '.png')); allims.append((nm, c)); print(nm, o.size)
    # 一覧（8倍）
    k = 8; cols = 8; rows = (len(allims) + cols - 1) // cols
    sh = Image.new('RGBA', (cols * (N * k + 8) + 8, rows * (N * k + 8) + 8), (236, 236, 236, 255))
    for i, (nm, c) in enumerate(allims):
        sh.alpha_composite(c.resize((N * k, N * k), Image.NEAREST), (8 + (i % cols) * (N * k + 8), 8 + (i // cols) * (N * k + 8)))
    sh.save(os.path.join(dst, '_sheet.png'))

if __name__ == '__main__':
    if sys.argv[1] == '--auto': auto(sys.argv[3], sys.argv[2], sys.argv[4:])   # --auto <名前のはじめ> <出力> <シート...>
    else: main(sys.argv[1], sys.argv[2:5])
