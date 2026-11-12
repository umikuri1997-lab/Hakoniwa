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
COLS, DARK, K = 7, 70, .72   # こい色：いちばん明るい色の成分が DARK より下。新しい輪郭は、となりの色×K

def lum(p): return max(p[0], p[1], p[2])

def soften(a):
    a = a.copy(); H, W = a.shape[:2]; op = a[..., 3] > 0
    def edge(y, x):  # 透明（か外）にふれている
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                yy, xx = y + dy, x + dx
                if not (0 <= yy < H and 0 <= xx < W) or not op[yy, xx]: return True
        return False
    ol = np.zeros((H, W), bool)
    for y in range(H):
        for x in range(W):
            if op[y, x] and lum(a[y, x]) < DARK and edge(y, x): ol[y, x] = True
    # 輪郭のつづき（内がわへ1ドットつづく、こい色）も、外の輪郭につながっていれば同じにする
    inner = op & ~ol
    src = a.copy()
    for _ in range(3):  # 内がわの色を、輪郭へ広げる（輪郭が2ドットでも、内の色からきめる）
        out = src.copy(); done = inner.copy()
        for y in range(H):
            for x in range(W):
                if not ol[y, x] or done[y, x]: continue
                cs = [src[y + dy, x + dx, :3].astype(float) for dy, dx in ((0,1),(0,-1),(1,0),(-1,0))
                      if 0 <= y + dy < H and 0 <= x + dx < W and inner[y + dy, x + dx] and lum(src[y + dy, x + dx]) >= DARK]
                if cs: out[y, x, :3] = np.mean(cs, 0).round().astype(np.uint8); done[y, x] = True
        src, inner = out, done
    for y in range(H):
        for x in range(W):
            if ol[y, x]:
                c = src[y, x, :3].astype(float) if inner[y, x] else a[y, x, :3].astype(float)
                a[y, x, :3] = (c * K).round().astype(np.uint8) if inner[y, x] else a[y, x, :3]
    return a

def main():
    d = sys.argv[1] if len(sys.argv) > 1 else '.'
    rows = (len(KEYS) + COLS - 1) // COLS; out = Image.new('RGBA', (COLS * 16, rows * 16)); tab = {}
    for i, k in enumerate(KEYS):
        a = np.array(Image.open(os.path.join(HERE, 'px', k + '.png')).convert('RGBA'))
        out.paste(Image.fromarray(soften(a), 'RGBA'), ((i % COLS) * 16, (i // COLS) * 16)); tab[k] = [i % COLS, i // COLS]
    out.resize((out.width * 8, out.height * 8), Image.NEAREST).save(os.path.join(d, 'bubpx.png'))
    out.save(os.path.join(d, 'bubpx.webp'), lossless=True, exact=True, method=4)
    print(hashlib.sha1(open(os.path.join(d, 'bubpx.webp'), 'rb').read()).hexdigest()[:10]); print(json.dumps(tab, separators=(',', ':')))

if __name__ == '__main__': main()
