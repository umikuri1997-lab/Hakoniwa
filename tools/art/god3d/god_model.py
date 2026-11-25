"""カミサマの3Dモデル（Blender）。キャラクターモデリングの手順：参考の絵（ref.jpg：正面・よこ・うしろ）をはかった寸法で、部品ごとに組み、サブディビジョンでなめらかにする。

  python3 tools/art/god3d/god_model.py [--check <フォルダ>]
    → tools/art/models/god/god.glb（iso3d.py で写す。furn3d/items/god.py）
    --check：正面・よこ・うしろを写して、参考の絵とならべた絵（<フォルダ>/check.png）を書く

単位：参考の絵の100ドット＝1。足もと＝z 0（参考の絵の y 630）。Blender の向き（x 右・−y 前・z 上）。カミサマは −y（正面）を向く（glTF の +z＝ゲームの南）。
参考の絵からはかった寸法（正面・よこ・うしろのシルエットと色）：
  頭：あご z 3.12・てっぺん z 5.22（たて2.1）。はば2.43（耳ぬき）・おく2.34。耳：外のはし ±1.48、z 3.72。
  まゆ：z 4.35・x ±0.6。目（とじた ∩）：z 3.9・x ±0.46。鼻：z 3.72。口ひげ：z 3.18〜3.68・はば2.25、顔から0.25前へ出る。
  服：すそのはば2.85（正面と、うしろの平均）・おくは、はばの0.92。かた・えり z 2.6〜3.1。すその金色の帯 z 0.30〜0.42。
  えり：首まわりの太い輪（z 3.0）。うしろはフード（z 2.75）。そで：かたから前へ下り、手（z 1.8）のところで、そで口（金色のふち）。
  つえ：体の前（y −1.27）。柄は地面から z 2.2。頭はスプーンの形（z 2.16〜3.0、はば0.64）。輪：z 5.63・半径0.9。
"""
import os, sys, math
import bpy, bmesh
from mathutils import Vector, Matrix

HERE = os.path.dirname(os.path.abspath(__file__)); ART = os.path.dirname(HERE)
OUT = os.path.join(ART, 'models', 'god', 'god.glb')

COL = {   # 参考の絵の色（明るくやわらかい色）
    'skin': (245, 215, 180), 'robe': (247, 238, 223), 'gold': (238, 206, 140), 'halo': (250, 226, 160),
    'wood': (173, 132, 97), 'white': (251, 247, 240), 'eye': (110, 80, 60)}

def srgb(c): return tuple(((v/255+0.055)/1.055)**2.4 if v/255 > 0.04045 else v/255/12.92 for v in c)+(1.0,)

def mat(name):
    m = bpy.data.materials.get(name)
    if m: return m
    m = bpy.data.materials.new(name); bsdf = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    bsdf.inputs['Base Color'].default_value = srgb(COL[name]); bsdf.inputs['Roughness'].default_value = 0.8
    m.diffuse_color = srgb(COL[name]); return m

def obj(name, bm, mats, subsurf=2, smooth=True):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    for m in mats: me.materials.append(mat(m))
    if smooth:
        for p in me.polygons: p.use_smooth = True
    ob = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(ob)
    if subsurf:
        md = ob.modifiers.new('subsurf', 'SUBSURF'); md.levels = subsurf; md.render_levels = subsurf
    return ob

def ball(name, c, r, m, seg=4, rot=None, subsurf=1, taper=0.0):
    """だ円の玉：立方体をわって球にした形（クアッドスフィア。UV球の極のような、つぶれた所が出ない）"""
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=2.0)
    bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=seg, use_grid_fill=True)
    for v in bm.verts:
        v.co = v.co.normalized()
        if taper and v.co.z < 0: v.co.x *= 1+v.co.z*taper   # 下ほど細く（V字の形）
    S = Matrix.Diagonal((r[0], r[1], r[2], 1)); R = (rot or Matrix.Identity(3)).to_4x4()
    bmesh.ops.transform(bm, matrix=Matrix.Translation(c) @ R @ S, verts=bm.verts)
    return obj(name, bm, [m], subsurf)

def lathe(name, prof, depth, m, seg=32, gold=None, cap_top=True, yoff=0.0):
    """たての軸のまわりにまわした面（prof：[(z, 半径)]、おくは半径×depth、まん中は y＋yoff）。gold：(z0, z1) の帯の面を金色に"""
    bm = bmesh.new(); rings = []
    for z, r in prof:
        rings.append([bm.verts.new((r*math.cos(2*math.pi*i/seg), yoff+r*depth*math.sin(2*math.pi*i/seg), z)) for i in range(seg)])
    for a, b in zip(rings, rings[1:]):
        for i in range(seg):
            bm.faces.new((a[i], a[(i+1) % seg], b[(i+1) % seg], b[i]))
    if cap_top: bm.faces.new(list(reversed(rings[-1])))
    bm.faces.new(rings[0])   # そこ
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    if gold:
        for f in bm.faces:
            zc = f.calc_center_median().z
            if gold[0] <= zc <= gold[1]: f.material_index = 1
    return obj(name, bm, [m, 'gold'] if gold else [m], 2)

def cloth(ob, th=0.04):
    """布のあつみ（ソリディファイ）。サブディビジョンでなめらかにしたあとに、あつみをつける"""
    md = ob.modifiers.new('solidify', 'SOLIDIFY'); md.thickness = th; md.offset = 0.0; md.use_even_offset = True
    return ob

def sheet(name, prof, depth, m, seg=40, yoff=0.0):
    """たての軸のまわりの、上もそこもあいた1まいの布（prof：[(z, 半径)]）"""
    bm = bmesh.new(); rings = [[bm.verts.new((r*math.cos(2*math.pi*i/seg), yoff+r*depth*math.sin(2*math.pi*i/seg), z)) for i in range(seg)] for z, r in prof]
    for a, b in zip(rings, rings[1:]):
        for i in range(seg): bm.faces.new((a[i], a[(i+1) % seg], b[(i+1) % seg], b[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return cloth(obj(name, bm, [m], 2))

def loft(name, rings_spec, m, seg=24, rim=None):
    """輪をつないだ布（rings_spec：[(まん中, よこの向き U, たての向き V, よこの半径, たての半径)]）。rim：さいごの輪にそうふちの部品の色"""
    bm = bmesh.new(); rings = []
    pU = None; spec = []
    for c, U, V, a, b in rings_spec:
        c, U, V = Vector(c), Vector(U).normalized(), Vector(V).normalized()
        if pU is not None and U.dot(pU) < 0: U = -U   # 輪の向きをそろえる（ねじれると面がつぶれる）
        pU = U; spec.append((c, U, V, a, b))
        rings.append([bm.verts.new(c+U*a*math.cos(2*math.pi*k/seg)+V*b*math.sin(2*math.pi*k/seg)) for k in range(seg)])
    for A, B in zip(rings, rings[1:]):
        for k in range(seg): bm.faces.new((A[k], A[(k+1) % seg], B[(k+1) % seg], B[k]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    ob = cloth(obj(name, bm, [m], 2))
    if rim:
        c, U, V, a, b = spec[-1]
        tube(name+'_rim', [tuple(c+U*a*1.0*math.cos(2*math.pi*k/40)+V*b*1.0*math.sin(2*math.pi*k/40)) for k in range(41)], [0.055]*41, rim, seg=6, caps=False)
    return ob

def tube(name, pts, rads, m, seg=12, gold_last=0, caps=True, zsc=None, subsurf=1, droop=None):
    """点の列にそったつつ（rads：点ごとの半径）。gold_last：はしの何だんを金色に（そで口のふち）"""
    bm = bmesh.new(); rings = []; P = [Vector(p) for p in pts]
    for i, (p, r) in enumerate(zip(P, rads)):
        t = (P[min(i+1, len(P)-1)]-P[max(i-1, 0)]).normalized()
        u = t.cross(Vector((0, 0, 1))); u = u.normalized() if u.length > 1e-6 else Vector((1, 0, 0)); v = t.cross(u)
        zk = zsc[i] if zsc else 1.0   # その輪を、たてにのばす
        dk = droop[i] if droop else 0.0   # 布の重さで、うでより下の所だけ、下へたれる（ベルスリーブ）
        ring = []
        for k in range(seg):
            o = Matrix.Diagonal((1, 1, zk))@((u*math.cos(2*math.pi*k/seg)+v*math.sin(2*math.pi*k/seg))*r)
            if o.z < 0: o.z *= 1+dk
            ring.append(bm.verts.new(p+o))
        rings.append(ring)
    for j, (a, b) in enumerate(zip(rings, rings[1:])):
        for k in range(seg):
            f = bm.faces.new((a[k], a[(k+1) % seg], b[(k+1) % seg], b[k]))
            if gold_last and j >= len(rings)-1-gold_last: f.material_index = 1
    if caps:
        bm.faces.new(list(reversed(rings[0]))); f = bm.faces.new(rings[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return obj(name, bm, [m, 'gold'] if gold_last else [m], subsurf)

def torus(name, c, R, r, m, rot=None, seg=(32, 12)):
    bm = bmesh.new(); rings = []
    for i in range(seg[0]):
        a = 2*math.pi*i/seg[0]; ca = Vector((math.cos(a), math.sin(a), 0))
        rings.append([bm.verts.new(ca*(R+r*math.cos(2*math.pi*k/seg[1]))+Vector((0, 0, r*math.sin(2*math.pi*k/seg[1])))) for k in range(seg[1])])
    for i in range(seg[0]):
        a, b = rings[i], rings[(i+1) % seg[0]]
        for k in range(seg[1]):
            bm.faces.new((a[k], b[k], b[(k+1) % seg[1]], a[(k+1) % seg[1]]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bmesh.ops.transform(bm, matrix=Matrix.Translation(c) @ (rot or Matrix.Identity(3)).to_4x4(), verts=bm.verts)
    return obj(name, bm, [m], 1)

def arc(name, c, rad, thick, m, face=None):
    """とじた目（∩）：顔の面にそった、細い弧のつつ（face(x, z)：その所の顔の面の y）"""
    pts = []; n = 11
    for i in range(n):
        a = math.pi*(0.1+0.8*i/(n-1)); x, z = c[0]+rad*math.cos(a), c[2]+rad*math.sin(a); pts.append((x, face(x, z) if face else c[1], z))
    return tube(name, pts, [thick]*n, m, seg=8)

def join(name, obs, voxel=0.03):
    """部品をかさねた形を、1つの体にする（ボクセルリメッシュ：かさなった所がつながった、1まいの面になる）"""
    for o in obs: o.modifiers.clear()
    with bpy.context.temp_override(active_object=obs[0], object=obs[0], selected_objects=obs, selected_editable_objects=obs):
        assert bpy.ops.object.join() == {'FINISHED'}
    ob = obs[0]; ob.name = name; ob.data.name = name
    md = ob.modifiers.new('remesh', 'REMESH'); md.mode = 'VOXEL'; md.voxel_size = voxel; md.use_smooth_shade = True
    dm = ob.modifiers.new('decimate', 'DECIMATE'); dm.ratio = 0.5   # 面の数をへらす（写すのが重くならないように）
    return ob

def build():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    # 服（ほんとうの服の作り。どの布もあつみ0.04、体から少しはなしてかさねる）
    # 1 長い服（ローブ）：えりぐり（首のまわり z 3.0）から足もとまでの1まいの布。三面図のはば：すそ±1.36・前−0.85／うしろ＋1.12（まん中がうしろへ）。すそは z 0.12
    RP = [(0.12, 1.36), (0.60, 1.35), (1.00, 1.26), (1.50, 1.22), (1.90, 1.10), (2.20, 0.98), (2.50, 0.88), (2.75, 0.72), (2.92, 0.56), (3.00, 0.47)]
    sheet('robe', RP, 0.78, 'robe', yoff=0.10)
    for z0, z1 in ((0.12, 0.20), (0.34, 0.42)):   # すその金色の細い帯2本（すそのふちと、その少し上）。ローブの外がわにぬいつける
        sheet('hem_band_%d' % int(z0*100), [(z0, 1.375), (z1, 1.372)], 0.78, 'gold', yoff=0.10)
    # 2 フードつきのケープ（肩かけ）：肩をおおう短いケープと、首のまわりにもり上がるまるいえり（首の前でとめる）、せなかにたれたフード
    sheet('cape', [(2.30, 0.97), (2.48, 1.00), (2.66, 0.98), (2.84, 0.88), (2.98, 0.72), (3.06, 0.60)], 0.95, 'robe', yoff=0.08)
    torus('collar', (0, 0.04, 3.06), 0.62, 0.20, 'robe', seg=(36, 12))   # えり：フードのつけねの、まるくもり上がった所
    ball('hood', (0, 0.86, 2.55), (1.25, 0.28, 0.60), 'robe', taper=0.85)   # かぶらずに、せなかにたれたフード（下がとがったV字。かたはばいっぱい）
    hp = []
    for z in [3.05-0.07*i for i in range(15)]:   # フードの口のふち（金色）：うしろから、V字に見える。フードの面の上
        q = (z-2.55)/0.60; w = math.sqrt(max(0.0, 1-q*q))*(1+min(q, 0)*0.85); hp.append((-1.08*w, 1.01, z))
    hp = hp+[(-x, y, z) for x, y, z in reversed(hp[:-1])]
    tube('hood_trim', hp, [0.035]*len(hp), 'gold', seg=6, caps=False)
    # 3 そで：ローブのそでぐり（かた）から、前でたてにひらくそで口へ、布がふくらんでつながるベルスリーブ。うではひじで曲げて、そで口から出た手を前であわせる。
    #   そで口は、手の高さから下へ、たてに長くひらく（布の重さでたれる）。そで口のふちが金色で、正面からは、たての線に見える
    for sx, nm in ((-1, 'sleeve_r'), (1, 'sleeve_l')):
        SP = [(sx*0.66, 0.02, 2.58), (sx*0.78, -0.22, 2.22), (sx*0.84, -0.52, 1.86), (sx*0.62, -0.76, 1.66), (sx*0.42, -0.88, 1.60)]   # そでのまん中の線（かた→ひじ→そで口）
        SA = [0.28, 0.40, 0.42, 0.34, 0.26]; SB = [0.28, 0.46, 0.56, 0.60, 0.62]   # 輪のよこ・たての半径（下へたれて、たてに長いそで口）
        bm = bmesh.new(); rings = []; P = [Vector(p) for p in SP]; seg = 24
        for k_, p_ in enumerate(P):
            t = (P[min(k_+1, len(P)-1)]-P[max(k_-1, 0)]).normalized(); u = t.cross(Vector((0, 0, 1))).normalized(); v = u.cross(t).normalized()
            if v.z < 0: v = -v
            rings.append([bm.verts.new(p_+u*SA[k_]*math.cos(2*math.pi*q/seg)+v*SB[k_]*math.sin(2*math.pi*q/seg)) for q in range(seg)])
            if k_ == len(P)-1: rim = [tuple(p_+u*SA[k_]*math.cos(2*math.pi*q/40)+v*SB[k_]*math.sin(2*math.pi*q/40)) for q in range(41)]
        for A, B in zip(rings, rings[1:]):
            for q in range(seg): bm.faces.new((A[q], A[(q+1) % seg], B[(q+1) % seg], B[q]))
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        ob = obj(nm, bm, ['robe'], 2); md = ob.modifiers.new('solidify', 'SOLIDIFY'); md.thickness = 0.04; md.offset = 0.0   # 布のあつみ
        tube(nm+'_rim', rim, [0.05]*41, 'gold', seg=6, caps=False)   # そで口のふち（金色）
    # つえ：体の前の地面から立つ柄（下は平ら）と、くびれのある、スプーンの形の頭
    tube('staff', [(0, -1.02, 0.0), (0, -1.02, 0.04), (0, -1.0, 1.2), (0, -1.04, 2.20), (0, -1.05, 2.26)], [0.10]*5, 'wood', seg=12, subsurf=0)
    ball('staff_top', (0, -1.05, 2.62), (0.40, 0.36, 0.46), 'wood')
    # 体（ベースの体）：頭・首・どう体・あし・うで・手・耳をかさねて、ボクセルリメッシュで1つの体にする。首で頭と体がつながり、うではそでの中をとおって手につながる
    B = [ball('head', (0, 0.04, 4.10), (1.20, 1.19, 1.12), 'skin', seg=6),                       # 頭（あご z 2.98・てっぺん z 5.22・はば2.48）
         tube('neck', [(0, 0, 2.70), (0, 0, 3.55)], [0.42, 0.42], 'skin'),                       # 首
         ball('torso', (0, 0, 1.75), (0.80, 0.62, 1.15), 'skin'),                                # どう体（服の中）
         tube('leg_r', [(-0.34, 0, 0.25), (-0.34, 0, 1.0)], [0.28, 0.28], 'skin'), tube('leg_l', [(0.34, 0, 0.25), (0.34, 0, 1.0)], [0.28, 0.28], 'skin'),
         ball('hands', (0, -0.98, 1.94), (0.24, 0.20, 0.22), 'skin')]                            # 前であわせた手
    for sx, s_ in ((-1, 'r'), (1, 'l')):
        B.append(tube('arm_'+s_, [(sx*0.70, 0, 2.58), (sx*0.88, -0.32, 2.12), (sx*0.60, -0.70, 1.92), (sx*0.12, -0.97, 1.94)], [0.20, 0.17, 0.15, 0.14], 'skin'))   # かた→ひじ→手くび→手
        B.append(ball('ear_'+s_, (sx*1.25, 0.08, 3.78), (0.23, 0.14, 0.26), 'skin'))            # 耳
    join('body', B)
    # 顔：まゆ・目・口ひげは、顔の面にはりつける（面の高さに合わせて、半分うめる）
    for sx, s_ in ((-1, 'r'), (1, 'l')):
        ball('brow_'+s_, (sx*0.58, -0.95, 4.14), (0.32, 0.14, 0.20), 'white', rot=Matrix.Rotation(math.radians(sx*-6), 3, 'Y'))
        arc('eye_'+s_, (sx*0.46, 0, 3.86), 0.17, 0.075, 'eye', face=lambda x, z: 0.04-1.19*math.sqrt(max(0.0, 1-(x/1.20)**2-((z-4.10)/1.12)**2))+0.02)   # 目（参考の絵の大きさ）
        ball('mus_'+s_, (sx*0.76, -0.95, 3.42), (0.55, 0.38, 0.30), 'white', rot=Matrix.Rotation(math.radians(sx*10), 3, 'Y'))   # 口ひげ（左右のふくらみ）
    ball('mus_c', (0, -1.08, 3.46), (0.42, 0.30, 0.25), 'white')
    torus('halo', (0, 0.18, 5.63), 0.90, 0.08, 'halo', seg=(40, 8))   # 天使の輪（頭の上に、うく）

def export():
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', export_apply=True, export_yup=True, export_materials='EXPORT')
    tris = 0; dg = bpy.context.evaluated_depsgraph_get()
    for ob in bpy.data.objects:
        if ob.type == 'MESH':
            e = ob.evaluated_get(dg); me = e.to_mesh(); me.calc_loop_triangles(); tris += len(me.loop_triangles); e.to_mesh_clear()
    print('glb', OUT, os.path.getsize(OUT), 'bytes', 'objects', len([o for o in bpy.data.objects if o.type == 'MESH']), 'tris', tris)

def check(od):
    """正面・よこ（左を向く）・うしろを、平行投影・材質の色で写して、参考の絵の同じ向きとならべる"""
    os.makedirs(od, exist_ok=True); sc = bpy.context.scene
    sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = 16; sc.render.film_transparent = True   # GPU がない所でも写せる
    sun = bpy.data.objects.new('sun', bpy.data.lights.new('sun', 'SUN')); sun.data.energy = 2.0; sun.rotation_euler = (math.radians(40), 0, math.radians(-30)); sc.collection.objects.link(sun)
    w = bpy.data.worlds.new('w'); sc.world = w; bg = next(n for n in w.node_tree.nodes if n.type == 'BACKGROUND'); bg.inputs['Strength'].default_value = 1.6
    sc.render.resolution_x, sc.render.resolution_y = 310, 637   # 1ドット＝0.01（参考の絵と同じ）
    cam = bpy.data.cameras.new('cam'); cam.type = 'ORTHO'; cam.ortho_scale = 6.37*1.0   # 参考の絵の1つの絵のたて（y 0〜637）
    co = bpy.data.objects.new('cam', cam); sc.collection.objects.link(co); sc.camera = co
    shots = {'front': ((0, -20, 3.115), (math.radians(90), 0, 0)), 'side': ((20, 0, 3.115), (math.radians(90), 0, math.radians(90))),
             'back': ((0, 20, 3.115), (math.radians(90), 0, math.radians(180)))}
    for o in bpy.data.objects:
        if o.type == 'MESH': o.visible_shadow = False   # たしかめの絵は、かげを落とさない（輪のかげが頭にみぞのように出る）
    for k, (loc, rot) in shots.items():
        co.location = loc; co.rotation_euler = rot; sc.render.filepath = os.path.join(od, k+'.png'); bpy.ops.render.render(write_still=True)
    from PIL import Image
    ref = Image.open(os.path.join(HERE, 'ref.jpg')).convert('RGBA'); CX = {'front': 232, 'side': 597, 'back': 971}   # 参考の絵の、それぞれの絵の体のまん中
    sheet = Image.new('RGBA', (310*3, 637*3), (255, 255, 255, 255))
    for i, k in enumerate(('front', 'side', 'back')):
        r = ref.crop((CX[k]-155, 0, CX[k]+155, 637)); im = Image.open(os.path.join(od, k+'.png')).convert('RGBA')
        bgc = Image.new('RGBA', im.size, (200, 218, 180, 255)); bgc.alpha_composite(im)
        sheet.paste(r, (i*310, 0)); sheet.paste(bgc, (i*310, 637)); sheet.paste(Image.blend(r, bgc, 0.5), (i*310, 1274))
    sheet.save(os.path.join(od, 'check.png'))   # 上：参考の絵・まん中：モデル・下：かさねた絵

CLS = {'skin': 'skin', 'robe': 'light', 'white': 'light', 'gold': 'gold', 'halo': 'gold', 'wood': 'wood', 'eye': 'dark'}
REFPAL = [('skin', (240, 208, 176)), ('skin', (240, 216, 176)), ('light', (240, 232, 216)), ('light', (248, 240, 232)), ('light', (248, 240, 224)),
          ('gold', (248, 224, 160)), ('gold', (240, 208, 152)), ('wood', (168, 128, 96)), ('dark', (152, 136, 112)), ('dark', (110, 80, 60))]   # 参考の絵の、多い色
def ref_class(a):
    """参考の絵のドットを、いちばん近い多い色の種類にわける（はだ・服とひげの白・金色・木・こい線）"""
    fg = np.abs(a.astype(int)-a[5, 5].astype(int)).sum(-1) > 40
    d = np.stack([np.abs(a.astype(int)-np.array(c)).sum(-1) for _, c in REFPAL]); out = np.array([n for n, _ in REFPAL], object)[d.argmin(0)]
    out[~fg] = ''; return out

def fit(od):
    """三面図に合わせるための数字：正面・よこ・うしろを、材質の色そのまま（光なし）で写し、参考の絵と、色の種類ごとに、行ごとの左右のはしをくらべる"""
    global np
    import numpy as np
    from PIL import Image
    sc = bpy.context.scene; sc.view_settings.view_transform = 'Standard'; sc.cycles.samples = 1; sc.render.filter_size = 0.01
    for m in bpy.data.materials:   # 光なしの色（エミッション）
        nt = m.node_tree; out_ = next(n for n in nt.nodes if n.type == 'OUTPUT_MATERIAL'); em = nt.nodes.new('ShaderNodeEmission')
        em.inputs['Color'].default_value = srgb(COL[m.name]); nt.links.new(em.outputs[0], out_.inputs['Surface'])
    sc.world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.0
    for o in list(bpy.data.objects):
        if o.type == 'LIGHT': bpy.data.objects.remove(o)
    co = sc.camera; shots = {'front': ((0, -20, 3.115), (math.radians(90), 0, 0)), 'side': ((20, 0, 3.115), (math.radians(90), 0, math.radians(90))),
                             'back': ((0, 20, 3.115), (math.radians(90), 0, math.radians(180)))}
    ref = np.array(Image.open(os.path.join(HERE, 'ref.jpg')).convert('RGB')); CX = {'front': 232, 'side': 597, 'back': 971}
    pal = {k: np.array(v) for k, v in COL.items()}
    for k, (loc, rot) in shots.items():
        co.location = loc; co.rotation_euler = rot; sc.render.filepath = os.path.join(od, 'fit_'+k+'.png'); bpy.ops.render.render(write_still=True)
        m = np.array(Image.open(sc.render.filepath).convert('RGBA')).astype(int)
        names = list(pal); d = np.stack([np.abs(m[..., :3]-pal[n]).sum(-1) for n in names]); mc = np.array([CLS[n] for n in names], object)[d.argmin(0)]
        mc[m[..., 3] < 128] = ''
        rc = ref_class(ref[:, CX[k]-155:CX[k]+155])
        from scipy.ndimage import binary_erosion
        def clean(c, cl): return binary_erosion((c != '') if cl == 'all' else (c == cl), np.ones((3, 3)))   # ふちのまざった色の点は、数えない
        print('=== '+k+'（行：参考の絵の y。数字はドット。−は左へ・＋は右へ。モデル−参考）')
        for cl in ('all', 'skin', 'light', 'gold', 'wood'):
            A = clean(rc, cl); Bm = clean(mc, cl); rows = []
            for y0 in range(0, 637, 16):
                ra = A[y0:y0+16].any(0); ma = Bm[y0:y0+16].any(0)
                if not ra.any() and not ma.any(): continue
                if ra.sum() < 3 and ma.sum() < 3: continue
                if not ra.any(): rows.append('%d:モデルだけ[%d,%d]' % (y0, np.nonzero(ma)[0].min(), np.nonzero(ma)[0].max())); continue
                if not ma.any(): rows.append('%d:参考だけ[%d,%d]' % (y0, np.nonzero(ra)[0].min(), np.nonzero(ra)[0].max())); continue
                rl, rr = np.nonzero(ra)[0][[0, -1]]; ml, mr = np.nonzero(ma)[0][[0, -1]]
                if abs(ml-rl) > 4 or abs(mr-rr) > 4: rows.append('%d:左%+d右%+d(参考%d〜%d)' % (y0, ml-rl, mr-rr, rl, rr))
            print(' ', cl, ' '.join(rows) if rows else 'ずれなし')

if __name__ == '__main__':
    argv = sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else sys.argv[1:]
    build(); export()
    if '--check' in argv: check(argv[argv.index('--check')+1])
    if '--fit' in argv:
        if '--check' not in argv: check(argv[argv.index('--fit')+1])
        fit(argv[argv.index('--fit')+1])
