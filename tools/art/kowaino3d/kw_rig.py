"""コワイノのモーション：部品（手・持ち物・かざり）を動かし、そのあと体ぜんたいを、足もとを支点に曲げる・つぶす・かたむける（布の体なので、上ほど大きくしなる）。
点 P は写すときの向き（x よこ（+右）・y 前（カメラのほう）・z 上）。長さは、どれも体の高さ H のうち。
コマ数は、いまのゲームの絵と同じ：待機2・歩き2・攻撃4（ためる → ふりかぶる → うつ → もどる）・やられ3（ひるむ → とちゅう → さいご）。
攻撃とやられは、コワイノごと（MOVES。持ち主とえらんだ案）。
体：bob 上下・sq たてのちぢみ（よこは体積をたもって広がる）・wide よこだけ広げる・scale 大きさ・lean 前へたおす（度）・roll よこへかたむける（度、+右）・bend しなり（上ほど大きく曲がる）・spin まわる（度。上から見て）
部品（parts）：sel でえらんだ部品を、piv（支点）のまわりに ax の軸で deg 度まわし、move だけうごかす。spread は、piv からのはなれぐあいを何倍にするか（とびちる・あつまる）。
  sel：labels（色わけの名前）・box（部品のかたまりのまん中がこの中：((x0,x1),(y0,y1),(z0,z1))）・ball（面のまん中がこの玉の中：(x,y,z,半径)）"""
CEN = None
import math
import numpy as np

AX = {'x': (1, 0, 0), 'y': (0, 1, 0), 'z': (0, 0, 1)}   # x：前うしろにふる（+で前の物が上へ）・y：よこにふる（+で上の物が右へ）・z：上から見てまわす

def _rot(axis, deg):
    t = math.radians(deg); c, s = math.cos(t), math.sin(t); x, y, z = axis
    return np.array([[c+x*x*(1-c), x*y*(1-c)-z*s, x*z*(1-c)+y*s], [y*x*(1-c)+z*s, c+y*y*(1-c), y*z*(1-c)-x*s], [z*x*(1-c)-y*s, z*y*(1-c)+x*s, c+z*z*(1-c)]])

IDLE = [dict(), dict(sq=0.95)]
WALK = [dict(roll=7, bob=0.03, lean=6), dict(roll=-7, bob=0.03, lean=6)]
def P_(sel, piv, ax='x', deg=0, move=(0, 0, 0), spread=1.0): return dict(sel=sel, piv=piv, ax=ax, deg=deg, move=move, spread=spread)
def HM(deg): return [P_(HAMMER, HP, 'y', deg), P_(HAND, HP, 'y', deg)]   # ハンマーと、もつ手を、いっしょに
HAND = dict(labels=['hand'])
SCARF = dict(labels=['deco'])
SACK = dict(labels=['base', 'red', 'deco'], ball=(0.3, 0.1, 0.25, 0.2))
HAMMER = dict(labels=['deco'], box=((-1, 0.0), (-1, 1), (0, 1.0)))
TEETH = dict(labels=['deco'], box=((-1, 1), (0.15, 1), (0, 0.5)))
ASH = dict(labels=['deco', 'pom'])
HELM = dict(labels=['deco'], box=((-1, 1), (-1, 1), (0.6, 1.2)))
SPARK = dict(labels=['deco'])
PETAL = dict(labels=['deco'], box=((-1, 1), (-1, 1), (0, 0.5)))
HORNL = dict(labels=['deco'], box=((-1, -0.1), (-1, 1), (0.6, 1.2)))
HORNR = dict(labels=['deco'], box=((0.1, 1), (-1, 1), (0.6, 1.2)))
SP = (0.15, 0.1, 0.45); HP = (-0.05, 0.1, 0.4)

MOVES = {
    # 体当たりで、両手でひっかく / マフラーがなびいて、うしろへとばされる
    'fast': dict(atk=[dict(sq=0.85, lean=-12), dict(sq=1.1, lean=30, bob=0.05), dict(lean=34, roll=14, sq=0.95), dict(lean=8)],
                 hurt=[dict(lean=-20, parts=[P_(SCARF, (0, 0, 0.42), 'y', -25)]), dict(lean=-34, bob=0.12, parts=[P_(SCARF, (0, 0, 0.42), 'y', -45)]),
                       dict(lean=-26, sq=0.8, parts=[P_(SCARF, (0, 0, 0.42), 'y', -15)])]),
    # ふくろをふりまわして、たたく / ふくろをだいて、しりもち
    'thief': dict(atk=[dict(lean=-6, parts=[P_(SACK, SP, 'y', -40)]), dict(lean=-12, sq=1.05, parts=[P_(SACK, SP, 'y', -125)]),
                       dict(lean=16, sq=0.92, parts=[P_(SACK, SP, 'x', -25, (-0.15, 0.1, 0))]), dict(lean=6, parts=[P_(SACK, SP, 'y', -15)])],
                  hurt=[dict(lean=-12, roll=-6), dict(sq=0.85, lean=-10, parts=[P_(SACK, (0, 0, 0.3), move=(-0.15, 0.12, 0.05))]),
                        dict(sq=0.72, lean=-22, parts=[P_(SACK, (0, 0, 0.3), move=(-0.18, 0.15, 0.08))])]),
    # 両こぶしをふりあげて、たたきつける / ひざをついて、こぶしを地面につく
    'brute': dict(atk=[dict(lean=-8, parts=[P_(HAND, (0, 0.05, 0.42), 'x', 60)]), dict(lean=-14, sq=1.08, parts=[P_(HAND, (0, 0.05, 0.42), 'x', 115)]),
                       dict(lean=18, sq=0.86, parts=[P_(HAND, (0, 0.05, 0.42), 'x', -15)]), dict(lean=5, parts=[P_(HAND, (0, 0.05, 0.42), 'x', 10)])],
                  hurt=[dict(lean=-12, roll=-6, parts=[P_(HAND, (0, 0.05, 0.42), 'x', 20)]), dict(sq=0.85, lean=10, parts=[P_(HAND, (0, 0.05, 0.42), 'x', -20)]),
                        dict(sq=0.72, lean=18, parts=[P_(HAND, (0, 0.05, 0.42), 'x', -35, (0, 0.04, -0.04))])]),
    # ハンマーをふりかぶって、ふりおろす / ハンマーを地面につき、もたれる
    'breaker': dict(atk=[dict(lean=-6, parts=HM(-25)), dict(lean=-12, sq=1.05, parts=HM(-45)),
                         dict(lean=16, sq=0.9, parts=HM(75)), dict(lean=5, parts=HM(35))],
                    hurt=[dict(lean=-10, roll=-8, parts=HM(-15)), dict(sq=0.9, lean=8, parts=HM(60)),
                          dict(sq=0.82, lean=10, roll=10, parts=HM(85))]),
    # 口をあけて、とびついてかむ / 口をとじて、ちぢこまる
    'trapper': dict(atk=[dict(lean=-8, sq=1.05, parts=[P_(TEETH, (0, 0, 0), move=(0, 0.02, -0.07))]), dict(lean=24, bob=0.06, parts=[P_(TEETH, (0, 0, 0), move=(0, 0.02, -0.09))]),
                         dict(lean=20, sq=0.9, parts=[P_(TEETH, (0, 0, 0), move=(0, 0, 0.02))]), dict(lean=5)],
                    hurt=[dict(lean=-10, sq=0.95), dict(sq=0.82, parts=[P_(TEETH, (0, 0, 0), move=(0, 0, 0.02))]), dict(sq=0.72, scale=0.85, parts=[P_(TEETH, (0, 0, 0), move=(0, 0, 0.03))])]),
    # 両手をふって、灰をまく / くずれて、灰の山になる
    'ash': dict(atk=[dict(lean=-8, roll=-10, parts=[P_(ASH, (0, 0, 0.45), spread=0.8)]), dict(roll=12, sq=1.06, parts=[P_(ASH, (0, 0, 0.45), spread=1.4)]),
                     dict(lean=10, roll=4, parts=[P_(ASH, (0, 0, 0.45), spread=1.9)]), dict(lean=4, parts=[P_(ASH, (0, 0, 0.45), spread=1.2)])],
                hurt=[dict(lean=-10, roll=-8), dict(sq=0.7, wide=1.15, parts=[P_(ASH, (0, 0, 0), spread=0.7)]), dict(sq=0.42, wide=1.35, parts=[P_(ASH, (0, 0, 0), spread=0.5)])]),
    # 岩のこぶしで、地面をたたく / ひざをついて、こぶしを地面につく
    'rockc': dict(atk=[dict(lean=-6, parts=[P_(HAND, (0, 0.05, 0.35), 'x', 45)]), dict(lean=-12, sq=1.06, parts=[P_(HAND, (0, 0.05, 0.35), 'x', 95)]),
                       dict(lean=14, sq=0.84, parts=[P_(HAND, (0, 0.05, 0.35), 'x', -20, (0, 0.03, -0.03))]), dict(lean=4)],
                  hurt=[dict(lean=-10, roll=-6, parts=[P_(HAND, (0, 0.05, 0.35), 'x', 15)]), dict(sq=0.86, lean=10, parts=[P_(HAND, (0, 0.05, 0.35), 'x', -15)]),
                        dict(sq=0.74, lean=16, parts=[P_(HAND, (0, 0.05, 0.35), 'x', -25, (0, 0.04, -0.04))])]),
    # かぶとで頭つき / かぶとがずれて、すわりこむ
    'armor': dict(atk=[dict(lean=-16), dict(lean=-22, sq=1.05), dict(lean=32, bob=0.03), dict(lean=8)],
                  hurt=[dict(lean=-10, roll=-6, parts=[P_(HELM, (0, 0, 0.6), 'y', 10)]), dict(sq=0.86, parts=[P_(HELM, (0, 0, 0.6), 'y', 18, (0.03, 0, -0.02))]),
                        dict(sq=0.76, lean=-8, parts=[P_(HELM, (0, 0, 0.6), 'y', 26, (0.05, 0.02, -0.05))])]),
    # 体をひろげて、光る / ちぢんで、光がきえる
    'shiny': dict(atk=[dict(sq=0.9, parts=[P_(SPARK, (0, 0, 0.5), spread=0.8)]), dict(scale=1.15, parts=[P_(SPARK, (0, 0, 0.5), spread=1.5)]),
                       dict(scale=1.25, sq=1.05, parts=[P_(SPARK, (0, 0, 0.5), spread=1.9)]), dict(scale=1.05, parts=[P_(SPARK, (0, 0, 0.5), spread=1.2)])],
                  hurt=[dict(lean=-10, roll=-8), dict(scale=0.85, parts=[P_(SPARK, (0, 0, 0.5), spread=0.6)]), dict(scale=0.7, sq=0.9, parts=[P_(SPARK, (0, 0, 0.5), spread=0.2)])]),
    # くるっとまわって、花びらをとばす / しおれて、まえへたれる
    'hana': dict(atk=[dict(lean=-8), dict(spin=120, parts=[P_(PETAL, (0, 0, 0.45), spread=1.3)]), dict(spin=240, parts=[P_(PETAL, (0, 0, 0.45), spread=1.7)]), dict(spin=360)],
                 hurt=[dict(lean=-10, roll=-6), dict(lean=26, bend=1.0, sq=0.9), dict(lean=44, bend=1.2, sq=0.8, parts=[P_(PETAL, (0, 0, 0), move=(0, 0, -0.15))])]),
    # のびあがって、つのをひろげる / しぼむ
    'hoteri': dict(atk=[dict(sq=0.88), dict(sq=1.15, parts=[P_(HORNL, (-0.2, 0, 0.75), 'y', -25), P_(HORNR, (0.2, 0, 0.75), 'y', 25)]),
                        dict(sq=1.2, lean=10, parts=[P_(HORNL, (-0.2, 0, 0.75), 'y', -38), P_(HORNR, (0.2, 0, 0.75), 'y', 38)]), dict(sq=1.04)],
                   hurt=[dict(lean=-10, roll=-6), dict(sq=0.8, scale=0.95), dict(sq=0.6, wide=1.12, parts=[P_(HORNL, (-0.2, 0, 0.75), 'y', 30), P_(HORNR, (0.2, 0, 0.75), 'y', -30)])]),
    # くるくるまわる / 落ち葉のように、ひらひら地面へ
    'ochiba': dict(atk=[dict(sq=0.9), dict(spin=90, bob=0.06), dict(spin=180, bob=0.08, lean=10), dict(spin=270, bob=0.03)],
                   hurt=[dict(roll=22, bob=0.1), dict(roll=-26, bob=0.05), dict(sq=0.45, wide=1.2, roll=8)]),
    # のびあがって、体でのしかかる / ふるえて、とけてつぶれる
    'yuki': dict(atk=[dict(sq=0.9), dict(sq=1.15, lean=-10), dict(lean=30, sq=0.85), dict(lean=8)],
                 hurt=[dict(roll=5, sq=0.97), dict(roll=-5, sq=0.85), dict(sq=0.55, wide=1.2)]),
}

def poses(name):
    m = MOVES[name]; return dict(idle=IDLE, walk=WALK, atk=m['atk'], hurt=m['hurt'])

def _comps(lab, comp, F, sel):
    """sel の色わけの、つながった かたまりごとの面（かたまりの番号 → 面）"""
    fs = np.isin(lab, sel['labels'])
    if 'ball' in sel: fs &= np.linalg.norm(CEN-np.array(sel['ball'][:3]), axis=1) < sel['ball'][3]   # ball：面のまん中がこの玉の中（つながった体の一部をえらぶ）
    return {q: np.nonzero(fs & (comp == q))[0] for q in np.unique(comp[fs])}

def pose(P, H, F=None, lab=None, comp=None, bob=0.0, sq=1.0, wide=1.0, scale=1.0, lean=0.0, roll=0.0, bend=0.6, spin=0.0, parts=(), fall=0.0):
    P = np.array(P, float); global CEN; CEN = P[F].mean(1)/H if F is not None else None
    for pt in parts:   # 部品：まわす・うごかす・とびちる（体の曲げの前に。体といっしょに曲がる）
        piv = np.array(pt['piv'], float)*H; R = _rot(AX[pt['ax']], pt['deg']) if pt.get('deg') else None; mv = np.array(pt.get('move', (0, 0, 0)), float)*H; done = set()
        for q, ks in _comps(lab, comp, F, pt['sel']).items():
            cc = P[F[ks]].mean((0, 1))/H
            if 'box' in pt['sel'] and not all(lo <= cc[i] <= hi for i, (lo, hi) in enumerate(pt['sel']['box'])): continue
            vs = np.array(sorted(set(F[ks].ravel().tolist())-done), int); done |= set(vs.tolist())
            if not len(vs): continue
            Q = P[vs]
            if R is not None: Q = (Q-piv)@R.T+piv
            if pt.get('spread', 1.0) != 1.0: Q = Q+(Q.mean(0)-piv)*(pt['spread']-1)   # かたまりのまん中を、piv からはなす
            P[vs] = Q+mv
    z = np.clip(P[:, 2]/H, 0, 1.2)
    w = 1/math.sqrt(sq); P[:, 0] *= w*wide; P[:, 1] *= w; P[:, 2] *= sq   # つぶす（体積をたもつ）・よこに広げる
    if scale != 1.0: P *= scale
    if lean or roll:   # 曲げ：足もとを支点に、角度×(1-bend+bend*z)（上ほど大きく。布のしなり）
        k = (1-bend)+bend*z
        for ax, deg in (((1, 0, 0), -lean), ((0, 1, 0), roll)):
            if not deg: continue
            P = np.stack([_rot(ax, deg*k[i])@P[i] for i in range(len(P))])
    if spin: P = P@_rot((0, 0, 1), spin).T
    if fall: P = P@_rot((0, 1, 0), fall).T; P[:, 2] -= P[:, 2].min()
    P[:, 2] += bob*H
    return P
