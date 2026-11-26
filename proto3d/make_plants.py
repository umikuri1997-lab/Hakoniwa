"""3Dの試作（proto3d）の植物：持ち主のモデル（tools/art/models/plants/plants.glb。色なし・1つの形に23の植物）を、
植物ごとに分けて、部品ごとに色をぬり、tex/plants.glb にする。
  python3 proto3d/make_plants.py
- 分け方：同じ場所の点でつながった部品にわけ、部品のまん中の高さ・奥行きで列（木 T・しげみ B・花と草 F）に、
  列の中は左右の場所で植物に（木と花は10こ・しげみは3こ）。
- 色（ゲームの色から）：木のみき（いちばん下にとどく部品）は幹の色、ほかは葉の色（植物ごとに、ゲームの木の葉の5色の まん中の色）。
  花と草：下からのびる細い部品はくき、下の大きい部品は葉、上のほう（高さの FLOWERY より上から始まる）の部品は花の色。
- 植物ごとに、足もとのまん中を原点にし、下のはしを高さ0に。大きさは、もとのまま（試作が高さをきめる）。
- 木としげみの葉は、ゲームの木と同じく、葉のかたまりを小さな葉の部品でおおう（natcommon.leafballs → sacred_tripo.leafparts と同じ式。
  かたまりの中身は少しちぢめて中の色に、表面に面積に合わせた数の葉。葉の色は5色から、かたまりの上・上向きほど明るく）。葉の部品は点の値 _FLAT＝1（試作はかげをつけなおさない）。
  試作で1マスの物にするため、葉1まいの三角形は LEAFTESS でへらす（ゲームは 5×4）。
- 材質：点の値 _MAT（試作の main.js の MATIDX）。木のみきは木の皮（bark）。
- 葉の下のかげ（natcommon.tone5 の under と同じ考え）：点ごとに真上へ線をのばし、ほかの面に UNDERH（植物の高さに対して）より近くで当たれば、
  近いほど暗くするだんの数（UNDERB まで）を、点の値 _UNDER に入れる。"""
import json, os, struct
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'tools', 'art', 'models', 'plants', 'plants.glb')
OUT = os.path.join(ROOT, 'proto3d', 'tex', 'plants.glb')
BARK = (196, 124, 84)                       # 幹（nat_tree.py の BARK）
LEAF = {                                    # 葉：ゲームの木の葉の5色の まん中（nat_tree・nat_oak・nat_cedar）と、草の色
    'tree': (151, 203, 98), 'oak': (130, 192, 104), 'cedar': (134, 182, 102), 'bush': (120, 188, 105), 'herb': (120, 188, 105)}
STEM = (112, 170, 92)                       # 花のくき
# 木10こ・しげみ3こ・花と草10この、葉の色と花の色（花は、ゲームの花の色に近い色）
TREE_LEAF = ['oak', 'cedar', 'tree', 'tree', 'tree', 'oak', 'tree', 'tree', 'oak', 'tree']
FLOWER = ['#8a8fe0', '#f2b14e', '#f07fa6', '#e8604f', '#ffffff', '#a58be0', '#f07fa6', '#ffd75a', '#f2a7c3', '#8a8fe0']
FLOWERY = .3                                # 花：植物の高さのこれより上から始まる部品は花
TRUNKY = .08                                # 木：植物の高さのこれより下にとどく部品はみき
UNDERH, UNDERB = .12, 3.0                   # 葉の下のかげ：とどく高さ（植物の高さに対して）・いちばん近いときに暗くするだんの数
HEIGHT = {'T': 1.9, 'T1': 2.2, 'T7': 2.2, 'B': .7, 'F': .45}   # 高さ（マス。試作の PROPS と同じ）
MATIDX = {'bark': 5}                        # 材質の番号（main.js の MATIDX と同じ）
# 葉（furn3d/items/nat_tree・nat_oak・nat_cedar の leafballs と同じ数）：5色（明るい→暗い）・かたまりの中の色・ならべる間かく・葉の長さ・はば（マス）
LEAFSET = {
    'tree': ([(195, 227, 107), (178, 218, 100), (151, 203, 98), (120, 188, 105), (92, 171, 108)], (84, 152, 100), .06, .10, .065),
    'oak': ([(178, 222, 128), (156, 208, 112), (130, 192, 104), (108, 174, 100), (90, 156, 98)], (84, 140, 88), .05, .09, .055),
    'cedar': ([(168, 206, 120), (150, 194, 110), (134, 182, 102), (120, 170, 96), (108, 158, 90)], (96, 142, 84), .05, .09, .05)}
LEAFTESS = (2, 1)                           # 葉1まいの、長さの向き・はばの向き（片がわ）の分け数（ゲームは 5・2）


def load(path):
    b = open(path, 'rb').read(); l = struct.unpack('<I', b[12:16])[0]; j = json.loads(b[20:20+l]); bn = b[20+l+8:]
    def acc(i):
        a = j['accessors'][i]; bv = j['bufferViews'][a['bufferView']]; n = {'SCALAR': 1, 'VEC3': 3}[a['type']]
        dt = {5126: np.float32, 5125: np.uint32, 5123: np.uint16}[a['componentType']]; o = bv.get('byteOffset', 0)+a.get('byteOffset', 0)
        r = np.frombuffer(bn, dt, a['count']*n, o); return r.reshape(-1, n) if n > 1 else r
    p = j['meshes'][0]['primitives'][0]
    return acc(p['attributes']['POSITION']).astype(float), acc(p['indices']).reshape(-1, 3).astype(int)


def comps(V, F):
    """同じ場所の点でつながった部品の番号（三角形ごと）"""
    key = np.round(V*1e5).astype(np.int64); _, inv = np.unique(key, axis=0, return_inverse=True); inv = inv.ravel(); par = list(range(inv.max()+1))
    def find(a):
        while par[a] != a: par[a] = par[par[a]]; a = par[a]
        return a
    for f in F:
        a = find(inv[f[0]]); par[find(inv[f[1]])] = a; par[find(inv[f[2]])] = a
    root = np.array([find(inv[f[0]]) for f in F]); _, cid = np.unique(root, return_inverse=True); return cid


def plants(V, F, cid):
    """部品を、列（木 T・しげみ B・花 F）と、列の中の植物にわける（列の中は左右の場所の k-means）"""
    n = cid.max()+1; C = []; W = []; R = []
    for k in range(n):
        P = V[F[cid == k]].reshape(-1, 3); c = P.mean(0); C.append(c); W.append((cid == k).sum())
        R.append('F' if c[1] < .13 else 'B' if c[1] < .24 and c[2] > -.1 else 'T')
    C = np.array(C); W = np.array(W); R = np.array(R); lab = np.zeros(n, int); names = []
    for row, K in (('T', 10), ('B', 3), ('F', 10)):
        idx = np.where(R == row)[0]; x = C[idx, 0]; w = W[idx]; cen = np.linspace(x.min(), x.max(), K)
        for _ in range(50):
            a = np.abs(x[:, None]-cen[None]).argmin(1)
            for q in range(K):
                if (a == q).any(): cen[q] = (x[a == q]*w[a == q]).sum()/w[a == q].sum()
        a = np.abs(x[:, None]-cen[None]).argmin(1); rk = np.argsort(np.argsort(cen))
        for i, q in zip(idx, a): lab[i] = len(names)+rk[q]
        names += [row+str(q) for q in range(K)]
    return lab[cid], names


def under(P, tri, H):
    """点ごとに、真上の面までのきょり（H*UNDERH より遠い・ないときは0）から、暗くするだんの数"""
    a, b, c = tri[:, 0], tri[:, 1], tri[:, 2]; e1, e2 = b-a, c-a; up = np.array([0, 1.0, 0])
    pv = np.cross(up, e2); det = (e1*pv).sum(1); ok = np.abs(det) > 1e-12; inv = np.where(ok, 1/np.where(ok, det, 1), 0)
    out = np.zeros(len(P)); R = H*UNDERH
    for s0 in range(0, len(P), 256):
        Q = P[s0:s0+256, None, :]; tv = Q-a[None]; u = (tv*pv[None]).sum(2)*inv[None]
        qv = np.cross(tv, e1[None]); v = qv[..., 1]*inv[None]; t = (qv*e2[None]).sum(2)*inv[None]
        hit = ok[None] & (u >= 0) & (v >= 0) & (u+v <= 1) & (t > H*.01) & (t < R)
        d = np.where(hit, t, np.inf).min(1); out[s0:s0+256] = np.where(np.isfinite(d), UNDERB*(1-d/R), 0)
    return out


def leafpart(base, d, sd, nn, L, W, fold=.25, droop=.35):
    """葉1まい（sacred_tripo.leafpart と同じ形。分け数は LEAFTESS）"""
    def P(t, u):
        w = W*np.sin(np.pi*min(1, t*1.04))**.7*(1-.3*t); return base+d*t*L+sd*u*w+nn*(fold*w*abs(u)-droop*L*t*t)
    nt, ns = LEAFTESS; T = []
    for i in range(nt):
        for j in range(-ns, ns):
            t0, t1, u0, u1 = i/nt, (i+1)/nt, j/ns, (j+1)/ns; a, b, c, e = P(t0, u0), P(t1, u0), P(t1, u1), P(t0, u1); T += [(a, b, c), (a, c, e)]
    return T


def leafparts(q, gi, tones, inner, gap, L0, W0):
    """葉のかたまり q（三角形）を、中身（ちぢめた形・中の色）と小さな葉でおおう（sacred_tripo.leafparts と同じ式。座標は y が上・z が手前）。
    かえす物：三角形 [n,3,3]・色 [n,3]"""
    rs = np.random.RandomState(500+gi); fn = np.cross(q[:, 1]-q[:, 0], q[:, 2]-q[:, 0]); ar = np.linalg.norm(fn, axis=1)/2; n = fn/np.maximum(2*ar[:, None], 1e-12)
    P0 = q.reshape(-1, 3); c0 = P0.mean(0); bad = ((q.mean(1)-c0)*n).sum(1) < 0; n[bad] = -n[bad]   # 面の表を外へ
    vis = (n[:, 2]*.74+n[:, 1]*.67 > -.35); A = ar*vis; zl, zh = P0[:, 1].min(), P0[:, 1].max()
    T = list(c0+(q-c0)*.86); C = [inner]*len(q)
    if A.sum() <= 0: return np.array(T), np.array(C, float)
    N = max(6, int(A.sum()/(gap*gap))); idx = rs.choice(len(q), N, p=A/A.sum())
    for k in idx:
        w = rs.dirichlet((1, 1, 1)); pt = w@q[k]; nn = n[k]
        dn = np.array([0, -1.0, 0])-nn*(-nn[1]); out = pt-c0; out -= nn*(out@nn)
        d = .3*dn/max(np.linalg.norm(dn), 1e-6)+.7*out/max(np.linalg.norm(out), 1e-6)
        ang = rs.uniform(-.7, .7); sd0 = np.cross(nn, d); d = d*np.cos(ang)+sd0*np.sin(ang); d -= nn*(d@nn); d /= max(np.linalg.norm(d), 1e-6); sd = np.cross(nn, d)
        L = L0*rs.uniform(.8, 1.15); W = W0*rs.uniform(.85, 1.15)
        h = (pt[1]-zl)/max(zh-zl, 1e-6); tone = int(np.clip(round((1-h)*1.6+(1-nn[1])*1.3+rs.uniform(-.35, .35)), 0, 4))
        for t in leafpart(pt+nn*.01-d*L*.35, d, sd, nn, L, W): T.append(np.array(t)); C.append(tones[tone])
    return np.array(T), np.array(C, float)


def hexrgb(h): return tuple(int(h[i:i+2], 16) for i in (1, 3, 5))


def colors(V, F, cid, fi, name):
    """部品ごとの色と、しゅるい（bark みき・leaf 葉のかたまり・'' そのほか）（三角形ごと）"""
    P = V[F[fi]]; y0 = P[:, :, 1].min(); H = P[:, :, 1].max()-y0; row, q = name[0], int(name[1:]); out = np.zeros((len(fi), 3)); kind = np.full(len(fi), '', object)
    for c in np.unique(cid[fi]):
        m = cid[fi] == c; Q = P[m].reshape(-1, 3); lo = (Q[:, 1].min()-y0)/H
        ext = Q.max(0)-Q.min(0); thin = ext[1] > 2.5*max(ext[0], ext[2])
        if row == 'T': col, kd = (BARK, 'bark') if lo < TRUNKY else (LEAF[TREE_LEAF[q]], 'leaf')
        elif row == 'B': col, kd = LEAF['bush'], 'leaf'
        else: col, kd = (hexrgb(FLOWER[q]), '') if lo > FLOWERY else (STEM, '') if thin else (LEAF['herb'], '')
        out[m] = col; kind[m] = kd
    return out, kind


def glb(meshes, path):
    """メッシュ（名前・点・色）をならべた glb を書く（同じ点と色は1つにまとめて、三角形は番号で。色は 0〜1）"""
    bins = b''; acc = []; views = []; ms = []; nodes = []
    def add(arr, kind, mn=None, mx=None, ct=5126):
        nonlocal bins
        data = np.ascontiguousarray(arr, np.float32 if ct == 5126 else np.uint32).tobytes(); views.append({'buffer': 0, 'byteOffset': len(bins), 'byteLength': len(data)}); bins += data
        a = {'bufferView': len(views)-1, 'componentType': ct, 'count': int(arr.size if kind == 'SCALAR' else len(arr)), 'type': kind}
        if mn is not None: a['min'] = mn; a['max'] = mx
        acc.append(a); return len(acc)-1
    for name, P, C, FL, MT in meshes:
        U, idx = np.unique(np.round(np.c_[P, C, FL, MT], 6), axis=0, return_inverse=True); P, C, FL, MT = U[:, :3], U[:, 3:6], U[:, 6], U[:, 7]
        tri = P[idx.reshape(-1, 3)]; ft = FL[idx.reshape(-1, 3)].max(1) == 0; un = np.zeros(len(P)); nf = FL == 0
        un[nf] = under(P[nf], tri[ft], P[:, 1].max()-P[:, 1].min())   # 葉の部品（_FLAT）は、かげをつけなおさないので、ほかの面だけで
        pi = add(P, 'VEC3', P.min(0).tolist(), P.max(0).tolist()); ci = add(C, 'VEC3'); ui = add(un, 'SCALAR'); fi_ = add(FL, 'SCALAR'); mi = add(MT, 'SCALAR'); ii = add(idx.ravel(), 'SCALAR', ct=5125)
        ms.append({'name': name, 'primitives': [{'attributes': {'POSITION': pi, 'COLOR_0': ci, '_UNDER': ui, '_FLAT': fi_, '_MAT': mi}, 'indices': ii}]}); nodes.append({'name': name, 'mesh': len(ms)-1})
    j = {'asset': {'version': '2.0', 'generator': 'proto3d/make_plants.py'}, 'scene': 0, 'scenes': [{'nodes': list(range(len(nodes)))}],
         'nodes': nodes, 'meshes': ms, 'accessors': acc, 'bufferViews': views, 'buffers': [{'byteLength': len(bins)}]}
    js = json.dumps(j, separators=(',', ':')).encode(); js += b' '*((4-len(js) % 4) % 4); bins += b'\0'*((4-len(bins) % 4) % 4)
    with open(path, 'wb') as f:
        f.write(struct.pack('<III', 0x46546C67, 2, 12+8+len(js)+8+len(bins)))
        f.write(struct.pack('<II', len(js), 0x4E4F534A)); f.write(js); f.write(struct.pack('<II', len(bins), 0x004E4942)); f.write(bins)


if __name__ == '__main__':
    V, F = load(SRC); cid = comps(V, F); pl, names = plants(V, F, cid); meshes = []
    for k, name in enumerate(names):
        fi = np.where(pl == k)[0]; P = V[F[fi]]; C, kd = colors(V, F, cid, fi, name)
        base = P.reshape(-1, 3); lo = base[:, 1].min(); foot = base[base[:, 1] < lo+.01*(base[:, 1].max()-lo)]
        org = np.array([foot[:, 0].mean(), lo, foot[:, 2].mean()])   # 足もとのまん中
        P = (P-org)*(HEIGHT.get(name, HEIGHT[name[0]])/(base[:, 1].max()-lo))   # マスの大きさに
        FL = np.zeros(len(P)); MT = np.where(kd == 'bark', MATIDX['bark'], 0).astype(float)
        if name[0] in 'TB':   # 葉のかたまりを、葉の部品でおおう
            ls = LEAFSET[TREE_LEAF[int(name[1:])] if name[0] == 'T' else 'tree']; keep = kd != 'leaf'; TT, CC, FF, MM = [P[keep]], [C[keep]], [FL[keep]], [MT[keep]]
            for gi, c in enumerate(np.unique(cid[fi][~keep])):
                q = P[(cid[fi] == c) & ~keep]; t, cc = leafparts(q, gi, *ls); TT.append(t); CC.append(cc); FF.append(np.r_[np.zeros(len(q)), np.ones(len(t)-len(q))]); MM.append(np.zeros(len(t)))
            P, C, FL, MT = np.concatenate(TT), np.concatenate(CC), np.concatenate(FF), np.concatenate(MM)
        rep = lambda a: np.repeat(a, 3, 0)
        meshes.append((name, P.reshape(-1, 3), (rep(C)/255.0)**2.2, rep(FL), rep(MT)))   # 色は linear で入れる（glTF の決まり）
    glb(meshes, OUT); print(OUT, len(meshes), '植物', sum(len(m[1])//3 for m in meshes), '三角形')
