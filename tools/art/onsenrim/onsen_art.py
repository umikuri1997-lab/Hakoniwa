#!/usr/bin/env python3
"""火山の温泉まわりと御簾垣のチップを、もらった絵から作って chips.js に入れる。
  python3 tools/art/onsenrim/onsen_art.py
- 湯のわき岩（hotstone）：tools/art/volcano2/yuwaki2.png（石組みになじむ形）を BOX で はば60 に。湯気（hotstone:steam#0〜3）は前のまま、出る所だけ合わせる。
- 温泉の石組みの石（rim:c0〜3）：tools/art/onsenrim/rim.png の、2つ1組の石4しゅるいをそのまま切る。ゲームで、丸めた水のふちに1こずつならべる（drawOnsenRim）。
- 御簾垣（misugaki）：tools/art/misugaki/misugaki.png（1マス64ドット）。横の帯（64でくりかえす）・柱・たての帯から、柵の部品（H0〜HLR・VU・VD・VUD）を組む。
  柵のドア（misugaki.gate#h0〜3）は、もらった戸の絵の、柱のあいだの戸だけを、ちょうつがい（左）へよこにちぢめて開くコマにする（柱はどのコマも同じ）。"""
import sys, os
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); ART = os.path.dirname(HERE); ROOT = os.path.dirname(os.path.dirname(ART))
sys.path.insert(0, os.path.join(ROOT, 'tools')); import chips

def load(p):
    a = np.array(Image.open(p).convert('RGBA')); a[a[..., 3] <= 8] = 0; return a

def main():
    h, C = chips.load_imgs()
    put = lambda k, arr, ax, ay: C.__setitem__(k, {'g': 64, 'ax': ax, 'ay': ay, 'w': arr.shape[1], 'h': arr.shape[0], 'f': [Image.fromarray(arr)]})
    # 湯のわき岩
    y = load(os.path.join(ART, 'volcano2', 'yuwaki2.png'))
    im = Image.fromarray(y[303:833, 247:1253]); im = im.resize((60, round(im.height * 60 / im.width)), Image.BOX)
    put('hotstone', np.array(im), 2, 60 - im.height)
    for i in range(4): C['hotstone:steam#%d' % i]['ay'] = 60 - im.height + 20 - 68  # 湯気は、わき出る所（岩の上から20）から
    # 温泉の石組み
    r = load(os.path.join(HERE, 'rim.png'))
    for k in ('rim:T', 'rim:B', 'rim:V'): C.pop(k, None)  # 帯は使わない（石を1こずつ、丸めたふちにならべる drawOnsenRim）
    for i, x0 in enumerate((16, 63, 112, 159)): put('rim:c%d' % i, r[105:137, x0:x0 + 31].copy(), -15, -16)  # 石（2つ1組、4しゅるい。まん中が置く所）
    # 御簾垣
    m = load(os.path.join(ART, 'misugaki', 'misugaki.png'))
    HS = m[15:69, 7:71]                      # 横の帯 54×64（上の面6・正面）
    PO = m[9:69, 345:359]                    # 柱 60×14
    VS = m[7:71, 413:425]                    # たての帯 64×12
    def canv(): return np.zeros((60, 64, 4), np.uint8)  # y 2〜62
    def paste(o, s, x, yy):
        hh, ww = s.shape[:2]; k = s[..., 3] > 0; o[yy:yy + hh, x:x + ww][k] = s[k]
    for hm, nm in ((0, 'H0'), (1, 'HL'), (2, 'HR'), (3, 'HLR')):
        o = canv()
        if hm & 1: o[6:60, 0:32] = HS[:, 0:32]
        if hm & 2: o[6:60, 32:64] = HS[:, 32:64]
        if hm != 3: paste(o, PO, 25, 0)
        put('misugaki:' + nm, o, 0, 2)
    put('misugaki:VUD', VS.copy(), 26, -2)
    put('misugaki:VD', PO.copy(), 25, 2)
    o = np.zeros((64, 14, 4), np.uint8); paste(o, VS[:4], 1, 0); paste(o, PO, 0, 4); put('misugaki:VU', o, 25, -2)
    G = m[87:141, 7:73]                      # 戸 54×66（両がわの柱つき）
    L, R = 14, 53                            # 柱のあいだ（戸）
    for n, k in enumerate((1, .66, .4, .14)):
        o = G.copy(); o[:, L:R] = 0
        dw = max(1, round((R - L) * k)); dr = np.array(Image.fromarray(G[:, L:R]).resize((dw, G.shape[0]), Image.BOX))
        paste(o, dr, L, 0); paste(o, G[:, :L], 0, 0); paste(o, G[:, R:], R, 0)
        put('misugaki.gate#h%d' % n, o, -1, 8)
    chips.pack_imgs(h, C)
    print('ok')

if __name__ == '__main__': main()
