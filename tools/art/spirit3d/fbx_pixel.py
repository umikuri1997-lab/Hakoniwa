"""持ち主のモデル（model/<属性>.fbx）を、形もポーズもそのまま、ドット絵に写す（たしかめ用）。
  python3 tools/art/spirit3d/fbx_pixel.py <出す .png>
1ドット＝1cm（モデルの 0.01）。カメラはまっすぐ（遠近なし）、正面・横（右向き）・うしろ。
色はモデルにないので、オブジェクトの名前ごとに、ゲームの色をのせる。かげは左上の光で3だん、まわりに1ドットの輪郭（となりの色より少し暗く）。"""
import os, sys
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

def render(tris, view, W=144, H=136, ss=4):
    """view：0 正面（−Y から）・1 横（右向き：+X から見る…キャラの右手が手前）・2 うしろ。返すのは RGBA（足もとが下から 12 ドット）"""
    Ws, Hs = W*ss, H*ss
    zb = np.full(Ws*Hs, -1e9); cb = np.zeros((Ws*Hs, 3)); nb = np.zeros((Ws*Hs, 3)); ib = np.full(Ws*Hs, -1)
    light = np.array([-0.5, 0.6, 0.62]); light /= np.linalg.norm(light)   # カメラから見て 左上・手前
    for k, (P, N, col) in enumerate(tris):
        cam = (lambda Q: np.stack([Q[:, 0], Q[:, 2], -Q[:, 1]], 1)) if view == 0 else \
              (lambda Q: np.stack([-Q[:, 1], Q[:, 2], -Q[:, 0]], 1)) if view == 1 else \
              (lambda Q: np.stack([-Q[:, 0], Q[:, 2], Q[:, 1]], 1))   # 横は右を向く：キャラの前（−Y）が画面の右
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
        nn = l0[m, None]*N[0]+l1[m, None]*N[1]+l2[m, None]*N[2]
        bt = z > zb[j]; j = j[bt]
        zb[j] = z[bt]; cb[j] = col; nb[j] = nn[bt]; ib[j] = k
    # 左上の光で3だん
    nb /= np.maximum(np.linalg.norm(nb, axis=1, keepdims=True), 1e-9)
    dl = nb@light; f = np.where(dl > 0.35, 1.0, np.where(dl > -0.1, 0.9, 0.8))
    img = (cb*f[:, None]).reshape(Hs, Ws, 3); a = (zb > -1e8).reshape(Hs, Ws)
    # ss×ss をいちばん多い色で1ドットに
    out = np.zeros((H, W, 4), np.uint8)
    for r in range(H):
        for c in range(W):
            blk = a[r*ss:(r+1)*ss, c*ss:(c+1)*ss]
            if blk.sum()*2 < ss*ss: continue
            px = img[r*ss:(r+1)*ss, c*ss:(c+1)*ss][blk]
            u, n = np.unique(np.round(px).astype(int), axis=0, return_counts=True)
            out[r, c, :3] = u[n.argmax()]; out[r, c, 3] = 255
    # まわりに1ドットの輪郭（となりの色を少し暗く）
    al = out[..., 3] > 0; line = np.zeros_like(out)
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        sh = np.roll(np.roll(out, dy, 0), dx, 1); m = ~al & (sh[..., 3] > 0) & (line[..., 3] == 0)
        line[m, :3] = (sh[m, :3]*0.72).astype(np.uint8); line[m, 3] = 255
    out[~al] = line[~al]
    return out

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
