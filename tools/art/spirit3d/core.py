"""せいれいの3Dの体と、写し方（spirit3d の共通の部分）。
単位はチップの1ドット。x=右, y=キャラの前, z=上。足もとが原点。キャラは +y を向いて立つ。
形：いまのチップの「正面の絵」と「横の絵」の、両方の形の中にある所（ボクセル）。止まっていれば、正面も横も、いまの絵と同じシルエット。
  体 sp:body0 × sp:bodyS0／足 sp:footL・R × sp:footS／ずきん <属性>:hood × hoodS／顔 sp:head × sp:headS（風は顔の丸なし）／頭の上の物（tip・sprout・vine・ember）
  うで・手：うでの絵を、うでの軸のまわりに回した形（細さがかわらない）。まっすぐ下にたらしたうでを、向きごとに、いまの絵と同じ角度だけ外へ開く
    （正面 0.87・うしろ 1.22・横 0。横向きは、いまの絵どおり太いうで sp:armS）。
  しっぽ（風いがい）：いまの絵のうすい板。おしりから生えて、まっすぐ上からうしろへ64度かたむき、面を横に向けて軸のまわりに30度ひねる（横向きで葉の形がわかる。持ち主がえらんだ）。
  風のはね：いまの絵のうすい板。いまの絵が向きごとに置き方をかえているので、向きごとに同じ所・角度に置く。
色：体・足・うでは体の色と線の色。ずきん・顔・頭の上の物は、面の向きで、正面の絵（前・うしろ）か横の絵（左右）を、表面にうつす（うしろは正面の絵を裏から）。
    目・ほっぺ・まつげは写さない（ゲームで、いまの絵を顔の所にかさねる）。
線：体・足・うでの外のふちに2ドット。体と手足・頭のつなぎ目には引かない。手前の手足がうしろにかさなる所だけ。道具は道具の色の少し暗い色で1ドット。"""
import math, os, sys
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))
sys.path.insert(0, os.path.join(ROOT, 'tools'))

Q = 0.25; QH = 0.5   # ボクセルの大きさ（体・うで／頭）
SSN = 4              # 写すときの細かさ（1ドットを SSN×SSN）
DZ = 2.5             # かさなりの線を引く、奥行きの差
EXT = (-72, 72, -124, 12)
ELS = ['earth', 'water', 'fire', 'wind', 'wood']
CREAM = (253, 248, 239)
SPC = {'earth': {'hand': '#e3c3a3', 'line': '#ead6bd'}, 'water': {'hand': '#f3dfc6', 'line': '#ecd9c0'}, 'fire': {'hand': '#ffc887', 'line': '#f0d4ae'},
       'wind': {'hand': '#c8e2b4', 'line': '#c2dcaa'}, 'wood': {'hand': '#d6e8c2', 'line': '#e2d6bc'}}
hx = lambda h: tuple(int(h[i:i+2], 16) for i in (1, 3, 5))
K = .87   # drawSpiritDot の canvas の数 × K = チップのドット

_CH = None
def chips():
    global _CH
    if _CH is None:
        import chips as CH
        _, C = CH.load_imgs(); _CH = {k: (np.array(v['f'][0].convert('RGBA')), v['ax'], v['ay']) for k, v in C.items() if k.startswith('sp')}
    return _CH
def chip(k): return chips()[k]
def inside(k, X, Y):
    a, ax, ay = chip(k); c = np.floor(X-ax).astype(int); r = np.floor(Y-ay).astype(int)
    ok = (c >= 0) & (c < a.shape[1]) & (r >= 0) & (r < a.shape[0])
    out = np.zeros(np.shape(X), bool); out[ok] = a[r[ok], c[ok], 3] > 0; return out
def comp(*ks):
    """いくつかのチップを画面の座標でかさねた絵 → (絵, 左, 上)"""
    L = [chip(k) for k in ks]; x0 = min(l[1] for l in L); y0 = min(l[2] for l in L)
    x1 = max(l[1]+l[0].shape[1] for l in L); y1 = max(l[2]+l[0].shape[0] for l in L)
    out = Image.new('RGBA', (x1-x0, y1-y0))
    for a, ax, ay in L: out.alpha_composite(Image.fromarray(a), (ax-x0, ay-y0))
    return np.array(out), x0, y0
def sample(tex, X, Y):
    """絵 tex の (X, Y) の色。絵の外（うらから見た所など）は、いちばん近い色"""
    a, x0, y0 = tex; c = np.floor(X-x0).astype(int); r = np.floor(Y-y0).astype(int)
    ok = (c >= 0) & (c < a.shape[1]) & (r >= 0) & (r < a.shape[0]); hit = ok.copy(); hit[ok] = a[r[ok], c[ok], 3] > 0
    out = np.zeros((len(X), 3), np.uint8); out[hit] = a[r[hit], c[hit], :3]
    if (~hit).any():
        ys, xs = np.nonzero(a[..., 3] > 0); Pm = np.stack([X[~hit]-x0-0.5, Y[~hit]-y0-0.5], 1); I = np.empty(len(Pm), int)
        for s0 in range(0, len(Pm), 2000):
            q = Pm[s0:s0+2000]; I[s0:s0+2000] = np.argmin((q[:, None, 0]-xs[None])**2+(q[:, None, 1]-ys[None])**2, 1)
        out[~hit] = a[ys[I], xs[I], :3]
    return out

def hull(front, side, q, rnd=True, bottom=None):
    """正面の絵（x,z）と横の絵（y,z）の両方の中のボクセル（表面から2つぶんだけ）と、面の向き。
    rnd：高さごとの切り口を、四角ではなく、正面と横のはばのだ円にする（正面・横のシルエットはかわらない）。
    bottom=(z1, h)：z1 より下を、h の高さで丸くすぼめる（体の底。立っているときは足にかくれる所）"""
    fa, fx0, fy0 = chip(front); sa, sx0, sy0 = chip(side)
    xs = np.arange(fx0+q/2, fx0+fa.shape[1], q); ys = np.arange(sx0+q/2, sx0+sa.shape[1], q)
    z0 = -max(fy0+fa.shape[0], sy0+sa.shape[0]); z1 = -min(fy0, sy0); zs = np.arange(z0+q/2, z1, q)
    F = np.stack([inside(front, np.full(len(zs), x), -zs) for x in xs]); Sd = np.stack([inside(side, np.full(len(zs), y), -zs) for y in ys])
    V = F[:, None, :] & Sd[None, :, :]
    if rnd:
        for k in range(len(zs)):
            fx = np.nonzero(F[:, k])[0]; sy = np.nonzero(Sd[:, k])[0]
            if not len(fx) or not len(sy): continue
            cx, ax_ = (xs[fx[0]]+xs[fx[-1]])/2, (xs[fx[-1]]-xs[fx[0]])/2+q/2; cy, by = (ys[sy[0]]+ys[sy[-1]])/2, (ys[sy[-1]]-ys[sy[0]])/2+q/2
            f = 1.0
            if bottom and zs[k] < bottom[0]: f = max(0.0, 1-((bottom[0]-zs[k])/bottom[1])**2)
            E = ((xs[:, None]-cx)/ax_)**2+((ys[None, :]-cy)/by)**2 <= f
            V[:, :, k] &= E
    # 面の向き：まわりのボクセルの多いほうと反対（なめらかにするため、少し広くみる）
    Vf = V.astype(np.float32); n = np.zeros(V.shape+(3,), np.float32)
    for ax in range(3):
        for d in (1, 2, 3):
            a = np.roll(Vf, d, ax); b = np.roll(Vf, -d, ax); n[..., ax] += (a-b)/d
    inner = V.copy()
    for _ in range(2):
        e = inner.copy()
        for ax in range(3):
            sl = lambda a, b: tuple(slice(a, b) if i == ax else slice(None) for i in range(3))
            e[sl(1, None)] &= inner[sl(None, -1)]; e[sl(None, -1)] &= inner[sl(1, None)]
            e[tuple(0 if i == ax else slice(None) for i in range(3))] = False; e[tuple(-1 if i == ax else slice(None) for i in range(3))] = False
        inner = e
    I = np.argwhere(V & ~inner); P = np.stack([xs[I[:, 0]], ys[I[:, 1]], zs[I[:, 2]]], 1)
    N = n[I[:, 0], I[:, 1], I[:, 2]]; N = N/np.maximum(np.linalg.norm(N, axis=1, keepdims=True), 1e-6)
    return P, N

def revolve(name, rmax):
    a, ax, ay = chip(name)
    g = np.mgrid[ax+Q/2:ax+a.shape[1]:Q, -rmax+Q/2:rmax:Q, -rmax+Q/2:rmax:Q].reshape(3, -1).T
    r = np.hypot(g[:, 1], g[:, 2]); k = inside(name, g[:, 0], r) | inside(name, g[:, 0], -r); return g[k]
def plate(name, q=Q):
    """チップの絵のうすい板（画面の向きの u・v）と、その場所の色"""
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
def view(face, yaw=0.0):
    """face：0 正面・1 右向き・2 うしろ（yaw でさらに回す）。キャラの点 → (画面 x, 画面 y, 手前ほど大きい数)"""
    R = rz(-face*math.pi/2+yaw)
    def f(P):
        Wd = np.asarray(P)@R.T; return Wd[:, 0], -Wd[:, 2], Wd[:, 1]
    return f

# ---- うで：まっすぐ下にたらしたうで（u がかたから手へ・v が外・w が前）を、向きごとに外へ開く ----
SH = (14*K, 26*K)
ABD = {0: math.pi/2-0.7, 2: math.pi/2-0.35, 1: 0.0}      # 外へ開く角度（いまの絵と同じ）
SHX = {0: SH[0], 2: SH[0], 1: 15.0}                       # かたの x（横向きは体の外がわ）
ARMCHIP = {0: 'sp:arm', 2: 'sp:arm', 1: 'sp:armS'}
def arm_local(face, part):
    """うで・手の点（うでの座標 u,v,w）"""
    return revolve(ARMCHIP[face] if part == 'arm' else 'sp:hand', 8 if part == 'arm' else 5)
NEARSIDE = {0: 1, 1: -1, 2: -1}   # 手前の手（道具を持つ手。いまの絵の aN）の x の向き：正面は画面の右、横向き・うしろ向きはキャラの −x がわ
def arm_xf(face, near, swing=0.0, lift=0.0, twist=0.0):
    """うでの座標（u：かたから手へ・v：外・w：前）→ キャラの座標。near：手前の手か。
    swing：前へ（+）ふる・lift：外へ（+）上げる・twist：うでの軸のまわり。まず前へふり、そのあと外へ開く（前にのばしたうでは、開いても前のまま）"""
    side = NEARSIDE[face]*(1 if near else -1)
    S = np.array([side*SHX[face], 0, SH[1]])
    R = ry(-side*(ABD[face]+lift))@rx(swing)@rz(twist)
    def f(U):
        U = np.asarray(U, float); loc = np.stack([side*U[:, 1], U[:, 2], -U[:, 0]], 1)
        return S+loc@R.T
    return f, S

TAILBASE = np.array([0, -7.0, 10.5]); TAILBACK = math.radians(64); TAILTWIST = math.radians(60)   # しっぽの根もと（おしりの中）・まっすぐ上からうしろへのかたむき（いままでの横向きの49度＋15度）・ひねり（面を横に向けて、さらに30度）
TOPS = {'wood': ['tip'], 'fire': ['tip', 'ember'], 'water': ['tip'], 'earth': ['sprout'], 'wind': ['vine']}
WINGS = [(-16, -60, 44, -2.5, -1), (16, -60, 44, -.64, 1), (-18, -40, 38, 2.75, 1), (18, -40, 38, .39, -1)]   # 風のはね（drawSpiritDot と同じ数）

class Spirit:
    """1つの属性のせいれいの、止まっているときの3D（向きによらない部分）"""
    def __init__(self, el):
        self.el = el; E = 'sp_'+el+':'; self.E = E
        self.line = hx(SPC[el]['line']); self.hand = hx(SPC[el]['hand'])
        self.solid = {'body': hull('sp:body0', 'sp:bodyS0', Q, bottom=(13.0, 6.5))[0], 'legL': hull('sp:footL', 'sp:footS', Q)[0], 'legR': hull('sp:footR', 'sp:footS', Q)[0]}
        self.tex = {}
        def textured(nm, front, side, fronttex, sidetex, backtex):
            P, N = hull(front, side, QH)
            Ff, Sf, Bf = comp(*fronttex), comp(*sidetex), comp(*backtex)
            cF = sample(Ff, P[:, 0], -P[:, 2]); cS = sample(Sf, P[:, 1], -P[:, 2]); cB = sample(Bf, P[:, 0], -P[:, 2])
            self.tex[nm] = (P, (cF, cS, cB))   # どの絵の色にするかは、写すときに、カメラに近い向きできめる（rig.posed）
        textured('hood', E+'hood', E+'hoodS', (E+'hood',), (E+'hoodS',), (E+'hood',))
        if el != 'wind':
            textured('face', 'sp:head', 'sp:headS', ('sp:head', E+'bang') if el == 'fire' else ('sp:head',), ('sp:headS',), ('sp:head',))
        self.tops = []
        for nm in TOPS[el]:
            textured(nm, E+nm, E+nm+'S', (E+nm,), (E+nm+'S',), (E+nm,)); P = self.tex[nm][0]
            self.tops.append((nm, np.array([P[:, 0].mean(), P[:, 1].mean(), P[:, 2].min()])))
        self.arm = {f: (arm_local(f, 'arm'), arm_local(f, 'hand')) for f in (0, 1, 2)}
        self.cache = {}
    def flat(self, face):
        """向きごとに置き方がかわる板（しっぽ・はね）：名前 → (点, 色, 回す中心, 回す軸)"""
        if face in self.cache: return self.cache[face]
        out = {}
        def put(X, Y, depth):   # その向きの画面の場所 → キャラの座標（うすい板）
            L = []
            for d in np.arange(-0.75, 1.0, Q):
                if face == 0: L.append(np.stack([X, np.full(len(X), depth+d), -Y], 1))
                elif face == 1: L.append(np.stack([np.full(len(X), -depth-d), X, -Y], 1))
                else: L.append(np.stack([-X, np.full(len(X), -depth-d), -Y], 1))
            return np.concatenate(L)
        def pt(X, Y, depth):
            return put(np.array([X]), np.array([Y]), depth)[3]
        ax = np.array([0, 1., 0]) if face != 1 else np.array([1., 0, 0])
        if self.el != 'wind':   # しっぽ：おしりから上へ生えて、うしろへ TAILBACK かたむき、軸のまわりに TAILTWIST ひねる（どの向きも同じ3D）
            a, ax0, ay0 = chip(self.E+'tail'); g, c = plate(self.E+'tail')
            ub = ax0+a.shape[1]/2; vb = ay0+a.shape[0]                      # 根もと：絵の下のまん中
            L = []
            for d in np.arange(-0.75, 1.0, Q): L.append(np.stack([g[:, 0]-ub, np.full(len(g), d), vb-g[:, 1]], 1))
            P = np.concatenate(L)@(rx(TAILBACK)@rz(TAILTWIST)).T+TAILBASE
            out['tail'] = (P, np.tile(c, (len(L), 1)), TAILBASE.copy(), np.array([0, 0, 1.]))
        else:
            for i, (wx, wy, ln, th, sg) in enumerate(WINGS):
                g, c = plate(self.E+'leaf')
                if face == 2 and i < 2:
                    _, cw = plate(self.E+'leafW'); c = np.clip(c*0.75+cw*0.25, 0, 255).astype(np.uint8)
                sc = ln/44*(1.13 if face == 2 else 1); X, Y = rot2(g*sc, th)
                px, py = (1.13*wx*K, (-30+1.13*(wy+36))*K) if face == 2 else (wx*K, wy*K)
                X = X+px; Y = Y+py
                if face == 1: X = -9*K+0.7*X; px = -9*K+0.7*px
                dep = -28 if face == 0 else 28 if face == 2 else -10
                out['wing%d' % i] = (put(X, Y, dep), np.tile(c, (7, 1)), pt(px, py, dep), ax, sg)
        self.cache[face] = out; return out
