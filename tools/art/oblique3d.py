"""3Dの下絵を、ゲームと同じ見え方で写すための小さな道具（パラソル・噴水などの絵をたのむ用）。
x=東, y=南, z=上（単位はマス）。ゲームの見え方は 画面=(x, y-0.8z)、見る向きは (0,0.8,1)。
三角形をならべ、zバッファで手前の面だけ写す。かげはトゥーンシェーダー（光のあたり方を3だんの色にわける）。
形のふち・前後の物のさかいには、まわりより少しこい色の線（黒にしない）。2倍の細かさで描いて BOX でちぢめる。"""
import math
import numpy as np
from PIL import Image, ImageDraw

S = 128; SS = 2
LIGHT = np.array([-0.35, 0.25, 1.0]); LIGHT = LIGHT / np.linalg.norm(LIGHT)
VIEW = np.array([0, 0.8, 1.0]); VIEW = VIEW / np.linalg.norm(VIEW)
SIDE = np.array([0, 1.0, 0])

class Scene:
    def __init__(self): self.t = []
    def tri(self, a, b, c, col): self.t.append((np.array(a, float), np.array(b, float), np.array(c, float), np.array(col, float)))
    def quad(self, a, b, c, d, col): self.tri(a, b, c, col); self.tri(a, c, d, col)
    def ring_wall(self, cx, cy, r, z0, z1, colf, n=48):
        """丸いかべ（外がわを向いた面）。colf(i,a0,a1) で色"""
        for i in range(n):
            a0 = 2*math.pi*i/n; a1 = 2*math.pi*(i+1)/n
            p = lambda a, z: (cx+r*math.cos(a), cy+r*math.sin(a), z)
            self.quad(p(a0, z0), p(a1, z0), p(a1, z1), p(a0, z1), colf(i, a0, a1))
    def annulus(self, cx, cy, r0, r1, z, colf, n=48):
        """ドーナツの形の平らな面（r0=0 なら円）"""
        for i in range(n):
            a0 = 2*math.pi*i/n; a1 = 2*math.pi*(i+1)/n
            p = lambda r, a: (cx+r*math.cos(a), cy+r*math.sin(a), z)
            if r0 <= 0: self.tri((cx, cy, z), p(r1, a0), p(r1, a1), colf(i, a0, a1))
            else: self.quad(p(r0, a0), p(r1, a0), p(r1, a1), p(r0, a1), colf(i, a0, a1))
    def sphere(self, cx, cy, zc, r, col, n=20, m=12, zs=1.0):
        for j in range(m):
            t0 = math.pi*j/m; t1 = math.pi*(j+1)/m
            for i in range(n):
                a0 = 2*math.pi*i/n; a1 = 2*math.pi*(i+1)/n
                p = lambda t, a: (cx+r*math.sin(t)*math.cos(a), cy+r*math.sin(t)*math.sin(a), zc+r*zs*math.cos(t))
                self.quad(p(t0, a0), p(t1, a0), p(t1, a1), p(t0, a1), col)

    def revolve(self, cx, cy, prof, colf, n=36):
        """まわりをまわした面。prof は [(半径, 高さ), ...]（上から下へ）"""
        for k in range(len(prof)-1):
            (r0, z0), (r1, z1) = prof[k], prof[k+1]
            for i in range(n):
                a0 = 2*math.pi*i/n; a1 = 2*math.pi*(i+1)/n
                p = lambda r, z, a: (cx+r*math.cos(a), cy+r*math.sin(a), z)
                self.quad(p(r0, z0, a0), p(r1, z1, a0), p(r1, z1, a1), p(r0, z0, a1), colf(k, i))

    def tube(self, pts, r, col, n=8):
        """点をつないだ細い管（水の線など）"""
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

def render(sc, proj, ext, depth):
    x0, x1, y0, y1 = ext; Wp = int((x1-x0)*S*SS); Hp = int((y1-y0)*S*SS)
    img = np.zeros((Hp, Wp, 4)); zb = np.full((Hp, Wp), -1e9)
    for a, b, c, col in sc.t:
        n = np.cross(b-a, c-a); ln = np.linalg.norm(n)
        if ln < 1e-12: continue
        n /= ln
        if np.dot(n, depth) < 0: n = -n
        d = float(np.dot(n, LIGHT)); sh = 1.0 if d > 0.55 else 0.87 if d > 0.1 else 0.76   # トゥーン：3だん
        cc = np.clip(col*sh, 0, 255)
        P = [((proj(p)[0]-x0)*S*SS, (proj(p)[1]-y0)*S*SS) for p in (a, b, c)]
        D = [float(np.dot(p, depth)) for p in (a, b, c)]
        xs = [p[0] for p in P]; ys = [p[1] for p in P]
        bx0 = max(int(math.floor(min(xs))), 0); bx1 = min(int(math.ceil(max(xs))), Wp-1)
        by0 = max(int(math.floor(min(ys))), 0); by1 = min(int(math.ceil(max(ys))), Hp-1)
        if bx1 < bx0 or by1 < by0: continue
        gx, gy = np.meshgrid(np.arange(bx0, bx1+1)+0.5, np.arange(by0, by1+1)+0.5)
        (ax, ay), (bx, by), (cx, cy) = P
        den = (by-cy)*(ax-cx)+(cx-bx)*(ay-cy)
        if abs(den) < 1e-9: continue
        w0 = ((by-cy)*(gx-cx)+(cx-bx)*(gy-cy))/den; w1 = ((cy-ay)*(gx-cx)+(ax-cx)*(gy-cy))/den; w2 = 1-w0-w1
        m = (w0 >= -1e-6) & (w1 >= -1e-6) & (w2 >= -1e-6)
        if not m.any(): continue
        z = w0*D[0]+w1*D[1]+w2*D[2]
        szb = zb[by0:by1+1, bx0:bx1+1]; sub = img[by0:by1+1, bx0:bx1+1]
        vis = m & (z > szb); szb[vis] = z[vis]; sub[vis, :3] = cc; sub[vis, 3] = 255
    # ふちの線：透明とのさかい（形のふち）と、奥行きが大きくとぶ所（前後の物のさかい）。線の色は、手前がわの色を少しこくした色
    a = img[..., 3] > 0; edge = np.zeros_like(a); T = 0.15
    for dy, dx in ((0, 1), (1, 0), (0, -1), (-1, 0)):
        sa = np.roll(a, (dy, dx), (0, 1)); sz = np.roll(zb, (dy, dx), (0, 1))
        edge |= a & (~sa | (sz - zb > T))      # となりが透明か、となりがずっと手前（自分が奥）→ 自分のがわに線
    for k in range(1, SS):                     # 線のはばは、できあがりで1ドット
        edge |= np.roll(edge, k, 0) & a | np.roll(edge, k, 1) & a
    img[edge, :3] = img[edge, :3]*0.72
    return Image.fromarray(img.astype(np.uint8), 'RGBA').resize((Wp//SS, Hp//SS), Image.BOX)

def grid_bg(ext, foot=None):
    x0, x1, y0, y1 = ext; W = int((x1-x0)*S); H = int((y1-y0)*S)
    im = Image.new('RGBA', (W, H), (235, 230, 211, 255)); d = ImageDraw.Draw(im)
    for i in range(int(x1-x0)+1): d.line([(i*S, 0), (i*S, H)], fill=(201, 194, 168), width=2)
    for j in range(int(y1-y0)+1): d.line([(0, j*S), (W, j*S)], fill=(201, 194, 168), width=2)
    if foot: fw, fh = foot; d.rectangle([((0-x0)*S, (0-y0)*S), ((fw-x0)*S, (fh-y0)*S)], outline=(214, 170, 70), width=3)
    return im
