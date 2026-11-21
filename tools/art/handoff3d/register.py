"""GPT（handoff/files/H-*）の絵を、ゲームのチップ（chips.js とアトラス）に入れる。

  python3 tools/art/handoff3d/register.py H-2 H-3

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


def main():
    reqs = sys.argv[1:]
    head, C = chips.load_imgs()
    for r in reqs:
        still(r, C)
    chips.pack_imgs(head, C)


if __name__ == '__main__':
    main()
