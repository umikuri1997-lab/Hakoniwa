#!/usr/bin/env python3
"""UIの動き（CSS の @keyframes）を、1.5px（1ドット）ずつ・毎コマのコマにして index.html に書きこむ。

もとの動き（とおる所 = 下の SRC）は、ここに書く。index.html の
/* ui-motion:begin */ 〜 /* ui-motion:end */ は、この道具が作るので、手でなおさない。
動きをかえる・足すときは SRC をなおして `python3 tools/ui/ui_motion.py` を動かす。

作り方：とおる所のあいだを、まっすぐ（linear）につないで、1/60秒ごとに見る（書くのは半コマあと）。
いどう（translate）は 1.5px のます目に、ほかも小さなきざみにそろえ、かわったコマだけ書く。
使う側は steps(1)（コマのあいだは止まる）のまま。
"""
import re, sys, os

FPS = 60
# きざみ：いどう 1.5px・まわる 0.05度・大きさ 0.005・うすさ 0.05・明るさ 0.01
Q = {'tx': 1.5, 'ty': 1.5, 'rot': 0.05, 'sx': 0.005, 'sy': 0.005, 'op': 0.05, 'br': 0.01}

# 名前: (長さ秒, とおる所)。長さは、いちばんよく使う animation の長さ（コマの間かくのめやす）。
SRC = {
 'uboing': (.32, "0%{transform:scale(.96,1.1)}25%{transform:scale(1.04,.95)}50%{transform:scale(.99,1.03)}75%{transform:scale(1.01,.99)}100%{transform:none}"),
 'uswing': (1, "0%{transform:rotate(0)}8%{transform:rotate(4deg)}16%{transform:rotate(6deg)}26%{transform:rotate(3deg)}36%{transform:rotate(-3deg)}46%{transform:rotate(-4deg)}56%{transform:rotate(-1deg)}66%{transform:rotate(2deg)}78%{transform:rotate(1deg)}88%{transform:rotate(-1deg)}100%{transform:none}"),
 'ustamp': (.5, "0%{transform:scale(2.2);opacity:.3}20%{transform:scale(1.6);opacity:.6}40%{transform:scale(1.05);opacity:1}55%{transform:scale(.94)}70%{transform:scale(1.02)}100%{transform:none}"),
 'ustk': (.45, "0%{transform:translateY(-24px) scale(1.4);opacity:0}20%{transform:translateY(-15px) scale(1.25);opacity:1}40%{transform:translateY(-4.5px) scale(1.1)}60%{transform:scale(.95)}80%{transform:scale(1.03)}100%{transform:none}"),
 'nbump': (.42, "0%{transform:translateY(-4.5px)}30%{transform:translateY(-1.5px)}60%{transform:translateY(1.5px)}100%{transform:none}"),
 'nspk': (.5, "0%{opacity:1}50%{opacity:1;transform:translateY(-1.5px)}100%{opacity:0;transform:translateY(-3px)}"),
 'nyuU': (.8, "0%{transform:translateY(48px);opacity:0}5%{transform:translateY(33px);opacity:1}10%{transform:translateY(19.5px)}15%{transform:translateY(9px)}20%{transform:translateY(1.5px)}25%{transform:translateY(-3px) rotate(1.6deg)}30%{transform:translateY(-4.5px) rotate(2deg)}35%{transform:translateY(-3px) rotate(.6deg)}40%{transform:translateY(-1.5px) rotate(-1.4deg)}48%{transform:rotate(-1.6deg)}58%{transform:rotate(.2deg)}68%{transform:rotate(1deg)}78%{transform:rotate(-.5deg)}88%{transform:rotate(.2deg)}100%{transform:none}"),
 'nyuD': (.32, "0%{transform:translateY(-24px);opacity:0}15%{transform:translateY(-15px);opacity:1}30%{transform:translateY(-7.5px)}45%{transform:translateY(-1.5px)}60%{transform:translateY(3px)}75%{transform:translateY(1.5px)}90%,100%{transform:none}"),
 'uidle': (7, "0%,100%{transform:rotate(0)}15%{transform:rotate(.4deg)}30%{transform:rotate(.8deg)}45%{transform:rotate(.4deg)}60%{transform:rotate(-.3deg)}75%{transform:rotate(-.7deg)}90%{transform:rotate(-.3deg)}"),
 'uidleR': (7, "0%,100%{transform:rotate(0)}15%{transform:rotate(1deg)}30%{transform:rotate(1.8deg)}45%{transform:rotate(.8deg)}60%{transform:rotate(-.8deg)}75%{transform:rotate(-1.6deg)}90%{transform:rotate(-.6deg)}"),
 'tdrop': (.9, "0%{transform:translateY(-27px);opacity:0}8%{transform:translateY(-15px);opacity:1}16%{transform:translateY(-4.5px)}24%{transform:translateY(1.5px) rotate(2deg)}36%{transform:rotate(3deg)}48%{transform:rotate(-2deg)}60%{transform:rotate(-2.5deg)}72%{transform:rotate(1deg)}84%{transform:rotate(1deg)}100%{transform:none}"),
 'tlift': (.18, "0%{transform:none;opacity:1}40%{transform:translateY(-9px);opacity:1}70%{transform:translateY(-21px);opacity:.6}100%{transform:translateY(-33px);opacity:0}"),
 'nold': (.24, "0%{transform:none;opacity:1}33%{transform:translateY(-3px) scaleY(.7);opacity:.9}66%{transform:translateY(-6px) scaleY(.4);opacity:.4}100%{transform:translateY(-7.5px) scaleY(.2);opacity:0}"),
 'nrollU': (.24, "0%{transform:translateY(7.5px) scaleY(.3);opacity:0}33%{transform:translateY(4.5px) scaleY(.6);opacity:1}66%{transform:translateY(1.5px) scaleY(.9)}100%{transform:none}"),
 'nrollD': (.24, None),  # 下で nrollU とおなじ形で上下をかえて作る
 'kotonn': (.3, "0%{transform:translateY(36px);opacity:.5}18%{transform:translateY(18px);opacity:1}36%{transform:translateY(4.5px)}55%{transform:none}68%{transform:translateY(-3px)}82%{transform:none}91%{transform:translateY(-1.5px)}100%{transform:none}"),
 'tontile': (.4, "0%{transform:translateY(-15px);opacity:0}4.17%{transform:translateY(-13.5px);opacity:.5}8.33%{transform:translateY(-10.5px);opacity:1}12.5%{transform:translateY(-6px)}16.67%{transform:scale(1.02,.93)}20.83%{transform:rotate(1deg) scale(1.01,.97)}29.17%{transform:translateY(-1.5px) rotate(1.5deg)}45%{transform:rotate(-1deg)}62%{transform:rotate(.5deg)}80%{transform:rotate(-.2deg)}100%{transform:none}"),
 'uflip': (.28, "0%{transform:scaleX(.08);filter:brightness(.8)}20%{transform:scaleX(.3);filter:brightness(.86)}40%{transform:scaleX(.6);filter:brightness(.93)}60%{transform:scaleX(.85)}80%{transform:scaleX(1.02)}100%{transform:none;filter:none}"),
 'gwob': (1.3, "0%{transform:none;opacity:1}55%{transform:translateX(-1.5px)}65%{transform:translateX(-3px)}75%{transform:translateX(-1.5px)}85%{transform:none}92%{transform:translateX(-1.5px)}100%{transform:none;opacity:0}"),
 'ubrand': (.9, "0%{transform:scale(1.6);color:#2a1408;text-shadow:0 0 0 #e8823a}15%{transform:scale(1);color:#2a1408;text-shadow:0 0 3px #f2a24a}40%{color:#3a2010;text-shadow:0 0 1.5px #e8823a}70%{color:#4a2a12;text-shadow:none}100%{transform:none}"),
 'ugone': (.28, "0%{transform:none}20%{transform:translateY(-3px)}40%{transform:translateY(6px)}60%{transform:translateY(30px)}80%{transform:translateY(80px);opacity:.8}100%{transform:translateY(160px);opacity:0}"),
 'upin': (.45, "0%{transform:rotate(var(--r,0deg)) translateY(-9px) scale(1.12);opacity:0}20%{transform:rotate(var(--r,0deg)) translateY(-3px) scale(1.06);opacity:1}40%{transform:rotate(var(--r,0deg)) scale(.97)}55%{transform:rotate(var(--r,0deg))}100%{transform:rotate(var(--r,0deg))}"),
 'upinp': (.45, "0%,50%{transform:translateY(-12px);opacity:0}62%{transform:translateY(-4.5px);opacity:1}75%{transform:translateY(1.5px)}88%,100%{transform:none}"),
 'uboing2y': (.4, "0%{transform:translateY(-4.5px)}20%{transform:translateY(1.5px)}40%{transform:translateY(-1.5px)}60%{transform:none}80%{transform:translateY(-1.5px)}100%{transform:none}"),
 'uboing2': (.45, "0%{transform:scale(.93,1.16)}20%{transform:scale(1.07,.92)}40%{transform:scale(.97,1.05)}60%{transform:scale(1.02,.98)}80%{transform:scale(.995,1.01)}100%{transform:none}"),
 'urow': (.24, "0%{transform:translateY(6px);opacity:0}25%{transform:translateY(3px);opacity:.6}50%{transform:translateY(-1.5px);opacity:1}75%,100%{transform:none;opacity:1}"),
 'tglow': (1.6, "0%{opacity:.3}50%{opacity:1}100%{opacity:.3}"),
 'tpop': (.5, "0%{transform:scale(.6)}35%{transform:scale(1.25)}60%{transform:scale(.94)}80%{transform:scale(1.04)}100%{transform:none}"),
 # 草原でも火山でもつかう、くりかえす動き（もとは ease のなめらかな動き。ease は、とおる所をふやしてまねる）
 'tswipe': (1.2, "0%{transform:translateX(34.5px);opacity:0}15%{opacity:1}25%{transform:translateX(25.5px)}50%{transform:none}75%{transform:translateX(-25.5px)}85%{opacity:1}100%{transform:translateX(-34.5px);opacity:0}"),
 'tring': (1.1, "0%{transform:scale(.6);opacity:1}25%{transform:scale(.89);opacity:.6}50%{transform:scale(1.08);opacity:.3}75%{transform:scale(1.24);opacity:.1}100%{transform:scale(1.3);opacity:0}"),
 'tfing': (.9, "0%{transform:none}12.5%{transform:translateY(-1.5px)}25%{transform:translateY(-4.5px)}37.5%{transform:translateY(-6px)}50%{transform:translateY(-7.5px)}62.5%{transform:translateY(-6px)}75%{transform:translateY(-4.5px)}87.5%{transform:translateY(-1.5px)}100%{transform:none}"),
 'palAR': (1, "0%{transform:none}25%{transform:translateX(1.5px)}50%{transform:translateX(3px)}75%{transform:translateX(1.5px)}100%{transform:none}"),
 'palAL': (1, "0%{transform:none}25%{transform:translateX(-1.5px)}50%{transform:translateX(-3px)}75%{transform:translateX(-1.5px)}100%{transform:none}"),
 'ideaFloat': (2, "0%{transform:none}12.5%{transform:translateY(-1.5px) rotate(.6deg)}25%{transform:translateY(-3px) rotate(2.5deg)}37.5%{transform:translateY(-4.5px) rotate(4.4deg)}50%{transform:translateY(-6px) rotate(5deg)}62.5%{transform:translateY(-4.5px) rotate(4.4deg)}75%{transform:translateY(-3px) rotate(2.5deg)}87.5%{transform:translateY(-1.5px) rotate(.6deg)}100%{transform:none}"),
 # 光の帯は40度ごとに同じもよう（repeating-conic-gradient のくりかえし）なので、40度まわって、はじめのコマにもどる
 'ideaTurn': (24 * 40 / 360, "0%{transform:none}100%{transform:rotate(40deg)}"),
 'nbob': (.8, "0%{transform:none}50%{transform:translateY(1.5px)}100%{transform:none}"),
 'lvpop': (.45, "0%{transform:scale(.3);opacity:0}60%{transform:scale(1.08);opacity:1}100%{transform:scale(1);opacity:1}"),
}
SRC['tontileR'] = (.4, SRC['tontile'][1].replace('rotate(', 'rotate(-').replace('rotate(--', 'rotate('))
SRC['nrollD'] = (.24, SRC['nrollU'][1].replace('translateY(7.5px)', 'translateY(-7.5px)').replace('translateY(4.5px)', 'translateY(-4.5px)').replace('translateY(1.5px)', 'translateY(-1.5px)'))

BASE = {'tx': 0, 'ty': 0, 'rot': 0, 'sx': 1, 'sy': 1, 'op': 1, 'br': 1}


def num(v):
    return float(re.sub(r'(px|deg)$', '', v.strip()))


def ptrans(v):
    """transform の文字を、前につける物（var の rotate）と、いどう・まわる・大きさにする。"""
    pre, d = '', {}
    if v.strip() == 'none':
        return pre, {'tx': 0, 'ty': 0, 'rot': 0, 'sx': 1, 'sy': 1}
    for f, a in re.findall(r'([a-zA-Z]+)\(([^()]*(?:\([^()]*\))?[^()]*)\)', v):
        if 'var(' in a:
            pre += f'{f}({a}) '
            continue
        xs = [num(x) for x in a.split(',')]
        if f == 'translateY': d['ty'] = xs[0]
        elif f == 'translateX': d['tx'] = xs[0]
        elif f == 'translate': d['tx'] = xs[0]; d['ty'] = xs[1] if len(xs) > 1 else 0
        elif f == 'rotate': d['rot'] = xs[0]
        elif f == 'scale': d['sx'] = xs[0]; d['sy'] = xs[1] if len(xs) > 1 else xs[0]
        elif f == 'scaleX': d['sx'] = xs[0]
        elif f == 'scaleY': d['sy'] = xs[0]
        else: raise SystemExit('しらない transform: ' + f)
    full = {'tx': 0, 'ty': 0, 'rot': 0, 'sx': 1, 'sy': 1}
    full.update(d)
    return pre, full


def parse(src):
    stops = []  # (pct, {prop: value})
    for ps, body in re.findall(r'([\d.%,\s]+)\{([^}]*)\}', src):
        decl = {}
        for dd in body.split(';'):
            if ':' in dd:
                k, v = dd.split(':', 1)
                decl[k.strip()] = v.strip()
        for p in ps.split(','):
            stops.append((float(p.strip()[:-1]), decl))
    stops.sort(key=lambda s: s[0])
    return stops


def track(stops, keys, get):
    """keys の値の、とおる所の一覧（0%・100% がなければ、もとの値）。"""
    pts = [(p, get(d)) for p, d in stops if get(d) is not None]
    if not pts or pts[0][0] > 0: pts.insert(0, (0, {k: BASE[k] for k in keys}))
    if pts[-1][0] < 100: pts.append((100, {k: BASE[k] for k in keys}))
    return pts


def at(pts, t):
    for i in range(len(pts) - 1):
        a, b = pts[i], pts[i + 1]
        if a[0] <= t <= b[0]:
            if b[0] == a[0]: return dict(b[1])
            u = (t - a[0]) / (b[0] - a[0])
            return {k: a[1][k] + (b[1][k] - a[1][k]) * u for k in a[1]}
    return dict(pts[-1][1])


def qz(k, v):
    s = Q[k]
    return round(round(v / s) * s, 4)


def fmt(v):
    s = ('%.4f' % v).rstrip('0').rstrip('.')
    if s == '-0': s = '0'
    return s.replace('0.', '.', 1) if s.startswith('0.') else (s.replace('-0.', '-.', 1) if s.startswith('-0.') else s)


def build(name, dur, src):
    stops = parse(src)
    pre = ''
    for _, d in stops:
        if 'transform' in d:
            p, _x = ptrans(d['transform'])
            pre = pre or p
    TK = ['tx', 'ty', 'rot', 'sx', 'sy']
    has_t = any('transform' in d for _, d in stops)
    has_o = any('opacity' in d for _, d in stops)
    has_f = any('filter' in d for _, d in stops)
    tp = track(stops, TK, lambda d: ptrans(d['transform'])[1] if 'transform' in d else None)
    op = track(stops, ['op'], lambda d: {'op': float(d['opacity'])} if 'opacity' in d else None)
    fp = track(stops, ['br'], lambda d: ({'br': 1.0} if d['filter'] == 'none' else {'br': float(re.search(r'brightness\(([\d.]+)\)', d['filter']).group(1))}) if 'filter' in d else None)
    other = sorted({k for _, d in stops for k in d if k not in ('transform', 'opacity', 'filter')})
    # コマ i の形は、時刻 i/60 の形。書く所は半コマあと（(i+.5)/60）にする：画面の描きかえの時刻と
    # コマの切りかわりがちょうど重なると、同じコマが2回出て、つぎのコマがとぶ（かくついて見える）
    fr = 100 / (dur * FPS)
    samp = [(0.0, 0.0)] + [(i * fr, round((i + .5) * fr, 3)) for i in range(1, int(dur * FPS) + 1) if (i + .5) * fr < 100] + [(100.0, 100.0)]
    out, last = [], None
    for t, pct in samp:
        st = {}
        if has_t:
            v = at(tp, t); st.update({k: qz(k, v[k]) for k in TK})
        if has_o: st['op'] = qz('op', at(op, t)['op'])
        if has_f: st['br'] = qz('br', at(fp, t)['br'])
        for k in other:  # 色などは、まえのとおる所の値のまま（もとと同じ）
            val = None
            for p, d in stops:
                if p <= t and k in d: val = d[k]
            st[k] = val
        if st == last and t != 100: continue
        last = st
        decl = []
        if has_t:
            fs = []
            if st['tx'] or st['ty']: fs.append(f"translate({fmt(st['tx'])}px,{fmt(st['ty'])}px)")
            if st['rot']: fs.append(f"rotate({fmt(st['rot'])}deg)")
            if st['sx'] != 1 or st['sy'] != 1: fs.append(f"scale({fmt(st['sx'])},{fmt(st['sy'])})")
            tr = (pre + ' '.join(fs)).strip() or 'none'
            decl.append('transform:' + tr)
        if has_o: decl.append('opacity:' + fmt(st['op']))
        if has_f: decl.append('filter:' + ('none' if st['br'] == 1 else f"brightness({fmt(st['br'])})"))
        for k in other:
            if st[k] is not None: decl.append(f'{k}:{st[k]}')
        out.append(f"{fmt(pct)}%{{{';'.join(decl)}}}")
    return f"@keyframes {name}{{{''.join(out)}}}", len(out)


def main():
    path = os.path.join(os.path.dirname(__file__), '..', '..', 'index.html')
    s = open(path, encoding='utf-8').read()
    blk, total = [], 0
    for n, (d, src) in SRC.items():
        k, c = build(n, d, src); blk.append(k); total += c
    body = '/* ui-motion:begin */\n' + '\n'.join(blk) + '\n/* ui-motion:end */'
    a, b = s.find('/* ui-motion:begin */'), s.find('/* ui-motion:end */')
    if a < 0 or b < 0: raise SystemExit('index.html に ui-motion:begin〜end がない')
    s = s[:a] + body + s[b + len('/* ui-motion:end */'):]
    open(path, 'w', encoding='utf-8').write(s)
    print(f'{len(SRC)} この動き・{total} コマを書いた')


if __name__ == '__main__':
    main()
