"""コワイノのレイヤーの絵（tools/art/kowaino/<種類>/*.png、どれも同じ大きさで位置がそろっている）→ 部品チップ kgp_<種類>:<部品>
腕（arms）・足（legs）は、まん中で左右に分ける。足もと（FOOT）を原点にして、ax・ay を書く。
絵はそのまま（ちぢめない・色をかえない）。
使い方: python3 tools/art/kowaino/kowaino_layers.py
"""
import sys, os
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))
sys.path.insert(0, os.path.join(ROOT, 'tools')); import chips
from PIL import Image
KINDS = {'basic': {'foot': (25, 80), 'split': 25}}   # 足もとの点・左右に分けるx（もとの絵のドット）

def build():
    h0, C = chips.load_imgs()
    for kind, cfg in KINDS.items():
        for k in [k for k in C if k.startswith('kg_' + kind + ':') or k.startswith('kgp_' + kind + ':')]: del C[k]
        fx, fy = cfg['foot']; sx = cfg['split']; d = os.path.join(HERE, kind)
        parts = {}
        for f in sorted(os.listdir(d)):
            if not f.endswith('.png'): continue
            im = Image.open(os.path.join(d, f)).convert('RGBA'); n = f[:-4]
            if n in ('arms', 'legs'):
                parts[n[:-1] + 'L'] = im.crop((0, 0, sx, im.height)).copy(), 0
                parts[n[:-1] + 'R'] = im.crop((sx, 0, im.width, im.height)).copy(), sx
            else:
                parts[n] = im, 0
        # 下ろした腕：体（torso）の外に出ている所だけを、肩を上にして90度まわし、体の横にたらす
        tb = parts['torso'][0].getbbox(); A = Image.open(os.path.join(d, 'arms.png')).convert('RGBA'); ab = A.getbbox()
        L = A.crop((ab[0], ab[1], tb[0], ab[3])).rotate(90, expand=True); R = A.crop((tb[2], ab[1], ab[2], ab[3])).rotate(-90, expand=True)
        down = {'armLd': (L, tb[0] - L.width, ab[1]), 'armRd': (R, tb[2], ab[1])}
        for n, (im, x, y) in down.items():
            C['kgp_%s:%s' % (kind, n)] = {'ax': x - fx, 'ay': y - fy, 'w': im.width, 'h': im.height, 'f': [im]}
        for n, (im, ox) in parts.items():
            bb = im.getbbox()
            if not bb: continue
            c = im.crop(bb)
            C['kgp_%s:%s' % (kind, n)] = {'ax': ox + bb[0] - fx, 'ay': bb[1] - fy, 'w': c.width, 'h': c.height, 'f': [c]}
    chips.pack_imgs(h0, C)

if __name__ == '__main__':
    build()
