#!/usr/bin/env python3
"""チップの絵を、ドット絵の決まりで数字にしてしらべる（スキル pixel-redraw）。絵を見る前に、まず数字で見る。
  python3 tools/art/chipcheck.py <id> [<id>...]          # いまの chips.js のチップ
  python3 tools/art/chipcheck.py --png <絵.png>           # 書き出した絵
  python3 tools/art/chipcheck.py <id> --out <フォルダ>    # <id>.png（そのまま）と <id>_x8.png（8倍・草色の上）も書き出す
  python3 tools/art/chipcheck.py --cmp <前.png> <あと.png> <出力.png> [<id>...]   # 前とあとを8倍でならべ、下に id のチップを2倍でならべる
出す数字と、めやす（だめなら NG と出す）：
  色の数      16色まで（素材が1つなら12色まで）
  半透明      0（うすさは 0 か 255 だけ）
  輪郭        外がわのこい色は1ドット（はしから2ドットめにも、輪郭と同じこい色がつづく所の数。0 に。NG のときは、その点の x,y を出す）
  孤立ドット  0（まわり8つのどれとも色がちがう1ドット。目・光など、わざと置く点は数えてよい）
  にた色      0組（色の差が10より小さい2色。まとめる）
  形          行ごとの左はし・右はしを出す（とちゅうで急にかわる段・とびだしを、数字で見つける）
  色の一覧    多い順に12色（描きなおすときの色は、ここからとる）
--cmp のとき：形の重なり（前とあとの形が、どれだけ同じか）90%より上"""
import sys, os, signal
import numpy as np
signal.signal(signal.SIGPIPE, signal.SIG_DFL)   # | head でとめても、エラーにしない
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

def thick_points(a):
    """輪郭が2ドット以上の所（x,y）：はしから2ドットめ（ななめもふくめて、透明にふれていないドット）に、輪郭と同じくらい暗い色（まわりの中の色より18%より暗い）がつづいている所"""
    al = a[..., 3]; m = al > 127; L = a[..., :3] @ (.3, .59, .11)
    Pm = np.pad(m, 1); touch = np.zeros_like(m)
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1): touch |= ~Pm[1 + dy:1 + dy + m.shape[0], 1 + dx:1 + dx + m.shape[1]]
    d1 = m & touch; inner_ = m & ~d1; Pd = np.pad(d1, 1); d2 = np.zeros_like(m)
    for dy, dx in ((0, 1), (0, -1), (1, 0), (-1, 0)): d2 |= Pd[1 + dy:1 + dy + m.shape[0], 1 + dx:1 + dx + m.shape[1]]
    d2 &= inner_; deep = inner_ & ~d2; thick = []
    for y, x in zip(*np.where(d2)):
        w = deep[max(0, y - 4):y + 5, max(0, x - 4):x + 5]
        if w.sum() < 4: continue   # 細い部品（脚など）は、中の色がないので数えない
        mid = np.median(L[max(0, y - 4):y + 5, max(0, x - 4):x + 5][w])
        nb = [L[y + dy, x + dx] for dy, dx in ((0, 1), (0, -1), (1, 0), (-1, 0)) if 0 <= y + dy < m.shape[0] and 0 <= x + dx < m.shape[1] and d1[y + dy, x + dx]]
        if L[y, x] < mid * .82 and nb and min(nb) < mid * .82 and abs(L[y, x] - min(nb)) < mid * .06: thick.append((int(x), int(y)))
    ts = set(thick); thick = [t for t in thick if any((t[0] + dx, t[1] + dy) in ts for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))]   # 1点だけ（部品のつなぎ目）は数えない
    return thick

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
    thick = thick_points(a)
    print('  輪郭が2ドット以上の所 %d%s' % (len(thick), '  NG（外がわのこい色は1ドットに）：' + ' '.join('%d,%d' % t for t in thick[:12]) if thick else '')); ng += [bool(thick)]
    # 孤立ドット
    P = np.pad(a, ((1, 1), (1, 1), (0, 0))); orph = []
    for y, x in zip(ys, xs):
        nb = [P[y + 1 + dy, x + 1 + dx] for dx in (-1, 0, 1) for dy in (-1, 0, 1) if dx or dy]; nb = [q for q in nb if q[3] > 127]   # ななめにつながる線（丸いふち）は、孤立ではない
        if len(nb) >= 3 and all(((q[:3] - a[y, x, :3]) ** 2).sum() >= 100 for q in nb): orph.append((x, y))
    print('  孤立ドット %d%s' % (len(orph), '  NG（けす・まとめる。わざと置いた点ならよい）：' + ' '.join('%d,%d' % o for o in orph[:12]) if orph else '')); ng += [bool(orph)]
    if n > 16:
        q = np.minimum((a[m][:, :3] // 12) * 12 + 6, 255); u, cnt = np.unique(q, axis=0, return_counts=True); o = np.argsort(-cnt)[:12]
        print('  色の一覧（にた色をまとめて、多い順） ' + ' '.join('#%02x%02x%02x(%d%%)' % (tuple(u[i]) + (round(cnt[i] * 100 / m.sum()),)) for i in o))
    le = [int(np.where(m[y])[0].min()) for y in range(ys.min(), ys.max() + 1)]; re = [int(np.where(m[y])[0].max()) for y in range(ys.min(), ys.max() + 1)]
    print('  形（行ごとの左はし、上から） ' + runs(le)); print('  形（行ごとの右はし、上から） ' + runs(re))
    print('  → ' + ('NG がある' if any(ng) else 'めやすは、ぜんぶ通った（このあと、8倍とゲームの中の絵を目で見る）'))
    return not any(ng)

def big(im, k):
    bg = Image.new('RGBA', (im.width * k, im.height * k), GRASS); bg.alpha_composite(im.resize(bg.size, Image.NEAREST)); return bg

def cmp(old, new, out, ids):
    A, B = Image.open(old).convert('RGBA'), Image.open(new).convert('RGBA'); row = chip_imgs(ids) if ids else {}
    if A.size == B.size:
        ma, mb = np.asarray(A)[..., 3] > 127, np.asarray(B)[..., 3] > 127; iou = (ma & mb).sum() * 100 / max(1, (ma | mb).sum())
        print('形の重なり %.1f%%%s' % (iou, '' if iou > 90 else '  NG（90%%より上に。前の絵と形がちがう：はみ出した所 %d ドット・足りない所 %d ドット）' % ((mb & ~ma).sum(), (ma & ~mb).sum())))
    else: print('NG：大きさがちがう', A.size, B.size)
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
