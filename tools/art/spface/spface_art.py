"""せいれいの顔：つかれた顔（tired）・おなかがすいた顔（hungry）を、いまの顔の絵と同じ作り（1色のドット）で足す。
python3 tools/art/faces/faces_art.py で chips.js とアトラスに入れる（なんどやっても同じ）。
A は顔の色（木の色。ゲームで属性の色にかわる）、b はよだれの色（かわらない）。"""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))
import chips
from PIL import Image

A = (63, 94, 38, 255)
COL = {'A': A, 'b': (156, 214, 248, 255), 'B': (110, 182, 230, 255)}

def img(rows):
    h, w = len(rows), len(rows[0])
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    for y, r in enumerate(rows):
        assert len(r) == w, (r, w)
        for x, ch in enumerate(r):
            if ch in COL: im.putpixel((x, y), COL[ch])
    return im

def two(L, R, gap):
    return [a + '.' * gap + b for a, b in zip(L, R)]

# つかれた顔：まぶたが半分おりた目（上はまっすぐのまぶた、下は丸い）
TE = ['AAAAAAA', '.AAAAA.', '.AAAAA.', '..AAA..']
TIRED = two(TE, TE, 12)
TIRED_S = ['AAAAAA', 'AAAAA.', '.AAAA.', '..AA..']
# おなかがすいた顔：しょんぼりした目と、小さくあいた口から、よだれ
SAD = ['.....A................A.....', '....AAA..............AAA....', '...AAAA..............AAAA...', '.AAAAAA..............AAAAA..',
       'AAAAAAA..............AAAAAAA', 'AAAAAAA..............AAAAAAA', '.AAAAAA..............AAAAAA.', '..AAAA................AAAA..',
       '...AA..................AA...']
E = '.' * 28
HUNGRY = SAD + [E, E,
                '.' * 13 + 'AA' + '.' * 13,
                '.' * 12 + 'AAAA' + '.' * 12,
                '.' * 13 + 'AAb' + '.' * 12,
                '.' * 15 + 'b' + '.' * 12,
                '.' * 15 + 'B' + '.' * 12]
SAD_S = ['.....AA', '....AAA', '...AAAA', '.AAAAAA', 'AAAAAAA', '.AAAAAA', '..AAAAA', '..AAAAA', '...AAA.']
HUNGRY_S = [r + '..' for r in SAD_S] + ['.........', '.........',
            '...AA....', '..AAA....', '...AAb...', '.....b...', '.....B...']

NEW = {
    'sp:face#tired':   (img(TIRED), -13, -42),
    'sp:faceS#tired':  (img(TIRED_S), 12, -42),
    'sp:face#hungry':  (img(HUNGRY), -14, -45),
    'sp:faceS#hungry': (img(HUNGRY_S), 11, -45),
}

def main():
    head, C = chips.load_imgs()
    for k, (im, ax, ay) in NEW.items():
        C[k] = {'ax': ax, 'ay': ay, 'w': im.size[0], 'h': im.size[1], 'r': 2, 'f': [im]}
    # まつげ：つかれた顔は、まぶたの外のはし。おなかがすいた顔は、しょんぼりの目と同じ
    lt = img(['A' + '.' * 26 + 'A', '.A' + '.' * 24 + 'A.'])
    C['sp:lash#tired'] = {'ax': -14, 'ay': -43, 'w': 28, 'h': 2, 'r': 2, 'f': [lt]}
    C['sp:lashS#tired'] = {'ax': 17, 'ay': -43, 'w': 2, 'h': 2, 'r': 2, 'f': [img(['.A', 'A.'])]}
    for S in ('', 'S'):
        s = C['sp:lash' + S + '#sad']
        C['sp:lash' + S + '#hungry'] = dict(s, f=[s['f'][0].copy()])
    chips.pack_imgs(head, C)
    open(os.path.join(chips.ROOT, '.chips_changed'), 'w').write('\n'.join(list(NEW) + ['sp:lash#tired', 'sp:lashS#tired', 'sp:lash#hungry', 'sp:lashS#hungry']))

if __name__ == '__main__':
    main()
