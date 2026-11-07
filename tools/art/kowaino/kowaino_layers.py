"""コワイノのレイヤーの絵（tools/art/kowaino/<種類>/*.png、どれも同じ大きさで位置がそろっている）→ 部品チップ kgp_<種類>:<部品>
腕（arms）・足（legs）は、まん中で左右に分ける。足もと（FOOT）を原点にして、ax・ay を書く。
絵はそのまま（ちぢめない・色をかえない）。
使い方: python3 tools/art/kowaino/kowaino_layers.py
"""
import sys, os
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))
sys.path.insert(0, os.path.join(ROOT, 'tools')); import chips
from PIL import Image
KINDS = {  # armIn：横の腕を内がわへ。legDy：足だけを上へずらす（足もとは地面のまま、体が下がる）
         'basic': {'foot': (25, 78), 'split': 25, 'legDy': -2, 'armIn': 3}, 'brute': {'foot': (33, 69), 'split': 33}}   # 足もとの点・左右に分けるx（もとの絵のドット）

def build():
    h0, C = chips.load_imgs()
    for kind, cfg in KINDS.items():
        for k in [k for k in C if k.startswith('kg_' + kind + ':') or k.startswith('kgp_' + kind + ':')]: del C[k]
        fx, fy = cfg['foot']; sx = cfg['split']; d = os.path.join(HERE, kind)
        parts = {}
        for f in sorted(os.listdir(d)):
            if not f.endswith('.png'): continue
            im = Image.open(os.path.join(d, f)).convert('RGBA'); n = f[:-4]
            if n == 'armsDown': continue
            if n in ('arms', 'legs'):
                ai = cfg.get('armIn', 0) if n == 'arms' else 0   # armIn：横に上げた腕を、体のほうへよせる（ドット）
                parts[n[:-1] + 'L'] = im.crop((0, 0, sx, im.height)).copy(), ai
                parts[n[:-1] + 'R'] = im.crop((sx, 0, im.width, im.height)).copy(), sx - ai
            else:
                parts[n] = im, 0
        # 下ろした腕：体（torso）の外に出ている所だけを、肩を上にして90度まわし、体の横にたらす
        tb = parts['torso'][0].getbbox(); A = Image.open(os.path.join(d, 'arms.png')).convert('RGBA'); ab = A.getbbox()
        L = A.crop((ab[0], ab[1], tb[0], ab[3])).rotate(90, expand=True); R = A.crop((tb[2], ab[1], ab[2], ab[3])).rotate(-90, expand=True)
        down = {'armLd': (L, tb[0] - L.width, ab[1]), 'armRd': (R, tb[2], ab[1])}
        if os.path.exists(os.path.join(d, 'armsDown.png')):  # 下ろした腕の絵があれば、それを使う（肩を出さない形）
            Dn = Image.open(os.path.join(d, 'armsDown.png')).convert('RGBA'); db = Dn.getbbox()
            down = {'armLd': (Dn.crop((db[0], db[1], sx, db[3])), db[0], db[1]), 'armRd': (Dn.crop((sx, db[1], db[2], db[3])), sx, db[1])}
        # 上げた腕：肩（体のはし）は動かさず、外へいくほど上（k>0）・下（k<0）へずらす（ななめに上げる・下げる）
        def tilt(side, k, pad=14):
            im, ox = parts['arm' + side]; sh = tb[0] if side == 'L' else tb[2] - 1
            out = Image.new('RGBA', (im.width, im.height + 2 * pad)); px = im.load(); po = out.load()
            for yy in range(im.height):
                for xx in range(im.width):
                    if px[xx, yy][3] == 0: continue
                    dist = max(0, sh - (xx + ox)) if side == 'L' else max(0, (xx + ox) - sh)
                    po[xx, yy + pad - round(dist * k)] = px[xx, yy]
            return out, ox, -pad
        for side in 'LR':
            for sfx, k in (('u', .8), ('w', -.4)):
                im, ox, oy = tilt(side, k); bb = im.getbbox(); c = im.crop(bb)
                C['kgp_%s:arm%s%s' % (kind, side, sfx)] = {'ax': ox + bb[0] - fx, 'ay': bb[1] + oy - fy, 'w': c.width, 'h': c.height, 'f': [c]}
        for n, (im, x, y) in down.items():
            C['kgp_%s:%s' % (kind, n)] = {'ax': x - fx, 'ay': y - fy, 'w': im.width, 'h': im.height, 'f': [im]}
        for n, (im, ox) in parts.items():
            bb = im.getbbox()
            if not bb: continue
            c = im.crop(bb)
            C['kgp_%s:%s' % (kind, n)] = {'ax': ox + bb[0] - fx, 'ay': bb[1] - fy + (cfg.get('legDy', 0) if n.startswith('leg') else 0), 'w': c.width, 'h': c.height, 'f': [c]}
    chips.pack_imgs(h0, C)

if __name__ == '__main__':
    build()
