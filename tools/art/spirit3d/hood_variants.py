"""持ち主が直したせいれいのモデル（FBX）に、属性ごとのずきんをつけかえた FBX を作る。
  python3 tools/art/spirit3d/hood_variants.py <持ち主の .fbx> <出すフォルダ>
出す物：spirit_<属性>.fbx（体・あたま・目・ほっぺ・しっぽ・骨は持ち主のまま、ずきんと頭の上の物だけ属性ごと）。
持ち主のずきん（hood）は土だけの形。ほかの属性は、その属性のチップのずきんの形で作り（model_blend.build_hood）、
「チップの土のずきん → 持ち主のずきん」と同じ合わせ方で、持ち主のモデルに合わせる。頭の上の物も同じ合わせ方。"""
import os, sys
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from core import ELS, chip, TOPS
import bpy
from mathutils import Vector

S = 0.01
src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)

def box(k):
    a, ax, ay = chip(k); m = a[..., 3] > 0; ys, xs = np.nonzero(m)
    return ax+xs.min(), ax+xs.max()+1, -(ay+ys.max()+1), -(ay+ys.min())   # 左, 右, 下, 上（横の絵は うしろ, 前）

HF = box('sp:head'); HS = box('sp:headS')
def ks(el):
    f = box('sp_%s:hood' % el); s = box('sp_%s:hoodS' % el); ef = box('sp_earth:hood'); es = box('sp_earth:hoodS')
    kx = ((f[1]-f[0])-(HF[1]-HF[0]))/((ef[1]-ef[0])-(HF[1]-HF[0]))
    kb = (HS[0]-s[0])/(HS[0]-es[0])                        # うしろへのはみ出し
    kt = min(1.5, (f[3]-HF[3])/(ef[3]-HF[3]))               # 上へのはみ出し（とがった先は頭の上の物で出すので 1.5 まで）
    return kx, kb, kt

def horn(k, yc, n=10):
    """ずきんの先（tip）：絵の たての列ごとに、上下のはしのまん中を通り、はばを太さにした まるい つの（ロフト）。点はチップの座標×S（前 −Y）"""
    import bmesh, math
    a, ax, ay = chip(k); m = a[..., 3] > 0; cols = [c for c in range(m.shape[1]) if m[:, c].any()]
    R = []
    for c in cols[::1]:
        rs = np.nonzero(m[:, c])[0]; top, bot = -(ay+rs.min()), -(ay+rs.max()+1); zc = (top+bot)/2; r = max(0.6, (top-bot)/2)
        R.append((ax+c+.5, zc, r))
    bm = bmesh.new(); rings = []
    for x, z, r in R:
        rings.append([bm.verts.new(((x)*S, -(yc+r*math.sin(t))*S, (z+r*math.cos(t))*S)) for t in np.linspace(0, 2*math.pi, n, endpoint=False)])
    for A, B_ in zip(rings, rings[1:]):
        for i in range(n): bm.faces.new((A[i], A[(i+1) % n], B_[(i+1) % n], B_[i]))
    for rg, rev in ((rings[0], True), (rings[-1], False)):
        bm.faces.new(rg[::-1] if rev else rg)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm

def wbox(o):
    P = np.array([(o.matrix_world @ v.co)[:] for v in o.data.vertices]); return P.min(0), P.max(0)

def load():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.fbx(filepath=os.path.abspath(src))

def build(el):
    """土：持ち主のずきん・芽のまま。ほかの属性：その属性のチップのずきんの形（model_blend.build_hood）と頭の上の物を、
    「チップの土のずきん → 持ち主のずきん」と同じ合わせ方（横・前うしろ・高さの のび と ずれ）で、持ち主のモデルに合わせる"""
    load()
    ob = {o.name: o for o in bpy.data.objects}
    hood = ob['hood']; head = ob['Head']; arm = ob['spirit_rig']
    if el == 'earth': hood.name = 'hood_earth'
    else:
        import bmesh
        import model_blend as MB
        from mathutils.bvhtree import BVHTree
        def mbox(me):
            P = np.array([v.co[:] for v in me.vertices]); return P.min(0), P.max(0)
        me0 = MB.build_hood('earth'); E0, E1 = mbox(me0); bpy.data.meshes.remove(me0)
        U0, U1 = wbox(hood)
        sc = (U1-U0)/(E1-E0); off = U0-E0*sc
        fit = lambda P: Vector(np.array(P[:])*sc+off)
        me = MB.build_hood(el); bm = bmesh.new(); bm.from_mesh(me); bpy.data.meshes.remove(me)
        for v in bm.verts: v.co = fit(v.co)
        bmesh.ops.solidify(bm, geom=bm.faces[:], thickness=-0.018)   # 厚み（内がわへ）
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        # 頭をつきぬけないよう、頭の面より内がわの点は、頭の面の少し外へ出す
        dg = bpy.context.evaluated_depsgraph_get(); hm_ = head.evaluated_get(dg).to_mesh()
        tree = BVHTree.FromPolygons([head.matrix_world @ v.co for v in hm_.vertices], [tuple(p.vertices) for p in hm_.polygons])
        head.evaluated_get(dg).to_mesh_clear()
        hm, hM = wbox(head); C = Vector((hm+hM)/2)
        for v in bm.verts:
            d = v.co-C; r = d.length
            if r < 1e-6 or v.co.z < hm[2]+0.1*(hM[2]-hm[2]): continue
            hit = tree.ray_cast(C, d/r)
            if hit[0] is not None and r < (hit[0]-C).length+0.006: v.co = C+d/r*((hit[0]-C).length+0.006)
        W = hood.matrix_world; Wi = W.inverted()
        for v in bm.verts: v.co = Wi @ v.co
        nm = bpy.data.meshes.new('hood_'+el); bm.to_mesh(nm); bm.free()
        for p in nm.polygons: p.use_smooth = True
        old = hood.data; hood.data = nm; bpy.data.meshes.remove(old); hood.name = 'hood_'+el
        hood.vertex_groups.clear(); g = hood.vertex_groups.new(name='head'); g.add(list(range(len(nm.vertices))), 1.0, 'REPLACE')
        for o in list(bpy.data.objects):
            if o.name.startswith('sprout'): bpy.data.objects.remove(o)
        for nmo in TOPS[el]:
            k = 'sp_%s:%s' % (el, nmo); kS = 'sp_%s:%sS' % (el, nmo)
            yc = 0.0
            try: sa, sx_, sy_ = chip(kS); cols = np.nonzero((sa[..., 3] > 0).any(0))[0]; yc = sx_+(cols[0]+cols[-1]+1)/2
            except KeyError: pass
            if nmo == 'tip': bm2 = horn(k, yc)   # ずきんの先は、ずきんからのびる まるい つの
            else:
                th = 5.0 if nmo == 'ember' else 3.5
                bm2 = MB.place(MB.cutout(k, th, down=0 if nmo == 'ember' else 2.5), lambda q: (q[0], -(q[1]+yc), q[2]))
            for v in bm2.verts: v.co = fit(v.co)
            o = MB.bm_to_obj(bm2, '%s_%s' % (nmo, el), bpy.context.scene.collection, None, smooth=(nmo == 'tip'))
            g = o.vertex_groups.new(name='hood_tip'); g.add(list(range(len(o.data.vertices))), 1.0, 'REPLACE')
            o.parent = arm; o.matrix_parent_inverse = arm.matrix_world.inverted()
            o.modifiers.new('Armature', 'ARMATURE').object = arm
        if el == 'wind':   # 風のはね（4まいの葉）：model_blend と同じ置き方を、同じ合わせ方で
            import math
            from core import WINGS, K
            for i, (wx, wy, ln, th_, sg) in enumerate(WINGS):
                sc_ = ln/44; c_, s_ = math.cos(th_), math.sin(th_)
                def fw(q, sc_=sc_, c_=c_, s_=s_, wx=wx, wy=wy):
                    X, Y = q[0]*sc_, -q[2]*sc_; X, Y = X*c_-Y*s_, X*s_+Y*c_
                    return (X+wx*K, -(-24+q[1]), -(Y+wy*K))
                bmW = MB.place(MB.cutout('sp_wind:leaf', 3.0), fw)
                for v in bmW.verts: v.co = fit(v.co)
                dy = wbox(hood)[1][1]+0.005-min(v.co.y for v in bmW.verts)   # ずきんのうしろへ出す（ずきんをつきぬけない）
                for v in bmW.verts: v.co.y += dy
                o = MB.bm_to_obj(bmW, 'wing%d_wind' % i, bpy.context.scene.collection, None, smooth=False)
                g = o.vertex_groups.new(name='spine'); g.add(list(range(len(o.data.vertices))), 1.0, 'REPLACE')
                o.parent = arm; o.matrix_parent_inverse = arm.matrix_world.inverted()
                o.modifiers.new('Armature', 'ARMATURE').object = arm
    nm_, nM_ = wbox(hood); kx = kb = kt = 0
    for o in bpy.data.objects: o.select_set(o.type in ('MESH', 'ARMATURE'))
    bpy.ops.export_scene.fbx(filepath=os.path.join(out, 'spirit_%s.fbx' % el), use_selection=True, object_types={'ARMATURE', 'MESH'},
                             use_mesh_modifiers=False, mesh_smooth_type='FACE', add_leaf_bones=False, bake_anim=False, path_mode='STRIP',
                             apply_scale_options='FBX_SCALE_ALL')
    print(el, 'hood', [round(float(v)/S, 1) for v in nm_], [round(float(v)/S, 1) for v in nM_])

for el in ELS: build(el)
