"""カミサマのクォータービューの絵（前ななめ＝左下を向く）を、いまの正面のドット絵から3Dに組んで写す。

  python3 tools/art/god3d/god3d.py <出力フォルダ>            # god_iso.png・ならべた絵（cmp_x4.png）を書く
  python3 tools/art/god3d/god3d.py <出力フォルダ> --chips    # ゲームのチップ god にも入れる

もとの絵は、正面の絵 tools/art/god3d/god_front.png（入れかえる前のチップ god、56×116、1ドット＝ゲームの半分の点）。
組み方（せいれいの spirit3d と同じ考え方：正面の絵の形と色を、体の面にうつす）：
  体（頭・ひげ・服）：絵の行ごとの切り口をだ円にする（はば＝その行の絵のはば、おくゆき＝はばの BD）。色は、正面の絵の同じ (x, 高さ) の色。
    つえ・手の所は、体の色では、となりの色でうめる（つえ・手はべつの部品）。
  つえ（上の丸い頭・柄）と手：絵の行ごとのはばの、まるい棒。体の前（STAFFY）に、まっすぐ立てる。色は、正面の絵の色。
  天使の輪：まうえから見て丸い輪（正面の絵の輪の、外と内のはば・高さから）。
写し方：たての軸のまわりに45度まわし、家具・建物（iso3d.py）と同じ見おろしの角度で写す（地面のおくゆきは0.75・高さは ISOH）。
  かげは足さない（色はもとの絵の色のまま）。行ごとの段の上のふたも作る（見おろすと見える）。
"""
import os, sys, math
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))
sys.path.insert(0, os.path.join(ROOT, 'tools'))
SRC = os.path.join(HERE, 'god_front.png')
AXIS = 28            # たての軸（絵の x）
HALO = 12            # この行より上は天使の輪
STAFF = (184, 142, 104)
LIT = {(247, 206, 153), (251, 211, 163), (244, 219, 195)}   # つえの光の当たったふちの色
SIDE = 0.75          # 横・うしろの面（正面の絵の、はしから外の所）は、はばの SIDE の所の色（はしの色をのばすと、よこすじになる）
BD = 0.72            # 体のおくゆき（はばに対して）
STAFFY = 21.0        # つえの軸の、体のまん中からの前への出（ドット）
YAW = math.pi/4      # 前ななめ（左下を向く）
SSN = 4              # 写すときの細かさ（1ドットを SSN×SSN）
ELEV = math.degrees(math.asin(0.75))   # 見おろしの角度：家具・建物の iso3d.py と同じ（地面のたては、よこの0.75＝ほんとうのカメラ48.59度）
KD = 0.75            # 地面のおくゆき → 画面の上下（iso3d.py：ひし形 128×96）
KZ = 72/0.8/(128/math.sqrt(2))   # 高さ → 画面の上下（iso3d.py の ISOH：1マスの高さはマスの1辺の0.8＝72ドット）

def load():
    a = np.array(Image.open(SRC).convert('RGBA')); H, W = a.shape[:2]
    al = a[..., 3] > 0
    st = al & np.all(a[..., :3] == STAFF, -1)
    st[:45] = False                                             # 上のほうの茶色は、目
    # つえ・手のまとまり：つえの色の所と、その間の手（はだ色、つえの行の左右のつえにはさまれた所）
    prop = st.copy()
    rows = np.nonzero(st.any(1))[0]; r0, r1 = rows.min(), rows.max()
    for r in range(r0, r1+1):
        if st[r].any():
            c = np.nonzero(st[r])[0]; x1 = c.max()+1
            if tuple(int(v) for v in a[r, x1, :3]) in LIT: x1 += 1   # つえの右の、光の当たったふち（はだ色ににている）
            prop[r, c.min():x1] = True
    # 手：つえの頭と柄のあいだの行（つえの色がない行）のはだ色
    skin = al & (np.abs(a[..., 0].astype(int)-251) < 8) & (np.abs(a[..., 1].astype(int)-211) < 10) & (a[..., 2] < 175)
    for r in range(r0, r1+1):
        if not st[r].any() and skin[r].any():
            c = np.nonzero(skin[r])[0]; prop[r, c.min():c.max()+1] = True
    # 体の色：つえ・手の所を、その行の左右のいちばん近い体の色でうめる
    body = a.copy()
    bal = al.copy()
    for r in range(H):
        cs = np.nonzero(prop[r])[0]
        if not len(cs): continue
        L, R = cs.min()-1, cs.max()+1
        if not (al[r, L] and al[r, R]): bal[r, cs] = False; continue   # 服のすそより下のつえの先：体はない
        for c in cs:
            body[r, c] = a[r, L] if c-L <= R-c else a[r, R]
    return a, bal, prop, body

def colorat(col, al, r, xs, x0, x1, cx, ax, edge):
    """行 r の、正面の絵の x（xs）の色。edge があれば、はしの edge ドットは使わず、はばの SIDE より外は、上下5行でいちばん多い色
    （まわした横・うしろの面に、1行だけのまゆ・ふちの色が、よこすじになってのびない）"""
    if edge: xs = np.clip(xs, cx-ax*SIDE, cx+ax*SIDE)
    e = edge if x1-x0 > 4*edge+2 else 0; ci = np.clip(np.floor(xs+AXIS).astype(int), x0+e, x1-1-e)
    cc = col[r, ci, :3].copy()
    if edge:
        sd = np.abs(xs-cx) >= ax*SIDE-1e-6
        for c0 in np.unique(ci[sd]):
            cand = [tuple(int(v) for v in col[q, c0, :3]) for q in range(max(0, r-2), min(al.shape[0], r+3)) if al[q, c0]]
            if cand: cc[sd & (ci == c0)] = max(set(cand), key=cand.count)
    return cc

def shell(al, col, rows, depth, cy_of, edge=0, rot=0.0):
    """行ごとのだ円の切り口の点 (x, y, z) と色：まわりの面と、上のふた（見おろすと、行ごとの段の上の面が見える）。cy_of(r)：だ円のまん中の y。
    rot：色をとる角度のずらし（まるい棒は、カメラから見える半分に、正面の絵をそのままうつす）"""
    P = []; C = []; H = al.shape[0]
    for r in rows:
        cs = np.nonzero(al[r])[0]
        if not len(cs): continue
        x0, x1 = cs.min(), cs.max()+1; ax = (x1-x0)/2; cx = (x0+x1)/2-AXIS; by = max(ax*depth(r), 0.5); cy = cy_of(r)
        n = max(32, int(2*math.pi*max(ax, by)/0.2))
        th = np.linspace(0, 2*math.pi, n, endpoint=False)
        cr = colorat(col, al, r, cx+ax*np.cos(th-rot), x0, x1, cx, ax, edge)
        for sz in np.arange(0.125, 1, 0.25):
            for shrink in (1.0, 0.9):
                x = cx+ax*shrink*np.cos(th); y = cy+by*shrink*np.sin(th)
                P.append(np.stack([x, y, np.full(n, (H-r)-sz)], 1)); C.append(cr)
        g = np.mgrid[-ax:ax:0.25, -by:by:0.25].reshape(2, -1).T; g = g[(g[:, 0]/ax)**2+(g[:, 1]/by)**2 <= 0.97]   # ふた
        if len(g):
            x = cx+g[:, 0]; P.append(np.stack([x, cy+g[:, 1], np.full(len(g), H-r-0.02)], 1))
            C.append(colorat(col, al, r, cx+g[:, 0] if not rot else cx+ax*np.cos(np.arctan2(g[:, 1]/by, g[:, 0]/ax)-rot)*np.hypot(g[:, 0]/ax, g[:, 1]/by), x0, x1, cx, ax, edge))
    return np.concatenate(P), np.concatenate(C)

def halo(a):
    """天使の輪：まうえから見て丸い輪（正面の絵の輪の、外と内のはば・高さから）"""
    al = a[:HALO, :, 3] > 0; ys, xs = np.nonzero(al)
    cx = (xs.min()+xs.max()+1)/2-AXIS; Ro = (xs.max()+1-xs.min())/2
    mid = (ys.min()+ys.max())//2; c = np.nonzero(al[mid])[0]; gap = np.nonzero(np.diff(c) > 1)[0]
    Ri = (c[gap[0]+1]-c[gap[0]])/2 if len(gap) else Ro*0.6
    th_ = 0.75; zc = a.shape[0]-(ys.min()+ys.max()+1)/2
    col = np.array(a[mid, c[0], :3])
    g = np.mgrid[-Ro:Ro:0.2, -Ro:Ro:0.2].reshape(2, -1).T; rr = np.hypot(g[:, 0], g[:, 1]); g = g[(rr >= Ri) & (rr <= Ro)]   # うすい平らな輪（上と下の面）
    P = [np.stack([cx+g[:, 0], g[:, 1], np.full(len(g), zc+dz)], 1) for dz in np.arange(-th_, th_+0.01, 0.25)]
    P = np.concatenate(P); return P, np.tile(col, (len(P), 1))

def render(a, al, prop, body):
    H, W = a.shape[:2]
    bal = al.copy(); bal[:HALO] = False
    al = a[..., 3] > 0
    Pb, Cb = shell(bal, body, range(HALO, H), lambda r: BD, lambda r: 0.0, edge=2)
    Pp, Cp = shell(prop.copy(), a, range(HALO, H), lambda r: 1.0, lambda r: STAFFY, rot=-YAW)   # つえ・手は、まわしても正面の絵と同じに見える
    Ph, Ch = halo(a)
    c, s = math.cos(YAW), math.sin(YAW); ce, se = math.cos(math.radians(ELEV)), math.sin(math.radians(ELEV))
    L = []
    for k, (P, C) in enumerate(((Pb, Cb), (Pp, Cp), (Ph, Ch))):
        X = c*P[:, 0]-s*P[:, 1]; D = s*P[:, 0]+c*P[:, 1]
        Y = -KZ*P[:, 2]+KD*D; Z = D*ce+P[:, 2]*se   # 画面の上下（足もとが0）・カメラへの近さ
        L.append((X, Y, Z, C, k))
    Xa = np.concatenate([l[0] for l in L]); Ya = np.concatenate([l[1] for l in L])
    x0 = math.floor(Xa.min())-1; x1 = math.ceil(Xa.max())+1; y0 = math.floor(Ya.min())-1; y1 = math.ceil(Ya.max())+1
    OW, OH = x1-x0, y1-y0
    zb = np.full((OH*SSN, OW*SSN), -1e9); cb = np.zeros((OH*SSN, OW*SSN, 3), np.uint8); ib = np.full((OH*SSN, OW*SSN), -1)
    for X, Y, Z, C, k in L:
        cc = np.floor((X-x0)*SSN).astype(int); rr = np.floor((Y-y0)*SSN).astype(int)
        o = np.argsort(Z); cc, rr, Z, C = cc[o], rr[o], Z[o], C[o]   # 奥から手前へ（手前があとで上書き）
        m = Z > zb[rr, cc]; zb[rr[m], cc[m]] = Z[m]; cb[rr[m], cc[m]] = C[m]; ib[rr[m], cc[m]] = k
    out = np.zeros((OH, OW, 4), np.uint8)
    for y in range(OH):
        for x in range(OW):
            blk = ib[y*SSN:(y+1)*SSN, x*SSN:(x+1)*SSN]
            if (blk >= 0).sum()*2 < SSN*SSN: continue
            col = cb[y*SSN:(y+1)*SSN, x*SSN:(x+1)*SSN][blk >= 0].reshape(-1, 3)
            pk = (col[:, 0].astype(int) << 16) | (col[:, 1].astype(int) << 8) | col[:, 2]
            v, n = np.unique(pk, return_counts=True); p = v[np.argmax(n)]
            out[y, x] = (p >> 16 & 255, p >> 8 & 255, p & 255, 255)
    return out, x0, y0   # x0・y0：足もと（絵の (−x0, −y0)）から絵の左上までのずれ

def main():
    args = sys.argv[1:]; chips = '--chips' in args; args = [x for x in args if x != '--chips']
    od = args[0]; os.makedirs(od, exist_ok=True)
    a, al, prop, body = load()
    out, ox0, oy0 = render(a, al, prop, body)
    im = Image.fromarray(out); im.save(os.path.join(od, 'god_iso.png'))
    src = Image.open(SRC).convert('RGBA'); H = max(src.height, -oy0+16)+max(0, out.shape[0]+oy0)
    cmp = Image.new('RGBA', ((src.width+out.shape[1])*4+16, H*4), (200, 220, 180, 255))
    fy = H-max(0, out.shape[0]+oy0)   # 足もとの行をそろえる
    cmp.alpha_composite(src.resize((src.width*4, src.height*4), Image.NEAREST), (0, (fy-src.height)*4))
    cmp.alpha_composite(im.resize((im.width*4, im.height*4), Image.NEAREST), (src.width*4+16, (fy+oy0)*4))
    cmp.save(os.path.join(od, 'cmp_x4.png'))
    print('色の数', len({tuple(p) for p in out.reshape(-1, 4) if p[3]}), '大きさ', im.size)
    if chips:
        import chips as CH
        head, C = CH.load_imgs(); g = C['god']
        C['god'] = dict(ax=ox0, ay=oy0, w=im.width, h=im.height, r=g.get('r', 2), f=[im])   # ax・ay：足もと（台座の上の面のまん中）から絵の左上へ
        CH.pack_imgs(head, C)
        open(os.path.join(ROOT, '.chips_changed'), 'w').write('god'); print('チップ god に入れた')

if __name__ == '__main__':
    main()
