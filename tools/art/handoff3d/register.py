"""GPT（handoff/files/H-*）の絵を、ゲームのチップ（chips.js とアトラス）に入れる。

  python3 tools/art/handoff3d/register.py H-1 H-2 H-3

H-1 の遊具：`<id>`（0コマめのまるごとの絵。アイコン・置く前・足場のうすい絵）、`<id>:s`（動かない所）、
`<id>:m0〜m15`（動く所。16コマで、まわる角度 rideAng×pf のひとまわり）、`<id>b`（こわれた遊具）。
`<id>` には、コマごとの座席の場所（足もとの点からの g64）`seats` と、まわる速さの倍 `pf` も入れる。

sprites.json の x・y は、足もとの点（g64）からの場所。足もとの点は、仮の絵とくらべたときと同じ
（placeholder.cjs：風のしかけ (32,56)・水の置き物 (32,64)）。チップの ax・ay は、マスの左上からの場所なので、足もとの点をたす。
"""
import json, os, sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
sys.path.insert(0, os.path.join(ROOT, 'tools'))
import chips

FOOT = {'H-2': (32, 56), 'H-3': (32, 64)}
NAMES = {'H-2': ['kazaana', 'kazaanab', 'kazami', 'kazami>1', 'kazami>2', 'kazami>3'],
         'H-3': ['dock', 'raft', 'mzchest', 'mzgate', 'mzgateb']}


def still(req, C):
    d = os.path.join(ROOT, 'handoff', 'files', req)
    S = json.load(open(os.path.join(d, 'sprites.json')))
    fx, fy = FOOT[req]
    for k in NAMES[req]:
        s = S[k]
        im = Image.open(os.path.join(d, s['file'])).convert('RGBA')
        assert im.size == (s['w'], s['h']), k
        C[k] = {'g': 64, 'ax': fx + s['x'], 'ay': fy + s['y'], 'w': s['w'], 'h': s['h'], 'f': [im]}
        print(k, C[k]['ax'], C[k]['ay'], s['w'], s['h'])


RIDEFOOT = {'merry': (64, 112), 'cup': (64, 112), 'skyswing': (64, 112), 'wheel': (96, 112)}


def rides(C):
    d = os.path.join(ROOT, 'handoff', 'files', 'H-1')
    S = json.load(open(os.path.join(d, 'sprites.json')))
    for k, (fx, fy) in RIDEFOOT.items():
        M = S[k]; cw, ch = M['cell']; ox, oy = M['origin']; n = M['frames']; cols = M['columns']
        full = Image.open(os.path.join(d, k + '_frames.png')).convert('RGBA')
        mot = Image.open(os.path.join(d, k + '_motion.png')).convert('RGBA')
        def cell(im, i):
            return im.crop(((i % cols) * cw, (i // cols) * ch, (i % cols) * cw + cw, (i // cols) * ch + ch))
        def put(key, im, extra=None):
            b = im.getbbox(); im = im.crop(b)
            C[key] = {'g': 64, 'ax': fx + ox + b[0], 'ay': fy + oy + b[1], 'w': im.width, 'h': im.height, 'f': [im]}
            if extra: C[key].update(extra)
        put(k, cell(full, 0), {'seats': M['seats'], 'pf': M['phase_factor']})
        st = S[k + '_static']; im = Image.open(os.path.join(d, st['file'])).convert('RGBA')
        C[k + ':s'] = {'g': 64, 'ax': fx + st['x'], 'ay': fy + st['y'], 'w': im.width, 'h': im.height, 'f': [im]}
        for i in range(n):
            put('%s:m%d' % (k, i), cell(mot, i))
        b = S[k + 'b_preview']; im = Image.open(os.path.join(d, b['file'])).convert('RGBA')
        C[k + 'b'] = {'g': 64, 'ax': fx + b['x'], 'ay': fy + b['y'], 'w': im.width, 'h': im.height, 'f': [im]}
        print(k, C[k]['ax'], C[k]['ay'], C[k]['w'], C[k]['h'])


def main():
    reqs = sys.argv[1:]
    head, C = chips.load_imgs()
    for r in reqs:
        rides(C) if r == 'H-1' else still(r, C)
    chips.pack_imgs(head, C)


if __name__ == '__main__':
    main()
