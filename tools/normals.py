#!/usr/bin/env python3
"""マップチップのノーマルマップ（面の向きの絵）を作る道具。

  python3 tools/normals.py        # chips.js とアトラス → assets/chipn/*.webp と chips.js の window.CHIPN

ノーマルマップは、色のアトラス（assets/chips）と同じならび（同じページ・同じ場所）。ゲームは、チップを描くとき
同じ場所のノーマルマップを、面の向きの絵（js/lit.js の NC）にも描き、日ざし・夜の明かりの当たり方をきめる。
向きは、世界の向き（x=東・y=南・z=上）を (N+1)/2 で色にした物。透明な所は、上向き（地面と同じ）。

向きの作り方（もらった絵には向きがないので、形と明るさからおしはかる）：
  ・ふちの面取り：形のふちから BEV ドットのあいだを、なだらかに下げる（物のふちが、まるく見える）
  ・こまかいでこぼこ：明るさのちがい（まわりより暗い線は、みぞ）
  ・画面の向きの面（カメラを向いた面）を、世界の向きにまわす（見る向きは (0,0.8,1)）
tools/art/normals/<id>.png があれば、そのチップは、その絵（3Dから写した、本当の向き）を使う（f の1コマめと同じ大きさ）。
chips.py pack・replace は、さいごにこれを動かす。
"""
import os, io, json, hashlib, re, sys
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
PAGE = 2048
VIEW = np.array([0, 0.8, 1.0]); VIEW = VIEW / np.linalg.norm(VIEW)
SDN = np.array([0, VIEW[2], -VIEW[1]])  # 画面の下の向き（世界）
OVR = os.path.join(ROOT, 'tools', 'art', 'normals')

def blur(a, r):
    """箱のぼかし（r ドット）をたてよこ1回ずつ"""
    if r <= 0: return a
    k = 2 * r + 1
    p = np.pad(a, r, mode='edge')
    c = np.cumsum(p, axis=1); c = np.pad(c, ((0, 0), (1, 0)))
    a = (c[:, k:] - c[:, :-k]) / k
    c = np.cumsum(a, axis=0); c = np.pad(c, ((1, 0), (0, 0)))
    return (c[k:, :] - c[:-k, :]) / k

def erode(m):
    p = np.pad(m, 1, constant_values=False)
    return p[1:-1, 1:-1] & p[:-2, 1:-1] & p[2:, 1:-1] & p[1:-1, :-2] & p[1:-1, 2:]

def auto_normal(im, g64):
    a = np.asarray(im, dtype=np.float32) / 255.0
    rgb, al = a[..., :3], a[..., 3]
    m = al > 0.3
    out = np.zeros(a.shape, dtype=np.uint8); out[..., 0] = 128; out[..., 1] = 128; out[..., 2] = 255
    if not m.any():
        return out
    BEV = 6 if g64 else 3
    d = np.zeros(m.shape, np.float32); cur = m.copy()
    for _ in range(BEV):
        d += cur; cur = erode(cur)
        if not cur.any(): break
    t = d / BEV
    h = (t * t * (3 - 2 * t)) * BEV * 0.9           # ふちの面取り
    lum = rgb @ np.array([0.299, 0.587, 0.114], np.float32)
    det = (lum - blur(lum, 2 if g64 else 1)) * m
    h = h + det * BEV * 0.9                          # こまかいでこぼこ
    h = blur(h, 1)
    gx = np.zeros_like(h); gy = np.zeros_like(h)
    gx[:, 1:-1] = (h[:, 2:] - h[:, :-2]) / 2
    gy[1:-1, :] = (h[2:, :] - h[:-2, :]) / 2
    ns = np.stack([-gx, -gy, np.ones_like(h)], -1)
    ns /= np.linalg.norm(ns, axis=-1, keepdims=True)
    N = ns[..., :1] * np.array([1, 0, 0]) + ns[..., 1:2] * SDN + ns[..., 2:3] * VIEW
    N /= np.linalg.norm(N, axis=-1, keepdims=True)
    enc = np.clip(np.round((N * 0.5 + 0.5) * 31) * 255 / 31, 0, 255).astype(np.uint8)  # 32だん（ファイルを小さく。光はやわらかいので見分けがつかない）
    out[m, :3] = enc[m]
    out[..., 3] = (np.asarray(im)[..., 3]).astype(np.uint8)
    return out

def build():
    from chips import load_js
    head, A, C = load_js()
    pages = [Image.open(os.path.join(ROOT, p)).convert('RGBA') for p in A]
    npg = [Image.new('RGBA', pg.size, (128, 128, 255, 0)) for pg in pages]
    done = set(); n = 0; ov = 0
    for k, c in C.items():
        g64 = c.get('g') == 64
        fl = [(r, k) for r in c['f']] + [(r, k) for p in (c.get('parts') or []) for r in p['f']]
        op = os.path.join(OVR, k.replace(':', '_').replace('#', '~').replace('>', '^') + '.png')
        oim = Image.open(op).convert('RGBA') if os.path.exists(op) else None
        for r, _ in fl:
            if isinstance(r, str): continue
            pn, x, y, w, h = r
            key = (pn, x, y)
            if key in done: continue
            done.add(key)
            if oim is not None and oim.size == (w, h):
                nm = np.asarray(oim).copy(); ov += 1
            else:
                nm = auto_normal(pages[pn].crop((x, y, x + w, y + h)), g64)
            npg[pn].paste(Image.fromarray(nm, 'RGBA'), (x, y)); n += 1
    os.makedirs(os.path.join(ROOT, 'assets', 'chipn'), exist_ok=True)
    old = set(os.listdir(os.path.join(ROOT, 'assets', 'chipn')))
    names = []
    for pg in npg:
        b = io.BytesIO(); pg.save(b, 'WEBP', lossless=True, exact=True, quality=100, method=2)
        data = b.getvalue(); name = 'assets/chipn/' + hashlib.sha1(data).hexdigest()[:10] + '.webp'
        open(os.path.join(ROOT, name), 'wb').write(data); names.append(name)
    for f in old - {os.path.basename(x) for x in names}: os.remove(os.path.join(ROOT, 'assets', 'chipn', f))
    p = os.path.join(ROOT, 'chips.js'); js = open(p, encoding='utf8').read()
    js = re.sub(r'window\.CHIPN=\[[^\]]*\];\n?', '', js)
    js = js.rstrip('\n') + '\nwindow.CHIPN=' + json.dumps(names) + ';\n'
    open(p, 'w', encoding='utf8').write(js)
    print('normals frames', n, 'from 3D', ov, 'pages', len(names))

if __name__ == '__main__':
    build()
