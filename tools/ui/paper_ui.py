"""紙のUIの絵（わく・依頼ボードの板・図鑑の本の背としおり）を作って、index.html の
/* paper-ui:begin */ 〜 /* paper-ui:end */ のあいだに書きこむ。
  python3 tools/ui/paper_ui.py
- 紙のわく：角は段々（4・2・1・1）、辺は1ドットずつゆるくでこぼこ（border-image の round でくりかえす）、いちばん下の行は紙のかげ。
- 依頼ボードの板：よこの板が3まい（1まい8ドット）の、くりかえすドットの絵。
- 図鑑：左の本の背（とじ糸つき）と、上からたれる、しおりのリボン。
"""
import re, urllib.parse, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
HTML = ROOT / 'index.html'


def svg(rows, pal, w=None, h=None):
    """ドットのならび → SVG。色ごとに、行のつづきを太さ1の線でつなぐ（M でその行へ・m で同じ行のつぎのつづきへ）"""
    H = len(rows); W = len(rows[0])
    paths = {}
    for y, r in enumerate(rows):
        x = 0; cur = {}
        while x < W:
            c = r[x]
            if c == '.':
                x += 1; continue
            e = x
            while e < W and r[e] == c:
                e += 1
            L = paths.setdefault(c, [])
            if c in cur:
                L.append(f'm{x - cur[c]} 0h{e - x}')
            else:
                L.append(f'M{x} {y}.5h{e - x}')
            cur[c] = e
            x = e
    s = f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" shape-rendering="crispEdges">'
    for c, p in paths.items():
        col = pal[c]
        op = f' stroke-opacity="{int(col[7:], 16) / 255:.2f}"' if len(col) == 9 else ''
        s += f'<path d="{"".join(p)}" stroke="{col[:7]}"{op}/>'
    s += '</svg>'
    # 文字をへらすため、%・#・<・> と引用符だけをおきかえる（空白などはそのまま。url("…") の中なので使える）
    s = s.replace('%', '%25').replace('#', '%23').replace('<', '%3C').replace('>', '%3E').replace('"', "'")
    return 'url("data:image/svg+xml,' + s + '")'


# ---- 紙のわく ----
S = 5            # わくの絵のはしの大きさ（ドット）。index.html の「5 fill / calc(var(--pp)*5)」と同じ
M = 40           # 辺のまん中（くりかえす所）。長くして、でこぼこが同じ間かくにならぶのを目立たなくする
N = 2 * S + M    # 50
PR = [4, 2, 1, 1]
# 辺ごとのでこぼこ（1＝1ドット内がわ）。はしは0にして、となりのくりかえしとつなげる
WOB = {
    't': '0000011111110000000000000000111100000000',
    'b': '0000000000001111111110000000000000110000',
    'l': '0000000000111111100000000000000000000000',
    'r': '0000000000000000000000001111111110000000',
}


def paper_rows():
    H = N + 1  # いちばん下の1行は紙のかげ
    cp = lambda d: PR[d] if d < 4 else 0
    mid = lambda i: S <= i < N - S
    wv = lambda k, i: int(WOB[k][i - S]) if mid(i) else 0
    tI = lambda x: max(cp(min(x, N - 1 - x)), wv('t', x))
    bI = lambda x: max(cp(min(x, N - 1 - x)), wv('b', x))
    lI = lambda y: max(cp(min(y, N - 1 - y)), wv('l', y))
    rI = lambda y: max(cp(min(y, N - 1 - y)), wv('r', y))

    def ins(x, y):
        return 0 <= x < N and 0 <= y < N and tI(x) <= y <= N - 1 - bI(x) and lI(y) <= x <= N - 1 - rI(y)
    rows = []
    for y in range(H):
        r = ''
        for x in range(N):
            if ins(x, y):
                edge = not (ins(x - 1, y) and ins(x + 1, y) and ins(x, y - 1) and ins(x, y + 1))
                r += 'o' if edge else 'a'
            elif y >= N - S and ins(x, y - 1):
                r += 's'  # 紙の下のかげ（1ドット下にずらした形）
            else:
                r += '.'
        rows.append(r)
    return rows


PAPER = paper_rows()
# 下のはしの行数は S のまま使うため、絵の高さは N+1。slice は 上5 左右5 下6
PSLICE = f'{S} {S} {S+1} {S}'
PWIDTH = f'calc(var(--pp)*{S}) calc(var(--pp)*{S}) calc(var(--pp)*{S+1}) calc(var(--pp)*{S})'

PAPER_SEL = ('.hud,.dock,.quest,.sheet,.dlg::before,.toast,.paper,#helpPop .hc,.idea-card,.askyn .ak,'
             '#rlv .rcard,.iinfo,#confirm,#palette,.wcard,.idea-item,.pxcard,#idle .card,#lvup .pw')
SHADOW = '#8a6a4559'


def paper_css():
    base = svg(PAPER, {'a': '#f4e9d2', 'o': '#a8743f', 's': SHADOW})
    gold = svg(PAPER, {'a': '#f4e9d2', 'o': '#e8c766', 's': SHADOW})
    rule = lambda sel, u: (f'{sel}{{border-image-source:{u}!important;border-image-slice:{PSLICE} fill!important;'
                           f'border-image-width:{PWIDTH}!important;border-image-repeat:round!important}}')
    return '\n'.join([
        '/* 紙のわく：辺が1ドットずつゆるくでこぼこ・下に紙のかげ（tools/ui/paper_ui.py で作る） */',
        rule(PAPER_SEL, base),
        rule('.godSay', gold),
    ])


# ---- 依頼ボード：コルク（32×32 の、くりかえすドットの絵。つぶつぶの色を4つ） ----
def cork_rows():
    import random
    rnd = random.Random(7)  # いつも同じ絵になるように
    W = H = 32
    g = [['a'] * W for _ in range(H)]
    for _ in range(150):
        x, y = rnd.randrange(W), rnd.randrange(H)
        c = rnd.choice('ddddllm')
        g[y][x] = c
        if c == 'd' and rnd.random() < .45: g[y][(x + 1) % W] = 'd'  # 小さなかたまり
        if c == 'm' and rnd.random() < .5: g[(y + 1) % H][x] = 'd'
    return [''.join(r) for r in g]


def board_css():
    u = svg(cork_rows(), {'a': '#c99a62', 'd': '#b0824c', 'l': '#dcb27a', 'm': '#94693a'})
    return ('/* 依頼ボード：コルク（つぶつぶのドットの絵、1ドット1.5px）。わくは木のまま */\n'
            f'.board{{background:#c99a62 {u} 0 0/48px 48px repeat!important;image-rendering:pixelated}}')


# ---- 図鑑：本の背としおり ----
def spine_rows():
    # たてにくりかえす本の背（はば7・高さ8）。とじ糸が8ドットごと
    return ['oddddbo', 'oddddbo', 'odtddbo', 'odttdbo', 'oddtdbo', 'oddddbo', 'oddddbo', 'oddddbo']


def ribbon_rows():
    r = ['oaaaao'] * 18 + ['oaaaao', 'oaoaao'.replace('o', 'o'), 'oa..ao', 'o....o']
    r = ['oaaaao'] * 18 + ['oaaaao', 'oaa.ao', 'oa..ao', 'o....o']
    # 右がわに1ドットのかげ
    r = [x[:4] + ('b' if x[4] == 'a' else x[4]) + x[5] for x in r]
    return r


def book_css():
    sp = svg(spine_rows(), {'o': '#7a4f2b', 'd': '#a8743f', 'b': '#c99257', 't': '#f4e9d2'})
    rb = svg(ribbon_rows(), {'o': '#8f3a2a', 'a': '#d65a45', 'b': '#b54835'})
    return '\n'.join([
        '/* 図鑑：本の背（左）と、しおりのリボン（上） */',
        f'.sheet[data-k="zukan"]{{padding-left:calc(var(--pp)*9)}}',
        f'.sheet[data-k="zukan"]::before{{content:"";position:absolute;left:calc(var(--pp)*1);top:calc(var(--pp)*6);bottom:0;width:calc(var(--pp)*7);background:{sp} 0 0/calc(var(--pp)*7) calc(var(--pp)*8) repeat-y;image-rendering:pixelated;pointer-events:none}}',
        f'.sheet[data-k="zukan"]::after{{content:"";position:absolute;right:64px;top:calc(var(--pp)*-2);width:calc(var(--pp)*6);height:calc(var(--pp)*22);background:{rb} 0 0/100% 100% no-repeat;image-rendering:pixelated;pointer-events:none}}',
    ])


# ---- 木目（草原の板・ボタンでつかう） ----
import math


def _h(x, y):  # いつも同じになる、ドットごとのばらつき（0〜1）
    v = (x * 374761393 + y * 668265263) & 0xffffffff
    v = ((v ^ (v >> 13)) * 1274126177) & 0xffffffff
    return (v & 0xffff) / 65535


TEX = ROOT / 'tools' / 'art' / 'textures' / 'wood049.png'  # CC0 の木のテクスチャ（横むきの木目・くりかえしてつながる）
_TEXC = {}


def tex_tones(T):
    """木のテクスチャを T×T ドットにちぢめ（BOX）、明るさを4つのこさ（'D' こい・'g'・'a' 地・'l' 明るい）にする。
    木目の流れる向き（横）になめらかにして、短い点（2ドットより短いつづき）はけす。くりかえしてもつながる。"""
    if T in _TEXC: return _TEXC[T]
    from PIL import Image
    im = Image.open(TEX).convert('L').resize((T, T), Image.BOX)
    px = [[im.getpixel((x, y)) for x in range(T)] for y in range(T)]
    # 横（木目の向き）に、となりと平均して、なめらかに
    sm = [[(px[y][(x - 1) % T] + 2 * px[y][x] + px[y][(x + 1) % T]) / 4 for x in range(T)] for y in range(T)]
    vals = sorted(v for r in sm for v in r)
    q = lambda f: vals[int(f * (len(vals) - 1))]
    cD, cg, cl = q(.12), q(.34), q(.86)
    g = [['D' if v <= cD else 'g' if v <= cg else 'l' if v >= cl else 'a' for v in r] for r in sm]
    for y in range(T):  # 短い点をけす
        r = g[y]
        for x in range(T):
            if r[x] != r[(x - 1) % T] and r[x] != r[(x + 1) % T]:
                r[x] = r[(x - 1) % T]
    _TEXC[T] = [''.join(r) for r in g]
    return _TEXC[T]


def grain(x, y, P, Q=None, **_):
    """木目：テクスチャ（P×P にちぢめた物）の、そのドットのこさ"""
    t = tex_tones(P)
    return t[y % P][x % P]


# ---- 草原のパネル：切りっぱなしの明るい板（わくなし・木目） ----
WM = 96  # 辺のまん中・中の木目のくりかえし（border-image の round で、まん中もならべる）


def wood_rows():
    NW = 2 * S + WM
    cp = lambda d: PR[d] if d < 4 else 0
    tI = lambda x: cp(min(x, NW - 1 - x))
    lI = lambda y: cp(min(y, NW - 1 - y))
    ins = lambda x, y: 0 <= x < NW and 0 <= y < NW and tI(x) <= y <= NW - 1 - tI(x) and lI(y) <= x <= NW - 1 - lI(y)
    def center(x, y):  # 中は、こまかい木目（WM×WM でくりかえす）とふし
        return grain((x - S) % WM, (y - S) % WM, WM)
    # 切りっぱなしの板：わくはなし。ふちの1ドットだけ、切り口の色（上・左は明るく、下・右は少し暗い）。下の2行は板のあつみ、その下にかげ
    rows = []
    for y in range(NW + 1):
        r = ''
        for x in range(NW):
            if not ins(x, y):
                r += 's' if (y >= NW - S and ins(x, y - 1)) else '.'
                continue
            dt, db, dl, dr = y - tI(x), NW - 1 - tI(x) - y, x - lI(y), NW - 1 - lI(y) - x
            if db <= 1 and not (dl == 0 or dr == 0):
                r += 'd' if db == 0 else 'w'; continue  # 板のあつみ（下の切り口）
            if min(dt, dl) == 0 or not (ins(x - 1, y) and ins(x, y - 1)):
                r += 'h'; continue
            if min(db, dr) == 0 or not (ins(x + 1, y) and ins(x, y + 1)):
                r += 'w'; continue
            if (dt == 1 or dl == 1) and min(db, dr) > 1:
                r += 'k'; continue  # つや：上と左のふちの内がわに、明るい線
            if dt + dl <= 4 and dt >= 1 and dl >= 1 and (dt, dl) in ((2, 2), (2, 3), (3, 2)):
                r += 'q'; continue  # つや：左上の角の光
            r += center(x, y)
        rows.append(r)
    return rows


WOOD_SEL = ('.hud,.dock,.quest,.sheet,.dlg::before,.toast,#helpPop .hc,.idea-card,.askyn .ak,'
            '#rlv .rcard,.iinfo,#confirm,#palette,.wcard,.idea-item,.pxcard,#idle .card,#lvup .pw')


def wood_css():
    # 木目のこさ（g・D・l）は、地の色 a との差を、もとの4分の1にして、うすくしてある
    u = svg(wood_rows(), {'a': '#ecd6ad', 'g': '#e9d2a8', 'D': '#e6cea2', 'l': '#eed9b2', 'h': '#fff4dc',
                          'k': '#f7e9cd', 'q': '#fffaf0', 'w': '#c9a46e', 'd': '#a8743f', 's': SHADOW})
    sel = ','.join('body.wd0 ' + x.strip() for x in WOOD_SEL.split(','))
    return ('/* 草原のパネルは、切りっぱなしの明るい板（わくなし・木目）。依頼ボードの紙はそのまま。body.wd0 は ui-fx.js の uiStageSync */\n'
            f'{sel}{{border-image-source:{u}!important;border-image-repeat:round!important}}')


# ---- 草原のボタン：板と同じ、切りっぱなしの木（木目・ふちは切り口の色・下に2ドットのあつみ）。おしたときは、あつみがなくなって2ドット下がる ----
BS, BM = 7, 48      # はし（上下7・左右5）と、くりかえす所
BN = 2 * BS + BM    # 30（たても横も）


def wbtn_rows(pressed=False):
    """板にはめこんだボタン：まわりに2ドットのすきま（みぞ。上と左はかげでこく、下と右はうすい）、中に面（板と同じ高さ）。
    おしたときは、面の上と左のふちにかげが入って、しずんで見える（あつみ・下のかげはない）"""
    W = H = BN
    cp = lambda d: PR[d] if d < 4 else 0
    tI = lambda x: cp(min(x, W - 1 - x))
    lI = lambda y: cp(min(y, H - 1 - y))
    ins = lambda x, y: 0 <= x < W and 0 <= y < H and tI(x) <= y <= H - 1 - tI(x) and lI(y) <= x <= W - 1 - lI(y)
    GAP = 2
    def kk(x, y):
        dt, db, dl, dr = y - tI(x), H - 1 - tI(x) - y, x - lI(y), W - 1 - lI(y) - x
        return min(dt, db, dl, dr), (dt, db, dl, dr)
    face = lambda x, y: ins(x, y) and kk(x, y)[0] >= GAP
    rows = []
    for y in range(H):
        r = ''
        for x in range(W):
            if not ins(x, y): r += '.'; continue
            k, (dt, db, dl, dr) = kk(x, y)
            if k < GAP:
                r += 'G' if min(dt, dl) <= min(db, dr) else 'B'; continue  # すきま
            fx, fy = x - GAP, y - GAP
            ft, fl = k - GAP if dt == k else 99, k - GAP if dl == k else 99  # 面のふちからの近さ（上・左）
            fb, fr = k - GAP if db == k else 99, k - GAP if dr == k else 99  # （下・右）
            top_left = min(ft, fl) < min(fb, fr)
            e = min(ft, fl, fb, fr)
            if e <= 2:  # 面のふち3ドットに光とかげの段（ふくらんだ立体。おしたときは光とかげが入れかわって、へこむ）
                lit = top_left != pressed
                r += ('h', 'k', 'm')[e] if lit else ('e', 'E', 'F')[e]; continue
            if not pressed and (fx, fy) in ((3, 3), (4, 3), (3, 4), (5, 3)): r += 'q'; continue  # つや：左上の光
            r += grain(x % BM, y % BM, BM)
        rows.append(r)
    return rows


WBTN = {  # 面・木目・上のふち・下のふち・あつみ・あつみの下
    'n': {'a': '#e2c18b', 'g': '#dfbe86', 'D': '#dcba82', 'l': '#e4c48f', 'h': '#fbeccf', 'k': '#f2dcb2', 'm': '#e9cf9e',
          'q': '#fffaf0', 'e': '#b08552', 'E': '#c49a62', 'F': '#d3ad76', 'G': '#a07a4c', 'B': '#c29c6a', 'S': '#c49c66', 't': '#b98a52', 'b': '#8a5a30', 's': SHADOW},
    'p': {'a': '#b98551', 'g': '#b4804c', 'D': '#b17e4c', 'l': '#bc8854', 'h': '#dcaa72', 'k': '#d29f68', 'm': '#c4915c',
          'q': '#f6d6aa', 'e': '#7e5430', 'E': '#946238', 'F': '#a67244', 'G': '#6e4a28', 'B': '#8a5a30', 'S': '#8f5f34', 't': '#7e5430', 'b': '#5e3d22', 's': SHADOW},
    'y': {'a': '#f0cf86', 'g': '#edcb80', 'D': '#eac87d', 'l': '#f2d28a', 'h': '#fdecc4', 'k': '#fbe6b4', 'm': '#f6dca0',
          'q': '#fffdf0', 'e': '#c4943f', 'E': '#d6aa58', 'F': '#e3bc6a', 'G': '#a07a4c', 'B': '#c29c6a', 'S': '#d0a453', 't': '#b98a3a', 'b': '#7a5218', 's': SHADOW},
}


def wbtn_css():
    w = lambda k, pr=False: svg(wbtn_rows(pr), WBTN[k])
    sl = (f'border-image-slice:{BS} 5 {BS} 5 fill!important;border-image-width:calc(var(--pp)*{BS}) calc(var(--pp)*5) '
          f'calc(var(--pp)*{BS}) calc(var(--pp)*5)!important;border-image-repeat:round!important')
    q = lambda sel: ','.join('body.wd0 ' + x.strip() for x in sel.split(','))
    return '\n'.join([
        '/* 草原のボタンは木（板と同じ切りっぱなし。ふつう・大事・えらんだ、と、おしたとき） */',
        f'{q(".btn,.ctab,.slot,.qbtn,.mtile,.chip,#speedBtn,#pauseBtn,#skipBtn,.dock button")}{{border-image-source:{w("n")}!important;{sl}}}',
        f'{q(".btn.pri,.ctab.on,.chip.more,.palA")}{{border-image-source:{w("p")}!important;{sl}}}',
        f'{q(".chip.sel")}{{border-image-source:{w("y")}!important;{sl}}}',
        f'{q(".btn:active,.ctab:active,.slot:active,.mtile:active,.chip:active,#speedBtn:active,#pauseBtn:active,#skipBtn:active,.dock button:active")}{{border-image-source:{w("n", True)}!important;{sl}}}',
        f'{q(".btn.pri:active,.ctab.on:active,.chip.more:active,.dock button.on,.dock button.on:active")}{{border-image-source:{w("p", True)}!important;{sl}}}',
    ])


# ---- 草原の丸いボタン（とじるボタン・守りの光）：切りっぱなしの丸い木（木目・下に2ドットのあつみ） ----
def disk_rows(N, rim=True):
    """板にはめこんだ丸いボタン：まわりに2ドットのすきま（上がわはかげでこい）、中に木の面"""
    c, R = N / 2, N / 2
    dist = lambda x, y: ((x + .5 - c) ** 2 + (y + .5 - c) ** 2) ** .5
    inside = lambda x, y: 0 <= x < N and 0 <= y < N and dist(x, y) <= R
    face = lambda x, y: inside(x, y) and dist(x, y) <= R - 2
    rows = []
    for y in range(N):
        r = ''
        for x in range(N):
            if not inside(x, y): r += '.'; continue
            if not face(x, y): r += 'G' if (x + .5 - c) + (y + .5 - c) < 0 else 'B'; continue  # すきま
            d = dist(x, y); e = int((R - 2) - d)
            if e <= 2:  # 面のふち3ドットに光とかげの段（左上が光、右下がかげ）
                lit = (x + .5 - c) + (y + .5 - c) < 0
                r += ('h', 'k', 'm')[max(0, e)] if lit else ('e', 'E', 'F')[max(0, e)]
            elif (x + .5 - c + R * .42) ** 2 + (y + .5 - c + R * .42) ** 2 < (R * .08) ** 2: r += 'q'  # つや：左上の光
            else: r += grain(x, y, 64)
        rows.append(r)
    return rows


def disk_css():
    n = {k: v for k, v in WBTN['n'].items() if k != 's'}
    lit = {k: v for k, v in WBTN['y'].items() if k != 's'}
    x = svg(disk_rows(23), n)
    gb = svg(disk_rows(52), n)
    gc = svg(disk_rows(52), lit)
    return '\n'.join([
        '/* 草原の丸いボタン：とじるボタン・守りの光／こもれびのまもり（たまった所は、はちみつ色の木） */',
        f'body.wd0 .sheet .x{{background:{x} center/100% 100% no-repeat!important}}',
        f'body.wd0 .guard-btn .gb{{background:{gb} center/100% 100% no-repeat!important}}',
        f'body.wd0 .guard-btn .gc{{background:{gc} center/100% 100% no-repeat!important}}',
    ])


# ---- 草原のかざり：植物（すみの葉とつる・花）・木札をつるす横木 ----
SPRIG = [  # すみからのびる、つたの葉3まいと小さな花（22×18）。o 葉のふち・g 葉・l 葉の光・s くき・f 花・c 花のまん中
    '..............ooo.....',
    '.............ogllo....',
    '............ogglgo....',
    '............oggggo....',
    '.....oo......oggo.....',
    '....ogloo.....os......',
    '...ogglgo....s........',
    '...oggggo...s.........',
    '....oggo...s..fff.....',
    '.....oos..s..fcccf....',
    '.......s.s...fcccf....',
    '..oo....ss...fcccf....',
    '.oglo...s.....fff.....',
    '.oggos.s..............',
    '..oo..ss..............',
    '.....s................',
    '....s.................',
    '...s..................',
]
VINE = [  # 横木にからむ、つる（32×10。よこにくりかえす）
    '......oo..................oo....',
    '.....oggo................oglo...',
    '....oglgo...............oggo....',
    '.....oogs..............sgo......',
    '.......ss.............ss........',
    'ssss.....sssss....sssss.....ssss',
    '...........ss....ss.............',
    '............s.oo.s..............',
    '.............oggo...............',
    '..............oo................',
]
BEAM = [  # 横木（丸太。32×9、よこにくりかえす）
    'hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh',
    'aaaagaaaaaaaaaaaaagggaaaaaaaaaaa',
    'aaaaaaaaaaagggaaaaaaaaaaaaaagaaa',
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    'gggaaaaaaaaaaaaaaaaaaaggaaaaaaaa',
    'aaaaaaaggaaaaaaaaaaaaaaaaaaaaaga',
    'dddddddddddddddddddddddddddddddd',
    'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    'ssssssssssssssssssssssssssssssss',
]
ROPE = ['ab', 'bc', 'ab', 'bc']  # なわ（2×4、たてにくりかえす。ねじれ）


def deco_css():
    lp = {'o': '#4f8a40', 'g': '#7cc06a', 'l': '#a8dc8c', 's': '#7a5532', 'f': '#fff4f0', 'c': '#f2c94c'}
    sprig = svg(SPRIG, lp)
    sprigR = svg([r[::-1] for r in SPRIG], lp)
    vine = svg(VINE, lp)
    beam = svg(BEAM, {'h': '#d6a46c', 'a': '#b98551', 'g': '#a8743f', 'd': '#8a5a30', 'e': '#6e4a28', 's': SHADOW})
    rope = svg(ROPE, {'a': '#c9a36a', 'b': '#a8834f', 'c': '#8a6a45'})
    pp = 'var(--pp)'
    return '\n'.join([
        '/* 草原のかざり：上の欄と画面のすみに植物（つたの葉・小さな花）。下のバーは横木からつるした木札（なわ・つる） */',
        f'body.wd0 #topUI .hud{{position:relative}}',
        f'body.wd0 #topUI .hud::before,body.wd0 .sheet:not([data-k="zukan"])::before{{content:"";position:absolute;left:calc({pp}*-5);top:calc({pp}*-6);width:calc({pp}*22);height:calc({pp}*18);background:{sprig} 0 0/100% 100% no-repeat;image-rendering:pixelated;pointer-events:none;z-index:2}}',
        f'body.wd0 #topUI .hud::after{{content:"";position:absolute;right:calc({pp}*-5);top:calc({pp}*-6);width:calc({pp}*22);height:calc({pp}*18);background:{sprigR} 0 0/100% 100% no-repeat;image-rendering:pixelated;pointer-events:none;z-index:2}}',
        f'body.wd0 .dock{{position:relative;border-image:none!important;background:none!important;box-shadow:none!important;padding:calc({pp}*20) 4px 4px!important;overflow:visible}}',
        f'body.wd0 .dock::before{{content:"";position:absolute;left:0;right:0;top:0;height:calc({pp}*9);background:{beam} 0 0/calc({pp}*32) calc({pp}*9) repeat-x;image-rendering:pixelated;pointer-events:none}}',
        f'body.wd0 .dock::after{{content:"";position:absolute;left:0;right:0;top:calc({pp}*-1);height:calc({pp}*10);background:{vine} calc({pp}*7) 0/calc({pp}*32) calc({pp}*10) repeat-x;image-rendering:pixelated;pointer-events:none}}',
        f'body.wd0 .dock button,body.wd0 .quest{{position:relative;overflow:visible}}',
        f'body.wd0 .dock button::before,body.wd0 .dock button::after,body.wd0 .quest::before,body.wd0 .quest::after{{content:"";position:absolute;top:calc({pp}*-13);width:calc({pp}*2);height:calc({pp}*13);background:{rope} 0 0/calc({pp}*2) calc({pp}*4) repeat-y;image-rendering:pixelated;pointer-events:none}}',
        f'body.wd0 .dock button::before,body.wd0 .quest::before{{left:22%}}body.wd0 .dock button::after,body.wd0 .quest::after{{right:22%}}',
        f'body.wd0 .quest::before,body.wd0 .quest::after{{top:calc({pp}*-8);height:calc({pp}*8)}}',
    ])


def main():
    css = '\n'.join([paper_css(), wood_css(), wbtn_css(), disk_css(), deco_css(), board_css(), book_css()])
    s = HTML.read_text()
    b, e = '/* paper-ui:begin */', '/* paper-ui:end */'
    if b not in s:
        raise SystemExit('index.html に ' + b + ' がない')
    s = re.sub(re.escape(b) + r'.*?' + re.escape(e), lambda m: b + '\n' + css + '\n' + e, s, flags=re.S)
    HTML.write_text(s)
    print('wrote', len(css), 'chars')


if __name__ == '__main__':
    main()
