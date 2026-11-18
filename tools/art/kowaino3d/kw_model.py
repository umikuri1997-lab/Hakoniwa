"""コワイノの3Dモデルを、モデルそのもので直す道具（持ち主が Blender で直すのと同じやり方。写すときの処理で、形や色をごまかさない）。
  python3 tools/art/kowaino3d/kw_model.py <持ち主が直した.glb> <もとの18体の.glb> <出力.glb> [--hands]
読みこむ：持ち主が直した glb（18体のうち、直したコワイノだけが、マテリアルで分かれた べつのモデルになっている）。
  マテリアルの色で、色わけの名前にする（MATLAB）：灰＝布・青＝顔・緑＝かざり（星・すそのかざり）・赤＝ぽんぽんと布の裏（場所で分ける）。
  大きさ・場所は、もとの18体から分けたとき（split18.py）と同じに、そろえる（左右・おくゆきのまん中、足もとを0。もとのモデルのそのコワイノの大きさで）。
直す：--hands で、手を、モデルに足す（マテリアル「手」）。手は持ち主の手のモデル（models/hand.glb）にボーンを入れてポーズをつけた物（kw_hand.py）。手の場所は、もとのモデルの手の場所（HANDS）。
書き出す：マテリアルつきの glb（持ち主が Blender で開いて、見て・直せる）。マテリアルの名前は、色わけの名前。"""
import math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np, trimesh

HERE = os.path.dirname(os.path.abspath(__file__))
MATLAB = [((204, 204, 204), 'cloth'), ((3, 0, 204), 'face'), ((10, 204, 0), 'deco'), ((204, 0, 1), 'red'), ((102, 102, 102), 'cloth')]   # マテリアルの色 → 色わけの名前
LABCOL = {'cloth': (204, 204, 204), 'face': (3, 0, 204), 'deco': (10, 204, 0), 'pom': (204, 0, 1), 'under': (150, 0, 60), 'hand': (230, 200, 60)}   # 書き出すときのマテリアルの色（見分ける用）
# 手：もとのモデル（split18 でそろえた場所）での、手のまん中（高さ1あたり）と大きさ。左右はなす量 APART
HANDS = {'basic': dict(c=[(-0.126, 0.352, 0.328), (-0.006, 0.35, 0.33)],   # 手のひらのまん中 (よこ, 前, 上)
                        apart=0.07, size=0.155, curl=(40, 65, 45), thumb=20, tilt=20, roll=30)}   # size：手首から指先（高さ1あたり）・curl：指の関節をまげる角度・thumb：親指をよせる・tilt：指先を下へ・roll：手のひらを下へ

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

def hands(name, H):
    """手：持ち主の手のモデルにボーンを入れてポーズをつけた物（kw_hand.py）を、胸の前で、手のひらどうしを向かい合わせて置く（親指が上・指先が前）。
    指は手のひら（もう1つの手のほう）へまるめ、指先を少し下へ。向き（内がわ）は、2つの手のまん中をさかいにきめる。点は glTF の向き（x・y上・z前）"""
    import kw_hand
    h = HANDS[name]; cs = [np.array([c[0], c[2], c[1]])*H for c in h['c']]   # (よこ, 前, 上) → glTF（x, y上, z前）
    mid = (cs[0][0]+cs[1][0])/2; hd = kw_hand.Hand(); PV = hd.pose(curl=h['curl'], thumb=h['thumb']); V = []; F = []; o = 0
    for c0 in cs:
        si = 1 if c0[0] < mid else -1; c0 = c0+np.array([-si*h['apart']*H, 0, 0])
        v = kw_hand.place(PV, c0, h['size']*H, si, h['tilt'], h['roll']); f = hd.F if si < 0 else hd.F[:, ::-1]   # 左右をうつした手は、三角形のうら表をかえす
        V.append(v); F.append(f+o); o += len(v)
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

def strip(src, out, labels):
    """glb から、その色わけ（マテリアル）の部品を消す（コカゲの手・そでを消したとき）"""
    sc = trimesh.load(src)
    for n in [n for n, g in sc.geometry.items() if g.visual.material.name in labels]: sc.delete_geometry(n)
    sc.export(out)

if __name__ == '__main__' and sys.argv[1] == '--strip':   # python3 kw_model.py --strip <in.glb> <out.glb> hand sleeve
    strip(sys.argv[2], sys.argv[3], sys.argv[4:]); sys.exit()
if __name__ == '__main__':
    a = [x for x in sys.argv[1:] if not x.startswith('--')]; fixed, sheet, out = a[:3]
    V, F, L, H = load(fixed, sheet)
    if '--hands' in sys.argv:
        hv, hf = hands('basic', H); F = np.vstack([F, hf+len(V)]); V = np.vstack([V, hv]); L = np.concatenate([L, np.array(['hand']*len(hf), object)])
    export(V, F, L, out); print('三角形', len(F), {k: int((L == k).sum()) for k in set(L.tolist())}, '高さ', round(H, 4))
