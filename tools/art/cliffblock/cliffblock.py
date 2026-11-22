"""土・石のブロックの正面（断面）の絵を、前の岩のがけの正面 cliff:face（64×52、下の6行は波うったすけたふち）から作る。
cliff:block（64×64）：いちばん上のだん。すけていない上の46行を BOX でのばす（上に明るい帯）。
cliff:blockm（64×64）：その下のだん。帯のない下の岩の列（24〜45行）を同じ倍率で32行にして、たてに2つならべる（上下がつながる）。
うすさは 255 にそろえる。  python3 tools/art/cliffblock/cliffblock.py"""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))
import chips
from PIL import Image
op = lambda im: Image.merge('RGBA', im.split()[:3] + (im.split()[3].point(lambda v: 255),))
head, C = chips.load_imgs()
src = C['cliff:face']['f'][0].convert('RGBA')
top = op(src.crop((0, 0, 64, 46)).resize((64, 64), Image.BOX))
row = op(src.crop((0, 24, 64, 46)).resize((64, 32), Image.BOX))
mid = Image.new('RGBA', (64, 64)); mid.paste(row, (0, 0)); mid.paste(row, (0, 32))
C['cliff:block'] = {'ax': 0, 'ay': 0, 'w': 64, 'h': 64, 'g': 64, 'f': [top]}
C['cliff:blockm'] = {'ax': 0, 'ay': 0, 'w': 64, 'h': 64, 'g': 64, 'f': [mid]}
chips.pack_imgs(head, C)
print('cliff:block cliff:blockm')
