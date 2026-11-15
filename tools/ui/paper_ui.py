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
    """ぷくっとふくらんだ木の板のボタン（角は小さく、まるくしすぎない）。こい木のふち、上は光、下はかげ、下に3ドットのあつみ。
    おしたときは、あつみが1ドットになって、面が2ドット下がり、少しくらくなる（ぺこっとへこむ）"""
    W = H = BN
    TH = 1 if pressed else 3
    fh = H - 4  # 面の高さ（下に、あつみ3＋かげ1）
    top = 2 if pressed else 0
    PRB = [2, 1]
    cp = lambda d: PRB[d] if d < len(PRB) else 0
    def face(x, y):
        y -= top
        if not (0 <= x < W and 0 <= y < fh): return False
        return cp(min(x, W - 1 - x)) <= y <= fh - 1 - cp(min(x, W - 1 - x)) and cp(min(y, fh - 1 - y)) <= x <= W - 1 - cp(min(y, fh - 1 - y))
    rows = []
    for y in range(H):
        r = ''
        for x in range(W):
            if face(x, y):
                if not (face(x - 1, y) and face(x + 1, y) and face(x, y - 1) and face(x, y + 1)): r += 'o'; continue
                fy = y - top
                if pressed:
                    r += 'E' if fy == 1 else 'F' if fy == 2 else ('e' if fy >= fh - 2 else grain(x % BM, y % BM, BM)); continue
                if fy == 1: r += 'h'; continue
                if fy == 2: r += 'k'; continue
                if fy == 3: r += 'm'; continue
                if x == 1 and fy < fh - 3: r += 'k'; continue
                if (x, fy) in ((2, 2), (3, 2), (4, 2)): r += 'q'; continue
                if fy >= fh - 2: r += 'e' if fy == fh - 2 else 'E'; continue
                r += grain(x % BM, y % BM, BM); continue
            below = [face(x, y - d) for d in range(1, TH + 2)]
            if any(below[:TH]):
                r += 'b' if (face(x, y - TH) and not face(x, y - 1)) or (TH == 1) else 't'; continue
            if below[TH]:
                r += 's'; continue
            r += '.'
        rows.append(r)
    return rows


WBTN = {  # 面・木目・上のふち・下のふち・あつみ・あつみの下
    'n': {'o': '#8a5a30', 'a': '#e2c18b', 'g': '#dfbe86', 'D': '#dcba82', 'l': '#e4c48f', 'h': '#fbeccf', 'k': '#f2dcb2', 'm': '#e9cf9e',
          'q': '#fffaf0', 'e': '#b08552', 'E': '#c49a62', 'F': '#d3ad76', 'G': '#a07a4c', 'B': '#c29c6a', 'S': '#c49c66', 't': '#b98a52', 'b': '#8a5a30', 's': SHADOW},
    'p': {'o': '#5e3d22', 'a': '#b98551', 'g': '#b4804c', 'D': '#b17e4c', 'l': '#bc8854', 'h': '#dcaa72', 'k': '#d29f68', 'm': '#c4915c',
          'q': '#f6d6aa', 'e': '#7e5430', 'E': '#946238', 'F': '#a67244', 'G': '#6e4a28', 'B': '#8a5a30', 'S': '#8f5f34', 't': '#7e5430', 'b': '#5e3d22', 's': SHADOW},
    'y': {'o': '#9a6a20', 'a': '#f0cf86', 'g': '#edcb80', 'D': '#eac87d', 'l': '#f2d28a', 'h': '#fdecc4', 'k': '#fbe6b4', 'm': '#f6dca0',
          'q': '#fffdf0', 'e': '#c4943f', 'E': '#d6aa58', 'F': '#e3bc6a', 'G': '#a07a4c', 'B': '#c29c6a', 'S': '#d0a453', 't': '#b98a3a', 'b': '#7a5218', 's': SHADOW},
}


def wbtn_css():
    w = lambda k, pr=False: svg(wbtn_rows(pr), WBTN[k])
    sl = (f'border-image-slice:{BS} 5 {BS} 5 fill!important;border-image-width:calc(var(--pp)*{BS}) calc(var(--pp)*5) '
          f'calc(var(--pp)*{BS}) calc(var(--pp)*5)!important;border-image-repeat:round!important')
    q = lambda sel: ','.join('body.wd0 ' + x.strip() for x in sel.split(','))
    return '\n'.join([
        '/* 草原のボタンは木（板と同じ切りっぱなし。ふつう・大事・えらんだ、と、おしたとき） */',
        f'{q(".btn,.ctab,.slot,.qbtn,.mtile,.chip,#speedBtn,#pauseBtn,#skipBtn")}{{border-image-source:{w("n")}!important;{sl}}}',
        f'{q(".btn.pri,.ctab.on,.chip.more,.palA")}{{border-image-source:{w("p")}!important;{sl}}}',
        f'{q(".chip.sel")}{{border-image-source:{w("y")}!important;{sl}}}',
        f'{q(".btn:active,.ctab:active,.slot:active,.mtile:active,.chip:active,#speedBtn:active,#pauseBtn:active,#skipBtn:active")}{{border-image-source:{w("n", True)}!important;{sl}}}',
        f'{q(".btn.pri:active,.ctab.on:active,.chip.more:active")}{{border-image-source:{w("p", True)}!important;{sl}}}',
    ])


# ---- 草原の丸いボタン（とじるボタン・守りの光）：切りっぱなしの丸い木（木目・下に2ドットのあつみ） ----
def disk_rows(N, rim=True):
    """すこしベベルした木の円柱（上から少し見おろした形）：上の面は丸く、こい木のふち、ふちの2ドットがななめに落ちる面（左上は光・右下はかげ）、
    下に円柱の側面（あつみ）。光は、ふちにそった、とぎれない弧だけ（点の光はつけない）"""
    import math
    TH = 2 if N < 30 else 4  # 側面のあつみ
    r = (N - TH) / 2
    cx, cy = N / 2, r
    d = lambda x, y, oy=0: ((x + .5 - cx) ** 2 + (y + .5 - cy - oy) ** 2) ** .5
    top = lambda x, y: 0 <= x < N and 0 <= y < N and d(x, y) <= r
    side = lambda x, y: any(d(x, y, k) <= r for k in range(1, TH + 1))
    # ふちからの段（0 がこいふち、1・2… が内がわ）
    ring = {}
    for y in range(N):
        for x in range(N):
            if top(x, y) and not (top(x - 1, y) and top(x + 1, y) and top(x, y - 1) and top(x, y + 1)): ring[x, y] = 0
    BV = 2 if N < 30 else 3  # ベベルのはば
    for k in range(1, BV + 1):
        for y in range(N):
            for x in range(N):
                if top(x, y) and (x, y) not in ring and any(ring.get(q) == k - 1 for q in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1))): ring[x, y] = k
    rows = []
    for y in range(N):
        o = ''
        for x in range(N):
            if top(x, y):
                k = ring.get((x, y))
                if k == 0: o += 'o'; continue
                if k is not None:
                    a = math.degrees(math.atan2(y + .5 - cy, x + .5 - cx))  # -135 が左上
                    t = abs(((a + 135) + 180) % 360 - 180)  # 左上からの角度 0〜180
                    if t < 50: o += 'h' if k == 1 else 'k'
                    elif t < 95: o += 'k' if k == 1 else 'm'
                    elif t < 130: o += 'm' if k == 1 else grain(x, y, 64)
                    else: o += 'E' if k == 1 else 'F'
                    continue
                o += grain(x, y, 64); continue
            if side(x, y):
                edge = not side(x, y + 1) or not (side(x - 1, y) or top(x - 1, y)) or not (side(x + 1, y) or top(x + 1, y))
                o += 'b' if edge else ('e' if x + .5 < cx else 't')
                continue
            o += '.'
        rows.append(o)
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
# 植物は、葉・花の型（ドット）を、くきの上にならべて組む。色：o 葉のふち・d 葉のかげ・g 葉・l 葉の光・h 葉のつや・v 葉すじ
#   s くき・S くきの光・r 花のふち・P 花のかげ・p 花・q 花の光・c 花のしん・C しんのかげ・x 白い花のふち・W 白い花のかげ・w 白い花
LEAF = [  # ハート形のつたの葉（7×6、下向き）。左が光・右がかげ
    '.oo.oo.',
    'olhogdo',
    'ollvgdo',
    '.olvdo.',
    '..ovo..',
    '...o...',
]
LEAFS = [  # 小さな葉（5×4）
    '.o.o.',
    'olvdo',
    '.ovo.',
    '..o..',
]
ROSE = [  # ピンクの花（7×7）：花びらのかさなりのかげ
    '..rrr..',
    '.rqqpr.',
    'rqpPppr',
    'rppqPpr',
    'rpPppPr',
    '.rpPPr.',
    '..rrr..',
]
DAISY = [  # 白い小花（5×5）
    '.xwx.',
    'xwwwx',
    'wwccw',
    'xwCWx',
    '.xWx.',
]
BUD = ['.r.', 'rqr', 'rPr', 'ovo']  # つぼみ（3×4、がく）
LEAFR = [  # 横向きの葉（8×5、右向き）
    '.oo.....',
    'olhgoo..',
    '.ovvvddo',
    'olgddoo.',
    '.oo.....',
]


def flipx(t): return [r[::-1].translate(str.maketrans('lhdg', 'dglh')) if False else r[::-1] for r in t]


def plant(W, H, stems, items):
    """stems: [(x,y),...] の点をつなぐくき。items: (型, x, y, 左右反転) を、うしろから順にかさねる"""
    g = [['.'] * W for _ in range(H)]
    for pts in stems:
        for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
            n = max(abs(x1 - x0), abs(y1 - y0), 1)
            for k in range(n + 1):
                x = round(x0 + (x1 - x0) * k / n); y = round(y0 + (y1 - y0) * k / n)
                if 0 <= x < W and 0 <= y < H: g[y][x] = 's'
    for t, x0, y0, fl in items:
        t = [r[::-1] for r in t] if fl else t
        if fl:  # 反転しても、光は左上
            t = [r.translate(str.maketrans('ld', 'dl')) for r in t]
        for y, r in enumerate(t):
            for x, c in enumerate(r):
                if c != '.' and 0 <= x0 + x < W and 0 <= y0 + y < H: g[y0 + y][x0 + x] = c
    return [''.join(r) for r in g]


# 左上：すみから下へ、ゆれながらたれる、つた（24×40）。葉は大小・下向き・横向きをまぜる
IVY = plant(24, 40,
            [[(15, 0), (13, 4), (11, 9), (9, 13), (8, 18), (9, 23), (8, 28), (6, 33), (6, 38)],
             [(11, 9), (13, 11)]],
            [(LEAF, 11, 0, False), (LEAFR, 1, 6, True), (LEAFS, 12, 11, False), (LEAFS, 4, 12, True),
             (LEAFR, 10, 18, False), (LEAF, 2, 21, True), (LEAFS, 9, 27, False), (LEAF, 1, 30, True), (LEAFS, 5, 36, False)])
# 右上：花のかたまり（28×18）。葉をうしろに、ピンクの花2つ・白い小花2つ・つぼみ2つをよせて、花束のようにまとめる
BLOOM = plant(28, 18,
              [[(14, 17), (14, 12), (11, 8)], [(14, 12), (18, 9)], [(14, 14), (6, 8)], [(14, 14), (23, 9)]],
              [(LEAFR, 0, 9, True), (LEAFR, 20, 9, False), (LEAF, 4, 1, True), (LEAF, 17, 2, False), (LEAFS, 11, 12, False),
               (LEAF, 8, 9, True), (LEAF, 14, 9, False),
               (ROSE, 8, 3, False), (ROSE, 14, 5, True), (DAISY, 4, 7, False), (DAISY, 20, 6, False),
               (BUD, 6, 1, False), (BUD, 22, 2, False), (LEAFS, 12, 14, False)])
SPRIG = BLOOM
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
    lp = {'o': '#4a8a3e', 'd': '#62a352', 'g': '#7cc06a', 'l': '#a2d886', 'h': '#d2f0b0', 'v': '#5c9a4c',
          's': '#7a5532', 'S': '#a8784a', 'r': '#c9637f', 'P': '#e48aa2', 'p': '#f6aec0', 'q': '#ffd8e2',
          'c': '#f2c94c', 'C': '#d9a23a', 'x': '#cdbfa6', 'W': '#ece0cc', 'w': '#fffaf2', 'f': '#fff4f0', 'b': '#e88aa2'}
    ivy = svg(IVY, lp)
    bloom = svg(BLOOM, lp)
    vine = svg(VINE, lp)
    beam = svg(BEAM, {'h': '#d6a46c', 'a': '#b98551', 'g': '#a8743f', 'd': '#8a5a30', 'e': '#6e4a28', 's': SHADOW})
    rope = svg(ROPE, {'a': '#c9a36a', 'b': '#a8834f', 'c': '#8a6a45'})
    tag = svg(wood_rows(), {'a': '#e6cb99', 'g': '#e2c693', 'D': '#dec18d', 'l': '#ead0a2', 'h': '#f4e1bd',
                            'w': '#b98a52', 'd': '#8a5a30', 'k': '#efd8ae', 'q': '#f8ead0', 's': SHADOW})  # 下の木札：パネルより少しこい、切りっぱなしの板
    pp = 'var(--pp)'
    return '\n'.join([
        '/* 草原のかざり：上の欄と画面のすみに植物（つたの葉・小さな花）。下のバーは横木からつるした木札（なわ・つる） */',
        f'body.wd0 #topUI .hud{{position:relative}}',
        f'body.wd0 #topUI .hud::before{{content:"";position:absolute;left:calc({pp}*-6);top:calc({pp}*-5);width:calc({pp}*{len(IVY[0])});height:calc({pp}*{len(IVY)});background:{ivy} 0 0/100% 100% no-repeat;image-rendering:pixelated;pointer-events:none;z-index:2}}',
        f'body.wd0 #topUI .hud::after,body.wd0 .sheet:not([data-k="zukan"])::before{{content:"";position:absolute;right:calc({pp}*-4);top:calc({pp}*-7);width:calc({pp}*{len(BLOOM[0])});height:calc({pp}*{len(BLOOM)});background:{bloom} 0 0/100% 100% no-repeat;image-rendering:pixelated;pointer-events:none;z-index:2}}',
        f'body.wd0 .sheet:not([data-k="zukan"])::before{{right:auto;left:calc({pp}*8)}}',
        f'body.wd0 .dock{{position:relative;border-image:none!important;background:none!important;box-shadow:none!important;padding:calc({pp}*20) 4px 4px!important;overflow:visible}}',
        f'body.wd0 .dock::before{{content:"";position:absolute;left:calc(50% - 50vw);width:100vw;top:0;height:calc({pp}*9);background:{beam} 0 0/calc({pp}*32) calc({pp}*9) repeat-x;image-rendering:pixelated;pointer-events:none}}',
        f'body.wd0 .dock::after{{content:"";position:absolute;left:calc(50% - 50vw);width:100vw;top:calc({pp}*-1);height:calc({pp}*10);background:{vine} calc({pp}*7) 0/calc({pp}*32) calc({pp}*10) repeat-x;image-rendering:pixelated;pointer-events:none}}',
        f'body.wd0 .dock button,body.wd0 .quest{{position:relative;overflow:visible}}',
        f'body.wd0 .dock button{{border:solid transparent!important;border-width:calc({pp}*3)!important;border-image:{tag} 5 5 6 5 fill/calc({pp}*5) calc({pp}*5) calc({pp}*6) round!important;background:none!important;color:#86715a!important;transform:none}}',
        f'body.wd0 .dock button.on{{color:#4a2a12!important;filter:saturate(1.15) brightness(1.03);margin-top:calc({pp}*3);text-shadow:1.5px 0 0 rgba(140,90,40,.3),-1.5px 0 0 rgba(140,90,40,.3),0 1.5px 0 rgba(255,236,200,.7)}}',
        f'body.wd0 .dock button.on svg.pxi{{fill:#4a2a12!important}}',
        f'body.wd0 .dock button::before,body.wd0 .dock button::after,body.wd0 .quest::before,body.wd0 .quest::after{{content:"";position:absolute;top:calc({pp}*-16);width:calc({pp}*2);height:calc({pp}*19);background:linear-gradient(transparent calc(100% - {pp}*2),#5e3d22 0),{rope} 0 0/calc({pp}*2) calc({pp}*4) repeat-y;image-rendering:pixelated;pointer-events:none;z-index:1}}',
        f'body.wd0 .dock button::before,body.wd0 .quest::before{{left:22%}}body.wd0 .dock button::after,body.wd0 .quest::after{{right:22%}}',
        f'body.wd0 .quest::before,body.wd0 .quest::after{{top:calc({pp}*-8);height:calc({pp}*11)}}',
        f'body.wd0 .dock button.on::before,body.wd0 .dock button.on::after{{top:calc({pp}*-19);height:calc({pp}*22)}}',
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
