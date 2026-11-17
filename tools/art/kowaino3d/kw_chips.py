"""コワイノのモーション（kowaino_paint.py --sheets で作った kg_<名前>.json と、コマをたてにならべた絵）を、ゲームのマップチップ（chips.js・アトラス）に入れる。

  python3 kowaino_paint.py --sheets <フォルダ> basic fast ...   # 絵を作る
  python3 kw_chips.py <フォルダ> basic fast ...                  # チップに入れる（名前がなければ、フォルダの kg_*.json ぜんぶ）

チップは kg_<名前>:<動き>（idle・idleB・idleR・idleL・walk・walkB・atk・atkB・atkR・atkL・hurt。R・L は右むき・左むき）。1まいの絵にコマをたてにならべ、h は1コマの高さ、n はコマ数（ゲームの drawShadeDot）。
"""
import sys, os, json, glob
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
sys.path.insert(0, os.path.join(ROOT, 'tools'))
import chips as CH

def main(d, names):
    if not names: names = [os.path.basename(p)[3:-5] for p in sorted(glob.glob(os.path.join(d, 'kg_*.json')))]
    head, C = CH.load_imgs(); n = 0
    for name in names:
        info = json.load(open(os.path.join(d, 'kg_%s.json' % name)))
        for k in [k for k in C if k.startswith('kg_%s:' % name)]: del C[k]   # 前の絵（動きの名前がへっていても のこさない）
        for k, v in info.items():
            im = Image.open(os.path.join(d, k.replace(':', '_') + '.png')).convert('RGBA')
            assert im.size == (v['w'], v['h']*v['n']), (k, im.size, v)
            C[k] = dict(ax=v['ax'], ay=v['ay'], w=v['w'], h=v['h'], n=v['n'], f=[im]); n += 1
    CH.pack_imgs(head, C); print('いれた', n)

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2:])
