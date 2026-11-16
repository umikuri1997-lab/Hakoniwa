"""コワイノの材質：布・岩・金属の立体感を、面の向き（ノーマル）とシェーダーで出す（oblique3d の sc.bump）。テクスチャで上から描くのは最小限。
布：布の流れ（たれる向き）にそった座標（まわりの長さ u・高さ v。円柱のはり方）で、大きな しわ（ひだ）と、うすい織り目のすじ（ノーマルマップ）。
    1まいのテクスチャがおおう長さは大きく（SPAN）、くりかえしが目立たないようにする。
岩：ノーマルマップのごつごつ（3つの向きから写して面の向きでまぜる、トライプラナー）。色のむらは、ひびの所だけ。
金属：テクスチャなし。面の向きで、うつりこみ（上向きは空で明るい・よこ向きの帯は地面で暗い）と、つや（oblique3d の material('metal')）。
かげの段は、でこぼこをつけた面の向きできまる（段のままなので、ドットらしいかげ）。
テクスチャ：tools/art/textures（どれも CC0。出どころは README）。"""
import math, os
import numpy as np
from PIL import Image

TEX = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'textures')
MATS = ('fabric', 'rock', 'metal', 'ice')
# 布：(ノーマルマップ, 1まいがおおう長さ（体の高さのうち）, 織り目の強さ, ちぢめる大きさ)
FABRIC = ('fabric026_n.png', 1.6, 0.07, 48)
FOLD = (5, 0.7, 0.5)    # 布のしわ：まわりにいくつ・強さ（すそほど強い）・ゆらぎ（高さでひだがうねる）
# 岩：(ノーマルマップ, 色のテクスチャ, 1まいがおおう長さ, でこぼこの強さ, ちぢめる大きさ)
ROCK = ('rock030_n.png', 'rock030.png', 0.9, 1.3, 14)
CRACK = 1.6   # 岩のひび：色のテクスチャのこい所（ばらつきのこの倍より暗い所）だけ、1だん暗く
METAL = (0.55, -0.15, 0.25, 0.16)   # 金属のうつりこみ：上向き（N の上の成分がこれより上）は明るく・この上下のあいだの帯は暗く・明るさのちがい
MULQ = 0.12

_cache = {}
def _load(fn, n):
    k = (fn, n)
    if k not in _cache:
        a = np.asarray(Image.open(os.path.join(TEX, fn)).convert('RGB').resize((n, n), Image.BOX)).astype(float)/255
        if fn.endswith('_n.png'):   # ノーマルマップ：ちぢめると、かたむきが小さくなるので、かたむき（r・g）を、ばらつき1にそろえる（強さは数できめる）
            t = a[..., :2]*2-1; t -= t.mean((0, 1)); t /= max(1e-6, float(t.std())); a = t
        _cache[k] = a
    return _cache[k]

def _sample(img, u, v):
    """くりかえす絵を、なめらかに（となり4つをまぜて）読む"""
    n = img.shape[0]; x = (u % 1)*n-0.5; y = (v % 1)*n-0.5; x0 = np.floor(x).astype(int); y0 = np.floor(y).astype(int); fx = (x-x0)[:, None]; fy = (y-y0)[:, None]
    g = lambda yy, xx: img[yy % n, xx % n]
    return (g(y0, x0)*(1-fx)+g(y0, x0+1)*fx)*(1-fy)+(g(y0+1, x0)*(1-fx)+g(y0+1, x0+1)*fx)*fy

def _flat(d, N):
    d = d-(d*N).sum(1, keepdims=True)*N; N2 = N+d; return N2/np.maximum(np.linalg.norm(N2, axis=1, keepdims=True), 1e-9)

def bump(mat, H, seed=0):
    """材質 mat の sc.bump 用の関数（点 P・面の向き N は、写すときの3Dの向き（x・y奥・z上）。H は体の高さ）"""
    rs = np.random.RandomState(seed); off = rs.rand(3, 2)
    if mat == 'fabric':
        NM = _load(FABRIC[0], FABRIC[3])
        def f(P, N):
            th = np.arctan2(P[:, 1], P[:, 0]); r = np.hypot(P[:, 0], P[:, 1]); z = P[:, 2]/H
            tg = np.stack([-np.sin(th), np.cos(th), 0*th], 1)   # まわりの向き（布の流れと直角）
            dn = np.array([0, 0, -1.0])-(N[:, 2:3]*-1)*N; dn /= np.maximum(np.linalg.norm(dn, axis=1, keepdims=True), 1e-9)   # 面にそって、たれる向き（布の流れ）
            ph = th*FOLD[0]+np.sin(z*7+th*2)*FOLD[2]*4+off[0, 0]*6   # ひだ：たてにたれて、高さでゆるくうねる
            d = (np.sin(ph)*FOLD[1]*np.clip(1.25-z, 0.25, 1.25))[:, None]*tg
            u = th*(0.18*H+r)/(FABRIC[1]*H)+off[1, 0]; v = P[:, 2]/(FABRIC[1]*H)+off[1, 1]   # 円柱のはり方：u＝まわりの長さ・v＝高さ
            t = _sample(NM, v, u)   # 織り目のすじが、たれる向きにそうように（もらった絵は よこすじ）
            d += FABRIC[2]*(t[:, 0:1]*dn+t[:, 1:2]*tg)
            return _flat(d, N), None
        return f
    if mat == 'rock':
        NM = _load(ROCK[0], ROCK[4]); CM = _load(ROCK[1], ROCK[4]); cm, cs = float(CM.mean()), float(CM.std()); AX = ((1, 2), (0, 2), (0, 1))
        def f(P, N):
            Q = P/(ROCK[2]*H); w = np.abs(N)**4; w /= np.maximum(w.sum(1, keepdims=True), 1e-9); d = np.zeros_like(N); l = np.zeros(len(P))
            for i, (a, b) in enumerate(AX):
                t = _sample(NM, Q[:, a]+off[i, 0], Q[:, b]+off[i, 1]); Tu = np.zeros(3); Tu[a] = 1; Tv = np.zeros(3); Tv[b] = 1
                d += w[:, i:i+1]*(t[:, 0:1]*Tu+t[:, 1:2]*Tv)*ROCK[3]; l += w[:, i]*_sample(CM, Q[:, a]+off[i, 0], Q[:, b]+off[i, 1]).mean(1)
            return _flat(d, N), np.where((l-cm)/max(cs, 1e-6) < -CRACK, 1-MULQ, 1.0)   # ひびだけ暗く
        return f
    if mat in ('metal', 'ice'):
        def f(P, N):
            nz = N[:, 2]; mul = np.where(nz > METAL[0], 1+METAL[3], np.where((nz > METAL[1]) & (nz < METAL[2]), 1-METAL[3], 1.0))
            return N, mul
        return f
    return None
