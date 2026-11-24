"""土のステージの素材のアイコン：砂岩・いわ草・かれすすき。3Dから写した絵（前の見え方の絵、iso3d.py の出力の <設計図>/<名前>.png）を、
ほかのアイコン（tools/art/icons32）と同じに 32×32 のドット絵にする（pixdown・まわり1ドットの輪郭・16色）。ゲームには3倍の96×96。
使い方: python3 tools/art/iso/iso3d.py <フォルダ> nat_sagan nat_iwakusa nat_susuki
       python3 tools/art/tsuchi/earth_mat_icons.py <フォルダ> [見本の出力フォルダ]  → assets/g に入れ、js/draw-spirits.js の ICONS を書きかえる"""
import os, sys
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, os.path.join(HERE, '..', 'icons32')); sys.path.insert(0, os.path.join(HERE, '..'))
import icons32 as I
import game as G
SRC = {'sagan': ('nat_sagan', 'sagan_icon'), 'iwakusa': ('nat_iwakusa', 'weed2g'), 'susuki': ('nat_susuki', 'weed2k')}
def build(d):
    made = {}
    for k, (it, nm) in SRC.items():
        im = Image.open(os.path.join(d, it, nm + '.png')).convert('RGBA'); made[k] = I.one(im, None, im.getbbox(), k)
    return made
if __name__ == '__main__':
    made = build(sys.argv[1])
    if len(sys.argv) > 2: os.makedirs(sys.argv[2], exist_ok=True); I.sheet(sys.argv[2], sorted(made.items()))
    G.put(made); print('アイコン', ', '.join(made))
