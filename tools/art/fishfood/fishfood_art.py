"""魚12しゅるいと魚料理6つのアイコン（もちもの・図鑑・ふきだし）。もらった絵 fishfood.png（うしろに市松もようがやきついている）から作る。
1. clean()：はしからつながる市松もよう（灰色・白、色みなし）を透明にした絵 fishfood_a.png を作る。
2. pixdown.py でちぢめる（どれも同じ倍率 SC。いまの魚のアイコンとおなじくらい、はば32ドット前後）。
3. ゲームでは、ドットを3つずつにのばした絵（はば96前後）を assets/g に入れる（build_icons）。
  python3 tools/art/fishfood/fishfood_art.py   # 透明にした絵を作る
  python3 tools/art/pixdown.py --config tools/art/fishfood/fishfood_art.py <出力>"""
import os
D = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(D, 'fishfood_a.png')
SC = 0.118
ROWS = [['funa', 'koi', 'nijimasu', 'yumasu', 'namazu', 'dojo'], ['iwana', 'yamame', 'ayu', 'unagi', 'yuami', 'akahara'], ['yakizakana', 'marine', 'kushiyaki', 'foil', 'fishsoup', 'kabayaki']]
BOX = {'funa': (26, 101, 270, 269), 'koi': (305, 111, 571, 254), 'nijimasu': (601, 127, 872, 238), 'yumasu': (897, 125, 1177, 236), 'namazu': (1202, 131, 1468, 251), 'dojo': (1504, 158, 1762, 219),
       'iwana': (15, 387, 292, 492), 'yamame': (310, 386, 575, 493), 'ayu': (605, 390, 874, 489), 'unagi': (895, 404, 1180, 483), 'yuami': (1226, 372, 1433, 516), 'akahara': (1489, 388, 1768, 497),
       'yakizakana': (7, 640, 292, 813), 'marine': (309, 591, 576, 845), 'kushiyaki': (594, 679, 882, 761), 'foil': (894, 605, 1184, 847), 'fishsoup': (1198, 599, 1466, 844), 'kabayaki': (1478, 640, 1768, 813)}
OBJS = {k: {'box': b, 'sc': SC} for k, b in BOX.items()}
NCOL = 16  # 1つの絵の色の数（ディザなし。目など暗い所はまとめない）
WHISK = set()
PLATE = {'yakizakana', 'marine', 'foil', 'fishsoup', 'kabayaki'}  # お皿の料理：お皿の下のかげの消しのこり（細いでっぱり）をけずる  # ひげのある魚：細い線をけさない
def quant(o, n=NCOL):
    """色を n 色にまとめる（不透明な所だけ。ディザなし）"""
    import numpy as np
    from PIL import Image
    A = (o[..., 3] > 0) & ((o[..., :3] @ (.3, .59, .11)) >= 80); c = o[A][:, :3].astype('uint8')
    if len(c) < n: return o
    q = Image.fromarray(c.reshape(1, -1, 3), 'RGB').quantize(n, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert('RGB')
    o[A, :3] = np.array(q).reshape(-1, 3); return o
def tidy(o, k=''):
    """ちぢめたあと：はなれた点・1ドットのとげをけし、小さな穴をうめる（どの絵にも同じ）"""
    import numpy as np
    if k in PLATE:
        from scipy import ndimage
        A = ndimage.binary_opening(o[..., 3] > 0, structure=np.ones((3, 3)))
        o[~A, 3] = 0
    for _ in range(2):
        A = o[..., 3] > 0; P = np.pad(A, 1)
        n8 = sum(np.roll(np.roll(P, dy, 0), dx, 1) for dy in (-1, 0, 1) for dx in (-1, 0, 1) if dy or dx)[1:-1, 1:-1]
        n4 = sum(np.roll(np.roll(P, dy, 0), dx, 1) for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)))[1:-1, 1:-1]
        o[A & ((n8 == 0) if k in WHISK else ((n8 <= 1) | ((n4 <= 1) & (n8 <= 2)))), 3] = 0
        A = o[..., 3] > 0; P = np.pad(A, 1); Q = np.pad(o.astype(float), ((1, 1), (1, 1), (0, 0)))
        n4 = sum(np.roll(np.roll(P, dy, 0), dx, 1) for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)))[1:-1, 1:-1]
        for y, x in zip(*np.where(~A & (n4 >= 3))):
            c = [Q[y + 1 + dy, x + 1 + dx] for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)) if Q[y + 1 + dy, x + 1 + dx, 3] > 0]
            o[y, x] = np.mean(c, 0).round()
    # 中の、まわり8ドットのどれよりも50以上明るい1ドットの点（光の消しのこり）は、まわりの色にする
    A = o[..., 3] > 0; L = o[..., :3] @ (.3, .59, .11); hh, ww = A.shape; src = o.astype(float).copy()
    for y in range(1, hh - 1):
        for x in range(1, ww - 1):
            nb = [(y + dy, x + dx) for dy in (-1, 0, 1) for dx in (-1, 0, 1) if dy or dx]
            if A[y, x] and all(A[q] for q in nb) and all(L[y, x] - L[q] > 50 for q in nb):
                o[y, x, :3] = np.median([src[q][:3] for q in nb], 0).round()
    # いちばん外の1ドットは、となりの中の色より少しこい輪郭（市松もようとまざった白っぽいふちを、うすい輪郭にかえる）
    A = o[..., 3] > 0; P = np.pad(A, 1)
    n4 = sum(np.roll(np.roll(P, dy, 0), dx, 1) for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)))[1:-1, 1:-1]
    edge = A & (n4 < 4); inner = A & ~edge; src = o.astype(float).copy(); hh, ww = A.shape
    for y, x in zip(*np.where(edge)):
        c = [src[y + dy, x + dx, :3] for dy in (-1, 0, 1) for dx in (-1, 0, 1) if (dy or dx) and 0 <= y + dy < hh and 0 <= x + dx < ww and inner[y + dy, x + dx]]
        base = np.mean(c, 0) if c else src[y, x, :3]
        o[y, x, :3] = (base * 0.8).round()
    return quant(o)
def dots(pts, col):
    """手で描くドット（ちぢめると消える小さな物：ひげ・点・しるし）"""
    def f(o):
        for x, y in pts:
            if 0 <= y < o.shape[0] and 0 <= x < o.shape[1]: o[y, x] = (*col, 255)
        return o
    return f
HAND = {'namazu': dots([(28, 9), (29, 10), (29, 11), (30, 9), (26, 10), (25, 11), (24, 11)], (122, 120, 84)),  # ひげ
        'iwana': dots([(9, 5), (12, 4), (15, 5), (18, 4), (21, 5), (24, 4), (13, 6), (19, 6)], (241, 240, 226)),  # 白い点
        'ayu': dots([(24, 6), (24, 7)], (242, 212, 74))}  # えらのうしろの黄色いしるし
FIX = {k: (lambda o, k=k: HAND[k](tidy(o, k)) if k in HAND else tidy(o, k)) for k in BOX}

def clean():
    import numpy as np
    from PIL import Image
    from scipy import ndimage
    im = np.array(Image.open(os.path.join(D, 'fishfood.png')).convert('RGB')).astype(int)
    bgc = (im.max(2) - im.min(2) <= 6) & (im.min(2) >= 224)
    lab, _ = ndimage.label(bgc)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    obj = ndimage.binary_opening(~np.isin(lab, list(edge)), iterations=1)
    a = np.dstack([im, obj * 255]).astype('uint8')
    Image.fromarray(a, 'RGBA').save(SRC)

if __name__ == '__main__':
    clean()

def build_icons(png_dir):
    """ちぢめた絵（png_dir/<id>.png）を、ドット3つずつにのばして assets/g に入れ、js/draw-spirits.js の ICONS に書く。
    python3 -c "import sys;sys.path.insert(0,'tools/art/fishfood');import fishfood_art as F;F.build_icons('<出力>')" """
    import hashlib, io, re
    from PIL import Image
    R = os.path.abspath(os.path.join(D, '..', '..', '..')); js = os.path.join(R, 'js', 'draw-spirits.js'); s = open(js, encoding='utf-8').read()
    for k in BOX:
        im = Image.open(os.path.join(png_dir, k + '.png')).convert('RGBA'); im = im.resize((im.width * 3, im.height * 3), Image.NEAREST)
        b = io.BytesIO(); im.save(b, 'WEBP', lossless=True, exact=True); data = b.getvalue(); name = 'assets/g/' + hashlib.sha1(data).hexdigest()[:10] + '.webp'
        open(os.path.join(R, name), 'wb').write(data)
        m = re.search(r'"%s": "assets/g/[0-9a-f]+\.webp"' % k, s)
        if m: s = s[:m.start()] + '"%s": "%s"' % (k, name) + s[m.end():]
        else: s = s.replace("const ICONS={", "const ICONS={%s:'%s'," % (k, name), 1)
    open(js, 'w', encoding='utf-8').write(s)
