"""せいれいの「歩く」を、いまの絵と同じシルエットの3Dにして、ボーンで動かし、ドット絵に写す。
  python3 tools/art/spirit3d/spirit3d.py            → assets/g/<中身の名前>.webp を作り、js/draw-spirits.js の SPW3D の行を書きかえる
  python3 tools/art/spirit3d/spirit3d.py <フォルダ>  → そのフォルダに、たしかめ用の絵（属性ごと・向きごと）も出す

設計図（単位はチップの1ドット。x=右, y=手前（キャラの前）, z=上。足もとが原点）：
  形は、いまのチップの「正面の絵」と「横の絵」の、両方の形の中にある所（ボクセル）。だから、止まっていれば正面も横も、いまの絵と同じシルエット。
    体 sp:body0 × sp:bodyS0／足 sp:footL・R × sp:footS／ずきん <属性>:hood × hoodS／顔 sp:head × sp:headS（風は顔の丸なし）
    頭の上の物：木・火・水の tip、土の sprout、風の vine、火の ember（それぞれ正面 × 横）
  うで・手：sp:arm（横向きは sp:armS）・sp:hand の絵を、うでの軸のまわりに回した形（どこから見ても同じ細さ）。
  しっぽ（風いがい）・風のはね：絵のうすい板。
  うで・しっぽ・はねは、いまの絵が向きごとに置き方をかえているので、向きごとに、いまの絵と同じ所・角度に置く（drawSpiritDot の数のまま。canvas の数×.87 がチップのドット）。
色：体・足・うでは、体の色と線の色（外のふち2ドット。体と手足のつなぎ目には線なし。手前の手足がうしろにかさなる所だけ線）。
    ずきん・顔・頭の上の物・しっぽ・はねは、その向きのいまの絵の色を、表面にうつす（うしろ向きは、正面の絵を裏から）。
    目・ほっぺ・まつげは写さない（ゲームで、いまの絵を顔の所にかさねる。コマごとのずれ = SPW3D.eye）。
動き（1回の歩きを8コマ。ゲームの walk の t*9 で1まわり）：
  足は付け根で前後にふり、ふり出す足を上げる／体ははずみ・ひねり・かたむき／うでは足と反対にふる（歩くときは下げる ARMW）／
  頭は体より小さくゆれる／頭の上の物・しっぽ・はねは、すこしおくれてゆれる。
写し方：まっすぐ正面（画面 = (x, −z)）。1ドットを4×4に分けて写し、半分いじょううまったドットを、いちばん多い部品の色にする。"""
import math, json, sys, os, io, hashlib, re
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))
sys.path.insert(0, os.path.join(ROOT, 'tools'))
import chips as CH

Q = 0.25; QH = 0.5   # ボクセルの大きさ（体・うで／頭）
SSN = 4              # 写すときの細かさ
DZ = 2.5             # かさなりの線を引く、奥行きの差
N = 8                # 1回の歩きのコマ数
EXT = (-60, 60, -116, 8)
ELS = ['earth', 'water', 'fire', 'wind', 'wood']
CREAM = (253, 248, 239)
SPC = {'earth': {'hand': '#e3c3a3', 'line': '#ead6bd'}, 'water': {'hand': '#f3dfc6', 'line': '#ecd9c0'}, 'fire': {'hand': '#ffc887', 'line': '#f0d4ae'},
       'wind': {'hand': '#c8e2b4', 'line': '#c2dcaa'}, 'wood': {'hand': '#d6e8c2', 'line': '#e2d6bc'}}
hx = lambda h: tuple(int(h[i:i+2], 16) for i in (1, 3, 5))

_, CHIPS = CH.load_imgs()
def chip(k):
    c = CHIPS[k]; return np.array(c['f'][0].convert('RGBA')), c['ax'], c['ay']
def inside(k, X, Y):
    a, ax, ay = chip(k); c = np.floor(X-ax).astype(int); r = np.floor(Y-ay).astype(int)
    ok = (c >= 0) & (c < a.shape[1]) & (r >= 0) & (r < a.shape[0])
    out = np.zeros(X.shape, bool); out[ok] = a[r[ok], c[ok], 3] > 0; return out
def comp(*ks):
    """いくつかのチップを画面の座標でかさねた絵 → (絵, 左, 上)"""
    L = [chip(k) for k in ks]; x0 = min(l[1] for l in L); y0 = min(l[2] for l in L)
    x1 = max(l[1]+l[0].shape[1] for l in L); y1 = max(l[2]+l[0].shape[0] for l in L)
    out = Image.new('RGBA', (x1-x0, y1-y0))
    for a, ax, ay in L: out.alpha_composite(Image.fromarray(a), (ax-x0, ay-y0))
    return np.array(out), x0, y0
def sample(tex, X, Y):
    a, x0, y0 = tex; c = np.floor(X-x0).astype(int); r = np.floor(Y-y0).astype(int)
    ok = (c >= 0) & (c < a.shape[1]) & (r >= 0) & (r < a.shape[0]); okk = ok.copy(); okk[ok] = a[r[ok], c[ok], 3] > 0
    out = np.zeros((len(X), 3), np.uint8); hit = np.zeros(len(X), bool); out[okk] = a[r[okk], c[okk], :3]; hit[okk] = True
    if (~hit).any() and hit.any():   # 絵の外にはみ出した所（裏から見たときなど）は、いちばん近い色
        ys, xs = np.nonzero(a[..., 3] > 0); Pm = np.stack([X[~hit]-x0-0.5, Y[~hit]-y0-0.5], 1); I = np.empty(len(Pm), int)
        for s0 in range(0, len(Pm), 2000):
            q = Pm[s0:s0+2000]; I[s0:s0+2000] = np.argmin((q[:, None, 0]-xs[None])**2+(q[:, None, 1]-ys[None])**2, 1)
        out[~hit] = a[ys[I], xs[I], :3]
    return out

def hull(front, side, q):
    """正面の絵（x,z）と横の絵（y,z）の両方の中のボクセル。表面から2つぶんだけ（中はぬく）"""
    fa, fx0, fy0 = chip(front); sa, sx0, sy0 = chip(side)
    xs = np.arange(fx0+q/2, fx0+fa.shape[1], q); ys = np.arange(sx0+q/2, sx0+sa.shape[1], q)
    z0 = -max(fy0+fa.shape[0], sy0+sa.shape[0]); z1 = -min(fy0, sy0); zs = np.arange(z0+q/2, z1, q)
    F = np.stack([inside(front, np.full(len(zs), x), -zs) for x in xs]); Sd = np.stack([inside(side, np.full(len(zs), y), -zs) for y in ys])
    V = F[:, None, :] & Sd[None, :, :]; inner = V.copy()
    for _ in range(2):
        e = inner.copy()
        for ax in range(3):
            sl = lambda a, b: tuple(slice(a, b) if i == ax else slice(None) for i in range(3))
            e[sl(1, None)] &= inner[sl(None, -1)]; e[sl(None, -1)] &= inner[sl(1, None)]
            e[tuple(0 if i == ax else slice(None) for i in range(3))] = False; e[tuple(-1 if i == ax else slice(None) for i in range(3))] = False
        inner = e
    I = np.argwhere(V & ~inner); return np.stack([xs[I[:, 0]], ys[I[:, 1]], zs[I[:, 2]]], 1)

def revolve(name, rmax):
    a, ax, ay = chip(name)
    g = np.mgrid[ax+Q/2:ax+a.shape[1]:Q, -rmax+Q/2:rmax:Q, -rmax+Q/2:rmax:Q].reshape(3, -1).T
    r = np.hypot(g[:, 1], g[:, 2]); k = inside(name, g[:, 0], r) | inside(name, g[:, 0], -r); return g[k]
def plate(name, q=Q):
    """チップの絵のうすい板（よこ u・たて v、画面の向き）と、その場所の色"""
    a, ax, ay = chip(name); g = np.mgrid[ax+q/2:ax+a.shape[1]:q, ay+q/2:ay+a.shape[0]:q].reshape(2, -1).T
    k = inside(name, g[:, 0], g[:, 1]); g = g[k]
    c = a[np.floor(g[:, 1]-ay).astype(int), np.floor(g[:, 0]-ax).astype(int), :3]; return g, c
def rot2(g, th):
    c, s = math.cos(th), math.sin(th); return g[:, 0]*c-g[:, 1]*s, g[:, 0]*s+g[:, 1]*c   # canvas の rotate（画面は y が下）

def rx(a):
    c, s = math.cos(a), math.sin(a); return np.array([[1, 0, 0], [0, c, -s], [0, s, c]])
def ry(a):
    c, s = math.cos(a), math.sin(a); return np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]])
def rz(a):
    c, s = math.cos(a), math.sin(a); return np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]])
def view(face):
    """face：0 正面・1 右向き・2 うしろ → (画面 x, 画面 y, 手前ほど大きい数)"""
    R = rz(-face*math.pi/2)
    def f(P):
        Wd = P@R.T; return Wd[:, 0], -Wd[:, 2], Wd[:, 1]
    return f
def scr2loc(face, X, Y, depth):
    """その向きの画面の場所 (X, Y) と、手前ほど大きい数 depth → キャラの座標"""
    if face == 0: return np.stack([X, np.full(len(X), 0.)+depth, -Y], 1)
    if face == 1: return np.stack([np.full(len(X), 0.)-depth, X, -Y], 1)
    return np.stack([-X, np.full(len(X), 0.)-depth, -Y], 1)

# ---- うで（向きごとに、いまの絵と同じ置き方。canvas の数×.87） ----
K = .87
SH = (14*K, 26*K)
ARMV = {0: ('sp:arm', 0.7, SH[0]), 2: ('sp:arm', 0.35, SH[0]), 1: ('sp:armS', math.pi/2, 0.0)}
ARMW = {0: 1.15, 2: 0.95, 1: math.pi/2}   # 歩くときのうでの角度（下げる）
def arm_rest(face, sx, part, walk):
    chipn, th0, shx = ARMV[face]
    if walk: th0 = ARMW[face]
    v = revolve(chipn if part == 'arm' else 'sp:hand', 8 if part == 'arm' else 5)
    u, vv, w = v[:, 0]*sx, v[:, 1], v[:, 2]; X, Y = rot2(np.stack([u, vv], 1), sx*th0); z = SH[1]-Y
    if face == 1: return np.stack([-sx*15+w, shx+X, z], 1)
    if face == 2: return np.stack([-(sx*shx+X), -w, z], 1)
    return np.stack([sx*shx+X, w, z], 1)
def shoulder(face, sx):
    _, _, shx = ARMV[face]
    if face == 1: return np.array([-sx*15, shx, SH[1]])
    if face == 2: return np.array([-sx*shx, 0, SH[1]])
    return np.array([sx*shx, 0, SH[1]])

# ---- 属性ごとの頭の上の物：(チップ, 横のチップ, 動き) ----
TOPS = {'wood': [('tip', 'rotY', 0.12, -0.6)], 'fire': [('tip', 'rotY', 0.16, 0.0), ('ember', 'bob', 2.2, 0.0)],
        'water': [('tip', 'bob', 1.2, -0.6)], 'earth': [('sprout', 'rotY', 0.15, -0.6)], 'wind': [('vine', 'rotY', 0.12, -0.6)]}
WINGS = [(-16, -60, 44, -2.5, -1), (16, -60, 44, -.64, 1), (-18, -40, 38, 2.75, 1), (18, -40, 38, .39, -1)]   # 風のはね（drawSpiritDot と同じ数）

class Spirit:
    def __init__(self, el):
        self.el = el; E = 'sp_'+el+':'; self.E = E
        line = hx(SPC[el]['line']); hand = hx(SPC[el]['hand']); self.LINE = line
        cream = lambda P: np.tile(np.array(CREAM, np.uint8), (len(P), 1))
        self.base = {'body': (hull('sp:body0', 'sp:bodyS0', Q), 'cream'), 'legL': (hull('sp:footL', 'sp:footS', Q), 'cream'), 'legR': (hull('sp:footR', 'sp:footS', Q), 'cream'),
                     'hood': (hull(E+'hood', E+'hoodS', QH), {0: comp(E+'hood'), 1: comp(E+'hoodS'), 2: comp(E+'hood')})}
        if el != 'wind':
            fr = ('sp:head', E+'bang') if el == 'fire' else ('sp:head',)
            self.base['face'] = (hull('sp:head', 'sp:headS', QH), {0: comp(*fr), 1: comp('sp:headS'), 2: comp('sp:head')})
        self.tops = []
        for nm, mode, amp, lag in TOPS[el]:
            P = hull(E+nm, E+nm+'S', QH); self.base[nm] = (P, {0: comp(E+nm), 1: comp(E+nm+'S'), 2: comp(E+nm)})
            self.tops.append((nm, mode, amp, lag, np.array([P[:, 0].mean(), P[:, 1].mean(), P[:, 2].min()])))
        self.hand = hand; self.cache = {}
    def parts(self, face, walk):
        """向き face の部品：名前 → (ボクセル, 色)。色は 'cream'・'hand'、または表面の色の配列"""
        k = (face, walk)
        if k in self.cache: return self.cache[k]
        P = {}
        for nm, (V, tex) in self.base.items():
            if isinstance(tex, str): P[nm] = (V, tex)
            else:
                X, Y, _ = view(0 if face == 2 else face)(V)   # うしろは、正面の絵を裏からうつす
                P[nm] = (V, sample(tex[face], X, Y))
        for sx, s in ((-1, 'L'), (1, 'R')):
            P['arm'+s] = (arm_rest(face, sx, 'arm', walk), 'cream'); P['hand'+s] = (arm_rest(face, sx, 'hand', walk), 'hand')
        if self.el != 'wind':   # しっぽ：横向きは (−18,−16) で −0.85、正面・うしろは (0,−17)（体のうしろ）
            g, c = plate(self.E+'tail'); tx, ty, th = (-18*K, -16*K, -0.85) if face == 1 else (0, -17*K, 0.0)
            X, Y = rot2(g, th); X = X+tx; Y = Y+ty; L = []
            for d in np.arange(-0.75, 1.0, Q):
                L.append(np.stack([np.full(len(X), d), X, -Y], 1) if face == 1 else scr2loc(face, X, Y, -15+d if face == 0 else 15-d))
            P['tail'] = (np.concatenate(L), np.tile(c, (len(L), 1)))
            P['_tailpiv'] = np.array([0, tx, -ty]) if face == 1 else scr2loc(face, np.array([tx]), np.array([ty]), -15 if face == 0 else 15)[0]
        else:
            for i, (wx, wy, ln, th, sg) in enumerate(WINGS):
                g, c = plate(self.E+'leaf')
                if face == 2 and i < 2:   # うしろ向きの上のはねは、少し白っぽく（leafW を .25 でかさねる）
                    _, cw = plate(self.E+'leafW'); c = np.clip(c*0.75+cw*0.25, 0, 255).astype(np.uint8)
                sc = ln/44*(1.13 if face == 2 else 1)
                X, Y = rot2(g*sc, th)
                if face == 2: px, py = 1.13*wx*K, (-30+1.13*(wy+36))*K
                else: px, py = wx*K, wy*K
                X = X+px; Y = Y+py
                if face == 1: X = -9*K+0.7*X
                L = []
                for d in np.arange(-0.75, 1.0, Q):
                    L.append(np.stack([np.full(len(X), 10+d), X, -Y], 1) if face == 1 else scr2loc(face, X, Y, -28+d if face == 0 else 28-d))
                piv = np.array([10, -9*K+0.7*px, -py]) if face == 1 else scr2loc(face, np.array([px]), np.array([py]), -28 if face == 0 else 28)[0]
                P['wing%d' % i] = (np.concatenate(L), np.tile(c, (len(L), 1)), piv, sg)
        self.cache[k] = P; return P

def pose(sp, ph, face):
    """コマ ph（0〜1。None は止まっているとき）の、部品ごとのうつし方 f(点)"""
    I = lambda p: p
    if ph is None: return {}, I
    w = 2*math.pi*ph; t = ph*2*math.pi/9
    bob = -1.0*abs(math.cos(w))+0.5
    Rb = rz(0.12*math.sin(w))@ry(0.07*math.sin(w)); hip0 = np.array([0, 0, 11.])
    def body(p): return (p-hip0)@Rb.T+hip0+np.array([0, 0, bob])
    F = {'body': body}
    for s, k in (('L', 0), ('R', 1)):
        a = math.sin(w+k*math.pi); lift = max(0.0, math.cos(w+k*math.pi)); R = rx(-0.5*a); h = np.array([-8. if s == 'L' else 8., 0, 11])
        F['leg'+s] = (lambda R, h, lift: lambda p: (p-h)@R.T+h+np.array([0, 0, 2.5*lift+bob*0.3]))(R, h, lift)
    for s, k, sx in (('L', 0, -1), ('R', 1, 1)):
        R = rx(0.8*math.sin(w+k*math.pi)); h = shoulder(face, sx)
        F['arm'+s] = F['hand'+s] = (lambda R, h: lambda p: body((p-h)@R.T+h))(R, h)
    piv = np.array([0., 0, 26])
    Rh = rz(0.07*math.sin(w))@ry(0.03*math.sin(w))@rx(0.025*math.cos(2*w))
    def head(p): return (p-piv)@Rh.T+body(piv[None])[0]
    F['hood'] = F['face'] = head
    for nm, mode, amp, lag, b in sp.tops:
        if mode == 'rotY': R = ry(amp*math.sin(w+lag)); F[nm] = (lambda R, b: lambda p: head((p-b)@R.T+b))(R, b)
        else: d = np.array([0, 0, amp*math.sin(w+lag)]); F[nm] = (lambda d: lambda p: head(p+d))(d)
    if sp.el != 'wind':
        tp = sp.cache[(face, True)]['_tailpiv']; Rq = rx(0.25*math.sin(w+0.8)) if face == 1 else ry(0.2*math.sin(w+0.8))
        F['tail'] = lambda p: body((p-tp)@Rq.T+tp)
    else:
        fl = math.sin(t*10)*.12   # はばたき（いまの絵と同じ：歩くときは t*10）
        for i in range(4):
            def wf(p, i=i):
                P0 = sp.cache[(face, True)]['wing%d' % i]; pv, sg = P0[2], P0[3]
                R = rx(-sg*fl) if face == 1 else ry(sg*fl if face == 0 else -sg*fl)   # 板の面の中で回す
                return head((p-pv)@R.T+pv)
            F['wing%d' % i] = wf
    return F, head

EYEP = np.array([0., 22, 40.5])
def shoot(sp, ph, face):
    walk = ph is not None
    PARTS = sp.parts(face, walk); F, head = pose(sp, ph, face); V = view(face)
    names = [n for n in PARTS if not n.startswith('_')]; Wd, Hd = (EXT[1]-EXT[0])*SSN, (EXT[3]-EXT[2])*SSN
    zb = np.full(Wd*Hd, -1e9); idb = np.full(Wd*Hd, -1); cb = np.zeros((Wd*Hd, 3), np.uint8)
    for i, nm in enumerate(names):
        rec = PARTS[nm]; P0, col = rec[0], rec[1]
        P = F.get(nm, lambda p: p)(P0); X, Y, Z = V(P)
        C = np.tile(np.array(CREAM if col == 'cream' else sp.hand, np.uint8), (len(P0), 1)) if isinstance(col, str) else col
        if nm.startswith('hand'): Z = Z+7          # 手は、うでの上
        if nm == 'face': Z = Z+(60 if face != 2 else -1000)   # 顔はずきんの上（うしろ向きでは見えない）
        k = int(round((QH if nm in ('hood', 'face') or nm in [t[0] for t in sp.tops] else Q)*SSN))
        for ox in range(k):
            for oy in range(k):
                c = np.floor((X-EXT[0])*SSN).astype(int)+ox; r = np.floor((Y-EXT[2])*SSN).astype(int)+oy
                ok = (c >= 0) & (c < Wd) & (r >= 0) & (r < Hd); j = r[ok]*Wd+c[ok]; z = Z[ok]; cc = C[ok]
                o = np.lexsort((z, j)); j, z, cc = j[o], z[o], cc[o]; last = np.r_[j[1:] != j[:-1], True]; j, z, cc = j[last], z[last], cc[last]
                bt = z > zb[j]; zb[j[bt]] = z[bt]; idb[j[bt]] = i; cb[j[bt]] = cc[bt]
    zb = zb.reshape(Hd, Wd); idb = idb.reshape(Hd, Wd); cb = cb.reshape(Hd, Wd, 3)
    W1, H1 = Wd//SSN, Hd//SSN
    blk = idb.reshape(H1, SSN, W1, SSN).transpose(0, 2, 1, 3).reshape(H1, W1, -1)
    zbk = zb.reshape(H1, SSN, W1, SSN).transpose(0, 2, 1, 3).reshape(H1, W1, -1)
    cbk = cb.reshape(H1, SSN, W1, SSN, 3).transpose(0, 2, 1, 3, 4).reshape(H1, W1, -1, 3)
    pk = (cbk[..., 0].astype(np.int64) << 16) | (cbk[..., 1].astype(np.int64) << 8) | cbk[..., 2]
    cov = (blk >= 0).sum(-1); ids = np.full((H1, W1), -1); dep = np.full((H1, W1), -1e9); img = np.zeros((H1, W1, 4), np.uint8)
    for yy, xx in np.argwhere(cov*2 >= SSN*SSN):
        bb = blk[yy, xx]; v, n = np.unique(bb[bb >= 0], return_counts=True); i = v[np.argmax(n)]; ids[yy, xx] = i
        m = bb == i; dep[yy, xx] = zbk[yy, xx][m].mean()
        cv, cn = np.unique(pk[yy, xx][m], return_counts=True); c = cv[np.argmax(cn)]
        img[yy, xx] = (c >> 16 & 255, c >> 8 & 255, c & 255, 255)
    cream = np.isin(ids, [names.index(n) for n in ('body', 'legL', 'legR', 'armL', 'armR')])
    hands = [names.index('handL'), names.index('handR')]; legs = [names.index('legL'), names.index('legR')]; bodyi = names.index('body')
    def sh(a, dy, dx, fill):
        o = np.full_like(a, fill); o[max(dy, 0):H1+min(dy, 0), max(dx, 0):W1+min(dx, 0)] = a[max(-dy, 0):H1+min(-dy, 0), max(-dx, 0):W1+min(-dx, 0)]; return o
    solid = ids >= 0; line = np.zeros((H1, W1), bool)
    for d in (1, 2):
        for dy, dx in ((0, d), (0, -d), (d, 0), (-d, 0)):
            line |= cream & ~sh(solid, dy, dx, False)
            nid = sh(ids, dy, dx, -1); nd = sh(dep, dy, dx, -1e9)
            line |= cream & (ids != bodyi) & (nid >= 0) & (nid != ids) & (dep-nd > DZ) & ~np.isin(nid, hands) & ~(np.isin(ids, legs) & (nid == bodyi))
    img[line, :3] = sp.LINE
    X1, Y1, _ = V(head(EYEP[None])); X0, Y0, _ = V(EYEP[None])
    return img, [int(round(X1[0]-X0[0])), int(round(Y1[0]-Y0[0]))]

def build(dbg=None):
    frames = {}; eye = {}
    for el in ELS:
        sp = Spirit(el); eye[el] = []
        for face in (0, 1, 2):
            row = []
            for i in range(N):
                im, e = shoot(sp, i/N, face); frames[(el, face, i)] = im; row.append(e)
            eye[el].append(row)
            if dbg:
                rest, _ = shoot(sp, None, face); Image.fromarray(rest).save(os.path.join(dbg, f'rest_{el}_{face}.png'))
        print(el, 'ok', flush=True)
    # 1まいにまとめる：属性ごとに3行（正面・横・うしろ）×8コマ。わくは属性ごとに、その属性のぜんぶのコマの絵が入る大きさ
    box = {}
    for el in ELS:
        al = np.stack([f[..., 3] > 0 for (e, _, _), f in frames.items() if e == el]).any(0); ys, xs = np.nonzero(al)
        box[el] = (int(xs.min()), int(xs.max())+1, int(ys.min()), int(ys.max())+1)
    W = max(b[1]-b[0] for b in box.values())*N; H = sum((b[3]-b[2])*3 for b in box.values())
    sheet = np.zeros((H, W, 4), np.uint8); geo = {}; y = 0
    for el in ELS:
        x0, x1, y0, y1 = box[el]; cw, ch = x1-x0, y1-y0
        for face in range(3):
            for i in range(N): sheet[y+face*ch:y+(face+1)*ch, i*cw:(i+1)*cw] = frames[(el, face, i)][y0:y1, x0:x1]
        geo[el] = [y, cw, ch, int(EXT[0]+x0), int(EXT[2]+y0)]   # 絵の中の上・わくのはば・高さ・わくの左上（足もとからのチップのドット）
        y += ch*3
    return Image.fromarray(sheet), {'n': N, 'geo': geo, 'eye': eye}

if __name__ == '__main__':
    dbg = sys.argv[1] if len(sys.argv) > 1 else None
    if dbg: os.makedirs(dbg, exist_ok=True)
    im, meta = build(dbg)
    b = io.BytesIO(); im.save(b, 'WEBP', lossless=True, exact=True, quality=100, method=6); data = b.getvalue()
    name = 'assets/g/'+hashlib.sha1(data).hexdigest()[:10]+'.webp'
    js = os.path.join(ROOT, 'js', 'draw-spirits.js'); src = open(js, encoding='utf8').read()
    m = re.search(r"^const SPW3D=\{src:'(assets/g/[0-9a-f]+\.webp)'", src, re.M)
    if m and m.group(1) != name and os.path.exists(os.path.join(ROOT, m.group(1))): os.remove(os.path.join(ROOT, m.group(1)))
    open(os.path.join(ROOT, name), 'wb').write(data)
    meta['src'] = name
    line = 'const SPW3D=' + json.dumps({'src': name, 'n': meta['n'], 'geo': meta['geo'], 'eye': meta['eye']}, separators=(',', ':')).replace('"', "'") + ';/* 3Dから写した「歩く」（tools/art/spirit3d/spirit3d.py が書く） */'
    if re.search(r'^const SPW3D=.*$', src, re.M): src = re.sub(r'^const SPW3D=.*$', lambda _: line, src, flags=re.M)
    else: print('js/draw-spirits.js に const SPW3D= の行がありません')
    open(js, 'w', encoding='utf8').write(src)
    if dbg: im.save(os.path.join(dbg, 'sheet.png'))
    print(name, im.size, len(data), 'bytes')
