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
  つりざお  さお 長さ34・太さ1.6（前へななめ上）                            #9a6a48
  小石      直径4
  おけ      胴 直径7・高さ6（木）、たが2本 #7a4b2a、ふち #cf9566
  包丁      柄 長さ6・刃 1.2×4.4×9                                         木・#c9ccd1                                                          #b9b2a6"""
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
    body = box(H+[3, 0, 3], [3.5, 3.5, 4.0], hx('#8fb4c8')); top = box(H+[-0.6, 0, 3], [0.5, 3.6, 4.1], hx('#a9c8d9'))
    spout = cyl(H+[3, 0, 7], H+[-2, 0, 14], 1.0, hx('#8fb4c8')); rose = ball(H+[-2.4, 0, 14.6], 1.6, hx('#a9c8d9'))
    return join(body, top, spout, rose), {'tip': H+[-2.4, 0, 15]}
def ladle():
    return join(handle(12, 0.9, 2.0, WOOD2), ball(H+[3.0, 0, 13], 3.0, GREY, (0.6, 1, 1))), {'tip': H+[3.0, 0, 13]}
def duster():
    feathers = [cyl(H+[0, 0, 14], H+[-6+math.cos(i)*2, (i-2.5)*1.6, 18+math.sin(i)*2], 0.9, hx('#f2ead8') if i % 2 else hx('#d9cdb2')) for i in range(6)]
    return join(handle(14, 0.9, 2.0, WOOD2), *feathers), {'tip': H+[-5, 0, 18]}
def rod():
    return cyl(H+[0, 0, -3], H+[-26, 0, 22], 0.8, WOOD2), {'tip': H+[-26, 0, 22]}
def pebble():
    return ball(H+[2.5, 0, 2], 2.0, hx('#b9b2a6')), {}
def bucket():
    """木のおけ：木の胴に、たがを2本"""
    body = cyl(H+[5, 0, 3], H+[11, 0, 3], 3.4, WOOD); rim = cyl(H+[4.4, 0, 3], H+[5.0, 0, 3], 3.7, hx('#cf9566'))
    hoops = [cyl(H+[u, 0, 3], H+[u+0.7, 0, 3], 3.65, hx('#7a4b2a')) for u in (6.3, 9.6)]
    return join(body, rim, *hoops), {'tip': H+[5, 0, 3]}
def knife():
    return join(handle(5, 1.1, 1.5, WOOD2), box(H+[0, 0, 9.5], [0.6, 2.2, 4.5], hx('#c9ccd1')), box(H+[0, -1.6, 9.5], [0.4, 0.5, 4.5], hx('#e6e8eb'))), {'tip': H+[0, 0, 14]}
SCALE = 1.6   # 道具の大きさ（いまの絵の道具と同じくらい）
PROPS0 = {'knife': knife, 'shovel': shovel, 'hammer': hammer, 'axe': axe, 'pick': pick, 'hoe': hoe, 'can': can, 'ladle': ladle, 'duster': duster, 'rod': rod, 'pebble': pebble, 'bucket': bucket}
_C = {}
def prop(name):
    """道具の点・色と、先の場所（にぎる所を中心に SCALE 倍。点は Q のこまかさに作りなおす）"""
    if name not in _C:
        global Q
        q0 = Q; Q = q0/SCALE; (P, C), fx = PROPS0[name](); Q = q0
        P = H+(P-H)*SCALE; fx = {k: H+(v-H)*SCALE for k, v in fx.items()}; _C[name] = ((P, C), fx)
    return _C[name]
