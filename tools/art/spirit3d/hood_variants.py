"""持ち主が直したせいれいのモデル（FBX）に、属性ごとのずきんをつけかえた FBX を作る。
  python3 tools/art/spirit3d/hood_variants.py <持ち主の .fbx> <出すフォルダ>
出す物：spirit_<属性>.fbx（体・あたま・目・ほっぺ・しっぽ・骨は持ち主のまま、ずきんと頭の上の物だけ属性ごと）。
ずきんの大きさ：持ち主のずきん（土）を、属性ごとのチップのずきんの「あたまからのはみ出し」の比でのばす・ちぢめる。
  はみ出しの比 k ＝（属性のずきん − チップのあたま）÷（土のずきん − チップのあたま）。横・うしろ・上で、べつべつに出す。
  持ち主のモデルでは「持ち主のあたま ＋ 持ち主のずきんのはみ出し × k」にする（あたまをかならずおおう）。前（顔の穴）と下（すそ）はかえない。
頭の上の物：土は持ち主の芽のまま。ほかの属性は、チップの絵の形を板にした物（model_blend.cutout）を、新しいずきんのてっぺんに合わせる。"""
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

def wbox(o):
    P = np.array([(o.matrix_world @ v.co)[:] for v in o.data.vertices]); return P.min(0), P.max(0)

def load():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.fbx(filepath=os.path.abspath(src))

def build(el):
    load()
    ob = {o.name: o for o in bpy.data.objects}
    hood = ob['hood']; head = ob['Head']; arm = ob['spirit_rig']
    hm, hM = wbox(head); dm, dM = wbox(hood); c = (hm+hM)/2
    kx, kb, kt = ks(el)
    # 頭のまん中から見た向きごとに、頭の面からずきんの点までの すき間 を k 倍にする（ずきんは頭の外にのこる）。
    #   横は kx・うしろは kb・上は kt を、向きの成分でまぜる。前（顔の穴のがわ）と、頭より下（すそ）は、かえない。
    from mathutils.bvhtree import BVHTree
    dg = bpy.context.evaluated_depsgraph_get(); hm_ = head.evaluated_get(dg).to_mesh()
    tree = BVHTree.FromPolygons([head.matrix_world @ v.co for v in hm_.vertices], [tuple(p.vertices) for p in hm_.polygons])
    head.evaluated_get(dg).to_mesh_clear()
    C = Vector(c); W = hood.matrix_world; Wi = W.inverted(); GAP = 0.8*S
    for v in hood.data.vertices:
        p = W @ v.co; d = p-C; r = d.length
        if r < 1e-6: continue
        n = d/r
        hit = tree.ray_cast(C, n)
        if hit[0] is None: continue
        rh = (hit[0]-C).length
        wx, wb, wt = n.x**2, max(0.0, n.y)**2, max(0.0, n.z)**2; wf = max(0.0, -n.y)**2
        k = (wx*kx+wb*kb+wt*kt+wf*1.0)/max(1e-9, wx+wb+wt+wf)
        fade = min(1.0, max(0.0, (p.z-hm[2])/(0.25*(hM[2]-hm[2]))))   # 頭の下のほう（すそ）へ行くほど、かえない
        k = 1+(k-1)*fade
        rn = max(rh+GAP, rh+(r-rh)*k) if r > rh else r
        v.co = Wi @ (C+n*rn)
    hood.data.update(); hood.name = 'hood_'+el
    nm, nM = wbox(hood); top = nM[2]/S
    if el != 'earth':
        for o in list(bpy.data.objects):
            if o.name.startswith('sprout'): bpy.data.objects.remove(o)
        import model_blend as MB
        ef = box('sp_%s:hood' % el)
        for nmo in TOPS[el]:
            k = 'sp_%s:%s' % (el, nmo); kS = 'sp_%s:%sS' % (el, nmo)
            yc = 0.0
            try: sa, sx_, sy_ = chip(kS); cols = np.nonzero((sa[..., 3] > 0).any(0))[0]; yc = sx_+(cols[0]+cols[-1]+1)/2
            except KeyError: pass
            th = 5.0 if nmo in ('tip', 'ember') else 3.5
            dz = top-ef[3]   # チップのずきんのてっぺん → 新しいずきんのてっぺん
            bm = MB.place(MB.cutout(k, th, down=0 if nmo == 'ember' else 2.5), lambda q: (q[0], -(q[1]+yc), q[2]+dz))
            o = MB.bm_to_obj(bm, '%s_%s' % (nmo, el), bpy.context.scene.collection, None, smooth=False)
            g = o.vertex_groups.new(name='hood_tip'); g.add(list(range(len(o.data.vertices))), 1.0, 'REPLACE')
            o.parent = arm; o.matrix_parent_inverse = arm.matrix_world.inverted()
            o.modifiers.new('Armature', 'ARMATURE').object = arm
    for o in bpy.data.objects: o.select_set(o.type in ('MESH', 'ARMATURE'))
    bpy.ops.export_scene.fbx(filepath=os.path.join(out, 'spirit_%s.fbx' % el), use_selection=True, object_types={'ARMATURE', 'MESH'},
                             use_mesh_modifiers=False, mesh_smooth_type='FACE', add_leaf_bones=False, bake_anim=False, path_mode='STRIP',
                             apply_scale_options='FBX_SCALE_ALL')
    print(el, 'k', [round(v, 2) for v in (kx, kb, kt)], 'hood', [round(v/S, 1) for v in nm], [round(v/S, 1) for v in nM])

for el in ELS: build(el)
