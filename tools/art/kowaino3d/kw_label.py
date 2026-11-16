"""コワイノの3D（split18.py で分けた kg_<名前>.glb）に、色わけのマテリアルを、形から自動でつける（持ち主が Blender で見て直す、下ごしらえ）。
  python3 tools/art/kowaino3d/kw_label.py <分けたフォルダ> <出力フォルダ> [名前...]
マテリアルは、持ち主がコカゲを直したときと同じ4つの色（kw_model.py の MATLAB で読める）：
  灰（204,204,204）＝布・青（3,0,204）＝顔・緑（10,204,0）＝かざり・赤（204,0,1）＝ぽんぽん（上のほう）と布の裏（下のほう）。
見分け方：
  顔：正面から見た奥行きの絵で、フードのふちとの段（奥行きがとぶ所）でかこまれた、まん中のかたまり（FACE0・FACE）。
  顔の穴の中：正面から見て穴にうつる所は、奥のかべまで顔（HOLED）。
  足：すその下の、まん中に近い所（FOOT）。顔と同じこい色。
  布の裏：すその下（UNDERH より下）の、まわり（16の向き・少し上から）から見えない、下・内がわを向いた面。
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
UNDERH = 0.29          # 布の裏をさがす高さ（高さのうち）
HOLED = 0.03           # 顔の穴の中：いちばん奥の顔より、これだけ奥まで
FOOT, FOOTH = 0.5, 0.18 # 足：すその広さ（95%の半径）のこの わりより内がわで、この高さより下
FOOTT = 0.03           # 足の先：この高さより下
LEGR = (0.03, 0.55)    # 足の太さ：足の先からの横のきょり（高さのうち）＝ 先 ＋ 高さ×わり
UEL = 0.2              # 布の裏：まわりから見る角度（上から、ラジアン）
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
        seed = Fb[(cnt >= 0.5*np.maximum(tot, 1)) & (tot > 0)]; L[seed] = 'face'
        # 顔の穴の中（正面から見て穴の中にうつる所）は、奥のかべまで顔にする（持ち主の直し）
        x0 = V[:, 0].min(); px = ((c[:, 0]-x0)*s).astype(int); py = ((H-c[:, 1])*s).astype(int)
        inr = (px >= 0) & (px < rec.shape[1]) & (py >= 0) & (py < rec.shape[0])
        hole = ndimage.binary_erosion(rec, structure=sq, iterations=2); inh = np.zeros(len(F), bool); inh[inr] = hole[py[inr], px[inr]]
        if len(seed): L[body & inh & (c[:, 2] >= c[seed, 2].min()-HOLED*H)] = 'face'
    # 布の裏：すその下（UNDERH より下）で、まわり（16の向き・少し上 UEL から）から見えない、下・内がわを向いた面
    def around(el):
        v = np.zeros(len(F), bool)
        for k8 in range(16):
            a = 2*math.pi*k8/16; ca, sa = math.cos(a), math.sin(a); R = np.stack([V[:, 0]*ca-V[:, 2]*sa, V[:, 1], V[:, 0]*sa+V[:, 2]*ca], 1)
            R2 = np.stack([R[:, 0], R[:, 1]*math.cos(el)-R[:, 2]*math.sin(el)+H*0.3, R[:, 1]*math.sin(el)+R[:, 2]*math.cos(el)], 1)
            _, Iv, _ = zbuf(R2, F, H*1.6); v |= np.bincount(Iv[Iv >= 0], minlength=len(F)) >= 2
        return v
    vis = around(UEL)
    under = body & ~vis & (n[:, 1] < 0.35) & (c[:, 1] < UNDERH*H) & (L == 'cloth')
    # 足：足の先（すその広さの FOOT の わりより内がわの、いちばん下の面）から上へ、足の太さ（LEGR）の中で、FOOTH より下。顔と同じこい色
    rr = np.linalg.norm(c[:, [0, 2]], axis=1); low = body & (c[:, 1] > 0.05*H) & (c[:, 1] < 0.25*H)
    rs = np.percentile(rr[low], 95) if low.any() else H
    feet = np.zeros(len(F), bool); tipf = body & (rr < FOOT*rs) & (c[:, 1] < FOOTT*H)
    if tipf.any():   # 足の先（いちばん下の面）を、つながりでまとめ、それぞれの先から上へ、足の太さ（LEGR）の中
        lf = np.full(len(F), -1); idx = np.nonzero(tipf)[0]; vt = {}
        for k in idx:
            for v in F[k]: vt.setdefault(v, []).append(k)
        par = {k: k for k in idx}
        def fd(k):
            while par[k] != k: par[k] = par[par[k]]; k = par[k]
            return k
        for ks in vt.values():
            for k in ks[1:]: par[fd(k)] = fd(ks[0])
        for g in set(fd(k) for k in idx):
            ks = [k for k in idx if fd(k) == g]; tc = c[ks][:, [0, 2]].mean(0)
            d = np.linalg.norm(c[:, [0, 2]]-tc, axis=1); feet |= body & (c[:, 1] < FOOTH*H) & (d < LEGR[0]*H+LEGR[1]*c[:, 1])
    feet &= (L == 'cloth')
    L[under & ~feet] = 'red'; L[feet] = 'face'
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
