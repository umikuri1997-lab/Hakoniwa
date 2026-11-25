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

def shade(cb, nb, mb, light):
    """かげは明度でなく彩度で（持ち主がきめた）：明るさ（HSV の V）はかえず、かげの段ほどあざやかに。
    つや（水のずきん）：光と目のあいだの向きの所に白いつや。光る（火のずきん）：かげをつけず、こちらを向いた所ほど明るい黄色へ。"""
    import colorsys
    dl = nb@light; band = np.where(dl > 0.35, 0, np.where(dl > -0.1, 1, 2))
    out = cb.copy(); m = cb.sum(1) > 0
    hsv = np.array([colorsys.rgb_to_hsv(*(c/255)) for c in cb[m]]) if m.any() else np.zeros((0, 3))
    if len(hsv):
        hsv[:, 1] = np.minimum(1, hsv[:, 1]+np.array([0.0, 0.10, 0.20])[band[m]]+np.where(hsv[:, 1] < 0.08, np.array([0, 0.03, 0.06])[band[m]], 0))
        out[m] = np.array([colorsys.hsv_to_rgb(*v) for v in hsv])*255
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
def render(tris, view, W=144, H=136, ss=4, points=(), spin=0.0, info=False, yaw=0.0):
    """view：0 正面（−Y から）・1 横（右向き：+X から見る…キャラの右手が手前）・2 うしろ。返すのは RGBA（足もとが下から 12 ドット）"""
    Ws, Hs = W*ss, H*ss
    zb = np.full(Ws*Hs, -1e9); cb = np.zeros((Ws*Hs, 3)); nb = np.zeros((Ws*Hs, 3)); ib = np.full(Ws*Hs, -1); mb = np.zeros(Ws*Hs, int)   # mb：0 ふつう・1 つや（水）・2 光る（火）・3 すける（風のはね）
    zt = np.full(Ws*Hs, -1e9); ct = np.zeros((Ws*Hs, 3)); nt = np.zeros((Ws*Hs, 3))   # すける物（いちばん手前）
    tg = np.zeros(Ws*Hs, int); hcov = np.zeros(Ws*Hs, bool)   # いちばん手前の物の種類（TAGS）・頭（ずきん・顔）がうつる所
    light = np.array([-0.5, 0.6, 0.62]); light /= np.linalg.norm(light)   # カメラから見て 左上・手前
    spin = -(spin+yaw); cs, sn = math.cos(spin), math.sin(spin); Rs = np.array([[cs, -sn, 0], [sn, cs, 0], [0, 0, 1]])   # ゲームの view（キャラの座標で rz(spin)）＝ Blender の座標で rz(−spin)
    cam = (lambda Q: np.stack([Q[:, 0], Q[:, 2], -Q[:, 1]], 1)) if view == 0 else \
              (lambda Q: np.stack([-Q[:, 1], Q[:, 2], -Q[:, 0]], 1)) if view == 1 else \
              (lambda Q: np.stack([-Q[:, 0], Q[:, 2], Q[:, 1]], 1))   # 横は右を向く：キャラの前（−Y）が画面の右
    for k, tri in enumerate(tris):
        P, N, col = tri[:3]; mat = tri[3] if len(tri) > 3 else 0; tag = TAGS.index(tri[4]) if len(tri) > 4 else 0
        if spin: P = P@Rs.T; N = N@Rs.T
        X, Y, Z = cam(P).T; N = cam(N)
        sx = (X+W/2)*ss; sy = (H-12-Y)*ss
        x0, x1 = int(np.floor(sx.min())), int(np.ceil(sx.max())); y0, y1 = int(np.floor(sy.min())), int(np.ceil(sy.max()))
        if x1 < 0 or y1 < 0 or x0 >= Ws or y0 >= Hs: continue
        xs, ys = np.meshgrid(np.arange(max(0, x0), min(Ws, x1+1))+.5, np.arange(max(0, y0), min(Hs, y1+1))+.5)
        (ax, ay), (bx, by), (cx, cy) = zip(sx, sy)
        d = (by-cy)*(ax-cx)+(cx-bx)*(ay-cy)
        if abs(d) < 1e-9: continue
        l0 = ((by-cy)*(xs-cx)+(cx-bx)*(ys-cy))/d; l1 = ((cy-ay)*(xs-cx)+(ax-cx)*(ys-cy))/d; l2 = 1-l0-l1
        m = (l0 >= -1e-6) & (l1 >= -1e-6) & (l2 >= -1e-6)
        if not m.any(): continue
        z = l0*Z[0]+l1*Z[1]+l2*Z[2]
        j = (ys[m]-.5).astype(int)*Ws+(xs[m]-.5).astype(int); z = z[m]
        if tag in (3, 4): hcov[j] = True
        nn = l0[m, None]*N[0]+l1[m, None]*N[1]+l2[m, None]*N[2]
        if mat == 3:
            bt = z > zt[j]; j = j[bt]; zt[j] = z[bt]; ct[j] = col; nt[j] = nn[bt]; continue
        bt = z > zb[j]; j = j[bt]
        zb[j] = z[bt]; cb[j] = col; nb[j] = nn[bt]; ib[j] = k; mb[j] = mat; tg[j] = tag
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
    for r in range(H):
        for c in range(W):
            blk = a[r*ss:(r+1)*ss, c*ss:(c+1)*ss]
            if blk.sum()*2 < ss*ss: continue
            px = img[r*ss:(r+1)*ss, c*ss:(c+1)*ss][blk]
            u, n = np.unique(np.round(px).astype(int), axis=0, return_counts=True)
            out[r, c, :3] = u[n.argmax()]; out[r, c, 3] = 150 if thin[r*ss:(r+1)*ss, c*ss:(c+1)*ss].sum()*2 >= ss*ss else 255
    # まわりに1ドットの輪郭（となりの色を少し暗く）
    al = out[..., 3] > 0; line = np.zeros_like(out)
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        sh = np.roll(np.roll(out, dy, 0), dx, 1); m = ~al & (sh[..., 3] > 0) & (line[..., 3] == 0)
        line[m, :3] = (sh[m, :3]*0.72).astype(np.uint8); line[m, 3] = sh[m, 3]
    out[~al] = line[~al]
    if not info: return out
    T = tg.reshape(H, ss, W, ss).transpose(0, 2, 1, 3).reshape(H, W, ss*ss)
    tagd = np.array([[np.bincount(t, minlength=len(TAGS)).argmax() for t in row] for row in T])   # ドットごとの いちばん多い種類
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
