"""持ち主がかいた正面のいすのお手本（ref/chair.png）の部品（背もたれ・座面・脚）を組みかえて、
うしろ向き（chair>2・すわった子の手前に重ねる chair>2.front）と、よこ向き（chair>1）を作る。
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

def back():
    """うしろ向き：背もたれが手前。座面は正面と同じ所、背もたれは UP だけ下（座面の手前のふちに立つ）"""
    B = np.zeros_like(A)
    B[25:] = A[25:]                                   # 座面と脚（うしろの脚が手前に見える。形は同じ）
    D = 44 - 25 - 1                                   # 背もたれを下げる行の数（ささえの線 25 行め → 43 行め）
    BR = [A[y] for y in range(24)] + [A[23]]          # かさ木とさん（24行めの座面とのつなぎの点はとらず、23行めをくりかえす）
    sp = op(A[23])                                    # さんの足もとに、正面の 25 行めと同じ輪郭線
    F = np.zeros_like(A)                              # すわった子の手前に重ねる絵：背もたれだけ（すきまは透明）
    for T in (B, F):
        for y, r in enumerate(BR):                    # B は、すきまからうしろの座面が見える
            m = op(r); T[y + D][m] = r[m]
        T[43][sp] = A[25][sp]
    return B[D:], F[D:44], AY + D

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
    top = A[3, 10]; lit = A[6, 15]                     # 上の面：かさ木の上のふちの明るい色
    for y in range(0, 19):
        S[y, x0:x1 + 1] = lit; S[y, x0 + 1] = top
        S[y, x0] = OUT; S[y, x1] = OUT
    S[0, x0:x1 + 1] = OUT; S[0, x0] = 0; S[0, x1] = 0; S[1, x0] = OUT; S[1, x1] = OUT
    S[19:30, x0:x1 + 1] = A[[3, 3, 4, 5, 6, 7, 8, 9, 10, 11, 11], 3:3 + x1 - x0 + 1]  # 手前のはしの面：正面のかさ木の左はしと同じ色（上のまるい角の行はつかわない）
    S[19:30, x1] = OUT
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
        Image.fromarray(c, 'RGBA').save(os.path.join(REF, n + '.png')); meta[k] = {'ax': int(ax), 'ay': int(y)}
        print(k, c.shape[1], c.shape[0], ax, y)
    json.dump(meta, open(os.path.join(REF, 'meta.json'), 'w'), ensure_ascii=False, indent=1)
