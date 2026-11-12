#!/usr/bin/env python3
"""神殿（statue）と、こわれた神殿（statueb）の絵を、もらった絵 image.png（左がこわれる前・右がこわれた神殿）から作る（tools/art/pixdown.py の設定）。
  python3 tools/art/pixdown.py --config tools/art/temple-ruin/temple_art.py <出力フォルダ>
どちらも、いちばん下の段（土台）のはばを176ドット（g64）にそろえる（2つの絵で、こわれていない所が同じ所・同じ大きさになる）。
かこみは、うすさ20以上の所。左右は土台のはしで切る（土台がいちばん広い）"""
import os
HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, 'image.png')
OBJS = {
    'statue': {'box': (227, 22, 842, 835), 'w': 176},
    'statueb': {'box': (995, 23, 1617, 835), 'w': 176},
}
FIX = {}
# 色は、chips.pack_imgs が物ごとに256色までにする（tools/chips.py の cap_colors）

# チップに入れる：どちらも、土台の下のはしを y62・左のはしを x−56（g64、置くマスの左上から。前の神殿の絵と同じ足もと）
#   python3 tools/art/temple-ruin/temple_art.py          … チップに入れる
#   python3 tools/art/temple-ruin/temple_art.py <出力>   … 絵だけ書き出す
if __name__ == '__main__':
    import sys
    sys.path.insert(0, os.path.join(HERE, '..')); sys.path.insert(0, os.path.join(HERE, '..', '..'))
    from PIL import Image
    import pixdown
    src = Image.open(SRC).convert('RGBA'); ims = {k: pixdown.make(src, c['box'], c.get('w'), c.get('h'), c.get('sc'), c.get('lines'), FIX.get(k)) for k, c in OBJS.items()}
    if len(sys.argv) > 1:
        os.makedirs(sys.argv[1], exist_ok=True)
        for k, im in ims.items(): im.save(os.path.join(sys.argv[1], k + '.png'))
    else:
        import chips
        h, C = chips.load_imgs()
        for k, im in ims.items(): C[k] = {**C.get(k, {'g': 64}), 'g': 64, 'ax': -56, 'ay': 62 - im.height, 'w': im.width, 'h': im.height, 'f': [im]}; print(k, -56, 62 - im.height, im.size)
        chips.pack_imgs(h, C)
