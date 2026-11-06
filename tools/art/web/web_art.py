"""クモの巣（web.png）→ web#0（左の角）・web#1（右の角）。1ドット＝もとの絵の約19.7×18.9のマス。マスのまん中のいろのまんなか（median）でドットにもどす。"""
import sys
import numpy as np
from PIL import Image
SRC = __file__.rsplit('/', 1)[0] + '/web.png'
PX, OX, PY, OY = 19.66, 3.14, 18.92, 7.32   # マスの大きさ・ずれ（へりの位置から）
def grid():
    a = np.array(Image.open(SRC).convert('RGB')).astype(int)
    H, W = a.shape[:2]; nx, ny = int((W - OX) / PX), int((H - OY) / PY)
    o = np.zeros((ny, nx, 4), np.uint8)
    for j in range(ny):
        for i in range(nx):
            x0, y0 = OX + i * PX, OY + j * PY
            c = a[int(y0 + PY * .3):int(y0 + PY * .7), int(x0 + PX * .3):int(x0 + PX * .7)].reshape(-1, 3)
            m = np.median(c, 0)
            if 765 - m.sum() > 45: o[j, i] = (*m.astype(int), 255)   # うすい青灰の糸はのこす。白い地はとうめい
    return o
def crop(o, x0, x1):
    s = o[:, x0:x1]; ys, xs = np.where(s[..., 3] > 0)
    return Image.fromarray(s[ys.min():ys.max() + 1, xs.min():xs.max() + 1])
if __name__ == '__main__':
    o = grid(); mid = o.shape[1] // 2
    out = sys.argv[1]
    for n, im in (('web#0', crop(o, 0, mid)), ('web#1', crop(o, mid, o.shape[1]))):
        im.save(f'{out}/{n}.png'); im.resize((im.width * 12, im.height * 12), Image.NEAREST).save(f'{out}/{n}_x12.png'); print(n, im.size)
