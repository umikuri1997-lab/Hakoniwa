"""コワイノの3Dモデルを、モデルそのもので直す道具（持ち主が Blender で直すのと同じやり方。写すときの処理で、形や色をごまかさない）。
  python3 tools/art/kowaino3d/kw_model.py <持ち主が直した.glb> <もとの18体の.glb> <出力.glb> [--hands]
読みこむ：持ち主が直した glb（18体のうち、直したコワイノだけが、マテリアルで分かれた べつのモデルになっている）。
  マテリアルの色で、色わけの名前にする（MATLAB）：灰＝布・青＝顔・緑＝かざり（星・すそのかざり）・赤＝ぽんぽんと布の裏（場所で分ける）。
  大きさ・場所は、もとの18体から分けたとき（split18.py）と同じに、そろえる（左右・おくゆきのまん中、足もとを0。もとのモデルのそのコワイノの大きさで）。
直す：--hands で、手（手のひら・4本の指・親指）を、モデルに足す（マテリアル「手」）。手の場所は、もとのモデルの手の場所（HANDS）。
書き出す：マテリアルつきの glb（持ち主が Blender で開いて、見て・直せる）。マテリアルの名前は、色わけの名前。"""
import math, os, sys
import numpy as np, trimesh

HERE = os.path.dirname(os.path.abspath(__file__))
MATLAB = [((204, 204, 204), 'cloth'), ((3, 0, 204), 'face'), ((10, 204, 0), 'deco'), ((204, 0, 1), 'red'), ((102, 102, 102), 'cloth')]   # マテリアルの色 → 色わけの名前
LABCOL = {'cloth': (204, 204, 204), 'face': (3, 0, 204), 'deco': (10, 204, 0), 'pom': (204, 0, 1), 'under': (150, 0, 60), 'hand': (230, 200, 60)}   # 書き出すときのマテリアルの色（見分ける用）
# 手：もとのモデル（split18 でそろえた場所）での、手のまん中（高さ1あたり）と大きさ。左右はなす量 APART
HANDS = {'basic': dict(c=[(-0.126, 0.352, 0.358), (-0.006, 0.35, 0.36)],   # (よこ, 前, 上)
                        r=0.075, apart=0.07, palmw=0.45)}

def lab_of(col):
    col = np.array(col[:3], float)
    return min(MATLAB, key=lambda m: np.linalg.norm(np.array(m[0])-col))[1]

def frame(src_sheet, bounds):
    """もとの18体のモデルから、bounds の所にあるコワイノの、そろえる場所（まん中 ctr）と高さ H（split18.py と同じ）"""
    g = list(trimesh.load(src_sheet).geometry.values())[0]; lo, hi = bounds[0]-0.01, bounds[1]+0.01
    c = g.vertices[g.faces].mean(1); ok = np.all((c > lo) & (c < hi), 1); V = g.vertices[np.unique(g.faces[ok])]
    b0, b1 = V.min(0), V.max(0); ctr = np.array([(b0[0]+b1[0])/2, b0[1], (b0[2]+b1[2])/2]); return ctr, b1[1]-b0[1]

def load(fixed, src_sheet):
    """直した glb → (点 V（glTF の向き：x・y上・z前）, 三角形 F, 色わけ L, 高さ H)。もとのコワイノと同じ場所・大きさにそろえる"""
    s = trimesh.load(fixed); parts = []
    for n, g in s.geometry.items():
        if not hasattr(g.visual, 'material'): continue   # マテリアルのない物（直していない17体）は、のぞく
        T = s.graph[[k for k in s.graph.nodes_geometry if s.graph[k][1] == n][0]][0]; g2 = g.copy(); g2.apply_transform(T)
        parts.append((g2, lab_of(g.visual.material.baseColorFactor)))
    allv = np.vstack([g.vertices for g, _ in parts]); ctr, H = frame(src_sheet, (allv.min(0), allv.max(0)))
    V = []; F = []; L = []; o = 0
    for g, lb in parts:
        V.append(g.vertices-ctr); F.append(g.faces+o); L += [lb]*len(g.faces); o += len(g.vertices)
    V = np.vstack(V); F = np.vstack(F); L = np.array(L, object)
    c = V[F].mean(1)   # 赤：上のほう（ぽんぽん）と、下のほう（布の裏）
    for k in np.nonzero(L == 'red')[0]: L[k] = 'pom' if c[k, 1] > 0.3*H else 'under'
    return V, F, L, H

def ellip(c, r, n=16, m=10):
    V = []; F = []
    for j in range(m+1):
        t = math.pi*j/m
        for i in range(n): a = 2*math.pi*i/n; V.append([c[0]+r[0]*math.sin(t)*math.cos(a), c[1]+r[1]*math.cos(t), c[2]+r[2]*math.sin(t)*math.sin(a)])
    for j in range(m):
        for i in range(n):
            a, b, cc, d = j*n+i, j*n+(i+1) % n, (j+1)*n+(i+1) % n, (j+1)*n+i; F += [[a, b, cc], [a, cc, d]]
    return np.array(V), np.array(F)

def tube(pts, rs, n=8):
    pts = [np.array(q, float) for q in pts]; V = []; F = []
    for k in range(len(pts)):
        d = pts[min(k+1, len(pts)-1)]-pts[max(k-1, 0)]; d /= np.linalg.norm(d)
        u = np.cross(d, [0, 0, 1.0])
        if np.linalg.norm(u) < 1e-6: u = np.array([1.0, 0, 0])
        u /= np.linalg.norm(u); v = np.cross(d, u)
        for i in range(n): t = 2*math.pi*i/n; V.append(pts[k]+rs[k]*(math.cos(t)*u+math.sin(t)*v))
    for k in range(len(pts)-1):
        for i in range(n):
            a, b, c, d = k*n+i, k*n+(i+1) % n, (k+1)*n+(i+1) % n, (k+1)*n+i; F += [[a, b, c], [a, c, d]]
    V.append(pts[-1]); e = len(V)-1; V.append(pts[0]); s_ = len(V)-1
    for i in range(n): F += [[(len(pts)-1)*n+i, (len(pts)-1)*n+(i+1) % n, e], [(i+1) % n, i, s_]]   # 先と根もとをとじる
    return np.array(V), np.array(F)

def hands(name, H):
    """手：胸の前で、手のひらどうしを向かい合わせる（親指が上）。手のひら（うすい だ円の玉）の前のはしから、4本の指が前へのびて、先がもう1つの手のほうへまるまる。
    4本はたてにならぶ。親指は、手の上から前へ。向き（内がわ）は、2つの手のまん中をさかいにきめる。点は glTF の向き（x・y上・z前）"""
    h = HANDS[name]; cs = [np.array([c[0], c[2], c[1]])*H for c in h['c']];   # (よこ, 前, 上) → glTF（x, y上, z前）
    r = h['r']*H; mid = (cs[0][0]+cs[1][0])/2; out = []
    for c0 in cs:
        si = 1 if c0[0] < mid else -1; c0 = c0+np.array([-si*h['apart']*H, 0, 0])
        P = lambda x, y, z: c0+np.array([x, z, y])   # (よこ, 前, 上) → glTF（x, y上, z前）
        out.append(ellip(c0, (r*h['palmw'], r*0.95, r*0.9)))   # 手のひら（左右がうすい）
        for fz in (0.4, 0.13, -0.13, -0.4):
            L = 1-0.15*abs(fz+0.05)/0.45
            out.append(tube([P(si*0.12*r, 0.7*r, fz*r), P(si*0.22*r, 1.1*r*L, fz*r), P(si*0.7*r, 1.25*r*L, fz*r*0.95), P(si*0.95*r, 1.05*r*L, fz*r*0.9)],
                            [0.2*r, 0.19*r, 0.18*r, 0.16*r]))
        out.append(tube([P(si*0.1*r, 0.5*r, 0.75*r), P(si*0.25*r, 0.9*r, 0.85*r), P(si*0.4*r, 1.15*r, 0.75*r)], [0.22*r, 0.2*r, 0.18*r]))
    V = []; F = []; o = 0
    for v, f in out: V.append(v); F.append(f+o); o += len(v)
    return np.vstack(V), np.vstack(F)

def export(V, F, L, path):
    """色わけごとに、べつのマテリアルにした glb（Blender で開いて見られる）"""
    sc = trimesh.Scene()
    for lb in sorted(set(L.tolist())):
        fs = F[L == lb]; vs, inv = np.unique(fs, return_inverse=True)
        m = trimesh.Trimesh(vertices=V[vs], faces=inv.reshape(-1, 3), process=False)
        m.visual = trimesh.visual.TextureVisuals(material=trimesh.visual.material.PBRMaterial(name=lb, baseColorFactor=list(LABCOL.get(lb, (128, 128, 128)))+[255]))
        sc.add_geometry(m, node_name=lb, geom_name=lb)
    sc.export(path)

if __name__ == '__main__':
    a = [x for x in sys.argv[1:] if not x.startswith('--')]; fixed, sheet, out = a[:3]
    V, F, L, H = load(fixed, sheet)
    if '--hands' in sys.argv:
        hv, hf = hands('basic', H); F = np.vstack([F, hf+len(V)]); V = np.vstack([V, hv]); L = np.concatenate([L, np.array(['hand']*len(hf), object)])
    export(V, F, L, out); print('三角形', len(F), {k: int((L == k).sum()) for k in set(L.tolist())}, '高さ', round(H, 4))
