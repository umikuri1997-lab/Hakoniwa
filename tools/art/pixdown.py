#!/usr/bin/env python3
"""もらった絵（透過PNG・1まいに何こか）を、ドット絵のチップの大きさに ちぢめる（どの絵にも使える）。
縮小は、セルごとの色の平均（不透明な所だけ。2つの色にまたがるセルは多いほうの平均。透過は半分より多いか）。
そのあと、中の細い線を1ドットにのこし（lines）、外の輪郭を1ドットにそろえる（outline）。こわれた形は設定の FIX でなおす。

使い方：
  python3 tools/art/pixdown.py <絵.png> <出力フォルダ> [--box x0,y0,x1,y1 ...] [--w 118 | --h 60 | --sc 0.13] [--name a,b] [--lines 16,.2]
      --box がなければ、透過でわかれた物を自動でさがす（大きい順ではなく、左上から）。
  python3 tools/art/pixdown.py --config <設定.py> <出力フォルダ>
      設定.py：SRC（絵のパス）、OBJS={id:{'box':(x0,y0,x1,y1),'w':118 または 'h' または 'sc', 'lines':(th,fr)}}、FIX={id:関数(o)}。
出力：<id>.png（チップの大きさ）と、<id>_cmp.png（もとの絵と、できた絵の8倍を、ならべた見くらべ用）"""
import sys, os, argparse, importlib.util
import numpy as np
from PIL import Image

def major(p):
    """セルの色の平均。2つの色の所がまたがるときは、多いほうだけの平均（さかい目でにじまない）"""
    if len(p) < 4: return p.mean(0)
    l = p @ (.3, .59, .11); c0, c1 = p[l.argmin()], p[l.argmax()]
    for _ in range(6):
        k = ((p - c0) ** 2).sum(1) > ((p - c1) ** 2).sum(1)
        if k.all() or (~k).all(): return p.mean(0)
        c0, c1 = p[~k].mean(0), p[k].mean(0)
    if ((c0 - c1) ** 2).sum() < 900: return p.mean(0)
    return c1 if k.sum() * 2 > len(p) else c0

def grid(W, H, w, h): return np.linspace(0, W, w + 1), np.linspace(0, H, h + 1)

def shrink(b, w, h):
    H, W = b.shape[:2]; out = np.zeros((h, w, 4)); xs, ys = grid(W, H, w, h)
    for j in range(h):
        for i in range(w):
            c = b[int(ys[j]):max(int(ys[j]) + 1, int(ys[j + 1])), int(xs[i]):max(int(xs[i]) + 1, int(xs[i + 1]))].reshape(-1, 4)
            a = c[:, 3] / 255
            if a.mean() < .5: continue
            out[j, i, :3] = major(c[a > .5, :3]); out[j, i, 3] = 255
    return out

def lines(o, b, th=16, fr=.2):
    """中の線：もらった絵で、まわりより th こい細い線がセルに fr より多くあれば、線の色の1ドット（尾根だけのこして細める）"""
    from scipy.ndimage import gaussian_filter
    H, W = b.shape[:2]; L = b[..., :3] @ (.3, .59, .11); m0 = b[..., 3] > 128
    ln = m0 & (L < gaussian_filter(np.where(m0, L, L[m0].mean()), 5) - th)
    h, w = o.shape[:2]; xs, ys = grid(W, H, w, h)
    F = np.zeros((h, w)); col = np.zeros((h, w, 3))
    for y in range(h):
        for x in range(w):
            if o[y, x, 3] == 0: continue
            sl = (slice(int(ys[y]), int(ys[y + 1])), slice(int(xs[x]), int(xs[x + 1]))); c = ln[sl]
            if c.size and c.any(): F[y, x] = c.mean(); col[y, x] = b[sl][..., :3][c].mean(0)
    P = np.pad(F, 1)
    sk = (F >= fr) & (((F >= P[1:-1, :-2]) & (F > P[1:-1, 2:])) | ((F >= P[:-2, 1:-1]) & (F > P[2:, 1:-1])))
    r = o.copy(); r[sk, :3] = col[sk]; return r

def outline(o, b):
    """外の輪郭：透明ととなりあうドットを、もらった絵の輪郭の所（透明から4ドット以内）の色にする"""
    from scipy.ndimage import binary_erosion
    H, W = b.shape[:2]; m0 = b[..., 3] > 128; rim = m0 & ~binary_erosion(m0, iterations=4)
    m = o[..., 3] > 0; h, w = m.shape; r = o.copy(); xs, ys = grid(W, H, w, h)
    for y in range(h):
        for x in range(w):
            if not m[y, x]: continue
            if all(0 <= y + dy < h and 0 <= x + dx < w and m[y + dy, x + dx] for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))): continue
            y0, x0 = max(0, int(ys[y]) - 2), max(0, int(xs[x]) - 2); y1, x1 = int(ys[y + 1]) + 2, int(xs[x + 1]) + 2
            sel = rim[y0:y1, x0:x1]
            if sel.any(): r[y, x, :3] = b[y0:y1, x0:x1, :3][sel].mean(0)
    return r

def autoboxes(src, minpx=400, pad=2):
    """透過でわかれた物のかこみ（近い小さなかけらは、いちばん近い大きな物にふくめる）"""
    from scipy.ndimage import label, find_objects, binary_dilation
    m = np.asarray(src)[..., 3] > 40; lab, n = label(binary_dilation(m, iterations=6))
    bx = [(s[1].start, s[0].start, s[1].stop, s[0].stop) for i, s in enumerate(find_objects(lab)) if (lab[s] == i + 1).sum() >= minpx]
    W, H = src.size
    return sorted([(max(0, a - pad), max(0, b - pad), min(W, c + pad), min(H, d + pad)) for a, b, c, d in bx], key=lambda q: (q[1] // 200, q[0]))

def make(src, box, w=None, h=None, sc=None, ln=None, fix=None):
    b = np.asarray(src.crop(box)).astype(float); H, W = b.shape[:2]
    if w: sc = w / W
    elif h: sc = h / H
    ow, oh = max(1, round(W * sc)), max(1, round(H * sc))
    o = shrink(b, ow, oh)
    if ln is not False: o = lines(o, b, *(ln or ()))
    o = outline(o, b)
    if fix: fix(o)
    im = Image.fromarray(o.round().astype(np.uint8), 'RGBA'); return im.crop(im.getbbox())

def compare(src, box, im, k=8):
    """見くらべ：左にもとの絵（できた絵の k 倍と同じ高さ）、右にできた絵の k 倍（ドットのまま）。うしろは市松もよう"""
    big = im.resize((im.width * k, im.height * k), Image.NEAREST)
    s = src.crop(box); s = s.resize((round(s.width * big.height / s.height), big.height), Image.BOX)
    Wd = s.width + big.width + 24; sh = Image.new('RGBA', (Wd, big.height + 16), (255, 255, 255, 255))
    t = Image.new('RGBA', sh.size); px = t.load()
    for y in range(sh.height):
        for x in range(Wd): px[x, y] = (214, 214, 214, 255) if (x // 16 + y // 16) % 2 else (240, 240, 240, 255)
    sh.alpha_composite(t); sh.alpha_composite(s, (8, 8)); sh.alpha_composite(big, (s.width + 16, 8)); return sh

def run_objs(src, objs, fix, dst):
    os.makedirs(dst, exist_ok=True)
    for k, c in objs.items():
        im = make(src, c['box'], c.get('w'), c.get('h'), c.get('sc'), c.get('lines'), fix.get(k))
        im.save(os.path.join(dst, k + '.png')); compare(src, c['box'], im).save(os.path.join(dst, k + '_cmp.png')); print(k, im.size)

def load_config(p):
    sp = importlib.util.spec_from_file_location('artcfg', p); m = importlib.util.module_from_spec(sp); sp.loader.exec_module(m); return m

if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('img', nargs='?'); ap.add_argument('dst')
    ap.add_argument('--config'); ap.add_argument('--box', nargs='*'); ap.add_argument('--w', type=int); ap.add_argument('--h', type=int)
    ap.add_argument('--sc', type=float); ap.add_argument('--name'); ap.add_argument('--lines')
    a = ap.parse_args()
    if a.config:
        m = load_config(a.config); src = Image.open(m.SRC).convert('RGBA'); run_objs(src, m.OBJS, getattr(m, 'FIX', {}), a.dst)
    else:
        src = Image.open(a.img).convert('RGBA')
        boxes = [tuple(int(v) for v in s.split(',')) for s in a.box] if a.box else autoboxes(src)
        names = a.name.split(',') if a.name else ['obj%d' % i for i in range(len(boxes))]
        ln = tuple(float(v) for v in a.lines.split(',')) if a.lines else None
        if not (a.w or a.h or a.sc): print('boxes', boxes); sys.exit('--w / --h / --sc のどれかがいる')
        run_objs(src, {n: {'box': b, 'w': a.w, 'h': a.h, 'sc': a.sc, 'lines': ln} for n, b in zip(names, boxes)}, {}, a.dst)
