"""土のブロックの正面（断面）の絵 cliff:block（64×64、g64）を、前の岩のがけの正面 cliff:face から作る。
cliff:face は 64×52 で、下の6行は波うったすけたふち。すけていない上の46行を、正方形の正面（1マス×1だん）に BOX でのばし、うすさを 255 にそろえる。
  python3 tools/art/cliffblock/cliffblock.py"""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))
import chips
from PIL import Image
head, C = chips.load_imgs()
src = C['cliff:face']['f'][0].convert('RGBA')
im = src.crop((0, 0, 64, 46)).resize((64, 64), Image.BOX)
r, g, b, a = im.split(); im = Image.merge('RGBA', (r, g, b, a.point(lambda v: 255)))
C['cliff:block'] = {'ax': 0, 'ay': 0, 'w': 64, 'h': 64, 'g': 64, 'f': [im]}
chips.pack_imgs(head, C)
print('cliff:block')
