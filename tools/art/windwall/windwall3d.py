#!/usr/bin/env python3
"""風のステージの家の壁（帆布の壁 canvaswall・アカシアの板壁 acaciawall）を、3Dで組んで写して、チップにする。
  python3 tools/art/windwall/windwall3d.py <出力フォルダ> [canvaswall acaciawall] [--chips]
竹の壁（tools/art/bamboowall/bamboowall_art.py）と同じ5まいの絵（上の面・正面・柱の切り口・柱の正面・たての壁を上から見た帯）を、
もらった絵のかわりに3Dから写し、部品（H0〜HLR・VU〜VUD・m5〜m15、かげのうすい ~in）は竹の壁の道具の part・vpart で組む。
見え方はゲームのマスと同じ（oblique3d.game：x, y−0.8z。1マス64ドット）。くりかえす物（布のしま・木目・板）は1マスでくりかえすので、となりのマスとつながる。
ドア・窓などの壁ごとの絵は、しっくいの壁の絵の木の所（よぞらの壁の絵とちがう所）を、その壁の木の色にした絵（竹の壁と同じやり方）。

設計図（マス。x=東・y=南・z=上。マスの左上が(0,0)）
  よこの壁：y 0.72〜1.0（上の面は18ドット）、高さ1.25（正面は64ドット）。柱は角とはしだけ（x 10/64〜54/64、y 0.72〜1.0）。
  たての壁を上から見た帯：x 10/64〜54/64（竹の壁と同じはば）。
  帆布の壁：白くぬった木のわく（上の横木 z1.17〜1.25・下の巾木 z0〜0.10）に、うすいピンクとクリーム色の、はば0.25のたてじまの布（布のテクスチャ Fabric026）を、わくより0.04おくにはる。柱は白い角柱。
  アカシアの板壁：はちみつ色の板（木目 Wood049）を、よこに4まい、下の板が少し前へ出るように かさねる（下見板）。上の面は板の色、水色は上の手前のふちの細い帯と巾木だけ。柱はアカシアの角柱に水色の頭。"""
import sys, os
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); ART = os.path.join(HERE, '..'); ROOT = os.path.join(ART, '..', '..')
sys.path.insert(0, ART); sys.path.insert(0, os.path.join(ROOT, 'tools')); sys.path.insert(0, os.path.join(ART, 'bamboowall'))
import oblique3d as O
from blueprint import Part, build

TW = O.Tex(os.path.join(ART, 'textures', 'wood049.png'), span=1.0, flow=10, minrun=4)    # 1マスでくりかえす木目
TF = O.Tex(os.path.join(ART, 'textures', 'fabric026.png'), span=0.5, flow=2, minrun=2, dark=(0.08, 0.97), light=(0.06, 1.02))   # 布の織り目（うすく）
WH = (250, 248, 240); CORAL = (246, 190, 182); CREAM = (252, 240, 214)
HONEY = (222, 170, 108); SKY = (170, 210, 232)
X0, X1 = 10/64, 54/64; YB, YF, ZT = 0.72, 1.0, 1.25

def stripes(x, y, z):   # 帆布のたてじま（0.25ごと。1マスで2くみ）
    return CORAL if (x % 0.5) < 0.25 else CREAM

def parts(wall, piece):
    """piece：'h'（よこの壁）・'p'（柱）・'v'（たての壁を上から見た帯）。[(部品, テクスチャ, もよう, 木目の向き)]"""
    P = []
    if wall == 'canvaswall':
        if piece == 'h':
            P.append((Part('布', 'box', (-1, YB+0.04, 0.10, 2, YF-0.04, ZT-0.08), CREAM), TF, stripes, (1, 0, 0)))
            P.append((Part('上の横木', 'box', (-1, YB, ZT-0.08, 2, YF, ZT), WH), None, None, None))
            P.append((Part('巾木', 'box', (-1, YB+0.02, 0, 2, YF, 0.10), WH), None, None, None))
        elif piece == 'p':
            P.append((Part('柱', 'box', (X0, YB, 0, X1, YF, ZT), WH), None, None, None))
        else:
            P.append((Part('布', 'box', (X0+0.08, -1, 0.10, X1-0.08, 2, ZT-0.02), CREAM), TF, lambda x, y, z: stripes(y, x, z), (0, 1, 0)))
            P.append((Part('わく', 'box', (X0, -1, ZT-0.08, X0+0.08, 2, ZT), WH), None, None, None))
            P.append((Part('わく', 'box', (X1-0.08, -1, ZT-0.08, X1, 2, ZT), WH), None, None, None))
    else:
        if piece == 'h':
            n = 4; z0 = 0.10; hz = (ZT-0.08-z0)/n
            for k in range(n):   # 下見板：下の板ほど前へ（板の下のはしが前に出る）
                a = z0+k*hz; b = a+hz
                P.append((Part('板', 'prism', ([(YB, a), (YF-0.005, a), (YF-0.035, b+0.012), (YB, b+0.012)], -1, 2, 'x'), HONEY), TW, None, (1, 0, 0)))
            P.append((Part('上の板', 'box', (-1, YB, ZT-0.08, 2, YF-0.045, ZT), HONEY), TW, None, (1, 0, 0)))
            P.append((Part('上の見切り', 'box', (-1, YF-0.045, ZT-0.08, 2, YF, ZT), SKY), None, None, None))   # 水色は手前のふちの細い帯だけ
            P.append((Part('巾木', 'box', (-1, YB+0.02, 0, 2, YF+0.005, 0.10), SKY), None, None, None))
        elif piece == 'p':
            P.append((Part('柱', 'box', (X0, YB, 0, X1, YF, ZT-0.08), HONEY), TW, None, (0, 0, 1)))
            P.append((Part('柱の頭', 'box', (X0-0.01, YB-0.01, ZT-0.08, X1+0.01, YF+0.01, ZT), SKY), None, None, None))   # 柱の頭だけ水色
        else:
            P.append((Part('板', 'box', (X0+0.05, -1, 0, X1-0.05, 2, ZT), HONEY), TW, None, (0, 1, 0)))
            P.append((Part('見切り', 'box', (X0, -1, ZT-0.08, X0+0.05, 2, ZT), SKY), None, None, None))
            P.append((Part('見切り', 'box', (X1-0.05, -1, ZT-0.08, X1, 2, ZT), SKY), None, None, None))
    return P

def shoot(wall, piece):
    sc = O.Scene(); sc.txo = {}; sc.txax = {}
    for p, tex, dec, ax in parts(wall, piece):
        sc.texture(tex); sc.decal(dec); p0 = sc.pid; build(sc, [p]); sc.decal(None)
        if ax:
            for q in range(p0+1, sc.pid+1): sc.txo[q] = ((0, 0, 0), 0, 11); sc.txax[q] = np.array(ax, float)
    sc.texture(None); O.S = 64
    sv = O.LIGHT; L = np.array([-0.35, 0.6, 0.8]); O.LIGHT = L/np.linalg.norm(L)   # 壁の正面にも光があたる向き（白い物が灰色にならない）
    try: im = O.render_px(sc, O.game, (-1, 2, -2, 2), O.VIEW, k=0.80, lw=2, k2=0.90, merge=4)
    finally: O.LIGHT = sv
    return np.array(im)   # 192×256：列64〜128がマス、行は (画面のy+2)*64

def pieces(wall):
    """竹の壁の道具にわたす5まい"""
    H = shoot(wall, 'h'); Pp = shoot(wall, 'p'); V = shoot(wall, 'v')
    TOP = H[110:128, 64:128]; FRONT = H[128:192, 64:128]
    CAP = Pp[110:128, 64+10:64+54]; PBODY = Pp[128:192, 64+10:64+54]
    VS = V[64:128, 64+10:64+54]
    return TOP, FRONT, CAP, PBODY, VS

WOODPAL = {'canvaswall': [(196, 192, 182), (218, 214, 204), (234, 231, 222), (244, 242, 234), (250, 248, 242), (255, 254, 250)],   # 白くぬった木
           'acaciawall': [(150, 104, 58), (178, 128, 76), (202, 152, 94), (216, 166, 104), (230, 184, 122), (242, 204, 148)]}  # はちみつ色のアカシア
def wood_map(rgb, pal):
    pal = np.array(pal, float); L = rgb @ np.array([.3, .59, .11])
    t = np.clip((L - 60) / (215 - 60), 0, 1) * (len(pal) - 1); i = np.minimum(t.astype(int), len(pal) - 2); f = (t - i)[..., None]
    return (pal[i] * (1 - f) + pal[i + 1] * f).round().astype(np.uint8)

def main():
    out = sys.argv[1]; os.makedirs(out, exist_ok=True); walls = [a for a in sys.argv[2:] if not a.startswith('-')] or ['canvaswall', 'acaciawall']
    import bamboowall_art as B
    if '--chips' in sys.argv:
        import chips
        h, C = chips.load_imgs()
    for ID in walls:
        B.TOP, B.FRONT, B.CAP, B.PBODY, B.VS = pieces(ID)
        lay = {}
        for hm, nm in ((0, 'H0'), (1, 'HL'), (2, 'HR'), (3, 'HLR')): lay[f'{ID}:{nm}'] = B.part(hm); lay[f'{ID}:{nm}~in'] = B.part(hm, True)
        for vm, nm in ((4, 'VU'), (8, 'VD'), (12, 'VUD')): lay[f'{ID}:{nm}'] = B.vpart(vm)
        for m in (5, 6, 7, 9, 10, 11, 13, 14, 15): lay[f'{ID}:m{m}'] = B.part(m); lay[f'{ID}:m{m}~in'] = B.part(m, True)
        # 見本：よこにならべた壁と、角・たての壁
        can = Image.new('RGBA', (64*8+64, 260), (150, 190, 120, 255))
        for i, m in enumerate((1, 3, 3, 2)): can.alpha_composite(Image.fromarray(B.part(m)), (32+i*64, 40))
        for i, (k, y) in enumerate((('m10', 40), ('VUD', 104), ('VUD', 168))): can.alpha_composite(Image.fromarray(lay[f'{ID}:{k}']), (32+5*64, y))
        can.alpha_composite(Image.fromarray(B.part(9)), (32+6*64, 40)); can.alpha_composite(Image.fromarray(B.part(0)), (32+7*64, 40))
        can.resize((can.width*3, can.height*3), Image.NEAREST).save(os.path.join(out, ID + '_x3.png'))
        if '--chips' in sys.argv:
            for k in [k for k in list(C) if k == ID or k.startswith(ID + ':') or k.startswith(ID + '.')]: del C[k]
            for k, arr in lay.items(): C[k] = {'g': 64, 'ax': 0, 'ay': -B.Y0, 'w': arr.shape[1], 'h': arr.shape[0], 'f': [Image.fromarray(arr)]}
            for k in [k for k in list(C) if k.startswith('plasterwall.')]:   # ドア・窓など：しっくいの壁の絵の木の所を、この壁の木の色に
                yk = 'yozorawall.' + k[len('plasterwall.'):]
                if yk not in C: continue
                Pc, Yz = C[k], C[yk]
                if (Pc['w'], Pc['h']) != (Yz['w'], Yz['h']): continue
                fs = []
                for a, b in zip(Pc['f'], Yz['f']):
                    a = np.array(a).copy(); b = np.array(b); m = (np.abs(a[..., :3].astype(int) - b[..., :3].astype(int)).sum(-1) > 30) & (a[..., 3] > 0)
                    a[..., :3][m] = wood_map(a[..., :3][m].astype(float), WOODPAL[ID]); fs.append(Image.fromarray(a))
                C[ID + '.' + k[len('plasterwall.'):]] = {**{x: y for x, y in Pc.items() if x != 'f'}, 'f': fs}
    if '--chips' in sys.argv: chips.pack_imgs(h, C); print('チップに入れた', walls)

if __name__ == '__main__': main()
