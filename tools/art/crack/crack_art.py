# 朽ちた壁のひび（crack#0〜9・crack:v#0〜9、g64）
# もとは tools/art/crack/crack2.png（持ち主の絵。64ドットごとに5つの形、1ドット＝1ドット）。
# 形ごとに、かたむき（角度）と左右反転をかえた10しゅるいを作る（drawCrack が、となりと同じ形にならないようにえらぶ）。
# まわし方：8倍にして（ならべるだけ）まわし、8×8ごとに「線がかかる割合」でドットにもどす（ぼかさない・線がとぎれにくい）。
# 白いしっくいの上でも見えるよう、色は少しこくする（DARK）。ほぼ透明なごみのドットはすてる。
#   python3 tools/art/crack/crack_art.py [出力フォルダ]
import sys, os, math
import numpy as np
from PIL import Image
SRC = os.path.join(os.path.dirname(__file__), 'crack2.png')
DARK = .72          # 色のこさ（RGB×）
U = 8               # まわすときの細かさ
COV = .34           # この割合より線がかかれば、そのドットを描く
# 10しゅるい：(形, 角度, 左右反転)
VAR = [(0, 0, 0), (1, 15, 0), (2, -12, 0), (3, 25, 0), (4, -25, 0), (0, -20, 1), (1, -8, 1), (2, 18, 1), (3, -28, 1), (4, 10, 1)]
FIT = {'h': (52, 54), 'v': (34, 54)}   # おさめる大きさ（正面の板・たての帯）
OFF = {'h': (32, 28), 'v': (32, 16)}   # おさめる所のまん中（マスの中、g64）

def shapes():
    a = np.array(Image.open(SRC).convert('RGBA')).astype(np.float32)
    a[a[..., 3] < 24] = 0
    out = []
    for s in range(5):
        c = a[:, s*64:(s+1)*64]; ys, xs = np.where(c[..., 3] > 0)
        out.append(c[ys.min():ys.max()+1, xs.min():xs.max()+1])
    return out

def rot(c, deg, flip, fw, fh):
    if flip: c = c[:, ::-1]
    big = np.repeat(np.repeat(c, U, 0), U, 1)
    im = Image.fromarray(big.astype(np.uint8)).rotate(deg, Image.NEAREST, expand=True)
    b = np.array(im).astype(np.float32); ys, xs = np.where(b[..., 3] > 0); b = b[ys.min():ys.max()+1, xs.min():xs.max()+1]
    sc = min(1., fw*U/b.shape[1], fh*U/b.shape[0]); st = U/sc   # 1ドットになる大きさ（もとのドットで）
    W, H = max(1, round(b.shape[1]/st)), max(1, round(b.shape[0]/st)); o = np.zeros((H, W, 4), np.uint8)
    for y in range(H):
        for x in range(W):
            blk = b[int(y*st):max(int(y*st)+1, int((y+1)*st)), int(x*st):max(int(x*st)+1, int((x+1)*st))]
            m = blk[..., 3] > 0; f = m.mean()
            if f >= COV:
                p = blk[m]; w = p[:, 3:4]; rgb = (p[:, :3]*w).sum(0)/w.sum()
                o[y, x, :3] = np.clip(rgb*DARK, 0, 255); o[y, x, 3] = min(255, p[:, 3].max())
    return Image.fromarray(o)

def build():
    S = shapes(); out = {}
    for kind, pre in (('h', 'crack#'), ('v', 'crack:v#')):
        fw, fh = FIT[kind]; cx, cy = OFF[kind]
        for k, (s, d, f) in enumerate(VAR):
            im = rot(S[s], d, f, fw, fh); bb = im.getbbox(); im = im.crop(bb)
            out[pre+str(k)] = (im, cx-im.width//2, cy-im.height//2)
    return out

if __name__ == '__main__':
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..')); import chips
    h, C = chips.load_imgs(); B = build()
    for k in [k for k in C if k.startswith('crack#') or k.startswith('crack:v#')]: del C[k]
    for k, (im, ax, ay) in B.items():
        C[k] = {'g': 64, 'ax': ax, 'ay': ay, 'w': im.width, 'h': im.height, 'f': [im]}
    if len(sys.argv) > 1:
        sh = Image.new('RGBA', (64*10, 128), (236, 230, 216, 255))
        for k, (im, ax, ay) in B.items():
            n = int(k.split('#')[1]); sh.alpha_composite(im, (n*64+ax, (64 if ':v' in k else 0)+max(0, ay)))
        sh.resize((sh.width*4, sh.height*4), Image.NEAREST).save(os.path.join(sys.argv[1], 'crack4-sheet.png'))
    chips.pack_imgs(h, C); print(sorted(B))
