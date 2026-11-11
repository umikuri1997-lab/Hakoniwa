#!/usr/bin/env python3
"""家具のチップを、1マス64ドットの絵から、1マス32ドットのやわらかいドット絵にする（tools/art/softpix.py）。
元の絵は src/<チップ名>.png（作りなおす前のチップ。はじめて作るときに、アトラスから書き出す）。
大きさ・置く位置は前と同じ（ちょうど半分の細かさ）。同じ物の向き・コマは、同じ色の表を使う。
<id>.front など、すわった子の前にかさねる部品は、本体の作った絵から、同じ所を切りとる（つなぎ目に輪郭を出さない）。
  python3 tools/art/furn32/furn32_art.py <出力フォルダ> [id ...]   → <チップ名>.png・meta.json・見くらべ cmp_<id>.png
  python3 tools/art/furn32/furn32_art.py --put <出力フォルダ> [id ...]   → チップに入れる（tools/chips.py）"""
import os, sys, json, re
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.join(HERE, '..', '..', '..')
sys.path.insert(0, os.path.join(HERE, '..')); sys.path.insert(0, os.path.join(ROOT, 'tools'))
import softpix
SRC = os.path.join(HERE, 'src')
# 作りなおした家具（作った順）。k：色の数・rnd：形をならすぼかし（丸い物ほど大きく）・ln：のこす中の線（こさ,わりあい）
ITEMS = {
    'chair': {'k': 7, 'rnd': .6, 'ln': (8, .15)},
    'table': {'k': 6, 'rnd': .6},
    'bed': {'k': 8, 'rnd': .6, 'ln': (14, .3)},
    'taru': {'k': 8, 'rnd': .9, 'ln': (8, .2)},
}
def fname(key): return re.sub(r'[^0-9A-Za-z_.-]', lambda m: '_%02x' % ord(m.group()), key)
def base(key): return re.split(r'[#>:@~.]', key)[0]

def sources(b):
    """その物のチップ（g64）を src/ に書き出し（なければ）、{key: (絵のならび, ax, ay)}"""
    meta_p = os.path.join(SRC, 'meta.json'); meta = json.load(open(meta_p)) if os.path.exists(meta_p) else {}
    keys = [k for k in meta if base(k) == b]
    if not keys:
        import chips
        h, C = chips.load_imgs(); keys = [k for k in C if base(k) == b]
        for k in keys:
            c = C[k]; assert c.get('g') == 64, k
            for i, im in enumerate(c['f']): im.save(os.path.join(SRC, fname(k) + ('' if i == 0 else '#%d' % i) + '.png'))
            meta[k] = {'ax': c['ax'], 'ay': c['ay'], 'n': len(c['f'])}
        json.dump(meta, open(meta_p, 'w'), indent=0)
    out = {}
    for k in keys:
        m = meta[k]; out[k] = ([Image.open(os.path.join(SRC, fname(k) + ('' if i == 0 else '#%d' % i) + '.png')).convert('RGBA') for i in range(m['n'])], m['ax'], m['ay'])
    return out

def pad_even(im, ax, ay):
    """g64 の原点を偶数にそろえて、ちょうど半分にちぢめられるようにする"""
    ax, ay = round(ax), round(ay); x0, y0 = ax - ax % 2, ay - ay % 2
    W = im.width + (ax - x0); H = im.height + (ay - y0); W += W % 2; H += H % 2
    c = Image.new('RGBA', (W, H)); c.paste(im, (ax - x0, ay - y0)); return c, x0 // 2, y0 // 2

def build(b):
    p = ITEMS[b]; S = sources(b); res = {}
    mains = [k for k in S if '.front' not in k]
    sh = {}
    for k in mains:
        fr, ax, ay = S[k]; L = [pad_even(f, ax, ay) for f in fr]
        sh[k] = ([softpix.shrink(c, sc=.5, rnd=p.get('rnd'), thick=p.get('thick'), ln=p.get('ln', (14, .2))) for c, _, _ in L], L[0][1], L[0][2])
    pal = softpix.kmeans(np.concatenate([o[m][:, :3] for k in sh for o, m, _ in sh[k][0]]), p['k'])
    for k, (ls, x0, y0) in sh.items():
        res[k] = ([softpix.finish(o, m, pal, L=L) for o, m, L in ls], x0, y0)
    for k in S:
        if '.front' not in k: continue
        par = k.split('.front')[0]; fr, ax, ay = S[k]; prs, px, py = res[par]
        c, x0, y0 = pad_even(fr[0], ax, ay)
        a = np.asarray(c.resize((c.width // 2, c.height // 2), Image.BOX))[..., 3] > 100
        out = np.zeros(a.shape + (4,), np.uint8); P = prs[0]
        for y, x in zip(*np.where(a)):
            yy, xx = y + y0 - py, x + x0 - px
            if 0 <= yy < P.shape[0] and 0 <= xx < P.shape[1]: out[y, x] = P[yy, xx]
        res[k] = ([out], x0, y0)
    final = {}
    for k, (fs, x0, y0) in res.items():
        ims = [Image.fromarray(f, 'RGBA') for f in fs]; bb = ims[0].getbbox()
        for f in ims[1:]:
            q = f.getbbox()
            if q: bb = (min(bb[0], q[0]), min(bb[1], q[1]), max(bb[2], q[2]), max(bb[3], q[3]))
        final[k] = {'f': [f.crop(bb) for f in ims], 'ax': x0 + bb[0], 'ay': y0 + bb[1]}
    return final

def compare(b, final, z=6):
    S = sources(b); keys = sorted(final); cells = []
    for k in keys:
        s = S[k][0][0]; n = final[k]['f'][0]
        a = s.resize((s.width * z // 2, s.height * z // 2), Image.NEAREST); c = n.resize((n.width * z, n.height * z), Image.NEAREST); cells.append((a, c))
    W = sum(max(a.width, c.width) + 12 for a, c in cells); H = max(a.height for a, c in cells) + max(c.height for a, c in cells) + 20
    sh = Image.new('RGBA', (W, H), (200, 220, 180, 255)); x = 6
    for a, c in cells: sh.alpha_composite(a, (x, 6)); sh.alpha_composite(c, (x, 14 + max(q.height for q, _ in cells))); x += max(a.width, c.width) + 12
    return sh

if __name__ == '__main__':
    a = sys.argv[1:]; put = a and a[0] == '--put'
    if put: a = a[1:]
    d = a[0]; ids = a[1:] or list(ITEMS); os.makedirs(d, exist_ok=True)
    if put:
        import chips
        h, C = chips.load_imgs()
    for b in ids:
        final = build(b)
        for k, v in final.items():
            for i, f in enumerate(v['f']): f.save(os.path.join(d, fname(k) + ('' if i == 0 else '#%d' % i) + '.png'))
            if put: C[k] = {'ax': v['ax'], 'ay': v['ay'], 'w': v['f'][0].width, 'h': v['f'][0].height, 'f': v['f']}
            print(k, v['f'][0].size, v['ax'], v['ay'])
        compare(b, final).save(os.path.join(d, 'cmp_' + b + '.png'))
    if put: chips.pack_imgs(h, C)
