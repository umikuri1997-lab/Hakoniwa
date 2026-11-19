"""コワイノのトリポのモデル（split18.py で分けた kg_<しゅるい>.glb、色なし）に色をつけて、ドット絵に写す。
  python3 tools/art/kowaino3d/kowaino_paint.py <分けたフォルダ> <出力フォルダ> [しゅるい...]
色のつけ方：
  ・近い点をまとめて（weld）、三角形のつながりで部品に分ける（星・すそのかざり・手・ぽんぽん など、べつの部品になっている物がある）。
  ・体の部品の中は、目じるしの場所（たね）から、面の向きが急にかわる所（折れ目、ANG 度）までぬりひろげて、顔・手・ずきんなどを分ける。
  ・目はモデルにないので、顔の面の上に、うすい色のたての だ円をのせる。
写し方：まっすぐ正面から、焦点距離 FOCAL（50mm）のカメラで、1ドット＝1で写す（高さはいまのチップに合わせる HPX）。"""
import math, os, sys
import numpy as np, trimesh
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE); sys.path.insert(0, os.path.dirname(HERE))
import oblique3d as O
from weld import weld

FOCAL = 50.0; ANG = 40   # 前向きも後ろ向きも、まっすぐ正面から、焦点距離50mm（35mm判）のカメラで写す（持ち主がきめた）
hx = lambda h: np.array([int(h[i:i+2], 16) for i in (1, 3, 5)], float)

# しゅるいごとの色と目じるし。場所は高さ1のときの (よこ x, 高さ z)。front：前からのたね
import kw_tex
CFG = {
    'basic': dict(model=os.path.join(HERE, 'models', 'kg_basic.glb'),   # 持ち主が直したモデル＋手（kw_model.py）
                  labcol={'base': '#6f6487', 'rim': '#2c2440', 'under': '#2c2440', 'face': '#241c33', 'deco': '#b9aab6', 'pom': '#c8bcc8', 'hand': '#241c33'},
                  HPX=41, base='#6f6487', lining=True, hem=('#ac9776', 0.03), under='#2c2440', legs=('#342b44', 0.1),
                  eyes=dict(x=0.085, z=0.52, rx=0.03, rz=0.075, col='#c2afae', edge='#9e8a92')),
    'basic_old': dict(HPX=54, thin=0, hem=('#ac9776', 0.03), under='#2c2440', lining='#2c2440', base='#685d7f', parts='#b9aab6', legs=('#342b44', 0.1), eyes=dict(x=0.085, z=0.52, rx=0.03, rz=0.075, col='#c2afae', edge='#9e8a92'),
                  seeds=[('hood', 0.0, 0.85, '#6f6487', 0), ('face', 0.0, 0.52, '#241c33', 1),
                         ('handL', -0.1, 0.37, '#a597ba', 1), ('handR', 0.06, 0.37, '#a597ba', 1)],
                  pom=((0.36, 0.5), '#c8bcc8'), tip=0, cone=((0.136, -0.292, 0.883), (-0.013, -0.231, 0.808)), fingers=True, apart=0.07),
}

def mk(name, size, cloth, dark, deco, eye, pom=None, edge=None, hand=None, mats=None, **kw):
    """持ち主が直したモデル（models/kg_<名前>.glb）の色わけで写すときの色。布・裏地と顔（こい色）・かざり・目。大きさはゲームの size（1で54ドット。コカゲは HPX=41・size .75）"""
    return dict(model=os.path.join(HERE, 'models', 'kg_%s.glb' % name), HPX=round(54*size), base=cloth,
                labcol={'base': cloth, 'under': dark, 'red': dark, 'face': dark, 'deco': deco, 'pom': pom or deco, 'hand': hand or dark},
                mats=dict({'base': 'fabric', 'red': 'fabric', 'pom': 'fabric'}, **(mats or {})),
                eyes=dict(x=0.085, rx=0.03, rz=0.075, col=eye, edge=edge or eye), **kw)
CFG.update({   # 色は、いまのゲームの絵（ない物は、night.js の col・eye・tint）から
    'fast': mk('fast', .8, '#5e5480', '#1f1a33', '#5b7fae', '#a9c4e0', hand='#8a84b4', mats={'deco': 'fabric'}),
    'thief': mk('thief', .9, '#6a5468', '#231a2c', '#8f7a56', '#e0cc94', mats={'deco': 'fabric'}, sack='#d4a86e'),   # sack：ふくろ（体とはなれた布のかたまり）の色。体の紫ととけこまないように、あかるい麻の色（持ち主のたのみ）
    'brute': mk('brute', 1.25, '#4a4262', '#1b1628', '#968a9e', '#c2afae', hand='#8c80a0', mats={'deco': 'rock'}),
    'breaker': mk('breaker', 1.1, '#5e5474', '#1d1729', '#8c8496', '#c2afae', hand='#8c80a0', mats={'deco': 'metal'}),
    'trapper': mk('trapper', .95, '#3e3654', '#171223', '#c4b2b0', '#c2afae', nohand=True, mats={'deco': 'gloss'}),
    'ash': mk('ash', .9, '#7a6a7a', '#251c2e', '#a09098', '#d8c8c8', mats={'deco': 'rock'}),
    'rockc': mk('rockc', 1.3, '#6c5e70', '#211a2a', '#9b888c', '#c2afae', hand='#8a7a80', mats={'deco': 'rock', 'hand': 'rock'}),
    'armor': mk('armor', 1.3, '#4e4e60', '#1a1a24', '#8c92a2', '#9fe0ff', mats={'deco': 'metal'}),
    'shiny': mk('shiny', .8, '#e2d498', '#5a4f2a', '#fff2b0', '#ffffff', edge='#f0e6c0'),
    'hana': mk('hana', 1, '#806a78', '#2c2229', '#d9b0c4', '#f2d2e0', mats={'deco': 'gloss'}, gloss=([(0.12, 0.18), (0.36, 0.42), (0.66, 0.72), (0.86, 0.9)], [(-38, 8), (-20, 5), 0, (12, -4), (22, -10)])),   # 花びら・落ち葉：ハイライトとかげを強く（持ち主）
    'hoteri': mk('hoteri', 1, '#74503f', '#281a14', '#d99a72', '#f0bb88', mats={'deco': 'gloss'}, gloss=([(0.0, 0.06), (0.2, 0.26), (0.5, 0.56), (0.7, 0.76)], [3, 2, 0, (14, -8), (32, -28)])),   # 細いので、つやの光を広く,
    'ochiba': mk('ochiba', .8, '#73604a', '#271e15', '#c8a378', '#f0d4a0', mats={'deco': 'gloss'}, gloss=([(0.12, 0.18), (0.36, 0.42), (0.66, 0.72), (0.86, 0.9)], [(-38, 8), (-20, 5), 0, (12, -4), (22, -10)])),   # 花びら・落ち葉：ハイライトとかげを強く（持ち主）
    'yuki': mk('yuki', 1.3, '#8a939e', '#272d34', '#e4ecf2', '#e6f0f6', pom='#f4faff', pomh=0.0, mats={'deco': 'ice'}),
})

# パーティクル：コードで描く小さなドット絵（ドットごとの文字：a 明るい・b ふつう・c こい（ふち）。年れい 0・1・2 で ちぢむ・うすれる）
# 色は3だん（明るい・ふつう・ふち）。ふちは黒にしない。体の色の数（quant）とは べつに、あとから おす（目と同じ）
FXCOL = {'dust': ('#efe6d2', '#d8ccb4', '#b8aa90'), 'ash': ('#cfc8d2', '#aaa2ae', '#857d8a'), 'spark': ('#fffef0', '#fff0a8', '#e8c870'),
         'ember': ('#fff0b0', '#f6a860', '#d07040'), 'snow': ('#ffffff', '#eef4fa', '#c8d4e0'), 'leaf': ('#e8c080', '#c49a66', '#9a7448'),
         'petal': ('#fbe4ee', '#eab8cc', '#c890a8'), 'sweat': ('#f0f8ff', '#b8dcf4', '#88b4d8'), 'star': ('#fffbe0', '#ffe08a', '#e0b050'),
         'slash': ('#ffffff', '#ece8ff', '#c0b8e0'), 'impact': ('#ffffff', '#fff6d8', '#e8d090')}
FXBMP = {
    'gdust': ['...bab..b...|.bbaabbaab..|bcbbcbbbcbbc', '..b..ba..b..|.b.bc..cb.b.|b.c......c.b', '.b........b.|............|c..........c'],   # 地面すれすれの 土ぼこり（よこに のびる でこぼこの すじ。丸い玉にしない。持ち主）
    'flake': ['ab.|.bc', 'ab|.c', 'b'],   # 灰の かけら
    'spark': ['..a..|..b..|abaab|..b..|..a..', '.a.|aba|.a.', 'a'],
    'ember': ['.c.|cab|.b.', 'ab|bc', 'b'],
    'snow': ['.a.|aba|.a.', 'ab|ba', 'a'],
    'leaf': ['..cb|.bab|bab.|c...', '.b|bab|b.', 'b'],
    'petal': ['.bb.|baab|.bc.', 'ba|cb', 'b'],
    'sweat': ['.a.|aab|abb|.c.', 'a|b', 'b'],
    'star': ['..a..|.aba.|abbba|.aba.|..a..', '.a.|aba|.a.', 'a'],
    'slash': ['.......aa|.....aab.|....ab...|...ab....|..ab.....|.ab......|ab.......', '.....ab|...ab..|.ab....|ab.....', '..b|.b.|b..'],
    'impact': ['...a...|...a...|..bab..|aaabaaa|..bab..|...a...|...a...', 'b...a...b|.b..a..b.|.........|.........|aa.....aa|.........|.........|.b..a..b.|b...a...b', 'a.....a|.......|.......|.......|.......|.......|a.....a'],   # うった所：かたい十字の光 → 外へとぶ すじ → きえる
}
def _arc(R, th, a0, a1, dots=False):
    """大きな三日月の すじ（ドット）：半径 R・はば th（先ほど細い）、a0〜a1 度（0 が右、上が 90）。a：外がわの白・b：中・c：先"""
    n = 2*R+3; g = [['.']*n for _ in range(n)]; c = R+1
    for y in range(n):
        for x in range(n):
            dx, dy = x-c, c-y; r = math.hypot(dx, dy); a = math.degrees(math.atan2(dy, dx))
            t = ((a-a0) % 360)/max(1e-9, (a1-a0) % 360)
            if t > 1: continue
            w = th*math.sin(math.pi*min(1, t*1.15))   # まん中が太く、両はしが細い
            if R-w <= r <= R+0.5 and w > 0.4:
                if dots and (x+y) % 2: continue
                g[y][x] = 'a' if r > R-1 else ('c' if t > 0.8 else 'b')
    rows = [''.join(r) for r in g]; rows = [r for r in rows if r.strip('.')] or ['.']
    return '|'.join(rows)
FXBMP['swipe'] = [_arc(15, 4.5, 200, 20), _arc(16, 2.6, 190, 30), _arc(17, 1.2, 180, 40, True)]   # 大きな ひっかき・なぎはらいの すじ（右下から右上へ）
FXBMP['swipeL'] = ['|'.join(r[::-1] for r in b.split('|')) for b in FXBMP['swipe']]   # 左へ
def _ell(Rx, Ry, th, a0, a1):
    """まわる ひっかきの わ（ドット）：よこ Rx・たて Ry の だ円の a0〜a1 度（0 が右、手前が 270）。はば th（あとほど細い）。a：外がわ・b：中・c：先"""
    W, Hh = 2*Rx+3, 2*Ry+int(th)+4; g = [['.']*W for _ in range(Hh)]; cx, cy = Rx+1, Ry+1
    for y in range(Hh):
        for x in range(W):
            dx, dy = (x-cx)/Rx, (cy-y)/Ry; a = math.degrees(math.atan2(dy, dx)); t = ((a-a0) % 360)/max(1e-9, (a1-a0) % 360)
            if t > 1: continue
            w = th*t**0.8   # 先（a1）が いちばん太い（つめの いる所）
            r = math.hypot(dx, dy); d = (r-1)*Ry   # だ円の ふちからの たての はなれ（ドット）
            if -w <= d <= 0.5 and w > 0.4:
                g[y][x] = 'a' if d > -1 else ('c' if t < 0.35 else 'b')
    rows = [''.join(r) for r in g]; rows = [r for r in rows if r.strip('.')] or ['.']
    return '|'.join(rows)
FXBMP['spin'] = [_ell(25, 8, 3.2, 150, 350), _ell(26, 8, 2.0, 170, 360), _ell(27, 9, 1.0, 190, 10)]   # まわって ひっかく わ（左の おくから 手前を とおって 右へ）
FXCOL['spin'] = ('#ffffff', '#e4defc', '#b8acdc')
FXCOL['swipe'] = FXCOL['swipeL'] = ('#ffffff', '#e4defc', '#b8acdc')
FXSHAPE = {'spin': 'spin', 'swipe': 'swipe', 'swipeL': 'swipeL', 'dust': 'gdust', 'ash': 'flake', 'spark': 'spark', 'ember': 'ember', 'snow': 'snow', 'leaf': 'leaf', 'petal': 'petal', 'sweat': 'sweat', 'star': 'star', 'slash': 'slash', 'impact': 'impact'}
FXMOVE = {'spin': (0, 0, 0, 0), 'dust': (0, 0, 0, 0.6), 'ash': (0, 0, 0.06, 0.8), 'spark': (0, 0, 0.02, 1.2), 'ember': (0, 0, 0.1, 0.6), 'snow': (0, 0, -0.06, 0.6), 'leaf': (0, 0, -0.05, 0.9),
          'petal': (0, 0, -0.04, 1.0), 'sweat': (0, 0, -0.05, 0.3), 'star': (0, 0, 0, 0.0), 'slash': (0, 0, 0, 0), 'impact': (0, 0, 0, 0), 'swipe': (0, 0, 0, 0), 'swipeL': (0, 0, 0, 0)}   # (…, …, 上へ（コマごと）, ひろがる速さ（コマごと、ひろがりの倍）)
FADEN = 4   # きえるとき、ほどけた ドットの 1/FADEN が つぶになって のぼる
FADEUP = 20   # つぶの のぼる高さ（ドット。ほどけきるときに）
FXLIFE = 3   # パーティクルは 3コマ のこる（年れい 0・1・2）

def fxparts(frames, name):
    """コマごとの fx（kw_skel）から、コマごとの パーティクル [(しゅるい, 3Dの場所（高さのうち）, 年れい)] を作る。出たパーティクルは、つぎのコマで 年をとり、うごく（同じ粒）"""
    import zlib
    out = [[] for _ in frames]
    for i, f in enumerate(frames):
        mv = np.array(f.get('move', (0, 0, 0)), float)
        for kind, at, n, spr, sz in f.get('fx', ()):
            rs = np.random.RandomState(zlib.crc32(('%s|%s|%d|%d' % (name, kind, i, n)).encode()))
            for k in range(n):
                off = (rs.rand(3)*2-1)*np.array([1, 0.6, 0.8])*spr if n > 1 else np.zeros(3); vz = FXMOVE[kind][2]; sp = FXMOVE[kind][3]
                if kind == 'dust': off[2] = 0; at = (at[0], at[1], 0.02)   # 土ぼこりは 地面に
                for age in range(FXLIFE):
                    j = i+age
                    if j >= len(frames) or (j > i and frames[j].get('fade')): break   # きえる コマには、前の コマの つぶを のこさない
                    out[j].append((kind, np.array(at, float)+mv+off*(1+sp*age)+np.array([0, 0, vz*age]), age))
    return out

def stampfx(im, pts):
    """パーティクルを おす（pts：(しゅるい, 絵の上の x, y, 年れい)）"""
    a = np.array(im)
    for kind, X, Y, age in pts:
        rows = FXBMP[FXSHAPE[kind]][min(age, 2)].split('|'); col = {k: list(hx(c).astype(int))+[255] for k, c in zip('abc', FXCOL[kind])}
        h, w = len(rows), len(rows[0]); x0, y0 = int(round(X-w/2)), int(round(Y-h/2))
        for r, row in enumerate(rows):
            for q, ch in enumerate(row):
                if ch in col and 0 <= y0+r < a.shape[0] and 0 <= x0+q < a.shape[1]: a[y0+r, x0+q] = col[ch]
    return Image.fromarray(a)

def load_labeled(path):
    """kw_model.py で書き出した、マテリアルつきの glb（マテリアルの名前が色わけの名前）→ (m, comp, lab)"""
    sc = trimesh.load(path); V = []; F = []; L = []; o = 0
    for n, g in sc.geometry.items():
        T = sc.graph[[k for k in sc.graph.nodes_geometry if sc.graph[k][1] == n][0]][0]; g2 = g.copy(); g2.apply_transform(T)
        V.append(g2.vertices); F.append(g2.faces+o); L += [g.visual.material.name]*len(g2.faces); o += len(g2.vertices)
    m = weld(trimesh.Trimesh(vertices=np.vstack(V), faces=np.vstack(F), process=False)); F_ = m.faces
    cc = sorted(trimesh.graph.connected_components(m.face_adjacency, min_len=1, nodes=np.arange(len(F_))), key=len, reverse=True)
    comp = np.zeros(len(F_), int)
    for i, c in enumerate(cc): comp[c] = i
    return m, comp, np.array(L, object)

def paint_labeled(m, comp, lab0, cfg):
    """マテリアルの色わけ（lab0）から、色をきめる。布は1つの色。ずきんの裏地は、顔のまわりの布をひとまわり（持ち主の写真の所。モデルにマテリアルがないので）"""
    V = m.vertices; F = m.faces; H = m.bounds[1][1]; P = np.stack([V[:, 0], V[:, 2], V[:, 1]], 1); cen = P[F].mean(1)/H
    lab = np.array(['base' if l == 'cloth' else l for l in lab0], object)
    red = np.nonzero(lab == 'red')[0]
    if len(red):   # 赤：ぽんぽんと裏地。赤どうしでつながったかたまりごとに、顔にふれず、上のほう（POMH より上）にあるのが、ぽんぽん
        from scipy.sparse import coo_matrix
        from scipy.sparse.csgraph import connected_components
        rv = np.zeros(len(V), bool); rv[F[red].ravel()] = True
        A = coo_matrix((np.ones(len(red)*3), (np.repeat(np.arange(len(red)), 3), F[red].ravel())), shape=(len(red), len(V))).tocsr()
        _, rl = connected_components(A@A.T, directed=False); fv = np.zeros(len(V), bool); fv[F[lab == 'face'].ravel()] = True
        for q in np.unique(rl):
            ks = red[rl == q]
            if cen[ks, 2].mean() > cfg.get('pomh', POMH) and not fv[F[ks].ravel()].any() and len(ks) < 0.5*len(red): lab[ks] = 'pom'   # 裏地（大きなかたまり）はのぞく
    if cfg.get('lining'):
        vf = set(F[lab == 'face'].ravel())
        for k in range(len(F)):
            if lab[k] == 'base' and vf & set(F[k]) and cen[k, 1] > 0: lab[k] = 'rim'
    fc = np.nonzero(lab == 'face')[0]
    if len(fc) and cfg.get('model'):   # 顔の色（青）のかたまりを、顔・足・手にわける：地面にとどくのが足、のこりのうち上のほうでいちばん大きいのが顔、ほかは手
        from scipy.sparse import coo_matrix
        from scipy.sparse.csgraph import connected_components
        A = coo_matrix((np.ones(len(fc)*3), (np.repeat(np.arange(len(fc)), 3), F[fc].ravel())), shape=(len(fc), len(V))).tocsr()
        _, fl = connected_components(A@A.T, directed=False); ar = m.area_faces; best = None
        for q in np.unique(fl):
            ks = fc[fl == q]
            if V[F[ks], 1].min() < 0.05*H:   # 地面にとどくかたまり：すその広さの FOOTR より内がわの下のほうが足、ほかは（足にくっついた）手
                rr = np.hypot(cen[ks, 0], cen[ks, 1]); lo = (m.vertices[:, 1] < 0.25*H); rs = np.percentile(np.hypot(V[lo, 0], V[lo, 2]), 95)/H
                ft = (rr < FOOTR*rs) & (cen[ks, 2] < 0.25)
                if ft.mean() < 0.2 and not NOFIST: ft[:] = False   # 足から切りはなした大きなこぶし（地面にとどく）は、ぜんぶ手
                if (lab0 == 'hand').any(): ft[:] = True   # 手を べつの部品（マテリアル「手」）で足したモデル：地面にとどく 顔の色の かたまりは、ぜんぶ足
                lab[ks[ft]] = 'foot'; lab[ks[~ft]] = 'hand'; continue
            if best is None or cen[ks, 2].mean() > cen[best, 2].mean(): best = ks   # 顔は、いちばん高い所のかたまり
        for q in np.unique(fl):
            ks = fc[fl == q]
            if lab[ks[0]] == 'face' and (best is None or ks[0] not in set(best.tolist())) and not cfg.get('nohand'): lab[ks] = 'hand'   # nohand：手のない コワイノ（顔の色の 小さな かたまりは、口の中など 顔のつづき）
    COLS = cfg['labcol']; col = np.array([hx(COLS.get(l, COLS.get('face' if l in ('foot', 'hand') else l, cfg['base']))) for l in lab])
    return P, F, col, lab, H, cen

def load(path):
    m = weld(list(trimesh.load(path).geometry.values())[0]); F = m.faces
    cc = sorted(trimesh.graph.connected_components(m.face_adjacency, min_len=1, nodes=np.arange(len(F))), key=len, reverse=True)
    comp = np.zeros(len(F), int)
    for i, c in enumerate(cc): comp[c] = i
    return m, comp

POMC = []

def paint(m, comp, cfg):
    V = m.vertices; F = m.faces; H = m.bounds[1][1]; P = np.stack([V[:, 0], V[:, 2], V[:, 1]], 1); cen = P[F].mean(1)/H
    nb = {}
    for (a, b), t in zip(m.face_adjacency, m.face_adjacency_angles):
        nb.setdefault(a, []).append((b, t)); nb.setdefault(b, []).append((a, t))
    def seed(x, z, front):
        ok = (comp == 0) & ((cen[:, 0]-x)**2+(cen[:, 2]-z)**2 < 0.06**2); idx = np.nonzero(ok)[0]
        if not len(idx): idx = np.array([min(np.nonzero(comp == 0)[0], key=lambda k: (cen[k, 0]-x)**2+(cen[k, 2]-z)**2)])
        return int(idx[np.argmax(cen[idx, 1] if front else -cen[idx, 1])])
    def grow(s):
        th = math.radians(ANG); reg = {s}; st = [s]
        while st:
            k = st.pop()
            for j, t in nb.get(k, []):
                if j not in reg and t < th and comp[j] == 0: reg.add(j); st.append(j)
        return reg
    col = np.tile(hx(cfg['base']), (len(F), 1)); lab = np.array(['base']*len(F), object)
    for nm, x, z, c, front in cfg['seeds']:
        for k in grow(seed(x, z, front)): col[k] = hx(c); lab[k] = nm
    if cfg.get('lining'):   # ずきんの裏地：まだどこにも入っていない体の面のうち、手より上で前がわ（ずきんの内がわの帯。持ち主の写真の所）
        hz = max(cen[k, 2] for k in range(len(F)) if lab[k].startswith('hand')) if any(l.startswith('hand') for l in lab) else 0.4
        for k in range(len(F)):
            if comp[k] == 0 and lab[k] == 'base' and cen[k, 2] > hz-0.02 and cen[k, 1] > 0: col[k] = hx(cfg['lining']); lab[k] = 'rim'
    if cfg.get('pom'):   # ぽんぽん：玉の形（ずきんの面のうち、目じるしの近くの点のまん中から、玉の半径の中にある三角形）
        (px_, pz_), pc = cfg['pom']; vh = np.unique(F[lab == 'hood']); Q = P[vh]/H
        near = vh[((Q[:, 0]-px_)**2+(Q[:, 2]-pz_)**2) < 0.1**2]
        if len(near):
            c0 = P[near].mean(0); r0 = np.percentile(np.linalg.norm(P[near]-c0, axis=1), 70)
            for k in np.nonzero(lab == 'hood')[0]:
                if np.linalg.norm(P[F[k]]-c0, axis=1).max() < r0*1.12: col[k] = hx(pc); lab[k] = 'pom'
            vp = np.unique(F[lab == 'pom'])
            if len(vp):   # さかい目は、写すドットごとに、玉のまん中からのきょりできめる（pomf）。まん中・半径は、ぽんぽんの点だけから
                bd = np.array(sorted(set(vp) & set(F[lab == 'hood'].ravel())))   # ぽんぽんと、ずきんの先がつながる所の点
                c1 = P[vp].mean(0); cb = P[bd].mean(0) if len(bd) else c1+np.array([0, 0, 0.05*H])
                ax = (cb-c1)/max(1e-9, np.linalg.norm(cb-c1))
                if len(bd) >= 3:   # つながる所の輪の面の向き（いちばんうすい向き）。玉がわから、つながる所へ向ける
                    n_ = np.linalg.svd(P[bd]-cb)[2][2]; ax = n_ if n_@ax > 0 else -n_
                Am = np.c_[2*P[vp], np.ones(len(vp))]; sol = np.linalg.lstsq(Am, (P[vp]**2).sum(1), rcond=None)[0]   # 玉をあてはめる
                cs = sol[:3]; rs = math.sqrt(max(1e-12, sol[3]+cs@cs))
                POMC[:] = [c1, float((cb-c1)@ax), hx(pc), ax, rs*1.12, cs, rs]   # まん中 cs・半径 rs の玉の面の上で、ずきんの先へつながる向きから POMANG 度より外が、ぽんぽん
    for nm, f, inside, c in cfg.get('boxes', []):
        for k in range(len(F)):
            if lab[k] == inside and f(cen[k]): col[k] = hx(c); lab[k] = nm
    if cfg.get('under'):   # 布の裏がわ：マントのすその下の面（下を向いた面）は、こいかげの色。ずきんの裏地は rim（顔のまわりの帯）
        T = P[F]; fn = np.cross(T[:, 1]-T[:, 0], T[:, 2]-T[:, 0]); fn /= np.maximum(np.linalg.norm(fn, axis=1, keepdims=True), 1e-12)
        c0 = P.mean(0); fn[((T.mean(1)-c0)*fn).sum(1) < 0] *= -1   # 三角形の表と裏がばらばらなので、外向きにそろえる
        for k in range(len(F)):
            if comp[k] == 0 and lab[k] == 'base' and fn[k, 2] < -0.2: col[k] = hx(cfg['under']); lab[k] = 'under'
    lc, lz = cfg['legs']
    for k in range(len(F)):
        if comp[k] == 0 and lab[k] == 'base' and cen[k, 2] < lz: col[k] = hx(lc); lab[k] = 'legs'
        if comp[k] > 0: col[k] = hx(cfg['parts']); lab[k] = 'part'
    return P, F, col, lab, H, cen

def cone(P, F, lab, H, uv):
    """ずきんの先：根もと（uv の2点のまん中。太さは2点のきょりの半分。持ち主がうしろの絵に引いた線のはじまり）から、ぽんぽんのつなぎ目まで、まっすぐ細くなる形にする。
    太さは、その場所のいまの太さのまん中に対する比をのこす（布のふにゃふにゃした感じは、そのまま）。根もとのほうは、少しずつ（もとの形となめらかにつなぐ）"""
    U, L = np.array(uv[0])*H, np.array(uv[1])*H; B = (U+L)/2; rb = np.linalg.norm(U-L)/2
    c1, pr, _, ax = POMC[:4]; A = c1+ax*pr; vb = np.array(sorted(set(F[lab == 'pom'].ravel()) & set(F[lab == 'hood'].ravel())))
    rt = np.linalg.norm(P[vb]-A, axis=1).mean() if len(vb) else 0.05*H
    d = A-B; Ld = np.linalg.norm(d); dh = d/Ld; P = P.copy()
    vh = np.unique(F[lab == 'hood']); T = ((P[vh]-B)@dh)/Ld; rad = P[vh]-(B+np.outer(T*Ld, dh)); cr = np.linalg.norm(rad, axis=1)
    sel = (T > 0) & (T < 1.02) & (cr < np.maximum(rb, rt)*1.8)
    bins = np.clip((T*10).astype(int), 0, 10); med = {b: np.median(cr[sel & (bins == b)]) for b in set(bins[sel].tolist())}
    for i in np.nonzero(sel)[0]:
        t = min(1.0, T[i]); want = rb*(1-t)+rt*t; m_ = med.get(bins[i], cr[i]) or cr[i]
        u = min(1, t/0.3); w = u*u*(3-2*u)   # 根もとは、少しずつ
        P[vh[i]] = B+dh*T[i]*Ld+rad[i]*((1-w)+w*want/max(m_, 1e-9))
    return P

def tipthin(P, F, lab, H, k):
    """ずきんの先（ぽんぽんへのびる所）を細く：ずきんの点を、まわり（TIPR）のずきんの点のまん中へよせる。顔の中心から右へいくほど強く（ずきんの頭の所はかえない）"""
    from scipy.spatial import cKDTree
    vh = np.unique(F[(lab == 'hood') | (lab == 'pom')]); vp = set(F[lab == 'pom'].ravel()); Q = P[vh]; t = cKDTree(Q); P = P.copy()
    for i, v in enumerate(vh):
        u = min(1, max(0, (Q[i, 0]/H-0.05)/0.3)); w = u*u*(3-2*u)   # なめらかに（急にすぼまらない）
        if POMC: w *= min(1, max(0, (np.linalg.norm(Q[i]-POMC[0])/(0.09*H)-1.0)/0.8))   # ぽんぽんのそばは、細くしない
        if w <= 0 or v in vp: continue
        nb = t.query_ball_point(Q[i], 0.07*H); c0 = Q[nb].mean(0); P[v] = Q[i]+(c0-Q[i])*k*w
    return P

def thin(P, F, lab, inner='face', band='rim', outer='hood', k=0.6):
    """布をうすく：ふち（band）の点のうち、内がわ（inner）にふれる点を、外がわ（outer）にふれる、いちばん近い点へ k だけよせる（帯がほそくなる。顔の面もいっしょにのびる）"""
    vi = set(F[lab == inner].ravel()); vb = set(F[lab == band].ravel()); vo = np.array(sorted(set(F[lab == outer].ravel()) & vb))
    if not len(vo): return P
    P = P.copy(); Q = P[vo]
    for v in sorted(vi & vb):
        j = np.argmin(((Q[:, [0, 2]]-P[v, [0, 2]])**2).sum(1)); P[v] = P[v]+(Q[j]-P[v])*k
    return P

EYEPX = ['.++.', '+##+', '####', '####', '####', '+##+', '.++.']   # 目：たてながの まるい形（角をけずる。四角にしない。持ち主がきめた）   # 目のドット（はば4・高さ7の だ円。+ は、ふちの色。いまの絵の目と同じ色）

def eyepos(P, F, lab, H, e):
    """目のまん中（3D）：顔の面のまん中を中心に、左右そろえて、顔の面のいちばん前"""
    fc = P[F].mean(1); f0 = fc[lab == 'face']; fu = f0[f0[:, 2] > 0.3*H]; f0 = fu if len(fu) else f0; cx = (f0[:, 0].min()+f0[:, 0].max())/2; out = []
    for sx in (-1, 1):
        z0 = e['z']*H if 'z' in e else float(np.mean(f0[:, 2]))   # 'z' がなければ、顔のまん中の高さ（足はのぞく）
        x, z = cx+sx*e['x']*H, z0
        near = [k for k in np.nonzero(lab == 'face')[0] if abs(fc[k, 0]-x) < 0.06*H and abs(fc[k, 2]-z) < 0.08*H]
        y = max(fc[k, 1] for k in near) if near else 0.3*H
        out.append(np.array([x, y, z]))
    return out

EYESHUT = ['++++']   # たおされた（いきたえた）目：光がきえて、ほそい線だけ（ふちの色）
def stamp(im, pts, col, edge=None, side=False, shut=False):
    """目：きめたドットの形を、その場所におす（左右でまったく同じ形）。side：体がよこにたおれた（両目のならびが たて）ときは、よこながの形。shut：いきたえた目"""
    E = EYESHUT if shut else EYEPX
    PX = [''.join(r[i] for r in E) for i in range(len(E[0]))] if side else E
    a = np.array(im); c = list(hx(col).astype(int))+[255]; ce = list(hx(edge or col).astype(int))+[255]; h, w = len(PX), len(PX[0])
    for X, Y in pts:
        x0, y0 = int(round(X-w/2)), int(round(Y-h/2))
        for r, row in enumerate(PX):
            for q, ch in enumerate(row):
                if ch in '#+' and 0 <= y0+r < a.shape[0] and 0 <= x0+q < a.shape[1] and a[y0+r, x0+q, 3]: a[y0+r, x0+q] = c if ch == '#' else ce
    return Image.fromarray(a)

SMIT = 12   # 面の向きをならす回数

def smoothshade(P, F, lab, R):
    """ドットごとのかげ：部品（lab）ごとに、点をならした写しの、点の面の向き（外向き）を、近い点からまぜて、光のあたり方を3だんにする"""
    from scipy.spatial import cKDTree
    cache = {}
    def part(name):
        if name in cache: return cache[name]
        fs = F[lab == name]; vs = np.unique(fs); idx = {v: i for i, v in enumerate(vs)}; fl = np.vectorize(idx.get)(fs); Q = P[vs]
        T = Q[fl]; fn = np.cross(T[:, 1]-T[:, 0], T[:, 2]-T[:, 0]); c0 = Q.mean(0)
        fn[((T.mean(1)-c0)*fn).sum(1) < 0] *= -1   # 三角形の表と裏がばらばらなので、外向きにそろえる（面の大きさで重みがつく）
        n = np.zeros_like(Q)
        for j in range(3): np.add.at(n, fl[:, j], fn)
        nbv = [set() for _ in range(len(Q))]
        for a_, b_, c_ in fl: nbv[a_] |= {b_, c_}; nbv[b_] |= {a_, c_}; nbv[c_] |= {a_, b_}
        n /= np.maximum(np.linalg.norm(n, axis=1, keepdims=True), 1e-9)
        for _ in range(SMIT):   # となりの点とまぜて、なめらかに
            n = np.array([n[i]+sum(n[j] for j in nbv[i]) for i in range(len(Q))]); n /= np.maximum(np.linalg.norm(n, axis=1, keepdims=True), 1e-9)
        pts = np.array([R(p) for p in P[vs]]); nr = np.array([R(q) for q in n])
        cache[name] = (cKDTree(pts), nr); return cache[name]
    def mk(base, name):
        t, nr = part(name)
        def f(x, y, z):
            d, i = t.query([x, y, z], k=6); w = 1/np.maximum(d, 1e-6); n = (nr[i]*w[:, None]).sum(0); n /= max(1e-9, np.linalg.norm(n))
            q = float(np.dot(n, O.LIGHT)); lv = 0 if q > 0.55 else 1 if q > 0.1 else 2
            return O.toon(base, lv)
        return f
    return mk

def hemdecal(P, F, lab, comp, H, cfg, yaw):
    """すそのライン：マントの外がわ（base）と、すその下の面（under）のさかい目の線から、hem の高さまでを、その色に（写すドットごと）。
    さかい目は1本につながっているので、どの向きから見ても、とぎれない"""
    from scipy.spatial import cKDTree
    hc, hh = cfg['hem']; vb = set(F[lab == 'base'].ravel()); vu = set(F[lab == 'under'].ravel()); bd = vb & vu
    pts = []; zb = P[np.unique(F[lab == 'base']), 2].min()
    for f in F[lab == 'base']:   # さかい目の辺を、こまかい点にする
        for i in range(3):
            a, b = f[i], f[(i+1) % 3]
            if a in bd and b in bd and max(P[a, 2], P[b, 2]) < zb+HEMTOP*H:   # すそのいちばん下のあたりの さかい目だけ（横のふちを上へのぼらない）
                for t in np.linspace(0, 1, 8): pts.append(P[a]+(P[b]-P[a])*t)
    if not pts: return None
    c, s_ = math.cos(yaw), math.sin(yaw); Q = np.array(pts); Qr = np.stack([Q[:, 0]*c-Q[:, 1]*s_, Q[:, 0]*s_+Q[:, 1]*c, Q[:, 2]], 1)
    t = cKDTree(Qr); col = hx(hc)
    def f(x, y, z):
        d, i = t.query([x, y, z])
        return col if d < hh*H and z >= Qr[i, 2]-0.002*H else None
    return f

HEMR, HEMTOP = 0.07, 0.26

def ellip(sc, c, r, col, n=20, m=12):
    sc.part()
    for j in range(m):
        t0, t1 = math.pi*j/m, math.pi*(j+1)/m
        for i in range(n):
            a0, a1 = 2*math.pi*i/n, 2*math.pi*(i+1)/n
            p = lambda t, a: np.array([c[0]+r[0]*math.sin(t)*math.cos(a), c[1]+r[1]*math.sin(t)*math.sin(a), c[2]+r[2]*math.cos(t)])
            sc.quad(p(t0, a0), p(t1, a0), p(t1, a1), p(t0, a1), col)

def hands(P, F, lab, H, dx):
    """手の場所：もらったモデルの手（handL・handR）の玉のまん中と半径。左右へ dx（高さ1あたり）はなす"""
    out = []
    for nm in ('handL', 'handR'):
        vs = np.unique(F[lab == nm])
        if not len(vs): continue
        c0 = P[vs].mean(0); r = np.percentile(np.linalg.norm(P[vs]-c0, axis=1), 80); out.append([c0, r])
    if len(out) == 2:   # 2つの手のまん中をさかいに、外へはなす（体のまん中 x=0 ではない。もらったモデルの手は左によっている）
        mid = (out[0][0][0]+out[1][0][0])/2
        for h in out: h[0] = h[0]+np.array([(-1 if h[0][0] < mid else 1)*dx*H, 0, 0])
    return [(c, r, mid if len(out) == 2 else 0.0) for c, r in out]

def fingers(sc, HD, R, col):
    """手：胸の前で、手のひらどうしを向かい合わせる（親指が上）。手のひら（ミトンの玉）の前のはしから、4本の指が前へのびて、先が内がわ（もう1つの手のほう）へまるまる。
    4本は、たてにならぶ（人さし指が上）。親指は、手の上から前へのびる"""
    for c0, r, mid in HD:
        si = 1 if c0[0] < mid else -1   # もう1つの手へ向かう向き（2つの手のまん中をさかいに）
        sc.smooth(True); n0 = len(sc.t); ellip(sc, c0, (r*PALMW, r*0.9, r*0.95), col)   # 手のひらは、もう1つの手のほうを向くので、あつみは左右（x）
        sc.t[n0:] = [(R(a), R(b), R(c), cc, pid) for a, b, c, cc, pid in sc.t[n0:]]   # ellip は、まわす前の場所で作ったので、まわす
        for j, fz in enumerate((0.4, 0.13, -0.13, -0.4)):
            L = 1-0.15*abs(fz+0.05)/0.45
            pts = [c0+np.array([si*0.12*r, 0.7*r, fz*r]), c0+np.array([si*0.22*r, 1.1*r*L, fz*r]), c0+np.array([si*0.7*r, 1.25*r*L, fz*r*0.95]), c0+np.array([si*0.95*r, 1.05*r*L, fz*r*0.9])]
            tube(sc, [R(p) for p in pts], [0.2*r, 0.19*r, 0.18*r, 0.16*r], col)
        pts = [c0+np.array([si*0.1*r, 0.5*r, 0.75*r]), c0+np.array([si*0.25*r, 0.9*r, 0.85*r]), c0+np.array([si*0.4*r, 1.15*r, 0.75*r])]
        tube(sc, [R(p) for p in pts], [0.22*r, 0.2*r, 0.18*r], col)

def tube(sc, pts, rs, col, n=10):
    sc.part(); pts = [np.array(q, float) for q in pts]; rings = []
    for k in range(len(pts)):
        d = pts[min(k+1, len(pts)-1)]-pts[max(k-1, 0)]; d /= np.linalg.norm(d)
        u = np.cross(d, [0, 1.0, 0]);
        if np.linalg.norm(u) < 1e-6: u = np.array([1.0, 0, 0])
        u /= np.linalg.norm(u); v = np.cross(d, u)
        rings.append([pts[k]+rs[k]*(math.cos(t)*u+math.sin(t)*v) for t in np.linspace(0, 2*math.pi, n+1)[:-1]])
    for k in range(len(pts)-1):
        for i in range(n): sc.quad(rings[k][i], rings[k+1][i], rings[k+1][(i+1) % n], rings[k][(i+1) % n], col)
    for i in range(n): sc.tri(pts[-1], rings[-1][i], rings[-1][(i+1) % n], col)

PATD = 0.07   # 布の模様（体とはなれた かざりで、布の面から このきょり（高さのうち）より近い物）：布の面に はりつける
PATOFF = 0.004   # 模様・目を、面から このきょりだけ 外へ（面とかさならないように）
EYEV = []   # いま写している目の点（目ごと）
EYEW, EYEH = 4, 7   # 正面の目のドットの大きさ（EYEPX と同じ）
EYEWS = ((0.7, 4), (0.45, 3), (0.25, 2), (-1, 1)); EYEHS = ((0.7, 7), (0.5, 5), (0.3, 3), (-1, 1))   # 写した大きさの わり → 目の はば・高さ（ドット）
EYEEDGE = 0.014   # 目のふち（ふちの色）のはば（高さのうち）
def ornament(P, F, col, lab, comp, H, cfg, dead=False, name=None):
    """布の模様と目を、3Dの面にはる（写したあとに2Dで おさない。持ち主）。
    模様：布の面から PATD より近い かざりの かたまりを、布の面の いちばん近い所へ うつす（うき上がって べつの物に見えない）。色わけ 'pat'。
    目：顔の面の上に、だ円（たて rz・よこ rx）を2まい（ふちの色・目の色）。色わけ 'eyee'・'eye'。たおされた目は、ほそい線だけ。
    ボーンの重みは、近い布・顔の点と同じ（kw_skel）"""
    P = P.copy(); lab = lab.copy(); big = np.bincount(comp).argmax()
    cl = np.isin(lab, ['base', 'rim', 'under', 'red']); T = trimesh.Trimesh(P, F[cl], process=False)
    import kw_skel
    dec = lab == 'deco'
    if name in kw_skel.SPREAD or name in kw_skel.SCARF: dec[:] = False   # とびちる かざり・マフラーは、模様ではない
    for labels, sel, _ in kw_skel.ATTACH.get(name, []): dec &= ~kw_skel._sel_faces(P, F, lab, comp, H, labels, sel)   # 骨につける持ち物（ハンマー・牙・つの など）も
    for q in np.unique(comp[dec]):
        if q == big: continue
        k = dec & (comp == q); vs = np.unique(F[k]); cp, d, _ = trimesh.proximity.closest_point(T, P[vs])
        if d.max() > PATD*H: continue
        u = P[vs]-cp; u /= np.maximum(np.linalg.norm(u, axis=1), 1e-9)[:, None]; P[vs] = cp+u*PATOFF*H; lab[k] = 'pat'
    e = cfg.get('eyes'); EYEV[:] = []
    if not e or not (lab == 'face').any(): return P, F, col, lab, comp
    fcm = trimesh.Trimesh(P, F[lab == 'face'], process=False); NP, NF, NC, NL = [], [], [], []; o = len(P)
    for c in eyepos(P, F, lab, H, e):
        cp, _, ti = trimesh.proximity.closest_point(fcm, c[None]); n = fcm.face_normals[ti[0]]
        if n[1] < 0: n = -n   # 前を向く
        n = n/np.linalg.norm(n); u = np.cross([0, 0, 1.0], n); u /= np.linalg.norm(u); v = np.cross(n, u)
        for lb, k_, off, cc in (('eyee', EYEEDGE, PATOFF, e.get('edge', e['col'])), ('eye', 0.0, PATOFF*2, e['col'])):
            rx, rz = e['rx']+k_, (e['rz']*0.18 if dead else e['rz'])+k_
            if dead and lb == 'eye': continue
            m_ = 24; ctr = cp[0]+n*off*H; ring = [ctr+(u*math.cos(t)*rx+v*math.sin(t)*rz)*H for t in np.linspace(0, 2*math.pi, m_, endpoint=False)]
            if lb == 'eyee': EYEV.append(list(range(o, o+m_+1)))   # 目のだ円（ふち）の点：写したあと、ドットの形をそろえる（eyeclean）
            NP += [ctr]+ring; NF += [(o, o+1+i, o+1+(i+1) % m_) for i in range(m_)]; NC += [hx(cc)]*m_; NL += [lb]*m_; o += m_+1
    return (np.vstack([P, np.array(NP)]), np.vstack([F, np.array(NF)]), np.vstack([col, np.array(NC)]), np.concatenate([lab, np.array(NL, object)]),
            np.concatenate([comp, np.full(len(NF), comp.max()+1)]))

def eyeset(W, H):
    """だ円のドット（左右・上下 対称）。ふち：上か下が だ円の外の ドット（持ち主がきめた目の形 EYEPX と同じ きまり。4×7 で EYEPX になる）"""
    S = np.zeros((H, W), bool)
    for j in range(H):
        for i in range(W):
            x = (i+0.5-W/2)/(W/2); y = (j+0.5-H/2)/(H/2); S[j, i] = x*x+y*y <= 1.0 or W <= 2 or H <= 2
    up = np.vstack([np.zeros((1, W), bool), S[:-1]]); dn = np.vstack([S[1:], np.zeros((1, W), bool)])
    return S, S & ~(up & dn)

def eyeclean(im, P, F, lab, PL, R, proj, ext, cfg):
    """3Dで写した目（小さな だ円は、ドットに すると 左右で形が かわり、ガタガタになる）を、きれいな だ円の ドットに おきかえる。
    場所・はば・高さは、その目の3Dの だ円を 写した大きさ（向きで ほそくなる・たおれると ねる）。見えていた所（前に物があれば かくれる）だけに描く"""
    e = cfg['eyes']; a = np.array(im); idb, _ = O.LAST; ep = [p_ for p_, l_ in PL.items() if l_ in ('eye', 'eyee')]
    Hs, Ws = a.shape[:2]; m = np.isin(idb, ep)[:Hs*BIG, :Ws*BIG].reshape(Hs, BIG, Ws, BIG).mean((1, 3)) > 0.2   # 目が見えている ドット
    if not m.any(): return im
    fc = list(hx(cfg['labcol'].get('face', '#241c33')).astype(int))+[255]; ce = list(hx(e.get('edge', e['col'])).astype(int))+[255]; cc = list(hx(e['col']).astype(int))+[255]
    a[m & (a[..., 3] > 0)] = fc   # 写した目は いったん 顔の色に
    from scipy.ndimage import binary_dilation
    vis = binary_dilation(m, iterations=1)
    for vs in EYEV:
        q = np.array([proj(R(P[v])) for v in vs[1:]]); q[:, 0] -= ext[0]; q[:, 1] -= ext[2]
        x0, x1 = q[:, 0].min(), q[:, 0].max(); y0, y1 = q[:, 1].min(), q[:, 1].max()
        nw, nh = 2*(e['rx']+EYEEDGE)*cfg['HPX'], 2*(e['rz']+EYEEDGE)*cfg['HPX']   # 正面から見た大きさ（ドット）
        rw, rh = (x1-x0)/nw, (y1-y0)/nh; step = lambda r, L: next(v for t, v in L if r > t)
        Wd = step(rw, EYEWS); Hd = step(rh, EYEHS)   # 正面で EYEW×EYEH（持ち主がきめた目の大きさ）。よこを向く・たおれて 写した大きさが へったときだけ、段で ほそく・ひくく（コマごとに 大きさが ゆれない）
        S, Ed = eyeset(Wd, Hd); L = int(round((x0+x1)/2-Wd/2)); T = int(round((y0+y1)/2-Hd/2))
        for j in range(Hd):
            for i in range(Wd):
                y, x = T+j, L+i
                if S[j, i] and 0 <= y < Hs and 0 <= x < Ws and vis[y, x] and a[y, x, 3]: a[y, x] = ce if Ed[j, i] else cc
    return Image.fromarray(a)

def shoot(name, cfg, src, yaw=0.0):
    if cfg.get('model'):   # マテリアルつきのモデル（持ち主が直した物・kw_model.py で手を足した物）：色わけはマテリアルのまま
        m, comp, lab0 = load_labeled(cfg['model']); P, F, col, lab, H, cen = paint_labeled(m, comp, lab0, cfg); POMC[:] = []
        if cfg.get('sack'): col[(lab == 'base') & (comp != 0)] = hx(cfg['sack'])   # ふくろ：布の色わけ（base）のうち、体（いちばん大きなかたまり）とはなれた所。色わけ（lab）はかえない（ボーンは lab で見る）
        P, F, col, lab, comp = ornament(P, F, col, lab, comp, H, cfg, cfg.get('pose', {}).get('dead', False), name)   # 模様と目を、3Dの面に
        comp0 = comp.copy()
        comp = np.where(np.isin(lab, ['base', 'under', 'rim', 'face', 'pat', 'eye', 'eyee']), 0, comp+1)   # すそのライン・目は、布・顔の所で見る
    else:
        m, comp = load(os.path.join(src, 'kg_%s.glb' % name)); P, F, col, lab, H, cen = paint(m, comp, cfg)
    if cfg.get('thin'): P = thin(P, F, lab, k=cfg['thin'])
    if cfg.get('tip'): P = tipthin(P, F, lab, H, cfg['tip'])
    if cfg.get('cone') and POMC: P = cone(P, F, lab, H, cfg['cone'])
    EYES = None
    if cfg.get('pose'):   # モーション（kw_skel.py）。部品は、色わけ（lab）と つながった かたまり（comp0）でえらぶ
        import kw_skel
        P = kw_skel.Skel(name, P, F, lab, comp0, H).pose(P, **cfg['pose'])   # ボーンを入れて、ポーズをつける
        lk = cfg['pose'].get('look', (0, 0)); ev = np.unique(F[np.isin(lab, ['eye', 'eyee'])]); P[ev] += np.array([lk[0], 0, lk[1]])*H   # look：目を うごかす
    else: EYES = None
    HD = hands(P, F, lab, H, cfg.get('apart', 0)) if cfg.get('fingers') and not cfg.get('model') else []
    if HD:   # もらったモデルの手は、まん中へちぢめてかくす（新しい手を組む）
        P = P.copy(); other = set(F[(lab != 'handL') & (lab != 'handR')].ravel())
        for nm in ('handL', 'handR'):
            vs = [v for v in np.unique(F[lab == nm]) if v not in other]
            if vs: P[vs] = P[vs].mean(0)+(P[vs]-P[vs].mean(0))*0.3
    c, s = math.cos(yaw), math.sin(yaw); R = lambda p: np.array([p[0]*c-p[1]*s, p[0]*s+p[1]*c, p[2]])
    O.LIGHT[:] = np.array([-0.45, 0.65, 0.65])/np.linalg.norm([-0.45, 0.65, 0.65])
    sc = O.Scene(); last = None; sc.smooth(True); PL = {}
    hemf = hemdecal(P, F, lab, comp, H, cfg, yaw) if cfg.get('hem') else None
    pomf = None
    if POMC:   # ぽんぽんのさかい目：玉のまん中からのきょりで、ドットごとに（三角形のさかいの、まっすぐな線や切れこみを出さない）
        pc0 = R(POMC[0]); pr = POMC[1]; pcol = POMC[2]; pax = R(POMC[3]); prad = POMC[4]; hcol = hx(dict((q[0], q[3]) for q in cfg['seeds']).get('hood', cfg['base']))
        lw_ = 1.0*H/cfg['HPX']; lcol = hcol*0.72   # さかい目の輪郭線：1ドットのはば、ずきんの色を暗くした色
        cs = R(POMC[5]); rs = POMC[6]
        Bc = R((np.array(cfg['cone'][0])+np.array(cfg['cone'][1]))/2*H) if cfg.get('cone') else R(POMC[0]+POMC[3])
        tdir = (Bc-cs)/np.linalg.norm(Bc-cs); ca = math.cos(math.radians(POMANG)); lwa = lw_/rs   # 輪郭線のはば（角度のぶん）
        def pomf(x, y, z):
            q = np.array([x, y, z])-cs; d = np.linalg.norm(q)
            if d > rs*1.12: return hcol   # 玉からはなれた所は、ずきん
            c_ = float(q@tdir)/max(d, 1e-9)   # ずきんの先へつながる向きとの、角度の cos
            return hcol if c_ > ca else lcol if c_ > ca-lwa else pcol
    for k, f in enumerate(F):
        if lab[k] != last:
            sc.decal(hemf if lab[k] == 'base' else pomf if lab[k] in ('hood', 'pom') else None); sc.group('hoodpom' if lab[k] in ('hood', 'pom') else 'clothpat' if lab[k] in ('base', 'pat') else 'eye' if lab[k] in ('eye', 'eyee') else None)   # 模様は布と、目のふちは目と、さかいに線を引かない   # ずきんとぽんぽんは、三角形のさかいに線を引かない（さかい目の線は pomf）
            if cfg.get('mats'):   # 材質：でこぼこ・色のむら（kw_tex.py）と、金属のつや
                mt_ = cfg['mats'].get('deco' if lab[k] == 'pat' else lab[k]); sc.bump(kw_tex.bump(mt_, H, seed=len(sc.bm)) if mt_ in kw_tex.MATS else None); sc.material('metal' if mt_ in ('metal', 'ice') else 'gloss' if mt_ == 'gloss' else None)
            if lab[k] in ('eye', 'eyee'): sc.material('flat')   # 目：かげをつけない（きめた色のまま）
            elif not cfg.get('mats'): sc.material(None)
            sc.part(); last = lab[k]; PL[sc.pid] = lab[k]
        sc.tri(R(P[f[0]]), R(P[f[1]]), R(P[f[2]]), col[k])
    sc.decal(None); sc.group(None); sc.bump(None); sc.material(None)
    sc.smooth(False)
    if HULL:   # 背面法の輪郭：点を面の向きへ HULL ドットぶん ふくらませた うら返しの皮を、こい色で（うらを向いた面だけ描く）。物のふち・かさなる所・部品のさかいに線が出る
        tm_ = trimesh.Trimesh(vertices=P, faces=F, process=False); VN = tm_.vertex_normals*(1 if tm_.volume > 0 else -1); w_ = HULL*H/cfg['HPX']; Ph = P+VN*w_
        sc.smooth(False); sc.outline(0); sc.material('ink'); sc.part()
        for k, f in enumerate(F):
            if lab[k] in ('pat', 'eye', 'eyee'): continue   # 面にはった模様・目には、輪郭をつけない
            a_, b_, c_ = (R(Ph[f[0]]), R(Ph[f[1]]), R(Ph[f[2]])); nn = np.cross(b_-a_, c_-a_); av = R(VN[f].mean(0))
            if np.dot(nn, av) < 0: b_, c_ = c_, b_
            sc.tri(a_, b_, c_, np.array(col[k], float)*HULLK)
        sc.material(None); sc.outline(None)
    if HD: fingers(sc, HD, R, hx(cfg.get('hand', '#a597ba')))
    sc.smooth(False)
    # 大きく（BIG 倍）写してから、色の平均（pixdown）でちぢめる：三角形ごとのかげのむらが、ならされる
    # カメラ：たての画角は、焦点距離 FOCAL の 35mm判（たて24mm）。体の高さの1.15倍がちょうど入るきょりに置く。体のまん中の奥行きで、高さ HPX ドット
    # うしろ向きは、BACKEL 度 上から見おろす（持ち主がきめた）
    t = math.radians(BACKEL if abs(math.cos(yaw)+1) < 1e-6 else 0.0); V = np.array([0, math.cos(t), math.sin(t)]); U = np.array([0, -math.sin(t), math.cos(t)])
    fov = 2*math.atan(12/FOCAL); Dc = 1.15*H/(2*math.tan(fov/2)); cz = H/2; k = cfg['HPX']/H; C0 = np.array([0, 0, cz])
    def proj(p):
        q = np.asarray(p)-C0; d = float(q@V); sc_ = Dc/(Dc-d)
        return (q[0]*sc_*k, -(cz+float(q@U)*sc_)*k)
    Q = np.array([proj(p) for tr in sc.t for p in tr[:3]]); ext = (math.floor(Q[:, 0].min())-2, math.ceil(Q[:, 0].max())+2, math.floor(Q[:, 1].min())-2, math.ceil(Q[:, 1].max())+2)
    O.S = BIG; O.GRAD = True; O.DITHER = BIG if DITH else 0   # かげは1色、うすいかげは、かげのドットの密度（持ち主がきめた）
    O.DITHERO = (ext[0]*BIG, ext[2]*BIG)
    sv = (O.LV4, O.SHADE4); O.LV4 = KWLV; O.SHADE4 = KWSHADE; O.DITHERT = KWT; O.DITHERG = cfg.get('gloss', KWG); sv2 = O.METALSPEC; O.METALSPEC = KWMSPEC   # 立体感：かげの所を広く・かげの色をこく（コワイノだけ）
    hi = O.render_px(sc, proj, ext, V, k=0.80, lw=2, k2=0.90, merge=0); O.LV4, O.SHADE4 = sv; O.METALSPEC = sv2; O.DITHERT = None; O.DITHERG = None
    if os.environ.get('KWDBG'): hi.save(os.path.join(os.environ['KWDBG'], 'hi_%s_%d.png' % (name, round(math.degrees(yaw)))))   # たしかめ用：ちぢめる前の大きな絵
    import pixdown
    W0, H0 = (ext[1]-ext[0]), (ext[3]-ext[2])
    o = pixdown.shrink(np.asarray(hi).astype(float), W0, H0); o = pixdown.lines(o, np.asarray(hi).astype(float)); o = pixdown.outline(o, np.asarray(hi).astype(float))
    gp = [p_ for p_, m_ in sc.mt.items() if m_ == 'gloss']
    if gp:   # つやつやの部品は細いので、ちぢめるとつやの光が消える：つやの光のドットが GLOSSKEEP より多いマスは、その光の色にする
        idb_, _ = O.LAST; HA = np.asarray(hi).astype(float); gm = np.isin(idb_, gp); lum = HA[..., :3]@[0.3, 0.59, 0.11]
        o = o.copy(); Hs, Ws = o.shape[:2]
        for y in range(Hs):
            for x in range(Ws):
                sl = (slice(y*BIG, (y+1)*BIG), slice(x*BIG, (x+1)*BIG)); g_ = gm[sl]
                if g_.sum() < 4: continue
                L_ = lum[sl][g_]; top = L_ >= np.percentile(lum[gm], 85)
                if top.sum() >= GLOSSKEEP*BIG*BIG: o[y, x, :3] = HA[sl][g_][top][:, :3].mean(0); o[y, x, 3] = 255
    if PARTLINE:   # 部品のさかい（布・かざり・手・顔・ぽんぽん）に、できあがりの1ドットの線。奥のがわのドットに引く（持ち主）
        idb, zb = O.LAST; grp = lambda l: PARTG.get(l, l)
        GL = np.full(max(PL)+2 if PL else 2, -1); names = sorted(set(grp(v) for v in PL.values()))
        for p_, l_ in PL.items(): GL[p_] = names.index(grp(l_))
        hb = idb.shape; Hs, Ws = o.shape[:2]; lb = np.full((Hs, Ws), -1); zs = np.full((Hs, Ws), -1e9)
        g_ = np.where(idb >= 0, GL[np.maximum(idb, 0)], -1)
        for y in range(Hs):
            for x in range(Ws):
                blk = g_[y*BIG:(y+1)*BIG, x*BIG:(x+1)*BIG]; v = blk[blk >= 0]
                if len(v)*2 < blk.size: continue
                lb[y, x] = np.bincount(v).argmax(); zz = zb[y*BIG:(y+1)*BIG, x*BIG:(x+1)*BIG]; zs[y, x] = zz[blk == lb[y, x]].mean()
        ln = np.zeros((Hs, Ws), bool)
        for dy, dx in ((0, 1), (0, -1), (1, 0), (-1, 0)):
            nb = np.roll(np.roll(lb, -dy, 0), -dx, 1); nz = np.roll(np.roll(zs, -dy, 0), -dx, 1)
            ln |= (lb >= 0) & (nb >= 0) & (nb != lb) & (nz > zs)
        o = o.copy(); o[ln, :3] = o[ln, :3]*PARTK
    im = (lambda x: x if DITH else despeckle(x))(quant((lambda x: x if HULL else rim(x))(Image.fromarray(o.round().astype(np.uint8), 'RGBA')), NCOL, cfg.get('hem', (None,))[0], pal=PALS.setdefault((name, round(yaw, 3)), [None]) if cfg.get('pose') is not None else None))
    if EYEV: im = eyeclean(im, P, F, lab, PL, R, proj, ext, cfg)   # 目：3Dのだ円の 場所・大きさ・かくれ方のまま、ドットの形を そろえる
    if cfg.get('pose', {}).get('fade'):   # きえる：体が 上から ばらばらに ほどけ、ほどけた ドットの いくつかが、体の色の つぶになって 上へ のぼる
        fd = cfg['pose']['fade']; a = np.array(im); yy, xx = np.indices(a.shape[:2]); 
        gx, gy = xx+ext[0], yy+ext[2]; hs = (gx*73856093 ^ gy*19349663) & 1023; on = a[..., 3] > 0; ys = yy[on]; y0_, y1_ = (ys.min(), ys.max()) if len(ys) else (0, 1)
        hh = (y1_-yy)/max(1, y1_-y0_); nz = ((hs*2654435761) & 1023)/1023   # 上から ほどける（高さ＋ばらつき。あみの ならびに しない）
        off = on & (hh*0.55+nz*0.45 > 1-fd)
        sel = off & (hs % FADEN == 0); up = np.round(fd*FADEUP).astype(int)+(hs >> 4) % 5   # つぶ：ほどけた ドットの 1/FADEN。上へ（ほどけるほど 高く、少しずつ ばらばら）
        sy, sx = yy[sel]-up[sel], xx[sel]+((hs[sel] >> 7) % 3-1); col = a[sel].copy(); a[off, 3] = 0
        pad = max(0, -int(sy.min())) if len(sy) else 0
        if pad: a = np.concatenate([np.zeros((pad,)+a.shape[1:], a.dtype), a]); sy = sy+pad; ext = (ext[0], ext[1], ext[2]-pad, ext[3])
        ok = (sx >= 0) & (sx < a.shape[1]); a[sy[ok], sx[ok]] = col[ok]; im = Image.fromarray(a)
    if cfg.get('fxp') and math.cos(yaw) < -0.5:   # うしろ向き（よこ向きは のぞく）：体の前がわ（体の むこう）の パーティクルは、体に かくれるので おさない
        cfg = dict(cfg, fxp=[q for q in cfg['fxp'] if q[1][1] < 0.08])
    if cfg.get('fxp'):   # パーティクル（色の数をへらしたあとに おす。絵のわくの外に出る分は、わくを広げて入れる）
        if -math.sin(yaw) < -0.5: cfg = dict(cfg, fxp=[({'swipe': 'swipeL', 'swipeL': 'swipe'}.get(k, k), p, ag) for k, p, ag in cfg['fxp']])   # 左むき：ひっかきの すじも 左へ
        q = [(k, proj(R(np.asarray(p)*H))) for k, p, ag in cfg['fxp']]; ages = [ag for _, _, ag in cfg['fxp']]
        x0 = min([ext[0]]+[int(math.floor(v[0]))-5 for _, v in q]); y0 = min([ext[2]]+[int(math.floor(v[1]))-5 for _, v in q])
        x1 = max([ext[0]+im.width]+[int(math.ceil(v[0]))+5 for _, v in q]); y1 = max([ext[2]+im.height]+[int(math.ceil(v[1]))+5 for _, v in q])
        big_ = Image.new('RGBA', (x1-x0, y1-y0)); big_.alpha_composite(im, (ext[0]-x0, ext[2]-y0)); im = stampfx(big_, [(k, v[0]-x0, v[1]-y0, ag) for (k, v), ag in zip(q, ages)])
        ext = (x0, x0+im.width, y0, y0+im.height)
    return im, ext

BACKEL = 15.0
NOFIST = False   # 足とつながったこぶしを切りはなすとき（glb を直す道具）だけ True
FOOTR = 0.6   # 足：すその広さ（95%の半径）のこのわりより内がわ
POMH = 0.45   # ぽんぽん：赤のかたまりのまん中が、この高さ（高さのうち）より上
POMANG = 50.0
PALMW = 0.45   # 手のひらのあつみ（左右の半径。手の大きさ r に対して）   # ぽんぽん：ずきんの先がつながる向きから、この角度までは、ずきん
KWLV = (0.72, 0.5, 0.22)   # 光・うすいかげ（あみ1/4）・半かげ（あみ2/4）・かげ のさかい目（光の向きとの内積）
KWSHADE = [(9, -2.5), (16, -4), (34, -4)]   # かげの色（3つめ。明るさ・あざやかさを引く）
KWT = ([(0.07, 0.11), (0.22, 0.26), (0.4, 0.44), (0.58, 0.62), (0.9, 0.94)], [3, (-25, 4), 2, (-7, 2), 0, (5, -2)])   # 色の段：こいかげ・かげ2つ・光2つ・ハイライト（うすく）。となりの段の色の差を小さくして、さかいの あみを目立たなくする（持ち主）
KWG = ([(0.08, 0.14), (0.35, 0.42), (0.68, 0.74), (0.86, 0.9)], [3, 2, 0, (12, -6), (30, -25)])   # つやつや（牙・ばちばち）：こいかげ・かげ・光・明るい光・白っぽい つや
KWMSPEC = 0.9   # 金属のつやが出る向きの近さ（コワイノ。光沢・反射で金属をあらわす）
KWDR = (0.4, 0.47)   # あみ：光の向きとの内積がこのあいだだけ（光とかげのさかいの細い帯。ほかは光かかげの1色。あみを多用しない、持ち主がきめた）
KWHL = (0.92, 0.97, 14, 6)   # ハイライト：光の向きとの内積がこのあいだで、あみがふえる。明るさ+14・あざやかさ−6
HULL = 0.9   # 背面法の輪郭のふとさ（できあがりのドット。0 で引かない）
HULLK = 0.45   # 背面法の輪郭の色（部品の色にかける）
GLOSSKEEP = 0.12   # つやの光のドットが、マスのこのわりより多ければ、のこす
PARTLINE = False   # 部品のさかいの線
PARTK = 0.62   # 部品のさかいの線の色（そのドットの色にかける）
PARTG = {'red': 'base', 'under': 'base', 'rim': 'base', 'foot': 'face'}   # 同じ部品とみなす色わけ（表と裏地・顔と足には線を引かない）
EYETOL = 0.05   # 目より手前に、これ（高さのうち）より前に出た物があると、目をかくす
DITH = True   # かげを1色＋あみ（ドットの密度）にする
BIG = 8; NCOL = 15   # 大きく写す倍・色の数（目の色を足して16）

def rim(im, k=0.62):
    """外の輪郭線：透明の所で、上下左右に物があるドットを、となりの色を暗くした色にする（黒にはしない）"""
    a = np.array(im); b = a.copy(); m = a[..., 3] > 0; H, W = m.shape
    for y in range(H):
        for x in range(W):
            if m[y, x]: continue
            nb = [a[y+dy, x+dx, :3] for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)) if 0 <= y+dy < H and 0 <= x+dx < W and m[y+dy, x+dx]]
            if nb: b[y, x, :3] = np.mean(nb, 0)*k; b[y, x, 3] = 255
    return Image.fromarray(b)

PALS = {}   # コワイノ・向きごとの色（はじめのコマで きめて、ほかのコマも同じ色にする。コマで色がかわると、ちらつく）
def quant(im, n, keep=None, nk=2, pal=None):
    """色を n 色にまとめる（メディアンカット）。keep（金のライン）に近い色のドットは、べつに nk 色にまとめる（まざって、ほかの所が黄色くならない）"""
    a = np.array(im); m = a[..., 3] > 0; g = np.zeros_like(m)
    if keep is not None:
        import colorsys
        hk = colorsys.rgb_to_hsv(*(hx(keep)/255))[0]
        for y, x in zip(*np.nonzero(m)):
            h, s_, v = colorsys.rgb_to_hsv(*(a[y, x, :3]/255))
            g[y, x] = s_ > 0.25 and min(abs(h-hk), 1-abs(h-hk)) < 0.06
    if pal is not None:   # きまった色：いちばん近い色に
        if pal[0] is None:
            q = quant(im, n, keep, nk); b = np.array(q); pal[0] = np.unique(b[..., :3][b[..., 3] > 0].reshape(-1, 3), axis=0).astype(float); return q
        px = a[..., :3][m].astype(float); d = ((px[:, None, :]-pal[0][None])**2).sum(2); a[..., :3][m] = pal[0][d.argmin(1)].astype(np.uint8)
        return Image.fromarray(a)
    for sel, k in ((m & ~g, n-(nk if g.any() else 0)), (g, nk)):
        if not sel.any(): continue
        px = a[..., :3][sel]; q = np.array(Image.fromarray(px.reshape(1, -1, 3)).quantize(k, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert('RGB')).reshape(-1, 3)
        a[..., :3][sel] = q
    return Image.fromarray(a)

def despeckle(im, n=2):
    """まわり8つのどれともちがう色の1ドット（孤立ドット）を、まわりでいちばん多い色にする"""
    a = np.array(im); H, W = a.shape[:2]
    for _ in range(n):
        b = a.copy()
        for y in range(1, H-1):
            for x in range(1, W-1):
                if a[y, x, 3] == 0: continue
                nb = [tuple(a[y+dy, x+dx]) for dy in (-1, 0, 1) for dx in (-1, 0, 1) if dy or dx]
                me = tuple(a[y, x])
                if me in nb: continue
                op = [c for c in nb if c[3]]
                if len(op) < 8: continue   # まわりのふち（輪郭）は、そのまま
                b[y, x] = max(set(op), key=op.count)
        a = b
    return Image.fromarray(a)

def sheets(name, out):
    """モーションのコマ（kw_skel.poses）を写して、モーションごとに、たてにならべた1まいの絵にする（いまのゲームと同じ形：w・h・ax・ay・n）。
    正面と、うしろ（B。やられはなし）・右むき（R）・左むき（L。待機・歩く・攻撃）。コマの大きさは、そのモーションのコマぜんぶが入る大きさ（足もとの点をそろえる）"""
    import kw_skel, json; info = {}
    PS = {False: kw_skel.poses(name), True: kw_skel.poses(name, side=True)}
    for mo in PS[False]:
        for B, yaw in (('', 0.0), ('B', math.pi), ('R', -math.pi/2), ('L', math.pi/2)):   # 正面・うしろ・右むき・左むき（よこは 待機・歩く・攻撃。よこへ歩くとき・攻撃する相手のほうを向く）
            if mo == 'hurt' and B or B in ('R', 'L') and mo not in ('idle', 'atk', 'walk', 'steal'): continue
            ps = PS[B in ('R', 'L')][mo]
            fr = []
            fxp = fxparts(ps, name)
            for p, fp in zip(ps, fxp): im, e = shoot(name, dict(CFG[name], pose=p, fxp=fp), None, yaw); fr.append((im, e))
            x0 = min(e[0] for _, e in fr); y0 = min(e[2] for _, e in fr); x1 = max(e[0]+im.width for im, e in fr); y1 = max(e[2]+im.height for im, e in fr)
            w, h = x1-x0, y1-y0; sh = Image.new('RGBA', (w, h*len(fr)))
            gc = (hx(CFG[name]['labcol']['base'])*0.35+np.array([255, 255, 255])*0.65).astype(int)   # 残像の色：布の色を白っぽく
            for i, (im, e) in enumerate(fr):
                for k in range(min(i, int(ps[i].get('ghost', 0))), 0, -1):   # 残像：まえのコマの形を、あみ（ドットの密度）で うすく。古いほど まばら
                    gim, ge = fr[i-k]; g = Image.new('RGBA', (w, h)); g.alpha_composite(gim, (ge[0]-x0, ge[2]-y0)); a = np.array(g)
                    yy, xx = np.indices(a.shape[:2]); keep = ((xx+yy) % 2 == 0) if k == 1 else ((xx % 2 == 0) & (yy % 2 == 0))
                    o = np.zeros_like(a); m = (a[..., 3] > 0) & keep; o[m, :3] = gc; o[m, 3] = 255; sh.alpha_composite(Image.fromarray(o), (0, i*h))
                sh.alpha_composite(im, (e[0]-x0, i*h+e[2]-y0))
            k = 'kg_%s:%s%s' % (name, mo, B); sh.save(os.path.join(out, k.replace(':', '_')+'.png')); info[k] = dict(w=w, h=h, ax=x0, ay=y0, n=len(fr))
    json.dump(info, open(os.path.join(out, 'kg_%s.json' % name), 'w'), indent=1); return info

if __name__ == '__main__' and sys.argv[1] == '--sheets':
    for name in sys.argv[3:]: print(name, sheets(name, sys.argv[2]))
    sys.exit()
if __name__ == '__main__':
    src, out = sys.argv[1], sys.argv[2]; os.makedirs(out, exist_ok=True)
    for name in (sys.argv[3:] or list(CFG)):
        for B, yaw in (('', 0.0), ('B', math.pi)):
            im, e = shoot(name, CFG[name], src, yaw); im.save(os.path.join(out, 'kg_%s%s.png' % (name, B))); print(name+B, im.size, e)
