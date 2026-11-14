#!/usr/bin/env python3
"""火山のとんがりの木（自然の木 deadtree~v・植えた木 tree~v）のチップを、もらった絵 cedar.png から作る。
  python3 tools/art/cedar/cedar_art.py <出力フォルダ>
透過と色はそのまま、BOX でちぢめる。2本とも同じ倍率（もらった絵の大きさのちがいを、そのままのこす）。"""
import sys, os
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
SC = 100 / 563  # 自然のとんがりの木のはばを100（g64）に
OBJS = {'deadtree~v': (191, 12, 754, 1012), 'tree~v': (849, 267, 1307, 1012)}
def main(out):
    os.makedirs(out, exist_ok=True)
    a = np.array(Image.open(os.path.join(HERE, 'cedar.png')).convert('RGBA')); a[a[..., 3] <= 8] = 0
    for k, b in OBJS.items():
        im = Image.fromarray(a[b[1]:b[3], b[0]:b[2]]); im = im.resize((round(im.width * SC), round(im.height * SC)), Image.BOX)
        im.save(os.path.join(out, k + '.png')); print(k, im.size)
if __name__ == '__main__': main(sys.argv[1])
