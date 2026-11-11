"""持ち主がかいた正面のいすのお手本（ref/chair.png）の部品（背もたれ・座面・脚）を組みかえて、
すわった子の手前に重ねる chair>2.front（うしろ向きのお手本から）と、よこ向き（chair>1）を作る。
できた絵は ref/ に書き、clean64.py がそのまま使う（ref/meta.json に ax・ay）。
  python3 tools/art/furn32/chair_ref.py"""
import os, json
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__)); REF = os.path.join(HERE, 'ref')
A = np.asarray(Image.open(os.path.join(REF, 'chair.png')).convert('RGBA')).copy()
H, W = A.shape[:2]
AX, AY = 12, -13          # 正面のいす（ref/chair.png）の ax・ay。下のはしは、どの向きも同じ
UP = 26                   # 背もたれの高さ（正面の絵で、座面のうしろのふち（26行め）から上）
OUT = A[0, 0].copy(); OUT[:] = A[0, 8]   # 輪郭線の色（いちばん上の行）

def op(a): return a[..., 3] > 0

def stretch_row(src, x0, x1):
    """1行の、色のある所（左はし〜右はし）を、x0〜x1 にのばす（はしの輪郭はそのまま、中は近い色）"""
    xs = np.where(src[:, 3] > 0)[0]; out = np.zeros_like(src)
    if not len(xs): return out
    a, b = xs[0], xs[-1]
    for x in range(x0, x1 + 1):
        t = (x - x0) / max(1, x1 - x0); out[x] = src[int(round(a + t * (b - a)))]
    return out

GAPCLEAR = True   # さんのあいだを透明にして、すわった子が見える

def back():
    """うしろ向きは、持ち主がかいたお手本（ref/chair_3e2.png）をそのまま使う。下のはしは正面と同じ。
    すわった子の手前に重ねる絵（chair>2.front）は、その絵の背もたれ・前のはばき（座面より上と、座面の手前の板）だけで、
    さんのあいだ（うしろの座面が見える所）は透明にする"""
    B = np.asarray(Image.open(os.path.join(REF, 'chair_3e2.png')).convert('RGBA')).copy()
    ay = AY + H - B.shape[0]
    L = B[..., :3] @ np.array([.3, .59, .11]); m = op(B)
    ys = [y for y in range(B.shape[0]) if m[y].sum() >= 30 and (L[y][m[y]] < 150).all()]   # 輪郭線だけの行（かさ木の下・さんの下）
    y0, y1 = max(zip(ys, ys[1:]), key=lambda q: q[1] - q[0])                  # いちばん広いあいだが、さんとすきま
    gap = np.zeros(B.shape[1], bool); gap[(L[(y0 + y1) // 2] >= 175) & m[(y0 + y1) // 2]] = True
    F = B.copy()
    if GAPCLEAR: F[y0 + 1:y1][:, gap] = 0
    rail = [y for y in range(y1 + 1, B.shape[0]) if not m[y, B.shape[1] // 2]]   # 脚のあいだがあく行から下は、のぞく
    F[rail[0]:] = 0
    return B, F, ay

def side():
    """よこ向き（右を向く）：背もたれは左はし。かさ木の上の面・手前のはしの面と、よこから見たさん1本"""
    S = np.zeros_like(A)
    S[50:] = A[50:]                                   # 脚（左がうしろの脚、右が前の脚）
    S[47:50] = A[47:50]
    for y in range(26, 47): S[y] = stretch_row(A[y], 0, 39)   # 座面：正面のだい形を、まっすぐな四角に
    S[25] = stretch_row(A[25], 1, 38)
    for y in range(26, 47):                           # 左右のふちは、どの行も同じならび（だい形の段のなごりをけす）
        S[y, 0] = OUT; S[y, 39] = OUT; S[y, 1] = A[40, 1]; S[y, 38] = A[40, 38]
    x0, x1 = 2, 8                                     # かさ木のはば（輪郭こみ）
    HI, LI, MI, NI = A[2, 15], A[3, 10], A[6, 15], A[7, 10]   # 正面のかさ木の色：上のふちの光・明るい所・ふつう・少しこい所
    for y in range(1, 30):                            # 上の面（1〜18行）と、手前のはしの面（19〜29行）
        S[y, x0] = OUT; S[y, x1] = OUT
        S[y, x0 + 1:x1] = LI if y < 19 else MI
        S[y, x0 + 1] = HI if y < 19 else NI
    S[19, x0 + 1:x1] = HI                             # 上の面と手前の面のかど（正面のかさ木の上のふちと同じ光）
    S[0, x0 + 1:x1] = OUT
    S[30, x0:x1 + 1] = OUT
    S[31:43, x0 + 1:x0 + 7] = A[13:25, 5:11]          # さん（よこから見ると1本にかさなる）
    S[43, x0 + 1:x0 + 7] = OUT
    return S, AY

def crop(a, ax, ay):
    m = op(a); ys = np.where(m.any(1))[0]; xs = np.where(m.any(0))[0]
    return a[ys[0]:ys[-1] + 1, xs[0]:xs[-1] + 1], ax + xs[0], ay + ys[0]

if __name__ == '__main__':
    meta = {}
    b, f, ay = back(); s, ay1 = side()
    for k, a, ay0 in (('chair>2', b, ay), ('chair>2.front', f, ay), ('chair>1', s, ay1)):
        c, ax, y = crop(a, AX, ay0)
        n = k.replace('>', '_3e')
        if k != 'chair>2': Image.fromarray(c, 'RGBA').save(os.path.join(REF, n + '.png'))   # うしろ向きは持ち主の絵のまま
        else: c, ax, y = b, AX, ay
        meta[k] = {'ax': int(ax), 'ay': int(y)}
        print(k, c.shape[1], c.shape[0], ax, y)
    json.dump(meta, open(os.path.join(REF, 'meta.json'), 'w'), ensure_ascii=False, indent=1)
