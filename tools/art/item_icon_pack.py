"""物のアイコン（tools/art/item_icons.cjs が作った id → PNG の data URL）を、アトラスにつめる。
使い方: python3 tools/art/item_icon_pack.py icons.json（ふつうは item_icons.cjs がよぶ）
  - 144×144 にちぢめる前のドット絵（つむブロックは48ドットにもどした絵）を、高さの順に、はば PW の段につめる
  - 絵は、画質を落とさない WebP（lossless・exact）。ファイル名は中身から作る
  - js/item-icons.js を書く（id → [ページ, x, y, w, h]（6つめが 1：つむブロックの48ドットの絵））。前のアトラスの絵はけす
"""
import base64, hashlib, io, json, os, re, sys
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), '..', '..')
OUT = os.path.join(ROOT, 'js', 'item-icons.js')
PW, PH = 2048, 2048


def main():
    src = json.load(open(sys.argv[1], encoding='utf8'))
    ims, cube = {}, {}
    for k, v in src.items():
        u = v.get('r') or v['c']
        im = Image.open(io.BytesIO(base64.b64decode(u.split(',', 1)[1]))).convert('RGBA')
        if 'c' in v:  # つむブロック：48ドットの絵を3倍にした144の絵。48にもどす（3倍にして、もとと同じかたしかめる）
            assert im.size == (144, 144), k
            sm = im.resize((48, 48), Image.NEAREST)
            assert sm.resize((144, 144), Image.NEAREST).tobytes() == im.tobytes(), k
            im = sm
        ims[k], cube[k] = im, 1 if 'c' in v else 0
    order = sorted(ims, key=lambda k: (-ims[k].height, -ims[k].width, k))
    pages, place = [[]], {}
    x = y = shelf = 0
    for k in order:
        w, h = ims[k].size
        if x + w > PW:
            x, y, shelf = 0, y + shelf, 0
        if y + h > PH:
            pages.append([])
            x = y = shelf = 0
        place[k] = (len(pages) - 1, x, y, w, h)
        pages[-1].append(k)
        x += w
        shelf = max(shelf, h)
    old = re.findall(r'assets/g/[0-9a-f]+\.webp', open(OUT, encoding='utf8').read()) if os.path.exists(OUT) else []
    names = []
    for ks in pages:
        h = max(place[k][2] + place[k][4] for k in ks)
        pg = Image.new('RGBA', (PW, h), (0, 0, 0, 0))
        for k in ks:
            pg.paste(ims[k], place[k][1:3])
        b = io.BytesIO()
        pg.save(b, 'WEBP', lossless=True, exact=True, method=4)
        data = b.getvalue()
        name = 'assets/g/' + hashlib.sha1(data).hexdigest()[:10] + '.webp'
        open(os.path.join(ROOT, name), 'wb').write(data)
        names.append(name)
        back = Image.open(io.BytesIO(data)).convert('RGBA')  # たしかめ：切り出した絵が、もとの絵とドットまで同じか
        for k in ks:
            _, px, py, w, hh = place[k]
            assert back.crop((px, py, px + w, py + hh)).tobytes() == ims[k].tobytes(), k
    for f in old:
        if f not in names and os.path.exists(os.path.join(ROOT, f)):
            os.remove(os.path.join(ROOT, f))
    m = {k: list(place[k]) + ([1] if cube[k] else []) for k in sorted(place)}
    js = ("'use strict';\n/* 物のアイコンのアトラス（tools/art/item_icons.cjs が書く。手で書きかえない）。p：アトラスの絵、m：物の id → [ページ, x, y, w, h]（6つめが 1：つむブロックの48ドットの絵） */\n"
          'const ITIA={p:' + json.dumps(names) + ',m:' + json.dumps(m, separators=(',', ':'), ensure_ascii=False) + '};\n')
    open(OUT, 'w', encoding='utf8').write(js)
    print(len(m), 'こ →', len(names), 'まい', [os.path.getsize(os.path.join(ROOT, f)) for f in names])


if __name__ == '__main__':
    main()
