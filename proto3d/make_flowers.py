"""3Dの試作（proto3d）の花：スキル realistic-plant-3d のやり方と、その部品（scripts/plant_geometry.py の leaf・tube）で、花10しゅるいと草むらを作る。
  python3 proto3d/make_flowers.py        → proto3d/tex/flowers.glb（F0〜F9・G0）
形の設計は proto3d/flowers_spec.json（種ごとの骨格・葉の形とつき方・花の部位。観察した事と、制作上の仮定をわけて書く）。
- 作る順：骨格（くき・枝）→ 節に葉（葉柄から葉身へ。葉序は種ごと）→ 花（花びら・がく・おしべ・花のまん中）。葉も花びらも、1まいずつ曲面（そり・くぼみ・ねじれ）。
- 表現：持ち主の参考の絵（tools/art/ref/plants_ref.png）のように、せを低く・花を大きく・色ははっきり。花びらと葉には厚みをつける（持ち主がきめた）。
- 単位はマス（x 東・y 上・z 南）。根もとのまん中が原点。色は点ごと（つけ根から先へ）。材質は葉（main.js の MATIDX.leaf。緑でない所は花びらとして光沢）。
- Blender がこの環境にないので、numpy/trimesh で GLB にする（スキルの決まり）。"""
import math, os, sys
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
sys.path[:0] = [HERE, os.path.join(ROOT, '.claude', 'skills', 'realistic-plant-3d', 'scripts')]
import glbio
from plant_geometry import leaf as pg_leaf, tube as pg_tube, frame, unit
from flower_geometry import petal as fg_petal, funnel as fg_funnel
from rose_curved import rose_petal
from rose_plant_v8 import petal as v8_petal

MAT_LEAF = 6
REFLEX = (.7, .1, .22)   # 外がわの花びらのそり返り：はじまる所（つけ根0→先1）・外へ出る長さ（花びらの半径の割合）・下へまがる長さ（花びらの高さの割合）
PETAL_T = .004   # 花びらのふちの厚み（マス。花の大きさ1のとき。持ち主がきめた）
G = lambda *c: np.array(c, float)
STEM = (94, 154, 54)


class Plant:
    """部品（点・面・色・UV）をためて、1つのメッシュにする"""
    def __init__(self, seed, card=True): self.V = []; self.F = []; self.C = []; self.U = []; self.M = []; self.n = 0; self.rng = np.random.default_rng(seed); self.card = Plant(seed + 1000, False) if card else None; self.pcard = Plant(seed + 2000, False) if card else None   # pcard：アルファ抜きの花びら（べつのメッシュ）   # card：アルファ抜きの葉のカード（べつのメッシュ）

    def rimmed(self, v, f, c, uv, rows, cols, thick, rim_k=.88):
        """1まいの面（両面にしない）に、ふちだけ厚みをつける（持ち主がきめた）：面のまわりの点を、面のうらへ thick ずらして、帯でつなぐ。
        面の点のならびは、たて rows+1 × よこ cols+1（i 行 j 列 → i*(cols+1)+j）"""
        import trimesh
        v = np.asarray(v, float); n = np.asarray(trimesh.Trimesh(v, f, process=False).vertex_normals); W = cols + 1
        loop = [j for j in range(cols + 1)] + [i * W + cols for i in range(1, rows + 1)] + [rows * W + j for j in range(cols - 1, -1, -1)] + [i * W for i in range(rows - 1, 0, -1)]
        A = v[loop]; B = A - n[loop] * thick; k = len(loop); rf = []
        for a in range(k): b = (a + 1) % k; rf += [(a, b, k + b), (a, k + b, k + a)]
        self.add(v, f, c, uv); self.add(np.vstack([A, B]), rf, np.vstack([c[loop], c[loop] * rim_k]), np.vstack([uv[loop], uv[loop]]))

    def add(self, v, f, c, uv=None, mat=None):
        v = np.asarray(v, float); self.V.append(v); self.F.append(np.asarray(f) + self.n); self.C.append(np.asarray(c, float)); self.U.append(np.zeros((len(v), 2)) if uv is None else uv); self.n += len(v)
        self.M.append(np.full(len(v), MAT_LEAF if mat is None else mat))   # 材質の番号（main.js の MATIDX。木の皮は5）

    def blade(self, origin, direction, length, width, ca, cb, *, up=(0, 0, 1), thick=.012, back=.8, seg=8, col=4, **kw):
        """葉・花びら：スキルの leaf()（中心線・はばの形・そり・くぼみ・ねじれ）で曲面を作り、厚みをつける。色は、つけ根 ca から先 cb へ"""
        m = pg_leaf(origin, direction, length, width, up=up, segments=seg, columns=col, **kw)
        v = np.asarray(m.vertices); f = np.asarray(m.faces); t = np.asarray(m.visual.uv)[:, 1:2]; q = np.asarray(m.visual.uv)[:, 0:1]
        c = (G(*ca) * (1 - t ** .8) + G(*cb) * t ** .8) * (1 - .1 * np.abs(2 * q - 1) ** 2)   # まん中のすじは少し明るく・ふちは少しこく
        uv = np.hstack([(q - .5) * width, t * length])
        if thick <= 0: self.add(v, f, c, uv); return
        import trimesh
        n = trimesh.Trimesh(v, f, process=False).vertex_normals; k = len(v)
        e = np.sort(np.vstack([f[:, [0, 1]], f[:, [1, 2]], f[:, [2, 0]]]), 1); ue, cnt = np.unique(e, axis=0, return_counts=True); be = set(map(tuple, ue[cnt == 1]))
        rim = [(a, b, b + k) for a, b in np.vstack([f[:, [0, 1]], f[:, [1, 2]], f[:, [2, 0]]]) if tuple(sorted((a, b))) in be]
        rim += [(a, b + k, a + k) for a, b, _ in rim]   # ふち：表と裏をつなぐ
        self.add(np.vstack([v, v - n * thick]), np.vstack([f, f[:, ::-1] + k, np.array(rim).reshape(-1, 3)[:, ::-1]]), np.vstack([c, c * back]), np.vstack([uv, uv]))

    def petal(self, origin, direction, length, width, ca, cb, *, up=(0, 0, 1), rows=14, cols=8, shade=0., tipc=None, **kw):   # tipc：先だけにのる色（ハスの先のピンク）
        """花びら（スキル v3 の petal()）：たての反り（bend）・先のまき（curl）・よこのくぼみ（cup）・ねじれ・ふちのうねりを、べつべつにきめる、なめらかな曲面。
        先は1点にすぼめず、丸い輪郭。ふちはうすい（厚みをつけない1まいの面。両面を描く）。色は、つけ根 ca から先 cb へ。shade：ぜんたいを暗く（内がわの花びら）"""
        m = fg_petal(origin, direction, length, width, up=up, rows=rows, cols=cols, **kw); v = np.asarray(m.vertices)
        t = np.repeat(np.arange(rows + 1) / rows, cols + 1)[:, None]; q = np.tile(np.arange(cols + 1) / cols, rows + 1)[:, None]
        c = (G(*ca) * (1 - t ** .7) + G(*cb) * t ** .7) * (1 - shade) * (1 + .06 * (1 - np.abs(2 * q - 1)) * t)
        if tipc is not None: k = np.clip((t - .45) / .55, 0, 1) ** 1.4 * (.7 + .3 * np.abs(2 * q - 1)); c = c * (1 - k) + G(*tipc) * k
        self.add(v, m.faces, c, np.hstack([(q - .5) * width, t * length]))

    def tube(self, pts, radii, color, sides=6):
        m = pg_tube(pts, radii, sides=sides, ridge=0, color=(0, 0, 0, 255)); v = np.asarray(m.vertices); h = np.linspace(.82, 1, len(v))[:, None]
        self.add(v, m.faces, G(*color) * h)

    def stem(self, base, top, r0, r1, bend=(0, 0, 0), color=STEM, n=4):
        """くき：根もとから先へ細くなる、少ししなる線。かえす物：くきの上の点（t）と、その向き"""
        base = G(*base); top = G(*top); bend = G(*bend); P = lambda t: base + (top - base) * t + bend * math.sin(math.pi * t)
        self.tube([P(i / n) for i in range(n + 1)], np.linspace(r0, r1, n + 1), color)
        return P, lambda t: unit(P(min(1, t + .05)) - P(max(0, t - .05)))

    def ball(self, c, r, color, squash=1., axis=(0, 0, 1), n=8, m=4):
        """まるいふくらみ（花のまん中・つぼみ・やく）"""
        f, s, u = frame(axis, (0, 1, 0) if abs(axis[2]) > .9 else (0, 0, 1)); V = []; F = []; C = []
        for i in range(m + 1):
            th = math.pi * i / m
            for j in range(n):
                ph = 2 * math.pi * j / n; V.append(G(*c) + r * (math.sin(th) * (math.cos(ph) * s + math.sin(ph) * u) + squash * math.cos(th) * f)); C.append(G(*color) * (1 - .22 * i / m))
        for i in range(m):
            for j in range(n):
                a = i * n + j; b = i * n + (j + 1) % n; F += [(a, a + n, b), (b, a + n, b + n)]
        self.add(V, F, C)

    def mesh(self):
        V = np.vstack(self.V); F = np.vstack(self.F); C = np.vstack(self.C) / 255.0; U = np.vstack(self.U); MT = np.concatenate(self.M)
        T = V[F]; F = F[np.linalg.norm(np.cross(T[:, 1] - T[:, 0], T[:, 2] - T[:, 0]), axis=1) > 1e-10]   # 面積のない面（玉のてっぺんなど）はのぞく
        V = V[:, [0, 2, 1]] * [1, 1, -1]   # z 上 → y 上（回すだけ。うらがえさない）
        import trimesh
        Nn = np.asarray(trimesh.Trimesh(V, F, process=False).vertex_normals)   # なめらかな面の向きを、GLB に書く（スキル v6）
        return {'POSITION': V, 'NORMAL': Nn, 'COLOR_0': np.clip(C, 0, 1) ** 2.2, 'TEXCOORD_0': U, '_MAT': MT[:, None].astype(float), '_UNDER': np.zeros((len(V), 1))}, F


def leaf_card_texture(path, src, size=512, seed=7, nsrc=None, npath=None, layout=None, stem_c=(62, 104, 46), gain=1.35):
    """ばらの複葉のカードの絵（アルファ抜き。持ち主がきめた）：葉柄とじく、小さな葉5まい（2つい＋先の1まい）。
    小さな葉は、スキルの leaf_rose の絵（まん中のすじが、たての中心）を、小さな葉のじくにそって写す。外は透明。
    絵の下が葉のつけ根（V=0）・上が先（V=1）。よこは長さの0.75（左右 -0.375〜0.375）"""
    from PIL import Image
    rng = np.random.default_rng(seed); S = np.asarray(Image.open(src).convert('RGB').resize((256, 256)), float)
    NS = np.asarray(Image.open(nsrc).convert('RGB').resize((256, 256)), float) / 127.5 - 1 if nsrc else None   # スキルの葉のノーマル（葉脈のでこぼこ。OpenGL：+Y は絵の上＝葉の先）
    HT = np.zeros((size, size)); DX = np.zeros((size, size)); DY = np.zeros((size, size))   # ノーマルマップ：形の高さ・葉脈のかたむき（カードの x・y）
    ys, xs = np.mgrid[0:size, 0:size]; X = (xs + .5) / size * .75 - .375; Y = 1 - (ys + .5) / size
    col = np.zeros((size, size, 3)); al = np.zeros((size, size)); px = 1 / size
    def seg(a, b, w, c):   # 線（葉柄・じく・小さな葉の柄）
        a = np.array(a); b = np.array(b); d = b - a; L = np.hypot(*d); t = np.clip(((X - a[0]) * d[0] + (Y - a[1]) * d[1]) / L ** 2, 0, 1)
        r = np.hypot(X - a[0] - t * d[0], Y - a[1] - t * d[1]); ww = w * (1 - .4 * t); k = np.clip((ww - r) / px + .5, 0, 1); col[:] = col * (1 - k[..., None]) + np.array(c) * k[..., None]; al[:] = np.maximum(al, k)
        HT[:] = np.maximum(HT, np.sqrt(np.clip(1 - (r / ww) ** 2, 0, 1)) * ww * k)   # 柄・じくは、まるいつつ
    def leaflet(b, ang, L, W, tone, prof=None, teeth=8, tooth=.09, chevron=0., notch=0.):   # prof：はばの形（なければ、つけ根がわが広い）・chevron：まん中のV字の白いもようのこさ・notch：先のくぼみ
        d = np.array([math.sin(ang), math.cos(ang)]); n = np.array([d[1], -d[0]]); u = ((X - b[0]) * d[0] + (Y - b[1]) * d[1]) / L; w = ((X - b[0]) * n[0] + (Y - b[1]) * n[1]) / L
        uc = np.clip(u, 0, 1); hw = W / 2 * (prof(uc) if prof else np.sin(np.pi * uc) ** .72 * (1.16 - .4 * uc)); saw = 1 - tooth * (np.mod(uc * teeth, 1)) * (uc > .15)   # ぎざぎざ（先へ向く歯）
        m = np.clip((hw * saw - np.abs(w)) * L / px + .5, 0, 1) * (u > 0) * (u < 1) * ((u + notch * np.exp(-(w / (W * .12)) ** 2)) < 1)   # 先のまん中のくぼみ
        sx = np.clip(((w / (W * 1.05) + .5) * 255).astype(int), 0, 255); sy = np.clip(((1 - uc) * 255).astype(int), 0, 255); c = S[sy, sx] * tone * (1 - .12 * np.abs(w) / (W / 2))[..., None]   # ふちは少し暗く
        if chevron: v = .3 + .45 * np.abs(w) / (W / 2); k = chevron * np.exp(-((uc - v) / .1) ** 2) * (np.abs(w) < hw * .85); c = c * (1 - k[..., None] * .2) + np.array([170., 200, 160]) * k[..., None] * .55   # V字：白っぽい緑をまぜる   # V字の白いもよう（つけ根がわへひらく）
        col[:] = col * (1 - m[..., None]) + c * m[..., None]; al[:] = np.maximum(al, m)
        a_ = np.clip(np.abs(w) / np.maximum(hw, 1e-6), 0, 1); h = (1 - a_ ** 3) ** .5 * .05 * L * np.sin(np.pi * uc) ** .25 - .008 * L * np.exp(-(w / (.025 * W)) ** 2)   # ふちのきわで、急に下がる（厚みのふち）   # ふくらみ：ふちへ丸く下がる（厚みに見せる）・まん中のすじは少しくぼむ
        HT[:] = HT * (1 - m) + h * m
        if NS is not None: nt = NS[sy, sx]; DX[:] = DX * (1 - m) + (nt[..., 0] * n[0] + nt[..., 1] * d[0]) * m; DY[:] = DY * (1 - m) + (nt[..., 0] * n[1] + nt[..., 1] * d[1]) * m   # 葉脈のかたむきを、小さな葉の向きにまわす
    if layout: layout(seg, leaflet, rng)   # 種ごとの葉のならび（なければ、ばらの複葉）
    else:
      seg((0, 0), (0, .8), .009, stem_c)
      for (y, ang, L) in ((.3, 52, .26), (.55, 44, .28)):
        for sg in (-1, 1): a = math.radians(ang) * sg; b = (math.sin(a) * .03, y + math.cos(a) * .03); seg((0, y), b, .006, stem_c); leaflet(b, a + rng.uniform(-.08, .08), L * rng.uniform(.93, 1.05), .56, rng.uniform(.95, 1.12))   # W：はば÷長さ
      leaflet((0, .68), rng.uniform(-.05, .05), .31, .58, 1.05)
    img = np.dstack([np.clip(col * gain, 0, 255), al * 255]).astype(np.uint8); Image.fromarray(img, 'RGBA').save(path)
    if npath:   # ノーマルマップ（OpenGL・+Y は絵の上）：形の高さのかたむき＋葉脈
        gy, gx = np.gradient(HT, px); nx = -gx * .9 + DX * .4; ny = gy * .9 + DY * .4; nz = np.ones_like(nx); l = np.sqrt(nx ** 2 + ny ** 2 + nz ** 2)
        Image.fromarray((np.dstack([nx / l, ny / l, nz / l]) * 127.5 + 127.5).clip(0, 255).astype(np.uint8), 'RGB').save(npath)


def petal_card_texture(path, npath, src, nsrc, size=1024, seed=5):
    """ばらの花びらの絵（アルファ抜き。持ち主がきめた）：2×2の4とおりの形。1まいの絵のよこ＝花びらのはば（左右 −1〜1）・たて＝つけ根0→先1。
    形：つけ根はすぼみ、先は広く丸い。ふちは、ゆるくなみうつ（ひだ）・先のまん中に小さなくぼみ・ところどころ小さな切れこみ。
    色は白に近い明るさのむら（スキルの petal_rose の絵の明るさ。色は点の色でつける）。ノーマル：ふちのきわで下がる（厚みのふち）・たてのすじ"""
    from PIL import Image
    rng = np.random.default_rng(seed); S = np.asarray(Image.open(src).convert('L').resize((256, 256)), float); S = S / S.mean()
    NS = np.asarray(Image.open(nsrc).convert('RGB').resize((256, 256)), float) / 127.5 - 1
    h2 = size // 2; col = np.zeros((size, size)); al = np.zeros((size, size)); HT = np.zeros((size, size)); DX = np.zeros((size, size)); DY = np.zeros((size, size))
    yy, xx = np.mgrid[0:h2, 0:h2]; q = (xx + .5) / h2 * 2.16 - 1.08; t = 1.04 - (yy + .5) / h2 * 1.08; px = 2.16 / h2   # すきま：絵のはしに、すこしあまりをのこす（ぼかしで、となりの形がまざらない）
    for cell in range(4):
        ph = rng.uniform(0, 6.28, 4); nd = rng.uniform(.04, .08); rf = rng.uniform(.018, .03); nr = rng.integers(2, 4)
        top = .97 - .07 * q ** 4 - nd * np.exp(-((q - rng.uniform(-.06, .06)) / .1) ** 2) + rf * np.sin(q * math.pi * nr + ph[0]) + .012 * np.sin(q * 17 + ph[1])   # 先：丸く・まん中に小さなくぼみ・ひだ
        side = .95 - .02 * np.sin(t * 7 + ph[2]) - .1 * np.clip((.25 - t) / .25, 0, 1) ** 1.5   # 横：ゆるくなみうつ。つけ根は少しすぼむ
        for k in range(rng.integers(1, 3)):   # 小さな切れこみ（ひだのあいだ）
            c0 = rng.uniform(-.7, .7); top = top - .05 * np.exp(-((q - c0) / .035) ** 2)
        d = np.minimum((top - t) / px, (side - np.abs(q)) / px)   # ふちまでのきょり（点。つけ根はのぞく：つけ根は花のまん中につながる）
        a = np.clip(np.minimum(d, (t + .02) / px) + .5, 0, 1); ew = 18.0; hgt = np.sqrt(np.clip(d / ew, 0, 1)) * 1.0   # ふちのきわ ew 点で下がる
        sx = np.clip(((q + 1) / 2 * 255).astype(int), 0, 255); sy = np.clip(((1 - np.clip(t, 0, 1)) * 255).astype(int), 0, 255)
        lum = np.clip(.9 + .25 * (S[sy, sx] - 1) + .06 * np.clip(1 - d / 25, 0, 1), .7, 1.1)   # 明るさのむら・ふちは少し明るい（うすい）
        ns = NS[sy, sx]; cy, cx = divmod(cell, 2); sl = (slice(cy * h2, cy * h2 + h2), slice(cx * h2, cx * h2 + h2))
        col[sl] = lum; al[sl] = a; HT[sl] = hgt; DX[sl] = ns[..., 0]; DY[sl] = ns[..., 1] + .05 * np.sin(q * 40 + ph[3]) * (t > .1)   # たてのすじ
    Image.fromarray(np.dstack([np.repeat((col * 262)[..., None], 3, 2), al * 255]).clip(0, 255).astype(np.uint8), 'RGBA').save(path)
    gy, gx = np.gradient(HT * 6.0); nx = -gx * 1 + DX * .3; ny = gy * 1 + DY * .3; nz = np.ones_like(nx); l = np.sqrt(nx ** 2 + ny ** 2 + nz ** 2)
    Image.fromarray((np.dstack([nx / l, ny / l, nz / l]) * 127.5 + 127.5).clip(0, 255).astype(np.uint8), 'RGB').save(npath)


def sweep(p, pts, radii, cols, lip=None, sides=5, flat=1., up=None, cap=False):
    """線にそったつつ（なめらかな面の向き）。radii・cols は輪ごと。lip：さいごの輪の、上がわ（up の向き）だけ先へのばす長さ。flat：よこのつぶれ"""
    pts = [G(*q) for q in pts]; n = len(pts); V = []; C = []; F = []
    for i in range(n):
        d = unit(pts[min(i + 1, n - 1)] - pts[max(i - 1, 0)]); u0 = unit(up - d * np.dot(up, d)) if up is not None else frame(d)[2]; s0 = unit(np.cross(d, u0))
        for j in range(sides):
            th = 2 * math.pi * j / sides; c, sn = math.cos(th), math.sin(th); off = d * (lip * max(0, sn) ** 1.5 if (lip and i == n - 1) else 0)
            V.append(pts[i] + radii[i] * (s0 * c * flat + u0 * sn) + off); C.append(G(*cols[i]))
    for i in range(n - 1):
        for j in range(sides): a = i * sides + j; b = i * sides + (j + 1) % sides; F += [(a, b, a + sides), (b, b + sides, a + sides)]
    if cap: k = len(V); V.append(pts[-1] + unit(pts[-1] - pts[-2]) * radii[-1] * .6); C.append(G(*cols[-1])); F += [((n - 1) * sides + j, (n - 1) * sides + (j + 1) % sides, k) for j in range(sides)]
    p.add(V, F, C)


def bark_tube(p, pts, radii, col, sides=7, flare=0.):
    """木のくき・枝：線にそった、先へ細くなるつつ（平行にうつすわくで、ねじれない）。木の皮の絵（材質5）を、まわり・長さにそってはる。
    flare：根もとのはり出し（根の5つのふくらみ。半径の割合）"""
    pts = [G(*q) for q in pts]; n = len(pts); V = []; C = []; U = []; F = []; dprev = unit(pts[1] - pts[0]); _, a, b = frame(dprev, (1, 0, 0) if abs(dprev[0]) < .9 else (0, 1, 0)); L = 0.
    for i in range(n):
        d = unit(pts[min(i + 1, n - 1)] - pts[max(i - 1, 0)]); a = unit(a - d * np.dot(a, d)); b = unit(np.cross(d, a))
        if i: L += float(np.linalg.norm(pts[i] - pts[i - 1]))
        for j in range(sides + 1):
            th = 2 * math.pi * j / sides; r = radii[i] * (1 + (flare * max(0, math.cos(5 * th)) ** 2 * max(0, 1 - i / 2.5) if flare else 0) + .06 * math.sin(3 * th + i))
            V.append(pts[i] + r * (a * math.cos(th) + b * math.sin(th))); C.append(G(*col) * (.85 + .15 * (i / (n - 1)))); U.append((L * 1.6, j / sides * 2 * math.pi * radii[i] * 2.4))   # 木の皮の絵（bark001）は、よこに長い割れめなので、90度まわして、割れめが幹にそってたてに走るように
    for i in range(n - 1):
        for j in range(sides): q = i * (sides + 1) + j; F += [(q, q + 1, q + sides + 1), (q + 1, q + sides + 2, q + sides + 1)]
    p.add(V, F, C, np.array(U), mat=5)


def place_card(p, o, d, L, Wd, rng, droop=(.18, .3), fold=(.12, .25), tone=(.74, .92), roll=.5):
    """アルファ抜きの葉のカード（たて5×よこ2・三角形20）を、o から d の向きへ、長さ L・はば Wd でおく。先へたれ・まん中で少し折れ・ねじれる。
    絵のたて（V）0 がつけ根、1 が先。p.card にためる"""
    d = unit(d); rl = rng.uniform(-roll, roll); fo = rng.uniform(*fold); dr = rng.uniform(*droop)
    sd = unit(np.cross(G(0, 0, 1), d) if abs(d[2]) < .95 else np.cross(G(1, 0, 0), d)); upn = unit(np.cross(d, sd)); sd, upn = sd * math.cos(rl) + upn * math.sin(rl), upn * math.cos(rl) - sd * math.sin(rl)
    V = []; UV = []; C = []; tn = rng.uniform(*tone); Fc = []
    for i in range(6):
        t = i / 5; c0 = G(*o) + d * L * t + G(0, 0, -dr * L * t * t)
        for qq in (-1, 0, 1): V.append(c0 + sd * qq * Wd / 2 + upn * fo * abs(qq) * Wd / 2); UV.append(((qq + 1) / 2, t)); C.append(G(255, 255, 255) * tn)
    for i in range(5):
        for j in range(2): a_ = i * 3 + j; b_ = a_ + 3; Fc += [(a_, a_ + 1, b_), (a_ + 1, b_ + 1, b_)]
    p.card.add(V, Fc, C, np.array(UV))


def star_petal_texture(path, npath, size=512, lobes=5, rin=.7, col=((232, 232, 252), (112, 84, 226), (84, 52, 204)), vein=(54, 28, 150), seed=3):
    """5つの先がとがった星の形の花（つけ根でつながった花びら。ききょうなど）の絵：アルファ抜き。まん中（0.5, 0.5）から、半径0.48で先。
    色：まん中は白っぽく→青むらさき→ふちは少しこい。こいすじ（花びらのまん中のすじと、その左右の細いすじ）。ノーマル：ふちのきわが下がる・すじはくぼむ"""
    from PIL import Image
    rng = np.random.default_rng(seed); yy, xx = np.mgrid[0:size, 0:size]; X = (xx + .5) / size - .5; Y = .5 - (yy + .5) / size; r = np.hypot(X, Y); th = np.arctan2(Y, X) + math.pi / 2
    k = (th * lobes / (2 * math.pi)) % 1; saw = np.abs(k * 2 - 1)   # 0 が花びらのまん中・1 が花びらのあいだ
    R = .48 * (rin + (1 - rin) * (1 - saw) ** 1.25) * (1 + .008 * np.sin(th * 23))   # 先がとがる星の形・ふちは少しなみうつ
    px = 1 / size; d = (R - r) / px; a = np.clip(d + .5, 0, 1); t = np.clip(r / .48, 0, 1)
    c = np.array(col[0]) * (1 - np.clip(t / .25, 0, 1))[..., None] + np.array(col[1]) * (np.clip(t / .25, 0, 1) * (1 - np.clip((t - .55) / .45, 0, 1)))[..., None] + np.array(col[2]) * np.clip((t - .55) / .45, 0, 1)[..., None]
    v = np.exp(-(saw / .025) ** 2) + .55 * (np.exp(-((saw - .32) / .02) ** 2) + np.exp(-((saw - .6) / .02) ** 2))   # すじ：まん中と、左右に2本ずつ
    vk = np.clip(v * np.clip((t - .12) / .2, 0, 1), 0, 1) * .75; c = c * (1 - vk[..., None]) + np.array(vein) * vk[..., None]
    Image.fromarray(np.dstack([c, a * 255]).clip(0, 255).astype(np.uint8), 'RGBA').save(path)
    ht = np.sqrt(np.clip(d / 14, 0, 1)) - .25 * v; gy, gx = np.gradient(ht * 4.0); nx = -gx; ny = gy; nz = np.ones_like(nx); l = np.sqrt(nx ** 2 + ny ** 2 + nz ** 2)
    Image.fromarray((np.dstack([nx / l, ny / l, nz / l]) * 127.5 + 127.5).clip(0, 255).astype(np.uint8), 'RGB').save(npath)


def round_leaf_texture(path, npath, size=1024, seed=4):
    """まるい葉（ハス）の絵：2×2の4とおり（持ち主に「機械的すぎ」と言われた）。どれも、ふちの形・すじの本数と間かく・色むらがちがう。
    すじ：まん中から放射状（間かくをゆらす・ところどころ二また）・うすく。まん中は白っぽいまるいしみ。色：白っぽい青緑に、うすいむら（ノイズ）"""
    from PIL import Image
    rng = np.random.default_rng(seed); h2 = size // 2; col = np.zeros((size, size, 3)); al = np.zeros((size, size)); HT = np.zeros((size, size))
    yy, xx = np.mgrid[0:h2, 0:h2]; X = (xx + .5) / h2 * 1.08 - .54; Y = .54 - (yy + .5) / h2 * 1.08; r = np.hypot(X, Y); th = np.arctan2(Y, X); px = 1.08 / h2
    def noise(fx, fy, ph): return np.sin(X * fx + ph) * np.cos(Y * fy - ph * 1.7) + .5 * np.sin((X + Y) * fx * 1.9 + ph * 2.3)
    for cell in range(4):
        ph = rng.uniform(0, 6.28, 8); R = .48 * (1 + .03 * np.sin(th * rng.integers(3, 6) + ph[0]) + .02 * np.sin(th * rng.integers(7, 11) + ph[1]) + .012 * np.sin(th * 17 + ph[2]))   # ふち：ゆるいなみ・本数は葉ごと
        d = (R - r) / px; a = np.clip(d + .5, 0, 1); t = np.clip(r / .48, 0, 1)
        n1 = rng.integers(17, 23); warp = th + .08 * np.sin(r * 9 + ph[3]) + .05 * np.sin(th * 3 + ph[4])   # すじ：本数は葉ごと・少しうねる
        k1 = np.abs(((warp * n1 / (2 * math.pi)) % 1) * 2 - 1); k2 = np.abs(((warp * n1 * 2 / (2 * math.pi) + .5) % 1) * 2 - 1)
        v = np.exp(-((1 - k1) / .05) ** 2) * (t > .06) * (1 - .3 * t) + .45 * np.exp(-((1 - k2) / .04) ** 2) * (t > .45 + .1 * np.sin(th * 5 + ph[5]))
        base = np.array([70., 124, 84]) + np.array([10., 8, 4]) * noise(7, 6, ph[6])[..., None] + np.array([-14., -10, -6]) * t[..., None] ** 1.5   # 白っぽい青緑・うすいむら・ふちは少しこい
        spot = np.exp(-(r / .07) ** 2); base = base * (1 - spot[..., None]) + np.array([170., 196, 150]) * spot[..., None]   # まん中のしみ
        c = base * (1 + .3 * v[..., None])
        cy, cx = divmod(cell, 2); sl = (slice(cy * h2, cy * h2 + h2), slice(cx * h2, cx * h2 + h2)); col[sl] = c; al[sl] = a; HT[sl] = np.sqrt(np.clip(d / 18, 0, 1)) + .2 * v
    Image.fromarray(np.dstack([col, al * 255]).clip(0, 255).astype(np.uint8), 'RGBA').save(path)
    gy, gx = np.gradient(HT * 3.0); nx = -gx; ny = gy; nz = np.ones_like(nx); l = np.sqrt(nx ** 2 + ny ** 2 + nz ** 2)
    Image.fromarray((np.dstack([nx / l, ny / l, nz / l]) * 127.5 + 127.5).clip(0, 255).astype(np.uint8), 'RGB').save(npath)


def rad(az, el):
    """向き：方位 az・あおぎ el（度）"""
    a, e = math.radians(az), math.radians(el); return G(math.cos(a) * math.cos(e), math.sin(a) * math.cos(e), math.sin(e))


def around(axis, az, el):
    """花の軸 axis のまわり：方位 az・軸のほうへ el（度）だけ立った向き"""
    f, s, u = frame(axis, (0, 1, 0) if abs(axis[2]) > .9 else (0, 0, 1)); a, e = math.radians(az), math.radians(el)
    return math.cos(e) * (math.cos(a) * s + math.sin(a) * u) + math.sin(e) * f


# はばの形（t：つけ根0→先1。かえす数：はばの半分の割合）
OBOVATE = lambda t: math.sin(math.pi * t ** 1.5) ** .55          # 先のほうが広い、丸い先（花びら）
OVATE = lambda t: math.sin(math.pi * t ** .7) ** .7              # つけ根のほうが広い（葉）
LANCE = lambda t: math.sin(math.pi * t ** .8) ** .9              # 細長い（葉）
LINEAR = lambda t: min(1, 6 * t, 4 * (1 - t)) ** .6              # 同じはばがつづく（ラベンダーの葉・舌の形の花びら）
SPATULA = lambda t: (.25 + .75 * t ** 1.6) * min(1, 5 * (1 - t)) ** .5   # さじ形（ヒナギクの葉）
ROUND = lambda t: math.sin(math.pi * t ** 1.2) ** .45            # まるい（パンジー・あじさい）
HEART = lambda t: (math.sin(math.pi * t ** .55) ** .6) * (1 - .25 * max(0, .12 - t) / .12)   # ハート形（ひまわり・あさがおの葉）

LEAF = [(52, 128, 40), (128, 196, 70)]      # 葉：つけ根・先（参考の絵の明るい緑）
GLAUC = [(60, 128, 78), (132, 190, 126)]    # 青みのある葉（チューリップ・ゆり）
GREY = [(98, 132, 104), (168, 194, 164)]    # 灰色がかった葉（ラベンダー）


def tulip(p):   # チューリップ：1本のくきに花1つ。花びら6まい（外3・内3）のつぼ。根もとから、はばの広い葉がくきをつつんで立つ
    for s, az in enumerate((20, 150, 265)):
        b = G(*(rad(az, 0) * .07 * (s > 0))); h = .3 * (1.05 if s == 0 else p.rng.uniform(.8, .95)); P, D = p.stem(b, b + G(0, 0, h) + rad(az, 0) * .03, .017, .013, rad(az + 90, 0) * .012)
        top, ax = P(1), D(1)
        for k in range(3): p.blade(top, around(ax, k * 120 + 60, 74), .16, .125, (190, 30, 16), (244, 78, 44), up=ax, profile=OBOVATE, bend=.3, cup=.26, twist=0, ripple=0, thick=.016)
        for k in range(3): p.blade(top - ax * .004, around(ax, k * 120, 68), .17, .135, (200, 36, 16), (248, 92, 50), up=ax, profile=OBOVATE, bend=.26, cup=.26, twist=0, ripple=0, thick=.016)
        for k in range(3 if s == 0 else 2):
            a = az + 40 + k * 137 + p.rng.uniform(-15, 15); p.blade(P(.03 + .05 * k), rad(a, 62 - 8 * k), p.rng.uniform(.24, .3), .1, *GLAUC, profile=LANCE, bend=-.22, cup=.22, twist=p.rng.uniform(-.4, .4), ripple=.02, thick=.012, seg=10)


def sunflower(p):   # ひまわり：太いくき。ハート形でぎざぎざの葉が互いちがいに、葉柄でつく。花は頭の形：茶色のまん中と、黄色い舌の花びら2れつ、うしろに緑のほう
    for s, az in enumerate((80, 200, 320)):
        b = rad(az, 0) * .08 * (s > 0); h = .34 * (1.05 if s == 0 else p.rng.uniform(.75, .92)); P, D = p.stem(b, b + G(0, 0, h) + rad(az, 0) * .05, .022, .016, rad(az + 90, 0) * .01)
        ax = unit(rad(az, 0) * .75 + G(0, 0, .65)); top = P(1)
        p.ball(top + ax * .008, .068, (112, 72, 34), squash=.45, axis=ax, n=12)
        for r in range(2):
            for k in range(13): p.blade(top + ax * .004 * r, around(ax, k * 360 / 13 + r * 14, 6 + 16 * r), .1 - .012 * r, .042, (236, 150, 8), (255, 218, 44), up=ax, profile=LANCE, bend=.05, cup=.18, twist=p.rng.uniform(-.2, .2), ripple=0, thick=.01, seg=6, col=2)
        for k in range(9): p.blade(top - ax * .012, around(ax, k * 40 + 10, -18), .05, .03, *LEAF, up=ax, profile=LANCE, bend=-.2, cup=.1, twist=0, ripple=0, thick=0, seg=4, col=2)
        for k in range(4):
            t = .1 + .2 * k; a = az + k * 137.5; d = rad(a, 28); o = P(t); pe = o + d * .045; p.tube([o, pe], [.008, .006], STEM, 5)
            p.blade(pe, rad(a, 12), p.rng.uniform(.15, .19) * (1 - .12 * k), .14 * (1 - .1 * k), *LEAF, profile=HEART, bend=-.25, cup=.1, twist=p.rng.uniform(-.25, .25), ripple=.03, teeth=5, serration=.1, thick=.012, seg=30, col=2)


def lily(p):   # ゆり（白）：葉は細長く、くきにらせんにたくさんつく。花はろうとの形で外を向き、花びら6まいが外へそる。おしべ6本とめしべ
    for s, az in enumerate((40, 170, 290)):
        b = rad(az, 0) * .07 * (s > 0); h = .33 * (1.05 if s == 0 else p.rng.uniform(.8, .95)); P, D = p.stem(b, b + G(0, 0, h) + rad(az, 0) * .04, .016, .011, rad(az + 90, 0) * .012)
        ax = unit(rad(az, 0) * .8 + G(0, 0, .6)); top = P(1)
        for k in range(6): p.blade(top, around(ax, k * 60, 52 if k % 2 else 44), .2, .075, (236, 240, 214), (255, 255, 255), up=ax, profile=LANCE, bend=-.45, cup=.22, twist=p.rng.uniform(-.15, .15), ripple=.01, thick=.014, seg=10)
        for k in range(6):
            d = around(ax, k * 60 + 30, 72); e = top + d * .11; p.tube([top, top + d * .06, e], [.004, .0035, .003], (214, 226, 170), 4); p.ball(e, .011, (232, 150, 34), squash=1.8, axis=d, n=5, m=3)
        p.tube([top, top + ax * .13], [.005, .004], (206, 222, 160), 4); p.ball(top + ax * .13, .008, (150, 190, 90), n=5, m=3)
        for k in range(9): a = az + k * 137.5; p.blade(P(.06 + .085 * k), rad(a, 38 + 3 * k), p.rng.uniform(.13, .17) * (1 - .05 * k), .028, *GLAUC, profile=LANCE, bend=-.3, cup=.2, twist=p.rng.uniform(-.3, .3), ripple=0, thick=.008, seg=7, col=2)


def hydrangea(p):   # あじさい：木のくき。大きなたまご形でぎざぎざの葉が、2まいずつ向かい合い、節ごとに90度まわる。花は、4まいのがくの小さな花が、まるくあつまる
    for s, az in enumerate((30, 150, 270)):
        b = rad(az, 0) * .05; h = p.rng.uniform(.2, .25); P, D = p.stem(b, b + G(0, 0, h) + rad(az, 0) * .1, .018, .012, rad(az + 90, 0) * .01, color=(120, 130, 70))
        top = P(1); c = top + G(0, 0, .055); R = .1
        for i in range(22):
            u = (i + .5) / 22; th = math.acos(1 - 1.35 * u); ph = i * 2.39996; n = G(math.sin(th) * math.cos(ph), math.sin(th) * math.sin(ph), math.cos(th)); o = c + n * R * G(1, 1, .8)
            p.tube([top + (o - top) * .35, o], [.004, .003], (120, 150, 80), 4); sh = p.rng.uniform(-18, 18)
            for k in range(4): p.blade(o, around(n, k * 90 + i * 31, 12), p.rng.uniform(.04, .05), .046, (106 + sh, 96 + sh, 206), (176 + sh * .5, 170 + sh * .5, 244), up=n, profile=ROUND, bend=.08, cup=.12, twist=0, ripple=0, thick=0, seg=4, col=2)
            p.ball(o + n * .004, .006, (196, 190, 240), n=5, m=2)
        for i in range(3):
            for k in range(2):
                a = az + 90 * i + 180 * k + p.rng.uniform(-10, 10); o = P(.2 + .27 * i); d = rad(a, 30); pe = o + d * .03; p.tube([o, pe], [.007, .005], STEM, 5)
                p.blade(pe, rad(a, 14), p.rng.uniform(.17, .21), .13, *LEAF, profile=OVATE, bend=-.28, cup=.16, twist=p.rng.uniform(-.25, .25), ripple=.03, teeth=6, serration=.09, thick=.012, seg=36, col=2)


def glory(p):   # あさがお：つるの草（絵は、こんもりした株）。ハート形の葉が葉柄で互いちがいにつく。花は、5まいがつながった、ろうとの形。ふちは青、のどは白、5本の白いすじ（星）
    for s, az in enumerate((10, 130, 250)):
        b = rad(az, 0) * .05; h = p.rng.uniform(.2, .26); P, D = p.stem(b, b + G(0, 0, h) + rad(az, 0) * .1, .012, .009, rad(az + 90, 0) * .03)
        ax = unit(rad(az, 0) * .7 + G(0, 0, .7)); top = P(1); f, sx, ux = frame(ax, (0, 0, 1)); V = []; F = []; C = []; N = 20; Rr = 8
        for i in range(Rr + 1):   # ろうと：のどは細く、ふちへ大きくひらく。ふちは5つのゆるい山
            t = i / Rr; r = .012 + .095 * t ** 2.2; z = .11 * t ** .55
            for j in range(N):
                ph = 2 * math.pi * j / N; w = .5 + .5 * math.cos(5 * ph); rr = r * (1 + .06 * t * (1 - w)); V.append(top + rr * (math.cos(ph) * sx + math.sin(ph) * ux) + z * f)
                star = max(0, w) ** 6; C.append(G(250, 250, 244) * (1 - t ** 1.5) * 1 + (G(52, 86, 220) * (1 - star * .75) + G(240, 240, 255) * star * .75) * t ** 1.5)
        for i in range(Rr):
            for j in range(N): a = i * N + j; bq = i * N + (j + 1) % N; F += [(a, bq, a + N), (bq, bq + N, a + N)]
        V = np.array(V); F = np.array(F); C = np.array(C); p.add(np.vstack([V, V]), np.vstack([F, F[:, ::-1] + len(V)]), np.vstack([C, C * .8]))   # うら面も入れる
        p.ball(top + ax * .03, .008, (246, 232, 150), n=5, m=2)
        for k in range(5): p.blade(top, around(ax, k * 72, -30), .035, .014, *LEAF, up=ax, profile=LANCE, bend=0, cup=.1, twist=0, ripple=0, thick=0, seg=4, col=2)   # がく
        for k in range(4):
            a = az + 60 + k * 137.5; o = P(.1 + .22 * k); d = rad(a, 32); pe = o + d * .05; p.tube([o, pe], [.006, .004], STEM, 4)
            p.blade(pe, rad(a, 10), p.rng.uniform(.13, .16), .13, *LEAF, profile=HEART, bend=-.3, cup=.12, twist=p.rng.uniform(-.2, .2), ripple=.02, thick=.012, seg=9, col=4)


def cosmos(p):   # コスモス：細く枝わかれするくき。葉は向かい合い、糸のように細くさける。花は頭の形：先のほうが広い花びら8まいと、黄色いまん中
    def feather(o, a, el, L):
        d = rad(a, el); pts = [o + d * L * t + G(0, 0, -.25 * L * t * t) for t in (0, .35, .7, 1)]; p.tube(pts, [.005, .004, .003, .002], LEAF[0], 4)
        for j in range(1, 5):
            for sg in (-1, 1): q = pts[0] + (pts[-1] - pts[0]) * (j / 5); dd = unit(d + rad(a + sg * 62, el) * 1.2); l2 = L * (.4 - .05 * j); p.tube([q, q + dd * l2], [.003, .0015], LEAF[1] if j > 2 else LEAF[0], 3)
    for s, az in enumerate((50, 140, 230, 320)):
        b = rad(az, 0) * .06 * (s > 0); h = .34 * (1.05 if s == 0 else p.rng.uniform(.72, .95)); P, D = p.stem(b, b + G(0, 0, h) + rad(az, 0) * .05, .011, .007, rad(az + 90, 0) * .02)
        ax = unit(rad(az, 0) * .45 + G(0, 0, .9)); top = P(1); p.ball(top + ax * .006, .026, (246, 190, 30), squash=.6, axis=ax, n=8)
        for k in range(8): p.blade(top, around(ax, k * 45 + p.rng.uniform(-4, 4), 10 + p.rng.uniform(-4, 6)), .105, .07, (214, 70, 146), (255, 150, 200), up=ax, profile=OBOVATE, bend=.06, cup=.14, twist=p.rng.uniform(-.2, .2), ripple=.03, teeth=3, serration=.25, thick=.01, seg=18, col=2)
        for k in range(8): p.blade(top - ax * .006, around(ax, k * 45 + 22, -25), .03, .012, *LEAF, up=ax, profile=LANCE, bend=0, cup=.1, twist=0, ripple=0, thick=0, seg=4, col=2)
        for i in range(3):
            for k in range(2): feather(P(.12 + .2 * i), az + 90 * i + 180 * k + p.rng.uniform(-12, 12), 30, p.rng.uniform(.11, .15))


def lavender(p):   # ラベンダー：小さな木。灰色がかった細い葉が向かい合い、下のほうにつく。葉のない細いくきの先に、むらさきの小さな花の輪が何だんもかさなった穂
    for s in range(7):
        az = s * 137.5; b = rad(az, 0) * .03 * (s > 0); h = p.rng.uniform(.3, .42); P, D = p.stem(b, b + G(0, 0, h) + rad(az, 0) * p.rng.uniform(.04, .13), .009, .005, rad(az + 90, 0) * .01, color=(112, 150, 96))
        for w in range(6):   # 花の輪
            t = 1 - .06 * w; o = P(t); ax = D(t)
            for k in range(5): d = around(ax, k * 72 + w * 36, 35); p.ball(o + d * .014, .011 - .0006 * w, (92, 64, 176) if (k + w) % 3 else (150, 120, 232), squash=1.5, axis=d, n=5, m=2)
        for i in range(4):
            for k in range(2): a = az + 90 * i + 180 * k + p.rng.uniform(-12, 12); p.blade(P(.06 + .1 * i), rad(a, 50), p.rng.uniform(.09, .12), .016, *GREY, profile=LINEAR, bend=-.2, cup=.04, twist=0, ripple=0, thick=.006, seg=6, col=2)


def daisy(p):   # ヒナギク：さじ形の葉が、根もとに地面にそってひろがる（ロゼット）。葉のないくきに花1つ。白い舌の花びら2れつと、黄色いまん中
    for i in range(12): a = i * 137.5; p.blade(rad(a, 0) * .01, rad(a, 14 + 22 * (i / 12)), p.rng.uniform(.13, .17), .075, *LEAF, profile=SPATULA, bend=-.12, cup=.14, twist=p.rng.uniform(-.2, .2), ripple=.03, thick=.012, seg=10, col=4)
    for s in range(4):
        az = s * 90 + 20; b = rad(az, 0) * .03; h = p.rng.uniform(.17, .25); P, D = p.stem(b, b + G(0, 0, h) + rad(az, 0) * p.rng.uniform(.04, .1), .009, .007, rad(az + 90, 0) * .01)
        ax = unit(rad(az, 0) * .4 + G(0, 0, .9)); top = P(1); p.ball(top + ax * .007, .034, (248, 198, 34), squash=.6, axis=ax, n=9)
        for r in range(2):
            for k in range(13): p.blade(top + ax * .004 * r, around(ax, k * 360 / 13 + r * 14, 4 + 14 * r), .078 - .01 * r, .026, (236, 236, 226), (255, 255, 255), up=ax, profile=LINEAR, bend=.05, cup=.2, twist=0, ripple=0, thick=.008, seg=5, col=2)
        for k in range(10): p.blade(top - ax * .008, around(ax, k * 36, -20), .028, .014, *LEAF, up=ax, profile=LANCE, bend=0, cup=.1, twist=0, ripple=0, thick=0, seg=4, col=2)


def pansy(p):   # パンジー：せの低い株。たまご形でふちが丸くなみうつ葉。花は顔のように横を向く：上2まい・横2まい・下1まい。まん中に、こいもよう
    for i in range(10): a = i * 137.5; o = rad(a, 0) * .02; d = rad(a, 40); pe = o + d * .07; p.tube([o + G(0, 0, .005), pe], [.006, .004], STEM, 4); p.blade(pe, rad(a, 18), p.rng.uniform(.1, .13), .085, *LEAF, profile=OVATE, bend=-.25, cup=.14, twist=p.rng.uniform(-.2, .2), ripple=.04, teeth=4, serration=.05, thick=.012, seg=24, col=2)
    for s in range(4):
        az = s * 90 + 35; b = rad(az, 0) * .03; h = p.rng.uniform(.16, .21); P, D = p.stem(b, b + G(0, 0, h) + rad(az, 0) * .09, .008, .006, rad(az, 0) * .03)
        ax = unit(rad(az, 0) * .9 + G(0, 0, .45)); top = P(1); f, sx, ux = frame(ax, (0, 0, 1)); alt = s % 2
        U1, U2 = ((120, 40, 190), (150, 80, 220)) if not alt else ((236, 160, 20), (255, 214, 60)); L1, L2 = ((30, 8, 56), (252, 208, 52)) if not alt else ((80, 20, 10), (255, 222, 72))
        pet = lambda ang, el, ln, w, ca, cb, off=0: p.blade(top + ax * off, math.cos(math.radians(el)) * (math.cos(math.radians(ang)) * sx + math.sin(math.radians(ang)) * ux) + math.sin(math.radians(el)) * f, ln, w, ca, cb, up=ax, profile=ROUND, bend=.06, cup=.12, twist=0, ripple=.03, thick=.012, seg=8, col=4)
        pet(65, 8, .085, .1, U1, U2); pet(115, 8, .085, .1, U1, U2); pet(10, 12, .08, .095, L1, L2, .004); pet(170, 12, .08, .095, L1, L2, .004); pet(270, 14, .085, .12, L1, L2, .008)
        p.ball(top + ax * .012, .009, (250, 210, 60), n=5, m=2)


def rose(p):
    """ばら（園芸のばら。品種はきめていない仮の物）。スキル v8：花びらは rose_plant_v8.petal（つけ根はすぼみ、ふちは広く丸い。外の段はひらいてそり、内の段はじくへまきこむ）と、
    まん中をおおう、折りこんだ花びら（真上から、くき・がくの緑が見えないように。玉でかくさない）。段ごとに曲がり方とひらきをかえ、となりの花びらと半径をずらして重ねる。
    もとは v6・v7：花びらは、花のじくのまわりにまきつく曲面（rose_curved.rose_petal）。外は広くひらいて先がそり、内ほど小さく立ってまきこむ。
    見た物：スキルの絵（plant-atlas の Rose 3つ。AIの絵なので、実物のたしかめにはならない）＝おわんの形の花・細く枝わかれするくき・こい緑のたまご形の小さな葉がたくさん・わきの枝につぼみ。
    骨格：細い木のくき（先へ細く、しなる）から、わきの枝。葉：小さな葉5まいの複葉が互いちがい。花：がく5まい"""
    rng = p.rng; K = 2.0   # スキルの試作（メートル）→ マス：花のはば 約0.16マス
    def bloom(top, ax, open_, size):
        """open_：1 ひらいた花・0 つぼみ。層：(まい数, 半径, 高さ, まきつく角度, ひらき)。
        花びらは少なく（ひらいた花 17まい・つぼみ 5まい）・あらく（たて7×よこ6）。1まいの面に、ふちだけ厚み（持ち主がきめた）"""
        f, sx, ux = frame(ax, (0, 1, 0) if abs(ax[2]) > .9 else (0, 0, 1)); place = lambda v: top + v[:, :1] * sx + v[:, 1:2] * ux + v[:, 2:3] * f
        tiers = [(5, .044, .034, 1.85, .55), (5, .034, .04, 1.7, .32), (4, .023, .044, 2.0, .12), (3, .012, .045, 2.6, 0)]   # 外の段はひらきすぎない：深いおわん
        if open_ < .5: tiers = [(3, .015, .046, 2.6, 0), (2, .008, .046, 3.0, 0)]   # つぼみ
        hue = rng.uniform(-1, 1); RW, CL = 7, 6   # 花ごとの色のちがい・花びらのこまかさ
        for k, (n, r, h, span, op) in enumerate(tiers):
            for i in range(n):
                a = 2 * math.pi * i / n + k * 2.39996 + rng.uniform(-.09, .09); inner = k >= len(tiers) - 1
                m = v8_petal(a, r * rng.uniform(.95, 1.05) * (1 + .05 * (i % 2)), h * rng.uniform(.94, 1.06), span, op * open_, rng.uniform(0, 6.283), inner, rows=RW, cols=CL)
                v = np.asarray(m.vertices) * K * size * [1, 1, 1.25]; uv = np.asarray(m.visual.uv); t = uv[:, 1:2]; q = uv[:, 0:1]; u = 1 - k / (len(tiers) - 1 or 1)   # u：1 外がわ・0 まん中
                if k == 0 and open_ > .5:   # 外がわの段だけ、花びらの先を外へそり返す（持ち主がきめた）：先ほど、花のじくから外へ出て、下へまがる
                    rr = np.hypot(v[:, 0], v[:, 1])[:, None] + 1e-9; s3 = np.clip((t - REFLEX[0]) / (1 - REFLEX[0]), 0, 1) ** 2
                    v = v + np.hstack([v[:, :1] / rr, v[:, 1:2] / rr, np.zeros_like(rr)]) * s3 * REFLEX[1] * r * K * size + np.hstack([np.zeros_like(rr), np.zeros_like(rr), -s3 * REFLEX[2] * h * K * size])
                tip = G(246, 140 + 10 * hue, 170 - 8 * hue) * u + G(226, 82 + 8 * hue, 122 - 6 * hue) * (1 - u); base = G(176, 34, 74 - 6 * hue)
                c = (base * (1 - t ** .7) + tip * t ** .7) * (.8 + .2 * u) * (1 - .1 * (1 - np.abs(2 * q - 1)) * (1 - t))
                cell = int(rng.integers(0, 4)); cy, cx = divmod(cell, 2)   # 4とおりの形から1つ（絵の 2×2 のます。cy 0 が絵の上）
                auv = np.hstack([(cx + (2 * q + .08) / 2.16) / 2, ((1 - cy) + (t + .04) / 1.08) / 2])
                p.pcard.add(place(v), m.faces, c, auv)   # 花びら：アルファ抜きの絵で、ふちをこまかい形にくりぬく（持ち主がきめた）。厚みはノーマルマップのふち
        vv = []; ff = []; cc = []   # まん中の、折りこんだ花びら（スキル v8）：じくをまたいで、まん中の穴を上からおおう
        for i in range(7):
            t = i / 6
            for j in range(5):
                q = 2 * j / 4 - 1; w = .00055 + .0039 * math.sin(math.pi * .74 * t) ** .8
                vv.append((.0027 * math.cos(math.pi * 1.15 * t) + q * w * .28, q * w, .010 + .032 * t - .003 * q * q * t ** 3 + .0018 * math.sin(math.pi * t) * q)); cc.append(G(170, 30, 70) * (1 - t) + G(214, 70, 112) * t)
        for i in range(6):
            for j in range(4): a_ = i * 5 + j; b_ = a_ + 5; ff += [(a_, b_, a_ + 1), (a_ + 1, b_, b_ + 1)]
        p.add(place(np.array(vv) * K * size * [1, 1, 1.25]), ff, cc)
        for k in range(5): p.blade(top - ax * .002 * size, around(ax, k * 72 + 20 + rng.uniform(-10, 10), -40 + 70 * (1 - open_)), .05 * size * K, .015 * size * K, (50, 104, 42), (94, 150, 64), up=ax, profile=LANCE, bend=-.2, cup=.035, twist=.15, ripple=0, thick=0, seg=5, col=2)   # がく
    def leafs(o, a):
        """複葉：アルファ抜きのカード1まい（葉柄・じく・小さな葉5まいは絵。持ち主がきめた）。カードは、じくにそってたれ、まん中のすじで少し折れる。
        たて5×よこ2のこまかさ（三角形20）。向き・たれぐあい・ねじれは1まいずつかえる"""
        L = rng.uniform(.19, .24); place_card(p, o, rad(a, 30 + rng.uniform(-12, 10)), L, L * .75, rng)
    def cane(base, az, h, lean, r0):
        return p.stem(base, G(*base) + G(0, 0, h) + rad(az, 0) * lean, r0, r0 * .45, rad(az + 90, 0) * .03 + rad(az, 0) * .025, color=(76, 118, 52), n=8)   # くきは、先へ細く・ゆるくまがる
    for s_, (az, h, lean) in enumerate(((70, .36, .05), (200, .29, .1))):   # 根もとから2本のくき。それぞれの先に、ひらいた花
        b = rad(az, 0) * .03; P, D = cane(b, az, h, lean, .0085); bloom(P(1), unit(D(1) * .5 + unit(rad(az, 0) * .45 + G(0, 0, .9)) * .5), 1 - .2 * s_, 1 - .12 * s_)
        for k in range(6): leafs(P(.1 + .14 * k), az + 50 + k * 137.5 + rng.uniform(-15, 15))   # 葉はカードなので軽い：数をふやす
        for k in range(3): t = .15 + .25 * k; a = az + 20 + k * 150; o = P(t); d = rad(a, -15); p.tube([o, o + d * .015 + G(0, 0, -.003)], [.0035, .0005], (150, 84, 62), 3)   # とげ
        t = .5 + .1 * s_; o = P(t); a = az + (115 if s_ == 0 else -100); hb = .13 + .03 * s_; P2, D2 = p.stem(o, o + rad(a, 52) * hb, .005, .003, G(0, 0, .012), color=(84, 128, 56), n=4)   # わきの枝に、つぼみ
        bloom(P2(1), D2(1), .1, .62); leafs(P2(.35), a + 100); leafs(P2(.6), a - 120)


def salvia(p):
    """サルビア（Salvia splendens）。本物の写真（NC State Extension の写真4まい・plantasyhongos の接写1まい）を見て、構造を書き出してから作った（持ち主がきめた）：
    株：はばの広いたまご形の明るい緑の葉（ぎざぎざ）が、向かい合って（十字対生）こんもりした茂みになる。花の穂は葉のすぐ上から立ち、緑のはだかのくきは見えない。
    穂：じくは赤い。節ごとに、花が2つ向かい合ってつき、節ごとに90度まわる。花は、ふくらんだ赤い鐘のがく（ななめ上を向く・花が落ちてもがくはのこる）と、
    がくからつき出る長いつつの花（外へ出てから、先が少し下へまがる。上の唇がかぶさる）。穂の先は、つぼみがかたまって、とがる。下の花ほど長く、上ほど短い（三角の穂）"""
    rng = p.rng; SC = (232, 30, 26); SCD = (176, 14, 20); COR = (244, 52, 32); IN = (90, 8, 12)
    def sweep(pts, radii, cols, lip=None, sides=5, flat=1., up=None, cap=False):
        """線にそったつつ（なめらかな面の向き）。radii・cols は輪ごと。lip：さいごの輪の、上がわ（up の向き）だけ先へのばす長さ。flat：よこのつぶれ（1でまるい）"""
        pts = [G(*q) for q in pts]; n = len(pts); V = []; C = []; F = []
        for i in range(n):
            d = unit(pts[min(i + 1, n - 1)] - pts[max(i - 1, 0)]); u0 = unit(up - d * np.dot(up, d)) if up is not None else frame(d)[2]; s0 = unit(np.cross(d, u0))
            for j in range(sides):
                th = 2 * math.pi * j / sides; c, sn = math.cos(th), math.sin(th); off = d * (lip * max(0, sn) ** 1.5 if (lip and i == n - 1) else 0)
                V.append(pts[i] + radii[i] * (s0 * c * flat + u0 * sn) + off); C.append(G(*cols[i]))
        for i in range(n - 1):
            for j in range(sides): a = i * sides + j; b = i * sides + (j + 1) % sides; F += [(a, b, a + sides), (b, b + sides, a + sides)]
        if cap: k = len(V); V.append(pts[-1] + unit(pts[-1] - pts[-2]) * radii[-1] * .6); C.append(G(*cols[-1])); F += [((n - 1) * sides + j, (n - 1) * sides + (j + 1) % sides, k) for j in range(sides)]
        p.add(V, F, C)
    def flower(o, d, up, size, stage):
        """1つの花：stage 0 つぼみ・1 がくだけ（花が落ちた）・2 ひらいた花。o：節・d：外への向き・up：穂のじくの向き"""
        cdir = unit(d * .62 + up * .78) if stage else unit(d * .35 + up * .94)   # がくは、ななめ上を向く（つぼみは、ほぼ上）
        L = .03 * size; R = .0145 * size   # がくは、ふっくら（長さとはばが近い）
        if stage == 0:
            sweep([o, o + cdir * L * .5, o + cdir * L], [R * .35, R * .7, R * .3], [SCD, SC, SC], cap=True); return
        tip = o + cdir * L
        sweep([o, o + cdir * L * .3, o + cdir * L * .7, tip], [R * .3, R * .8, R, R * .95], [SCD, SCD, SC, SC], lip=L * .35, up=up)   # がく：ふくらんだ鐘・上の唇が少し長い
        if stage == 2:   # 花：がくの口から外へ出て、先が少し下へまがる。上の唇がかぶさる
            ex = unit(d * .75 + up * .66); dn = unit(d * .95 - up * .15); C0 = o + cdir * L * .55; C1 = C0 + ex * .024 * size; C2 = C1 + unit(ex + dn) * .018 * size; C3 = C2 + dn * .012 * size
            rr = .0085 * size; sweep([C0, C1, C2, C3], [rr * .9, rr, rr * .95, rr * .7], [COR, COR, COR, COR], lip=.01 * size, up=up, flat=.8, cap=False)
            sweep([C3 - dn * .002, C3 + dn * .002], [rr * .45, rr * .2], [IN, IN], cap=True)   # 口の中（暗い）
    def spike(base, ax, nodes, length):
        """穂：赤いじく。節ごとに花2つ（向かい合い）・節ごとに90度まわる。下ほど大きくひらいた花、上ほどつぼみ。花が落ちてがくだけのものもまじる"""
        P, D = p.stem(base, G(*base) + ax * length, .0055, .0025, G(0, 0, 0), color=SCD, n=3)
        az0 = rng.uniform(0, 360)
        for i in range(nodes):
            u = i / (nodes - 1); t = .03 + .9 * u; o = P(t); up = D(t); size = 1.15 - .45 * u
            stage = 0 if u > .72 else 2 if rng.random() < .78 else 1
            for k in (0, 180): flower(o, around(up, az0 + 90 * i + k + rng.uniform(-10, 10), 0), up, size * rng.uniform(.92, 1.06), stage)
        for k in range(3): flower(P(1), around(D(1), az0 + k * 120, 0), D(1), .5, 0)   # 先のつぼみのかたまり
    leaf = lambda o, a, el, L: place_card(p, o, rad(a, el), L, L * .86, rng, droop=(.15, .3), fold=(.15, .28), tone=(.95, 1.12), roll=.35)
    shoots = ((0, .2, .05, .03), (100, .17, .17, .02), (220, .16, .18, .025), (330, .15, .16, .02))   # 枝：方位・葉の茂みの高さ・根もとのずれ（マスいっぱいに広げる。となりの株とつながる）・かたむき
    for s_, (az, hv, off, lean) in enumerate(shoots):
        b = rad(az, 0) * off; top = b + G(0, 0, hv) + rad(az, 0) * lean * 2; P, D = p.stem(b, top, .007, .006, G(0, 0, 0), color=(74, 124, 52), n=3)
        for n_ in range(4):   # 葉：十字対生で、下ほど大きく・ねる。上の葉は穂の根もとをかこむ
            t = .15 + .27 * n_; L = (.19 - .025 * n_) * rng.uniform(.92, 1.08)
            for k in (0, 180): leaf(P(t), az + 90 * n_ + k + rng.uniform(-14, 14), 18 + 10 * n_, L)
        spike(P(1), unit(D(1) * .8 + G(0, 0, .5)), 9 if s_ == 0 else 8, .24 if s_ == 0 else .2 * rng.uniform(.9, 1.05))
    for k in range(7): leaf(rad(k * 51 + 30, 0) * .1, k * 51 + 30 + rng.uniform(-10, 10), 8, .2 * rng.uniform(.9, 1.05))   # 根もとの大きな葉
    for k in range(4):   # 花のない、わきの短い枝（葉だけ）：茂みをこんもりさせる
        az = 50 + k * 90 + rng.uniform(-15, 15); b = rad(az, 0) * .2; P, D = p.stem(b, b + G(0, 0, .12) + rad(az, 0) * .06, .005, .004, G(0, 0, 0), color=(74, 124, 52), n=2)
        for n_ in range(2):
            for kk in (0, 180): leaf(P(.4 + .5 * n_), az + 90 * n_ + kk + rng.uniform(-14, 14), 22 + 10 * n_, .17 * rng.uniform(.9, 1.05))


def clover(p):
    """シロツメクサ（Trifolium repens）。本物の写真（NC State Extension の6まい）を見て、構造を書き出してから作った：
    株：地面をはうくきから、長い葉柄がたくさん立ち、葉がじゅうたんのようにしきつめられる。葉：三つ葉が、上を向いてほぼ水平にひらく
    （小さな葉は、先が広いまるい形・先が少しくぼむ・こまかいぎざぎざ・まん中に白っぽいV字のもよう）。
    花：葉のない花のくきが葉より高くのび、先にまるい花のかたまり。小さな白い花があつまって外を向く。上はつぼみで緑がかり、下の古い花は下へたれて、うすいピンクや茶色になる"""
    rng = p.rng; STEMC = (112, 150, 86)
    for k in range(4):   # はうくき（地面の上の、ひくいつる）
        a = k * 90 + rng.uniform(-20, 20); pts = [rad(a, 0) * r + G(0, 0, .004) for r in (0, .1, .2)]; sweep(p, pts, [.004, .0035, .003], [STEMC] * 3, sides=4)   # 葉の下にかくれる
    for i in range(30):   # 三つ葉：長い葉柄の先に、水平な三つ葉のカード（カードのまん中が、葉柄の先）
        a = i * 137.5 + rng.uniform(-15, 15); r = .02 + .23 * math.sqrt((i + .5) / 30); b = rad(a, 0) * r; h = rng.uniform(.05, .13) * (1.15 - .45 * r / .19)
        top = b + rad(a + rng.uniform(-40, 40), 0) * .02 + G(0, 0, h); sweep(p, [b, (b + top) / 2 + rad(a, 0) * .008, top], [.0035, .003, .0026], [STEMC] * 3, sides=4)
        d = rad(rng.uniform(0, 360), rng.uniform(-6, 6)); L = rng.uniform(.17, .21); place_card(p, top - d * L * .5, d, L, L * .75, rng, droop=(0, .04), fold=(.0, .06), tone=(.9, 1.08), roll=.15)
    for f in range(3):   # 花：葉のない花のくき（葉より高い）＋まるい花のかたまり
        a = f * 120 + rng.uniform(-30, 30); b = rad(a, 0) * rng.uniform(.06, .2); h = rng.uniform(.18, .23); top = b + rad(a, 0) * .02 + G(0, 0, h)
        sweep(p, [b, (b + top) / 2 + rad(a + 90, 0) * .01, top], [.004, .0035, .003], [STEMC] * 3, sides=4)
        R = .028; c = top + G(0, 0, R * .75); p.ball(c, R * .45, (150, 170, 110), n=6, m=3)   # まん中のしん
        for i in range(44):   # 小さな花：らせんにならべる。上（z>0）はつぼみ・外を向く。下ほど、下へたれて色がかわる
            u = (i + .5) / 44; z = 1 - 1.7 * u; z = max(-.75, z); ph = i * 2.39996; rr = math.sqrt(1 - z * z); n = G(math.cos(ph) * rr, math.sin(ph) * rr, z)
            old = z < -.2; base = c + n * R * .45
            dn = unit(n + G(0, 0, -.9 if old else 0)); L = R * (.9 if not old else 1.0) * rng.uniform(.9, 1.1)
            col0 = (176, 196, 150) if z > .6 else (246, 244, 236) if not old else (226, 200, 196)
            col1 = (206, 220, 180) if z > .6 else (255, 255, 252) if not old else (204, 176, 160)
            sweep(p, [base, base + dn * L * .55, base + dn * L], [.0035, .0042, .0028], [col0, col1, col1], sides=4, cap=True)


def bellf(p):
    """ききょう（Platycodon grandiflorus）。本物の写真（NC State Extension の7まい）を見て、構造を書き出してから作った：
    株：まっすぐなくきが何本か立つ。葉は、たまご形〜細長くぎざぎざ、柄がなく、くきに互いちがい。上ほど小さい。
    花：くきの先。5まいの花びらがつけ根でつながった浅いおわん。先は5つのとがった星の形にひらき、ななめ上〜外を向く。
    色：青むらさきにこいすじ。まん中は白っぽく、白いおしべと5つにわかれためしべ。つぼみ：紙ふうせんのようにふくらんだ5角の形（うすい色）"""
    rng = p.rng; STEMC = (96, 140, 70)
    def flower(o, ax, D_):
        """花：浅いおわんの面（4だん×20）に、星の形の絵（アルファ抜き）をはる。D_：花のはば"""
        f, sx, ux = frame(ax, (0, 0, 1) if abs(ax[2]) < .95 else (1, 0, 0)); rot = rng.uniform(0, 6.283); V = []; UV = []; C = []; F = []; NR, NA = 4, 20
        V.append(o + f * .002); UV.append((.5, .5)); C.append(G(255, 255, 255))
        for i in range(1, NR + 1):
            rr = i / NR; z = .32 * D_ * rr ** 1.6   # 浅いおわん：外ほど上がる
            for j in range(NA):
                a = 2 * math.pi * j / NA + rot; V.append(o + (sx * math.cos(a) + ux * math.sin(a)) * rr * D_ / 2 + f * z); UV.append((.5 + .5 * rr * math.cos(a - rot) * 1.04, .5 + .5 * rr * math.sin(a - rot) * 1.04)); C.append(G(255, 255, 255))
        for j in range(NA): F.append((0, 1 + j, 1 + (j + 1) % NA))
        for i in range(NR - 1):
            for j in range(NA): a_ = 1 + i * NA + j; b_ = 1 + i * NA + (j + 1) % NA; F += [(a_, a_ + NA, b_), (b_, a_ + NA, b_ + NA)]
        p.pcard.add(V, F, C, np.array(UV))
        sweep(p, [o, o + f * .03], [.005, .003], [(240, 240, 236), (240, 240, 236)], sides=5)   # おしべとめしべ（白いしん）
        for k in range(5): q = o + f * .03; dd = unit(f + (sx * math.cos(k * 1.2566) + ux * math.sin(k * 1.2566)) * 1.2); sweep(p, [q, q + dd * .011], [.0024, .001], [(236, 236, 246)] * 2, sides=3)   # めしべの先（5つにわかれる）
        sweep(p, [o - f * .012, o - f * .002], [.003, .007], [(84, 128, 60), (98, 140, 70)], sides=5)   # 花の下のふくらみ（がく）
    def bud(o, ax, s_):
        """つぼみ：5角の紙ふうせん"""
        sweep(p, [o, o + ax * .012 * s_, o + ax * .026 * s_, o + ax * .036 * s_], [.005 * s_, .014 * s_, .013 * s_, .002 * s_], [(130, 160, 100), (176, 168, 230), (184, 172, 236), (160, 146, 226)], sides=5, cap=True)
    for s_, (az, h, lean) in enumerate(((0, .4, .1), (110, .34, .14), (230, .36, .13), (300, .27, .12), (170, .24, .12))):
        b = rad(az, 0) * (.04 if not s_ else rng.uniform(.12, .2)); out = rad(az, 0); sg = lean * 2.2 * (h / .4) * rng.uniform(.85, 1.15)   # しなり：先の、外へのずれ（くきの長さの割合）。長いくきほど、よくしなる
        P = lambda t, b=b, h=h, out=out, sg=sg: b + out * h * sg * t * t * (3 - t) / 2 + G(0, 0, h * (t - .5 * sg * sg * t ** 3))   # 重力でしなる：根もとはまっすぐ立ち、先の花の重さで、上ほど外へまがる（はりの曲がりの形）。長さが同じになるよう、高さを少し下げる
        D = lambda t, P=P: unit(P(min(1, t + .02)) - P(max(0, t - .02)))
        sweep(p, [P(i / 10) for i in range(11)], [.0055 - .002 * i / 10 for i in range(11)], [(84, 124, 60)] + [STEMC] * 10, sides=5)
        for k in range(9):   # 葉：柄のない葉が、互いちがいに（137.5度ずつ）。上ほど小さく・立つ
            t = .06 + .095 * k; L = (.13 - .009 * k) * rng.uniform(.9, 1.08); place_card(p, P(t), rad(az + k * 137.5 + rng.uniform(-15, 15), 26 + 4 * k), L, L * .62, rng, droop=(.12, .25), fold=(.15, .3), tone=(.9, 1.05), roll=.3)
        ax = unit(D(1) * .5 + unit(rad(az, 0) * .7 + G(0, 0, .7)) * .5)
        if s_ < 3: flower(P(1), ax, rng.uniform(.15, .17))   # 花は大きい（株の高さの4分の1くらい）
        else: bud(P(1), D(1), 1.2)
        if s_ < 2: b2 = P(.82); bud(b2 + rad(az + 140, 30) * .01, unit(rad(az + 140, 0) * .4 + G(0, 0, 1)), .9)   # わきのつぼみ


def glily(p):
    """ゆり（白。テッポウユリ Lilium longiflorum）。本物の写真（NC State Extension の3まい）を見て、構造を書き出してから作った：
    株：じょうぶなくきが1本ずつまっすぐ立つ。細長い葉が、くきのまわりにらせんにぎっしり、ななめ上を向いて先が少したれる。
    花：くきの先に、横〜少し下を向く長いらっぱ。つけ根は細いつつ（少し緑がかる）・先は6まいの花びらにひらき、先は外へそり返る。
    花の中：おしべ6本（先に黄色〜オレンジの花粉のふくろ）と、より長いめしべ（先が緑がかる）。つぼみ：細長いこん棒の形・緑がかった白・ななめ上"""
    rng = p.rng; STEMC = (70, 112, 56); WH0 = (196, 214, 170); WH1 = (250, 250, 244)
    def trumpet(o, d, L):
        """らっぱ：o（花の柄の先）から d の向きへ、長さ L"""
        up = G(0, 0, 1); sd = unit(np.cross(d, up)) if abs(d[2]) < .95 else G(1, 0, 0); uv_ = unit(np.cross(sd, d))
        tube_end = o + d * L * .5; sweep(p, [o, o + d * L * .18, o + d * L * .36, tube_end], [L * .05, L * .07, L * .1, L * .15], [(150, 180, 110), WH0, (232, 238, 220), WH1], sides=6)   # 細いつつ（つけ根は緑がかる）
        for k in range(6):   # 花びら：外3まい・内3まい（少しずらす）。つつの口から外へひらき、先は外へそり返る
            a = k * 60 + (0 if k % 2 else 0) + rng.uniform(-5, 5); r_ = sd * math.cos(math.radians(a)) + uv_ * math.sin(math.radians(a))
            base = tube_end - d * L * .06 + r_ * L * .1; dirp = unit(d * 1.0 + r_ * .55)
            p.petal(base, dirp, L * (.58 if k % 2 else .55), L * (.34 if k % 2 else .3), WH0, WH1, up=r_ * -1, rows=8, cols=5, bend=-.05, curl=-.35, cup=.18, twist=rng.uniform(-.08, .08), wave=.015, tip_width=.25)
        for k in range(6):   # おしべ：細い糸と、先に黄色〜オレンジの花粉のふくろ
            r_ = sd * math.cos(k * 1.047 + .5) + uv_ * math.sin(k * 1.047 + .5); e = tube_end + d * L * .32 + r_ * L * .07
            sweep(p, [o + d * L * .3, (o + d * L * .3 + e) / 2 + uv_ * L * .02, e], [.0012, .001, .0009], [(220, 230, 190)] * 3, sides=3); p.ball(e, .0045, (238, 160, 40), squash=1.8, axis=sd, n=5, m=2)
        e = tube_end + d * L * .42; sweep(p, [o + d * L * .3, e], [.0016, .0013], [(214, 228, 180)] * 2, sides=3); p.ball(e, .004, (150, 190, 70), n=5, m=2)   # めしべ
    def bud(o, d, L):
        sweep(p, [o, o + d * L * .3, o + d * L * .75, o + d * L], [L * .05, L * .06, L * .1, L * .03], [(130, 166, 96), (176, 200, 140), (222, 232, 200), (206, 220, 180)], sides=6, cap=True)
    for s_, (az, h, n_fl) in enumerate(((0, .46, 2), (130, .38, 1), (250, .33, 1))):
        b = rad(az, 0) * (.06 if not s_ else rng.uniform(.15, .19)); out = rad(az, 0); sg = .1 * (h / .46) * rng.uniform(.8, 1.2)   # じょうぶなくき：重力のしなりは小さい
        P = lambda t, b=b, h=h, out=out, sg=sg: b + out * h * sg * t * t * (3 - t) / 2 + G(0, 0, h * (t - .5 * sg * sg * t ** 3))
        D = lambda t, P=P: unit(P(min(1, t + .02)) - P(max(0, t - .02)))
        sweep(p, [P(i / 8) for i in range(9)], [.0075 - .0025 * i / 8 for i in range(9)], [STEMC] * 9, sides=5)
        for k in range(24):   # 葉：らせんに（137.5度ずつ）ぎっしり。はばのある細長い葉が、弓なりにたれる。上ほど小さく・立つ
            t = .04 + .037 * k; L = (.19 - .004 * k) * rng.uniform(.9, 1.1)
            place_card(p, P(t), rad(az + k * 137.5 + rng.uniform(-10, 10), 30 + 1.5 * k), L, L * .4, rng, droop=(.35, .6), fold=(.2, .35), tone=(.7, .85), roll=.3)
        top = P(1)
        for f in range(n_fl):   # 花：短い花の柄で、外へ・少し下を向く
            a = az + f * 160 + rng.uniform(-20, 20); pe = top + rad(a, 40) * .025; sweep(p, [top, pe], [.004, .0035], [STEMC] * 2, sides=4)
            trumpet(pe, unit(rad(a, -8)), rng.uniform(.17, .19))
        bo = top + G(0, 0, .002); bud(bo, unit(rad(az + 80, 55)), .1)   # つぼみ：ななめ上


def lotus(p):
    """ハス（Nelumbo nucifera）。本物の写真（NC State Extension の8まい）と、ゲームの絵を見て、構造を書き出してから作った：
    葉：まるい葉。葉柄が葉のまん中の下につく（たて）。すじはまん中から放射状・ふちはゆるくなみうつ。水にうく葉と、水面より上に立つ葉（ふちが上へそったおわん）。白っぽい青緑。
    花：葉より高いまっすぐな花の柄の先。花びらは、はばの広いたまご形で内へくぼみ、2〜3れつに重なる（内ほど立つ）。つけ根は白〜うすい黄緑、先へピンク。
    まん中：黄緑の上が平らなじょうごの形（花たく）と、上の小さな穴のつぶ。まわりに黄色いおしべがたくさん。つぼみ：しずくの形（先がピンク・つけ根が緑）。
    原点は水面（y 0）。池のマスに置く"""
    rng = p.rng; STK = (96, 130, 70)
    def disc(o, nrm, R, cup, rot, droop=0., dimple=.05):
        """まるい葉の面（6だん×24）：まるい葉の絵（4とおりから1つ）をはる。葉ごとに、だ円・ふちのなみ（本数と高さ）・まん中のくぼみ・
        cup：ふちが上へそる高さ（半径の割合。立つ葉はおわん）・droop：ふちの一方がたれる（立つ葉の、重さでたれたふち）"""
        f, sx, ux = frame(nrm, (1, 0, 0) if abs(nrm[0]) < .9 else (0, 1, 0)); V = [o - f * dimple * R]; cell = int(rng.integers(0, 4)); cy, cx = divmod(cell, 2)
        uvc = lambda u, v: ((cx + (u * 1.0 + .54) / 1.08) / 2, ((1 - cy) + (v + .54) / 1.08) / 2); UV = [uvc(0, 0)]; tn = rng.uniform(.88, 1.06); C = [G(255, 255, 255) * tn]; F = []; NR, NA = 6, 24
        ell = rng.uniform(.88, 1.0); nw = int(rng.integers(3, 6)); aw = rng.uniform(.03, .07); ph = rng.uniform(0, 6.28); da = rng.uniform(0, 6.28)
        for i in range(1, NR + 1):
            rr = i / NR
            for j in range(NA):
                a = 2 * math.pi * j / NA; ca, sa = math.cos(a + rot), math.sin(a + rot)
                w = R * aw * math.sin(a * nw + ph) * rr ** 2.5 + R * .02 * math.sin(a * 11 + ph * 2) * rr ** 3   # ふちのなみ：葉ごとに本数・高さがちがう
                z = cup * R * rr ** 2 - dimple * R * (1 - rr) ** 2 + w - droop * R * max(0, math.cos(a - da)) ** 2 * rr ** 3   # まん中は少しくぼむ・おわん・一方のふちがたれる
                V.append(o + (sx * ca + ux * sa * ell) * rr * R + f * z); UV.append(uvc(.5 * rr * math.cos(a), .5 * rr * math.sin(a))); C.append(G(255, 255, 255) * tn * (1 - .06 * rr))   # 絵は葉ごとにまわる
        for j in range(NA): F.append((0, 1 + j, 1 + (j + 1) % NA))
        for i in range(NR - 1):
            for j in range(NA): a_ = 1 + i * NA + j; b_ = 1 + i * NA + (j + 1) % NA; F += [(a_, a_ + NA, b_), (b_, a_ + NA, b_ + NA)]
        p.card.add(V, F, C, np.array(UV))
    def bloom(top, size):
        up = G(0, 0, 1)
        sweep(p, [top - up * .01 * size, top + up * .02 * size, top + up * .045 * size], [.012 * size, .024 * size, .036 * size], [(150, 176, 80), (196, 210, 96), (224, 214, 90)], sides=8, cap=True)   # 花たく：じょうごの形（上は平らで黄色っぽい）
        for k in range(7): a = k * 51.4; p.ball(top + up * .046 * size + rad(a, 0) * .022 * size, .005 * size, (150, 150, 50), squash=.5, n=5, m=2)   # 上の穴のつぶ
        p.ball(top + up * .046 * size, .005 * size, (150, 150, 50), squash=.5, n=5, m=2)
        for k in range(26): a = k * 137.5; d = unit(rad(a, 0) + up * rng.uniform(.3, 1.0)); q = top + up * .004 * size + rad(a, 0) * .024 * size; sweep(p, [q, q + d * .032 * size], [.0014 * size, .0012 * size], [(250, 210, 60), (250, 190, 40)], sides=3, cap=True)   # おしべ
        for row, (n, el, L, W) in enumerate(((8, 18, .16, .1), (7, 42, .145, .095))):   # 2れつ。まん中の花たくが見えるように、内の花びらは立てすぎない   # 花びら：外から内へ、だんだん立つ
            for k in range(n):
                a = k * 360 / n + row * 22 + rng.uniform(-6, 6); o = top - up * .005 * size + rad(a, 0) * .02 * size * (1 - row * .3)
                p.petal(o, rad(a, el + rng.uniform(-6, 6)), L * size, W * size, (250, 248, 232), (250, 236, 240), up=up, rows=8, cols=6, tipc=(232, 96, 150), bend=.02, curl=.02, cup=.22, twist=rng.uniform(-.05, .05), wave=.0, tip_width=.3)
    def bud(top, size):
        up = G(0, 0, 1); sweep(p, [top, top + up * .02 * size, top + up * .06 * size, top + up * .1 * size], [.015 * size, .03 * size, .028 * size, .002 * size], [(110, 150, 70), (196, 210, 150), (236, 150, 180), (230, 100, 150)], sides=8, cap=True)
    for k in range(6):   # 水にうく葉（水面より少し上。まん中は水にしずめない）
        a = k * 60 + rng.uniform(-20, 20); o = rad(a, 0) * rng.uniform(.08, .24) + G(0, 0, .016 + .004 * k); disc(o, unit(G(rng.uniform(-.06, .06), rng.uniform(-.06, .06), 1)), rng.uniform(.09, .15), rng.uniform(.0, .05), rng.uniform(0, 6.28), droop=rng.uniform(0, .04), dimple=.0)   # 水にうく葉：大きさ・かたむき・そりを、葉ごとに   # 水面と重ならないよう、少しうかせる（重なると水の色がまざってちらつく）。葉ごとに高さをずらす
    for k in range(2):   # 水面より上に立つ葉：葉柄がまっすぐ立ち、ふちが上へそったおわん
        a = k * 180 + 60 + rng.uniform(-20, 20); b = rad(a, 0) * .12; h = rng.uniform(.14, .2); top = b + rad(a, 0) * .03 + G(0, 0, h)
        sweep(p, [b, top], [.004, .0035], [STK] * 2, sides=4); disc(top, unit(G(0, 0, 1) + rad(a + rng.uniform(-40, 40), 0) * rng.uniform(.15, .45)), rng.uniform(.09, .13), rng.uniform(.18, .32), rng.uniform(0, 6.28), droop=rng.uniform(.15, .35))   # 立つ葉：おわん・かたむき・一方のふちがたれる
    b = rad(200, 0) * .03; top = b + G(0, 0, .26); sweep(p, [b, (b + top) / 2 + rad(110, 0) * .006, top], [.0045, .004, .0038], [STK] * 3, sides=4); bloom(top, 1.0)   # 花
    b = rad(20, 0) * .14; top = b + G(0, 0, .2); sweep(p, [b, top], [.004, .0035], [STK] * 2, sides=4); bud(top, 1.0)   # つぼみ


def add_drops(path, npath, region, n=170, seed=9):
    """葉のカードの絵に、ねばねばのつぶ（白く光るしずく・モウセンゴケの腺毛の先）を足す。region(x, y)：絵の 0〜1 の場所がつぶをおく所か"""
    from PIL import Image
    rng = np.random.default_rng(seed); im = np.asarray(Image.open(path).convert('RGBA'), float); nm = np.asarray(Image.open(npath).convert('RGB'), float); H, W = im.shape[:2]
    yy, xx = np.mgrid[0:H, 0:W]; k = 0
    for _ in range(n * 20):
        if k >= n: break
        x, y = rng.uniform(0, 1, 2)
        if not region(x, y) or im[int((1 - y) * (H - 1)), int(x * (W - 1)), 3] < 250: continue
        k += 1; cx, cy = x * W, (1 - y) * H; r = rng.uniform(7, 11); d = np.hypot(xx - cx, yy - cy); m = np.clip(r - d + .5, 0, 1)
        sh = np.clip(1 - np.hypot(xx - cx + r * .35, yy - cy + r * .35) / (r * .5), 0, 1)   # しずくのてり
        c = np.array([236., 244, 214]) * (.86 + .14 * sh[..., None]); im[..., :3] = im[..., :3] * (1 - m[..., None]) + c * m[..., None]
        dz = np.sqrt(np.clip(1 - (d / r) ** 2, 0, 1)); gx = np.where(d < r, -(xx - cx) / r, 0) * dz * .0 + np.where(d < r, (xx - cx) / r, 0) * .8; gy = np.where(d < r, -(yy - cy) / r, 0) * .8
        n0 = nm / 127.5 - 1; n1 = np.dstack([gx, gy, np.ones_like(gx)]); n1 = n1 / np.linalg.norm(n1, axis=2, keepdims=True); n0 = n0 * (1 - m[..., None]) + n1 * m[..., None]; nm = (n0 * 127.5 + 127.5)
    Image.fromarray(im.clip(0, 255).astype(np.uint8), 'RGBA').save(path); Image.fromarray(nm.clip(0, 255).astype(np.uint8), 'RGB').save(npath)


def nebari(p):
    """ねばり草（ゲームだけの植物。持ち主がきめた：もとはモウセンゴケ Drosera。本物の写真3まいを見た。色はゲームの絵の黄緑）：
    株：地面にそって広がるロゼット。長い葉柄の先に、さじ形〜まるい葉身がつき、外へひらいて地面近くにねる（内の若い葉は立ち、先がまるまる）。
    葉身：ねばねばの毛（腺毛）が一面にあり、先に白く光るしずく（ゲームの白いつぶ）。上から見ると、星のように放射状に広がる。
    花はつけない（ゲームの絵にない）"""
    rng = p.rng; p.ball(G(0, 0, .004), .012, (110, 140, 60), squash=.5, n=6, m=2)   # 株のまん中（根もと）
    for i in range(16):   # 葉：外ほど長くねる・内ほど短く立つ（137.5度ずつ）
        a = i * 137.5 + rng.uniform(-12, 12); u = i / 15; L = (.24 - .07 * u) * rng.uniform(.9, 1.1); el = 30 + 40 * u   # 葉はななめ上に立ち、先がたれる（ゲームの絵のこんもりした株）
        o = rad(a, 0) * .015 + G(0, 0, .006); place_card(p, o, rad(a, el), L, L * .55, rng, droop=(.35, .6) if u < .6 else (.1, .25), fold=(.1, .22), tone=(.95, 1.1), roll=.3)   # 若い葉は先が上へまるまる（droop がマイナス）


def hotaru(p):
    """ヨルボシの草むら（ゲームだけの植物。持ち主がきめた：もとはハナニラ Ipheion uniflorum。本物の写真3まいを見た。つぼみの色はゲームの絵のうすい黄緑）：
    株：根もとから、細いひも形の葉がたくさん出て、弓なりに外へたれる（ねぎのように、少しくぼんだ断面）。
    くき：葉の中から、細いくきが1本ずつまっすぐ立ち、葉より高い。先に1つ、星の形の花になる、細長いつぼみ（6まいの花びらがねじれてとじる）。
    いくつかは、つぼみが少しひらいて、6まいの花びらの先がのぞく。夜に光るのは、ゲームのあかり（ここでは形だけ）"""
    rng = p.rng; STK = (110, 150, 96)
    for i in range(34):   # 葉：ひも形・弓なりにたれる（ゲームの絵のように、細く・多く・長く）
        a = i * 137.5 + rng.uniform(-15, 15); L = rng.uniform(.32, .48); o = rad(a, 0) * rng.uniform(0, .025)
        place_card(p, o, rad(a, rng.uniform(62, 84)), L, .024, rng, droop=(.5, .85), fold=(.25, .4), tone=(.78, .95), roll=.4)
    for s_ in range(6):   # くきとつぼみ：くきは重力で少ししなる
        a = s_ * 60 + rng.uniform(-20, 20); b = rad(a, 0) * rng.uniform(.01, .04); h = rng.uniform(.3, .4); out = rad(a, 0); sg = rng.uniform(.08, .2)
        P = lambda t, b=b, h=h, out=out, sg=sg: b + out * h * sg * t * t * (3 - t) / 2 + G(0, 0, h * (t - .5 * sg * sg * t ** 3))
        sweep(p, [P(k / 6) for k in range(7)], [.0035 - .001 * k / 6 for k in range(7)], [STK] * 7, sides=4)
        top = P(1); d = unit(P(1) - P(.9)); opn = s_ % 3 == 0
        sweep(p, [top, top + d * .012, top + d * .03, top + d * .046], [.004, .009, .008, .0015], [(150, 180, 110), (220, 236, 176), (236, 244, 196), (226, 238, 186)], sides=6, cap=True)   # つぼみ：細長いしずく・うすい黄緑
        if opn:
            for k in range(6): p.petal(top + d * .028, unit(d + rad(a + k * 60, 0) * .9), .028, .014, (220, 236, 176), (244, 250, 214), up=d, rows=4, cols=3, bend=.1, curl=.05, cup=.2, twist=0, wave=0, tip_width=.3)   # 少しひらいたつぼみ


def oak(p, apples=0, dead=False):
    """木（植えた木・森の木。持ち主がきめた：オーク。本物の写真（NC State Extension のシロガシワ・アカガシワ・オウシュウナラ・ライブオーク・バーオーク）を見て、構造を書き出してから作った）：
    幹：太く短い。根もとが広がって（根のはり出し）、ひくい所で太い枝にわかれる。木の皮はたての割れめのある灰茶色。
    枝：太い枝が3〜5本、ななめ上と横へ大きく広がり、先で何回もわかれる。樹冠は、高さより横はばが広い、まるく広がった形。
    葉：深く切れこんだ（まるい山がいくつもある）葉が、枝先にかたまってつく。葉のかたまりのあいだに、すきまと枝が見える。
    大きさ：ゲームの絵に合わせて、高さ 約2.6マス・はば 約2.6マス（作った形の1.5倍のあと）"""
    rng = p.rng; BARK = (124, 108, 92) if not dead else (150, 144, 134)   # 枯れ木：皮がはげて、灰色っぽい
    def branch(o, d, L, r, depth, tips, pdir=G(0, 0, 1), pr=None):
        """枝：o から d の向きへ長さ L・太さ r。先で2〜3本にわかれる（depth まで）。葉のかたまりをつける所を tips にためる。
        つけ根をなだらかに（持ち主がきめた）：親の枝（pdir の向き・太さ pr）の中からはじまり、はじめは親の向きにそってのびてから、ゆるくまがって外へ出る（3次のベジェ）。
        つけ根は太く（親の太さに近く）、すぐに自分の太さへ細る（枝のえり）"""
        pr = pr or r * 1.6; side = unit(np.cross(d, G(0, 0, 1)) + G(0, 0, 1e-6)) * rng.uniform(-1, 1) * (.05 if not dead else .16) * L   # 枯れ木の枝は、くねくねまがる
        P0 = o - pdir * pr * .9; P1 = o + pdir * L * .28; P2 = o + d * L * .62 + G(0, 0, .1 * L) + side; P3 = o + d * L + G(0, 0, .1 * L)
        ts = (0, .1, .22, .38, .58, .8, 1); B = lambda t: P0 * (1 - t) ** 3 + 3 * P1 * t * (1 - t) ** 2 + 3 * P2 * t * t * (1 - t) + P3 * t ** 3
        pts = [B(t) for t in ts]; rads = [r + (pr * .85 - r) * max(0, 1 - t / .3) ** 2 - r * .38 * t for t in ts]
        bark_tube(p, pts, rads, BARK, sides=7 if r > .02 else 5 if r > .01 else 3); e = pts[-1]; dd = unit(e - pts[-2])
        if depth == 0 or r < (.012 if not dead else .006): tips.append((e, dd)); return
        if dead and depth < 3 and rng.random() < .22: return   # 枯れ木：先が折れた枝（そこで終わる）
        for k in range(rng.integers(2, 4)):
            az = math.degrees(math.atan2(dd[1], dd[0])) + rng.uniform(-60, 60) * (1.4 if dead else 1) + (k - 1) * 40; el = math.degrees(math.asin(max(-1, min(1, dd[2])))) * .6 + rng.uniform(5, 30)
            branch(e, rad(az, el), L * rng.uniform(.55, .72), r * .62, depth - 1, tips, dd, r * .62)
    tips = []
    trunk = [G(0, 0, 0), G(.01, 0, .18), G(.025, .01, .4), G(.02, .01, .58)]; bark_tube(p, trunk, [.14, .105, .095, .088], BARK, sides=9, flare=.55)   # 幹：太く短い・根もとが広がる
    az0 = rng.uniform(0, 360)
    for k in range(5):   # 太い枝：ひくい所から、まわり5方向へ、ななめ上と横へ大きく広がる
        az = az0 + k * 72 + rng.uniform(-15, 15); el = rng.uniform(25, 40); o = trunk[-1] + G(0, 0, rng.uniform(-.08, -.01))   # 幹の中からはじまる
        branch(o, rad(az, el), rng.uniform(.4, .5), .06, 2 if not dead else 4, tips, G(0, 0, 1), .085)
    branch(trunk[-1], rad(rng.uniform(0, 360), 78), .42, .055, 2 if not dead else 4, tips, G(0, 0, 1), .085)
    if dead: return   # 枯れ木：葉はつけない   # まん中から上へのびる枝
    CC, RX, RZ = G(0, 0, 1.2), .9, .5   # 樹冠：横に広いまるい屋根（だ円の玉）。葉のかたまりを、その外がわにならべる（すきまも少しのこす）
    clumps = [(e + dd * .08, dd) for e, dd in tips]
    for i in range(26):
        u = (i + .5) / 26; z = 1 - 1.15 * u; th = i * 2.39996; rr = math.sqrt(max(0, 1 - z * z)); q = CC + G(math.cos(th) * rr * RX, math.sin(th) * rr * RX, z * RZ) * rng.uniform(.85, 1.0)   # 下がわ（z −0.15 より下）はあけて、幹と枝を見せる
        if rng.random() < .88: clumps.append((q, unit(q - CC)))
    for e, dd in clumps:   # 葉のかたまり：玉（半径 約0.2）に、葉のカード（深く切れこんだ葉のふさ）を12まいほど。上ほど明るく、下は暗い（樹冠の中のかげ）
        c0 = e + G(0, 0, .03); lit = max(0., min(1., (c0[2] - .6) / .7))
        for k in range(12):
            n = unit(G(*rng.normal(0, 1, 3)) + G(0, 0, .5)); q = c0 + n * rng.uniform(.06, .2); dirc = unit(n * .8 + G(*rng.normal(0, .5, 3))); L = rng.uniform(.26, .34)
            place_card(p, q - dirc * L * .4, dirc, L, L * .8, rng, droop=(.1, .3), fold=(.15, .3), tone=(.55 + .35 * lit, .7 + .35 * lit), roll=1.2)
    def apple(q, r):
        """りんご（本物の写真）：上と下にくぼみのある、少しひらたい玉（回転体）。地の色は黄緑〜黄色、日のあたる片がわに赤いほお（ぼかし）と、たての赤いすじ。つやはひかえめ"""
        NA, NR = 14, 9; V = []; C = []; F = []; blush = rng.uniform(0, 6.28); amt = rng.uniform(.85, 1.15); base = G(*[(186, 190, 96), (168, 180, 86), (196, 186, 92)][int(rng.integers(0, 3))])
        for i in range(NR + 1):
            t = i / NR; ph = math.pi * t; z = -math.cos(ph) * .88; rr = math.sin(ph) * (1 + .08 * math.sin(ph))
            z += .22 * math.exp(-(t / .12) ** 2) - .14 * math.exp(-((1 - t) / .12) ** 2)   # 上（へた）と下（おしり）のくぼみ
            for j in range(NA):
                a = 2 * math.pi * j / NA; V.append(q + G(math.cos(a) * rr, math.sin(a) * rr, z) * r)
                side = .5 + .5 * math.cos(a - blush); streak = .5 + .5 * math.sin(a * 9 + t * 2)
                k = min(1, amt * (side ** .8 * .9 + .25 * streak) * (.55 + .45 * math.sin(ph)))   # 赤いほお・たてのすじ
                C.append(base * (1 - k) + G(150, 26, 40) * k)
        for i in range(NR):
            for j in range(NA): a_ = i * NA + j; b_ = i * NA + (j + 1) % NA; F += [(a_, b_, a_ + NA), (b_, b_ + NA, a_ + NA)]
        p.add(V, F, C, mat=0)   # つやの絵（葉）をのせない
    if apples:   # りんご（本物の写真：まるく少しひらたい・赤に黄緑のすじ・へたのくぼみ・短い柄で枝から下がる）：葉のかたまりの外がわの、横〜下に下がる
        for k in range(apples):
            e, dd = clumps[int(rng.integers(0, len(clumps)))]; n = unit(G(*rng.normal(0, 1, 2), rng.uniform(-.3, .5))); q = e + n * rng.uniform(.27, .32)   # 葉のかたまりの外がわ（上から見えるように）
            r = rng.uniform(.055, .065); red = rng.uniform(0, 1); col = (int(196 - 40 * red), int(48 + 30 * (1 - red)), 40)
            sweep(p, [q + G(0, 0, r * 1.45) + G(.006, 0, 0), q + G(0, 0, r * .7)], [.0035, .0028], [(96, 80, 50)] * 2, sides=3)   # 柄（へたのくぼみから）
            apple(q, r)


def deadtree(p):   # 枯れ木（本物の枯れたオークの写真4まい）：オークの骨組み・葉なし・枝は細かくわかれてくねくね・先が折れた枝・皮がはげた灰色
    oak(p, dead=True)


def fruit(p):   # りんごの木（持ち主がきめた：オークの形を流用して、りんごの実をつける）
    oak(p, apples=22)


def grass(p):   # 草むら（イネ科）：根もとから細い葉がたばで出て、先がしなってたれる
    for i in range(12): a = i * 137.5 + p.rng.uniform(-20, 20); p.blade(rad(a, 0) * p.rng.uniform(0, .04), rad(a, p.rng.uniform(55, 80)), p.rng.uniform(.18, .34), .022, (70, 132, 62), (140, 190, 96), profile=LINEAR, bend=-p.rng.uniform(.3, .7), cup=.03, twist=p.rng.uniform(-.5, .5), ripple=0, thick=0, seg=7, col=2)


SIZE = {'oak': 1.5, 'fruit': 1.5, 'deadtree': 1.5, 'F9': 1.5, 'salvia': 1.5, 'clover': 1.5, 'bellf': 1.5, 'lily': 1.5, 'lotus': 1.5, 'nebari': 1.5, 'hotaru': 1.5}   # 株ぜんたいの大きさ（作った形に対して。持ち主がきめた：ばらは1.5）
KINDS = [('F0', tulip), ('F1', sunflower), ('F2', lily), ('F3', hydrangea), ('F4', glory), ('F5', cosmos), ('F6', lavender), ('F7', daisy), ('F8', pansy), ('F9', rose), ('G0', grass), ('salvia', salvia), ('clover', clover), ('bellf', bellf), ('lily', glily), ('lotus', lotus), ('nebari', nebari), ('hotaru', hotaru), ('oak', oak), ('fruit', fruit), ('deadtree', deadtree)]

if __name__ == '__main__':
    PT = os.path.join(ROOT, '.claude', 'skills', 'realistic-plant-3d', 'assets', 'textures', 'petal_rose')
    petal_card_texture(os.path.join(HERE, 'tex', 'petal_rose_card.png'), os.path.join(HERE, 'tex', 'petal_rose_card_n.png'), os.path.join(PT, 'basecolor.png'), os.path.join(PT, 'normal.png'))
    TX = os.path.join(ROOT, '.claude', 'skills', 'realistic-plant-3d', 'assets', 'textures', 'leaf_rose')
    def salvia_leaf(seg, leaflet, rng): seg((0, 0), (0, .2), .012, (70, 116, 50)); leaflet((0, .17), 0, .8, .66, 1.0)   # サルビアの葉：葉柄と、たまご形の葉1まい
    leaf_card_texture(os.path.join(HERE, 'tex', 'card_salvia_leaf.png'), os.path.join(TX, 'basecolor.png'), nsrc=os.path.join(TX, 'normal.png'), npath=os.path.join(HERE, 'tex', 'card_salvia_leaf_n.png'), layout=salvia_leaf, gain=1.25)
    def clover_leaf(seg, leaflet, rng):   # 三つ葉：まん中（0, 0.5）から、3まいの小さな葉。先が広いまるい形・先のくぼみ・V字のもよう
        ob = lambda u: np.sin(np.pi * np.clip(u, 0, 1) ** 1.35) ** .38 * (.3 + .7 * np.clip(u, 0, 1) ** .45)
        for a in (0, 120, 240): leaflet((0, .5), math.radians(a + rng.uniform(-6, 6)), .345, 1.0, rng.uniform(.95, 1.05), prof=ob, teeth=14, tooth=.025, chevron=.9, notch=.025)
    leaf_card_texture(os.path.join(HERE, 'tex', 'card_clover_leaf.png'), os.path.join(TX, '..', 'leaf_broad', 'basecolor.png'), nsrc=os.path.join(TX, '..', 'leaf_broad', 'normal.png'), npath=os.path.join(HERE, 'tex', 'card_clover_leaf_n.png'), layout=clover_leaf, gain=.95)
    star_petal_texture(os.path.join(HERE, 'tex', 'card_bellf_petal.png'), os.path.join(HERE, 'tex', 'card_bellf_petal_n.png'))
    def bellf_leaf(seg, leaflet, rng): leaflet((0, .02), 0, .96, .5, 1.0, teeth=11, tooth=.07)   # ききょうの葉：柄がなく、たまご形〜細長い・ぎざぎざ
    leaf_card_texture(os.path.join(HERE, 'tex', 'card_bellf_leaf.png'), os.path.join(TX, 'basecolor.png'), nsrc=os.path.join(TX, 'normal.png'), npath=os.path.join(HERE, 'tex', 'card_bellf_leaf_n.png'), layout=bellf_leaf, gain=1.2)
    def lily_leaf(seg, leaflet, rng): leaflet((0, .01), 0, .98, .52, 1.0, prof=lambda u: np.sin(np.pi * np.clip(u, 0, 1) ** .8) ** .7, teeth=1, tooth=0)   # ゆりの葉：細長く・先がとがる・ぎざぎざなし（平行のすじ）
    TL = os.path.join(TX, '..', 'leaf_lily'); leaf_card_texture(os.path.join(HERE, 'tex', 'card_lily_leaf.png'), os.path.join(TL, 'basecolor.png'), nsrc=os.path.join(TL, 'normal.png'), npath=os.path.join(HERE, 'tex', 'card_lily_leaf_n.png'), layout=lily_leaf, gain=1.0)
    round_leaf_texture(os.path.join(HERE, 'tex', 'card_lotus_leaf.png'), os.path.join(HERE, 'tex', 'card_lotus_leaf_n.png'))
    def nebari_leaf(seg, leaflet, rng): seg((0, 0), (0, .3), .022, (96, 140, 56)); leaflet((0, .26), 0, .72, .62, 1.12, prof=lambda u: np.sin(np.pi * np.clip(u, 0, 1) ** 1.05) ** .6, teeth=1, tooth=0)   # ねばり草の葉：長い葉柄・さじ形の葉身
    TB = os.path.join(TX, '..', 'leaf_broad'); nb = os.path.join(HERE, 'tex', 'card_nebari_leaf.png'); nbn = os.path.join(HERE, 'tex', 'card_nebari_leaf_n.png')
    leaf_card_texture(nb, os.path.join(TB, 'basecolor.png'), nsrc=os.path.join(TB, 'normal.png'), npath=nbn, layout=nebari_leaf, gain=1.75)
    add_drops(nb, nbn, lambda x, y: y > .34 and abs(x - .5) < .28, n=26)
    def hotaru_leaf(seg, leaflet, rng): leaflet((0, .01), 0, .98, 1.0, 1.0, prof=lambda u: np.clip(1 - np.clip(u, 0, 1) ** 6, 0, 1) ** .5 * np.clip(np.clip(u, 0, 1) * 12, 0, 1), teeth=1, tooth=0)   # ヨルボシの葉：同じはばのひも・先はまるい
    TG = os.path.join(TX, '..', 'leaf_grass'); leaf_card_texture(os.path.join(HERE, 'tex', 'card_hotaru_leaf.png'), os.path.join(TG, 'basecolor.png'), nsrc=os.path.join(TG, 'normal.png'), npath=os.path.join(HERE, 'tex', 'card_hotaru_leaf_n.png'), layout=hotaru_leaf, gain=1.05)
    def oak_leaf(seg, leaflet, rng):   # オークの葉のふさ：小枝に、深く切れこんだ葉（まるい山 5〜7こ）が5まい、互いちがいに
        lob = lambda u: (np.sin(np.pi * np.clip(u, 0, 1) ** .85) ** .6) * (.55 + .45 * np.abs(np.sin(np.clip(u, 0, 1) * math.pi * 3.5 + .3)) ** .7)
        seg((0, 0), (0, .62), .01, (96, 80, 60))
        for k, (y, ang, L) in enumerate(((.12, -55, .36), (.24, 50, .4), (.38, -42, .4), (.5, 38, .36), (.6, 0, .38))):
            a = math.radians(ang); leaflet((math.sin(a) * .01, y), a + rng.uniform(-.1, .1), L, .62, rng.uniform(.92, 1.08), prof=lob, teeth=1, tooth=0)
    leaf_card_texture(os.path.join(HERE, 'tex', 'card_oak_leaf.png'), os.path.join(TX, '..', 'leaf_broad', 'basecolor.png'), nsrc=os.path.join(TX, '..', 'leaf_broad', 'normal.png'), npath=os.path.join(HERE, 'tex', 'card_oak_leaf_n.png'), layout=oak_leaf, gain=1.25)
    leaf_card_texture(os.path.join(HERE, 'tex', 'leaf_rose_card.png'), os.path.join(TX, 'basecolor.png'), nsrc=os.path.join(TX, 'normal.png'), npath=os.path.join(HERE, 'tex', 'leaf_rose_card_n.png'))
    import trimesh
    meshes = []
    for i, (name, fn) in enumerate(KINDS):
        p = Plant(100 + i); fn(p); att, F = p.mesh(); V = att['POSITION'] = att['POSITION'] * SIZE.get(name, 1)
        T = trimesh.Trimesh(V, F, process=False); bad = int((T.area_faces < 1e-12).sum())
        print(name, fn.__name__, '三角形', len(F), '高さ %.2f はば %.2f' % (V[:, 1].max(), max(np.ptp(V[:, 0]), np.ptp(V[:, 2]))), '面積0の面', bad, '有限', bool(np.isfinite(V).all()), '地面の下 %.3f' % V[:, 1].min())
        meshes.append((name, att, F))
        if p.pcard is not None and p.pcard.V: ca, cF = p.pcard.mesh(); ca['POSITION'] = ca['POSITION'] * SIZE.get(name, 1); meshes.append((name + '_petal', ca, cF)); print(' ', name + '_petal', '三角形', len(cF))
        if p.card is not None and p.card.V: ca, cF = p.card.mesh(); ca['POSITION'] = ca['POSITION'] * SIZE.get(name, 1); meshes.append((name + '_leaf', ca, cF)); print(' ', name + '_leaf', '三角形', len(cF))
    out = os.path.join(HERE, 'tex', 'flowers.glb'); glbio.write(meshes, out, 'proto3d make_flowers.py (realistic-plant-3d)'); print(out, os.path.getsize(out) // 1024, 'KB')
