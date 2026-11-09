#!/usr/bin/env python3
"""火山の炉（smelter）と、温泉の湧き岩（hotstone）・湯気のチップを、もらった絵から作る。
  python3 tools/art/volcano2/volcano2_art.py <出力フォルダ>
- 透過と色はそのまま、BOX でちぢめる（CLAUDE.md）。もらった絵の alpha 8 以下（赤・黄のノイズ）は、透明にする。
- 炉は2コマ（火なし・火あり）。火ありのコマは、火なしの絵に、口の中と受け皿の光る所だけをかさねる（本体は同じ絵）。"""
import sys, os
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))

def load(n):
    a = np.array(Image.open(os.path.join(HERE, n)).convert('RGBA'))
    a[a[..., 3] <= 8] = 0
    return a

def box(a, b, w=None, sc=None):
    im = Image.fromarray(a[b[1]:b[3], b[0]:b[2]])
    if sc is None: sc = w / im.width
    return im.resize((max(1, round(im.width * sc)), max(1, round(im.height * sc))), Image.BOX), sc

def main(out):
    os.makedirs(out, exist_ok=True)
    f = load('furnace.png')
    B0 = (160, 100, 920, 680); DX = 1086  # 火ありのコマは、火なしのコマから x+1086
    off = f[B0[1]:B0[3], B0[0]:B0[2]].copy(); on_src = f[B0[1]:B0[3], B0[0] + DX:B0[2] + DX]
    d = np.abs(off.astype(int) - on_src.astype(int)).sum(-1) > 40
    zone = np.zeros_like(d); zone[290:520, 255:470] = True  # 口と受け皿のあたり（B0 の中の座標）
    m = d & zone & (off[..., 3] > 128) & (on_src[..., 3] > 128)
    on = off.copy(); on[m] = on_src[m]
    W = 118
    a, sc = box(off, (0, 0, off.shape[1], off.shape[0]), w=W); a.save(os.path.join(out, 'smelter.png'))
    b, _ = box(on, (0, 0, on.shape[1], on.shape[0]), sc=sc); b.save(os.path.join(out, 'smelter#on.png'))
    y = load('yuwaki.png')
    r, sc = box(y, (20, 300, 490, 670), w=60); r.save(os.path.join(out, 'hotstone.png'))
    for i, cx in enumerate([690, 1098, 1521, 1940]):  # 湯気のコマは、どれも同じ大きさ（はば300・y 140〜670）で、まん中をそろえて切る（コマで位置がずれない）
        bx = (cx - 150, 140, cx + 150, 670)
        s, _ = box(y, bx, sc=sc); s.save(os.path.join(out, 'hotstone:steam#%d.png' % i))
    print('scale', sc)

if __name__ == '__main__': main(sys.argv[1])
