"""持ち主のモデル（model/<属性>.fbx）の骨を、そのまま3Dで動かして、ドット絵に写す。
動き：motions.py の数（体 x・y・z・lean・roll・yaw／足 legM・legP・liftM・liftP・legz／うで sN・bN・tN・sF・bF・tF／頭 hp・hr・hy／spin）を、
  モデルの骨の、アーマチュアの空間のポーズ（pose_bone.matrix）にする。回し方は rig.posed と同じ式（体は腰・頭は首・足はまた・うではかた）。
  うで：モデルのうでは横へのびた形（Tポーズ）。ゲームのうでの式（まっすぐたらしたうでを、向きごとに外へ開き、前へふる）の回転に、
        「横へのびたうで → まっすぐたらしたうで」の回転をかけた物を、うでの骨（upper_arm）に。forearm・hand はそのまま。
道具：いまの道具（props.py）を、rig.posed と同じ場所に、点で写す。
写し方：fbx_pixel.render（1ドット＝1cm・遠近なし・左上の光で3だん・1ドットの輪郭）。"""
import math, os, sys
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from core import rx, ry, rz, ABD, NEARSIDE, Spirit
import rig
import fbx_pixel as FP

HERE = os.path.dirname(os.path.abspath(__file__))
FACE_DOWN = 0.0   # 目・ほっぺはモデルの場所のまま（持ち主：目の位置を勝手にかえない）
F = np.diag([1.0, -1.0, 1.0])   # キャラの座標（前 +y）⇔ Blender（前 −Y）

def blend(R): return F@R@F

_CUR = {}
def scene(el):
    import bpy
    if _CUR.get('el') == el: return _CUR
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.fbx(filepath=os.path.join(HERE, 'model', el+'.fbx'))
    arm = [o for o in bpy.data.objects if o.type == 'ARMATURE'][0]
    meshes = [o for o in bpy.data.objects if o.type == 'MESH']
    for o in meshes:   # 顔（目・ほっぺ）を少し下げる（持ち主のたのみ。あたまごと下げると、あごがずきんの下から出る）
        if o.name.lower().startswith(('eye', 'cheek')):
            mw = o.matrix_world.copy(); mw.translation.z -= FACE_DOWN*0.01; o.matrix_world = mw
    dom = {}
    for o in meshes:
        names = {g.index: g.name for g in o.vertex_groups}
        dom[o.name] = [names.get(max(v.groups, key=lambda g: g.weight).group, '') if v.groups else '' for v in o.data.vertices]
    restV = {o.name: np.array([(o.matrix_world @ v.co)[:] for v in o.data.vertices])*100 for o in meshes}   # 休みのポーズの点（ドット）
    comp = {}   # 木のずきん：はなれた かたまり（いちばん大きい物のほかは 葉脈）
    from scipy.sparse import coo_matrix
    from scipy.sparse.csgraph import connected_components
    for o in meshes:
        if o.name.lower().startswith('hood'):
            E = np.array([e.vertices[:] for e in o.data.edges]); n = len(o.data.vertices)
            _, lab = connected_components(coo_matrix((np.ones(len(E)), (E[:, 0], E[:, 1])), shape=(n, n)), directed=False)
            comp[o.name] = (lab, np.bincount(lab).argmax())
    # 頭（ずきん・顔）の大きさ：うでがめりこまないようにする、頭のまわりのだ円（休みのポーズの、キャラの座標・ドット）
    P = np.concatenate([np.array([(o.matrix_world @ v.co)[:] for v in o.data.vertices]) for o in meshes if o.name.lower().startswith(('hood', 'head'))])*100
    P = P@F; hc0 = (P.min(0)+P.max(0))/2; hr0 = (P.max(0)-P.min(0))/2
    feat = []   # 表情の目をおく所（休みのポーズ・Blender の向き・ドット）：左目・右目・左ほっぺ・右ほっぺ（キャラの −x が左。rig.ISOEYEUV のならび）
    for pre in ('eye', 'cheek'):
        Q = np.concatenate([np.array([(o.matrix_world @ v.co)[:] for v in o.data.vertices]) for o in meshes if o.name.lower().startswith(pre)])*100
        for sgn in (-1, 1):
            q = Q[np.sign(Q[:, 0]) == sgn]; feat.append(np.array([q[:, 0].mean(), q[:, 1].min(), q[:, 2].mean()]))
    HV = np.concatenate([np.array([(o.matrix_world @ v.co)[:] for v in o.data.vertices]) for o in meshes if o.name.lower().startswith('head') and not o.name.lower().startswith('headacc')])*100   # 顔（Head）の点（休み・ドット）
    rest = {b.name: np.array(b.matrix_local) for b in arm.data.bones}   # アーマチュアの空間（m）
    order = []
    def walk(b):
        order.append(b.name)
        for c in b.children: walk(c)
    for b in arm.data.bones:
        if b.parent is None: walk(b)
    _CUR.clear(); _CUR.update(el=el, arm=arm, meshes=meshes, dom=dom, rest=rest, order=order, comp=comp, hc0=hc0, hr0=hr0, feat=feat, HV=HV, restV=restV)
    return _CUR

def rigid(R, pivot, t=(0, 0, 0)):
    """キャラの座標（ドット）の回転 R を pivot のまわりに・そのあと t ずらす → Blender の 4×4（m）"""
    Rb = blend(np.asarray(R)); pb = F@np.asarray(pivot, float)*0.01; tb = F@np.asarray(t, float)*0.01
    M = np.eye(4); M[:3, :3] = Rb; M[:3, 3] = pb-Rb@pb+tb; return M

def pose(el, p, face):
    """ポーズ p（motions の数）を、モデルの骨にかける"""
    import bpy
    from mathutils import Matrix
    S = scene(el); arm = S['arm']; rest = S['rest']
    g = lambda k: p.get(k, 0.0)
    Rb = rz(g('yaw'))@ry(g('roll'))@rx(-g('lean'))
    Tb = rigid(Rb, rig.PIVB, (g('x'), g('y'), g('z')))
    hc = (Tb@np.r_[F@rig.PIVH*0.01, 1])[:3]; hc = F@hc*100   # 体を動かしたあとの首（キャラの座標）
    Th = rigid(rz(g('hy'))@ry(g('hr'))@rx(-g('hp')), hc)@Tb
    T = {}
    for nm in rest:
        if nm in ('root',): T[nm] = np.eye(4)
        elif nm in ('neck', 'head', 'hood_tip'): T[nm] = Th
        elif nm.startswith(('thigh', 'shin', 'foot')):
            s = 'M' if nm.endswith('.R') else 'P'   # ゲームの M はキャラの −x（モデルの .R）
            hip = F@rest['thigh'+nm[nm.index('.'):]][:3, 3]*100
            T[nm] = rigid(rx(g('leg'+s)), hip, (g('x'), g('y'), g('legz')+g('lift'+s)))
        elif nm.startswith(('upper_arm', 'forearm', 'hand')):
            side = 1 if nm.endswith('.L') else -1   # キャラの +x のうで
            near = side == NEARSIDE[face]; k = 'N' if near else 'F'
            Rd = ry(side*math.pi/2)   # 横へのびたうで（side·x）→ まっすぐたらしたうで（−z）
            sh = F@rest['upper_arm'+nm[nm.index('.'):]][:3, 3]*100
            # 頭にめりこむときは、めりこまなくなるまで、うでを外へ開く（b を足す）
            Thi = np.linalg.inv(Th); lift = 0.0
            for _ in range(16):
                R = ry(-side*(ABD[face]+g('b'+k)+lift))@rx(g('s'+k))@rz(g('t'+k))
                M = Tb@rigid(R, sh)
                U = np.array([[0, 0, -u] for u in np.linspace(5, 17, 7)])+sh   # たらしたうでの軸の上の点（かたから手の先）
                W = (M@np.c_[(U@F)*0.01, np.ones(len(U))].T).T[:, :3]            # Blender（m）
                Hh = ((Thi@np.c_[W, np.ones(len(W))].T).T[:, :3]/0.01)@F          # 頭の休みの座標へ（キャラの座標）
                q = (Hh-S['hc0'])/(S['hr0']+np.array([4.0, 4.0, 0.0]))   # 横・前うしろは うでの太さぶん広く。たては頭のはんいだけ
                if not (((q**2).sum(1) < 1) & (Hh[:, 2] > S['hc0'][2]-S['hr0'][2]-4.0)).any(): break   # ずきんのすそより少し下まで
                lift += 0.08
            T[nm] = Tb@rigid(R@Rd, sh)
        else: T[nm] = Tb
    for nm in S['order']:
        arm.pose.bones[nm].matrix = Matrix((T[nm]@rest[nm]).tolist())
        bpy.context.view_layer.update()
    S['T'] = T
    return T

def triangles(el, eyes=True):
    """いまのポーズのメッシュの三角形（ドット・Blender の向きのまま）・色・材質・種類（fbx_pixel.TAGS）。eyes=False：目・ほっぺのメッシュは写さない（表情の目をゲームでかさねる）"""
    import bpy
    S = scene(el); dg = bpy.context.evaluated_depsgraph_get(); out = []
    for o in S['meshes']:
        ln = o.name.lower()
        if not eyes and ln.startswith(('eye', 'cheek')): continue
        ev = o.evaluated_get(dg); me = ev.to_mesh(); me.calc_loop_triangles()
        M = ev.matrix_world; R = M.to_3x3()
        V = np.array([(M @ v.co)[:] for v in me.vertices])*100.0
        N = np.array([(R @ v.normal).normalized()[:] for v in me.vertices])
        dom = S['dom'][o.name]; base = FP.hx(FP.color_of(o.name, el, ''))
        hood = o.name.lower().startswith('hood'); cp = S['comp'].get(o.name)
        mat = (1 if el == 'water' else 2 if el == 'fire' else 0) if hood else 3 if o.name.lower().startswith('hane') else 0   # 水のずきんは つや・火のずきんは 光る・風のはねは すける
        for t in me.loop_triangles:
            i = list(t.vertices); col = FP.hx(FP.color_of(o.name, el, dom[i[0]]))
            if el == 'wood' and cp is not None and cp[0][i[0]] != cp[1]: col = FP.hx('#c9ef9b')   # 木の葉脈：明るい黄緑
            tag = 'face' if ln.startswith('head') and not ln.startswith('headacc') else 'head' if ln.startswith(('hood', 'headacc', 'sprout', 'eye', 'cheek')) \
                else 'arm' if ln == 'body' and dom[i[0]].startswith(('upper_arm', 'forearm', 'hand')) else 'body'
            out.append((V[i], N[i], col, mat, tag, S['restV'][o.name][i]))
        ev.to_mesh_clear()
    return out

_OLD = {}
def props(el, p, face):
    """道具の点（rig.posed と同じ場所。キャラの座標 → Blender の向き）と色"""
    sp = _OLD.get('sp') or _OLD.setdefault('sp', Spirit('wood'))
    parts, anc = rig.posed(sp, face, p)
    out = []
    for nm, (P, C, kind) in parts.items():
        if kind == 'p': out.append((np.asarray(P)@F, np.asarray(C)))
    return out, anc

def frame(el, p, face):
    pose(el, p, face)
    pts, anc = props(el, p, face)
    return FP.render(triangles(el), face, points=pts, spin=p.get('spin', 0.0))

def face_pt(el, x, z):
    """顔（Head）の、正面から見て (x, z) の所の、いちばん前（Blender の −Y）の点（休み・ドット）"""
    HV = scene(el)['HV']; r = 1.5
    while True:
        m = (np.abs(HV[:, 0]-x) < r) & (np.abs(HV[:, 2]-z) < r)
        if m.any(): return np.array([x, HV[m, 1].min(), z])
        r *= 1.5

def face_fit(el):
    """休みの顔の点（Blender・ドット）→ 表情の目のチップの場所 (u, v)。モデルの両目のまん中・あいだを、チップの目（±9.5, −40.5）に合わせる"""
    F4 = scene(el)['feat']; L, R = F4[0], F4[1]; mx, mz = (L[0]+R[0])/2, (L[2]+R[2])/2; s = 19.0/max(1e-6, abs(R[0]-L[0]))
    return lambda P: ((P[:, 0]-mx)*s, -40.5-(P[:, 2]-mz)*s)
