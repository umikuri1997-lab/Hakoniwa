"""3Dの下絵を、ゲームと同じ見え方で写すための小さな道具（パラソル・噴水などの絵をたのむ用）。
x=東, y=南, z=上（単位はマス）。ゲームの見え方は 画面=(x, y-0.8z)、見る向きは (0,0.8,1)。
三角形をならべ、zバッファで手前の面だけ写す。かげはトゥーンシェーダー（光のあたり方を3だんの色にわける）。
輪郭線は、OUT を0より大きくしたときだけ、裏面法（lilToon などのトゥーンの輪郭線と同じ。部品をふくらませた形の、うら向きの面だけを、その部品の色に OUTK をかけた色で）。ふだんは0（輪郭線なし）。
部品ごとに太さ・色をかえるときは sc.outline(w, k) のあとに部品を足す（w=0 でその部品は輪郭線なし。k はもとの色にかける数、0.8 ならうすい線）。
箱の角は、すこし面取り（ベベル BEVEL）する。
2倍の細かさで描いて BOX でちぢめる。"""
import math, os
import numpy as np
from PIL import Image, ImageDraw

S = 128; SS = 2
LIGHT = np.array([-0.35, 0.25, 1.0]); LIGHT = LIGHT / np.linalg.norm(LIGHT)
VIEW = np.array([0, 0.8, 1.0]); VIEW = VIEW / np.linalg.norm(VIEW)
SIDE = np.array([0, 1.0, 0])

OUT = 0.0        # 輪郭線のふとさ（マス）。0は輪郭線なし
OUTK = 0.5       # 輪郭線の色（もとの色にかける数。1に近いほどうすい線）
BEVEL = 0.022    # 箱の角の面取り（マス）
class Scene:
    def __init__(self): self.t = []; self.pid = 0; self.ol = {}; self.cur = None; self.grp = {}; self.gcur = None; self.tx = {}; self.tcur = None; self.mt = {}; self.mcur = None; self.tg = {}; self.tcur2 = None; self.joins = set(); self.dc = {}; self.dcur = None; self.sm = set(); self.scur = False; self.cv = set(); self.ccur = False; self.txax = {}; self.bm = {}; self.bcur = None
    def outline(self, w=None, k=None):
        """これから足す部品の輪郭線の太さ w（マス）・色 k（もとの色にかける数）。None は render の値"""
        self.cur = None if w is None and k is None else (w, k)
    def group(self, g=None):
        """これから足す部品のグループ。同じグループの部品どうしのさかいには、render_px で線を引かない（同じ面にそろえて組んだ材など）"""
        self.gcur = g
    def texture(self, t=None):
        """これから足す部品にはる木目など（Tex）。render_px で、部品ののびる向きにそって、明るさのちがいだけをつける"""
        self.tcur = t
    def material(self, m=None):
        """これから足す部品の材質（render_px）。None はふつう、'metal' は金属（光の当たる所に、明るいつやのすじ）、'soft' は布・砂（なだらかなふくらみにもかげ）、'soft1' は 'soft' のかげを半かげまでにした物、'flat' は3だんのかげをつけない物（色にかげを入れてある。まくら）、'clear' はすけて見える物（水。CLEARA のこさで下にかさねる）、'satin' はサテンの布（'soft' のかげに、光と目のあいだの向きを向く所に、つや SATINSPEC）"""
        self.mcur = m
    def smooth(self, on=False):
        """これから足す部品を、なめらかなかげ（スムーズシェード）にする。まるい物：ドットごとに、角の向きをまぜた面の向きで、かげの段をきめる（角ばった面のすじが出ない）"""
        self.scur = on
    def curve(self, on=False):
        """これから足す部品は、なだらかなふくらみ（ひくいドームなど）：かげの段のさかい目を、布・砂と同じ（光に近い向き）にして、ふくらみにもグラデーションを出す（金属でも）"""
        self.ccur = on
    def decal(self, f=None):
        """これから足す部品の、もよう（3Dの面にのる柄）。f(x, y, z) → その場所の色（もようでない所は None）。render_px で、ドットごとに、見える面の場所から色をきめ、その場所のかげ（3だん）をつける"""
        self.dcur = f
    def bump(self, f=None):
        """これから足す部品の、でこぼこ（ノーマルマップ）と色のむら。f(P, N) → (N2, mul)：ドットごとの見える面の場所 P・なめらかな面の向き N から、
        でこぼこをつけた面の向き N2 と、色にかける数 mul（なければ None）。スムーズシェードの部品だけ。かげの段は N2 できめる（段のままなので、ドットらしいかげ）"""
        self.bcur = f
    def tag(self, t=None):
        """これから足す部品の名札。join(a, b) した名札の部品どうしのさかいには、render_px で線を引かない（つづいている1まいの板など）"""
        self.tcur2 = t
    def join(self, a, b): self.joins.add(frozenset((a, b)))
    def part(self):
        self.pid += 1   # つぎの三角形から、べつの部品（輪郭線は部品ごとにふくらませる）
        if self.tcur2 is not None: self.tg[self.pid] = self.tcur2
        if self.mcur: self.mt[self.pid] = self.mcur
        if self.tcur is not None: self.tx[self.pid] = self.tcur
        if self.dcur is not None: self.dc[self.pid] = self.dcur
        if self.bcur is not None: self.bm[self.pid] = self.bcur
        if self.scur: self.sm.add(self.pid)
        if self.ccur: self.cv.add(self.pid)
        if self.cur: self.ol[self.pid] = self.cur
        if self.gcur is not None: self.grp[self.pid] = self.gcur
    def turn(self, k, foot=None):
        """90度×k まわす（k=1 で正面（南）が右（東）を向く・2で後ろ（北）・3で左（西）。ゲームの向き 0前・1右・2後ろ・3左）。
        foot=(x0,y0,x1,y1)：置く物の床の範囲。まわしたあと、よこはマスのまん中・手前のはしは、もとの手前のはしにそろえる"""
        k %= 4
        self.fwd = lambda v: np.array(v, float)   # まわす前の点 → まわしたあとの点（動く部品の支点などに使う）
        if not k: return
        V = np.array([v for t_ in self.t for v in t_[:3]]); x0, y0, x1, y1 = foot if foot else (V[:, 0].min(), V[:, 1].min(), V[:, 0].max(), V[:, 1].max())
        cx, cy = (x0+x1)/2, (y0+y1)/2
        def R(v):
            x, y = v[0]-cx, v[1]-cy
            for _ in range(k): x, y = y, -x   # 正面（南 +y）→ 右（東 +x）
            return np.array([x, y, v[2]])
        T = [(R(a), R(b), R(c), col, pid) for a, b, c, col, pid in self.t]
        hw, hd = ((y1-y0)/2, (x1-x0)/2) if k % 2 else ((x1-x0)/2, (y1-y0)/2)
        sh = np.array([0.5 if foot is None else (x0+x1)/2, y1-hd, 0])
        if k % 2: sh[0] = 0.5
        self.t = [(a+sh, b+sh, c+sh, col, pid) for a, b, c, col, pid in T]
        self.fwd = lambda v, R=R, sh=sh: R(np.array(v, float))+sh
        def inv(f, sh=sh, k=k, cx=cx, cy=cy):   # もようは、まわす前の場所できめる（もようも物といっしょにまわる）
            def g(x, y, z):
                x, y = x-sh[0], y-sh[1]
                for _ in range(k): x, y = -y, x
                return f(x+cx, y+cy, z)
            return g
        self.dc = {pid: inv(f) for pid, f in self.dc.items()}
    def tri(self, a, b, c, col): self.t.append((np.array(a, float), np.array(b, float), np.array(c, float), np.array(col, float), self.pid))
    def quad(self, a, b, c, d, col): self.tri(a, b, c, col); self.tri(a, c, d, col)
    def ring_wall(self, cx, cy, r, z0, z1, colf, n=48):
        """丸いかべ（外がわを向いた面）。colf(i,a0,a1) で色"""
        self.part()
        for i in range(n):
            a0 = 2*math.pi*i/n; a1 = 2*math.pi*(i+1)/n
            p = lambda a, z: (cx+r*math.cos(a), cy+r*math.sin(a), z)
            self.quad(p(a0, z0), p(a1, z0), p(a1, z1), p(a0, z1), colf(i, a0, a1))
    def annulus(self, cx, cy, r0, r1, z, colf, n=48):
        """ドーナツの形の平らな面（r0=0 なら円）"""
        self.part()
        for i in range(n):
            a0 = 2*math.pi*i/n; a1 = 2*math.pi*(i+1)/n
            p = lambda r, a: (cx+r*math.cos(a), cy+r*math.sin(a), z)
            if r0 <= 0: self.tri((cx, cy, z), p(r1, a0), p(r1, a1), colf(i, a0, a1))
            else: self.quad(p(r0, a0), p(r1, a0), p(r1, a1), p(r0, a1), colf(i, a0, a1))
    def sphere(self, cx, cy, zc, r, col, n=20, m=12, zs=1.0):
        self.part()
        for j in range(m):
            t0 = math.pi*j/m; t1 = math.pi*(j+1)/m
            for i in range(n):
                a0 = 2*math.pi*i/n; a1 = 2*math.pi*(i+1)/n
                p = lambda t, a: (cx+r*math.sin(t)*math.cos(a), cy+r*math.sin(t)*math.sin(a), zc+r*zs*math.cos(t))
                self.quad(p(t0, a0), p(t1, a0), p(t1, a1), p(t0, a1), col)

    def box(self, x0, y0, z0, x1, y1, z1, col, bevel=None):
        """四角い箱。角はすこし面取りする（bevel：面取りのはば。0で角ばった箱）"""
        self.part()
        hx, hy, hz = (x1-x0)/2, (y1-y0)/2, (z1-z0)/2; cx, cy, cz = (x0+x1)/2, (y0+y1)/2, (z0+z1)/2
        b = BEVEL if bevel is None else bevel; b = min(b, hx*0.4, hy*0.4, hz*0.4)
        def P(sx, sy, sz, k):   # 角 (sx,sy,sz) の、k の面（0:x・1:y・2:z）がわの点
            return (cx+sx*(hx-(0 if k == 0 else b)), cy+sy*(hy-(0 if k == 1 else b)), cz+sz*(hz-(0 if k == 2 else b)))
        S2 = (-1, 1)
        for s in S2:   # 6つの面
            self.quad(P(s,-1,-1,0), P(s,1,-1,0), P(s,1,1,0), P(s,-1,1,0), col)
            self.quad(P(-1,s,-1,1), P(1,s,-1,1), P(1,s,1,1), P(-1,s,1,1), col)
            self.quad(P(-1,-1,s,2), P(1,-1,s,2), P(1,1,s,2), P(-1,1,s,2), col)
        if b <= 0: return
        for sx in S2:   # 12の辺の面取り
            for sy in S2: self.quad(P(sx,sy,-1,0), P(sx,sy,-1,1), P(sx,sy,1,1), P(sx,sy,1,0), col)
            for sz in S2: self.quad(P(sx,-1,sz,0), P(sx,-1,sz,2), P(sx,1,sz,2), P(sx,1,sz,0), col)
        for sy in S2:
            for sz in S2: self.quad(P(-1,sy,sz,1), P(-1,sy,sz,2), P(1,sy,sz,2), P(1,sy,sz,1), col)
        for sx in S2:   # 8つの角の三角
            for sy in S2:
                for sz in S2: self.tri(P(sx,sy,sz,0), P(sx,sy,sz,1), P(sx,sy,sz,2), col)
    def beam(self, a, b, r, col):
        """2点をつなぐ四角い材（すじかいなど）。切り口は、はば2rの四角で、面は材の向きに合わせてまっすぐ（ひし形にしない）。
        1つの面は地面と同じ向き（よこ）、もう1つは、それと直角"""
        self.part()
        a, b = np.array(a, float), np.array(b, float); d = (b-a)/np.linalg.norm(b-a)
        u = np.cross(d, [0, 0, 1.0])
        if np.linalg.norm(u) < 1e-6: u = np.array([1.0, 0, 0])
        u /= np.linalg.norm(u); v = np.cross(d, u); v /= np.linalg.norm(v)
        cs = [r*(su*u+sv*v) for su, sv in ((-1,-1),(1,-1),(1,1),(-1,1))]
        for i in range(4):
            o0, o1 = cs[i], cs[(i+1) % 4]; self.quad(a+o0, b+o0, b+o1, a+o1, col)
        self.quad(*[a+o for o in cs], col); self.quad(*[b+o for o in cs], col)
    def revolve(self, cx, cy, prof, colf, n=36):
        """まわりをまわした面。prof は [(半径, 高さ), ...]（上から下へ）"""
        self.part()
        for k in range(len(prof)-1):
            (r0, z0), (r1, z1) = prof[k], prof[k+1]
            for i in range(n):
                a0 = 2*math.pi*i/n; a1 = 2*math.pi*(i+1)/n
                p = lambda r, z, a: (cx+r*math.cos(a), cy+r*math.sin(a), z)
                self.quad(p(r0, z0, a0), p(r1, z1, a0), p(r1, z1, a1), p(r0, z0, a1), colf(k, i))

    def tube(self, pts, r, col, n=8):
        """点をつないだ細い管（水の線など）"""
        self.part()
        pts = [np.array(q, float) for q in pts]
        for k in range(len(pts)-1):
            a, b = pts[k], pts[k+1]; d = b-a; d /= np.linalg.norm(d)
            u = np.cross(d, [0, 0, 1.0]);
            if np.linalg.norm(u) < 1e-6: u = np.array([1.0, 0, 0])
            u /= np.linalg.norm(u); v = np.cross(d, u)
            for i in range(n):
                t0 = 2*math.pi*i/n; t1 = 2*math.pi*(i+1)/n
                o0 = r*(math.cos(t0)*u+math.sin(t0)*v); o1 = r*(math.cos(t1)*u+math.sin(t1)*v)
                self.quad(a+o0, b+o0, b+o1, a+o1, col)

def game(p): return (p[0], p[1]-0.8*p[2])
def side(p): return (p[0], -p[2])

def render(sc, proj, ext, depth, out=None, outk=None):
    x0, x1, y0, y1 = ext; Wp = int((x1-x0)*S*SS); Hp = int((y1-y0)*S*SS)
    img = np.zeros((Hp, Wp, 4)); zb = np.full((Hp, Wp), -1e9)
    def raster(a, b, c, cc, bias=0.0):
        P = [((proj(p)[0]-x0)*S*SS, (proj(p)[1]-y0)*S*SS) for p in (a, b, c)]
        D = [float(np.dot(p, depth)) for p in (a, b, c)]
        xs = [p[0] for p in P]; ys = [p[1] for p in P]
        bx0 = max(int(math.floor(min(xs))), 0); bx1 = min(int(math.ceil(max(xs))), Wp-1)
        by0 = max(int(math.floor(min(ys))), 0); by1 = min(int(math.ceil(max(ys))), Hp-1)
        if bx1 < bx0 or by1 < by0: return
        gx, gy = np.meshgrid(np.arange(bx0, bx1+1)+0.5, np.arange(by0, by1+1)+0.5)
        (ax, ay), (bx, by), (cx, cy) = P
        den = (by-cy)*(ax-cx)+(cx-bx)*(ay-cy)
        if abs(den) < 1e-9: return
        w0 = ((by-cy)*(gx-cx)+(cx-bx)*(gy-cy))/den; w1 = ((cy-ay)*(gx-cx)+(ax-cx)*(gy-cy))/den; w2 = 1-w0-w1
        m = (w0 >= -1e-6) & (w1 >= -1e-6) & (w2 >= -1e-6)
        if not m.any(): return
        z = w0*D[0]+w1*D[1]+w2*D[2]-bias
        szb = zb[by0:by1+1, bx0:bx1+1]; sub = img[by0:by1+1, bx0:bx1+1]
        vis = m & (z > szb); szb[vis] = z[vis]; sub[vis, :3] = cc; sub[vis, 3] = 255
    for a, b, c, col, _ in sc.t:
        n = np.cross(b-a, c-a); ln = np.linalg.norm(n)
        if ln < 1e-12: continue
        n /= ln
        if np.dot(n, depth) < 0: n = -n
        d = float(np.dot(n, LIGHT)); sh = 1.0 if d > 0.55 else 0.87 if d > 0.1 else 0.76   # トゥーン：3だん
        raster(a, b, c, np.clip(col*sh, 0, 255))
    # 輪郭線（裏面法）：部品ごとに、外向きの面の向きを頂点ごとに平均して、その向きへ OUT ふくらませる。うら向き（見る向きと反対）の面だけかく
    t0 = OUT if out is None else out; k0 = OUTK if outk is None else outk
    if t0 > 0 or any(w for w, _ in sc.ol.values() if w):
        parts = {}
        for a, b, c, col, pid in sc.t: parts.setdefault(pid, []).append((a, b, c, col))
        for pid, L in parts.items():
            w, ok = sc.ol.get(pid, (None, None)); t = t0 if w is None else w; ok = k0 if ok is None else ok
            if t <= 0: continue
            cen = np.mean([v for q in L for v in q[:3]], 0)
            vn = {}; info = []; off = {}
            flat = True
            for a, b, c, col in L:
                n = np.cross(b-a, c-a); ln = np.linalg.norm(n)
                if ln < 1e-12: continue
                n /= ln
                if np.dot(n, (a+b+c)/3-cen) < 0: n = -n
                if abs(np.dot(n, (a+b+c)/3-cen)) > 1e-4: flat = False
                info.append((a, b, c, col, n))
                for v in (a, b, c): vn.setdefault(tuple(np.round(v, 4)), {})[tuple(np.round(n, 3))] = n
            for a, b, c, col, n in info:
                if flat:   # 平らな部品（旗・星・水面など）：面の中で外へひろげ、少しうしろへ
                    back = -depth*0.002
                    off = [((v-cen)-np.dot(v-cen, n)*n) for v in (a, b, c)]
                    vs = [v+t*o/(np.linalg.norm(o) or 1)+back for v, o in zip((a, b, c), off)]
                else:
                    if np.dot(n, depth) > 1e-6: continue   # おもて向きの面はかかない（ちょうど横を向く面は、かく。左右のふちの線になる）
                    vs = []
                    for v in (a, b, c):
                        k = tuple(np.round(v, 4))
                        if k not in off:   # その頂点にあつまる面が、どれもちょうど t だけ外へ出るずらし方（角は各面を t ずつ。なめらかな面はほぼ法線の向き）
                            N = np.array(list(vn[k].values())); off[k] = np.linalg.lstsq(N, np.full(len(N), t), rcond=None)[0]
                        vs.append(v+off[k])
                raster(vs[0], vs[1], vs[2], np.clip(col*ok, 0, 255), bias=0.02)   # 輪郭線は少し奥に（かさなった面とあらそってざらざらにならない）
    return Image.fromarray(img.astype(np.uint8), 'RGBA').resize((Wp//SS, Hp//SS), Image.BOX)

def grid_bg(ext, foot=None):
    x0, x1, y0, y1 = ext; W = int((x1-x0)*S); H = int((y1-y0)*S)
    im = Image.new('RGBA', (W, H), (235, 230, 211, 255)); d = ImageDraw.Draw(im)
    for i in range(int(x1-x0)+1): d.line([(i*S, 0), (i*S, H)], fill=(201, 194, 168), width=2)
    for j in range(int(y1-y0)+1): d.line([(0, j*S), (W, j*S)], fill=(201, 194, 168), width=2)
    if foot: fw, fh = foot; d.rectangle([((0-x0)*S, (0-y0)*S), ((fw-x0)*S, (fh-y0)*S)], outline=(214, 170, 70), width=3)
    return im

SHADE = [(17.5, -5), (35, -10)]   # かげの色：ベースの色の HSV（100段階）から、明るさ・あざやかさを引く（半かげ・かげ）。持ち主がきめた（かげ＝明るさ−35・あざやかさ+10）
SHINE = (12, -8)                # 金属のつや：明るさを足し、あざやかさを引く（白っぽく）
DITHER = 0   # 0 でなければ、かげを1色にして、うすいかげをあみ（できあがりの1ドットごと。この数は1ドットの大きさ）であらわす
DITHERR = (0.22, 0.72)   # あみ：かげになりはじめる・ぜんぶかげになる、光の向きとの内積
LAST = None
DITHERG = None   # つやつやの部品の、色の段（DITHERT と同じ形。段は1つ多くてよい）
DITHERO = (0, 0)   # あみのならびの もとの点（大きな絵のドット）
DITHERT = None   # あみの色の段（DITHER のとき。None なら DITHERR・DITHERHL の2色＋ハイライト）
DITHERHL = None   # あみのハイライト：(はじまる・ぜんぶになる 光の向きとの内積, 明るさを足す, あざやかさを引く)（100段階）
DITHERLV = 3   # あみのときの、かげの色（toon の段）
METALSPEC = 0.97                # 金属のつやが出る向きの近さ
SATINSPEC = 0.80                # サテンの布（material 'satin'）のつやが出る向きの近さ（光と目のあいだの向きとの内積）
SATINSHINE = (24, -6)           # サテンのつや（lv −2）：明るさを足し、あざやかさを引く
SHINYSPEC = (0.95, 0.86)       # つやつや（material 'shiny'・金属は 'shinym'）：光と目のあいだの向きとの内積が、1つめより大きい所に白い光（lv −3）、2つめより大きい所に うすい光（lv −1）
SHINYSHINE = (34, -40)          # つやつやの白い光（lv −3）：明るさを足し、あざやかさを大きく引く
CLEARSPEC = (0.06, 0.035, 0.45, 0.15)   # すけて見える部品のつや：平らな面より、光と目のあいだの向きへかたむいた量（内積の差）が、これより大きい所につよいつや・よわいつや・白くする量・こさに足す量
GLASSA = (0.1, 0.85, 0.32)     # ガラス（material 'glass'）：正面を向いた面のこさ・ふち（横を向いた面）のこさ・ガラスの中の水（'gwater'）のこさ
GLASSCA = (0.55, 0.95)   # 色ガラス（material 'glassc'。ガラスの置き物）：正面・ふちのこさ
GLASSSPEC = (0.995, 0.975)
GLASSSTREAK = (0.5, 0.68, 0.55)   # ガラスのつやのすじ：目から見て左前（角度・ラジアン。目のほうが0、左が＋）を向いた、たての面（上下の向きの大きさがこれより小さい）     # ガラスのつや：光と目のあいだの向きとの内積が、1つめより大きい所はまっ白、2つめより大きい所は白っぽく
CLEARA = 0.66   # すけて見える部品（material 'clear'。水）のこさ
SOFTLV = (0.86, 0.62)
GRAD = False   # True：かげを4だん（光・うすいかげ・半かげ・かげ）にして、なめらかに（持ち主：かげにもう少しグラデーション）
SHADE4 = [(9, -2.5), (18, -5), (30, -9)]   # GRAD のときの、うすいかげ・半かげ・かげ（明るさ・あざやかさを引く）
LV4 = (0.55, 0.32, 0.1)   # GRAD のときの、光・うすいかげ・半かげ・かげのさかい目（光の向きとの内積）
SOFTLV4 = (0.88, 0.74, 0.58)
CURVLV = (0.95, 0.88, 0.78)   # curve の部品（ひくいドーム）の、光・うすいかげ・半かげ・かげのさかい目（まうえ向きの面は0.92）
OSAT = 0   # 輪郭線のあざやかさに足す量（100段階。明るい物の線が灰色っぽく1トーンに見えないように）
def _ol(c, kk):
    """輪郭線の色：もとの色×kk。OSAT があれば、あざやかさを足す"""
    o = c*kk
    if not OSAT or len(o) == 0: return o
    mx = o.max(-1, keepdims=True); mn = o.min(-1, keepdims=True); sat = np.where(mx > 0, (mx-mn)/np.maximum(mx, 1e-9), 0)
    ns = np.clip(sat+OSAT/100, 0, 1); f = np.where(sat > 1e-6, ns/np.maximum(sat, 1e-9), 1)
    return mx-(mx-o)*f   # 布・砂（material 'soft'）の、光・半かげ・かげのさかい目（光の向きとの内積）
def toon(cc, lv):
    """部品の色 cc の、光（0）・半かげ（1）・かげ（2）・金属のつや（-1）・サテンのつや（-2）の色"""
    import colorsys
    h, s_, v = colorsys.rgb_to_hsv(*[c/255 for c in cc])
    if lv == 0: return np.array(cc, float)
    dv, ds = (-SHINYSHINE[0], -SHINYSHINE[1]) if lv == -3 else (-SATINSHINE[0], -SATINSHINE[1]) if lv == -2 else (-SHINE[0], -SHINE[1]) if lv < 0 else (SHADE4 if GRAD else SHADE)[lv-1]
    if lv > 0 and v < 0.85: dv *= v/0.85   # くらい色は、かげで引く明るさを、色の明るさに合わせてへらす（黒っぽいかげにしない。持ち主がきめた）
    v = min(1, max(0, v-dv/100)); s_ = min(1, max(0, s_-ds/100))
    return np.array(colorsys.hsv_to_rgb(h, s_, v))*255

class Tex:
    """部品にはるテクスチャ（木目など）。もようが横むき（u がもようの流れる向き）の、くりかえしてつながる絵。
    span：絵1まいが何マスぶんか。flow：もようの流れる向きに、なめらかにするはば（ドット。木目を点でなく、すじにする）。
    minrun：これより短いすじ（ドット）は消す。lv：明るさを3だんにわける（こい所の割合と色にかける数・明るい所の割合と色にかける数）。
    色は部品の色のまま、明るさのちがいだけをつける（ドット絵の色数をふやさない）"""
    def __init__(self, path, span=2.0, flow=10, minrun=4, dark=(0.14, 0.9), light=(0.08, 1.06)):
        self.src = Image.open(path).convert('L'); self.span = span; self.flow = flow; self.minrun = minrun; self.dark = dark; self.light = light; self._c = {}
    def at(self, S_):
        if S_ not in self._c:
            from scipy.ndimage import uniform_filter1d
            n = max(8, int(round(self.span*S_)))
            a = np.asarray(self.src.resize((n, n), Image.BOX), float)
            a = uniform_filter1d(a, self.flow, axis=1, mode='wrap')          # 木の流れる向きに、なめらかに
            lo, hi = np.quantile(a, self.dark[0]), np.quantile(a, 1-self.light[0])
            q = np.where(a <= lo, -1, np.where(a >= hi, 1, 0))
            for y in range(n):                                               # 短いすじ（点）は消す
                r = q[y]; x = 0
                st = np.flatnonzero(np.diff(np.r_[r[-1], r]) != 0)
                if len(st) == 0: continue
                for i, x0 in enumerate(st):
                    x1 = st[(i+1) % len(st)]; L = (x1-x0) % n or n
                    if r[x0] != 0 and L < self.minrun: r[np.arange(x0, x0+L) % n] = 0
            self._c[S_] = np.where(q < 0, self.dark[1], np.where(q > 0, self.light[1], 1.0))
        return self._c[S_]

def _lvof(d, mt):
    """光の向きとの内積 d と材質から、かげの段（0光〜）"""
    if mt == 'flat': return 0
    if mt == 'curve': return 0 if d > CURVLV[0] else 1 if d > CURVLV[1] else 2 if d > CURVLV[2] else 3
    if mt == 'soft1': return 0 if d > SOFTLV[0] else 1
    if mt == 'soft': return (0 if d > SOFTLV4[0] else 1 if d > SOFTLV4[1] else 2 if d > SOFTLV4[2] else 3) if GRAD else (0 if d > SOFTLV[0] else 1 if d > SOFTLV[1] else 2)
    return (0 if d > LV4[0] else 1 if d > LV4[1] else 2 if d > LV4[2] else 3) if GRAD else (0 if d > 0.55 else 1 if d > 0.1 else 2)
SMCREASE = 0.5   # スムーズシェード：となりの面と、この内積より向きがちがう所（角）は、まぜない
def _raysolve(proj, X, Ys, n, a):
    """ドットの画面の場所 (X, Ys) に写る、面（向き n・a をとおる）の上の点。ok は とけたか"""
    A_, B_, C_ = proj.ray(Ys); r0 = float(np.dot(n, a))
    if getattr(proj, 'ray3', None) is None:   # 左右は平行：x は画面の x のまま
        r = r0-n[0]*X; det = A_*n[2]-B_*n[1]; ok = np.abs(det) > 1e-9; det = np.where(ok, det, 1)
        return np.stack([X, (C_*n[2]-B_*r)/det, (A_*r-C_*n[1])/det], -1), ok
    Ex, Ey, Ez, Eb = proj.ray3(X)   # 左右にも遠近：Ex*x+Ey*y+Ez*z=Eb、A*y+B*z=C、n・p=r0 の3つの式をとく
    M = np.stack([np.stack([np.full_like(Ey, n[0]), np.full_like(Ey, n[1]), np.full_like(Ey, n[2])], -1), np.stack([Ex, Ey, Ez], -1), np.stack([np.zeros_like(A_), A_, B_], -1)], -2)
    R = np.stack([np.full_like(Eb, r0), Eb, C_], -1); det = np.linalg.det(M); ok = np.abs(det) > 1e-12
    M = np.where(ok[..., None, None], M, np.eye(3)); return np.linalg.solve(M, R[..., None])[..., 0], ok
def render_px(sc, proj, ext, depth, k=0.72, outer=True, merge=12, lw=1, k2=0.86, outerk=False, contrast=0):
    """ドット絵にするための写し方：1マス S ドットで、ちぢめずに（1ドットに1点）写し、部品のさかいに1ドットの輪郭線を引く。
    輪郭線は、となりあう2つのドットの部品がちがうとき、うしろがわ（遠いほう）のドットに引く（手前の部品の形はけずらない）。
    交差・つきあてる所も、手前の部品の形のまま、うしろの部品に線が入る。色は、そのドットの色に k をかけた色。
    outer：まわりのふち（透明ととなりあう所）は、透明がわに1ドット（となりの色×k）。上下左右だけを見る（ななめは見ない）。
    sc.outline(0) のあとに足した部品は、線を引かない（中のくらい所など）。sc.group(名前) で同じグループにした部品どうしにも引かない。
    merge：さいごに、色の差がこれより小さい色を、多いほうの色にまとめる（にた色をのこさない。0でまとめない）。
    contrast：0 でなければ、ぬった色（木目のあと）のコントラストを、物の色の明るさのまん中（中央値）から contrast 倍にする。輪郭線は、そのあとの色から作る（線までこくならない）。
    outerk：True なら、まわりのふち（透明ととなりあう所）は、部品ごとの線のこさ（sc.outline の k・p.olk）を使わず、いつも k・k2 で引く（目地だけうすくしたいとき）。数なら、外の線はその数、内がわの線は (数+1)/2（白い物の、まわりの線をこくするとき）。
    lw：輪郭線のはば（1か2）。2のときは、さかい目にふれる1ドットめが こい線（×k）、そのとなりの2ドットめが まわりになじむ うすい線（×k2）。まわりのふちは、外がわ1ドットがこい線・物の内がわ1ドットがうすい線。"""
    x0, x1, y0, y1 = ext; Wp = int(round((x1-x0)*S)); Hp = int(round((y1-y0)*S))
    col = np.zeros((Hp, Wp, 3)); ccb = np.zeros((Hp, Wp, 3)); dlb = np.zeros((Hp, Wp)); zb = np.full((Hp, Wp), -1e9); idb = np.full((Hp, Wp), -1); lvb = np.zeros((Hp, Wp), int)
    wp = np.zeros((Hp, Wp, 3)); wn = np.zeros((Hp, Wp, 3)); nrm = np.zeros((Hp, Wp, 3))   # nrm：ドットごとの面の向き（スムーズシェードの部品は、まぜた向き。5色のかげ用）   # ドットごとの、せかいの場所と面の向き（テクスチャ用）
    CLR = []   # すけて見える部品の三角形
    RAY = getattr(proj, 'ray', None)   # persp の写し方：ドットごとに、見える面の場所を式でとく（三角形を分けない）
    VN = {}   # スムーズシェード：部品ごと・点ごとの、まわりの面の向き
    if sc.sm:
        for a, b, c, cc, pid in sc.t:
            if pid not in sc.sm: continue
            n = np.cross(b-a, c-a); ln = np.linalg.norm(n)
            if ln < 1e-12: continue
            n = n/ln
            if np.dot(n, depth) < 0: n = -n
            for v in (a, b, c): VN.setdefault((pid,)+tuple(np.round(v, 5)), []).append((n, ln))   # 面の向きと大きさ（大きい面ほど重く。ふちの細い面に、広い面の向きが引っぱられないように）
    def vnorm(pid, v, n):
        L_ = [q*w for q, w in VN.get((pid,)+tuple(np.round(v, 5)), []) if np.dot(q, n) > SMCREASE]
        if not L_: return n
        m_ = np.sum(L_, 0); return m_/max(1e-9, np.linalg.norm(m_))
    INK = {p_ for p_, m_ in sc.mt.items() if m_ == 'ink'}
    for a, b, c, cc, pid in sc.t:
        n = np.cross(b-a, c-a); ln = np.linalg.norm(n)
        if ln < 1e-12: continue
        n /= ln
        if pid in INK and np.dot(n, depth) > 0: continue   # 背面法の輪郭（ふくらませた うら返しの皮）：うらを向いた面だけ描く
        if np.dot(n, depth) < 0: n = -n
        if sc.mt.get(pid) in ('clear', 'glass', 'glassc', 'gwater'): CLR.append((a, b, c, cc, n, sc.mt.get(pid))); continue   # 水など、すけて見える部品は、ほかをぜんぶ描いてから、うすくかさねる
        d = float(np.dot(n, LIGHT)); lv = (0 if d > LV4[0] else 1 if d > LV4[1] else 2 if d > LV4[2] else 3) if GRAD else (0 if d > 0.55 else 1 if d > 0.1 else 2)
        if sc.mt.get(pid) == 'soft': lv = (0 if d > SOFTLV4[0] else 1 if d > SOFTLV4[1] else 2 if d > SOFTLV4[2] else 3) if GRAD else (0 if d > SOFTLV[0] else 1 if d > SOFTLV[1] else 2)
        if sc.mt.get(pid) == 'soft1': lv = 0 if d > SOFTLV[0] else 1   # 布（うすいかげだけ。まくらなど、かげをこくしない物）
        if sc.mt.get(pid) in ('flat', 'ink'): lv = 0   # かげを自分でつけた部品（場所ごとの色。まくら）：3だんのかげをつけない   # 布・砂：なだらかなふくらみにも、かげがつく（さかい目の向きを光に近くする）
        if sc.mt.get(pid) in ('shiny', 'shinym'):   # つやつや：光と目のあいだの向きを向く所に、白い光とまわりのうすい光（金属は、すじの上に）
            hv = LIGHT+depth/np.linalg.norm(depth); hv /= np.linalg.norm(hv); sp = float(np.dot(n, hv))
            lv = -3 if sp > SHINYSPEC[0] else -1 if sp > SHINYSPEC[1] else lv
        if sc.mt.get(pid) in ('metal', 'shinym') and lv != -3:   # 金属：光と目のあいだの向き（ハーフベクトル）を向く面に、つやのすじ
            hv = LIGHT+depth/np.linalg.norm(depth); hv /= np.linalg.norm(hv); hh = np.array([hv[0], hv[1], 0]); nh = np.array([n[0], n[1], 0])
            sp = float(np.dot(nh/(np.linalg.norm(nh) or 1), hh/(np.linalg.norm(hh) or 1))) if np.linalg.norm(nh) > .3 else float(np.dot(n, hv))
            lv = -1 if sp > METALSPEC else lv
        if sc.mt.get(pid) == 'satin':   # サテン：布のかげに、光と目のあいだの向きを向く所のつや
            hv = LIGHT+depth/np.linalg.norm(depth); hv /= np.linalg.norm(hv)
            lv = -2 if float(np.dot(n, hv)) > SATINSPEC else _lvof(d, 'soft')
        shc = toon(cc, lv)
        P = [((proj(p)[0]-x0)*S, (proj(p)[1]-y0)*S) for p in (a, b, c)]; D = [float(np.dot(p, depth)) for p in (a, b, c)]
        xs = [p[0] for p in P]; ys = [p[1] for p in P]; pad = 2 if RAY else 0   # 遠近では辺が少し曲がるので、まわり2ドットも見る
        bx0 = max(int(math.floor(min(xs)))-pad, 0); bx1 = min(int(math.ceil(max(xs)))+pad, Wp-1)
        by0 = max(int(math.floor(min(ys)))-pad, 0); by1 = min(int(math.ceil(max(ys)))+pad, Hp-1)
        if bx1 < bx0 or by1 < by0: continue
        gx, gy = np.meshgrid(np.arange(bx0, bx1+1)+0.5, np.arange(by0, by1+1)+0.5)
        if RAY:
            Pw, ok = _raysolve(proj, x0+gx/S, y0+gy/S, n, a); v0, v1 = b-a, c-a; v2 = Pw-a
            d00, d01, d11 = v0@v0, v0@v1, v1@v1; d20, d21 = v2@v0, v2@v1; dn = d00*d11-d01*d01
            w1 = (d11*d20-d01*d21)/dn; w2 = (d00*d21-d01*d20)/dn; w0 = 1-w1-w2
            m = ok & (w0 >= -1e-6) & (w1 >= -1e-6) & (w2 >= -1e-6)
            z = Pw@depth
        else:
            (ax, ay), (bx, by), (cx, cy) = P; den = (by-cy)*(ax-cx)+(cx-bx)*(ay-cy)
            if abs(den) < 1e-9: continue
            w0 = ((by-cy)*(gx-cx)+(cx-bx)*(gy-cy))/den; w1 = ((cy-ay)*(gx-cx)+(ax-cx)*(gy-cy))/den; w2 = 1-w0-w1
            m = (w0 >= -1e-6) & (w1 >= -1e-6) & (w2 >= -1e-6)
            z = w0*D[0]+w1*D[1]+w2*D[2]
        s = (slice(by0, by1+1), slice(bx0, bx1+1)); vis = m & (z > zb[s])
        nrm[s][vis] = n
        zb[s][vis] = z[vis]; col[s][vis] = shc; ccb[s][vis] = cc; dlb[s][vis] = d; idb[s][vis] = pid; lvb[s][vis] = lv
        if pid in sc.sm and sc.mt.get(pid) != 'flat' and vis.any():   # スムーズシェード：ドットごとに、角の向きをまぜた面の向きで段をきめる（金属は、つやのすじも）
            na, nb, nc = vnorm(pid, a, n), vnorm(pid, b, n), vnorm(pid, c, n)
            NN = w0[vis, None]*na+w1[vis, None]*nb+w2[vis, None]*nc; NN /= np.maximum(np.linalg.norm(NN, axis=1, keepdims=True), 1e-9)
            BMUL = None
            if pid in sc.bm:   # でこぼこ（ノーマルマップ）：見える面の場所から、面の向きをかえる
                NN, BMUL = sc.bm[pid](w0[vis, None]*a+w1[vis, None]*b+w2[vis, None]*c, NN)
            dd = NN@LIGHT; mt_ = sc.mt.get(pid); L2 = np.array([_lvof(float(x), 'curve' if pid in sc.cv else (None if mt_ in ('metal', 'shiny', 'shinym') else 'soft' if mt_ == 'satin' else mt_)) for x in dd])
            if mt_ in ('metal', 'shinym'):
                hv = LIGHT+depth/np.linalg.norm(depth); hv /= np.linalg.norm(hv); hh = np.array([hv[0], hv[1], 0]); hh /= max(1e-9, np.linalg.norm(hh))
                for i_, q in enumerate(NN):
                    nh = np.array([q[0], q[1], 0]); ln_ = np.linalg.norm(nh)
                    sp = float(np.dot(nh/ln_, hh)) if ln_ > .3 else float(np.dot(q, hv))
                    if sp > METALSPEC: L2[i_] = -1
            if mt_ == 'satin':
                hv = LIGHT+depth/np.linalg.norm(depth); hv /= np.linalg.norm(hv); L2[NN@hv > SATINSPEC] = -2
            if mt_ in ('shiny', 'shinym'):
                hv = LIGHT+depth/np.linalg.norm(depth); hv /= np.linalg.norm(hv); sp_ = NN@hv; L2[sp_ > SHINYSPEC[1]] = -1; L2[sp_ > SHINYSPEC[0]] = -3
            nrm[s][vis] = NN
            TC = {q: toon(cc, q) for q in set(L2.tolist())}
            col[s][vis] = np.array([TC[q] for q in L2])*(1 if BMUL is None else BMUL[:, None]); lvb[s][vis] = L2; dlb[s][vis] = dd; ccb[s][vis] = np.clip(np.array(cc, float)*(1 if BMUL is None else BMUL[:, None]), 0, 255)
        if pid in sc.tx or pid in sc.dc:
            wp[s][vis] = (w0[vis, None]*a+w1[vis, None]*b+w2[vis, None]*c); wn[s][vis] = n
    for pid, f in sc.dc.items():   # もよう：ドットごとに、見える面の場所の色（かげは、そのドットの3だん）
        ys_, xs_ = np.nonzero(idb == pid)
        for yy, xx in zip(ys_, xs_):
            c_ = f(*wp[yy, xx])
            if c_ is not None: col[yy, xx] = toon(c_, lvb[yy, xx]); ccb[yy, xx] = c_
    if DITHER:   # かげを1色にして、うすいかげはかげのドットの密度（あみ）であらわす。あみは、できあがりの1ドット（DITHER ドット四方）ごと
        BY = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]])/16+1/32   # 4×4 のならび（16だん）
        yy_, xx_ = np.mgrid[0:Hp, 0:Wp]; th = BY[((yy_+DITHERO[1])//DITHER) % 4, ((xx_+DITHERO[0])//DITHER) % 4]   # あみのならびは、足もとの点をもとに（コマで絵のわくがかわっても、ずれない）
        m_ = (idb >= 0) & (lvb >= 0) & ~np.isin(idb, list(INK))   # 背面法の輪郭は、そのままの色
        if DITHERT:   # 色の段（こい かげ・かげ・光・ハイライト）と、そのさかいのあみ。DITHERT：段のさかい目ごとの（はじまる・おわる 光の向きとの内積）、段の色（toon の段か、(明るさ, あざやかさ) を足す）
            bd, tones = DITHERT; idx = np.zeros((Hp, Wp), int)
            for lo, hi in bd: idx += (np.clip((dlb-lo)/(hi-lo), 0, 1) > th) | (dlb >= hi)
            import colorsys
            def tone(q, t):
                if not isinstance(t, tuple): return toon(q, t)
                h_, s2, v2 = colorsys.rgb_to_hsv(*(np.array(q)/255)); return np.array(colorsys.hsv_to_rgb(h_, min(1, max(0, s2+t[1]/100)), min(1, max(0, v2+t[0]/100))))*255
            GLS = np.isin(idb, [p_ for p_, m2 in sc.mt.items() if m2 == 'gloss'])
            if GLS.any() and DITHERG:   # つやつや（material 'gloss'）：光の段を広くして、白っぽい つやの光を足す
                bg, tg = DITHERG; ig = np.zeros((Hp, Wp), int)
                for lo, hi in bg: ig += (np.clip((dlb-lo)/(hi-lo), 0, 1) > th) | (dlb >= hi)
                idx = np.where(GLS, ig, idx)
            for q in np.unique(ccb[m_].reshape(-1, 3), axis=0):
                k_ = m_ & np.all(ccb == q, axis=2)
                for i_, t_ in enumerate(tones): col[k_ & (idx == i_) & ~GLS] = tone(q, t_)
                if GLS.any() and DITHERG:
                    for i_, t_ in enumerate(DITHERG[1]): col[k_ & (idx == i_) & GLS] = tone(q, t_)
        else:
            lo, hi = DITHERR; den = np.clip((hi-dlb)/(hi-lo), 0, 1)   # かげのこさ：光の向きとの内積が hi で0、lo で1（そのあいだは、なめらか）
            for q in np.unique(ccb[m_].reshape(-1, 3), axis=0):
                k_ = m_ & np.all(ccb == q, axis=2); lt = toon(q, 0); dk = toon(q, DITHERLV)
                sh = k_ & (den > th)
                col[k_ & ~sh] = lt; col[sh] = dk
                if DITHERHL:   # ハイライト：光のよく当たる所に、明るい1色を、同じあみで
                    import colorsys
                    h_, s2, v2 = colorsys.rgb_to_hsv(*(np.array(q)/255)); hl = np.array(colorsys.hsv_to_rgb(h_, max(0, s2-DITHERHL[3]/100), min(1, v2+DITHERHL[2]/100)))*255
                    dh = np.clip((dlb-DITHERHL[0])/(DITHERHL[1]-DITHERHL[0]), 0, 1); col[k_ & (dh > th)] = hl
    global LAST; LAST = (idb.copy(), zb.copy())   # たしかめ・あとの処理用：ドットごとの部品の番号と奥行き
    col0 = col.copy()   # 木目をつける前の色（輪郭線はこの色から作る。木目ごとに線の色がわかれない）
    for pid, tx in sc.tx.items():   # 部品ののびる向き（いちばん長い向き）にそって、木目をはる
        m = idb == pid
        if not m.any(): continue
        V = np.array([v for t_ in sc.t if t_[4] == pid for v in t_[:3]]); V0 = V.mean(0); txo = getattr(sc, 'txo', {}).get(pid)   # sc.txo：部品ごとに、もようのもとの点と、ずらす数（du,dv）をきめる（マスのさかいでつなぐ柵の横木など）
        ax = getattr(sc, 'txax', {}).get(pid)   # sc.txax：部品ごとに、もようの流れる向きをきめる（もらったモデルの木の皮は、たて）
        if ax is None: ax = np.linalg.svd(V-V0, full_matrices=False)[2][0]   # full_matrices=False：点が多い部品（もらったモデル）で、大きな行列を作らない
        T = tx.at(S); n_ = T.shape[0]; P = wp[m]-V0; N = wn[m]
        v2 = np.cross(N, ax); bad = np.linalg.norm(v2, axis=1) < 0.3
        v2[bad] = np.cross(N[bad], np.array([0, 0, 1.0])); v2 /= np.maximum(np.linalg.norm(v2, axis=1, keepdims=True), 1e-9)
        rs = np.random.RandomState(pid*7919+11); du, dv = rs.randint(0, n_, 2)
        if txo is not None: V0 = np.array(txo[0], float); du, dv = txo[1] % n_, txo[2] % n_
        iu = (np.floor((P@ax)*S).astype(int)+du) % n_; iv = (np.floor((P*v2).sum(1)*S).astype(int)+dv) % n_
        col[m] = np.clip(col[m]*T[iv, iu][:, None], 0, 255)
    if contrast:   # コントラスト：輪郭線を作る前に、ぬった色だけにかける
        m_ = idb >= 0
        if m_.any():
            mid = float(np.median(col[m_])); col[m_] = np.clip(mid+(col[m_]-mid)*contrast, 0, 255); col0[m_] = np.clip(mid+(col0[m_]-mid)*contrast, 0, 255)
    noline = {p for p, (w, _) in sc.ol.items() if w == 0}
    out = col.copy(); alpha = (idb >= 0).astype(float)*255; line = np.zeros((Hp, Wp), bool); line2 = np.zeros((Hp, Wp), bool)
    for dy, dx in ((0, 1), (0, -1), (1, 0), (-1, 0)):
        nid = np.full_like(idb, -1); nz = np.full_like(zb, -1e9)
        ys = slice(max(dy, 0), Hp+min(dy, 0)); xs = slice(max(dx, 0), Wp+min(dx, 0))
        yd = slice(max(-dy, 0), Hp+min(-dy, 0)); xd = slice(max(-dx, 0), Wp+min(-dx, 0))
        nid[yd, xd] = idb[ys, xs]; nz[yd, xd] = zb[ys, xs]
        tie = np.abs(zb-nz) < 1e-4*S                                           # 同じ高さでならぶ板（ぴったりつけた板のさかい）は、番号の小さいほうに線
        far = (idb >= 0) & (nid >= 0) & (nid != idb) & ((zb < nz) & ~tie | tie & (idb < nid))   # となりの部品のほうが手前
        far &= ~np.isin(nid, list(noline)) if noline else True
        if sc.grp:
            G = np.full(sc.pid+2, -1); gi = {}
            for p_, g_ in sc.grp.items(): G[p_] = gi.setdefault(g_, len(gi))
            far &= ~((G[idb] >= 0) & (G[idb] == G[nid]))
        if sc.joins:
            TG = [None]*(sc.pid+2)
            for p_, t_ in sc.tg.items(): TG[p_] = t_
            JN = np.zeros((sc.pid+2, sc.pid+2), bool)
            for a_ in range(sc.pid+2):
                for b_ in range(sc.pid+2):
                    if TG[a_] is not None and TG[b_] is not None and frozenset((TG[a_], TG[b_])) in sc.joins: JN[a_, b_] = True
            far &= ~JN[np.maximum(idb, 0), np.maximum(nid, 0)]
        line |= far
        if lw >= 2:   # 2ドットめ：線のドットの、さらに向こうの同じ部品のドット
            l2 = np.zeros((Hp, Wp), bool); l2[yd, xd] = far[ys, xs]   # l2[q] = far[q+向き]（線のドットのうしろ）
            l2 &= idb >= 0; same = np.zeros((Hp, Wp), bool); same[yd, xd] = idb[yd, xd] == idb[ys, xs]
            same2 = idb == np.roll(np.roll(idb, dy, 0), dx, 1)   # q-向き も同じ部品（部品が3ドット以上つづく）
            line2 |= l2 & same & same2   # 細い部品（3ドットより細い）には2ドットめを引かない（部品が線だけになる）
    KP = np.full(sc.pid+2, float(k)); KP2 = np.full(sc.pid+2, float(k2))   # 部品ごとの輪郭線の色（sc.outline(None, kk) のあとに足した部品は ×kk。2ドットめは ×(kk と1のまん中)）
    for p_, (_, kk_) in sc.ol.items():
        if kk_ is not None: KP[p_] = kk_; KP2[p_] = (kk_+1)/2
    m_ = line2 & ~line; out[m_] = _ol(col0[m_], KP2[idb[m_]][:, None])
    out[line] = _ol(col0[line], KP[idb[line]][:, None])
    if outer:
        for dy, dx in ((0, 1), (0, -1), (1, 0), (-1, 0)):
            ys = slice(max(dy, 0), Hp+min(dy, 0)); xs = slice(max(dx, 0), Wp+min(dx, 0))
            yd = slice(max(-dy, 0), Hp+min(-dy, 0)); xd = slice(max(-dx, 0), Wp+min(-dx, 0))
            src = np.zeros((Hp, Wp), bool); src[yd, xd] = idb[ys, xs] >= 0
            sc_ = np.zeros((Hp, Wp, 3)); sc_[yd, xd] = col0[ys, xs]
            si = np.full((Hp, Wp), -1); si[yd, xd] = idb[ys, xs]
            put = src & (alpha == 0)
            out[put] = _ol(sc_[put], (np.full(int(put.sum()), k if outerk is True else outerk) if outerk else KP[si[put]])[:, None]); alpha[put] = 255
        if lw >= 2:   # 物のふちの内がわ1ドット：うすい線（こい線の上にはぬらない）
            edge = np.zeros((Hp, Wp), bool)
            for dy, dx in ((0, 1), (0, -1), (1, 0), (-1, 0)):
                ys = slice(max(dy, 0), Hp+min(dy, 0)); xs = slice(max(dx, 0), Wp+min(dx, 0))
                yd = slice(max(-dy, 0), Hp+min(-dy, 0)); xd = slice(max(-dx, 0), Wp+min(-dx, 0))
                e = np.zeros((Hp, Wp), bool); e[yd, xd] = idb[ys, xs] < 0; edge |= e
            edge &= (idb >= 0) & ~line
            inner = np.ones((Hp, Wp), bool)   # まわりのふちの内がわの線も、部品がそこから内がわへ3ドット以上つづく所だけ
            for dy, dx in ((0, 1), (0, -1), (1, 0), (-1, 0)):
                e = np.zeros((Hp, Wp), bool); e[max(-dy, 0):Hp+min(-dy, 0), max(-dx, 0):Wp+min(-dx, 0)] = idb[max(dy, 0):Hp+min(dy, 0), max(dx, 0):Wp+min(dx, 0)] < 0
                inner &= ~e | ((np.roll(np.roll(idb, dy, 0), dx, 1) == idb) & (np.roll(np.roll(idb, 2*dy, 0), 2*dx, 1) == idb))
            edge &= inner
            out[edge] = _ol(col0[edge], (np.full(int(edge.sum()), k2 if outerk is True else (outerk+1)/2) if outerk else KP2[idb[edge]])[:, None])
    clrm = np.zeros((Hp, Wp), bool)   # すけて見える部品をかさねたドット
    CLR.sort(key=lambda t: float(np.dot((t[0]+t[1]+t[2])/3, depth)))   # おくから手前へ（ガラスのうしろのかべ → 中の水 → 手前のかべ）
    for a, b, c, cc, n, cm in CLR:   # すけて見える部品：手前にあるドットだけ、下の色に CLEARA のこさでまぜる（線は引かない・下の部品の線はのこす）
        d = float(np.dot(n, LIGHT)); lv = (0 if d > LV4[0] else 1 if d > LV4[1] else 2 if d > LV4[2] else 3) if GRAD else (0 if d > 0.55 else 1 if d > 0.1 else 2); shc = np.array(toon(cc, lv), float); al = CLEARA
        if cm in ('glass', 'glassc', 'gwater'):   # ガラス・ガラスの中の水：うしろに何もない所にもかさねる（チップの半透明）。ガラスは、ふち（目に横を向いた面）ほどこく、光と目のあいだを向いた面に白いつや
            vd = abs(float(np.dot(n, depth/np.linalg.norm(depth)))); hv0 = LIGHT+depth/np.linalg.norm(depth); hv0 = hv0/np.linalg.norm(hv0); sg = float(np.dot(n, hv0)); shc = np.array(cc, float)
            if cm in ('glass', 'glassc'): A_ = GLASSA if cm == 'glass' else GLASSCA; al = A_[0]+(A_[1]-A_[0])*(1-vd)**1.5; shc = shc*(1-0.35*(1-vd))
            else: al = GLASSA[2]; shc = shc*(0.9+0.1*vd)
            if cm in ('glass', 'glassc'):   # ガラスのつやのすじ：左前を向いたたての面に、白いすじ（まるいガラスに、たてに入る光）
                dn = depth/np.linalg.norm(depth); up = np.array([0., 0., 1.]); fx = np.cross(up, dn); fx = fx/max(1e-9, np.linalg.norm(fx)); fh = dn-up*float(dn@up); fh = fh/max(1e-9, np.linalg.norm(fh))
                ang = math.atan2(float(n@fx), float(n@fh)); nz = abs(float(n@up))
                if nz < GLASSSTREAK[2] and GLASSSTREAK[0] < ang < GLASSSTREAK[1]: shc = np.array([255., 255., 255.]); al = 0.85
                elif nz < GLASSSTREAK[2] and GLASSSTREAK[0]-0.25 < ang < GLASSSTREAK[1]+0.25: shc = shc*0.45+255*0.55; al = max(al, 0.55)
            if cm == 'gwater': pass   # 水には、つやを出さない（ガラスの手前のかべが光る）
            elif sg > GLASSSPEC[0]: shc = np.array([255., 255., 255.]); al = 0.95
            elif sg > GLASSSPEC[1] and cm != 'gwater': shc = shc*0.4+255*0.6; al = max(al, 0.7)
        if cm in ('glass', 'glassc', 'gwater'):
            P = [((proj(p)[0]-x0)*S, (proj(p)[1]-y0)*S) for p in (a, b, c)]; D = [float(np.dot(p, depth)) for p in (a, b, c)]
            xs = [p[0] for p in P]; ys = [p[1] for p in P]
            bx0 = max(int(math.floor(min(xs)))-2, 0); bx1 = min(int(math.ceil(max(xs)))+2, Wp-1); by0 = max(int(math.floor(min(ys)))-2, 0); by1 = min(int(math.ceil(max(ys)))+2, Hp-1)
            if bx1 < bx0 or by1 < by0: continue
            gx, gy = np.meshgrid(np.arange(bx0, bx1+1)+0.5, np.arange(by0, by1+1)+0.5)
            if RAY:
                Pw, ok = _raysolve(proj, x0+gx/S, y0+gy/S, n, a); v0, v1 = b-a, c-a; v2 = Pw-a
                d00, d01, d11 = v0@v0, v0@v1, v1@v1; d20, d21 = v2@v0, v2@v1; dn = d00*d11-d01*d01
                w1 = (d11*d20-d01*d21)/dn; w2 = (d00*d21-d01*d20)/dn; w0 = 1-w1-w2
                m = ok & (w0 >= -1e-6) & (w1 >= -1e-6) & (w2 >= -1e-6); z = Pw@depth
            else:
                (ax_, ay_), (bx_, by_), (cx_, cy_) = P; den = (by_-cy_)*(ax_-cx_)+(cx_-bx_)*(ay_-cy_)
                if abs(den) < 1e-9: continue
                w0 = ((by_-cy_)*(gx-cx_)+(cx_-bx_)*(gy-cy_))/den; w1 = ((cy_-ay_)*(gx-cx_)+(ax_-cx_)*(gy-cy_))/den; w2 = 1-w0-w1
                m = (w0 >= -1e-6) & (w1 >= -1e-6) & (w2 >= -1e-6); z = w0*D[0]+w1*D[1]+w2*D[2]
            s_ = (slice(by0, by1+1), slice(bx0, bx1+1)); vis = m & (z > zb[s_])
            o = out[s_]; A = alpha[s_].astype(float)/255; na = al+A*(1-al)
            mix = (shc[None, :]*al+o[vis]*(A[vis][:, None])*(1-al))/np.maximum(na[vis][:, None], 1e-6)
            o[vis] = mix; out[s_] = o; A[vis] = na[vis]; alpha[s_] = np.round(A*255).astype(alpha.dtype); clrm[s_] |= vis
            continue
        hv = LIGHT+depth/np.linalg.norm(depth); hv = hv/np.linalg.norm(hv); sp = float(np.dot(n, hv))   # つや：光と目のあいだの向きを向く面（さざなみの山）は、白く光って、こく見える
        sp -= float(hv[2])   # 平らな水面とくらべて、どれだけ光と目のほうへかたむいているか
        if sp > CLEARSPEC[0]: shc = shc*(1-CLEARSPEC[2])+255*CLEARSPEC[2]; al = min(1.0, CLEARA+CLEARSPEC[3])
        elif sp > CLEARSPEC[1]: shc = shc*(1-CLEARSPEC[2]*0.45)+255*CLEARSPEC[2]*0.45; al = min(1.0, CLEARA+CLEARSPEC[3]*0.5)
        P = [((proj(p)[0]-x0)*S, (proj(p)[1]-y0)*S) for p in (a, b, c)]; D = [float(np.dot(p, depth)) for p in (a, b, c)]
        xs = [p[0] for p in P]; ys = [p[1] for p in P]
        bx0 = max(int(math.floor(min(xs)))-2, 0); bx1 = min(int(math.ceil(max(xs)))+2, Wp-1); by0 = max(int(math.floor(min(ys)))-2, 0); by1 = min(int(math.ceil(max(ys)))+2, Hp-1)
        if bx1 < bx0 or by1 < by0: continue
        gx, gy = np.meshgrid(np.arange(bx0, bx1+1)+0.5, np.arange(by0, by1+1)+0.5)
        if RAY:
            Pw, ok = _raysolve(proj, x0+gx/S, y0+gy/S, n, a); v0, v1 = b-a, c-a; v2 = Pw-a
            d00, d01, d11 = v0@v0, v0@v1, v1@v1; d20, d21 = v2@v0, v2@v1; dn = d00*d11-d01*d01
            w1 = (d11*d20-d01*d21)/dn; w2 = (d00*d21-d01*d20)/dn; w0 = 1-w1-w2
            m = ok & (w0 >= -1e-6) & (w1 >= -1e-6) & (w2 >= -1e-6); z = Pw@depth
        else:
            (ax_, ay_), (bx_, by_), (cx_, cy_) = P; den = (by_-cy_)*(ax_-cx_)+(cx_-bx_)*(ay_-cy_)
            if abs(den) < 1e-9: continue
            w0 = ((by_-cy_)*(gx-cx_)+(cx_-bx_)*(gy-cy_))/den; w1 = ((cy_-ay_)*(gx-cx_)+(ax_-cx_)*(gy-cy_))/den; w2 = 1-w0-w1
            m = (w0 >= -1e-6) & (w1 >= -1e-6) & (w2 >= -1e-6); z = w0*D[0]+w1*D[1]+w2*D[2]
        s_ = (slice(by0, by1+1), slice(bx0, bx1+1)); vis = m & (z > zb[s_]) & (alpha[s_] > 0)
        o = out[s_]; o[vis] = o[vis]*(1-al)+shc*al; out[s_] = o; clrm[s_] |= vis
    global LAST_IDS, LAST_ZB, LAST_CC, LAST_LINE, LAST_LINE2, LAST_MT, LAST_TX, LAST_N, LAST_CLR, LAST_DEPTH; LAST_CC = ccb.copy(); LAST_LINE = line.copy(); LAST_LINE2 = (line2 & ~line).copy(); LAST_MT = dict(sc.mt); LAST_TX = set(sc.tx); LAST_N = nrm; LAST_CLR = clrm; LAST_DEPTH = np.asarray(depth, float)   # 5色のかげ（furntone）用：ドットごとの部品のもとの色・部品のさかいの線・2ドットめの線・部品ごとの材質
    global LAST_IDS, LAST_ZB; LAST_IDS = idb; LAST_ZB = zb   # ドットごとの部品の番号（その部品だけをとり出すとき用）・奥行き（大きいほど手前。粒の火をかさねるとき用）
    img = np.dstack([np.round(out), alpha]).astype(np.uint8)
    if merge > 0:   # にた色をまとめる（多い色から順に、近い色をよせる）
        m = img[..., 3] > 0; px = img[m][:, :3].astype(int)
        u, inv, cnt = np.unique(px, axis=0, return_inverse=True, return_counts=True); to = np.arange(len(u))
        for i in np.argsort(-cnt):
            if to[i] != i: continue
            d = ((u-u[i])**2).sum(1) < merge*merge; d[i] = False; d &= to == np.arange(len(u))
            d &= cnt <= cnt[i]; to[d] = i
        sub = img[m]; sub[:, :3] = u[to[inv.ravel()]]; img[m] = sub
    return Image.fromarray(img, 'RGBA')

def persp(elev=51.34, fov=40.0, frame=None, center=(0.5, 0.65, 0.3), full=False, keep=None):
    """左右は平行のまま、奥行き（上下）だけに遠近をかける写し方。render・render_px の proj と depth（見る向き）をかえす。
    elev：見おろしの角度（度。51.34 でいまのゲームの見え方と同じ形 = 画面 (x, y−0.8z)）。
    fov：上下の画角（度）。frame：その画角に入れる上下の範囲（マス。カメラとの距離がきまる）。None なら遠近なし（平行）。
    center：カメラが向く所（せかいのマス）。大きさは、いまのゲームと同じ（51.34度・遠近なしで game と同じ数になる）
    keep：その角度（度）のときと、高さの見え方を同じにする（角度をゆるくしても、たてにのびない。上の面がうすくなるだけ）"""
    t = math.radians(elev); V = np.array([0, math.cos(t), math.sin(t)]); U_ = np.array([0, -math.sin(t), math.cos(t)])
    k = 1/math.sin(math.radians(51.34)); c0 = np.array(center, float)
    if keep: k *= math.cos(math.radians(keep))/math.cos(t)   # 高さ（z）の画面の長さ cos(t)*k を、keep の角度のときと同じに
    D = None if not frame else frame/(2*k*math.tan(math.radians(fov)/2))
    oy = c0[1]-0.8*c0[2]   # center が、game と同じ画面の所に写るように
    def proj(p):
        p = np.asarray(p, float); h = -float(np.dot(p-c0, U_))
        s = 1.0 if D is None else D/(D-float(np.dot(p-c0, V)))
        return (c0[0]+(p[0]-c0[0])*s if full and D is not None else p[0], oy+h*s*k)
    st, ct = math.sin(t), math.cos(t)
    def ray(Ys):
        """画面の上下の位置 Ys に写る点の、せかいの (y, z) がみたす式 A*y + B*z = C の A・B・C（x は画面の x のまま）"""
        Y1 = (np.asarray(Ys, float)-oy)/k
        if D is None: A, B, C = np.full_like(Y1, st), np.full_like(Y1, -ct), Y1
        else: A, B, C = -Y1*ct-D*st, -Y1*st+D*ct, -Y1*D
        return A, B, C+A*c0[1]+B*c0[2]
    proj.ray = ray
    if full and D is not None:   # full：左右にも、上下と同じ遠近（カメラから遠い所ほど小さい）
        def ray3(Xs):
            q = np.asarray(Xs, float)-c0[0]; return (np.full_like(q, D), q*V[1], q*V[2], q*(D+float(np.dot(V, c0)))+D*c0[0])
        proj.ray3 = ray3
    return proj, V
