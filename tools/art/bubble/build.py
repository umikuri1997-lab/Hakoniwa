"""ふきだしの絵（30こ）を、もらった絵 icons.png（6列×5行）から 48×48 にとりだし、1まいの WebP（6列×6行、288×288。6行めは顔5こ）にする。
- マスごとに絵のある所を切りとり、46×46 に入るように BOX でちぢめる（大きくはしない）。輪郭はもらった絵のまま。
- うすさは、あり・なしだけ（128 以上をあり）。外がわにうすいにじみをのこさない。
- 48×48 のまん中に置き、下のはしは 46 にそろえる（ひくい絵（高さ 30 より下）は、上下もまん中）。
- 顔（6行め）は tools/art/faces/build.py のドット（23×23）を2倍にする。
使い方：python3 tools/art/bubble/build.py <出力フォルダ>   出力：bubble.png（確認用）・bubble.webp"""
import sys, os, hashlib, numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
C, FIT = 48, 46

def cells():
    a = Image.open(os.path.join(HERE, 'icons.png')).convert('RGBA'); W, H = a.size
    for i in range(30):
        cx, cy = i % 6, i // 6
        c = a.crop((int(cx * W / 6), int(cy * H / 5), int((cx + 1) * W / 6), int((cy + 1) * H / 5)))
        n = np.array(c); ys, xs = np.where(n[..., 3] > 100)
        yield c.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))

def fit(c):
    w, h = c.size; s = min(1, FIT / w, FIT / h)
    if s < 1:  # 色はうすさで重みをつけて平均（透明な所の色をまぜない）
        n = np.array(c).astype(float); n[..., :3] *= n[..., 3:] / 255
        nw, nh = max(1, round(w * s)), max(1, round(h * s))
        r = np.array(Image.fromarray(n.round().astype(np.uint8), 'RGBA').resize((nw, nh), Image.BOX)).astype(float)
        a = r[..., 3:]; r[..., :3] = np.where(a > 0, r[..., :3] * 255 / np.maximum(a, 1), 0)
        n = r
    else: n = np.array(c).astype(float)
    n[..., 3] = np.where(n[..., 3] >= 128, 255, 0); n[n[..., 3] == 0] = 0
    return Image.fromarray(n.clip(0, 255).round().astype(np.uint8), 'RGBA')

def main():
    d = sys.argv[1] if len(sys.argv) > 1 else '.'
    out = Image.new('RGBA', (C * 6, C * 6))
    for i, c in enumerate(cells()):
        t = fit(c); w, h = t.size; x = (C - w) // 2; y = (C - h) // 2 if h < 30 else FIT - h
        out.alpha_composite(t, ((i % 6) * C + x, (i // 6) * C + y))
    sys.path.insert(0, os.path.join(HERE, '..', 'faces'))
    import build as faces
    for i, t in enumerate(faces.tiles()):
        f = Image.fromarray(t, 'RGBA'); f = f.crop(f.getbbox()); f = f.resize((f.width * 2, f.height * 2), Image.NEAREST)
        out.alpha_composite(f, (i * C + (C - f.width) // 2, 5 * C + (C - f.height) // 2))
    out.save(os.path.join(d, 'bubble.png'))
    out.save(os.path.join(d, 'bubble.webp'), lossless=True, exact=True, method=4)
    print(hashlib.sha1(open(os.path.join(d, 'bubble.webp'), 'rb').read()).hexdigest()[:10])

if __name__ == '__main__': main()
