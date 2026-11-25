"""せいれいの3Dを、動きの数（ポーズ）で動かして、ドット絵に写す（spirit3d）。
ポーズの数（ない物は0）：
  体  x・y・z（ずらす）・lean（前かがみ、+で前）・roll（左右にかたむく）・yaw（ひねる）。回す中心は腰 (0,0,11)
  足  legM・legP（付け根で前へふる。M はキャラの −x の足・P は +x）・liftM・liftP（上げる）・legz（足もいっしょに上下する量。ジャンプ）
  うで sN・bN・tN（手前の手：前へふる・外へ上げる・軸のまわり）、sF・bF・tF（奥の手）。手前の手が道具を持つ（いまの絵の aN）
  頭  hp（うなずく、+で下）・hr（かたむく）・hy（左右を向く）。回す中心は首 (0,0,26)
  上の物 top（左右にゆれる）・topz（上下）／しっぽ tail・風のはね wing（板の面の中で回す）
  spin（ぜんぶを、まうえから見て回す。くるくるまわる）
  道具 prop（手前の手に持つ道具の名前）・propF（奥の手）・kN・kF（手首：道具を、にぎる所のまわりで、うでのふる向きに回す。+で道具の先が、かたから手への向きへたおれる）"""
import math
import numpy as np
from core import (Q, QH, SSN, DZ, EXT, rx, ry, rz, view, arm_xf, SH)
import props as PR

PIVB = np.array([0., 0, 11]); PIVH = np.array([0., 0, 26]); EYEP = np.array([0., 22, 40.5]); HANDU = np.array([[13.0, 0, 0]])

def wrist(P, k):
    """手首：うでの座標の点を、にぎる所（HANDU）のまわりで、u（かたから手）と w（前）の面の中で k だけ回す（+で w の先が u へ）"""
    P = np.array(P, float); u = P[:, 0]-HANDU[0, 0]; w = P[:, 2].copy(); c, sn = math.cos(k), math.sin(k)
    P[:, 0] = HANDU[0, 0]+u*c+w*sn; P[:, 2] = -u*sn+w*c; return P

def posed(sp, face, p):
    """部品の名前 → (キャラの座標の点, 色 or 'cream'/'hand', 種類)。種類：'c' 体の色の部品・'h' 手・'t' 絵の色の部品・'p' 道具"""
    g = lambda k: p.get(k, 0.0)
    Rb = rz(g('yaw'))@ry(g('roll'))@rx(-g('lean')); tb = np.array([g('x'), g('y'), g('z')])
    body = lambda P: (np.asarray(P)-PIVB)@Rb.T+PIVB+tb
    Rh = rz(g('hy'))@ry(g('hr'))@rx(-g('hp')); hc = body(PIVH[None])[0]
    head = lambda P: (np.asarray(P)-PIVH)@Rh.T+hc
    out = {'body': (body(sp.solid['body']), 'cream', 'c')}
    hx_ = getattr(sp, 'hipx', 8.0)   # また（足の回る所）。持ち主のモデルは、モデルの足のまん中
    for nm, hipx in (('M', -hx_), ('P', hx_)):
        h = np.array([hipx, 0, 11.]); R = rx(g('leg'+nm)); d = np.array([g('x'), g('y'), g('legz')+g('lift'+nm)])
        out['leg'+nm] = ((sp.solid['legL' if nm == 'M' else 'legR']-h)@R.T+h+d, 'creamf' if face == 1 and nm == 'P' else 'cream', 'c')   # 横向きの奥の足（+x）は1段暗い色
    anchors = {}
    for near, k in ((True, 'N'), (False, 'F')):
        f, _ = arm_xf(face, near, g('s'+k), g('b'+k), g('t'+k)); A, Hn = sp.arm[face]
        out['arm'+k] = (body(f(A)), 'arm', 'c'); out['hand'+k] = (body(f(Hn)), 'hand', 'h')
        anchors['hand'+k] = body(f(HANDU))[0]
        pn = p.get('prop' if near else 'propF')
        if pn:
            (P, C), fx = PR.prop(pn); kw = g('k'+k)
            if kw: P = wrist(P, kw); fx = {a: (v if a == 'up' else wrist(v[None], kw)[0]) for a, v in fx.items()}
            Pw = body(f(P)); fw = {a: body(f(v[None]))[0] for a, v in fx.items() if a != 'up'}
            if 'up' in fx:   # たいらに持つ道具（フライパン・ボウル・お皿）：道具の「上」が、まうえを向くように、手のまわりで回す
                hc0 = body(f(HANDU))[0]; u0 = body(f((HANDU[0]+fx['up'])[None]))[0]-hc0; u0 = u0/np.linalg.norm(u0); z = np.array([0, 0, 1.0])
                ax = np.cross(u0, z); sn = np.linalg.norm(ax); cs = float(u0@z)
                if sn > 1e-6:
                    ax = ax/sn; K = np.array([[0, -ax[2], ax[1]], [ax[2], 0, -ax[0]], [-ax[1], ax[0], 0]]); R = np.eye(3)+sn*K+(1-cs)*K@K
                    Pw = (Pw-hc0)@R.T+hc0; fw = {a: (v-hc0)@R.T+hc0 for a, v in fw.items()}
            out['prop'+k] = (Pw, C, 'p')
            for a, v in fw.items(): anchors[a+k] = v
    for name in ('cape','chest'):
        decoration = getattr(sp,name)
        if decoration is not None:
            points, colors = decoration
            out[name] = (body(points), colors, 'd')
    # 頭の色：カメラに近い向き（前・横・うしろ）の、いまの絵の色
    R0 = rz(-face*math.pi/2+g('spin')); v = rz(-(g('yaw')+g('hy')))@(R0.T@np.array([0, 1., 0]))
    ti = 0 if v[1] >= abs(v[0]) else 2 if -v[1] >= abs(v[0]) else 1
    for nm in ('hood', 'face')+sp.fixed_head_parts:
        if nm in sp.tex: out[nm] = (head(sp.tex[nm][0]), sp.tex[nm][1][ti], 't')
    for nm, base in sp.tops:
        P, C = sp.tex[nm]; C = C[ti]
        if nm == 'ember': P2 = P+np.array([0, 0, g('topz')*2])
        elif nm == 'tip' and sp.el == 'water': P2 = P+np.array([0, 0, g('topz')])
        else: P2 = (P-base)@ry(g('top')).T+base
        out[nm] = (head(P2), C, 't')
    for nm, rec in sp.flat(face).items():
        P, C, pv, ax = rec[:4]; sg = rec[4] if len(rec) > 4 else 1
        a = (g('wing')*sg) if nm.startswith('wing') else g('tail')
        R = rx(a) if ax[0] else rz(a) if ax[2] else ry(a)   # しっぽは根もとで左右にふる（まうえの軸）・はねは板の面の中
        P2 = (P-pv)@R.T+pv
        out[nm] = ((head if nm.startswith('wing') else body)(P2), C, 't')
    anchors['eye'] = head(getattr(sp, 'eyep', EYEP)[None])[0]; anchors['eye0'] = EYEP   # 目の絵は、チップの目の所（EYEP）から、モデルの目（eyep）がうごいた分だけずらす
    if ISOEYE[0]:   # クォータービュー：左右の目を、顔の面の上の点（と、よこ・たてに少しずらした点）で持つ（shoot が画面の場所と、ちぢみ方にする）
        anchors['eyeq'] = [head(eyesurf(sp, u0, v0)) for u0, v0 in ISOEYEUV]
    ref = rz(-math.pi/2).T@np.array([0, 1., 0])   # 横向き（右を向く）のときの、カメラの向き
    anchors['ti'] = ti; anchors['mir'] = bool(ti == 1 and v[0]*ref[0] < 0)   # 目の絵：0 正面・1 横・2 なし（うしろ）、横は左右反対か
    return out, anchors

ISOEYE = [False]                     # build.py --iso がたてる
ISOEYEUV = ((-9.0, -40.0), (9.0, -40.0), (-15.0, -35.0), (15.0, -35.0))   # 左・右の目、左・右のほっぺのまん中（絵の場所＝正面の画面の点。x はキャラの x、y は −z）。js の ISOEYEUV と同じ数
def eyesurf(sp, u0, v0, d=2.0):
    """顔の面（風は、ずきん）の、正面から見て (u, v) の所の点と、u・v を d ずらした所の点（いちばん手前の面）"""
    P = sp.tex['face' if 'face' in sp.tex else 'hood'][0]; out = []
    for u, v in ((u0, v0), (u0+d, v0), (u0, v0+d)):
        m = (np.abs(P[:, 0]-u) < 0.8) & (np.abs(P[:, 2]+v) < 0.8)
        y = P[m, 1].max() if m.any() else P[:, 1].max()
        out.append([u, y, -v])
    return np.array(out)

def darker(c, k=0.72): return tuple(int(v*k) for v in c)

def shoot(sp, face, p):
    """ポーズ p の絵（EXT の大きさ、RGBA）と、場所（目のずれ・手・道具の先。チップのドット、足もとが原点）"""
    parts, anc = posed(sp, face, p); V = view(face, p.get('spin', 0.0))
    names = list(parts); Wd, Hd = (EXT[1]-EXT[0])*SSN, (EXT[3]-EXT[2])*SSN
    zb = np.full(Wd*Hd, -1e9); idb = np.full(Wd*Hd, -1); cb = np.zeros((Wd*Hd, 3), np.uint8); gz = np.full(Wd*Hd, -1e9)
    # 重なりは、本当の奥行き（手前の点が勝つ）。ただし、同じ部品のまとまりの中だけで、少しの差をつける：
    #   顔は、ずきんの表面にかさねる絵（顔の形はずきんの中にうまるので、ずきんにだけ勝つ）。こちらを向いていないときは、ずきんにかくれる。
    #   手は自分のうでに、道具は自分の手・うでに、少しだけ勝つ（GB）。
    #   体より前に出たうで・手・道具は、頭（ずきん・顔・頭の上の物）にだけ勝つ（頭がうでの長さより前へ出ているので、本当の奥行きでは、あげた手がかならず頭にかくれる。持ち主がえらんだ）。
    #   体・足・しっぽ・はねとは、本当の奥行きでくらべる。うしろ向きでは、ぜんぶ本当の奥行きのまま（持ち主の指示）。
    fdir = rz(p.get('hy', 0))@np.array([0, 1., 0]); _, _, toward = V(np.array([fdir, [0, 0, 0]])); facing = toward[0]-toward[1] > -0.3   # うしろを向いているときだけ、顔をかくす
    GB = {'arm': 0.0, 'hand': 7.0, 'prop': 1.5}
    grp = {nm: (nm[-1] if nm.startswith(('arm', 'hand', 'prop')) else None) for nm in names}
    _, _, zc = V(parts['body'][0].mean(0)[None]); zc = zc[0]   # 体のまん中の奥行き
    HEAD = ('hood', 'face')+sp.fixed_head_parts+tuple(nm for nm, _ in sp.tops); fa = np.zeros(Wd*Hd, bool)   # fa：頭に勝つ、うで・手・道具のドット
    hoodi = names.index('hood') if 'hood' in names else -2; headcov = np.zeros(Wd*Hd, bool)   # ずきん・顔のうつる所（目をかさねる所。うでが前にあれば、目の上にもう1回描く）
    colors = {'cream': sp.body_color, 'creamf': sp.far_leg_color,
              'arm': sp.arm_color, 'hand': sp.hand}
    for i, nm in enumerate(names):
        P, col, kind = parts[nm]; X, Y, Z = V(P)
        C = np.tile(np.array(colors[col], np.uint8), (len(P), 1)) if isinstance(col, str) else col
        g0 = grp[nm]; gb = GB[nm[:-1]] if g0 else 0.0
        same = np.array([grp[n] == g0 for n in names]+[False]) if g0 else None
        k = int(round((QH if kind == 't' and not nm.startswith(('tail', 'wing')) else Q)*SSN))
        for ox in range(k):
            for oy in range(k):
                c = np.floor((X-EXT[0])*SSN).astype(int)+ox; r = np.floor((Y-EXT[2])*SSN).astype(int)+oy
                ok = (c >= 0) & (c < Wd) & (r >= 0) & (r < Hd); j = r[ok]*Wd+c[ok]; z = Z[ok]; cc = C[ok]
                o = np.lexsort((z, j)); j, z, cc = j[o], z[o], cc[o]; last = np.r_[j[1:] != j[:-1], True]; j, z, cc = j[last], z[last], cc[last]
                if nm in ('hood', 'face')+sp.fixed_head_parts: headcov[j] |= (nm != 'face') or facing
                if nm == 'face':
                    bt = ((z > zb[j]) | ((idb[j] == hoodi) & facing)) & ~fa[j]
                    zb[j[bt]] = np.maximum(z[bt], zb[j[bt]]+0.5)
                elif g0:
                    sg = same[idb[j]]; bt = np.where(sg, z+gb > gz[j], z > zb[j])
                    zb[j[bt]] = np.maximum(z[bt], np.where(sg[bt], zb[j[bt]], -1e9)); gz[j[bt]] = z[bt]+gb
                    fa[j[bt]] = facing & (z[bt] > zc+2)
                else:
                    bt = z > zb[j]
                    if nm in HEAD: bt &= ~fa[j]
                    zb[j[bt]] = z[bt]; fa[j[bt]] = False
                idb[j[bt]] = i; cb[j[bt]] = cc[bt]
    zb = zb.reshape(Hd, Wd); idb = idb.reshape(Hd, Wd); cb = cb.reshape(Hd, Wd, 3)
    W1, H1 = Wd//SSN, Hd//SSN
    blk = idb.reshape(H1, SSN, W1, SSN).transpose(0, 2, 1, 3).reshape(H1, W1, -1)
    zbk = zb.reshape(H1, SSN, W1, SSN).transpose(0, 2, 1, 3).reshape(H1, W1, -1)
    cbk = cb.reshape(H1, SSN, W1, SSN, 3).transpose(0, 2, 1, 3, 4).reshape(H1, W1, -1, 3)
    pk = (cbk[..., 0].astype(np.int64) << 16) | (cbk[..., 1].astype(np.int64) << 8) | cbk[..., 2]
    cov = (blk >= 0).sum(-1); ids = np.full((H1, W1), -1); dep = np.full((H1, W1), -1e9); img = np.zeros((H1, W1, 4), np.uint8)
    for yy, xx in np.argwhere(cov*2 >= SSN*SSN):
        bb = blk[yy, xx]; v, n = np.unique(bb[bb >= 0], return_counts=True); i = v[np.argmax(n)]; ids[yy, xx] = i
        m = bb == i; dep[yy, xx] = zbk[yy, xx][m].mean()
        cv, cn = np.unique(pk[yy, xx][m], return_counts=True); c = cv[np.argmax(cn)]
        img[yy, xx] = (c >> 16 & 255, c >> 8 & 255, c & 255, 255)
    kind = np.array([parts[n][2] for n in names]+['-'])[ids]
    cream = kind == 'c'; isprop = kind == 'p'; bodyi = names.index('body'); legs = [names.index('legM'), names.index('legP')]
    hands = [i for i, n in enumerate(names) if parts[n][2] == 'h']
    def sh(a, dy, dx, fill):
        o = np.full_like(a, fill); o[max(dy, 0):H1+min(dy, 0), max(dx, 0):W1+min(dx, 0)] = a[max(-dy, 0):H1+min(-dy, 0), max(-dx, 0):W1+min(-dx, 0)]; return o
    solid = ids >= 0; line = np.zeros((H1, W1), bool); pline = np.zeros((H1, W1), bool)
    for d in (1, 2):
        for dy, dx in ((0, d), (0, -d), (d, 0), (-d, 0)):
            nid = sh(ids, dy, dx, -1); nd = sh(dep, dy, dx, -1e9)
            line |= cream & ~sh(solid, dy, dx, False)
            line |= cream & (ids != bodyi) & (nid >= 0) & (nid != ids) & (dep-nd > DZ) & ~np.isin(nid, hands) & ~(np.isin(ids, legs) & (nid == bodyi))
            if d == 1: pline |= isprop & ((nid < 0) | ((nid != ids) & (dep-nd > DZ)))
    img[line, :3] = sp.line
    for yy, xx in np.argwhere(pline): img[yy, xx, :3] = darker(tuple(img[yy, xx, :3]))
    # 目・ほっぺはゲームが顔の所にかさねるので、ずきん・顔の上で手前にある、うで・手・道具の所を、もう1まい（目の上にかさねる絵）にする
    hc = headcov.reshape(H1, SSN, W1, SSN).any(axis=(1, 3)); armi = [i for i, n in enumerate(names) if grp[n]]
    over = np.zeros_like(img); m = hc & np.isin(ids, armi); over[m] = img[m]
    V0 = view(face, 0.0)
    def scr(P):
        X, Y, _ = V(np.asarray(P)[None]); return [round(float(X[0]), 2), round(float(Y[0]), 2)]
    ex, ey = scr(anc['eye']); x0, y0, _ = view(anc['ti'] if anc['ti'] != face else face, 0.0, False)(anc['eye0'][None])   # 目の絵の向き（くるくるまわるときは、そのとき見える向き）の、止まっているときの場所から
    if anc['mir']: x0 = -x0
    A = {'eye': [int(round(ex-x0[0])), int(round(ey-y0[0])), anc['ti'], 1 if anc['mir'] else 0], 'facing': bool(facing)}
    if 'eyeq' in anc and anc['ti'] == 0:   # 左右の目：画面の場所・ちぢみ方（目の絵の1ドット → 画面）・見えるか
        HI = [names.index(n) for n in names if n in HEAD]
        for k, Q3 in enumerate(anc['eyeq']):
            X, Y, Z = V(Q3); d = 2.0; a, b = (X[1]-X[0])/d, (Y[1]-Y[0])/d; c, dd = (X[2]-X[0])/d, (Y[2]-Y[0])/d
            col = int(np.floor((X[0]-EXT[0])*SSN)); row = int(np.floor((Y[0]-EXT[2])*SSN)); vis = 1
            if a*dd-b*c < (0.25 if k < 2 else 0.5): vis = 0   # 面がむこうを向いている（ほっぺは、ふちに近いと、かくす）
            elif 0 <= row < Hd and 0 <= col < Wd and zb[row, col] > Z[0]+1.5 and idb[row, col] in HI and idb[row, col] not in [names.index(n) for n in ('face',) if n in names]: vis = 0   # ずきんのふちにかくれる
            if vis and 'face' in names:   # 写した絵で、そのまん中が顔の上か（ずきんのふちの上なら、かくす）
                r1, c1 = int(np.floor(Y[0]-EXT[2])), int(np.floor(X[0]-EXT[0]))
                if not (0 <= r1 < H1 and 0 <= c1 < W1 and ids[r1, c1] == names.index('face')): vis = 0
            A['eye'] += [round(float(X[0]), 1), round(float(Y[0]), 1), round(float(a), 2), round(float(b), 2), round(float(c), 2), round(float(dd), 2), vis]
    for k, v in anc.items():
        if k not in ('eye', 'eye0', 'ti', 'mir', 'eyeq'): A[k] = scr(v)
    return img, over, A
