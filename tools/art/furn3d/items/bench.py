# ベンチ（bench、2×1マス）：角を丸めた座板・4本の脚・脚をつなぐ横木。前・右・後ろ・左（右・左はたて向き）。
from blueprint import Part as P
from common import *
ID='bench';BOTTOM=64
VIEWS=[('bench',0),('bench>1',1),('bench>2',2),('bench>3',3)]
X0,X1,Y0,Y1=0.22,1.78,0.45,0.90;ZS=0.30;TS=0.09;LG=0.09;IN=0.10
def PARTS():
    L=[]
    xs=(X0+IN,X1-IN-LG)
    for nx,x in zip('左右',xs):
        for ny,y in(('うしろ',Y0+0.05),('前',Y1-0.05-LG)):L.append(P('脚（%s%s）'%(nx,ny),'box',(x,y,0,x+LG,y+LG,ZS),WOOD2,bevel=0,note='地面にたてる'))
        L.append(P('脚の横木（%s）'%nx,'box',(x+0.01,Y0+0.05+LG,0.08,x+LG-0.01,Y1-0.05-LG,0.13),WOOD2,on=('脚（%sうしろ）'%nx,'脚（%s前）'%nx),bevel=0,note='前とうしろの脚のあいだ'))
    BV=0.03;o=rrect(X0,Y0,X1,Y1,0.08);i_=rrect(X0+BV,Y0+BV,X1-BV,Y1-BV,0.06)
    L.append(P('座板','loft',[(o,ZS),(o,ZS+TS-BV*0.7),(i_,ZS+TS)],WOOD,on=('脚（左うしろ）','脚（右前）'),note='脚の上。角を丸め、上のふちをななめにけずる'))
    return L
