#!/usr/bin/env python3
"""草地（tex:grass）・あれ地（tex:dry）のテクスチャを、もらった絵（src/grass.jpg・src/dry.jpg、1254×1254 でつながる絵）から作る。

  python3 tools/art/ground/ground_tex.py [--chips]

もらった絵は、はしとはしがつながっているので、そのまま BOX で 224×224（7マス・1マス32ドット）にちぢめる（切りとらない）。
草のふち（fringeg:*）は、前の草地の色でかいてあるので、前の草地の色から新しい草地の色へ、色ごとの平均とばらつきでうつしかえる。
--chips で chips.js・アトラスに入れる。プレビューは scratchpad ではなく tools/art/ground/out/ に書く。
"""
import os, sys, json
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))
sys.path.insert(0, os.path.join(ROOT, 'tools'))
import chips

SIZE = 224   # js/houses.js の GRTEX・DRTEX と同じ

def tex(name):
    im = Image.open(os.path.join(HERE, 'src', name + '.jpg')).convert('RGB')
    return im.resize((SIZE, SIZE), Image.BOX).convert('RGBA')

def stats(im):
    a = np.asarray(im.convert('RGBA'), float); m = a[..., 3] > 0
    p = a[..., :3][m]; return p.mean(0), p.std(0)

def recolor(im, old, new):
    (m0, s0), (m1, s1) = old, new
    a = np.asarray(im.convert('RGBA'), float).copy()
    a[..., :3] = np.clip((a[..., :3] - m0) / s0 * s1 + m1, 0, 255)
    return Image.fromarray(a.round().astype(np.uint8), 'RGBA')

def main():
    head, C = chips.load_imgs()
    g, d = tex('grass'), tex('dry')
    old, new = stats(C['tex:grass']['f'][0]), stats(g)
    out = os.path.join(HERE, 'out'); os.makedirs(out, exist_ok=True)
    for k, im in (('grass', g), ('dry', d)):
        t = Image.new('RGBA', (SIZE * 2, SIZE * 2))
        for x in (0, 1):
            for y in (0, 1): t.paste(im, (x * SIZE, y * SIZE))
        t.save(os.path.join(out, k + '_2x2.png'))
    fr = {k: recolor(C[k]['f'][0], old, new) for k in C if k.startswith('fringeg:')}
    if '--chips' not in sys.argv: print('preview', out); return
    C['tex:grass']['f'] = [g]; C['tex:grass']['w'] = C['tex:grass']['h'] = SIZE
    C['tex:dry']['f'] = [d]; C['tex:dry']['w'] = C['tex:dry']['h'] = SIZE
    for k, im in fr.items(): C[k]['f'] = [im]
    chips.pack_imgs(head, C)

if __name__ == '__main__': main()
