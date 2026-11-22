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
めやすの数（NG にはしない。数が多ければ、印の所を8倍で見る。考え方は ink-studio の critic.js（MIT、siliconjungle/shapeshift-labs-ink-studio）から）：
  ガタガタ    りんかく（形のふち）の段の長さが、となりの段と2ドット以上ちがう所（1・3・1のような段。2・2・2がきれい）。葉のでこぼこなど、わざとの形でも出る
  線の角の1ドット  1ドットの線の段の内がわの角に、よけいな1ドットがあり、そこだけ線が2ドットの太さに見える所（線は、まわりよりこい色が6ドットいじょうつづく所）
  ふちの中間色    こい色と明るい色のあいだに、1ドットはばの中間色が、ふちにそって3ドットいじょうならぶ所（バンディング。輪郭の2ドットはのぞく）
  まわりが暗い影  輪郭のすぐ内がわが、光の向きに関係なく、ぐるっと暗い度合い（0〜1。1に近いほどピロー影）
  ぶつぶつ        同じ色が3ドット以下のかたまりのわりあい（あみかけ・色のちらばりが多すぎないか）
  ちらつき    コマが2つより多いチップ（たてにならべたコマ・コマの一覧）で、まわり8つがかわらないのに1ドットだけかわる所のわりあい（動かない所の色がコマでゆれていないか）
--cmp のとき：形の重なり（前とあとの形が、どれだけ同じか）90%より上"""
import sys, os, signal
import numpy as np
signal.signal(signal.SIGPIPE, signal.SIG_DFL)   # | head でとめても、エラーにしない
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
GRASS = (150, 190, 120, 255)

FR = {}
def chip_frames(c):
    """チップのコマ：コマの一覧（f）か、たてにならべたコマ（n）"""
    if c.get('n') and len(c['f']) == 1:
        a = np.asarray(c['f'][0].convert('RGBA')).astype(int); h = a.shape[0] // c['n']; return [a[i * h:(i + 1) * h] for i in range(c['n'])]
    return [np.asarray(f.convert('RGBA')).astype(int) for f in c['f']]

def jaggy_points(a):
    """ガタガタ：形のふちを、行ごとの左はし・右はし、列ごとの上はし・下はしで見て、段の長さが、となりの段と2ドット以上ちがう所。かえすのは（数、段の数、所）"""
    m = a[..., 3] > 127; pts = []; steps = 0
    for M, tr in ((m, False), (m.T, True)):
        for side in (0, 1):
            ed = [(int(np.where(r)[0].max()) if side else int(np.where(r)[0].min())) if r.any() else -1 for r in M]
            st = [(i, abs(ed[i] - ed[i - 1])) for i in range(1, len(ed)) if ed[i] >= 0 and ed[i - 1] >= 0 and ed[i] != ed[i - 1]]
            for (i0, d0), (i1, d1) in zip(st, st[1:]):
                if i1 - i0 > 3: continue   # はなれた段どうしは、くらべない
                steps += 1
                if abs(d1 - d0) >= 2: pts.append((i1, ed[i1]) if tr else (ed[i1], i1))   # （x,y）
    pts = sorted(set(pts), key=lambda p: (p[1], p[0]))
    return len(pts), steps, pts

def flicker(frs):
    """ちらつき：コマのあいだで、まわり8つがかわらないのに1ドットだけかわる所のわりあい（さいごのコマのつぎは、はじめのコマ）"""
    n = tot = 0
    for i in range(len(frs)):
        A, B = frs[i], frs[(i + 1) % len(frs)]
        if A.shape != B.shape: return None
        ch = ((A[..., :3] != B[..., :3]).any(-1) & (A[..., 3] > 127)) | ((A[..., 3] > 127) != (B[..., 3] > 127))
        P = np.pad(ch, 1); nb = sum(P[1 + dy:1 + dy + ch.shape[0], 1 + dx:1 + dx + ch.shape[1]].astype(int) for dy in (-1, 0, 1) for dx in (-1, 0, 1) if dy or dx)
        n += int((ch & (nb == 0)).sum()); tot += int((A[..., 3] > 127).sum())
    return n, tot

def lint4(a):
    """ink-studio の critic.js（MIT）の lint の4つ（doubles・banding・pillow・noise）を、透明でない所でしらべる。
    かえすのは（線の角の点の所, 線のドット数, ふちの中間色の所, まわりが暗い度合い, ぶつぶつのドット数, 絵のドット数）"""
    H, W = a.shape[:2]; fg = a[..., 3] > 127; N = int(fg.sum())
    C = (a[..., 0] << 16) | (a[..., 1] << 8) | a[..., 2]; L = a[..., :3] @ (.299, .587, .114) / 255
    ok = lambda x, y: 0 <= x < W and 0 <= y < H and fg[y, x]
    same = lambda x, y, u, v: ok(u, v) and C[y, x] == C[v, u]
    # 線：まわりのちがう色（透明はのぞく）より、どれもこい色で、同じ色の2×2のかたまりにならず、同じ色が8方向に6ドットいじょうつづく所
    def block(x, y):
        return any(all(same(x, y, x + ax + dx, y + ay + dy) for dx in (0, 1) for dy in (0, 1)) for ax, ay in ((0, 0), (-1, 0), (0, -1), (-1, -1)))
    dark = np.zeros((H, W), bool)
    for y, x in zip(*np.where(fg)):
        if block(x, y): continue
        nb = [L[v, u] for u in (x - 1, x, x + 1) for v in (y - 1, y, y + 1) if (u, v) != (x, y) and ok(u, v) and C[v, u] != C[y, x]]
        if len(nb) >= 2 and all(q - L[y, x] >= .06 for q in nb): dark[y, x] = True
    line = np.zeros((H, W), bool); seen = np.zeros((H, W), bool)
    for y0, x0 in zip(*np.where(dark)):
        if seen[y0, x0]: continue
        comp = [(x0, y0)]; seen[y0, x0] = True
        for x, y in comp:
            for u in (x - 1, x, x + 1):
                for v in (y - 1, y, y + 1):
                    if 0 <= u < W and 0 <= v < H and dark[v, u] and not seen[v, u] and C[v, u] == C[y, x]: seen[v, u] = True; comp.append((u, v))
        if len(comp) >= 6:
            for x, y in comp: line[y, x] = True
    on = lambda x, y: 0 <= x < W and 0 <= y < H and line[y, x]
    dbl = []
    for y, x in zip(*np.where(line)):   # 段の内がわの角のドットで、線が両方の向きへつづく所（箱の角のように、まがって止まる所はのぞく）
        for ax, ay in ((1, 1), (1, -1), (-1, 1), (-1, -1)):
            if not (on(x + ax, y) and on(x, y + ay) and same(x, y, x + ax, y) and same(x, y, x, y + ay)): continue
            goH = on(x + 2 * ax, y) or on(x + 2 * ax, y - ay); goV = on(x, y + 2 * ay) or on(x - ax, y + 2 * ay)
            if goH and goV and not on(x - ax, y) and not on(x, y - ay): dbl.append((int(x), int(y))); break
    # ふちの中間色：こい色と明るい色のあいだの1ドットはばの中間色が、ふちにそって3ドットいじょうつづく所（輪郭の2ドットはのぞく）
    def band(x, y, dx, dy):
        if not (ok(x, y) and ok(x - dx, y - dy) and ok(x + dx, y + dy)): return False
        c, p, q = C[y, x], C[y - dy, x - dx], C[y + dy, x + dx]
        if c == p or c == q or p == q: return False
        l, lp, lq = L[y, x], L[y - dy, x - dx], L[y + dy, x + dx]
        return lp < l < lq or lp > l > lq
    # 透明からのドットの数（絵のわくの外も透明とみる）。はこにわの輪郭は、こい色と、なじむ色の2ドットなので、下では、はしの2ドットをのぞく
    D = np.full((H, W), 10 ** 9); q = []
    for y in range(H):
        for x in range(W):
            if not fg[y, x]: D[y, x] = 0; q.append((x, y))
            elif x in (0, W - 1) or y in (0, H - 1): D[y, x] = 1; q.append((x, y))
    for x, y in q:
        for u, v in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= u < W and 0 <= v < H and D[v, u] > D[y, x] + 1: D[v, u] = D[y, x] + 1; q.append((u, v))
    bnd = []
    for y, x in zip(*np.where(fg & (D > 2))):
        for dx, dy, px, py in ((1, 0, 0, 1), (0, 1, 1, 0)):
            if not band(x, y, dx, dy): continue
            run = 1
            for sg in (-1, 1):
                for k in range(1, 4):
                    if not band(x + sg * k * px, y + sg * k * py, dx, dy): break
                    run += 1
            if run >= 3: bnd.append((int(x), int(y))); break
    # まわりが暗い影：輪郭のすぐ内がわ（はしから3ドットめ）の明るさを、ふちの向き（8つ）ごとに、中（はしから5ドットより内がわ）の明るさとくらべる
    Dp = np.pad(D, 1, constant_values=0)
    mid = L[fg & (D >= 5)]; rim = [[0., 0] for _ in range(8)]
    for y, x in zip(*np.where(fg & (D == 3))):
        gx = -(Dp[y + 1, x + 2] - Dp[y + 1, x]); gy = -(Dp[y + 2, x + 1] - Dp[y, x + 1])
        if not gx and not gy: continue
        k = (round(np.arctan2(gy, gx) / (2 * np.pi) * 8) + 8) % 8; rim[k][0] += L[y, x]; rim[k][1] += 1
    midL = float(mid.mean()) if mid.size else 0.
    rd = [max(0., midL - s / n) for s, n in rim if n > 4]
    pil = min(rd) / max(rd) if len(rd) >= 4 and max(rd) > .02 else 0.
    # ぶつぶつ：同じ色が上下左右につながる3ドット以下のかたまり
    seen = np.zeros((H, W), bool); noisy = 0
    for y0, x0 in zip(*np.where(fg)):
        if seen[y0, x0]: continue
        comp = [(x0, y0)]; seen[y0, x0] = True; i = 0
        while i < len(comp) and len(comp) <= 4:
            x, y = comp[i]; i += 1
            for u, v in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                if ok(u, v) and not seen[v, u] and C[v, u] == C[y, x]: seen[v, u] = True; comp.append((u, v))
        if len(comp) <= 3: noisy += len(comp)
    return dbl, int(line.sum()), bnd, pil, noisy, N

def chip_imgs(ids):
    sys.path.insert(0, os.path.join(ROOT, 'tools')); import chips
    _, C = chips.load_imgs(); out = {}
    for k in ids:
        if k not in C: print('ないチップ:', k); continue
        c = C[k]; FR[k] = chip_frames(c); out[k] = Image.fromarray(FR[k][0].astype(np.uint8), 'RGBA') if c.get('n') and len(c['f']) == 1 else c['f'][0].convert('RGBA')   # たてにならべたコマは、1コマめ
        print('%s: 大きさ %dx%d・置き方 ax %s ay %s・g %s・コマ %d・部品 %d' % (k, c['w'], c['h'], c['ax'], c['ay'], c.get('g', 32), len(FR[k]), len(c.get('parts') or [])))
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
    return ' '.join(('%d' % a if a >= 0 else '-') if n == 1 else ('%dx%d' % (a, n) if a >= 0 else '-x%d' % n) for a, n in o)

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
    jn, js, jp = jaggy_points(a)
    print('  ガタガタ %d／段 %d（めやす）%s' % (jn, js, '：' + ' '.join('%d,%d' % p for p in jp[:12]) if jp else ''))
    dbl, ln, bnd, pil, noisy, nn = lint4(a); pt = lambda v: '：' + ' '.join('%d,%d' % p for p in v[:12]) if v else ''
    print('  線の角の1ドット %d／線 %d ドット（めやす）%s' % (len(dbl), ln, pt(dbl)))
    print('  ふちの中間色 %d（めやす）%s' % (len(bnd), pt(bnd)))
    print('  まわりが暗い影 %.2f（めやす。0：ふちが暗いのは片がわだけ・1：ぐるっと暗い）' % pil)
    print('  ぶつぶつ %.1f%%（%d ドット。めやす）' % (noisy * 100 / max(1, nn), noisy))
    frs = FR.get(name)
    if frs and len(frs) > 2:
        f = flicker(frs)
        if f: print('  ちらつき %.2f%%（%d ドット・コマ %d。めやす）' % (f[0] * 100 / max(1, f[1]), f[0], len(frs)))
    le = [int(np.where(m[y])[0].min()) if m[y].any() else -1 for y in range(ys.min(), ys.max() + 1)]; re = [int(np.where(m[y])[0].max()) if m[y].any() else -1 for y in range(ys.min(), ys.max() + 1)]   # 何もない行は -1
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
