# ブロックをおいたときの、足もとの小さな砂ぼこり（bdust）のコマならびの絵を assets/g に作る。
# ドット絵（整数のドットだけ）。ブロックの下のふちの左右から、小さなけむりの玉が3つずつ、外へはき出されて、ふくらみながら消える。
# 色は、明るくやわらかい砂の色（ふちは中の色より少しこい色）。うすさは、すすむほどうすく。
# つかいかた：python3 tools/fx-bdust.py [--show <フォルダ>]  → 出てきた行を js/draw-world.js の FXS に書く。
from PIL import Image
import importlib.util, os, sys
sp = importlib.util.spec_from_file_location('fxtrap', os.path.join(os.path.dirname(__file__), 'fx-trap.py')); T = importlib.util.module_from_spec(sp); sp.loader.exec_module(T)

O = dict(w=72, h=24, n=8, fps=16, ax=36, ay=18)
F, E = (232, 218, 190), (204, 186, 152)
# 玉：(左右 -1/1, はじめの x, はじめの y, 外への速さ, 上への速さ, 大きさ)
PUF = [(-1, 14, 0, 2.6, .5, 2.6), (-1, 20, -2, 2.0, .8, 2.2), (-1, 8, 1, 1.6, .3, 2.0),
       (1, 14, 0, 2.6, .5, 2.6), (1, 20, -2, 2.0, .8, 2.2), (1, 8, 1, 1.6, .3, 2.0)]

def frame(i):
    W, H = O['w'], O['h']; im = Image.new('RGBA', (W, H), (0, 0, 0, 0)); px = im.load(); ox, oy = O['ax'], O['ay']
    k = 1 - i / O['n']; a = int(70 + 150 * k)
    for sd, x0, y0, vx, vy, r in PUF:
        t = i + 1; x = ox + sd * (x0 + vx * t - .08 * t * t); y = oy + y0 - vy * t
        T.disc(px, W, H, x, y, r + t * .35, F + (a,), E + (min(255, a + 30),))
    return im

if __name__ == '__main__':
    im = T.sheet(frame, O); T.save('bdust', im, O)
    if '--show' in sys.argv:
        d = sys.argv[sys.argv.index('--show') + 1]; bg = Image.new('RGBA', im.size, (150, 176, 100, 255)); bg.alpha_composite(im)
        bg.resize((bg.width * 4, bg.height * 4), Image.NEAREST).save(os.path.join(d, 'bdust4.png'))
