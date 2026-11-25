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
    dom = {}
    for o in meshes:
        names = {g.index: g.name for g in o.vertex_groups}
        dom[o.name] = [names.get(max(v.groups, key=lambda g: g.weight).group, '') if v.groups else '' for v in o.data.vertices]
    rest = {b.name: np.array(b.matrix_local) for b in arm.data.bones}   # アーマチュアの空間（m）
    order = []
    def walk(b):
        order.append(b.name)
        for c in b.children: walk(c)
    for b in arm.data.bones:
        if b.parent is None: walk(b)
    _CUR.clear(); _CUR.update(el=el, arm=arm, meshes=meshes, dom=dom, rest=rest, order=order)
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
            R = ry(-side*(ABD[face]+g('b'+k)))@rx(g('s'+k))@rz(g('t'+k))
            Rd = ry(side*math.pi/2)   # 横へのびたうで（side·x）→ まっすぐたらしたうで（−z）
            sh = F@rest['upper_arm'+nm[nm.index('.'):]][:3, 3]*100
            T[nm] = Tb@rigid(R@Rd, sh)
        else: T[nm] = Tb
    for nm in S['order']:
        arm.pose.bones[nm].matrix = Matrix((T[nm]@rest[nm]).tolist())
        bpy.context.view_layer.update()

def triangles(el):
    """いまのポーズのメッシュの三角形（ドット・Blender の向きのまま）と色"""
    import bpy
    S = scene(el); dg = bpy.context.evaluated_depsgraph_get(); out = []
    for o in S['meshes']:
        ev = o.evaluated_get(dg); me = ev.to_mesh(); me.calc_loop_triangles()
        M = ev.matrix_world; R = M.to_3x3()
        V = np.array([(M @ v.co)[:] for v in me.vertices])*100.0
        N = np.array([(R @ v.normal).normalized()[:] for v in me.vertices])
        dom = S['dom'][o.name]
        for t in me.loop_triangles:
            i = list(t.vertices); out.append((V[i], N[i], FP.hx(FP.color_of(o.name, el, dom[i[0]]))))
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
