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

def tr(M, P):
    """Blender の 4×4（m）で、Blender の向きの点（ドット）をうごかす"""
    P = np.atleast_2d(P); Q = (M@np.c_[P*0.01, np.ones(len(P))].T).T[:, :3]*100; return Q

def job(a):
    name, el = a; m = MOTIONS[name]; n = m['n']; iso = bool(core.ISOY)
    fr, fo, meta = {}, {}, {}
    faces = (0, 1, 2) if iso else (0,)   # 正面の絵（守り神と話すとき：正面の行だけ使う）は、正面だけ写して、横・うしろの行にも同じ絵を入れる
    for face in faces:
        for i in range(n):
            w = 2*np.pi*i/n; p = m['f'](w, face)
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
            Th = T['head']; fwd = (Th[:3, :3]@np.array([0, -1.0, 0])); c = cam((fwd@Rs.T)[None])[0]
            ti = 0 if c[2] >= abs(c[0]) else 2 if -c[2] >= abs(c[0]) else 1
            mir = ti == 1 and c[0] < 0
            F4 = S['feat']; eyec = (F4[0]+F4[1])/2
            ex, ey, _ = scr3(tr(Th, eyec))
            vf = view(ti if ti != face else face, 0.0, False); x0, y0, _ = vf(rig.EYEP[None])
            x0 = -x0 if mir else x0
            A = {'eye': [int(round(ex[0]-x0[0])), int(round(ey[0]-y0[0])), ti, 1 if mir else 0]}
            if ti == 0:   # 表情の目：顔の面の場所と ちぢみ方（目の絵の1ドット → 画面）
                for k, C in enumerate(F4):
                    d = 2.0; P3 = tr(Th, np.array([C, C+[d, 0, 0], C+[0, 0, -d]]))
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
            fr[(face, i)] = img; fo[(face, i)] = ov; meta[(face, i)] = A
    if not iso:
        import copy
        for face in (1, 2):
            for i in range(n): fr[(face, i)] = fr[(0, i)]; fo[(face, i)] = fo[(0, i)]; meta[(face, i)] = copy.deepcopy(meta[(0, i)])
    al = np.stack([f[..., 3] > 0 for f in fr.values()]).any(0); ys, xs = np.nonzero(al)
    x0, x1, y0, y1 = int(xs.min()), int(xs.max())+1, int(ys.min()), int(ys.max())+1; cw, ch = x1-x0, y1-y0
    oa = np.stack([fo[(face, i)][y0:y1, x0:x1, 3] > 0 for face in (0, 1, 2) for i in range(n)]).any(0).any(1); oys = np.nonzero(oa)[0]
    oy, oh = (int(oys.min()), int(oys.max())+1-int(oys.min())) if len(oys) else (0, 0)
    sheet = np.zeros((ch*3+oh*3, cw*n, 4), np.uint8)
    for (face, i), f in fr.items(): sheet[face*ch:(face+1)*ch, i*cw:(i+1)*cw] = f[y0:y1, x0:x1]
    if oh:
        for face in (0, 1, 2):
            for i in range(n): sheet[ch*3+face*oh:ch*3+(face+1)*oh, i*cw:(i+1)*cw] = fo[(face, i)][y0+oy:y0+oy+oh, x0:x1]
    b = io.BytesIO(); Image.fromarray(sheet).save(b, 'WEBP', lossless=True, exact=True, quality=100, method=6)
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
    return name, el, b.getvalue(), [cw, ch, int(EXT[0]+x0), int(EXT[2]+y0)]+([oy, oh] if oh else []), [[meta[(f, i)]['eye'] for i in range(n)] for f in range(3)], [[hands(meta[(f, i)]) for i in range(n)] for f in range(3)]
