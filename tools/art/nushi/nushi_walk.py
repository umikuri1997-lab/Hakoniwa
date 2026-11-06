#!/usr/bin/env python3
"""草原のヌシ様の横歩き（walk.gif、8コマ・左向き）→ ゲームのドット絵シート。
1. うしろ（白に近い色）を、ふちからつながる所だけ透明にする（からだのクリーム色はのこす）。
2. セル平均（pixdown.shrink）でちぢめる。
3. 8コマぜんぶから1つの小さなパレットを作り、どのコマもそのパレットにする（コマごとの色のゆらぎをけす）。
4. 前のコマ（からだの位置をそろえて）と色がほとんど同じ所は、前のコマの色をつかう（うねうねをけす）。
5. 外の輪郭は、そのドットの色を少しだけ暗くした1ドット。
使い方：python3 tools/art/nushi/nushi_walk.py <出力フォルダ> [--pack]（--pack で assets/g に webp を書く）
出力：sheet.png（8コマを横にならべた絵）・frames.json・raw_small.png（パレット前、くらべ用）"""
import sys, os, json
import numpy as np
from PIL import Image
from scipy.ndimage import label, binary_erosion
from scipy.cluster.vq import kmeans2
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
import pixdown

SRC = os.path.join(os.path.dirname(__file__), 'walk.gif')
BG = np.array([252, 252, 251]); BGT = 10   # うしろの色と、うしろとみなす色のちがい
SC = 0.39                                   # 高さ約150（前の横歩きの絵と同じ大きさ）
K = 18                                      # パレットの色の数
STICK = 22                                  # 前のコマの色をつかう、色のちがいの上限

def frames():
    g = Image.open(SRC); out = []
    for k in range(g.n_frames):
        g.seek(k); a = np.asarray(g.convert('RGB')).astype(float)
        near = np.abs(a - BG).max(2) <= BGT
        lab, _ = label(near); edge = set(np.unique(np.r_[lab[0], lab[-1], lab[:, 0], lab[:, -1]])) - {0}
        bg = np.isin(lab, list(edge))
        out.append(np.dstack([a, np.where(bg, 0, 255)]))
    return out

def despeckle(i, m, P, lim=30):
    """紙のざらざら：まわり4つとちがう1ドットで、まわりの多い色と近ければ、その色にする"""
    i = i.copy()
    for _ in range(2):
        pad = np.pad(np.where(m, i, -1), 1, constant_values=-1); nb = np.stack([pad[:-2, 1:-1], pad[2:, 1:-1], pad[1:-1, :-2], pad[1:-1, 2:]], -1)
        for y, x in zip(*np.nonzero(m)):
            n = nb[y, x]; n = n[n >= 0]
            if len(n) < 3 or i[y, x] in n: continue
            v, c = np.unique(n, return_counts=True); t = v[c.argmax()]
            if c.max() >= 3 and np.sqrt(((P[t] - P[i[y, x]]) ** 2).sum()) < lim: i[y, x] = t
    return i

def main(dst):
    os.makedirs(dst, exist_ok=True)
    F = frames(); H, W = F[0].shape[:2]
    ys, xs = np.nonzero(np.any([f[..., 3] > 0 for f in F], 0)); box = (xs.min() - 2, ys.min() - 2, xs.max() + 3, ys.max() + 3)
    ow, oh = round((box[2] - box[0]) * SC), round((box[3] - box[1]) * SC)
    sm = [pixdown.shrink(f[box[1]:box[3], box[0]:box[2]], ow, oh) for f in F]
    Image.fromarray(np.hstack(sm).round().astype(np.uint8), 'RGBA').save(os.path.join(dst, 'raw_small.png'))
    px = np.concatenate([s[s[..., 3] > 0, :3] for s in sm])
    np.random.seed(1); P, _ = kmeans2(px, K, minit='++', seed=1, iter=40)
    P = P[np.argsort(P @ (.3, .59, .11))]
    idx = []
    for k, s in enumerate(sm):
        m = s[..., 3] > 0; d = ((s[..., None, :3] - P) ** 2).sum(-1); i = despeckle(d.argmin(-1), m, P)
        if k:
            # 前のコマとの、からだのずれ（上半分で一番合うずらし）
            pm, pi = sm[k - 1][..., 3] > 0, idx[-1]; best = (1e9, 0, 0)
            for dy in range(-3, 4):
                for dx in range(-3, 4):
                    q = np.roll(np.roll(pm, dy, 0), dx, 1); e = (q ^ m)[: oh * 3 // 5].sum()
                    if e < best[0]: best = (e, dy, dx)
            _, dy, dx = best; qm = np.roll(np.roll(pm, dy, 0), dx, 1); qi = np.roll(np.roll(pi, dy, 0), dx, 1)
            dp = np.take_along_axis(d, qi[..., None], -1)[..., 0]
            use = m & qm & (np.sqrt(dp) < np.sqrt(d.min(-1)) + STICK) & (np.sqrt(dp) < 40)
            i = np.where(use, qi, i)
        idx.append(np.where(m, i, -1))
    # 1コマめにも、最後のコマとのつながりで同じ処理（ループのつなぎ目）はしない：1コマめが基準
    out = []
    for i in idx:
        m = i >= 0; o = np.zeros((oh, ow, 4), np.uint8); o[m, :3] = P[i[m]].round(); o[m, 3] = 255
        rim = m & ~binary_erosion(m, border_value=0)
        o[rim, :3] = (o[rim, :3] * .86).round()   # 輪郭：となりの色より少しだけ暗い1ドット
        out.append(o)
    sheet = np.hstack(out); Image.fromarray(sheet, 'RGBA').save(os.path.join(dst, 'sheet.png'))
    json.dump({'w': ow, 'h': oh, 'n': len(out), 'ms': 130, 'palette': P.round().astype(int).tolist()}, open(os.path.join(dst, 'frames.json'), 'w'))
    print('frame', ow, oh, 'n', len(out))
    if '--pack' in sys.argv:   # ゲームの絵（assets/g、名前は中身から）
        import io, hashlib
        b = io.BytesIO(); Image.fromarray(sheet, 'RGBA').save(b, 'WEBP', lossless=True, exact=True, method=6); d = b.getvalue()
        n = 'assets/g/' + hashlib.sha1(d).hexdigest()[:10] + '.webp'; open(os.path.join(os.path.dirname(__file__), '../../..', n), 'wb').write(d); print(n)

if __name__ == '__main__':
    main(sys.argv[1])
