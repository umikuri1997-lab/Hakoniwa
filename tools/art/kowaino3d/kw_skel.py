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
JAWCLOTH = {'trapper': ((0.08, 0.22), (0.12, 0.26, 0.4, 0.56))}   # あごの布：前（y）が この あいだで ふえ、高さ（z）が この4つの あいだ（下から ふえて、顔の下で へる）
ARMRN = {'thief': 0.2}   # 手を大きくうごかすコワイノ：そでを広く なめらかに腕へ（せまいと、そでが1本のすじに のびる）
SLEEVE = ((0.24, 0.36), (0.2, 0.46))   # 手がないとき：そで（よこのはしのきょり・高さ）。すその横まで ひろげない（すそが ひっぱられて裏地が見える）
SLEEVEW = 0.7   # 手がないとき：そでの重みの いちばん大きい わり
HIDDEN = {'basic': dict(c=((-0.15, 0.32, 0.04), (0.07, 0.32, 0.04)), r=0.3, w=0.9, z=0.3)}   # 布の下にかくれた手（コカゲ。持ち主）：前の すそを、腕の骨へ（すその下から手が出て、すそから うごく。フードの まん中は うごかさない）。c：(よこ, 前, 上)・z：この高さより上は うごかさない
HEM = 0.3

ATTACH = {
    'thief': [(['base'], dict(box=((0.12, 1), (-1, 1), (0, 0.5)), small=True), 'armR')],   # ふくろ（3Dモデルで体からわけた）：右手
    'breaker': [(['deco'], dict(box=((-1, 0.0), (-1, 1), (0, 1.0))), 'armL')],   # ハンマー：左腕（ハンマーをもつ手は、手の重みで左腕へ。右手は右腕のまま）
    'trapper': [(['deco'], dict(box=((-1, 1), (0.15, 1), (0, 0.5))), 'jaw')],   # 牙：あご
    'armor': [(['deco'], dict(box=((-1, 1), (0.25, 1), (0, 0.5))), 'armL')],   # 体の前に うく盾：左腕の骨（腕はない。盾だけが 体のまわりを まわる）
    'hoteri': [(['deco'], dict(box=((-1, -0.1), (-1, 1), (0.6, 1.2))), 'hornL'), (['deco'], dict(box=((0.1, 1), (-1, 1), (0.6, 1.2))), 'hornR')],
}
TIP = {'fast': 'far', 'thief': 'pom', 'breaker': 'pom', 'shiny': 'pom', 'hana': 'pom', 'yuki': 'pom', 'ash': 'far', 'armor': 'far', 'hoteri': 'far', 'ochiba': 'far'}   # なびくフードの先（pom：ぽんぽん・far：頭からいちばん遠い うしろの点）
TIPZ = 0.6   # フードの先をさがす高さ（これより上）
TAILL = {'yuki': 0.9}   # 長くたれた フードのしっぽ：先からこの きょりまで、あたまの骨に
HOODAMP = 0.03   # フードの先が なびく大きさに、たす（高さのうち）
TIPL = 0.35   # フードの先から、なびく はんい（メッシュの辺をたどった きょり）
SCARF = {'fast': True}   # マフラー（体とはなれた かざり）が なびく
PIVOT = {'armor': {'armL': (0, 0, 0.3)}, 'breaker': {'armL': (-0.2, 0.02, 0.5)}, 'basic': {'armL': (-0.15, 0.12, 0.32), 'armR': (0.07, 0.12, 0.32)}, 'fast': {'armL': (-0.27, 0.04, 0.42), 'armR': (0.18, 0.04, 0.42)}}   # 腕の支点を、かたにする（手を支点にすると、ハンマーが手のまわりで まわるだけで、ふりおろしても下までとどかない）
SPREAD = {'ash': ['deco'], 'hana': ['deco']}
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
        hand = lab == 'hand'; big = np.bincount(comp[~hand], minlength=comp.max()+1).argmax()   # 体のかたまり（手の面はかぞえない。手のほうが面の多いコワイノがいる）
        if hand.sum() > 20:
            from scipy.spatial import cKDTree
            hv = np.unique(F[hand]); d, _ = cKDTree(P[hv]).query(P); wa = (1-smooth(0, ARMRN.get(name, ARMR)*H, d))*np.maximum(d < 1e-9, smooth(0.2, 0.3, z))   # 手のまわりを なめらかに腕へ。足もと・すそ（低い所）は まぜない（こぶしが大きいと、足がのびた）
            vside = np.sign(P[:, 0]); hq = [q for q in np.argsort(-np.bincount(comp[hand], minlength=comp.max()+1))[:2] if q != big and (comp[hand] == q).sum() > 20]
            if len(hq) == 2:   # 手が2つの はなれた かたまり：かたまりごとに左右（まん中によった手を、x の正負で分けると、手がのびた）
                cx = [P[np.unique(F[comp == q]), 0].mean() for q in hq]; xm = sum(cx)/2; vside = np.sign(P[:, 0]-xm)
                for q, x in zip(hq, cx): vside[np.unique(F[comp == q])] = np.sign(x-xm)
            s.vside = vside
            for side, bone in ((-1, 'armL'), (1, 'armR')):
                m = (vside == side) & (wa > 0); hs = hv[vside[hv] == side]
                if len(hs): hc = P[hs].mean(0); s.piv[bone] = np.array([hc[0]-side*0.1*H, hc[1]*0.4, max(hc[2]+0.14*H, 0.38*H)])   # 腕の支点：手の内がわ・上（かたの高さ）
                if len(hs) and not np.isin(hs, np.unique(F[comp == big])).any(): m &= d < 1e-9   # 体からはなれた手（こぶし）：体の布は うごかさない（のびて見えた）
                put(np.nonzero(m)[0], bone, wa[m])
        elif name in HIDDEN:
            hd = HIDDEN[name]; cl = np.zeros(V, bool); cl[np.unique(F[np.isin(lab, ['base', 'under', 'rim'])])] = True
            for c, bone in zip(hd['c'], ('armL', 'armR')):
                d = np.linalg.norm(P-np.array(c, float)*H, axis=1); w = (1-smooth(0, hd['r']*H, d))*hd['w']*cl*smooth(0.05, 0.2, P[:, 1]/H)*(1-smooth(hd['z']*0.5, hd['z'], z))
                put(np.nonzero(w > 0)[0], bone, w[w > 0])
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
        if hand.sum() > 20:   # 手（こぶし）は さいごに、ぜんぶ腕へ（足・頭のかざりと点を共有していると、こぶしの一部が のこって のびて見えた）。こぶしに ついた かざり（岩のかけら）も腕へ
            fin = np.isin(lab, ['deco']); hvs = set(np.unique(F[hand]).tolist())
            seed = fin & np.array([bool(hvs.intersection(f)) for f in F.tolist()]); grow = seed.copy()
            for _ in range(20):
                vv = np.zeros(V, bool); vv[np.unique(F[grow])] = True; nx = fin & vv[F].any(1) & ~grow
                if not nx.any(): break
                grow |= nx
            for side, bone in ((-1, 'armL'), (1, 'armR')):
                vs = np.unique(F[hand | grow]); vs = vs[s.vside[vs] == side]; W[vs] = 0; W[vs, ix[bone]] = 1
        if name in JAWCLOTH:   # 口をあけると、牙のまわりの布（あごの布）も いっしょに下がる
            jy, jz = JAWCLOTH[name]; y = P[:, 1]/H
            wj = smooth(*jy, y)*smooth(jz[0], jz[1], z)*(1-smooth(jz[2], jz[3], z))*np.isin(np.arange(V), np.unique(F[np.isin(lab, ['base', 'red', 'rim', 'under', 'face'])]))
            vj = np.nonzero(wj > 0)[0]; put(vj, 'jaw', wj[vj])
        sl = lab == 'sleeve'
        if sl.any():   # 腕（そで）：肩（体）から手首（手）へ、なめらかに むね → 腕 の重み（体と手の どちらに近いか）
            from scipy.spatial import cKDTree
            sv = np.unique(F[sl]); bv = np.setdiff1d(np.unique(F[(comp == big) & ~sl]), sv); hv3 = np.unique(F[hand])
            db, _ = cKDTree(P[bv]).query(P[sv]); dh, _ = cKDTree(P[hv3]).query(P[sv]); t = smooth(0.15, 0.85, db/np.maximum(db+dh, 1e-9))
            hx = P[hv3, 0].mean(); W[sv] = 0; W[sv, ix['chest']] = 1-t
            for side, bone in ((-1, 'armL'), (1, 'armR')):
                k = np.sign(P[sv, 0]-hx) == side; W[sv[k], ix[bone]] = t[k]
        for bn, pv in PIVOT.get(name, {}).items(): s.piv[bn] = np.array(pv, float)*H
        W /= np.maximum(W.sum(1, keepdims=True), 1e-9); s.W = W
        # くずれる（collapse）ときに、形をたもつ かたまり：手・足・ぽんぽん・体とはなれた かたまり（こぶし・ふくろ・ハンマー・かざり）。かたまりごとに、まん中の動きで いっしょに うごく
        side = np.sign(P[F].mean(1)[:, 0]); kind = np.select([lab == 'hand', lab == 'foot', lab == 'pom'], [1, 2, 3], 4)
        rf = np.isin(lab, ['hand', 'foot', 'pom']) | (comp != big); gk = np.where(rf, comp*20+kind*3+side+1, -1)
        s.sackv = np.setdiff1d(np.unique(F[took]), np.unique(F[comp == big])) if name == 'thief' else np.zeros(0, int)   # カゲドロボウのふくろ（ATTACH でえらんだ、体とはなれた布のかたまりだけ）
        hv2 = np.unique(F[lab == 'hand']); s.handR = hv2[P[hv2, 0] > 0] if name == 'thief' else np.zeros(0, int)
        s.vcloth = np.zeros(V, bool); s.vcloth[np.unique(F[np.isin(lab, ['base', 'red', 'rim', 'under', 'sleeve'])])] = True   # 布の点
        s.rig = np.full(V, -1);
        for k in range(3): s.rig[F[rf, k]] = gk[rf]
        s.hem =(1-smooth(HEM*0.4, HEM, z))*(W[:, ix['footL']]+W[:, ix['footR']] < 0.5)*(1-W[:, ix['armL']]-W[:, ix['armR']]); s.ang = np.arctan2(P[:, 1], P[:, 0])
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
        from scipy.spatial import cKDTree
        for dst, srcl in ((['pat'], ['base', 'rim', 'under', 'red']), (['eye', 'eyee'], ['face'])):   # 面にはった模様・目（kowaino_paint の ornament）：近い布・顔の点と同じに うごく
            dv = np.unique(F[np.isin(lab, dst)]); sv = np.setdiff1d(np.unique(F[np.isin(lab, srcl)]), dv)
            if not len(dv) or not len(sv): continue
            nn = sv[cKDTree(P[sv]).query(P[dv])[1]]
            s.W[dv] = s.W[nn]; s.tw[dv] = s.tw[nn]; s.hem[dv] = s.hem[nn]; s.sw[dv] = s.sw[nn]; s.rig[dv] = s.rig[nn]; s.vcloth[dv] = s.vcloth[nn]

    def collapse(s, P, k, zc):
        """くずれる（重さで下へ）：こしより下（zc より下）の布が、つぶれて しわになり、地面に ひろがる。その上（頭・フード）は、形のまま下へ おちる。
        手・足・ふくろなどの かたまりは、形のまま いっしょに うごく（ひしゃげない）"""
        H = s.H; z = P[:, 2]/H; f = lambda z: np.where(z < zc, z*(1-k), z-k*zc)
        dz = f(z)-z; cmp = np.where(z < zc, k*(1-np.clip(z/zc, 0, 1)), 0.0)
        r = np.hypot(P[:, 0], P[:, 1]); u = np.stack([P[:, 0], P[:, 1]], 1)/np.maximum(r, 1e-9)[:, None]
        push = cmp*0.32*H+cmp*0.05*H*np.sin(s.ang*7+z*24)   # 地面に ひろがる・くしゃっと しわ
        for g in np.unique(s.rig[s.rig >= 0]):   # かたまりは、まん中の動きで（マフラーは布なので、かたまりにしない）
            vs = s.rig == g
            if s.sw[vs].max() > 0: continue
            zg = z[vs].mean(); dz[vs] = f(np.array(zg))-zg; cg = k*(1-min(1, zg/zc)) if zg < zc else 0.0
            cx = P[vs, :2].mean(0); rc = np.hypot(*cx); push[vs] = cg*0.32*H; u[vs] = cx/max(rc, 1e-9)
        Q = P.copy(); Q[:, 2] += dz*H; Q[:, :2] += u*push[:, None]; return Q

    def drop(s, Q):
        """たおれて地面につく：体の芯（布のはし・フードの先・マフラーでない所）の いちばん下を、地面にぴったりつける（うかない・めりこまない）。
        布（すそ・フードの先・マフラー）は、重さで下へ おちて、体の上なら体に おおいかぶさり、体の外なら地面まで おちて よこへ ひろがる"""
        H = s.H; soft = np.clip(np.maximum.reduce([s.hem*1.6, s.tw, s.sw]), 0, 1); core = soft < 0.2
        Q = Q.copy(); Q[:, 2] -= Q[core, 2].min()   # 体の芯を地面に
        cs = DROPCELL*H; ij = np.floor(Q[:, :2]/cs).astype(int); o = ij.min(0); ij -= o; n = ij.max(0)+3
        top = np.full(n, -1.0); np.maximum.at(top, (ij[core, 0]+1, ij[core, 1]+1), Q[core, 2])   # 体の芯の上の面の高さ（たてに見た地図）
        t2 = top.copy()
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1): t2[1:-1, 1:-1] = np.maximum(t2[1:-1, 1:-1], top[1+dx:n[0]-1+dx, 1+dy:n[1]-1+dy])
        sup = t2[ij[:, 0]+1, ij[:, 1]+1]; z0 = Q[:, 2]; zn = z0-soft*DROPG*H   # 布は下へ おちる
        over = z0 >= sup-0.02*H   # 体の上にあった布は、体の上で とまる（おおいかぶさる）
        zn = np.where(over & (sup > 0), np.maximum(zn, sup*np.where(soft > 0, 1, 0)+np.where(soft > 0, 0.01*H, -9*H)), zn)
        zn = np.where(core, z0, zn)
        bi = {b: s.names.index(b) for b in ('armL', 'armR', 'hornL', 'hornR')}
        b = np.maximum(0, -zn); zn = np.maximum(zn, 0)   # 地面までおちた布は、のこった分だけ よこへ ひろがる
        c = Q[core, :2].mean(0); d = Q[:, :2]-c; nn = np.maximum(np.linalg.norm(d, axis=1), 1e-9); Q[:, :2] += d/nn[:, None]*(b*0.6)[:, None]
        Q[:, 2] = zn
        # 布の山：いきたえた体の布は、重さで 低い山の形より上には のこらない（つきでた すそ・はしが 上に のこらない）
        R = np.percentile(np.linalg.norm(Q[:, :2]-c, axis=1), 95); env = ENVH*H*np.sqrt(np.clip(1-(np.linalg.norm(Q[:, :2]-c, axis=1)/max(R, 1e-9))**2, 0, 1))+0.03*H
        cl = s.vcloth & (s.rig < 0); Q[cl, 2] = np.minimum(Q[cl, 2], np.maximum(env[cl], 0))
        from scipy.spatial import cKDTree
        tc = cKDTree(Q[cl, :2]); zc = Q[cl, 2]
        for g in np.unique(s.rig[s.rig >= 0]):   # 頭・体に ついた かざり（つぶ・つの・岩）：うかずに、下の布の上に のる
            vs = s.rig == g; X = Q[vs]; idx = tc.query_ball_point(X[:, :2].mean(0), 0.08*H)
            if not idx: continue
            top = zc[idx].max(); lo = X[:, 2].min()
            if lo > top+0.01*H: Q[vs, 2] -= lo-top
        base = (s.rig < 0) & ~s.vcloth   # 布でない 体の部品（顔・足 など）も、布の山より上に のこさない
        Q[base, 2] = np.minimum(Q[base, 2], np.maximum(env[base], 0)+0.02*H)
        # 手にもった物・こぶし・ふくろ・つの（腕・つのの かたまり）：力がぬけて、地面に おちて ころがる（いちばん うすい向きを たてにして ねかせる）。つながる そで・腕も いっしょに うごく
        for g in np.unique(s.rig[s.rig >= 0]):
            vs = s.rig == g
            if s.sw[vs].max() > 0 or vs.sum() < 4: continue
            bw = {k: s.W[vs, i].mean() for k, i in bi.items()}; bn = max(bw, key=bw.get)
            if bw[bn] < 0.5: continue
            X = Q[vs]; c0 = X.mean(0); ax = np.linalg.svd(X-c0, full_matrices=False)[2][2]   # いちばん うすい向き
            if ax[2] < 0: ax = -ax
            v = np.cross(ax, [0, 0, 1.0]); sn = np.linalg.norm(v); cs_ = ax[2]
            Rr = np.eye(3) if sn < 1e-6 else _r(tuple(v/sn), math.degrees(math.atan2(sn, cs_)))
            X2 = (X-c0)@Rr.T+c0; X2[:, 2] -= X2[:, 2].min()
            if bn.startswith('horn'): X2[:, :2] += (c0[:2]-c)/max(np.linalg.norm(c0[:2]-c), 1e-9)*0.15*H   # つのは、頭から はずれて よこへ ころがる
            dv = (X2-X).mean(0); w = s.W[:, bi[bn]].copy(); w[vs] = 0; Q += w[:, None]*dv; Q[vs] = X2
        Q[:, 2] = np.maximum(Q[:, 2], 0); return Q

    def pose(s, P, move=(0, 0, 0), spread=1.0, orbit=0.0, melt=0.0, scale=1.0, flutter=(0, 0), look=(0, 0), fx=(), wave=(0, 0), lag=(0, 0, 0), hlag=(0, 0, 0), sq=1.0, flare=0.0, collapse=0.0, cz=0.45, ground=False, ghost=0, dead=False, sacksq=1.0, fade=0.0, pool=0.6, smear=(0, 0, 0), **bones):
        H = s.H; Ms = {}
        if collapse: P = s.collapse(P, collapse, cz)
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
        if any(smear):   # ぶれ（モーションブラー）：うごいた向きの うしろがわを、うしろへ のばす（はやく うごいた コマ）
            sv = np.array(smear, float)*H; n = np.linalg.norm(sv); u = sv/max(n, 1e-9); c = Q.mean(0); t = (Q-c)@u; R = max(np.abs(t).max(), 1e-9)
            Q -= (np.clip(-t/R, 0, 1)**1.2)[:, None]*sv[None, :]
        if flare:   # まわって ひるがえる すそ（マント）：すそが外へ ひろがって もちあがり、まわる向きと はんたいへ おくれる（flare＞0 は 上から見て左まわりに まわったとき）
            r = np.stack([np.cos(s.ang), np.sin(s.ang), 0*s.ang], 1); tg = np.stack([-np.sin(s.ang), np.cos(s.ang), 0*s.ang], 1)
            Q += (s.hem*abs(flare)*H)[:, None]*(r*0.8-np.sign(flare)*tg*0.6); Q[:, 2] += s.hem*abs(flare)*H*0.7
        if wave[0]:   # なびく：はしほど大きく、先へ すすむ波（位相＝コマ。くりかえすと つながる）。うごいた向きと はんたいへ おくれる
            amp, ph = wave
            if s.tw.any():
                w = s.tw; ah = amp+HOODAMP; Q[:, 0] += w*ah*H*np.sin(ph-w*2.2); Q[:, 2] += w*ah*H*0.5*np.cos(ph-w*2.2)   # フードの先は、マフラーより大きく なびく
            if s.sw.any():
                w = s.sw; Q[:, 2] += w*amp*H*1.6*np.sin(ph-w*3.5); Q[:, 1] += w*amp*H*0.8*np.cos(ph-w*3.5)
        if any(lag):   # 布のおくれ：体が うごいた向きと はんたいへ、はしほど大きく のこる（すそは半分）
            lg = np.array(lag, float)*H
            for w in (s.tw**2, s.sw**2):
                if w.any(): Q += w[:, None]*lg
        if any(hlag):   # すその おくれ：体（足もと）が うごいた向きと はんたいへ、すそのはしほど大きく、少し もちあがる（動きに合わせて ひるがえる）
            Q += (s.hem**1.5)[:, None]*(np.array(hlag, float)*H); Q[:, 2] += s.hem**1.5*np.linalg.norm(hlag[:2])*H*0.6
        if s.sprc:   # とびちる かざり：むねのまわりで はなす・まわす
            c0 = Ms['chest'][0]@(np.array([0, 0, 0.45])*H)+Ms['chest'][1]; Ro = _r((0, 0, 1), orbit)
            for vs in s.sprc:
                c = Q[vs].mean(0); nc = c0+Ro@(c-c0)*spread; Q[vs] += nc-c
        if sacksq != 1.0 and len(s.sackv):   # ふくろが地面にたたきつけられて つぶれる：ふくろの底を地面につけ、たてに sacksq、よこへ ひろがる（形はとじたまま。ふくろを おさえる手も いっしょに下へ）
            v = s.sackv; zb = Q[v, 2].min(); c = Q[v, :2].mean(0); top = Q[v, 2].max()
            Q[v, 2] = (Q[v, 2]-zb)*sacksq; Q[v, :2] = c+(Q[v, :2]-c)/sacksq**0.6
            if len(s.handR):   # ふくろを おさえる右手（と、なめらかにつながる そで）も、ふくろの上まで下へ（腕の重みのぶんだけ。のびない）
                w = s.W[:, s.names.index('armR')].copy(); w[v] = 0; Q[:, 2] -= w*((top-zb)*(1-sacksq)+zb)
        if sq != 1.0:   # ため（ちぢむ）・のび：足もとを もとに、たてに sq、よこは体積をたもつ
            Q[:, 2] *= sq; Q[:, :2] *= 1/math.sqrt(sq)
        if melt:   # とける（ユキカゲのたおれ方）：上ほど下へ、下ほどよこへ広がる
            z = np.clip(Q[:, 2]/H, 0, 1); Q[:, 2] *= (1-melt*z); c = Q[:, :2].mean(0)   # 下ほど よこへ ひろがって 水たまりに（ふちは 波うつ）
            Q[:, :2] = c+(Q[:, :2]-c)*(1+melt*pool*(1-z)**2*(1+0.12*np.sin(s.ang*5)))[:, None]
        if scale != 1.0: Q = Q*scale
        lo = Q[:, 2].min()
        if ground: Q = s.drop(Q)
        elif lo < 0: Q[:, 2] -= lo
        s.Ms = Ms; return Q

IDLE = [dict(wave=(0.03, i*math.pi/2), flutter=(0.012, i*math.pi/2)) for i in range(4)]   # 待機：体はうごかさない（頭を上げ下げしない。持ち主）。フードの先・マフラーだけ なびく
WALK = [dict(hip=(5, 4, 0), chest=(2, -3, 4), head=(0, -2, -3), armL=(8, 4, 0), armR=(-6, 4, 0), footL=(0, 0, 0, 0, 0.05, 0), footR=(0, 0, 0, 0, -0.05, 0.02), flutter=(0.025, 0), look=(0.01, 0), wave=(0.05, 0)),
        dict(hip=(4, 0, 0), chest=(2, 0, 0), armL=(0, 4, 0), armR=(0, 4, 0), footR=(0, 0, 0, 0, 0, 0.05), flutter=(0.03, 1.6), move=(0, 0, 0.03), look=(0.012, 0.004), wave=(0.05, 1.57)),
        dict(hip=(5, -4, 0), chest=(2, 3, -4), head=(0, 2, 3), armL=(-6, 4, 0), armR=(8, 4, 0), footL=(0, 0, 0, 0, -0.05, 0.02), footR=(0, 0, 0, 0, 0.05, 0), flutter=(0.025, 3.1), look=(-0.01, 0), wave=(0.05, 3.14)),
        dict(hip=(4, 0, 0), chest=(2, 0, 0), armL=(0, 4, 0), armR=(0, 4, 0), footL=(0, 0, 0, 0, 0, 0.05), flutter=(0.03, 4.7), move=(0, 0, 0.03), look=(-0.012, 0.004), wave=(0.05, 4.71))]
WALKX = {'hana': [dict(orbit=12), dict(orbit=24), dict(orbit=36), dict(orbit=48)], 'ash': [dict(orbit=10), dict(orbit=20), dict(orbit=30), dict(orbit=40)]}

MOVES = {
    # りょう手を ふりあげて、とびついて ひっかく / びくっとして、よろけて、その場で くずれる
    'basic': dict(atk=[dict(hip=(-6, 0, 0), chest=(-10, 0, 0), armL=(-25, 0, 0), armR=(-25, 0, 0), move=(0, -0.02, -0.01)),   # 手は布の下（持ち主）：布の下で手を ひいて ためる
                       dict(hip=(-6, 0, 0), chest=(-12, 0, 0), armL=(35, 8, 0), armR=(35, 8, 0), move=(0, 0.04, 0.06), ghost=1),   # 布ごと 手を ふりあげる
                       dict(hip=(2, 0, 0), chest=(6, 0, 0), armL=(60, 4, 0), armR=(60, 4, 0), move=(0, 0.12, 0), ghost=1, fx=[('swipe', (0.15, 0.5, 0.4), 1, 0, 0), ('impact', (0, 0.55, 0.3), 1, 0, 0.1)]),   # 布の下の手で ひっかく（前の布が つきでる）
                       dict(chest=(4, 0, 0), armL=(15, 0, 0), armR=(15, 0, 0), move=(0, 0.05, 0))],
                  hurt=[dict(chest=(-6, 0, 0), head=(0, 10, 0), armL=(40, 40, 0), armR=(40, 40, 0), fx=[('sweat', (0.15, 0.1, 0.7), 2, 0.05, 0.025)]),
                        dict(root=(0, 14, 0), hip=(4, 6, 0), chest=(4, -6, 0), armL=(-10, 30, 0), armR=(-10, 30, 0), move=(0.04, 0, 0), collapse=0.25),
                        dict(hip=(4, 10, 0), chest=(2, -6, 0), head=(4, 12, 0), armL=(-30, 50, 0), armR=(-30, 50, 0), fx=[('dust', (0, 0.1, 0.02), 6, 0.3, 0.035)])]),
    # ひくく かまえて、ダッシュで つっこみ、つめで おおきく ひっかく（残像） / くるっとまわって、とばされ、よこにたおれて、布が つぶれる
    'fast': dict(atk=[dict(root=(0, 0, -45), hip=(-8, 0, 0), chest=(-10, 0, -15), armL=(-20, 70, 0), armR=(-20, 70, 0), move=(-0.04, 0, -0.03), flutter=(0.03, 0)),   # ためる：体を ぎゅっと ひねる
                      dict(root=(0, 0, 110), chest=(4, 0, 20), armL=(0, 100, 0), armR=(0, 100, 0), move=(0.12, 0.08, 0.02), flutter=(0.05, 1.5), ghost=1),   # くるっと まわりはじめる（うでを ひろげて つめを 外へ）
                      dict(root=(0, 0, 250), chest=(4, 0, 25), armL=(0, 105, 0), armR=(0, 105, 0), move=(0.2, 0.14, 0.03), flutter=(0.06, 3), ghost=2, fx=[('spin', (0, 0, 0.42), 1, 0, 0)]),   # まわりながら ひっかく（つめの とおった わ）
                      dict(root=(0, 0, 360), chest=(2, 0, 8), armL=(-10, 60, 0), armR=(-10, 60, 0), move=(0.14, 0.08, 0), ghost=1)],   # ひとまわりして、前を むいて とまる
                 hurt=[dict(root=(0, 0, 40), head=(0, -8, 0), armL=(30, 60, 0), armR=(30, 60, 0), fx=[('sweat', (0.15, 0.1, 0.7), 2, 0.05, 0.025)]),
                       dict(root=(-10, 40, 0), head=(-10, 10, 0), armL=(60, 95, 0), armR=(60, 95, 0), move=(-0.12, -0.08, 0.16), flutter=(0.04, 2)),
                       dict(root=(-4, 62, 0), head=(-4, 12, 0), armL=(10, 110, 0), armR=(10, 30, 0), move=(-0.15, -0.2, 0), collapse=0.4, ground=True, fx=[('dust', (-0.3, 0, 0.02), 5, 0.18, 0.03)])]),
    # ふくろを両手で頭の上へ もちあげ、前の地面へ たたきつける（ふくろが つぶれて ひらたくなり、両手で おさえる） / ふくろをだいて、とびのき、しりもち
    'thief': dict(atk=[dict(chest=(-4, 0, 0), armR=(0, 0, 0, -0.1, 0.05, 0.25), armL=(80, 30, 0)),
                       dict(hip=(-6, 0, 0), chest=(-10, 0, 0), armR=(0, 0, 0, -0.19, 0.05, 0.85), armL=(160, 10, 0), move=(0, 0, 0.03), ghost=1),
                       dict(hip=(14, 0, 0), chest=(18, 0, 0), armR=(0, 0, 0, -0.19, 0.42, -0.02), armL=(70, -25, 0), move=(0, 0.04, -0.01), sacksq=0.5, ghost=1, fx=[('dust', (0.25, 0.5, 0.03), 6, 0.2, 0.035), ('dust', (-0.25, 0.5, 0.03), 6, 0.2, 0.035), ('impact', (0, 0.5, 0.12), 1, 0, 0.12)]),
                       dict(hip=(8, 0, 0), chest=(10, 0, 0), armR=(0, 0, 0, -0.19, 0.4, -0.02), armL=(60, -25, 0), sacksq=0.62)],
                  hurt=[dict(chest=(10, 0, 0), head=(14, 0, 0), armL=(70, -30, 0), armR=(60, -20, 0), look=(0, 0.02), fx=[('sweat', (0.18, 0.1, 0.72), 2, 0.05, 0.025)]),
                        dict(root=(-10, 0, 0), armL=(70, -30, 0), armR=(60, -20, 0), move=(0, -0.1, 0.08)),
                        dict(root=(-4, -30, 0), hip=(0, -4, 0), chest=(4, -6, 0), head=(4, -16, 0), armL=(30, 40, 0), armR=(10, 20, 0), move=(0, -0.04, 0), collapse=0.35, ground=True, fx=[('dust', (0, -0.1, 0.02), 5, 0.2, 0.03)])]),
    # 両こぶしをふりあげて、たたきつける / 目をまわし、よろけて、よこへたおれる
    'brute': dict(atk=[dict(chest=(-8, 0, 0), head=(-6, 0, 0), armL=(60, 10, 0), armR=(60, 10, 0)),
                       dict(hip=(-6, 0, 0), chest=(-14, 0, 0), head=(-8, 0, 0), armL=(140, 8, 0), armR=(140, 8, 0), move=(0, 0, 0.03)),
                       dict(hip=(20, 0, 0), chest=(20, 0, 0), head=(8, 0, 0), armL=(20, 0, 0), armR=(20, 0, 0), move=(0, 0.05, -0.02), fx=[('dust', (0, 0.35, 0.03), 7, 0.25, 0.04), ('impact', (0, 0.35, 0.1), 1, 0, 0.14)]),
                       dict(chest=(5, 0, 0), armL=(25, 8, 0), armR=(25, 8, 0))],
                  hurt=[dict(head=(0, 12, 25), chest=(0, -6, -10), armL=(30, 40, 0), armR=(20, 30, 0), fx=[('star', (0, 0.05, 1.0), 3, 0.15, 0.04)]),
                        dict(root=(0, 14, 0), chest=(6, -8, 0), head=(8, 10, 0), armL=(-10, 50, 0), armR=(20, 10, 0), move=(0.06, 0, 0), collapse=0.2),
                        dict(root=(0, 25, 0), chest=(4, 8, 0), head=(0, 14, 0), armL=(-10, 30, 0), armR=(0, 40, 0), move=(0.1, 0, 0), collapse=0.3, cz=0.5, ground=True, fx=[('dust', (0.35, 0, 0.02), 8, 0.3, 0.04)])]),
    # ハンマーを頭のうしろへふりかぶって、前の地面へふりおろす / ハンマーがすべり、よろけて、よこへたおれる
    'breaker': dict(atk=[dict(hip=(4, 0, 0), chest=(4, -4, -10), armL=(25, 10, 0), armR=(20, 20, 0), move=(0, 0, -0.01)),
                         dict(hip=(-8, 0, 0), chest=(-14, 4, 10), armL=(70, 10, 0), armR=(60, 10, 0), move=(0, -0.02, 0.03)),
                         dict(hip=(16, 0, 0), chest=(20, 0, 0), armL=(-100, 50, -5, 0.26, 0.27, -0.12), armR=(-40, 15, 0), move=(0, 0.05, -0.01), fx=[('dust', (-0.1, 0.72, 0.03), 9, 0.26, 0.04), ('impact', (-0.1, 0.72, 0.08), 1, 0, 0.14)]),   # ハンマーの平らな面を、地面と水平に たたきつける（頭の長い向きを たてに）
                         dict(hip=(8, 0, 0), chest=(10, 0, 0), armL=(-95, 50, -5, 0.24, 0.24, -0.08), armR=(-10, 10, 0))],
                    hurt=[dict(root=(0, -10, 0), head=(0, -10, -15), armL=(30, 20, 0), armR=(40, 50, 0), fx=[('sweat', (-0.15, 0.1, 0.72), 2, 0.05, 0.025)]),
                          dict(hip=(6, 14, 0), chest=(4, 8, 0), armL=(-40, -30, 0), armR=(20, 30, 0), move=(0, 0, -0.03)),
                          dict(root=(0, 25, 0), hip=(2, 4, 0), chest=(2, 6, 0), head=(2, 14, 0), armL=(-10, -80, 0), armR=(20, 60, 0), move=(0.08, 0, 0), collapse=0.45, ground=True, fx=[('dust', (0.3, 0, 0.02), 5, 0.2, 0.035)])]),
    # 口をあけて、とびついてかむ / ぶるぶる ふるえて、とびあがり、おちて べしゃっと つぶれる
    'trapper': dict(atk=[dict(chest=(-10, 0, 0), head=(-14, 0, 0), jaw=(30, 0, 0)), dict(root=(16, 0, 0), head=(-14, 0, 0), jaw=(42, 0, 0), move=(0, 0.08, 0.08)),
                         dict(root=(14, 0, 0), head=(10, 0, 0), jaw=(-8, 0, 0), move=(0, 0.1, 0), fx=[('impact', (0, 0.45, 0.35), 1, 0, 0.12)]), dict(root=(4, 0, 0), move=(0, 0.03, 0))],
                    hurt=[dict(head=(0, 0, 22), chest=(0, 0, -12), jaw=(20, 0, 0), fx=[('sweat', (0.2, 0.1, 0.75), 2, 0.05, 0.025)]),
                          dict(head=(0, 0, -22), chest=(0, 0, 12), jaw=(-6, 0, 0), move=(0, 0, 0.07)),
                          dict(root=(0, 14, 0), hip=(0, 6, 0), chest=(4, -4, 0), jaw=(-12, 0, 0), armL=(-20, 70, 0), armR=(-20, 70, 0), collapse=0.7, cz=0.55, ground=True, fx=[('dust', (0.3, 0, 0.02), 4, 0.2, 0.03), ('dust', (-0.3, 0, 0.02), 4, 0.2, 0.03)])]),
    # 両手をふって、灰をまく / 灰をふきだして、よこへくずれ、灰の山になる
    'ash': dict(atk=[dict(chest=(-6, -8, -20), armL=(-20, 20, 0), armR=(-20, 20, 0), spread=0.9),
                     dict(chest=(-4, -6, -30), armL=(60, 100, 0), armR=(40, 40, 0), spread=1.2, fx=[('ash', (-0.35, 0.1, 0.5), 5, 0.12, 0.035)]),
                     dict(chest=(8, 12, 30), armL=(30, 30, 0), armR=(90, 110, 0), spread=1.6, fx=[('ash', (0.4, 0.2, 0.45), 9, 0.25, 0.04)]),
                     dict(chest=(4, 0, 0), spread=1.2, fx=[('ash', (0.3, 0.3, 0.3), 6, 0.3, 0.035)])],
                hurt=[dict(head=(0, 0, 20), armL=(40, 60, 0), armR=(40, 60, 0), fx=[('ash', (0, 0.1, 0.6), 6, 0.25, 0.035)]),
                      dict(hip=(4, 12, 0), chest=(4, -8, 0), head=(4, 10, 0), armL=(-20, 30, 0), armR=(-20, 60, 0), spread=0.8, collapse=0.3, cz=0.55, fx=[('ash', (0, 0.1, 0.35), 5, 0.25, 0.035)]),
                      dict(hip=(4, 12, 0), chest=(2, -6, 0), head=(6, 14, 0), armL=(-40, 80, 0), armR=(-40, 90, 0), spread=0.5, collapse=0.8, cz=0.6, ground=True, fx=[('ash', (0, 0.1, 0.1), 10, 0.35, 0.045)])]),
    # 岩のこぶしで、地面をたたく / 岩がゆれ、ひざをつき、よこへたおれる
    'rockc': dict(atk=[dict(chest=(-6, 0, 0), armL=(45, 10, 0), armR=(45, 10, 0)), dict(hip=(-6, 0, 0), chest=(-12, 0, 0), armL=(110, 8, 0), armR=(110, 8, 0), move=(0, 0, 0.03)),
                       dict(hip=(18, 0, 0), chest=(18, 0, 0), armL=(10, 4, 0), armR=(10, 4, 0), move=(0, 0.04, -0.02), fx=[('dust', (0, 0.35, 0.03), 8, 0.3, 0.045), ('impact', (0, 0.35, 0.1), 1, 0, 0.16)]),
                       dict(chest=(4, 0, 0), armL=(20, 8, 0), armR=(20, 8, 0))],
                  hurt=[dict(head=(0, 10, 0), chest=(0, -6, 0), armL=(20, 20, 0), armR=(20, 20, 0), fx=[('dust', (0, 0, 0.9), 5, 0.25, 0.035)]),
                        dict(hip=(6, -16, 0), chest=(4, -8, 0), head=(0, 8, 0), armL=(-15, 20, 0, 0, 0, -0.08), armR=(-15, 6, 0, 0, 0, -0.08), move=(-0.03, 0, 0), collapse=0.2, ground=True, fx=[('dust', (0.35, 0.1, 0.02), 4, 0.15, 0.035), ('dust', (-0.35, 0.1, 0.02), 4, 0.15, 0.035)]),
                        dict(root=(0, -25, 0), chest=(4, -6, 0), head=(0, -12, 0), armL=(-20, 70, 0, 0, 0, -0.06), armR=(-25, 10, 0, 0, 0, -0.08), move=(-0.1, 0, 0), collapse=0.5, cz=0.5, ground=True, fx=[('dust', (-0.45, 0, 0.02), 8, 0.3, 0.045)])]),
    # 体ごとまわって、マントで なぎはらう / かぶとが鳴って、よろけ、すわりこむ
    'armor': dict(atk=[dict(root=(0, 0, 35), hip=(-6, 0, 0), chest=(-6, 0, 15), armL=(0, 0, 120), move=(0, 0, -0.01), flutter=(0.03, 0), flare=-0.04),   # ためる：体を ひねり、盾を うしろへ まわす
                       dict(root=(0, 0, 10), chest=(2, 0, 5), armL=(0, 0, 55), flutter=(0.04, 1.5), flare=0.1, ghost=1),   # 盾が よこから 前へ まわってくる
                       dict(root=(0, 0, -30), chest=(6, 0, -15), armL=(15, 0, -45), flutter=(0.05, 3.0), flare=0.18, ghost=2, fx=[('swipe', (0.02, 0.4, 0.32), 1, 0, 0), ('spark', (0.42, 0.25, 0.3), 4, 0.12, 0.03)]),   # 盾を ふりぬいて なぐる（あたった所に 火花）
                       dict(root=(0, 0, -20), chest=(2, 0, -8), armL=(5, 0, -70), flutter=(0.04, 4.5), flare=0.07, ghost=1)],   # ふりぬいた あと
                  hurt=[dict(head=(0, 16, 0), armL=(30, 50, 0), armR=(30, 50, 0), fx=[('spark', (0.15, 0.15, 0.9), 4, 0.08, 0.03)]),
                        dict(root=(-8, 0, 0), armL=(80, 40, 0), armR=(70, 40, 0), move=(0, -0.08, 0.02)),
                        dict(root=(-4, 30, 0), hip=(0, 4, 0), chest=(4, 6, 0), head=(4, 16, 0), armL=(60, -10, 0), armR=(20, 70, 0), move=(0, -0.06, 0), collapse=0.4, ground=True, fx=[('dust', (0.2, -0.05, 0.02), 5, 0.2, 0.035)])]),
    # 体をひろげて、光る / ちかちかして、まわり、ちぢんで光がきえる
    'shiny': dict(atk=[dict(chest=(-6, 0, 0), armL=(-10, 10, 0), armR=(-10, 10, 0)),
                       dict(chest=(-12, 0, 0), head=(-10, 0, 0), armL=(30, 100, 0), armR=(30, 100, 0), move=(0, 0, 0.05), fx=[('spark', (0, 0, 0.5), 6, 0.4, 0.035)]),
                       dict(chest=(-14, 0, 0), head=(-12, 0, 0), armL=(40, 140, 0), armR=(40, 140, 0), move=(0, 0, 0.08), fx=[('spark', (0, 0, 0.5), 10, 0.55, 0.045)]),
                       dict(armL=(10, 30, 0), armR=(10, 30, 0))],
                  hurt=[dict(root=(0, 0, 50), armL=(30, 60, 0), armR=(30, 60, 0), scale=0.9, fx=[('spark', (0, 0, 0.5), 5, 0.4, 0.03)]),
                        dict(root=(0, 0, 120), hip=(4, 8, 0), chest=(4, 8, 0), armL=(60, -30, 0), armR=(60, -30, 0), scale=0.8),
                        dict(root=(0, 30, 0), hip=(2, 4, 0), chest=(2, 6, 0), armL=(30, 40, 0), armR=(30, 40, 0), move=(0.06, 0, 0), scale=0.6, collapse=0.3, ground=True)]),
    # まわりの花びらを まわして、とばす / 花びらがちって、しおれて、よこへたれる
    'hana': dict(atk=[dict(chest=(-6, 0, -15), armL=(-20, 30, 0), armR=(-20, 30, 0), spread=0.8, orbit=-20),
                      dict(chest=(-6, 0, 10), armL=(20, 90, 0), armR=(20, 90, 0), move=(0, 0, 0.04), spread=1.2, orbit=90, fx=[('petal', (0, 0, 0.5), 5, 0.4, 0.035)]),
                      dict(chest=(8, 0, 20), armL=(40, 60, 0), armR=(90, 20, 0), spread=1.8, orbit=200, fx=[('petal', (0.3, 0.4, 0.45), 9, 0.3, 0.04)]),
                      dict(armL=(10, 30, 0), armR=(10, 30, 0), spread=1.1, orbit=260)],
                 hurt=[dict(head=(0, -10, 0), armL=(30, 50, 0), armR=(30, 50, 0), spread=1.4, fx=[('petal', (0, 0, 0.6), 7, 0.4, 0.035)]),
                       dict(hip=(4, 8, 0), chest=(6, 20, 0), head=(6, 24, 0), armL=(-20, 5, 0), armR=(-20, 30, 0), spread=1.2),
                       dict(root=(0, 30, 0), hip=(2, 4, 0), chest=(4, 8, 0), head=(4, 16, 0), armL=(-30, 10, 0), armR=(-40, 60, 0), move=(0.06, 0, 0), spread=0.9, collapse=0.4, ground=True, fx=[('petal', (0.3, 0, 0.03), 5, 0.3, 0.035)])]),
    # のびあがって、つのをひろげ、火の粉をとばす / とびあがって、しぼみ、よこへたおれる
    'hoteri': dict(atk=[dict(hip=(8, 0, 0), chest=(10, 0, 0), head=(8, 0, 0), move=(0, 0, -0.02)),
                        dict(hip=(-6, 0, 0), chest=(-12, 0, 0), head=(-10, 0, 0), hornL=(0, -30, 0), hornR=(0, 30, 0), armL=(20, 50, 0), armR=(20, 50, 0), move=(0, 0, 0.08), fx=[('ember', (0, 0, 0.9), 5, 0.3, 0.035)]),
                        dict(chest=(-10, 0, 0), head=(-8, 0, 0), hornL=(0, -45, 0), hornR=(0, 45, 0), armL=(30, 70, 0), armR=(30, 70, 0), move=(0, 0.04, 0.1), fx=[('ember', (0, 0.1, 0.8), 10, 0.5, 0.04)]),
                        dict(hornL=(0, -10, 0), hornR=(0, 10, 0), move=(0, 0, 0.02))],
                   hurt=[dict(move=(0, 0, 0.08), armL=(40, 70, 0), armR=(40, 70, 0), fx=[('ember', (0, 0, 0.7), 5, 0.3, 0.03)]),
                         dict(hip=(4, -12, 0), chest=(4, -10, 0), head=(4, -8, 0), hornL=(0, 20, 0), hornR=(0, -20, 0), armL=(-10, 0, 0), armR=(-10, 0, 0), move=(0, 0, -0.03)),
                         dict(root=(0, -30, 0), hip=(2, -4, 0), chest=(2, -6, 0), hornL=(0, 15, 0), hornR=(0, -15, 0), armL=(-30, 60, 0), armR=(-30, -10, 0), move=(-0.12, 0, 0), scale=0.9, collapse=0.4, ground=True, fx=[('ember', (-0.35, 0, 0.1), 3, 0.2, 0.03)])]),
    # くるくるまわる / 落ち葉のように、ひらひら地面へ
    'ochiba': dict(atk=[dict(chest=(-6, 0, -30), armL=(0, 40, 0), armR=(0, 40, 0)), dict(root=(0, 0, 100), armL=(10, 100, 0), armR=(10, 100, 0), move=(0, 0, 0.08), flutter=(0.04, 0), fx=[('leaf', (0, 0, 0.4), 4, 0.4, 0.035)]),
                        dict(root=(0, 0, 200), armL=(10, 110, 0), armR=(10, 110, 0), move=(0, 0, 0.12), flutter=(0.05, 2), fx=[('leaf', (0, 0, 0.5), 7, 0.5, 0.04)]),
                        dict(root=(0, 0, 300), armL=(10, 60, 0), armR=(10, 60, 0), move=(0, 0, 0.04), flutter=(0.03, 4))],
                   hurt=[dict(root=(-10, 30, 0), head=(-10, 10, 0), armL=(40, 90, 0), armR=(40, 90, 0), move=(-0.06, 0, 0.16), flutter=(0.05, 1), fx=[('leaf', (0, 0, 0.6), 4, 0.3, 0.035)]),
                         dict(root=(-10, -34, 0), head=(-6, -10, 0), armL=(40, 90, 0), armR=(40, 90, 0), move=(0.06, 0, 0.08), flutter=(0.05, 3)),
                         dict(root=(-4, 40, 0), head=(-4, 10, 0), armL=(10, 60, 0), armR=(10, 60, 0), move=(-0.2, -0.05, 0), collapse=0.5, ground=True, fx=[('leaf', (-0.1, 0, 0.03), 4, 0.3, 0.035)])]),
    # うでを ふりあげて、つららを たたきつける / ふるえて、ひびが入り、とけてつぶれる
    'yuki': dict(atk=[dict(chest=(-6, 0, 0), armL=(30, 20, 0), armR=(30, 20, 0)), dict(hip=(-6, 0, 0), chest=(-12, 0, 0), head=(-8, 0, 0), armL=(130, 15, 0), armR=(130, 15, 0), move=(0, 0, 0.04)),
                      dict(hip=(16, 0, 0), chest=(18, 0, 0), armL=(15, 10, 0), armR=(15, 10, 0), move=(0, 0.04, -0.02), fx=[('snow', (0, 0.35, 0.05), 9, 0.3, 0.04), ('impact', (0, 0.35, 0.12), 1, 0, 0.15)]),
                      dict(chest=(4, 0, 0), armL=(20, 10, 0), armR=(20, 10, 0))],
                 hurt=[dict(root=(0, 4, 0), chest=(0, -6, 0), head=(0, 8, 0), armL=(20, 40, 0), armR=(20, 40, 0), fx=[('snow', (0, 0, 0.7), 6, 0.35, 0.03)]),
                       dict(root=(0, -4, 0), chest=(6, 6, 0), head=(8, -8, 0), armL=(10, 30, 0), armR=(10, 30, 0), melt=0.4, pool=0.7, collapse=0.12, fx=[('snow', (0, 0.1, 0.5), 4, 0.35, 0.03), ('sweat', (0, 0.15, 0.4), 6, 0.35, 0.03)]),
                       dict(hip=(2, 8, 0), chest=(2, 8, 0), head=(2, 6, 0), armL=(-30, 70, 0), armR=(-30, 70, 0), melt=0.9, pool=0.9, collapse=0.3, ground=True, fx=[('sweat', (0, 0.2, 0.05), 7, 0.45, 0.035), ('snow', (0, 0.1, 0.1), 4, 0.35, 0.03)])]),
}

NECK = 0.85   # 攻撃：首が、体の かたむきの このわりを うちけす（頭は大きく うごかさない。持ち主）
ATKSQ = (0.92, 1.06, 0.9, 1.02)   # 攻撃のため・のび：ためる（ちぢむ）→ ふりかぶる（のびる）→ うつ（ちぢむ）→ もどる
ATKLUNGE = ((-0.06, -6), (-0.04, -4), (0.22, 8), (0.1, 2))   # 攻撃のコマごと：前（こちら）へ うごく長さ・こしの前への かたむき（ため → ふりかぶる → とびこむ → もどる）
ATKTURN = 15   # 攻撃：ななめ前へ ふみこむ 角度（体ごと その向きへ。こちらへ まっすぐ だけにしない。持ち主）
ATKTURNN = {'trapper': 25, 'hoteri': 25}   # 頭・口で つっこむ コワイノは、よこを むいてから ななめに つっこむ
ATKSIDE = {'basic': 1, 'fast': 1, 'thief': -1, 'brute': 1, 'breaker': -1, 'trapper': -1, 'ash': 1, 'rockc': -1, 'armor': 1, 'shiny': 1, 'hana': -1, 'hoteri': 1, 'ochiba': -1, 'yuki': 1}   # どちらの ななめへ（右・左）
ATKTURNK = (0.6, 1, 1, 1)   # コマごとの まわりぐあい（ためで 半分ほど むく）
HURTKB = ((-0.12, -14), (-0.05, -6))   # やられのコマごと：うしろへ はじかれる長さ・むねが うしろへ そる角度
DEADFADE = (0.45, 0.9)   # たおれたあと、けむりになって きえる コマ：きえた わり（あみで うすく）
HURTSQ = (0.94, 1.0, 1.0)  # やられ：うけた しゅんかんだけ、少しちぢむ
HLAGK = 0.7; HLAGMAX = 0.07   # すその おくれ：足もとが うごいた分の このわり・いちばん大きい長さ
DEADROLL = 12  # いきたえるコマの、よこへの かたむきの いちばん大きい角度
DEADCOL = 0.82  # いきたえたときの、くずれる強さ（これより小さい物は、ここまで）
DROPG = 0.15  # たおれたとき、布（すそ・フードの先・マフラー）が重さで おちる長さ（高さのうち。はしほど大きい）
ENVH = 0.42   # いきたえた体の布の山の、いちばん高い所（高さのうち）
DROPCELL = 0.04  # 体の芯の上の面をしらべる ます目の大きさ（高さのうち）
LAGMAXN = {'fast': 0.16}; LAGKN = {'fast': 1.6}; WAVEN = {'fast': 0.12}   # フードが大きく なびく コワイノ（はやい うごきに 大きく おくれる）
SIDELUNGE = 0.5   # よこ向きの攻撃：前へ とびこむ長さの わり（絵の中で よこに うごく。ゲームでも ふみこむ）
SMEARK = 0.8; SMEARMIN = 0.06   # ぶれ：うごいた長さの このわりだけ、うしろへ のばす（この長さより はやいとき）
LAGMAX = 0.05  # 布のおくれの いちばん大きい長さ
LAGK = 0.8   # 布のおくれ：頭のてっぺんが うごいた分の、このわり
BODY = ('root', 'hip', 'chest')

def _steady(f):
    """攻撃のコマ：頭は、体（足もと・こし・むね）の かたむき（前・よこ）を、首でうちけす。まわる向き（twist）は うちけさない（体といっしょに まわる）"""
    f = dict(f); a = [sum(tuple(f.get(b, ()))[k] if len(tuple(f.get(b, ()))) > k else 0 for b in BODY) for k in range(3)]
    h = tuple(f.get('head', ()))+(0,)*6; f['head'] = (h[0]-NECK*a[0], h[1]-NECK*a[1], h[2])+h[3:6]; return f

def _top(f):
    """頭のてっぺんの だいたいの場所（布のおくれを きめるため）"""
    a = [sum(tuple(f.get(b, ()))[k] if len(tuple(f.get(b, ()))) > k else 0 for b in BODY+('head',)) for k in range(2)]
    m = np.array(f.get('move', (0, 0, 0)), float); return m+np.array([math.sin(math.radians(a[1]))*0.8, math.sin(math.radians(a[0]))*0.8, 0])

def _lag(L, loop, name=None, smear=False):
    """コマごとの布のおくれ：まえのコマからの頭のてっぺんの うごきと、はんたいへ。smear：はやい うごきの ぶれ（体を うごいた向きの うしろへ のばす）"""
    out = []; lk = LAGKN.get(name, LAGK); lm = LAGMAXN.get(name, LAGMAX)
    for i, f in enumerate(L):
        pv = L[i-1] if (i or loop) else {}; d = _top(f)-_top(pv); f = dict(f)
        if 'lag' not in f: lg = -d*lk; n = float(np.linalg.norm(lg)); f['lag'] = tuple(lg*min(1, lm/max(n, 1e-9)))   # 大きくうごいても、のびすぎない
        if smear and 'smear' not in f:
            dm = np.array(f.get('move', (0, 0, 0)), float)-np.array(pv.get('move', (0, 0, 0)), float); dm[2] = 0
            if np.linalg.norm(dm) > SMEARMIN: f['smear'] = tuple(dm*SMEARK)
        if 'hlag' not in f:   # すそ：足もと（move）と こしの かたむきの うごきの はんたいへ
            mv = lambda g: np.array(g.get('move', (0, 0, 0)), float)+np.array([math.sin(math.radians((tuple(g.get('root', ()))+(0, 0))[1]))*0.3, math.sin(math.radians((tuple(g.get('root', ()))+(0,))[0]))*0.3, 0])
            hl = -(mv(f)-mv(pv))*HLAGK; hl[2] = 0; n = float(np.linalg.norm(hl)); f['hlag'] = tuple(hl*min(1, HLAGMAX/max(n, 1e-9)))
        out.append(f)
    return out

def poses(name, side=False):
    """side：よこ向きの絵（kowaino_paint の S）。ななめに まわらない・ぶれ（smear）で のばさない（よこから見ると、体がよこに のびて くずれる）・とびこむ長さは SIDELUNGE ばい"""
    m = MOVES[name]; wx = WALKX.get(name)
    walk = [dict(f, **wx[i]) for i, f in enumerate(WALK)] if wx else WALK
    wv = lambda L: [dict({'wave': (WAVEN.get(name, 0.06), i*math.pi/2)}, **f) for i, f in enumerate(L)]   # 攻撃・やられも、なびく
    atk = [dict({'sq': ATKSQ[i]}, **_steady(f)) for i, f in enumerate(m['atk'])]
    hurt = [dict({'sq': HURTSQ[i]}, **f) for i, f in enumerate(m['hurt'])]
    fl = dict(hurt[-1]); r = tuple(fl.get('root', ()))+(0,)*6
    fl['root'] = (r[0], max(-DEADROLL, min(DEADROLL, r[1])))+r[2:]   # いきたえるコマ：よこへ たおれこまず、その場で下へ グチャっと くずれる（横から見て。持ち主）
    hurt[-1] = dict(fl, dead=True, ground=True, collapse=max(fl.get('collapse', 0), DEADCOL), cz=max(fl.get('cz', 0.45), 0.6))   # さいごのコマ：いきたえる（力がぬけて、布が重さで くずれ、体が地面について、目の光がきえる）
    add = lambda f, k, v: tuple(a+b for a, b in zip(tuple(f.get(k, ()))+(0,)*6, v+(0,)*(6-len(v))))
    if len(atk) > 2: atk[2] = dict(atk[2], ghost=max(1, atk[2].get('ghost', 0)))   # とびこむ コマは、残像（ぶれ）を のこす
    for i, (dm, dl) in enumerate(ATKLUNGE if not side else [(a*SIDELUNGE, b) for a, b in ATKLUNGE]):   # 攻撃：大きく ためて（うしろへ さがる）→ うつ しゅんかん、こちら（前）へ とびこむ
        if i < len(atk): atk[i] = dict(atk[i], move=add(atk[i], 'move', (0, dm, 0))[:3], hip=add(atk[i], 'hip', (dl,)))
    for i, f in enumerate(atk):   # ななめ前へ：体ごと まわし、うごき・パーティクルも 同じだけ まわす（正面に来る パーティクルも よこへ ずれる）
        t = 0 if side else ATKTURNN.get(name, ATKTURN)*ATKSIDE.get(name, 1)*ATKTURNK[min(i, 3)]; Rt = _r((0, 0, 1), t); rot = lambda v: tuple(Rt@np.array(v, float))
        atk[i] = dict(f, root=add(f, 'root', (0, 0, t)), move=rot(f.get('move', (0, 0, 0))), fx=[(k, rot(at))+tuple(r) for k, at, *r in f.get('fx', ())])
    for i, (dm, dl) in enumerate(HURTKB):   # やられ：うけた しゅんかん、うしろへ はじかれて のけぞる（うしろへ そるのは −16度まで）
        if i < len(hurt)-1: hurt[i] = dict(hurt[i], move=add(hurt[i], 'move', (0, dm, 0))[:3], chest=(lambda c: (max(-16, c[0]),)+c[1:])(add(hurt[i], 'chest', (dl,))))
    hurt += [dict(hurt[-1], fade=fd, fx=[], lag=(0, 0, 0), hlag=(0, 0, 0)) for k, fd in enumerate(DEADFADE)]   # たおれたあと：体が つぶに ほどけて、上へ きえる（kowaino_paint の fade）
    return dict(idle=_lag(IDLE, True), walk=_lag(walk, True), atk=_lag(wv(atk), False, name, not side), hurt=_lag(wv(hurt), False, name))
