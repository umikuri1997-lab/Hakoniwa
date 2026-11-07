"""コワイノのコマの絵（もらった絵 basic_frames.png：3行×4列）→ チップ kg_<種類>:<動き>
1行め：前むき 立つ2・歩く2、2行め：うしろむき 立つ2・歩く2、3行め：ふりかぶる・ふりおろす・もどる・やられ
コマは、どれも同じ大きさのわくで切り（足もとをそろえる）、BOX で 1/F にちぢめる（色・うすさはそのまま）。
使い方: python3 tools/art/kowaino/kowaino_frames.py
"""
import sys, os
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))
sys.path.insert(0, os.path.join(ROOT, 'tools')); import chips
from PIL import Image
F = 4.6
COLS = [186, 547, 908, 1270]; BOT = [302, 663, 1024]; CW, CH = 207, 276   # 列のまん中・行の足もと（もとの絵のピクセル）
MOTION = {'idle': [(0, 0), (0, 1)], 'walk': [(0, 2), (0, 3)], 'idleB': [(1, 0), (1, 1)], 'walkB': [(1, 2), (1, 3)],
          'atk': [(2, 0), (2, 1), (2, 2)], 'hurt': [(2, 3)]}

def build(kind='basic', src='basic_frames.png'):
    im = Image.open(os.path.join(HERE, src)).convert('RGBA')
    w, h = round(CW / F), round(CH / F)
    h0, C = chips.load_imgs()
    for k in [k for k in C if k.startswith('kg_' + kind + ':') or k.startswith('kgp_' + kind + ':')]: del C[k]
    for mo, cells in MOTION.items():
        sheet = Image.new('RGBA', (w, h * len(cells)))
        for i, (r, c) in enumerate(cells):
            box = (COLS[c] - CW // 2, BOT[r] - CH, COLS[c] - CW // 2 + CW, BOT[r])
            sheet.paste(im.crop(box).resize((w, h), Image.BOX), (0, i * h))
        C['kg_%s:%s' % (kind, mo)] = {'ax': -(w // 2), 'ay': -h + 1, 'w': w, 'h': h, 'n': len(cells), 'f': [sheet]}
    chips.pack_imgs(h0, C)

if __name__ == '__main__':
    build()
