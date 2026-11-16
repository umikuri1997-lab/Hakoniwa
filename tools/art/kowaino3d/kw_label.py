"""コワイノの3D（split18.py で分けた kg_<名前>.glb）に、色わけのマテリアルを、形から自動でつける（持ち主が Blender で見て直す、下ごしらえ）。
  python3 tools/art/kowaino3d/kw_label.py <分けたフォルダ> <出力フォルダ> [名前...]
マテリアルは、持ち主がコカゲを直したときと同じ4つの色（kw_model.py の MATLAB で読める）：
  灰（204,204,204）＝布・青（3,0,204）＝顔・緑（10,204,0）＝かざり・赤（204,0,1）＝ぽんぽん（上のほう）と布の裏（下のほう）。
見分け方：
  顔：正面から見た奥行きの絵で、フードのふちとの段（奥行きがとぶ所）でかこまれた、まん中のかたまり（FACE0・FACE）。
  布の裏：下を向いた面（法線の上の成分が UNDERN より下）で、高さが UNDERH より下。
  かざり：いちばん大きなかたまり（体）からはなれた部品ぜんぶ。
  ぽんぽん：体とくっついた物は、フードのしっぽの先から首までのきょりの中（POM）。はなれた部品の物は、その場所にいちばん近い部品（POMPART）。
見分けられない所（体とくっついた手・ベルト・つらら など）は布のまま。持ち主が Blender で直す。
出す物：<出力フォルダ>/kg_<名前>.glb（マテリアルつき）"""
import math, os, sys
import numpy as np, trimesh
from scipy import ndimage
from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import connected_components
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from weld import weld

COL = {'cloth': (204, 204, 204), 'face': (3, 0, 204), 'deco': (10, 204, 0), 'red': (204, 0, 1)}
FACE0 = dict(t=0.006, lo=0.33, hi=0.85, y=0.55)   # 顔：段とみなす奥行きのとび（高さのうち）・さがす高さ・さがしはじめる高さ
FACE = {'fast': dict(t=0.004), 'trapper': dict(lo=0.45), 'hana': dict(lo=0.45)}   # コワイノごとに、かえる所
UNDERN, UNDERH = -0.45, 0.3
NG = 220              # 奥行きの絵のこまかさ
POM = {'thief': dict(r=0.16), 'breaker': dict(r=0.14), 'hana': dict(r=0.13), 'yuki': dict(r=0.18, lo=0.05), 'shiny': dict(r=0.12, at=(0.44, 0.61, -0.13))}   # 体とくっついたぽんぽん：しっぽの先から首までのきょり（高さのうち）。at：しっぽの先の場所（ないときは、頭のまん中からいちばん遠い、うしろの点）
POMPART = {'trapper': (0, 0.92, -0.35), 'hoteri': (0.08, 0.64, -0.35)}   # はなれた部品のぽんぽん：場所（高さのうち。x・y上・z前）

def parts_id(m):
    F = m.faces; nv = len(m.vertices)
    A = coo_matrix((np.ones(len(F)*3), (np.r_[F[:, 0], F[:, 1], F[:, 2]], np.r_[F[:, 1], F[:, 2], F[:, 0]])), shape=(nv, nv))
    _, lv = connected_components(A, directed=False); return lv[F[:, 0]]

def parts(m):
    lf = parts_id(m); return lf == np.bincount(lf).argmax()

def zbuf(V, F, H):
    """正面（+z）から見た奥行きの絵：いちばん手前の z と、その面の番号"""
    x0, x1 = V[:, 0].min(), V[:, 0].max(); s = NG/H; W = int((x1-x0)*s)+2; Hh = int(H*s)+2
    Z = np.full((Hh, W), -np.inf); I = np.full((Hh, W), -1)
    P = np.stack([(V[:, 0]-x0)*s, (H-V[:, 1])*s, V[:, 2]], 1)
    for k, f in enumerate(F):
        a, b, c = P[f]; lo = np.floor(np.minimum(np.minimum(a, b), c)[:2]).astype(int); hi = np.ceil(np.maximum(np.maximum(a, b), c)[:2]).astype(int)
        xs, ys = np.meshgrid(np.arange(max(lo[0], 0), min(hi[0]+1, W)), np.arange(max(lo[1], 0), min(hi[1]+1, Hh)))
        px = xs+0.5; py = ys+0.5; d = (b[0]-a[0])*(c[1]-a[1])-(c[0]-a[0])*(b[1]-a[1])
        if abs(d) < 1e-12: continue
        u = ((b[0]-px)*(c[1]-py)-(c[0]-px)*(b[1]-py))/d; v = ((c[0]-px)*(a[1]-py)-(a[0]-px)*(c[1]-py))/d; w = 1-u-v
        ok = (u >= -1e-6) & (v >= -1e-6) & (w >= -1e-6)
        if not ok.any(): continue
        z = u*a[2]+v*b[2]+w*c[2]; yy, xx = ys[ok], xs[ok]; z = z[ok]; better = z > Z[yy, xx]
        Z[yy[better], xx[better]] = z[better]; I[yy[better], xx[better]] = k
    return Z, I, s

def label(path, name):
    m = weld(list(trimesh.load(path).geometry.values())[0], 1e-4); V = m.vertices; F = m.faces; H = V[:, 1].max()
    body = parts(m); L = np.array(['cloth']*len(F), object); L[~body] = 'deco'
    n = m.face_normals; c = V[F].mean(1)
    # 顔：フードのふちとの段（奥行きがとぶ所）でかこまれた、まん中のかたまり
    fc = dict(FACE0, **FACE.get(name, {}))
    Fb = np.nonzero(body)[0]; Z, I, s = zbuf(V, F[Fb], H); ok = np.isfinite(Z); Zf = np.where(ok, Z, -1e9); T = fc['t']*H
    dx = np.abs(np.diff(Zf, axis=1)) > T; dy = np.abs(np.diff(Zf, axis=0)) > T; ex = np.zeros_like(ok)
    ex[:, 1:] |= dx; ex[:, :-1] |= dx; ex[1:] |= dy; ex[:-1] |= dy
    ex = ndimage.binary_dilation(ex, iterations=3)
    hg = (H-(np.arange(Z.shape[0])+0.5)/s)/H; band = ((hg > fc['lo']) & (hg < fc['hi']))[:, None]
    sq = np.ones((3, 3)); free = ndimage.binary_opening(ok & ~ex & band, structure=sq, iterations=4); lab, k = ndimage.label(free)
    cx = int((0-V[:, 0].min())*s); cy = int((1-fc['y'])*H*s); q = lab[cy, cx]
    if not q and k: yy, xx = np.nonzero(lab); j = np.argmin((yy-cy)**2+(xx-cx)**2); q = lab[yy[j], xx[j]]
    if q:
        rec = ndimage.binary_dilation(lab == q, structure=sq, iterations=4) & ok
        cnt = np.bincount(I[rec], minlength=len(Fb)); tot = np.bincount(I[ok], minlength=len(Fb))
        L[Fb[(cnt >= 0.5*np.maximum(tot, 1)) & (tot > 0)]] = 'face'
    # 布の裏
    L[body & (n[:, 1] < UNDERN) & (c[:, 1] < UNDERH*H) & (L == 'cloth')] = 'red'
    # ぽんぽん：しっぽの先（頭のまん中から、いちばん遠い、うしろの点）から、首までのきょりの中
    if name in POM:
        pc = POM[name]; vb = np.unique(F[body]); P = V[vb]
        far = np.linalg.norm(P-np.array([0, 0.6*H, 0]), axis=1)*(P[:, 1] > pc.get('lo', 0.3)*H)*(P[:, 2] < 0)
        tip = P[np.argmax(far)] if 'at' not in pc else P[np.argmin(np.linalg.norm(P-np.array(pc['at'])*H, axis=1))]
        L[body & (np.linalg.norm(c-tip, axis=1) < pc['r']*H)] = 'red'
    for nm2, q in POMPART.items():   # はなれた部品のぽんぽん：その場所にいちばん近い部品
        if nm2 != name: continue
        dec = np.nonzero(~body)[0]; lf = parts_id(m); j = dec[np.argmin(np.linalg.norm(c[dec]-np.array(q)*H, axis=1))]
        L[lf == lf[j]] = 'red'
    return m, L

def export(m, L, path):
    sc = trimesh.Scene()
    for lb in ('cloth', 'face', 'deco', 'red'):
        fs = m.faces[L == lb]
        if not len(fs): continue
        vs, inv = np.unique(fs, return_inverse=True)
        g = trimesh.Trimesh(vertices=m.vertices[vs], faces=inv.reshape(-1, 3), process=False)
        g.visual = trimesh.visual.TextureVisuals(material=trimesh.visual.material.PBRMaterial(name=lb, baseColorFactor=list(COL[lb])+[255]))
        sc.add_geometry(g, node_name=lb, geom_name=lb)
    sc.export(path)

if __name__ == '__main__':
    src, out = sys.argv[1:3]; names = sys.argv[3:]; os.makedirs(out, exist_ok=True)
    for nm in names:
        m, L = label(os.path.join(src, f'kg_{nm}.glb'), nm); export(m, L, os.path.join(out, f'kg_{nm}.glb'))
        print(nm, {k: int((L == k).sum()) for k in ('cloth', 'face', 'deco', 'red')})
