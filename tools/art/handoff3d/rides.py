"""遊具の設計図。単位はマス。床の中心が原点、南と上が正。

メリーゴーラウンド（2×2）：半径1.29の床に中央柱を固定し、高さ
2.14の軒から高さ2.65の頂点へ12枚の屋根板を組む。馬3頭は
半径0.94の回転盤に立つ支柱に取りつける。鞍の高さは0.98。
カップ（2×2）：半径1.38の台に半径0.70の軌道を切り、半径
0.41のカップ2個を置く。カップの壁と底は一体。取っ手は外壁に
両端を止め、内側の座面は底から少し上に取りつける。
中央に青い釉薬の水盤を固定し、底から0.07上に水面を張る。
空中ブランコ（2×2）：高さ4.16の柱を半径0.72の基礎に固定。
半径0.72の回転頭に3組の吊り材をつなぎ、高さ1.57の座板を吊るす。
観覧車（3×2）：左右に開く支柱を基礎から車軸（高さ2.94）へ
つなぐ。半径1.55の二重の輪を8本のスポークで車軸に固定。
4個のゴンドラを輪の横軸に吊り、座面を横軸の0.49下に置く。
窓は背と正面にガラスをはめる。こわれた絵は片側の窓が外れる。
"""
from math import cos, sin, sqrt, tau

from common import WOOD

PINK = (243, 146, 176)
CREAM = (255, 241, 211)
MINT = (143, 208, 186)
RIDE_MINT = (137, 216, 192)
GOLD = (222, 176, 116)
TRIM = (168, 118, 111)
BLUE = (166, 222, 237)
LILAC = (189, 169, 231)
PEACH = (253, 177, 125)
SUN = (252, 219, 126)
SILVER = (189, 205, 216)
BRASS = (184, 136, 83)
LEATHER = (159, 102, 95)
SEATS = {"merry": 3, "cup": 2, "skyswing": 3, "wheel": 4}
SPEED = {"merry": 1, "cup": 1.3, "skyswing": 1, "wheel": .35}


def polar(radius, angle, z):
    return radius * cos(angle), radius * sin(angle), z


def carousel(m, phase, broken, seats):
    m.lathe([(0, 0), (1.23, 0), (1.29, .08), (1.29, .24),
             (1.24, .255), (0, .255)], GOLD, surface="wood")
    for i in range(-6, 7):
        y = i*.18
        half = sqrt(1.24**2-(abs(y)+.084)**2)
        m.box((-half, y-.084, .254), (half, y+.084, .30), WOOD)
    m.rod((0, 0, .24), (.13 if broken else 0, 0, 2.65), .075, GOLD, surface="wood")
    for z in (.34, .47, 1.95):
        m.lathe([(.082, z), (.105, z), (.105, z+.04), (.082, z+.04)],
                BRASS, z*.05 if broken else 0, surface="polished")
    roof_x = .18 if broken else 0
    for panel in range(12):
        if broken and panel in (1, 2):
            continue
        a = panel * tau / 12
        b = (panel + 1) * tau / 12
        x, y, z = polar(1.31, a, 2.14 + .10 * cos(a) * broken)
        u, v, w = polar(1.31, b, 2.14 + .10 * cos(b) * broken)
        color = (PINK, CREAM, PEACH, CREAM, RIDE_MINT, CREAM)[panel % 6]
        m.part(color, surface="cloth")
        m.sc.tri((roof_x, 0, 2.65), (x, y, z), (u, v, w), m.color(color))
        m.sc.quad((x, y, z), (u, v, w), (u, v, w-.10),
                  (x, y, z-.10), m.color(color))
        m.rod((x, y, z-.095), (u, v, w-.095), .019, GOLD)
        m.rod((roof_x, 0, 2.65), (x, y, z+.015), .014, CREAM)
        if not broken:
            cx, cy = (x+u)/2, (y+v)/2
            m.part((RIDE_MINT, SUN, LILAC)[panel % 3], surface="cloth")
            m.sc.tri((x*.34+cx*.66, y*.34+cy*.66, z-.10),
                     (u*.34+cx*.66, v*.34+cy*.66, w-.10),
                     (cx, cy, (z+w)/2-.235),
                     m.color((RIDE_MINT, SUN, LILAC)[panel % 3]))
    m.ball((roof_x, 0, 2.69), .09, SUN, surface="polished")
    for index in range(3):
        angle = phase + index * tau / 3
        x, y, z = polar(.94, angle, .84)
        tangent = (-sin(angle), cos(angle))

        def horse(along, height):
            return x + along * tangent[0], y + along * tangent[1], z + height

        if broken and index == 1:
            m.rod((x, y, .31), horse(.16, -.33), .029, TRIM)
            continue
        trim = (PINK, RIDE_MINT, LILAC)[index]
        m.rod((x, y, .27), (x, y, 2.15), .024, GOLD, surface="polished")
        m.rod(horse(-.17, 0), horse(.15, 0), .115, CREAM)
        m.rod(horse(.12, .02), horse(.18, .25), .065, CREAM)
        m.rod(horse(.15, .23), horse(.30, .19), .065, CREAM)
        m.rod(horse(.15, .23), horse(.13, .32), .027, CREAM)
        m.rod(horse(-.16, .025), horse(-.32, -.13), .038, trim)
        m.rod(horse(.095, .15), horse(.145, .247), .028, trim)
        m.ball(horse(.235, .234), .025, LEATHER)
        m.rod(horse(.205, .15), horse(.27, .20), .017, LEATHER)
        for along in (-.12, .13):
            m.rod(horse(along, -.03), horse(along-.05, -.28), .039, CREAM)
        m.rod(horse(-.075, .105), horse(.075, .105), .045, trim)
        seats.append(horse(0, .14))
    if broken:
        m.rod((-.91, .63, .33), (-.42, .88, .39), .052, CREAM)


def cups(m, phase, broken, seats):
    m.lathe([(0, 0), (1.32, 0), (1.38, .11), (1.38, .23),
             (1.30, .30), (0, .30)], RIDE_MINT)
    m.lathe([(0,.30),(.11,.30),(.105,.49),(.169,.54),(.244,.64),
             (.253,.68),(.253,.703),(.213,.703),(.184,.602),
             (0,.601)], BLUE, surface="enamel")
    m.lathe([(.229,.69),(.256,.69),(.258,.713),(.223,.713)],
            CREAM, surface="enamel")
    m.lathe([(0,.60),(.048,.60),(.037,.743),(0,.765)], GOLD, surface="polished")
    finial = (0, 0, .775)
    m.ball(finial, .054, SUN, surface="polished")
    if not broken:
        m.water_disk(.222, .674, (102, 204, 233), (finial, .054, SUN))
    m.lathe([(1.29,.231),(1.37,.231),(1.36,.265),(1.29,.265)], CREAM)
    for i in range(12):
        m.ball(polar(1.29, i*tau/12, .269), .036,
               (SUN, PEACH, LILAC)[i % 3], surface="enamel")
    for index in range(2):
        angle = phase + index * tau / 2
        x, y, _ = polar(.70, angle, 0)
        z = .32
        color = PINK if index else LILAC
        first = m.sc.pid
        m.lathe([(0, z), (.24, z), (.34, z+.13), (.41, z+.47),
                 (.355, z+.47), (.295, z+.16), (0, z+.16)], color, x, y,
                surface="enamel")
        m.lathe([(.344, z+.20), (.365, z+.20), (.369, z+.23),
                 (.349, z+.23)], CREAM, x, y)
        m.lathe([(.357, z+.47), (.412, z+.47), (.412, z+.52),
                 (.357, z+.52), (.357, z+.47)], CREAM, x, y, surface="enamel")
        for j in range(8):
            a = angle+j*tau/8
            dx, dy, dz = polar(.379, a, z+.30)
            m.ball((x+dx,y+dy,dz), .035, SUN, surface="enamel")
        m.box((x-.19, y-.10, z+.16), (x+.19, y+.05, z+.22), RIDE_MINT)
        m.rod((x,y,z+.15), (x,y,z+.31), .033, BRASS, surface="polished")
        wheel = [(x+.095*cos(i*tau/20), y+.095*sin(i*tau/20), z+.31)
                 for i in range(21)]
        m.tube(wheel, .018, CREAM)
        if not (broken and index == 1):
            m.tube([(x+(.34+.13*sin(k*tau/16))*cos(angle),
                     y+(.34+.13*sin(k*tau/16))*sin(angle),
                     z+.28+.12*cos(k*tau/16)) for k in range(9)], .035,
                   color, surface="enamel")
        if broken and index == 1:
            m.tilt(first, (x, y, z), -.31)
        seats.append((x, y, z+.22))
    if broken:
        m.box((-.55, .95, .30), (-.24, 1.04, .39), GOLD)


def swing(m, phase, broken, seats):
    m.lathe([(0, 0), (.68, 0), (.72, .11), (.67, .22),
             (.31, .27), (0, .27)], GOLD)
    top = (.23 if broken else 0, 0, 4.16)
    m.rod((0, 0, .22), top, .079, GOLD, surface="polished")
    m.lathe([(.13,.22),(.23,.22),(.19,.34),(.16,.49),(.10,.49)],
            BRASS, surface="polished")
    for i in range(6):
        m.ball(polar(.59, i*tau/6, .216), .029, BRASS, surface="polished")
    m.lathe([(0, 4.04), (.74, 4.04), (.78, 4.17), (.71, 4.25),
             (.10, 4.42), (0, 4.42)], PINK, top[0], surface="enamel")
    m.lathe([(.75,4.08),(.782,4.08),(.782,4.124),(.75,4.124)], SUN,
            top[0], surface="polished")
    m.ball((top[0], 0, 4.48), .081, CREAM)
    for i in range(12):
        x, y, z = polar(.742, i*tau/12, 4.17)
        m.ball((x+top[0], y, z), .041, (CREAM, SUN, LILAC)[i % 3],
               surface="enamel")
    for index in range(3):
        angle = phase + index * tau / 3
        x, y, z = polar(1.20 if not broken else .81, angle, 1.57)
        hx, hy, hz = polar(.70, angle, 4.10)
        if broken and index == 1:
            m.rod((hx+top[0], hy, hz), (hx+.38, hy, 2.40), .020, RIDE_MINT)
            continue
        for side in (-1, 1):
            m.rod((hx+top[0]+side*.09, hy, hz),
                  (x+side*.15, y, z+.03), .019, RIDE_MINT)
        color = (PINK, RIDE_MINT, LILAC)[index]
        m.box((x-.19, y-.12, z-.05), (x+.19, y+.12, z+.04), color,
              surface="enamel")
        m.box((x-.19, y-.13, z+.04), (x+.19, y-.08, z+.21), CREAM,
              surface="cloth")
        for side in (-1, 1):
            sx = x+side*.175
            m.rod((sx,y-.10,z+.13), (sx,y+.095,z+.13), .024, color)
            m.ball((sx,y+.09,z+.12), .026, CREAM)
        seats.append((x, y, z+.04))


def wheel(m, phase, broken, seats):
    hub = (-.13 if broken else 0, -.40, 2.94)
    m.box((-1.32, -.69, 0), (1.32, .69, .13), GOLD, surface="wood")
    for i in range(8):
        y = -.65+i*.165
        m.box((-1.31, y, .125), (1.31, y+.155, .161), WOOD)
    m.box((-.35,.65,.024),(.35,.79,.077), WOOD)
    m.box((-.35,.62,.074),(.35,.72,.119), WOOD)
    for side in (-1, 1):
        for y in (-.58, .51):
            m.rod((side*1.06, y, .12), (hub[0], y, hub[2]), .089, RIDE_MINT,
                  surface="polished")
            x = side*1.06
            m.box((x-.15,y-.10,.144), (x+.15,y+.10,.21), BRASS)
            for dx in (-.109, .109):
                m.ball((x+dx,y,.21), .024, CREAM)
        m.rod((-1.08, side*.50, .71), (1.08, side*.50, .71), .047, GOLD)
    m.rod((hub[0], -.65, hub[2]), (hub[0], .55, hub[2]), .09, GOLD)

    def rim(angle, y, radius=1.55):
        return (hub[0]+radius*cos(angle), y,
                hub[2]-radius*sin(angle)+(.18*cos(angle) if broken else 0))

    for y in (-.34, -.07):
        if broken:
            angles = [tau*i/48 for i in range(4, 45)]
        else:
            angles = [tau*i/48 for i in range(49)]
        m.tube([rim(a, y) for a in angles], .046, PINK, surface="polished")
        for index in range(8):
            a = phase + index*tau/8
            if not broken and index % 2 == 0:
                m.tube([rim(a+tau*j/192, y, 1.572) for j in range(-4, 5)],
                       .039, SUN, surface="polished")
            if not broken or index not in (1, 7):
                m.rod((hub[0], y, hub[2]), rim(a, y), .024, SILVER, surface="polished")
    if not broken:
        for i in range(24):
            x, y, z = rim(phase+i*tau/24, -.019, 1.574)
            m.ball((x,y,z), .042, (SUN, CREAM, RIDE_MINT, LILAC)[i % 4],
                   surface="enamel")
    for index in range(4):
        if broken and index == 2:
            continue
        a = phase + index*tau/4
        x, y, z = rim(a, -.01)
        m.rod((x, -.35, z), (x, .11, z), .038, TRIM)
        m.rod((x, .11, z), (x, .11, z-.17), .033, GOLD)
        color = (RIDE_MINT, PINK, LILAC, PEACH)[index]
        m.box((x-.25, -.07, z-.55), (x+.25, .26, z-.43), color)
        m.box((x-.25, -.07, z-.24), (x+.25, .26, z-.17), CREAM)
        for dx in (-.25, .19):
            m.box((x+dx, -.07, z-.44), (x+dx+.06, .26, z-.23), color)
        m.part(BLUE, surface="glass")
        glass = m.color(BLUE)
        m.sc.quad((x-.189,-.071,z-.434),(x+.189,-.071,z-.434),
                  (x+.189,-.071,z-.239),(x-.189,-.071,z-.239), glass)
        if not broken or index != 1:
            # 少し張り出した窓。角の面が斜めなので、正面からも反射が見える。
            panes = ((-.189,.207),(-.140,.242),(0,.246),(.140,.242),(.189,.207))
            for (u, v), (a, b) in zip(panes, panes[1:]):
                m.sc.quad((x+u,v,z-.434),(x+a,b,z-.434),
                          (x+a,b,z-.239),(x+u,v,z-.239), glass)
        m.rod((x,.25,z-.43),(x,.25,z-.227), .013, color, surface="polished")
        if not broken:
            m.rod((x-.19,.253,z-.29), (x+.19,.253,z-.29), .018, color,
                  surface="polished")
        for dx in (-.15,.15):
            m.ball((x+dx,.25,z-.466), .028, CREAM)
        seats.append((x, .12, z-.43))
    if broken:
        m.rod((-.96, .50, .16), (-1.23, .73, .23), .045, PINK)


MODELS = {"merry": carousel, "cup": cups, "skyswing": swing, "wheel": wheel}
