"""せいれいが手に持つ道具の3D（spirit3d）。
道具は「うでの座標」で作る：u はかたから手へ（手のまん中は u=13）、v は外、w は前。手でにぎる柄は、ふつう w（前）の向きにのばす。
どれも小さな立方体（ボクセル）の集まりで、色は道具の色（せいれいの色かえの対象にならない色）。fx は、水しぶきなどを出す所。
設計図（ドット）：
  シャベル  柄 長さ14・太さ2.4、先にさじ 7×9（くぼみ）                    木 #b5764a・金 #a7adb5
  ハンマー  柄 長さ15・太さ2.6、頭 4×4×9                                   木・金 #8f949b
  おの      柄 長さ18・太さ2.8、刃 2×10×8（先がひろがる）                 木・刃 #a8a29a・刃先 #e6e1d8
  つるはし  柄 長さ18・太さ2.8、頭 2.6×2.6×20（両はしがとがる）           木・金 #a8a29a
  くわ      柄 長さ20・太さ2.6、刃 9×1.6×7（柄と直角に下へ）               木・金 #a7adb5
  じょうろ  胴 8×7×7、そそぎ口 長さ9、取っ手                              #8fb4c8・#a9c8d9
  おたま    柄 長さ14・太さ1.8、すくう所 直径6                               木 #9a6a48・金 #8f949b
  はたき    柄 長さ16・太さ1.8、先に羽 6本                                  #9a6a48・#f2ead8・#d9cdb2
  つりざお  さお 長さ34・太さ1.6（前へななめ上）。にぎる所は手の指先のほう                            #9a6a48
  弓        木の弧 長さ18（たて）・太さ1.8、弦                                      #b5764a・にぎり #8a5a33・弦 #f2ead8
  小石      直径4
  おけ      胴 直径7・高さ6（木）、たが2本 #7a4b2a、ふち #cf9566
  包丁      柄 長さ6・刃 1.2×4.4×9                                         木・#c9ccd1                                                          #b9b2a6
  ここから下の道具は、うでを前へ s0 だけふったとき（ポーズの sN・sF）に、たいら・まっすぐになる向きで作る（_fu）。
  フライパン 柄 長さ8・なべ 直径10・ふかさ1.6（ふちつき）                    柄 #9a6a48・#7d838c・中 #5f656e
  ボウル    直径11・ふかさ4（うすい青の陶器・ふち、中にきじ）。手の下でかかえる  #cfe3ef・#9ec3dd・きじ #f3d9a0
  あわだて器 柄 長さ7・針金の玉 直径5（下向き）                               #9a6a48・#c9ccd1
  お皿      直径10・あつさ0.8（白い陶器・青いふち）。料理の絵はゲームがのせる  #f6f2ea・#9ec3dd
  くし      竹ぐし 長さ15・先に魚の身3つ                                    #d9bf8a・#f0b08a
  うちわ    柄 長さ6・紙 直径10（前を向く）                                   #9a6a48・#f5e6c4・#e98f7a
  のこぎり  柄 4×2.4×2.4・刃 長さ14・はば3.5〜2.6・あつさ0.5（下に歯）          木・#c9ccd1・#a3a8ae
  ぬの      手の中の、まるめた布 直径5                                          #a9d3e8"""
import math
import numpy as np

Q = 0.25
HAND = np.array([13.0, 0, 0])   # にぎる所（うでの座標）

def _grid(lo, hi, q=None):
    q = q or Q
    return np.mgrid[lo[0]+q/2:hi[0]:q, lo[1]+q/2:hi[1]:q, lo[2]+q/2:hi[2]:q].reshape(3, -1).T
def cyl(a, b, r, col):
    a, b = np.asarray(a, float), np.asarray(b, float); lo = np.minimum(a, b)-r; hi = np.maximum(a, b)+r; g = _grid(lo, hi)
    d = b-a; L = np.linalg.norm(d); d = d/L; t = (g-a)@d; p = a+np.clip(t, 0, L)[:, None]*d[None]
    k = (np.linalg.norm(g-p, axis=1) <= r) & (t >= -0.01) & (t <= L+0.01); return g[k], np.tile(np.array(col, np.uint8), (k.sum(), 1))
def box(c, h, col, R=None):
    c = np.asarray(c, float); h = np.asarray(h, float); e = np.linalg.norm(h); g = _grid(c-e, c+e)
    l = (g-c)@(R if R is not None else np.eye(3)); k = (np.abs(l) <= h).all(1); return g[k], np.tile(np.array(col, np.uint8), (k.sum(), 1))
def ball(c, r, col, s=(1, 1, 1)):
    c = np.asarray(c, float); s = np.asarray(s, float); g = _grid(c-r*s, c+r*s)
    k = (((g-c)/s)**2).sum(1) <= r*r; return g[k], np.tile(np.array(col, np.uint8), (k.sum(), 1))
def join(*ps):
    return np.concatenate([p[0] for p in ps]), np.concatenate([p[1] for p in ps])
def hx(h): return tuple(int(h[i:i+2], 16) for i in (1, 3, 5))

WOOD = hx('#b5764a'); WOOD2 = hx('#9a6a48'); IRON = hx('#a8a29a'); STEEL = hx('#a7adb5'); GREY = hx('#8f949b')
H = HAND
def handle(L, r=1.3, back=3.0, col=WOOD):
    """柄：手から前（w）へ L、うしろへ back"""
    return cyl(H+[0, 0, -back], H+[0, 0, L], r, col)

def shovel():
    p = join(handle(12, 1.2), box(H+[0, 0, 15], [1.0, 3.5, 3.0], STEEL), box(H+[-0.8, 0, 15], [0.6, 2.4, 2.2], hx('#c7ccd2')))
    return p, {'tip': H+[0, 0, 17]}
def hammer():
    return join(handle(14, 1.3), box(H+[0, 0, 15], [4.5, 2.0, 2.0], GREY)), {'tip': H+[-4, 0, 15]}
def axe():
    blade = box(H+[-4.5, 0, 17], [4.0, 1.0, 3.2], IRON); edge = box(H+[-8.0, 0, 17], [0.8, 1.0, 4.0], hx('#e6e1d8'))
    return join(handle(18, 1.4), blade, edge), {'tip': H+[-8, 0, 17]}
def pick():
    head = cyl(H+[-9, 0, 17], H+[9, 0, 17], 1.3, IRON); pt1 = ball(H+[-9.5, 0, 17], 1.0, IRON); pt2 = ball(H+[9.5, 0, 17], 1.0, IRON)
    return join(handle(18, 1.4), head, pt1, pt2), {'tip': H+[-9, 0, 17]}
def hoe():
    return join(handle(20, 1.3), box(H+[-3.5, 0, 20], [3.5, 0.8, 4.5], STEEL)), {'tip': H+[-7, 0, 20]}
def can():
    """じょうろ：取っ手を上からにぎり、胴は手の下。そそぎ口は前へのび、胴ごと前へかたむけて、先（はす口）が前の下を向く（うでの向きによらず、まうえをそろえる 'up'・口をからだの正面へ向ける 'fwd'）"""
    f, u = _fu(1.0); a = 0.7; f2 = f*math.cos(a)-u*math.sin(a); u2 = u*math.cos(a)+f*math.sin(a); v = np.array([0, 1.0, 0])
    c = H-u2*4.2-f2*0.5; R = np.stack([f2, v, u2], 1)
    body = box(c, [3.6, 3.2, 3.2], hx('#8fb4c8'), R); top = box(c+u2*3.0, [3.4, 3.0, 0.5], hx('#a9c8d9'), R)
    grip = cyl(c+u2*3.2-f2*2.5, c+u2*4.6, 0.8, hx('#7fa3b8'))
    s0 = c+f2*3.0-u2*1.0; s1 = c+f2*10.0+u2*1.6
    spout = cyl(s0, s1, 1.15, hx('#8fb4c8')); rose = ball(s1+f2*0.6, 1.9, hx('#a9c8d9'))
    return join(body, top, grip, spout, rose), {'tip': s1+f2*1.2-u2*0.6, 'up': u, 'fwd': f}
def ladle():
    return join(handle(12, 0.9, 2.0, WOOD2), ball(H+[3.0, 0, 13], 3.0, GREY, (0.6, 1, 1))), {'tip': H+[3.0, 0, 13]}
def duster():
    feathers = [cyl(H+[0, 0, 14], H+[-6+math.cos(i)*2, (i-2.5)*1.6, 18+math.sin(i)*2], 0.9, hx('#f2ead8') if i % 2 else hx('#d9cdb2')) for i in range(6)]
    return join(handle(14, 0.9, 2.0, WOOD2), *feathers), {'tip': H+[-5, 0, 18]}
def rod():
    g = H+[2.3, 0, 0]   # にぎる所は、手のまん中より指先のほう
    return cyl(g+[0, 0, -1.5], g+[-26, 0, 22], 0.8, WOOD2), {'tip': g+[-26, 0, 22]}
def bow():
    """弓：にぎる所から、上下（w）へ9ずつのびる木の弧（まん中が、的のほう u へ2.5ふくらむ）と、はしをむすぶ弦。うでを前へのばすと、弓がたてに立つ"""
    N = 14; pts = [H+[2.5*(1-t*t), 0, 9*t] for t in np.linspace(-1, 1, N+1)]
    limb = [cyl(pts[i], pts[i+1], 0.9 if 3 < i < N-4 else 0.7, hx('#8a5a33') if 5 < i < N-6 else WOOD) for i in range(N)]
    return join(*limb, cyl(H+[0, 0, -9], H+[0, 0, 9], 0.3, hx('#f2ead8'))), {'tip': H+[0, 0, 9]}
def pebble():
    return ball(H+[2.5, 0, 2], 2.0, hx('#b9b2a6')), {}
def bucket():
    """木のおけ：木の胴に、たがを2本"""
    body = cyl(H+[5, 0, 3], H+[11, 0, 3], 3.4, WOOD); rim = cyl(H+[4.4, 0, 3], H+[5.0, 0, 3], 3.7, hx('#cf9566'))
    hoops = [cyl(H+[u, 0, 3], H+[u+0.7, 0, 3], 3.65, hx('#7a4b2a')) for u in (6.3, 9.6)]
    return join(body, rim, *hoops), {'tip': H+[5, 0, 3]}
def knife():
    return join(handle(5, 1.1, 1.5, WOOD2), box(H+[0, 0, 9.5], [0.6, 2.2, 4.5], hx('#c9ccd1')), box(H+[0, -1.6, 9.5], [0.4, 0.5, 4.5], hx('#e6e8eb'))), {'tip': H+[0, 0, 14]}
def _fu(s0):
    """うでを前へ s0 ふったときの、キャラの「前（水平）」と「上」を、うでの座標（u・v・w）で"""
    return np.array([math.sin(s0), 0, math.cos(s0)]), np.array([-math.cos(s0), 0, math.sin(s0)])
def disc(c, n, r, h, col):
    """まるい板：まん中 c・面の向き n・半径 r・あつさ h"""
    c = np.asarray(c, float); n = np.asarray(n, float); n = n/np.linalg.norm(n); e = r+h; g = _grid(c-e, c+e)
    d = g-c; t = d@n; q = d-t[:, None]*n[None]; k = (np.abs(t) <= h/2) & ((q**2).sum(1) <= r*r); return g[k], np.tile(np.array(col, np.uint8), (k.sum(), 1))
def cup(c, n, r, dep, col, inner=None, fill=None):
    """上がひらいた、まるい入れ物（ボウル・フライパン）：半径 r・ふかさ dep・かべのあつさ0.9。fill は中のきじの色（入れ物の半分の高さまで）"""
    c = np.asarray(c, float); n = np.asarray(n, float); n = n/np.linalg.norm(n); e = r+dep; g = _grid(c-e, c+e); d = g-c; t = d@n; q = np.sqrt(((d-t[:, None]*n[None])**2).sum(1))
    rr = r*(0.72+0.28*np.clip(t/dep, 0, 1))   # 下ほど少しすぼまる
    wall = (t >= 0) & (t <= dep) & (q <= rr) & ((q >= rr-0.9) | (t <= 0.9))
    P, C = [g[wall]], [np.tile(np.array(col, np.uint8), (wall.sum(), 1))]
    if inner: m = wall & (q < rr-0.9) & (t > 0.5); C[0][m[wall]] = inner
    if fill:
        k = (t > 0.9) & (t <= dep*0.5) & (q < rr-0.9); P.append(g[k]); C.append(np.tile(np.array(fill, np.uint8), (k.sum(), 1)))
    return np.concatenate(P), np.concatenate(C)
def pan():
    f, u = _fu(1.0); c = H+f*13.5+u*0.6
    c = H+f*14.5+u*0.6
    return join(cyl(H-f*2, H+f*8.5, 1.0, WOOD2), cyl(H+f*8, H+f*9.5, 0.8, hx('#7d838c')), cup(c, u, 6.0, 1.8, hx('#7d838c'), hx('#5f656e'))), {'tip': c+u*2.5, 'up': u}
def bowl():
    f, u = _fu(1.1); c = H-u*8.0+f*1.5+np.array([0, -9.5, 0])   # 手の下でかかえる。体のまん中へよせる（あわだて器の先が中に入る）
    return join(cup(c, u, 5.5, 4.0, hx('#cfe3ef'), hx('#b7d1e2'), hx('#f3d9a0')), cyl(c+u*3.6, c+u*4.0, 5.5, hx('#9ec3dd'))), {'tip': c+u*3, 'up': u}
def whisk():
    f, u = _fu(1.3); d = f*0.3-u+np.array([0, -0.45, 0]); d = d/np.linalg.norm(d)   # 下へ、体のまん中（ボウル）へ
    wires = [cyl(H+d*6, H+d*10+np.array([0, math.cos(a), math.sin(a)])*1.9*np.array([1, 1, 1]), 0.35, hx('#c9ccd1')) for a in np.linspace(0, 2*PI, 6, endpoint=False)]
    return join(cyl(H-d*2, H+d*6, 1.0, WOOD2), ball(H+d*10.5, 2.4, hx('#dfe2e6'), (1, 1, 1)), *wires), {'tip': H+d*11, 'up': -d}   # まっすぐ下へ向ける
PI = math.pi
def plate():
    f, u = _fu(1.2); c = H+u*1.6+f*2.5
    c = c+np.array([0, -2.0, 0])
    return join(disc(c, u, 5.2, 0.8, hx('#f6f2ea')), disc(c+u*0.3, u, 5.4, 0.5, hx('#9ec3dd')), disc(c+u*0.5, u, 4.4, 0.4, hx('#f6f2ea'))), {'tip': c+u*1.5, 'up': u}
def skewer():
    f, u = _fu(1.0); d = f*0.97+u*0.25
    meat = [ball(H+d*(9+3.2*i), 2.0, hx('#f0b08a') if i % 2 == 0 else hx('#e89a74'), (1, 1, 1)) for i in range(3)]
    return join(cyl(H-d*2, H+d*16, 0.45, hx('#d9bf8a')), *meat), {'tip': H+d*12}
def fan():
    f, u = _fu(0.9)
    d = u*0.6+f*0.8; d = d/np.linalg.norm(d)   # 前へななめ上（顔の前に出さない）
    return join(cyl(H-d*2, H+d*4, 0.8, WOOD2), disc(H+d*8, u*0.3+f, 4.2, 0.5, hx('#f5e6c4')), disc(H+d*8+f*0.35, u*0.3+f, 1.6, 0.3, hx('#e98f7a'))), {'tip': H+d*8}
def saw():
    f, u = _fu(0.9); P, C = [], []
    hand = box(H, [1.6, 1.4, 2.4], WOOD)
    g = _grid(H-np.array([20, 20, 20]), H+np.array([20, 20, 20])); a = (g-H)@f; b = (g-H)@u; v = g[:, 1]
    top = 1.2-(a-2)/14*0.4; bot = -2.3+(a-2)/14*0.5
    blade = (a >= 2) & (a <= 16) & (np.abs(v) <= 0.3) & (b <= top) & (b >= bot)
    teeth = blade & (b <= bot+0.6)
    col = np.tile(np.array(hx('#c9ccd1'), np.uint8), (blade.sum(), 1)); col[teeth[blade]] = hx('#a3a8ae')
    return join(hand, (g[blade], col)), {'tip': H+f*16}
def cloth():
    return ball(H+np.array([1.5, 0, 1.5]), 2.6, hx('#a9d3e8'), (1, 1.2, 1)), {'tip': H}
SCALE = 1.6   # 道具の大きさ（いまの絵の道具と同じくらい）
PROPS0 = {'knife': knife, 'shovel': shovel, 'hammer': hammer, 'axe': axe, 'pick': pick, 'hoe': hoe, 'can': can, 'ladle': ladle, 'duster': duster, 'rod': rod, 'bow': bow, 'pebble': pebble, 'bucket': bucket,
          'pan': pan, 'bowl': bowl, 'whisk': whisk, 'plate': plate, 'skewer': skewer, 'fan': fan, 'saw': saw, 'cloth': cloth}
_C = {}
def prop(name):
    """道具の点・色と、先の場所（にぎる所を中心に SCALE 倍。点は Q のこまかさに作りなおす）"""
    if name not in _C:
        global Q
        q0 = Q; Q = q0/SCALE; (P, C), fx = PROPS0[name](); Q = q0
        P = H+(P-H)*SCALE; fx = {k: (v if k in ('up', 'fwd') else H+(v-H)*SCALE) for k, v in fx.items()}   # up・fwd は向きだけ
        _C[name] = ((P, C), fx)
    return _C[name]
