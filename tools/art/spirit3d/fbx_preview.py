"""持ち主のモデル（fbx_model.FbxSpirit）で写した動きの絵を、たしかめ用に1まいにならべる（ゲームのファイルは書かない）。
  python3 tools/art/spirit3d/fbx_preview.py <出す .png> [動きの名前...]
行：動き × 向き（正面・横・うしろ）、列：属性ごとに、その動きのコマをならべる。目・ほっぺは、ゲームと同じく、チップの絵を目の場所にかさねる。"""
import io, os, sys
from multiprocessing import Pool
import numpy as np
from PIL import Image, ImageDraw
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from core import ELS, chip
import build
from fbx_model import FbxSpirit
from motions import MOTIONS

Z = 3   # 拡大

def job(a):
    return build.job(a, factory=FbxSpirit)

def eyes(img, geo, e, face):
    """コマの絵に、目とほっぺのチップをかさねる（e：[dx, dy, 向き, 反転, …]）"""
    if face == 2 or e[2] == 2: return img
    S = '' if e[2] == 0 else 'S'
    for k in ('sp:cheek'+S, 'sp:face'+S+'#n'):
        try: c, ax, ay = chip(k)
        except KeyError: continue
        t = Image.fromarray(c)
        if e[3]: t = t.transpose(Image.FLIP_LEFT_RIGHT); ax = -ax-c.shape[1]
        img.alpha_composite(t, (int(round(ax-geo[2]+e[0])), int(round(ay-geo[3]+e[1]))))
    return img

def main():
    out = sys.argv[1]; names = sys.argv[2:] or ['stand', 'walk', 'wave', 'eat', 'cook']
    res = {}
    with Pool(min(4, os.cpu_count() or 1)) as pool:
        for name, el, raw, geo, eye, hd in pool.imap_unordered(job, [(n, e) for n in names for e in ELS]):
            res[(name, el)] = (Image.open(io.BytesIO(raw)).convert('RGBA'), geo, eye); print(name, el, flush=True)
    rows = []
    for name in names:
        n = MOTIONS[name]['n']
        for face in (0, 1, 2):
            tiles = []
            for el in ELS:
                sh, geo, eye = res[(name, el)]; cw, ch = geo[0], geo[1]
                for i in range(n):
                    f = sh.crop((i*cw, face*ch, (i+1)*cw, (face+1)*ch))
                    tiles.append(eyes(f, geo, eye[face][i], face))
                tiles.append(None)
            W = sum(t.width if t else 6 for t in tiles); H = max(t.height for t in tiles if t)
            row = Image.new('RGBA', (W, H), (200, 220, 180, 255)); x = 0
            for t in tiles:
                if t is None: row.paste((120, 140, 110, 255), (x, 0, x+6, H)); x += 6; continue
                row.alpha_composite(t, (x, H-t.height)); x += t.width
            rows.append((f'{name} {"正面 横 うしろ".split()[face]}', row))
    W = max(r.width for _, r in rows); H = sum(r.height+12 for _, r in rows)
    sheet = Image.new('RGBA', (W, H), (255, 255, 255, 255)); y = 0; d = ImageDraw.Draw(sheet)
    for label, r in rows:
        d.text((2, y), label, fill=(0, 0, 0, 255)); sheet.alpha_composite(r, (0, y+12)); y += r.height+12
    sheet.resize((W*Z, H*Z), Image.NEAREST).convert('RGB').save(out)

if __name__ == '__main__':
    main()
