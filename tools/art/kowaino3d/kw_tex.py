"""コワイノの材質：布・岩・金属などのでこぼこ（ノーマルマップ）と色のむら（テクスチャ）を、3Dの面にはる（oblique3d の sc.bump）。
はり方：3つの向き（x・y・z）から写して、面の向きでまぜる（トライプラナー）。UV がないモデルでも、つなぎ目が出ない。
ドットらしく：テクスチャは、ちぢめてから（TEXN ドット四方）はる。でこぼこは、かげの段（3〜4だん）をかえるだけ（なめらかなグラデーションにしない）。
  色のむらは、明るい・ふつう・暗いの3だん（MULQ）。どれもドットに写すと、2〜3ドットのかたまりになる大きさ（SCALE：1まいのテクスチャがおおう長さ。体の高さのうち）。
テクスチャ：tools/art/textures（どれも CC0。出どころは README）。"""
import math, os
import numpy as np
from PIL import Image

TEX = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'textures')
# 材質：(ノーマルマップ, 色のテクスチャ, 1まいがおおう長さ（体の高さのうち）, でこぼこの強さ, 色のむらの強さ, ちぢめる大きさ)
MATS = {
    'fabric': ('fabric026_n.png', 'fabric026.png', 0.45, 0.6, 0.0, 20),   # 布：織り目のすじ（たて。色のむらはつけない。すじのかげだけ）と、たれる しわ（FOLD）
    'rock': ('rock030_n.png', 'rock030.png', 0.7, 1.3, 1.8, 14),            # 岩：ごつごつ・ひび・色のむら
    'metal': (None, 'metal032.png', 0.8, 0.0, 1.2, 10),                     # 金属：でこぼこなし・うすい色のむら（つやは material('metal')）
}
FOLD = (7, 0.55, 0.35)   # 布のしわ：まわりにいくつ・強さ（すそのほうほど強い）・ゆらぎ
CRACK = 1.3   # 岩のひび：色のテクスチャのこい所（ばらつきのこの倍より暗い所）を、ひびとして2だん暗く
MULQ = 0.1   # 色のむらの1だんの明るさのちがい

_cache = {}
def _load(fn, n):
    k = (fn, n)
    if k not in _cache:
        a = np.asarray(Image.open(os.path.join(TEX, fn)).convert('RGB').resize((n, n), Image.BOX)).astype(float)/255
        if fn.endswith('_n.png'):   # ノーマルマップ：ちぢめると、かたむきが小さくなるので、かたむき（r・g）を、ばらつき1にそろえる（強さは MATS の数できめる）
            t = a[..., :2]*2-1; t -= t.mean((0, 1)); t /= max(1e-6, float(t.std())); a = t
        _cache[k] = a
    return _cache[k]

def _sample(img, u, v):
    """くりかえす絵を、なめらかに（となり4つをまぜて）読む"""
    n = img.shape[0]; x = (u % 1)*n-0.5; y = (v % 1)*n-0.5; x0 = np.floor(x).astype(int); y0 = np.floor(y).astype(int); fx = (x-x0)[:, None]; fy = (y-y0)[:, None]
    g = lambda yy, xx: img[yy % n, xx % n]
    return (g(y0, x0)*(1-fx)+g(y0, x0+1)*fx)*(1-fy)+(g(y0+1, x0)*(1-fx)+g(y0+1, x0+1)*fx)*fy

def bump(mat, H, seed=0):
    return _bump(mat, H, seed)

def _bump(mat, H, seed):
    """材質 mat の sc.bump 用の関数（点 P・面の向き N は、写すときの3Dの向き。H は体の高さ）"""
    nf, cf, span, st, cs, n = MATS[mat]; NM = _load(nf, n) if nf else None; CM = _load(cf, n) if cf and cs else None
    cmean = float(CM.mean()) if CM is not None else 0; rs = np.random.RandomState(seed); off = rs.rand(3, 2)
    AX = ((1, 2), (0, 2), (0, 1))   # x の向きから写すときは、y・z を u・v に（ほかも同じ）
    def f(P, N):
        Q = P/(span*H); w = np.abs(N)**4; w /= np.maximum(w.sum(1, keepdims=True), 1e-9); N2 = N.copy(); mul = None
        if NM is not None and st:
            d = np.zeros_like(N)
            for i, (a, b) in enumerate(AX):
                if mat == 'fabric' and i < 2: a, b = b, a   # 布：よこから写す所は、すじがたて（たれる向き）になるように、u・v をいれかえる
                t = _sample(NM, Q[:, a]+off[i, 0], Q[:, b]+off[i, 1])   # ノーマルマップ：r＝u の向き、g＝v の向き（OpenGL。_load で、ばらつき1にそろえてある）
                Tu = np.zeros(3); Tu[a] = 1; Tv = np.zeros(3); Tv[b] = 1
                d += w[:, i:i+1]*(t[:, 0:1]*Tu+t[:, 1:2]*Tv)
            if mat == 'fabric':   # しわ：たてにたれるひだ。まわりの角度で波うち、すそ（下）ほど深い
                th = np.arctan2(P[:, 1], P[:, 0]); z = P[:, 2]/H; ph = th*FOLD[0]+np.sin(z*9+th*3)*FOLD[2]*6
                tg = np.stack([-np.sin(th), np.cos(th), 0*th], 1); d += (np.sin(ph)*FOLD[1]*np.clip(1.2-z, 0.2, 1.2))[:, None]*tg
            d -= (d*N).sum(1, keepdims=True)*N   # 面にそった向きだけ
            N2 = N+d*st; N2 /= np.maximum(np.linalg.norm(N2, axis=1, keepdims=True), 1e-9)
        if CM is not None:
            l = np.zeros(len(P))
            for i, (a, b) in enumerate(AX): l += w[:, i]*_sample(CM, Q[:, a]+off[i, 0], Q[:, b]+off[i, 1]).mean(1)
            z = (l-cmean)/max(1e-6, float(CM.std()))*cs
            mul = 1+MULQ*np.where(z > 0.6, 1, np.where(z < -0.6, -1, 0))   # 3だん
            if mat == 'rock': mul = np.where(z < -CRACK*cs, 1-2*MULQ, mul)   # ひび
        if mat == 'metal':   # 金属らしさ：上を向く所は空がうつって明るく、よこ向きの帯は暗く（地平線のうつりこみ）
            nz = N2[:, 2]; band = np.where(nz > 0.55, 1+MULQ*1.5, np.where((nz > -0.15) & (nz < 0.25), 1-MULQ*1.5, 1))
            mul = band if mul is None else mul*band
        return N2, mul
    return f
