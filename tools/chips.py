#!/usr/bin/env python3
"""マップチップ（chips.js）とアトラスの絵（assets/chips/*.webp）を、作る・ほどくための道具。

  python3 tools/chips.py unpack chips_src.json   # chips.js とアトラス → id ごとの絵（data URI）の JSON
  python3 tools/chips.py pack chips_src.json     # JSON → アトラスの絵（ロスレス WebP）と chips.js

chips.js は、絵の場所だけを持つ：window.CHIPA=[アトラスのファイル]、window.CHIPS={id:{ax,ay,w,h,...,f:[[ページ,x,y,w,h],...]}}。
絵をかえるときは、unpack → JSON を直す → pack。pack は、作った絵が元の絵とドットまで同じかたしかめる。
"""
import sys, json, base64, io, hashlib, os, re, subprocess
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGE = 2048
HEAD_END = 'window.CHIPA='

def load_js():
    src = open(os.path.join(ROOT, 'chips.js'), encoding='utf8').read()
    out = subprocess.run(['node', '-e', "global.window={};eval(require('fs').readFileSync(process.argv[1],'utf8'));process.stdout.write(JSON.stringify({A:window.CHIPA||null,C:window.CHIPS}))", os.path.join(ROOT, 'chips.js')], capture_output=True, text=True, check=True).stdout
    d = json.loads(out)
    head = src[:src.index('window.')]
    return head, d['A'], d['C']

def to_uri(im):
    b = io.BytesIO(); im.save(b, 'WEBP', lossless=True, exact=True, quality=100, method=6)
    return 'data:image/webp;base64,' + base64.b64encode(b.getvalue()).decode()

def from_uri(u):
    return Image.open(io.BytesIO(base64.b64decode(u.split(',', 1)[1]))).convert('RGBA')

def unpack(dst):
    head, A, C = load_js()
    pages = [Image.open(os.path.join(ROOT, a)).convert('RGBA') for a in (A or [])]
    def fr(r):
        if isinstance(r, str): return r
        n, x, y, w, h = r
        return to_uri(pages[n].crop((x, y, x + w, y + h)))
    for k, c in C.items():
        c['f'] = [fr(r) for r in c['f']]
        for p in c.get('parts', []) or []: p['f'] = [fr(r) for r in p['f']]
    json.dump({'head': head, 'chips': C}, open(dst, 'w', encoding='utf8'), ensure_ascii=False)

def pack(srcf):
    d = json.load(open(srcf, encoding='utf8')); head, C = d['head'], d['chips']
    frames = []  # (key, image)
    def add(img):
        frames.append(img); return len(frames) - 1
    refs = {}
    for k, c in C.items():
        c['f'] = [add(from_uri(u)) for u in c['f']]
        for p in c.get('parts', []) or []: p['f'] = [add(from_uri(u)) for u in p['f']]
    order = sorted(range(len(frames)), key=lambda i: (-frames[i].height, -frames[i].width))
    pages, pos = [], {}
    x = y = sh = 0
    for i in order:
        w, h = frames[i].size
        if not pages or x + w > PAGE:
            x = 0; y += sh + 1; sh = 0
        if not pages or y + h > PAGE:
            pages.append(Image.new('RGBA', (PAGE, PAGE), (0, 0, 0, 0))); x = y = sh = 0
        pages[-1].paste(frames[i], (x, y)); pos[i] = (len(pages) - 1, x, y, w, h)
        x += w + 1; sh = max(sh, h)
    os.makedirs(os.path.join(ROOT, 'assets', 'chips'), exist_ok=True)
    for f in os.listdir(os.path.join(ROOT, 'assets', 'chips')):
        os.remove(os.path.join(ROOT, 'assets', 'chips', f))
    names = []
    for n, pg in enumerate(pages):
        bbox = pg.getbbox(); pg = pg.crop((0, 0, PAGE, bbox[3] if bbox else 1)) if n == len(pages) - 1 else pg
        b = io.BytesIO(); pg.save(b, 'WEBP', lossless=True, exact=True, quality=100, method=6); data = b.getvalue()
        name = 'assets/chips/' + hashlib.sha1(data).hexdigest()[:10] + '.webp'
        open(os.path.join(ROOT, name), 'wb').write(data); names.append(name)
        chk = Image.open(io.BytesIO(data)).convert('RGBA')
        for i, (pn, x0, y0, w, h) in pos.items():
            if pn == n and chk.crop((x0, y0, x0 + w, y0 + h)).tobytes() != frames[i].tobytes():
                raise SystemExit('ちがう絵になった: frame %d' % i)
    for k, c in C.items():
        c['f'] = [list(pos[i]) for i in c['f']]
        for p in c.get('parts', []) or []: p['f'] = [list(pos[i]) for i in p['f']]
    js = head + 'window.CHIPA=' + json.dumps(names) + ';\nwindow.CHIPS=' + json.dumps(C, ensure_ascii=False, separators=(',', ':')) + ';\n'
    open(os.path.join(ROOT, 'chips.js'), 'w', encoding='utf8').write(js)
    print('pages', len(pages), 'frames', len(frames), 'chips.js', len(js))

if __name__ == '__main__':
    {'unpack': unpack, 'pack': pack}[sys.argv[1]](sys.argv[2])
