"""3Dの試作（proto3d）の材質の絵：CC0 のテクスチャ（tools/art/textures）を、色のついたまま、
よこ SIZE ドットにちぢめて tex/m_<名前>.jpg に書く（なめらかなトゥーン用。前はドット絵用に1マス45ドットだった）。
  python3 proto3d/make_textures.py
1まいが何マスぶんか（span）は、ゲームの道具（tools/art/handoff3d/render.py の SURFACES・sacred_tripo.py の木の皮）と同じ。
試作は、UV 展開したモデル（make_uv.py・make_plants.py）に、この絵の明るさをくりかえしてのせる（main.js の MATIDX）。"""
import json, os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'tools', 'art', 'textures'); OUT = os.path.join(ROOT, 'proto3d', 'tex')
SIZE = 512   # 絵のよこのドット数
MATS = {'wood': ('wood049.png', 2.0), 'stone': ('rock030.png', .57), 'metal': ('metal032.png', .65), 'cloth': ('fabric026.png', .72), 'bark': ('bark001.png', .8)}

if __name__ == '__main__':
    meta = {}
    for k, (f, span) in MATS.items():
        im = Image.open(os.path.join(SRC, f)).convert('RGB'); n = min(SIZE, im.width)
        im.resize((n, max(8, round(n*im.height/im.width))), Image.LANCZOS).save(os.path.join(OUT, 'm_'+k+'.jpg'), quality=88)
        meta[k] = {'span': span, 'aspect': im.height/im.width}
    json.dump(meta, open(os.path.join(OUT, 'mats.json'), 'w'), indent=1); print('ok', meta)
