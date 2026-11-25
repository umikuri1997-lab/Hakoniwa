"""build.py の1つの仕事（動き・属性）を、持ち主のモデル（fbx_motion）で写す。build.job と同じ形でかえす。
  絵：fbx_motion.pose で骨を動かし、目・ほっぺのメッシュはのぞいて、fbx_pixel.render で写す。
  目の上にかさねる絵（over）：うで・手・道具のドットで、うしろに頭（ずきん・顔）がうつる所。
  目（A['eye']）：[ずれ x, y, 向き（0 正面・1 横・2 なし）, 左右反対]（rig.shoot と同じ）。正面のときは、そのあとに、
    左目・右目・左ほっぺ・右ほっぺごとに [画面 x, y, ちぢみ方 a, b, c, d, 見えるか]（ゲームが表情の目の絵を、3Dの顔の面の場所・向きでかさねる）。
    場所は、モデルの目・ほっぺのメッシュのまん中（休みのポーズ）を、頭の骨の動きで動かした所。
  手：モデルの手の骨のまん中。道具の先は、いまの道具の場所（rig.posed）。"""
import io, math, os, sys
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import core
from core import EXT, NEARSIDE, view
from motions import MOTIONS
import fbx_motion as FM
import fbx_pixel as FP
import rig

EXPR = ['n', 'hap', 'shut', 'teary', 'tear', 'shock', 'strain', 'sad', 'brave', 'tired', 'hungry']   # 表情の目（js の XL と同じならび）
XL = EXPR+['lash:'+e for e in EXPR if e != 'strain']+['cheek']
WOOD = {'hood': '#6fae4c', 'cheek': '#b6d39e', 'dark': '#4f8a35', 'eye': '#3f5e26', 'hand': '#d6e8c2', 'line': '#e2d6bc'}   # 共通の目の絵（sp:）の色＝木の色（js の SPC.wood）
ELC = {'earth': {'hood': '#8f6a50', 'cheek': '#c6b1a0', 'dark': '#6f4f3a', 'eye': '#5e3d2a', 'hand': '#e3c3a3', 'line': '#ead6bd'},
       'water': {'hood': '#78c3fb', 'cheek': '#badef5', 'dark': '#4fa6e8', 'eye': '#1d4f7c', 'hand': '#f3dfc6', 'line': '#ecd9c0'},
       'fire': {'hood': '#e8604f', 'cheek': '#f2ac9f', 'dark': '#c94a3c', 'eye': '#8f3a22', 'hand': '#ffc887', 'line': '#f0d4ae'},
       'wind': {'hood': '#a6cc8a', 'cheek': '#d2e2bc', 'dark': '#86b46a', 'eye': '#456a2a', 'hand': '#c8e2b4', 'line': '#c2dcaa'},
       'wood': WOOD}   # js の SPC と同じ
_XC = {}
def xchip(key, el):
    """表情の目のチップ（sp:face#… など）を、その属性の色にした絵（js の spDot と同じ色のかえ方）"""
    k = (key, el)
    if k not in _XC:
        from core import chip
        a, ax, ay = chip(key); a = a.copy(); hx = lambda h: np.array([int(h[i:i+2], 16) for i in (1, 3, 5)])
        for r in WOOD:
            src = hx(WOOD[r]); dst = hx(ELC[el][r]); m = (a[..., :3] == src).all(2) & (a[..., 3] > 0); a[m, :3] = dst
        _XC[k] = (a, ax, ay)
    return _XC[k]
def xkey(l): return 'sp:cheek' if l == 'cheek' else 'sp:lash#'+l[5:] if l.startswith('lash:') else 'sp:face#'+l

def tr(M, P):
    """Blender の 4×4（m）で、Blender の向きの点（ドット）をうごかす"""
    P = np.atleast_2d(P); Q = (M@np.c_[P*0.01, np.ones(len(P))].T).T[:, :3]*100; return Q

def job(a):
    name, el = a; m = MOTIONS[name]; n = m['n']; iso = bool(core.ISOY)
    fr, fo, meta, xl, fk = {}, {}, {}, {}, {}
    faces = (0, 1, 2) if iso else (0,)   # 正面の絵（守り神と話すとき：正面の行だけ使う）は、正面だけ写して、横・うしろの行にも同じ絵を入れる
    for face in faces:
        for i in range(n):
            from motions import WALKEL
            w = 2*np.pi*i/n; p = m['f'](w, face)
            if name.startswith('walk') and el in WALKEL:   # 歩く：属性ごとの歩き方（首だけ先に向ける walk_h… も、その向きの分を足す）
                dh = p.get('hy', 0.0)-MOTIONS['walk']['f'](w, face).get('hy', 0.0); p = WALKEL[el](w, face); p['hy'] = p.get('hy', 0.0)+dh
            T = FM.pose(el, p, face); S = FM.scene(el)
            pts, anc = FM.props(el, p, face)
            yaw = core.ISOY if (iso and face in (0, 2)) else 0.0
            img, inf = FP.render(FM.triangles(el, eyes=False), face, points=pts, spin=p.get('spin', 0.0), info=True, yaw=yaw)
            cam, Rs = inf['cam'], inf['Rs']
            def scr3(P):
                Q = cam(np.atleast_2d(P)@Rs.T); return Q[:, 0], -Q[:, 1], Q[:, 2]   # 画面 x, y（下が +）, 手前ほど大
            tag = inf['tag']
            ov = np.zeros_like(img); mk = inf['hcov'] & np.isin(tag, [2, 5]); ov[mk] = img[mk]
            # 目の向き：頭の前（Blender の −Y）が、カメラに向くか・横か・うしろか
            # 目の向きは、クォータービューの45度をのぞいた向きできめる（rig.posed と同じ。入れると、うしろななめで横向きの目が出た）
            Th = T['head']; fwd = (Th[:3, :3]@np.array([0, -1.0, 0])); sp_ = -p.get('spin', 0.0); R0 = np.array([[math.cos(sp_), -math.sin(sp_), 0], [math.sin(sp_), math.cos(sp_), 0], [0, 0, 1]])
            f0 = fwd@R0.T; c = {0: (f0[0], f0[2], -f0[1]), 1: (-f0[1], f0[2], -f0[0]), 2: (-f0[0], f0[2], f0[1])}[face]   # カメラから見た 頭の前の向き（x・上・手前）
            ti = 0 if c[2] >= abs(c[0]) else 2 if -c[2] >= abs(c[0]) else 1
            mir = ti == 1 and c[0] < 0
            F4 = S['feat']; eyec = (F4[0]+F4[1])/2
            ex, ey, _ = scr3(tr(Th, eyec))
            vf = view(ti if ti != face else face, 0.0, False); x0, y0, _ = vf(rig.EYEP[None])
            x0 = -x0 if mir else x0
            A = {'eye': [int(round(ex[0]-x0[0])), int(round(ey[0]-y0[0])), ti, 1 if mir else 0]}
            if ti in (0, 1):   # 表情の目：顔の面の場所と ちぢみ方（目の絵の1ドット → 画面）。横向きも同じ（前の横向きの目の絵は、モデルの顔と合わない）
                for k, C in enumerate(F4):
                    d = 2.0   # 顔の丸みにそって：目のまん中と、よこ・たてに d ずらした所を、顔の面の上にとる
                    P3 = tr(Th, np.array([FM.face_pt(el, C[0], C[2]), FM.face_pt(el, C[0]+d, C[2]), FM.face_pt(el, C[0], C[2]-d)]))
                    X, Y, Z = scr3(P3); aa, bb = (X[1]-X[0])/d, (Y[1]-Y[0])/d; cc, dd = (X[2]-X[0])/d, (Y[2]-Y[0])/d
                    vis = 1 if aa*dd-bb*cc >= (0.25 if k < 2 else 0.5) else 0
                    r1, c1 = int(np.floor(Y[0]-EXT[2])), int(np.floor(X[0]-EXT[0]))
                    if vis and not (0 <= r1 < tag.shape[0] and 0 <= c1 < tag.shape[1] and tag[r1, c1] == 4): vis = 0   # まん中が顔の上か（ずきん・うでにかくれる）
                    A['eye'] += [round(float(X[0]), 1), round(float(Y[0]), 1), round(float(aa), 2), round(float(bb), 2), round(float(cc), 2), round(float(dd), 2), vis]
            # 手：モデルの手の骨のまん中（手前の手 N・奥の手 F）
            for k, nearsign in (('handN', NEARSIDE[face]), ('handF', -NEARSIDE[face])):
                bn = 'hand.L' if nearsign > 0 else 'hand.R'; R = S['rest'][bn]
                hm = (R[:3, 3]+(R[:3, :3]@np.array([0, 1.0, 0]))*np.linalg.norm(R[:3, 1])*0.0)   # 骨の根もと（m）
                tip = S['arm'].data.bones[bn].tail_local; mid = (hm+np.array(tip[:]))/2
                X, Y, _ = scr3(tr(T[bn], mid*100)); A[k] = [round(float(X[0]), 2), round(float(Y[0]), 2)]
            for k in ('tipN', 'tipF'):
                if k in anc:
                    P = np.asarray(anc[k])@FM.F; X, Y, _ = scr3(P); A[k] = [round(float(X[0]), 2), round(float(Y[0]), 2)]
            fr[(face, i)] = img; fo[(face, i)] = ov; meta[(face, i)] = A; fk[(face, i)] = inf['hk']
            fit = FM.face_fit(el)   # 表情の目・ほっぺ：顔の3Dの面にはって写した層（表情ごと）
            xl[(face, i)] = FP.decals(inf, [xchip(xkey(l), el) for l in XL], fit)
    if not iso:
        import copy
        for face in (1, 2):
            for i in range(n): fr[(face, i)] = fr[(0, i)]; fo[(face, i)] = fo[(0, i)]; fk[(face, i)] = fk[(0, i)]; meta[(face, i)] = copy.deepcopy(meta[(0, i)]); xl[(face, i)] = xl[(0, i)]
    al = np.stack([f[..., 3] > 0 for f in fr.values()]).any(0); ys, xs = np.nonzero(al)
    x0, x1, y0, y1 = int(xs.min()), int(xs.max())+1, int(ys.min()), int(ys.max())+1; cw, ch = x1-x0, y1-y0
    oa = np.stack([fo[(face, i)][y0:y1, x0:x1, 3] > 0 for face in (0, 1, 2) for i in range(n)]).any(0).any(1); oys = np.nonzero(oa)[0]
    oy, oh = (int(oys.min()), int(oys.max())+1-int(oys.min())) if len(oys) else (0, 0)
    sheet = np.zeros((ch*3+oh*3, cw*n, 4), np.uint8)
    for (face, i), f in fr.items(): sheet[face*ch:(face+1)*ch, i*cw:(i+1)*cw] = f[y0:y1, x0:x1]
    if oh:
        for face in (0, 1, 2):
            for i in range(n): sheet[ch*3+face*oh:ch*3+(face+1)*oh, i*cw:(i+1)*cw] = fo[(face, i)][y0+oy:y0+oy+oh, x0:x1]
    b = io.BytesIO(); Image.fromarray(sheet).save(b, 'WEBP', lossless=True, exact=True, quality=100, method=2)
    ks = np.zeros((ch*3, cw*n), np.uint8)   # ずきんの印の絵：からだの絵と同じわく（目の上にかさねる行はなし）。印のドットは 255
    for (face, i), k in fk.items(): ks[face*ch:(face+1)*ch, i*cw:(i+1)*cw] = np.where(k[y0:y1, x0:x1], 255, 0)
    kb = io.BytesIO(); Image.fromarray(ks).convert('RGB').save(kb, 'WEBP', lossless=True, exact=True, quality=100, method=2)
    def hands(a):
        v = a['handN']+a['handF']
        for k in ('tipN', 'tipF'):
            if k in a: v = v+a[k]
        return [round(x, 1) for x in v]
    for f in range(3):
        E = [meta[(f, i)]['eye'] for i in range(n)]
        for q in range(10, len(E[0]), 7):
            if all(len(e) > q for e in E):
                v = 1 if sum(e[q] for e in E)*2 > n else 0
                for e in E: e[q] = v
    # 表情の層の絵：行は 向き×層（XL のならび）、列はコマ。わくは、どの層・コマの絵もはいる大きさ
    xa = np.stack([L[..., 3] > 0 for v in xl.values() for L in v]).any(0); xys, xxs = np.nonzero(xa)
    if len(xys):
        a0, a1, b0, b1 = int(xxs.min()), int(xxs.max())+1, int(xys.min()), int(xys.max())+1; xw, xh = a1-a0, b1-b0
        xs = np.zeros((xh*3*len(XL), xw*n, 4), np.uint8)
        for (face, i), v in xl.items():
            for li, L in enumerate(v): xs[(face*len(XL)+li)*xh:(face*len(XL)+li+1)*xh, i*xw:(i+1)*xw] = L[b0:b1, a0:a1]
        xb = io.BytesIO(); Image.fromarray(xs).save(xb, 'WEBP', lossless=True, exact=True, quality=100, method=2)
        xr = (xb.getvalue(), [xw, xh, int(EXT[0]+a0), int(EXT[2]+b0)])
    else: xr = None
    return name, el, b.getvalue(), [cw, ch, int(EXT[0]+x0), int(EXT[2]+y0)]+([oy, oh] if oh else []), [[meta[(f, i)]['eye'] for i in range(n)] for f in range(3)], [[hands(meta[(f, i)]) for i in range(n)] for f in range(3)], xr, kb.getvalue()
