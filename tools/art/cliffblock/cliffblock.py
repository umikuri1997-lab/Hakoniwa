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
# 断面の左右のはしの丸い岩（faceLR のはしの6列。はみ出し3ドット）：いちばん上のだん bend*、その下 bend*m
lr = C['cliff:faceLR']['f'][0].convert('RGBA')
for sd, x0 in (('L', 0), ('R', lr.width - 6)):
    e = lr.crop((x0, 0, x0 + 6, 52))
    C['cliff:bend' + sd] = {'ax': -6 if sd == 'L' else 64, 'ay': 0, 'w': 6, 'h': 64, 'g': 64, 'f': [e.crop((0, 0, 6, 46)).resize((6, 64), Image.BOX)]}
    m = e.crop((0, 24, 6, 46)).resize((6, 32), Image.BOX); mm = Image.new('RGBA', (6, 64)); mm.paste(m, (0, 0)); mm.paste(m, (0, 32))
    C['cliff:bend' + sd + 'm'] = {'ax': -6 if sd == 'L' else 64, 'ay': 0, 'w': 6, 'h': 64, 'g': 64, 'f': [mm]}
# 地面につく断面の下のふち：前のがけの下の6行（波うったすけたふち）。はしは faceLR の角（まるい）
fc = C['cliff:face']['f'][0].convert('RGBA')
C['cliff:foot'] = {'ax': 0, 'ay': 64, 'w': 64, 'h': 6, 'g': 64, 'f': [fc.crop((0, 46, 64, 52))]}
for sd, x0 in (('L', 0), ('R', lr.width - 6)):
    C['cliff:foot' + sd] = {'ax': -6 if sd == 'L' else 64, 'ay': 64, 'w': 6, 'h': 6, 'g': 64, 'f': [lr.crop((x0, 46, x0 + 6, 52))]}
# 裏（うしろが低い上のふち）の細い岩の帯：サイドの帯 sideL を横にした絵
for q in ('', '~d'):   # 草地の上の面（内がわのふちが緑）と、乾いた地面の上の面（~d）
    C['cliff:back' + q] = {'ax': 0, 'ay': -6, 'w': 64, 'h': 6, 'g': 64, 'f': [C['cliff:sideL' + q]['f'][0].convert('RGBA').rotate(-90, expand=True)]}
C['cliff:block'] = {'ax': 0, 'ay': 0, 'w': 64, 'h': 64, 'g': 64, 'f': [top]}
C['cliff:blockm'] = {'ax': 0, 'ay': 0, 'w': 64, 'h': 64, 'g': 64, 'f': [mid]}
chips.pack_imgs(head, C)
print('cliff:block cliff:blockm cliff:bendL/R(m) cliff:back(~d) cliff:foot(L/R)')
