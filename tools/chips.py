#!/usr/bin/env python3
"""マップチップ（chips.js）とアトラスの絵（assets/chips/*.webp）を、作る・ほどくための道具。

  python3 tools/chips.py unpack chips_src.json   # chips.js とアトラス → id ごとの絵（data URI）の JSON
  python3 tools/chips.py pack chips_src.json     # JSON → アトラスの絵（ロスレス WebP）と chips.js
  python3 tools/chips.py replace replace.json    # マップチップ工房の「さしかえた絵」（絵・位置・大きさ）の JSON を入れて、作りなおす
  python3 tools/chips.py kobo <工房のファイルのフォルダ> [id...]  # 工房の g/*.json の、かわったチップだけを書きかえる

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

def load_imgs():
    """chips.js とアトラス → 絵を PIL の絵のまま持つ（ファイルにしないので速い）"""
    head, A, C = load_js()
    pages = [Image.open(os.path.join(ROOT, a)).convert('RGBA') for a in (A or [])]
    def fr(r):
        if isinstance(r, str): return from_uri(r)
        n, x, y, w, h = r
        return pages[n].crop((x, y, x + w, y + h))
    for k, c in C.items():
        c['f'] = [fr(r) for r in c['f']]
        for p in c.get('parts', []) or []: p['f'] = [fr(r) for r in p['f']]
    return head, C

def unpack(dst):
    head, C = load_imgs()
    for k, c in C.items():
        c['f'] = [to_uri(im) for im in c['f']]
        for p in c.get('parts', []) or []: p['f'] = [to_uri(im) for im in p['f']]
    json.dump({'head': head, 'chips': C}, open(dst, 'w', encoding='utf8'), ensure_ascii=False)

def pack(srcf):
    d = json.load(open(srcf, encoding='utf8')); C = d['chips']
    for k, c in C.items():
        c['f'] = [from_uri(u) for u in c['f']]
        for p in c.get('parts', []) or []: p['f'] = [from_uri(u) for u in p['f']]
    pack_imgs(d['head'], C)

def pack_imgs(head, C):
    frames = []
    def add(img):
        frames.append(img); return len(frames) - 1
    for k, c in C.items():
        c['f'] = [add(im) for im in c['f']]
        for p in c.get('parts', []) or []: p['f'] = [add(im) for im in p['f']]
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
    old = set(os.listdir(os.path.join(ROOT, 'assets', 'chips')))
    names = []
    for n, pg in enumerate(pages):
        bbox = pg.getbbox(); pg = pg.crop((0, 0, PAGE, bbox[3] if bbox else 1)) if n == len(pages) - 1 else pg
        b = io.BytesIO(); pg.save(b, 'WEBP', lossless=True, exact=True, quality=100, method=2); data = b.getvalue()  # method 6 は1ページ25秒かかり、小さくもならない
        name = 'assets/chips/' + hashlib.sha1(data).hexdigest()[:10] + '.webp'
        open(os.path.join(ROOT, name), 'wb').write(data); names.append(name)
        chk = Image.open(io.BytesIO(data)).convert('RGBA')
        for i, (pn, x0, y0, w, h) in pos.items():
            if pn == n and chk.crop((x0, y0, x0 + w, y0 + h)).tobytes() != frames[i].convert('RGBA').tobytes():
                raise SystemExit('ちがう絵になった: frame %d' % i)
    for f in old - {os.path.basename(n) for n in names}: os.remove(os.path.join(ROOT, 'assets', 'chips', f))
    for k, c in C.items():
        c['f'] = [list(pos[i]) for i in c['f']]
        for p in c.get('parts', []) or []: p['f'] = [list(pos[i]) for i in p['f']]
    js = head + 'window.CHIPA=' + json.dumps(names) + ';\nwindow.CHIPS=' + json.dumps(C, ensure_ascii=False, separators=(',', ':')) + ';\n'
    open(os.path.join(ROOT, 'chips.js'), 'w', encoding='utf8').write(js)
    print('pages', len(pages), 'frames', len(frames), 'chips.js', len(js))

def replace(repf):
    """工房で書き出した replace.json（{replace:{id:{"j,i":{u,w,h}}}}、j=-1 は本体、それ以外は部品の番号）を入れる。絵の大きさがかわったら w・h もかえる（ax・ay はそのまま）。
    絵は PIL の絵のまま作りなおすので、ぜんぶの絵をファイルにしなおさない。さしかえた id は .chips_changed に書く（kobo で使う）"""
    R = json.load(open(repf, encoding='utf8'))['replace']
    head, C = load_imgs(); n = 0
    for k, m in R.items():
        if k not in C: print('ないチップ:', k); continue
        meta = m.get('meta')
        for s, v in m.items():
            if s == 'meta': continue
            j, i = map(int, s.split(','))
            t = C[k] if j < 0 else (C[k].get('parts') or [])[j]
            im = from_uri(v['u']); t['f'][i] = im
            if (i == 0 or j >= 0) and (t.get('w'), t.get('h')) != im.size: print(k, s, '大きさ', (t.get('w'), t.get('h')), '→', im.size); t['w'], t['h'] = im.size
            n += 1
        if meta:
            c = C[k]; W0, H0 = c['w'], c['h']; W1, H1 = int(meta['w']), int(meta['h'])
            if (W1, H1) != (W0, H0):
                # 大きさをかえる：元の絵から、その大きさで作りなおす（BOX でちぢめる・のばす）。部品も同じ割合で
                rx, ry = W1 / W0, H1 / H0
                c['f'] = [im.resize((W1, H1), Image.BOX) for im in c['f']]
                for p in c.get('parts') or []:
                    pw, ph = max(1, round(p['w'] * rx)), max(1, round(p['h'] * ry))
                    p['f'] = [im.resize((pw, ph), Image.BOX) for im in p['f']]
                    p['ax'] = meta['ax'] + (p['ax'] - c['ax']) * rx; p['ay'] = meta['ay'] + (p['ay'] - c['ay']) * ry; p['w'], p['h'] = pw, ph
                c['w'], c['h'] = W1, H1
            else:
                for p in c.get('parts') or []: p['ax'] += meta['ax'] - c['ax']; p['ay'] += meta['ay'] - c['ay']
            c['ax'], c['ay'] = meta['ax'], meta['ay']; print(k, '置き方', meta); n += 1
    pack_imgs(head, C)
    open(os.path.join(ROOT, '.chips_changed'), 'w').write('\n'.join(k for k in R if k in C)); print('さしかえ', n)

def kobo(dirp, *keys):
    """マップチップ工房の公開ファイル（Artifact の read で index.json と g/*.json をおとしたフォルダ）の、かわったチップだけを、いまの chips.js の絵に書きかえる。
    keys がなければ .chips_changed の id。書きかえた g/*.json と index.json の名前を出す（それだけを公開しなおせばよい）"""
    if not keys: keys = open(os.path.join(ROOT, '.chips_changed')).read().split()
    head, A, C = load_js()
    pages = [Image.open(os.path.join(ROOT, a)).convert('RGBA') for a in (A or [])]
    def uri(r):
        n, x, y, w, h = r; return to_uri(pages[n].crop((x, y, x + w, y + h)))
    idx = json.load(open(os.path.join(dirp, 'index.json'), encoding='utf8')); changed = []
    want = set(); 
    for k in keys: want |= {q for q in C if q == k or q.startswith(k + '.') }
    for g in idx['genres']:
        ks = [q for _, L in g['groups'] for q in L if q in want]
        if not ks: continue
        gp = os.path.join(dirp, g['file'])
        if not os.path.exists(gp): print('ないファイル（さきに Artifact の read でおとす）:', g['file']); continue
        gj = json.load(open(gp, encoding='utf8'))
        for q in ks:
            c = json.loads(json.dumps(C[q])); c['f'] = [uri(r) for r in c['f']]
            for p in c.get('parts', []) or []: p['f'] = [uri(r) for r in p['f']]
            gj['chips'][q] = c
        json.dump(gj, open(gp, 'w', encoding='utf8'), ensure_ascii=False, separators=(',', ':'))
        g['bytes'] = os.path.getsize(gp); changed.append(g['file']); print(g['file'], ks)
    json.dump(idx, open(os.path.join(dirp, 'index.json'), 'w', encoding='utf8'), ensure_ascii=False, separators=(',', ':'))
    print('公開しなおすファイル: index.json', ' '.join(changed))

if __name__ == '__main__':
    {'unpack': unpack, 'pack': pack, 'replace': replace, 'kobo': kobo}[sys.argv[1]](*sys.argv[2:])
