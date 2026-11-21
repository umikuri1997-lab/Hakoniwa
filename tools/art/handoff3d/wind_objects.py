"""風のしかけ。単位はマス。床の中心が原点、南と上が正。

風穴：半径0.39〜0.42の石組みを8つのくさび石で囲う。内径0.49、
深さ0.13。開口の下に暗い穴底を置く。ふさがった穴は、石組みと
穴底の上に6個の割石を重ね、すきまが開かないように詰める。
かざみ：幅0.26の石の台に木の柱を立て、高さ0.57に回転軸を
つける。金属の矢（全長0.63）は軸に通し、先を南へ向ける。
"""
from math import cos, sin, tau

from common import WOOD
from rides import BRASS, CREAM, GOLD

STONE = [(164, 157, 140), (188, 179, 157), (177, 168, 150)]
VANE_GREEN = (50, 195, 155)
VANE_RED = (208, 114, 69)


def hole(m, blocked):
    floor = STONE[0] if blocked else (68, 79, 90)
    m.lathe([(0, 0), (.30, 0), (.32, .07), (0, .07)], floor)
    for i in range(8):
        a = tau * i / 8
        radius = .42 if i % 2 else .39
        angles = [a + d * tau / 8 for d in (.018, .50, .982)]
        outer = [(radius*cos(t), radius*sin(t)) for t in angles]
        inner = [(.245*cos(t), .245*sin(t)) for t in reversed(angles)]
        top = .15+(i % 3)*.024
        m.prism(outer + inner, 0, top-.032, STONE[i % 3], surface="stone")
        crown = [(x*.975, y*.975) for x, y in outer]
        crown += [(x*1.045, y*1.045) for x, y in inner]
        m.prism(crown, top-.038, top, STONE[i%3], surface="stone")
    if blocked:
        for x, y, z, width, height, angle in (
            (-.15, -.04, .10, .19, .18, .4), (.14, .04, .10, .19, .19, .7),
            (-.10, .16, .11, .16, .16, .8), (.15, -.16, .11, .15, .18, .1),
            (-.016, -.10, .23, .17, .15, .3), (.023, .083, .145, .102, .10, .5),
        ):
            m.rock(x, y, z, width, height, angle, STONE[round(angle*10) % 3])


def vane(m):
    m.box((-.13, -.13, 0), (.13, .13, .045), STONE[0], surface="stone")
    m.box((-.11, -.11, .041), (.11, .11, .082), STONE[1], surface="stone")
    m.box((-.044, -.044, .075), (.044, .044, .55), WOOD)
    for z in (.09, .49):
        m.lathe([(0,z),(.055,z),(.055,z+.034),(0,z+.034)], BRASS,
                surface="metal")
    m.lathe([(0, .51), (.065, .51), (.065, .61), (0, .61)], VANE_RED, surface="metal")
    m.rod((0, -.25, .63), (0, .25, .63), .024, CREAM)
    m.prism([(-.085, .15), (.085, .15), (0, .33)], .596, .663, VANE_GREEN, surface="metal")
    m.prism([(-.115, -.30), (.115, -.30), (.061, -.17), (-.061, -.17)],
            .606, .647, VANE_GREEN, surface="metal")
    m.prism([(-.043,.166),(.043,.166),(0,.30)], .662,.669, CREAM)
    m.rod((0,-.281,.65),(0,-.182,.65),.017,GOLD)
    m.ball((0,0,.663),.028,BRASS,surface="metal")
