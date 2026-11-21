#!/usr/bin/env python3
"""素材「土」（ほる・つむ）のアイコンを、32×32 のドットでかく。
こんもりもった土の山に、小石と、上にちょっとだけ草。光は左上。輪郭はまわり1ドット（となりの色を少し暗く）。
  python3 tools/art/tsuchi/tsuchi_icon.py [見本の出力フォルダ] [--game]
--game：96×96 にのばして assets/g に入れ、ICONS の tsuchi に書く（icons32/game.py の put）。"""
import os, sys
import numpy as np
from PIL import Image
D = os.path.dirname(os.path.abspath(__file__)); ART = os.path.join(D, '..')
sys.path.insert(0, os.path.join(ART, 'icons32'))

C = {  # 明るくやわらかい土の色（こい所も、黒っぽくしない）
    'hi': (226, 190, 140), 'lt': (205, 164, 113), 'md': (182, 139, 92), 'dk': (156, 115, 76), 'sh': (134, 98, 66),
    'st': (196, 192, 178), 'stl': (226, 222, 208), 'gr': (128, 190, 96), 'grl': (166, 214, 120)}

def draw():
    a = np.zeros((32, 32, 4), np.uint8)
    cx, base, rx, ry = 15.5, 26, 13.0, 15.0
    for y in range(32):
        for x in range(32):
            dx, dy = (x + .5 - cx) / rx, (base - (y + .5)) / ry
            if dy < 0 or dy > 1 or dx * dx + dy * dy > 1: continue
            # 光は左上：左上ほど明るく、右下ほど暗い
            nz = max(0, 1 - dx * dx - dy * dy) ** .5; l = -.5 * dx + .55 * dy + .67 * nz   # ドームの面の向きと、左上の光
            k = 'hi' if l > .9 else 'lt' if l > .72 else 'md' if l > .5 else 'dk' if l > .28 else 'sh'
            if y >= base - 2: k = 'dk' if k in ('hi', 'lt', 'md') else 'sh'   # 下のはしは、地面にふれるかげ
            a[y, x] = C[k] + (255,)
    for (x, y, k) in [(9, 18, 'st'), (10, 18, 'stl'), (9, 19, 'st'), (10, 19, 'st'), (19, 21, 'st'), (20, 21, 'st'), (20, 20, 'stl'),
                      (14, 23, 'st'), (15, 23, 'st'), (22, 17, 'st')]:
        a[y, x] = C[k] + (255,)   # 小石
    for (x, y, k) in [(14, 11, 'gr'), (15, 10, 'grl'), (15, 11, 'gr'), (16, 9, 'grl'), (17, 10, 'gr'), (17, 11, 'gr'), (18, 11, 'gr')]:
        a[y, x] = C[k] + (255,)   # てっぺんの草
    # 輪郭：形の外がわ1ドット。となりの色を少し暗く
    m = a[..., 3] > 0; o = a.copy()
    for y in range(32):
        for x in range(32):
            if m[y, x]: continue
            nb = [a[q, p, :3] for p, q in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)) if 0 <= p < 32 and 0 <= q < 32 and m[q, p]]
            if nb: o[y, x] = tuple(int(v * .78) for v in np.mean(nb, 0)) + (255,)
    return Image.fromarray(o, 'RGBA')

if __name__ == '__main__':
    im = draw()
    if len(sys.argv) > 1 and not sys.argv[1].startswith('--'):
        os.makedirs(sys.argv[1], exist_ok=True); im.resize((320, 320), Image.NEAREST).save(os.path.join(sys.argv[1], 'tsuchi_x10.png'))
    if '--game' in sys.argv:
        import game; game.put({'tsuchi': im}); print('ゲームに入れた')
