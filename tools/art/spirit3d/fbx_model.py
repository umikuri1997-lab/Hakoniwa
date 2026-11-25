"""持ち主のモデル（tools/art/spirit3d/model/<属性>.fbx）から、せいれいの3D（core.Spirit と同じ形の部品）を作る。
rig.posed・shoot はそのまま使う（動きの数・道具・目とほっぺをゲームでかさねるしくみも、そのまま）。
  部品：体（hips・spine・neck・shoulder の重みの所）・足（thigh・shin・foot）・うで（upper_arm・forearm）・手（hand）は Body から。
        ずきん（hood で始まる名前）・顔（Head）・頭のかざり（sprout・HeadACC）・風のはね（Hane）。目・ほっぺのメッシュは使わない（ゲームでかさねる）。
  色：体・足・うで・手は、いまと同じ色。ずきん・顔・頭のかざりは、いまと同じく、チップの正面・横・うしろの絵の色を面にうつす。
  座標：Blender の m → ドット（×100）、前は −Y → キャラの +y。左右はそのまま（キャラの +x ＝ Blender の +X ＝ .L）。
  うで：モデルの左うで（.L）を、うでの座標（u：かたから手・v：たらしたときの外・w：前）にする。手のまん中が HANDU（道具を持つ所）にくるよう、u をずらす。
しっぽ・火のほのおは、なし（持ち主がきめた）。"""
import os
import numpy as np
from core import Spirit, comp, sample, chip
import rig

HERE = os.path.dirname(os.path.abspath(__file__))
STEP = 0.22   # 面の上の点のあいだ（ドット）。写すときの細かさ（1ドットを4つ）より細かく

_MESH = {}
def meshes(el):
    """fbx の メッシュ名 → (三角形の点 [n,3,3]（ドット・キャラの座標）, 三角形ごとの いちばん重い骨の名前)"""
    if el in _MESH: return _MESH[el]
    import bpy
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.fbx(filepath=os.path.join(HERE, 'model', el+'.fbx'))
    out = {}
    for o in bpy.data.objects:
        if o.type != 'MESH': continue
        me = o.data; me.calc_loop_triangles()
        V = np.array([(o.matrix_world @ v.co)[:] for v in me.vertices])*100.0
        V = np.stack([V[:, 0], -V[:, 1], V[:, 2]], 1)
        names = {g.index: g.name for g in o.vertex_groups}
        dom = [names.get(max(v.groups, key=lambda g: g.weight).group, '') if v.groups else '' for v in me.vertices]
        T = np.array([t.vertices[:] for t in me.loop_triangles])
        tb = []
        for t in T:   # 三角形の骨：3つの点の、多いほう（なければ1つめ）
            ds = [dom[i] for i in t]; tb.append(max(set(ds), key=ds.count))
        out[o.name] = (V[T], np.array(tb))
    for o in bpy.data.objects:   # 骨の根もと（キャラの座標）
        if o.type == 'ARMATURE':
            out['_bones'] = {b.name: np.array([(o.matrix_world @ b.head_local)[0], -(o.matrix_world @ b.head_local)[1], (o.matrix_world @ b.head_local)[2]])*100.0 for b in o.data.bones}
    _MESH[el] = out
    return out

def surface(tris, step=STEP, seed=0):
    """三角形の面の上に、だいたい step おきに点をまく（面の大きさに合わせた数）"""
    if not len(tris): return np.zeros((0, 3))
    rng = np.random.default_rng(seed)
    a, b, c = tris[:, 0], tris[:, 1], tris[:, 2]
    area = 0.5*np.linalg.norm(np.cross(b-a, c-a), axis=1)
    n = np.maximum(1, np.round(area/(step*step)*1.3).astype(int))
    idx = np.repeat(np.arange(len(tris)), n)
    r1 = np.sqrt(rng.random(len(idx))); r2 = rng.random(len(idx))
    P = (1-r1)[:, None]*a[idx]+(r1*(1-r2))[:, None]*b[idx]+(r1*r2)[:, None]*c[idx]
    return np.concatenate([P, (a+b+c)/3])

def components(T):
    """三角形を、点をわけあう かたまりに分けた番号"""
    from scipy.sparse import coo_matrix
    from scipy.sparse.csgraph import connected_components
    V, inv = np.unique(np.round(T.reshape(-1, 3), 4), axis=0, return_inverse=True); inv = inv.reshape(-1, 3)
    r = np.concatenate([inv[:, 0], inv[:, 1]]); c = np.concatenate([inv[:, 1], inv[:, 2]])
    n, lab = connected_components(coo_matrix((np.ones(len(r)), (r, c)), shape=(len(V), len(V))), directed=False)
    return lab[inv[:, 0]]

def pick(M, pre):
    return [k for k in M if k.lower().startswith(pre.lower())]

class FbxSpirit(Spirit):
    def __init__(self, el):
        super().__init__(el)   # 色・チップの絵のもと（いまと同じ）
        self.true_depth = True   # 顔とずきんは本当の奥行きでかさねる（チップの形のときの「顔はずきんに勝つ」はしない）
        M = meshes(el); E = self.E
        BT, BB = M['Body']
        def part(*bones):
            m = np.isin(BB, bones); return surface(BT[m])
        self.solid = {'body': part('hips', 'spine', 'neck', 'head', 'shoulder.L', 'shoulder.R'),
                      'legL': part('thigh.R', 'shin.R', 'foot.R'),    # ゲームの legL はキャラの −x（モデルの .R）
                      'legR': part('thigh.L', 'shin.L', 'foot.L')}
        lx = self.solid['legR'][:, 0]; self.hipx = float(np.median(lx)) if len(lx) else 8.0
        # うで（モデルの .L）を、うでの座標へ
        Aall = part('upper_arm.L', 'forearm.L', 'hand.L')   # 手：hand.L の骨の根もと（手首）より先（重みは forearm の点も手にふくめる）
        wx = M['_bones']['hand.L'][0] if 'hand.L' in M['_bones'] else Aall[:, 0].max()-5
        A = Aall[Aall[:, 0] < wx]; Hn = Aall[Aall[:, 0] >= wx]
        S0 = np.array([A[:, 0].min(), 0.0, np.median(A[:, 2])])   # かたのつけね
        d = np.array([1.0, 0, 0])
        hc = Hn.mean(0); shift = (hc-S0)@d-rig.HANDU[0, 0]
        def local(P):
            Q = P-S0; return np.stack([Q@d-shift, Q[:, 2], Q[:, 1]], 1)   # u, v（上→外）, w（前）
        arm = (local(A), local(Hn)); self.arm = {f: arm for f in (0, 1, 2)}
        # ずきん・顔・頭のかざり：チップの絵の色を面にうつす（いまの textured と同じ）
        self.tex = {}
        def textured(nm, P, front, side):
            Ff, Sf = comp(*front), comp(*side)
            cF = sample(Ff, P[:, 0], -P[:, 2]); cS = sample(Sf, P[:, 1], -P[:, 2]); cB = sample(Ff, P[:, 0], -P[:, 2])
            self.tex[nm] = (P, (cF, cS, cB))
        hk = pick(M, 'hood')
        if hk: textured('hood', np.concatenate([surface(M[k][0]) for k in hk]), (E+'hood',), (E+'hoodS',))   # 風は ずきんなし（持ち主のモデル）
        if 'Head' in M:
            textured('face', surface(M['Head'][0]), ('sp:head',), ('sp:headS',))   # 火の前がみは、モデルのずきんにある
        if 'eye' in M:   # モデルの目（両目のまん中・いちばん前）
            T = M['eye'][0].reshape(-1, 3); self.eyep = np.array([0.0, T[:, 1].max(), T[:, 2].mean()])
        self.tops = []
        for nm, pre in (('sprout', 'sprout'), ('vine', 'HeadACC')):
            ks = pick(M, pre)
            if ks:
                P = np.concatenate([surface(M[k][0]) for k in ks])
                textured(nm, P, (E+nm,), (E+nm+'S',))
                self.tops.append((nm, np.array([P[:, 0].mean(), P[:, 1].mean(), P[:, 2].min()])))
        # 風のはね：つながった かたまりごとに1まい。根もと（体にいちばん近い点）で、前うしろの軸のまわりにふる
        #   モデルの形のまま（ふらない）。上の2まい（頭のよこ）は頭につけ、下の2まいは体につける
        self.wings = []
        for k in pick(M, 'Hane'):
            P = surface(M[k][0]); zc = P[:, 2].mean()
            a, ax, ay = chip(E+'leaf'); col = a[a[..., 3] > 0][:, :3].mean(0).astype(np.uint8)
            up, lo = P[P[:, 2] > zc], P[P[:, 2] <= zc]
            if len(up):
                C = np.tile(col, (len(up), 1)); self.tex['ears'] = (up, (C, C, C)); self.fixed_head_parts = ('ears',)
            if len(lo): self.cape = (lo, np.tile(col, (len(lo), 1)))
        self.cache = {}

    def flat(self, face):
        return {'wing%d' % i: w for i, w in enumerate(self.wings)}
