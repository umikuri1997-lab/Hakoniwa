# 雪だるまのドット絵（冬に、せいれいが作る。season.js の SNOWSPR）を assets/g に作る。
# 1マス64ドット（チップと同じ細かさ。ゲームでは半分の大きさに描く）。4コマを横にならべる：
#   0 小さな雪玉 / 1 大きな雪玉 / 2 頭をのせた / 3 できあがり（目・にんじんの鼻・マフラー・枝のうで）
# 輪郭は中の色より少しだけこい色（黒にしない）。光は左上、かげは右下。名前は中身の sha1 の先10文字。
# つかいかた：python3 tools/art/snowman/snowman_art.py   → 出てきた行を js/season.js の SNOWSPR に書く。
#   --show <ファイル>：たしかめ用に、草の色の上に4倍でならべた PNG も出す。
from PIL import Image
import hashlib, io, math, os, sys

FW, FH, N = 48, 64, 4          # 1コマの大きさ・コマの数
AX, AY = 24, 58                # 足もと（マスのまん中・下から6ドット上）
HI, BASE, SH, SH2, OL = (255, 255, 255, 255), (240, 246, 255, 255), (214, 226, 242, 255), (196, 211, 232, 255), (170, 188, 214, 255)
EYE, NOSE, NOSE_E = (92, 86, 104, 255), (246, 160, 84, 255), (222, 128, 66, 255)
SCARF, SCARF_D, SCARF_E = (236, 122, 112, 255), (214, 98, 92, 255), (196, 86, 82, 255)
TWIG, TWIG_E = (156, 112, 78, 255), (128, 90, 62, 255)
SHADOW = (150, 168, 196, 110)

def put(px, x, y, c):
    if 0 <= x < FW and 0 <= y < FH: px[x, y] = c

def ball(px, cx, cy, r):
    """雪玉：1ドットの輪郭、右下にかげ2だん、左上に光"""
    for y in range(int(cy - r) - 1, int(cy + r) + 2):
        for x in range(int(cx - r) - 1, int(cx + r) + 2):
            dx, dy = x + .5 - cx, y + .5 - cy; d = math.hypot(dx, dy)
            if d > r: continue
            if d > r - 1.1: put(px, x, y, OL); continue
            k = (dx * .6 + dy * .8) / r        # 光の向き（左上）とのちがい
            c = SH2 if k > .55 else SH if k > .2 else HI if k < -.55 and d < r * .75 else BASE
            put(px, x, y, c)

def shadow(px, rx):
    for y in range(AY - 3, AY + 4):
        for x in range(AX - rx - 1, AX + rx + 2):
            if math.hypot((x + .5 - AX) / rx, (y + .5 - AY) / 3.2) <= 1 and (x + y) % 2 == 0: put(px, x, y, SHADOW)

def frame(i):
    im = Image.new('RGBA', (FW, FH), (0, 0, 0, 0)); px = im.load()
    if i == 0:
        shadow(px, 9); ball(px, AX, AY - 7, 8); return im
    shadow(px, 15); ball(px, AX, AY - 13, 14)
    if i == 1: return im
    hy = AY - 13 - 14 - 7                 # 頭のまん中
    ball(px, AX, hy, 10)
    if i == 2: return im
    for ex in (AX - 5, AX + 3):           # 目（2×2）
        for a in (0, 1):
            for b in (0, 1): put(px, ex + a, hy - 3 + b, EYE)
    for k in range(5):                    # にんじんの鼻：右へのびる三角
        for t in range(-1 if k < 2 else 0, 2 if k < 3 else 1):
            put(px, AX + k, hy + t, NOSE if t == 0 or k == 0 else NOSE_E)
    put(px, AX + 4, hy, NOSE_E)
    sy = hy + 9                           # マフラー：首のまわり＋たれる所
    for x in range(AX - 9, AX + 10):
        for y in (sy, sy + 1, sy + 2):
            put(px, x, y, SCARF_E if y == sy + 2 or abs(x - AX) >= 9 else SCARF if y == sy else SCARF_D)
    for y in range(sy + 3, sy + 10):
        for x in (AX + 4, AX + 5, AX + 6):
            put(px, x, y, SCARF_E if x == AX + 6 or y == sy + 9 else SCARF)
    for side in (-1, 1):                  # 枝のうで：ななめ上へ、先が2つにわかれる
        x0, y0 = AX + side * 13, AY - 20
        for k in range(9):
            put(px, x0 + side * k, y0 - k // 2, TWIG); put(px, x0 + side * k, y0 - k // 2 + 1, TWIG_E)
        put(px, x0 + side * 7, y0 - 6, TWIG); put(px, x0 + side * 8, y0 - 7, TWIG)
    for k, y in enumerate((AY - 18, AY - 12, AY - 6)):  # 小石のボタン
        put(px, AX - 1 + (k % 2), y, EYE); put(px, AX + (k % 2), y, EYE)
    return im

sheet = Image.new('RGBA', (FW * N, FH), (0, 0, 0, 0))
for i in range(N): sheet.paste(frame(i), (i * FW, 0))
buf = io.BytesIO(); sheet.save(buf, 'WEBP', lossless=True, exact=True, quality=100, method=6); data = buf.getvalue()
name = hashlib.sha1(data).hexdigest()[:10] + '.webp'
root = os.path.join(os.path.dirname(__file__), '..', '..', '..')
open(os.path.join(root, 'assets', 'g', name), 'wb').write(data)
print('const SNOWSPR={src:"assets/g/%s",w:%d,h:%d,n:%d,ax:%d,ay:%d};' % (name, FW, FH, N, AX, AY))
if '--show' in sys.argv:
    out = sys.argv[sys.argv.index('--show') + 1]; k = 4
    bg = Image.new('RGBA', (FW * N * k, FH * k), (228, 236, 246, 255))
    bg.alpha_composite(sheet.resize((FW * N * k, FH * k), Image.NEAREST)); bg.save(out)
