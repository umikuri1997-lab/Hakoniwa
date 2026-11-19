#!/usr/bin/env python3
# せいれいの攻撃のエフェクト（属性ごと：atk_fire・atk_earth・atk_wood・atk_wind・atk_water）を、
# pixelfx（tools/pixelfx）の効果から作る（前は tools/fx-attack.py の手がきの絵）。
# pixelfx で書き出したコマ（1ドット＝世界の1点、1マス32点）を、ゲームのドット絵にととのえる：
#   ・なめらかな光（グロー）は書き出さない（light 0）。のこったうすさは2だん（半分・ぜんぶ）にそろえる
#   ・色は、その属性の明るくやわらかい色の段（opts の色）にそろえる。うすくて暗い色（けむり・もや）はのこさない
#   ・速さ：pixelfx を FPS×step で書き出して、step コマごとに1コマとる（はやくする）。t0〜t1 秒だけ
#   ・大きさ：size（pixelfx の大きさのつまみ）でコワイノ（1〜2マス）に合う大きさに。scale<1 はドットのまま、
#     そのドットの色の多いほうで ちぢめる（なめらかにしない）
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
FPS = 20
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
CANDS = {
    # 火：ほのおの三日月の斬撃（白→だいだい→赤へさめる）と火の粉
    'atk_fire': dict(id='melee/sword-slash', opts={'palette': FIRE, 'sparks': EMBER, 'radius': 24, 'seed': 2}, segs=[(0, .45, .05)], hit=(14, -12)),
    # 土：地面がわれて、とがった岩がつき上がり、石がとぶ
    'atk_earth': dict(id='nature/earth-spike', opts={'palette': SOIL, 'glow': SOILGLOW, 'height': 26, 'seed': 5}, segs=[(.2, .5, .05), (1.45, 2.1, .05)], hit=(0, -8)),
    # 木：つるのむちが地面から出て、しなって、ぴしっとうつ（葉がちる）
    'atk_wood': dict(id='nature/vine-whip', opts={'palette': LEAF, 'thorn': BARK, 'soil': SOIL, 'seed': 3}, segs=[(.1, 1.0, .1)], scale=.5, hit=(None, None)),
    # 風：かまいたち。小さな三日月がつぎつぎに走り、さいごに大きな風の刃
    'atk_wind': dict(id='melee/dagger-flurry', opts={'palette': WIND, 'sparks': WINDS, 'seed': 12}, segs=[(0, .9, .1)], hit=(None, None)),
    # 水：水のたまが落ちて、はじけるかんむりとしぶき
    'atk_water': dict(id='water/splash', opts={'palette': WATER, 'stone': False, 'seed': 3}, segs=[(.08, 1.0, .1)], hit=(0, -8)),
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
    """segs：[(t0, t1, dt)…]。t0〜t1 秒を dt 秒ごとにとって、ゲームでは 1/FPS 秒ごとに出す（dt>1/FPS ならはやく）"""
    o = dict(c['opts']); o['light'] = 0
    subprocess.run(['node', 'tools/render.mjs', c['id'], '--sheet', '--no-actor', '--fps', str(RFPS), '--opts', json.dumps(o)],
                   cwd=PFX, check=True, capture_output=True)
    base = os.path.join(PFX, 'records', c['id'], c['id'].split('/')[1])
    meta = json.load(open(base + '.json'))
    sheet = Image.open(base + '.png').convert('RGBA')
    fr = [sheet.crop((f['frame']['x'], f['frame']['y'], f['frame']['x'] + f['frame']['w'], f['frame']['y'] + f['frame']['h']))
          for f in meta['frames']]
    out = []
    for t0, t1, dt in ([(0, len(fr) / RFPS, .05)] if os.environ.get('FULL') else c['segs']):  # FULL=1：はじめからおわりまで（えらぶとき）
        t = t0
        while t < t1 - 1e-6:
            i = int(round(t * RFPS))
            if i < len(fr): out.append(fr[i])
            t += dt
    return out, meta['meta']['pixelfx']['pivot']

def tidy(im, pal):
    """うすさを2だん・色を候補の色の段に"""
    px = im.load(); W, H = im.size
    near = lambda c: min(pal, key=lambda p: (p[0] - c[0]) ** 2 * 2 + (p[1] - c[1]) ** 2 * 3 + (p[2] - c[2]) ** 2)
    for y in range(H):
        for x in range(W):
            r, g, b, a = px[x, y]
            if a < 40: px[x, y] = (0, 0, 0, 0); continue
            a2 = 128 if a < 150 else 255
            c = near((r, g, b))
            if a2 < 255 and (c[0] * 2 + c[1] * 3 + c[2]) / 6 < 110: px[x, y] = (0, 0, 0, 0); continue
            px[x, y] = c + (a2,)
    return im

def shrink(im, k):
    """ドットのまま 1/k にちぢめる：k×k のマスの中で、いちばん多い色（中身が半分より少なければ透明）"""
    W, H = im.size; w, h = (W + k - 1) // k, (H + k - 1) // k; out = Image.new('RGBA', (w, h)); src = im.load(); o = out.load()
    for y in range(h):
        for x in range(w):
            cnt = {}; n = 0
            for dy in range(k):
                for dx in range(k):
                    X, Y = x * k + dx, y * k + dy
                    if X < W and Y < H and src[X, Y][3]:
                        n += 1; p = src[X, Y]; lum = p[0] * 2 + p[1] * 3 + p[2]
                        cnt[p] = cnt.get(p, 0) + 1 + lum / 4000  # おなじ数なら明るいほう（光の線をのこす）
            if n * 2 >= k * k: o[x, y] = max(cnt, key=cnt.get)
    return out

def build(key):
    c = CANDS[key]
    fr, (pvx, pvy) = render(c)
    pal = palette_of(c['opts'])
    fr = [tidy(f, pal) for f in fr]
    while fr and not fr[-1].getbbox(): fr.pop()
    while fr and not fr[0].getbbox(): fr.pop(0)
    box = None
    for f in fr:
        b = f.getbbox()
        if b: box = b if not box else (min(box[0], b[0]), min(box[1], b[1]), max(box[2], b[2]), max(box[3], b[3]))
    hx_, hy_ = c['hit']
    # 当たる所：書いていなければ、いちばん大きなコマ（ヒットのしゅんかん）の中身のまん中
    if hx_ is None:
        big = max(fr, key=lambda f: f.getchannel('A').histogram()[0] * -1)
        b = big.getbbox(); ax, ay = (b[0] + b[2]) // 2, (b[1] + b[3]) // 2
    else: ax, ay = pvx + hx_, pvy + hy_
    k = int(round(1 / c['scale'])) if c.get('scale') else 1
    x0, y0, x1, y1 = box
    x0 -= (x0 - ax) % k; y0 -= (y0 - ay) % k  # 当たる所がちぢめたドットのさかいにのるように
    fr = [f.crop((x0, y0, x1, y1)) for f in fr]; ax -= x0; ay -= y0
    if k > 1: fr = [shrink(f, k) for f in fr]; ax //= k; ay //= k
    # 1ドットのふちをあける
    fr2 = []
    for f in fr:
        g = Image.new('RGBA', (f.width + 2, f.height + 2)); g.paste(f, (1, 1)); fr2.append(g)
    return fr2, ax + 1, ay + 1

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
