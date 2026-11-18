"""icons32 で、ちぢめるとくずれた物を、手で描いたドット（32×32）でおきかえる。
HAND = {名前: (色の表, 32行の字)}。'.' は透明。"""

POUCH = ({
    'O': (176, 150, 120), 'h': (250, 244, 232), 'c': (240, 228, 206), 's': (222, 204, 176), 'S': (200, 180, 150),
    'R': (150, 72, 60), 'r': (206, 104, 88), 'p': (232, 146, 128),
    't': (214, 136, 112), 'T': (190, 112, 92),
    'Y': (190, 150, 50), 'y': (246, 212, 90), 'g': (252, 236, 150), 'G': (226, 182, 64),
}, [
    '................................',
    '................................',
    '............OO.OO.OO............',
    '..........OOhhOhcOhhOO..........',
    '.........OhhcchcchcccO..........',
    '.........OcccccccccssO..........',
    '..........OscsccsscsO...........',
    '...........OSssssSSO............',
    '..........RRRRRRRRRRRR..........',
    '..........RpprrrrrrrrR..........',
    '..........RRRRRRRRRRRR..........',
    '.......RrRhcccccccccccRrR.......',
    '......RrRhhccccccccccccRrR......',
    '.....RrRhhcccccccccccccsRrR.....',
    '....RRRRhcccttttcccccccsRRRR....',
    '...ORpprhcctttttccccccYsRpprO...',
    '...ORRRRhccTTTTTcccccYYYRRRRO...',
    '...OhhcccccccccccccccYgyYssSO...',
    '...OhhcccccctttTccccYggyyYsSO...',
    '...OhhccccctttttTcccYgyyGYsSO...',
    '...OhhccccctttttTcccYyyyGYsSO...',
    '...OhhccccttttttTTccYyyGGYsSO...',
    '...OhhccccttttttTTcccYyGYcsSO...',
    '...OhhcccttttttttTTcccYYccsSO...',
    '...OhhcccttttttttTTcccccccsSO...',
    '...OhhccTTTTTTTTTTTTccccccsSO...',
    '....OhcccccccccccccccccccsSO....',
    '....OccccccccccccccccccssSSO....',
    '.....OsccccccccccccccssSSSO.....',
    '......OSssssssssssssSSSSSO......',
    '........OOOOOOOOOOOOOOOO........',
    '................................',
])

MEDAL_IRON = ({
    'O': (98, 92, 94), 'd': (122, 116, 118), 'm': (146, 140, 142), 'l': (172, 166, 168), 'h': (200, 194, 196),
    'e': (188, 183, 185), 's': (118, 112, 114),
    'R': (150, 64, 56), 'r': (204, 88, 78), 'p': (232, 136, 126), 'w': (246, 190, 182),
}, [
    '.............RRRRRR.............',
    '............RpwwpprR............',
    '...........RpwRRRRrrR...........',
    '...........RprR..RrrR...........',
    '...........RprR..RrrR...........',
    '...........RprR..RrrR...........',
    '...........RrrrRRrrrR...........',
    '............RrrrrrrR............',
    '............RprrrrrR............',
    '............RRrrrrRR............',
    '............OOORROOO............',
    '..........OOllRrrRllOO..........',
    '.........OlhlmRRRRmlldO.........',
    '........OlhmmmmmmmmmmldO........',
    '.......OlhmmmeemeeemmmldO.......',
    '......OlhmmeeeeeeeeemmmldO......',
    '......OlmmmseeeeeeesmmmmdO......',
    '.....OlmmmmmmmsssessmmmmmdO.....',
    '.....OlmmmmmmmmeeesmmmmmmdO.....',
    '.....OlmmmmmmmeeeeesmmmmmdO.....',
    '.....OlmmmmmmeeeeeeesmmmmdO.....',
    '.....OlmmmmmeeeeeeeeesmmmdO.....',
    '.....OlmmmmeeeeeeeeeeesmmdO.....',
    '.....OlmmmeeeeeeeeeeeeesmdO.....',
    '.....OlmmsssssssssssssssmdO.....',
    '......OlmmmmmmmmmmmmmmmddO......',
    '......OmmmmmmmmmmmmmmmdddO......',
    '.......OdmmmmmmmmmmmmdddO.......',
    '........OddmmmmmmmmmdddO........',
    '.........OdddmmmmmddddO.........',
    '..........OOddddddddOO..........',
    '............OOOOOOOO............',
])

HAND = {'pouch': POUCH, 'medal_iron': MEDAL_IRON}


def draw(pal, rows):
    from PIL import Image
    assert len(rows) == 32, len(rows)
    im = Image.new('RGBA', (32, 32))
    for y, r in enumerate(rows):
        assert len(r) == 32, (y, len(r), r)
        for x, ch in enumerate(r):
            if ch != '.': im.putpixel((x, y), pal[ch] + (255,))
    return im
