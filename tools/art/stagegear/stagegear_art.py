#!/usr/bin/env python3
"""風・水・闇のそうびのアイコンを、もらった絵 sheet.webp（白い背景、4列×3行）から作る。
上の行から 風 gk01〜04・水 gm01〜04・闇 gy01〜04（左から 武器・矢・防具・おまもり）。
icons32 で 32×32 にし、game.put で 96×96 を ICONS（'g_<id>'）へ。
  python3 tools/art/stagegear/stagegear_art.py <見本の出力フォルダ> [--game]"""
import sys, os
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); ART = os.path.join(HERE, '..')
sys.path.insert(0, ART); sys.path.insert(0, os.path.join(ART, 'icons32'))
import icons32 as I
from scipy.ndimage import label, binary_dilation
IDS = ['gk01', 'gk02', 'gk03', 'gk04', 'gm01', 'gm02', 'gm03', 'gm04', 'gy01', 'gy02', 'gy03', 'gy04']

def cutout(im):
    """白い羽・雲が背景の白とつながらないよう、ほぼまっ白（252より上）だけを背景にする"""
    a = np.asarray(im.convert('RGB')).astype(int)
    lab, _ = label((a.min(2) > 251) & (a.max(2) - a.min(2) < 4))
    edge = set(np.unique(np.r_[lab[0], lab[-1], lab[:, 0], lab[:, -1]])) - {0}
    bg = np.isin(lab, list(edge)); pale = a.min(2) > 238
    for _ in range(3): bg |= binary_dilation(bg) & pale   # 背景とまざった、ふちのうすい白（3ドットまで）もけす
    return Image.fromarray(np.dstack([a, np.where(bg, 0, 255)]).astype(np.uint8), 'RGBA')

def made():
    src = cutout(Image.open(os.path.join(HERE, 'sheet.webp'))); W, H = src.size; m = np.asarray(src)[..., 3] > 0; out = {}
    for k, gid in enumerate(IDS):
        cx, cy = k % 4, k // 4
        x0, x1, y0, y1 = W * cx // 4, W * (cx + 1) // 4, H * cy // 3, H * (cy + 1) // 3
        sub = m[y0:y1, x0:x1]; lab, n = label(binary_dilation(sub, iterations=8))
        sizes = [(lab == i).sum() for i in range(1, n + 1)]; keep = np.zeros_like(sub)
        for i, s in enumerate(sizes):
            if s >= max(sizes) * .05: keep |= (lab == i + 1)
        ys, xs = np.where(keep & sub)
        a = np.asarray(I.one(src, None, (x0 + xs.min(), y0 + ys.min(), x0 + xs.max() + 1, y0 + ys.max() + 1), gid)).copy()
        l2, n2 = label(a[..., 3] > 0)
        for i in range(1, n2 + 1):
            if (l2 == i).sum() < 6: a[l2 == i] = 0   # はなれた小さな点はけす
        out['g_' + gid] = Image.fromarray(a, 'RGBA')
    return out

def main():
    dst = sys.argv[1]; os.makedirs(dst, exist_ok=True); M = made()
    can = Image.new('RGBA', (100 * 4 + 4, 100 * 3 + 4), (240, 232, 210, 255))
    for k, im in enumerate(M.values()): can.alpha_composite(im.resize((96, 96), Image.NEAREST), (4 + 100 * (k % 4), 4 + 100 * (k // 4)))
    can.resize((can.width * 2, can.height * 2), Image.NEAREST).save(os.path.join(dst, 'stagegear_x2.png'))
    if '--game' in sys.argv:
        import game; game.put(M); print('ゲームに入れた')

if __name__ == '__main__': main()
