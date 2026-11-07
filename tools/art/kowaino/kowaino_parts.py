"""コワイノの部品の絵（もらった絵 basic_parts.png）→ ゲームの部品チップ kgp_<種類>:<部品>

もらった絵は、ドット1つが約10.5ピクセル。ゲームでは1マス64ドット（g64）。
1. 目のまわりの、まちがって残った色（赤むらさき・青・白のふち）をすきとおりにする
2. 部品ごとに BOX で 1/F にちぢめる（F=8：体のはばが約42ドット）
3. すきとおりは、はっきり（128でわける）。色は、少ない色（パレット）にそろえる
使い方: python3 tools/art/kowaino/kowaino_parts.py <出力フォルダ>
"""
import sys, os
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
F = 8.0
# 部品のかこみ（もとの絵のピクセル）。目は2つで1組
PARTS = {
    'basic': {
        'src': 'basic_parts.png',
        'body':  (130, 66, 476, 479),
        'bodyB': (588, 66, 948, 479),
        'arm':   (443, 572, 554, 717),   # 横むきの腕（豆の形）。前むきの腕の絵はアーチ形でつかえないので、こちらを左右で使う
        'foot':  (718, 606, 817, 697),
        'tip':   (1246, 558, 1394, 716),
        'eyeN':  (78, 826, 239, 927),
        'eyeA':  (332, 839, 517, 915),
        'eyeS':  (619, 839, 788, 919),
        'eyeO':  (887, 816, 1075, 933),
    }
}

def clean(a):
    """まちがって残ったふちの色をけす：あざやかな赤むらさき・青、白っぽい所、うすい所"""
    r, g, b, al = [a[..., i].astype(int) for i in range(4)]
    mx = np.maximum(np.maximum(r, g), b); mn = np.minimum(np.minimum(r, g), b)
    bad = ((mx - mn) > 70) | (mn > 200) | (al < 100)
    a = a.copy(); a[bad, 3] = 0
    return a

def shrink(im, box):
    x0, y0, x1, y1 = box
    c = im.crop(box)
    w = max(1, round((x1 - x0) / F)); h = max(1, round((y1 - y0) / F))
    # 色は、すきとおりの所をまぜないように、色×うすさでちぢめてから、うすさでわる
    a = np.array(c).astype(float)
    pm = a.copy(); pm[..., :3] *= a[..., 3:4] / 255
    P = np.array(Image.fromarray(pm.clip(0, 255).astype('uint8'), 'RGBA').resize((w, h), Image.BOX)).astype(float)
    A = np.array(Image.fromarray(a[..., 3].astype('uint8'), 'L').resize((w, h), Image.BOX)).astype(float)
    out = np.zeros((h, w, 4))
    m = A >= 128
    out[m, :3] = P[m, :3] / (A[m, None] / 255)
    out[m, 3] = 255
    return out

def kmeans(cols, k):
    cols = np.array(cols, float)
    C = [cols[0]]
    while len(C) < k:
        d = np.min([((cols - c) ** 2).sum(1) for c in C], 0)
        if d.max() <= 1: break
        C.append(cols[d.argmax()])
    C = np.array(C)
    for _ in range(20):
        lab = np.argmin([((cols - c) ** 2).sum(1) for c in C], 0)
        C = np.array([cols[lab == j].mean(0) if (lab == j).any() else C[j] for j in range(len(C))])
    return C.round()

def build(kind, dst):
    P = PARTS[kind]
    im = Image.fromarray(clean(np.array(Image.open(os.path.join(HERE, P['src'])).convert('RGBA'))), 'RGBA')
    sm = {k: shrink(im, b) for k, b in P.items() if k != 'src'}
    # 体の色と目の色で、べつのパレット（体3色・目2色）
    body = [p[:3] for k, a in sm.items() if not k.startswith('eye') for p in a.reshape(-1, 4) if p[3]]
    eye = [p[:3] for k, a in sm.items() if k.startswith('eye') for p in a.reshape(-1, 4) if p[3]]
    # 体は1色（ふちに、少しだけこい1ドットの線）、目も1色。もらった絵は体がほぼ1色で、ふちにだけ別の色がまじるため
    PB, PE = kmeans(body, 1), kmeans(eye, 1)
    os.makedirs(dst, exist_ok=True)
    out = {}
    for k, a in sm.items():
        pal = PE if k.startswith('eye') else PB
        o = np.zeros(a.shape, 'uint8')
        m = a[..., 3] > 0
        px = a[m, :3]
        o[m, :3] = pal[np.argmin([((px - c) ** 2).sum(1) for c in pal], 0)]
        o[m, 3] = 255
        if not k.startswith('eye'):
            sol = o[..., 3] > 0; pad = np.pad(sol, 1)
            edge = sol & ~(pad[:-2, 1:-1] & pad[2:, 1:-1] & pad[1:-1, :-2] & pad[1:-1, 2:])
            o[edge, :3] = (o[edge, :3] * .82).astype('uint8')
        img = Image.fromarray(o, 'RGBA')
        bb = img.getbbox()
        if bb: img = img.crop(bb)
        img.save(os.path.join(dst, f'kgp_{kind}_{k}.png'))
        out[k] = img
    print('palette body', PB.tolist(), 'eye', PE.tolist())
    return out

if __name__ == '__main__':
    r = build('basic', sys.argv[1])
    for k, v in r.items(): print(k, v.size)
