#!/usr/bin/env python3
"""水面のテクスチャ（tex:water）の、明るいもよう（水の底の光のあみ目）を、おさえる。

  python3 tools/art/ground/water_tex.py [--chips]

もとの絵は src/water.png（128×128、つながる絵。前の tex:water のまま）。晴れた昼に、明るいもようが白っぽく見えた（池の白とび）。
まん中の明るさ（中央値）より明るいドットだけを、中央値の色へ KEEP のぶんだけ近づける（もようの形はのこし、明るさの幅だけへらす）。
中央値より暗いドット（水の色の大部分）はかえない。--chips で chips.js・アトラスに入れる。プレビューは out/ に書く。
"""
import os, sys
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))
sys.path.insert(0, os.path.join(ROOT, 'tools'))
import chips

KEEP = 0.45   # 明るいもようの、中央値からのちがいを、のこす分

def tone(im):
    a = np.asarray(im.convert('RGBA'), float).copy(); c = a[..., :3]; L = c.mean(2)
    m = np.median(L); med = np.median(c[np.abs(L - m) < 1.5], 0)   # 中央値の明るさのドットの、まん中の色
    hi = L > m
    c[hi] = med + (c[hi] - med) * KEEP
    a[..., :3] = np.clip(c, 0, 255)
    return Image.fromarray(a.round().astype(np.uint8), 'RGBA')

def main():
    head, C = chips.load_imgs()
    src = os.path.join(HERE, 'src', 'water.png')
    if not os.path.exists(src): C['tex:water']['f'][0].save(src); print('もとの絵をのこした', src)
    im = tone(Image.open(src))
    out = os.path.join(HERE, 'out'); os.makedirs(out, exist_ok=True)
    t = Image.new('RGBA', (im.width * 4, im.height * 2))
    s0 = Image.open(src).convert('RGBA')
    for x in (0, 1):
        for y in (0, 1): t.paste(s0, (x * im.width, y * im.height)); t.paste(im, ((x + 2) * im.width, y * im.height))
    t.save(os.path.join(out, 'water_before_after.png'))
    if '--chips' not in sys.argv: print('preview', out); return
    C['tex:water']['f'] = [im]
    chips.pack_imgs(head, C)
    open(os.path.join(ROOT, '.chips_changed'), 'w').write('tex:water')

if __name__ == '__main__': main()
