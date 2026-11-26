"""3Dの試作（proto3d）の材質のもよう：ゲームの道具（tools/art/oblique3d.py の Tex.at）と同じやり方で、
CC0 のテクスチャ（tools/art/textures）を、明るさの3だん（こい所・ふつう・明るい所）の絵にして tex/m_<名前>.png に書く。
  python3 proto3d/make_textures.py
絵の1ドット＝ゲームの1ドット（1マス IQW/√2＝45.25 ドット）。絵の値：0＝こい所・128＝ふつう・255＝明るい所。
もようの横（u）が、部品ののびる向き。試作は、この値を、部品の色の明るさにかける数（dark・light）にして使う（main.js の MATS）。
数は tools/art/handoff3d/render.py の SURFACES（木・石・金属・布）と、sacred_tripo.py の木の皮と同じ。"""
import json, os
import numpy as np
from PIL import Image
from scipy.ndimage import uniform_filter1d

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'tools', 'art', 'textures'); OUT = os.path.join(ROOT, 'proto3d', 'tex')
S = 64/2**.5   # 1マスのドット数
MATS = {   # 名前：(ファイル, span, flow, minrun, dark, light)
    'wood': ('wood049.png', 2.0, 7, 4, (.23, .82), (.16, 1.12)),
    'stone': ('rock030.png', .57, 3, 3, (.19, .91), (.13, 1.06)),
    'metal': ('metal032.png', .65, 4, 4, (.14, .9), (.08, 1.06)),
    'cloth': ('fabric026.png', .72, 5, 4, (.14, .9), (.08, 1.06)),
    'bark': ('bark001.png', .8, 7, 4, (.24, .86), (.18, 1.08)),
}


def level(path, span, flow, minrun, dark, light):
    """oblique3d.Tex.at と同じ：ちぢめる → もようの向きになめらかに → 明るさの順で3だん → 短いすじはけす"""
    n = max(8, int(round(span*S)))
    a = np.asarray(Image.open(path).convert('L').resize((n, n), Image.BOX), float)
    a = uniform_filter1d(a, flow, axis=1, mode='wrap')
    lo, hi = np.quantile(a, dark[0]), np.quantile(a, 1-light[0])
    q = np.where(a <= lo, -1, np.where(a >= hi, 1, 0))
    for y in range(n):
        r = q[y]; st = np.flatnonzero(np.diff(np.r_[r[-1], r]) != 0)
        for i, x0 in enumerate(st):
            x1 = st[(i+1) % len(st)]; L = (x1-x0) % n or n
            if r[x0] != 0 and L < minrun: r[np.arange(x0, x0+L) % n] = 0
    return ((q+1)*127.5).round().astype(np.uint8)


if __name__ == '__main__':
    meta = {}
    for k, (f, span, flow, minrun, dark, light) in MATS.items():
        Image.fromarray(level(os.path.join(SRC, f), span, flow, minrun, dark, light), 'L').save(os.path.join(OUT, 'm_'+k+'.png'))
        meta[k] = {'span': span, 'dark': dark[1], 'light': light[1]}
    json.dump(meta, open(os.path.join(OUT, 'mats.json'), 'w'), indent=1); print('ok', list(meta))
