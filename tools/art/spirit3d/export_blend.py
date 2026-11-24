"""せいれいの3D（spirit3d の形）を、ボーン入りの Blender ファイルと glb にして出す（持ち主がモデルを直すため）。
  python3 tools/art/spirit3d/export_blend.py <出すフォルダ>
出す物：spirit_rig.blend（5つの属性。ちがう所だけ属性のコレクションに分ける）・spirit_<属性>.glb（属性ごと）。
形：core.Spirit のボクセル（正面の絵と横の絵の両方の中）を、マーチングキューブでメッシュにする。うでは正面の絵の開き方（ABD[0]）のまま。
骨：rig.posed と同じ回す中心（腰 (0,0,11)・首 (0,0,26)・また (±8,0,11)・かた arm_xf・しっぽ TAILBASE）。部品ごとに1本の骨に重み1（いまの写し方と同じ、かたい部品）。
向き：Blender の正面（−Y）を向く。1ドット＝1cm。キャラの +x（右）→ Blender の −X（.R）。
色：点の色（Col）。体・足・うでは体の色、手と、ずきん・顔・頭の上の物・しっぽは属性ごと（ずきんなどは、面の向きで正面・横・うしろの絵の色）。目・ほっぺは入れない（ゲームでかさねる）。"""
import math, os, sys
import numpy as np
from scipy import ndimage
from skimage import measure
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from core import ELS, Q, QH, Spirit, arm_xf, TAILBASE, TAILBACK, TAILTWIST, rx, rz, CREAM
from rig import PIVB, PIVH, HANDU
import bpy, bmesh

S = 0.01   # 1ドット → m

def tob(P):   # キャラの座標 → Blender（z まわりに180度）
    P = np.asarray(P, float); return np.stack([-P[:, 0], -P[:, 1], P[:, 2]], 1)*S

def mesh_of(P, q, sigma=2.0):
    """点（ボクセルのまん中）→ うめた形 → マーチングキューブ（頂点, 面）"""
    o = P.min(0)-3*q; I = np.round((P-o)/q).astype(int); sh = I.max(0)+4
    V = np.zeros(sh, bool); V[I[:, 0], I[:, 1], I[:, 2]] = True
    V = ndimage.binary_closing(V, iterations=1); V = ndimage.binary_fill_holes(V)
    F = ndimage.gaussian_filter(V.astype(np.float32), sigma)
    v, f, _, _ = measure.marching_cubes(F, 0.5, spacing=(q, q, q)); return v+o, f[:, ::-1]

def colors_for(v, n, src):
    """頂点の色：src=(点, (前, 横, うしろ)) なら、近い点の、面の向きの絵の色。src=色 ならその色"""
    if isinstance(src, tuple) and len(src) == 3 and isinstance(src[0], (int, np.integer)):
        return np.tile(np.array(src, float)/255, (len(v), 1))
    from scipy.spatial import cKDTree
    P, C = src; idx = cKDTree(P).query(v)[1]
    if isinstance(C, tuple):
        cF, cS, cB = C; ny, nx = n[:, 1], np.abs(n[:, 0])
        out = np.where((ny >= nx)[:, None], cF[idx], np.where((-ny >= nx)[:, None], cB[idx], cS[idx]))
    else: out = C[idx]
    return out.astype(float)/255

def add_obj(name, v, f, col, bone, arm, coll):
    me = bpy.data.meshes.new(name); me.from_pydata(tob(v).tolist(), [], f.tolist()); me.update()
    ob = bpy.data.objects.new(name, me); coll.objects.link(ob)
    bm = bmesh.new(); bm.from_mesh(me); bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6); bm.to_mesh(me); bm.free()
    # 頂点の色（remove_doubles のあと、近い元の頂点からとりなおす）
    from scipy.spatial import cKDTree
    W = np.array([x.co[:] for x in me.vertices]); c = col[cKDTree(tob(v)).query(W)[1]]
    a = me.color_attributes.new('Col', 'FLOAT_COLOR', 'POINT')
    a.data.foreach_set('color', np.concatenate([c, np.ones((len(c), 1))], 1).ravel().astype(np.float32))
    mod = ob.modifiers.new('Decimate', 'DECIMATE'); mod.ratio = min(1.0, (8000 if name.startswith(('head', 'body')) else 3000)/max(1, len(me.polygons)))
    bpy.context.view_layer.objects.active = ob
    with bpy.context.temp_override(object=ob, active_object=ob, selected_objects=[ob]): bpy.ops.object.modifier_apply(modifier=mod.name)
    for p in me.polygons: p.use_smooth = True
    me.materials.append(MAT)
    g = ob.vertex_groups.new(name=bone); g.add(list(range(len(me.vertices))), 1.0, 'REPLACE')
    ob.parent = arm; am = ob.modifiers.new('Armature', 'ARMATURE'); am.object = arm
    return ob

def normals(v, f):
    n = np.zeros_like(v); t = np.cross(v[f[:, 1]]-v[f[:, 0]], v[f[:, 2]]-v[f[:, 0]])
    for k in range(3): np.add.at(n, f[:, k], t)
    return n/np.maximum(np.linalg.norm(n, axis=1, keepdims=True), 1e-9)

def material():
    m = bpy.data.materials.new('spirit'); nt = m.node_tree
    bs = nt.nodes.get('Principled BSDF'); ca = nt.nodes.new('ShaderNodeVertexColor'); ca.layer_name = 'Col'
    nt.links.new(ca.outputs['Color'], bs.inputs['Base Color']); bs.inputs['Roughness'].default_value = 0.8
    return m

def build(out):
    global MAT
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene; sc.unit_settings.system = 'METRIC'; MAT = material()
    root = sc.collection
    common = bpy.data.collections.new('common'); root.children.link(common)
    SPS = {el: Spirit(el) for el in ELS}; sp0 = SPS['wood']
    f0 = {True: arm_xf(0, True)[0], False: arm_xf(0, False)[0]}
    sideN = {True: 'R', False: 'L'}    # 正面の手前の手は キャラの +x（右）
    hand_at = {k: f0[k](HANDU)[0] for k in f0}; sh_at = {k: arm_xf(0, k)[1] for k in f0}
    tip_dir = (rx(TAILBACK)@rz(TAILTWIST))@np.array([0, 0, 1.0])
    # ---- アーマチュア ----
    ad = bpy.data.armatures.new('spirit_rig'); arm = bpy.data.objects.new('spirit_rig', ad); common.objects.link(arm)
    bpy.context.view_layer.objects.active = arm
    with bpy.context.temp_override(object=arm, active_object=arm):
        bpy.ops.object.mode_set(mode='EDIT')
        def bone(nm, h, t, parent=None):
            b = ad.edit_bones.new(nm); b.head = tob(np.array([h]))[0]; b.tail = tob(np.array([t]))[0]
            if parent: b.parent = ad.edit_bones[parent]
            return b
        bone('root', (0, 0, 0), (0, -8, 0))
        bone('body', PIVB, PIVH, 'root')              # 体（腰で回る：lean・roll・yaw）
        bone('head', PIVH, (0, 0, 60), 'body')        # 頭（首で回る：hp・hr・hy）
        for k in (True, False):
            s = sideN[k]; hand = hand_at[k]
            bone('leg.'+s, (8 if s == 'R' else -8, 0, 11), (8 if s == 'R' else -8, 0, 1), 'root')
            bone('arm.'+s, sh_at[k], hand, 'body')
            d = (hand-sh_at[k])/np.linalg.norm(hand-sh_at[k])
            bone('hand.'+s, hand, hand+d*5, 'arm.'+s).use_connect = True
        bone('tail', TAILBASE, TAILBASE+tip_dir*14, 'body')
        for el, sp in SPS.items():   # 頭の上の物（ずきんの先・芽など）・風のはね
            for nm, (P, C) in sp.tex.items():
                if nm in ('hood', 'face'): continue
                base = np.array([P[:, 0].mean(), P[:, 1].mean(), P[:, 2].min()])
                bone('%s_%s' % (nm, el), base, (base[0], base[1], P[:, 2].max()), 'head')
            for nm, val in sp.flat(0).items():
                if nm == 'tail': continue
                P, pv = val[0], val[2]; bone('%s_%s' % (nm, el), pv, P[np.argmax(np.linalg.norm(P-pv, axis=1))], 'body')
        bpy.ops.object.mode_set(mode='OBJECT')
    # ---- 体・足・うで（どの属性も同じ） ----
    def part(name, P, q, src, bone_, coll, sigma=2.0):
        v, f = mesh_of(P, q, sigma); c = colors_for(v, normals(v, f), src); return add_obj(name, v, f, c, bone_, arm, coll)
    part('body', sp0.solid['body'], Q, CREAM, 'body', common)
    part('leg.L', sp0.solid['legL'], Q, CREAM, 'leg.L', common)
    part('leg.R', sp0.solid['legR'], Q, CREAM, 'leg.R', common)
    A, Hn = sp0.arm[0]
    for k in (True, False):
        part('arm.'+sideN[k], f0[k](A), Q, CREAM, 'arm.'+sideN[k], common)
    # ---- 属性ごと（手・ずきん・顔・頭の上の物・しっぽ／はね） ----
    for el in ELS:
        sp = SPS[el]; co = bpy.data.collections.new(el); root.children.link(co)
        for k in (True, False):
            part('hand.%s_%s' % (sideN[k], el), f0[k](Hn), Q, sp.hand, 'hand.'+sideN[k], co)
        # ずきんと顔は1つの形にする（2まいの面がかさなると、顔のふちがやぶれて見える）。色は、顔の点が近ければ顔（顔はずきんの表面の絵）
        H = sp.tex['hood']; Fc = sp.tex.get('face')
        if Fc is None: part('head_'+el, H[0], QH, H, 'head', co, sigma=1.2)
        else:
            from scipy.spatial import cKDTree
            P = np.concatenate([H[0], Fc[0]]); v, f = mesh_of(P, QH, 1.2); n = normals(v, f)
            ch = colors_for(v, n, H); cf = colors_for(v, n, Fc)
            dh = cKDTree(H[0]).query(v)[0]; df = cKDTree(Fc[0]).query(v)[0]
            add_obj('head_'+el, v, f, np.where((df < dh+0.5)[:, None], cf, ch), 'head', arm, co)
        for nm, (P, C) in sp.tex.items():
            if nm in ('hood', 'face'): continue
            part('%s_%s' % (nm, el), P, QH, (P, C), '%s_%s' % (nm, el), co, sigma=1.0)
        for nm, val in sp.flat(0).items():
            P, C = val[0], val[1]
            if nm == 'tail': part('tail_'+el, P, Q, (P, C), 'tail', co, sigma=1.0)
            else:
                bn = '%s_%s' % (nm, el); part(bn, P, Q, (P, C), bn, co, sigma=1.0)
    os.makedirs(out, exist_ok=True)
    # glb：属性ごと（common とその属性だけ）
    for el in ELS:
        for o in bpy.data.objects: o.select_set(False)
        keep = set(common.objects) | set(bpy.data.collections[el].objects)
        for o in keep: o.select_set(True)
        bpy.ops.export_scene.gltf(filepath=os.path.join(out, 'spirit_%s.glb' % el), use_selection=True, export_skins=True, export_animations=False)
    for el in ELS[1:]:   # .blend：はじめは土だけ見せる
        bpy.context.view_layer.layer_collection.children[el].hide_viewport = True
    bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(os.path.join(out, 'spirit_rig.blend')))
    for o in bpy.data.objects:
        if o.type == 'MESH': print(o.name, len(o.data.vertices), [g.name for g in o.vertex_groups])
    print('bones', [b.name for b in ad.bones])

if __name__ == '__main__':
    build(sys.argv[1])
