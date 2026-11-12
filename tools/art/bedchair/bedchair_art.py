"""もらったベッド（bed.png 63×81）・いす前向き（chair.png 40×63）・うしろ向き（chair_back.png 40×58）を、
チップ bed・chair・chair>2・chair>2.front にそのまま入れる（トリミングしてそのまま、足もとの位置は前の絵にそろえる）。
使い方: python3 tools/art/bedchair/bedchair_art.py"""
import sys, os
sys.path.insert(0, 'tools')
import chips
from PIL import Image
D = os.path.dirname(os.path.abspath(__file__))
L = lambda n: Image.open(os.path.join(D, n)).convert('RGBA')
head, C = chips.load_imgs()
def put(k, im, keep_bottom=True):
    c = C[k]; bottom = c['ay'] + c['h']; c['f'] = [im]; c['ax'] += (c['w'] - im.width) / 2; c['w'], c['h'] = im.size; c['ay'] = bottom - im.height
put('bed', L('bed.png')); put('chair', L('chair.png'))
b = L('chair_back.png'); put('chair>2', b)
c = C['chair>2.front']; bottom = c['ay'] + c['h']; fr = b.crop((0, 0, b.width, 40)); c['f'] = [fr]
c['ax'] = C['chair>2']['ax']; c['ay'] = C['chair>2']['ay']; c['w'], c['h'] = fr.size
for k in ('bed', 'chair', 'chair>2', 'chair>2.front'): print(k, C[k]['ax'], C[k]['ay'], C[k]['w'], C[k]['h'])
chips.pack_imgs(head, C)
open('.chips_changed', 'w').write('bed\nchair')
