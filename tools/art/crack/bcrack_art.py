# ブロックをこわすときのひび（bcrack#0〜9、64×64、g64）。マイクラの destroy_stage と同じ作り方：
# 10まいの絵をブロックの面にかさね、こわすのが進むほど、ひびがまん中から外へのびる。
# もとは tools/art/crack/crack2.png（持ち主の絵。朽ちた壁のひびと同じ5つの形）。
# 形を3つ、まん中から外へのびる向きにまわしてならべ（crack_art.py と同じまわし方）、1まいの面のひびにする。
# のびる順：まん中にいちばん近いひびのドットから、ひびの上をたどった道のり（8方向）。
# 10だんめ（#9）で、ひびのドットがぜんぶ出る。
#   python3 tools/art/crack/bcrack_art.py [見本の絵を書き出すフォルダ]
import sys, os
from collections import deque
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
import crack_art as CA

N = 10
# (形, 角度, 左右反転, おさめる大きさ, まん中の場所)：まん中から右上・左・下へのびる3本
PUT = [(0, 35, 0, (40, 40), (42, 22)), (3, -20, 1, (40, 40), (20, 30)), (1, 70, 0, (36, 36), (36, 46))]
DARK = .8           # 茶色のブロックの上なので、朽ちた壁よりこくしない

def face():
    S = CA.shapes(); o = np.zeros((64, 64, 4), np.float32)
    CA.DARK = DARK
    for s, d, f, (fw, fh), (cx, cy) in PUT:
        im = CA.rot(S[s], d, f, fw, fh); im = im.crop(im.getbbox()); a = np.array(im).astype(np.float32)
        x0, y0 = cx - im.width // 2, cy - im.height // 2
        for y in range(im.height):
            for x in range(im.width):
                X, Y = x0 + x, y0 + y
                if 1 <= X < 63 and 1 <= Y < 63 and a[y, x, 3] > o[Y, X, 3]: o[Y, X] = a[y, x]
    return o

def order(o):
    on = o[..., 3] > 0; ys, xs = np.where(on); d = np.full((64, 64), np.inf)
    i = int(np.argmin((xs - 31.5) ** 2 + (ys - 31.5) ** 2)); q = deque([(ys[i], xs[i])]); d[ys[i], xs[i]] = 0
    while True:
        while q:
            y, x = q.popleft()
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    Y, X = y + dy, x + dx
                    if 0 <= Y < 64 and 0 <= X < 64 and on[Y, X] and d[Y, X] == np.inf: d[Y, X] = d[y, x] + 1; q.append((Y, X))
        left = on & (d == np.inf)
        if not left.any(): return d
        ly, lx = np.where(left); k = int(np.argmin((lx - 31.5) ** 2 + (ly - 31.5) ** 2))   # はなれたひびは、まん中に近いものから、いまの道のりのつづきで
        d[ly[k], lx[k]] = d[on & (d < np.inf)].max() + 1; q.append((ly[k], lx[k]))

def build():
    o = face(); d = order(o); on = o[..., 3] > 0; v = np.sort(d[on]); out = {}
    for k in range(N):
        lim = v[min(len(v) - 1, int(len(v) * (k + 1) / N) - 1)]
        a = o.copy(); a[~(on & (d <= lim))] = 0; out['bcrack#' + str(k)] = Image.fromarray(a.astype(np.uint8))
    return out

if __name__ == '__main__':
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..')); import chips
    h, C = chips.load_imgs(); B = build()
    for k in [k for k in C if k.startswith('bcrack#')]: del C[k]
    for k, im in B.items(): C[k] = {'g': 64, 'ax': 0, 'ay': 0, 'w': 64, 'h': 64, 'f': [im]}
    if len(sys.argv) > 1:
        sh = Image.new('RGBA', (64 * N, 64), (164, 123, 82, 255))
        for k, im in B.items(): sh.alpha_composite(im, (int(k.split('#')[1]) * 64, 0))
        sh.resize((sh.width * 4, sh.height * 4), Image.NEAREST).save(os.path.join(sys.argv[1], 'bcrack4-sheet.png'))
    chips.pack_imgs(h, C); print(sorted(B))
