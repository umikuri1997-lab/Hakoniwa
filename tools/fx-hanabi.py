# 花火の夜（豪華なイベント hanabi）の花火のコマならびの絵を assets/g に作る。
# ドット絵（整数のドットだけ）。1ドット＝世界の1点（1マス32点）。名前は中身の sha1 の先10文字。
# お手本：tools/pixelfx の explosions/firework-burst（上がる → 光る → 金のまん中 → 色の星がたれる → 白くはじけて消える）。
# 星の色は fxTint の色の目じるし（200,255,208）と、そのこい色（143,220,106）で描き、ゲームで花火ごとの色にかえる。
# つかいかた：python3 tools/fx-hanabi.py  → 出てきた行を js/draw-world.js の FXS に書く。
#   --show <フォルダ>：たしかめ用に、夜の色の上に3倍でならべた PNG も出す。
from PIL import Image
import hashlib, io, math, random, sys

W, H, N, FPS = 112, 144, 26, 12
AX, AY = 56, 140          # 足もと（打ち上げる所）
BY = 44                   # はじける高さ（絵の上から）
KEY, KEYD = (200, 255, 208, 255), (143, 220, 106, 255)
GOLD, GOLDD = (255, 226, 132, 255), (232, 176, 84, 255)
WHITE = (255, 252, 236, 255)
RISE = 5                  # 上がるコマ

def dot(px, x, y, col):
    x, y = int(round(x)), int(round(y))
    if 0 <= x < W and 0 <= y < H: px[x, y] = col

def cross(px, x, y, col, big):
    dot(px, x, y, WHITE)
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)): dot(px, x + dx, y + dy, col)
    if big:
        for dx, dy in ((2, 0), (-2, 0), (0, 2), (0, -2)): dot(px, x + dx, y + dy, col)

random.seed(7)
STARS = []
for i in range(40):   # 外の色の星（球の上にばらまく。よこから見るので、手前・おくの星はおそく見える）
    z = random.uniform(-1, 1); a = random.uniform(0, 2 * math.pi); s = math.sqrt(1 - z * z)
    STARS.append(dict(vx=math.cos(a) * s, vy=math.sin(a) * s, sp=random.uniform(.92, 1.05), out=1, pop=random.random() < .45))
for i in range(12):   # 金のまん中
    a = random.uniform(0, 2 * math.pi)
    STARS.append(dict(vx=math.cos(a), vy=math.sin(a), sp=random.uniform(.45, .55), out=0, pop=False))

def pos(st, k):
    """はじけてから k コマめの場所（はやく広がって、ゆっくりになり、たれる）"""
    R = 40 * st['sp'] * (1 - math.exp(-k / 3.2))
    return AX + st['vx'] * R, BY + st['vy'] * R + .09 * k * k

def frame(i):
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0)); px = im.load()
    if i < RISE:   # 金の玉が上がる（おそくなりながら）。うしろに火の粉
        t = (i + 1) / RISE; y = AY - (AY - BY) * (1 - (1 - t) ** 3)
        for k in range(1, 6): dot(px, AX + (k % 2), y + k * 3, GOLDD if k > 2 else GOLD)
        dot(px, AX, y, WHITE); dot(px, AX, y - 1, GOLD)
        return im
    k = i - RISE
    if k == 0:     # はじける光
        for r in range(0, 7):
            for a in range(0, 360, 15):
                c = WHITE if r < 3 else GOLD
                dot(px, AX + math.cos(math.radians(a)) * r, BY + math.sin(math.radians(a)) * r, c)
        for d in range(7, 12): cross(px, AX, BY, GOLD, True); dot(px, AX + d, BY, GOLDD); dot(px, AX - d, BY, GOLDD); dot(px, AX, BY + d, GOLDD); dot(px, AX, BY - d, GOLDD)
        return im
    for n, st in enumerate(STARS):
        life = 15 if st['out'] else 8
        if k > life: continue
        x, y = pos(st, k)
        if st['out']:
            head = GOLD if k <= 2 else KEY    # はじめは金、すぐ色の星に
            tail = GOLDD if k <= 2 else KEYD
            for j in range(1, 4):             # 尾（少し前の場所へのばす）
                if k - j * .5 < .5: break
                x2, y2 = pos(st, k - j * .5)
                if j < 3 or k < 9: dot(px, x2, y2, tail)
            if k >= 11 and st['pop']:          # さいごは白くはじける
                if (k + n) % 2 == 0: cross(px, x, y, KEY, k == 12)
            elif k < 13 or (k + n) % 2 == 0:  # 消えるまぎわは、ちらちら
                dot(px, x, y, WHITE if k < 6 and st['sp'] > 1 else head)
        else:
            if k < 7 or (k + n) % 2: dot(px, x, y, GOLD if k < 5 else GOLDD)
    return im

def sheet():
    im = Image.new('RGBA', (W * N, H), (0, 0, 0, 0))
    for i in range(N): im.paste(frame(i), (i * W, 0))
    return im

def save(name, im):
    b = io.BytesIO(); im.save(b, 'WEBP', lossless=True, exact=True); d = b.getvalue(); h = hashlib.sha1(d).hexdigest()[:10]
    open('assets/g/%s.webp' % h, 'wb').write(d)
    print('"%s":{"src":"assets/g/%s.webp","w":%d,"h":%d,"n":%d,"fps":%d,"ax":%d,"ay":%d}' % (name, h, W, H, N, FPS, AX, AY))
    return im

if __name__ == '__main__':
    out = sys.argv[sys.argv.index('--show') + 1] if '--show' in sys.argv else None
    im = save('hanabi', sheet())
    if out:
        bg = Image.new('RGBA', im.size, (36, 40, 70, 255)); bg.alpha_composite(im)
        bg.resize((im.width * 3, im.height * 3), Image.NEAREST).save('%s/fx_hanabi.png' % out)
