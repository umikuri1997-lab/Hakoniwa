"""コワイノのトリポのモデル（split18.py で分けた kg_<しゅるい>.glb、色なし）に色をつけて、ドット絵に写す。
  python3 tools/art/kowaino3d/kowaino_paint.py <分けたフォルダ> <出力フォルダ> [しゅるい...]
色のつけ方：
  ・近い点をまとめて（weld）、三角形のつながりで部品に分ける（星・すそのかざり・手・ぽんぽん など、べつの部品になっている物がある）。
  ・体の部品の中は、目じるしの場所（たね）から、面の向きが急にかわる所（折れ目、ANG 度）までぬりひろげて、顔・手・ずきんなどを分ける。
  ・目はモデルにないので、顔の面の上に、うすい色のたての だ円をのせる。
写し方：まっすぐ正面から、焦点距離 FOCAL（50mm）のカメラで、1ドット＝1で写す（高さはいまのチップに合わせる HPX）。"""
import math, os, sys
import numpy as np, trimesh
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE); sys.path.insert(0, os.path.dirname(HERE))
import oblique3d as O
from weld import weld

FOCAL = 50.0; ANG = 40   # 前向きも後ろ向きも、まっすぐ正面から、焦点距離50mm（35mm判）のカメラで写す（持ち主がきめた）
hx = lambda h: np.array([int(h[i:i+2], 16) for i in (1, 3, 5)], float)

# しゅるいごとの色と目じるし。場所は高さ1のときの (よこ x, 高さ z)。front：前からのたね
CFG = {
    'basic': dict(HPX=54, thin=0, hem=('#ac9776', 0.03), under='#2c2440', lining='#2c2440', base='#685d7f', parts='#b9aab6', legs=('#342b44', 0.1), eyes=dict(x=0.085, z=0.52, rx=0.03, rz=0.075, col='#c2afae', edge='#9e8a92'),
                  seeds=[('hood', 0.0, 0.85, '#6f6487', 0), ('face', 0.0, 0.52, '#241c33', 1),
                         ('handL', -0.1, 0.37, '#a597ba', 1), ('handR', 0.06, 0.37, '#a597ba', 1)],
                  pom=((0.36, 0.5), '#c8bcc8'), tip=0, cone=((0.136, -0.292, 0.883), (-0.013, -0.231, 0.808)), fingers=True, apart=0.07),
}

def load(path):
    m = weld(list(trimesh.load(path).geometry.values())[0]); F = m.faces
    cc = sorted(trimesh.graph.connected_components(m.face_adjacency, min_len=1, nodes=np.arange(len(F))), key=len, reverse=True)
    comp = np.zeros(len(F), int)
    for i, c in enumerate(cc): comp[c] = i
    return m, comp

POMC = []

def paint(m, comp, cfg):
    V = m.vertices; F = m.faces; H = m.bounds[1][1]; P = np.stack([V[:, 0], V[:, 2], V[:, 1]], 1); cen = P[F].mean(1)/H
    nb = {}
    for (a, b), t in zip(m.face_adjacency, m.face_adjacency_angles):
        nb.setdefault(a, []).append((b, t)); nb.setdefault(b, []).append((a, t))
    def seed(x, z, front):
        ok = (comp == 0) & ((cen[:, 0]-x)**2+(cen[:, 2]-z)**2 < 0.06**2); idx = np.nonzero(ok)[0]
        if not len(idx): idx = np.array([min(np.nonzero(comp == 0)[0], key=lambda k: (cen[k, 0]-x)**2+(cen[k, 2]-z)**2)])
        return int(idx[np.argmax(cen[idx, 1] if front else -cen[idx, 1])])
    def grow(s):
        th = math.radians(ANG); reg = {s}; st = [s]
        while st:
            k = st.pop()
            for j, t in nb.get(k, []):
                if j not in reg and t < th and comp[j] == 0: reg.add(j); st.append(j)
        return reg
    col = np.tile(hx(cfg['base']), (len(F), 1)); lab = np.array(['base']*len(F), object)
    for nm, x, z, c, front in cfg['seeds']:
        for k in grow(seed(x, z, front)): col[k] = hx(c); lab[k] = nm
    if cfg.get('lining'):   # ずきんの裏地：まだどこにも入っていない体の面のうち、手より上で前がわ（ずきんの内がわの帯。持ち主の写真の所）
        hz = max(cen[k, 2] for k in range(len(F)) if lab[k].startswith('hand')) if any(l.startswith('hand') for l in lab) else 0.4
        for k in range(len(F)):
            if comp[k] == 0 and lab[k] == 'base' and cen[k, 2] > hz-0.02 and cen[k, 1] > 0: col[k] = hx(cfg['lining']); lab[k] = 'rim'
    if cfg.get('pom'):   # ぽんぽん：玉の形（ずきんの面のうち、目じるしの近くの点のまん中から、玉の半径の中にある三角形）
        (px_, pz_), pc = cfg['pom']; vh = np.unique(F[lab == 'hood']); Q = P[vh]/H
        near = vh[((Q[:, 0]-px_)**2+(Q[:, 2]-pz_)**2) < 0.1**2]
        if len(near):
            c0 = P[near].mean(0); r0 = np.percentile(np.linalg.norm(P[near]-c0, axis=1), 70)
            for k in np.nonzero(lab == 'hood')[0]:
                if np.linalg.norm(P[F[k]]-c0, axis=1).max() < r0*1.12: col[k] = hx(pc); lab[k] = 'pom'
            vp = np.unique(F[lab == 'pom'])
            if len(vp):   # さかい目は、写すドットごとに、玉のまん中からのきょりできめる（pomf）。まん中・半径は、ぽんぽんの点だけから
                bd = np.array(sorted(set(vp) & set(F[lab == 'hood'].ravel())))   # ぽんぽんと、ずきんの先がつながる所の点
                c1 = P[vp].mean(0); cb = P[bd].mean(0) if len(bd) else c1+np.array([0, 0, 0.05*H])
                ax = (cb-c1)/max(1e-9, np.linalg.norm(cb-c1))
                if len(bd) >= 3:   # つながる所の輪の面の向き（いちばんうすい向き）。玉がわから、つながる所へ向ける
                    n_ = np.linalg.svd(P[bd]-cb)[2][2]; ax = n_ if n_@ax > 0 else -n_
                Am = np.c_[2*P[vp], np.ones(len(vp))]; sol = np.linalg.lstsq(Am, (P[vp]**2).sum(1), rcond=None)[0]   # 玉をあてはめる
                cs = sol[:3]; rs = math.sqrt(max(1e-12, sol[3]+cs@cs))
                POMC[:] = [c1, float((cb-c1)@ax), hx(pc), ax, rs*1.12, cs, rs]   # まん中 cs・半径 rs の玉の面の上で、ずきんの先へつながる向きから POMANG 度より外が、ぽんぽん
    for nm, f, inside, c in cfg.get('boxes', []):
        for k in range(len(F)):
            if lab[k] == inside and f(cen[k]): col[k] = hx(c); lab[k] = nm
    if cfg.get('under'):   # 布の裏がわ：マントのすその下の面（下を向いた面）は、こいかげの色。ずきんの裏地は rim（顔のまわりの帯）
        T = P[F]; fn = np.cross(T[:, 1]-T[:, 0], T[:, 2]-T[:, 0]); fn /= np.maximum(np.linalg.norm(fn, axis=1, keepdims=True), 1e-12)
        c0 = P.mean(0); fn[((T.mean(1)-c0)*fn).sum(1) < 0] *= -1   # 三角形の表と裏がばらばらなので、外向きにそろえる
        for k in range(len(F)):
            if comp[k] == 0 and lab[k] == 'base' and fn[k, 2] < -0.2: col[k] = hx(cfg['under']); lab[k] = 'under'
    lc, lz = cfg['legs']
    for k in range(len(F)):
        if comp[k] == 0 and lab[k] == 'base' and cen[k, 2] < lz: col[k] = hx(lc); lab[k] = 'legs'
        if comp[k] > 0: col[k] = hx(cfg['parts']); lab[k] = 'part'
    return P, F, col, lab, H, cen

def cone(P, F, lab, H, uv):
    """ずきんの先：根もと（uv の2点のまん中。太さは2点のきょりの半分。持ち主がうしろの絵に引いた線のはじまり）から、ぽんぽんのつなぎ目まで、まっすぐ細くなる形にする。
    太さは、その場所のいまの太さのまん中に対する比をのこす（布のふにゃふにゃした感じは、そのまま）。根もとのほうは、少しずつ（もとの形となめらかにつなぐ）"""
    U, L = np.array(uv[0])*H, np.array(uv[1])*H; B = (U+L)/2; rb = np.linalg.norm(U-L)/2
    c1, pr, _, ax = POMC[:4]; A = c1+ax*pr; vb = np.array(sorted(set(F[lab == 'pom'].ravel()) & set(F[lab == 'hood'].ravel())))
    rt = np.linalg.norm(P[vb]-A, axis=1).mean() if len(vb) else 0.05*H
    d = A-B; Ld = np.linalg.norm(d); dh = d/Ld; P = P.copy()
    vh = np.unique(F[lab == 'hood']); T = ((P[vh]-B)@dh)/Ld; rad = P[vh]-(B+np.outer(T*Ld, dh)); cr = np.linalg.norm(rad, axis=1)
    sel = (T > 0) & (T < 1.02) & (cr < np.maximum(rb, rt)*1.8)
    bins = np.clip((T*10).astype(int), 0, 10); med = {b: np.median(cr[sel & (bins == b)]) for b in set(bins[sel].tolist())}
    for i in np.nonzero(sel)[0]:
        t = min(1.0, T[i]); want = rb*(1-t)+rt*t; m_ = med.get(bins[i], cr[i]) or cr[i]
        u = min(1, t/0.3); w = u*u*(3-2*u)   # 根もとは、少しずつ
        P[vh[i]] = B+dh*T[i]*Ld+rad[i]*((1-w)+w*want/max(m_, 1e-9))
    return P

def tipthin(P, F, lab, H, k):
    """ずきんの先（ぽんぽんへのびる所）を細く：ずきんの点を、まわり（TIPR）のずきんの点のまん中へよせる。顔の中心から右へいくほど強く（ずきんの頭の所はかえない）"""
    from scipy.spatial import cKDTree
    vh = np.unique(F[(lab == 'hood') | (lab == 'pom')]); vp = set(F[lab == 'pom'].ravel()); Q = P[vh]; t = cKDTree(Q); P = P.copy()
    for i, v in enumerate(vh):
        u = min(1, max(0, (Q[i, 0]/H-0.05)/0.3)); w = u*u*(3-2*u)   # なめらかに（急にすぼまらない）
        if POMC: w *= min(1, max(0, (np.linalg.norm(Q[i]-POMC[0])/(0.09*H)-1.0)/0.8))   # ぽんぽんのそばは、細くしない
        if w <= 0 or v in vp: continue
        nb = t.query_ball_point(Q[i], 0.07*H); c0 = Q[nb].mean(0); P[v] = Q[i]+(c0-Q[i])*k*w
    return P

def thin(P, F, lab, inner='face', band='rim', outer='hood', k=0.6):
    """布をうすく：ふち（band）の点のうち、内がわ（inner）にふれる点を、外がわ（outer）にふれる、いちばん近い点へ k だけよせる（帯がほそくなる。顔の面もいっしょにのびる）"""
    vi = set(F[lab == inner].ravel()); vb = set(F[lab == band].ravel()); vo = np.array(sorted(set(F[lab == outer].ravel()) & vb))
    if not len(vo): return P
    P = P.copy(); Q = P[vo]
    for v in sorted(vi & vb):
        j = np.argmin(((Q[:, [0, 2]]-P[v, [0, 2]])**2).sum(1)); P[v] = P[v]+(Q[j]-P[v])*k
    return P

EYEPX = ['+##+', '####', '####', '####', '####', '####', '+##+']   # 目のドット（はば4・高さ7の だ円。+ は、ふちの色。いまの絵の目と同じ色）

def eyepos(P, F, lab, H, e):
    """目のまん中（3D）：顔の面のまん中を中心に、左右そろえて、顔の面のいちばん前"""
    fc = P[F].mean(1); f0 = fc[lab == 'face']; cx = (f0[:, 0].min()+f0[:, 0].max())/2; out = []
    for sx in (-1, 1):
        x, z = cx+sx*e['x']*H, e['z']*H
        near = [k for k in np.nonzero(lab == 'face')[0] if abs(fc[k, 0]-x) < 0.06*H and abs(fc[k, 2]-z) < 0.08*H]
        y = max(fc[k, 1] for k in near) if near else 0.3*H
        out.append(np.array([x, y, z]))
    return out

def stamp(im, pts, col, edge=None):
    """目：きめたドットの形を、その場所におす（左右でまったく同じ形）"""
    a = np.array(im); c = list(hx(col).astype(int))+[255]; ce = list(hx(edge or col).astype(int))+[255]; h, w = len(EYEPX), len(EYEPX[0])
    for X, Y in pts:
        x0, y0 = int(round(X-w/2)), int(round(Y-h/2))
        for r, row in enumerate(EYEPX):
            for q, ch in enumerate(row):
                if ch in '#+' and 0 <= y0+r < a.shape[0] and 0 <= x0+q < a.shape[1] and a[y0+r, x0+q, 3]: a[y0+r, x0+q] = c if ch == '#' else ce
    return Image.fromarray(a)

SMIT = 12   # 面の向きをならす回数

def smoothshade(P, F, lab, R):
    """ドットごとのかげ：部品（lab）ごとに、点をならした写しの、点の面の向き（外向き）を、近い点からまぜて、光のあたり方を3だんにする"""
    from scipy.spatial import cKDTree
    cache = {}
    def part(name):
        if name in cache: return cache[name]
        fs = F[lab == name]; vs = np.unique(fs); idx = {v: i for i, v in enumerate(vs)}; fl = np.vectorize(idx.get)(fs); Q = P[vs]
        T = Q[fl]; fn = np.cross(T[:, 1]-T[:, 0], T[:, 2]-T[:, 0]); c0 = Q.mean(0)
        fn[((T.mean(1)-c0)*fn).sum(1) < 0] *= -1   # 三角形の表と裏がばらばらなので、外向きにそろえる（面の大きさで重みがつく）
        n = np.zeros_like(Q)
        for j in range(3): np.add.at(n, fl[:, j], fn)
        nbv = [set() for _ in range(len(Q))]
        for a_, b_, c_ in fl: nbv[a_] |= {b_, c_}; nbv[b_] |= {a_, c_}; nbv[c_] |= {a_, b_}
        n /= np.maximum(np.linalg.norm(n, axis=1, keepdims=True), 1e-9)
        for _ in range(SMIT):   # となりの点とまぜて、なめらかに
            n = np.array([n[i]+sum(n[j] for j in nbv[i]) for i in range(len(Q))]); n /= np.maximum(np.linalg.norm(n, axis=1, keepdims=True), 1e-9)
        pts = np.array([R(p) for p in P[vs]]); nr = np.array([R(q) for q in n])
        cache[name] = (cKDTree(pts), nr); return cache[name]
    def mk(base, name):
        t, nr = part(name)
        def f(x, y, z):
            d, i = t.query([x, y, z], k=6); w = 1/np.maximum(d, 1e-6); n = (nr[i]*w[:, None]).sum(0); n /= max(1e-9, np.linalg.norm(n))
            q = float(np.dot(n, O.LIGHT)); lv = 0 if q > 0.55 else 1 if q > 0.1 else 2
            return O.toon(base, lv)
        return f
    return mk

def hemdecal(P, F, lab, comp, H, cfg, yaw):
    """すそのライン：マントの外がわ（base）と、すその下の面（under）のさかい目の線から、hem の高さまでを、その色に（写すドットごと）。
    さかい目は1本につながっているので、どの向きから見ても、とぎれない"""
    from scipy.spatial import cKDTree
    hc, hh = cfg['hem']; vb = set(F[lab == 'base'].ravel()); vu = set(F[lab == 'under'].ravel()); bd = vb & vu
    pts = []; zb = P[np.unique(F[lab == 'base']), 2].min()
    for f in F[lab == 'base']:   # さかい目の辺を、こまかい点にする
        for i in range(3):
            a, b = f[i], f[(i+1) % 3]
            if a in bd and b in bd and max(P[a, 2], P[b, 2]) < zb+HEMTOP*H:   # すそのいちばん下のあたりの さかい目だけ（横のふちを上へのぼらない）
                for t in np.linspace(0, 1, 8): pts.append(P[a]+(P[b]-P[a])*t)
    if not pts: return None
    c, s_ = math.cos(yaw), math.sin(yaw); Q = np.array(pts); Qr = np.stack([Q[:, 0]*c-Q[:, 1]*s_, Q[:, 0]*s_+Q[:, 1]*c, Q[:, 2]], 1)
    t = cKDTree(Qr); col = hx(hc)
    def f(x, y, z):
        d, i = t.query([x, y, z])
        return col if d < hh*H and z >= Qr[i, 2]-0.002*H else None
    return f

HEMR, HEMTOP = 0.07, 0.18

def ellip(sc, c, r, col, n=20, m=12):
    sc.part()
    for j in range(m):
        t0, t1 = math.pi*j/m, math.pi*(j+1)/m
        for i in range(n):
            a0, a1 = 2*math.pi*i/n, 2*math.pi*(i+1)/n
            p = lambda t, a: np.array([c[0]+r[0]*math.sin(t)*math.cos(a), c[1]+r[1]*math.sin(t)*math.sin(a), c[2]+r[2]*math.cos(t)])
            sc.quad(p(t0, a0), p(t1, a0), p(t1, a1), p(t0, a1), col)

def hands(P, F, lab, H, dx):
    """手の場所：もらったモデルの手（handL・handR）の玉のまん中と半径。左右へ dx（高さ1あたり）はなす"""
    out = []
    for nm in ('handL', 'handR'):
        vs = np.unique(F[lab == nm])
        if not len(vs): continue
        c0 = P[vs].mean(0); r = np.percentile(np.linalg.norm(P[vs]-c0, axis=1), 80); out.append([c0, r])
    if len(out) == 2:   # 2つの手のまん中をさかいに、外へはなす（体のまん中 x=0 ではない。もらったモデルの手は左によっている）
        mid = (out[0][0][0]+out[1][0][0])/2
        for h in out: h[0] = h[0]+np.array([(-1 if h[0][0] < mid else 1)*dx*H, 0, 0])
    return [(c, r, mid if len(out) == 2 else 0.0) for c, r in out]

def fingers(sc, HD, R, col):
    """手：胸の前で、手のひらどうしを向かい合わせる（親指が上）。手のひら（ミトンの玉）の前のはしから、4本の指が前へのびて、先が内がわ（もう1つの手のほう）へまるまる。
    4本は、たてにならぶ（人さし指が上）。親指は、手の上から前へのびる"""
    for c0, r, mid in HD:
        si = 1 if c0[0] < mid else -1   # もう1つの手へ向かう向き（2つの手のまん中をさかいに）
        sc.smooth(True); n0 = len(sc.t); ellip(sc, c0, (r*0.8, r*0.9, r*0.95), col)
        sc.t[n0:] = [(R(a), R(b), R(c), cc, pid) for a, b, c, cc, pid in sc.t[n0:]]   # ellip は、まわす前の場所で作ったので、まわす
        for j, fz in enumerate((0.4, 0.13, -0.13, -0.4)):
            L = 1-0.15*abs(fz+0.05)/0.45
            pts = [c0+np.array([si*0.25*r, 0.7*r, fz*r]), c0+np.array([si*0.35*r, 1.1*r*L, fz*r]), c0+np.array([si*0.7*r, 1.25*r*L, fz*r*0.95]), c0+np.array([si*0.95*r, 1.05*r*L, fz*r*0.9])]
            tube(sc, [R(p) for p in pts], [0.2*r, 0.19*r, 0.18*r, 0.16*r], col)
        pts = [c0+np.array([si*0.1*r, 0.5*r, 0.75*r]), c0+np.array([si*0.25*r, 0.9*r, 0.85*r]), c0+np.array([si*0.4*r, 1.15*r, 0.75*r])]
        tube(sc, [R(p) for p in pts], [0.22*r, 0.2*r, 0.18*r], col)

def tube(sc, pts, rs, col, n=10):
    sc.part(); pts = [np.array(q, float) for q in pts]; rings = []
    for k in range(len(pts)):
        d = pts[min(k+1, len(pts)-1)]-pts[max(k-1, 0)]; d /= np.linalg.norm(d)
        u = np.cross(d, [0, 1.0, 0]);
        if np.linalg.norm(u) < 1e-6: u = np.array([1.0, 0, 0])
        u /= np.linalg.norm(u); v = np.cross(d, u)
        rings.append([pts[k]+rs[k]*(math.cos(t)*u+math.sin(t)*v) for t in np.linspace(0, 2*math.pi, n+1)[:-1]])
    for k in range(len(pts)-1):
        for i in range(n): sc.quad(rings[k][i], rings[k+1][i], rings[k+1][(i+1) % n], rings[k][(i+1) % n], col)
    for i in range(n): sc.tri(pts[-1], rings[-1][i], rings[-1][(i+1) % n], col)

def shoot(name, cfg, src, yaw=0.0):
    m, comp = load(os.path.join(src, 'kg_%s.glb' % name)); P, F, col, lab, H, cen = paint(m, comp, cfg)
    if cfg.get('thin'): P = thin(P, F, lab, k=cfg['thin'])
    if cfg.get('tip'): P = tipthin(P, F, lab, H, cfg['tip'])
    if cfg.get('cone') and POMC: P = cone(P, F, lab, H, cfg['cone'])
    HD = hands(P, F, lab, H, cfg.get('apart', 0)) if cfg.get('fingers') else []
    if HD:   # もらったモデルの手は、まん中へちぢめてかくす（新しい手を組む）
        P = P.copy(); other = set(F[(lab != 'handL') & (lab != 'handR')].ravel())
        for nm in ('handL', 'handR'):
            vs = [v for v in np.unique(F[lab == nm]) if v not in other]
            if vs: P[vs] = P[vs].mean(0)+(P[vs]-P[vs].mean(0))*0.3
    c, s = math.cos(yaw), math.sin(yaw); R = lambda p: np.array([p[0]*c-p[1]*s, p[0]*s+p[1]*c, p[2]])
    O.LIGHT[:] = np.array([-0.45, 0.65, 0.65])/np.linalg.norm([-0.45, 0.65, 0.65])
    sc = O.Scene(); last = None; sc.smooth(True)
    hemf = hemdecal(P, F, lab, comp, H, cfg, yaw) if cfg.get('hem') else None
    pomf = None
    if POMC:   # ぽんぽんのさかい目：玉のまん中からのきょりで、ドットごとに（三角形のさかいの、まっすぐな線や切れこみを出さない）
        pc0 = R(POMC[0]); pr = POMC[1]; pcol = POMC[2]; pax = R(POMC[3]); prad = POMC[4]; hcol = hx(dict((q[0], q[3]) for q in cfg['seeds']).get('hood', cfg['base']))
        lw_ = 1.0*H/cfg['HPX']; lcol = hcol*0.72   # さかい目の輪郭線：1ドットのはば、ずきんの色を暗くした色
        cs = R(POMC[5]); rs = POMC[6]
        Bc = R((np.array(cfg['cone'][0])+np.array(cfg['cone'][1]))/2*H) if cfg.get('cone') else R(POMC[0]+POMC[3])
        tdir = (Bc-cs)/np.linalg.norm(Bc-cs); ca = math.cos(math.radians(POMANG)); lwa = lw_/rs   # 輪郭線のはば（角度のぶん）
        def pomf(x, y, z):
            q = np.array([x, y, z])-cs; d = np.linalg.norm(q)
            if d > rs*1.12: return hcol   # 玉からはなれた所は、ずきん
            c_ = float(q@tdir)/max(d, 1e-9)   # ずきんの先へつながる向きとの、角度の cos
            return hcol if c_ > ca else lcol if c_ > ca-lwa else pcol
    for k, f in enumerate(F):
        if lab[k] != last:
            sc.decal(hemf if lab[k] == 'base' else pomf if lab[k] in ('hood', 'pom') else None); sc.group('hoodpom' if lab[k] in ('hood', 'pom') else None)   # ずきんとぽんぽんは、三角形のさかいに線を引かない（さかい目の線は pomf）
            sc.part(); last = lab[k]
        sc.tri(R(P[f[0]]), R(P[f[1]]), R(P[f[2]]), col[k])
    sc.decal(None); sc.group(None)
    if HD: fingers(sc, HD, R, hx(cfg.get('hand', '#a597ba')))
    sc.smooth(False)
    # 大きく（BIG 倍）写してから、色の平均（pixdown）でちぢめる：三角形ごとのかげのむらが、ならされる
    # カメラ：たての画角は、焦点距離 FOCAL の 35mm判（たて24mm）。体の高さの1.15倍がちょうど入るきょりに置く。体のまん中の奥行きで、高さ HPX ドット
    # うしろ向きは、BACKEL 度 上から見おろす（持ち主がきめた）
    t = math.radians(BACKEL if abs(math.cos(yaw)+1) < 1e-6 else 0.0); V = np.array([0, math.cos(t), math.sin(t)]); U = np.array([0, -math.sin(t), math.cos(t)])
    fov = 2*math.atan(12/FOCAL); Dc = 1.15*H/(2*math.tan(fov/2)); cz = H/2; k = cfg['HPX']/H; C0 = np.array([0, 0, cz])
    def proj(p):
        q = np.asarray(p)-C0; d = float(q@V); sc_ = Dc/(Dc-d)
        return (q[0]*sc_*k, -(cz+float(q@U)*sc_)*k)
    Q = np.array([proj(p) for tr in sc.t for p in tr[:3]]); ext = (math.floor(Q[:, 0].min())-2, math.ceil(Q[:, 0].max())+2, math.floor(Q[:, 1].min())-2, math.ceil(Q[:, 1].max())+2)
    O.S = BIG; O.GRAD = True
    hi = O.render_px(sc, proj, ext, V, k=0.80, lw=2, k2=0.90, merge=0)
    if os.environ.get('KWDBG'): hi.save(os.path.join(os.environ['KWDBG'], 'hi_%s_%d.png' % (name, round(math.degrees(yaw)))))   # たしかめ用：ちぢめる前の大きな絵
    import pixdown
    W0, H0 = (ext[1]-ext[0]), (ext[3]-ext[2])
    o = pixdown.shrink(np.asarray(hi).astype(float), W0, H0); o = pixdown.lines(o, np.asarray(hi).astype(float)); o = pixdown.outline(o, np.asarray(hi).astype(float))
    im = despeckle(quant(rim(Image.fromarray(o.round().astype(np.uint8), 'RGBA')), NCOL, cfg.get('hem', (None,))[0]))
    if abs(math.cos(yaw)-1) < 1e-6:   # 正面だけ、目をおす
        im = stamp(im, [(proj(R(p))[0]-ext[0], proj(R(p))[1]-ext[2]) for p in eyepos(P, F, lab, H, cfg['eyes'])], cfg['eyes']['col'], cfg['eyes'].get('edge'))
    return im, ext

BACKEL = 15.0
POMANG = 50.0   # ぽんぽん：ずきんの先がつながる向きから、この角度までは、ずきん
BIG = 8; NCOL = 15   # 大きく写す倍・色の数（目の色を足して16）

def rim(im, k=0.62):
    """外の輪郭線：透明の所で、上下左右に物があるドットを、となりの色を暗くした色にする（黒にはしない）"""
    a = np.array(im); b = a.copy(); m = a[..., 3] > 0; H, W = m.shape
    for y in range(H):
        for x in range(W):
            if m[y, x]: continue
            nb = [a[y+dy, x+dx, :3] for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)) if 0 <= y+dy < H and 0 <= x+dx < W and m[y+dy, x+dx]]
            if nb: b[y, x, :3] = np.mean(nb, 0)*k; b[y, x, 3] = 255
    return Image.fromarray(b)

def quant(im, n, keep=None, nk=2):
    """色を n 色にまとめる（メディアンカット）。keep（金のライン）に近い色のドットは、べつに nk 色にまとめる（まざって、ほかの所が黄色くならない）"""
    a = np.array(im); m = a[..., 3] > 0; g = np.zeros_like(m)
    if keep is not None:
        import colorsys
        hk = colorsys.rgb_to_hsv(*(hx(keep)/255))[0]
        for y, x in zip(*np.nonzero(m)):
            h, s_, v = colorsys.rgb_to_hsv(*(a[y, x, :3]/255))
            g[y, x] = s_ > 0.25 and min(abs(h-hk), 1-abs(h-hk)) < 0.06
    for sel, k in ((m & ~g, n-(nk if g.any() else 0)), (g, nk)):
        if not sel.any(): continue
        px = a[..., :3][sel]; q = np.array(Image.fromarray(px.reshape(1, -1, 3)).quantize(k, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert('RGB')).reshape(-1, 3)
        a[..., :3][sel] = q
    return Image.fromarray(a)

def despeckle(im, n=2):
    """まわり8つのどれともちがう色の1ドット（孤立ドット）を、まわりでいちばん多い色にする"""
    a = np.array(im); H, W = a.shape[:2]
    for _ in range(n):
        b = a.copy()
        for y in range(1, H-1):
            for x in range(1, W-1):
                if a[y, x, 3] == 0: continue
                nb = [tuple(a[y+dy, x+dx]) for dy in (-1, 0, 1) for dx in (-1, 0, 1) if dy or dx]
                me = tuple(a[y, x])
                if me in nb: continue
                op = [c for c in nb if c[3]]
                if len(op) < 8: continue   # まわりのふち（輪郭）は、そのまま
                b[y, x] = max(set(op), key=op.count)
        a = b
    return Image.fromarray(a)

if __name__ == '__main__':
    src, out = sys.argv[1], sys.argv[2]; os.makedirs(out, exist_ok=True)
    for name in (sys.argv[3:] or list(CFG)):
        for B, yaw in (('', 0.0), ('B', math.pi)):
            im, e = shoot(name, CFG[name], src, yaw); im.save(os.path.join(out, 'kg_%s%s.png' % (name, B))); print(name+B, im.size, e)
