#!/usr/bin/env python3
"""竹の壁（bamboowall、あめ色のかわいた竹）のチップを、もらった絵 bamboowall.png（1マス64ドットで描いてある）から作って、chips.js に入れる。
  python3 tools/art/bamboowall/bamboowall_art.py
もらった絵：上の段＝横の壁（上の面18・正面56・はば320）、左下＝柱（切り口18・正面56）、右＝たての壁を上から見た帯（はば44）。どれも64ドットでくりかえす。
- 正面は、ゲームの壁（正面64）に合わせて、竹だけの行をくりかえして56→64にのばす（ちぢめたり、ぼかしたりしない）。
- 部品（H0〜HLR・VU・VD・VUD・m5〜m15、かげのうすい ~in）は、上の面・正面・柱・たての帯を、つながりごとに組んで作る（g64、マスの左上から y−18）。
- ドア・よぞらのドア・窓・ドアの上の断面（壁ごとの絵）は、しっくいの壁の絵の、木の所（よぞらの壁の絵とちがう所）だけを、竹の色にかえて作る。"""
import sys, os
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))
sys.path.insert(0, os.path.join(ROOT, 'tools')); import chips
ID = 'bamboowall'
A = np.array(Image.open(os.path.join(HERE, 'bamboowall.png')).convert('RGBA'))

def grow(b, rows):
    """正面を、竹だけの行（rows）をくりかえして、下へ8ドットのばす（行ごとに1回ずつくりかえす）"""
    out = []
    for y in range(b.shape[0]):
        out.append(b[y])
        if y in rows: out.append(b[y])
    return np.array(out)

TOP = A[16:34, 16:80]                      # 横の壁の上の面（18×64）
FRONT = grow(A[34:90, 16:80], {44, 45, 46, 47, 18, 19, 20, 24})  # 正面 56→64
assert FRONT.shape[0] == 64, FRONT.shape
CAP = A[112:130, 16:60]                    # 柱の切り口（18×44）
PBODY = grow(A[130:186, 16:60], {6, 7, 8, 9, 28, 29, 30, 31})  # 柱の正面 56→64
assert PBODY.shape[0] == 64, PBODY.shape
VS = A[16:80, 360:404]                     # たての帯（64×44、64でくりかえす）
SH = [96, 96, 64, 64, 38, 38, 16, 16]; SHIN = [64, 64, 42, 42, 24, 24, 10, 10]; SHC = (30, 35, 25)
Y0 = 18  # 部品の絵の y=0 は、マスの上の18ドット上

def paste(o, src, x, y):
    h, w = src.shape[:2]; m = src[..., 3] > 0
    o[y:y + h, x:x + w][m] = src[m]

def vstrip(o, a, b):
    """たての帯を、マスの座標 a〜b（g64、マスの上が0）にしく（64でくりかえし、マスにそろえる）"""
    for yy in range(a, b):
        o[yy + Y0, 10:54] = VS[yy % 64]

def part(m, inn=False):
    L, R, U, D = m & 1, m & 2, m & 4, m & 8
    o = np.zeros((Y0 + 64 + 8, 64, 4), np.uint8)
    hm = L or R
    def band(x0, x1, front=True):
        o[0:Y0, x0:x1] = TOP[:, x0:x1]
        if front: o[Y0:Y0 + 64, x0:x1] = FRONT[:, x0:x1]
    sh = np.zeros(64, bool)
    if D:
        if L: band(0, 10); sh[0:10] = True
        if R: band(54, 64); sh[54:64] = True
        vstrip(o, -Y0, 64)
    elif U:
        vstrip(o, -Y0, 0)
        if L and R: band(0, 64); o[0:Y0, 10:54] = VS[(np.arange(-Y0, 0)) % 64]; sh[:] = True
        else:
            if L: band(0, 10); sh[0:10] = True
            if R: band(54, 64); sh[54:64] = True
            paste(o, PBODY, 10, Y0); sh[10:54] = True
    else:
        if L and R: band(0, 64); sh[:] = True
        else:
            if L: band(0, 10); sh[0:10] = True
            if R: band(54, 64); sh[54:64] = True
            paste(o, CAP, 10, 0); paste(o, PBODY, 10, Y0); sh[10:54] = True
    for k, al in enumerate(SHIN if inn else SH):
        row = o[Y0 + 64 + k]
        row[sh] = (*SHC, al)
    return o

def vpart(m):
    U, D = m & 4, m & 8
    o = np.zeros((Y0 + 64 + 8, 64, 4), np.uint8)
    if U and D: vstrip(o, -Y0, 64)
    elif D: vstrip(o, 0, 64); paste(o, CAP, 10, 0)  # 上のはし：切り口
    else:
        vstrip(o, -Y0, 0); paste(o, PBODY, 10, Y0)  # 下のはし：柱の正面
        for k, al in enumerate(SH): o[Y0 + 64 + k, 10:54] = (*SHC, al)
    return o

def bamboo_map(rgb):
    """木の色（明るさ）を、竹の色の段（もらった絵の色）へ"""
    pal = np.array([(160, 132, 88), (188, 164, 118), (209, 189, 146), (213, 195, 141), (230, 211, 155), (244, 230, 177)], float)  # あめ色の竹（もらった絵の色）
    L = rgb @ np.array([.3, .59, .11])
    t = np.clip((L - 60) / (215 - 60), 0, 1) * (len(pal) - 1); i = np.minimum(t.astype(int), len(pal) - 2); f = (t - i)[..., None]
    return (pal[i] * (1 - f) + pal[i + 1] * f).round().astype(np.uint8)

def recolor(pl, yz):
    a = pl.copy(); m = (np.abs(pl[..., :3].astype(int) - yz[..., :3].astype(int)).sum(-1) > 30) & (pl[..., 3] > 0)
    a[..., :3][m] = bamboo_map(a[..., :3][m].astype(float)); return a

def main():
    h, C = chips.load_imgs()
    for k in [k for k in list(C) if k == ID or k.startswith(ID + ':') or k.startswith(ID + '.')]: del C[k]
    put = lambda k, arr, ax=0, ay=-Y0, g=64: C.__setitem__(k, {'g': g, 'ax': ax, 'ay': ay, 'w': arr.shape[1], 'h': arr.shape[0], 'f': [Image.fromarray(arr)]})
    for hm, nm in ((0, 'H0'), (1, 'HL'), (2, 'HR'), (3, 'HLR')):
        put(f'{ID}:{nm}', part(hm)); put(f'{ID}:{nm}~in', part(hm, True))
    for vm, nm in ((4, 'VU'), (8, 'VD'), (12, 'VUD')): put(f'{ID}:{nm}', vpart(vm))
    for m in (5, 6, 7, 9, 10, 11, 13, 14, 15):
        put(f'{ID}:m{m}', part(m)); put(f'{ID}:m{m}~in', part(m, True))
    # アイコン用の 'bamboowall' のチップは作らない（あると、窓のある壁で窓を描く所へ進まない。アイコンは drawConn の HLR）
    for k in [k for k in list(C) if k.startswith('plasterwall.')]:
        yk = 'yozorawall.' + k[len('plasterwall.'):]
        if yk not in C: continue
        P, Yz = C[k], C[yk]
        if (P['w'], P['h']) != (Yz['w'], Yz['h']): continue
        fs = [Image.fromarray(recolor(np.array(a), np.array(b))) for a, b in zip(P['f'], Yz['f'])]
        C[ID + '.' + k[len('plasterwall.'):]] = {**{x: y for x, y in P.items() if x != 'f'}, 'f': fs}
    chips.pack_imgs(h, C)
    print('ok', sorted(k for k in C if k.startswith(ID)))

if __name__ == '__main__': main()
