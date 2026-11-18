"""紙のUIの絵（わく・依頼ボードの板・図鑑の本の背としおり）を作って、index.html の
/* paper-ui:begin */ 〜 /* paper-ui:end */ のあいだに書きこむ。
  python3 tools/ui/paper_ui.py
  python3 tools/ui/paper_ui.py --part paper_css,dlg_css   # その物の行だけを入れかえる（手で直した行をのこす）
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

PAPER_SEL = ('.hud,.dock,.quest,.sheet,.toast,.paper,#helpPop .hc,.idea-card,.askyn .ak,'
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


PAPERTEX = pathlib.Path(__file__).resolve().parent.parent / 'art' / 'textures' / 'paper005.png'


def ptex_rows(T=96):
    """依頼の紙の柄：CC0 の紙のテクスチャ（ambientCG Paper005）を T×T にちぢめ（BOX）、こさを4つ（d こい・m 少しこい・.・l 明るい）にする。くりかえしてもつながる"""
    from PIL import Image
    im = Image.open(PAPERTEX).convert('L').resize((T, T), Image.BOX)
    px = [im.getpixel((x, y)) for y in range(T) for x in range(T)]
    m = sum(px) / len(px); sd = (sum((p - m) ** 2 for p in px) / len(px)) ** .5 or 1
    rows = []
    for y in range(T):
        r = ''
        for x in range(T):
            z = (px[y * T + x] - m) / sd
            r += 'd' if z < -1.1 else 'm' if z < -.35 else '.' if z < .6 else 'l'
        rows.append(r)
    return rows


FOLD = 16  # 角の折り返しの大きさ（ドット）


def note_rows(F=FOLD):
    """依頼の紙のわく（9スライス）：右下の角が、ゆるくまるくそり返った紙。
    そり返った所は、折り目（角に向かってへこんだ曲線 √u+√v=√F）と、外のふち（内がわの点 (F,F) を中心にした弧）のあいだ。
    a 紙・o ふち・e 折り目・B うらのかげ・b うら・h うらの光・k そりの下のかげ・s 紙のかげ。上と左のスライスは4、右は F+2、下は F+3"""
    import math
    NW = 2 * F + 8
    H = NW + 1
    cp = lambda d: PR[d] if d < 4 else 0
    A = lambda u, v: ((u + .5) / F) ** .6 + ((v + .5) / F) ** .6  # 折り目（1 より小さいと、なくなった角）
    Bq = lambda u, v: ((u + .5) / F) ** 1.6 + ((v + .5) / F) ** 1.6  # そり返った所の外のふち（1 より小さいと、そり返った所）
    cut = lambda u, v: u >= 0 and v >= 0 and A(u, v) < 1
    def ins(x, y):
        if not (0 <= x < NW and 0 <= y < NW): return False
        u, v = NW - 1 - x, NW - 1 - y
        if cut(u, v): return False
        return cp(min(x, u)) <= y <= NW - 1 - cp(min(x, u)) and cp(min(y, v)) <= x <= NW - 1 - cp(min(y, v))
    def flap(u, v): return u >= 0 and v >= 0 and Bq(u, v) < 1 and not cut(u, v)
    rows = []
    for y in range(H):
        r = ''
        for x in range(NW):
            u, v = NW - 1 - x, NW - 1 - y
            if ins(x, y):
                if flap(u, v):
                    a0, b0 = A(u, v) - 1, 1 - Bq(u, v)
                    t = a0 / (a0 + b0 + 1e-6)  # 0 折り目 → 1 外のふち
                    edge = not (flap(u - 1, v) and flap(u + 1, v) and flap(u, v - 1) and flap(u, v + 1))
                    if edge and Bq(u + 1, v) >= 1 or edge and Bq(u, v + 1) >= 1: r += 'o'
                    elif t < .18: r += 'e'
                    else: r += 'B' if t < .4 else 'b' if t < .75 else 'h'
                    continue
                if 1 <= Bq(u, v) < 1.22 and u < F and v < F:
                    r += 'k'; continue  # そりの下のかげ
                edge = not (ins(x - 1, y) and ins(x + 1, y) and ins(x, y - 1) and ins(x, y + 1))
                r += 'o' if edge else 'a'
            elif ins(x, y - 1) or (cut(u, v) and ins(x - 1, y)):
                r += 's'
            else:
                r += '.'
        rows.append(r)
    return rows


def pin_rows(N=18):
    """依頼の紙をとめる押しピン：白木の糸まき形のピンを、ボードにまっすぐさした形。頭がこちらを向き、少し下から見上げるので、
    おくの台（紙にのる円）は下に、手前の頭の面は上に見え、あいだに頭の側面が見える。紙には右下へかげ（16×16）。
    o ふち・h つや・l 頭の面の光・a 頭の面・d 側面・D 側面のかげ・b 台・s 紙に落ちるかげ"""
    import math
    cx = 8.5
    L = [  # おくから手前へ：(中心y, 半径, 色の決め方)
        ('base', 10.4, 7.0), ('side', 8.6, 6.1), ('face', 6.0, 6.1)]
    g = [['.'] * N for _ in range(N)]
    for y in range(N):  # かげ（頭の面を右下へずらした形）
        for x in range(N):
            if math.hypot(x + .5 - (cx + 2.0), y + .5 - 11.6) <= 6.2: g[y][x] = 's'
    for name, cy, r in L:
        inside = lambda x, y: math.hypot(x + .5 - cx, y + .5 - cy) <= r
        for y in range(N):
            for x in range(N):
                if not inside(x, y): continue
                edge = not (inside(x - 1, y) and inside(x + 1, y) and inside(x, y - 1) and inside(x, y + 1))
                if edge: g[y][x] = 'o'; continue
                dx = x + .5 - cx
                if name == 'base': g[y][x] = 'b'
                elif name == 'side': g[y][x] = 'D' if dx > 1.8 else 'd'
                else:
                    if math.hypot(dx + 2.2, y + .5 - (cy - 2.2)) < 1.3: g[y][x] = 'h'
                    else: g[y][x] = 'l' if dx < -.8 else 'a'
    return [''.join(r) for r in g]


PIN = pin_rows()


def note_css():
    F = FOLD
    fib = svg(ptex_rows(), {'d': '#8a6a3a24', 'm': '#8a6a3a10', 'l': '#ffffff70'})
    fr = svg(note_rows(), {'a': '#f4e9d2', 'o': '#a8743f', 'h': '#f7eedb', 'b': '#ebdcbb', 'B': '#dccaa2', 'e': '#c9ad7c', 'k': '#e2d3b2', 's': SHADOW})
    pin = svg(PIN, {'o': '#94704a', 'h': '#fffaf0', 'l': '#f7e8cc', 'a': '#ecd5ae', 'd': '#dcbd90', 'D': '#c9a676', 'b': '#d4b384', 's': '#3a2a1a38'})
    return ('/* 依頼の紙：右下の角がそり返った紙のわく（note_rows）と、紙の柄（ptex_rows：CC0 の紙のテクスチャ。そり返った角にはかけない） */\n'
            f'body .paper:not(.empty){{border-image-source:{fr}!important;border-image-slice:4 {F + 2} {F + 3} 4 fill!important;'
            f'border-image-width:4px {F + 2}px {F + 3}px 4px!important;border-image-repeat:stretch!important;padding-top:24px!important;padding-bottom:{F - 2}px!important}}\n'
            f'body .paper:not(.empty)::after{{content:"";position:absolute;inset:2px 2px 3px 2px;z-index:-1;pointer-events:none;image-rendering:pixelated;'
            f'background:{fib} 0 0/96px 96px repeat;'
            f'-webkit-mask:linear-gradient(#000 0 0) 0 0/100% calc(100% - {F}px) no-repeat,linear-gradient(#000 0 0) 0 0/calc(100% - {F}px) 100% no-repeat;'
            f'mask:linear-gradient(#000 0 0) 0 0/100% calc(100% - {F}px) no-repeat,linear-gradient(#000 0 0) 0 0/calc(100% - {F}px) 100% no-repeat}}\n'
            f'/* 押しピン：木のまるい頭（立体）とかげ */\n'
            f'body .paper:not(.empty)::before{{width:18px;height:18px;top:4px;margin-left:-9px;background:{pin} 0 0/18px 18px no-repeat!important;'
            f'-webkit-mask:none!important;mask:none!important;image-rendering:pixelated;z-index:1}}')


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


WOOD_SEL = ('.hud,.dock,.quest,.sheet,.toast,#helpPop .hc,.idea-card,.askyn .ak,'
            '#rlv .rcard,.iinfo,#confirm,#palette,.wcard,.idea-item,.pxcard,#idle .card,#lvup .pw,#lvup .card')


def wood_css():
    # 木目のこさ（g・D・l）は、地の色 a との差を、もとの4分の1にして、うすくしてある
    u = svg(wood_rows(), {'a': '#ecd6ad', 'g': '#e9d2a8', 'D': '#e6cea2', 'l': '#eed9b2', 'h': '#fff4dc',
                          'k': '#f7e9cd', 'q': '#fffaf0', 'w': '#c9a46e', 'd': '#a8743f', 's': SHADOW})
    sel = ','.join('body.wd0 ' + x.strip() for x in WOOD_SEL.split(','))
    return ('/* 草原のパネルは、切りっぱなしの明るい板（わくなし・木目）。依頼ボードの紙はそのまま。body.wd0 は ui-fx.js の uiStageSync */\n'
            f'{sel}{{border-image-source:{u}!important;border-image-slice:{PSLICE} fill!important;'
            f'border-image-width:{PWIDTH}!important;border-image-repeat:round!important}}')


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
    x = svg(disk_rows(23), n)
    return '\n'.join([
        '/* 草原の丸いボタン：とじるボタン（守りの光／こもれびのまもりは、ほかのステージと同じ半透明） */',
        f'body.wd0 .sheet .x{{background:{x} center/100% 100% no-repeat!important}}',
    ])


# ---- 草原のかざり：木札をつるす横木 ----
def beam_rows(W=96, H=9):
    """横木：自然の板（よこにくりかえす）。上のふちは、ゆるくでこぼこ（0〜1ドット）、木目はテクスチャ、ふしが2つ。
    下に、板のあつみ（こい2行）とかげ"""
    import math
    t = tex_tones(W)
    top = lambda x: 1 if math.sin(x / W * 2 * math.pi * 3 + .7) + .5 * math.sin(x / W * 2 * math.pi * 7) > .9 else 0
    knots = [(22, 3.5, 3.2, 1.3), (71, 4.2, 2.4, 1.0)]  # ふし（まん中・よこ・たて の半分）
    rows = []
    for y in range(H):
        r = ''
        for x in range(W):
            tp = top(x)
            if y < tp: r += '.'; continue
            if y == H - 1: r += 's'; continue
            if y == H - 2: r += 'e'; continue
            if y == H - 3: r += 'd'; continue
            if y == tp: r += 'h'; continue
            k = ''
            for kx, ky, rx, ry in knots:
                dx = min(abs(x + .5 - kx), W - abs(x + .5 - kx)) / rx; dy = (y + .5 - ky) / ry
                q = dx * dx + dy * dy
                if q < .45: k = 'k'
                elif q < 1.3 and not k: k = 'K'
            r += k or t[(y * 3) % W][x]
        rows.append(r)
    return rows


BEAM = beam_rows()
ROPE = ['ab', 'bc', 'ab', 'bc']  # なわ（2×4、たてにくりかえす。ねじれ）


def deco_css():
    beam = svg(BEAM, {'h': '#e2b57c', 'l': '#cf9e64', 'a': '#c29158', 'g': '#b5844d', 'D': '#a87843', 'k': '#7e5230', 'K': '#9b6c3c',
                       'd': '#8a5a30', 'e': '#6e4a28', 's': SHADOW})
    rope = svg(ROPE, {'a': '#c9a36a', 'b': '#a8834f', 'c': '#8a6a45'})
    tag = svg(wood_rows(), {'a': '#e6cb99', 'g': '#e2c693', 'D': '#dec18d', 'l': '#ead0a2', 'h': '#f4e1bd',
                            'w': '#b98a52', 'd': '#8a5a30', 'k': '#efd8ae', 'q': '#f8ead0', 's': SHADOW})  # 下の木札：パネルより少しこい、切りっぱなしの板
    pp = 'var(--pp)'
    return '\n'.join([
        '/* 草原のかざり：下のバーは横木からつるした木札（なわ） */',
        f'body.wd0 #topUI .hud{{position:relative}}',
        f'body.wd0 .dock{{position:relative;border-image:none!important;background:none!important;box-shadow:none!important;padding:calc({pp}*20) 4px 4px!important;overflow:visible}}',
        f'body.wd0 .dock::before{{content:"";position:absolute;left:calc(50% - 50vw);width:100vw;top:0;height:calc({pp}*9);background:{beam} 0 0/calc({pp}*{len(BEAM[0])}) calc({pp}*{len(BEAM)}) repeat-x;image-rendering:pixelated;pointer-events:none}}',
        f'body.wd0 .dock button,body.wd0 .quest{{position:relative;overflow:visible}}',
        f'body.wd0 .toast .trope::before,body.wd0 .toast .trope::after{{content:"";position:absolute;top:calc({pp}*-13);width:calc({pp}*2);height:calc({pp}*13);background:linear-gradient(#5e3d22 calc({pp}*2),transparent 0),{rope} 0 0/calc({pp}*2) calc({pp}*4) repeat-y;image-rendering:pixelated;pointer-events:none}}body.wd0 .toast .trope::before{{left:22%}}body.wd0 .toast .trope::after{{right:22%}}',
        f'body.wd0 .dock button{{border:solid transparent!important;border-width:calc({pp}*3)!important;border-image:{tag} 5 5 6 5 fill/calc({pp}*5) calc({pp}*5) calc({pp}*6) round!important;background:none!important;color:#5e3d22!important;transform:none}}',
        f'body.wd0 .dock button.on{{color:#4a2a12!important;filter:saturate(1.15) brightness(1.03);margin-top:calc({pp}*3);text-shadow:1.5px 0 0 rgba(140,90,40,.3),-1.5px 0 0 rgba(140,90,40,.3),0 1.5px 0 rgba(255,236,200,.7)}}',
        f'body.wd0 .dock button.on svg.pxi{{fill:#4a2a12!important}}',
        f'body.wd0 .dock button::before,body.wd0 .dock button::after,body.wd0 .quest::before,body.wd0 .quest::after{{content:"";position:absolute;top:calc({pp}*-16);width:calc({pp}*2);height:calc({pp}*19);background:linear-gradient(transparent calc(100% - {pp}*2),#5e3d22 0),{rope} 0 0/calc({pp}*2) calc({pp}*4) repeat-y;image-rendering:pixelated;pointer-events:none;z-index:1}}',
        f'body.wd0 .dock button::before,body.wd0 .quest::before{{left:22%}}body.wd0 .dock button::after,body.wd0 .quest::after{{right:22%}}',
        f'body.wd0 .quest::before,body.wd0 .quest::after{{top:calc({pp}*-8);height:calc({pp}*11)}}',
        f'body.wd0 .dock button.on::before,body.wd0 .dock button.on::after{{top:calc({pp}*-19);height:calc({pp}*22)}}',
    ])


# ---- 会話のわく：木のわくに、中は紙（草原も火山も同じ）。.dlg::before に描く（立ち絵を切らない） ----
DF = 6    # 木のわくのはば（ドット）
DM = 48   # 辺のまん中（くりかえす所）


def dlgframe_rows():
    """木のわく：角は段々（4・2・1・1）、外の1ドットはこい木のふち、上・左は光・下・右はかげ、いちばん内がわは紙をはさむみぞ。
    木目は辺ののびる向き（上下の辺はよこ、左右の辺はたて）。まん中は透明（紙は背景の色と柄で）。いちばん下の1行はかげ"""
    NW = 2 * DF + DM
    cp = lambda d: PR[d] if d < 4 else 0
    tI = lambda x: cp(min(x, NW - 1 - x))
    lI = lambda y: cp(min(y, NW - 1 - y))
    ins = lambda x, y: 0 <= x < NW and 0 <= y < NW and tI(x) <= y <= NW - 1 - tI(x) and lI(y) <= x <= NW - 1 - lI(y)
    t = tex_tones(DM)
    rows = []
    for y in range(NW + 1):
        r = ''
        for x in range(NW):
            if not ins(x, y):
                r += 's' if (y >= NW - DF and ins(x, y - 1)) else '.'
                continue
            dt, db, dl, dr = y, NW - 1 - y, x, NW - 1 - x
            d = min(dt, db, dl, dr)
            if d >= DF:
                r += '.'; continue  # 紙の所
            if not (ins(x - 1, y) and ins(x + 1, y) and ins(x, y - 1) and ins(x, y + 1)) or d == 0:
                r += 'o'; continue  # 外のふち
            if d == DF - 1:
                r += 'i'; continue  # 紙をはさむみぞ
            near = min((dt, 't'), (db, 'b'), (dl, 'l'), (dr, 'r'))[1]
            if d == 1:
                r += 'h' if near in 'tl' else 'w'; continue  # 光とかげ
            if d == DF - 2:
                r += 'k' if near in 'br' else 'w'; continue  # みぞの手前：下・右は光（みぞのかげ）、上・左はかげ
            r += t[(y - DF) % DM][(x - DF) % DM] if near in 'tb' else t[(x - DF) % DM][(y - DF) % DM]
        rows.append(r)
    return rows


def dlg_css():
    fr = svg(dlgframe_rows(), {'a': '#b88552', 'g': '#ae7b49', 'D': '#a47141', 'l': '#c4915c', 'h': '#dcab72', 'k': '#c99862',
                               'w': '#93602f', 'o': '#6f4525', 'i': '#7a4d28', 's': SHADOW})
    fib = svg(ptex_rows(), {'d': '#8a6a3a20', 'm': '#8a6a3a0e', 'l': '#ffffff60'})
    w = f'calc(var(--pp)*{DF}) calc(var(--pp)*{DF}) calc(var(--pp)*{DF + 1}) calc(var(--pp)*{DF})'
    sel = '.dlg::before,body.wd0 .dlg::before'
    return '\n'.join([
        '/* 会話のわく：木のわくに、中は紙（dlgframe_rows・紙の柄は ptex_rows）。草原も火山も同じ。.dlg::before に描く */',
        f'{sel}{{border-style:solid!important;border-color:transparent!important;border-width:{w}!important;border-image:{fr} {DF} {DF} {DF + 1} {DF}/{w} round!important;'
        f'background:{fib} 0 0/96px 96px repeat padding-box,#f6ecd5 padding-box!important;box-shadow:inset 0 calc(var(--pp)*2) 0 #c9a87638,inset calc(var(--pp)*1) 0 0 #c9a87628!important;image-rendering:pixelated}}',
    ])


# ---- ひでんのしょ：巻物（紙は少し黄ばんだ和紙、上と下に木の軸） ----
def rod_rows(W=12):
    """巻物の軸の、まん中（よこにくりかえす）：丸い棒（上から 光・地・かげ）と、外のふち。高さ8"""
    t = tex_tones(48)
    rows = []
    for y in range(8):
        r = ''
        for x in range(W):
            if y in (0, 7): r += 'o'
            elif y == 1: r += 'h'
            elif y == 2: r += 'l'
            elif y == 6: r += 'w'
            elif y == 5: r += 'D'
            else: r += t[y * 5][x]
        rows.append(r)
    return rows


def knob_rows():
    """巻物の軸のはしの玉（10×10）：まるい木の玉。左上が光・右下がかげ"""
    N = 10
    rows = []
    for y in range(N):
        r = ''
        for x in range(N):
            dx, dy = x + .5 - N / 2, y + .5 - N / 2
            d = (dx * dx + dy * dy) ** .5
            if d > N / 2: r += '.'; continue
            if d > N / 2 - 1: r += 'o'; continue
            lt = -dx - dy
            r += 'h' if lt > 4.5 else 'l' if lt > 1.5 else 'a' if lt > -2.5 else 'w'
        rows.append(r)
    return rows


def scroll_css():
    sp = svg(PAPER, {'a': '#f5e6c3', 'o': '#b48a52', 's': SHADOW})
    fib = svg(ptex_rows(), {'d': '#8a6a3a22', 'm': '#8a6a3a10', 'l': '#ffffff55'})
    pal = {'a': '#a86f3c', 'g': '#9e6936', 'D': '#8f5c2e', 'l': '#bf8550', 'h': '#d9a46a', 'w': '#7a4c26', 'o': '#5e3a1e'}
    rod = svg(rod_rows(), pal)
    kn = svg(knob_rows(), {'a': '#8a5a30', 'l': '#a8743f', 'h': '#c99257', 'w': '#6e4424', 'o': '#4f3018'})
    pp = 'var(--pp)'
    rodbg = (f'{kn} 0 50%/calc({pp}*10) calc({pp}*10) no-repeat,{kn} 100% 50%/calc({pp}*10) calc({pp}*10) no-repeat,'
             f'{rod} 0 50%/calc({pp}*12) calc({pp}*8) repeat-x')
    k = '.sheet[data-k="manual"]'
    return '\n'.join([
        '/* ひでんのしょ：巻物（少し黄ばんだ紙と、上と下の木の軸。rod_rows・knob_rows） */',
        f'{k},body.wd0 {k}{{border-image-source:{sp}!important;border-image-slice:{S} {S} {S + 1} {S} fill!important;background:none!important;overflow:visible;margin-top:calc({pp}*6);padding-bottom:calc({pp}*10 + env(safe-area-inset-bottom,0px))!important}}',
        f'{k} #sheetBody{{background:{fib} 0 0/96px 96px repeat;image-rendering:pixelated}}',
        f'{k}::before,{k}::after{{content:"";position:absolute;left:calc({pp}*-2);right:calc({pp}*-2);height:calc({pp}*10);background:{rodbg};image-rendering:pixelated;pointer-events:none;z-index:2}}',
        f'{k}::before{{top:calc({pp}*-6)}}{k}::after{{bottom:env(safe-area-inset-bottom,0px)}}',
    ])


# ---- 思い出帳：ページをめくる本（紙のページ・右に重なったページのふち） ----
def edge_rows():
    """ページのふち（小口）：右に重なった紙のはし（はば6・たてにくりかえす高さ4）"""
    return ['aoboco', 'aoboco', 'aoboco', 'aoboco']


def mbook_css():
    pg = svg(PAPER, {'a': '#f7eedb', 'o': '#a8743f', 's': SHADOW})
    fib = svg(ptex_rows(), {'d': '#8a6a3a1c', 'm': '#8a6a3a0c', 'l': '#ffffff60'})
    ed = svg(edge_rows(), {'a': '#efe2c4', 'b': '#e6d6b2', 'c': '#ddc9a0', 'o': '#b8955e'})
    pp = 'var(--pp)'
    k = '.sheet[data-k="record"]'
    return '\n'.join([
        '/* 思い出帳：ページをめくる本（紙のページ・右に重なったページのふち edge_rows） */',
        f'{k},body.wd0 {k}{{border-image-source:{pg}!important;padding-right:calc({pp}*6)}}',
        f'{k} #sheetBody{{position:relative;background:{fib} 0 0/96px 96px repeat;image-rendering:pixelated}}',
        f'{k}::after{{content:"";position:absolute;right:calc({pp}*1);top:calc({pp}*8);bottom:calc({pp}*4);width:calc({pp}*6);background:{ed} 0 0/calc({pp}*6) calc({pp}*4) repeat-y;image-rendering:pixelated;pointer-events:none}}',
        f'.mflip{{background:{fib} 0 0/96px 96px repeat,#f7eedb;image-rendering:pixelated;box-shadow:calc({pp}*2) 0 0 #8a6a4540}}',
    ])


def main():
    css = '\n'.join([paper_css(), wood_css(), wbtn_css(), disk_css(), deco_css(), board_css(), note_css(), book_css(), dlg_css(), scroll_css(), mbook_css()])
    s = HTML.read_text()
    b, e = '/* paper-ui:begin */', '/* paper-ui:end */'
    if b not in s:
        raise SystemExit('index.html に ' + b + ' がない')
    s = re.sub(re.escape(b) + r'.*?' + re.escape(e), lambda m: b + '\n' + css + '\n' + e, s, flags=re.S)
    HTML.write_text(s)
    print('wrote', len(css), 'chars')


def part(names):
    """道具で作った行のうち、名前の物（paper_css など）の行だけを入れかえる（はじめのコメントの行でさがす。なければ end の前に足す）。
    手で直した行（なわ・下のバーの札など）は、そのまま"""
    s = HTML.read_text()
    b, e = '/* paper-ui:begin */', '/* paper-ui:end */'
    i, j = s.index(b) + len(b) + 1, s.index(e)
    L = s[i:j].rstrip('\n').split('\n')
    for nm in names:
        new = globals()[nm]().split('\n')
        if new[0] in L:
            k = L.index(new[0]); L[k:k + len(new)] = new
        else:
            L += new
        print('part', nm, len(new), 'lines')
    HTML.write_text(s[:i] + '\n'.join(L) + '\n' + s[j:])


if __name__ == '__main__':
    import sys
    if len(sys.argv) > 2 and sys.argv[1] == '--part':
        part(sys.argv[2].split(','))
    else:
        main()
