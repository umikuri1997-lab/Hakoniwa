"""コワイノのボーン（骨）とモーション。持ち主が直したモデル（models/kg_<名前>.glb）に、骨を入れて、点に重みをつけ（スキニング）、骨をまわしてポーズをつける。
点 P は写すときの向き（x よこ（+右）・y 前（カメラのほう）・z 上）。長さは、どれも体の高さ H のうち。
骨（BONES：名前・親・支点）：root（足もと）→ hip（こし）→ chest（むね）→ head（あたま）、chest → armL・armR（かた）・jaw（あご）、head → hornL・hornR（つの）。
重み：
  体：高さで、なめらかに root・hip・chest・head にわける（WZ）。足（foot）と、すそのいちばん下は root（地面からはなれない）。
  腕：手（hand）があるコワイノは、手と、そのまわりの そで（ARMR の中）を、手のある がわの腕へ。手がないコワイノは、そで（よこのはしの、こしからむねの高さ）を腕へ。
  持ち物・かざり（deco など）：つながった かたまりごとに、ATTACH の骨へ（なければ、高い所は head、ほかは chest）。
ポーズ：骨ごとに (lean 前へ, roll 右へ, twist 上から見て) 度。腕は (fwd 前へあげる, out 外へひらく, twist)。move＝体ぜんたいを うごかす（前・上）。
  spread：とびちる かざり（灰・光のつぶ・花びら）を、むねからはなす倍。
コマ数は、いまのゲームの絵と同じ：待機2・歩き2・攻撃4（ためる → ふりかぶる → うつ → もどる）・やられ3（ひるむ → とちゅう → さいご）。
攻撃とやられは、コワイノごと（MOVES。持ち主とえらんだ案）。つぶす動き（たてにちぢめる）は使わない。
体をうしろへそるのは −16度まで（それより そると、すその裏が見えて暗くなる）。"""
import math
import numpy as np

BONES = [('root', None, (0, 0, 0)), ('hip', 'root', (0, 0, 0.12)), ('chest', 'hip', (0, 0, 0.36)), ('head', 'chest', (0, 0.02, 0.54)),
         ('armL', 'chest', (-0.2, 0.05, 0.4)), ('armR', 'chest', (0.2, 0.05, 0.4)), ('jaw', 'chest', (0, 0.15, 0.45)),
         ('hornL', 'head', (-0.2, 0, 0.74)), ('hornR', 'head', (0.2, 0, 0.74))]
WZ = ((0.03, 0.2), (0.26, 0.46), (0.46, 0.62))   # 高さ：root→hip・hip→chest・chest→head に うつる はば
ARMR = 0.14   # 手のまわりの そでを腕にする はんい（手の点からのきょり）
SLEEVE = ((0.14, 0.3), (0.12, 0.52))   # 手がないとき：そで（よこのはしのきょり・高さ）

# 持ち物・かざりを、どの骨につけるか（色わけ・えらび方・骨）
ATTACH = {
    'thief': [(['base', 'red', 'deco'], dict(ball=(0.3, 0.1, 0.25, 0.2)), 'armR')],   # ふくろ：右手
    'breaker': [(['deco'], dict(box=((-1, 0.0), (-1, 1), (0, 1.0))), 'armL'), (['hand'], {}, 'armL')],   # ハンマーと、もつ両手：左腕
    'trapper': [(['deco'], dict(box=((-1, 1), (0.15, 1), (0, 0.5))), 'jaw')],   # 牙：あご
    'hoteri': [(['deco'], dict(box=((-1, -0.1), (-1, 1), (0.6, 1.2))), 'hornL'), (['deco'], dict(box=((0.1, 1), (-1, 1), (0.6, 1.2))), 'hornR')],
}
SPREAD = {'ash': ['deco', 'pom'], 'shiny': ['deco'], 'hana': ['deco']}   # spread で とびちる かざり
SPREADZ = {'hana': 0.5}   # この高さより下の かざりだけ（花びら）

def smooth(e0, e1, x): t = np.clip((x-e0)/(e1-e0), 0, 1); return t*t*(3-2*t)

def _R(lean=0, roll=0, twist=0):
    def r(axis, deg):
        t = math.radians(deg); c, s = math.cos(t), math.sin(t); x, y, z = axis
        return np.array([[c+x*x*(1-c), x*y*(1-c)-z*s, x*z*(1-c)+y*s], [y*x*(1-c)+z*s, c+y*y*(1-c), y*z*(1-c)-x*s], [z*x*(1-c)-y*s, z*y*(1-c)+x*s, c+z*z*(1-c)]])
    return r((0, 0, 1), twist)@r((0, 1, 0), roll)@r((1, 0, 0), -lean)

def _sel_faces(P, F, lab, comp, H, labels, sel):
    fs = np.isin(lab, labels); c = P[F].mean(1)/H
    if 'ball' in sel: fs &= np.linalg.norm(c-np.array(sel['ball'][:3]), axis=1) < sel['ball'][3]
    out = np.zeros(len(F), bool)
    for q in np.unique(comp[fs]):
        k = fs & (comp == q); cc = c[k].mean(0)
        if 'box' in sel and not all(lo <= cc[i] <= hi for i, (lo, hi) in enumerate(sel['box'])): continue
        out |= k
    return out

class Skel:
    def __init__(s, name, P, F, lab, comp, H):
        s.H = H; s.names = [b[0] for b in BONES]; nb = len(BONES); V = len(P); z = P[:, 2]/H; ax = np.abs(P[:, 0])/H
        a1, a2, a3 = (smooth(e0, e1, z) for e0, e1 in WZ)
        W = np.zeros((V, nb)); ix = {n: i for i, n in enumerate(s.names)}
        W[:, ix['root']] = 1-a1; W[:, ix['hip']] = a1-a2; W[:, ix['chest']] = a2-a3; W[:, ix['head']] = a3
        def put(vs, bone, w=1.0):   # 点 vs を、骨 bone へ（w の わりあい）
            w = np.broadcast_to(np.asarray(w, float), (len(vs),))[:, None]; W[vs] *= (1-w); W[vs, ix[bone]] += w[:, 0]
        hand = lab == 'hand'
        if hand.any():   # 手：その がわの腕。まわりの そでも、なめらかに
            hv = np.unique(F[hand]); hp = P[hv]
            from scipy.spatial import cKDTree
            d, _ = cKDTree(hp).query(P); wa = 1-smooth(0, ARMR*H, d)
            for side, bone in ((-1, 'armL'), (1, 'armR')):
                m = (np.sign(P[:, 0]) == side) & (wa > 0); put(np.nonzero(m)[0], bone, wa[m])
        else:   # 手がない：そで
            wa = smooth(*SLEEVE[0], ax)*smooth(SLEEVE[1][0], SLEEVE[1][0]+0.08, z)*(1-smooth(SLEEVE[1][1]-0.08, SLEEVE[1][1], z))*(P[:, 1] > -0.15*H)
            for side, bone in ((-1, 'armL'), (1, 'armR')):
                m = (np.sign(P[:, 0]) == side) & (wa > 0); put(np.nonzero(m)[0], bone, wa[m])
        # 持ち物・かざり：かたまりごとに、ひとつの骨へ（まがらない）
        took = np.zeros(len(F), bool)
        for labels, sel, bone in ATTACH.get(name, []):
            fs = _sel_faces(P, F, lab, comp, H, labels, sel) & ~took; took |= fs; put(np.unique(F[fs]), bone)
        deco = np.isin(lab, ['deco', 'pom']) & ~took
        for q in np.unique(comp[deco]):
            k = deco & (comp == q); vs = np.unique(F[k])
            if (P[vs, 2].mean()/H) > 0.55: put(vs, 'head')
        # 足と、いちばん下：地面のまま
        fv = np.unique(F[lab == 'foot']); W[fv] = 0; W[fv, ix['root']] = 1
        W /= np.maximum(W.sum(1, keepdims=True), 1e-9); s.W = W
        # とびちる かざり
        s.spr = np.zeros(V, bool); s.sprc = {}
        if name in SPREAD:
            fs = np.isin(lab, SPREAD[name]) & ~took
            for q in np.unique(comp[fs]):
                k = fs & (comp == q); vs = np.unique(F[k])
                if P[vs, 2].mean()/H > SPREADZ.get(name, 9): continue
                s.spr[vs] = True; s.sprc[q] = vs

    def pose(s, P, move=(0, 0, 0), spread=1.0, **bones):
        H = s.H; Ms = {}
        for n, par, piv in BONES:
            p = np.array(piv, float)*H; a = bones.get(n, (0, 0, 0))
            R = _R(*a) if not n.startswith('arm') else _R(-a[0], a[1]*(1 if n == 'armL' else -1), a[2] if len(a) > 2 else 0)   # 腕は支点より下にたれるので、前へあげるのは逆まわし
            Rl, tl = R, p-R@p   # 支点のまわりに まわす
            if par is None: Rw, tw = Rl, tl+np.array(move, float)*H
            else: Rp, tp = Ms[par]; Rw, tw = Rp@Rl, Rp@tl+tp
            Ms[n] = (Rw, tw)
        Q = np.zeros_like(P)
        for i, n in enumerate(s.names):
            w = s.W[:, i]
            if not w.any(): continue
            Rw, tw = Ms[n]; Q += w[:, None]*(P@Rw.T+tw)
        if spread != 1.0 and s.sprc:   # とびちる：かたまりのまん中を、むね（のポーズの場所）から はなす
            c0 = Ms['chest'][0]@(np.array([0, 0, 0.45])*H)+Ms['chest'][1]
            for vs in s.sprc.values(): Q[vs] += (Q[vs].mean(0)-c0)*(spread-1)
        lo = Q[:, 2].min()
        if lo < 0: Q[:, 2] -= lo   # 地面にめりこまない
        return Q

def mirror(f): return {k: ((v[0], -v[1], -v[2]) if k in ('root', 'hip', 'chest', 'head') else v) for k, v in f.items()} | ({'armL': f['armR'], 'armR': f['armL']} if 'armL' in f or 'armR' in f else {})

IDLE = [dict(chest=(4, 0, 0), head=(3, 0, 0), armL=(6, 6, 0), armR=(6, 6, 0)),
        dict(chest=(-3, 0, 0), head=(-4, 0, 0), armL=(-6, 14, 0), armR=(-6, 14, 0), move=(0, 0, 0.015))]
W0 = dict(hip=(8, 10, 0), chest=(4, -7, 12), head=(0, -5, -6), armL=(35, 10, 0), armR=(-30, 10, 0), move=(0, 0, 0.03))
WALK = [W0, mirror(W0)]

MOVES = {
    # 体当たりで、両手でひっかく / マフラーがなびいて、うしろへとばされる
    'fast': dict(atk=[dict(hip=(-15, 0, 0), chest=(-16, 0, 0), head=(-12, 0, 0), armL=(-45, 35, 0), armR=(-45, 35, 0)),
                      dict(root=(32, 0, 0), chest=(16, 0, 0), armL=(85, 25, 0), armR=(85, 25, 0), move=(0, 0.16, 0.06)),
                      dict(root=(26, 12, 0), chest=(12, 16, 25), armL=(40, -10, 0), armR=(115, 45, 0), move=(0, 0.2, 0)),
                      dict(root=(8, 0, 0), armL=(15, 10, 0), armR=(15, 10, 0), move=(0, 0.06, 0))],
                 hurt=[dict(root=(-16, 0, 0), chest=(-16, 0, 0), head=(-16, 0, 0), armL=(30, 60, 0), armR=(30, 60, 0), move=(0, -0.08, 0.05)),
                       dict(root=(-16, 16, 0), head=(-16, 0, 0), armL=(60, 95, 0), armR=(60, 95, 0), move=(0, -0.22, 0.2)),
                       dict(root=(-16, 26, 0), chest=(-10, 0, 0), head=(-16, 12, 0), armL=(10, 75, 0), armR=(20, 40, 0), move=(0, -0.28, 0))]),
    # ふくろをふりまわして、たたく / ふくろをだいて、しりもち
    'thief': dict(atk=[dict(chest=(-8, -10, -20), armR=(-30, 40, 0)), dict(chest=(-14, -14, -30), head=(-8, 0, 0), armR=(40, 150, 0)),
                       dict(root=(20, 0, 0), chest=(16, 10, 25), armR=(95, 20, 0), move=(0, 0.08, 0)), dict(root=(6, 0, 0), armR=(20, 20, 0))],
                  hurt=[dict(root=(-16, -8, 0), head=(-16, 0, 0), armL=(30, 50, 0), armR=(10, 40, 0), move=(0, -0.05, 0.03)),
                        dict(root=(-16, 0, 0), chest=(14, 0, 0), head=(14, 0, 0), armL=(70, -20, 0), armR=(70, -30, 0), move=(0, -0.08, 0)),
                        dict(hip=(-16, 0, 0), chest=(25, 0, 0), head=(18, 0, 0), armL=(80, -30, 0), armR=(80, -35, 0), move=(0, -0.06, -0.06))]),
    # 両こぶしをふりあげて、たたきつける / ひざをついて、こぶしを地面につく
    'brute': dict(atk=[dict(chest=(-10, 0, 0), head=(-8, 0, 0), armL=(70, 15, 0), armR=(70, 15, 0)),
                       dict(hip=(-8, 0, 0), chest=(-16, 0, 0), head=(-10, 0, 0), armL=(150, 10, 0), armR=(150, 10, 0), move=(0, 0, 0.04)),
                       dict(hip=(22, 0, 0), chest=(22, 0, 0), head=(10, 0, 0), armL=(15, 0, 0), armR=(15, 0, 0), move=(0, 0.06, -0.02)),
                       dict(chest=(6, 0, 0), armL=(25, 10, 0), armR=(25, 10, 0))],
                  hurt=[dict(root=(-14, -6, 0), chest=(-16, 0, 0), head=(-16, 0, 0), armL=(40, 45, 0), armR=(40, 45, 0)),
                        dict(hip=(26, 0, 0), chest=(14, 0, 0), head=(-6, 0, 0), armL=(30, 10, 0), armR=(30, 10, 0), move=(0, 0.02, -0.03)),
                        dict(hip=(40, 0, 0), chest=(18, 0, 0), head=(-10, 0, 0), armL=(15, 5, 0), armR=(15, 5, 0), move=(0, 0.04, -0.06))]),
    # ハンマーをふりかぶって、ふりおろす / ハンマーを地面につき、もたれる
    'breaker': dict(atk=[dict(chest=(-10, -10, 0), armL=(40, 30, 0)), dict(hip=(-8, 0, 0), chest=(-16, -14, 0), head=(-8, 0, 0), armL=(120, 40, 0), move=(0, 0, 0.03)),
                         dict(hip=(20, 8, 0), chest=(24, 14, 0), armL=(10, -60, 0), move=(0, 0.06, 0)), dict(chest=(8, 4, 0), armL=(15, -25, 0))],
                    hurt=[dict(root=(-14, -8, 0), head=(-16, 0, 0), armL=(50, 30, 0), armR=(30, 40, 0)),
                          dict(root=(-6, 10, 0), chest=(10, 8, 0), armL=(0, -50, 0), armR=(20, 20, 0)),
                          dict(root=(4, 16, 0), hip=(10, 0, 0), chest=(18, 10, 0), head=(14, 10, 0), armL=(-10, -70, 0), armR=(10, 10, 0), move=(0, 0, -0.03))]),
    # 口をあけて、とびついてかむ / 口をとじて、ちぢこまる
    'trapper': dict(atk=[dict(chest=(-12, 0, 0), head=(-16, 0, 0), jaw=(30, 0, 0)), dict(root=(30, 0, 0), head=(-16, 0, 0), jaw=(40, 0, 0), move=(0, 0.18, 0.08)),
                         dict(root=(26, 0, 0), head=(12, 0, 0), jaw=(-8, 0, 0), move=(0, 0.2, 0)), dict(root=(6, 0, 0), move=(0, 0.06, 0))],
                    hurt=[dict(root=(-16, -8, 0), head=(-16, 0, 0), jaw=(15, 0, 0), move=(0, -0.05, 0.03)),
                          dict(hip=(20, 0, 0), chest=(14, 0, 0), head=(16, 0, 0), jaw=(-6, 0, 0), armL=(30, -20, 0), armR=(30, -20, 0)),
                          dict(hip=(32, 0, 0), chest=(24, 0, 0), head=(24, 0, 0), jaw=(-8, 0, 0), armL=(50, -30, 0), armR=(50, -30, 0), move=(0, 0, -0.04))]),
    # 両手をふって、灰をまく / くずれて、灰の山になる
    'ash': dict(atk=[dict(chest=(-10, -12, -20), armL=(-20, 20, 0), armR=(-20, 20, 0), spread=0.8),
                     dict(chest=(-6, -6, -30), armL=(60, 100, 0), armR=(40, 40, 0), spread=1.2),
                     dict(root=(10, 0, 0), chest=(10, 14, 30), armL=(30, 30, 0), armR=(90, 110, 0), spread=1.9), dict(chest=(4, 0, 0), spread=1.3)],
                hurt=[dict(root=(-16, -8, 0), head=(-16, 0, 0), armL=(40, 60, 0), armR=(40, 60, 0)),
                      dict(hip=(30, 10, 0), chest=(20, -10, 0), head=(20, 10, 0), armL=(-20, 30, 0), armR=(-20, 60, 0), move=(0, 0, -0.05), spread=0.8),
                      dict(hip=(55, 14, 0), chest=(35, -14, 0), head=(30, 14, 0), armL=(-30, 70, 0), armR=(-30, 80, 0), move=(0, 0, -0.12), spread=0.6)]),
    # 岩のこぶしで、地面をたたく / ひざをついて、こぶしを地面につく
    'rockc': dict(atk=[dict(chest=(-8, 0, 0), armL=(55, 15, 0), armR=(55, 15, 0)), dict(hip=(-8, 0, 0), chest=(-16, 0, 0), armL=(120, 10, 0), armR=(120, 10, 0), move=(0, 0, 0.03)),
                       dict(hip=(20, 0, 0), chest=(20, 0, 0), armL=(5, 5, 0), armR=(5, 5, 0), move=(0, 0.05, -0.02)), dict(chest=(5, 0, 0), armL=(20, 10, 0), armR=(20, 10, 0))],
                  hurt=[dict(root=(-12, -6, 0), chest=(-14, 0, 0), head=(-16, 0, 0), armL=(35, 40, 0), armR=(35, 40, 0)),
                        dict(hip=(24, 0, 0), chest=(12, 0, 0), head=(-6, 0, 0), armL=(25, 8, 0), armR=(25, 8, 0), move=(0, 0.02, -0.03)),
                        dict(hip=(36, 0, 0), chest=(16, 0, 0), head=(-10, 0, 0), armL=(10, 4, 0), armR=(10, 4, 0), move=(0, 0.04, -0.06))]),
    # かぶとで頭つき / かぶとがずれて、すわりこむ
    'armor': dict(atk=[dict(hip=(-10, 0, 0), chest=(-16, 0, 0), head=(-16, 0, 0), armL=(-30, 25, 0), armR=(-30, 25, 0)),
                       dict(hip=(-14, 0, 0), chest=(-16, 0, 0), head=(-16, 0, 0), armL=(-40, 35, 0), armR=(-40, 35, 0), move=(0, -0.04, 0.03)),
                       dict(root=(28, 0, 0), chest=(14, 0, 0), head=(26, 0, 0), armL=(-50, 20, 0), armR=(-50, 20, 0), move=(0, 0.22, 0.03)), dict(root=(8, 0, 0), move=(0, 0.06, 0))],
                  hurt=[dict(root=(-14, -6, 0), head=(-16, 16, 0), armL=(30, 50, 0), armR=(30, 50, 0), move=(0, -0.04, 0)),
                        dict(hip=(-16, 0, 0), chest=(12, 0, 0), head=(4, 24, 0), armL=(40, 10, 0), armR=(40, 10, 0), move=(0, -0.04, -0.05)),
                        dict(hip=(-16, 0, 0), chest=(20, 0, 0), head=(8, 30, 0), armL=(60, 0, 0), armR=(60, 0, 0), move=(0, -0.06, -0.09))]),
    # 体をひろげて、光る / ちぢんで、光がきえる
    'shiny': dict(atk=[dict(chest=(-8, 0, 0), head=(-6, 0, 0), armL=(-10, 10, 0), armR=(-10, 10, 0), spread=0.8),
                       dict(chest=(-14, 0, 0), head=(-14, 0, 0), armL=(30, 100, 0), armR=(30, 100, 0), move=(0, 0, 0.06), spread=1.5),
                       dict(chest=(-16, 0, 0), head=(-16, 0, 0), armL=(40, 140, 0), armR=(40, 140, 0), move=(0, 0, 0.1), spread=2.0), dict(armL=(10, 30, 0), armR=(10, 30, 0), spread=1.2)],
                  hurt=[dict(root=(-16, -8, 0), head=(-16, 0, 0), armL=(30, 60, 0), armR=(30, 60, 0), move=(0, -0.05, 0.03)),
                        dict(hip=(20, 0, 0), chest=(20, 0, 0), head=(20, 0, 0), armL=(60, -30, 0), armR=(60, -30, 0), spread=0.6),
                        dict(hip=(34, 0, 0), chest=(30, 0, 0), head=(26, 0, 0), armL=(80, -40, 0), armR=(80, -40, 0), move=(0, 0, -0.05), spread=0.2)]),
    # くるっとまわって、花びらをとばす / しおれて、まえへたれる
    'hana': dict(atk=[dict(chest=(-8, 0, -20), armL=(-20, 30, 0), armR=(-20, 30, 0)), dict(root=(0, 0, 120), armL=(10, 100, 0), armR=(10, 100, 0), move=(0, 0, 0.05), spread=1.4),
                      dict(root=(0, 0, 240), armL=(10, 110, 0), armR=(10, 110, 0), move=(0, 0, 0.05), spread=1.9), dict(root=(0, 0, 350), armL=(10, 30, 0), armR=(10, 30, 0), spread=1.2)],
                 hurt=[dict(root=(-16, -8, 0), head=(-16, 0, 0), armL=(30, 50, 0), armR=(30, 50, 0)),
                       dict(hip=(10, 0, 0), chest=(28, 0, 0), head=(30, 0, 0), armL=(-20, 5, 0), armR=(-20, 5, 0)),
                       dict(hip=(16, 0, 0), chest=(40, 0, 0), head=(46, 0, 0), armL=(-30, 0, 0), armR=(-30, 0, 0), move=(0, 0, -0.03), spread=0.9)]),
    # のびあがって、つのをひろげる / しぼむ
    'hoteri': dict(atk=[dict(hip=(10, 0, 0), chest=(14, 0, 0), head=(10, 0, 0), armL=(-10, 10, 0), armR=(-10, 10, 0), move=(0, 0, -0.02)),
                        dict(hip=(-10, 0, 0), chest=(-16, 0, 0), head=(-14, 0, 0), hornL=(0, -30, 0), hornR=(0, 30, 0), armL=(30, 90, 0), armR=(30, 90, 0), move=(0, 0, 0.08)),
                        dict(root=(10, 0, 0), chest=(-12, 0, 0), head=(-10, 0, 0), hornL=(0, -45, 0), hornR=(0, 45, 0), armL=(50, 130, 0), armR=(50, 130, 0), move=(0, 0.04, 0.1)),
                        dict(hornL=(0, -10, 0), hornR=(0, 10, 0), armL=(10, 30, 0), armR=(10, 30, 0), move=(0, 0, 0.02))],
                   hurt=[dict(root=(-16, -8, 0), head=(-16, 0, 0), armL=(30, 50, 0), armR=(30, 50, 0)),
                         dict(hip=(18, 0, 0), chest=(16, 0, 0), head=(18, 0, 0), hornL=(0, 20, 0), hornR=(0, -20, 0), armL=(-10, 0, 0), armR=(-10, 0, 0), move=(0, 0, -0.03)),
                         dict(hip=(30, 0, 0), chest=(26, 0, 0), head=(26, 0, 0), hornL=(0, 40, 0), hornR=(0, -40, 0), armL=(-20, -5, 0), armR=(-20, -5, 0), move=(0, 0, -0.07))]),
    # くるくるまわる / 落ち葉のように、ひらひら地面へ
    'ochiba': dict(atk=[dict(chest=(-8, 0, -30), armL=(0, 40, 0), armR=(0, 40, 0)), dict(root=(0, 0, 100), armL=(10, 100, 0), armR=(10, 100, 0), move=(0, 0, 0.08)),
                        dict(root=(0, 0, 200), armL=(10, 110, 0), armR=(10, 110, 0), move=(0, 0, 0.12)), dict(root=(0, 0, 300), armL=(10, 60, 0), armR=(10, 60, 0), move=(0, 0, 0.04))],
                   hurt=[dict(root=(-10, 30, 0), head=(-10, 10, 0), armL=(40, 90, 0), armR=(40, 90, 0), move=(-0.06, 0, 0.16)),
                         dict(root=(-10, -34, 0), head=(-6, -10, 0), armL=(40, 90, 0), armR=(40, 90, 0), move=(0.06, 0, 0.08)),
                         dict(root=(-16, 70, 0), head=(-10, 10, 0), armL=(10, 60, 0), armR=(10, 60, 0), move=(-0.04, -0.05, 0))]),
    # のびあがって、体でのしかかる / ふるえて、とけてつぶれる
    'yuki': dict(atk=[dict(hip=(10, 0, 0), chest=(10, 0, 0), armL=(-20, 20, 0), armR=(-20, 20, 0), move=(0, 0, -0.02)),
                      dict(hip=(-10, 0, 0), chest=(-16, 0, 0), head=(-12, 0, 0), armL=(110, 40, 0), armR=(110, 40, 0), move=(0, -0.03, 0.08)),
                      dict(root=(26, 0, 0), chest=(22, 0, 0), head=(12, 0, 0), armL=(70, 20, 0), armR=(70, 20, 0), move=(0, 0.16, 0)), dict(root=(6, 0, 0), move=(0, 0.04, 0))],
                 hurt=[dict(root=(-10, 6, 0), chest=(-6, -8, 0), head=(-14, 8, 0), armL=(20, 40, 0), armR=(20, 40, 0)),
                       dict(root=(-6, -8, 0), chest=(12, 10, 0), head=(16, -10, 0), armL=(30, 20, 0), armR=(30, 20, 0), move=(0, 0, -0.03)),
                       dict(hip=(30, 0, 0), chest=(30, 0, 0), head=(30, 0, 0), armL=(-20, 40, 0), armR=(-20, 40, 0), move=(0, 0, -0.09))]),
}

def poses(name):
    m = MOVES[name]; return dict(idle=IDLE, walk=WALK, atk=m['atk'], hurt=m['hurt'])
