#!/usr/bin/env python3
"""風・水・闇の家のドア（帆布のドア canvasdoor・アーチの木のドア archdoor・古い庭の木戸 niwadoor）の絵。
  python3 tools/art/stagedoor/stagedoor_art.py <見本の出力フォルダ> [--chips]
ドアの板（56×56ドット、g64）をコードのドットで描き、壁ごとのふつうのドアの絵（<壁>.door#h0〜3・~in）の板の所（x 4〜59・y 4〜59）に入れる。
開いたコマは、ちょうつがいの左がわへ、よこにせまく（56・42・28・14ドット）。取っ手はせまくしない。たて置き・上の断面は、ふつうのドアの絵のまま。"""
import os, sys
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); R = os.path.join(HERE, '..', '..', '..'); sys.path.insert(0, os.path.join(R, 'tools'))
N = 56; WS = [56, 42, 28, 14]

def shade(c, k): return tuple(max(0, min(255, int(round(v * k)))) for v in c)
def panel(kind):
    """板の絵（RGBA の配列）と、取っ手（x,y,色の配列）"""
    a = np.zeros((N, N, 4), np.uint8)
    def rect(x0, y0, x1, y1, c): a[y0:y1, x0:x1, :3] = c; a[y0:y1, x0:x1, 3] = 255
    if kind == 'canvasdoor':   # 白くぬった木のわくに、ピンクとクリーム色のたてじまの帆布
        W0 = (250, 248, 240); rect(0, 0, N, N, shade(W0, .9)); rect(1, 1, N-1, N-1, W0)
        for x in range(6, N-6):
            c = (246, 190, 182) if ((x - 6) // 8) % 2 == 0 else (252, 240, 214)
            rect(x, 6, x+1, N-6, c)
        rect(6, 6, N-6, 7, shade(W0, .86)); rect(6, N-7, N-6, N-6, shade(W0, .92))
        rect(0, 26, N, 30, W0); rect(0, 29, N, 30, shade(W0, .9))
        knob = [(46, 30, (176, 212, 230)), (47, 30, (176, 212, 230)), (46, 31, (150, 186, 208)), (47, 31, (150, 186, 208))]
    elif kind == 'archdoor':   # たて板のあたたかい木のドアに、上の弓の形のまど・鉄の帯2本
        WD = (204, 150, 102)
        for x in range(N):
            k = 0.92 if x % 8 == 0 else 1.0 if (x // 8) % 2 == 0 else 0.96
            rect(x, 0, x+1, N, shade(WD, k))
        cx, cy, r = 28, 18, 12
        for y in range(4, 20):
            for x in range(14, 42):
                d = ((x - cx) ** 2 + (y - cy) ** 2) ** .5
                if (y >= cy and abs(x - cx) <= r) or d <= r:
                    a[y, x, :3] = (214, 234, 244) if not (x == cx or y == 12) else shade(WD, .8); a[y, x, 3] = 255
                    if (abs(x - cx) == r or (y < cy and r - 1 <= d <= r)): a[y, x, :3] = shade(WD, .78)
        for y in (30, 46): rect(2, y, N-2, y+3, (150, 150, 160)); rect(2, y+2, N-2, y+3, (130, 130, 142))
        knob = [(46, 37, (232, 196, 110)), (47, 37, (232, 196, 110)), (46, 38, (200, 160, 86)), (47, 38, (200, 160, 86))]
    else:   # 古い庭の木戸：灰色の古い板に、Z のすじかいと、ところどころのコケ、鉄の輪の取っ手
        WD = (170, 152, 138)
        for x in range(N):
            k = 0.9 if x % 9 == 0 else 1.0 if (x // 9) % 2 == 0 else 0.95
            rect(x, 0, x+1, N, shade(WD, k))
        for y in (6, 46): rect(1, y, N-1, y+5, shade(WD, .88)); rect(1, y+4, N-1, y+5, shade(WD, .8))
        for t in range(36):
            x = 4 + int(t * 46 / 36); y = 44 - t
            rect(x, y, x+5, y+2, shade(WD, .86))
        for x, y in ((3, 50), (4, 51), (5, 50), (9, 52), (40, 8), (41, 9), (50, 47), (51, 48), (12, 7)): rect(x, y, x+2, y+1, (118, 152, 104))
        knob = []
        for ang in range(0, 360, 30):
            import math; x = int(round(45 + 3 * math.cos(math.radians(ang)))); y = int(round(31 + 3 * math.sin(math.radians(ang))))
            knob.append((x, y, (110, 112, 122)))
    return a, knob

def frames(kind, door):
    """壁のドアの絵（4コマ）から、この板を入れた4コマ"""
    a, knob = panel(kind); out = []
    for n, fr in enumerate(door):
        o = np.array(fr.convert('RGBA')).copy(); w = WS[n]
        p = np.array(Image.fromarray(a).resize((w, N), Image.BOX))
        m = p[..., 3] > 0; sub = o[4:4+N, 4:4+w]; sub[m] = p[m]
        for x, y, c in knob:   # 取っ手はせまくしない（板の右はしからの場所はそのまま）
            xx = 4 + w - (N - x)
            if 4 <= xx < 4 + w: o[4+y, xx, :3] = c; o[4+y, xx, 3] = 255
        out.append(Image.fromarray(o))
    return out

DOORS = ['canvasdoor', 'archdoor', 'niwadoor']
def main():
    dst = sys.argv[1]; os.makedirs(dst, exist_ok=True)
    import chips
    h, C = chips.load_imgs(); walls = sorted({k.split('.door#h0')[0] for k in C if k.endswith('.door#h0')})
    can = Image.new('RGBA', (64 * 4 * len(DOORS), 72), (150, 190, 120, 255))
    for i, d in enumerate(DOORS):
        for n, im in enumerate(frames(d, [C['hwall.door#h%d' % k]['f'][0] for k in range(4)])): can.alpha_composite(im, ((i * 4 + n) * 64, 0))
    can.resize((can.width * 3, can.height * 3), Image.NEAREST).save(os.path.join(dst, 'stagedoor_x3.png'))
    if '--chips' not in sys.argv: return
    for d in DOORS:
        for k in [k for k in list(C) if k == d or k.startswith(d + '#') or k.startswith(d + ':') or ('.' + d) in k]: del C[k]
        for w in ['', *[x + '.' for x in walls]]:
            base = (w + 'door') if (w + 'door#h0') in C else 'door'
            for sx in ('', '~in'):
                if base + '#h0' + sx not in C: continue
                fs = frames(d, [C[base + '#h%d' % n + sx]['f'][0] for n in range(4)])
                for n in range(4): C[w + d + '#h%d' % n + sx] = {**{x: y for x, y in C[base + '#h%d' % n + sx].items() if x != 'f'}, 'f': [fs[n]]}
            for k in [k for k in list(C) if k.startswith(base + '#v') or k.startswith(base + ':')]:
                C[w + d + k[len(base):]] = {**{x: y for x, y in C[k].items() if x != 'f'}, 'f': [f.copy() for f in C[k]['f']]}
        C[d] = {**{x: y for x, y in C['door#h0'].items() if x != 'f'}, 'f': [frames(d, [C['door#h%d' % n]['f'][0] for n in range(4)])[0]]}
    chips.pack_imgs(h, C); print('チップに入れた', DOORS, len(walls), '壁')
if __name__ == '__main__': main()
