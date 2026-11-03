#!/usr/bin/env python3
"""受け取った透過PNGから御神木のチップを再生成。元の色・アルファを保ち、BOXで縮小する。"""
import importlib.util
import json
from pathlib import Path
import tempfile
import sys
sys.dont_write_bytecode = True
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('chips', ROOT / 'tools/chips.py')
chips = importlib.util.module_from_spec(spec)
spec.loader.exec_module(chips)
# key, source, canvas size at g64, ax, ay. 根の中心を(64,116)にそろえる。
ART = [
    ('story:stump', 'stump', 128, 1, 11),
    ('story:bud', 'bud', 128, 1, 11),
    ('story:leaf', 'leaf', 128, 1, 11),
    ('story:sapling', 'sapling', 128, 6, -5),
    ('story:tree-young', 'tree', 224, -43, -97),
    ('story:tree', 'tree', 288, -73, -158),
    ('story:stone', 'stone', 24, -12, -12),
]
with tempfile.TemporaryDirectory() as tmp:
    path = Path(tmp) / 'chips.json'
    chips.unpack(path)
    data = json.loads(path.read_text())
    for key, name, size, ax, ay in ART:
        original = Image.open(ROOT / 'tools/art/sacred-tree' / (name+'.png')).convert('RGBA')
        image = original.resize((size,size), Image.Resampling.BOX)
        data['chips'][key] = {'ax': ax, 'ay': ay, 'w': size, 'h': size, 'g':64, 'f':[chips.to_uri(image)]}
    path.write_text(json.dumps(data,ensure_ascii=False))
    chips.pack(path)
