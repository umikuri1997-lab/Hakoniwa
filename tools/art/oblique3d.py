"""3Dの下絵を、ゲームと同じ見え方で写すための小さな道具（パラソル・噴水などの絵をたのむ用）。
x=東, y=南, z=上（単位はマス）。ゲームの見え方は 画面=(x, y-0.8z)、見る向きは (0,0.8,1)。
三角形をならべ、zバッファで手前の面だけ写す。かげはトゥーンシェーダー（光のあたり方を3だんの色にわける）。
輪郭線は裏面法：部品（箱・管・かべなど1つずつ）を外へ OUT ぶんふくらませた形の、うら向きの面だけを、その部品の色をこくした色でかく（黒にしない）。
2倍の細かさで描いて BOX でちぢめる。"""
import math
import numpy as np
from PIL import Image, ImageDraw

S = 128; SS = 2
LIGHT = np.array([-0.35, 0.25, 1.0]); LIGHT = LIGHT / np.linalg.norm(LIGHT)
VIEW = np.array([0, 0.8, 1.0]); VIEW = VIEW / np.linalg.norm(VIEW)
SIDE = np.array([0, 1.0, 0])

OUT = 0.035      # 輪郭線のふとさ（マス）
class Scene:
    def __init__(self): self.t = []; self.pid = 0
    def part(self): self.pid += 1   # つぎの三角形から、べつの部品（輪郭線は部品ごとにふくらませる）
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

    def box(self, x0, y0, z0, x1, y1, z1, col):
        """四角い箱（6つの面）"""
        self.part()
        P = lambda x, y, z: (x, y, z)
        self.quad(P(x0,y0,z1),P(x1,y0,z1),P(x1,y1,z1),P(x0,y1,z1),col); self.quad(P(x0,y0,z0),P(x1,y0,z0),P(x1,y1,z0),P(x0,y1,z0),col)
        self.quad(P(x0,y1,z0),P(x1,y1,z0),P(x1,y1,z1),P(x0,y1,z1),col); self.quad(P(x0,y0,z0),P(x1,y0,z0),P(x1,y0,z1),P(x0,y0,z1),col)
        self.quad(P(x0,y0,z0),P(x0,y1,z0),P(x0,y1,z1),P(x0,y0,z1),col); self.quad(P(x1,y0,z0),P(x1,y1,z0),P(x1,y1,z1),P(x1,y0,z1),col)
    def beam(self, a, b, r, col):
        """2点をつなぐ四角い棒（すじかいなど）"""
        self.tube([a, b], r, col, n=4)
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

def render(sc, proj, ext, depth, out=None):
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
    t = OUT if out is None else out
    if t > 0:
        parts = {}
        for a, b, c, col, pid in sc.t: parts.setdefault(pid, []).append((a, b, c, col))
        for L in parts.values():
            cen = np.mean([v for q in L for v in q[:3]], 0)
            vn = {}; info = []
            flat = True
            for a, b, c, col in L:
                n = np.cross(b-a, c-a); ln = np.linalg.norm(n)
                if ln < 1e-12: continue
                n /= ln
                if np.dot(n, (a+b+c)/3-cen) < 0: n = -n
                if abs(np.dot(n, (a+b+c)/3-cen)) > 1e-4: flat = False
                info.append((a, b, c, col, n))
                for v in (a, b, c): k = tuple(np.round(v, 4)); vn[k] = vn.get(k, 0)+n
            for a, b, c, col, n in info:
                if flat:   # 平らな部品（旗・星・水面など）：面の中で外へひろげ、少しうしろへ
                    back = -depth*0.002
                    off = [((v-cen)-np.dot(v-cen, n)*n) for v in (a, b, c)]
                    vs = [v+t*o/(np.linalg.norm(o) or 1)+back for v, o in zip((a, b, c), off)]
                else:
                    if np.dot(n, depth) >= 0: continue   # おもて向きの面はかかない
                    vs = []
                    for v in (a, b, c):
                        m = vn[tuple(np.round(v, 4))]; m = m/(np.linalg.norm(m) or 1); vs.append(v+t*m)
                raster(vs[0], vs[1], vs[2], np.clip(col*0.5, 0, 255), bias=0.02)   # 輪郭線は少し奥に（かさなった面とあらそってざらざらにならない）
    return Image.fromarray(img.astype(np.uint8), 'RGBA').resize((Wp//SS, Hp//SS), Image.BOX)

def grid_bg(ext, foot=None):
    x0, x1, y0, y1 = ext; W = int((x1-x0)*S); H = int((y1-y0)*S)
    im = Image.new('RGBA', (W, H), (235, 230, 211, 255)); d = ImageDraw.Draw(im)
    for i in range(int(x1-x0)+1): d.line([(i*S, 0), (i*S, H)], fill=(201, 194, 168), width=2)
    for j in range(int(y1-y0)+1): d.line([(0, j*S), (W, j*S)], fill=(201, 194, 168), width=2)
    if foot: fw, fh = foot; d.rectangle([((0-x0)*S, (0-y0)*S), ((fw-x0)*S, (fh-y0)*S)], outline=(214, 170, 70), width=3)
    return im
