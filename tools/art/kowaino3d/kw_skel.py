"""コワイノのボーン（骨）とモーション。持ち主が直したモデル（models/kg_<名前>.glb）に、骨を入れて、点に重みをつけ（スキニング）、骨をまわしてポーズをつける。
点 P は写すときの向き（x よこ（+右）・y 前（カメラのほう）・z 上）。長さは、どれも体の高さ H のうち。
骨（BONES：名前・親・支点）：root（足もと）→ hip（こし）→ chest（むね）→ head（あたま）、chest → armL・armR（かた）・jaw（あご）、head → hornL・hornR（つの）、root → footL・footR（足）。
重み：
  体：高さで、なめらかに root・hip・chest・head にわける（WZ）。
  足（foot）：その がわの足の骨。
  腕：手（hand）があるコワイノは、手の点を腕へ（かたい）。まわりは ARMR の中だけ、なめらかに（体がのびないように）。腕の支点は、手の場所からきめる（かたの高さ）。
      手がないコワイノは、そで（よこのはしの、こしからむねの高さ）を腕へ。
  持ち物・かざり：かたまりごとに、ATTACH の骨へ（なければ、高い所は head、ほかは chest）。
ポーズ（コマ）：骨ごとに (lean 前へ, roll 右へ, twist 上から見て, dx, dy, dz) 度・長さ。腕は (fwd 前へあげる, out 外へひらく, twist, …)。
  move：体ぜんたいを うごかす。flutter：(強さ, 位相) すそを ひらひら。look：(よこ, たて) 目を うごかす。
  spread：とびちる かざり（体とはなれた かたまりだけ）を、むねからはなす倍。orbit：とびちる かざりを、体のまわりにまわす（度）。
  fx：パーティクル [(しゅるい, (x,y,z), 数, ひろがり, 大きさ)]（しゅるいは kowaino_paint.FXCOL）。melt：とける・scale：大きさ。
コマ数：待機4（体はうごかさず、布だけ なびく）・歩き4（右足 → すれちがい → 左足 → すれちがい）・攻撃4（ためる → ふりかぶる → うつ → もどる）・やられ3（ひるむ → とちゅう → さいご＝たおされたとき）。
攻撃とやられは、コワイノごと（MOVES。持ち主とえらんだ案）。体をうしろへそるのは −16度まで（すその裏が見えて暗くなる）。
攻撃は、頭を大きく うごかさない（首で うちけす NECK）。ため・のび（ATKSQ）と、布のおくれ（LAGK）を、どのコワイノにも入れる。"""
import math
import numpy as np

BONES = [('root', None, (0, 0, 0)), ('hip', 'root', (0, 0, 0.12)), ('chest', 'hip', (0, 0, 0.36)), ('head', 'chest', (0, 0.02, 0.54)),
         ('armL', 'chest', (-0.2, 0.05, 0.4)), ('armR', 'chest', (0.2, 0.05, 0.4)), ('jaw', 'chest', (0, 0.15, 0.45)),
         ('hornL', 'head', (-0.2, 0, 0.74)), ('hornR', 'head', (0.2, 0, 0.74)), ('footL', 'root', (-0.08, 0, 0.06)), ('footR', 'root', (0.08, 0, 0.06))]
WZ = ((0.03, 0.2), (0.26, 0.46), (0.46, 0.62))
ARMR = 0.07
SLEEVE = ((0.24, 0.36), (0.2, 0.46))   # 手がないとき：そで（よこのはしのきょり・高さ）。すその横まで ひろげない（すそが ひっぱられて裏地が見える）
SLEEVEW = 0.7   # 手がないとき：そでの重みの いちばん大きい わり
HEM = 0.3

ATTACH = {
    'thief': [(['base'], dict(box=((0.12, 1), (-1, 1), (0, 0.5)), small=True), 'armR')],   # ふくろ（3Dモデルで体からわけた）：右手
    'breaker': [(['deco'], dict(box=((-1, 0.0), (-1, 1), (0, 1.0))), 'armL')],   # ハンマー：左腕（ハンマーをもつ手は、手の重みで左腕へ。右手は右腕のまま）
    'trapper': [(['deco'], dict(box=((-1, 1), (0.15, 1), (0, 0.5))), 'jaw')],   # 牙：あご
    'hoteri': [(['deco'], dict(box=((-1, -0.1), (-1, 1), (0.6, 1.2))), 'hornL'), (['deco'], dict(box=((0.1, 1), (-1, 1), (0.6, 1.2))), 'hornR')],
}
TIP = {'fast': 'far', 'thief': 'pom', 'breaker': 'pom', 'shiny': 'pom', 'hana': 'pom', 'yuki': 'pom', 'ash': 'far', 'armor': 'far', 'hoteri': 'far', 'ochiba': 'far'}   # なびくフードの先（pom：ぽんぽん・far：頭からいちばん遠い うしろの点）
TIPZ = 0.6   # フードの先をさがす高さ（これより上）
TAILL = {'yuki': 0.9}   # 長くたれた フードのしっぽ：先からこの きょりまで、あたまの骨に
HOODAMP = 0.03   # フードの先が なびく大きさに、たす（高さのうち）
TIPL = 0.35   # フードの先から、なびく はんい（メッシュの辺をたどった きょり）
SCARF = {'fast': True}   # マフラー（体とはなれた かざり）が なびく
SPREAD = {'ash': ['deco'], 'shiny': ['deco'], 'hana': ['deco']}
SPREADZ = {'hana': 0.5}

def smooth(e0, e1, x): t = np.clip((x-e0)/(e1-e0), 0, 1); return t*t*(3-2*t)

def _r(axis, deg):
    t = math.radians(deg); c, s = math.cos(t), math.sin(t); x, y, z = axis
    return np.array([[c+x*x*(1-c), x*y*(1-c)-z*s, x*z*(1-c)+y*s], [y*x*(1-c)+z*s, c+y*y*(1-c), y*z*(1-c)-x*s], [z*x*(1-c)-y*s, z*y*(1-c)+x*s, c+z*z*(1-c)]])
def _R(lean=0, roll=0, twist=0): return _r((0, 0, 1), twist)@_r((0, 1, 0), roll)@_r((1, 0, 0), -lean)

def _sel_faces(P, F, lab, comp, H, labels, sel):
    fs = np.isin(lab, labels); c = P[F].mean(1)/H; big = np.bincount(comp).argmax()
    out = np.zeros(len(F), bool)
    for q in np.unique(comp[fs]):
        if sel.get('small') and q == big: continue
        k = fs & (comp == q); cc = c[k].mean(0)
        if 'box' in sel and not all(lo <= cc[i] <= hi for i, (lo, hi) in enumerate(sel['box'])): continue
        out |= k
    return out

class Skel:
    def __init__(s, name, P, F, lab, comp, H):
        s.H = H; s.names = [b[0] for b in BONES]; nb = len(BONES); V = len(P); z = P[:, 2]/H; ax = np.abs(P[:, 0])/H
        s.piv = {n: np.array(p, float)*H for n, _, p in BONES}
        a1, a2, a3 = (smooth(e0, e1, z) for e0, e1 in WZ)
        W = np.zeros((V, nb)); ix = {n: i for i, n in enumerate(s.names)}
        W[:, ix['root']] = 1-a1; W[:, ix['hip']] = a1-a2; W[:, ix['chest']] = a2-a3; W[:, ix['head']] = a3
        def put(vs, bone, w=1.0):
            w = np.broadcast_to(np.asarray(w, float), (len(vs),))[:, None]; W[vs] *= (1-w); W[vs, ix[bone]] += w[:, 0]
        hand = lab == 'hand'; big = np.bincount(comp).argmax()
        if hand.sum() > 20:
            from scipy.spatial import cKDTree
            hv = np.unique(F[hand]); d, _ = cKDTree(P[hv]).query(P); wa = 1-smooth(0, ARMR*H, d)
            for side, bone in ((-1, 'armL'), (1, 'armR')):
                m = (np.sign(P[:, 0]) == side) & (wa > 0); hs = hv[np.sign(P[hv, 0]) == side]
                if len(hs): hc = P[hs].mean(0); s.piv[bone] = np.array([hc[0]-side*0.1*H, hc[1]*0.4, max(hc[2]+0.14*H, 0.38*H)])   # 腕の支点：手の内がわ・上（かたの高さ）
                put(np.nonzero(m)[0], bone, wa[m])
        else:
            bodyv0 = np.zeros(V, bool); bodyv0[np.unique(F[comp == big])] = True   # 体のかたまりだけ（マフラーなど、はなれた物は腕にしない）
            wa = smooth(*SLEEVE[0], ax)*smooth(SLEEVE[1][0], SLEEVE[1][0]+0.06, z)*(1-smooth(SLEEVE[1][1]-0.06, SLEEVE[1][1], z))*(P[:, 1] > -0.1*H)*bodyv0*SLEEVEW
            for side, bone in ((-1, 'armL'), (1, 'armR')):
                m = (np.sign(P[:, 0]) == side) & (wa > 0); put(np.nonzero(m)[0], bone, wa[m])
        took = np.zeros(len(F), bool)
        for labels, sel, bone in ATTACH.get(name, []):
            fs = _sel_faces(P, F, lab, comp, H, labels, sel) & ~took; took |= fs; put(np.unique(F[fs]), bone)
        deco = np.isin(lab, ['deco', 'pom']) & ~took
        for q in np.unique(comp[deco]):
            k = deco & (comp == q); vs = np.unique(F[k])
            if (P[vs, 2].mean()/H) > 0.55: put(vs, 'head')
            elif q != big: put(vs, 'chest')   # 体とはなれた かざり（マフラーなど）は、むねに（腕・こしに わかれない）
        fv = np.unique(F[lab == 'foot'])
        for side, bone in ((-1, 'footL'), (1, 'footR')):
            vs = fv[np.sign(P[fv, 0]) == side]; W[vs] = 0; W[vs, ix[bone]] = 1
        W /= np.maximum(W.sum(1, keepdims=True), 1e-9); s.W = W
        s.hem = (1-smooth(HEM*0.4, HEM, z))*(W[:, ix['footL']]+W[:, ix['footR']] < 0.5); s.ang = np.arctan2(P[:, 1], P[:, 0])
        # なびく布：フードの先（先からの きょり＝メッシュの辺をたどった きょり。体の布を まきこまない）と、マフラーのはし（体とはなれた かたまり）
        from scipy.sparse import coo_matrix
        from scipy.sparse.csgraph import dijkstra
        e = np.concatenate([F[:, [0, 1]], F[:, [1, 2]], F[:, [2, 0]]]); ln = np.linalg.norm(P[e[:, 0]]-P[e[:, 1]], axis=1)
        G = coo_matrix((ln, (e[:, 0], e[:, 1])), shape=(V, V)).tocsr(); G = G.maximum(G.T)
        bodyv = np.zeros(V, bool); bodyv[np.unique(F[comp == big])] = True; s.tw = np.zeros(V)
        tip = TIP.get(name)
        if tip is not None:
            if tip == 'pom' and (lab == 'pom').any(): tv = np.unique(F[lab == 'pom']); t0 = tv[np.argmin(np.linalg.norm(P[tv]-P[tv].mean(0), axis=1))]
            else:
                hc = np.array([0, 0, 0.6*H]); far = np.linalg.norm(P-hc, axis=1)*(z > TIPZ)*(P[:, 1] < 0.05*H)*bodyv; t0 = int(np.argmax(far))   # 頭の高さより上の、うしろの いちばん遠い点（すその はしを まちがえない）
            d = dijkstra(G, indices=t0, limit=TAILL.get(name, TIPL)*H); d[~np.isfinite(d)] = 9*H
            s.tw = (1-smooth(0, TIPL*H, d))**1.5; s.tw[np.unique(F[lab == 'pom'])] = 1.0 if tip == 'pom' else s.tw[np.unique(F[lab == 'pom'])]   # ぽんぽんは、先といっしょに（かたいまま）。フードの先に ぽんぽんがない物（ハイカゲの すじ）は そのまま
            tail = 1-smooth(TAILL.get(name, TIPL)*H*0.8, TAILL.get(name, TIPL)*H, d)   # フードのしっぽ：ぜんぶ あたまの骨に（高さで こし・むねに わかれて、のびないように）
            W *= (1-tail)[:, None]; W[:, ix['head']] += tail
        s.sw = np.zeros(V); s.sdir = np.zeros((V, 3))
        for q in SCARF.get(name, []) and np.unique(comp[(lab == 'deco')]):
            if q == big: continue
            vs = np.unique(F[comp == q]); a0 = vs[np.argmin(np.abs(P[vs, 0]))]   # 首に近い はし
            d = dijkstra(G, indices=a0); dv = d[vs]; L = max(1e-9, dv[np.isfinite(dv)].max()); s.sw[vs] = np.clip(dv/L, 0, 1)
        s.sprc = []
        if name in SPREAD:
            fs = np.isin(lab, SPREAD[name]) & ~took
            for q in np.unique(comp[fs]):
                if q == big: continue
                vs = np.unique(F[comp == q])
                if P[vs, 2].mean()/H > SPREADZ.get(name, 9): continue
                s.sprc.append(vs)

    def pose(s, P, move=(0, 0, 0), spread=1.0, orbit=0.0, melt=0.0, scale=1.0, flutter=(0, 0), look=(0, 0), fx=(), wave=(0, 0), lag=(0, 0, 0), sq=1.0, **bones):
        H = s.H; Ms = {}
        for n, par, _ in BONES:
            p = s.piv[n]; a = tuple(bones.get(n, ())) + (0,)*6
            R = _R(*a[:3]) if not n.startswith('arm') else _R(-a[0], a[1]*(1 if n == 'armL' else -1), a[2])   # 腕は支点より下にたれるので、前へあげるのは逆まわし
            Rl, tl = R, p-R@p+np.array(a[3:6], float)*H
            if par is None: Rw, tw = Rl, tl+np.array(move, float)*H
            else: Rp, tp = Ms[par]; Rw, tw = Rp@Rl, Rp@tl+tp
            Ms[n] = (Rw, tw)
        Q = np.zeros_like(P)
        for i, n in enumerate(s.names):
            w = s.W[:, i]
            if not w.any(): continue
            Rw, tw = Ms[n]; Q += w[:, None]*(P@Rw.T+tw)
        if flutter[0]:   # すそを ひらひら（まわりの角度で波うつ。外と上へ）
            wv = np.sin(s.ang*3+flutter[1])*flutter[0]*H*s.hem; d = np.stack([np.cos(s.ang), np.sin(s.ang), 0*s.ang], 1)
            Q += wv[:, None]*d; Q[:, 2] += np.abs(wv)*0.6
        if wave[0]:   # なびく：はしほど大きく、先へ すすむ波（位相＝コマ。くりかえすと つながる）。うごいた向きと はんたいへ おくれる
            amp, ph = wave
            if s.tw.any():
                w = s.tw; ah = amp+HOODAMP; Q[:, 0] += w*ah*H*np.sin(ph-w*2.2); Q[:, 2] += w*ah*H*0.5*np.cos(ph-w*2.2)   # フードの先は、マフラーより大きく なびく
            if s.sw.any():
                w = s.sw; Q[:, 2] += w*amp*H*1.6*np.sin(ph-w*3.5); Q[:, 1] += w*amp*H*0.8*np.cos(ph-w*3.5)
        if any(lag):   # 布のおくれ：体が うごいた向きと はんたいへ、はしほど大きく のこる（すそは半分）
            lg = np.array(lag, float)*H
            for w in (s.tw**2, s.sw**2, s.hem*0.5):
                if w.any(): Q += w[:, None]*lg
        if s.sprc:   # とびちる かざり：むねのまわりで はなす・まわす
            c0 = Ms['chest'][0]@(np.array([0, 0, 0.45])*H)+Ms['chest'][1]; Ro = _r((0, 0, 1), orbit)
            for vs in s.sprc:
                c = Q[vs].mean(0); nc = c0+Ro@(c-c0)*spread; Q[vs] += nc-c
        if sq != 1.0:   # ため（ちぢむ）・のび：足もとを もとに、たてに sq、よこは体積をたもつ
            Q[:, 2] *= sq; Q[:, :2] *= 1/math.sqrt(sq)
        if melt:   # とける（ユキカゲのたおれ方）：上ほど下へ、下ほどよこへ広がる
            z = Q[:, 2]/H; Q[:, 2] *= (1-melt*np.clip(z, 0, 1)); Q[:, :2] *= (1+melt*0.6*(1-np.clip(z, 0, 1)))[:, None]
        if scale != 1.0: Q = Q*scale
        lo = Q[:, 2].min()
        if lo < 0: Q[:, 2] -= lo
        s.Ms = Ms; return Q

IDLE = [dict(wave=(0.03, i*math.pi/2), flutter=(0.012, i*math.pi/2)) for i in range(4)]   # 待機：体はうごかさない（頭を上げ下げしない。持ち主）。フードの先・マフラーだけ なびく
WALK = [dict(hip=(5, 4, 0), chest=(2, -3, 4), head=(0, -2, -3), armL=(8, 4, 0), armR=(-6, 4, 0), footL=(0, 0, 0, 0, 0.05, 0), footR=(0, 0, 0, 0, -0.05, 0.02), flutter=(0.025, 0), look=(0.01, 0), wave=(0.05, 0)),
        dict(hip=(4, 0, 0), chest=(2, 0, 0), armL=(0, 4, 0), armR=(0, 4, 0), footR=(0, 0, 0, 0, 0, 0.05), flutter=(0.03, 1.6), move=(0, 0, 0.03), look=(0.012, 0.004), wave=(0.05, 1.57)),
        dict(hip=(5, -4, 0), chest=(2, 3, -4), head=(0, 2, 3), armL=(-6, 4, 0), armR=(8, 4, 0), footL=(0, 0, 0, 0, -0.05, 0.02), footR=(0, 0, 0, 0, 0.05, 0), flutter=(0.025, 3.1), look=(-0.01, 0), wave=(0.05, 3.14)),
        dict(hip=(4, 0, 0), chest=(2, 0, 0), armL=(0, 4, 0), armR=(0, 4, 0), footL=(0, 0, 0, 0, 0, 0.05), flutter=(0.03, 4.7), move=(0, 0, 0.03), look=(-0.012, 0.004), wave=(0.05, 4.71))]
WALKX = {'hana': [dict(orbit=12), dict(orbit=24), dict(orbit=36), dict(orbit=48)], 'shiny': [dict(orbit=15), dict(orbit=30), dict(orbit=45), dict(orbit=60)], 'ash': [dict(orbit=10), dict(orbit=20), dict(orbit=30), dict(orbit=40)]}

MOVES = {
    # 体当たりで、両手でひっかく / くるっとまわって、とばされ、よこにたおれる
    'fast': dict(atk=[dict(hip=(-8, 0, 0), chest=(-12, 0, 0), armL=(-30, 25, 0), armR=(-30, 25, 0), flutter=(0.03, 0), fx=[('dust', (0, 0, 0.02), 4, 0.15, 0.03)]),
                      dict(root=(6, 16, 0), chest=(8, 0, 0), armL=(60, 30, 0), armR=(60, 30, 0), move=(0.2, 0.04, 0.04), flutter=(0.04, 1.5), fx=[('dust', (-0.15, 0, 0.02), 5, 0.12, 0.03)]),
                      dict(root=(6, 10, 0), chest=(6, 10, 30), armL=(40, -15, 0), armR=(110, 45, 0), move=(0.22, 0.04, 0.02), fx=[('slash', (0.55, 0.15, 0.45), 1, 0, 0.12)]),
                      dict(armL=(10, 8, 0), armR=(20, 10, 0), move=(0.08, 0, 0))],
                 hurt=[dict(root=(0, 0, 40), head=(0, -8, 0), armL=(30, 60, 0), armR=(30, 60, 0), fx=[('sweat', (0.15, 0.1, 0.7), 2, 0.05, 0.025)]),
                       dict(root=(-10, 40, 0), head=(-10, 10, 0), armL=(60, 95, 0), armR=(60, 95, 0), move=(-0.12, -0.08, 0.16), flutter=(0.04, 2)),
                       dict(root=(-10, 80, 0), head=(-10, 20, 0), armL=(20, 120, 0), armR=(30, 40, 0), move=(-0.15, -0.25, 0), fx=[('dust', (-0.2, 0, 0.02), 4, 0.15, 0.03)])]),
    # ふくろをふりまわして、たたく / ふくろをだいて、とびのき、しりもち
    'thief': dict(atk=[dict(chest=(0, -6, -20), armR=(-10, 40, 0)), dict(hip=(-6, 0, 0), chest=(-10, -8, -25), head=(-6, 0, 0), armR=(10, 150, 0), move=(0, 0, 0.02)),
                       dict(hip=(14, 0, 0), chest=(16, 8, 25), armR=(95, 20, 0), move=(0, 0.06, 0), fx=[('dust', (0.15, 0.35, 0.03), 5, 0.12, 0.035), ('impact', (0.15, 0.35, 0.12), 1, 0, 0.1)]),
                       dict(chest=(4, 0, 0), armR=(20, 20, 0))],
                  hurt=[dict(chest=(10, 0, 0), head=(14, 0, 0), armL=(70, -30, 0), armR=(60, -20, 0), look=(0, 0.02), fx=[('sweat', (0.18, 0.1, 0.72), 2, 0.05, 0.025)]),
                        dict(root=(-10, 0, 0), armL=(70, -30, 0), armR=(60, -20, 0), move=(0, -0.1, 0.08)),
                        dict(root=(-16, -20, 0), hip=(-16, 0, 0), chest=(30, 0, 0), head=(30, -10, 0), armL=(90, -30, 0), armR=(-20, 60, 0), move=(0, -0.08, -0.08), fx=[('dust', (0, -0.1, 0.02), 4, 0.15, 0.03)])]),
    # 両こぶしをふりあげて、たたきつける / 目をまわし、よろけて、つんのめる
    'brute': dict(atk=[dict(chest=(-8, 0, 0), head=(-6, 0, 0), armL=(60, 10, 0), armR=(60, 10, 0)),
                       dict(hip=(-6, 0, 0), chest=(-14, 0, 0), head=(-8, 0, 0), armL=(140, 8, 0), armR=(140, 8, 0), move=(0, 0, 0.03)),
                       dict(hip=(20, 0, 0), chest=(20, 0, 0), head=(8, 0, 0), armL=(20, 0, 0), armR=(20, 0, 0), move=(0, 0.05, -0.02), fx=[('dust', (0, 0.35, 0.03), 7, 0.25, 0.04), ('impact', (0, 0.35, 0.1), 1, 0, 0.14)]),
                       dict(chest=(5, 0, 0), armL=(25, 8, 0), armR=(25, 8, 0))],
                  hurt=[dict(head=(0, 12, 25), chest=(0, -6, -10), armL=(30, 40, 0), armR=(20, 30, 0), fx=[('star', (0, 0.05, 1.0), 3, 0.15, 0.04)]),
                        dict(root=(0, 14, 0), chest=(6, -8, 0), head=(8, 10, 0), armL=(10, 50, 0), armR=(40, 10, 0), move=(0.08, 0, 0)),
                        dict(root=(55, 0, 0), chest=(20, 0, 0), head=(-10, 0, 0), armL=(110, 30, 0), armR=(110, 30, 0), move=(0, 0.1, -0.02), fx=[('dust', (0, 0.4, 0.02), 6, 0.25, 0.04)])]),
    # ハンマーを頭の上へふりかぶって、前へふりおろす / ハンマーがすべり、ひざをつき、もたれる
    'breaker': dict(atk=[dict(chest=(-6, -6, -15), armL=(20, 25, 0)), dict(hip=(-6, 0, 0), chest=(-14, 0, 0), head=(-8, 0, 0), armL=(40, -30, 0), move=(0, 0, 0.03)),
                         dict(hip=(18, 0, 0), chest=(22, 0, 10), head=(10, 0, 0), armL=(-100, -25, 0), move=(0, 0.05, 0), fx=[('dust', (0.05, 0.42, 0.03), 7, 0.22, 0.04), ('impact', (0.05, 0.42, 0.1), 1, 0, 0.14)]),
                         dict(chest=(8, 0, 0), armL=(-60, -15, 0))],
                    hurt=[dict(root=(0, -10, 0), head=(0, -10, -15), armL=(30, 20, 0), armR=(40, 50, 0), fx=[('sweat', (-0.15, 0.1, 0.72), 2, 0.05, 0.025)]),
                          dict(hip=(20, 10, 0), chest=(10, 8, 0), armL=(-40, -30, 0), armR=(20, 30, 0), move=(0, 0, -0.03)),
                          dict(root=(10, 40, 0), hip=(20, 0, 0), chest=(20, 10, 0), head=(20, 16, 0), armL=(-10, -80, 0), armR=(20, 60, 0), move=(0.05, 0, -0.06))]),
    # 口をあけて、とびついてかむ / ぶるぶる ふるえて、とびあがり、まるまる
    'trapper': dict(atk=[dict(chest=(-10, 0, 0), head=(-14, 0, 0), jaw=(30, 0, 0)), dict(root=(16, 0, 0), head=(-14, 0, 0), jaw=(42, 0, 0), move=(0, 0.08, 0.08)),
                         dict(root=(14, 0, 0), head=(10, 0, 0), jaw=(-8, 0, 0), move=(0, 0.1, 0), fx=[('impact', (0, 0.45, 0.35), 1, 0, 0.12)]), dict(root=(4, 0, 0), move=(0, 0.03, 0))],
                    hurt=[dict(head=(0, 0, 22), chest=(0, 0, -12), jaw=(20, 0, 0), fx=[('sweat', (0.2, 0.1, 0.75), 2, 0.05, 0.025)]),
                          dict(head=(0, 0, -22), chest=(0, 0, 12), jaw=(-6, 0, 0), move=(0, 0, 0.07)),
                          dict(hip=(45, 0, 0), chest=(40, 0, 0), head=(40, 0, 0), jaw=(-10, 0, 0), armL=(70, -40, 0), armR=(70, -40, 0), move=(0, 0, -0.1))]),
    # 両手をふって、灰をまく / 灰をふきだして、くずれ、灰の山になる
    'ash': dict(atk=[dict(chest=(-6, -8, -20), armL=(-20, 20, 0), armR=(-20, 20, 0), spread=0.9),
                     dict(chest=(-4, -6, -30), armL=(60, 100, 0), armR=(40, 40, 0), spread=1.2, fx=[('ash', (-0.35, 0.1, 0.5), 5, 0.12, 0.035)]),
                     dict(chest=(8, 12, 30), armL=(30, 30, 0), armR=(90, 110, 0), spread=1.6, fx=[('ash', (0.4, 0.2, 0.45), 9, 0.25, 0.04)]),
                     dict(chest=(4, 0, 0), spread=1.2, fx=[('ash', (0.3, 0.3, 0.3), 6, 0.3, 0.035)])],
                hurt=[dict(head=(0, 0, 20), armL=(40, 60, 0), armR=(40, 60, 0), fx=[('ash', (0, 0.1, 0.6), 6, 0.25, 0.035)]),
                      dict(hip=(30, 10, 0), chest=(20, -10, 0), head=(20, 10, 0), armL=(-20, 30, 0), armR=(-20, 60, 0), move=(0, 0, -0.05), spread=0.8),
                      dict(hip=(70, 18, 0), chest=(50, -18, 0), head=(45, 18, 0), armL=(-40, 90, 0), armR=(-40, 100, 0), move=(0, 0, -0.2), spread=0.4, fx=[('ash', (0, 0.1, 0.1), 8, 0.3, 0.045)])]),
    # 岩のこぶしで、地面をたたく / 岩がゆれ、ひざをつき、つんのめる
    'rockc': dict(atk=[dict(chest=(-6, 0, 0), armL=(45, 10, 0), armR=(45, 10, 0)), dict(hip=(-6, 0, 0), chest=(-12, 0, 0), armL=(110, 8, 0), armR=(110, 8, 0), move=(0, 0, 0.03)),
                       dict(hip=(18, 0, 0), chest=(18, 0, 0), armL=(10, 4, 0), armR=(10, 4, 0), move=(0, 0.04, -0.02), fx=[('dust', (0, 0.35, 0.03), 8, 0.3, 0.045), ('impact', (0, 0.35, 0.1), 1, 0, 0.16)]),
                       dict(chest=(4, 0, 0), armL=(20, 8, 0), armR=(20, 8, 0))],
                  hurt=[dict(head=(0, 10, 0), chest=(0, -6, 0), armL=(20, 20, 0), armR=(20, 20, 0), fx=[('dust', (0, 0, 0.9), 5, 0.25, 0.035)]),
                        dict(hip=(22, 0, 0), chest=(10, 0, 0), head=(-6, 0, 0), armL=(20, 6, 0), armR=(20, 6, 0), move=(0, 0.02, -0.03)),
                        dict(root=(50, 0, 0), chest=(18, 0, 0), head=(-10, 0, 0), armL=(100, 25, 0), armR=(100, 25, 0), move=(0, 0.1, -0.02), fx=[('dust', (0, 0.45, 0.02), 7, 0.3, 0.045)])]),
    # マントで、なぎはらう / かぶとが鳴って、よろけ、すわりこむ
    'armor': dict(atk=[dict(chest=(0, -6, -30), head=(0, 0, -10), armR=(-10, 60, 0)), dict(chest=(-6, 0, -10), armR=(40, 100, 0)),
                       dict(chest=(6, 8, 35), head=(0, 0, 10), armR=(70, -10, 0), fx=[('slash', (-0.3, 0.3, 0.45), 1, 0, 0.14)]), dict(chest=(2, 0, 10), armR=(20, 10, 0))],
                  hurt=[dict(head=(0, 16, 0), armL=(30, 50, 0), armR=(30, 50, 0), fx=[('spark', (0.15, 0.15, 0.9), 4, 0.08, 0.03)]),
                        dict(root=(-8, 0, 0), armL=(80, 40, 0), armR=(70, 40, 0), move=(0, -0.08, 0.02)),
                        dict(root=(-10, 30, 0), hip=(-16, 0, 0), chest=(20, 10, 0), head=(10, 50, 0), armL=(60, -10, 0), armR=(20, 70, 0), move=(0, -0.06, -0.1))]),
    # 体をひろげて、光る / ちかちかして、まわり、ちぢんで光がきえる
    'shiny': dict(atk=[dict(chest=(-6, 0, 0), armL=(-10, 10, 0), armR=(-10, 10, 0), spread=0.8),
                       dict(chest=(-12, 0, 0), head=(-10, 0, 0), armL=(30, 100, 0), armR=(30, 100, 0), move=(0, 0, 0.05), spread=1.4, orbit=40, fx=[('spark', (0, 0, 0.5), 6, 0.4, 0.035)]),
                       dict(chest=(-14, 0, 0), head=(-12, 0, 0), armL=(40, 140, 0), armR=(40, 140, 0), move=(0, 0, 0.08), spread=1.9, orbit=80, fx=[('spark', (0, 0, 0.5), 10, 0.55, 0.045)]),
                       dict(armL=(10, 30, 0), armR=(10, 30, 0), spread=1.2, orbit=100)],
                  hurt=[dict(root=(0, 0, 50), armL=(30, 60, 0), armR=(30, 60, 0), scale=0.9, fx=[('spark', (0, 0, 0.5), 5, 0.4, 0.03)]),
                        dict(root=(0, 0, 120), hip=(10, 0, 0), chest=(14, 0, 0), armL=(60, -30, 0), armR=(60, -30, 0), scale=0.8, spread=0.6),
                        dict(hip=(30, 0, 0), chest=(30, 0, 0), head=(30, 0, 0), armL=(80, -40, 0), armR=(80, -40, 0), scale=0.6, spread=0.1)]),
    # まわりの花びらを まわして、とばす / 花びらがちって、しおれて、まえへたれる
    'hana': dict(atk=[dict(chest=(-6, 0, -15), armL=(-20, 30, 0), armR=(-20, 30, 0), spread=0.8, orbit=-20),
                      dict(chest=(-6, 0, 10), armL=(20, 90, 0), armR=(20, 90, 0), move=(0, 0, 0.04), spread=1.2, orbit=90, fx=[('petal', (0, 0, 0.5), 5, 0.4, 0.035)]),
                      dict(chest=(8, 0, 20), armL=(40, 60, 0), armR=(90, 20, 0), spread=1.8, orbit=200, fx=[('petal', (0.3, 0.4, 0.45), 9, 0.3, 0.04)]),
                      dict(armL=(10, 30, 0), armR=(10, 30, 0), spread=1.1, orbit=260)],
                 hurt=[dict(head=(0, -10, 0), armL=(30, 50, 0), armR=(30, 50, 0), spread=1.4, fx=[('petal', (0, 0, 0.6), 7, 0.4, 0.035)]),
                       dict(hip=(10, 0, 0), chest=(28, 0, 0), head=(30, 0, 0), armL=(-20, 5, 0), armR=(-20, 5, 0), spread=1.2),
                       dict(hip=(20, 0, 0), chest=(50, 0, 0), head=(70, 0, 0), armL=(-40, 0, 0), armR=(-40, 0, 0), move=(0, 0.04, -0.06), spread=0.9, fx=[('petal', (0, 0.2, 0.03), 5, 0.3, 0.035)])]),
    # のびあがって、つのをひろげ、火の粉をとばす / とびあがって、しぼむ
    'hoteri': dict(atk=[dict(hip=(8, 0, 0), chest=(10, 0, 0), head=(8, 0, 0), move=(0, 0, -0.02)),
                        dict(hip=(-6, 0, 0), chest=(-12, 0, 0), head=(-10, 0, 0), hornL=(0, -30, 0), hornR=(0, 30, 0), armL=(20, 50, 0), armR=(20, 50, 0), move=(0, 0, 0.08), fx=[('ember', (0, 0, 0.9), 5, 0.3, 0.035)]),
                        dict(chest=(-10, 0, 0), head=(-8, 0, 0), hornL=(0, -45, 0), hornR=(0, 45, 0), armL=(30, 70, 0), armR=(30, 70, 0), move=(0, 0.04, 0.1), fx=[('ember', (0, 0.1, 0.8), 10, 0.5, 0.04)]),
                        dict(hornL=(0, -10, 0), hornR=(0, 10, 0), move=(0, 0, 0.02))],
                   hurt=[dict(move=(0, 0, 0.08), armL=(40, 70, 0), armR=(40, 70, 0), fx=[('ember', (0, 0, 0.7), 5, 0.3, 0.03)]),
                         dict(hip=(18, 0, 0), chest=(16, 0, 0), head=(18, 0, 0), hornL=(0, 20, 0), hornR=(0, -20, 0), armL=(-10, 0, 0), armR=(-10, 0, 0), move=(0, 0, -0.03)),
                         dict(hip=(40, 0, 0), chest=(40, 0, 0), head=(36, 0, 0), hornL=(0, 60, 0), hornR=(0, -60, 0), armL=(-30, -10, 0), armR=(-30, -10, 0), move=(0, 0, -0.12))]),
    # くるくるまわる / 落ち葉のように、ひらひら地面へ
    'ochiba': dict(atk=[dict(chest=(-6, 0, -30), armL=(0, 40, 0), armR=(0, 40, 0)), dict(root=(0, 0, 100), armL=(10, 100, 0), armR=(10, 100, 0), move=(0, 0, 0.08), flutter=(0.04, 0), fx=[('leaf', (0, 0, 0.4), 4, 0.4, 0.035)]),
                        dict(root=(0, 0, 200), armL=(10, 110, 0), armR=(10, 110, 0), move=(0, 0, 0.12), flutter=(0.05, 2), fx=[('leaf', (0, 0, 0.5), 7, 0.5, 0.04)]),
                        dict(root=(0, 0, 300), armL=(10, 60, 0), armR=(10, 60, 0), move=(0, 0, 0.04), flutter=(0.03, 4))],
                   hurt=[dict(root=(-10, 30, 0), head=(-10, 10, 0), armL=(40, 90, 0), armR=(40, 90, 0), move=(-0.06, 0, 0.16), flutter=(0.05, 1), fx=[('leaf', (0, 0, 0.6), 4, 0.3, 0.035)]),
                         dict(root=(-10, -34, 0), head=(-6, -10, 0), armL=(40, 90, 0), armR=(40, 90, 0), move=(0.06, 0, 0.08), flutter=(0.05, 3)),
                         dict(root=(-10, 85, 0), head=(-10, 10, 0), armL=(10, 60, 0), armR=(10, 60, 0), move=(-0.2, -0.05, 0), fx=[('leaf', (-0.1, 0, 0.03), 4, 0.3, 0.035)])]),
    # うでを ふりあげて、つららを たたきつける / ふるえて、ひびが入り、とけてつぶれる
    'yuki': dict(atk=[dict(chest=(-6, 0, 0), armL=(30, 20, 0), armR=(30, 20, 0)), dict(hip=(-6, 0, 0), chest=(-12, 0, 0), head=(-8, 0, 0), armL=(130, 15, 0), armR=(130, 15, 0), move=(0, 0, 0.04)),
                      dict(hip=(16, 0, 0), chest=(18, 0, 0), armL=(15, 10, 0), armR=(15, 10, 0), move=(0, 0.04, -0.02), fx=[('snow', (0, 0.35, 0.05), 9, 0.3, 0.04), ('impact', (0, 0.35, 0.12), 1, 0, 0.15)]),
                      dict(chest=(4, 0, 0), armL=(20, 10, 0), armR=(20, 10, 0))],
                 hurt=[dict(root=(0, 4, 0), chest=(0, -6, 0), head=(0, 8, 0), armL=(20, 40, 0), armR=(20, 40, 0), fx=[('snow', (0, 0, 0.7), 6, 0.35, 0.03)]),
                       dict(root=(0, -4, 0), chest=(12, 6, 0), head=(16, -8, 0), armL=(30, 20, 0), armR=(30, 20, 0), move=(0, 0, -0.03), fx=[('snow', (0, 0.1, 0.5), 5, 0.35, 0.03)]),
                       dict(hip=(20, 0, 0), chest=(20, 0, 0), head=(20, 0, 0), armL=(-20, 60, 0), armR=(-20, 60, 0), melt=0.55, fx=[('snow', (0, 0.1, 0.05), 6, 0.35, 0.035)])]),
}

NECK = 0.85   # 攻撃：首が、体の かたむきの このわりを うちけす（頭は大きく うごかさない。持ち主）
ATKSQ = (0.92, 1.06, 0.9, 1.02)   # 攻撃のため・のび：ためる（ちぢむ）→ ふりかぶる（のびる）→ うつ（ちぢむ）→ もどる
HURTSQ = (0.94, 1.0, 1.0)   # やられ：うけた しゅんかんだけ、少しちぢむ
LAGK = 0.8   # 布のおくれ：頭のてっぺんが うごいた分の、このわり
BODY = ('root', 'hip', 'chest')

def _steady(f):
    """攻撃のコマ：頭は、体（足もと・こし・むね）の かたむきを、首でうちけす"""
    f = dict(f); a = [sum(tuple(f.get(b, ()))[k] if len(tuple(f.get(b, ()))) > k else 0 for b in BODY) for k in range(3)]
    h = tuple(f.get('head', ()))+(0,)*6; f['head'] = (h[0]-NECK*a[0], h[1]-NECK*a[1], h[2]-NECK*a[2]*0.5)+h[3:6]; return f

def _top(f):
    """頭のてっぺんの だいたいの場所（布のおくれを きめるため）"""
    a = [sum(tuple(f.get(b, ()))[k] if len(tuple(f.get(b, ()))) > k else 0 for b in BODY+('head',)) for k in range(2)]
    m = np.array(f.get('move', (0, 0, 0)), float); return m+np.array([math.sin(math.radians(a[1]))*0.8, math.sin(math.radians(a[0]))*0.8, 0])

def _lag(L, loop):
    """コマごとの布のおくれ：まえのコマからの頭のてっぺんの うごきと、はんたいへ"""
    out = []
    for i, f in enumerate(L):
        pv = L[i-1] if (i or loop) else {}; d = _top(f)-_top(pv); f = dict(f)
        if 'lag' not in f: f['lag'] = tuple(-d*LAGK)
        out.append(f)
    return out

def poses(name):
    m = MOVES[name]; wx = WALKX.get(name)
    walk = [dict(f, **wx[i]) for i, f in enumerate(WALK)] if wx else WALK
    wv = lambda L: [dict({'wave': (0.06, i*math.pi/2)}, **f) for i, f in enumerate(L)]   # 攻撃・やられも、なびく
    atk = [dict({'sq': ATKSQ[i]}, **_steady(f)) for i, f in enumerate(m['atk'])]
    hurt = [dict({'sq': HURTSQ[i]}, **f) for i, f in enumerate(m['hurt'])]
    return dict(idle=_lag(IDLE, True), walk=_lag(walk, True), atk=_lag(wv(atk), False), hurt=_lag(wv(hurt), False))
