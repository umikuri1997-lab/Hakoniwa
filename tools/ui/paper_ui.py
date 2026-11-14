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
    H = len(rows); W = len(rows[0])
    paths = {}
    for y, r in enumerate(rows):
        x = 0
        while x < W:
            c = r[x]
            if c == '.':
                x += 1; continue
            e = x
            while e < W and r[e] == c:
                e += 1
            paths.setdefault(c, []).append(f'M{x} {y}h{e-x}v1h-{e-x}z')
            x = e
    s = f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" shape-rendering="crispEdges">'
    for c, p in paths.items():
        col = pal[c]
        if len(col) == 9:  # #rrggbbaa → fill-opacity（古いブラウザのため）
            s += f'<path d="{"".join(p)}" fill="{col[:7]}" fill-opacity="{int(col[7:],16)/255:.2f}"/>'
        else:
            s += f'<path d="{"".join(p)}" fill="{col}"/>'
    s += '</svg>'
    return 'url("data:image/svg+xml,' + urllib.parse.quote(s, safe='') + '")'


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


# ---- 依頼ボードの板（48×24：つぎ目のない1まい板。木目だけ） ----
def plank_rows():
    W, H = 48, 24
    g = [['a'] * W for _ in range(H)]
    # 木目（ゆるい横すじ）。くりかえしても目立たないように、長さ・場所をばらばらに
    for y, x, w, c in ((1, 4, 13, 'g'), (3, 22, 9, 'g'), (5, 36, 11, 'g'), (8, 2, 7, 'g'), (9, 14, 16, 'h'),
                       (12, 33, 10, 'g'), (14, 8, 12, 'g'), (16, 26, 6, 'h'), (18, 40, 12, 'g'), (20, 17, 10, 'g'),
                       (22, 1, 8, 'h'), (23, 30, 9, 'g'), (6, 15, 4, 'h'), (11, 45, 6, 'h')):
        for k in range(w): g[y][(x + k) % W] = c
    # 小さなふし
    for y, x in ((10, 40), (19, 6)):
        g[y][x] = g[y][x + 1] = 'n'; g[y - 1][x] = g[y + 1][x + 1] = 'g'
    return [''.join(r) for r in g]


def board_css():
    u = svg(plank_rows(), {'a': '#a8743f', 'h': '#b98551', 'g': '#97673a', 'n': '#7e5430'})
    return ('/* 依頼ボードの板：つぎ目のない1まい板（木目だけのドットの絵、1ドット1.5px） */\n'
            f'.board{{background:#a8743f {u} 0 0/72px 36px repeat!important;image-rendering:pixelated}}')


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


# ---- 草原の木のわく（ふちは細い木・中は明るい木目） ----
WM = 40  # 辺のまん中・中の木目のくりかえし（border-image の round で、まん中もならべる）


def wood_rows():
    NW = 2 * S + WM
    cp = lambda d: PR[d] if d < 4 else 0
    tI = lambda x: cp(min(x, NW - 1 - x))
    lI = lambda y: cp(min(y, NW - 1 - y))
    ins = lambda x, y: 0 <= x < NW and 0 <= y < NW and tI(x) <= y <= NW - 1 - tI(x) and lI(y) <= x <= NW - 1 - lI(y)
    # 中の木目（よこのすじ）：行ごとに、すじのはじまり・長さ
    GR = {2: [(3, 14), (24, 9)], 6: [(12, 18)], 9: [(30, 12)], 11: [(1, 8)], 14: [(18, 15)], 18: [(5, 11), (33, 6)],
          21: [(22, 13)], 25: [(0, 7), (12, 9)], 28: [(28, 14)], 31: [(8, 16)], 35: [(20, 10)], 38: [(2, 12), (34, 5)]}
    LT = {4: [(16, 6)], 16: [(34, 7)], 23: [(4, 9)], 33: [(26, 8)]}
    def center(x, y):
        p, q = (x - S) % WM, (y - S) % WM
        for a, w in GR.get(q, ()):
            if (p - a) % WM < w: return 'g'
        for a, w in LT.get(q, ()):
            if (p - a) % WM < w: return 'l'
        return 'a'
    rows = []
    for y in range(NW + 1):
        r = ''
        for x in range(NW):
            if not ins(x, y):
                r += 's' if (y >= NW - S and ins(x, y - 1)) else '.'
                continue
            k = min(y - tI(x), NW - 1 - tI(x) - y, x - lI(y), NW - 1 - lI(y) - x)
            if k == 0 or not (ins(x - 1, y) and ins(x + 1, y) and ins(x, y - 1) and ins(x, y + 1)):
                r += 'o'; continue
            if k == 1:
                top_left = (y - tI(x) == 1) or (x - lI(y) == 1)
                r += 'h' if top_left else 'd'; continue
            if k == 2:
                r += 'w'; continue
            if k == 3:
                r += 'i'; continue
            r += center(x, y)
        rows.append(r)
    return rows


WOOD_SEL = ('.hud,.dock,.quest,.sheet,.dlg::before,.toast,#helpPop .hc,.idea-card,.askyn .ak,'
            '#rlv .rcard,.iinfo,#confirm,#palette,.wcard,.idea-item,.pxcard,#idle .card,#lvup .pw')


def wood_css():
    u = svg(wood_rows(), {'a': '#ecd6ad', 'g': '#e2c89a', 'l': '#f3e1bf', 'o': '#6e4a28', 'h': '#c99257',
                          'w': '#a8743f', 'd': '#8a5a30', 'i': '#d2b382', 's': SHADOW})
    sel = ','.join('body.wd0 ' + x.strip() for x in WOOD_SEL.split(','))
    return ('/* 草原のパネルは木（ふちは細い木のわく・中は明るい木目）。依頼ボードの紙はそのまま。body.wd0 は ui-fx.js の uiStageSync */\n'
            f'{sel}{{border-image-source:{u}!important;border-image-repeat:round!important}}')


def main():
    css = '\n'.join([paper_css(), wood_css(), board_css(), book_css()])
    s = HTML.read_text()
    b, e = '/* paper-ui:begin */', '/* paper-ui:end */'
    if b not in s:
        raise SystemExit('index.html に ' + b + ' がない')
    s = re.sub(re.escape(b) + r'.*?' + re.escape(e), lambda m: b + '\n' + css + '\n' + e, s, flags=re.S)
    HTML.write_text(s)
    print('wrote', len(css), 'chars')


if __name__ == '__main__':
    main()
