# 食卓（table）：天板・天板の下の幕板（4つの面）・4本の脚。
from blueprint import Part as P
from common import *
ID='table';BOTTOM=43
VIEWS=[('table',0)]
X0,X1,Y0,Y1=-0.03,1.03,0.32,0.84;H=0.46;TT=0.07;LG=0.10;IN=0.05;AP=0.07
def PARTS():
    L=[];xs=(X0+IN,X1-IN-LG);ys=(Y0+IN,Y1-IN-LG)
    for nx,x in zip('左右',xs):
        for ny,y in zip(('うしろ','前'),ys):L.append(P('脚（%s%s）'%(nx,ny),'box',(x,y,0,x+LG,y+LG,H-TT),WOOD,bevel=0,note='地面にたてる'))
    L.append(P('幕板（前）','box',(xs[0]+LG,ys[1]+0.02,H-TT-AP,xs[1],ys[1]+LG-0.02,H-TT),WOOD,on=('脚（左前）','脚（右前）'),bevel=0,note='脚のあいだ'))
    L.append(P('幕板（うしろ）','box',(xs[0]+LG,ys[0]+0.02,H-TT-AP,xs[1],ys[0]+LG-0.02,H-TT),WOOD,on=('脚（左うしろ）','脚（右うしろ）'),bevel=0,note='脚のあいだ'))
    for nx,x in zip('左右',xs):L.append(P('幕板（%s）'%nx,'box',(x+0.02,ys[0]+LG,H-TT-AP,x+LG-0.02,ys[1],H-TT),WOOD,on=('脚（%sうしろ）'%nx,'脚（%s前）'%nx),bevel=0,note='脚のあいだ'))
    import math;RC=0.07;pts=[]   # 天板：上から見た4つの角を丸めた形（半径 RC）
    for cx,cy,a0 in((X1-RC,Y1-RC,0),(X0+RC,Y1-RC,90),(X0+RC,Y0+RC,180),(X1-RC,Y0+RC,270)):
        for k in range(5):a=math.radians(a0+90*k/4);pts.append((cx+RC*math.cos(a),cy+RC*math.sin(a)))
    L.append(P('天板','prism',(pts,H-TT,H,'z'),WOOD,on=('脚（左うしろ）','脚（右前）'),note='脚と幕板の上。角を丸める'))
    return L
