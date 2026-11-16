"""持ち主のトリポのモデル（コワイノ18体が3行×6列にならんだ1つの glb）を、1体ずつの glb に分ける。
  python3 tools/art/kowaino3d/split18.py <もらった.glb> <出力フォルダ>
モデルは三角形どうしがつながっていない（点が三角形ごとにべつ）ので、形のつながりでは分けられない。
正面から見た形（シルエット）を絵にして4ドット太らせ、かたまりごとに番号をつけて、三角形を、そのまん中のある番号でふり分ける。
小さなかけら（浮いている粒など）は、いちばん近い大きなかたまりに入れる。ならびは、上の行から、左から（プロンプトの順）。"""
import os, sys
import numpy as np, trimesh
from PIL import Image, ImageDraw
from scipy import ndimage

NAMES = ['basic', 'fast', 'thief', 'brute', 'breaker', 'trapper',
         'ash', 'rockc', 'armor', 'shiny', 'hana', 'hoteri',
         'ochiba', 'yuki', 'boss', 'hino', 'yama', 'boss2']   # kowaino_prompts.md の順（3行×6列）
R = 1000; DIL = 4

def main(src, out):
    os.makedirs(out, exist_ok=True)
    g = list(trimesh.load(src).geometry.values())[0]; V = g.vertices; F = g.faces
    x0, y1 = V[:, 0].min()-0.01, V[:, 1].max()+0.01
    X = lambda x: (x-x0)*R; Y = lambda y: (y1-y)*R
    W = int(X(V[:, 0].max())+20); H = int(Y(V[:, 1].min())+20)
    im = Image.new('L', (W, H), 0); d = ImageDraw.Draw(im)
    for f in F: d.polygon([(X(V[i, 0]), Y(V[i, 1])) for i in f], fill=255)
    lab, n = ndimage.label(ndimage.binary_dilation(np.array(im) > 0, iterations=DIL))
    size = ndimage.sum(np.ones_like(lab), lab, range(1, n+1))
    big = list(np.argsort(-size)[:18]+1)
    cm = {l: np.array(ndimage.center_of_mass(lab == l)) for l in range(1, n+1)}
    to = {l: (l if l in big else min(big, key=lambda b: np.linalg.norm(cm[b]-cm[l]))) for l in range(1, n+1)}
    c = V[F].mean(1); px = np.clip(X(c[:, 0]).astype(int), 0, W-1); py = np.clip(Y(c[:, 1]).astype(int), 0, H-1)
    fl = np.array([to.get(l, 0) for l in lab[py, px]])
    for k in np.nonzero(fl == 0)[0]:   # かたまりの外に出た三角形：いちばん近いかたまり
        fl[k] = min(big, key=lambda b: np.linalg.norm(cm[b]-np.array([py[k], px[k]])))
    rows = sorted(big, key=lambda b: cm[b][0]); order = []
    for r in range(3): order += sorted(rows[r*6:(r+1)*6], key=lambda b: cm[b][1])
    for name, b in zip(NAMES, order):
        fs = F[fl == b]; m = trimesh.Trimesh(vertices=V, faces=fs, process=False); m.remove_unreferenced_vertices()
        lo = m.bounds[0]; ctr = (m.bounds[0]+m.bounds[1])/2
        m.apply_translation([-ctr[0], -lo[1], -ctr[2]])   # 左右・おくゆきのまん中、足もとを0に
        m.export(os.path.join(out, 'kg_%s.glb' % name))
        e = m.extents; print(name, len(fs), '幅 %.3f 高さ %.3f おく %.3f' % (e[0], e[1], e[2]))

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
