"""せいれいの動きの絵を作る（spirit3d）。
  python3 tools/art/spirit3d/build.py                 → ぜんぶの動き：assets/g/<中身の名前>.webp（動きごとに1まい）と js/spirit-motions.js を作る
  python3 tools/art/spirit3d/build.py walk play_swing → その動きだけ作りなおす（ほかの動きは、いまの js/spirit-motions.js のまま）
  --dbg <フォルダ>                                     → たしかめ用に、動きごとの絵（大きくした物）も出す
  --els wood                                           → その属性だけ（たしかめ用。js は書かない）
絵のならび：動きと属性ごとに1まい（ゲームは、使う動き・属性の絵だけ読みこむ）。3行（正面・横・うしろ）× コマ数。わくは、そのぜんぶのコマの絵が入る大きさ。
js/spirit-motions.js：SPM = {動きの名前: {s（属性ごとの絵）, n（コマ数）, r（速さ。'ph' は o.ph）, g（属性ごとの [わくのはば, 高さ, わくの左上 x, y]）,
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
    """1つの動き・属性：絵（PNG のまま）と、わく・目・手の場所"""
    name, el = a; sp = _SP.get(el) or _SP.setdefault(el, Spirit(el)); m = MOTIONS[name]; n = m['n']
    fr = {}; meta = {}
    for face in (0, 1, 2):
        for i in range(n):
            w = 2*np.pi*i/n; img, A = rig.shoot(sp, face, m['f'](w, face)); fr[(face, i)] = img; meta[(face, i)] = A
    al = np.stack([f[..., 3] > 0 for f in fr.values()]).any(0); ys, xs = np.nonzero(al)
    x0, x1, y0, y1 = int(xs.min()), int(xs.max())+1, int(ys.min()), int(ys.max())+1; cw, ch = x1-x0, y1-y0
    sheet = np.zeros((ch*3, cw*n, 4), np.uint8)
    for (face, i), f in fr.items(): sheet[face*ch:(face+1)*ch, i*cw:(i+1)*cw] = f[y0:y1, x0:x1]
    b = io.BytesIO(); Image.fromarray(sheet).save(b, 'WEBP', lossless=True, exact=True, quality=100, method=6)
    def hands(a):
        v = a['handN']+a['handF']
        for k in ('tipN', 'tipF'):
            if k in a: v = v+a[k]
        return [round(x, 1) for x in v]
    return name, el, b.getvalue(), [cw, ch, int(EXT[0]+x0), int(EXT[2]+y0)], [[meta[(f, i)]['eye'] for i in range(n)] for f in range(3)], [[hands(meta[(f, i)]) for i in range(n)] for f in range(3)]

def main():
    args = sys.argv[1:]; dbg = None; els = ELS
    if '--dbg' in args: i = args.index('--dbg'); dbg = args[i+1]; del args[i:i+2]; os.makedirs(dbg, exist_ok=True)
    if '--els' in args: i = args.index('--els'); els = args[i+1].split(','); del args[i:i+2]
    names = args or list(MOTIONS)
    jsf = os.path.join(ROOT, 'js', 'spirit-motions.js'); old = {}
    if os.path.exists(jsf):
        m = re.search(r'const SPM=(\{.*\});', open(jsf, encoding='utf8').read(), re.S)
        if m: old = json.loads(m.group(1))
    used0 = {v for d in old.values() for v in d.get('s', {}).values()}
    new = {k: v for k, v in old.items() if k in MOTIONS and k not in names}
    jobs = [(n, e) for n in names for e in els]
    with Pool(min(4, os.cpu_count() or 1)) as pool:
        for name, el, raw, geo, eye, hd in pool.imap_unordered(job, jobs):
            src = 'assets/g/'+hashlib.sha1(raw).hexdigest()[:10]+'.webp'; open(os.path.join(ROOT, src), 'wb').write(raw)
            d = new.setdefault(name, {'n': MOTIONS[name]['n'], 'r': MOTIONS[name]['rate'], 's': {}, 'g': {}, 'e': {}, 'h': None})
            d['s'][el] = src; d['g'][el] = geo; d['e'][el] = eye
            if el == 'wood' or d['h'] is None: d['h'] = hd   # 手・道具の先の場所（属性によらない）
            if dbg:
                im = Image.open(io.BytesIO(raw)); bg = Image.new('RGBA', im.size, (200, 220, 180, 255)); bg.alpha_composite(im); bg.save(os.path.join(dbg, f'{name}_{el}.png'))
            print(name, el, src, len(raw), 'bytes', flush=True)
    if els != ELS: print('属性をしぼったので、js は書かない'); return
    used = {v for d in new.values() for v in d['s'].values()}
    for f in used0-used:   # どの動きも使わなくなった絵だけ消す
        if os.path.exists(os.path.join(ROOT, f)): os.remove(os.path.join(ROOT, f))
    body = json.dumps({k: new[k] for k in sorted(new)}, separators=(',', ':'), ensure_ascii=False)
    open(jsf, 'w', encoding='utf8').write('/* せいれいの動き（3Dから写した絵）。tools/art/spirit3d/build.py が書く。手で書きかえない */\nconst SPM='+body+';\n')

if __name__ == '__main__':
    main()
