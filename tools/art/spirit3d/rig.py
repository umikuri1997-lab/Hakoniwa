"""せいれいの3Dを、動きの数（ポーズ）で動かして、ドット絵に写す（spirit3d）。
ポーズの数（ない物は0）：
  体  x・y・z（ずらす）・lean（前かがみ、+で前）・roll（左右にかたむく）・yaw（ひねる）。回す中心は腰 (0,0,11)
  足  legM・legP（付け根で前へふる。M はキャラの −x の足・P は +x）・liftM・liftP（上げる）・legz（足もいっしょに上下する量。ジャンプ）
  うで sN・bN・tN（手前の手：前へふる・外へ上げる・軸のまわり）、sF・bF・tF（奥の手）。手前の手が道具を持つ（いまの絵の aN）
  頭  hp（うなずく、+で下）・hr（かたむく）・hy（左右を向く）。回す中心は首 (0,0,26)
  上の物 top（左右にゆれる）・topz（上下）／しっぽ tail・風のはね wing（板の面の中で回す）
  spin（ぜんぶを、まうえから見て回す。くるくるまわる）
  道具 prop（手前の手に持つ道具の名前）・propF（奥の手）"""
import math
import numpy as np
from core import (Q, QH, SSN, DZ, EXT, CREAM, rx, ry, rz, view, arm_xf, SH)
import props as PR

PIVB = np.array([0., 0, 11]); PIVH = np.array([0., 0, 26]); EYEP = np.array([0., 22, 40.5]); HANDU = np.array([[13.0, 0, 0]])

def posed(sp, face, p):
    """部品の名前 → (キャラの座標の点, 色 or 'cream'/'hand', 種類)。種類：'c' 体の色の部品・'h' 手・'t' 絵の色の部品・'p' 道具"""
    g = lambda k: p.get(k, 0.0)
    Rb = rz(g('yaw'))@ry(g('roll'))@rx(-g('lean')); tb = np.array([g('x'), g('y'), g('z')])
    body = lambda P: (np.asarray(P)-PIVB)@Rb.T+PIVB+tb
    Rh = rz(g('hy'))@ry(g('hr'))@rx(-g('hp')); hc = body(PIVH[None])[0]
    head = lambda P: (np.asarray(P)-PIVH)@Rh.T+hc
    out = {'body': (body(sp.solid['body']), 'cream', 'c')}
    for nm, hipx in (('M', -8.0), ('P', 8.0)):
        h = np.array([hipx, 0, 11.]); R = rx(g('leg'+nm)); d = np.array([g('x'), g('y'), g('legz')+g('lift'+nm)])
        out['leg'+nm] = ((sp.solid['legL' if nm == 'M' else 'legR']-h)@R.T+h+d, 'cream', 'c')
    anchors = {}
    for near, k in ((True, 'N'), (False, 'F')):
        f, _ = arm_xf(face, near, g('s'+k), g('b'+k), g('t'+k)); A, Hn = sp.arm[face]
        out['arm'+k] = (body(f(A)), 'cream', 'c'); out['hand'+k] = (body(f(Hn)), 'hand', 'h')
        anchors['hand'+k] = body(f(HANDU))[0]
        pn = p.get('prop' if near else 'propF')
        if pn:
            (P, C), fx = PR.prop(pn); out['prop'+k] = (body(f(P)), C, 'p')
            for a, v in fx.items(): anchors[a+k] = body(f(v[None]))[0]
    # 頭の色：カメラに近い向き（前・横・うしろ）の、いまの絵の色
    R0 = rz(-face*math.pi/2+g('spin')); v = rz(-(g('yaw')+g('hy')))@(R0.T@np.array([0, 1., 0]))
    ti = 0 if v[1] >= abs(v[0]) else 2 if -v[1] >= abs(v[0]) else 1
    for nm in ('hood', 'face'):
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
    anchors['eye'] = head(EYEP[None])[0]; anchors['eye0'] = EYEP
    ref = rz(-math.pi/2).T@np.array([0, 1., 0])   # 横向き（右を向く）のときの、カメラの向き
    anchors['ti'] = ti; anchors['mir'] = bool(ti == 1 and v[0]*ref[0] < 0)   # 目の絵：0 正面・1 横・2 なし（うしろ）、横は左右反対か
    return out, anchors

def darker(c, k=0.72): return tuple(int(v*k) for v in c)

def shoot(sp, face, p):
    """ポーズ p の絵（EXT の大きさ、RGBA）と、場所（目のずれ・手・道具の先。チップのドット、足もとが原点）"""
    parts, anc = posed(sp, face, p); V = view(face, p.get('spin', 0.0))
    names = list(parts); Wd, Hd = (EXT[1]-EXT[0])*SSN, (EXT[3]-EXT[2])*SSN
    zb = np.full(Wd*Hd, -1e9); idb = np.full(Wd*Hd, -1); cb = np.zeros((Wd*Hd, 3), np.uint8)
    # 顔は、こちらを向いているときだけ、ずきんの上に見える
    fdir = rz(p.get('hy', 0))@np.array([0, 1., 0]); _, _, toward = V(np.array([fdir, [0, 0, 0]])); facing = toward[0]-toward[1] > -0.3   # うしろを向いているときだけ、顔をかくす
    _, _, zc = V(parts['body'][0].mean(0)[None]); zc = zc[0]   # 体のまん中の奥行き
    for i, nm in enumerate(names):
        P, col, kind = parts[nm]; X, Y, Z = V(P)
        if nm.startswith(('arm', 'hand', 'prop')): Z = Z+np.where(Z > zc+2, 40.0, 0.0)   # 体より前に出たうで・手・道具は、頭より手前（いまの絵の frontArm と同じ）
        C = np.tile(np.array(CREAM if col == 'cream' else sp.hand, np.uint8), (len(P), 1)) if isinstance(col, str) else col
        if kind == 'h': Z = Z+7
        if nm == 'face': Z = Z+(60 if facing else -1000)
        if kind == 'p': Z = Z+1.5
        k = int(round((QH if kind == 't' and not nm.startswith(('tail', 'wing')) else Q)*SSN))
        for ox in range(k):
            for oy in range(k):
                c = np.floor((X-EXT[0])*SSN).astype(int)+ox; r = np.floor((Y-EXT[2])*SSN).astype(int)+oy
                ok = (c >= 0) & (c < Wd) & (r >= 0) & (r < Hd); j = r[ok]*Wd+c[ok]; z = Z[ok]; cc = C[ok]
                o = np.lexsort((z, j)); j, z, cc = j[o], z[o], cc[o]; last = np.r_[j[1:] != j[:-1], True]; j, z, cc = j[last], z[last], cc[last]
                bt = z > zb[j]; zb[j[bt]] = z[bt]; idb[j[bt]] = i; cb[j[bt]] = cc[bt]
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
    V0 = view(face, 0.0)
    def scr(P):
        X, Y, _ = V(np.asarray(P)[None]); return [round(float(X[0]), 2), round(float(Y[0]), 2)]
    ex, ey = scr(anc['eye']); x0, y0, _ = view(anc['ti'] if anc['ti'] != face else face, 0.0)(anc['eye0'][None])   # 目の絵の向き（くるくるまわるときは、そのとき見える向き）の、止まっているときの場所から
    if anc['mir']: x0 = -x0
    A = {'eye': [int(round(ex-x0[0])), int(round(ey-y0[0])), anc['ti'], 1 if anc['mir'] else 0], 'facing': bool(facing)}
    for k, v in anc.items():
        if k not in ('eye', 'eye0', 'ti', 'mir'): A[k] = scr(v)
    return img, A
