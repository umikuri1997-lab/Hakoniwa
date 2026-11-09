# 見張り台のチップ（もらった絵 image.png：見張り台・旗の柱・星の柱。どれも1ドット＝1ピクセルのドット絵）
# Lv1〜2：見張り台だけ。Lv3〜4：旗の柱。Lv5：星の柱。
# 柱は、うしろの手すりのうしろに立てて、なわ（X）を手すりの上の横木にかさねる（くくりつけた形）。
# 組みたててから、2×2マスいっぱい（はば125ドット、g64）にのばす（ドットのまま：NEAREST）。
# 使い方：python3 tools/art/watch/watch_art.py <出力フォルダ>
import sys
import numpy as np
from PIL import Image

SRC = 'tools/art/watch/image.png'
TOWER = (38, 48, 133, 251)              # 見張り台のかこみ（はば95・高さ203）
POLES = {'@2': (243, 304, -170), '@3': (402, 451, -341)}   # 柱の左右・見張り台へうつす x のずれ
DY = 1                                  # 柱のなわ（52〜63行）を、手すりの上の横木（55〜63行）にそろえる
TIE = (52, 64)                          # なわの行
W = 125                                 # できあがりのはば（g64）
BOTTOM = 123                            # 足の下のはし（置くマスの左上から、g64）
LEFT = 1

def compose(key):
    a = np.array(Image.open(SRC).convert('RGBA'))
    a[a[..., 3] < 20] = 0                            # まわりの、ほぼ透明なうすい点をけす
    tw = Image.fromarray(a).crop(TOWER)
    if key not in POLES:
        return tw, 0
    x0, x1, dx = POLES[key]
    p = a[:, x0:x1].copy()
    top = np.where(p[..., 3].any(1))[0].min()
    up = TOWER[1] - (top + DY)                       # 見張り台の上に足す高さ
    H = tw.height + up
    out = Image.new('RGBA', (tw.width, H))
    pole = Image.fromarray(p)
    px = x0 + dx - TOWER[0]
    out.alpha_composite(pole, (px, up - TOWER[1] + DY))
    out.alpha_composite(tw, (0, up))                 # 柱は見張り台のうしろ
    q = p.copy()                                     # なわだけを手前に
    lum = q[..., :3] @ np.array([.3, .59, .11])
    keep = np.zeros(q.shape[:2], bool)
    keep[TIE[0]:TIE[1]] = True
    q[~(keep & (lum > 150))] = 0
    out.alpha_composite(Image.fromarray(q), (px, up - TOWER[1] + DY))
    return out, up

def build():
    res = {}
    for key in ('', '@2', '@3'):
        im, up = compose(key)
        h = round(im.height * W / (TOWER[2] - TOWER[0]))
        sm = im.resize((W, h), Image.NEAREST)
        res['watch' + key] = (sm, LEFT, BOTTOM - h)
    return res

if __name__ == '__main__':
    out = sys.argv[1]
    for k, (im, ax, ay) in build().items():
        im.save(f'{out}/{k}.png')
        print(k, im.size, ax, ay)
