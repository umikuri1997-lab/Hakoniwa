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


def canal(C):
    """H-6：水路（からの `mzcanal:d<mask>`・水のとどいた `mzcanal:w<mask>`）・高い段の水のふち `mzpond:<mask>`（どれもマスの左上が基準の64×64。
    mask は左1・右2・上4・下8 で、ひらいている（つながる）向き）・小舟 `mzboat`・荷をつんだ小舟 `mzboat:c`・いかだ `mzraftb`（まん中 (32,32) が基準）"""
    d = os.path.join(ROOT, 'handoff', 'files', 'H-6')
    for pre, key in (('dry', 'mzcanal:d'), ('wet', 'mzcanal:w'), ('pond', 'mzpond:')):
        for m in range(16):
            im = Image.open(os.path.join(d, '%s_m%d.png' % (pre, m))).convert('RGBA')
            C['%s%d' % (key, m)] = {'g': 64, 'ax': 0, 'ay': 0, 'w': 64, 'h': 64, 'f': [im]}
    for f, k in (('boat', 'mzboat'), ('boat_cargo', 'mzboat:c'), ('raft', 'mzraftb')):
        im = Image.open(os.path.join(d, f + '.png')).convert('RGBA'); b = im.getbbox(); im = im.crop(b)
        C[k] = {'g': 64, 'ax': b[0] - 32, 'ay': b[1] - 32, 'w': im.width, 'h': im.height, 'f': [im]}   # ax・ay は、まん中からの場所


def cafe(C):
    """H-7：店の看板・カウンター・メニューの板・歌の舞台（64×144、左上から (32,80) が3Dの原点＝マスのまん中）と、お客さん（80×128、(40,90) が足もと）"""
    d = os.path.join(ROOT, 'handoff', 'files', 'H-7')
    for k in ('shopsign', 'counter', 'menuboard', 'stage'):
        im = Image.open(os.path.join(d, k + '.png')).convert('RGBA'); b = im.getbbox(); im = im.crop(b)
        C[k] = {'g': 64, 'ax': 32 - 32 + b[0], 'ay': 32 - 80 + b[1], 'w': im.width, 'h': im.height, 'f': [im]}
    for f, k in (('guest_front', 'guest'), ('guest_right', 'guest>1'), ('guest_back', 'guest>2')):
        im = Image.open(os.path.join(d, f + '.png')).convert('RGBA'); b = im.getbbox(); im = im.crop(b)
        C[k] = {'g': 64, 'ax': b[0] - 40, 'ay': b[1] - 90, 'w': im.width, 'h': im.height, 'f': [im]}   # ax・ay は、足もとからの場所
        print(k, C[k]['ax'], C[k]['ay'])


def spirits(C):
    """H-4：トモリ（光）・ツキミ（闇）の部品 `sp_light:*`・`sp_dark:*`（ほかの属性の `sp_<属性>:*` と同じ、足もとからの場所）。
    動きの絵は `tools/art/spirit3d/build.py --add light,dark` で作る"""
    d = os.path.join(ROOT, 'handoff', 'files', 'H-4')
    P = json.load(open(os.path.join(d, 'sprites.json')))['parts']
    for k, v in P.items():
        im = Image.open(os.path.join(d, v['file'])).convert('RGBA')
        assert im.size == (v['w'], v['h']), k
        C[k] = {'ax': v['ax'], 'ay': v['ay'], 'w': v['w'], 'h': v['h'], 'f': [im]}


def main():
    reqs = sys.argv[1:]
    head, C = chips.load_imgs()
    for r in reqs:
        {'H-1': rides, 'H-4': spirits, 'H-6': canal, 'H-7': cafe}.get(r, lambda C: still(r, C))(C)
    chips.pack_imgs(head, C)


if __name__ == '__main__':
    main()
