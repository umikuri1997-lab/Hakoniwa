"""3Dの試作（proto3d）：ゲームの草原の最初のマップ（新しいゲーム）のまん中 N×N マスを、試作の地形と物にする。
  python3 proto3d/make_map.py <map0.json>
map0.json は、ゲームから取り出したマップ（W・H・ground・hi・floor・obj・ref・rev・fieldSites）。
書く物：
  proto3d/map0.js：地形（段の高さ・水・浅瀬・道・家の床・よみがえった草地）と、置く物の場所（マスと名前）
  proto3d/tex/map.glb：置く物の3D。ゲームのドット絵を作った3Dの設計図（tools/art/furn3d/items・sacred-tree/sacred_tripo.py）から組んだ三角形と色。
    単位はマス（x 東・y 上・z 南）。マスの左上のかどが (0,0)。UV は xatlas で展開（試作の材質の絵をのせる）。
  木・ベリーのしげみ・雑草は、試作の植物（plants.glb）を置く（main.js）。
  家の壁・ドアは、ゲームの3D（tools/art/iso/iso_conn.py・iso_door.py）の設計図と同じ大きさの板（あつさ0.3・高さ2.0・ドアははば0.7・高さ1.4）。家の床（フローリング）は、あつさ0.05の板。"""
import json, os, sys
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE); ART = os.path.join(ROOT, 'tools', 'art')
sys.path[:0] = [HERE, ART, os.path.join(ART, 'furn3d'), os.path.join(ART, 'furn3d', 'items'), os.path.join(ART, 'sacred-tree')]
import glbio
import oblique3d as O

X0, Y0, N = 38, 36, 32   # 取り出すはんい（ゲームのマス）：家・こわれた神殿・池・畑・御神木の切り株が入る所

_init = O.Tex.__init__
def _tinit(self, path, *a, **k):
    _init(self, path, *a, **k); self.path = os.path.basename(path)
O.Tex.__init__ = _tinit
TEXMAT = {'wood049.png': 'wood', 'rock030.png': 'stone', 'bark001.png': 'bark'}   # 設計図の絵 → 試作の材質の絵（main.js の MATIDX）
MATIDX = {'wood': 1, 'stone': 2, 'metal': 3, 'cloth': 4, 'bark': 5, 'leaf': 6, 'soil': 7}
BASEMAT = {'rock': 'stone', 'deadtree': 'bark', 'sacred': 'bark', 'farm': 'soil', 'kinoko': 'cloth'}   # 設計図に絵の指定がない所の材質（どの面にも絵をはる。持ち主がきめた）


def fill_mat(o, C, mt):
    """絵の指定がない三角形（0）に材質をつける。神殿は色でわける：緑→葉・金色→金属・青→布・水色の水晶→金属・ほか→石"""
    mt = mt.copy(); z = mt == 0
    if not z.any(): return mt
    if o == 'statueb':
        r, g, b = C[:, 0], C[:, 1], C[:, 2]
        k = np.where(g > r + 15, MATIDX['leaf'], np.where((r > 190) & (g > 160) & (b < 150), MATIDX['metal'], np.where(b > r + 30, np.where((b > 230) & (g > 180), MATIDX['metal'], MATIDX['cloth']), MATIDX['stone'])))
        mt[z] = k[z]
    else:
        mt[z] = MATIDX[BASEMAT[o.split('_')[0]]]
    return mt


def scene_tris(M):
    """furn3d の設計図 → 三角形 [n,3,3]（x 東・y 南・z 上）・色 [n,3]（sRGB 0〜255）・材質の番号 [n]"""
    import furn3d as F3
    sc, _ = F3.scene(M, 0)
    P = np.array([[t[0], t[1], t[2]] for t in sc.t]); C = np.array([t[3] for t in sc.t])
    mat = []
    for t in sc.t:
        tx = sc.tx.get(t[4]); m = getattr(tx, 'path', None) if tx is not None else None
        mat.append(MATIDX.get(TEXMAT.get(m, ''), 0))
    return P, C, np.array(mat, float), np.array([t[4] for t in sc.t])


def item(iid, var=None):
    import furn3d as F3
    M = F3.load(iid); v = M.VIEWS[0]
    if var is None and len(v) > 2: var = v[2]
    M.VAR = var
    return scene_tris(M)


def sacred_stump():
    import sacred_tripo as SQ
    V, comps = SQ.load(); M = SQ.Stage(V, comps, 'stump')
    return scene_tris(M)


def box(x0, y0, z0, x1, y1, z1, col, mat):
    """箱の三角形（x 東・y 南・z 上）"""
    global _bid
    _bid += 1
    v = [(x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0), (x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1)]
    f = [(4, 5, 6), (4, 6, 7), (0, 2, 1), (0, 3, 2), (0, 1, 5), (0, 5, 4), (2, 3, 7), (2, 7, 6), (1, 2, 6), (1, 6, 5), (3, 0, 4), (3, 4, 7)]
    P = np.array([[v[a], v[b], v[c]] for a, b, c in f], float)
    return P, np.tile(col, (len(P), 1)).astype(float), np.full(len(P), MATIDX[mat], float), np.full(len(P), _bid)
_bid = 0


WALLC = (196, 150, 104); DOORC = (170, 120, 80); FLOORC = (186, 140, 96); WT, WH = 0.3, 2.0   # 家の壁（木の壁 hwall）：色・あつさ・高さ


def wall(m):
    """壁のマス（m：となりの壁・ドア 左1・右2・上4・下8）：まん中の柱と、となりへのびる腕"""
    t = WT / 2; L = [box(.5 - t, .5 - t, 0, .5 + t, .5 + t, WH, WALLC, 'wood')]
    if m & 1: L.append(box(0, .5 - t, 0, .5 - t, .5 + t, WH, WALLC, 'wood'))   # 腕は柱のはしから（柱とかさねない。同じ場所の面がちらつく）
    if m & 2: L.append(box(.5 + t, .5 - t, 0, 1, .5 + t, WH, WALLC, 'wood'))
    if m & 4: L.append(box(.5 - t, 0, 0, .5 + t, .5 - t, WH, WALLC, 'wood'))
    if m & 8: L.append(box(.5 - t, .5 + t, 0, .5 + t, 1, WH, WALLC, 'wood'))
    return cat(L)


def door(h):
    """ドア（h：東西の壁の中）：両わきの柱（はば0.15）・上のかもい（1.4〜2.0）・とびら（はば0.7・高さ1.4・あつさ0.06）"""
    t = WT / 2; L = []
    if h:
        L += [box(0, .5 - t, 0, .15, .5 + t, 1.4, WALLC, 'wood'), box(.85, .5 - t, 0, 1, .5 + t, 1.4, WALLC, 'wood'), box(0, .5 - t, 1.4, 1, .5 + t, WH, WALLC, 'wood'), box(.15, .47, 0, .85, .53, 1.4, DOORC, 'wood')]
    else:
        L += [box(.5 - t, 0, 0, .5 + t, .15, 1.4, WALLC, 'wood'), box(.5 - t, .85, 0, .5 + t, 1, 1.4, WALLC, 'wood'), box(.5 - t, 0, 1.4, .5 + t, 1, WH, WALLC, 'wood'), box(.47, .15, 0, .53, .85, 1.4, DOORC, 'wood')]
    return cat(L)


def cat(L):
    return tuple(np.concatenate([a[i] for a in L]) for i in range(4))


def orient(P, pid):
    """面の表を外に向ける（設計図の三角形は、ならびの向きがそろっていない。ドット絵の写し方は裏表を見ないので）。
    部品ごとに：小さな部品（箱・つつなど、三角形 SMALL まで）は、三角形ごとに部品のまん中から外へ。大きな部品（トリポのモデル）は、外を向く三角形が半分より少なければ、ぜんぶを逆に"""
    P = P.copy()
    for q in np.unique(pid):
        s = np.where(pid == q)[0]; T = P[s]; N = np.cross(T[:, 1]-T[:, 0], T[:, 2]-T[:, 0]); d = np.einsum('ij,ij->i', N, T.mean(1)-T.reshape(-1, 3).mean(0))
        flip = d < 0 if len(s) <= SMALL else np.full(len(s), (d > 0).mean() < .5)
        P[s[flip]] = P[s[flip]][:, [0, 2, 1]]
    return P
SMALL = 400


def to_mesh(P, C, mat, pid):
    """三角形 → glb のメッシュ（y 上・z 南。面の表は外。xatlas の UV。色は linear）"""
    P = orient(P[:, :, [0, 2, 1]], pid).reshape(-1, 3); idx = np.arange(len(P)).reshape(-1, 3)
    vm, ni, uv = glbio.unwrap(P, idx)
    col = (np.repeat(C, 3, 0) / 255.0) ** 2.2; mt = np.repeat(mat, 3)
    return {'POSITION': P[vm], 'COLOR_0': col[vm], 'TEXCOORD_0': uv[vm], '_MAT': mt[vm][:, None]}, ni


def main(src):
    m = json.load(open(src)); W = m['W']; rv = set(m['rev']); ref = m['ref']; root = m.get('fieldSites', {}).get('root')
    J = lambda x, y: (Y0 + y) * W + X0 + x
    hi = [[m['hi'][J(x, y)] for x in range(N)] for y in range(N)]
    kind = [['w' if m['ground'][J(x, y)] == 1 else 's' if m['ground'][J(x, y)] == 2 else 'p' if m['floor'][J(x, y)] == 'path' else 'f' if m['floor'][J(x, y)] == 'floor' else 'g' for x in range(N)] for y in range(N)]
    grass = [[1 if J(x, y) in rv else 0 for x in range(N)] for y in range(N)]
    objs = []; need = {}
    def isw(x, y): return 0 <= x < N and 0 <= y < N and m['obj'][J(x, y)] in ('hwall', 'door')
    for y in range(N):
        for x in range(N):
            o = m['obj'][J(x, y)]
            if not o or o == 'part' or str(J(x, y)) in ref: continue
            if o == 'hwall':
                mm = (1 if isw(x - 1, y) else 0) | (2 if isw(x + 1, y) else 0) | (4 if isw(x, y - 1) else 0) | (8 if isw(x, y + 1) else 0); o = 'hwall_%d' % mm
            elif o == 'door': o = 'door_' + ('h' if isw(x - 1, y) or isw(x + 1, y) else 'v')
            elif o == 'farm':
                f = lambda a: 0 <= a < N and m['obj'][J(a, y)] == 'farm'
                o = 'farm_%d' % ((1 if f(x - 1) else 0) | (2 if f(x + 1) else 0))
            elif o in ('weedc', 'weed0k', 'weed0g'): o = 'weed'
            objs.append([x, y, o]); need[o] = 1
    for y in range(N):
        for x in range(N):
            if kind[y][x] == 'f': objs.append([x, y, 'floor']); need['floor'] = 1
    if root is not None and X0 <= root % W < X0 + N and Y0 <= root // W < Y0 + N:
        objs.append([root % W - X0, root // W - Y0, 'sacred']); need['sacred'] = 1
    meshes = []
    for o in sorted(need):
        if o in ('weed', 'ntree', 'berry'): continue   # 木・ベリーのしげみ・雑草は、試作の植物（plants.glb の T・B・F。持ち主がきめた）
        if o.startswith('hwall_'): P, C, mt, pid = wall(int(o[6:]))
        elif o.startswith('door_'): P, C, mt, pid = door(o[5:] == 'h')
        elif o == 'floor': P, C, mt, pid = box(0, 0, 0, 1, 1, .05, FLOORC, 'wood')
        elif o.startswith('farm_'): P, C, mt, pid = item('farm', (int(o[5:]), False))
        elif o == 'sacred': P, C, mt, pid = sacred_stump()
        elif o == 'kinoko': P, C, mt, pid = item('nat_kinoko0')
        else: P, C, mt, pid = item({'statueb': 'statueb', 'deadtree': 'nat_deadtree', 'rock': 'nat_rock'}[o])
        mt = fill_mat(o, C, mt); att, ni = to_mesh(P, C, mt, pid); meshes.append((o, att, ni)); print(o, len(ni), '三角形')
    glbio.write(meshes, os.path.join(HERE, 'tex', 'map.glb'), 'proto3d make_map.py')
    js = '// ゲームの草原の最初のマップ（新しいゲーム）のまん中 %d×%d マス（ゲームのマス x %d〜・y %d〜）。proto3d/make_map.py が書く\n' % (N, N, X0, Y0)
    js += 'export const MAP=' + json.dumps({'n': N, 'hi': hi, 'kind': [''.join(r) for r in kind], 'grass': [''.join(map(str, r)) for r in grass], 'objs': objs}, separators=(',', ':')) + ';\n'
    open(os.path.join(HERE, 'map0.js'), 'w').write(js); print('物', len(objs))


if __name__ == '__main__':
    main(sys.argv[1])
