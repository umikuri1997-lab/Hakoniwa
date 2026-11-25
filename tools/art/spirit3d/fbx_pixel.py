"""持ち主のモデル（model/<属性>.fbx）を、形もポーズもそのまま、ドット絵に写す（たしかめ用）。
  python3 tools/art/spirit3d/fbx_pixel.py <出す .png>
1ドット＝1cm（モデルの 0.01）。カメラはまっすぐ（遠近なし）、正面・横（右向き）・うしろ。
色はモデルにないので、オブジェクトの名前ごとに、ゲームの色をのせる。かげは左上の光で3だん、まわりに1ドットの輪郭（となりの色より少し暗く）。"""
import math, os, sys
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ELS = ['earth', 'water', 'fire', 'wind', 'wood']
HOOD = {'earth': '#8f6a50', 'water': '#78c3fb', 'fire': '#e8604f', 'wind': '#a6cc8a', 'wood': '#6fae4c'}
CHEEK = {'earth': '#c6b1a0', 'water': '#badef5', 'fire': '#f2ac9f', 'wind': '#d2e2bc', 'wood': '#b6d39e'}
EYE = {'earth': '#5e3d2a', 'water': '#1d4f7c', 'fire': '#8f3a22', 'wind': '#456a2a', 'wood': '#3f5e26'}
HAND = {'earth': '#e3c3a3', 'water': '#f3dfc6', 'fire': '#ffc887', 'wind': '#c8e2b4', 'wood': '#d6e8c2'}
hx = lambda h: np.array([int(h[i:i+2], 16) for i in (1, 3, 5)], float)
CREAM = '#fdf8ef'

def color_of(name, el, bone):
    n = name.lower()
    if n.startswith('eye'): return EYE[el]
    if n.startswith('cheek'): return CHEEK[el]
    if n.startswith('hood'): return HOOD[el]
    if n.startswith('sprout'): return '#5e8f43'
    if n.startswith('headacc'): return '#e8cdb0'
    if n.startswith('hane'): return '#a6cc8a'
    if n == 'body' and bone.startswith('hand'): return HAND[el]
    return CREAM

def load(el):
    import bpy
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.fbx(filepath=os.path.join(HERE, 'model', el+'.fbx'))
    out = []
    dg = bpy.context.evaluated_depsgraph_get()
    for o in bpy.data.objects:
        if o.type != 'MESH': continue
        me = o.evaluated_get(dg).to_mesh(); me.calc_loop_triangles()
        M = o.matrix_world; R = M.to_3x3()
        V = np.array([(M @ v.co)[:] for v in me.vertices])*100.0
        N = np.array([(R @ v.normal).normalized()[:] for v in me.vertices])
        names = {g.index: g.name for g in o.vertex_groups}
        ob = o.original if hasattr(o, 'original') else o
        dom = []
        for v in ob.data.vertices:
            dom.append(names.get(max(v.groups, key=lambda g: g.weight).group, '') if v.groups else '')
        for t in me.loop_triangles:
            i = t.vertices[:]; b = dom[i[0]] if len(dom) == len(me.vertices) else ''
            out.append((V[list(i)], N[list(i)], hx(color_of(o.name, el, b))))
        o.evaluated_get(dg).to_mesh_clear()
    return out

def rgb2hsv(c):
    """colorsys.rgb_to_hsv を、まとめて（同じ式）"""
    r, g, b = c[:, 0], c[:, 1], c[:, 2]; mx = c.max(1); mn = c.min(1); v = mx; d = mx-mn
    s = np.where(mx > 0, d/np.where(mx > 0, mx, 1), 0.0); dd = np.where(d > 0, d, 1)
    rc, gc, bc = (mx-r)/dd, (mx-g)/dd, (mx-b)/dd
    h = np.where(r == mx, bc-gc, np.where(g == mx, 2.0+rc-bc, 4.0+gc-rc)); h = (h/6.0) % 1.0; h = np.where(d > 0, h, 0.0)
    return np.stack([h, s, v], 1)

def hsv2rgb(x):
    """colorsys.hsv_to_rgb を、まとめて（同じ式）"""
    h, s, v = x[:, 0], x[:, 1], x[:, 2]; i = np.floor(h*6.0).astype(int); f = h*6.0-i
    p, q, t = v*(1-s), v*(1-s*f), v*(1-s*(1-f)); i = i % 6
    r = np.choose(i, [v, q, p, p, t, v]); g = np.choose(i, [t, v, v, q, p, p]); b = np.choose(i, [p, p, t, v, v, q])
    out = np.stack([r, g, b], 1); out[s == 0] = np.stack([v, v, v], 1)[s == 0]; return out

def shade(cb, nb, mb, light):
    """かげは明度でなく彩度で（持ち主がきめた）：明るさ（HSV の V）はかえず、かげの段ほどあざやかに。
    つや（水のずきん）：光と目のあいだの向きの所に白いつや。光る（火のずきん）：かげをつけず、こちらを向いた所ほど明るい黄色へ。"""
    import colorsys
    dl = nb@light; band = np.where(dl > 0.35, 0, np.where(dl > -0.1, 1, 2))
    out = cb.copy(); m = cb.sum(1) > 0
    hsv = rgb2hsv(cb[m]/255) if m.any() else np.zeros((0, 3))
    if len(hsv):
        hsv[:, 1] = np.minimum(1, hsv[:, 1]+np.array([0.0, 0.10, 0.20])[band[m]]+np.where(hsv[:, 1] < 0.08, np.array([0, 0.03, 0.06])[band[m]], 0))
        out[m] = hsv2rgb(hsv)*255
    view = np.array([0, 0, 1.0]); hv = light+view; hv /= np.linalg.norm(hv)
    sp0 = (mb == 1) & (nb@hv > 0.996); out[sp0] = 255   # 水：つやつや（小さな点の白い光。広がるつやにしない）
    g = mb == 2
    if g.any():   # 火：光っている色（かげはつけず、外がわは明るい朱色・こちらを向く所ほど 白っぽい黄色）
        t = np.clip(nb[g]@view, 0, 1)[:, None]
        edge = np.array([255, 84, 48.0]); mid = np.array([255, 150, 40.0]); core = np.array([255, 226, 92.0])   # あざやかなまま（白くしない）
        a = np.clip(t/0.55, 0, 1); b = np.clip((t-0.55)/0.45, 0, 1)
        out[g] = np.where(t < 0.55, edge*(1-a)+mid*a, mid*(1-b)+core*b)
    return out

TAGS = ['', 'body', 'arm', 'head', 'face', 'prop']
ELEV = 25.0   # 見おろす角度（度。持ち主が「少しだけ見おろす」をえらんだ）
from numba import njit

@njit(cache=True)
def _raster(SX, SY, SZ, NN, COL, MAT, TAG, Ws, Hs, zb, cb, nb, mb, tg, hcov, zt, ct, nt):
    """三角形を1つずつ、ドットの細かさ（ss）でぬる（前の Python のぬり方と同じ式・同じじゅんばん）"""
    for k in range(SX.shape[0]):
        ax, bx, cx = SX[k, 0], SX[k, 1], SX[k, 2]; ay, by, cy = SY[k, 0], SY[k, 1], SY[k, 2]
        x0 = int(np.floor(min(ax, bx, cx))); x1 = int(np.ceil(max(ax, bx, cx))); y0 = int(np.floor(min(ay, by, cy))); y1 = int(np.ceil(max(ay, by, cy)))
        if x1 < 0 or y1 < 0 or x0 >= Ws or y0 >= Hs: continue
        d = (by-cy)*(ax-cx)+(cx-bx)*(ay-cy)
        if abs(d) < 1e-9: continue
        for yi in range(max(0, y0), min(Hs, y1+1)):
            ys = yi+.5
            for xi in range(max(0, x0), min(Ws, x1+1)):
                xs = xi+.5
                l0 = ((by-cy)*(xs-cx)+(cx-bx)*(ys-cy))/d; l1 = ((cy-ay)*(xs-cx)+(ax-cx)*(ys-cy))/d; l2 = 1-l0-l1
                if l0 < -1e-6 or l1 < -1e-6 or l2 < -1e-6: continue
                z = l0*SZ[k, 0]+l1*SZ[k, 1]+l2*SZ[k, 2]; j = yi*Ws+xi
                if TAG[k] == 3 or TAG[k] == 4: hcov[j] = True
                if MAT[k] == 3:
                    if z > zt[j]:
                        zt[j] = z
                        for q in range(3): ct[j, q] = COL[k, q]; nt[j, q] = l0*NN[k, 0, q]+l1*NN[k, 1, q]+l2*NN[k, 2, q]
                    continue
                if z > zb[j]:
                    zb[j] = z; mb[j] = MAT[k]; tg[j] = TAG[k]
                    for q in range(3): cb[j, q] = COL[k, q]; nb[j, q] = l0*NN[k, 0, q]+l1*NN[k, 1, q]+l2*NN[k, 2, q]

@njit(cache=True)
def _down(img, a, thin, H, W, ss, out):
    """ss×ss を、いちばん多い色で1ドットに（同じ数なら、色の小さいほう。np.unique と同じ）"""
    cols = np.zeros((ss*ss, 3), np.int64); cnt = np.zeros(ss*ss, np.int64)
    for r in range(H):
        for c in range(W):
            nc = 0; na = 0; nth = 0
            for dy in range(ss):
                for dx in range(ss):
                    yy = r*ss+dy; xx = c*ss+dx
                    if thin[yy, xx]: nth += 1
                    if not a[yy, xx]: continue
                    na += 1
                    R = int(np.round(img[yy, xx, 0])); G = int(np.round(img[yy, xx, 1])); B = int(np.round(img[yy, xx, 2]))
                    f = -1
                    for t in range(nc):
                        if cols[t, 0] == R and cols[t, 1] == G and cols[t, 2] == B: f = t; break
                    if f < 0: cols[nc, 0] = R; cols[nc, 1] = G; cols[nc, 2] = B; cnt[nc] = 1; nc += 1
                    else: cnt[f] += 1
            if na*2 < ss*ss: continue
            bi = 0
            for t in range(1, nc):
                if cnt[t] > cnt[bi] or (cnt[t] == cnt[bi] and (cols[t, 0] < cols[bi, 0] or (cols[t, 0] == cols[bi, 0] and (cols[t, 1] < cols[bi, 1] or (cols[t, 1] == cols[bi, 1] and cols[t, 2] < cols[bi, 2]))))): bi = t
            out[r, c, 0] = cols[bi, 0]; out[r, c, 1] = cols[bi, 1]; out[r, c, 2] = cols[bi, 2]
            out[r, c, 3] = 150 if nth*2 >= ss*ss else 255
def render(tris, view, W=144, H=136, ss=4, points=(), spin=0.0, info=False, yaw=0.0):
    """view：0 正面（−Y から）・1 横（右向き：+X から見る…キャラの右手が手前）・2 うしろ。返すのは RGBA（足もとが下から 12 ドット）"""
    Ws, Hs = W*ss, H*ss
    zb = np.full(Ws*Hs, -1e9); cb = np.zeros((Ws*Hs, 3)); nb = np.zeros((Ws*Hs, 3)); ib = np.full(Ws*Hs, -1); mb = np.zeros(Ws*Hs, int)   # mb：0 ふつう・1 つや（水）・2 光る（火）・3 すける（風のはね）
    zt = np.full(Ws*Hs, -1e9); ct = np.zeros((Ws*Hs, 3)); nt = np.zeros((Ws*Hs, 3))   # すける物（いちばん手前）
    tg = np.zeros(Ws*Hs, int); hcov = np.zeros(Ws*Hs, bool)   # いちばん手前の物の種類（TAGS）・頭（ずきん・顔）がうつる所
    light = np.array([-0.5, 0.6, 0.62]); light /= np.linalg.norm(light)   # カメラから見て 左上・手前
    spin = -(spin+yaw); cs, sn = math.cos(spin), math.sin(spin); Rs = np.array([[cs, -sn, 0], [sn, cs, 0], [0, 0, 1]])   # ゲームの view（キャラの座標で rz(spin)）＝ Blender の座標で rz(−spin)
    cam0 = (lambda Q: np.stack([Q[:, 0], Q[:, 2], -Q[:, 1]], 1)) if view == 0 else \
              (lambda Q: np.stack([-Q[:, 1], Q[:, 2], -Q[:, 0]], 1)) if view == 1 else \
              (lambda Q: np.stack([-Q[:, 0], Q[:, 2], Q[:, 1]], 1))   # 横は右を向く：キャラの前（−Y）が画面の右
    ce, se = math.cos(math.radians(ELEV)), math.sin(math.radians(ELEV))
    def cam(Q):   # 少し見おろす（ELEV 度）：画面の上 ＝ 上と奥のあいだ・奥行き ＝ 手前と上のあいだ
        C = cam0(Q); return np.stack([C[:, 0], C[:, 1]*ce-C[:, 2]*se, C[:, 1]*se+C[:, 2]*ce], 1)
    if len(tris):
        P = np.array([t[0] for t in tris], float); N = np.array([t[1] for t in tris], float)
        COL = np.array([t[2] for t in tris], float); MAT = np.array([t[3] if len(t) > 3 else 0 for t in tris], np.int64)
        TAG = np.array([TAGS.index(t[4]) if len(t) > 4 else 0 for t in tris], np.int64)
        if spin: P = P@Rs.T; N = N@Rs.T
        Q = cam(P.reshape(-1, 3)).reshape(-1, 3, 3); NN = cam(N.reshape(-1, 3)).reshape(-1, 3, 3)
        SX = (Q[..., 0]+W/2)*ss; SY = (H-12-Q[..., 1])*ss
        _raster(SX, SY, np.ascontiguousarray(Q[..., 2]), np.ascontiguousarray(NN), COL, MAT, TAG, Ws, Hs, zb, cb, nb, mb, tg, hcov, zt, ct, nt)
    for P, C in points:   # 道具：点（かげなし。カメラを向いた面として）
        if spin: P = P@Rs.T
        Q = cam(P); sx = ((Q[:, 0]+W/2)*ss).astype(int); sy = ((H-12-Q[:, 1])*ss).astype(int)
        ok = (sx >= 0) & (sx < Ws) & (sy >= 0) & (sy < Hs); j = sy[ok]*Ws+sx[ok]; z = Q[ok, 2]; cc = np.asarray(C)[ok]
        bt = z > zb[j]; j = j[bt]; zb[j] = z[bt]; cb[j] = cc[bt]; nb[j] = light; ib[j] = -2; tg[j] = 5
    # 左上の光で3だん
    nb /= np.maximum(np.linalg.norm(nb, axis=1, keepdims=True), 1e-9)
    nt /= np.maximum(np.linalg.norm(nt, axis=1, keepdims=True), 1e-9)
    img = shade(cb, nb, mb, light); has = zb > -1e8
    wt = (zt > -1e8) & (zt > zb)   # すける物が手前：うしろの色と 45:55 でまぜる（うしろが何もなければ、うすく）
    tw = shade(ct, nt, np.zeros(len(ct), int), light)
    img[wt & has] = img[wt & has]*0.45+tw[wt & has]*0.55; img[wt & ~has] = tw[wt & ~has]
    thin = (wt & ~has).reshape(Hs, Ws)
    img = img.reshape(Hs, Ws, 3); a = (has | wt).reshape(Hs, Ws)
    # ss×ss をいちばん多い色で1ドットに
    out = np.zeros((H, W, 4), np.uint8)
    _down(img, a, thin, H, W, ss, out)
    # まわりに1ドットの輪郭（となりの色を少し暗く）
    al = out[..., 3] > 0; line = np.zeros_like(out)
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        sh = np.roll(np.roll(out, dy, 0), dx, 1); m = ~al & (sh[..., 3] > 0) & (line[..., 3] == 0)
        line[m, :3] = (sh[m, :3]*0.72).astype(np.uint8); line[m, 3] = sh[m, 3]
    out[~al] = line[~al]
    if not info: return out
    T = tg.reshape(H, ss, W, ss).transpose(0, 2, 1, 3).reshape(H, W, ss*ss)
    cnt = np.stack([(T == q).sum(2) for q in range(len(TAGS))], 2); tagd = cnt.argmax(2)   # ドットごとの いちばん多い種類
    return out, {'tag': tagd, 'hcov': hcov.reshape(H, ss, W, ss).any(axis=(1, 3)), 'cam': cam, 'Rs': Rs}

def main():
    dst = sys.argv[1]; Z = 4; tiles = []
    for el in ELS:
        T = load(el)
        for v in (0, 1, 2): tiles.append(render(T, v))
    W, H = 144, 136; sheet = Image.new('RGBA', (W*3*Z, H*5*Z), (200, 220, 180, 255))
    for i, t in enumerate(tiles):
        im = Image.fromarray(t).resize((W*Z, H*Z), Image.NEAREST); sheet.alpha_composite(im, ((i % 3)*W*Z, (i//3)*H*Z))
    sheet.convert('RGB').save(dst)

if __name__ == '__main__':
    main()
