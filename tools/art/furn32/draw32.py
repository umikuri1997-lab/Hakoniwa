#!/usr/bin/env python3
"""家具を、1マス32ドットで、部品ごとに手で描く（tools/art/furn32/furn32_art.py の自動では、まっすぐな木がガタガタ・同じ部材の太さがちがう・輪郭の色がばらばらになるため）。
決まり（スキル pixel-craft「やわらかいドット絵」）：
  ・まず、何の部品でできているか（脚・座面・背もたれの板…）を元の絵から読み、元の絵の半分の大きさ・同じ位置に、部品を四角などで描く
  ・まっすぐな木材は、まっすぐ（段を作らない）。同じ部材（左右の脚・たて板）は、同じ太さ
  ・色は材料ごとに決めた色だけ（hi・top・base・side・dark）。輪郭も材料ごとに1色：外がわ line、内がわ line2
  ・内がわの輪郭は、部材が太い所だけ（その先2ドットも中なら）。細い部材は外がわ1ドットだけ（つぶれない）
  ・中の穴（背もたれのすきま など、まわりをかこまれた透明）には輪郭をつけない
  ・角は1ドット落として、やわらかく（round）
  python3 tools/art/furn32/draw32.py <出力フォルダ> [id ...]   → <チップ名>.png・見くらべ cmp_<id>.png
  python3 tools/art/furn32/draw32.py --put <出力フォルダ> [id ...]   → チップに入れる"""
import os, sys, json, re
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.join(HERE, '..', '..', '..')
sys.path.insert(0, os.path.join(ROOT, 'tools'))
SRC = os.path.join(HERE, 'src')

def hx(s): return tuple(int(s[i:i + 2], 16) for i in (1, 3, 5))
MAT = {  # 材料ごとの色
    'wood':  {'hi': '#f2cc86', 'top': '#e8b76c', 'base': '#d29d5d', 'side': '#ba854f', 'dark': '#a6724a', 'line': '#94643c', 'line2': '#b8824d'},
    'ywood': {'hi': '#fad788', 'top': '#f1c060', 'base': '#e1aa4b', 'side': '#c99238', 'dark': '#b07c30', 'line': '#9a6c2c', 'line2': '#c08a3a'},
    'cloth': {'hi': '#ffffff', 'top': '#f7f7f6', 'base': '#ececeb', 'side': '#dcdbda', 'dark': '#c9c8c6', 'line': '#a9a6a2', 'line2': '#c4c2bf'},
    'barrel': {'hi': '#efb46e', 'top': '#e6a460', 'base': '#d29257', 'side': '#bb7c49', 'dark': '#a3693f', 'line': '#8c5836', 'line2': '#a96c40'},
    'metal': {'hi': '#c3c8ce', 'top': '#aeb4bc', 'base': '#9ca3ad', 'side': '#878d98', 'dark': '#767c87', 'line': '#686d78', 'line2': '#7d838e'},
}

class Cv:
    def __init__(s, w, h): s.w, s.h = w, h; s.m = np.full((h, w), '', object); s.t = np.full((h, w), '', object); s.fixed = np.zeros((h, w), bool)
    def rect(s, x0, y0, x1, y1, mat, tone='base', fixed=False):
        for y in range(max(0, y0), min(s.h, y1 + 1)):
            for x in range(max(0, x0), min(s.w, x1 + 1)): s.m[y, x] = mat; s.t[y, x] = tone; s.fixed[y, x] = fixed
    def px(s, x, y, mat, tone, fixed=True):
        if 0 <= x < s.w and 0 <= y < s.h: s.m[y, x] = mat; s.t[y, x] = tone; s.fixed[y, x] = fixed
    def clear(s, x, y):
        if 0 <= x < s.w and 0 <= y < s.h: s.m[y, x] = ''; s.t[y, x] = ''
    def tone(s, x0, y0, x1, y1, tone, only=None):
        for y in range(max(0, y0), min(s.h, y1 + 1)):
            for x in range(max(0, x0), min(s.w, x1 + 1)):
                if s.m[y, x] and (only is None or s.m[y, x] == only): s.t[y, x] = tone
    def round(s, x0, y0, x1, y1, corners='tl tr bl br'):
        for c in corners.split():
            s.clear(x0 if c[1] == 'l' else x1, y0 if c[0] == 't' else y1)
    def render(s):
        from scipy.ndimage import binary_fill_holes
        f = s.m != ''; out_t = ~binary_fill_holes(f)   # 外（まわりの透明）。中の穴はふくめない
        p = np.pad(out_t, 1, constant_values=True)
        r1 = f & (p[:-2, 1:-1] | p[2:, 1:-1] | p[1:-1, :-2] | p[1:-1, 2:])
        img = np.zeros((s.h, s.w, 4), np.uint8)
        for y in range(s.h):
            for x in range(s.w):
                if not f[y, x]: continue
                M = MAT[s.m[y, x]]; t = s.t[y, x]
                if r1[y, x] and not s.fixed[y, x]: t = 'line'
                elif not s.fixed[y, x]:
                    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):   # 内がわの輪郭：外がわの輪郭のとなりで、その先2ドットも中
                        qx, qy = x + dx, y + dy
                        if 0 <= qx < s.w and 0 <= qy < s.h and r1[qy, qx]:
                            ax_, ay_ = x - dx, y - dy; bx, by = x - 2 * dx, y - 2 * dy
                            if all(0 <= u < s.w and 0 <= v < s.h and f[v, u] and not r1[v, u] for u, v in ((ax_, ay_), (bx, by))): t = 'line2'
                img[y, x, :3] = hx(M[t]); img[y, x, 3] = 255
        return Image.fromarray(img, 'RGBA')

# ---- いす（前・よこ・うしろ） ----
def chair():
    c = Cv(21, 33)   # 前（元 42×65 の半分）
    c.rect(2, 0, 17, 6, 'wood', 'base'); c.tone(2, 0, 17, 1, 'top'); c.tone(2, 6, 17, 6, 'side'); c.round(2, 0, 17, 6, 'tl tr')
    c.rect(2, 7, 4, 13, 'wood'); c.rect(15, 7, 17, 13, 'wood'); c.tone(4, 7, 4, 13, 'side'); c.tone(17, 7, 17, 13, 'side')
    for x in (6, 9, 12): c.rect(x, 7, x + 1, 12, 'wood', 'base', True); c.tone(x + 1, 7, x + 1, 12, 'side')
    c.rect(1, 13, 18, 24, 'wood', 'top'); c.tone(1, 13, 18, 14, 'hi'); c.tone(1, 23, 18, 24, 'side'); c.round(1, 13, 18, 24)
    c.rect(2, 25, 5, 31, 'wood', 'base'); c.rect(14, 25, 17, 31, 'wood', 'base'); c.tone(2, 25, 17, 25, 'dark')
    s = Cv(21, 34)   # よこ（元 41×67）
    s.rect(2, 0, 6, 24, 'wood', 'base'); s.tone(2, 0, 3, 24, 'top'); s.round(2, 0, 6, 24, 'tl tr')
    s.rect(4, 12, 19, 22, 'wood', 'top'); s.tone(4, 12, 19, 13, 'hi'); s.rect(4, 22, 19, 24, 'wood', 'side'); s.round(4, 12, 19, 24, 'tr br')
    s.rect(3, 25, 6, 32, 'wood', 'base'); s.rect(15, 25, 18, 32, 'wood', 'base'); s.tone(3, 25, 18, 25, 'dark')
    b = Cv(21, 30)   # うしろ（元 41×60）
    b.rect(1, 0, 18, 6, 'wood', 'base'); b.tone(1, 0, 18, 1, 'top'); b.tone(1, 6, 18, 6, 'side'); b.round(1, 0, 18, 6, 'tl tr')
    b.rect(1, 7, 18, 16, 'wood', 'side'); b.tone(1, 7, 4, 16, 'base'); b.tone(15, 7, 18, 16, 'base')
    for x in (6, 9, 12): b.rect(x, 8, x + 1, 15, 'wood', 'top', True)
    b.rect(1, 17, 18, 18, 'wood', 'top'); b.rect(1, 19, 18, 21, 'wood', 'dark'); b.round(1, 17, 18, 21, 'bl br')
    b.rect(1, 22, 4, 29, 'wood', 'base'); b.rect(15, 22, 18, 29, 'wood', 'base')
    return {'chair': (c, 11, -14), 'chair>1': (s, 11, -24), 'chair>2': (b, 11, -17)}

def table():
    c = Cv(34, 37)   # 元 68×74
    c.rect(1, 11, 32, 25, 'wood', 'top'); c.tone(1, 11, 32, 12, 'hi'); c.round(1, 11, 32, 25, 'tl tr')
    c.rect(1, 26, 32, 28, 'wood', 'side'); c.round(1, 26, 32, 28, 'bl br')
    c.rect(3, 29, 7, 36, 'wood', 'base'); c.rect(26, 29, 30, 36, 'wood', 'base'); c.tone(3, 29, 30, 29, 'dark')
    return {'table': (c, -2, -21)}

def bed():
    c = Cv(32, 41)   # たて（元 63×81）
    c.rect(4, 0, 27, 2, 'ywood', 'top'); c.rect(4, 3, 27, 5, 'ywood', 'side')
    c.rect(3, 3, 28, 32, 'cloth', 'base')
    c.rect(3, 3, 28, 3, 'cloth', 'side', True)   # 頭板の下のかげ
    c.rect(6, 4, 25, 9, 'cloth', 'line2', True); c.rect(7, 5, 24, 8, 'cloth', 'hi', True); c.clear(6, 4); c.clear(25, 4); c.px(6, 4, 'cloth', 'side'); c.px(25, 4, 'cloth', 'side')   # まくら
    c.rect(3, 10, 28, 12, 'cloth', 'hi', True); c.rect(3, 13, 28, 13, 'cloth', 'line2', True)   # 折り返したシーツ
    c.rect(3, 14, 28, 30, 'cloth', 'top'); c.rect(3, 31, 28, 32, 'cloth', 'side', True)
    for x in (3, 28): c.rect(x, 4, x, 32, 'cloth', 'side', True)   # わくのきわのかげ
    c.rect(4, 33, 27, 37, 'ywood', 'top'); c.tone(4, 33, 27, 33, 'hi'); c.tone(4, 37, 27, 37, 'side')
    for x0 in (0, 28):
        c.rect(x0, 0, x0 + 3, 40, 'ywood', 'base'); c.tone(x0, 0, x0 + 3, 1, 'hi'); c.tone(x0, 30, x0 + 3, 31, 'hi'); c.round(x0, 0, x0 + 3, 40, 'tl tr')
    s = Cv(39, 39)   # よこ（元 77×77）
    s.rect(4, 3, 34, 29, 'cloth', 'base')
    s.rect(5, 4, 10, 27, 'cloth', 'line2', True); s.rect(6, 5, 9, 26, 'cloth', 'hi', True)   # まくら
    s.rect(11, 1, 14, 30, 'cloth', 'hi'); s.rect(11, 1, 11, 30, 'cloth', 'line2', True); s.rect(14, 1, 14, 30, 'cloth', 'line2', True); s.round(11, 1, 14, 30, 'tl tr')   # 折り返したシーツ
    s.rect(15, 3, 34, 24, 'cloth', 'top'); s.rect(15, 25, 34, 29, 'cloth', 'side', True); s.round(15, 3, 34, 29, 'tr')
    s.rect(4, 30, 34, 34, 'ywood', 'top'); s.tone(4, 30, 34, 30, 'hi'); s.tone(4, 34, 34, 34, 'side')
    for x0 in (0, 35):
        s.rect(x0, 0, x0 + 3, 38, 'ywood', 'base'); s.tone(x0, 0, x0 + 3, 1, 'hi'); s.round(x0, 0, x0 + 3, 38, 'tl tr')
    return {'bed': (c, 0, -17), 'bed>1': (s, -3, -13)}

def taru():
    c = Cv(24, 32)   # 元 48×63
    half = [7, 9, 10, 11, 11, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 11, 11, 10, 9, 8, 6]   # 行ごとの半はば（まん中12）
    for y, hw in enumerate(half): c.rect(12 - hw, y, 11 + hw, y, 'barrel', 'base')
    lid = [5, 7, 8, 9, 9, 9, 8, 7, 5]   # ふた（上の面のだ円）
    for i, hw in enumerate(lid): c.tone(12 - hw, 1 + i, 11 + hw, 1 + i, 'top')
    for i, hw in enumerate(lid):   # ふたのふち（こい色の輪）
        for x in (12 - hw, 11 + hw): c.px(x, 1 + i, 'barrel', 'dark')
        if i in (0, len(lid) - 1):
            for x in range(12 - hw, 12 + hw): c.px(x, 1 + i, 'barrel', 'dark')
    for i, hw in enumerate(lid[2:-2]): c.tone(12 - hw + 2, 3 + i, 11 + hw - 2, 3 + i, 'hi')
    for x in (7, 12, 17):   # 板のすじ（まっすぐ）
        for y in range(11, 31): c.px(x, y, 'barrel', 'side')
    def band(y0):
        dip = [0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 2]   # まん中ほど下がる（すこし丸く）
        for x in range(24):
            d = dip[min(x, 23 - x)] if min(x, 23 - x) < 12 else 2
            for k in range(3):
                y = y0 + d + k
                if 0 <= y < 32 and c.m[y, x]: c.px(x, y, 'metal', 'top' if k == 0 else 'base' if k == 1 else 'side', False)
    band(10); band(22)
    for x in range(24):
        for y in range(32):
            if c.m[y, x] == 'barrel' and c.t[y, x] in ('base',) and x > 15: c.t[y, x] = 'side' if c.t[y, x] == 'base' else c.t[y, x]
    return {'taru': (c, 8, -19)}

DESIGNS = {'chair': chair, 'table': table, 'bed': bed, 'taru': taru}

def front_from(parent_img, px0, py0, key):
    """すわった子の前にかさねる部品：本体の絵から、元の部品の形の所を切りとる"""
    meta = json.load(open(os.path.join(SRC, 'meta.json'))); m = meta[key]
    fn = re.sub(r'[^0-9A-Za-z_.-]', lambda q: '_%02x' % ord(q.group()), key)
    a = np.asarray(Image.open(os.path.join(SRC, fn + '.png')).convert('RGBA'))[..., 3] > 100
    P = np.asarray(parent_img); out = np.zeros(P.shape, np.uint8)
    ox, oy = round(m['ax'] / 2) - px0, round(m['ay'] / 2) - py0
    for y in range(P.shape[0]):
        for x in range(P.shape[1]):
            sy, sx = (y - oy) * 2, (x - ox) * 2
            if 0 <= sy < a.shape[0] and 0 <= sx < a.shape[1] and a[sy:sy + 2, sx:sx + 2].any(): out[y, x] = P[y, x]
    return Image.fromarray(out, 'RGBA')

def build(b):
    res = {}
    for k, (cv, ax, ay) in DESIGNS[b]().items():
        im = cv.render(); ox, oy = round(ax / 2), round(ay / 2); res[k] = (im, ox, oy)
    if b == 'chair':
        im, ox, oy = res['chair>2']; res['chair>2.front'] = (front_from(im, ox, oy, 'chair>2.front'), ox, oy)
    out = {}
    for k, (im, ox, oy) in res.items():
        bb = im.getbbox(); out[k] = {'f': [im.crop(bb)], 'ax': ox + bb[0], 'ay': oy + bb[1]}
    return out

def compare(b, final, z=6):
    meta = json.load(open(os.path.join(SRC, 'meta.json'))); cells = []
    for k in sorted(final):
        fn = re.sub(r'[^0-9A-Za-z_.-]', lambda q: '_%02x' % ord(q.group()), k)
        s = Image.open(os.path.join(SRC, fn + '.png')).convert('RGBA'); n = final[k]['f'][0]
        cells.append((s.resize((s.width * z // 2, s.height * z // 2), Image.NEAREST), n.resize((n.width * z, n.height * z), Image.NEAREST)))
    W = sum(max(a.width, c.width) + 12 for a, c in cells); Ha = max(a.height for a, _ in cells); H = Ha + max(c.height for _, c in cells) + 20
    sh = Image.new('RGBA', (W, H), (200, 220, 180, 255)); x = 6
    for a, c in cells: sh.alpha_composite(a, (x, 6)); sh.alpha_composite(c, (x, 14 + Ha)); x += max(a.width, c.width) + 12
    return sh

if __name__ == '__main__':
    a = sys.argv[1:]; put = a and a[0] == '--put'
    if put: a = a[1:]
    d = a[0]; ids = a[1:] or list(DESIGNS); os.makedirs(d, exist_ok=True)
    if put:
        import chips
        h, C = chips.load_imgs()
    for b in ids:
        final = build(b)
        for k, v in final.items():
            v['f'][0].save(os.path.join(d, re.sub(r'[^0-9A-Za-z_.-]', lambda q: '_%02x' % ord(q.group()), k) + '.png'))
            if put: C[k] = {'ax': v['ax'], 'ay': v['ay'], 'w': v['f'][0].width, 'h': v['f'][0].height, 'f': v['f']}
            print(k, v['f'][0].size, v['ax'], v['ay'])
        compare(b, final).save(os.path.join(d, 'cmp_' + b + '.png'))
    if put: chips.pack_imgs(h, C)
