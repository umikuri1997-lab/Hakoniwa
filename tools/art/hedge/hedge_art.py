# 生垣のチップ（hedge、hedge:0〜15）を、もらった絵 image.png から作る。
# 絵の大きさ：1マス＝155ピクセル（3Dのお手本どおり）。ゲームは1マス64ドット（g64）なので、0.413倍に BOX でちぢめる。
# 生垣のはば（よこ）・おくゆきは絵のまま：たての生垣は x 5.5〜58.5、上の面の上のはしは y −11、前の面の下のはしはマスの下（64）。
# つなぎ方（m：左1・右2・上4・下8）ごとに、2つの層をかさねて作る：
#   よこの帯（横の生垣）：左右のはしは、つながっていなければ横の生垣のはし、つながっていれば、くりかえしのまん中。
#   たての柱（たての生垣）：上・下につながっているとき。上につながっていなければ上のはし、下につながっていなければ下のはし。
#   よこの帯とかさなる所は、たての柱の左右のふちをうすくして、上の面どうしをまぜる（下へのびる所は、前の面の上にふちを見せる）。
# くりかえしのまん中は、1マス（64ドット）でちょうどつながるように、はしを16ドットまぜてある（世界の座標でならぶので、となりとつながる）。
# 使い方：python3 tools/art/hedge/hedge_art.py <出力フォルダ>
import sys
import numpy as np
from PIL import Image

SRC = 'tools/art/hedge/image.png'
T = 155.0                       # 絵の1マス（ピクセル）
S = 64 / T                      # ちぢめる倍率
TOP = -11                       # チップの上のはし（マスの上から）
H = 64 - TOP                    # チップの高さ（75）
C0, C1 = 5.5, 58.5              # たての生垣の左右
BAND = 39                       # よこの帯の、上の面と前の面のさかい
O = 16                          # くりかえしで、まぜるはば
HB = (91, 129, 688, 310)        # 横の生垣（左・上・右・下）
VB = (866, 128, 994, 624)       # たての生垣
SB = (1335, 129, 1464, 310)     # 1マスの生垣

src = Image.open(SRC).convert('RGBA')

def grab(x0, y0, w, h):
    """絵の (x0,y0) から、チップのドットで w×h ぶんを、ちぢめて切りとる（色はうすさをかけた形 premultiplied）"""
    im = src.resize((w, h), Image.BOX, box=(x0, y0, x0 + w / S, y0 + h / S))
    a = np.asarray(im).astype(float) / 255
    a[..., :3] *= a[..., 3:4]
    return a

def over(dst, s, k=None):
    """s を dst の上にかさねる（k は s のうすさにかける重み）"""
    if k is not None: s = s * k[..., None]
    return s + dst * (1 - s[..., 3:4])

def wrapx(a, p=64):
    """よこに p でつながるように：はばが p+O の絵の、はしを O ドットまぜる"""
    t = np.clip(np.arange(O) / O, 0, 1)[None, :, None]
    o = a[:, O:O + p].copy()
    o[:, p - O:] = a[:, p:p + O] * (1 - t) + a[:, 0:O] * t          # 右のはしが、左のはし（a の O 列め）の手前の続きになる
    return o

def wrapy(a, p=64):
    t = np.clip(np.arange(O) / O, 0, 1)[:, None, None]
    o = a[O:O + p].copy()
    o[p - O:] = a[p:p + O] * (1 - t) + a[0:O] * t
    return o

# 横の生垣：はしの絵（左はし・右はし）と、くりかえしのまん中（よこ64でつながる）
hx = lambda x: HB[0] + (x - C0) / S                      # チップの x → 絵の x（左はしが C0）
H_LEFT = grab(hx(0), HB[1], 64, H)                       # 左のはしのマス（0〜64）
H_RIGHT = grab(HB[2] - (C1 - 0) / S, HB[1], 64, H)       # 右のはしのマス（右はしが C1）
mid0 = HB[0] + 1.6 * T                                   # まん中は、はしから1.6マスの所から
H_MID = wrapx(grab(mid0, HB[1], 64 + O, H))
# たての生垣：上のはし（上につながらない）・下のはし（前の面まで）・くりかえしのまん中（たて64でつながる）
vx = VB[0] - C0 / S                                      # チップの x=0 にあたる絵の x
V_TOP = grab(vx, VB[1], 64, H)                           # y −11〜64
V_BOT = grab(vx, VB[3] - 64 / S, 64, 64)                 # y 0〜64（前の面がマスの下）
V_MID = wrapy(grab(vx, VB[1] + 1.2 * T, 64, 64 + O))
SINGLE = grab(SB[0] - C0 / S, SB[1], 64, H)

def ramp(v, a, b):
    """v が a で0、b で1（a>b なら逆）"""
    return np.clip((v - a) / (b - a), 0, 1)

Y = np.arange(TOP, 64)[:, None] + 0.5 + np.zeros((1, 64))
X = np.arange(64)[None, :] + 0.5 + np.zeros((H, 1))

def band(L, R):
    """よこの帯（H×64）。左右のはしは、つながっていない向きだけ、はしの絵。まん中とのさかいは、まぜる"""
    o = H_MID.copy()
    if not L:
        k = ramp(X, 34, 18)[..., None]                    # 左半分ははしの絵、まん中へなめらかに
        o = H_LEFT * k + o * (1 - k)
    if not R:
        k = ramp(X, 30, 46)[..., None]
        o = H_RIGHT * k + o * (1 - k)
    return o

def column(U, D):
    """たての柱（H×64、y −11〜64）。上・下のはしは、つながっていない向きだけ"""
    mid = np.zeros((H, 64, 4)); mid[-TOP:] = V_MID; mid[:-TOP] = V_MID[64 + TOP:]   # 世界の座標で64ごと
    o = mid
    if not U:
        k = ramp(Y, 30, 14)[..., None]                    # 上半分は上のはしの絵
        o = V_TOP * k + o * (1 - k)
    if not D:
        bot = np.zeros((H, 64, 4)); bot[-TOP:] = V_BOT
        k = ramp(Y, 18, 34)[..., None]                    # 下半分は下のはしの絵（前の面）
        o = bot * k + o * (1 - k)
    return o

def chip(m):
    L, R, U, D = m & 1, m & 2, m & 4, m & 8
    if m == 0: return SINGLE
    hasB = bool(L or R)
    o = np.zeros((H, 64, 4))
    if hasB: o = band(L, R)
    if U or D:
        col = column(U, D)
        if hasB:
            # 帯とかさなる所：上の面の行では、柱の左右のふちをうすく（上の面どうしをまぜる）。帯の前の面より下（下へのびる所）は、ふちを見せる
            side = np.minimum(ramp(X, C0, C0 + 9), ramp(X, C1, C1 - 9))
            front = ramp(Y, BAND - 6, BAND + 2)           # 0：帯の上の面の行 → 1：前の面の行
            sk = side * (1 - front) + front
            vk = (ramp(Y, 4, 22) if not U else np.ones_like(Y))           # 上につながらないときは、帯の上のふちをのこす
            if not D: vk = vk * ramp(Y, BAND - 2, BAND - 14); sk = side   # 下につながらないときは、帯の前の面をのこす
            o = over(o, col, sk * vk)
        else:
            o = col
    if U:
        o = o.copy(); o[Y < 0] = 0                        # 上につながるときは、マスより上は上のマスの絵
        if hasB:                                          # ただし帯の左右（柱のない所）は、帯の上のふちを出す
            b = band(L, R); keep = (Y < 0) & ((X < C0) | (X > C1))
            o[keep] = b[keep]
    return o

def to_img(a):
    a = a.copy(); al = a[..., 3:4]
    a[..., :3] = np.where(al > 1e-6, a[..., :3] / np.maximum(al, 1e-6), 0)
    return Image.fromarray(np.clip(np.round(a * 255), 0, 255).astype(np.uint8), 'RGBA')

def build():
    res = {'hedge': to_img(SINGLE)}
    for m in range(16): res['hedge:%d' % m] = to_img(chip(m))
    return res

if __name__ == '__main__':
    out = sys.argv[1]
    for k, im in build().items(): im.save(f'{out}/{k.replace(":", "_")}.png')
    print('ok', H)
