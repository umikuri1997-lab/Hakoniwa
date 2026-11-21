"""水辺の置き物。単位はマス。床の中心が原点、南と上が正。

桟橋：幅0.84、奥行き0.62の床。4本の杭の上に2本の桁を渡し、
板7枚をねじ止めする。奥の桁に係留用のT字柱を固定。
いかだ：直径0.15、長さ0.56の丸太5本を横桟2本で束ねる。
横桟に竿を差し、上端に長さ0.32の旗を固定。
宝箱：幅0.62、奥行き0.39の板箱。後ろのちょうつがいで丸い
ふたをとめ、正面の金具で閉じる。
水門：幅0.17の石柱2本に幅0.96の石のまぐさを載せる。
柱の溝に幅0.50の木戸を通す。開いた絵では木戸を上げ、
こわれた絵では木戸を下げ、折れた板の間にすきまを残す。
"""
from math import cos, pi, sin

from common import WOOD
from rides import CREAM, GOLD, TRIM
from wind_objects import STONE

FLAG = (227, 126, 96)


def dock(m):
    for x in (-.33, .33):
        for y in (-.22, .30):
            m.box((x-.048, y-.048, 0), (x+.048, y+.048, .26), WOOD)
        m.box((x-.047, -.34, .19), (x+.047, .35, .27), WOOD)
    for i in range(7):
        y = -.32 + i*.094
        m.box((-.42, y, .264), (.42, y+.087, .325), WOOD)
    m.box((-.049, -.27, .32), (.049, -.17, .62), WOOD)
    m.rod((-.12, -.22, .60), (.12, -.22, .60), .041, WOOD)
    m.tube([(-.056, -.15, .48), (.062, -.15, .49), (.061, -.29, .53),
            (-.055, -.29, .54), (-.057, -.15, .51)], .015, CREAM)


def raft(m):
    for i in range(5):
        x = -.30+i*.15
        m.tube([(x, -.24, .076), (x, .32, .076)], .076, WOOD)
    for y in (-.17, .23):
        m.box((-.374, y-.04, .13), (.374, y+.04, .205), WOOD)
        for x in (-.31, .31):
            m.rod((x-.025, y-.045, .207), (x+.025, y+.045, .207), .014, CREAM)
    m.rod((-.075, -.17, .195), (-.075, -.17, .73), .024, WOOD)
    flag = [(-.075, -.171, .72), (.25, -.15, .69),
            (.19, -.15, .62), (.25, -.15, .55), (-.075, -.171, .57)]
    m.part(FLAG)
    m.sc.tri(flag[0], flag[1], flag[2], FLAG)
    m.sc.tri(flag[0], flag[2], flag[4], FLAG)
    m.sc.tri(flag[2], flag[3], flag[4], FLAG)


def chest(m):
    m.box((-.31, -.18, 0), (.31, .21, .27), WOOD)
    for i in range(8):
        a, b = i*pi/8, (i+1)*pi/8
        y, u = .015+.195*cos(a), .015+.195*cos(b)
        z, w = .267+.15*sin(a), .267+.15*sin(b)
        m.part(WOOD)
        m.sc.quad((-.31,y,z), (.31,y,z), (.31,u,w), (-.31,u,w), WOOD)
        for x in (-.31, .31):
            m.sc.tri((x,.015,.267), (x,y,z), (x,u,w), WOOD)
        for x in (-.232, .186):
            m.rod((x,y+.002,z+.006), (x,u+.002,w+.006), .022, GOLD)
    for x in (-.232, .186):
        m.box((x-.022, .21, .025), (x+.022, .229, .291), GOLD)
    m.box((-.075, .213, .153), (.075, .247, .305), GOLD)
    m.box((-.016, .247, .199), (.016, .258, .245), TRIM)


def gate(m, broken):
    for x in (-.34, .34):
        for i in range(3):
            z = i*.238
            m.box((x-.087, .016, z), (x+.087, .30, z+.231),
                  STONE[(i+int(x>0))%3])
    m.box((-.48, -.01, .705), (.48, .325, .815), STONE[1])
    bottom = .06 if broken else .48
    for i in range(5):
        x = -.253+i*.102
        if broken and i == 2:
            m.rod((x+.04, .14, .055), (x+.10, .14, .29), .038, WOOD)
            m.rod((x+.05, .14, .47), (x+.026, .14, .62), .038, WOOD)
        else:
            m.box((x, .10, bottom), (x+.095, .175, .66), WOOD)
    for z in ((.19, .48) if broken else (.51, .62)):
        if broken:
            for start, end in ((-.254, -.06), (.071, .254)):
                m.rod((start, .178, z), (end, .198, z-.02), .027, WOOD)
        else:
            m.box((-.254, .17, z), (.254, .214, z+.037), WOOD)
