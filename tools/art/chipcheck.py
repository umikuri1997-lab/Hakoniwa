#!/usr/bin/env python3
"""チップの絵を、ドット絵の決まりで数字にしてしらべる（スキル pixel-redraw）。絵を見る前に、まず数字で見る。
  python3 tools/art/chipcheck.py <id> [<id>...]          # いまの chips.js のチップ
  python3 tools/art/chipcheck.py --png <絵.png>           # 書き出した絵
  python3 tools/art/chipcheck.py <id> --out <フォルダ>    # <id>.png（そのまま）と <id>_x8.png（8倍・草色の上）も書き出す
  python3 tools/art/chipcheck.py --cmp <前.png> <あと.png> <出力.png> [<id>...]   # 前とあとを8倍でならべ、下に id のチップを2倍でならべる
出す数字と、めやす（だめなら NG と出す）：
  色の数      16色まで（素材が1つなら12色まで）
  半透明      0（うすさは 0 か 255 だけ）
  輪郭の太さ  外がわのこい色は1ドット（左・右・上・下のはしから、中の色より18%より暗いドットがつづく数）
  孤立ドット  0（上下左右のどれとも色がちがう1ドット。目・光など、わざと置く点は数えてよい）
  にた色      0組（色の差が10より小さい2色。まとめる）
  形          行ごとの左はし・右はしを出す（とちゅうで急にかわる段・とびだしを、数字で見つける）"""
import sys, os
import numpy as np
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
GRASS = (150, 190, 120, 255)

def chip_imgs(ids):
    sys.path.insert(0, os.path.join(ROOT, 'tools')); import chips
    _, C = chips.load_imgs(); out = {}
    for k in ids:
        if k not in C: print('ないチップ:', k); continue
        out[k] = C[k]['f'][0].convert('RGBA'); c = C[k]
        print('%s: 大きさ %dx%d・置き方 ax %s ay %s・g %s・コマ %d・部品 %d' % (k, c['w'], c['h'], c['ax'], c['ay'], c.get('g', 32), len(c['f']), len(c.get('parts') or [])))
    return out

def runs(v):
    """[3,3,3,2,2] → '3x3 2x2'"""
    o = []; 
    for x in v:
        if o and o[-1][0] == x: o[-1][1] += 1
        else: o.append([x, 1])
    return ' '.join('%d' % a if n == 1 else '%dx%d' % (a, n) for a, n in o)

def check(im, name=''):
    a = np.asarray(im.convert('RGBA')).astype(int); al = a[..., 3]; m = al > 127; ng = []
    if not m.any(): print(name, '透明だけ'); return False
    ys, xs = np.where(m); L = a[..., :3] @ (.3, .59, .11)
    cols = {tuple(c) for c in a[m][:, :3]}; n = len(cols); semi = int(((al > 0) & (al < 255)).sum())
    print('%s 絵のある所 x %d〜%d・y %d〜%d' % (name, xs.min(), xs.max(), ys.min(), ys.max()))
    print('  色の数 %d%s' % (n, '  NG（16色まで）' if n > 16 else '')); ng += [n > 16]
    print('  半透明 %d%s' % (semi, '  NG（0に）' if semi else '')); ng += [semi > 0]
    cl = sorted(cols); near = [(p, q) for i, p in enumerate(cl) for q in cl[i + 1:] if sum((x - y) ** 2 for x, y in zip(p, q)) < 100] if n <= 64 else None
    if near is None: print('  にた色 （色が多すぎて数えない）')
    else:
        print('  にた色 %d組%s' % (len(near), '  NG（まとめる）' if near else '')); ng += [bool(near)]
        for p, q in near[:6]: print('    #%02x%02x%02x と #%02x%02x%02x' % (p + q))
    # 輪郭の太さ：はしから、中の色（その行・列のまん中の明るさ）より18%より暗いドットがつづく数
    def edge(lines):
        t = []
        for ln in lines:
            if len(ln) < 6: continue
            mid = np.median(ln[len(ln) // 4:len(ln) * 3 // 4 + 1]); k = 0
            while k < len(ln) // 2 and ln[k] < mid * .82: k += 1
            t.append(k)
        return (max(t), sum(t) / len(t)) if t else (0, 0)
    rows = [L[y][m[y]] for y in range(a.shape[0]) if m[y].any()]; colsL = [L[:, x][m[:, x]] for x in range(a.shape[1]) if m[:, x].any()]
    E = {'左': edge(rows), '右': edge([r[::-1] for r in rows]), '上': edge(colsL), '下': edge([c[::-1] for c in colsL])}
    bad = [k for k in ('左', '右', '上') if E[k][0] > 1]   # 下は、脚・前の面のかげがつづくので、めやすから外す
    print('  輪郭の太さ（いちばん太い所・平均） ' + '・'.join('%s %d／%.1f' % (k, E[k][0], E[k][1]) for k in E) + ('  NG（%s が2ドット以上）' % '・'.join(bad) if bad else '')); ng += [bool(bad)]
    # 孤立ドット
    P = np.pad(a, ((1, 1), (1, 1), (0, 0))); orph = []
    for y, x in zip(ys, xs):
        nb = [P[y + 1 + dy, x + 1 + dx] for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))]; nb = [q for q in nb if q[3] > 127]
        if len(nb) >= 3 and all(((q[:3] - a[y, x, :3]) ** 2).sum() >= 100 for q in nb): orph.append((x, y))
    print('  孤立ドット %d%s' % (len(orph), '  NG（けす・まとめる。わざと置いた点ならよい）：' + ' '.join('%d,%d' % o for o in orph[:12]) if orph else '')); ng += [bool(orph)]
    le = [int(np.where(m[y])[0].min()) for y in range(ys.min(), ys.max() + 1)]; re = [int(np.where(m[y])[0].max()) for y in range(ys.min(), ys.max() + 1)]
    print('  形（行ごとの左はし、上から） ' + runs(le)); print('  形（行ごとの右はし、上から） ' + runs(re))
    print('  → ' + ('NG がある' if any(ng) else 'めやすは、ぜんぶ通った（このあと、8倍とゲームの中の絵を目で見る）'))
    return not any(ng)

def big(im, k):
    bg = Image.new('RGBA', (im.width * k, im.height * k), GRASS); bg.alpha_composite(im.resize(bg.size, Image.NEAREST)); return bg

def cmp(old, new, out, ids):
    A, B = Image.open(old).convert('RGBA'), Image.open(new).convert('RGBA'); row = chip_imgs(ids) if ids else {}
    rh = max([i.height * 2 for i in row.values()] + [0]); W = A.width * 8 + B.width * 8 + 16
    sheet = Image.new('RGBA', (max(W, sum(i.width * 2 + 8 for i in row.values()) + (A.width + B.width) * 2 + 16), max(A.height, B.height) * 8 + rh + 16), GRASS)
    sheet.alpha_composite(big(A, 8), (0, 0)); sheet.alpha_composite(big(B, 8), (A.width * 8 + 16, 0)); x = 0; y1 = sheet.height
    for i in [A, B] + list(row.values()): sheet.alpha_composite(big(i, 2), (x, y1 - i.height * 2)); x += i.width * 2 + 8
    sheet.save(out); print('書き出した:', out, '（上：前・あと 8倍。下：前・あと・' + '・'.join(row) + ' 2倍）')

if __name__ == '__main__':
    av = sys.argv[1:]
    if not av: print(__doc__); sys.exit()
    if av[0] == '--cmp': cmp(av[1], av[2], av[3], av[4:]); sys.exit()
    if av[0] == '--png': check(Image.open(av[1]), av[1]); sys.exit()
    out = None
    if '--out' in av: i = av.index('--out'); out = av[i + 1]; av = av[:i] + av[i + 2:]
    for k, im in chip_imgs(av).items():
        check(im, k)
        if out:
            os.makedirs(out, exist_ok=True); f = k.replace(':', '_').replace('>', '_r').replace('#', '_f'); im.save(os.path.join(out, f + '.png')); big(im, 8).save(os.path.join(out, f + '_x8.png')); print('  書き出した:', os.path.join(out, f + '.png'), f + '_x8.png')
