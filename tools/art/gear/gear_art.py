"""そうびのアイコン（もちもの・そうびの画面・依頼ボード）。もらった絵 src/<シート>.webp（透過・7まい）から作る。
1まいの中の物は、たての空き → 行、行の中のよこの空き → 物、でわける（数が多ければ、いちばんせまい空きからまとめる：ならんだ手ぶくろ・火の粉など）。
どれも、長いほうの辺が S ドットになるようにちぢめ（pixdown.py の make）、コントラスト・あざやかさを上げて（pop）、fishfood_art の tidy でととのえる。
ゲームでは、ドットを3つずつにのばした絵を assets/g に入れ、js/draw-spirits.js の ICONS に 'g_<id>' で書く（gearIcon がつかう）。
  python3 tools/art/gear/gear_art.py <出力フォルダ>          # ちぢめた絵と見くらべ
  python3 tools/art/gear/gear_art.py <出力フォルダ> --game   # ゲームに入れる"""
import os, sys
import numpy as np
from PIL import Image
D = os.path.dirname(os.path.abspath(__file__)); R = os.path.abspath(os.path.join(D, '..', '..', '..'))
sys.path.insert(0, os.path.join(D, '..')); sys.path.insert(0, os.path.join(D, '..', 'fishfood'))
import pixdown, fishfood_art
S = 30  # 長いほうの辺のドット数
gw = lambda a, b: ['gw%02d' % i for i in range(a, b + 1)]
ga = lambda a, b: ['ga%02d' % i for i in range(a, b + 1)]
SHEETS = {  # シート：行ごとの id（左から）
  'weapon1': [gw(1, 5), gw(6, 10), gw(11, 15), gw(16, 20)],
  'weapon2': [gw(21, 25), gw(26, 30), gw(31, 35), ['gw36', 'gg01', 'gg02', 'gg03', 'gg09']],
  'arrows': [['gar%02d' % i for i in range(a, min(a + 6, 27))] for a in (1, 7, 13, 19, 25)],
  'armor1': [ga(1, 5), ga(6, 10), ga(11, 15)],
  'armor2': [ga(16, 20), ga(21, 25), ['ga26', 'gg04', 'gg05', 'gg06', 'gg10']],
  'charm': [['gc%02d' % i for i in range(1, 6)], ['gc%02d' % i for i in range(6, 11)], ['gc%02d' % i for i in range(11, 15)] + ['gg07'], ['gg08', 'ga27', 'ga28', 'ga29']],
  'tool': [['gt01', 'gt02', 'gt03', 'gt04', 'gt16'], ['gt17', 'gt05', 'gt06', 'gt07', 'gt08'], ['gt09', 'gt10', 'gt11', 'gt12', 'gt13'], ['gt14', 'gt15']]}
TH = 128  # これより こい所を物とみる（うしろのうすいもやは、のぞく）
CON, SAT = 1.3, 1.4  # コントラスト（物の明るさの平均を中心に）・あざやかさ（持ち主のたのみで上げた）
def pop(o):
    A = o[..., 3] > 0
    if not A.any(): return o
    c = o[..., :3].astype(float); L = c @ (.3, .59, .11); m = L[A].mean()
    c = L[..., None] + (c - L[..., None]) * SAT  # あざやかさ
    c = m + (c - m) * CON  # コントラスト
    o[..., :3] = np.where(A[..., None], np.clip(c, 0, 255).round(), o[..., :3]); return o

# ---- 手で直す所（ちぢめると消える細い線・小さな物）。ちぢめたあとの絵（左上が0,0）のドットに描く ----
def _line(a, p0, p1, col, on=None):
    """ブレゼンハムの1ドットの線。on='o' なら物の上だけ、'e' なら空いた所だけ"""
    (x0, y0), (x1, y1) = p0, p1; dx, dy = abs(x1 - x0), -abs(y1 - y0); sx, sy = (1 if x0 < x1 else -1), (1 if y0 < y1 else -1); e = dx + dy
    while True:
        if 0 <= y0 < a.shape[0] and 0 <= x0 < a.shape[1] and (on is None or (on == 'o') == (a[y0, x0, 3] > 0)): a[y0, x0] = (*col, 255)
        if (x0, y0) == (x1, y1): break
        e2 = 2 * e
        if e2 >= dy: e += dy; x0 += sx
        if e2 <= dx: e += dx; y0 += sy
def _dots(a, pts, col):
    for x, y in pts: a[y, x] = (*col, 255)
def _pad(im, l=0, t=0, r=0, b=0):
    o = Image.new('RGBA', (im.width + l + r, im.height + t + b)); o.paste(im, (l, t)); return o
def _clear(a, x0, y0, x1, y1): a[y0:y1 + 1, x0:x1 + 1] = 0
SIL, SILD, SILL, PRL = (176, 178, 196), (132, 134, 154), (228, 230, 238), (242, 238, 228)
def h_bow_bamboo(im):
    a = np.array(im); _line(a, (22, 3), (3, 26), (190, 160, 110), 'e'); return Image.fromarray(a)
def h_bow_silver(im):
    a = np.array(im); _line(a, (23, 4), (3, 26), (190, 160, 110), 'e'); return Image.fromarray(a)
def h_pendant(im):
    im = _pad(im, l=1, r=1, t=10); a = np.array(im)
    _line(a, (6, 10), (1, 0), SILD); _line(a, (7, 10), (12, 0), SILD); return Image.fromarray(a)
def h_hat(im):
    a = np.array(im); _clear(a, 0, 15, a.shape[1] - 1, a.shape[0] - 1); c = (150, 140, 70)
    _line(a, (11, 14), (14, 19), c); _line(a, (18, 14), (15, 19), c)
    _dots(a, [(12, 19), (13, 18), (16, 18), (17, 19), (13, 20), (16, 20), (13, 21), (16, 21)], c); return Image.fromarray(a)
def h_fan(im):
    im = _pad(im, l=2, t=2, r=2); a = np.array(im); rib = (210, 116, 56)
    for e in [(4, 14), (6, 8), (10, 4), (15, 2), (20, 2), (25, 5), (28, 9), (29, 13)]: _line(a, (17, 18), e, rib, 'o')
    _dots(a, [(1, 4), (0, 18), (30, 1), (31, 18), (2, 1)], (255, 168, 56)); return Image.fromarray(a)
def h_kamikazari(im):
    a = np.array(im); _clear(a, 11, 15, a.shape[1] - 1, a.shape[0] - 1)
    _line(a, (13, 15), (13, 23), SILD); _line(a, (18, 15), (18, 20), SILD)
    for x, y in [(12, 24), (17, 21)]:
        _dots(a, [(x, y), (x + 1, y), (x, y + 1), (x + 1, y + 1)], PRL); _dots(a, [(x + 1, y + 1)], (198, 192, 180))
    return Image.fromarray(a)
def h_feather(im):
    a = np.array(im).astype(float); g = (a[..., 3] > 0) & (a[..., 1] > a[..., 2] + 30); g[:18] = False; g[:, 12:] = False  # 左下のリボン（みどり）だけ
    L = a[..., :3] @ (.3, .59, .11); pal = np.array([(126, 168, 72), (160, 200, 96), (196, 226, 132)])
    k = np.clip(((L - L[g].min()) / max(1, np.ptp(L[g])) * 3).astype(int), 0, 2)
    a[g, :3] = pal[k[g]]; return Image.fromarray(a.astype('uint8'))
HAND = {'gw20': h_bow_bamboo, 'gw31': h_bow_silver, 'gc03': h_pendant, 'ga13': h_hat, 'gw07': h_fan, 'gc12': h_kamikazari, 'gt14': h_feather}

def runs(p, n, cells=0):
    """1次元の、物のある所のまとまり（start,stop）を n こにする：cells があれば、まん中の入るます目（はばを cells にわけた）ごとにまとめる（ならんだ肩あてが、となりの物にくっつかない）。のこりは、いちばんせまい空きのとなりどうしをまとめる"""
    on = p > 0; R0 = []; i = 0
    while i < len(on):
        if on[i]:
            j = i
            while j < len(on) and on[j]: j += 1
            R0.append([i, j]); i = j
        else: i += 1
    if cells:
        cw = len(p) / cells; G = {}
        for r in R0: c = int((r[0] + r[1]) / 2 // cw); G[c] = [min(G[c][0], r[0]), max(G[c][1], r[1])] if c in G else r
        R0 = [G[c] for c in sorted(G)]
    while len(R0) > n:
        g = [R0[k + 1][0] - R0[k][1] for k in range(len(R0) - 1)]; k = int(np.argmin(g)); R0[k:k + 2] = [[R0[k][0], R0[k + 1][1]]]
    if len(R0) != n: raise SystemExit('わけられない %d/%d' % (len(R0), n))
    return R0

def boxes(name):
    im = Image.open(os.path.join(D, 'src', name + '.webp')).convert('RGBA'); a = np.array(im); m = a[..., 3] >= TH
    from scipy.ndimage import binary_opening
    m = binary_opening(m, iterations=2)
    out = {}
    for (y0, y1), ids in zip(runs(m.sum(1), len(SHEETS[name])), SHEETS[name]):
        band = m[y0:y1]
        for (x0, x1), k in zip(runs(band.sum(0), len(ids), len(ids) if len(ids) == max(map(len, SHEETS[name])) else 0), ids):
            ys = np.where(band[:, x0:x1].any(1))[0]
            out[k] = (x0 - 2, y0 + ys[0] - 2, x1 + 2, y0 + ys[-1] + 3)
    a[..., 3] = np.where(a[..., 3] >= TH, 255, 0)  # うすいもやをけす
    return Image.fromarray(a, 'RGBA'), out

def build(dst, game=False):
    os.makedirs(dst, exist_ok=True); made = {}
    for name in SHEETS:
        if not os.path.exists(os.path.join(D, 'src', name + '.webp')): print('まだない', name); continue
        src, bx = boxes(name)
        for k, b in bx.items():
            w, h = b[2] - b[0], b[3] - b[1]
            im = pixdown.make(src, b, w=S if w >= h else None, h=S if h > w else None, fix=lambda o, k=k: fishfood_art.tidy(pop(o), k))
            if k in HAND: im = HAND[k](im)
            im.save(os.path.join(dst, k + '.png')); pixdown.compare(src, b, im).save(os.path.join(dst, k + '_cmp.png')); made[k] = im
    if game: put(made)
    return made

def put(made):
    import hashlib, io, re
    js = os.path.join(R, 'js', 'draw-spirits.js'); s = open(js, encoding='utf-8').read()
    for k, im in made.items():
        im = im.resize((im.width * 3, im.height * 3), Image.NEAREST); b = io.BytesIO(); im.save(b, 'WEBP', lossless=True, exact=True); data = b.getvalue()
        name = 'assets/g/' + hashlib.sha1(data).hexdigest()[:10] + '.webp'; open(os.path.join(R, name), 'wb').write(data); key = 'g_' + k
        m = re.search(r"%s:'assets/g/[0-9a-f]+\.webp'," % key, s)
        if m: old = re.search(r"assets/g/[0-9a-f]+\.webp", m.group()).group(); s = s[:m.start()] + "%s:'%s'," % (key, name) + s[m.end():]; (old != name and os.path.exists(os.path.join(R, old)) and os.remove(os.path.join(R, old)))
        else: s = s.replace("const ICONS={", "const ICONS={%s:'%s'," % (key, name), 1)
    open(js, 'w', encoding='utf-8').write(s)

if __name__ == '__main__':
    build(sys.argv[1], '--game' in sys.argv)
