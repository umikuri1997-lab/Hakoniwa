"""コワイノの手：持ち主の手のモデル（models/hand.glb、平らにひらいた手）にボーン（骨）を入れて、ポーズをつける。
手のモデルの向き（glTF）：指先は −z、親指は −x（z の 0.1 あたりから横へ）、手首は +z、手のひらは +y（ひらは平ら）。
骨：4本の指に、それぞれ 付け根（MCP）・まん中（PIP）・先（DIP）の3つの関節。親指は付け根に1つ。
  指の骨のならび：指先のかたまり（kmeans で4つ）から、指ごとに 付け根→指先 の線をきめ、関節は線の上の FJ の所。
  点の重み：どの指かは、指の線までのきょりでなめらかにまぜる（指のあいだの手のひらは、となりの2本の まん中）。
  関節ごとの重みは、その関節より先ほど1（関節の前後 JW だけ、なめらかにまぜる）。線形のスキニング（ani_rig.py と同じ）。
ポーズ：先の関節から順にまわす（先の関節でまわしてから、もとの関節でまわす＝つながった骨の動き）。指は手のひらのほう（+y）へまげる。"""
import math, os
import numpy as np, trimesh
from scipy.cluster.vq import kmeans2

HERE = os.path.dirname(os.path.abspath(__file__))
HANDGLB = os.path.join(HERE, 'models', 'hand.glb')
KNUCKLE_Z = 0.06          # 指の付け根（MCP）の z
FJ = (0.0, 0.42, 0.72)    # 関節の場所（付け根→指先の長さのうち）
JW = 0.07                 # 関節の前後で、重みをまぜるはば（指の長さのうち）
THUMB = dict(base=(-0.22, 0.10, 0.30), tip=(-0.58, 0.10, 0.10))   # 親指の付け根と先
PALMC = np.array([0.095, 0.108, 0.243])   # 手のひらのまん中
LENGTH = 1.02             # 手首から指先までの長さ（モデルの大きさ）

def smooth(e0, e1, x): t = np.clip((x-e0)/(e1-e0), 0, 1); return t*t*(3-2*t)
def rotm(axis, deg):
    a = np.asarray(axis, float); a /= np.linalg.norm(a); t = math.radians(deg)
    K = np.array([[0, -a[2], a[1]], [a[2], 0, -a[0]], [-a[1], a[0], 0]]); return np.eye(3)+math.sin(t)*K+(1-math.cos(t))*K@K

class Hand:
    def __init__(s):
        g = list(trimesh.load(HANDGLB).geometry.values())[0]; s.V = np.array(g.vertices); s.F = np.array(g.faces); V = s.V
        tipv = V[V[:, 2] < -0.08]; c, _ = kmeans2(tipv[:, [0]], 4, seed=1, minit='++'); xs = np.sort(c[:, 0])
        s.fing = []
        for x in xs:
            p = tipv[np.abs(tipv[:, 0]-x) < 0.07]; tip = p[np.argmin(p[:, 2])]
            root = np.array([x+(x-np.mean(xs))*0.15, p[:, 1].mean(), KNUCKLE_Z])   # 付け根は、少し手のまん中へよる
            tipc = np.array([p[p[:, 2] < tip[2]+0.08][:, 0].mean(), p[:, 1].mean(), tip[2]])
            s.fing.append((root, tipc))
        tb, tt = np.array(THUMB['base']), np.array(THUMB['tip'])
        # どの指か：指の線（x-z）までのきょり → なめらかなまぜ
        D = np.stack([s.segd(V, r, t) for r, t in s.fing]+[s.segd(V, tb, tt)], 1)
        W = np.exp(-(D/0.06)**2); s.mem = W/np.maximum(W.sum(1, keepdims=True), 1e-9)
        s.thumbw = s.mem[:, 4]*smooth(-0.02, 0.06, s.along(V, tb, tt))   # 親指は、付け根より先
    @staticmethod
    def along(V, a, b):
        d = b-a; L = np.linalg.norm(d[[0, 2]]); u = d/np.linalg.norm(d); return ((V-a)@u)/L
    @staticmethod
    def segd(V, a, b):
        P = V[:, [0, 2]]; A = a[[0, 2]]; B = b[[0, 2]]; t = np.clip(((P-A)@(B-A))/((B-A)@(B-A)), 0, 1)
        return np.linalg.norm(P-(A+t[:, None]*(B-A)), axis=1)
    def pose(s, curl=(25, 45, 30), spread=0.0, thumb=20):
        """curl：付け根・まん中・先の関節をまげる角度（手のひらへ）。spread：指をひらく（度）。thumb：親指を手のひらへよせる角度"""
        V = s.V.copy(); n = np.array([0, 1.0, 0])
        for k, (r, t) in enumerate(s.fing):
            d = t-r; L = np.linalg.norm(d); u = d/L; ax = np.cross(u, n)   # まげる軸（指の横）。+y へまがる向き
            sa = s.along(s.V, r, t)
            for j in (2, 1, 0):   # 先の関節から
                jp = r+u*L*FJ[j]; w = (s.mem[:, k]*smooth(FJ[j]-JW, FJ[j]+JW, sa))[:, None]
                R = rotm(ax, curl[j]); V = V*(1-w)+((V-jp)@R.T+jp)*w
            if spread:
                w = (s.mem[:, k]*smooth(-JW, JW, sa))[:, None]; R = rotm(n, spread*(k-1.5)); V = V*(1-w)+((V-r)@R.T+r)*w
        tb, tt = np.array(THUMB['base']), np.array(THUMB['tip']); u = (tt-tb)/np.linalg.norm(tt-tb)
        w = s.thumbw[:, None]; R = rotm(np.cross(u, [0, 1.0, 0]), thumb); V = V*(1-w)+((V-tb)@R.T+tb)*w   # 親指を手のひらへよせる
        return V

def place(V, c0, size, inward, tilt=0.0, roll=0.0):
    """ポーズをつけた手を、コワイノの手の場所へ。指先→前（+z）、親指→上（+y）、手のひら→ inward（+1 で +x、−1 で −x）。
    size：手首から指先までの長さ。tilt：指先を下へむける角度。roll：指先の向きを軸に手をひねり、手のひらを下へむける角度"""
    P = (V-PALMC)*(size/LENGTH)
    # 手のモデルの向き：指先 a=(0,0,-1)・親指 b=(-1,0,0)・手のひら n=(0,1,0) → a→前 (0,0,1)・b→上 (0,1,0)・n→(-1,0,0)
    M = np.array([[0, -1, 0], [-1, 0, 0], [0, 0, -1]], float)   # 行：もとの x,y,z が行く先
    P = P@M
    P = P@rotm((0, 0, 1), roll).T   # 手のひら（−x）を下へ。左右をうつす前なので、もう片方の手も同じく下へむく
    if inward > 0: P[:, 0] *= -1   # 手のひらを +x へ：左右をうつす（もう片方の手。三角形のうら表は、呼ぶ所でかえす）
    P = P@rotm((1, 0, 0), tilt).T
    return P+np.asarray(c0, float)
