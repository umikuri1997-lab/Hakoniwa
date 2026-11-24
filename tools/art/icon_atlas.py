"""アイコンの絵（js/draw-spirits.js の ICONS が指す assets/g/*.webp）を、大きな絵（アトラス）にまとめる。
ゲームは、マップを開く前に、アイコンを1まいずつ約350こ読むかわりに、アトラスを読んで切り出す（js/draw-spirits.js の ICI）。
メニューの <img> は、いままでどおり1まいずつのファイル（ICONS の URL）を使う。

使い方: python3 tools/art/icon_atlas.py
  - ICONS の行から、ファイルの URL をぜんぶ取りだす（data URL はのぞく）
  - 高さの順に、はば2048の段にならべてつめる（棚づめ）。1まいは高さ2048まで
  - 絵は、画質を落とさない WebP（lossless・exact）。ファイル名は中身から作る
  - js/icon-atlas.js を書く（URL → [ページ, x, y, w, h]）。前のアトラスの絵はけす
ICONS をかえたら、これを動かす（動かさないと、かわったアイコンは1まいずつ読む。ゲームはこわれない）。
"""
import hashlib, io, json, os, re
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), '..', '..')
SRC = os.path.join(ROOT, 'js', 'draw-spirits.js')
OUT = os.path.join(ROOT, 'js', 'icon-atlas.js')
PW, PH = 2048, 2048


def icon_urls():
    for line in open(SRC, encoding='utf8'):
        if line.startswith('const ICONS={'):
            body = line[:line.index('};') + 1]
            seen, out = set(), []
            for u in re.findall(r"""['"](assets/g/[0-9a-f]+\.webp)['"]""", body):
                if u not in seen:
                    seen.add(u)
                    out.append(u)
            return out
    raise SystemExit('ICONS の行がありません')


def pack(ims):
    """棚づめ：高い順にならべ、はば PW の段に左からつめる。段が PH をこえたら、つぎのページ"""
    order = sorted(ims, key=lambda u: (-ims[u].height, -ims[u].width, u))
    pages, place = [[]], {}
    x = y = shelf = 0
    for u in order:
        w, h = ims[u].size
        if x + w > PW:
            x, y, shelf = 0, y + shelf, 0
        if y + h > PH:
            pages.append([])
            x = y = shelf = 0
        place[u] = (len(pages) - 1, x, y, w, h)
        pages[-1].append(u)
        x += w
        shelf = max(shelf, h)
    return pages, place


def main():
    urls = icon_urls()
    ims = {u: Image.open(os.path.join(ROOT, u)).convert('RGBA') for u in urls}
    pages, place = pack(ims)
    old = []
    if os.path.exists(OUT):
        old = re.findall(r'assets/g/[0-9a-f]+\.webp', open(OUT, encoding='utf8').read().split('m:')[0])
    names = []
    for n, us in enumerate(pages):
        h = max(place[u][2] + place[u][4] for u in us)
        pg = Image.new('RGBA', (PW, h), (0, 0, 0, 0))
        for u in us:
            pg.paste(ims[u], place[u][1:3])
        b = io.BytesIO()
        pg.save(b, 'WEBP', lossless=True, exact=True, method=4)
        data = b.getvalue()
        name = 'assets/g/' + hashlib.sha1(data).hexdigest()[:10] + '.webp'
        open(os.path.join(ROOT, name), 'wb').write(data)
        names.append(name)
        # たしかめ：アトラスから切り出した絵が、もとの絵とドットまで同じか
        back = Image.open(io.BytesIO(data)).convert('RGBA')
        for u in us:
            _, x, y, w, hh = place[u]
            assert back.crop((x, y, x + w, y + hh)).tobytes() == ims[u].tobytes(), u
    for f in old:
        if f not in names and os.path.exists(os.path.join(ROOT, f)):
            os.remove(os.path.join(ROOT, f))
    m = {u: list(place[u]) for u in urls}
    js = ("'use strict';\n/* アイコンのアトラス（tools/art/icon_atlas.py が書く。手で書きかえない）。p：アトラスの絵、m：アイコンのファイル → [ページ, x, y, w, h] */\n"
          'const ICOA={p:' + json.dumps(names) + ',m:' + json.dumps(m, separators=(',', ':')) + '};\n')
    open(OUT, 'w', encoding='utf8').write(js)
    print(len(urls), 'こ →', len(names), 'まい', [os.path.getsize(os.path.join(ROOT, f)) for f in names])


if __name__ == '__main__':
    main()
