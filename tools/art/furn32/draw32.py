#!/usr/bin/env python3
"""家具を、1マス32ドットで、部品ごとに手で描く（tools/art/furn32/furn32_art.py の自動では、まっすぐな木がガタガタ・同じ部材の太さがちがう・輪郭の色がばらばらになるため）。
決まり（スキル pixel-craft「やわらかいドット絵」）：
  ・まず、何の部品でできているか（脚・座面・背もたれの板…）を元の絵から読み、元の絵の半分の大きさ・同じ位置に、部品を四角などで描く
  ・まっすぐな木材は、まっすぐ（段を作らない）。同じ部材（左右の脚・たて板）は、同じ太さ
  ・色は材料ごとに決めた色だけ（hi・top・base・side・dark と木目 g*）。輪郭は1ドットで、材料ごとに1色（line）
  ・部品のさかいの線（座面と脚・まくらのふち・板のすじ・金の帯のふち）も、輪郭と同じ line の色（Cv.line）
  ・木は、部材の長いほうにそって木目（Cv.grain。長い線で、とちゅうで切らない）
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

def mix(a, b, t=.5): A, B = hx(a), hx(b); return '#%02x%02x%02x' % tuple(round(A[i] * (1 - t) + B[i] * t) for i in range(3))
for _m in MAT.values():   # 木目：その面の色と、1つこい色のあいだ
    _m['ghi'] = mix(_m['hi'], _m['top']); _m['gtop'] = mix(_m['top'], _m['base'], .55); _m['gbase'] = mix(_m['base'], _m['side'], .6); _m['gside'] = mix(_m['side'], _m['dark'], .6)

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
    def grain(s, x0, y0, x1, y1, d='h', seed=0, step=3):
        """木目：部材の長いほうにそって、長い線（とちゅうで切らない）。面の色を1つ木目の色に"""
        G = {'hi': 'ghi', 'top': 'gtop', 'base': 'gbase', 'side': 'gside'}
        if d == 'h':
            for i, y in enumerate(range(y0 + 1, y1, step)):
                a = x0 + 1 + (i * 5 + seed) % 4; b = x1 - 1 - (i * 3 + seed) % 5
                for x in range(a, b + 1):
                    if s.m[y, x] and s.t[y, x] in G and not s.fixed[y, x]: s.t[y, x] = G[s.t[y, x]]
        else:
            for i, x in enumerate(range(x0 + 1, x1, step)):
                a = y0 + 1 + (i * 3 + seed) % 3; b = y1 - 1 - (i * 2 + seed) % 3
                for y in range(a, b + 1):
                    if s.m[y, x] and s.t[y, x] in G and not s.fixed[y, x]: s.t[y, x] = G[s.t[y, x]]
    def line(s, x0, y0, x1, y1, mat):
        """部品のさかいの線：輪郭と同じ色"""
        s.rect(x0, y0, x1, y1, mat, 'line', True)
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
                img[y, x, :3] = hx(M[t]); img[y, x, 3] = 255
        return Image.fromarray(img, 'RGBA')

# ---- 元の絵の形のとおりに描く：座標は、元の絵を半分にした絵（tools/art/furn32/src の絵を BOX で半分）と同じ。原点（ox, oy）も、そのときの原点 ----
def spans(c, rows, mat, tone='base'):
    """rows：{y: (x0, x1)} の行ごとのはば（元の絵の形をそのまま写す）"""
    for y, (x0, x1) in rows.items(): c.rect(x0, y, x1, y, mat, tone)

def chair():
    W = 'wood'
    c = Cv(22, 33)   # 前
    c.rect(5, 0, 16, 0, W, 'top'); c.rect(3, 1, 18, 1, W, 'top'); c.rect(2, 2, 19, 5, W, 'base'); c.tone(2, 2, 19, 2, 'top'); c.clear(2, 6)
    c.grain(2, 2, 19, 6, 'h', 1, 2)
    c.rect(3, 6, 18, 13, W, 'base'); c.line(3, 6, 18, 6, W)   # 背の下：柱・板・すきま（背の上の板とのさかい）
    for x0, x1 in ((7, 7), (10, 11), (14, 14)):
        for y in range(7, 12): c.clear(x0, y); c.clear(x1, y)
    for x in (4, 16): c.grain(x - 1, 6, x + 1, 13, 'v', 0, 9)
    c.line(3, 13, 18, 13, W)   # 背と座面のさかい
    c.rect(2, 14, 19, 16, W, 'top'); c.rect(1, 17, 20, 22, W, 'top'); c.tone(2, 14, 19, 14, 'hi')   # 座面の上
    c.grain(1, 14, 20, 22, 'h', 2, 3)
    c.rect(1, 23, 20, 24, W, 'base'); c.line(1, 25, 20, 25, W)   # 座面の前・脚とのさかい
    c.rect(2, 26, 5, 31, W, 'base'); c.rect(16, 26, 19, 31, W, 'base'); c.grain(2, 25, 5, 31, 'v', 0, 9); c.grain(16, 25, 19, 31, 'v', 1, 9)   # 脚
    s = Cv(21, 34)   # よこ：うしろへかたむいた背もたれ
    spans(s, {1: (3, 6), 2: (3, 6), 3: (2, 6), 4: (2, 6), 5: (2, 6), 6: (1, 6), 7: (1, 6), 8: (1, 7), 9: (1, 7), 10: (1, 7), 11: (1, 7)}, W)
    for y in range(1, 12): x0 = 3 if y < 3 else 2 if y < 6 else 1; s.tone(x0, y, x0 + 1, y, 'top')
    s.rect(2, 12, 19, 12, W, 'base'); s.rect(2, 13, 20, 23, W, 'top'); s.tone(2, 12, 6, 23, 'base'); s.tone(7, 13, 19, 13, 'hi')
    s.line(7, 13, 7, 23, W)   # 背の柱と座面のさかい
    s.grain(1, 1, 6, 23, 'v', 0, 2); s.grain(7, 13, 20, 23, 'h', 1, 3)
    s.rect(3, 22, 20, 23, W, 'base'); s.line(3, 24, 20, 24, W)
    s.rect(3, 25, 6, 32, W, 'base'); s.rect(16, 25, 19, 32, W, 'base'); s.grain(3, 24, 6, 32, 'v', 0, 9); s.grain(16, 24, 19, 32, 'v', 1, 9)
    b = Cv(21, 31)   # うしろ
    b.rect(2, 1, 19, 1, W, 'top'); b.rect(1, 2, 20, 6, W, 'base'); b.tone(1, 2, 20, 2, 'top'); b.grain(1, 2, 20, 7, 'h', 0, 2)
    b.line(1, 7, 20, 7, W)
    b.rect(1, 8, 19, 15, W, 'side'); b.tone(1, 8, 3, 15, 'base'); b.tone(17, 8, 19, 15, 'base')
    for x in (4, 8, 12, 16): b.line(x, 8, x, 15, W)   # 板と板のさかい
    for x in (5, 9, 13): b.rect(x, 8, x + 2, 15, W, 'base'); b.tone(x, 8, x, 15, 'top'); b.grain(x, 7, x + 2, 16, 'v', x, 2)
    b.line(1, 16, 19, 16, W); b.rect(1, 17, 19, 17, W, 'top'); b.rect(1, 18, 19, 20, W, 'side'); b.line(1, 21, 19, 21, W)
    b.rect(1, 22, 4, 28, W, 'base'); b.rect(16, 22, 19, 28, W, 'base'); b.grain(1, 21, 4, 28, 'v', 0, 9); b.grain(16, 21, 19, 28, 'v', 1, 9)
    return {'chair': (c, 5, -7), 'chair>1': (s, 5, -12), 'chair>2': (b, 5, -9)}

def table():
    W = 'wood'
    c = Cv(35, 38)
    c.rect(3, 11, 31, 11, W, 'top'); c.rect(2, 12, 32, 16, W, 'top'); c.rect(1, 17, 33, 25, W, 'top')   # 天板の上
    c.tone(3, 12, 31, 12, 'hi'); c.grain(1, 12, 33, 25, 'h', 0, 3)
    c.rect(1, 26, 33, 28, W, 'base'); c.grain(1, 25, 33, 29, 'h', 2, 2); c.line(2, 29, 32, 29, W)   # 天板の前・脚とのさかい
    c.rect(3, 30, 8, 36, W, 'base'); c.rect(26, 30, 31, 36, W, 'base'); c.grain(3, 29, 8, 36, 'v', 0, 2); c.grain(26, 29, 31, 36, 'v', 1, 2)   # 脚
    c.rect(5, 37, 6, 37, W, 'base'); c.rect(28, 37, 29, 37, W, 'base')
    return {'table': (c, -2, -11)}

def bed():
    Y, L = 'ywood', 'cloth'
    c = Cv(32, 41)   # たて
    c.rect(3, 4, 28, 31, L, 'top')   # ふとん
    c.rect(4, 1, 27, 3, Y, 'top'); c.line(4, 1, 27, 1, Y); c.grain(4, 1, 27, 4, 'h', 0, 2)   # 頭の板
    c.rect(6, 4, 25, 9, L, 'hi', True); c.line(6, 4, 6, 9, L); c.line(25, 4, 25, 9, L); c.line(6, 9, 25, 9, L)   # まくら
    c.line(4, 12, 27, 12, L)   # シーツの折り目
    c.rect(4, 28, 27, 30, L, 'side', True); c.line(4, 31, 27, 31, L)   # ふとんのすそ
    c.rect(3, 32, 28, 38, Y, 'top'); c.line(3, 33, 28, 33, Y); c.line(3, 38, 28, 38, Y); c.grain(3, 33, 28, 38, 'h', 1, 2)   # 足の板
    for x0, x1, xi in ((0, 3, 3), (28, 31, 28)):
        c.rect(x0, 0, x1, 40, Y, 'base'); c.tone(x0, 0, x1, 2, 'top'); c.tone(x0, 29, x1, 31, 'top'); c.grain(x0, 0, x1, 40, 'v', x0, 2)
        c.line(xi, 3, xi, 31, Y)   # 柱とふとんのさかい
    c.line(0, 3, 3, 3, Y); c.line(28, 3, 31, 3, Y); c.line(0, 32, 3, 32, Y); c.line(28, 32, 31, 32, Y)   # 柱の飾りのさかい
    c.round(0, 0, 3, 40, 'tl'); c.round(28, 0, 31, 40, 'tr')
    s = Cv(39, 39)   # よこ
    s.rect(4, 3, 34, 29, L, 'top')
    s.rect(4, 4, 10, 24, L, 'hi', True); s.line(4, 22, 10, 22, L); s.line(4, 3, 10, 3, L)   # まくら
    s.rect(11, 1, 14, 31, L, 'hi', True); s.line(11, 2, 11, 31, L); s.line(14, 2, 14, 31, L); s.clear(11, 1); s.clear(14, 1); s.line(12, 1, 13, 1, L)   # 折り返したシーツ
    s.line(15, 3, 34, 3, L); s.rect(15, 25, 34, 29, L, 'side', True)   # ふとん
    s.rect(4, 30, 34, 34, Y, 'top'); s.line(4, 30, 34, 30, Y); s.grain(4, 30, 34, 34, 'h', 0, 2)   # よこの板
    for x0, xi in ((0, 3), (35, 35)):
        s.rect(x0, 0, x0 + 3, 38, Y, 'top'); s.grain(x0, 0, x0 + 3, 38, 'v', x0, 2)
        s.line(x0, 6, x0 + 3, 6, Y); s.line(x0, 20, x0 + 3, 20, Y); s.line(xi, 7, xi, 34, Y); s.round(x0, 0, x0 + 3, 38, 'tl tr')
    return {'bed': (c, 0, -9), 'bed>1': (s, -2, -7)}

def taru():
    B, M = 'barrel', 'metal'
    c = Cv(24, 32)
    rows = {0: (9, 14), 1: (6, 17), 2: (4, 19), 3: (3, 20), 4: (2, 21), 5: (2, 21), 6: (1, 22), 7: (1, 22), 8: (1, 22), 9: (1, 22)}
    rows.update({y: (0, 23) for y in range(10, 24)}); rows.update({24: (1, 22), 25: (1, 22), 26: (2, 21), 27: (2, 21), 28: (2, 21), 29: (3, 20), 30: (5, 18), 31: (8, 15)})
    spans(c, rows, B)
    for y, (x0, x1) in rows.items():   # 右がわは、かげ
        if y >= 9: c.tone(16, y, x1, y, 'side')
    lid = {2: (4, 19), 3: (3, 20), 4: (3, 20), 5: (3, 20), 6: (3, 20), 7: (3, 20), 8: (4, 19), 9: (6, 17)}   # ふた（だ円）のふち
    for y, (x0, x1) in lid.items(): c.tone(x0, y, x1, y, 'side')
    inner = {3: (6, 17), 4: (4, 19), 5: (4, 19), 6: (4, 19), 7: (5, 18)}
    for y, (x0, x1) in inner.items(): c.tone(x0, y, x1, y, 'top')
    for y, (x0, x1) in inner.items():   # ふたとふちのさかい
        c.px(x0 - 1, y, B, 'line'); c.px(x1 + 1, y, B, 'line')
    c.line(6, 2, 17, 2, B); c.line(6, 8, 17, 8, B); c.px(4, 3, B, 'line'); c.px(5, 3, B, 'line'); c.px(18, 3, B, 'line'); c.px(19, 3, B, 'line'); c.px(4, 7, B, 'line'); c.px(19, 7, B, 'line')
    for x in (9, 14): c.line(x, 3, x, 7, B)   # ふたの板のさかい
    for x in (8, 15): c.line(x, 10, x, 30, B)   # 胴の板のさかい（まっすぐ）
    for x0, x1 in ((1, 7), (9, 14), (16, 22)): c.grain(x0, 9, x1, 31, 'v', x0, 3)
    def band(y0):   # 金の帯：はば4、まん中ほど下がる。上と下のふちは輪郭と同じ色
        for x in range(24):
            d = abs(x - 11.5) / 12; dip = round(4 * (1 - d * d))
            for k, t in enumerate(('line', 'top', 'base', 'line')):
                y = y0 + dip + k
                if 0 <= y < 32 and c.m[y, x]: c.px(x, y, M, t, True)
    band(10); band(21)
    return {'taru': (c, 4, -10)}

DESIGNS = {'chair': chair, 'table': table, 'bed': bed, 'taru': taru}

def front_from(parent_img, px0, py0, key):
    """すわった子の前にかさねる部品：本体の絵から、元の部品の形の所を切りとる"""
    meta = json.load(open(os.path.join(SRC, 'meta.json'))); m = meta[key]
    fn = re.sub(r'[^0-9A-Za-z_.-]', lambda q: '_%02x' % ord(q.group()), key)
    a = np.asarray(Image.open(os.path.join(SRC, fn + '.png')).convert('RGBA'))[..., 3] > 100
    P = np.asarray(parent_img); out = np.zeros(P.shape, np.uint8)
    ax, ay = round(m['ax']), round(m['ay']); x0, y0 = ax - ax % 2, ay - ay % 2   # 元の絵の原点を、半分にした絵と同じにそろえる
    for y in range(P.shape[0]):
        for x in range(P.shape[1]):
            sy, sx = (y + py0) * 2 - ay, (x + px0) * 2 - ax
            if 0 <= sy < a.shape[0] and 0 <= sx < a.shape[1] and a[sy:sy + 2, sx:sx + 2].any(): out[y, x] = P[y, x]
    return Image.fromarray(out, 'RGBA')

def build(b):
    res = {}
    for k, (cv, ax, ay) in DESIGNS[b]().items():
        im = cv.render(); res[k] = (im, ax, ay)   # ax, ay：キャンバスの原点（g32）
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
