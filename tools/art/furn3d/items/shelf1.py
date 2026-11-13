# 本棚（shelf1）：左右の側板・天板・地板・うしろの板・たなの板2まい・本。前・右・左の3つの向き（右は shelf1>1、左は shelf1>2）。
import random
from blueprint import Part as P
from common import *
ID='shelf1';BOTTOM=44
VIEWS=[('shelf1',0),('shelf1>1',1),('shelf1>2',3)]
X0,X1,Y0,Y1=0.02,0.98,0.60,0.90;H=1.16;SD=0.05;TP=0.06;KB=0.08;BK=0.02
def PARTS():
    L=[P('地板','box',(X0+SD,Y0,0,X1-SD,Y1,KB),WOODD,bevel=0,note='地面におく')]
    for nx,x in(('左',X0),('右',X1-SD)):L.append(P('側板（%s）'%nx,'box',(x,Y0,0,x+SD,Y1,H-TP),WOOD2,bevel=0,note='地面にたてる'))
    L.append(P('天板','box',(X0-0.01,Y0-0.01,H-TP,X1+0.01,Y1+0.02,H),WOOD,on=('側板（左）','側板（右）'),bevel=0,note='側板の上'))
    L.append(P('うしろの板','box',(X0+SD,Y0,KB,X1-SD,Y0+BK,H-TP),WOODD,on=('地板',),bevel=0,note='側板のあいだ'))
    n=3;hh=(H-TP-KB)/n;rd=random.Random(5)
    for i in range(n):
        z0=KB+hh*i
        if i:L.append(P('たなの板%d'%i,'box',(X0+SD,Y0+BK,z0-0.03,X1-SD,Y1-0.01,z0),WOOD,on=('側板（左）','側板（右）'),bevel=0,note='側板にのせる'))
        x=X0+SD+0.02
        while True:
            w=rd.uniform(0.055,0.085);h=rd.uniform(0.62,0.82)*(hh-0.04)
            if x+w>X1-SD-0.02:break
            col=rd.choice(BOOKS);on=('地板',) if i==0 else ('たなの板%d'%i,);g='本%d-%.2f'%(i,x);ya,yb=Y0+BK+0.02,Y1-0.06;CV=0.008;SP=0.02
            nm='本（%d段・%.2f）'%(i+1,x)   # 本：背表紙（手前の角を丸める）・左右の表紙・中の紙（表紙より少し低く、上から白が見える）
            L.append(notex(P(nm+'背表紙','prism',(rrect(x,yb-SP,x+w,yb,w*0.35,True),z0,z0+h,'z'),col,on=on,grp=g)))
            for sx in(x,x+w-CV):L.append(notex(P(nm+'表紙','box',(sx,ya,z0,sx+CV,yb-SP,z0+h),col,on=on,bevel=0,grp=g)))
            L.append(notex(P(nm+'中の紙','box',(x+CV,ya,z0,x+w-CV,yb-SP,z0+h-0.012),PAGE,on=on,bevel=0,grp=g)))
            x+=w+rd.choice((0,0,0.005))
    return L
