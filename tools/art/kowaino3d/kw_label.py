"""コワイノの3D（split18.py で分けた kg_<名前>.glb）に、色わけのマテリアルを、形から自動でつける（持ち主が Blender で見て直す、下ごしらえ）。
  python3 tools/art/kowaino3d/kw_label.py <分けたフォルダ> <出力フォルダ> [名前...]
マテリアルは、持ち主がコカゲを直したときと同じ4つの色（kw_model.py の MATLAB で読める）：
  灰（204,204,204）＝布・青（3,0,204）＝顔・緑（10,204,0）＝かざり・赤（204,0,1）＝ぽんぽん（上のほう）と布の裏（下のほう）。
見分け方：まず、となりの面との角度が REGANG 度より小さい面をつなげて、まとまりにわける（モデルの角で区切る）。色は、まとまりごとにきめる。
  顔：正面から見て、顔のまん中（FACEAT・FACE）にうつるまとまり。
  外がわの面：まよこから見えて、外を向いたまとまり。
  裏地：すその下（UNDERH より下）の、外がわの面でない所ぜんぶ（すその内がわ・下のふた・ふちのあつみ）。
        顔のまわりは、顔からとなりへたどった、内がわを向いた（光が体にあたる）まとまり（フードの裏）。
  足：足の先（地面にとどく、まん中に近い面）から、となりとの角度が FOOTAS 度より小さい面だけをたどった所（足とすそのさかいの角で止まる。広がりすぎたら角度を小さくする）。顔と同じこい色。
  かざり：いちばん大きなかたまり（体）からはなれた部品ぜんぶ。
  ぽんぽん：体とくっついた物は、フードのしっぽの先から首までのきょりの中（POM）。はなれた部品の物は、その場所にいちばん近い部品（POMPART）。
見分けられない所（体とくっついた手・ベルト・つらら など）は布のまま。持ち主が Blender で直す。
出す物：<出力フォルダ>/kg_<名前>.glb（マテリアルつき）"""
import math, os, sys
import numpy as np, trimesh
from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import connected_components
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from weld import weld

COL = {'cloth': (204, 204, 204), 'face': (3, 0, 204), 'deco': (10, 204, 0), 'red': (204, 0, 1)}
REGANG = 45            # まとまりを区切る角度（度）
REGA = {'fast': 30, 'brute': 30, 'hoteri': 30, 'trapper': 30, 'hana': 34, 'ash': 25, 'shiny': 30}   # コワイノごとの区切る角度（顔や足が、まわりとつながってしまうとき）
FACEAT = (0.0, 0.55)   # 顔のまん中（高さのうち。よこ・上）
FACE = {}              # コワイノごとの顔のまん中（ちがうときだけ）
UNDERH = 0.3           # 布の裏・足：すその下（まとまりのまん中の高さが、これより下）
CAPNY, CAPR = -0.6, 0.7   # 布の裏：すその下のふた（下を向いて、すその広さのこのわりより内がわ）
OUTNR = 0.2            # 外がわの面：外を向いた（面積でならした法線の、外向きの成分がこれより上）
HOODSTEP = 2           # フードの裏：顔から、いくつとなりのまとまりまで
INK, INR, INDIST = 5, 3, 0.5   # 裏地：とばす光の本数・あたる本数・とどくきょり（高さのうち）
# UNR           # 布の裏：内がわ（まん中の軸のほう）を向いたまとまり（面積でならした法線の、外向きの成分がこれより下）
FOOT, FOOTY, FOOTH = 0.5, 0.015, 0.2   # 足の先：すその広さ（95%の半径）のこのわりより内がわで、この高さより下。足はこの高さまで
TIPD = 0.04            # 足の先：この近さの点を、1本の足の先にまとめる
TIPW = 0.08            # 足の先のはばが、これより広いときは足にしない
FOOTAS = (60, 50, 40, 35, 30, 25, 20)
LEGRR = 0.55           # 足：すその広さ（95%の半径）のこのわりより内がわだけ
# FOOTAS  # 足：たどる角度（度）。足が LEGW より広がったら、つぎの小さい角度で
LEGW = 0.55            # 足1本の横の広さが、すその広さ（95%の半径）のこのわりより広いときは、すそへもれている
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
    # まとまり：となりの面との角度が REGANG 度より小さい面をつなげる（モデルの角で区切る。Blender の「角度で区切る」と同じ）
    adj = m.face_adjacency; keep = m.face_adjacency_angles < math.radians(REGA.get(name, REGANG))
    _, reg = connected_components(coo_matrix((np.ones(keep.sum()), (adj[keep, 0], adj[keep, 1])), shape=(len(F),)*2), directed=False)
    ar = m.area_faces; nreg = reg.max()+1; rarea = np.maximum(np.bincount(reg, weights=ar, minlength=nreg), 1e-12)
    avg = lambda x: np.bincount(reg, weights=ar*x, minlength=nreg)/rarea
    rr = np.linalg.norm(c[:, [0, 2]], axis=1); nr = (n[:, [0, 2]]*(c[:, [0, 2]]/np.maximum(rr[:, None], 1e-9))).sum(1)
    rny, rcy, rnr, rrr = avg(n[:, 1]), avg(c[:, 1]), avg(nr), avg(rr)
    rmin = np.full(nreg, np.inf); np.minimum.at(rmin, reg, V[F, 1].min(1))
    # 顔：正面から見て、顔のまん中（FACEAT・FACE）にうつるまとまり
    Fb = np.nonzero(body)[0]; Z, I, s = zbuf(V, F[Fb], H); fa = FACE.get(name, FACEAT)
    cx = int((fa[0]*H-V[:, 0].min())*s); cy = int((1-fa[1])*H*s); hit = I[cy-1:cy+2, cx-1:cx+2].ravel(); hit = hit[hit >= 0]
    if len(hit): L[np.isin(reg, np.unique(reg[Fb[hit]]))] = 'face'
    # 布の裏：すその下の、内がわ（まん中の軸のほう）を向いたまとまり（UNR）。すそのふちの下を向いた面は、外を向くので布のまま
    low = body & (c[:, 1] > 0.05*H) & (c[:, 1] < 0.25*H); rs = np.percentile(rr[low], 95) if low.any() else H
    # 内がわを向いた面：面の向き（と少しずらした向き、INK 本）に光をとばして、INR 本以上が INDIST の中で体にあたる面（rtree がいる）
    rng = np.random.default_rng(0); hits = np.zeros(len(F))
    for k in range(INK):
        d = n+(rng.normal(size=n.shape)*0.25 if k else 0); d /= np.linalg.norm(d, axis=1)[:, None]
        loc, ri, _ = m.ray.intersects_location(c+d*1e-4*H, d, multiple_hits=False)
        dist = np.full(len(F), np.inf); dist[ri] = np.linalg.norm(loc-c[ri], axis=1); hits += dist < INDIST*H
    rin = avg((hits >= INR).astype(float)) > 0.5   # まとまりの半分より多くが内がわを向く
    # 外がわの面：まよこ（16の向き）から見えて、外を向いた（OUTNR）まとまり
    vis = np.zeros(len(F), bool)
    for k8 in range(16):
        a8 = 2*math.pi*k8/16; ca, sa = math.cos(a8), math.sin(a8); R = np.stack([V[:, 0]*ca-V[:, 2]*sa, V[:, 1], V[:, 0]*sa+V[:, 2]*ca], 1)
        _, Iv, _ = zbuf(R, F, H); vis |= np.bincount(Iv[Iv >= 0], minlength=len(F)) >= 2
    outer = (avg(vis.astype(float)) > 0.5) & (rnr > OUTNR)
    # 裏地：
    #   すその下（UNDERH より下）は、外がわの面でない所ぜんぶ（すその内がわ・下のふた・ふちのあつみ）
    #   顔のまわりは、顔のまとまりにとなる、内がわを向いた（光が体にあたる）まとまりと、そのとなりの内がわを向いたまとまり（フードの裏）
    hood = np.zeros(nreg, bool); isf = L == 'face'
    for _ in range(HOODSTEP):
        tg = isf | hood[reg]; fa2 = tg[adj[:, 0]]; fb2 = tg[adj[:, 1]]; nx = np.zeros(nreg, bool)
        nx[reg[adj[fa2 & ~fb2, 1]]] = True; nx[reg[adj[fb2 & ~fa2, 0]]] = True; hood |= nx & rin & ~outer
    under = body & (L == 'cloth') & (((rcy[reg] < UNDERH*H) & ~outer[reg]) | hood[reg])
    # 足：足の先（まん中に近い FOOT、地面にとどく FOOTY の面。はばが TIPW より広い物はのぞく）から、
    #   となりの面との角度が FOOTAS 度より小さい所だけをたどる（足と すそのさかいの角で止まる）。高さ FOOTH まで
    tip = body & (rr < FOOT*rs) & (c[:, 1] < FOOTY*H); feet = np.zeros(len(F), bool)
    if tip.any():
        ok2 = body & (c[:, 1] < FOOTH*H) & (rr < LEGRR*rs) & (~(under & (n[:, 1] < CAPNY)) | (V[F, 1].min(1) < 2*FOOTY*H))   # すその外がわ・すその下のふた（下を向いた布の裏）には、もれない（足の先はのぞく）
        # 足の先：いちばん下の点（FOOTY より下）を、近さ（TIPD）でまとめる。1つのまとまりが1本の足
        tv = np.nonzero((V[:, 1] < FOOTY*H) & (np.linalg.norm(V[:, [0, 2]], axis=1) < FOOT*rs))[0]
        from scipy.spatial import cKDTree
        pr = cKDTree(V[tv][:, [0, 2]]).query_pairs(TIPD*H, output_type='ndarray') if len(tv) else np.zeros((0, 2), int)
        _, tg = connected_components(coo_matrix((np.ones(len(pr)), (pr[:, 0], pr[:, 1])), shape=(len(tv),)*2), directed=False) if len(tv) else (0, np.zeros(0, int))
        fls = {}
        for g in np.unique(tg):
            vs = tv[tg == g]; tp = body & np.isin(F, vs).any(1)
            if np.ptp(V[vs][:, [0, 2]], axis=0).max() > TIPW*H: continue   # 足の先にしては広い（ふくろのそこ など）
            for fa in FOOTAS:   # 足がすそへもれて広がったら、角度を小さくしてやりなおす
                if fa not in fls:
                    e2 = adj[(m.face_adjacency_angles < math.radians(fa)) & ok2[adj[:, 0]] & ok2[adj[:, 1]]]
                    fls[fa] = connected_components(coo_matrix((np.ones(len(e2)), (e2[:, 0], e2[:, 1])), shape=(len(F),)*2), directed=False)[1]
                got = ok2 & np.isin(fls[fa], np.unique(fls[fa][tp & ok2]))
                if not got.any(): break
                if np.ptp(c[got][:, [0, 2]], axis=0).max() < LEGW*rs: feet |= got; break
    feet &= (L == 'cloth'); under &= ~feet
    L[under] = 'red'; L[feet] = 'face'
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
