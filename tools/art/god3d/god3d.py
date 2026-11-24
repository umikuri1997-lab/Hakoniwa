"""カミサマのクォータービューの絵（前ななめ＝左下を向く・家具と同じ見おろし）を、部品ごとの3Dで組んで写す。

  python3 tools/art/god3d/god3d.py <出力フォルダ>            # god_iso.png・ならべた絵（cmp_x4.png）・10倍の絵を書く
  python3 tools/art/god3d/god3d.py <出力フォルダ> --chips    # ゲームのチップ god にも入れる

お手本は、持ち主の参考の絵 tools/art/god3d/ref.jpg（正面・よこ・うしろ）。色と輪の大きさは、前の正面の絵 god_front.png（1ドット＝ゲームの半分の点）から。
単位は絵のドット（x＝右・y＝カミサマの前・z＝上。足もと（台座の上の面のまん中）が原点）。
設計図（部品・形・寸法・どこにつくか。参考の絵の2頭身）：
  服：すその広がる短いベルの形。たての軸のまわりのだ円（おくゆきは BODYD）。半径はすそ24・胸20・かた17・首9。足もとから首（z 45）まで。すそに金色の帯（z 3〜5）。
  えり：首まわりの、肩にかかる太い輪（z 41.5）。うしろはフード（うしろの玉）。
  そで：かた（±15, 3, 38）から、手（±6.5, 12, 20）へ下りるつつ。かたで半径6、そで口で8.5。そで口に金色のふち。
  手：そで口の前で、つえの柄を左右からにぎる玉（±3.2, 18.5, 21.5）。
  つえ：体の前の地面（y 22）から、手の間をとおって、少し体へかたむけて立てる木の柄（半径2）。上はスプーンの形の頭（胸の前、口ひげの下）。
  頭：首の上の、まるい頭（はば22。画面でまるく見えるよう、たては KC）。耳（±22.5）・白いまゆ（±8.5）・小さな鼻・大きな口ひげ（左右とまん中のふくらみ）。あごひげはない。
    目：とじた目（∩の形の線）を、顔の面にのるもよう（こげ茶）で入れる。
  天使の輪：頭の上に、はなしてうく、細くうすい平らな輪（金色）。
写し方：たての軸のまわりに45度まわし、家具・建物（iso3d.py）と同じ見おろしの角度で写す（地面のおくゆきは0.75・高さは ISOH）。
  かげは左上の光で3だん（もとの色・半かげ・かげ。かげは明るさ−SHL。はだ・白いひげがオレンジにならないよう、家具よりうすく）。輪の色はかげなし。
  輪郭：外がわに1ドット（となりの色を少し暗く。黒にしない）。手前の部品がうしろにかさなる所も1ドット。
"""
import os, sys, math, colorsys
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))
sys.path.insert(0, os.path.join(ROOT, 'tools'))
SRC = os.path.join(HERE, 'god_front.png')
YAW = math.pi/4                         # 前ななめ（左下を向く）
ELEV = math.degrees(math.asin(0.75))    # 見おろし：家具・建物の iso3d.py と同じ（ほんとうのカメラ48.59度）
KD = 0.75                               # 地面のおくゆき → 画面の上下（ひし形 128×96）
KZ = 72/0.8/(128/math.sqrt(2))          # 高さ → 画面の上下（iso3d.py の ISOH：1マスの高さはマスの1辺の0.8）
SSN = 4                                 # 写すときの細かさ（1ドットを SSN×SSN）
STEP = 0.2                              # 面の点のあいだ（ドット）
DZ = 3.0                                # この奥行きの差より大きく、手前の部品がかさなる所に線
BODYD = 0.85
SHL = 18; SHS = 0.0         # かげの明るさ・あざやかさのかわり
OLK = 0.9                    # 輪郭線＝となりの色×OLK

# 色（前の正面の絵の色）
SKIN = (251, 211, 163); ROBE = (244, 237, 225); SLEEVE = (240, 232, 218); BEARD = (252, 246, 236); HAIR = (252, 244, 235)
WOOD = (176, 124, 84); EYE = (130, 90, 66); HALO = (250, 222, 150); TRIM = (244, 214, 150)   # 輪・ふちは、うすい金色

def shade(c, k):
    """k：0 もとの色・1 かげ（明るさ−SHL・あざやかさ+SHS）・0.5 半かげ。家具（−35・+10）より、うすく（はだ・白いひげが、こいオレンジ・ピーチにならない）"""
    r, g, b = [v/255 for v in c]; h, l, s = colorsys.rgb_to_hls(r, g, b)
    l2 = max(0, l-SHL/255*k); s2 = min(1, s+SHS*k); r, g, b = colorsys.hls_to_rgb(h, l2, s2)
    return tuple(int(round(v*255)) for v in (r, g, b))

class Model:
    def __init__(self): self.P = []; self.N = []; self.C = []; self.I = []; self.flat = []
    def add(self, P, N, col, pid, flat=False):
        P = np.asarray(P, float); N = np.asarray(N, float); N = N/np.maximum(np.linalg.norm(N, axis=1, keepdims=True), 1e-9)
        C = np.tile(np.array(col, np.uint8), (len(P), 1)) if np.ndim(col) == 1 else np.asarray(col, np.uint8)
        self.P.append(P); self.N.append(N); self.C.append(C); self.I.append(np.full(len(P), pid)); self.flat.append(np.full(len(P), flat))
    def ellipsoid(self, c, r, col, pid, decal=None):
        a, b, cc = r; n_u = max(24, int(2*math.pi*max(a, b)/STEP)); n_v = max(12, int(math.pi*max(a, b, cc)/STEP))
        u, v = np.meshgrid(np.linspace(0, 2*math.pi, n_u, endpoint=False), np.linspace(0, math.pi, n_v))
        u = u.ravel(); v = v.ravel()
        X = np.stack([a*np.sin(v)*np.cos(u), b*np.sin(v)*np.sin(u), cc*np.cos(v)], 1)
        N = np.stack([X[:, 0]/a**2, X[:, 1]/b**2, X[:, 2]/cc**2], 1); P = X+np.array(c)
        C = np.tile(np.array(col, np.uint8), (len(P), 1))
        if decal is not None:
            m, dc = decal(P); C[m] = dc
        self.add(P, N, C, pid)
    def revolve(self, prof, depth, col, pid, decal=None):
        """たての軸のまわりのだ円の面（prof：[(z, 半径)]、おくゆきは半径×depth）"""
        z0, z1 = prof[0][0], prof[-1][0]; zs = np.arange(z0, z1, STEP/2)
        R = np.interp(zs, [p[0] for p in prof], [p[1] for p in prof]); dR = np.gradient(R, zs)
        P = []; N = []
        for z, r, dr in zip(zs, R, dR):
            n = max(24, int(2*math.pi*r/STEP)); t = np.linspace(0, 2*math.pi, n, endpoint=False)
            x = r*np.cos(t); y = r*depth*np.sin(t)
            P.append(np.stack([x, y, np.full(n, z)], 1)); N.append(np.stack([np.cos(t), np.sin(t)/depth, np.full(n, -dr)], 1))
        P = np.concatenate(P); C = np.tile(np.array(col, np.uint8), (len(P), 1))
        if decal is not None:
            m, dc = decal(P); C[m] = dc
        self.add(P, np.concatenate(N), C, pid)
    def tube(self, a, b, ra, rb, col, pid, cap=True, band=None):
        a = np.array(a, float); b = np.array(b, float); d = b-a; L = np.linalg.norm(d); w = d/L
        u = np.cross(w, [0, 0, 1.]); u = u/np.linalg.norm(u) if np.linalg.norm(u) > 1e-6 else np.array([1., 0, 0]); v = np.cross(w, u)
        P = []; N = []
        for s in np.arange(0, L, STEP/2):
            r = ra+(rb-ra)*s/L; n = max(16, int(2*math.pi*r/STEP)); t = np.linspace(0, 2*math.pi, n, endpoint=False)
            o = np.outer(np.cos(t), u)+np.outer(np.sin(t), v); P.append(a+w*s+o*r); N.append(o-w*(rb-ra)/L)
        nb = sum(len(q) for q in P)
        if cap:   # そで口のふた（中は手でうまる）
            r = rb; g = np.mgrid[-r:r:STEP, -r:r:STEP].reshape(2, -1).T; g = g[np.hypot(g[:, 0], g[:, 1]) <= r]
            P.append(b+np.outer(g[:, 0], u)+np.outer(g[:, 1], v)-w*0.6); N.append(np.tile(w, (len(g), 1)))
        P = np.concatenate(P); C = np.tile(np.array(col, np.uint8), (len(P), 1))
        if band is not None:   # そで口の金色のふち（はしから band[0] の長さ）
            C[:nb][((P[:nb]-a)@w) > L-band[0]] = band[1]
        self.add(P, np.concatenate(N), C, pid)
    def sweep(self, C, r, col, pid):
        """点の列 C（中心の線）にそった、太さ r（数か列）のつつ"""
        C = np.asarray(C, float); R = np.broadcast_to(np.asarray(r, float), (len(C),)); P = []; N = []
        for i in range(len(C)):
            t = C[min(i+1, len(C)-1)]-C[max(i-1, 0)]; t /= np.linalg.norm(t)
            u = np.cross(t, [0, 1., 0]); u = u/np.linalg.norm(u) if np.linalg.norm(u) > 1e-6 else np.array([1., 0, 0]); v = np.cross(t, u)
            n = max(16, int(2*math.pi*R[i]/STEP)); a = np.linspace(0, 2*math.pi, n, endpoint=False); o = np.outer(np.cos(a), u)+np.outer(np.sin(a), v)
            P.append(C[i]+o*R[i]); N.append(o)
        self.add(np.concatenate(P), np.concatenate(N), col, pid)
    def torus(self, c, R, r, axis, col, pid, arc=(0, 2*math.pi)):
        c = np.array(c, float); ax = np.array(axis, float); ax /= np.linalg.norm(ax)
        e1 = np.cross(ax, [0, 0, 1.]) if abs(ax[2]) < 0.9 else np.cross(ax, [1., 0, 0]); e1 /= np.linalg.norm(e1); e2 = np.cross(ax, e1)
        nu = max(16, int((arc[1]-arc[0])*(R+r)/STEP)); nv = max(16, int(2*math.pi*r/STEP))
        u, v = np.meshgrid(np.linspace(arc[0], arc[1], nu), np.linspace(0, 2*math.pi, nv, endpoint=False)); u = u.ravel(); v = v.ravel()
        rad = np.outer(np.cos(u), e1)+np.outer(np.sin(u), e2); n = rad*np.cos(v)[:, None]+ax*np.sin(v)[:, None]
        self.add(c+rad*R+n*r, n, col, pid)
    def ring(self, c, Ro, Ri, th, col, pid):
        g = np.mgrid[-Ro:Ro:STEP, -Ro:Ro:STEP].reshape(2, -1).T; rr = np.hypot(g[:, 0], g[:, 1]); g = g[(rr >= Ri) & (rr <= Ro)]
        P = [np.stack([c[0]+g[:, 0], c[1]+g[:, 1], np.full(len(g), c[2]+dz)], 1) for dz in np.arange(-th, th+0.01, 0.25)]
        P = np.concatenate(P); self.add(P, np.tile([0, 0, 1.], (len(P), 1)), col, pid, flat=True)

def build():
    """参考の絵（持ち主がくれた正面・よこ・うしろの絵）：大きなまるい頭（2.3頭身）・白いまゆ・とじた目・大きな白い口ひげ（あごひげはない）・耳・
    首まわりの大きなえり（うしろはフード）・すそが広がる長い服（すそに金色の帯）・大きなそで（そで口に金色のふち）で、前で両手をあわせて、
    スプーンの形の頭の木のつえを、体の前の地面に立ててにぎる・頭の上にはなれてうく、うすい金色の輪"""
    M = Model(); pid = iter(range(100))
    hem = lambda P: ((P[:, 2] > 3.0) & (P[:, 2] < 5.0), np.array(TRIM, np.uint8))
    M.revolve([(0, 24), (6, 23.5), (18, 22), (30, 20), (38, 17), (42, 13), (45, 9)], BODYD, ROBE, next(pid), decal=hem)   # 服（2頭身の、短いベルの形）
    M.torus((0, -1, 41.5), 14.5, 6.0, (0, 0, 1), ROBE, next(pid))                     # えり（肩にかかる、おりかえし）
    M.ellipsoid((0, -13, 37), (13, 5, 9), ROBE, next(pid))                            # うしろのフード
    for sx in (-1, 1):
        M.tube((sx*15, 3, 38), (sx*6.5, 12, 20), 6, 8.5, SLEEVE, next(pid), band=(2.6, TRIM))   # そで（そで口に金色のふち）
    for sx in (-1, 1): M.ellipsoid((sx*3.2, 18.5, 21.5), (4.6, 4, 4.6), SKIN, next(pid))   # 手（柄を左右からにぎる）
    bot = np.array([0.0, 22.0, 0.3]); top = np.array([0.0, 20.0, 30.0])
    M.tube(bot, top, 2.0, 2.0, WOOD, next(pid), cap=False)                            # つえの柄（体の前の地面に立てる）
    M.ellipsoid(top+np.array([0, 0, 6.0]), (4.6, 2.2, 6.8), WOOD, next(pid))          # つえの頭（スプーンの形。胸の前、口ひげの下）
    # 頭：この見え方（高さ KZ・おくゆき KD）では、まるい玉はたてに1.25倍にのびて見えるので、画面でまるく見えるよう、たてを KC にする
    HZ = 60; HA = 22; KC = math.sqrt(max(HA**2-(KD*HA)**2, 1))/KZ/HA
    def eyes(P):   # とじた目（∩）：顔の前の面
        m = np.zeros(len(P), bool)
        for ex in (-6.8, 6.8):
            dx = P[:, 0]-ex; dz = (P[:, 2]-HZ)/KC; rr_ = np.hypot(dx, dz)
            m |= (P[:, 1] > 8) & (np.abs(rr_-2.8) < 0.8) & (dz > -0.4)
        return m, np.array(EYE, np.uint8)
    M.ellipsoid((0, 0, HZ), (HA, HA-1, HA*KC), SKIN, next(pid), decal=eyes)     # 頭
    for sx in (-1, 1):
        M.ellipsoid((sx*22.5, 0, HZ-2), (4, 6, 6.5), SKIN, next(pid))          # 耳
        M.ellipsoid((sx*8.5, 16.5, HZ+4.5), (6, 3.2, 3), HAIR, next(pid))        # まゆ
        M.ellipsoid((sx*7, 17.5, HZ-8), (7, 6, 6), BEARD, next(pid))             # 口ひげ（左右のふくらみ）
    M.ellipsoid((0, 18.5, HZ-7), (5, 4.5, 4), BEARD, next(pid))                  # 口ひげ（まん中）
    M.ellipsoid((0, 20, HZ-3), (2.8, 2.6, 2.4), SKIN, next(pid))                 # 鼻
    M.ring((0, 0, HZ+HA*KC+22), 14, 11.8, 0.5, HALO, next(pid))                # 天使の輪：細く、頭の上に、はなしてうかす
    return M

def render(M):
    P = np.concatenate(M.P); N = np.concatenate(M.N); C = np.concatenate(M.C); I = np.concatenate(M.I); FL = np.concatenate(M.flat)
    c, s = math.cos(YAW), math.sin(YAW); ce, se = math.cos(math.radians(ELEV)), math.sin(math.radians(ELEV))
    X = c*P[:, 0]-s*P[:, 1]; D = s*P[:, 0]+c*P[:, 1]; Y = -KZ*P[:, 2]+KD*D; Z = D*ce+P[:, 2]*se
    nX = c*N[:, 0]-s*N[:, 1]; nD = s*N[:, 0]+c*N[:, 1]; nup = N[:, 2]*ce-nD*se; ncam = nD*ce+N[:, 2]*se   # 面の向き（画面のよこ・上・カメラへ）
    L = np.array([-0.45, 0.55, 0.70]); L /= np.linalg.norm(L)   # 左上の光（家具と同じ。少し手前から）
    k = nX*L[0]+nup*L[1]+ncam*L[2]
    lv = np.where(k > 0.10, 0, np.where(k > -0.30, 1, 2)); lv[FL] = 0
    keys = (C[:, 0].astype(np.int64) << 16 | C[:, 1].astype(np.int64) << 8 | C[:, 2])*4+lv
    uk, inv = np.unique(keys, return_inverse=True)
    tab = np.array([shade(((q//4) >> 16 & 255, (q//4) >> 8 & 255, (q//4) & 255), (q % 4)/2) for q in uk], np.uint8); C2 = tab[inv]
    x0 = math.floor(X.min())-2; x1 = math.ceil(X.max())+2; y0 = math.floor(Y.min())-2; y1 = math.ceil(Y.max())+2; OW, OH = x1-x0, y1-y0
    zb = np.full((OH*SSN, OW*SSN), -1e9); cb = np.zeros((OH*SSN, OW*SSN, 3), np.uint8); ib = np.full((OH*SSN, OW*SSN), -1)
    cc = np.floor((X-x0)*SSN).astype(int); rr = np.floor((Y-y0)*SSN).astype(int)
    o = np.argsort(Z); cc, rr, Z, C2, I = cc[o], rr[o], Z[o], C2[o], I[o]   # 奥から手前へ（手前があとで上書き）
    zb[rr, cc] = Z; cb[rr, cc] = C2; ib[rr, cc] = I
    out = np.zeros((OH, OW, 4), np.uint8); ids = np.full((OH, OW), -1); dep = np.full((OH, OW), -1e9)
    for y in range(OH):
        for x in range(OW):
            blk = ib[y*SSN:(y+1)*SSN, x*SSN:(x+1)*SSN]; m = blk >= 0
            if m.sum()*2 < SSN*SSN: continue
            v, n = np.unique(blk[m], return_counts=True); i = v[np.argmax(n)]; mm = blk == i
            col = cb[y*SSN:(y+1)*SSN, x*SSN:(x+1)*SSN][mm].reshape(-1, 3)
            pk = (col[:, 0].astype(int) << 16) | (col[:, 1].astype(int) << 8) | col[:, 2]
            u, n2 = np.unique(pk, return_counts=True); p = u[np.argmax(n2)]
            out[y, x] = (p >> 16 & 255, p >> 8 & 255, p & 255, 255); ids[y, x] = i; dep[y, x] = zb[y*SSN:(y+1)*SSN, x*SSN:(x+1)*SSN][mm].mean()
    # 輪郭：外がわ1ドット（となりの色を少し暗く）・手前の部品がうしろにかさなる所（うしろがわのドット）
    solid = out[..., 3] > 0; line = np.zeros_like(solid); srcc = np.zeros((OH, OW, 3), np.uint8); inner = np.zeros_like(solid)
    for dy, dx in ((0, 1), (0, -1), (1, 0), (-1, 0)):
        nb = np.roll(np.roll(solid, dy, 0), dx, 1); nbc = np.roll(np.roll(out[..., :3], dy, 0), dx, 1)
        m = ~solid & nb & ~line; line |= m; srcc[m] = nbc[m]
        nid = np.roll(np.roll(ids, dy, 0), dx, 1); nd = np.roll(np.roll(dep, dy, 0), dx, 1)
        inner |= solid & (nid >= 0) & (nid != ids) & (nd-dep > DZ)
    out[inner, :3] = (out[inner, :3].astype(float)*OLK).astype(np.uint8)
    out[line, :3] = (srcc[line].astype(float)*OLK).astype(np.uint8); out[line, 3] = 255
    return out, x0, y0   # x0・y0：足もと（原点）から絵の左上までのずれ

def main():
    args = sys.argv[1:]; chips = '--chips' in args; args = [x for x in args if x != '--chips']
    od = args[0]; os.makedirs(od, exist_ok=True)
    out, ox0, oy0 = render(build())
    im = Image.fromarray(out); im.save(os.path.join(od, 'god_iso.png')); im.resize((im.width*10, im.height*10), Image.NEAREST).save(os.path.join(od, 'god_x10.png'))
    src = Image.open(SRC).convert('RGBA'); below = out.shape[0]+oy0; H = max(src.height, -oy0)+max(0, below)
    cmp = Image.new('RGBA', ((src.width+out.shape[1])*4+16, H*4), (200, 220, 180, 255)); fy = H-max(0, below)   # 足もとの行をそろえる
    cmp.alpha_composite(src.resize((src.width*4, src.height*4), Image.NEAREST), (0, (fy-src.height)*4))
    cmp.alpha_composite(im.resize((im.width*4, im.height*4), Image.NEAREST), (src.width*4+16, (fy+oy0)*4))
    cmp.save(os.path.join(od, 'cmp_x4.png'))
    print('色の数', len({tuple(p) for p in out.reshape(-1, 4) if p[3]}), '大きさ', im.size, 'ax,ay', ox0, oy0)
    if chips:
        import chips as CH
        head, C = CH.load_imgs(); g = C['god']
        C['god'] = dict(ax=ox0, ay=oy0, w=im.width, h=im.height, r=g.get('r', 2), f=[im])   # ax・ay：足もと（台座の上の面のまん中）から絵の左上へ
        CH.pack_imgs(head, C)
        open(os.path.join(ROOT, '.chips_changed'), 'w').write('god'); print('チップ god に入れた')

if __name__ == '__main__':
    main()
