#!/usr/bin/env python3
# せいれいの攻撃のエフェクト（属性ごと：atk_fire・atk_earth・atk_wood・atk_wind・atk_water）を、
# pixelfx（tools/pixelfx）の効果から作る（前は tools/fx-attack.py の手がきの絵）。
# pixelfx で書き出したコマ（1ドット＝世界の1点、1マス32点）を、ゲームのドット絵にととのえる：
#   ・なめらかな光（グロー）は書き出さない（light 0）。のこったうすさは2だん（半分・ぜんぶ）にそろえる
#   ・色は、その属性の明るくやわらかい色の段（opts の色）にそろえる。うすくて暗い色（けむり・もや）はのこさない
#   ・速さ：pixelfx を60コマ／秒で書き出し、times の時刻のコマだけを FPS でならべる（はやく・みじかく。0.4〜0.5秒）
#   ・大きさ：pixelfx の大きさのつまみ（radius・height）でコワイノ（1〜2マス）に合う大きさに。遠くへとぶ物は clip で切る
#   ・中身のある所だけに切りつめ、置く所（ax・ay）は、当たる所 hit（pixelfx の pivot からのずれ）にする。
#     ゲームでは、その点をコワイノの所（en.x*TS, en.y*TS-6）に置き、右向き（相手が左なら反転）
# つかいかた：
#   python3 tools/fx-attack-pfx.py --show <フォルダ>   … たしかめ用の PNG（草の色の上に4倍でコマをならべる）
#   python3 tools/fx-attack-pfx.py --out              … assets/g に書き出して、FXS の行を出す
#   名前（atk_fire など）をならべると、それだけ
from PIL import Image
import hashlib, io, json, os, subprocess, sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
PFX = os.path.join(ROOT, 'tools', 'pixelfx')
FPS = 15  # 1コマ 1/15 秒（0.5〜0.7秒。前は20で、はやすぎて見えなかった）
SCALE = 1.5  # 大きさ：pixelfx の絵を1.5倍に（3倍にのばしてから面積の平均で半分にし、tidy でうすさ・色をドットにそろえる。当たる所・clip も同じだけ）
# 暗い → 明るい（ゲームのほかの絵に合わせた、明るくやわらかい色。いちばん暗い色も黒にしない）
FIRE = ['#b4523c', '#d6683f', '#ec8a4a', '#f8aa58', '#ffcc72', '#ffe8a8', '#fff8e4']
EMBER = ['#fff4c8', '#ffd47a', '#f6a052', '#e0744a']
SOIL = ['#6a4e3a', '#7e5e44', '#957250', '#ac8960', '#c4a276', '#d8bc90', '#e8d4ae', '#f6ead2']
SOILGLOW = ['#957250', '#c4a276', '#e8c27a', '#f6dc9c', '#fff4d8']
LEAF = ['#3f6a34', '#4e7e3c', '#5f9644', '#7cbc58', '#8cd664', '#a8e47a', '#c8f29e', '#ecfcd4']
BARK = ['#6a4e3a', '#8a6648', '#a8845e', '#d0b088']
WIND = ['#6aa6b4', '#86c2cc', '#a2d8de', '#c0eaec', '#dcf6f4', '#f0fcfa', '#ffffff']
WINDS = ['#ffffff', '#e4faf8', '#b4e2e6', '#86c2cc']
WATER = ['#4e86b4', '#5c9ccc', '#6eb2de', '#86c8ec', '#a4dcf4', '#c4ecfa', '#e4f6fe', '#ffffff']
# times：pixelfx の時刻（秒）を、ゲームで 1/FPS 秒ずつ出す順にならべる（とばして、はやく・みじかくする）
# hit：当たる所（ゲームでコワイノの所に置く点）。('pv', dx, dy)＝pixelfx の pivot から、('hot', i, dx, dy)＝i コマめの、いちばん明るい色のまん中から
# clip：(rx, up, dn)＝当たる所から、よこ rx・上 up・下 dn より外の物はのこさない（遠くへとぶ石・ひろがる輪を切る）
# fade：さいごの何コマを、ます目のならびで消していくか。mist：うすい所（半分のうすさ）を、この明るさより暗ければ消す
def ts(*a): return list(a)
CANDS = {
    # 火：ほのおの三日月の斬撃（白→だいだい→赤へさめる）と火の粉。2コマめで当たって、のこりはさめていく
    'atk_fire': dict(id='melee/sword-slash', opts={'palette': FIRE, 'sparks': EMBER, 'radius': 24, 'seed': 2},
                     times=ts(.03, .07, .1, .13, .17, .22, .27, .32, .38), hit=('hot', 1, -6, 6), clip=(34, 34, 18), fade=3),
    # 土：地面がわれて光り、とがった岩がつき上がり（ここで当たる）、石がはじけてとぶ → 岩がわれて、地面へしずむ
    'atk_earth': dict(id='nature/earth-spike', opts={'palette': SOIL, 'glow': SOILGLOW, 'height': 30, 'seed': 5},
                      times=ts(.2, .3, .35, .4, .48, 1.58, 1.66, 1.78, 1.95, 2.2), hit=('pv', 0, -10), clip=(30, 36, 6), fade=2, mist=150),
    # 木：つるのむちが地面から出て、うしろへしなり、ぴしっとうつ（葉がちる）→ 地面へもどる
    'atk_wood': dict(id='nature/vine-whip', opts={'palette': LEAF, 'thorn': BARK, 'soil': SOIL, 'seed': 3},
                     times=ts(.15, .3, .45, .55, .6, .65, .72, .85, 1.05, 1.25), hit=('hot', 4, 0, 2), fade=2),
    # 風：かまいたち。小さな風の三日月がつぎつぎに走り、さいごに大きな風の刃がよこにぬける
    'atk_wind': dict(id='melee/dagger-flurry', opts={'palette': WIND, 'sparks': WINDS, 'seed': 12},
                     times=ts(.07, .13, .2, .3, .4, .43, .47, .53, .62, .72), hit=('pv', 32, -24), clip=(44, 36, 30), fade=2),
    # 水：水がはじけて、かんむりと しぶき、足もとに水の輪
    'atk_water': dict(id='water/splash', opts={'palette': WATER, 'stone': False, 'seed': 3},
                      times=ts(.16, .19, .22, .26, .3, .35, .41, .48), hit=('pv', 0, -10), clip=(40, 44, 10), fade=2, mist=235),
}

def hx(s):
    s = s.lstrip('#')
    if len(s) == 3: s = ''.join(c * 2 for c in s)
    return tuple(int(s[i:i + 2], 16) for i in (0, 2, 4))

def palette_of(opts):
    cols = set()
    for v in opts.values():
        if isinstance(v, list): cols |= {hx(c) for c in v}
        elif isinstance(v, str) and v.startswith('#'): cols.add(hx(v))
    return sorted(cols)

RFPS = 60  # pixelfx は 60 コマ／秒で書き出して、そこから時刻でえらぶ

def render(c):
    """times の時刻のコマを、その順に"""
    o = dict(c['opts']); o['light'] = 0
    subprocess.run(['node', 'tools/render.mjs', c['id'], '--sheet', '--no-actor', '--fps', str(RFPS), '--opts', json.dumps(o)],
                   cwd=PFX, check=True, capture_output=True)
    base = os.path.join(PFX, 'records', c['id'], c['id'].split('/')[1])
    meta = json.load(open(base + '.json'))
    sheet = Image.open(base + '.png').convert('RGBA')
    fr = [sheet.crop((f['frame']['x'], f['frame']['y'], f['frame']['x'] + f['frame']['w'], f['frame']['y'] + f['frame']['h']))
          for f in meta['frames']]
    out = []
    tl = [k * .05 for k in range(int(len(fr) / RFPS / .05))] if os.environ.get('FULL') else c['times']  # FULL=1：はじめからおわりまで（えらぶとき）
    for t in tl:
        i = int(round(t * RFPS))
        if i < len(fr): out.append(fr[i])
    return out, meta['meta']['pixelfx']['pivot']

BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]

def tidy(im, pal, mist=110, keep=1.):
    """うすさを2だん・色を候補の色の段に。keep<1 のときは、ます目のならびで消していく（おわりのフェード）"""
    px = im.load(); W, H = im.size
    near = lambda c: min(pal, key=lambda p: (p[0] - c[0]) ** 2 * 2 + (p[1] - c[1]) ** 2 * 3 + (p[2] - c[2]) ** 2)
    for y in range(H):
        for x in range(W):
            r, g, b, a = px[x, y]
            if a < 40 or BAYER[y % 4][x % 4] >= keep * 16: px[x, y] = (0, 0, 0, 0); continue
            a2 = 128 if a < 150 else 255
            c = near((r, g, b))
            if a2 < 255 and (c[0] * 2 + c[1] * 3 + c[2]) / 6 < mist: px[x, y] = (0, 0, 0, 0); continue
            px[x, y] = c + (a2,)
    return im

def build(key):
    c = CANDS[key]
    fr, (pvx, pvy) = render(c)
    if SCALE != 1:
        fr = [f.resize((f.width * 3, f.height * 3), Image.NEAREST).resize((round(f.width * SCALE), round(f.height * SCALE)), Image.BOX) for f in fr]
        pvx, pvy = pvx * SCALE, pvy * SCALE
    pal = palette_of(c['opts']); n = len(fr); fd = c.get('fade', 0)
    fr = [tidy(f, pal, c.get('mist', 110), 1. if i < n - fd or os.environ.get('FULL') else (n - i) / (fd + 1)) for i, f in enumerate(fr)]
    h = c['hit']
    if h[0] == 'hot':  # その コマの、いちばん明るい色（光るしゅんかんの白）のまん中
        f = fr[h[1]]; px = f.load(); top = max(sum(px[x, y][:3]) for y in range(f.height) for x in range(f.width) if px[x, y][3])
        pts = [(x, y) for y in range(f.height) for x in range(f.width) if px[x, y][3] and sum(px[x, y][:3]) >= top - 6]
        ax = round(sum(p[0] for p in pts) / len(pts) + h[2] * SCALE); ay = round(sum(p[1] for p in pts) / len(pts) + h[3] * SCALE)
    else: ax, ay = round(pvx + h[1] * SCALE), round(pvy + h[2] * SCALE)
    if c.get('clip') and not os.environ.get('FULL'):  # 当たる所から遠い物は切る
        rx, up, dn = (v * SCALE for v in c['clip'])
        for f in fr:
            px = f.load()
            for y in range(f.height):
                for x in range(f.width):
                    if abs(x - ax) > rx or y < ay - up or y > ay + dn: px[x, y] = (0, 0, 0, 0)
    while fr and not fr[-1].getbbox(): fr.pop()
    while fr and not fr[0].getbbox(): fr.pop(0)
    box = None
    for f in fr:
        b = f.getbbox()
        if b: box = b if not box else (min(box[0], b[0]), min(box[1], b[1]), max(box[2], b[2]), max(box[3], b[3]))
    x0, y0, x1, y1 = box[0] - 1, box[1] - 1, box[2] + 1, box[3] + 1  # 1ドットのふちをあける
    fr = [f.crop((x0, y0, x1, y1)) for f in fr]
    return fr, ax - x0, ay - y0

def sheet_of(fr):
    w, h = fr[0].size; s = Image.new('RGBA', (w * len(fr), h))
    for i, f in enumerate(fr): s.paste(f, (i * w, 0))
    return s

def show(key, d, fr, ax, ay):
    """草の色の上に4倍でコマをならべる。当たる所（ax・ay）に小さな赤い点、コワイノ1マスのわく（32点）をうすく"""
    os.makedirs(d, exist_ok=True)
    w, h = fr[0].size; Z = 4; G = 4
    C = 8 if w < 120 else 4; R = (len(fr) + C - 1) // C
    out = Image.new('RGBA', ((w + G) * min(C, len(fr)) * Z, (h + G) * R * Z), (40, 40, 40, 255))
    for i, f in enumerate(fr):
        bg = Image.new('RGBA', (w, h), (110, 150, 90, 255))
        px = bg.load()
        for t in range(-16, 16):  # 1マスのわく（コワイノのまん中が ax,ay）
            for (x, y) in ((ax + t, ay - 16), (ax + t, ay + 15), (ax - 16, ay + t), (ax + 15, ay + t)):
                if 0 <= x < w and 0 <= y < h: px[x, y] = (96, 132, 78, 255)
        bg.alpha_composite(f)
        if 0 <= ax < w and 0 <= ay < h: bg.putpixel((ax, ay), (220, 40, 40, 255))
        out.paste(bg.resize((w * Z, h * Z), Image.NEAREST), ((i % C) * (w + G) * Z, (i // C) * (h + G) * Z))
    out.save(os.path.join(d, 'fx_%s.png' % key))

if __name__ == '__main__':
    keys = [a for a in sys.argv[1:] if a in CANDS] or list(CANDS)
    for key in keys:
        fr, ax, ay = build(key)
        if '--show' in sys.argv: show(key, sys.argv[sys.argv.index('--show') + 1], fr, ax, ay)
        if '--out' in sys.argv:
            b = io.BytesIO(); sheet_of(fr).save(b, 'WEBP', lossless=True, exact=True); data = b.getvalue()
            name = hashlib.sha1(data).hexdigest()[:10] + '.webp'
            open(os.path.join(ROOT, 'assets', 'g', name), 'wb').write(data)
            w, h = fr[0].size
            print('"%s":' % key + json.dumps(dict(src='assets/g/' + name, w=w, h=h, n=len(fr), fps=FPS, ax=ax, ay=ay), separators=(',', ':')))
        print(key, fr[0].size, len(fr), 'frames', '%.2fs' % (len(fr) / FPS), ax, ay, file=sys.stderr)
