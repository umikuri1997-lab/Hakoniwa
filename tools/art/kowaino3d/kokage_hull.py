"""コカゲ（コワイノ basic）の3Dを、いまの絵（kg_basic:idle の正面・kg_basic:idleB のうしろ）から作る（せいれいの spirit3d と同じ考え方）。
  python3 tools/art/kowaino3d/kokage_hull.py <出力フォルダ>
形：正面の絵の形（行ごとの、つながった横のならび）を、そのならびのはばの だ円の切り口にした立体（1ドット＝1ボクセル）。
    奥行きは、はばに、部分ごとの数をかけた物（DEPTH：ずきん・マント・足）。ぽんぽん（はなれた小さなかたまり）は、まるい玉。
    止まっていれば、正面から見た形は、いまの絵と同じ。
色：前を向いた面は正面の絵の色、うしろを向いた面はうしろの絵の色（うしろから見た左右）。横の面は、近いほうの絵の、はしから2ドット内がわの色（輪郭線の色をさける）。
出す物：kokage.glb（3Dモデル。面ごとの色）・views.png（正面・右・うしろ・ななめ前・いまの絵の正面とうしろ）"""
import math, os, sys
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))
sys.path.insert(0, os.path.join(ROOT, 'tools')); sys.path.insert(0, os.path.dirname(HERE))

DEPTH = [(24, 0.85), (7, 0.72), (-1, 0.9)]   # (この高さより上, 奥行き÷はば)：ずきん・マント・足
POMY = 2.0   # ぽんぽんのまん中の奥行き（少し前）

def chip(k):
    import chips
    _, C = chips.load_imgs(); c = C[k]
    return np.array(c['f'][0].convert('RGBA'))[:c['h']], c['ax'], c['ay']

def comps(m):
    """つながったかたまりの番号（4つのとなり）"""
    lab = np.zeros(m.shape, int); n = 0
    for s in zip(*np.nonzero(m)):
        if lab[s]: continue
        n += 1; st = [s]; lab[s] = n
        while st:
            r, c = st.pop()
            for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                q = (r+dr, c+dc)
                if 0 <= q[0] < m.shape[0] and 0 <= q[1] < m.shape[1] and m[q] and not lab[q]: lab[q] = n; st.append(q)
    return lab, n

def build():
    F, axF, ayF = chip('kg_basic:idle'); B, axB, ayB = chip('kg_basic:idleB')
    m = F[..., 3] > 0; lab, n = comps(m); big = np.argmax(np.bincount(lab.ravel())[1:])+1
    X0, X1, Y0, Y1, Z1 = -30, 30, -30, 30, 60
    V = np.zeros((X1-X0, Y1-Y0, Z1), bool)
    H = F.shape[0]
    for r in range(H):
        zi = -(r+ayF)-1
        if zi < 0 or zi >= Z1: continue
        k = next(v for zz, v in DEPTH if zi >= zz)
        for comp in range(1, n+1):
            cs = np.nonzero(lab[r] == comp)[0]
            if not len(cs): continue
            segs = np.split(cs, np.nonzero(np.diff(cs) > 1)[0]+1)
            for sg in segs:
                xl, xr = sg[0]+axF, sg[-1]+axF+1; xc = (xl+xr)/2; w = (xr-xl)/2
                if comp == big: d, yc = k*w, 0.0
                else:   # ぽんぽん：かたまりのはばから、まるい玉
                    rs, cs2 = np.nonzero(lab == comp); R = (cs2.max()-cs2.min()+1)/2; zc = -(rs.mean()+ayF)-0.5
                    d = math.sqrt(max(0, R*R-(zi+0.5-zc)**2)); yc = POMY
                for xi in range(xl, xr):
                    u = (xi+0.5-xc)/max(w, 0.5); t = math.sqrt(max(0, 1-u*u))*d
                    for yi in range(int(math.floor(yc-t)), int(math.ceil(yc+t))):
                        if abs(yi+0.5-yc) <= t+0.25: V[xi-X0, yi-Y0, zi] = True
    def colF(x, z):
        c = x-axF; r = -(z+1)-ayF
        return F[r, c, :3] if 0 <= r < F.shape[0] and 0 <= c < F.shape[1] and F[r, c, 3] else None
    def colB(x, z):   # うしろの絵：うしろから見るので、左右が反対
        c = (-x-1)-axB; r = -(z+1)-ayB
        return B[r, c, :3] if 0 <= r < B.shape[0] and 0 <= c < B.shape[1] and B[r, c, 3] else None
    def near(img, ax, ay, x, z, back):
        """絵の、いちばん近い色（その場所が透明なとき）"""
        a = img[..., 3] > 0; rr, cc = np.nonzero(a)
        c = ((-x-1) if back else x)-ax; r = -(z+1)-ay
        i = np.argmin((rr-r)**2+(cc-c)**2); return img[rr[i], cc[i], :3]
    return V, (X0, Y0), colF, colB, near, (F, axF, ayF), (B, axB, ayB)

def faces(V, org, colF, colB, near, FI, BI):
    """見えている面：(4つの角, 色, 向き)"""
    X0, Y0 = org; out = []
    D = {(0, 1, 0): 'F', (0, -1, 0): 'B', (1, 0, 0): 'R', (-1, 0, 0): 'L', (0, 0, 1): 'U', (0, 0, -1): 'D'}
    sh = V.shape
    for xi, yi, zi in zip(*np.nonzero(V)):
        x, y, z = xi+X0, yi+Y0, zi
        cf = colF(x, z); cb = colB(x, z)
        if cf is None: cf = near(*FI, x, z, False)
        if cb is None: cb = near(*BI, x, z, True)
        for (dx, dy, dz), nm in D.items():
            q = (xi+dx, yi+dy, zi+dz)
            if 0 <= q[0] < sh[0] and 0 <= q[1] < sh[1] and 0 <= q[2] < sh[2] and V[q]: continue
            if nm == 'F': c = cf
            elif nm == 'B': c = cb
            else:   # 横・上・下の面：はしの輪郭線の色をさけて、2ドット内がわの色
                xin = int(x-2*np.sign(x+0.5)) if nm in ('L', 'R') else x
                c = (colF(xin, z) if y >= 0 else colB(xin, z))
                if c is None: c = cf if y >= 0 else cb
            if nm in ('U', 'D', 'L', 'R'): c = np.clip(np.array(c, float)*(0.93 if nm in ('L', 'R') else 1.0), 0, 255)
            p = np.array([x, y, z], float)
            if nm == 'F': q4 = [(0, 1, 0), (1, 1, 0), (1, 1, 1), (0, 1, 1)]
            elif nm == 'B': q4 = [(1, 0, 0), (0, 0, 0), (0, 0, 1), (1, 0, 1)]
            elif nm == 'R': q4 = [(1, 1, 0), (1, 0, 0), (1, 0, 1), (1, 1, 1)]
            elif nm == 'L': q4 = [(0, 0, 0), (0, 1, 0), (0, 1, 1), (0, 0, 1)]
            elif nm == 'U': q4 = [(0, 0, 1), (0, 1, 1), (1, 1, 1), (1, 0, 1)]
            else: q4 = [(0, 0, 0), (1, 0, 0), (1, 1, 0), (0, 1, 0)]
            out.append(([p+np.array(o, float) for o in q4], np.array(c, float), nm))
    return out

def export_glb(F, path):
    import trimesh
    vs = []; fs = []; fc = []
    for q, c, _ in F:
        b = len(vs); vs += [list(v) for v in q]
        fs += [[b, b+1, b+2], [b, b+2, b+3]]; fc += [list(c)+[255]]*4   # 面ごとに点をわけているので、点の色＝面の色
    v = np.array(vs); v = v[:, [0, 2, 1]]*np.array([1, 1, -1])/64.0   # glTF は y が上。1マス=64ドット＝1
    mesh = trimesh.Trimesh(vertices=v, faces=np.array(fs), vertex_colors=np.array(fc, np.uint8), process=False)
    mesh.export(path)

def render(F, yaw):
    """面を、まうえのまわりに yaw だけまわして、まっすぐ正面から写す（1ドット＝1）"""
    import oblique3d as O
    sc = O.Scene(); c, s = math.cos(yaw), math.sin(yaw)
    R = lambda p: (p[0]*c-p[1]*s, p[0]*s+p[1]*c, p[2])
    sc.material('flat')
    for q, col, _ in F:
        sc.part(); sc.quad(*[R(v) for v in q], col)
    proj = lambda p: (p[0], -p[2]); dep = np.array([0, 1.0, 0])
    P = np.array([proj(v) for tr in sc.t for v in tr[:3]]); ext = (math.floor(P[:, 0].min())-2, math.ceil(P[:, 0].max())+2, math.floor(P[:, 1].min())-2, math.ceil(P[:, 1].max())+2)
    O.S = 1; im = O.render_px(sc, proj, ext, dep, k=1.0, outer=False, merge=0)
    return im

if __name__ == '__main__':
    out = sys.argv[1]; os.makedirs(out, exist_ok=True)
    V, org, colF, colB, near, FI, BI = build()
    Fc = faces(V, org, colF, colB, near, FI, BI); print('ボクセル', int(V.sum()), '面', len(Fc))
    export_glb(Fc, os.path.join(out, 'kokage.glb'))
    ims = [Image.fromarray(FI[0]), render(Fc, 0), Image.fromarray(BI[0]), render(Fc, math.pi), render(Fc, -math.pi/2), render(Fc, -math.pi/4)]
    W = sum(i.width+8 for i in ims); Hh = max(i.height for i in ims)
    bg = Image.new('RGBA', (W, Hh), (150, 190, 120, 255)); x = 0
    for i in ims:
        bb = i.getbbox(); bg.alpha_composite(i, (x, Hh-bb[3])); x += i.width+8
    bg.resize((W*6, Hh*6), Image.NEAREST).save(os.path.join(out, 'views.png'))
