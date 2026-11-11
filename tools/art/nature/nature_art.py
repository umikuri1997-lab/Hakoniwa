#!/usr/bin/env python3
"""草原の木（tree・ntree・fruit）・枯れ木（deadtree）・岩（rock）のチップを、前のゲームの絵（なめらかな絵 ART.tree・dead・rock、assets/g）から、
tools/art/softpix.py でやわらかいドット絵にする（1マス32ドット・前のチップと同じ大きさ）。
  python3 tools/art/nature/nature_art.py <出力フォルダ>   → <id>.png と、見くらべ <id>_cmp.png
（同じフォルダの tree.png・deadtree.png・rock.png は、前にもらったドット絵。いまのチップには使っていない）"""
import os, sys
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, os.path.join(HERE, '..'))
import softpix, pixdown as P
G = os.path.join(HERE, '..', '..', '..', 'assets', 'g')
OBJS = {  # 元の絵・はば（前のチップと同じ）・色の数・rnd：丸い物の形をならすぼかし・thick：細い所をのこす
    'tree': {'src': '88a858c5e3.webp', 'w': 68, 'k': 9, 'rnd': .8},
    'deadtree': {'src': '8c9a3ef253.webp', 'w': 50, 'k': 6, 'thick': 1.8},
    'rock': {'src': '9c4f9195d8.webp', 'w': 32, 'k': 6, 'rnd': 1.3},
}
if __name__ == '__main__':
    d = sys.argv[1]; os.makedirs(d, exist_ok=True)
    for k, c in OBJS.items():
        src = Image.open(os.path.join(G, c['src'])).convert('RGBA')
        im = softpix.make(src, k=c['k'], w=c['w'], rnd=c.get('rnd'), thick=c.get('thick'))
        im.save(os.path.join(d, k + '.png')); P.compare(src, (0, 0) + src.size, im, k=8).save(os.path.join(d, k + '_cmp.png'))
        print(k, im.size, len({tuple(p) for p in np.asarray(im).reshape(-1, 4) if p[3]}))
