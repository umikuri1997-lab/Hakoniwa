"""せいれいの動きの骨を焼く（3Dのゲーム用）。2Dの絵と同じ式（tools/art/spirit3d/fbx_motion.py の pose・props）で、持ち主のモデル（model/<属性>.fbx）の骨を Blender で動かし、
動き（motions.py）のコマごとの骨の向き（回転と場所）を書く。使うのは正面（向き0）の姿勢だけ（3Dでまわして見る。持ち主がえらんだ）。
  骨：同じ動きしかしない骨（腰と背骨など）は1つにまとめる（「列」）。点ごとの骨の番号（bake-spirits.html の aSI）→ 列は b2c。
  道具：props.py の道具の点（小さな箱のあつまり）をなめらかな面にして（マーチングキューブ → へらす）、手の骨といっしょに動く「列」をもう2つ（手前の手・奥の手）。
  首だけ先に向ける歩き（walk_h…・carry_h…）は焼かない（3Dでは体をなめらかにまわす）。
  風のはね：たたんだ形（fbx_motion.triangles の hane の式）の、休みの形からのずれ（wing）と、コマごとのたたむ量（wf）。
  表情の目：表情の目・まつげ・ほっぺのチップ（fbx_build.XL）を、属性の色にして1まいに並べた絵（face）と、頭の点→チップの場所の式（2Dの FM.face_fit と同じ。顔の前の面にだけ）。
書く物：assets/3d/pose-<中身の番号>.bin と js/3d/pose-data.js。
使い方: python3 tools/3d/bake-poses.py （先に node tools/3d/bake-spirits.cjs。モデル・motions.py・props.py をかえたら、両方動かす）
いるもの：pip install bpy scipy scikit-image fast-simplification"""
import hashlib, json, math, os, re, sys
import numpy as np
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
sys.path.insert(0, os.path.join(ROOT, 'tools', 'art', 'spirit3d'))
import fbx_motion as FM, props as PR, rig
import fbx_build as FB
from core import NEARSIDE
from motions import MOTIONS, WALKEL

ELS = os.environ.get('POSE_ELS', 'earth,water,fire,wind,wood').split(',')   # POSE_ELS：ためしに属性をしぼる
FACE = 0                      # 正面の姿勢
TQ = 8192                     # 場所（3Dのマス）を Int16 にするときの倍（±4マスまで）
PTRI = 1200                   # 道具の形の三角の数（これくらいまでへらす）
NAMES = [n for n in sorted(MOTIONS) if not re.search(r'_h[pn]\d+$', n)]

def spdata():
    s = open(os.path.join(ROOT, 'js', '3d', 'spirit-data.js'), encoding='utf8').read()
    return json.loads(s.split('SPDATA=', 1)[1].rstrip().rstrip(';'))

def spbin():
    s = open(os.path.join(ROOT, 'js', '3d', 'spirit-data.js'), encoding='utf8').read()
    return open(os.path.join(ROOT, re.search(r"SPFILE='([^']+)'", s).group(1)), 'rb').read()

def fit(B, T):
    """B（Blender・m）→ T（three）の、のびちぢみ・回転・ずらし（Umeyama）"""
    mb, mt = B.mean(0), T.mean(0); X, Y = B-mb, T-mt
    U, D, Vt = np.linalg.svd(Y.T@X); E = np.eye(3); E[2, 2] = np.sign(np.linalg.det(U@Vt))
    R = U@E@Vt; s = (D*np.diag(E)).sum()/(X**2).sum(); A = np.eye(4); A[:3, :3] = s*R; A[:3, 3] = mt-s*R@mb
    err = np.abs((B@(s*R).T+A[:3, 3])-T).max(); return A, s, err

def rz4(a):
    c, s = math.cos(a), math.sin(a); M = np.eye(4); M[:2, :2] = [[c, -s], [s, c]]; return M

def quat(R):
    U, _, Vt = np.linalg.svd(R); R = U@Vt   # 回転にそろえる
    t = np.trace(R)
    if t > 0: s = math.sqrt(t+1)*2; q = [(R[2, 1]-R[1, 2])/s, (R[0, 2]-R[2, 0])/s, (R[1, 0]-R[0, 1])/s, s/4]
    elif R[0, 0] > R[1, 1] and R[0, 0] > R[2, 2]: s = math.sqrt(1+R[0, 0]-R[1, 1]-R[2, 2])*2; q = [s/4, (R[0, 1]+R[1, 0])/s, (R[0, 2]+R[2, 0])/s, (R[2, 1]-R[1, 2])/s]
    elif R[1, 1] > R[2, 2]: s = math.sqrt(1+R[1, 1]-R[0, 0]-R[2, 2])*2; q = [(R[0, 1]+R[1, 0])/s, s/4, (R[1, 2]+R[2, 1])/s, (R[0, 2]-R[2, 0])/s]
    else: s = math.sqrt(1+R[2, 2]-R[0, 0]-R[1, 1])*2; q = [(R[0, 2]+R[2, 0])/s, (R[1, 2]+R[2, 1])/s, s/4, (R[1, 0]-R[0, 1])/s]
    q = np.array(q); return q/np.linalg.norm(q)

def prop_aff(S, T, p, k, pn):
    """道具の点（うでの座標 U・ドット）→ Blender（ドット）の 4×4。fbx_motion.props と同じ式を、U の 0 と 3つの軸で"""
    side = NEARSIDE[FACE] if k == 'N' else -NEARSIDE[FACE]; sfx = '.L' if side > 0 else '.R'
    sh, el0, hm0 = FM.armpts(S, side); du = np.linalg.norm(hm0-sh)-rig.HANDU[0, 0]
    _, fx = PR.prop(pn); kw = p.get('k'+k, 0.0); M = T['hand'+sfx]
    def put(U):
        U = np.atleast_2d(U); Q = sh+np.stack([side*(U[:, 0]+du), U[:, 2], U[:, 1]], 1)
        return (M@np.c_[(Q@FM.F)*0.01, np.ones(len(Q))].T).T[:, :3]*100
    U = np.array([[0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1.0]]); W = put(rig.wrist(U, kw) if kw else U); hc = put(rig.HANDU)[0]
    if 'up' in fx:
        u0 = put(rig.HANDU[0]+fx['up'])[0]-hc; u0 = u0/np.linalg.norm(u0); R = FM.align(u0, np.array([0, 0, 1.0]))
        if 'fwd' in fx:
            f0 = R@(put(rig.HANDU[0]+fx['fwd'])[0]-hc); a_ = math.atan2(-1.0, 0.0)-math.atan2(f0[1], f0[0])
            R = np.array([[math.cos(a_), -math.sin(a_), 0], [math.sin(a_), math.cos(a_), 0], [0, 0, 1.0]])@R
        W = (W-hc)@R.T+hc
    A = np.eye(4); A[:3, 3] = W[0]; A[:3, :3] = (W[1:]-W[0]).T; return A

def prop_mesh(pn):
    """道具の点（Q のます目の箱）→ なめらかな面（うでの座標・ドット）と、点の色"""
    from scipy.ndimage import gaussian_filter
    from scipy.spatial import cKDTree
    from skimage.measure import marching_cubes
    import fast_simplification as FS
    (P, C), _ = PR.prop(pn); q = PR.Q; lo = P.min(0)-3*q; I = np.round((P-lo)/q).astype(int); G = np.zeros(I.max(0)+4)
    G[I[:, 0], I[:, 1], I[:, 2]] = 1; G = gaussian_filter(G, 0.7)
    V, Fa, _, _ = marching_cubes(G, 0.3); V = V*q+lo
    if len(Fa) > PTRI: V, Fa = FS.simplify(V.astype(np.float32), Fa.astype(np.int32), 1-PTRI/len(Fa))
    V = np.asarray(V, float); Fa = np.asarray(Fa, int)
    N = np.zeros_like(V); fn = np.cross(V[Fa[:, 1]]-V[Fa[:, 0]], V[Fa[:, 2]]-V[Fa[:, 0]])
    for j in range(3): np.add.at(N, Fa[:, j], fn)
    N /= np.maximum(1e-9, np.linalg.norm(N, axis=1))[:, None]
    if (np.einsum('ij,ij->i', fn, V[Fa[:, 0]]-V.mean(0)) < 0).mean() > 0.5: Fa = Fa[:, ::-1]; N = -N   # 面のおもてを外へ
    _, k = cKDTree(P).query(V); return V, N, np.asarray(C)[k], Fa

def main():
    SD = spdata(); data = []; meta = {'els': ELS, 'names': NAMES, 'tq': TQ, 'mo': {}, 'scale': {}, 'b2c': {}, 'mir': {}}
    used = set(); rows = 0
    for nm in NAMES:
        m = MOTIONS[nm]; meta['mo'][nm] = [rows, m['n'], m['rate']]; rows += m['n']
    allK = {}; allP = {}; RP = {}; HM = {}; WF = np.zeros(rows); WFA = set(); AF = {}
    for el in ELS:
        S = FM.scene(el); E = SD['els'][el]; names = [b.replace('.', '') for b in S['order']]
        hb = E['bones']; B = np.array([S['rest'][S['order'][names.index(h)]][:3, 3] for h in hb]); A, s, err = fit(B, np.array(E['bpos']))
        assert err < 1e-4, (el, err); Ai = np.linalg.inv(A); meta['scale'][el] = s*0.01
        K = np.zeros((rows, len(hb), 4, 4)); PP = np.zeros((rows, 2, 4, 4)); H_ = np.zeros((rows, 2, 3)); r = 0
        for nm in NAMES:
            m = MOTIONS[nm]
            for i in range(m['n']):
                w = 2*np.pi*i/m['n']; p = (WALKEL[el] if nm.startswith('walk') and el in WALKEL else m['f'])(w, FACE)
                T = FM.pose(el, p, FACE); WF[r] = 1.0 if p.get('wingfold') else 0.0; WFA.add(p.get('wingfold', 0)); Rs = rz4(-p.get('spin', 0.0))   # spin：体ごと、たての軸のまわりに（fbx_pixel.render と同じ）
                for j, h in enumerate(hb): K[r, j] = A@Rs@T[S['order'][names.index(h)]]@Ai
                for k_, sd in enumerate((NEARSIDE[FACE], -NEARSIDE[FACE])):   # 手のまん中（水浴びのしぶきなど）：手の骨の根もとと先のまん中
                    bn = 'hand.L' if sd > 0 else 'hand.R'; mid = (S['rest'][bn][:3, 3]+np.array(S['arm'].data.bones[bn].tail_local[:]))/2
                    H_[r, k_] = (A@Rs@np.r_[(T[bn]@np.r_[mid, 1])[:3], 1])[:3]
                RP.setdefault(r, (p.get('prop'), p.get('propF')))   # コマごとの道具（コマで出たり消えたりする道具もある：小石）
                for si, (key, k) in enumerate((('prop', 'N'), ('propF', 'F'))):
                    pn = p.get(key)
                    if pn: used.add(pn); PP[r, si] = A@Rs@np.diag([.01, .01, .01, 1])@prop_aff(S, T, p, k, pn)
                    else: PP[r, si] = np.eye(4)
                if i == 0 and p.get('prop'):   # たしかめ：道具の点が fbx_motion.props と同じ所
                    pts, _ = FM.props(el, p, FACE); (U, _), _ = PR.prop(p['prop']); W = (np.c_[U, np.ones(len(U))]@(np.diag([100, 100, 100, 1])@np.linalg.inv(A@Rs)@PP[r, 0]).T)[:, :3]
                    assert np.abs(W-pts[0][0]).max() < 1e-3, (nm, np.abs(W-pts[0][0]).max())
                r += 1
        allK[el] = K; allP[el] = PP; HM[el] = H_; AF[el] = (A, dict(S)); print(el, 'ok', flush=True)
    # 同じ動きしかしない骨を1つの列に（どの属性・どのコマでも同じ）
    nb = len(SD['els'][ELS[0]]['bones']); assert all(SD['els'][el]['bones'] == SD['els'][ELS[0]]['bones'] for el in ELS)
    rep = []; b2c = []
    for j in range(nb):
        for c, jj in enumerate(rep):
            if all(np.abs(allK[el][:, j]-allK[el][:, jj]).max() < 1e-6 for el in ELS): b2c.append(c); break
        else: b2c.append(len(rep)); rep.append(j)
    meta['b2c'] = b2c; nch = len(rep)+2; meta['nch'] = nch; meta['rows'] = rows
    out = np.zeros((len(ELS), rows, nch, 7))
    for ei, el in enumerate(ELS):
        sc = meta['scale'][el]
        for r in range(rows):
            for c, j in enumerate(rep):
                M = allK[el][r, j]; out[ei, r, c, :4] = quat(M[:3, :3]); out[ei, r, c, 4:] = M[:3, 3]
            for si in range(2):   # 道具：のびちぢみ（sc）と、裏がえし（mir）をのぞいた回転
                M = allP[el][r, si]; L = M[:3, :3]/sc; d = np.linalg.det(L)
                if np.allclose(M, np.eye(4)): continue   # この動きでは、その手に道具がない
                mir = bool(d < 0); meta['mir'].setdefault(str(si), mir); assert meta['mir'][str(si)] == mir
                if mir: L = L@np.diag([1, 1, -1.0])
                out[ei, r, len(rep)+si, :4] = quat(L); out[ei, r, len(rep)+si, 4:] = M[:3, 3]
    # q の向きをとなりのコマとそろえる（つなぐとき、遠回りしない）
    for ei in range(len(ELS)):
        for nm in NAMES:
            r0, n = meta['mo'][nm][:2]
            for r in range(r0+1, r0+n):
                flip = (out[ei, r, :, :4]*out[ei, r-1, :, :4]).sum(-1) < 0; out[ei, r, flip, :4] *= -1
    assert np.abs(out[..., 4:]).max()*TQ < 32767, np.abs(out[..., 4:]).max()
    q = np.concatenate([np.round(out[..., :4]*32767), np.round(out[..., 4:]*TQ)], -1).astype(np.int16)
    bufs = [q.tobytes()]; off = len(bufs[0]); meta['props'] = {}
    def put(a):
        nonlocal off
        pad = (-off) % 4; bufs.append(b'\0'*pad); off += pad; o = off; bufs.append(a.tobytes()); off += a.nbytes; return o
    for pn in sorted(used):
        V, N, C, Fa = prop_mesh(pn); IA = Fa.astype(np.uint16 if len(V) < 65536 else np.uint32).ravel()
        meta['props'][pn] = {'tip': [round(float(x), 3) for x in PR.prop(pn)[1].get('tip', [0, 0, 0])], 'position': [put(V.astype(np.float32)), V.size], 'normal': [put(np.round(N*127).astype(np.int8)), N.size],
                             'color': [put(C.astype(np.uint8)), C.size], 'index': [put(IA), IA.size, IA.dtype.name]}
        print(pn, len(Fa), 'tris', flush=True)
    # 風のはね：たたんだ形（fbx_motion.triangles と同じ式）の、休みの形からのずれ。形の点（sp-*.bin の aWG の点）ごとに、いちばん近い Blender の点のずれ（three の向き）
    from scipy.spatial import cKDTree
    sp = spbin(); SDb = SD['els']; meta['wing'] = {}; meta['wf'] = [round(float(x), 3) for x in WF]
    assert WFA <= {0, 0.0, 1.1}, WFA
    for el in ELS:
        A, S = AF[el]; names = [o for o in S['restV'] if o.lower().startswith('hane')]
        if not names: continue
        Pb = SDb[el]['body']; pos = np.frombuffer(sp, np.float32, Pb['position']['n'], Pb['position']['o']).reshape(-1, 3); wg = np.frombuffer(sp, np.uint8, Pb['aWG']['n'], Pb['aWG']['o']) > 0
        R0 = np.concatenate([S['restV'][n] for n in names]); zr = None; Q = []
        for n in names:
            V0 = S['restV'][n]; zr = float(np.median(V0[np.abs(V0[:, 0]) < 10, 2])); dx = V0[:, 0]; dz = V0[:, 2]-zr
            r_ = np.hypot(dx, dz); th = np.maximum(np.arctan2(dz, np.abs(dx))-1.1, -1.35); Qn = V0.copy(); Qn[:, 0] = np.sign(dx)*r_*np.cos(th); Qn[:, 2] = zr+r_*np.sin(th); Q.append(Qn)
        Q = np.concatenate(Q); L = A[:3, :3]*0.01; R3 = (A@np.c_[R0*0.01, np.ones(len(R0))].T).T[:, :3]
        D3 = (Q-R0)@L.T; d, k = cKDTree(R3).query(pos[wg]); assert d.max() < 1e-3, ('hane', el, d.max())
        W = np.zeros_like(pos); W[wg] = D3[k]; meta['wing'][el] = [put(W.astype(np.float32)), W.size]; print(el, 'wing', int(wg.sum()), 'pts', flush=True)
    # 表情の目・まつげ・ほっぺ：チップを属性ごとの色にして、1まいに（どのチップも、おなじ「場所の枠」にそろえる：u・v のドットから枠の中の点がきまる）
    XL = FB.XL; ch = {(el, l): FB.xchip(FB.xkey(l), el) for el in ELS for l in XL}
    ax0 = min(c[1] for c in ch.values()); ay0 = min(c[2] for c in ch.values()); cw = max(c[1]+c[0].shape[1] for c in ch.values())-ax0; chh = max(c[2]+c[0].shape[0] for c in ch.values())-ay0
    atlas = np.zeros((chh*len(ELS), cw*len(XL), 4), np.uint8)
    for ei, el in enumerate(ELS):
        for li, l in enumerate(XL):
            a, ax, ay = ch[(el, l)]; atlas[ei*chh+ay-ay0:ei*chh+ay-ay0+a.shape[0], li*cw+ax-ax0:li*cw+ax-ax0+a.shape[1]] = a
    aff = {}
    for el in ELS:
        A, S = AF[el]; M = np.linalg.inv(A); Lm = M[:3, :3]/0.01; tm = M[:3, 3]/0.01   # three → Blender（ドット）
        F4 = S['feat']; Lf, Rf = F4[0], F4[1]; mx, mz = (Lf[0]+Rf[0])/2, (Lf[2]+Rf[2])/2; sc_ = 19.0/max(1e-6, abs(Rf[0]-Lf[0])); yc = S['HV'][:, 1].mean()
        aff[el] = {'u': [*(sc_*Lm[0]).tolist(), sc_*(tm[0]-mx)], 'v': [*(-sc_*Lm[2]).tolist(), -40.5-sc_*(tm[2]-mz)], 'f': [*Lm[1].tolist(), float(yc-tm[1])]}   # u = u[:3]·P+u[3]（FM.face_fit）・v・前の面は f[:3]·P < f[3]
    hq = np.stack([HM[el] for el in ELS]); assert np.abs(hq).max()*TQ < 32767; meta['hm'] = [put(np.round(hq*TQ).astype(np.int16)), hq.size]   # 手のまん中（属性・コマ・手前/奥・xyz。Int16 ×tq）
    meta['face'] = {'xl': XL, 'cw': int(cw), 'ch': int(chh), 'ax0': int(ax0), 'ay0': int(ay0), 'tex': [put(atlas.reshape(-1)), atlas.size], 'aff': aff}
    PL = sorted(used); meta['plist'] = PL; meta['rp'] = [[PL.index(a) if a else -1 for a in RP[r]] for r in range(rows)]   # コマごとの道具（手前の手・奥の手。plist の番号、なければ −1）
    raw = b''.join(bufs); h = hashlib.sha1(raw).hexdigest()[:10]; d = os.path.join(ROOT, 'assets', '3d')
    for f in os.listdir(d):
        if re.match(r'^pose-[0-9a-f]+\.bin$', f): os.remove(os.path.join(d, f))
    open(os.path.join(d, 'pose-'+h+'.bin'), 'wb').write(raw)
    open(os.path.join(ROOT, 'js', '3d', 'pose-data.js'), 'w', encoding='utf8').write(
        '/* せいれいの動きの骨の場所（tools/3d/bake-poses.py が書く。手で直さない） */\nexport const POSEFILE=\'assets/3d/pose-'+h+'.bin\';\nexport const POSE='+json.dumps(meta, separators=(',', ':'), ensure_ascii=False)+';\n')
    print('pose-'+h+'.bin', round(len(raw)/1e6, 2), 'MB', 'nch', nch, 'rows', rows)

if __name__ == '__main__':
    main()
