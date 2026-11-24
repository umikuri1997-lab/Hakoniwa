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

def ball(name, c, r, m, seg=4, rot=None, subsurf=1):
    """だ円の玉：立方体をわって球にした形（クアッドスフィア。UV球の極のような、つぶれた所が出ない）"""
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=2.0)
    bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=seg, use_grid_fill=True)
    for v in bm.verts: v.co = v.co.normalized()
    S = Matrix.Diagonal((r[0], r[1], r[2], 1)); R = (rot or Matrix.Identity(3)).to_4x4()
    bmesh.ops.transform(bm, matrix=Matrix.Translation(c) @ R @ S, verts=bm.verts)
    return obj(name, bm, [m], subsurf)

def lathe(name, prof, depth, m, seg=32, gold=None, cap_top=True):
    """たての軸のまわりにまわした面（prof：[(z, 半径)]、おくは半径×depth）。gold：(z0, z1) の帯の面を金色に"""
    bm = bmesh.new(); rings = []
    for z, r in prof:
        rings.append([bm.verts.new((r*math.cos(2*math.pi*i/seg), r*depth*math.sin(2*math.pi*i/seg), z)) for i in range(seg)])
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

def tube(name, pts, rads, m, seg=12, gold_last=0, caps=True, zsc=None, subsurf=1):
    """点の列にそったつつ（rads：点ごとの半径）。gold_last：はしの何だんを金色に（そで口のふち）"""
    bm = bmesh.new(); rings = []; P = [Vector(p) for p in pts]
    for i, (p, r) in enumerate(zip(P, rads)):
        t = (P[min(i+1, len(P)-1)]-P[max(i-1, 0)]).normalized()
        u = t.cross(Vector((0, 0, 1))); u = u.normalized() if u.length > 1e-6 else Vector((1, 0, 0)); v = t.cross(u)
        zk = zsc[i] if zsc else 1.0   # その輪を、たてにのばす（たれたそで）
        rings.append([bm.verts.new(p+Matrix.Diagonal((1, 1, zk))@((u*math.cos(2*math.pi*k/seg)+v*math.sin(2*math.pi*k/seg))*r)) for k in range(seg)])
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

def arc(name, c, rad, thick, m):
    """とじた目（∩）：顔の面にそった、細い弧のつつ"""
    pts = []; n = 9
    for i in range(n):
        a = math.pi*(0.1+0.8*i/(n-1)); pts.append((c[0]+rad*math.cos(a), c[1], c[2]+rad*math.sin(a)))
    return tube(name, pts, [thick]*n, m, seg=8)

def build():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    # 服：上がせまく、すそが広がる台形（正面の絵のはば。そでが体のよこにかさなる）。すそに金色の帯（z 0.30〜0.42）
    lathe('robe', [(0.0, 1.30), (0.12, 1.33), (0.28, 1.33), (0.30, 1.33), (0.42, 1.32), (0.44, 1.32), (0.80, 1.29), (1.20, 1.22), (1.60, 1.12),
                   (2.00, 1.00), (2.30, 0.92), (2.60, 0.85), (2.85, 0.72), (3.05, 0.50), (3.15, 0.30)], 0.92, 'robe', gold=(0.29, 0.43))
    # えり：肩をおおう、はばの広いえり（z 2.45〜3.05）
    lathe('collar', [(2.42, 1.02), (2.50, 1.12), (2.65, 1.14), (2.82, 1.02), (2.97, 0.80), (3.06, 0.55)], 0.95, 'robe', cap_top=False)
    # うしろのフード：せなかの上にたれるV字の形と、そのふちの金色の線
    ball('hood', (0, 1.02, 2.45), (0.80, 0.26, 0.66), 'robe', rot=Matrix.Rotation(math.radians(-8), 3, 'X'))
    hp = [(0.78*math.sin(t), 1.22, 2.45+0.62*math.cos(t)) for t in [math.radians(a) for a in range(-110, 111, 10)]]
    tube('hood_trim', hp, [0.035]*len(hp), 'gold', seg=6, caps=False)
    # そで：かたから前へ下りる、大きくたれたそで。そで口はたてのだ円で、内がわに金色のふち
    for sx, nm in ((-1, 'sleeve_r'), (1, 'sleeve_l')):
        tube(nm, [(sx*0.92, 0.05, 2.62), (sx*1.02, -0.30, 2.20), (sx*0.82, -0.66, 1.72), (sx*0.50, -0.88, 1.50)],
             [0.32, 0.40, 0.50, 0.56], 'robe', seg=16, gold_last=1, zsc=[1, 1, 1.4, 1.6])
    ball('hands', (0, -1.10, 1.86), (0.24, 0.20, 0.22), 'skin')                               # 前であわせた手
    # つえ：体の前の地面から立つ柄（下は平ら）と、くびれのある、スプーンの形の頭
    tube('staff', [(0, -1.30, 0.0), (0, -1.30, 0.04), (0, -1.27, 1.2), (0, -1.24, 2.20), (0, -1.24, 2.26)], [0.10]*5, 'wood', seg=12, subsurf=0)
    ball('staff_top', (0, -1.24, 2.60), (0.34, 0.28, 0.40), 'wood')
    # 頭：まるい頭（あご z 3.12・てっぺん z 5.22）
    ball('head', (0, 0, 4.17), (1.17, 1.15, 1.05), 'skin', seg=6)
    for sx, s_ in ((-1, 'r'), (1, 'l')):
        ball('ear_'+s_, (sx*1.15, 0.08, 3.80), (0.22, 0.14, 0.26), 'skin')                       # 耳（頭に半分うめる）
        ball('brow_'+s_, (sx*0.60, -0.96, 4.38), (0.34, 0.15, 0.15), 'white', rot=Matrix.Rotation(math.radians(sx*-12), 3, 'Y'))
        arc('eye_'+s_, (sx*0.46, -1.04, 3.88), 0.12, 0.035, 'eye')
        ball('mus_'+s_, (sx*0.50, -1.08, 3.40), (0.60, 0.32, 0.30), 'white', rot=Matrix.Rotation(math.radians(sx*10), 3, 'Y'))   # 口ひげ（左右のふくらみ）
    ball('mus_c', (0, -1.20, 3.46), (0.34, 0.24, 0.24), 'white')
    torus('halo', (0, 0, 5.63), 0.90, 0.08, 'halo', seg=(40, 8))   # 天使の輪（頭の上に、うく）

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

if __name__ == '__main__':
    argv = sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else sys.argv[1:]
    build(); export()
    if '--check' in argv: check(argv[argv.index('--check')+1])
