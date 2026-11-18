#!/usr/bin/env python3
# 守り神のわざのエフェクト（まもりの光 godlight・こもれびのまもり areaguard / arealeaf・葉のかべ leafsprout）を、
# pixelfx（tools/pixelfx）の効果から作る。pixelfx で書き出したコマ（1ドット＝世界の1点、1マス32点）を、ゲームのドット絵にととのえる：
#   ・なめらかな光（グロー）は書き出さない（light 0）。のこったうすさは2だん（半分・ぜんぶ）にそろえる
#   ・色は、その候補の色の段（opts の色）にそろえる。うすくて暗い色（けむり・もや）はのこさない
#   ・中身のある所だけに切りつめ、置く所（ax・ay）を pixelfx の pivot から出す
# つかいかた：
#   python3 tools/fx-guard-pfx.py <名前:候補> --show <フォルダ>   … たしかめ用の GIF（草地・夜の上に3倍）
#   python3 tools/fx-guard-pfx.py <名前:候補> --out              … assets/g に書き出して、FXS の行を出す
from PIL import Image
import hashlib, io, json, os, subprocess, sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
PFX = os.path.join(ROOT, 'tools', 'pixelfx')
FPS = 20
# 暗い → 明るい
GOLD = ['#9a7442', '#c8954e', '#e2b054', '#f6ce6c', '#ffe08a', '#ffec96', '#fff6c8', '#fffdf0']
GREEN = ['#3f6a34', '#5f9644', '#7cbc58', '#8cd664', '#a8e47a', '#c4f29c', '#dcf8c0', '#fbfff2']
SOIL = ['#6a5038', '#8a6a48', '#a88a62', '#c4a87c', '#dcc49a', '#ecdcb8', '#f6ecd4', '#fffaf0']
CANDS = {
    # まもりの光
    'godlight:A': dict(id='holy/smite', opts={'palette': GOLD, 'stone': '#f6ce6c'}, t1=1.3),
    'godlight:B': dict(id='pickups/collect-burst', opts={'palette': GOLD}, t1=1.2),
    'godlight:C': dict(id='impacts/crit-hit', opts={'palette': GOLD}, t1=.9),
    # こもれびのまもり（まん中）
    'areaguard:A': dict(id='holy/heal-aoe', opts={'palette': GREEN, 'reach': 56}, t1=2.2),
    'areaguard:B': dict(id='nature/leaf-storm', opts={'palette': GREEN[2:], 'leaves': GREEN[:4] * 3}, t1=1.2, fade=6),
    'areaguard:C': dict(id='nature/healing-bloom', opts={'palette': GREEN, 'petal': GREEN[3:7], 'heart': GOLD[2:6]}, t1=2.0, fade=6),
    # こもれびのまもり（はんいのふち。ゲームでふちの円にならべる）
    'arealeaf:A': dict(id='nature/thorns', opts={'palette': GREEN, 'glow': GREEN[1:8:2], 'soil': SOIL, 'count': 1}, t1=1.6, fit=.9),
    'arealeaf:B': dict(id='pickups/collect-burst', opts={'palette': GREEN}, t1=1.0),
    # 葉のかべ（生えるマス）
    'leafsprout:A': dict(id='nature/thorns', opts={'palette': GREEN, 'glow': GREEN[1:8:2], 'soil': SOIL, 'count': 2}, t1=1.6, fit=.9),
    'leafsprout:B': dict(id='nature/healing-bloom', opts={'palette': GREEN, 'petal': GREEN[3:7], 'heart': GOLD[2:6]}, t1=1.6, fade=6),
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
    cols.add((255, 253, 240))
    return sorted(cols)

def render(c):
    o = dict(c['opts']); o['light'] = 0
    subprocess.run(['node', 'tools/render.mjs', c['id'], '--sheet', '--no-actor', '--fps', str(FPS), '--opts', json.dumps(o)],
                   cwd=PFX, check=True, capture_output=True)
    base = os.path.join(PFX, 'records', c['id'], c['id'].split('/')[1])
    meta = json.load(open(base + '.json'))
    sheet = Image.open(base + '.png').convert('RGBA')
    fr = [sheet.crop((f['frame']['x'], f['frame']['y'], f['frame']['x'] + f['frame']['w'], f['frame']['y'] + f['frame']['h']))
          for f in meta['frames']]
    n = min(len(fr), int(round(c['t1'] * FPS)))
    return fr[:n], meta['meta']['pixelfx']['pivot']

BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]

def tidy(im, pal, keep=1.):
    """うすさを2だん・色を候補の色の段に。keep<1 のときは、ます目のならびで消していく（おわりのフェード）"""
    px = im.load(); W, H = im.size
    near = lambda c: min(pal, key=lambda p: (p[0] - c[0]) ** 2 * 2 + (p[1] - c[1]) ** 2 * 3 + (p[2] - c[2]) ** 2)
    for y in range(H):
        for x in range(W):
            r, g, b, a = px[x, y]
            if a < 40 or BAYER[y % 4][x % 4] >= keep * 16: px[x, y] = (0, 0, 0, 0); continue
            a2 = 128 if a < 150 else 255
            c = near((r, g, b))
            if a2 < 255 and (c[0] * 2 + c[1] * 3 + c[2]) / 6 < 110: px[x, y] = (0, 0, 0, 0); continue
            px[x, y] = c + (a2,)
    return im

def build(key):
    c = CANDS[key]
    fr, (pvx, pvy) = render(c)
    if c.get('below'):  # 足もとの所だけ（pivot から上 below ドットより下）
        fr = [f.crop((0, pvy - c['below'], f.width, f.height)) for f in fr]; pvy = c['below']
    pal = palette_of(c['opts']); fd = c.get('fade', 0); n = len(fr)
    fr = [tidy(f, pal, 1. if i < n - fd else (n - i) / (fd + 1)) for i, f in enumerate(fr)]
    if c.get('fit'):  # よこは、育ちきったコマ（t=fit 秒）の中身のはばだけにする（地面のすじ・とびちる物を切る）
        f0 = fr[min(n - 1, int(c['fit'] * FPS))]; b = f0.crop((0, 0, f0.width, pvy - 20)).getbbox()  # 高い所（いちばん大きな芽）だけ
        fr = [f.crop((b[0] - 10, 0, b[2] + 10, f.height)) for f in fr]; pvx = (b[2] - b[0]) // 2 + 10  # 置く所は、その芽のまん中
    while fr and not fr[-1].getbbox(): fr.pop()
    while fr and not fr[0].getbbox(): fr.pop(0)
    box = None
    for f in fr:
        b = f.getbbox()
        if b: box = b if not box else (min(box[0], b[0]), min(box[1], b[1]), max(box[2], b[2]), max(box[3], b[3]))
    x0, y0, x1, y1 = box[0] - 1, box[1] - 1, box[2] + 1, box[3] + 1
    fr = [f.crop((x0, y0, x1, y1)) for f in fr]
    return fr, pvx - x0, pvy - y0

def sheet_of(fr):
    w, h = fr[0].size; s = Image.new('RGBA', (w * len(fr), h))
    for i, f in enumerate(fr): s.paste(f, (i * w, 0))
    return s

def show(key, d, fr, ax, ay):
    os.makedirs(d, exist_ok=True)
    w, h = fr[0].size; Z = 3; out = []
    for f in fr + [Image.new('RGBA', (w, h))] * 6:
        row = Image.new('RGBA', (w * 2 + 8, h), (0, 0, 0, 255))
        row.paste(Image.new('RGBA', (w, h), (126, 170, 84, 255)), (0, 0))    # 草地
        row.paste(Image.new('RGBA', (w, h), (36, 44, 66, 255)), (w + 8, 0))  # 夜
        for ox in (0, w + 8):
            l = Image.new('RGBA', row.size); l.paste(f, (ox, 0)); row.alpha_composite(l)
        out.append(row.convert('RGB').resize((row.size[0] * Z, h * Z), Image.NEAREST))
    out[0].save(os.path.join(d, key.replace(':', '-') + '.gif'), save_all=True, append_images=out[1:], duration=1000 // FPS, loop=0)

if __name__ == '__main__':
    key = sys.argv[1]
    fr, ax, ay = build(key)
    if '--show' in sys.argv: show(key, sys.argv[sys.argv.index('--show') + 1], fr, ax, ay)
    if '--out' in sys.argv:
        b = io.BytesIO(); sheet_of(fr).save(b, 'WEBP', lossless=True, exact=True); data = b.getvalue()
        name = hashlib.sha1(data).hexdigest()[:10] + '.webp'
        open(os.path.join(ROOT, 'assets', 'g', name), 'wb').write(data)
        w, h = fr[0].size
        print('"%s":' % key.split(':')[0] + json.dumps(dict(src='assets/g/' + name, w=w, h=h, n=len(fr), fps=FPS, ax=ax, ay=ay), separators=(',', ':')))
    print(key, fr[0].size, len(fr), 'frames', ax, ay)
