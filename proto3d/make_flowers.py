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

MAT_LEAF = 6
G = lambda *c: np.array(c, float)
STEM = (94, 154, 54)


class Plant:
    """部品（点・面・色・UV）をためて、1つのメッシュにする"""
    def __init__(self, seed): self.V = []; self.F = []; self.C = []; self.U = []; self.n = 0; self.rng = np.random.default_rng(seed)

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
    """ばら（園芸のばら。品種はきめていない仮の物）。スキル v6・v7：花びらは、花のじくのまわりにまきつく曲面（rose_curved.rose_petal）。外は広くひらいて先がそり、内ほど小さく立ってまきこむ。
    見た物：スキルの絵（plant-atlas の Rose 3つ。AIの絵なので、実物のたしかめにはならない）＝おわんの形の花・細く枝わかれするくき・こい緑のたまご形の小さな葉がたくさん・わきの枝につぼみ。
    骨格：細い木のくき（先へ細く、しなる）から、わきの枝。葉：小さな葉5まいの複葉が互いちがい。花：がく5まい"""
    rng = p.rng; K = 2.0   # スキルの試作（メートル）→ マス：花のはば 約0.16マス
    def bloom(top, ax, open_, size):
        """open_：1 ひらいた花・0 つぼみ。層：(まい数, 半径, 高さ, まきつく角度, ひらき)"""
        f, sx, ux = frame(ax, (0, 1, 0) if abs(ax[2]) > .9 else (0, 0, 1)); tiers = [(5, .052, .027, 1.55, 1.0), (5, .041, .034, 1.35, .76), (5, .030, .039, 1.52, .48), (4, .019, .042, 1.85, .25), (3, .0105, .041, 2.25, .04), (3, .005, .039, 2.65, 0)]
        if open_ < .5: tiers = [(3, .022, .05, 2.3, .1), (3, .014, .052, 2.6, 0), (2, .007, .05, 2.9, 0)]   # つぼみ：かたくまいた花びらだけ
        for k, (n, r, h, span, op) in enumerate(tiers):
            for i in range(n):
                a = 2 * math.pi * i / n + k * 2.39996 + rng.uniform(-.08, .08); m = rose_petal(a, r * rng.uniform(.95, 1.05), h * rng.uniform(.94, 1.06), span, op * open_, rng.uniform(0, 6.283), k, rows=12, cols=10)
                v = np.asarray(m.vertices) * K * size * [1, 1, 1.35];   # 花を、絵のように深いおわんに
                uv = np.asarray(m.visual.uv); t = uv[:, 1:2]; q = uv[:, 0:1]; u = 1 - k / (len(tiers) - 1 or 1)   # u：1 外がわ・0 まん中
                c = (G(168, 26, 66) * (1 - t ** .8) + (G(232, 96, 136) * (1 - u) + G(250, 150, 178) * u) * t ** .8) * (.82 + .18 * u)   # つけ根はこく・先は明るく。内がわほど、少しこく
                p.add(top + v[:, :1] * sx + v[:, 1:2] * ux + v[:, 2:3] * f, m.faces, c, np.hstack([q * r * 2, t * h]) * K * size)
        for k in range(5): p.blade(top, around(ax, k * 72 + 20, -28 + 60 * (1 - open_)), .075 * size, .026 * size, (50, 112, 44), (104, 160, 70), up=ax, profile=LANCE, bend=-.3 * open_, cup=.1, twist=0, ripple=0, thick=0, seg=8, col=4)   # がく
        p.ball(top - ax * .012 * size, .016 * size, (78, 128, 54), squash=1.25, axis=ax, n=8, m=4)
    def leafs(o, a):
        """複葉：葉柄 → 2ついの小さな葉 → 先の1まい。じくは先へたれる。小さな葉は、たまご形・ぎざぎざ・まん中のすじの両がわがゆるくふくらむ"""
        d = rad(a, 30); L = rng.uniform(.115, .15); ax_ = lambda q: o + d * L * q + G(0, 0, -.25 * L * q * q); p.tube([ax_(0), ax_(.5), ax_(1)], [.004, .0032, .002], (84, 132, 56), 5)
        for q, sg in ((.4, 1), (.45, -1), (.72, 1), (.77, -1), (1, 0)):
            dd = unit(d * (1 if sg == 0 else .5) + rad(a + sg * 80, 6) + G(0, 0, rng.uniform(-.55, .25))); sz = L * (.62 if sg == 0 else .5) * rng.uniform(.88, 1.1)   # 小さな葉は、1まいずつ、たれぐあいをかえる（横から見て、ぜんぶ水平の板にならないように）
            upv = unit(G(0, 0, 1) + rad(a + sg * 80, 0) * rng.uniform(-.5, .5) + rad(rng.uniform(0, 360), 0) * .25)
            p.blade(ax_(q), dd, sz, sz * .62, (30, 92, 38), (78, 146, 56), up=upv, profile=OVATE, bend=-.2, cup=-.07, twist=rng.uniform(-.3, .3), ripple=.02, teeth=4, serration=.07, thick=0, seg=24, col=4)
    def cane(base, az, h, lean, r0):
        return p.stem(base, G(*base) + G(0, 0, h) + rad(az, 0) * lean, r0, r0 * .5, rad(az + 90, 0) * .018 + rad(az, 0) * .02, color=(76, 118, 52), n=6)
    for s_, (az, h, lean) in enumerate(((70, .36, .05), (200, .29, .1))):   # 根もとから2本のくき。それぞれの先に、ひらいた花
        b = rad(az, 0) * .03; P, D = cane(b, az, h, lean, .0085); bloom(P(1), unit(D(1) * .5 + unit(rad(az, 0) * .45 + G(0, 0, .9)) * .5), 1 - .2 * s_, 1 - .12 * s_)
        for k in range(4): leafs(P(.14 + .2 * k), az + 50 + k * 137.5 + rng.uniform(-15, 15))
        for k in range(3): t = .15 + .25 * k; a = az + 20 + k * 150; o = P(t); d = rad(a, -15); p.tube([o, o + d * .009, o + d * .015 + G(0, 0, -.003)], [.0035, .002, .0005], (150, 84, 62), 4)   # とげ
        t = .5 + .1 * s_; o = P(t); a = az + (115 if s_ == 0 else -100); hb = .13 + .03 * s_; P2, D2 = p.stem(o, o + rad(a, 52) * hb, .005, .003, G(0, 0, .012), color=(84, 128, 56), n=4)   # わきの枝に、つぼみ
        bloom(P2(1), D2(1), .1, .62); leafs(P2(.35), a + 100); leafs(P2(.6), a - 120)


def grass(p):   # 草むら（イネ科）：根もとから細い葉がたばで出て、先がしなってたれる
    for i in range(12): a = i * 137.5 + p.rng.uniform(-20, 20); p.blade(rad(a, 0) * p.rng.uniform(0, .04), rad(a, p.rng.uniform(55, 80)), p.rng.uniform(.18, .34), .022, (70, 132, 62), (140, 190, 96), profile=LINEAR, bend=-p.rng.uniform(.3, .7), cup=.03, twist=p.rng.uniform(-.5, .5), ripple=0, thick=0, seg=7, col=2)


KINDS = [('F0', tulip), ('F1', sunflower), ('F2', lily), ('F3', hydrangea), ('F4', glory), ('F5', cosmos), ('F6', lavender), ('F7', daisy), ('F8', pansy), ('F9', rose), ('G0', grass)]

if __name__ == '__main__':
    import trimesh
    meshes = []
    for i, (name, fn) in enumerate(KINDS):
        p = Plant(100 + i); fn(p); att, F = p.mesh(); V = att['POSITION']
        T = trimesh.Trimesh(V, F, process=False); bad = int((T.area_faces < 1e-12).sum())
        print(name, fn.__name__, '三角形', len(F), '高さ %.2f はば %.2f' % (V[:, 1].max(), max(np.ptp(V[:, 0]), np.ptp(V[:, 2]))), '面積0の面', bad, '有限', bool(np.isfinite(V).all()), '地面の下 %.3f' % V[:, 1].min())
        meshes.append((name, att, F))
    out = os.path.join(HERE, 'tex', 'flowers.glb'); glbio.write(meshes, out, 'proto3d make_flowers.py (realistic-plant-3d)'); print(out, os.path.getsize(out) // 1024, 'KB')
