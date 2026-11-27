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
    def __init__(self, seed, card=True): self.V = []; self.F = []; self.C = []; self.U = []; self.n = 0; self.rng = np.random.default_rng(seed); self.card = Plant(seed + 1000, False) if card else None; self.pcard = Plant(seed + 2000, False) if card else None   # pcard：アルファ抜きの花びら（べつのメッシュ）   # card：アルファ抜きの葉のカード（べつのメッシュ）

    def rimmed(self, v, f, c, uv, rows, cols, thick, rim_k=.88):
        """1まいの面（両面にしない）に、ふちだけ厚みをつける（持ち主がきめた）：面のまわりの点を、面のうらへ thick ずらして、帯でつなぐ。
        面の点のならびは、たて rows+1 × よこ cols+1（i 行 j 列 → i*(cols+1)+j）"""
        import trimesh
        v = np.asarray(v, float); n = np.asarray(trimesh.Trimesh(v, f, process=False).vertex_normals); W = cols + 1
        loop = [j for j in range(cols + 1)] + [i * W + cols for i in range(1, rows + 1)] + [rows * W + j for j in range(cols - 1, -1, -1)] + [i * W for i in range(rows - 1, 0, -1)]
        A = v[loop]; B = A - n[loop] * thick; k = len(loop); rf = []
        for a in range(k): b = (a + 1) % k; rf += [(a, b, k + b), (a, k + b, k + a)]
        self.add(v, f, c, uv); self.add(np.vstack([A, B]), rf, np.vstack([c[loop], c[loop] * rim_k]), np.vstack([uv[loop], uv[loop]]))

    def add(self, v, f, c, uv=None):
        v = np.asarray(v, float); self.V.append(v); self.F.append(np.asarray(f) + self.n); self.C.append(np.asarray(c, float)); self.U.append(np.zeros((len(v), 2)) if uv is None else uv); self.n += len(v)

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

    def petal(self, origin, direction, length, width, ca, cb, *, up=(0, 0, 1), rows=14, cols=8, shade=0., **kw):
        """花びら（スキル v3 の petal()）：たての反り（bend）・先のまき（curl）・よこのくぼみ（cup）・ねじれ・ふちのうねりを、べつべつにきめる、なめらかな曲面。
        先は1点にすぼめず、丸い輪郭。ふちはうすい（厚みをつけない1まいの面。両面を描く）。色は、つけ根 ca から先 cb へ。shade：ぜんたいを暗く（内がわの花びら）"""
        m = fg_petal(origin, direction, length, width, up=up, rows=rows, cols=cols, **kw); v = np.asarray(m.vertices)
        t = np.repeat(np.arange(rows + 1) / rows, cols + 1)[:, None]; q = np.tile(np.arange(cols + 1) / cols, rows + 1)[:, None]
        c = (G(*ca) * (1 - t ** .7) + G(*cb) * t ** .7) * (1 - shade) * (1 + .06 * (1 - np.abs(2 * q - 1)) * t)
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
        V = np.vstack(self.V); F = np.vstack(self.F); C = np.vstack(self.C) / 255.0; U = np.vstack(self.U)
        T = V[F]; F = F[np.linalg.norm(np.cross(T[:, 1] - T[:, 0], T[:, 2] - T[:, 0]), axis=1) > 1e-10]   # 面積のない面（玉のてっぺんなど）はのぞく
        V = V[:, [0, 2, 1]] * [1, 1, -1]   # z 上 → y 上（回すだけ。うらがえさない）
        import trimesh
        Nn = np.asarray(trimesh.Trimesh(V, F, process=False).vertex_normals)   # なめらかな面の向きを、GLB に書く（スキル v6）
        return {'POSITION': V, 'NORMAL': Nn, 'COLOR_0': np.clip(C, 0, 1) ** 2.2, 'TEXCOORD_0': U, '_MAT': np.full((len(V), 1), MAT_LEAF), '_UNDER': np.zeros((len(V), 1))}, F


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
    def leaflet(b, ang, L, W, tone):
        d = np.array([math.sin(ang), math.cos(ang)]); n = np.array([d[1], -d[0]]); u = ((X - b[0]) * d[0] + (Y - b[1]) * d[1]) / L; w = ((X - b[0]) * n[0] + (Y - b[1]) * n[1]) / L
        uc = np.clip(u, 0, 1); hw = W / 2 * np.sin(np.pi * uc) ** .72 * (1.16 - .4 * uc); saw = 1 - .09 * (np.mod(uc * 8, 1)) * (uc > .15)   # ぎざぎざ（先へ向く歯）
        m = np.clip((hw * saw - np.abs(w)) * L / px + .5, 0, 1) * (u > 0) * (u < 1)
        sx = np.clip(((w / (W * 1.05) + .5) * 255).astype(int), 0, 255); sy = np.clip(((1 - uc) * 255).astype(int), 0, 255); c = S[sy, sx] * tone * (1 - .12 * np.abs(w) / (W / 2))[..., None]   # ふちは少し暗く
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
    """サルビア（Salvia splendens。草原の花のたねの店にある）。ゲームの絵：赤い花の穂が3本ほど立つ。
    形（ふつうに知られた形。写真は見られていない）：まっすぐ立つ四角いくき・たまご形でぎざぎざの葉が、向かい合って節ごとに90度まわる（十字対生）。
    くきの上に、赤いがくと、細長いつつの形の花（先が上下の唇にわかれる）が、輪になって何だんもつく（穂）。花もがくも赤。
    スキル v9：花はつつ（5角）とがく（玉）だけの軽い形。葉はアルファ抜きのカード（1まいの葉＋葉柄）＋ノーマル"""
    rng = p.rng; RED_A = (178, 18, 22); RED_B = (240, 50, 40); CAL = (150, 14, 24)
    for s_, (az, h) in enumerate(((20, .36), (140, .31), (260, .28), (80, .22))):
        b = rad(az, 0) * (.035 if s_ else .01); P, D = p.stem(b, b + G(0, 0, h) + rad(az, 0) * .03, .0075, .005, rad(az + 90, 0) * .008, color=(70, 120, 52), n=4)
        for n_ in range(3):   # 葉：十字対生（節ごとに90度）。下ほど大きい
            t = .1 + .16 * n_; L = .14 * (1 - .22 * n_) * rng.uniform(.92, 1.08)
            for k in (0, 180): place_card(p, P(t), rad(az + 90 * n_ + k + rng.uniform(-12, 12), 25 - 8 * n_), L, L * .85, rng, droop=(.2, .35), fold=(.15, .3), tone=(.8, .98))
        nw = 8 if s_ < 3 else 5   # 穂は長く（くきの上の3割）
        for w in range(nw):   # 花の穂：上から下へ、輪ごとに3つ。上の花ほど小さく、つぼみ
            t = 1 - .042 * w - .02; o = P(t); ax = D(t); sc = .6 + .4 * min(1, w / 2)
            for k in range(3):
                a = w * 60 + k * 120 + rng.uniform(-15, 15); d = around(ax, a, 30 + rng.uniform(-10, 14))
                p.ball(o + d * .008 * sc, .009 * sc, CAL, squash=1.6, axis=d, n=5, m=2)   # がく
                if w >= 1:
                    e = o + d * .045 * sc + ax * .008 * sc; tip = e + unit(d + ax * .25) * .012 * sc
                    p.tube([o + d * .01 * sc, e, tip], [.0075 * sc, .0068 * sc, .0035 * sc], RED_B if w > 2 else RED_A, 5)   # 花のつつ（先は少し上へ）
        p.ball(P(1) + D(1) * .006, .008, CAL, squash=1.8, axis=D(1), n=5, m=2)   # 穂の先のつぼみ


def grass(p):   # 草むら（イネ科）：根もとから細い葉がたばで出て、先がしなってたれる
    for i in range(12): a = i * 137.5 + p.rng.uniform(-20, 20); p.blade(rad(a, 0) * p.rng.uniform(0, .04), rad(a, p.rng.uniform(55, 80)), p.rng.uniform(.18, .34), .022, (70, 132, 62), (140, 190, 96), profile=LINEAR, bend=-p.rng.uniform(.3, .7), cup=.03, twist=p.rng.uniform(-.5, .5), ripple=0, thick=0, seg=7, col=2)


SIZE = {'F9': 1.5, 'salvia': 1.5}   # 株ぜんたいの大きさ（作った形に対して。持ち主がきめた：ばらは1.5）
KINDS = [('F0', tulip), ('F1', sunflower), ('F2', lily), ('F3', hydrangea), ('F4', glory), ('F5', cosmos), ('F6', lavender), ('F7', daisy), ('F8', pansy), ('F9', rose), ('G0', grass), ('salvia', salvia)]

if __name__ == '__main__':
    PT = os.path.join(ROOT, '.claude', 'skills', 'realistic-plant-3d', 'assets', 'textures', 'petal_rose')
    petal_card_texture(os.path.join(HERE, 'tex', 'petal_rose_card.png'), os.path.join(HERE, 'tex', 'petal_rose_card_n.png'), os.path.join(PT, 'basecolor.png'), os.path.join(PT, 'normal.png'))
    TX = os.path.join(ROOT, '.claude', 'skills', 'realistic-plant-3d', 'assets', 'textures', 'leaf_rose')
    def salvia_leaf(seg, leaflet, rng): seg((0, 0), (0, .2), .012, (70, 116, 50)); leaflet((0, .17), 0, .8, .66, 1.0)   # サルビアの葉：葉柄と、たまご形の葉1まい
    leaf_card_texture(os.path.join(HERE, 'tex', 'card_salvia_leaf.png'), os.path.join(TX, 'basecolor.png'), nsrc=os.path.join(TX, 'normal.png'), npath=os.path.join(HERE, 'tex', 'card_salvia_leaf_n.png'), layout=salvia_leaf, gain=1.25)
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
