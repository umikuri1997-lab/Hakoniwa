"""せいれいの動きの絵を作る（spirit3d）。
  python3 tools/art/spirit3d/build.py                 → ぜんぶの動き：assets/g/<中身の名前>.webp（動きごとに1まい）と js/spirit-motions.js を作る
  python3 tools/art/spirit3d/build.py walk play_swing → その動きだけ作りなおす（ほかの動きは、いまの js/spirit-motions.js のまま）
  --dbg <フォルダ>                                     → たしかめ用に、動きごとの絵（大きくした物）も出す
  --els wood                                           → その属性だけ（たしかめ用。js は書かない）
絵のならび：動きごとに1まい。属性ごとに3行（正面・横・うしろ）× コマ数。わくは属性ごとに、その属性のぜんぶのコマの絵が入る大きさ。
js/spirit-motions.js：SPM = {動きの名前: {src, n（コマ数）, r（速さ。'ph' は o.ph）, g（属性ごとの [絵の中の上, わくのはば, 高さ, わくの左上 x, y]）,
  e（属性ごと・向きごと・コマごとの [目のずれ x, y]）, h（向きごと・コマごとの [手前の手 x, y, 奥の手 x, y]、道具の先があれば [.., 先 x, y]）}}"""
import sys, os, io, json, hashlib, re
from multiprocessing import Pool
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from core import ROOT, ELS, EXT, Spirit
from motions import MOTIONS
import rig

_SP = {}
def job(a):
    name, el = a; sp = _SP.get(el) or _SP.setdefault(el, Spirit(el)); m = MOTIONS[name]; n = m['n']
    fr = {}; meta = {}
    for face in (0, 1, 2):
        for i in range(n):
            w = 2*np.pi*i/n; img, A = rig.shoot(sp, face, m['f'](w, face)); fr[(face, i)] = img; meta[(face, i)] = A
    return name, el, fr, meta

def pack(name, res):
    n = MOTIONS[name]['n']; box = {}
    for el in ELS:
        al = np.stack([f[..., 3] > 0 for f in res[el][0].values()]).any(0); ys, xs = np.nonzero(al)
        box[el] = (int(xs.min()), int(xs.max())+1, int(ys.min()), int(ys.max())+1)
    W = max(b[1]-b[0] for b in box.values())*n; H = sum((b[3]-b[2])*3 for b in box.values())
    sheet = np.zeros((H, W, 4), np.uint8); geo = {}; eye = {}; y = 0
    for el in ELS:
        x0, x1, y0, y1 = box[el]; cw, ch = x1-x0, y1-y0
        for face in range(3):
            for i in range(n): sheet[y+face*ch:y+(face+1)*ch, i*cw:(i+1)*cw] = res[el][0][(face, i)][y0:y1, x0:x1]
        geo[el] = [y, cw, ch, int(EXT[0]+x0), int(EXT[2]+y0)]; y += ch*3
        eye[el] = [[res[el][1][(face, i)]['eye'] for i in range(n)] for face in range(3)]
    A = res['wood'][1]   # 手・道具の先の場所（属性によらない）
    def hands(a):
        v = a['handN']+a['handF']
        for k in ('tipN', 'tipF'):
            if k in a: v = v+a[k]
        return [round(x, 1) for x in v]
    hd = [[hands(A[(face, i)]) for i in range(n)] for face in range(3)]
    return Image.fromarray(sheet), {'n': n, 'r': MOTIONS[name]['rate'], 'g': geo, 'e': eye, 'h': hd}

def main():
    args = sys.argv[1:]; dbg = None; els = ELS
    if '--dbg' in args: i = args.index('--dbg'); dbg = args[i+1]; del args[i:i+2]; os.makedirs(dbg, exist_ok=True)
    if '--els' in args: i = args.index('--els'); els = args[i+1].split(','); del args[i:i+2]
    names = args or list(MOTIONS)
    jobs = [(n, e) for n in names for e in els]
    with Pool(min(4, os.cpu_count() or 1)) as pool:
        out = {}
        for name, el, fr, meta in pool.imap_unordered(job, jobs):
            out.setdefault(name, {})[el] = (fr, meta); print(name, el, flush=True)
    if els != ELS:   # たしかめだけ
        for name in names:
            for el in els:
                fr = out[name][el][0]; n = MOTIONS[name]['n']; Wc = EXT[1]-EXT[0]; Hc = EXT[3]-EXT[2]
                sh = Image.new('RGBA', (Wc*n, Hc*3), (200, 220, 180, 255))
                for (face, i), f in fr.items(): sh.alpha_composite(Image.fromarray(f), (i*Wc, face*Hc))
                sh.save(os.path.join(dbg or '.', f'{name}_{el}.png'))
        return
    jsf = os.path.join(ROOT, 'js', 'spirit-motions.js'); old = {}
    if os.path.exists(jsf):
        m = re.search(r'const SPM=(\{.*\});', open(jsf, encoding='utf8').read(), re.S)
        if m: old = json.loads(m.group(1))
    for name in names:
        img, data = pack(name, out[name])
        b = io.BytesIO(); img.save(b, 'WEBP', lossless=True, exact=True, quality=100, method=6); raw = b.getvalue()
        src = 'assets/g/'+hashlib.sha1(raw).hexdigest()[:10]+'.webp'
        if name in old and old[name]['src'] != src and os.path.exists(os.path.join(ROOT, old[name]['src'])): os.remove(os.path.join(ROOT, old[name]['src']))
        open(os.path.join(ROOT, src), 'wb').write(raw); data['src'] = src; old[name] = data
        if dbg: img.save(os.path.join(dbg, name+'.png'))
        print(name, src, img.size, len(raw), 'bytes')
    for k in [k for k in old if k not in MOTIONS]:   # なくした動き
        if os.path.exists(os.path.join(ROOT, old[k]['src'])): os.remove(os.path.join(ROOT, old[k]['src']))
        del old[k]
    body = json.dumps({k: old[k] for k in sorted(old)}, separators=(',', ':'), ensure_ascii=False)
    open(jsf, 'w', encoding='utf8').write('/* せいれいの動き（3Dから写した絵）。tools/art/spirit3d/build.py が書く。手で書きかえない */\nconst SPM='+body+';\n')

if __name__ == '__main__':
    main()
