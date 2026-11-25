"""せいれいのキャラクターモデル（Blender で持ち主が直すための、ふつうの作り方のモデル）。
  python3 tools/art/spirit3d/model_blend.py <出すフォルダ>
出す物：spirit_model.blend・spirit_<属性>.glb・下絵 ref_front.png / ref_side.png。
作り方（ボックスモデリング）：
  体：1つのメッシュ。胴とあたまは、四角ポリゴンの輪（24の点）をつみ、上下は 6×6 のグリッドでふさぐ（立方体にループカットを入れて、点を下絵の形に合わせたのと同じ形）。
      うで：胴の横の 2×2 の面を押し出し（かた・ひじ・手首・手）、足：底の 2×2 の面を押し出す。左右はミラー・なめらかさはサブディビジョン（どちらも適用しない）。
  ずきん：属性ごとのべつのオブジェクト（輪をつんだ形・顔の所をあけ、ソリディファイで厚み）。頭の上の物・しっぽ（風ははね）も属性ごと。
  目・ほっぺ：べつのメッシュ（顔の面にのせた、うすいだ円の玉）。
  色：マテリアル（体・手・ずきん・目・ほっぺ。手・ずきん・目・ほっぺは属性ごと）。
  骨：人型（root・hips・spine・neck・head・shoulder・upper_arm・forearm・hand・thigh・shin・foot・tail・hood_tip）。体は自動の重み。
寸法は、いまのチップの正面・横の絵からはかった数（1ドット＝1cm）。Blender の正面（−Y）を向く。.L は Blender の +X。"""
import math, os, sys
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from core import ELS, Spirit, chip, TAILBASE, TAILBACK, TAILTWIST, WINGS, K, SH, ABD, rx, rz, hx, SPC
import bpy, bmesh
from mathutils import Vector

S = 0.01
COLS = {  # js/draw-spirits.js の SPART と同じ色
    'earth': {'hood': '#8f6a50', 'cheek': '#c6b1a0', 'eye': '#5e3d2a'}, 'water': {'hood': '#78c3fb', 'cheek': '#badef5', 'eye': '#1d4f7c'},
    'fire': {'hood': '#e8604f', 'cheek': '#f2ac9f', 'eye': '#8f3a22'}, 'wind': {'hood': '#a6cc8a', 'cheek': '#d2e2bc', 'eye': '#456a2a'},
    'wood': {'hood': '#6fae4c', 'cheek': '#b6d39e', 'eye': '#3f5e26'}}
CREAM = '#fdf8ef'

def prof(k, step=1.0):
    """チップの絵の、高さ z ごとの (左, 右)。正面の絵は x、横の絵は前うしろ（+ が前）"""
    a, ax, ay = chip(k); m = a[..., 3] > 0; out = {}
    for r in range(a.shape[0]):
        c = np.nonzero(m[r])[0]
        if len(c): out[-(ay+r+.5)] = (ax+c[0], ax+c[-1]+1)
    zs = np.array(sorted(out)); L = np.array([out[z][0] for z in zs]); R = np.array([out[z][1] for z in zs])
    return lambda z: (float(np.interp(z, zs, L)), float(np.interp(z, zs, R))), zs.min(), zs.max()

def ring_pts(n, a, b, cx=0.0, cy=0.0, p=2.4, bf=None):
    """角を 225度から、n こ（4 の倍数）。少し四角よりのだ円（p）。キャラの前は +y。bf：前の半分だけべつの半径"""
    out = []
    for i in range(n):
        t = math.radians(225+360*i/n); c, s = math.cos(t), math.sin(t)
        bb = bf if (bf is not None and s > 0) else b
        out.append((cx+a*np.sign(c)*abs(c)**(2/p), cy+bb*np.sign(s)*abs(s)**(2/p)))
    return out

def B(x, y, z):   # キャラの座標（ドット・前 +y）→ Blender（m・前 −Y）。左右はミラーで作るので x はそのまま
    return Vector((x*S, -y*S, z*S))

def cap(bm, ring, center, up):
    """n=4m の輪を、m×m の四角のグリッドでふさぐ（グリッドフィル）。up：ふたを少しふくらませる向き"""
    n = len(ring); m = n//4
    P = np.array([v.co[:] for v in ring]); c = np.array(center[:])
    # 4つの辺（角から角）：下 0..m・右 m..2m・上 2m..3m（逆）・左 3m..4m（逆）
    side = lambda k: [P[(k*m+i) % n] for i in range(m+1)]
    bot, rgt, top, lft = side(0), side(1), side(2)[::-1], side(3)[::-1]
    G = {}
    for i in range(m+1):
        for j in range(m+1):
            u, v = i/m, j/m
            if j == 0: G[i, j] = ring[i % n]; continue
            if i == m: G[i, j] = ring[(m+j) % n]; continue
            if j == m: G[i, j] = ring[(3*m-i) % n]; continue
            if i == 0: G[i, j] = ring[(4*m-j) % n]; continue
            q = (1-v)*bot[i]+v*top[i]+(1-u)*lft[j]+u*rgt[j]-((1-u)*(1-v)*bot[0]+u*(1-v)*bot[m]+(1-u)*v*top[0]+u*v*top[m])
            d = min(u, 1-u, v, 1-v)*2; q = q+np.array(up[:])*d*1.0
            G[i, j] = bm.verts.new(q)
    faces = {}
    for i in range(m):
        for j in range(m):
            faces[i, j] = bm.faces.new((G[i, j], G[i+1, j], G[i+1, j+1], G[i, j+1]))
    return faces, G

def loft(bm, rings, close_bottom=None, close_top=None):
    """輪（Blender の点のリスト）をつないだ筒"""
    V = [[bm.verts.new(p) for p in r] for r in rings]; n = len(rings[0])
    for a, b in zip(V, V[1:]):
        for i in range(n): bm.faces.new((a[i], a[(i+1) % n], b[(i+1) % n], b[i]))
    return V

def extrude_limb(bm, faces, rings):
    """面のまとまりを押し出して、輪ごとに、まわりの点を円に・まん中の点を軸に合わせる（ボックスモデリングの押し出し）。
    rings：[(中心, 半径a, 半径b, 軸の向き, 横の向き)]。さいごに先を閉じる"""
    prev = list(faces)
    for k, (c, ra, rb, ax, sd) in enumerate(rings):
        r = bmesh.ops.extrude_face_region(bm, geom=prev)
        cur = [e for e in r['geom'] if isinstance(e, bmesh.types.BMFace)]
        bmesh.ops.delete(bm, geom=[f for f in prev if f.is_valid], context='FACES')
        cs = set(cur); vs = {v for f in cur for v in f.verts}
        edge = [v for v in vs if any(any(g not in cs for g in e.link_faces) for e in v.link_edges)]
        inner = [v for v in vs if v not in edge]
        ax = Vector(ax).normalized(); sd = Vector(sd).normalized(); fw = ax.cross(sd).normalized()
        cen = sum((v.co for v in edge), Vector())/len(edge)
        for v in edge:
            d = v.co-cen; d = d-ax*d.dot(ax); t = math.atan2(d.dot(fw), d.dot(sd))
            v.co = Vector(c)+sd*(ra*math.cos(t))+fw*(rb*math.sin(t))
        last = k == len(rings)-1
        for v in inner:
            v.co = Vector(c)+ax*((0.2 if last else 0.0)*max(ra, rb))
        prev = cur
    return cur

def mat(name, hexc):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name); c = hx(hexc)
    m.diffuse_color = (*[(v/255)**2.2 for v in c], 1); nt = m.node_tree
    if nt is None: m.use_nodes = True; nt = m.node_tree
    bs = nt.nodes.get('Principled BSDF')
    if bs: bs.inputs['Base Color'].default_value = m.diffuse_color; bs.inputs['Roughness'].default_value = 0.85
    return m

# ---------------- 体 ----------------
def build_body():
    fb, *_ = prof('sp:body0'); sb, *_ = prof('sp:bodyS0'); fh, _, hz1 = prof('sp:head'); shp, *_ = prof('sp:headS')
    N = 24
    def r_body(z):
        l, r = fb(z); bl, br = sb(z); return (r-l)/2, (br-bl)/2, (bl+br)/2
    def r_head(z):
        l, r = fh(z); bl, br = shp(z); cy = (bl+br)/2; return (r-l)/2*0.95, (br-bl)/2*0.95, cy, br-3-cy   # 横は、ずきんの中に入るよう少し小さく・前（顔）は横の絵の前のはしまで
    Z = [7.5, 9.5, 13, 17, 19.5, 22.6, 25.5, 27.5]          # 胴（かた 22.6 の上下に輪をおく：うでを押し出す所）
    rings = []
    for z in Z:
        a, b, cy = r_body(z)
        if z <= 9.5: a, b = a*(0.88 if z < 8 else 0.97), b*(0.88 if z < 8 else 0.97)
        rings.append([B(x, y, z) for x, y in ring_pts(N, a, b, 0, cy)])
    rings.append([B(x, y, 29.5) for x, y in ring_pts(N, 11, 9, 0, 1, 2.0)])   # くび
    for z in (31.5, 34, 38, 43, 48, 53, 57, 60.5):         # あたま
        a, b, cy, bf = r_head(z); rings.append([B(x, y, z) for x, y in ring_pts(N, a, b, 0, cy, 2.1, bf)])
    bm = bmesh.new(); V = loft(bm, rings)
    top, _ = cap(bm, V[-1], sum((v.co for v in V[-1]), Vector())/N+Vector((0, 0, .02)), Vector((0, 0, 0.035)))
    bot, _ = cap(bm, V[0][::-1], sum((v.co for v in V[0]), Vector())/N-Vector((0, 0, .005)), Vector((0, 0, -0.01)))
    bm.normal_update()
    # 足：底の 6×6 のグリッドの、外がわ2列 × まん中2行（2×2）を押し出す（グリッドの番号でえらぶ）
    cxy = {k: f.calc_center_median() for k, f in bot.items()}
    ix = abs(cxy[5, 2].x-cxy[0, 2].x) > abs(cxy[5, 2].y-cxy[0, 2].y)   # 1つめの番号が x の向きか
    def block(side):
        out = []
        for (i, j), f in bot.items():
            cx, cy_ = (i, j) if ix else (j, i)
            if cy_ in (2, 3) and cx in ((4, 5) if side*(cxy[5, 2] if ix else cxy[2, 5]).x > 0 else (0, 1)): out.append(f)
        return out
    blocks = {side: block(side) for side in (1, -1)}
    fl, _, _ = prof('sp:footR'); sf, *_ = prof('sp:footS')
    for side in (1, -1):
        blk = blocks[side]
        R = []
        for z in (5.5, 3, 1.2):
            l, r = fl(z); bl, br = sf(z); a = (r-l)/2; b = (br-bl)/2
            R.append((B(side*8.6, (bl+br)/2, z), a*0.82*S, b*S, (0, 0, -1), (side, 0, 0)))
        extrude_limb(bm, blk, R)
    # うで：かたの輪（22.6）のすぐ上・下の、横の 2×2 の面を押し出す
    bm.faces.ensure_lookup_table()
    th = ABD[0]
    for side in (1, -1):
        Sp = np.array([side*SH[0], 0, SH[1]])
        F = [f for f in bm.faces if side*f.calc_center_median().x > 0.10 and abs(f.normal.y) < 0.5 and 0.19 < f.calc_center_median().z < 0.262 and abs(f.normal.z) < 0.5]
        F = sorted(F, key=lambda f: abs(f.calc_center_median().y))[:4]
        d = np.array([side*math.sin(th), 0, -math.cos(th)])          # まっすぐたらしたうでを外へ開いた向き
        sdv = np.cross(d, [0, 1, 0]); sdv = sdv/np.linalg.norm(sdv)
        R = []
        for u, ra in ((4, 4.4), (8, 4.0), (11.2, 3.4), (12.6, 4.3), (15.0, 4.2), (16.6, 3.2)):
            c = Sp+d*u; R.append((B(*c), ra*S, ra*S, B(*d)-B(0, 0, 0), B(*sdv)-B(0, 0, 0)))
        extrude_limb(bm, F, R)
    bm.normal_update(); bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new('body'); bm.to_mesh(me); bm.free()
    return me

def assign_body_mats(ob, mats):
    me = ob.data
    for m in mats: me.materials.append(m)
    for p in me.polygons:
        c = p.center
        d = Vector((math.sin(ABD[0])*np.sign(c.x), 0, -math.cos(ABD[0]))); u = (c-Vector((np.sign(c.x)*SH[0]*S, 0, SH[1]*S))).dot(d)/S
        hand = abs(c.x) > 0.17 and u > 11.6   # 手首より先
        foot = c.z < 0.075 and abs(c.x) > 0.02
        p.material_index = 1 if hand else 2 if foot else 0

# ---------------- ずきん ----------------
def build_hood(el):
    fp, z0, z1 = prof('sp_%s:hood' % el); sp_, *_ = prof('sp_%s:hoodS' % el)
    N = 32; zs = list(np.linspace(25.5, z1-1.2, 14))   # すそ：絵の下のはし（顔の丸にかくれて細くなる所）より上で、ひらいたまま
    rings = []
    for z in zs:
        l, r = fp(z); bl, br = sp_(z); a = (r-l)/2; b = (br-bl)/2
        rings.append([B(x, y, z) for x, y in ring_pts(N, a, b, (l+r)/2*0, (bl+br)/2, 2.0)])
    for k, r in enumerate(rings[:3]):   # すそ：うしろを下へのばす（せなかにかかる）
        for i, q in enumerate(r):
            t = max(0.0, q.y/S)/max(1e-6, max(p.y/S for p in r)); q.z -= (4.0-1.3*k)*S*t
    bm = bmesh.new(); V = loft(bm, rings)
    cap(bm, V[-1], sum((v.co for v in V[-1]), Vector())/N, Vector((0, 0, 0.02)))
    bm.normal_update(); bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    # 顔の所をあける：前を向いた面で、正面から見て顔の円（sp:head の形）の中
    fh, hz0, hz1 = prof('sp:head'); cz = (hz0+hz1)/2+1
    kill = [f for f in bm.faces if f.normal.y < -0.1 and (f.calc_center_median().x/S)**2/25**2+((f.calc_center_median().z/S-cz)/21.5)**2 < 1]
    bmesh.ops.delete(bm, geom=kill, context='FACES')
    # 顔の穴のふち：ふちの点を、正面から見た だ円の上へよせる（面の中心でえらんだ段々を、なめらかに）
    for v in bm.verts:
        if v.is_boundary and v.co.y < 0 and v.co.z > 26*S:
            x, z = v.co.x/S, v.co.z/S-cz; r = math.hypot(x/25, z/21.5)
            if 0.6 < r < 1.6: v.co.x, v.co.z = x/r*S, (cz+z/r)*S
    rim = [v for v in bm.verts if v.is_boundary and v.co.y < 0 and v.co.z > 26*S]
    for _ in range(4):   # ふちの前うしろ（y）を、となりの点となめらかに
        ny = {v: sum(e.other_vert(v).co.y for e in v.link_edges if e.is_boundary)/max(1, sum(1 for e in v.link_edges if e.is_boundary)) for v in rim}
        for v in rim: v.co.y = 0.5*v.co.y+0.5*ny[v]
    me = bpy.data.meshes.new('hood_'+el); bm.to_mesh(me); bm.free(); return me

def build_plate_loft(k, kS, thick=None, n=8):
    """頭の上の物など：正面の絵（x）と横の絵（y）の、高さごとのはばの輪をつむ（ロフト）"""
    fp, z0, z1 = prof(k); sp_ = prof(kS)[0] if kS else None
    zs = np.linspace(z0+.5, z1-.5, max(4, int((z1-z0)/2.5)))
    rings = []
    for z in zs:
        l, r = fp(z)
        if sp_: bl, br = sp_(z)
        else: bl, br = -thick/2, thick/2
        rings.append([B(x, y, z) for x, y in ring_pts(n, max(.4, (r-l)/2), max(.4, (br-bl)/2), (l+r)/2, (bl+br)/2, 2.0)])
    bm = bmesh.new(); V = loft(bm, rings)
    for Rv, up in ((V[-1], Vector((0, 0, .004))), (V[0][::-1], Vector((0, 0, -.004)))):
        cap(bm, Rv, sum((v.co for v in Rv), Vector())/n, up)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm

def cutout(k, thick, down=0.0):
    """絵の形（輪郭をなめらかにした線）を、うすい板にする（カーブを押し出したのと同じ）。点はチップの座標 (x, 0, z)"""
    from skimage import measure
    a, ax, ay = chip(k); U = 4; m = np.pad(a[..., 3] > 0, 2).repeat(U, 0).repeat(U, 1).astype(float)
    from scipy import ndimage
    m = ndimage.gaussian_filter(m, 0.8*U)
    cs = measure.find_contours(m, 0.5); c = max(cs, key=len)/U
    c = measure.approximate_polygon(c, 0.12)[:-1]
    bm = bmesh.new(); vs = [bm.verts.new((ax+(q[1]-2)+.5, -thick/2, -(ay+(q[0]-2)+.5)-down)) for q in c]
    edges = [bm.edges.new((vs[i], vs[(i+1) % len(vs)])) for i in range(len(vs))]
    bmesh.ops.triangle_fill(bm, edges=edges, use_beauty=True)
    f = [f for f in bm.faces]; r = bmesh.ops.extrude_face_region(bm, geom=f)
    for v in [e for e in r['geom'] if isinstance(e, bmesh.types.BMVert)]: v.co.y += thick
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm

def place(bm, f):
    for v in bm.verts: v.co = Vector(f(np.array(v.co[:])))
    for v in bm.verts: v.co *= S
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm

def bm_to_obj(bm, name, coll, m=None, smooth=True):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free(); ob = bpy.data.objects.new(name, me); coll.objects.link(ob)
    if m: me.materials.append(m)
    for p in me.polygons: p.use_smooth = smooth
    return ob

def ellipsoid(name, c, r, coll, m, rot=None):
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=8, radius=1.0)
    for v in bm.verts: v.co = Vector((v.co.x*r[0], v.co.y*r[1], v.co.z*r[2]))
    if rot is not None:
        for v in bm.verts: v.co = rot @ v.co
    for v in bm.verts: v.co += c
    return bm_to_obj(bm, name, coll, m)

def head_front_y(x, z):
    """あたま（体のメッシュ）の前の面の y（キャラの前 +y）"""
    fh, *_ = prof('sp:head'); shp, *_ = prof('sp:headS')
    l, r = fh(z); bl, br = shp(z); a = (r-l)/2*.95; cy = (bl+br)/2; b = br-3-cy
    t = min(1, abs(x)/a); return cy+b*(1-t**2.1)**(1/2.1)

# ---------------- 骨 ----------------
def build_armature(coll):
    ad = bpy.data.armatures.new('spirit_rig'); arm = bpy.data.objects.new('spirit_rig', ad); coll.objects.link(arm)
    bpy.context.view_layer.objects.active = arm
    th = ABD[0]
    with bpy.context.temp_override(object=arm, active_object=arm):
        bpy.ops.object.mode_set(mode='EDIT')
        def bone(nm, h, t, parent=None, conn=False):
            b = ad.edit_bones.new(nm); b.head = B(*h); b.tail = B(*t)
            if parent: b.parent = ad.edit_bones[parent]; b.use_connect = conn
            return b
        bone('root', (0, 0, 0), (0, -10, 0)).use_deform = False   # 動かす土台（重みはつけない）
        bone('hips', (0, 0, 11), (0, 0, 18), 'root')
        bone('spine', (0, 0, 18), (0, 0, 26), 'hips', True)
        bone('neck', (0, 0, 26), (0, 0, 31), 'spine', True)
        bone('head', (0, 0, 31), (0, 0, 62), 'neck', True)
        bone('hood_tip', (0, -2, 62), (0, -6, 76), 'head')
        for side, s in ((1, 'L'), (-1, 'R')):   # .L は Blender の +X（キャラの x を −1 倍しないので、キャラの +x）
            Sp = np.array([side*SH[0], 0, SH[1]]); d = np.array([side*math.sin(th), 0, -math.cos(th)])
            bone('shoulder.'+s, (side*3, 0, 24.5), Sp, 'spine')
            bone('upper_arm.'+s, Sp, Sp+d*6.5, 'shoulder.'+s, True)
            bone('forearm.'+s, Sp+d*6.5, Sp+d*11.5, 'upper_arm.'+s, True)
            bone('hand.'+s, Sp+d*11.5, Sp+d*17, 'forearm.'+s, True)
            bone('thigh.'+s, (side*8, 0, 11), (side*8, 0, 5.5), 'hips')
            bone('shin.'+s, (side*8, 0, 5.5), (side*8, 0, 1.5), 'thigh.'+s, True)
            bone('foot.'+s, (side*8, 0, 1.5), (side*8, 7, 0.5), 'shin.'+s, True)
        tip = (rx(TAILBACK)@rz(TAILTWIST))@np.array([0, 0, 1.0])
        bone('tail', TAILBASE, TAILBASE+tip*12, 'hips')
        bpy.ops.object.mode_set(mode='OBJECT')
    return arm

def bind_rigid(ob, arm, groups):
    """groups：[(ボーン, 重みの関数 or 1)]"""
    for bn, w in groups:
        g = ob.vertex_groups.new(name=bn)
        for v in ob.data.vertices:
            x = w if not callable(w) else w(v.co)
            if x > 0: g.add([v.index], float(x), 'REPLACE')
    ob.parent = arm; ob.modifiers.new('Armature', 'ARMATURE').object = arm

def ref_images(out):
    import rig
    from PIL import Image
    sp = Spirit('earth'); paths = {}
    for face, nm in ((0, 'front'), (1, 'side')):
        img = rig.shoot(sp, face, {})[0].reshape(136, 144, 4)
        p = os.path.join(out, 'ref_%s.png' % nm); Image.fromarray(img).resize((144*4, 136*4), Image.NEAREST).save(p); paths[nm] = p
    return paths

def build(out):
    os.makedirs(out, exist_ok=True)
    bpy.ops.wm.read_factory_settings()
    for o in list(bpy.data.objects): bpy.data.objects.remove(o)
    sc = bpy.context.scene; sc.unit_settings.system = 'METRIC'; root = sc.collection
    common = bpy.data.collections.new('common'); root.children.link(common)
    arm = build_armature(common)
    # 体
    me = build_body(); body = bpy.data.objects.new('body', me); common.objects.link(body)
    bm = bmesh.new(); bm.from_mesh(me)
    for v in bm.verts:
        if abs(v.co.x) < (0.012 if v.co.z < 0.08 else 0.002): v.co.x = 0.0   # まん中の線を x=0 にそろえる（ミラーのつなぎ目）
    bmesh.ops.bisect_plane(bm, geom=bm.verts[:]+bm.edges[:]+bm.faces[:], plane_co=(0, 0, 0), plane_no=(1, 0, 0), clear_inner=True)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-4)
    for v in bm.verts:
        if abs(v.co.x) < 1e-5: v.co.x = 0
    bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = True
    assign_body_mats(body, [mat('body', CREAM), mat('hand_earth', SPC['earth']['hand']), mat('foot', CREAM)])
    for el in ELS[1:]: mat('hand_'+el, SPC[el]['hand'])
    mm = body.modifiers.new('Mirror', 'MIRROR'); mm.use_clip = True; mm.use_mirror_merge = True
    # 自動の重み（ボーンヒート）
    for o in bpy.data.objects: o.select_set(False)
    body.select_set(True); arm.select_set(True); bpy.context.view_layer.objects.active = arm
    with bpy.context.temp_override(active_object=arm, object=arm, selected_objects=[body, arm], selected_editable_objects=[body, arm]):
        bpy.ops.object.parent_set(type='ARMATURE_AUTO')
    for g in list(body.vertex_groups):   # 半分のメッシュなので、.R はミラーがつける
        if g.name.endswith('.R') or g.name in ('hood_tip', 'root'): body.vertex_groups.remove(g)
    tg = body.vertex_groups.get('tail'); hg = body.vertex_groups['hips']   # しっぽはべつのオブジェクト：体の点の、しっぽの重みは こし へ
    if tg:
        for v in body.data.vertices:
            for g in v.groups:
                if g.group == tg.index: hg.add([v.index], g.weight, 'ADD')
        body.vertex_groups.remove(tg)
    for g in list(body.vertex_groups):   # ミラーが右がわへ重みをうつすには、.R の グループが（からでも）いる
        if g.name.endswith('.L'): body.vertex_groups.new(name=g.name[:-2]+'.R')
    # ゲーム用のふつうの重み：1つの点につくボーンは4本まで・合計1
    for v in body.data.vertices:
        gs = sorted(v.groups, key=lambda g: -g.weight); keep = gs[:4]; tot = sum(g.weight for g in keep) or 1.0
        drop = [g.group for g in gs[4:]]; ws = {g.group: g.weight/tot for g in keep}
        for gi in drop: body.vertex_groups[gi].remove([v.index])
        for gi, w in ws.items(): body.vertex_groups[gi].add([v.index], w, 'REPLACE')
    am = body.modifiers.get('Armature');
    sd = body.modifiers.new('Subdivision', 'SUBSURF'); sd.levels = 2; sd.render_levels = 2
    # 属性ごと
    for el in ELS:
        co = bpy.data.collections.new(el); root.children.link(co)
        h = bpy.data.objects.new('hood_'+el, build_hood(el)); co.objects.link(h); h.data.materials.append(mat('hood_'+el, COLS[el]['hood']))
        for p in h.data.polygons: p.use_smooth = True
        z0 = min(v.co.z for v in h.data.vertices); z1 = max(v.co.z for v in h.data.vertices)
        bind_rigid(h, arm, [('head', lambda c: 1-max(0, (c.z-0.62)/max(.01, z1-0.62))*0.8), ('hood_tip', lambda c: max(0, (c.z-0.62)/max(.01, z1-0.62))*0.8)])
        so = h.modifiers.new('Solidify', 'SOLIDIFY'); so.thickness = 0.018; so.offset = -1
        h.modifiers.new('Subdivision', 'SUBSURF').levels = 2
        # 頭の上の物
        from core import TOPS
        for nm in TOPS[el]:
            k = 'sp_%s:%s' % (el, nm); kS = 'sp_%s:%sS' % (el, nm)
            try: chip(kS)
            except KeyError: kS = None
            a = chip(k)[0]; c = a[a[..., 3] > 0][:, :3].mean(0).astype(int)
            yc = 0.0
            if kS: sa, sx, sy = chip(kS); cols = np.nonzero((sa[..., 3] > 0).any(0))[0]; yc = sx+(cols[0]+cols[-1]+1)/2
            th = 5.0 if nm in ('tip', 'ember') else 3.5
            bmO = place(cutout(k, th, down=0 if nm == 'ember' else 2.5), lambda q: (q[0], -(q[1]+yc), q[2]))
            o = bm_to_obj(bmO, '%s_%s' % (nm, el), co, mat('%s_%s' % (nm, el), '#%02x%02x%02x' % tuple(c)), smooth=False)
            bind_rigid(o, arm, [('hood_tip', 1.0)]); bv = o.modifiers.new('Bevel', 'BEVEL'); bv.width = 0.009; bv.segments = 3
        # しっぽ（風ははね）
        if el != 'wind':
            a, ax0, ay0 = chip('sp_%s:tail' % el); ub = ax0+a.shape[1]/2; vb = ay0+a.shape[0]
            R = rx(TAILBACK)@rz(TAILTWIST)
            bmT = place(cutout('sp_%s:tail' % el, 2.4), lambda q: (lambda w: (-w[0]*0+w[0], -w[1], w[2]))(R@np.array([q[0]-ub, q[1], q[2]+vb])+TAILBASE))
            o = bm_to_obj(bmT, 'tail_'+el, co, mat('hood_'+el, COLS[el]['hood']), smooth=False); bind_rigid(o, arm, [('tail', 1.0)])
            bv = o.modifiers.new('Bevel', 'BEVEL'); bv.width = 0.009; bv.segments = 3
        else:
            for i, (wx, wy, ln, th, sg) in enumerate(WINGS):
                sc_ = ln/44; c_, s_ = math.cos(th), math.sin(th)
                def fw(q, sc_=sc_, c_=c_, s_=s_, wx=wx, wy=wy):
                    X, Y = q[0]*sc_, -q[2]*sc_; X, Y = X*c_-Y*s_, X*s_+Y*c_
                    return (X+wx*K, -(-13+q[1]), -(Y+wy*K))
                bmW = place(cutout('sp_wind:leaf', 1.4), fw)
                o = bm_to_obj(bmW, 'wing%d_wind' % i, co, mat('wing_wind', '#a6cc8a'), smooth=False); bind_rigid(o, arm, [('spine', 1.0)])
                bv = o.modifiers.new('Bevel', 'BEVEL'); bv.width = 0.005; bv.segments = 2
        # 目・ほっぺ（あたまの骨）
        for side in (1, -1):
            for nm, x, z, r, col in (('eye', 9.5, 40.5, (2.5, .7, 4.5), COLS[el]['eye']), ('cheek', 16, 34.5, (4, .5, 3.5), COLS[el]['cheek'])):
                y = head_front_y(x, z)
                # 顔の面の向き（前と横の傾き）に合わせて回す
                ang = math.atan2(x, max(1.0, y-9.5))
                Rz = np.array([[math.cos(ang), -math.sin(ang), 0], [math.sin(ang), math.cos(ang), 0], [0, 0, 1]])
                from mathutils import Matrix
                o = ellipsoid('%s.%s_%s' % (nm, 'L' if side > 0 else 'R', el), B(side*x, y-0.2, z), [v*S for v in r], co, mat('%s_%s' % (nm, el), col),
                              Matrix.Rotation(side*ang, 3, 'Z'))
                bind_rigid(o, arm, [('head', 1.0)])
    # 下絵
    refs = ref_images(out)
    for nm, p in refs.items():
        e = bpy.data.objects.new('ref_'+nm, None); e.empty_display_type = 'IMAGE'; e.data = bpy.data.images.load(os.path.abspath(p))
        e.empty_display_size = 1.44; e.location = (0, 0.6, 0.56) if nm == 'front' else (0.6, 0, 0.56)
        e.rotation_euler = (math.pi/2, 0, 0) if nm == 'front' else (math.pi/2, 0, -math.pi/2)
        e.show_empty_image_perspective = False; e.empty_image_depth = 'BACK'; e.color[3] = 0.5; e.use_empty_image_alpha = True
        common.objects.link(e)
    for o in bpy.data.objects: o.select_set(False)
    # glb：属性ごと
    for el in ELS:
        keep = [o for o in list(common.objects)+list(bpy.data.collections[el].objects) if o.type in ('MESH', 'ARMATURE')]
        for o in bpy.data.objects: o.select_set(o in keep)
        bpy.ops.export_scene.gltf(filepath=os.path.join(out, 'spirit_%s.glb' % el), use_selection=True, export_skins=True, export_animations=False, export_apply=True)
    for o in bpy.data.objects: o.select_set(False)
    for el in ELS[1:]: bpy.context.view_layer.layer_collection.children[el].hide_viewport = True
    for im in bpy.data.images:   # 下絵は .blend の中に入れる（ほかのパソコンでも見える）
        if im.filepath: im.pack()
    bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(os.path.join(out, 'spirit_model.blend')))
    print('body verts', len(body.data.vertices), 'faces', len(body.data.polygons), 'groups', [g.name for g in body.vertex_groups])

if __name__ == '__main__':
    build(sys.argv[1])
