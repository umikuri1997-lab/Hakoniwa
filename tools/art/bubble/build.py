"""ふきだしの絵（30こ）を、もらった絵 icons.png（6列×5行）から 96×96 にとりだし、1まいの WebP（6列×6行、576×576。6行めは顔5こ）にする。
- マスごとに絵のある所を切りとり、92×92 に入るように BOX でちぢめる（大きくはしない）。輪郭はもらった絵のまま。
- うすさは、もらった絵のまま（ほとんど透明な所だけ0に）。まわりの小さな点はすてる。
- 96×96 のまん中に置き、下のはしは 92 にそろえる（ひくい絵（高さ 60 より下）は、上下もまん中）。
- 顔（6行め）は tools/art/faces/build.py のドット（23×23）を4倍にする。
使い方：python3 tools/art/bubble/build.py <出力フォルダ>   出力：bubble.png（確認用）・bubble.webp"""
import sys, os, hashlib, numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
C, FIT = 96, 92

def cells():  # ひとつながりの形ごとに、どのマスの絵かを決める（まわりの小さな点はすてる）
    from scipy import ndimage
    a = Image.open(os.path.join(HERE, 'icons.png')).convert('RGBA'); n = np.array(a); H, W = n.shape[:2]
    lab, k = ndimage.label(n[..., 3] > 40); objs = ndimage.find_objects(lab); sizes = ndimage.sum(np.ones_like(lab), lab, range(1, k + 1))
    cell = {i: [] for i in range(30)}
    for j, (sl, sz) in enumerate(zip(objs, sizes)):
        if sz < 40: continue
        cy, cx = (sl[0].start + sl[0].stop) / 2, (sl[1].start + sl[1].stop) / 2
        cell[min(4, int(cy / (H / 5))) * 6 + min(5, int(cx / (W / 6)))].append(j + 1)
    for i in range(30):
        m = np.isin(lab, cell[i]); b = n.copy(); b[~m] = 0; ys, xs = np.where(m)
        yield Image.fromarray(b[ys.min():ys.max() + 1, xs.min():xs.max() + 1], 'RGBA')

def fit(c):
    w, h = c.size; s = min(1, FIT / w, FIT / h)
    if s < 1:  # 色はうすさで重みをつけて平均（透明な所の色をまぜない）
        n = np.array(c).astype(float); n[..., :3] *= n[..., 3:] / 255
        nw, nh = max(1, round(w * s)), max(1, round(h * s))
        r = np.array(Image.fromarray(n.round().astype(np.uint8), 'RGBA').resize((nw, nh), Image.BOX)).astype(float)
        a = r[..., 3:]; r[..., :3] = np.where(a > 0, r[..., :3] * 255 / np.maximum(a, 1), 0)
        n = r
    else: n = np.array(c).astype(float)
    n[n[..., 3] < 8] = 0
    return Image.fromarray(n.clip(0, 255).round().astype(np.uint8), 'RGBA')

def main():
    d = sys.argv[1] if len(sys.argv) > 1 else '.'
    out = Image.new('RGBA', (C * 6, C * 6))
    for i, c in enumerate(cells()):
        t = fit(c); w, h = t.size; x = (C - w) // 2; y = (C - h) // 2 if h < 60 else FIT - h
        out.alpha_composite(t, ((i % 6) * C + x, (i // 6) * C + y))
    sys.path.insert(0, os.path.join(HERE, '..', 'faces'))
    import build as faces
    for i, t in enumerate(faces.tiles()):
        f = Image.fromarray(t, 'RGBA'); f = f.crop(f.getbbox()); f = f.resize((f.width * 4, f.height * 4), Image.NEAREST)
        out.alpha_composite(f, (i * C + (C - f.width) // 2, 5 * C + (C - f.height) // 2))
    out.save(os.path.join(d, 'bubble.png'))
    out.save(os.path.join(d, 'bubble.webp'), lossless=True, exact=True, method=4)
    print(hashlib.sha1(open(os.path.join(d, 'bubble.webp'), 'rb').read()).hexdigest()[:10])

if __name__ == '__main__': main()
