# 葉っぱの天がいベッド（g_w_bed、特別な家具・木）。もらったデザインの形・色に合わせる。たて（g_w_bed）と横（g_w_bed>1）。
# 設計図（単位はマス。わくは bed.py と同じ：はば0.88・長さ1.02）
#   頭がわの柱2本：まるい柱（半径0.04、高さ0〜1.0、木目）。てっぺんに、どんぐりの形のかざり（玉とぼうし）。
#   足がわの柱2本：まるい柱（高さ0〜0.44）。てっぺんに、どんぐりのかざり。
#   頭の板：頭がわの柱のあいだ（高さ0.18〜0.5、上のふちはまるくもり上がる）。足の板：足がわの柱のあいだ（高さ0.12〜0.36）、まん中に葉の小枝のほりもの。
#   横の板2まい・マットレス：bed.py と同じ（しきシーツはクリーム色、布の織り目）。
#   まくら2こ：クリーム色の布（やわらかい、ふっくら）。まくらのあいだに、白い花（花びら5まい・だいだいのまん中）。
#   かけぶとん：うす緑の布（bed.py の duvet、織り目）。上のふちに、葉の形のふちどり（とがった葉を5まい、ふとんの上にねかせる）。
#   天がい：頭がわの柱のてっぺんをつなぐ横木と、そこから前へのびて、さきがたれる大きな葉7まい（まん中の3まいは前へ、左右の2まいずつは横へたれる）。
import math
import bed as B
from blueprint import Part as P
from common import *
from gfcommon import *
ID='g_w_bed';BOTTOM=64;GRAD=True;STREAK=(0.22,0.1)
VIEWS=[('g_w_bed',0),('g_w_bed>1',1)]
WOODL=(216,168,112);LEAF=(184,180,116);LEAFD=(160,158,98);CREAM=(232,214,184);QG=(190,186,124);FLW=(252,246,236);FLC=(240,170,96)
B.QUILT=QG;B.SHEET=CREAM
X0,X1,Y0,Y1,PS=B.X0,B.X1,B.Y0,B.Y1,B.PS;TZ=1.0;FZ=0.44;R=0.04
def acorn(nm,x,y,z,on):
    a=W(P(nm+'の玉','ball',(x,y,z+0.04,0.045,1.1),WOODL,on=(on,),note='柱のてっぺん'))
    b=W(P(nm+'のぼうし','ball',(x,y,z+0.085,0.05,0.5),(176,124,78),on=(nm+'の玉',),note='玉の上'))
    return [a,b]
def PARTS():
    L=[W(p) if tuple(p.col)==tuple(WOOD) else p for p in B.PARTS() if not p.name.endswith('の柱（左）') and not p.name.endswith('の柱（右）') and p.name not in ('頭の板','足の板')]
    for p in L:
        if tuple(p.col)==tuple(WOOD):p.col=WOODL
        if p.name=='マットレス':FA(p);p.col=CREAM
    for nx,x in(('左',X0+R),('右',X1-R)):
        L.append(W(P('頭の柱（%s）'%nx,'cyl',(x,Y0+R,R,0,TZ),WOODL,detail=16,note='地面にたてる')));L+=acorn('頭の柱（%s）'%nx,x,Y0+R,TZ,'頭の柱（%s）'%nx)
        L.append(W(P('足の柱（%s）'%nx,'cyl',(x,Y1-R,R,0,FZ),WOODL,detail=16,note='地面にたてる')));L+=acorn('足の柱（%s）'%nx,x,Y1-R,FZ,'足の柱（%s）'%nx)
    hb=W(P('頭の板','prism',([(X0+R,0.18),(X1-R,0.18),(X1-R,0.44),((X0+X1)/2+0.2,0.5),((X0+X1)/2,0.52),((X0+X1)/2-0.2,0.5),(X0+R,0.44)],Y0+R-0.02,Y0+R+0.02,'y'),WOODL,on=('頭の柱（左）','頭の柱（右）'),note='頭の柱のあいだ'));L.append(hb)
    fb=W(P('足の板','box',(X0+R,Y1-R-0.02,0.12,X1-R,Y1-R+0.02,0.36),WOODL,bevel=0,on=('足の柱（左）','足の柱（右）'),note='足の柱のあいだ'))
    cx=(X0+X1)/2
    def em(x,y,z):   # 葉の小枝のほりもの
        u=x-cx;v=z-0.24
        if y<Y1-R:return None
        if abs(u)<0.006 and -0.08<v<0.05:return (176,124,78)
        for s in(-1,1):
            if ((u-s*0.035)/0.03)**2+((v+0.0)/0.018)**2<1 or ((u-s*0.03)/0.026)**2+((v-0.045)/0.016)**2<1:return (186,134,84)
        return None
    fb.decal=em;L.append(fb)
    L.append(W(P('天がいの横木','box',(X0+R,Y0+R-0.02,TZ-0.05,X1-R,Y0+R+0.02,TZ-0.01),WOODL,bevel=0,on=('頭の柱（左）','頭の柱（右）'),note='頭の柱のてっぺんをつなぐ')))
    for k,dx in enumerate((-0.18,0.18)):
        p=FA(P('まくら%d'%k,'loft',soft(cx+dx-0.16,Y0+0.1,cx+dx+0.16,Y0+0.32,0.3,0.4,0.05,0.04),CREAM,on=('マットレス',),note='マットレスの頭がわ'));p.soft=True;L.append(p)
    return L
def EXTRA(sc):
    sc.texture(FABT);B.duvet(sc);sc.texture(None)
    cx=(X0+X1)/2
    for k,(x,a) in enumerate([(cx-0.32,-25),(cx-0.16,-10),(cx,0),(cx+0.16,10),(cx+0.32,25)]):   # ふとんの上のふちの、葉のふちどり
        leaf(sc,(x,B.YQ+0.12,B.ZM+B.QT+0.004),(math.sin(math.radians(a)),-1,0),0.16,0.075,QG,LEAFD,curl=0.05)
    fz=0.43;fy=Y0+0.21
    for k in range(5):
        a=math.radians(90+72*k);sc.part();sc.sphere(cx+0.06*math.cos(a),fy+0.06*math.sin(a)*0.8,fz,0.045,FLW,n=10,m=6,zs=0.35)
    sc.part();sc.sphere(cx,fy,fz+0.01,0.03,FLC,n=10,m=6,zs=0.5)
    top=(cx,Y0+R,TZ+0.02)
    for k,(dx,dy,dz,Lk,wk) in enumerate([(0,1,-0.3,0.5,0.2),(-0.55,1,-0.35,0.48,0.19),(0.55,1,-0.35,0.48,0.19),(-1,0.35,-0.9,0.55,0.18),(1,0.35,-0.9,0.55,0.18)]):
        leaf(sc,(top[0]+0.08*dx,top[1]+0.02,top[2]),(dx,dy,dz),Lk,wk,LEAF if k%2==0 else (176,174,110),LEAFD,curl=0.12,droop=0.18)
TONE5=True;TONE3=True   # かげは3だん・あみなし（特別な家具。持ち主がきめた）
