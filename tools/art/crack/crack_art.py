# 朽ちた壁のひび（tools/art/crack/crack.png）：ドット絵を約11.8倍にした絵。マス目ごとに多数決でもどす（1ドット=g64の1ドット）
import sys
import numpy as np
from PIL import Image
P, OX, OY = 11.8, 2.95, 5.9
def run(src, out):
    a = np.array(Image.open(src).convert('RGBA')).astype(float)
    H = int((a.shape[0]-OY)//P); W = int((a.shape[1]-OX)//P); o = np.zeros((H, W, 4), np.uint8)
    for y in range(H):
        for x in range(W):
            c = a[int(OY+y*P):int(OY+(y+1)*P), int(OX+x*P):int(OX+(x+1)*P)].reshape(-1, 4); s = c[c[:, 3] > 128]
            if len(s) > len(c)/2: o[y, x] = np.median(s, 0)
    o[..., 3] = np.where(o[..., 3] > 0, 255, 0)
    im = Image.fromarray(o); im.save(out + '/all.png')
    # 3つにわける（透明な列で）
    cols = (o[..., 3] > 0).any(0); parts = []; x = 0
    while x < W:
        if cols[x]:
            x0 = x
            while x < W and (cols[x:x+8].any()): x += 1
            parts.append(x0); parts.append(x)
        x += 1
    for k in range(0, len(parts), 2):
        sub = im.crop((parts[k], 0, parts[k+1], H)); sub = sub.crop(sub.getbbox()); sub.save(out + '/c%d.png' % (k//2)); print(k//2, sub.size)
if __name__ == '__main__': run(sys.argv[1], sys.argv[2])
