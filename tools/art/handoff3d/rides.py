"""遊園地の設計図。単位はマス。床の中心が原点、南と上が正。

見本の4種を、明るい木・クリーム・くすんだ水色でそろえる。
円形の板張り床は2段の台の上。手前に階段、外周に柵と布飾り。
回転木馬は支柱で3頭を吊るし、しまの屋根と波形の幕板を載せる。
空中ブランコは円すい屋根の下に6席。各座席を張った2本のひもで吊るす。
カップは受け皿つきの3席。後ろのアーチに看板とランタンを吊るす。
観覧車の二重の輪を木の支柱と軸で受け、屋根つきの8室を吊るす。
"""
from math import cos, sin, sqrt, tau

from common import WOOD

# CREAM, GOLD, TRIM, BRASS は水辺と風見にも使う。
CREAM = (255, 241, 211)
GOLD = (222, 176, 116)
TRIM = (168, 118, 111)
BRASS = (184, 136, 83)
OAK = (218, 179, 136)
HONEY = (235, 198, 147)
IVORY = (249, 226, 194)
LINEN = (255, 236, 209)
BLUE = (151, 190, 210)
BLUE_SHADE = (119, 158, 182)
BLUE_LIGHT = (182, 212, 225)
LANTERN = (255, 245, 194)
INK = (109, 80, 64)
GLASS = (180, 209, 218)
SEATS = {"merry": 3, "cup": 2, "skyswing": 3, "wheel": 4}
SPEED = {"merry": 1, "cup": 1.3, "skyswing": 1, "wheel": .35}


def polar(radius, angle, z):
    return radius*cos(angle), radius*sin(angle), z


def board(m, points, color, surface=None):
    m.part(color, surface=surface)
    m.sc.quad(*points, m.color(color))


def bead(m, center, radius, color, surface=None):
    """数ドットの飾り玉。輪郭が読める数の面で組む。"""
    m.material(color, True, surface)
    m.sc.sphere(*center, radius, m.color(color), n=10, m=6)


def flag(m, x, y, z, broken):
    """屋根の飾り玉に短い旗竿を立てる。"""
    m.lathe([(0,z),(.124,z),(.126,z+.043),(.091,z+.10),
             (.041,z+.115),(0,z+.115)], HONEY, x, y, surface="polished")
    if broken:
        m.rod((x,y,z+.08),(x+.11,y,z+.27),.028,OAK)
        return
    m.rod((x,y,z+.09),(x,y,z+.52),.03,HONEY,surface="polished")
    bead(m,(x,y,z+.52),.055,HONEY,surface="polished")
    wave = ((0,0),(.13,.022),(.27,-.005),(.41,-.043),(.56,-.029))
    edges = [
        ((x+u, y+.041*sin(u*10), z+.465+h),
         (x+u, y+.041*sin(u*10), z+.29+h+.085*u))
        for u, h in wave
    ]
    # 一枚の布として輪郭と布目の単位を共有し、頂点で面の向きをまぜる。
    m.material(BLUE, True, "cloth")
    m.sc.part()
    color = m.color(BLUE)
    for (upper, lower), (next_upper, next_lower) in zip(edges, edges[1:]):
        m.sc.quad(upper, next_upper, next_lower, lower, color)


def deck(m, radius, broken):
    """円の縁に沿う板、階段、手前に開口のある柵。"""
    m.lathe([(0,0),(radius+.065,0),(radius+.065,.11),
             (radius+.025,.14),(radius+.025,.245),(0,.245)], OAK,
            surface="wood")
    for i in range(-7,8):
        y = i*(radius-.05)/8
        half = sqrt(radius**2-(abs(y)+.075)**2)
        m.box((-half,y-.074,.239),(half,y+.072,.29),OAK,surface="wood")
    m.box((-.33,radius-.15,.019),(.33,radius+.17,.12),HONEY,surface="wood")
    m.box((-.33,radius-.20,.115),(.33,radius+.085,.228),OAK,surface="wood")

    count = 16
    for i in range(count):
        a = (i+.5)*tau/count
        b = (i+1.5)*tau/count
        x,y,_ = polar(radius-.048,a,0)
        if broken and i == 5:
            m.rod((x,y,.284),(x*.87,y*.92,.54),.047,OAK,surface="wood")
        else:
            m.lathe([(0,.284),(.052,.284),(.052,.635),(0,.635)],
                    HONEY,x,y,surface="wood",detail=12)
            bead(m,(x,y,.643),.058,IVORY)
        if i == 3 or (broken and i in (4,5)):
            continue
        z = .568
        a0 = polar(radius-.048,a,z)
        a1 = polar(radius-.048,b,z)
        m.rod(a0,a1,.034,HONEY,surface="wood")
        if sin((a+b)/2) > .08:
            for j in range(4):
                u,v = j/4,(j+1)/4
                def edge(t, lower):
                    p = a+(b-a)*t
                    h = z if not lower else z-.025-.16*sin(t*tau/2)
                    return polar(radius-.021,p,h)
                board(m,(edge(u,False),edge(v,False),edge(v,True),edge(u,True)),
                      BLUE_LIGHT,"cloth")


def sprig(m, origin, tangent, size):
    """幕板と看板の青い葉。板に平行な3枚のひし形。"""
    x,y,z = origin
    dx,dy = tangent
    for side in (-1,0,1):
        def leaf(u,v):
            return x+u*size*dx,y+u*size*dy,z+v*size
        lo = leaf(side*.17,0)
        mid = leaf(side*.41,.24)
        tip = leaf(side*.73,.50 if side else .77)
        board(m,(lo,mid,tip,leaf(side*.30-.16,.31)),BLUE_SHADE)


def lantern(m, x, y, z):
    m.rod((x,y,z),(x,y,z-.115),.017,BRASS)
    m.lathe([(0,z-.106),(.062,z-.106),(.075,z-.148),(0,z-.152)],
            HONEY,x,y,surface="polished")
    low,high = z-.295,z-.148
    m.box((x-.056,y-.056,low),(x+.056,y+.056,high),LANTERN)
    m.box((x-.064,y-.064,low-.021),(x+.064,y+.064,low),HONEY,
          surface="polished")
    for dx in (-.059,.059):
        for dy in (-.059,.059):
            m.rod((x+dx,y+dy,low),(x+dx,y+dy,high),.012,BRASS)


def canopy(m, radius, eaves, peak, lean, broken):
    """しまの屋根と、持ち送りの付いた波形の幕板。"""
    for i in range(12):
        a,b = i*tau/12,(i+1)*tau/12
        if broken and i in (1,2):
            continue
        edge = [polar(radius,t,eaves) for t in (a,b)]
        top = (lean,0,peak)
        mid = [polar(radius*.48,t,peak-.25*(peak-eaves)) for t in (a,b)]
        color = BLUE if i%2 else LINEN
        m.part(color,surface="cloth")
        m.sc.tri(top,*mid,m.color(color))
        m.sc.quad(mid[0],mid[1],edge[1],edge[0],m.color(color))
        profile = ((0,.055),(.25,.118),(.5,.164),(.75,.118),(1,.055))
        for (u,h),(v,k) in zip(profile,profile[1:]):
            p,q = a+(b-a)*u,a+(b-a)*v
            upper = polar(radius+.007,p,eaves+h),polar(radius+.007,q,eaves+k)
            lower = polar(radius+.007,p,eaves-.17),polar(radius+.007,q,eaves-.17)
            board(m,(*upper,*reversed(lower)),IVORY)
            m.rod(*upper,.022,HONEY)
            m.rod(*lower,.019,HONEY)
        x,y,z = polar(radius+.009,a,eaves-.174)
        m.rod((x,y,z),(x,y,eaves+.074),.034,HONEY,surface="wood")
        bead(m,(x,y,eaves+.068),.043,LINEN)
        t=(a+b)/2
        sprig(m,polar(radius+.013,t,eaves-.114),(-sin(t),cos(t)),.25)


def carousel(m, phase, broken, seats):
    deck(m,1.30,broken)
    lean = .13 if broken else 0
    m.lathe([(0,.29),(.32,.29),(.32,.43),(.265,.52),
             (.265,2.12),(.30,2.18),(0,2.18)], IVORY)
    for i in range(6):
        a = i*tau/6
        p = polar(.266,a,.43)
        q = polar(.266,a,2.13)
        m.rod(p,q,.026,HONEY,surface="wood")
        sprig(m,polar(.274,a,1.15),(-sin(a),cos(a)),.32)
    canopy(m,1.31,2.11,2.97,lean,broken)
    flag(m,lean,0,2.97,broken)
    for a in (tau*.07,tau*.43):
        lantern(m,*polar(1.205,a,1.94))
    for i in range(3):
        a=phase+i*tau/3
        x,y,z=polar(.94,a,.96)
        def horse(u,v,w=0):
            return x-u*sin(a)+w*cos(a),y+u*cos(a)+w*sin(a),z+v

        if broken and i==1:
            m.rod((x,y,.29),horse(.16,-.38),.029,OAK)
            continue
        m.rod((x,y,.29),(x,y,2.08),.025,BRASS,surface="polished")
        for u in (-.11,.01,.13):
            m.ball(horse(u,.018),.139,LINEN)
        m.tube([horse(.105,.025),horse(.20,.20),horse(.195,.275)],.078,IVORY)
        bead(m,horse(.242,.243),.091,LINEN)
        bead(m,horse(.31,.211),.067,CREAM)
        for side in (-1,1):
            m.tube([horse(.19,.266,side*.035),horse(.18,.397,side*.039)],
                   .025,LINEN)
            bead(m,horse(.267,.267,side*.074),.017,INK)
            m.tube([horse(-.115,-.055,side*.068),horse(-.22,-.19,side*.08),
                    horse(-.199,-.30,side*.08)],.031,LINEN)
            m.tube([horse(.115,-.064,side*.068),horse(.224,-.172,side*.08),
                    horse(.271,-.128,side*.085)],.032,LINEN)
        m.tube([horse(.145,.29),horse(.10,.24),horse(.07,.11)],.044,HONEY)
        m.tube([horse(-.205,.027),horse(-.296,.01),horse(-.335,-.145)],
               .043,HONEY)
        m.tube([horse(-.083,.125),horse(.075,.125)],.057,BLUE)
        seats.append(horse(0,.164))


def cafe_arch(m,broken):
    """奥の門形の枠。看板と小旗は水平線に沿って吊るす。"""
    y=-.65
    r=.97
    for side in (-1,1):
        x=r*side
        tip=(x-.07 if broken and side==1 else x,y,1.85)
        m.rod((x,y,.29),tip,.066,HONEY,surface="wood")
        bead(m,tip,.081,HONEY)
        lantern(m,side*.75,y+.044,1.66)
    frame=[(r*cos(i*tau/48),y,1.85+.49*sin(i*tau/48)) for i in range(25)]
    for a,b in zip(frame,frame[1:]):
        board(m,(a,b,(b[0],y,b[2]-.19),(a[0],y,a[2]-.19)),IVORY)
    m.tube(frame,.057,HONEY,surface="wood")
    m.tube([(x,y,z-.19) for x,_,z in frame],.048,HONEY,surface="wood")
    flag(m,0,y,2.34,broken)
    if not broken:
        for i in range(9):
            x=-.78+i*.173
            z=1.76+.23*(x/.85)**2
            top=((x,y+.01,z),(x+.153,y+.01,z+.012))
            color=BLUE if i%2 else LINEN
            m.part(color,surface="cloth")
            m.sc.tri(*top,(x+.074,y+.018,z-.15),m.color(color))
    for radius, cy, color in ((.275,y+.012,HONEY),(.229,y+.025,LINEN)):
        m.part(color)
        for i in range(24):
            a,b=i*tau/24,(i+1)*tau/24
            m.sc.tri((0,cy,2.013),(radius*cos(a),cy,2.013+radius*sin(a)),
                     (radius*cos(b),cy,2.013+radius*sin(b)),m.color(color))
    sy = y+.033
    board(m,((-.113,sy,2.066),(.080,sy,2.066),(.057,sy,1.987),
             (-.085,sy,1.987)),BRASS)
    m.tube([(.07,sy,2.058),(.116,sy,2.054),(.126,sy,2.026),
            (.098,sy,2.011),(.057,sy,2.015)],.015,BRASS)
    for p,q in (((-.128,1.963),(.102,1.963)),((-.035,2.087),(-.049,2.142)),
                ((.026,2.098),(.013,2.153))):
        m.rod((p[0],sy,p[1]),(q[0],sy,q[1]),.010,BRASS)


def cups(m, phase, broken, seats):
    deck(m,1.34,broken)
    cafe_arch(m,broken)
    for i in range(3):
        a=phase-tau/4+i*tau/3
        x,y,z=polar(.71,a,.30)
        first=m.sc.pid
        m.lathe([(0,z),(.31,z),(.39,z+.032),(.405,z+.061),
                 (.38,z+.089),(0,z+.089)], IVORY,x,y,surface="enamel")
        m.lathe([(.36,z+.036),(.39,z+.036),(.396,z+.062),(.374,z+.073)],
                BLUE,x,y,surface="enamel")
        low=z+.087
        profile=[(0,low),(.201,low),(.257,low+.056),(.305,low+.174),
                 (.332,low+.345),(.302,low+.345),(.27,low+.172),
                 (.212,low+.067),(0,low+.067)]
        m.lathe(profile,LINEN,x,y,surface="enamel")
        m.lathe([(.30,low+.33),(.333,low+.33),(.334,low+.355),(.303,low+.355)],
                IVORY,x,y,surface="enamel")
        m.lathe([(0,low+.074),(.213,low+.074),(.263,low+.17),
                 (.289,low+.30),(.30,low+.322)],BLUE,x,y,surface="enamel")
        if not (broken and i==0):
            handle=[(x+cos(a)*(.268+.145*sin(tau*j/32)),
                     y+sin(a)*(.268+.145*sin(tau*j/32)),
                     low+.185+.118*cos(tau*j/32)) for j in range(17)]
            m.tube(handle,.034,LINEN,surface="enamel")
        for t in (a+tau/4,a+3*tau/4):
            dx,dy,_=polar(.293,t,0)
            sprig(m,(x+dx,y+dy,low+.124),(-sin(t),cos(t)),.17)
        if broken and i==0:
            m.tilt(first,(x,y,z),-.27)
        if i>0:
            seats.append((x,y,low+.09))


def swing(m, phase, broken, seats):
    deck(m,1.30,broken)
    lean=.12 if broken else 0
    m.lathe([(0,.29),(.32,.29),(.322,.42),(.254,.47),(.181,.58),
             (.146,2.54),(.22,2.71),(0,2.71)],IVORY)
    for a in (0,tau/4,tau/2,3*tau/4):
        sprig(m,polar(.164,a,1.39),(-sin(a),cos(a)),.21)
        m.rod(polar(.295,a,.39),polar(.188,a,.68),.029,BLUE)
    canopy(m,1.23,2.76,3.50,lean,broken)
    flag(m,lean,0,3.50,broken)
    for a in (tau*.09,tau*.40):
        lantern(m,*polar(.93,a,2.59))
    for i in range(6):
        a=phase+i*tau/6
        x,y,z=polar(1.35 if not broken else .93,a,1.07)
        hx,hy,hz=polar(.98,a,2.64)
        yaw=a-tau/4
        c,s=cos(yaw),sin(yaw)
        if broken and i in (1,4):
            m.tube([(hx+lean,hy,hz),(hx,hy,hz-.47),
                    (hx+.04,hy+.09,hz-.82),(hx+.14,hy+.14,hz-1.02)],
                   .014,OAK)
            continue
        for side in (-1,1):
            u=side*.132
            dx,dy=u*c-.037*s,u*s+.037*c
            top=(hx+lean+dx,hy+dy,hz)
            end=(x+dx,y+dy,z+.147)
            m.tube([top,end],.013,HONEY,surface="cloth")
            bead(m,top,.023,BRASS,surface="polished")
            bead(m,end,.022,HONEY,surface="polished")
        first=m.sc.pid
        m.box((x-.172,y-.108,z-.032),(x+.172,y+.111,z+.047),HONEY,surface="wood")
        m.box((x-.144,y-.086,z+.039),(x+.144,y+.102,z+.068),BLUE,surface="cloth")
        m.box((x-.17,y-.117,z+.041),(x+.17,y-.071,z+.239),HONEY,surface="wood")
        m.box((x-.134,y-.067,z+.085),(x+.134,y-.044,z+.213),BLUE,surface="cloth")
        for sides in (-1,1):
            sx=x+sides*.146
            m.rod((sx,y-.094,z+.14),(sx,y+.082,z+.14),.021,IVORY)
        m.yaw(first,(x,y),yaw)
        if i%2==0:
            seats.append((x,y,z+.068))


def wheel(m, phase, broken, seats):
    deck(m,1.49,broken)
    hub=(-.11 if broken else 0,-.19,2.64)
    for side in (-1,1):
        for y in (-.48,.40):
            x=side*1.02
            m.box((x-.16,y-.11,.282),(x+.16,y+.115,.415),OAK,surface="wood")
            m.rod((x,y,.407),(hub[0],y,hub[2]),.087,HONEY,surface="wood")
    m.rod((hub[0],-.57,hub[2]),(hub[0],.50,hub[2]),.10,BRASS,
          surface="polished")
    m.rod((hub[0],-.69,hub[2]),(hub[0],-.69,4.14),.065,HONEY,surface="wood")
    flag(m,hub[0],-.69,4.08,broken)

    def rim(a,y):
        return (hub[0]+1.405*cos(a),y,hub[2]-1.405*sin(a)+.125*cos(a)*broken)
    angles=[tau*j/48 for j in (range(4,45) if broken else range(49))]
    for y in (-.37,-.14):
        m.tube([rim(a,y) for a in angles],.050,HONEY,surface="wood")
        for i in range(8):
            if broken and i==1:
                continue
            a=phase+i*tau/8
            m.rod((hub[0],y,hub[2]),rim(a,y),.04,IVORY,surface="wood")
    for i in range(8):
        if broken and i in (2,7):
            continue
        a=phase+i*tau/8
        x,_,z=rim(a,0)
        m.rod((x,-.41,z),(x,.091,z),.034,BRASS,surface="polished")
        bead(m,(x,-.114,z),.057,HONEY,surface="polished")
        m.rod((x,.064,z),(x,.064,z-.098),.023,BRASS)
        m.lathe([(0,z-.504),(.203,z-.504),(.245,z-.466),
                 (.263,z-.351),(.24,z-.32),(0,z-.32)],
                LINEN,x,.061,surface="enamel")
        for t in range(4):
            u,v,_=polar(.223,t*tau/4+tau/8,0)
            m.rod((x+u,.061+v,z-.333),(x+u,.061+v,z-.15),.022,HONEY)
        if not broken or i!=4:
            board(m,((x-.163,.24,z-.326),(x+.163,.24,z-.326),
                     (x+.163,.24,z-.159),(x-.163,.24,z-.159)),GLASS,"glass")
        m.lathe([(0,z-.092),(.158,z-.095),(.212,z-.132),(.27,z-.182),
                 (.266,z-.203),(.207,z-.20),(0,z-.20)],
                BLUE,x,.061,surface="enamel")
        if i%2==0:
            seats.append((x,.073,z-.32))
    for radius,y,color in ((.255,.519,HONEY),(.201,.533,BLUE)):
        m.part(color)
        for i in range(32):
            a,b=i*tau/32,(i+1)*tau/32
            x,_,z=hub
            m.sc.tri((x,y,z),(x+radius*cos(a),y,z+radius*sin(a)),
                     (x+radius*cos(b),y,z+radius*sin(b)),m.color(color))
    for j in range(4):
        a=j*tau/4
        x,y,z=hub[0]+.092*cos(a),.54,hub[2]+.092*sin(a)
        board(m,((x-.034,y,z),(x,y,z+.041),(x+.034,y,z),(x,y,z-.041)),LINEN)


MODELS = {"merry":carousel,"cup":cups,"skyswing":swing,"wheel":wheel}
