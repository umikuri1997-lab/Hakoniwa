#!/usr/bin/env python3
"""御神木の調べ（守り神の出番）の絵：もらったシート sheet.png から、ドットの絵を作り、1まいのアトラス（assets/g/<hash>.webp）にまとめる。
シートの透過はよごれている（赤・黄・緑・白の、うすいもや）。うすさ128より上で、大きいかたまりだけを物とみなす。
1ドット＝世界の1（出番の絵と同じ細かさ）。
  python3 tools/art/minigame/minigame_art.py <見くらべの出力フォルダ>
アトラスの場所は js/sacred-play.js の MGSPR に書きこむ。"""
import sys, os, re, io, hashlib
import numpy as np
from PIL import Image
from scipy import ndimage as nd
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))
sys.path.insert(0, os.path.dirname(HERE)); import pixdown as pd

def clean(src):
    a = np.array(src); m = a[..., 3] >= 128
    lab, n = nd.label(m, np.ones((3, 3))); sz = nd.sum(m, lab, range(1, n + 1))
    keep = np.isin(lab, 1 + np.nonzero(sz >= 60)[0])
    keep = nd.binary_fill_holes(keep) & (a[..., 3] >= 40) | keep  # かたまりの中の小さな穴は、もとの色のまま
    a[..., 3] = np.where(keep, 255, 0); a[~keep, :3] = 0
    return Image.fromarray(a, 'RGBA')

# id: (box, sc)  ※ 同じ組の絵は同じ倍率
S1, SL, SW = .18, .175, .17
OBJS = {
    'stone0': ((255, 452, 361, 539), S1), 'stone1': ((372, 452, 477, 539), S1), 'stone2': ((490, 400, 595, 539), S1),
    'grass': ((621, 405, 734, 561), .14), 'cold': ((753, 439, 875, 544), .14), 'drop': ((906, 467, 957, 519), .17),
    'leafL': ((982, 417, 1233, 541), .2), 'tip': ((1117, 205, 1184, 267), .2),
    'bud0': ((114, 685, 158, 756), .15), 'bud1': ((246, 672, 296, 753), .15), 'bud2': ((362, 668, 443, 753), .15), 'bud3': ((489, 663, 605, 756), .15),
    'wind0': ((80, 1101, 182, 1172), SW), 'wind1': ((222, 1072, 378, 1177), SW), 'wind2': ((410, 1051, 585, 1194), SW),
    'spark0': ((690, 1104, 732, 1145), .2), 'spark1': ((805, 1090, 875, 1160), .2), 'spark2': ((933, 1062, 1023, 1182), .2), 'spark3': ((1087, 1090, 1148, 1156), .2),
}
LEAVES = [((37, 848, 144, 980), (173, 839, 289, 978)), ((341, 854, 448, 980), (474, 846, 580, 980)),
          ((641, 848, 748, 980), (776, 841, 898, 980)), ((956, 842, 1042, 980), (1087, 837, 1202, 980))]
for i, (s, w) in enumerate(LEAVES): OBJS['leaf%d' % i] = (s, SL); OBJS['leaf%ds' % i] = (w, SL)

def build(dst):
    src = clean(Image.open(os.path.join(HERE, 'sheet.png')).convert('RGBA'))
    os.makedirs(dst, exist_ok=True); ims = {}
    for k, (box, sc) in OBJS.items():
        im = pd.make(src, box, sc=sc); ims[k] = im
    # アトラス：高さの順に、はば256の行へ
    order = sorted(ims, key=lambda k: -ims[k].height); x = y = rh = 0; pos = {}; AW = 256
    for k in order:
        im = ims[k]
        if x + im.width > AW: x, y, rh = 0, y + rh + 1, 0
        pos[k] = (x, y, im.width, im.height); x += im.width + 1; rh = max(rh, im.height)
    at = Image.new('RGBA', (AW, y + rh))
    for k, (x, y, w, h) in pos.items(): at.paste(ims[k], (x, y))
    b = io.BytesIO(); at.save(b, 'WEBP', lossless=True, exact=True); data = b.getvalue()
    name = 'assets/g/%s.webp' % hashlib.sha1(data).hexdigest()[:10]
    open(os.path.join(ROOT, name), 'wb').write(data)
    at.resize((at.width * 8, at.height * 8), Image.NEAREST).save(os.path.join(dst, 'mg-clean.png'))
    src.save(os.path.join(dst, 'sheet-clean.png'))
    js = os.path.join(ROOT, 'js/sacred-play.js'); t = open(js).read()
    line = 'const MGSPR={src:"%s",r:{%s}};' % (name, ','.join('"%s":[%d,%d,%d,%d]' % (k, *pos[k]) for k in OBJS))
    t = re.sub(r'const MGSPR=\{.*?\}\};', lambda _: line, t, count=1); open(js, 'w').write(t)
    print(name, at.size); [print(k, pos[k][2:]) for k in OBJS]

if __name__ == '__main__': build(sys.argv[1])
