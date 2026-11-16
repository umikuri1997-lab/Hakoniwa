"""コカゲ（コワイノ basic）を3Dで組んで、そのままドット絵に写す（ためし）。
  python3 tools/art/kowaino3d/kokage3d.py <出力フォルダ>
  python3 tools/art/kowaino3d/kokage3d.py --glb <出力.glb>   （3Dモデルを書き出す）
単位はチップの1ドット。x=右・y=手前（キャラの前）・z=上。足もとのまん中が原点。せいれいと同じく、ほぼ正面（見おろし EL 度・遠近なし）から写す。
設計図（服の作り。いまのチップ kg_basic:idle 47×55 に合わせた寸法）：
  からだ  ：かげの体（くらい色）。胴 だ円と、頭 だ円（はば26・高さ25、ずきんの中のおく）。顔は頭の前の面で、ずきんのかげの中。目は頭の面にのせた、うすい色のたての だ円2つ
  足      ：胴の下から出る細い円すい台2本（x ±3.5、高さ 0〜8）
  マントとずきん：あつさ0.6の1まいの布。すそ（高さ6.5・半径21）から肩のくびれ（高さ18.5・半径15.5）をとおって、左右に角の出たずきんのすそ（高さ21・半径21）から、そのまま頭をつつむずきんになる（頭にゆとりをもってかぶる大きさ）。
            マントの所は、下ほど深くなるひだ（ヒラヒラ）と、高さがそろわないすそ。前は、首から下が合わせ目で、すそほど開く。
            ずきんの所は少しずつ不ぞろい。頭に少しゆとりをもってそい（ふくらませない）、頭のいちばん広い所から下は、たてのひだで肩へおち、ナイトキャップのように、頭の上からそのままのびて、ななめ後ろ（左うしろ）へ流れて下がる（1まいの布で、とちゅうで分けない）。先にぽんぽん（ぬいつけ）。
            前に顔のあな（とがったアーチ。てっぺんから左右へ広がり、首まで開く。いまの絵と同じ開き方）。あなのまわりは、少しまるめたふち。外は星のししゅう、内がわは裏地（くらい色）
  そで    ：マントの内がわで、肩から前へのびる布のつつ。手首は前の開きから出る。手は、てのひらと5本の指（4本は前でまるめて下へ・親指は内がわから前へ）
"""
import math, os, sys
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, os.path.dirname(HERE))
import oblique3d as O

EL = 8.0   # 見おろしの角度（度）
SCALE = 0.92   # 写すときの大きさ（寸法は、いまのチップをはかった数。輪郭・ひだのぶん、少しちぢめる）
hx = lambda h: np.array([int(h[i:i+2], 16) for i in (1, 3, 5)], float)
HOOD = hx('#6f6487'); LINING = hx('#3a3150'); CAPE = hx('#685d7f'); CAPEIN = hx('#4b4160'); BODY = hx('#241c33'); EYE = hx('#e6d8de')
HAND = hx('#8e83a2'); LEG = hx('#342b44'); POM = hx('#c8bcc8'); STAR = hx('#b9aab6')

class RScene(O.Scene):
    """まわして足す Scene（yaw：キャラを z のまわりに回す。もようは、まわす前の場所できめる）"""
    def __init__(self, yaw=0.0):
        super().__init__(); self.c, self.s = math.cos(yaw), math.sin(yaw)
    def R(self, p):
        p = np.asarray(p, float)*SCALE; return np.array([p[0]*self.c-p[1]*self.s, p[0]*self.s+p[1]*self.c, p[2]])
    def Ri(self, p):
        return np.array([p[0]*self.c+p[1]*self.s, -p[0]*self.s+p[1]*self.c, p[2]])/SCALE
    def tri(self, a, b, c, col): super().tri(self.R(a), self.R(b), self.R(c), col)
    def decal(self, f=None): super().decal(None if f is None else (lambda x, y, z: f(*self.Ri((x, y, z)))))

def ellipsoid(sc, c, r, col, n=28, m=16):
    sc.part()
    for j in range(m):
        t0, t1 = math.pi*j/m, math.pi*(j+1)/m
        for i in range(n):
            a0, a1 = 2*math.pi*i/n, 2*math.pi*(i+1)/n
            p = lambda t, a: (c[0]+r[0]*math.sin(t)*math.cos(a), c[1]+r[1]*math.sin(t)*math.sin(a), c[2]+r[2]*math.cos(t))
            sc.quad(p(t0, a0), p(t1, a0), p(t1, a1), p(t0, a1), col)

def frust(sc, x, y, prof, col, n=16):
    """まわした形（足）。prof：[(半径, 高さ)...] 上から下"""
    sc.part()
    for k in range(len(prof)-1):
        (r0, z0), (r1, z1) = prof[k], prof[k+1]
        for i in range(n):
            a0, a1 = 2*math.pi*i/n, 2*math.pi*(i+1)/n
            p = lambda r, z, a: (x+r*math.cos(a), y+r*math.sin(a), z)
            sc.quad(p(r0, z0, a0), p(r1, z1, a0), p(r1, z1, a1), p(r0, z0, a1), col)

def tube(sc, pts, rs, col, n=10, cap=True):
    """点をつないだ細い布のつつ（そで）"""
    sc.part(); pts = [np.array(q, float) for q in pts]; rings = []
    for k in range(len(pts)):
        d = pts[min(k+1, len(pts)-1)]-pts[max(k-1, 0)]; d /= np.linalg.norm(d)
        u = np.cross(d, [0, 1.0, 0])
        if np.linalg.norm(u) < 1e-6: u = np.array([1.0, 0, 0])
        u /= np.linalg.norm(u); v = np.cross(d, u)
        rings.append([pts[k]+rs[k]*(math.cos(t)*u+math.sin(t)*v) for t in np.linspace(0, 2*math.pi, n+1)[:-1]])
    for k in range(len(pts)-1):
        for i in range(n): sc.quad(rings[k][i], rings[k+1][i], rings[k+1][(i+1) % n], rings[k][(i+1) % n], col)
    if cap:
        for i in range(n): sc.tri(pts[-1], rings[-1][i], rings[-1][(i+1) % n], col)

def spine(pts, rs, n):
    """背骨の点・半径を、なめらかに n こに。わの向き（u・v）は、もとの向き（u=+x・v=+y＝前）から、まがりにそって、ねじれないように運ぶ"""
    P = np.array(pts, float); R = np.array(rs, float)
    L = np.r_[0, np.cumsum(np.linalg.norm(np.diff(P, axis=0), axis=1))]; t = np.linspace(0, L[-1], n)
    Q = np.stack([np.interp(t, L, P[:, i]) for i in range(3)], 1); Rr = np.interp(t, L, R)
    for _ in range(3):   # なめらかに（はしは動かさない）
        Q[1:-1] = (Q[:-2]+2*Q[1:-1]+Q[2:])/4; Rr[1:-1] = (Rr[:-2]+2*Rr[1:-1]+Rr[2:])/4
    U = []; V = []; u = np.array([1.0, 0, 0]); d0 = np.array([0, 0, 1.0])
    for k in range(n):
        d = Q[min(k+1, n-1)]-Q[max(k-1, 0)]; d /= np.linalg.norm(d)
        ax = np.cross(d0, d); s = np.linalg.norm(ax)
        if s > 1e-9:   # 前の向きから今の向きへ、いちばん小さくまわす
            ax /= s; c = float(np.dot(d0, d)); th = math.atan2(s, c)
            u = u*math.cos(th)+np.cross(ax, u)*math.sin(th)+ax*np.dot(ax, u)*(1-math.cos(th))
        u = u-d*np.dot(u, d); u /= np.linalg.norm(u); U.append(u); V.append(np.cross(d, u)); d0 = d
    return Q, Rr, np.array(U), np.array(V)

def sweep(sc, pts, rs, th, col, colin, hole=None, warp=None, na=72, n=48, cap=False, base=True):
    """背骨にそってのばした、あつさ th の布。hole(a, k)：あなにする所（a は角度。+y＝前が π/2、k は背骨の何番め）。
    warp(a, k, p) → (半径の倍, 高さのずれ)：ゆがみ・ひだ・すその高さ。外・内がわ・ふち（すそ・あな）を作る。cap：先をとじる"""
    Q, Rr, U, V = spine(pts, rs, n); A = np.linspace(0, 2*math.pi, na+1)
    def P(a, k, inner):
        f, dz = warp(a, k) if warp else (1, 0); r = Rr[k]*f-(th if inner else 0)
        return Q[k]+r*(math.cos(a)*U[k]+math.sin(a)*V[k])+np.array([0, 0, dz])
    cut = lambda i, k: hole is not None and hole((A[i]+A[i+1])/2, k+.5)
    dc = sc.dcur
    for inner, c in ((False, col), (True, colin)):
        sc.part()
        for k in range(n-1):
            for i in range(na):
                if cut(i, k): continue
                sc.quad(P(A[i], k, inner), P(A[i], k+1, inner), P(A[i+1], k+1, inner), P(A[i+1], k, inner), c)
        if cap and not inner:
            for i in range(na): sc.tri(Q[-1], P(A[i], n-1, False), P(A[i+1], n-1, False), c)
        if not inner: sc.dcur = None   # 星は外だけ
    sc.part()   # ふち（布のあつみ）：すそと、あなのまわり
    for i in range(na):
        if base and not cut(i, 0): sc.quad(P(A[i], 0, False), P(A[i+1], 0, False), P(A[i+1], 0, True), P(A[i], 0, True), colin)   # base=False：はじめのわは、ほかの布とつながる（ふちなし）
    edge = []
    if hole is not None:
        for k in range(n-1):
            for i in range(na):
                if not cut(i, k): continue
                for di, dk in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                    i2, k2 = (i+di) % na, k+dk
                    if k2 < 0 or k2 > n-2 or cut(i2, k2): continue
                    if di: a = A[i] if di < 0 else A[i+1]; e = [(a, k), (a, k+1)]
                    else: kk = k if dk < 0 else k+1; e = [(A[i], kk), (A[i+1], kk)]
                    sc.quad(P(*e[0], False), P(*e[1], False), P(*e[1], True), P(*e[0], True), colin); edge += [P(*e[0], False), P(*e[1], False)]
    sc.dcur = dc
    return Q, Rr, U, V, P

def hand(sc, w, sd):
    """手：手首 w の先の てのひら（だ円。こうを前に向ける）と、5本の指。4本の指は前でまるめて下へ（にぎりかけ）、親指は内がわから前へ"""
    px, py, pz = w[0], w[1]+1.4, w[2]
    ellipsoid(sc, (px, py, pz), (4.0, 2.6, 3.0), HAND)
    for j, fx in enumerate((-2.85, -0.95, 0.95, 2.85)):
        L = 1-0.10*abs(fx)/2.85-(0.08 if j in (0, 3) else 0)   # 外の指は少しみじかい
        tube(sc, [(px+fx*0.95, py+1.2, pz+0.4), (px+fx, py+2.6, pz-1.0*L), (px+fx*1.02, py+2.4, pz-3.0*L)], [1.2, 1.15, 1.0], HAND, n=10)
    si = -sd   # 内がわ
    tube(sc, [(px+si*3.2, py+0.4, pz-0.2), (px+si*4.4, py+1.8, pz+0.4), (px+si*4.2, py+2.8, pz-0.6)], [1.2, 1.15, 1.0], HAND, n=10)

def lathe2(sc, prof, z0, th, col, colin, hole=None, warp=None, lean=None, center=(0, 0), na=96, step=0.6, ends=(True, True)):
    """断面の線 prof [(半径, 高さ)...]（おり返してもよい）を、まわりにまわした、あつさ th の布。外は、断面の中心 center からはなれる向き。
    hole(a, (半径, 高さ, もとの番号))：あなにする所。warp(a, 同じ) → (半径の倍, 高さのずれ)。lean(高さ)：その高さで右へずらす"""
    P = np.array(prof, float); L = np.r_[0, np.cumsum(np.linalg.norm(np.diff(P, axis=0), axis=1))]
    t = np.linspace(0, L[-1], max(3, int(L[-1]/step))); R = np.interp(t, L, P[:, 0]); Z = np.interp(t, L, P[:, 1]); I = np.interp(t, L, np.arange(len(P)))
    for _ in range(3): R[1:-1] = (R[:-2]+2*R[1:-1]+R[2:])/4; Z[1:-1] = (Z[:-2]+2*Z[1:-1]+Z[2:])/4
    n = len(R); N = []
    for k in range(n):
        dr, dz = R[min(k+1, n-1)]-R[max(k-1, 0)], Z[min(k+1, n-1)]-Z[max(k-1, 0)]; m = math.hypot(dr, dz) or 1; nr, nz = -dz/m, dr/m
        if nr*(R[k]-center[0])+nz*(Z[k]-center[1]) < 0: nr, nz = -nr, -nz
        N.append((nr, nz))
    A = np.linspace(0, 2*math.pi, na+1)
    T = lambda k: (R[k], Z[k], I[k])
    def Pt(a, k, inner):
        f, dz = warp(a, T(k)) if warp else (1, 0); o = -th if inner else 0
        r = R[k]*f+o*N[k][0]; zz = Z[k]+dz+o*N[k][1]; x = lean(Z[k]) if lean else 0
        return (r*math.cos(a)+x, r*math.sin(a), zz+z0)
    cut = lambda i, k: hole is not None and (hole((A[i]+A[i+1])/2, T(k)) or hole((A[i]+A[i+1])/2, T(k+1)))
    dc = sc.dcur
    for inner, c in ((False, col), (True, colin)):
        sc.part()
        for k in range(n-1):
            for i in range(na):
                if cut(i, k): continue
                sc.quad(Pt(A[i], k, inner), Pt(A[i], k+1, inner), Pt(A[i+1], k+1, inner), Pt(A[i+1], k, inner), c)
        if not inner: sc.dcur = None
    sc.part()   # ふち（布のあつみ）：はしと、あなのまわり
    for k, e in ((0, ends[0]), (n-1, ends[1])):
        if R[k] < 0.05 or not e: continue
        for i in range(na):
            if not cut(i, min(k, n-2)): sc.quad(Pt(A[i], k, False), Pt(A[i+1], k, False), Pt(A[i+1], k, True), Pt(A[i], k, True), colin)
    if hole is not None:
        for k in range(n-1):
            for i in range(na):
                if not cut(i, k): continue
                for di, dk in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                    i2, k2 = (i+di) % na, k+dk
                    if k2 < 0 or k2 > n-2 or cut(i2, k2): continue
                    if di: aa = A[i] if di < 0 else A[i+1]; e = [(aa, k), (aa, k+1)]
                    else: kk = k if dk < 0 else k+1; e = [(A[i], kk), (A[i+1], kk)]
                    sc.quad(Pt(*e[0], False), Pt(*e[1], False), Pt(*e[1], True), Pt(*e[0], True), col)
    sc.dcur = dc

def wrap(a): return math.atan2(math.sin(a), math.cos(a))

def stars(pts, size=1.15):
    """星のししゅう：pts の近くの面を、星の色に（十字の形）"""
    P = np.array(pts, float)
    def f(x, y, z):
        dd = np.abs(P-np.array([x, y, z]))
        hit = ((dd[:, 0] < size*.55) & (dd[:, 2] < size*1.4) | (dd[:, 0] < size*1.4) & (dd[:, 2] < size*.55)) & (dd[:, 1] < 6)
        return STAR if hit.any() else None
    return f

def build(sc, pose):
    """pose：{'bob':上下, 'hand':((左手の前,上),(右手の前,上)), 'leg':(左足の前, 右足の前), 'tip':ずきんの先のゆれ, 'flut':ひだのゆれ}"""
    bob = pose.get('bob', 0); hl, hr = pose.get('hand', ((0, 0), (0, 0))); ll, lr = pose.get('leg', (0, 0)); tip = pose.get('tip', 0); fl = pose.get('flut', 0); z = bob
    O.LIGHT[:] = np.array([-0.45, 0.65, 0.65])/np.linalg.norm([-0.45, 0.65, 0.65])
    sc.smooth(True)
    # 足・からだ
    for x, fy in ((-3.5, ll), (3.5, lr)): frust(sc, x, fy, [(2.4, 9+z), (2.1, 3), (0.6, 0)], LEG)
    ellipsoid(sc, (0, 0, 15+z), (9, 8, 9), BODY)
    ellipsoid(sc, (0, -1, 31+z), (14.5, 13, 12.5), BODY)
    sc.smooth(False); sc.material('flat'); sc.outline(0)
    for ex in (-5/SCALE, 5/SCALE): ellipsoid(sc, (ex, 12.6, 29.5+z), (2.2, 1.0, 3.9), EYE, n=32, m=16)   # 目のまん中をドットのさかいに（はばが4ドットでそろう）   # 目：頭の前の面にのせる（ずきんのかげの中）
    sc.material(None); sc.outline(); sc.smooth(True)
    # そでと手（マントの内がわ）
    for sd, (fw, up) in ((-1, hl), (1, hr)):
        w = (sd*6.2, 18+fw, 19+z+up)
        tube(sc, [(sd*10, 0, 22+z), (sd*9, 7, 20+z), (sd*6.5, 14+fw*.6, 19+z+up*.6), w], [3.2, 3.1, 3.0, 2.9], CAPEIN, cap=False)
        hand(sc, w, sd)
    TH = 0.6   # 布のあつみ
    # マント：首（ぬい目）からすそへ。ひだは首からすそへ広がり、下ほど深い（ほどよいかたさの布：太くやわらかいひだ）。前は首のV字と、すその合わせ目
    def capew(a, t):
        u = min(1, max(0, (24.5-t[1])/17.5))   # 0：首・1：すそ
        fold = (0.015+0.085*u**1.2)*(math.sin(5*a+0.6+fl)+0.45*math.sin(9*a+1.9-fl*1.5))
        hem = (0.9*math.sin(5*a+0.6+fl)+0.4*math.sin(9*a+1.9))*max(0, u-0.85)/0.15   # ひだの山のすそは少し上がる
        return 1+fold, hem
    def capeh(a, t):
        d = abs(wrap(a-math.pi/2)); zz = t[1]
        return d < 0.5*(zz-18)/7 if zz >= 18 else d < 0.3*(18-zz)/11
    sc.decal(stars([(-13, 14, 12+z), (12, 15, 11+z), (-18, 5, 12+z), (17, 6, 13+z), (13, -12, 11+z), (-12, -13, 12+z), (0, -20, 11+z)]))
    lathe2(sc, [(20.5, 7), (21, 9), (20.5, 11), (18.6, 14), (16.6, 17), (15.3, 20.8), (13, 22.6), (10.4, 24.2)], z, TH, HOOD, LINING, hole=capeh, warp=capew, center=(0, 15))
    # ずきん：首のぬい目から。あまった布は肩（マントの上）にのり、はしは重さで肩の外へたれ下がる。そこからおり返して頭をつつみ、てっぺんへ（てっぺんは少し右）
    HPROF = [(10.6, 24.6), (12.8, 23.4), (15.5, 21.9), (18.2, 20.9), (20.2, 20.7), (21.2, 21.6), (21.4, 22.6), (20.2, 25), (18.7, 28), (17.3, 31), (16.6, 34), (15.6, 37),
             (13.7, 40), (10.6, 42.8), (7.6, 44.4)]   # 頭（はば29・高さ25、てっぺん43.5）に、少しゆとりをもってそう。頭のいちばん広い所から下は、ほぼまっすぐ肩へおちる   # 高さ45から上は、ななめ後ろへ流れる先（つづけて1まいの布）
    FOLD = 4   # HPROF の、はしでおり返す所（ここまでが肩にのる所）
    lean = None
    ZN, ZA = 24, 40.5   # 顔のあなの下・てっぺん（とがったアーチ。ひたいの上）
    HW = lambda zz: 0.9*max(0, (ZA-zz)/(ZA-ZN))**0.7
    def hoodh(a, t):
        d = abs(wrap(a-math.pi/2))
        return d < HW(ZN)+0.12 if t[2] <= FOLD else d < HW(max(t[1], ZN))   # 肩にのる所は、前（顔の下）にはない
    def hoodw(a, t):
        s = t[1]/54.5; g = min(1, max(0, (44.4-t[1])/6))   # 上の先とつなぐ所では、ゆがみなし
        dr = min(1, max(0, (31-t[1])/7))*(0.045*math.sin(7*a+0.8)+0.025*math.sin(11*a+2.0))   # 頭から肩へおちる所の、たてのひだ（下ほど深い）
        return 1+g*(0.02*math.sin(3*a+0.5+s*4))+dr, (-0.8*abs(math.cos(a)) if t[2] <= FOLD+1 else 0)   # 肩の外は少し下へ
    sc.decal(stars([(6, 13, 40+z), (14, 8, 35+z), (-7, -11, 40+z), (12, -11, 34+z), (-16, -7, 30+z), (-3, -7, 47+z), (-11, 6, 37+z), (-17, 6, 21.5+z), (16, -9, 21.5+z)]))
    sc.group('hood')
    lathe2(sc, HPROF, z, TH, HOOD, LINING, hole=hoodh, warp=hoodw, center=(0, 27), ends=(True, False))
    # ナイトキャップの先：ずきんの上（高さ45のわ）から、そのまま上へのび、ななめ後ろ（左うしろ）へ流れて下がる。同じ部品のなかま（線なし）
    TP = [(0, 0, 43.8+z), (0, 0, 45.6+z),   # はじめは、ずきんの上のはしと少しかさねる（すきまから裏地が見えないように）
          (-0.8, -2.5, 47.6+z), (-2.2-tip*.2, -6, 48.4+z), (-4-tip*.4, -9.5, 47+z), (-6-tip*.6, -12.5, 43.8+z), (-7.5-tip*.8, -14.8, 39.5+z), (-8.5-tip, -16, 35+z)]
    sweep(sc, TP, [7.75, 7.0, 5.8, 4.6, 3.7, 3.0, 2.5, 2.1], TH, HOOD, LINING, n=36, na=96, cap=True, base=False)
    sc.group(None)
    sc.decal(None)
    # 顔のまわりの、まるめたふち（うすい布を少しまるめた所。上ほど前へ出る）
    UP = [(r, q) for r, q in HPROF[FOLD+1:]]; ur = lambda zz: float(np.interp(zz, [q for _, q in UP], [r for r, _ in UP]))
    lean = lambda zz: 0
    ring = []; RB = []
    for tt in np.linspace(-1, 1, 41):   # 左の下 → てっぺん → 右の下
        zz = ZN+0.3+(ZA-ZN-0.3)*(1-abs(tt)); a = math.pi/2+math.copysign(HW(zz), tt); r = ur(zz)*hoodw(a, (0, zz, 99))[0]; up = 1-abs(tt)
        ring.append((r*math.cos(a)+lean(zz), r*math.sin(a)+0.2+0.8*up**2, zz+z)); RB.append(0.9+0.5*up)
    sc.group('hood'); tube(sc, ring, RB, HOOD, n=10, cap=False)
    sc.group(None)
    ellipsoid(sc, (-8.9-tip, -16.4, 31.8+z), (3.4, 3.4, 3.4), POM)   # 先にぶら下がる
    sc.smooth(False)

def shoot(yaw, pose):
    sc = RScene(yaw); build(sc, pose)
    t = math.radians(EL); V = np.array([0, math.cos(t), math.sin(t)])
    proj = lambda p: (p[0], -p[2]*math.cos(t)-p[1]*math.sin(t))
    O.S = 1; O.GRAD = True
    P = np.array([proj(q) for tr in sc.t for q in tr[:3]]); ext = (math.floor(P[:, 0].min())-2, math.ceil(P[:, 0].max())+2, math.floor(P[:, 1].min())-2, math.ceil(P[:, 1].max())+2)
    return O.render_px(sc, proj, ext, V, k=0.80, lw=2, k2=0.90, merge=6), ext

POSES = {
    'idle': [{'bob': 0}, {'bob': -1, 'tip': .6, 'flut': .25, 'hand': ((0, -1), (0, -1))}],
    'walk': [{'leg': (3, -3), 'tip': 1, 'flut': .5, 'hand': ((1, 0), (-1, 0))}, {'leg': (-3, 3), 'tip': -.6, 'flut': -.4, 'bob': 1, 'hand': ((-1, 0), (1, 0))}],
}

def sheet(frames):
    """コマをたてにならべる（足もとをそろえる）"""
    x0 = min(e[0] for _, e in frames); x1 = max(e[1] for _, e in frames); y0 = min(e[2] for _, e in frames); y1 = max(e[3] for _, e in frames)
    w, h = x1-x0, y1-y0; out = Image.new('RGBA', (w, h*len(frames)))
    for i, (im, e) in enumerate(frames): out.alpha_composite(im, (e[0]-x0, i*h+e[2]-y0))
    return out, (x0, y0, w, h)

def export_glb(path, pose=None):
    """立つポーズの3D（三角形と、部品の色）を glb に書き出す（glTF は y が上。1マス＝64ドット＝1）"""
    import trimesh
    sc = RScene(0.0); build(sc, pose or {})
    V = []; C = []
    for a, b, c, col, _ in sc.t:
        V += [a, b, c]; C += [list(np.clip(col, 0, 255))+[255]]*3
    v = np.array(V)[:, [0, 2, 1]]*np.array([1, 1, -1])/64.0
    trimesh.Trimesh(vertices=v, faces=np.arange(len(v)).reshape(-1, 3), vertex_colors=np.array(C, np.uint8), process=False).export(path)
    return len(sc.t)

if __name__ == '__main__':
    if sys.argv[1] == '--glb':   # python3 tools/art/kowaino3d/kokage3d.py --glb <出力.glb>
        print('三角形', export_glb(sys.argv[2])); sys.exit()
    out = sys.argv[1]; os.makedirs(out, exist_ok=True); only = sys.argv[2:]
    for mo, poses in POSES.items():
        for B, yaw in (('', 0.0), ('B', math.pi)):
            if only and mo+B not in only: continue
            im, g = sheet([shoot(yaw, p) for p in poses]); im.save(os.path.join(out, 'kg_basic_%s%s.png' % (mo, B))); print(mo+B, g)
