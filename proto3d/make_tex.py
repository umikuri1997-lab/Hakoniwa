"""3Dの試作（proto3d）の地面にはる絵を、ゲームのチップ（chips.js とアトラス）から切り出す。
  python3 proto3d/make_tex.py
草（tex:grass）・水（tex:water）・がけの土のだん（cliff:block）・道（path#0〜#3 を横にならべた1まい）。
木（クォータービューのチップ）と、その足もとのかげ（:sh）。ずれ（ax・ay）と大きさは sprites.json に。"""
import json, os, re
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'proto3d', 'tex')
src = open(os.path.join(ROOT, 'chips.js'), encoding='utf8').read()
pages = json.loads(re.search(r'CHIPA=(\[[^\]]*\])', src).group(1))


def chip(k):
    d = json.loads(re.search(r'"%s":(\{[^}]*\})' % re.escape(k), src).group(1))
    p, x, y, w, h = d['f'][0]
    return Image.open(os.path.join(ROOT, pages[p])).convert('RGBA').crop((x, y, x + w, y + h))


os.makedirs(OUT, exist_ok=True)
for name, k in (('grass', 'tex:grass'), ('water', 'tex:water'), ('cliff', 'cliff:block')):
    chip(k).save(os.path.join(OUT, name + '.png'))
paths = [chip('path#%d' % i) for i in range(4)]
row = Image.new('RGBA', (sum(p.width for p in paths), paths[0].height))
for i, p in enumerate(paths):
    row.paste(p, (i * p.width, 0))
row.save(os.path.join(OUT, 'path.png'))
meta = {}
for k in ('tree', 'tree~m', 'maple~m', 'tree~v'):
    for kk in (k, k + ':sh'):
        d = json.loads(re.search(r'"%s":(\{[^}]*\})' % re.escape(kk), src).group(1))
        fn = kk.replace('~', '_').replace(':', '_')
        chip(kk).save(os.path.join(OUT, fn + '.png'))
        meta[kk] = {'f': fn + '.png', 'ax': d['ax'], 'ay': d['ay'], 'w': d['w'], 'h': d['h']}
json.dump(meta, open(os.path.join(OUT, 'sprites.json'), 'w'), indent=1)
print('ok', sorted(os.listdir(OUT)))
