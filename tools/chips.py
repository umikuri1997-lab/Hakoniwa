#!/usr/bin/env python3
"""マップチップ（chips.js）とアトラスの絵（assets/chips/*.webp）を、作る・ほどくための道具。

  python3 tools/chips.py unpack chips_src.json   # chips.js とアトラス → id ごとの絵（data URI）の JSON
  python3 tools/chips.py pack chips_src.json     # JSON → アトラスの絵（ロスレス WebP）と chips.js
  python3 tools/chips.py replace replace.json    # マップチップ工房の「さしかえた絵」（絵・位置・大きさ）の JSON を入れて、作りなおす
  python3 tools/chips.py kobo <工房のファイルのフォルダ> [id...]
  python3 tools/chips.py kobo-extra <工房のファイルのフォルダ> <kobo_extra.js の出力.json>  # チップでない絵（ヌシ様・アイテムなど）のジャンルを書く  # 工房の g/*.json の、かわったチップだけを書きかえる

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

OUTL = 24    # 色をへらしたとき、1つの色がこれより大きく（RGB のどれかで）ずれないようにする
NCOL = 256   # 1つの物（id の : と # の前が同じ物：向き・コマ・開け閉め・つなぎの部品）の色の数の上限。うすさ（アルファ）は数えない・かえない

def cap_colors(ims, n=NCOL):
    """いくつかの絵（同じ物のコマ・部品）を、あわせて n 色（RGB）までにする。
    メディアンカットで n 色をえらび、k-means（色ごとの数でおもみ）で元の色の平均に近づける。数の少ない、はなれた色（目・光など）が OUTL より大きくずれるときは、その色をそのまま入れる。ディザなし。うすさはそのまま。
    n 色以下なら、そのままかえす"""
    import numpy as np
    A = [np.array(im.convert('RGBA')) for im in ims]
    px = np.concatenate([a[..., :3][a[..., 3] > 0] for a in A]) if A else np.zeros((0, 3), np.uint8)
    if len(px) == 0: return ims
    U, inv, cnt = np.unique(px, axis=0, return_inverse=True, return_counts=True)
    if len(U) <= n: return ims
    strip = Image.fromarray(px.reshape(1, -1, 3))
    P = np.unique(np.array(strip.quantize(n, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert('RGB')).reshape(-1, 3), axis=0).astype(float)
    X = U.astype(float); w = cnt.astype(float); xx = (X * X).sum(1)[:, None]
    D = lambda P: xx - 2 * X @ P.T + (P * P).sum(1)[None]
    pin = np.zeros(len(P), bool)   # はなれた色のために入れた色（k-means で動かさない）
    for rnd in range(48):
        for _ in range(15 if rnd == 0 else 4):
            l = D(P).argmin(1)
            s = np.zeros_like(P); np.add.at(s, l, X * w[:, None]); c = np.bincount(l, weights=w, minlength=len(P))
            P = np.where((c[:, None] > 0) & ~pin[:, None], s / np.maximum(c, 1e-9)[:, None], P)
        l = D(P).argmin(1); e = np.abs(X - P[l]).max(1)
        bad = np.where(e > OUTL)[0]
        if not len(bad): break
        # いちばん大きくずれた色（数が多いほど先）を、使われ方のいちばん少ない色とおきかえる
        b = bad[np.argmax(e[bad] * np.sqrt(w[bad]))]
        c = np.bincount(l, weights=w, minlength=len(P)); c[pin] = np.inf
        j = int(np.argmin(c)); P[j] = X[b]; pin[j] = True
    P = np.clip(np.round(P), 0, 255).astype(np.uint8)
    l = D(P.astype(float)).argmin(1)
    newU = P[l]; newpx = newU[inv.ravel()]; out = []; o0 = 0
    for a in A:
        m = a[..., 3] > 0; o = a.copy(); k = int(m.sum())
        o[..., :3][m] = newpx[o0:o0 + k]; o0 += k
        out.append(Image.fromarray(o, 'RGBA'))
    return out

SOLO = {'story', 'crop', 'tex'}   # : の前が同じでも、べつべつの物（物語の絵・作物・地面のテクスチャ）

def cap_all(C, n=NCOL):
    """チップを、物ごと（id の : と # の前）に n 色までにする。へらした物の名前の一覧をかえす"""
    G = {}
    for k in C:
        b = re.split(r'[:#]', k)[0]
        G.setdefault(k.split('#')[0] if b in SOLO else b, []).append(k)
    done = []
    for g, ks in G.items():
        refs = [(C[k], 'f', i) for k in ks for i in range(len(C[k]['f']))] + [(p, 'f', i) for k in ks for p in (C[k].get('parts') or []) for i in range(len(p['f']))]
        ims = [o[f][i] for o, f, i in refs]
        new = cap_colors(ims, n)
        if new is ims: continue
        for (o, f, i), im in zip(refs, new): o[f][i] = im
        done.append(g)
    return done

def pack_imgs(head, C):
    capped = cap_all(C)   # 物ごとに256色まで（新しい絵も、ここでかならずへる）
    if capped: print('256色までにした:', len(capped), ' '.join(capped[:20]) + (' …' if len(capped) > 20 else ''))
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
    have = {q for g in idx['genres'] for _, L in g['groups'] for q in L}
    for q in sorted(want - have):   # 工房にまだない新しい絵（向きの絵 id>1 など）は、もとの id のグループに足す
        b = re.split(r'[>:#@~.]', q)[0]
        for g in idx['genres']:
            grp = next((G for G in g['groups'] if G[0] == b), None)
            if grp: grp[1].append(q); g['count'] = g.get('count', 0) + 1; break
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

EXTRA_GENRES = {'nushi': 'ヌシ様', 'items': 'アイテム', 'codeart': 'コードで描く物', 'progart': 'プログラムの絵', 'bubble': 'ふきだしのアイコン'}

EXTRA_GROUPS = {'nushi': '草原のヌシ様', 'nushi2': '火のヌシ様', 'nushi_old': '草原のヌシ様（前の絵）', 'mat': '素材', 'food': '食べ物', 'gear': 'そうび', 'ammo': '矢', 'seed': 'たね',
    'tool': 'カミサマの道具・UI', 'code': '家具・建物（コードの絵）', 'pspr': '建物・道具', 'art': '花・木・岩', 'crop': '作物', 'spr': 'カミサマ・ベッド', 'kgs': 'コワイノ',
    'festa': 'おまつり', 'fx': 'エフェクト', 'emo': 'ふきだし', 'ui': 'UIのアイコン', 'bubart': 'ふきだしのアイコン（もらった絵）'}

def kobo_extra(dirp, extf):
    """tools/kobo_extra.js で書き出した、チップでない絵を、工房のジャンル（EXTRA_GENRES）として g/<ジャンル>.json に書き、index.json に足す（同じジャンルは書きかえ）。
    絵は、画質を落とさない WebP にする"""
    E = json.load(open(extf, encoding='utf8'))
    idx = json.load(open(os.path.join(dirp, 'index.json'), encoding='utf8')); idx.setdefault('names', {})
    gs = [g for g in idx['genres'] if g['id'] not in EXTRA_GENRES]; changed = []
    for gid, label in EXTRA_GENRES.items():
        ks = [k for k in E if E[k]['genre'] == gid]
        if not ks: continue
        chips, groups = {}, {}
        for k in ks:
            e = E[k]; chips[k] = {'ax': e['ax'], 'ay': e['ay'], 'w': e['w'], 'h': e['h'], 'g': e['g'], 'f': [to_uri(from_uri(u)) for u in e['f']]}
            groups.setdefault(e['group'], []).append(k); idx['names'][k] = e['name']
        idx.setdefault('gnames', {}).update({g: EXTRA_GROUPS[g] for g in groups if g in EXTRA_GROUPS})
        fn = 'g/' + gid + '.json'; gp = os.path.join(dirp, fn); os.makedirs(os.path.dirname(gp), exist_ok=True)
        json.dump({'chips': chips}, open(gp, 'w', encoding='utf8'), ensure_ascii=False, separators=(',', ':'))
        gs.append({'id': gid, 'label': label, 'parent': gid, 'plabel': label, 'part': 0, 'file': fn, 'bytes': os.path.getsize(gp), 'count': len(ks), 'groups': [[g, L] for g, L in groups.items()]})
        changed.append(fn); print(fn, len(ks))
    idx['genres'] = gs
    json.dump(idx, open(os.path.join(dirp, 'index.json'), 'w', encoding='utf8'), ensure_ascii=False, separators=(',', ':'))
    print('公開しなおすファイル: index.json', ' '.join(changed))

if __name__ == '__main__':
    {'unpack': unpack, 'pack': pack, 'replace': replace, 'kobo': kobo, 'kobo-extra': kobo_extra}[sys.argv[1]](*sys.argv[2:])
