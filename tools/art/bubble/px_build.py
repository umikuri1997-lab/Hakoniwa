"""ふきだしのドット絵（16×16）を1まいの WebP にする。
元の絵は px/<名前>.png（Angais/pixel-art-atlas-1.4m、CC0。どの絵かは px/SOURCE.md）。
- 外がわの黒い輪郭（透明なマスにふれている、こい色のドット）を、内がわのとなりの色を少し暗くした色にかえる（うすい輪郭）。
- 7列にならべる（1マス16×16）。
使い方：python3 tools/art/bubble/px_build.py <出力フォルダ>   出力：bubpx.png（確認用・8倍）・bubpx.webp。BUBPX の表を出す"""
import sys, os, hashlib, json, numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
KEYS = ['spark','box','fire','sweat','coffee','basket','hammer','drop','heart','wave','note','sprout','pick','spring',
        'axe','dizzy','gheart','fish','lantern','firework','gift','pan','notes','house','rice','dots','q','seed']
KEEPIN = {'dots', 'rice'}   # 中のこい色が絵の中身（「…」の点・のり）なので、外の輪郭だけ
COLS, DARK, DARK2, K = 7, 100, 64, .72   # 輪郭のこい色：いちばん明るい成分が DARK（2ドットめは DARK2）より下。新しい輪郭は、近い色×K

def lum(p): return int(max(p[0], p[1], p[2]))

N4 = ((0, 1), (0, -1), (1, 0), (-1, 0)); N8 = N4 + ((1, 1), (1, -1), (-1, 1), (-1, -1))

def soften(a, inner=True):
    """輪郭（外がわ1ドットめのこい色と、そのすぐ内がわの、ほとんど黒いドット）を、
    いちばん近い輪郭でないドットの色×K にする（うすい輪郭）。中の線はそのまま"""
    a = a.copy(); H, W = a.shape[:2]; op = a[..., 3] > 0
    ins = lambda y, x: 0 <= y < H and 0 <= x < W
    ol = np.zeros((H, W), bool)
    for y in range(H):
        for x in range(W):
            if op[y, x] and lum(a[y, x]) < DARK and any(not ins(y + dy, x + dx) or not op[y + dy, x + dx] for dy, dx in N8):
                ol[y, x] = True
    for _ in range(3):  # 2〜4ドットめ（太い輪郭・かげ）：輪郭につづく、ほとんど黒いドット
        l1 = ol.copy()
        for y in range(H):
            for x in range(W):
                if op[y, x] and not l1[y, x] and lum(a[y, x]) < DARK2 and any(ins(y + dy, x + dx) and l1[y + dy, x + dx] for dy, dx in N4):
                    ol[y, x] = True
    if inner:  # 中の線：ほとんど黒いドットは、ぜんぶ同じにする
        for y in range(H):
            for x in range(W):
                if op[y, x] and lum(a[y, x]) < DARK2: ol[y, x] = True
    src = {}; q = []
    for y in range(H):
        for x in range(W):
            if op[y, x] and not ol[y, x]: src[(y, x)] = a[y, x, :3].astype(float); q.append((y, x))
    while q:  # 輪郭でないドットから、近いじゅんに色を広げる
        nq = []
        for y, x in q:
            for dy, dx in N4:
                yy, xx = y + dy, x + dx
                if ins(yy, xx) and ol[yy, xx] and (yy, xx) not in src: src[(yy, xx)] = src[(y, x)]; nq.append((yy, xx))
        q = nq
    base = [(y, x) for y in range(H) for x in range(W) if op[y, x] and not ol[y, x]]
    for y in range(H):  # 輪郭だけの小さな形（手のよこの線など）は、いちばん近い輪郭でないドットの色
        for x in range(W):
            if ol[y, x] and (y, x) not in src and base:
                by, bx = min(base, key=lambda p: (p[0] - y) ** 2 + (p[1] - x) ** 2); src[(y, x)] = a[by, bx, :3].astype(float)
    for y in range(H):
        for x in range(W):
            if ol[y, x] and (y, x) in src: a[y, x, :3] = (src[(y, x)] * K).round().astype(np.uint8)
    return a

def outside(a):
    """輪郭（こい色）の外にある物（まわりのキラキラ）をけす。はしから、こい色でないドットをたどって行ける所が外"""
    a = a.copy(); H, W = a.shape[:2]; seen = set(); q = [(y, x) for y in range(H) for x in range(W) if y in (0, H - 1) or x in (0, W - 1)]
    ok = lambda y, x: a[y, x, 3] == 0 or lum(a[y, x]) >= DARK
    q = [p for p in q if ok(*p)]; seen.update(q)
    while q:
        y, x = q.pop()
        for dy, dx in N4:
            yy, xx = y + dy, x + dx
            if 0 <= yy < H and 0 <= xx < W and (yy, xx) not in seen and ok(yy, xx): seen.add((yy, xx)); q.append((yy, xx))
    for y, x in seen: a[y, x] = 0
    return a

# 絵ごとの手直し：色のおきかえ（もとの色 → 色）と、外のキラキラをけすか
FIX = {'rice': {'out': True, 'col': {
    (246, 205, 139): (239, 238, 237), (248, 193, 112): (225, 219, 205), (250, 221, 139): (239, 238, 237), (246, 212, 158): (239, 238, 237),
    (230, 203, 164): (225, 219, 205), (234, 211, 181): (225, 219, 205), (218, 196, 177): (215, 208, 199),
    (143, 156, 182): (205, 197, 184), (158, 159, 191): (205, 197, 184), (195, 194, 198): (205, 197, 184)}}}  # ごはんのオレンジの点・下の青むらさき

def fix(k, a):
    f = FIX.get(k)
    if not f: return a
    a = a.copy()
    for y in range(a.shape[0]):
        for x in range(a.shape[1]):
            c = tuple(int(v) for v in a[y, x, :3])
            if a[y, x, 3] and c in f['col']: a[y, x, :3] = f['col'][c]
    return outside(a) if f.get('out') else a

def main():
    d = sys.argv[1] if len(sys.argv) > 1 else '.'
    rows = (len(KEYS) + COLS - 1) // COLS; out = Image.new('RGBA', (COLS * 16, rows * 16)); tab = {}
    for i, k in enumerate(KEYS):
        a = np.array(Image.open(os.path.join(HERE, 'px', k + '.png')).convert('RGBA'))
        out.paste(Image.fromarray(soften(fix(k, a), k not in KEEPIN), 'RGBA'), ((i % COLS) * 16, (i // COLS) * 16)); tab[k] = [i % COLS, i // COLS]
    out.resize((out.width * 8, out.height * 8), Image.NEAREST).save(os.path.join(d, 'bubpx.png'))
    out.save(os.path.join(d, 'bubpx.webp'), lossless=True, exact=True, method=4)
    print(hashlib.sha1(open(os.path.join(d, 'bubpx.webp'), 'rb').read()).hexdigest()[:10]); print(json.dumps(tab, separators=(',', ':')))

if __name__ == '__main__': main()
