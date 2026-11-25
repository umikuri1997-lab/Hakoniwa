"""持ち主のカミサマのモデル（tools/art/models/god/saint_monk.glb、トリポ。色のない形だけ）に、部品ごとに色をぬって、
tools/art/models/god/god_monk.glb（部品＝色ごとのノード・材質の色）を書く。形はかえない。

  python3 tools/art/god3d/monk_paint.py [--view <フォルダ>]   # --view：色をぬったモデルを、正面・よこ・うしろから写す（光は前・よこ・うしろから）

部品（点の番号でつながる所。近い点はまとめてからしらべる）と色：
  服（いちばん大きい部品）：アイボリー。そのうち、すその金色の帯2本（三面図の z 0.12〜0.20・0.34〜0.42 を、モデルの高さにちぢめた所）と、
    そで口の金色のふち（手の部品から GOLDCUFF より近い服の面）は金色。
  ひげ・まゆ：白。頭・手・耳：はだ。目：こげ茶。つえ：木。輪：うすい金。
"""
import os, sys
import numpy as np
import trimesh
from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import connected_components

HERE = os.path.dirname(os.path.abspath(__file__)); MODELS = os.path.join(os.path.dirname(HERE), 'models')
SRC = os.path.join(MODELS, 'god', 'saint_monk.glb'); OUT = os.path.join(MODELS, 'god', 'god_monk.glb')
COL = {'robe': (244, 237, 225), 'gold': (238, 206, 140), 'skin': (251, 211, 163), 'white': (252, 246, 236),   # 前のカミサマの絵の色（持ち主：この色ぐらいの濃さ）
       'eye': (130, 90, 66), 'wood': (176, 124, 84), 'halo': (250, 222, 150)}
REFH = 5.92            # 三面図の、足もと〜輪のてっぺん（三面図の100ドット＝1）
HEM = ((0.12, 0.20), (0.34, 0.42))   # 三面図の、すその金色の帯（足もとからの高さ）
GOLDCUFF = 0.022       # そで口のふち：手からこの近さの服の面（モデルの高さ1）

def parts():
    m = trimesh.load(SRC, force='scene').to_geometry(); V = np.asarray(m.vertices); F = np.asarray(m.faces)
    q = np.round(V*2000).astype(np.int64); u, inv = np.unique(q, axis=0, return_inverse=True); inv = inv.ravel(); Fm = inv[F]
    e = np.concatenate([Fm[:, [0, 1]], Fm[:, [1, 2]], Fm[:, [2, 0]]])
    _, lab = connected_components(coo_matrix((np.ones(len(e)), (e[:, 0], e[:, 1])), shape=(len(u), len(u))), directed=False)
    return V, F, lab[Fm[:, 0]]

def classify(V, F, fl):
    """部品ごとの名前（場所と大きさでえらぶ。glTF の向き：y 上・z 前）"""
    H = V[:, 1].max()-V[:, 1].min(); cen = V[F].mean(1); name = np.full(len(F), '', object)
    info = []
    for c in np.unique(fl):
        m = fl == c; P = V[np.unique(F[m])]; info.append((m.sum(), c, P.min(0), P.max(0)))
    info.sort(key=lambda t: -t[0])
    robe = info[0][1]; name[fl == robe] = 'robe'
    for n, c, lo, hi in info[1:]:
        cy = (lo[1]+hi[1])/2/H; cx = (lo[0]+hi[0])/2; w = hi[0]-lo[0]
        if cy > 0.9: k = 'halo'
        elif hi[1]-lo[1] > 0.45*H: k = 'wood'                        # つえ（足もとから胸まで）
        elif cy < 0.45: k = 'skin'                                    # 手
        elif w > 0.3*H and cy < 0.62: k = 'white'                     # ひげ（顔の下の大きな部品）
        elif w > 0.3*H: k = 'skin'                                    # 頭
        elif abs(cx) > 0.12*H: k = 'skin'                             # 耳
        elif cy > 0.715: k = 'white'                                  # まゆ
        else: k = 'eye'                                               # 目
        name[fl == c] = k; info_k = k
    # すその金色の帯
    y0 = V[:, 1].min(); r = name == 'robe'
    for a, b in HEM:
        name[r & (cen[:, 1] >= y0+a/REFH*H) & (cen[:, 1] <= y0+b/REFH*H)] = 'gold'
    # そで口の金色のふち：手の部品に近い服の面
    hands = [c for n, c, lo, hi in info[1:] if (lo[1]+hi[1])/2/H < 0.45 and hi[1]-lo[1] < 0.45*H]
    if hands:
        hp = V[np.unique(F[np.isin(fl, hands)])]
        from scipy.spatial import cKDTree
        d, _ = cKDTree(hp).query(cen[name == 'robe']); idx = np.nonzero(name == 'robe')[0]; name[idx[d < GOLDCUFF*H]] = 'gold'
    return name

def cut_bands(g, H, y0):
    """服を、すその帯のさかいの高さで切る（面の三角のまま色をわけると、帯のふちがギザギザになる）。帯の所は金色、ほかは服"""
    planes = sorted({y0+v/REFH*H for a, b in HEM for v in (a, b)}); pieces = [g]; out = []
    for yp in planes:
        nxt = []
        for q in pieces:
            lo = trimesh.intersections.slice_mesh_plane(q, [0, -1, 0], [0, yp, 0]); hi = trimesh.intersections.slice_mesh_plane(q, [0, 1, 0], [0, yp, 0])
            nxt += [m for m in (lo, hi) if m is not None and len(m.faces)]
        pieces = nxt
    for q in pieces:
        yc = q.vertices[:, 1].mean(); k = 'gold' if any(y0+a/REFH*H <= yc <= y0+b/REFH*H for a, b in HEM) else 'robe'
        out.append((k, q))
    return out

def main():
    V, F, fl = parts(); name = classify(V, F, fl); sc = trimesh.Scene(); H = V[:, 1].max()-V[:, 1].min(); y0 = V[:, 1].min()
    # すその帯は、服を高さで切ってわける（classify の面ごとの帯はつかわない）
    hem = np.zeros(len(F), bool); cen = V[F].mean(1)
    for a, b in HEM: hem |= (cen[:, 1] >= y0+a/REFH*H-0.02*H) & (cen[:, 1] <= y0+b/REFH*H+0.02*H)
    robe_all = (name == 'robe') | ((name == 'gold') & hem)
    lowband = robe_all & (cen[:, 1] < y0+(HEM[-1][1]/REFH+0.04)*H)   # 帯のあたりの服だけ切る
    geoms = {k: [] for k in COL}
    for k, q in cut_bands(trimesh.Trimesh(V, F[lowband], process=False), H, y0): geoms[k].append(q)
    geoms['robe'].append(trimesh.Trimesh(V, F[robe_all & ~lowband], process=False))
    for k in COL:
        if k == 'robe': continue
        m = (name == k) & ~(robe_all)
        if m.any(): geoms[k].append(trimesh.Trimesh(V, F[m], process=False))
    for k, L in geoms.items():
        if not L: continue
        g = trimesh.util.concatenate(L); g.remove_unreferenced_vertices()
        g.visual = trimesh.visual.TextureVisuals(material=trimesh.visual.material.PBRMaterial(name=k, baseColorFactor=list(COL[k])+[255], roughnessFactor=0.8))
        sc.add_geometry(g, node_name=k, geom_name=k)
    sc.export(OUT); print('glb', OUT, {k: sum(len(q.faces) for q in L) for k, L in geoms.items()})

if __name__ == '__main__':
    main()
